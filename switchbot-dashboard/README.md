# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Chart.js v4 (`react-chartjs-2`)
- Time scale switching (hour/day/week/month/year)
- Multiple themes (Light / Dark / High Contrast / Control Room) with a navbar switcher; the choice is saved in `localStorage` and defaults to the OS `prefers-color-scheme`
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd switchbot-backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Copy `.env.example` to `.env` and add your SwitchBot credentials:
   ```bash
   cp .env.example .env
   ```
   
   Get your credentials from the SwitchBot app:
   - Go to Profile > Preferences > About
   - Tap App Version 10 times to enable Developer Options
   - Go to Developer Options > Get Token

4. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

The frontend is a Vite + React + TypeScript SPA in `switchbot-frontend/` (Node.js 20+).

1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd switchbot-frontend
   npm ci
   ```

2. Start the Vite dev server (with the backend running on port 8000):
   ```bash
   npm run dev
   ```
   Open http://localhost:5173. Requests to `/api/*` are proxied by Vite to
   `http://localhost:8000`. To proxy to another backend, copy `.env.example` to
   `.env.local` and set `VITE_PROXY_TARGET` (e.g. `https://temp-master.fly.dev`).

3. Other scripts:
   ```bash
   npm run lint       # ESLint
   npm run typecheck  # tsc --noEmit
   npm run build      # type-check + production build into dist/
   npm run preview    # serve dist/ locally
   ```

### Serving the built frontend from FastAPI

FastAPI serves whatever is in `switchbot-backend/static/` at `/` (with SPA fallback).
The Dockerfile builds the frontend in a Node stage and copies `dist/` there. Locally:

```bash
(cd switchbot-frontend && npm ci && npm run build)
ln -s "$(pwd)/switchbot-frontend/dist" switchbot-backend/static
(cd switchbot-backend && poetry run fastapi run app/main.py --port 8000)
```

Open http://localhost:8000. Restart the server if you create the symlink after it started.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the SQLite database file

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
