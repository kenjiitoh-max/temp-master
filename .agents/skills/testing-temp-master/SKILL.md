---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 22+ / npm (frontend)
- SwitchBot API credentials

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### Docker alternative (when local Poetry is unavailable)

From `switchbot-dashboard/`, run `docker build -t temp-master-test .`, then
`docker run -d --name temp-master-e2e -p 8000:8000 temp-master-test`.
This builds the current frontend and serves it together with the backend at
`http://localhost:8000/`. Use a disposable container/database for synthetic data;
do not import test records into a live deployment.

Without SwitchBot credentials, `/api/status` returns `configured: false`.
The dashboard can still show `Connected`, meaning the local API is reachable,
not that SwitchBot credentials are valid. `Refresh Data` returns HTTP 500 in
this mode; do not count this as proof of successful device refresh.

When synthetic data is explicitly authorized, POST a JSON `devices` array to
`/api/import`. Each device includes `device_id`, `device_name`, `device_type`,
current values, ISO timestamps and `readings` (timestamp, temperature, humidity,
optional battery). Include readings both inside and outside the chosen time
window so changing Time Range visibly changes the chart, not just its labels.
Real SwitchBot refresh still requires both secrets listed above.

### Japanese font support for browser evidence

If Japanese display-name aliases render as missing-glyph boxes, check
`fc-list :lang=ja`. On Ubuntu, install `fonts-noto-cjk` (refresh the apt package
index first if needed), then restart Chrome to pick up the font. This is an
environment prerequisite, not necessarily an application rendering defect.

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

### 3. Build the frontend and symlink the static files

The Dockerfile builds `switchbot-frontend/` with Vite and copies `dist/` to `switchbot-backend/static/`. Locally you must build and symlink:

```bash
cd switchbot-dashboard/switchbot-frontend
npm ci
npm run build
cd ../..
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

Alternatively, for hot reload, run `npm run dev` in `switchbot-frontend/` and open http://localhost:5173 (Vite proxies `/api` to the backend on port 8000).

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
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + TypeScript"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green, `data-testid="connection-status"`)

### UI Functionality
- Theme selector in navbar: Light / Dark / Midnight. Switching changes `<html data-theme>`, card/background colors, and chart line colors; the choice persists in `localStorage` (`temp-master-theme`) across reloads
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Canvas elements rendered with Chart.js line charts
- Refresh Data button triggers `POST /api/meters/refresh` then reloads all queries
- Download Backup button opens `GET /api/backup` in a new tab

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 18 + TypeScript + Vite, TanStack Query (30s `refetchInterval`), Chart.js v4 via react-chartjs-2, Tailwind CSS with CSS-variable themes (`src/theme/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
