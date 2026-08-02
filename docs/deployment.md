# Deployment guide (Vercel + Railway)

This repository is prepared for:

- Next.js frontend on **Vercel**
- FastAPI API on **Railway**
- Document-processing worker on **Railway** (same image, different command)
- Railway PostgreSQL
- Railway private S3-compatible Storage Bucket
- GitHub Actions CI

This document covers **manual first-time setup**. Do not place secrets in source control.

> Railway Bucket CORS, cross-site refresh cookies, and worker memory are only fully proven after a real cloud smoke test. Treat the first production deploy as validation, not as already proven.

## Release order

1. PostgreSQL
2. Storage Bucket (+ CORS)
3. API pre-deploy migration + API deploy
4. API health verification (`GET /health/live`, `GET /health/ready`)
5. Worker deploy
6. Worker log verification (startup + idle poll)
7. Vercel frontend
8. Full cloud smoke test ([checklist](./cloud-smoke-checklist.md))

API and worker are **separate Railway services** and must not be assumed to deploy atomically.

## Migration ownership

| Process | Runs Alembic? |
| --- | --- |
| API pre-deploy command | **Yes** — `uv run --no-dev alembic upgrade head` |
| API runtime start | **No** |
| Worker | **Never** |

- Migration failure must prevent the new API deployment from becoming active (Railway pre-deploy / release command).
- Application startup must not silently create tables.
- Do **not** run fixture seeding in production.

## Railway project

Create:

1. PostgreSQL plugin/service (private networking)
2. Storage Bucket (private)
3. API service (public domain)
4. Worker service (no public domain)

### PostgreSQL

- Use the private connection URL / Railway reference variable as `DATABASE_URL`.
- The app normalises `postgresql://` and `postgres://` to `postgresql+psycopg://`.
- Do not expose PostgreSQL publicly.
- Do not seed Nivara fixtures in production.

### Storage Bucket

Map Railway Bucket credentials to existing env names:

| App env | Typical Railway reference |
| --- | --- |
| `S3_ENDPOINT` | Bucket endpoint (internal / service) |
| `S3_PUBLIC_ENDPOINT` | Browser-reachable endpoint (often the same public HTTPS endpoint) |
| `S3_ACCESS_KEY` | Access key id |
| `S3_SECRET_KEY` | Secret access key |
| `S3_BUCKET` | Bucket name |
| `S3_REGION` | Region |
| `S3_SECURE=true` | Always in production |
| `S3_ADDRESSING_STYLE=virtual` | Prefer `virtual` for Railway Bucket; use `path` only if verification requires it |

Requirements:

- Do not create the bucket from the app.
- Do not make the bucket public.
- Do not run `minio-init` in production (MinIO remains local-only).
- Preserve ID-based object keys and short-lived browser → bucket presigned PUT/GET.

CORS template (exact production Vercel origin only): see [`infra/railway/bucket-cors.example.xml`](../infra/railway/bucket-cors.example.xml).

One-off verification (from a machine with env loaded; not on startup):

```bash
cd backend
uv run python scripts/verify_s3_configuration.py
```

### API service

- **Root / build context:** `backend`
- **Dockerfile:** `backend/Dockerfile` (production)
- **Public domain:** yes (Railway provided `*.up.railway.app` or custom)
- **Start command** (default image CMD is fine):

  ```bash
  uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'
  ```

- **Pre-deploy / release command:**

  ```bash
  uv run --no-dev alembic upgrade head
  ```

- **Healthcheck path:** `/health/live` (readiness: `/health/ready`)
- **Env:** copy from [`deploy/railway-api.env.example`](../deploy/railway-api.env.example)
- Prefer Railway **variable references** for `DATABASE_URL` and `S3_*` instead of manually copied secrets.

### Worker service

- Same image / same `backend` Dockerfile
- **Start command:**

  ```bash
  uv run --no-dev python -m app.modules.company_incorporation.document_processing.worker
  ```

- **No public domain**
- **Replicas:** 1
- **Restart policy:** always / on failure
- **Memory:** start ≈ **1–1.5 GB**; increase only after observing real OCR usage
- **One concurrent job** (existing worker behaviour)
- **Env:** [`deploy/railway-worker.env.example`](../deploy/railway-worker.env.example)
- File heartbeat is optional (`DOC_PROCESSING_WRITE_HEARTBEAT_FILE=false` on Railway). Platform health must not depend on `/tmp` heartbeat files.

## Vercel frontend

- **Root:** `frontend`
- **Public env:** `NEXT_PUBLIC_API_BASE_URL=https://<api>.up.railway.app/api/v1`
- Example: [`frontend/.env.production.example`](../frontend/.env.production.example)
- Copy the exact production frontend origin into API `FRONTEND_ORIGINS`
- Do **not** put JWT, database, S3, or Cohere secrets in Vercel
- Do **not** automatically allow every `*.vercel.app` preview

Cross-site auth (Vercel → Railway) requires:

- `REFRESH_COOKIE_SECURE=true`
- `REFRESH_COOKIE_SAMESITE=none`
- `HttpOnly` refresh cookie (unchanged)
- CORS `allow_credentials=true` with exact origins

A shared custom domain can later allow a same-site cookie setup; it is **not** required for this deployment.

## Local production smoke stack

Separate from the development Compose stack:

```bash
# Build production image + start Postgres, MinIO, migrate, API, worker
# Host ports: API 8001, Postgres 5433, MinIO 9002/9003 (avoid clashing with compose.yaml)
docker compose -f compose.production-smoke.yaml up --build -d

# Health
curl -fsS http://localhost:8001/health/live
curl -fsS http://localhost:8001/health/ready

# Optional: process a Nivara fixture through the running smoke API/worker
# (use existing ingest scripts against localhost:8001 with STRUCTURED_EXTRACTION as needed)

# Stop and remove volumes
docker compose -f compose.production-smoke.yaml down -v
```

Development continues to use `compose.yaml` + `Dockerfile.dev` (reload + bind mounts).

## Rollback

- **Railway:** redeploy the previous successful deployment for API and/or worker independently.
- **Vercel:** promote / redeploy the previous production deployment.
- **Database:** schema rollback requires a deliberate down-migration or snapshot restore. Prefer additive Alembic revisions during the hackathon; avoid irreversible migrations.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) validates:

- Backend lint, format, tests (Cohere disabled / no live key)
- Alembic single head + upgrade against ephemeral Postgres
- Production Docker image build
- Frontend typecheck, lint, tests, production build

Enable Railway GitHub autodeployment only after:

1. First **manual** deployment succeeds
2. GitHub CI is green
3. Railway **Wait for CI** is enabled

Do not place production secrets in GitHub Actions.

### Live Nivara OCR/Cohere pipeline

Not run on every push. Treat as:

- Manual pre-release checklist, or
- Optional labelled PR job / future scheduled workflow

See [cloud smoke checklist](./cloud-smoke-checklist.md).
