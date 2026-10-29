# Temp Master

SwitchBot 温湿度計の値を集めてグラフ表示するダッシュボード **Temp Master Dashboard** のリポジトリです。
アプリ本体はすべて [`switchbot-dashboard/`](switchbot-dashboard/) にあります。セットアップ・環境変数・デプロイ・バックアップ手順は
[switchbot-dashboard/README.md](switchbot-dashboard/README.md) を参照してください。

## 構成

- `switchbot-dashboard/switchbot-backend/` — FastAPI + SQLite（aiosqlite）。SwitchBot API を 120 秒ごとにポーリングして保存し、API と静的ファイルを配信
- `switchbot-dashboard/switchbot-frontend/` — 静的ファイル（jQuery + Bootstrap 3 + Chart.js の `index.html` 1 枚）
- `switchbot-dashboard/Dockerfile`, `fly.toml` — Fly.io（東京 `nrt`）へのデプロイ設定。`main` へ push すると GitHub Actions で自動デプロイ
- `switchbot-dashboard/backup_database.sh` — 本番 DB を手元にダウンロードして世代管理するスクリプト
- `.github/workflows/` — CI（pytest）と Fly.io デプロイ
- `REVIEW.md` — レビュー・コメントは日本語で書くという規約

## リポジトリ名とアプリ名について

| 場所 | 名前 |
|---|---|
| GitHub リポジトリ | `temp-master` |
| Fly.io アプリ名 / URL | `temp-master` / https://temp-master.fly.dev |
| 画面上のブランド | Temp Master Dashboard |
| ディレクトリ | `switchbot-dashboard/`, `switchbot-backend/`, `switchbot-frontend/` |

「SwitchBot 温度計ダッシュボード」として作り始めた後にブランド名を **Temp Master** へ変えたため、ディレクトリ名だけ旧称が残っています。
いずれも同じ 1 つのアプリを指しており、ディレクトリ名は Dockerfile・CI の参照パスに使われているため意図的にそのままにしています。

## 必要なシークレット（Fly.io）

| 名前 | 用途 |
|---|---|
| `SWITCHBOT_TOKEN` / `SWITCHBOT_SECRET` | SwitchBot API の認証情報（未設定だとデータ収集が動かない） |
| `BACKUP_TOKEN` | `GET /api/backup` の Bearer トークン（未設定だとバックアップ機能は 404 で無効） |

いずれも `fly secrets set KEY=VALUE` で登録し、リポジトリには書きません。詳細は `switchbot-dashboard/README.md` を参照。
