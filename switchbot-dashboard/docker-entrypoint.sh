#!/bin/sh
# コンテナ起動時のエントリポイント。
# Fly.io のボリューム(/data)は root 所有でマウントされるため、root のまま所有者を appuser に揃えてから
# setpriv で権限を落としてアプリを起動する。すでに非 root で起動された場合はそのまま実行する。
set -eu

if [ "$(id -u)" = "0" ]; then
    if [ -d /data ]; then
        chown -R appuser:appuser /data || echo "warning: could not chown /data" >&2
    fi
    exec setpriv --reuid=appuser --regid=appuser --init-groups "$@"
fi

exec "$@"
