# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Light / Dark / High Contrast / Neon theme switching
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

フロントエンドは **Vite + React 18 + TypeScript + Tailwind CSS v4** で構成されています
(データ取得: TanStack Query / チャート: Recharts / アイコン: lucide-react)。

1. フロントエンドのディレクトリへ移動:
   ```bash
   cd switchbot-frontend
   ```

2. 依存パッケージをインストール:
   ```bash
   npm install
   ```

3. (任意) `.env.example` を `.env` にコピー:
   ```bash
   cp .env.example .env
   ```
   - `VITE_API_URL`: API のベース URL。空なら同一オリジンの `/api` を使います (通常は空のままで OK)
   - `VITE_PROXY_TARGET`: dev サーバが `/api` を転送するバックエンド (既定: `http://localhost:8000`)

4. バックエンドを起動した状態で dev サーバを起動:
   ```bash
   npm run dev
   ```

5. ブラウザで http://localhost:5173 を開く (`/api/*` は自動でバックエンドにプロキシされます)

#### ビルド / チェック

```bash
npm run build      # 型チェック + 本番ビルド (成果物は dist/)
npm run lint       # ESLint
npm run typecheck  # TypeScript の型チェックのみ
```

`dist/` を `switchbot-backend/static/` に置くと、FastAPI (`serve_spa`) が `/` で配信します。
Docker ではマルチステージビルドで自動的に行われます。

#### テーマ

ナビバー右上のボタンで **Light / Dark / High Contrast / Neon** を切り替えられます。

- 選択したテーマは `localStorage` (`temp-master-theme`) に保存されます
- 未選択の場合は OS の `prefers-color-scheme` に従います
- 色は `src/index.css` の CSS 変数 (`[data-theme="..."]`) で定義しており、チャートの線・グリッド・ツールチップも同じ変数から色を取ります

## Docker

```bash
docker build -t temp-master .
docker run -p 8000:8000 --env-file switchbot-backend/.env temp-master
```

Node ステージで `npm ci && npm run build` を実行し、`dist/` を Python ステージの `./static/` にコピーします。

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
