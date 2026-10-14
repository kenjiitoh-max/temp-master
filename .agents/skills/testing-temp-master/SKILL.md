---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
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

The frontend is a Vite + React + TS app. The Dockerfile builds it in a Node stage and copies `dist/` to `./static/`. Locally, build it and symlink `dist/` (the symlink path is gitignored):

```bash
cd switchbot-dashboard/switchbot-frontend && npm install && npm run build && cd -
ln -sfn ../switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

Alternatively run the Vite dev server (`npm run dev` in `switchbot-frontend/`, port 5173); it proxies `/api` to `localhost:8000`.

### Dummy data (no SwitchBot credentials)

Without credentials, seed meters via `POST /api/import` (`{"devices": [{device_id, device_name, device_type, current_temperature, current_humidity, battery, last_updated, readings: [{timestamp, temperature, humidity, battery}]}]}`). Use names from `DISPLAY_NAMES` in `src/constants.ts` (e.g. `Bedroom Meter`) to check the alias mapping. `POST /api/meters/refresh` returns 500 without credentials, so the UI shows "Failed to refresh: 500 SwitchBot credentials not configured".

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
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + Vite + Tailwind CSS"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge (`#connection-status`) shows "Connected" (`data-state="connected"`)

### UI Functionality
- Time Range selector (`#time-scale-select`): Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts SVG area charts (`[data-testid=temperature-chart]`)
- Refresh Data button (`#btn-refresh`) triggers `POST /api/meters/refresh` then refetches
- Theme switcher in the navbar (`[data-theme-option=light|dark|contrast|neon]`) sets `<html data-theme>`, persists to `localStorage["temp-master-theme"]`, and recolors the charts

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: Vite + React 18 + TypeScript + Tailwind CSS v4, TanStack Query (30s polling), Recharts
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
