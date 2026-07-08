---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 20+ and npm (for the React frontend)
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

### 3. Choose a frontend workflow

The frontend is a Vite + React + TypeScript app. The Docker image builds it
(`npm run build`) and copies `switchbot-frontend/dist/` to
`switchbot-backend/static/`. Locally you have two options:

**Option A — Vite dev server (fast iteration):** run the backend on port 8000
and the Vite dev server on port 5173. The dev server proxies `/api` to
`http://localhost:8000`, so open `http://localhost:5173`.

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev   # http://localhost:5173
```

**Option B — production build served by the backend:** build the SPA and
symlink `dist/` into the backend's `static/` directory, then browse the backend
directly at `http://localhost:8000`.

```bash
cd switchbot-dashboard/switchbot-frontend
npm install && npm run build
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import
time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you
create the symlink after starting the server, you must restart the server.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

With Option B the frontend is served at `http://localhost:8000/`; the API docs
are always at `http://localhost:8000/docs`.

Note: Poetry may create the venv outside the project (e.g.
`~/.cache/pypoetry/virtualenvs/...`), so `.venv/bin/fastapi` may not exist. Use
`poetry run fastapi ...`, or resolve the path with `poetry env info --path`.

### 5. Seeding data WITHOUT SwitchBot credentials (for UI testing)

The backend exposes a credential-free `POST /api/import` endpoint that accepts
`{"devices": [{device_id, device_name, device_type, current_temperature,
current_humidity, battery, last_updated, readings: [{timestamp, temperature,
humidity}]}]}` and populates both the in-memory store and the SQLite DB. This
lets you exercise the full UI (meter cards, per-time-scale history charts,
themes) with no real credentials. `GET /api/status` will report
`configured: false` but meters/history still return the imported data. Use names
present in `src/utils/displayNames.ts` `DISPLAY_NAMES` (e.g. "Bedroom Meter")
to exercise the `getDisplayName` mapping. Generate readings across ranges:
every few minutes for the last ~2h (hour/day), hourly for ~30 days (week/month),
and daily for ~365 days (year). Live collection ("Refresh Data",
`POST /api/meters/refresh`) still requires real credentials and returns 500
without them.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v1.0 - Built with React + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green)

### UI Functionality
- Theme selector: switching between Dark / Light / Solarized / Ocean changes
  background, panels, and chart colors; the choice persists across reloads
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts SVG line charts render temperature history per meter
- Refresh Data button triggers data reload; Download Backup downloads the DB
- Auto-refresh occurs every 30 seconds

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 18 + TypeScript + Vite, charts via Recharts (built to `dist/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
