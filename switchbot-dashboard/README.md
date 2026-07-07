# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
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

   Additional environment variables for security:
   - `API_TOKEN` — shared secret required to call the protected endpoints
     `POST /api/meters/refresh`, `POST /api/import` and `GET /api/backup`.
     Generate one with `openssl rand -hex 32`. If it is left empty these
     endpoints are **disabled** (return HTTP 503) so they are never exposed
     without authentication.
   - `ALLOWED_ORIGINS` — comma-separated list of origins allowed by CORS.
     Defaults to the production frontend origin. For local development set e.g.
     `ALLOWED_ORIGINS=http://localhost:5173,https://temp-master.fly.dev`.

4. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `GET /api/status` - Returns backend status and configuration
- `POST /api/meters/refresh` - Triggers immediate data collection **(requires API token)**
- `POST /api/import` - Imports historical device/reading data **(requires API token)**
- `GET /api/backup` - Downloads the SQLite database file **(requires API token)**

### Authentication

The state-changing / data-export endpoints above require an API token that
matches the backend's `API_TOKEN` environment variable. Provide it via either:

- `Authorization: Bearer <token>` header (preferred), or
- `X-API-Token: <token>` header, or
- `?token=<token>` query parameter (only for `GET /api/backup`, since browser
  downloads cannot set headers; note it can leak into logs).

Read-only endpoints (`/api/meters`, `/api/meters/{id}/history`, `/api/status`,
`/api/latency-*`, `/healthz`) remain public.

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
