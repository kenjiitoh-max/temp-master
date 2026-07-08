# Temp Master

SwitchBot Meter デバイスの環境テレメトリを集約・可視化する監視ダッシュボード。

## セキュリティ設定（必須）

機密・変更系エンドポイント（`/api/backup`, `/api/import`, `/api/meters/refresh`）は
`X-API-Key` ヘッダによる API キー認証を必須とする。運用時は以下を設定すること。

- `DASHBOARD_API_KEY`: API キー。**未設定の場合、機密エンドポイントは 503 を返し無認証で開放されない**（安全側）。本番運用では設定必須。
- `ALLOWED_ORIGINS`: CORS 許可オリジン（カンマ区切り）。`*` を含む場合 `allow_credentials` は自動的に無効化される。

詳細は `switchbot-dashboard/switchbot-backend/README.md` を参照。
