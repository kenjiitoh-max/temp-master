# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/week/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly
- Light, dark, and system-synced themes persisted in local storage

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
   printf 'SWITCHBOT_TOKEN=your-token\nSWITCHBOT_SECRET=your-secret\n' > .env
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

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser. The Vite development server proxies
   `/api` requests to the backend at `http://localhost:8000`.

### Production build and Docker

Build the frontend assets with:

```bash
cd switchbot-frontend
npm ci
npm run build
```

The production container performs this build in a Node stage, then copies
`switchbot-frontend/dist` into `/app/static`. FastAPI serves `static/index.html`
as the SPA fallback and serves built assets from `static/assets`.

From the repository root, build the complete image with:

```bash
docker build -t temp-master switchbot-dashboard/
```

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `GET /api/backup` - Downloads a SQLite database backup

## Notes

- Temperature history is persisted in the backend SQLite database
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
