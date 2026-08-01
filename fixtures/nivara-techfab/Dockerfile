FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY fixtures/nivara-techfab /workspace/fixtures/nivara-techfab
COPY backend /workspace/backend

WORKDIR /workspace/fixtures/nivara-techfab
RUN pip install --upgrade pip && pip install .

CMD ["sh", "-c", "python scripts/generate_documents.py && python scripts/generate_quality_variants.py && python scripts/validate_fixture.py"]
