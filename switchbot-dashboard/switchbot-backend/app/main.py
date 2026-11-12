import asyncio
import base64
import hashlib
import hmac
import logging
import os
import secrets
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import aiosqlite
import httpx
from dotenv import load_dotenv
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from starlette.background import BackgroundTask

load_dotenv()

logger = logging.getLogger("temp_master")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())
    logger.propagate = False

# Database path - use /data/app.db for persistent volume in production
DB_PATH = os.getenv("DB_PATH", "/data/app.db" if os.path.exists("/data") else "app.db")

SWITCHBOT_API_BASE = "https://api.switch-bot.com/v1.1"
SWITCHBOT_TOKEN = os.getenv("SWITCHBOT_TOKEN", "")
SWITCHBOT_SECRET = os.getenv("SWITCHBOT_SECRET", "")

# Shared secret required (as the X-API-Key header) by write/sensitive endpoints.
API_KEY = os.getenv("API_KEY", "")

# Comma-separated list of origins allowed to call the API cross-origin.
# The bundled frontend is served from the same origin, so this can stay empty.
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

DATA_COLLECTION_INTERVAL = 120
DEVICE_LIST_REFRESH_INTERVAL = 1800
CLEANUP_INTERVAL = 86400
RATE_LIMIT_BACKOFF_BASE = 60
MAX_BACKOFF = 600
HTTP_TIMEOUT = httpx.Timeout(10.0, connect=5.0)

METER_DEVICE_TYPES = ["Meter", "MeterPlus", "WoIOSensor", "Meter Plus (JP)", "Meter Pro", "Meter Pro CO2", "Hub 2"]


class TimeScale(str, Enum):
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


class MeterReading(BaseModel):
    timestamp: datetime
    temperature: float
    humidity: Optional[int] = None
    battery: Optional[int] = None


class MeterDevice(BaseModel):
    device_id: str
    device_name: str
    device_type: str
    hub_device_id: Optional[str] = None
    current_temperature: Optional[float] = None
    current_humidity: Optional[int] = None
    battery: Optional[int] = None
    last_updated: Optional[datetime] = None


class LatencyLog(BaseModel):
    id: Optional[int] = None
    endpoint: str
    device_id: Optional[str] = None
    timestamp: datetime
    latency_ms: float
    status_code: int
    success: bool
    error_message: Optional[str] = None


class DataStore:
    def __init__(self):
        self.devices: dict[str, MeterDevice] = {}
        self.last_api_call: float = 0
        self.last_device_sync: float = 0
        self.backoff_until: float = 0
        self.consecutive_errors: int = 0
        self.device_failures: dict[str, int] = {}
        self.is_collecting: bool = False
        self.collection_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.db_initialized: bool = False


data_store = DataStore()


async def init_database():
    """Initialize SQLite database with required tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                device_name TEXT NOT NULL,
                device_type TEXT NOT NULL,
                hub_device_id TEXT,
                current_temperature REAL,
                current_humidity INTEGER,
                battery INTEGER,
                last_updated TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity INTEGER,
                battery INTEGER,
                FOREIGN KEY (device_id) REFERENCES devices(device_id)
            )
        """)
        await migrate_readings_humidity_nullable(db)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_readings_device_timestamp 
            ON readings(device_id, timestamp)
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS latency_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint TEXT NOT NULL,
                device_id TEXT,
                timestamp TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                status_code INTEGER NOT NULL,
                success INTEGER NOT NULL,
                error_message TEXT
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_latency_logs_timestamp 
            ON latency_logs(timestamp)
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_latency_logs_endpoint 
            ON latency_logs(endpoint)
        """)
        await db.commit()
    data_store.db_initialized = True


async def migrate_readings_humidity_nullable(db: aiosqlite.Connection):
    """Older databases declared readings.humidity NOT NULL; rebuild the table so it accepts NULL."""
    async with db.execute("PRAGMA table_info(readings)") as cursor:
        columns = await cursor.fetchall()
    humidity = next((c for c in columns if c[1] == "humidity"), None)
    if humidity is None or not humidity[3]:
        return
    logger.info("Migrating readings table: making humidity nullable")
    await db.commit()
    await db.executescript("""
        BEGIN;
        CREATE TABLE readings_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            temperature REAL NOT NULL,
            humidity INTEGER,
            battery INTEGER,
            FOREIGN KEY (device_id) REFERENCES devices(device_id)
        );
        INSERT INTO readings_new (id, device_id, timestamp, temperature, humidity, battery)
            SELECT id, device_id, timestamp, temperature, humidity, battery FROM readings;
        DROP TABLE readings;
        ALTER TABLE readings_new RENAME TO readings;
        COMMIT;
    """)


async def load_devices_from_db():
    """Load devices from database into memory cache."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM devices") as cursor:
            async for row in cursor:
                device = MeterDevice(
                    device_id=row["device_id"],
                    device_name=row["device_name"],
                    device_type=row["device_type"],
                    hub_device_id=row["hub_device_id"],
                    current_temperature=row["current_temperature"],
                    current_humidity=row["current_humidity"],
                    battery=row["battery"],
                    last_updated=datetime.fromisoformat(row["last_updated"]) if row["last_updated"] else None,
                )
                data_store.devices[device.device_id] = device


def _device_row(device: MeterDevice) -> tuple:
    return (
        device.device_id,
        device.device_name,
        device.device_type,
        device.hub_device_id,
        device.current_temperature,
        device.current_humidity,
        device.battery,
        device.last_updated.isoformat() if device.last_updated else None,
    )


def _reading_row(device_id: str, reading: MeterReading) -> tuple:
    return (
        device_id,
        reading.timestamp.isoformat(),
        reading.temperature,
        reading.humidity,
        reading.battery,
    )


UPSERT_DEVICE_SQL = """
    INSERT OR REPLACE INTO devices 
    (device_id, device_name, device_type, hub_device_id, current_temperature, current_humidity, battery, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

INSERT_READING_SQL = """
    INSERT INTO readings (device_id, timestamp, temperature, humidity, battery)
    VALUES (?, ?, ?, ?, ?)
"""


async def save_device_to_db(device: MeterDevice):
    """Save or update a device in the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(UPSERT_DEVICE_SQL, _device_row(device))
        await db.commit()


async def save_reading_to_db(device_id: str, reading: MeterReading):
    """Save a reading to the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(INSERT_READING_SQL, _reading_row(device_id, reading))
        await db.commit()


async def save_device_with_readings(device: MeterDevice, readings: list[MeterReading]):
    """Upsert a device and insert its readings using one connection and one transaction."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(UPSERT_DEVICE_SQL, _device_row(device))
        if readings:
            await db.executemany(
                INSERT_READING_SQL,
                [_reading_row(device.device_id, r) for r in readings],
            )
        await db.commit()


async def delete_devices_from_db(device_ids: list[str]):
    """Remove devices (but keep their readings) from the devices table."""
    if not device_ids:
        return
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executemany("DELETE FROM devices WHERE device_id = ?", [(d,) for d in device_ids])
        await db.commit()


async def get_readings_from_db(device_id: str, cutoff_timestamp: float) -> list[MeterReading]:
    """Get readings from database after a cutoff timestamp."""
    cutoff_dt = datetime.fromtimestamp(cutoff_timestamp, tz=timezone.utc)
    readings = []
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT * FROM readings 
            WHERE device_id = ? AND timestamp >= ?
            ORDER BY timestamp ASC
        """, (device_id, cutoff_dt.isoformat())) as cursor:
            async for row in cursor:
                reading = MeterReading(
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    temperature=row["temperature"],
                    humidity=row["humidity"],
                    battery=row["battery"],
                )
                readings.append(reading)
    return readings


async def cleanup_old_readings():
    """Remove readings older than 1 year to prevent database bloat."""
    cutoff = datetime.now(timezone.utc).timestamp() - 31536000  # 1 year
    cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM readings WHERE timestamp < ?", (cutoff_dt.isoformat(),))
        await db.commit()


async def save_latency_log(
    endpoint: str,
    latency_ms: float,
    status_code: int,
    success: bool,
    device_id: Optional[str] = None,
    error_message: Optional[str] = None,
):
    """Save a latency log entry to the database."""
    timestamp = datetime.now(timezone.utc)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO latency_logs (endpoint, device_id, timestamp, latency_ms, status_code, success, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            endpoint,
            device_id,
            timestamp.isoformat(),
            latency_ms,
            status_code,
            1 if success else 0,
            error_message,
        ))
        await db.commit()


async def get_latency_logs(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    endpoint: Optional[str] = None,
    device_id: Optional[str] = None,
    limit: int = 100,
) -> list[LatencyLog]:
    """Get latency logs from the database with optional filters."""
    logs = []
    query = "SELECT * FROM latency_logs WHERE 1=1"
    params: list = []
    
    if start_time:
        query += " AND timestamp >= ?"
        params.append(start_time.isoformat())
    if end_time:
        query += " AND timestamp <= ?"
        params.append(end_time.isoformat())
    if endpoint:
        query += " AND endpoint = ?"
        params.append(endpoint)
    if device_id:
        query += " AND device_id = ?"
        params.append(device_id)
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            async for row in cursor:
                log = LatencyLog(
                    id=row["id"],
                    endpoint=row["endpoint"],
                    device_id=row["device_id"],
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    latency_ms=row["latency_ms"],
                    status_code=row["status_code"],
                    success=bool(row["success"]),
                    error_message=row["error_message"],
                )
                logs.append(log)
    return logs


async def get_latency_stats(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
) -> dict:
    """Get aggregated latency statistics."""
    query = """
        SELECT 
            COUNT(*) as total_calls,
            AVG(latency_ms) as avg_latency,
            MIN(latency_ms) as min_latency,
            MAX(latency_ms) as max_latency,
            SUM(success) as successful_calls
        FROM latency_logs WHERE 1=1
    """
    params: list = []
    
    if start_time:
        query += " AND timestamp >= ?"
        params.append(start_time.isoformat())
    if end_time:
        query += " AND timestamp <= ?"
        params.append(end_time.isoformat())
    
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            row = await cursor.fetchone()
            if row:
                total_calls = row["total_calls"] or 0
                successful_calls = row["successful_calls"] or 0
                return {
                    "total_calls": total_calls,
                    "avg_latency_ms": row["avg_latency"],
                    "min_latency_ms": row["min_latency"],
                    "max_latency_ms": row["max_latency"],
                    "successful_calls": successful_calls,
                    "failed_calls": total_calls - successful_calls,
                    "success_rate": (successful_calls / total_calls * 100) if total_calls > 0 else 0,
                }
    return {
        "total_calls": 0,
        "avg_latency_ms": None,
        "min_latency_ms": None,
        "max_latency_ms": None,
        "successful_calls": 0,
        "failed_calls": 0,
        "success_rate": 0,
    }


async def cleanup_old_latency_logs():
    """Remove latency logs older than 30 days to prevent database bloat."""
    cutoff = datetime.now(timezone.utc).timestamp() - 2592000  # 30 days
    cutoff_dt = datetime.fromtimestamp(cutoff, tz=timezone.utc)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM latency_logs WHERE timestamp < ?", (cutoff_dt.isoformat(),))
        await db.commit()


def generate_switchbot_headers() -> dict:
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        return {}
    
    nonce = str(uuid.uuid4())
    t = int(round(time.time() * 1000))
    string_to_sign = f"{SWITCHBOT_TOKEN}{t}{nonce}"
    
    string_to_sign_bytes = bytes(string_to_sign, "utf-8")
    secret_bytes = bytes(SWITCHBOT_SECRET, "utf-8")
    
    sign = base64.b64encode(
        hmac.new(secret_bytes, msg=string_to_sign_bytes, digestmod=hashlib.sha256).digest()
    )
    
    return {
        "Authorization": SWITCHBOT_TOKEN,
        "Content-Type": "application/json",
        "charset": "utf8",
        "t": str(t),
        "sign": str(sign, "utf-8"),
        "nonce": nonce,
    }


def get_http_client() -> httpx.AsyncClient:
    """Return the shared HTTP client created in lifespan (created lazily if lifespan didn't run)."""
    client = getattr(app.state, "http_client", None)
    if client is None or client.is_closed:
        client = httpx.AsyncClient(timeout=HTTP_TIMEOUT)
        app.state.http_client = client
    return client


def register_api_failure() -> int:
    """Count a failed SwitchBot call and start an exponential backoff. Returns the backoff in seconds."""
    data_store.consecutive_errors += 1
    backoff_time = min(
        RATE_LIMIT_BACKOFF_BASE * (2 ** data_store.consecutive_errors),
        MAX_BACKOFF,
    )
    data_store.backoff_until = time.time() + backoff_time
    return backoff_time


async def call_switchbot_api(endpoint: str, device_id: Optional[str] = None) -> dict:
    if time.time() < data_store.backoff_until:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limited. Retry after {int(data_store.backoff_until - time.time())} seconds",
        )
    
    headers = generate_switchbot_headers()
    if not headers:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")
    
    start_time = time.perf_counter()
    client = get_http_client()
    try:
        response = await client.get(f"{SWITCHBOT_API_BASE}{endpoint}", headers=headers)
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        data_store.last_api_call = time.time()
        
        if response.status_code == 429:
            backoff_time = register_api_failure()
            await save_latency_log(
                endpoint=endpoint,
                latency_ms=latency_ms,
                status_code=429,
                success=False,
                device_id=device_id,
                error_message=f"Rate limited. Backing off for {backoff_time} seconds",
            )
            raise HTTPException(
                status_code=429,
                detail=f"Rate limited by SwitchBot API. Backing off for {backoff_time} seconds",
            )
        
        if response.status_code != 200:
            backoff_time = register_api_failure()
            await save_latency_log(
                endpoint=endpoint,
                latency_ms=latency_ms,
                status_code=response.status_code,
                success=False,
                device_id=device_id,
                error_message=f"SwitchBot API error: {response.text} (backing off for {backoff_time} seconds)",
            )
            raise HTTPException(
                status_code=response.status_code,
                detail=f"SwitchBot API error: {response.text}",
            )
        
        await save_latency_log(
            endpoint=endpoint,
            latency_ms=latency_ms,
            status_code=200,
            success=True,
            device_id=device_id,
        )
        data_store.consecutive_errors = 0
        return response.json()
        
    except httpx.RequestError as e:
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        data_store.last_api_call = time.time()
        backoff_time = register_api_failure()
        await save_latency_log(
            endpoint=endpoint,
            latency_ms=latency_ms,
            status_code=500,
            success=False,
            device_id=device_id,
            error_message=f"Request error: {e!r} (backing off for {backoff_time} seconds)",
        )
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")


async def fetch_devices() -> list[MeterDevice]:
    response = await call_switchbot_api("/devices")
    
    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )
    
    devices = []
    device_list = response.get("body", {}).get("deviceList", [])
    
    for device in device_list:
        device_type = device.get("deviceType", "")
        if device_type in METER_DEVICE_TYPES:
            meter = MeterDevice(
                device_id=device.get("deviceId", ""),
                device_name=device.get("deviceName", "Unknown"),
                device_type=device_type,
                hub_device_id=device.get("hubDeviceId"),
            )
            devices.append(meter)
    
    return devices


async def fetch_device_status(device_id: str) -> dict:
    response = await call_switchbot_api(f"/devices/{device_id}/status", device_id=device_id)
    
    if response.get("statusCode") != 100:
        raise HTTPException(
            status_code=500,
            detail=f"SwitchBot API returned error: {response.get('message', 'Unknown error')}",
        )
    
    return response.get("body", {})


async def sync_device_list(force: bool = False):
    """Re-fetch the device list periodically and drop devices that were removed on the SwitchBot side."""
    if not force and data_store.last_device_sync and \
            time.time() - data_store.last_device_sync < DEVICE_LIST_REFRESH_INTERVAL:
        return

    devices = await fetch_devices()
    fetched_ids = {device.device_id for device in devices}

    for device in devices:
        if device.device_id not in data_store.devices:
            data_store.devices[device.device_id] = device
        else:
            data_store.devices[device.device_id].device_name = device.device_name
            data_store.devices[device.device_id].device_type = device.device_type

    removed = [device_id for device_id in data_store.devices if device_id not in fetched_ids]
    for device_id in removed:
        del data_store.devices[device_id]
    if removed:
        logger.info("Removed %d device(s) no longer present in SwitchBot: %s", len(removed), removed)
        await delete_devices_from_db(removed)

    data_store.last_device_sync = time.time()


async def collect_data(force_device_refresh: bool = False):
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        return
    
    try:
        await sync_device_list(force=force_device_refresh)
    except HTTPException as e:
        logger.warning("Failed to fetch SwitchBot device list (%s): %s", e.status_code, e.detail)
        return
    except Exception:
        logger.exception("Unexpected error while fetching SwitchBot device list")
        return

    # Devices that failed recently go last, so a broken device that triggers the global
    # backoff does not keep the healthy ones from being collected.
    device_ids = sorted(data_store.devices, key=lambda d: data_store.device_failures.get(d, 0))
    for device_id in device_ids:
        try:
            status = await fetch_device_status(device_id)
            
            temperature = status.get("temperature")
            humidity = status.get("humidity")
            battery = status.get("battery")
            
            if temperature is None:
                continue

            now = datetime.now(timezone.utc)
            device = data_store.devices[device_id]
            device.current_temperature = temperature
            device.current_humidity = humidity
            device.battery = battery
            device.last_updated = now
            
            reading = MeterReading(
                timestamp=now,
                temperature=temperature,
                humidity=humidity,
                battery=battery,
            )
            await save_device_with_readings(device, [reading])
            data_store.device_failures.pop(device_id, None)
                    
        except HTTPException as e:
            logger.warning("Failed to fetch status for %s (%s): %s", device_id, e.status_code, e.detail)
            if e.status_code == 429:
                break
            data_store.device_failures[device_id] = data_store.device_failures.get(device_id, 0) + 1
        except Exception:
            logger.exception("Unexpected error while collecting data for %s", device_id)
            data_store.device_failures[device_id] = data_store.device_failures.get(device_id, 0) + 1


async def background_collector():
    while True:
        try:
            await collect_data()
        except Exception:
            logger.exception("Background collection cycle failed")
        await asyncio.sleep(DATA_COLLECTION_INTERVAL)


async def run_cleanup():
    try:
        await cleanup_old_readings()
        await cleanup_old_latency_logs()
        logger.info("Old readings and latency logs cleaned up")
    except Exception:
        logger.exception("Database cleanup failed")


async def periodic_cleanup():
    while True:
        await run_cleanup()
        await asyncio.sleep(CLEANUP_INTERVAL)


async def _cancel_task(task: Optional[asyncio.Task]):
    if task is None:
        return
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not API_KEY:
        logger.warning(
            "API_KEY is not set: protected endpoints (/api/import, /api/backup, /api/meters/refresh) "
            "will reject every request with 503 until it is configured."
        )

    app.state.http_client = httpx.AsyncClient(timeout=HTTP_TIMEOUT)

    await init_database()
    await load_devices_from_db()
    
    data_store.cleanup_task = asyncio.create_task(periodic_cleanup())
    if SWITCHBOT_TOKEN and SWITCHBOT_SECRET:
        data_store.collection_task = asyncio.create_task(background_collector())
    yield
    await _cancel_task(data_store.collection_task)
    await _cancel_task(data_store.cleanup_task)
    await app.state.http_client.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(api_key: Optional[str] = Security(api_key_header)):
    """Dependency for write/sensitive endpoints: the X-API-Key header must match API_KEY."""
    if not API_KEY:
        raise HTTPException(status_code=503, detail="API key is not configured on the server")
    if not api_key or not secrets.compare_digest(api_key.encode(), API_KEY.encode()):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/meters")
async def get_meters():
    meters = list(data_store.devices.values())
    return {
        "meters": [meter.model_dump() for meter in meters],
        "last_updated": max(
            (m.last_updated for m in meters if m.last_updated),
            default=None,
        ),
    }


@app.get("/api/meters/{device_id}/history")
async def get_meter_history(device_id: str, time_scale: TimeScale = TimeScale.HOUR):
    if device_id not in data_store.devices:
        raise HTTPException(status_code=404, detail="Device not found")
    
    now = datetime.now(timezone.utc)
    
    if time_scale == TimeScale.HOUR:
        cutoff = now.timestamp() - 3600
    elif time_scale == TimeScale.DAY:
        cutoff = now.timestamp() - 86400
    elif time_scale == TimeScale.WEEK:
        cutoff = now.timestamp() - 604800
    elif time_scale == TimeScale.MONTH:
        cutoff = now.timestamp() - 2592000
    else:
        cutoff = now.timestamp() - 31536000
    
    # Read from database for persistent history
    filtered_history = await get_readings_from_db(device_id, cutoff)
    
    return {
        "device_id": device_id,
        "time_scale": time_scale,
        "history": [reading.model_dump() for reading in filtered_history],
        "device": data_store.devices.get(device_id).model_dump() if device_id in data_store.devices else None,
    }


@app.post("/api/meters/refresh", dependencies=[Depends(require_api_key)])
async def refresh_meters():
    if not SWITCHBOT_TOKEN or not SWITCHBOT_SECRET:
        raise HTTPException(status_code=500, detail="SwitchBot credentials not configured")
    
    await collect_data(force_device_refresh=True)
    
    return {
        "status": "ok",
        "message": "Data collection triggered",
        "meters_count": len(data_store.devices),
    }


@app.get("/api/status")
async def get_status():
    return {
        "configured": bool(SWITCHBOT_TOKEN and SWITCHBOT_SECRET),
        "meters_count": len(data_store.devices),
        "is_rate_limited": time.time() < data_store.backoff_until,
        "backoff_remaining": max(0, int(data_store.backoff_until - time.time())),
        "last_api_call": data_store.last_api_call,
        "collection_interval": DATA_COLLECTION_INTERVAL,
    }


@app.get("/api/latency-logs")
async def get_latency_logs_endpoint(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    endpoint: Optional[str] = None,
    device_id: Optional[str] = None,
    limit: int = 100,
):
    """Get latency logs for API calls with optional filters."""
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else None
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None
    
    logs = await get_latency_logs(
        start_time=start_dt,
        end_time=end_dt,
        endpoint=endpoint,
        device_id=device_id,
        limit=limit,
    )
    
    return {
        "logs": [log.model_dump() for log in logs],
        "count": len(logs),
    }


@app.get("/api/latency-stats")
async def get_latency_stats_endpoint(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
):
    """Get aggregated latency statistics."""
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00')) if start_time else None
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else None
    
    stats = await get_latency_stats(start_time=start_dt, end_time=end_dt)
    return stats


class ImportReadingData(BaseModel):
    timestamp: str
    temperature: float
    humidity: Optional[int] = None
    battery: Optional[int] = None


class ImportDeviceData(BaseModel):
    device_id: str
    device_name: str
    device_type: str
    hub_device_id: Optional[str] = None
    current_temperature: Optional[float] = None
    current_humidity: Optional[int] = None
    battery: Optional[int] = None
    last_updated: Optional[str] = None
    readings: list[ImportReadingData] = []


class ImportData(BaseModel):
    devices: list[ImportDeviceData]


@app.post("/api/import", dependencies=[Depends(require_api_key)])
async def import_data(data: ImportData):
    """Import historical data from another backend instance."""
    devices: list[MeterDevice] = []
    readings: list[tuple] = []

    for device_data in data.devices:
        device = MeterDevice(
            device_id=device_data.device_id,
            device_name=device_data.device_name,
            device_type=device_data.device_type,
            hub_device_id=device_data.hub_device_id,
            current_temperature=device_data.current_temperature,
            current_humidity=device_data.current_humidity,
            battery=device_data.battery,
            last_updated=datetime.fromisoformat(device_data.last_updated.replace('Z', '+00:00')) if device_data.last_updated else None,
        )
        devices.append(device)
        for reading_data in device_data.readings:
            reading = MeterReading(
                timestamp=datetime.fromisoformat(reading_data.timestamp.replace('Z', '+00:00')),
                temperature=reading_data.temperature,
                humidity=reading_data.humidity,
                battery=reading_data.battery,
            )
            readings.append(_reading_row(device.device_id, reading))

    async with aiosqlite.connect(DB_PATH) as db:
        await db.executemany(UPSERT_DEVICE_SQL, [_device_row(d) for d in devices])
        await db.executemany(INSERT_READING_SQL, readings)
        await db.commit()

    for device in devices:
        data_store.devices[device.device_id] = device
    
    return {
        "status": "ok",
        "imported_devices": len(devices),
        "imported_readings": len(readings),
    }


def _remove_file(path: str):
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


@app.get("/api/backup", dependencies=[Depends(require_api_key)])
async def backup_database():
    """Download a consistent snapshot of the SQLite database (taken with VACUUM INTO)."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=404, detail="Database file not found")
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"switchbot_backup_{timestamp}.db"

    fd, snapshot_path = tempfile.mkstemp(prefix="switchbot_backup_", suffix=".db")
    os.close(fd)
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("VACUUM INTO ?", (snapshot_path,))
    except Exception:
        _remove_file(snapshot_path)
        logger.exception("Failed to create database snapshot")
        raise HTTPException(status_code=500, detail="Failed to create database backup")
    
    return FileResponse(
        path=snapshot_path,
        filename=filename,
        media_type="application/x-sqlite3",
        background=BackgroundTask(_remove_file, snapshot_path),
    )


# Serve frontend static files if the static directory exists.
# Layout under static/:
#   index.html              -> frontend served at "/"
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.is_dir():
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Serve the frontend at root."""
        file_path = (STATIC_DIR / full_path).resolve()
        if not file_path.is_relative_to(STATIC_DIR.resolve()):
            return FileResponse(STATIC_DIR / "index.html")
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
