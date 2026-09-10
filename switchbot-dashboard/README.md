# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- React 18 + TypeScript + Vite SPA with TanStack Query and Chart.js v4
- Three switchable themes (Light / Dark / Midnight), persisted in `localStorage`
- Temperature charts for all SwitchBot Meter devices
- Time scale switching (hour/day/month/year)
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

The frontend is a React 18 + TypeScript + Vite project in `switchbot-frontend/`.

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite dev server (with the backend running on port 8000):
   ```bash
   npm run dev
   ```
   `vite.config.ts` proxies `/api` to `http://localhost:8000`, so no `.env` is
   needed for local development. Open http://localhost:5173 in your browser.

4. Lint / typecheck:
   ```bash
   npm run lint
   npm run typecheck
   ```

#### Production build

```bash
cd switchbot-frontend
npm run build   # outputs dist/index.html + dist/assets/
```

The `Dockerfile` runs this build in a Node stage and copies `dist/` into the
Python image as `./static/`, where FastAPI serves it with an SPA fallback.
To serve the built files from the backend locally, point `switchbot-backend/static`
at `dist/`:

```bash
ln -s $(pwd)/switchbot-frontend/dist switchbot-backend/static
```

If the frontend is hosted separately from the backend, set `VITE_API_URL`
(see `.env.example`) to the backend origin before building.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the SQLite database file (`switchbot_backup_<timestamp>.db`)

## Notes

- Temperature history is persisted in SQLite (`/data/app.db` in production, local `app.db` otherwise) and survives backend restarts
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
