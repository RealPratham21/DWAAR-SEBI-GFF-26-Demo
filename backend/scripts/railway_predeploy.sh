#!/bin/sh
# Railway pre-deploy: run migrations using the image venv (no `uv run` sync overhead).
set -e

echo "[pre-deploy] Alembic upgrade head (venv=${UV_PROJECT_ENVIRONMENT:-/opt/venv})"
exec alembic upgrade head
