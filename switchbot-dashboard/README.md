# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Theme switching (Light / Dark / Midnight / High Contrast)
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

Vite + React 18 + TypeScript SPA (TanStack Query, Recharts, Tailwind CSS). Requires Node.js 20+.

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (proxies `/api` to the backend at `http://localhost:8000`; override with `VITE_BACKEND_URL`):
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

5. Build for production (outputs to `switchbot-frontend/dist/`):
   ```bash
   npm run build
   ```

   To serve the build from FastAPI locally, link it as the backend's static directory, then (re)start the backend:
   ```bash
   ln -sfn ../switchbot-frontend/dist switchbot-backend/static
   ```

   The Dockerfile builds the frontend in a `node:20-alpine` stage and copies `dist/` into the backend image's `static/`.

### Themes

Use the theme switcher in the navbar to choose Light / Dark / Midnight / High Contrast. The choice is saved in `localStorage`; on first visit the OS `prefers-color-scheme` setting is used.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
