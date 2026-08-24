# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
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

3. Create `.env` and add your SwitchBot credentials:
   ```bash
   printf 'SWITCHBOT_TOKEN=%s\nSWITCHBOT_SECRET=%s\n' "$SWITCHBOT_TOKEN" "$SWITCHBOT_SECRET" > .env
   ```
   
   Get your credentials from the SwitchBot app:
   - Go to Profile > Preferences > About
   - Tap App Version 10 times to enable Developer Options
   - Go to Developer Options > Get Token

4. Start the backend development server:
   ```bash
   poetry run fastapi run app/main.py --port 8000
   ```

### Frontend

1. Navigate to the frontend directory in a second terminal:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser. Vite proxies `/api` requests to
   the backend at `http://localhost:8000`.

The frontend is a Vite + React 18 + TypeScript application. `npm run build`
creates the deployable `dist/` bundle, using Recharts for the history charts.
The dashboard provides light, dark, high-contrast, and ocean themes; the
selection follows the system preference on first visit and is persisted in
local storage.

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
