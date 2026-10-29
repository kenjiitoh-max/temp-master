# switchbot-frontend

Temp Master Dashboard のフロントエンド（Vite + React 19 + TypeScript + Tailwind CSS v4 + Recharts）。

## 開発

```bash
cd switchbot-dashboard/switchbot-frontend
npm install
npm run dev        # http://localhost:5173  (/api は localhost:8000 の FastAPI へプロキシ)
```

バックエンドは別ターミナルで起動しておく:

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi dev app/main.py   # http://localhost:8000
```

## スクリプト

| コマンド            | 内容                                   |
| ------------------- | -------------------------------------- |
| `npm run dev`       | 開発サーバー起動（HMR 付き）           |
| `npm run build`     | 型チェック + 本番ビルド → `dist/`      |
| `npm run preview`   | `dist/` をローカルで確認               |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | `tsc -b --noEmit`                      |

## ディレクトリ

```
src/
  api/client.ts            FastAPI (/api/*) との通信（fetch ラッパー）
  components/
    Header.tsx             固定ヘッダー（ブランド・接続状態・テーマ切替）
    ThemeSwitcher.tsx      テーマ選択ドロップダウン
    Controls.tsx           Time Range / Refresh / Backup
    StatusBar.tsx          監視台数・最終更新・レート制限警告
    DeviceList.tsx         メーターのグリッド
    DeviceCard.tsx         1台分のカード（現在値バッジ + チャート）
    TemperatureChart.tsx   履歴チャート（Recharts）
  context/ThemeContext.tsx テーマ状態（localStorage 永続化・OS設定追従）
  hooks/useDashboardData.ts  meters/status の取得と 30 秒ごとの自動更新
  themes/themes.css        各テーマの CSS 変数定義（light / dark / control-room）
  utils/                   表示名マッピング・日時フォーマット
legacy/index.html          移行前の jQuery + Bootstrap 3 実装（参照用・配信されない）
```

## テーマの仕組み

1. `themes.css` が `:root`（light）, `[data-theme="dark"]`, `[data-theme="control-room"]` に同じ名前の CSS 変数を定義
2. `index.css` の `@theme inline` で変数を Tailwind のユーティリティ（`bg-surface`, `text-fg` …）に接続
3. `ThemeProvider` が `<html data-theme>` を書き換え、選択を `localStorage` (`temp-master-theme`) に保存
4. 未選択時は `prefers-color-scheme` に従い、OS 設定が変わればリアルタイムで追従
5. `index.html` の inline script が React 起動前に `data-theme` を当てるので、リロード時にテーマがチラつかない

## デプロイ

`switchbot-dashboard/Dockerfile` がマルチステージで `npm ci && npm run build` を実行し、
`dist/` をバックエンドの `static/` にコピーします。FastAPI が `/` で配信します。
