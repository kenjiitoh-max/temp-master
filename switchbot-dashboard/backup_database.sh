#!/bin/bash

# Temp Master Dashboard データベースバックアップスクリプト
# デプロイ済みバックエンドの /api/backup から SQLite スナップショットをダウンロードし、
# ローカルに世代管理しながら保存する。
#
# 使い方:
#   ./backup_database.sh                          # 1回だけ実行
#   ./backup_database.sh --loop                   # 1時間ごとに繰り返し実行
#   ./backup_database.sh --loop --interval 1800   # 30分(1800秒)ごとに実行
#
# 環境変数:
#   BACKUP_TOKEN           (必須) サーバー側 `fly secrets set BACKUP_TOKEN=...` と同じ値
#   SWITCHBOT_BACKEND_URL  バックエンドURL (既定: https://temp-master.fly.dev)
#   BACKUP_DIR             保存先ディレクトリ (既定: ~/switchbot_backups)
#
# 世代管理 (GFS 方式):
#   - 最新 KEEP_LATEST 件 (既定 30) は無条件で保持
#   - 日次: 直近 KEEP_DAILY 日 (既定 7) について、各日の最新 1 件を保持
#   - 週次: 直近 KEEP_WEEKLY 週 (既定 4) について、各週 (ISO 週) の最新 1 件を保持
#   上記のいずれにも該当しないファイルを削除する。
#   ※ macOS 標準の bash 3.2 でも動くよう、連想配列は使っていない。

BACKEND_URL="${SWITCHBOT_BACKEND_URL:-https://temp-master.fly.dev}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/switchbot_backups}"
KEEP_LATEST="${KEEP_LATEST:-30}"
KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"   # 接続確立までの最大秒数
MAX_TIME="${MAX_TIME:-300}"               # ダウンロード全体の最大秒数
DEFAULT_INTERVAL=3600  # 1時間

LOOP_MODE=false
INTERVAL=$DEFAULT_INTERVAL

while [[ $# -gt 0 ]]; do
    case $1 in
        --loop)
            LOOP_MODE=true
            shift
            ;;
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        --help)
            echo "Temp Master Dashboard Database Backup Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --loop              Run continuously instead of once"
            echo "  --interval SECONDS  Interval between backups in loop mode (default: 3600)"
            echo "  --help              Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  BACKUP_TOKEN           (required) Bearer token for /api/backup (same as 'fly secrets set BACKUP_TOKEN=...')"
            echo "  SWITCHBOT_BACKEND_URL  Backend URL (default: https://temp-master.fly.dev)"
            echo "  BACKUP_DIR             Backup directory (default: ~/switchbot_backups)"
            echo "  KEEP_LATEST            Always keep the newest N backups (default: 30)"
            echo "  KEEP_DAILY             Keep one backup per day for N days (default: 7)"
            echo "  KEEP_WEEKLY            Keep one backup per ISO week for N weeks (default: 4)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ -z "${BACKUP_TOKEN:-}" ]; then
    echo "Error: BACKUP_TOKEN is not set." >&2
    echo "  /api/backup requires a token. Set the same value as the server:" >&2
    echo "    export BACKUP_TOKEN='...'   # same as: fly secrets set BACKUP_TOKEN=..." >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# YYYYMMDD → ISO 週キー (例: 2026-W44)。GNU date と BSD(macOS) date の両方に対応。
iso_week_of() {
    local ymd="$1"
    date -d "$ymd" +%G-W%V 2>/dev/null || date -j -f "%Y%m%d" "$ymd" +%G-W%V 2>/dev/null || echo "$ymd"
}

# 世代管理: 保持対象に該当しないファイルを削除する
prune_backups() {
    local kept_days=" "
    local kept_weeks=" "
    local day_count=0
    local week_count=0
    local index=0
    local deleted=0
    local file name ymd week keep

    # ファイル名 switchbot_backup_YYYYMMDD_HHMMSS.db は辞書順 = 時系列なので、逆順ソートで新しい順になる
    while IFS= read -r file; do
        [ -n "$file" ] || continue
        name=$(basename "$file")
        ymd=${name#switchbot_backup_}
        ymd=${ymd%%_*}
        keep=false

        if [ "$index" -lt "$KEEP_LATEST" ]; then
            keep=true
        fi

        case "$kept_days" in
            *" $ymd "*) ;;  # この日の最新は保持済み
            *)
                if [ "$day_count" -lt "$KEEP_DAILY" ]; then
                    kept_days="$kept_days$ymd "
                    day_count=$((day_count + 1))
                    keep=true
                fi
                ;;
        esac

        week=$(iso_week_of "$ymd")
        case "$kept_weeks" in
            *" $week "*) ;;  # この週の最新は保持済み
            *)
                if [ "$week_count" -lt "$KEEP_WEEKLY" ]; then
                    kept_weeks="$kept_weeks$week "
                    week_count=$((week_count + 1))
                    keep=true
                fi
                ;;
        esac

        if [ "$keep" = false ]; then
            rm -f "$file"
            deleted=$((deleted + 1))
        fi
        index=$((index + 1))
    done < <(ls -1 "$BACKUP_DIR"/switchbot_backup_*.db 2>/dev/null | sort -r)

    if [ "$deleted" -gt 0 ]; then
        log "Pruned $deleted old backup(s) (keep: latest $KEEP_LATEST, daily $KEEP_DAILY, weekly $KEEP_WEEKLY)"
    fi
}

backup_database() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/switchbot_backup_${timestamp}.db"
    local tmp_file="${backup_file}.partial"
    local http_code curl_status

    log "Starting backup..."

    # --fail: 4xx/5xx をエラー扱い（本文を保存しない）  --connect-timeout/--max-time: ハング防止
    # 一旦 .partial に書き、成功したときだけ正式名にリネームする（壊れたファイルを残さない）
    http_code=$(curl -sS --fail \
        --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
        -H "Authorization: Bearer $BACKUP_TOKEN" \
        -w "%{http_code}" -o "$tmp_file" \
        "$BACKEND_URL/api/backup")
    curl_status=$?

    if [ "$curl_status" -ne 0 ]; then
        rm -f "$tmp_file"
        case "$http_code" in
            401) log "Backup failed: 401 Unauthorized (BACKUP_TOKEN does not match the server)" ;;
            404) log "Backup failed: 404 Not Found (backup is disabled on the server: BACKUP_TOKEN not set, or wrong URL)" ;;
            *)   log "Backup failed: curl exit $curl_status (HTTP ${http_code:-n/a})" ;;
        esac
        return 1
    fi

    # SQLite ファイルかどうかをマジックヘッダで確認する
    if [ "$(head -c 15 "$tmp_file" 2>/dev/null)" != "SQLite format 3" ]; then
        rm -f "$tmp_file"
        log "Backup failed: response is not a SQLite database"
        return 1
    fi

    mv "$tmp_file" "$backup_file"
    local file_size
    file_size=$(ls -lh "$backup_file" | awk '{print $5}')
    log "Backup successful: $backup_file ($file_size)"

    prune_backups
    return 0
}

echo "Temp Master Dashboard Database Backup"
echo "====================================="
echo "Backend URL: $BACKEND_URL"
echo "Backup directory: $BACKUP_DIR"
echo "Retention: latest $KEEP_LATEST / daily $KEEP_DAILY days / weekly $KEEP_WEEKLY weeks"
echo ""

if [ "$LOOP_MODE" = true ]; then
    echo "Running in loop mode with ${INTERVAL}s interval"
    echo "Press Ctrl+C to stop"
    echo ""

    while true; do
        backup_database
        log "Next backup in ${INTERVAL} seconds..."
        sleep "$INTERVAL"
    done
else
    backup_database
fi
