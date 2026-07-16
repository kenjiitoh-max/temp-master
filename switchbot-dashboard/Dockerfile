# ---------------------------------------------------------------------------
# Stage 1: build the React (Vite) frontend into static assets.
# ---------------------------------------------------------------------------
FROM node:20-slim AS frontend-build
WORKDIR /frontend

# Install dependencies first for better layer caching.
COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci

# Build the SPA (outputs to /frontend/dist).
COPY switchbot-frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: backend (serves the built frontend static files).
# ---------------------------------------------------------------------------
FROM python:3.12-slim
WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy and install backend dependencies
COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi

# Copy backend application code
COPY switchbot-backend/app/ ./app/

# Copy the built frontend from stage 1: served at /
COPY --from=frontend-build /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
