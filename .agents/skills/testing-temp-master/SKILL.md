---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Node.js 20+ (frontend build)
- Poetry (dependency management)
- SwitchBot API credentials

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### 1. Install dependencies

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
```

### 2. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 3. Build the frontend and symlink it as static files

The frontend is a Vite + React + TypeScript app. The Dockerfile builds it in a Node stage and copies `switchbot-frontend/dist/` to `static/`; locally, build it and symlink `dist/`:

```bash
(cd switchbot-dashboard/switchbot-frontend && npm ci && npm run build)
ln -sfn $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server. Re-run `npm run build` after frontend changes (the symlink keeps pointing at `dist/`).

Alternatively, for frontend development with hot reload run `npm run dev` in `switchbot-frontend/` (http://localhost:5173); Vite proxies `/api` to `http://localhost:8000`.

### Without SwitchBot credentials

The backend still starts without credentials (no background collection, `POST /api/meters/refresh` returns 500). Seed fake meters with `POST /api/import` (body: `{"devices": [{"device_id", "device_name", "device_type", "current_temperature", "current_humidity", "battery", "last_updated", "readings": [{"timestamp", "temperature", "humidity", "battery"}]}]}`). Use device names from `DISPLAY_NAMES` (e.g. `Bedroom Meter`) to check the display-name mapping.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + Vite + TypeScript"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge (`#connection-status`) shows "Connected" (class `status-badge--connected`); "Disconnected" (class `status-badge--disconnected`) when the API is unreachable

### UI Functionality
- Time Range selector (`#time-scale-select`): Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year (default: Last 24 Hours)
- Charts: one Chart.js v4 line chart (canvas) per meter; tooltip shows `xx.x°C`
- Refresh Data button (`#btn-refresh`) shows "Refreshing..." while running, then reloads
- Download Backup button (`#btn-backup`) opens `/api/backup`
- Status bar: "Monitoring N meters" + "Last refresh: HH:MM:SS"; data re-polls every 30s
- Theme switcher (`#theme-select` in the navbar): System / Light / Dark / High Contrast / Control Room. Applies `data-theme` on `<html>`, persists to `localStorage["temp-master-theme"]`, and chart colours (line/grid/ticks) follow the theme

### Expected behaviour without credentials
- `/api/status` returns `configured: false` while the UI still shows `Connected` — the badge only means the local API is reachable, not that SwitchBot auth works.
- `POST /api/meters/refresh` returning 500 `SwitchBot credentials not configured` is expected; the UI shows a dismissible "Failed to refresh: ..." alert. Do not report the real-device refresh path as verified.
- Re-running `/api/import` appends duplicate readings; reuse an already-seeded DB where possible.

### Browser verification tips
- Emulate OS light/dark (DevTools Rendering or CDP `Emulation.setEmulatedMedia`) to check the `System` theme option and the initial theme on reload.
- Wait at least one 30s poll; in the Network log `/api/meters` and `/api/status` fire together, followed by one `/history` request per meter.
- Use browser Offline emulation to test `Disconnected` (cards stay visible) and automatic recovery on the next poll.
- Add network throttling if "Refreshing..." is too fast to observe.
- For Download Backup, open the downloaded SQLite read-only and check `PRAGMA integrity_check` and the devices count.

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: Vite + React + TypeScript + Chart.js v4 (`switchbot-dashboard/switchbot-frontend/src/`); themes are CSS custom properties in `src/styles/themes.css`
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
