"""Seed synthetic meter data via the /api/import endpoint (no SwitchBot creds needed)."""
import json
import math
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = "http://localhost:8000"

# Use names present in DISPLAY_NAMES so getDisplayName mapping is exercised,
# plus one unmapped name to confirm the fallback path.
DEVICES = [
    ("D001", "Bedroom Meter", "Meter"),      # -> 第1蒸留塔 (T-101)
    ("D002", "Living Meter", "MeterPlus"),    # -> 第2蒸留塔 (T-102)
    ("D003", "アワコ", "WoIOSensor"),          # -> 冷却塔 (CT-401)
    ("D004", "Unmapped Sensor", "Meter Pro"), # -> fallback (shown as-is)
]

now = datetime.now(timezone.utc)


def gen_readings(seed):
    readings = []
    # Every 5 min for the last 2 hours (covers hour + day)
    for i in range(24):
        ts = now - timedelta(minutes=5 * i)
        temp = 22 + 4 * math.sin(i / 3.0 + seed) + seed
        readings.append((ts, round(temp, 1), 40 + (i % 10)))
    # Hourly for the last 30 days (covers day/week/month)
    for i in range(1, 24 * 30):
        ts = now - timedelta(hours=i)
        temp = 21 + 5 * math.sin(i / 12.0 + seed) + seed
        readings.append((ts, round(temp, 1), 40 + (i % 15)))
    # Daily for the last year (covers year)
    for i in range(1, 365):
        ts = now - timedelta(days=i)
        temp = 20 + 6 * math.sin(i / 30.0 + seed) + seed
        readings.append((ts, round(temp, 1), 50 + (i % 20)))
    readings.sort(key=lambda r: r[0])
    return readings


payload = {"devices": []}
for idx, (did, name, dtype) in enumerate(DEVICES):
    rd = gen_readings(idx * 1.5)
    latest = rd[-1]
    payload["devices"].append({
        "device_id": did,
        "device_name": name,
        "device_type": dtype,
        "current_temperature": latest[1],
        "current_humidity": latest[2],
        "battery": 88 - idx * 7,
        "last_updated": latest[0].isoformat(),
        "readings": [
            {"timestamp": ts.isoformat(), "temperature": t, "humidity": h}
            for (ts, t, h) in rd
        ],
    })

data = json.dumps(payload).encode()
req = urllib.request.Request(BASE + "/api/import", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    print(resp.read().decode())
