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

### 3. Start the backend

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

API docs at `http://localhost:8000/docs`.

### 4. Start the frontend (Vite dev server)

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev -- --host 0.0.0.0
```

The dashboard is at `http://localhost:5173/`. `vite.config.ts` proxies `/api/*` to `http://localhost:8000`, so no CORS / env setup is needed.

### 4b. (Optional) Test the production build the way Docker serves it

The Dockerfile builds `switchbot-frontend/dist/` and copies it to `switchbot-backend/static/`. Locally:

```bash
(cd switchbot-dashboard/switchbot-frontend && npm run build)
ln -s $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). Restart the backend after creating the symlink, and remove the symlink afterwards (it must not be committed).

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite + Tailwind CSS"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge (`#connection-status`) shows "Connected" (green)

### UI Functionality
- Time Range selector (`#time-scale-select`): Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year — charts refetch `/api/meters/{id}/history?time_scale=...`
- Charts: Recharts SVG area charts inside each `[data-device-id]` card
- Refresh Data button (`#btn-refresh`) POSTs `/api/meters/refresh` then reloads (fails with 500 when credentials are not configured — expected)
- Theme switcher (`[data-testid="theme-select"]` in the header): System (auto) / Light / Dark / Control Room
  - Changing it updates `document.documentElement.dataset.theme` and `localStorage['temp-master-theme']` immediately
  - Selection survives reload; "System (auto)" follows `prefers-color-scheme`

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: Vite + React 19 + TypeScript + Tailwind CSS v4 + Recharts (`switchbot-frontend/src/`); legacy jQuery version kept at `switchbot-frontend/legacy/index.html` for reference only
- Themes: CSS variables in `src/themes/themes.css`, state in `src/context/ThemeContext.tsx`
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
