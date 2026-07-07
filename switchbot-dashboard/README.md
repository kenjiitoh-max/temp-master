# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices (React + Chart.js v4 via react-chartjs-2)
- Time scale switching (hour/day/week/month/year)
- Multiple UI themes (Light, Dark, Midnight, Solarized) with a theme switcher, persisted to
  `localStorage` and respecting `prefers-color-scheme` on first load
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

The frontend is a React + Vite + TypeScript single-page app (Chart.js v4 / react-chartjs-2).

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
   By default `npm run dev` proxies `/api` requests to the backend at
   `http://localhost:8000` (see `vite.config.ts`), so no configuration is required
   as long as the backend is running.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

Available scripts: `npm run dev`, `npm run build` (outputs to `dist/`),
`npm run preview`, `npm run lint`, `npm run typecheck`.

In production the app is built (`npm run build`) and the resulting `dist/` is served by the
FastAPI backend as static files (the `Dockerfile` does this in a multi-stage build).

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
