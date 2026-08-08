# Production image for API and document-worker (Railway).
# Local development continues to use Dockerfile.dev.

FROM python:3.12-slim-bookworm AS base

COPY --from=ghcr.io/astral-sh/uv:0.6.17 /uv /usr/local/bin/uv

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    fonts-dejavu-core \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Dependency layer (cached unless lock/project metadata changes).
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --locked --no-dev --no-install-project

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY scripts/verify_s3_configuration.py ./scripts/verify_s3_configuration.py

RUN uv sync --locked --no-dev \
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin dwaar \
    && chown -R dwaar:dwaar /app /opt/venv \
    && chmod 1777 /tmp

USER dwaar

EXPOSE 8000

# Default: API. Railway overrides CMD for the worker service.
# Use --no-dev so `uv run` does not pull development dependency groups.
CMD ["sh", "-c", "exec uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
