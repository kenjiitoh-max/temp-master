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

The frontend is a Vite + React 18 + TypeScript app in `switchbot-frontend/`
(TanStack Query for data fetching, Tailwind CSS for styling, Recharts for charts).
Requires Node.js 20.19+ (Node 22 recommended; the Docker build uses Node 22).

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (start the backend on port 8000 first):
   ```bash
   npm run dev
   ```
   Open http://localhost:5173. The Vite dev server proxies `/api` to `http://localhost:8000`
   (`server.proxy` in `vite.config.ts`), so no CORS setup or hard-coded backend URL is needed.

4. Build for production:
   ```bash
   npm run build
   ```
   Output goes to `switchbot-frontend/dist/`. The Dockerfile builds it in a Node 22 stage and copies
   `dist/` into the backend image as `static/`, which FastAPI serves at `/`.

Other scripts: `npm run lint`, `npm run typecheck`, `npm test` (Vitest), `npm run format` (Prettier).

#### Environment variables (optional)

Copy `.env.example` to `.env` to override defaults:

- `VITE_API_BASE_URL` – API base URL. Empty by default, so the app calls same-origin relative paths
  (`/api/...`), which is what production uses.
- `VITE_DEV_PROXY_TARGET` – backend the dev server proxies `/api` to (default `http://localhost:8000`).

#### Themes

Use the **Theme** dropdown in the header to switch between:

- `light` – Light
- `dark` – Dark
- `contrast` – High Contrast (black background, yellow/white accents)
- `wa` – 和 (Ai & Shu): traditional Japanese indigo (藍色) and vermilion (朱色) on unbleached (生成り)

The choice is saved in `localStorage` (`temp-master-theme`). Before any choice is saved, the
initial theme follows the OS `prefers-color-scheme` setting. Themes are CSS custom properties
switched by `<html data-theme="...">` (see `src/index.css`); Tailwind utilities such as
`bg-surface` or `text-muted` read those variables, so adding a theme only needs a new
`[data-theme='...']` block in `index.css` and an entry in `src/lib/theme.ts` (plus the list in
the inline script of `index.html`, which applies the theme before React loads).

The previous jQuery/Bootstrap single-file frontend is kept for reference in
`switchbot-frontend-legacy/index.html`; it is not used by the build.

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
