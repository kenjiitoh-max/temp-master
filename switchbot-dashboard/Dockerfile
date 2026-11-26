# Stage 1: build the React frontend (Vite outputs to ../switchbot-backend/app/static)
FROM node:24-slim AS frontend
WORKDIR /build/switchbot-frontend

COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci

COPY switchbot-frontend/ ./
RUN npm run build

# Stage 2: run backend (serves the built frontend from app/static)
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

# Copy built frontend: served at /
COPY --from=frontend /build/switchbot-backend/app/static/ ./app/static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
