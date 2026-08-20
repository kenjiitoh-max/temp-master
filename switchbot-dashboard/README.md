# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- React 19 + TypeScript + Vite frontend
- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Light / dark themes (extensible theme registry) persisted in `localStorage`, defaulting to the OS `prefers-color-scheme`
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

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies (Node.js 22+):
   ```bash
   npm ci
   ```

3. Copy `.env.example` to `.env` and point `VITE_API_URL` at the backend:
   ```bash
   cp .env.example .env
   ```

   `VITE_API_URL` is only needed for local development. When the build output is
   served by FastAPI (same origin) the base URL stays empty; when `index.html` is
   opened as a `file://` URL it falls back to `https://temp-master.fly.dev`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

### Frontend checks

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # production build to dist/
```

## Themes

Themes live in `src/theme/themes.ts`. Each entry defines a token set that is applied
as CSS custom properties on `<html>`; chart colors (line, fill, grid, axis, tooltip)
read from the same tokens so Recharts follows the active theme. Adding a theme means
appending one entry to `THEMES` — the header selector picks it up automatically.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration

## Docker

`Dockerfile` is a multi-stage build: a Node stage runs `npm ci && npm run build`, and
the resulting `dist/` is copied into the backend image at `./static/`, which FastAPI
serves at `/`.

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
