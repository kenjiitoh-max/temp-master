# SwitchBot Backend

Temp Master ダッシュボードのバックエンド（FastAPI + SQLite）。

## セットアップ

```bash
poetry install
cp .env.example .env   # 各値を設定
poetry run uvicorn app.main:app --reload
```

## テスト

```bash
poetry run pytest
```

## 環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `SWITCHBOT_TOKEN` | 収集を行う場合 | SwitchBot API トークン |
| `SWITCHBOT_SECRET` | 収集を行う場合 | SwitchBot API シークレット |
| `DB_PATH` | 任意 | SQLite DB のパス（既定: `/data/app.db` または `app.db`） |
| `DASHBOARD_API_KEY` | 機密操作に必須 | 機密・変更系エンドポイントの API キー認証に使用 |
| `ALLOWED_ORIGINS` | 任意 | CORS 許可オリジン（カンマ区切り） |

## 認証（DASHBOARD_API_KEY）

次の機密・変更系エンドポイントは、`X-API-Key` ヘッダによる API キー認証を必須とする。

- `GET /api/backup` — SQLite DB 全体を返す（データ流出防止）
- `POST /api/import` — DB へデータを書き込む（データ改ざん防止）
- `POST /api/meters/refresh` — 外部 SwitchBot API 呼び出しを誘発（DoS 防止）

挙動:

- リクエストの `X-API-Key` が `DASHBOARD_API_KEY` と一致すれば **200**。
  比較は `secrets.compare_digest` によるタイミング攻撃耐性のある定数時間比較。
- ヘッダ欠如・不一致は **401 Unauthorized**。
- `DASHBOARD_API_KEY` が **未設定**の場合、これらのエンドポイントは **503 Service Unavailable**
  を返し、無認証での開放を防ぐ（安全側に倒す）。したがって本番運用では
  `DASHBOARD_API_KEY` の設定が必須。

読み取り専用の表示系エンドポイント（`/api/meters`, `/api/meters/{id}/history`,
`/api/status`, `/api/latency-logs`, `/api/latency-stats`, `/healthz`）は公開ダッシュボードが
利用するため、既定では認証を課さない。

### 使用例

```bash
# 認証なし -> 401（キー設定済みの場合）
curl -i -X POST http://localhost:8000/api/meters/refresh

# 認証あり -> 200
curl -i -X POST http://localhost:8000/api/meters/refresh \
  -H "X-API-Key: $DASHBOARD_API_KEY"

# バックアップのダウンロード
curl -o backup.db http://localhost:8000/api/backup \
  -H "X-API-Key: $DASHBOARD_API_KEY"
```

## CORS（ALLOWED_ORIGINS）

`ALLOWED_ORIGINS` にカンマ区切りで許可オリジンを明示指定する。未設定時は空リスト
（同一オリジン運用を想定）。`allow_origins` に `*`（ワイルドカード）を含む場合、
`allow_credentials` は自動的に `False` になり、ワイルドカード + credentials という
危険な併用を回避する。

## フロントエンドへの影響

認証必須化により、フロントエンドの「Refresh Data」「Download Backup」ボタンは
API キーが必要になる。初回操作時にキー入力を促し、`localStorage` に保存して
以降は `X-API-Key` ヘッダで送信する。
