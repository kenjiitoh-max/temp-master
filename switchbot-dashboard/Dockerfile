# syntax=docker/dockerfile:1
# Temp Master Dashboard のコンテナイメージ。
# マルチステージビルド: builder で Poetry による依存解決を行い、実行ステージには
# 仮想環境(.venv)とアプリ本体・静的ファイルだけをコピーする（Poetry やビルドキャッシュを含めない）。

# ---------- builder ステージ: 依存関係のインストール ----------
FROM python:3.12-slim AS builder
WORKDIR /app

# poetry.lock は Poetry 1.8 系で生成されているため、同系列に固定して再現性を確保する
RUN pip install --no-cache-dir "poetry==1.8.5"

COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi && \
    rm -rf /root/.cache/pypoetry

# ---------- 実行ステージ ----------
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# 非 root ユーザーを作成。/data は Fly.io のボリュームがマウントされる場所。
# 既存ボリューム上の root 所有ファイルでも書けるよう、entrypoint が起動時に所有者を揃えてから権限を落とす。
RUN groupadd --system --gid 1001 appuser && \
    useradd --system --uid 1001 --gid appuser --home-dir /app --no-create-home appuser && \
    mkdir -p /data && chown appuser:appuser /data

# builder から仮想環境のみコピー（パスを揃えないと .venv 内の shebang が壊れる）
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# アプリ本体と、/ で配信するフロントエンド静的ファイル
COPY --chown=appuser:appuser switchbot-backend/app/ ./app/
COPY --chown=appuser:appuser switchbot-frontend/ ./static/
COPY --chown=appuser:appuser docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

# slim イメージには curl が無いので Python 標準ライブラリで /healthz を叩く
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=4).status == 200 else 1)"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
