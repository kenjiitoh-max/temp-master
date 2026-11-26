# Temp Master 脅威モデル

対象: `kenjiitoh-max/temp-master`（インフラ設定 `switchbot-dashboard/fly.toml`・`Dockerfile`・`.github/workflows/` を含む）。リポジトリに既存の SECURITY_MODEL.md はなし。

## システム概要と信頼境界

SwitchBot の温湿度計の値を 120 秒ごとに取得して SQLite に保存し、Web ダッシュボードで表示する個人向けアプリ。1 プロセス（FastAPI + Uvicorn）がフロントエンドの静的ファイルと API を両方配信し、Fly.io（`temp-master`、nrt、1 台、`/data` ボリューム）にデプロイされる。

信頼境界:
1. インターネット → Fly.io HTTPS（`force_https = true`）→ FastAPI。**アプリ側に認証は一切ない。**
2. FastAPI → SwitchBot Cloud API（`https://api.switch-bot.com`）。`SWITCHBOT_TOKEN`/`SWITCHBOT_SECRET` による HMAC 署名（`generate_switchbot_headers`）。
3. GitHub Actions → Fly.io（`FLY_API_TOKEN` シークレット、main への push で `flyctl deploy`）。

### コンポーネント

| 名前 | 対象コード |
|---|---|
| API | `switchbot-dashboard/switchbot-backend/app/main.py` の `@app` ルート（`/api/*`, `/healthz`, `serve_spa`） |
| Collector | `main.py` の `collect_data` / `background_collector` / `call_switchbot_api` / `generate_switchbot_headers` |
| Storage | `main.py` の aiosqlite 関数群（`init_database`, `save_*`, `get_*`, `cleanup_*`）、`/data/app.db` |
| Web UI | `switchbot-dashboard/switchbot-frontend/index.html`（jQuery 1.12.4, Bootstrap 3.3.7, Chart.js 2.9.4 を cdnjs から読み込み） |
| Infra/CI | `switchbot-dashboard/fly.toml`, `Dockerfile`, `backup_database.sh`, `.github/workflows/*.yml` |

## エントリポイントと到達可能な人

すべて認証なし。CORS は `allow_origins=["*"]` かつ `allow_credentials=True`。

| エンドポイント | 内容 |
|---|---|
| `GET /api/meters`, `GET /api/meters/{id}/history`, `GET /api/status`, `GET /healthz` | 読み取り |
| `GET /api/latency-logs`, `GET /api/latency-stats` | SwitchBot API 呼び出しログ（エラー本文を含む） |
| `POST /api/meters/refresh` | 即時に SwitchBot API を呼ぶ（レート制限を消費） |
| `POST /api/import` | 任意のデバイス・計測値を DB とメモリに書き込む |
| `GET /api/backup` | SQLite ファイル全体をダウンロード（`backup_database.sh` が利用） |
| `GET /{full_path:path}` | 静的ファイル配信（`is_relative_to` でパストラバーサル対策済み） |

## 資産と重要度

ユーザー回答: 以下の 3 つすべてを守りたい（トークン・シークレット、履歴データの改ざん/消失/流出、サービス稼働）。

- SwitchBot トークン/シークレット（環境変数。漏れるとアカウントの全デバイスを操作可能）
- `FLY_API_TOKEN`（GitHub シークレット）
- 温湿度の履歴データ（`readings`, `devices`, `latency_logs`）
- SwitchBot API のレート制限枠（1 日 10,000 回）とサービス稼働

## 重要な攻撃者像

- インターネット上の匿名者（URL を知っている/推測した人）: すべての API に到達可能。**ユーザー回答: ダッシュボードはインターネット上の誰でも開ける（前段の制限なし）。** ログイン機能はなく、利用者はオーナー本人のみ。
- ダッシュボードを開いた人のブラウザ上で動く悪意あるサイト（CORS `*`）
- 依存ライブラリ・CDN・GitHub Actions のサプライチェーン

## 既存の対策

- SQL はすべてプレースホルダ（`?`）でパラメータ化
- フロントエンドは `escapeHtml` でデバイス名等をエスケープしてから `.html()` に連結、エラーは `.text()`
- 静的ファイル配信は `resolve()` + `is_relative_to(STATIC_DIR)` で制限
- SwitchBot 429 時の指数バックオフ（`data_store.backoff_until`）
- 入力は Pydantic モデル（`ImportData` 等）、`TimeScale` は Enum

## セキュリティ不変条件

- **認証・認可（CWE-306/862）**: 現状、認証ミドルウェアも依存関数（`Depends`）も存在しない。状態を変える・データを丸ごと返すエンドポイント（`/api/import`, `/api/backup`, `/api/meters/refresh`）は認証済みの操作者だけが呼べるべき。**ギャップ**: 未実装。
- **インジェクション（CWE-89）**: SQL は aiosqlite の `execute(query, params)` に `?` プレースホルダで値を渡す。`get_latency_logs` / `get_latency_stats` のように文字列連結で組み立てる場合も、連結してよいのは固定の SQL 断片だけで、ユーザー値は必ず `params` に入れる。
- **XSS（CWE-79）**: API 由来の文字列（`device_name`, `device_id`, `device_type` など、`/api/import` で誰でも書き換え可能）は `index.html` の `escapeHtml` を通してから HTML 文字列に連結する。`.html()` に生値を渡すのは禁止。メッセージは `.text()` を使う。
- **CSRF / CORS（CWE-352/942）**: `CORSMiddleware(allow_origins=["*"], allow_credentials=True)` はクッキー認証を後で追加すると危険になる。状態変更は POST + JSON（Pydantic）だが認証がないため、現状は CSRF ではなく直接呼び出しで同じことができる。
- **パストラバーサル（CWE-22）**: `serve_spa` は `resolve()` 後に `is_relative_to(STATIC_DIR.resolve())` を必ず確認する。`FileResponse` に渡すパスはこの確認を通ったものか固定パス（`DB_PATH`, `index.html`）だけ。
- **SSRF（CWE-918）**: 外向き通信は固定の `SWITCHBOT_API_BASE` のみ。`device_id` は URL パスに入る（`/devices/{id}/status`）が、SwitchBot から取得した ID のみを使うこと。**ギャップ（確認済み）**: `collect_data` は `data_store.devices` の全キーについて `fetch_device_status` を呼ぶため、`/api/import` で入れた任意の ID が署名付きで SwitchBot API のパスに入る。
- **シークレット（CWE-200/532）**: トークン/シークレットは環境変数のみ（`.env` は `.gitignore`）。API レスポンス・`latency_logs.error_message`・例外詳細に SwitchBot の応答本文やヘッダを載せる場合、署名やトークンを含めない。
- **リソース枯渇（CWE-770/400）**: `/api/meters/refresh` と `/api/import` は無制限に呼べ、`limit` パラメータに上限がない。レート制限・サイズ上限はない（ギャップ）。
- **サプライチェーン（CWE-1104/829）**: cdnjs のスクリプトに SRI（`integrity`）がない。jQuery 1.12.4 / Bootstrap 3.3.7 は既知の脆弱性がある古い版。`superfly/flyctl-actions/setup-flyctl@master` はタグ/SHA 固定なし。

## 対象外・許容リスク（ユーザー確認済み）

- **ユーザー回答: `/api/backup`・`/api/import`・`/api/meters/refresh` に認証がないことは意図的で、自分専用アプリとして許容しているリスク。** 「このエンドポイントに認証がない」こと自体を根拠とする指摘は優先度を下げる。
- ただし、ユーザーは同時に「履歴データの改ざん・消失・流出」と「サービス停止」も守りたいと回答している。認証なしで到達できる経路を前提としつつ、そこから**トークン/シークレットの漏えい**、**XSS など他の脆弱性への連鎖**、**データの恒久的な消失**、**サービス停止**に至るものは許容範囲外として扱う。

## 未解決の質問

- 認証なしエンドポイントを許容する一方で、履歴データの改ざん・流出（`/api/import` での書き換え、`/api/backup` での全件取得）も守りたいとの回答があり、両者の線引きは今後の指摘ごとに確認する。
