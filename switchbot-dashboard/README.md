# Temp Master Dashboard

SwitchBot 温湿度計（Meter / Meter Plus / Meter Pro / Hub 2 など）の値を定期取得して SQLite に蓄積し、
ブラウザでグラフ表示する小さなフルスタックアプリです。Fly.io（東京 `nrt` リージョン）で稼働しています。

> **名前について**: GitHub リポジトリ名・Fly.io アプリ名は `temp-master`、このディレクトリ名は `switchbot-dashboard`、
> その下は `switchbot-backend` / `switchbot-frontend` です。アプリは「SwitchBot 温度計ダッシュボード」として作り始め、
> その後ブランドを **Temp Master** に改めたため名前が混在しています。指しているものはすべて同じアプリです。

## 構成

```
switchbot-dashboard/
├── switchbot-backend/     # FastAPI + SQLite(aiosqlite)。API と静的ファイル配信を担当
│   ├── app/main.py        # アプリ本体（1ファイル）
│   ├── tests/             # pytest
│   └── .env.example       # 環境変数の雛形
├── switchbot-frontend/    # 静的ファイル（index.html 1枚: jQuery + Bootstrap 3 + Chart.js）
├── Dockerfile             # マルチステージビルド。非 root ユーザー(appuser)で実行
├── docker-entrypoint.sh   # /data の所有者を揃えてから権限を落として起動
├── fly.toml               # Fly.io 設定（nrt、ヘルスチェック、512MB、/data ボリューム）
└── backup_database.sh     # 本番 DB を手元にダウンロードして世代管理するスクリプト
```

| 役割 | 技術 | 補足 |
|---|---|---|
| バックエンド | Python 3.12 / FastAPI / aiosqlite | 120 秒ごとに SwitchBot API をポーリングし `readings` テーブルへ保存。429 時は指数バックオフ |
| フロントエンド | 静的 HTML（jQuery, Bootstrap 3, Chart.js） | ビルド不要。Docker イメージ内で `static/` にコピーされ、バックエンドが `/` で配信 |
| DB | SQLite（`/data/app.db`） | Fly.io ボリューム `temp_master_data` を `/data` にマウント |
| デプロイ | Fly.io（`nrt`） | `main` への push で GitHub Actions（`.github/workflows/deploy.yml`）が `flyctl deploy --remote-only` |

### 主なエンドポイント

| メソッド/パス | 認証 | 説明 |
|---|---|---|
| `GET /healthz` | なし | ヘルスチェック（Fly.io / Docker HEALTHCHECK が利用） |
| `GET /api/meters` | なし | 全メーターの最新値（キャッシュから返す。SwitchBot API は叩かない） |
| `GET /api/meters/{device_id}/history?time_scale=hour\|day\|week\|month\|year` | なし | 履歴 |
| `GET /api/status` | なし | 設定状態・レート制限状態 |
| `GET /api/latency-logs`, `GET /api/latency-stats` | なし | SwitchBot API 呼び出しのレイテンシ記録 |
| `POST /api/meters/refresh` | なし | 即時データ収集 |
| `POST /api/import` | なし | 別インスタンスからの履歴インポート（テスト用シードにも使用） |
| `GET /api/backup` | **BACKUP_TOKEN 必須** | SQLite の整合スナップショットをダウンロード |

## 環境変数 / シークレット

`app/main.py` が読む環境変数は以下の通りです（`.env` または Fly.io secrets）。

| 変数 | 必須 | 説明 |
|---|---|---|
| `SWITCHBOT_TOKEN` | 収集するなら必須 | SwitchBot 開発者トークン。未設定だとデータ収集は動かず、ダッシュボードは既存データの表示のみ |
| `SWITCHBOT_SECRET` | 同上 | SwitchBot 開発者シークレット |
| `BACKUP_TOKEN` | バックアップを使うなら必須 | `/api/backup` の Bearer トークン。**未設定時は `/api/backup` が 404 を返し無効化**される |
| `DB_PATH` | 任意 | SQLite のパス。省略時は `/data` があれば `/data/app.db`、なければ `./app.db` |
| `PORT` | 任意 | fly.toml で 8000 を指定（Dockerfile の CMD も 8000） |

シークレットは **fly.toml や Dockerfile に直接書かず**、Fly.io の secrets に登録します。

```bash
cd switchbot-dashboard
fly secrets set SWITCHBOT_TOKEN='...' SWITCHBOT_SECRET='...'
fly secrets set BACKUP_TOKEN="$(openssl rand -hex 32)"   # ランダムな値を生成して登録
fly secrets list                                          # 登録済みキーの確認（値は表示されない）
```

> `fly secrets set` を実行するとアプリが再起動（再デプロイ）されます。デプロイ前にまとめて登録したい場合は
> `fly secrets set --stage KEY=VALUE` とし、次回の `fly deploy` で反映させることもできます。

## ローカルでの起動

```bash
cd switchbot-dashboard/switchbot-backend
poetry install
cp .env.example .env            # 値を編集（SwitchBot 認証情報が無くても起動はできる）
ln -s ../switchbot-frontend static   # フロントエンドを / で配信するためのリンク（初回のみ）
poetry run fastapi dev app/main.py   # http://localhost:8000
```

- `static/` の有無は起動時に判定されるため、リンクを作ったら再起動してください。
- SwitchBot 認証情報が無い場合は `POST /api/import` でダミーデータを投入すると画面を確認できます。
- テスト: `poetry run pytest`

### Docker で起動

```bash
cd switchbot-dashboard
docker build -t temp-master .
docker run --rm -p 8000:8000 -e BACKUP_TOKEN=dev-token temp-master
```

コンテナは `appuser`（非 root）で動きます。`/data` をボリュームとしてマウントした場合、起動時に
`docker-entrypoint.sh` が所有者を `appuser` に揃えてから `setpriv` で権限を落とします。

## デプロイ（Fly.io）

- `main` ブランチへ push すると `.github/workflows/deploy.yml` が `switchbot-dashboard/**` の変更を検知し、
  `flyctl deploy --remote-only` でデプロイします（GitHub Secrets に `FLY_API_TOKEN` が必要）。
- 手動デプロイ: `cd switchbot-dashboard && fly deploy --remote-only`
- `fly.toml` の `[[http_service.checks]]` が `GET /healthz` を 30 秒ごとに監視し、失敗したマシンにはリクエストを流しません。

### メモリを 512MB にしている理由

`fly.toml` の `memory_mb` は 256 → 512 に引き上げています。

- FastAPI + uvicorn + aiosqlite の常駐メモリはアイドル時でも 60〜80MB 程度あり、256MB では余裕が小さい。
- `DataStore.history` がデバイスごとの読み取り履歴を**メモリ上にも**保持し、上限は 262,800 件/台（`max_readings`）。
  pydantic オブジェクトとして数百バイト/件のため、1 台でも長期稼働で 100MB 超になり得る。
- `/api/backup` の `VACUUM INTO` が、一時的に DB と同程度のディスク/ページキャッシュを使う。

Fly.io の shared-cpu-1x は 256MB → 512MB で月額が少し上がります（最新の料金は Fly.io の Pricing を参照）。

## バックアップ

`GET /api/backup` は稼働中の DB ファイルをそのまま返すのではなく、SQLite の `VACUUM INTO` で
**整合性の取れたスナップショット**を一時ファイルに作ってから返し、送信後に削除します。

### 手元へのバックアップ（`backup_database.sh`）

```bash
cd switchbot-dashboard
export BACKUP_TOKEN='fly secrets set した値と同じもの'
./backup_database.sh                        # 1 回だけ
./backup_database.sh --loop                 # 1 時間ごと
./backup_database.sh --loop --interval 1800 # 30 分ごと
```

- `BACKUP_TOKEN` が未設定だとスクリプトはエラー終了します。
- 保存先は `~/switchbot_backups/`（`BACKUP_DIR` で変更可）。ファイル名は `switchbot_backup_YYYYMMDD_HHMMSS.db`。
- curl には `--fail --connect-timeout 10 --max-time 300` を付け、途中失敗時に壊れたファイルを残しません（`.partial` に書いてから改名）。
- **世代管理（GFS 方式）**: 最新 30 件 + 日次 7 日（各日 1 件）+ 週次 4 週（各 ISO 週 1 件）を保持し、それ以外を削除します。
  `KEEP_LATEST` / `KEEP_DAILY` / `KEEP_WEEKLY` で変更できます。macOS 標準の bash 3.2 でも動作します。

### 手動で 1 回だけ取る

```bash
curl --fail -H "Authorization: Bearer $BACKUP_TOKEN" -o backup.db https://temp-master.fly.dev/api/backup
```

画面右上の **Download Backup** ボタンからも取得できます（トークン入力を求められます）。

### 復元

取得した `.db` を Fly.io のボリューム上の `/data/app.db` に置き換えて再起動します（例: `fly ssh sftp shell` でアップロード）。
復元前に現行 DB のバックアップを取っておいてください。
