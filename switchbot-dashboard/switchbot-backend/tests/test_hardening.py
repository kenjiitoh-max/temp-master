import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import aiosqlite
import httpx
import pytest
from fastapi import HTTPException

import app.main as main_module
from app.main import (
    MeterDevice,
    MeterReading,
    call_switchbot_api,
    collect_data,
    data_store,
    get_readings_from_db,
    init_database,
    load_devices_from_db,
    run_cleanup,
    save_device_to_db,
    save_reading_to_db,
)


class TestApiKeyAuth:
    @pytest.mark.parametrize(
        "method,path",
        [("get", "/api/backup"), ("post", "/api/meters/refresh"), ("post", "/api/import")],
    )
    def test_missing_key_is_rejected(self, client, method, path):
        response = getattr(client, method)(path)
        assert response.status_code == 401

    @pytest.mark.parametrize(
        "method,path",
        [("get", "/api/backup"), ("post", "/api/meters/refresh"), ("post", "/api/import")],
    )
    def test_wrong_key_is_rejected(self, client, method, path):
        response = getattr(client, method)(path, headers={"X-API-Key": "wrong"})
        assert response.status_code == 401

    def test_unconfigured_key_fails_closed(self, client, api_headers):
        with patch.object(main_module, "API_KEY", ""):
            response = client.get("/api/backup", headers=api_headers)
        assert response.status_code == 503

    def test_read_endpoints_stay_public(self, client):
        for path in ["/healthz", "/api/meters", "/api/status", "/api/latency-stats"]:
            assert client.get(path).status_code == 200, path


class TestBackupSnapshot:
    async def test_backup_returns_consistent_copy_and_removes_temp_file(self, client, api_headers, tmp_path):
        await save_device_to_db(MeterDevice(device_id="d1", device_name="M", device_type="Meter"))
        await save_reading_to_db(
            "d1", MeterReading(timestamp=datetime.now(timezone.utc), temperature=21.5, humidity=None)
        )

        created = []
        real_mkstemp = main_module.tempfile.mkstemp

        def tracking_mkstemp(*args, **kwargs):
            fd, path = real_mkstemp(*args, **kwargs)
            created.append(path)
            return fd, path

        with patch.object(main_module.tempfile, "mkstemp", side_effect=tracking_mkstemp):
            response = client.get("/api/backup", headers=api_headers)

        assert response.status_code == 200
        assert "switchbot_backup_" in response.headers["content-disposition"]
        assert len(created) == 1
        assert not os.path.exists(created[0])

        backup_path = tmp_path / "downloaded.db"
        backup_path.write_bytes(response.content)
        with sqlite3.connect(backup_path) as conn:
            assert conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
            assert conn.execute("SELECT device_id, device_name FROM devices").fetchall() == [("d1", "M")]
            assert conn.execute("SELECT device_id, temperature, humidity FROM readings").fetchall() == [
                ("d1", 21.5, None)
            ]

    async def test_unsatisfiable_range_still_removes_temp_file(self, client, api_headers):
        created = []
        real_mkstemp = main_module.tempfile.mkstemp

        def tracking_mkstemp(*args, **kwargs):
            fd, path = real_mkstemp(*args, **kwargs)
            created.append(path)
            return fd, path

        with patch.object(main_module.tempfile, "mkstemp", side_effect=tracking_mkstemp):
            response = client.get("/api/backup", headers={**api_headers, "Range": "bytes=999999999-"})

        assert response.status_code == 416
        assert len(created) == 1
        assert not os.path.exists(created[0])

    def test_backup_missing_db_returns_404(self, client, api_headers, tmp_path):
        with patch.object(main_module, "DB_PATH", str(tmp_path / "missing.db")):
            response = client.get("/api/backup", headers=api_headers)
        assert response.status_code == 404


class TestCors:
    def test_unlisted_origin_gets_no_cors_header(self, client):
        response = client.get("/api/meters", headers={"Origin": "https://evil.example"})
        assert "access-control-allow-origin" not in response.headers


def _response(status_code, text="error"):
    response = MagicMock()
    response.status_code = status_code
    response.text = text
    return response


class TestBackoffOnAllFailures:
    @pytest.mark.parametrize("status_code", [500, 502, 503, 401])
    async def test_http_errors_start_backoff(self, reset_data_store, mock_switchbot_credentials, status_code):
        with patch("app.main.get_http_client") as mock_client:
            mock_client.return_value.get = AsyncMock(return_value=_response(status_code))
            with pytest.raises(HTTPException):
                await call_switchbot_api("/devices")
        assert data_store.consecutive_errors == 1
        assert data_store.backoff_until > time.time()

    @pytest.mark.parametrize(
        "error", [httpx.ReadTimeout("timed out"), httpx.ConnectError("refused")]
    )
    async def test_timeouts_and_connection_errors_start_backoff(
        self, reset_data_store, mock_switchbot_credentials, error
    ):
        with patch("app.main.get_http_client") as mock_client:
            mock_client.return_value.get = AsyncMock(side_effect=error)
            with pytest.raises(HTTPException):
                await call_switchbot_api("/devices")
        assert data_store.consecutive_errors == 1
        assert data_store.backoff_until > time.time()

    async def test_success_resets_counter(self, reset_data_store, mock_switchbot_credentials):
        data_store.consecutive_errors = 3
        ok = _response(200)
        ok.json.return_value = {"statusCode": 100, "body": {}}
        with patch("app.main.get_http_client") as mock_client:
            mock_client.return_value.get = AsyncMock(return_value=ok)
            await call_switchbot_api("/devices")
        assert data_store.consecutive_errors == 0


class TestCollectDataHardening:
    async def test_unexpected_error_is_logged(self, reset_data_store, mock_switchbot_credentials, caplog):
        main_module.logger.propagate = True
        try:
            with patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch:
                mock_fetch.side_effect = RuntimeError("boom")
                await collect_data()
        finally:
            main_module.logger.propagate = False
        assert "Unexpected error while fetching SwitchBot device list" in caplog.text
        assert "boom" in caplog.text

    async def test_removed_devices_are_dropped(self, reset_data_store, mock_switchbot_credentials):
        for device_id in ["keep", "gone"]:
            device = MeterDevice(device_id=device_id, device_name=device_id, device_type="Meter")
            data_store.devices[device_id] = device
            await save_device_to_db(device)

        with patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch, \
             patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_status:
            mock_fetch.return_value = [MeterDevice(device_id="keep", device_name="keep", device_type="Meter")]
            mock_status.return_value = {"temperature": 20.0, "humidity": 50, "battery": 90}
            await collect_data()

        assert set(data_store.devices) == {"keep"}
        data_store.devices = {}
        await load_devices_from_db()
        assert set(data_store.devices) == {"keep"}

    async def test_failing_device_does_not_starve_healthy_ones(self, reset_data_store, mock_switchbot_credentials):
        devices = [MeterDevice(device_id=d, device_name=d, device_type="Meter") for d in ["broken", "healthy"]]
        collected = []

        async def status(device_id):
            if device_id == "broken":
                main_module.register_api_failure()
                raise HTTPException(status_code=500, detail="boom")
            if time.time() < data_store.backoff_until:
                raise HTTPException(status_code=429, detail="backing off")
            collected.append(device_id)
            return {"temperature": 20.0, "humidity": 50}

        with patch("app.main.fetch_devices", new_callable=AsyncMock, return_value=devices), \
             patch("app.main.fetch_device_status", side_effect=status):
            await collect_data()
            assert collected == []
            data_store.backoff_until = 0
            await collect_data()

        assert collected == ["healthy"]
        assert data_store.device_failures == {"broken": 2}

    async def test_device_list_is_cached_between_cycles(self, reset_data_store, mock_switchbot_credentials):
        with patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch, \
             patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_status:
            mock_fetch.return_value = [MeterDevice(device_id="d1", device_name="d1", device_type="Meter")]
            mock_status.return_value = {"temperature": 20.0, "humidity": 50}
            await collect_data()
            await collect_data()
            assert mock_fetch.await_count == 1
            await collect_data(force_device_refresh=True)
            assert mock_fetch.await_count == 2

    async def test_missing_humidity_is_stored_as_null(self, reset_data_store, mock_switchbot_credentials):
        with patch("app.main.fetch_devices", new_callable=AsyncMock) as mock_fetch, \
             patch("app.main.fetch_device_status", new_callable=AsyncMock) as mock_status:
            mock_fetch.return_value = [MeterDevice(device_id="d1", device_name="d1", device_type="Meter")]
            mock_status.return_value = {"temperature": 20.0, "humidity": None}
            await collect_data()

        async with aiosqlite.connect(main_module.DB_PATH) as db:
            async with db.execute("SELECT humidity FROM readings WHERE device_id = 'd1'") as cursor:
                rows = await cursor.fetchall()
        assert rows == [(None,)]


class TestHumidityMigration:
    async def test_not_null_humidity_column_is_migrated(self, tmp_path):
        db_path = str(tmp_path / "old.db")
        conn = sqlite3.connect(db_path)
        conn.executescript("""
            CREATE TABLE readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                temperature REAL NOT NULL,
                humidity INTEGER NOT NULL,
                battery INTEGER
            );
            INSERT INTO readings (device_id, timestamp, temperature, humidity, battery)
                VALUES ('d1', '2026-01-01T00:00:00+00:00', 20.5, 55, 90);
        """)
        conn.commit()
        conn.close()

        with patch.object(main_module, "DB_PATH", db_path):
            await init_database()
            await init_database()
            await save_reading_to_db(
                "d1", MeterReading(timestamp=datetime.now(timezone.utc), temperature=21.0, humidity=None)
            )
            readings = await get_readings_from_db("d1", 0)

        assert [r.humidity for r in readings] == [55, None]
        conn = sqlite3.connect(db_path)
        notnull = {row[1]: row[3] for row in conn.execute("PRAGMA table_info(readings)")}
        indexes = {row[1] for row in conn.execute("PRAGMA index_list(readings)")}
        conn.close()
        assert notnull["humidity"] == 0
        assert "idx_readings_device_timestamp" in indexes


class TestCleanup:
    async def test_run_cleanup_removes_old_rows(self, reset_data_store):
        old = datetime.now(timezone.utc) - timedelta(days=400)
        await save_reading_to_db("d1", MeterReading(timestamp=old, temperature=1.0, humidity=1))
        await save_reading_to_db(
            "d1", MeterReading(timestamp=datetime.now(timezone.utc), temperature=2.0, humidity=2)
        )
        await run_cleanup()
        readings = await get_readings_from_db("d1", 0)
        assert [r.temperature for r in readings] == [2.0]
