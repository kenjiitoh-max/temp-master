#!/bin/sh
set -e

# Fly.io mounts volumes owned by root. Give /data to the app user, then drop
# root privileges so the server itself never runs as root.
if [ "$(id -u)" = "0" ]; then
    mkdir -p /data
    chown -R app:app /data
    exec setpriv --reuid=app --regid=app --init-groups "$@"
fi

exec "$@"
