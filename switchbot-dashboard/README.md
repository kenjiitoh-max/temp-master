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
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `POST /api/import` - Imports devices/readings (requires `X-API-Key`)
- `GET /api/backup` - Downloads a consistent snapshot of the SQLite DB (requires `X-API-Key`)

`POST /api/meters/refresh` also requires the `X-API-Key` header.

## Security configuration

| Variable | Purpose |
| --- | --- |
| `API_KEY` | Shared secret for `/api/import`, `/api/backup`, `/api/meters/refresh`. If unset, the server logs a warning and those endpoints return 503. |
| `ALLOWED_ORIGINS` | Comma-separated list of origins allowed by CORS. Empty = same-origin only. |

On Fly.io set the key as a secret (never in `fly.toml`):

```bash
fly secrets set API_KEY="$(openssl rand -hex 32)"
```

The dashboard asks for the key the first time you press **Refresh Data** or **Download Backup** and keeps it in the browser's localStorage (use the **API Key** button to change it). `backup_database.sh` reads it from `TEMP_MASTER_API_KEY`.

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
