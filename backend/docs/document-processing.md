# Company & Incorporation document text processing

Asynchronous, durable page-level text extraction for uploaded documents.

## Architecture

| Process | Role |
| --- | --- |
| `backend` | FastAPI API — finalization queues a processing run and returns immediately |
| `document-worker` | Long-running worker using the same image/code — claims jobs from PostgreSQL |

Shared resources: PostgreSQL, MinIO, backend models/services, environment variables.

## Lifecycle

1. Upload finalize validates the MinIO object.
2. Version status becomes `pending_processing`.
3. A `document_processing_runs` row is created with status `queued` in the same transaction.
4. API returns the upload acknowledgement immediately.
5. Worker claims the run (`FOR UPDATE SKIP LOCKED`), downloads the object, extracts text, persists pages, and marks the run completed / failed.

Upload success does not depend on processing success.

## Developer commands

```bash
# Migrate
docker compose run --rm migrate

# Start API + worker + Postgres + MinIO
docker compose up -d db minio minio-init migrate backend document-worker

# Worker logs
docker compose logs -f document-worker

# Unit / API tests
docker compose exec backend uv run pytest tests/test_document_processing_heuristic.py tests/test_document_processing_api.py -q

# Fixture integration tests (requires generated Nivara artifacts)
docker compose --profile fixtures run --rm fixture-generator
docker compose exec backend uv run pytest tests/test_document_processing_fixtures.py -q

# Retry processing for a version
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/workstreams/company-incorporation/documents/versions/$VERSION_ID/processing/retry
```

## Configurable limits

| Env var | Default | Purpose |
| --- | --- | --- |
| `DOC_PROCESSING_POLL_INTERVAL_SECONDS` | 2 | Worker idle poll |
| `DOC_PROCESSING_MAX_ATTEMPTS` | 3 | Automatic retries before final failure |
| `DOC_PROCESSING_TIMEOUT_SECONDS` | 300 | Soft processing budget |
| `DOC_PROCESSING_STALE_HEARTBEAT_SECONDS` | 90 | Recover abandoned jobs |
| `DOC_PROCESSING_MAX_PAGES` | 50 | Page cap |
| `DOC_PROCESSING_OCR_DPI` | 280 | PDF rasterisation for OCR |
| `DOC_PROCESSING_MAX_IMAGE_PIXELS` | 40_000_000 | Decompression-bomb guard |

Expected resource usage: OCR-heavy jobs may use several hundred MB RAM and noticeable CPU for a few seconds per scanned page. Keep `DOC_PROCESSING_MAX_PAGES` and OCR DPI conservative in shared environments.

## APIs

All endpoints require authentication and workspace ownership:

- `GET /versions/{id}/processing` — status summary
- `GET /versions/{id}/processing/history` — runs newest first
- `GET /versions/{id}/processing/pages` — page text/blocks
- `POST /versions/{id}/processing/retry` — queue a new run

## Out of scope (this increment)

LLM calls, structured fact extraction, Facts & Evidence, Questions & Conflicts, frontend processing UI.
