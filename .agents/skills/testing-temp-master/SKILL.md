---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ (frontend build)
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

### 3. Build the frontend and link it as static files

The Dockerfile builds the frontend and copies `switchbot-frontend/dist/` to `switchbot-backend/static/`. Locally, build it and symlink `dist/`:

```bash
(cd switchbot-dashboard/switchbot-frontend && npm ci && npm run build)
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

Alternatively, run the Vite dev server on http://localhost:5173 with `VITE_API_URL=http://localhost:8000` in `switchbot-frontend/.env`.

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

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
- Footer: should say "Temp Master Dashboard v1.0 - Built with React + TypeScript + Vite + Recharts"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green, class `badge--success`)

### UI Functionality
- Meter grid: responsive card grid, one card per meter
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Recharts SVG area charts (temperature history)
- Theme selector in the header: Light / Dark, persisted in `localStorage` (`temp-master-theme`); charts follow the theme
- Refresh Data button triggers data reload

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 19 + TypeScript + Vite + Recharts (`switchbot-frontend/`, built to `dist/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
