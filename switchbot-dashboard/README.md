# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Chart.js v4 (via `react-chartjs-2`)
- Modern frontend stack: Vite + React 18 + TypeScript
- Time scale switching (hour/day/week/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Multiple color themes (Light, Dark, High Contrast, Solarized) with a navbar switcher; the
  selection persists in `localStorage` and respects `prefers-color-scheme` on first load. Charts
  recolor to match the active theme.
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

4. Start the development server (listens on port 8000):
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

The frontend is a Vite + React 18 + TypeScript single-page app.

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Copy `.env.example` to `.env` if you need to override the API base URL:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser.

   The dev server proxies `/api` requests to the backend on `http://localhost:8000`, so make sure
   the backend is running first.

### Available frontend scripts

- `npm run dev` - start the Vite dev server on port 5173 (with the `/api` proxy)
- `npm run build` - type-check and build the production bundle into `dist/`
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint
- `npm run typecheck` - run the TypeScript compiler in no-emit mode

## Production build

The `Dockerfile` uses a multi-stage build:

1. A Node stage runs `npm ci && npm run build` in `switchbot-frontend/` to produce the static
   `dist/` output.
2. The Python stage copies that `dist/` output into the backend's `static/` directory, where
   FastAPI serves it (SPA fallback returns `static/index.html`).

Build and run locally:

```bash
cd switchbot-dashboard
docker build -t temp-master .
docker run -p 8000:8000 --env-file switchbot-backend/.env temp-master
# open http://localhost:8000
```

## Themes

Themes are implemented with CSS custom properties (design tokens) toggled via a `data-theme`
attribute on the root `<html>` element. Bundled themes: `light`, `dark`, `high-contrast`, and
`solarized`. Chart colors are read from the active theme's CSS variables so charts re-render with
matching colors when the theme changes.

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads the SQLite database file

## Notes

- Temperature history is persisted in SQLite (`/data/app.db` in production, `app.db` locally)
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
