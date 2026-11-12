# Build and run backend (serves frontend static files)
FROM python:3.12-slim
WORKDIR /app

# Unprivileged user that runs the app
RUN groupadd --system app && useradd --system --gid app --home-dir /app --no-create-home app

# Install poetry
RUN pip install poetry

# Copy and install backend dependencies
COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi

# Copy backend application code
COPY switchbot-backend/app/ ./app/

# Copy frontend to root: served at /
COPY switchbot-frontend/ ./static/

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /data && chown app:app /data

EXPOSE 8000

# The entrypoint fixes ownership of the /data volume (Fly mounts it as root),
# then drops to the "app" user before starting the server.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
