---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Poetry (dependency management)
- Node.js 20+ and npm (frontend build)
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

### 3. Build the frontend and expose it as static files

The frontend is now a React + Vite + TypeScript SPA. In production the Dockerfile builds it
(`npm run build`) and copies the generated `dist/` into `switchbot-backend/static/`. Locally you
must build it and point `static/` at the build output:

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run build   # emits dist/ (index.html + assets/)
cd ..
ln -s $(pwd)/switchbot-frontend/dist switchbot-backend/static
```

**Important:** The static directory check in `main.py` happens at module import time
(`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink
after starting the server, you must restart the server. Re-run `npm run build` after frontend
changes so `dist/` (and therefore `static/`) is up to date.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

### Alternative: Vite dev server (hot reload)

For iterating on the frontend, run the backend on port 8000 and the Vite dev server separately.
Vite proxies `/api` to `http://localhost:8000` (see `vite.config.ts`):

```bash
cd switchbot-dashboard/switchbot-frontend
npm run dev   # serves at http://localhost:5173
```

Open `http://localhost:5173`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React + Vite"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge shows "Connected" (green, class `connection-status connected`)

### UI Functionality
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year (default: Last 24 Hours)
- Charts: `<canvas>` elements rendered by Chart.js line charts (via react-chartjs-2)
- Meter cards: 3-column responsive grid, each showing temperature/humidity/battery badges + chart
- Refresh Data button triggers data reload; Download Backup opens `/api/backup` in a new tab

### Theme Switching
- Theme switcher (in the control bar) offers Light, Dark, Midnight, Solarized
- Selecting a theme sets `document.documentElement.getAttribute('data-theme')` and visibly
  restyles the page (background/text/panel/accent colors)
- Charts remain readable in every theme (line/grid/tick colors adapt per theme)
- Selection persists in `localStorage` under key `temp-master-theme` and survives reload
- First visit with no stored value respects `prefers-color-scheme` (dark → Dark theme)

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React + Vite + TypeScript SPA, Chart.js v4 via react-chartjs-2 (built to `dist/`, served from `static/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
