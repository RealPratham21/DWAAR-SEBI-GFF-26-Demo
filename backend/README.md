# Dwaar API

FastAPI backend skeleton for the Dwaar DRHP preparation platform.

## Requirements

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)

## Setup

```bash
cd backend
cp .env.example .env
uv sync
```

## Run the API

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive docs:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI schema: http://localhost:8000/openapi.json

## Health endpoints

- `GET /health/live` — liveness probe
- `GET /api/v1/health` — service health metadata

## Development commands

```bash
uv sync
uv run pytest
uv run ruff check .
uv run ruff format .
```

## Configuration

Environment variables are loaded from `.env` when present. See `.env.example` for supported settings.
