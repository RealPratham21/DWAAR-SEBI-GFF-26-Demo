"""Input fingerprinting for structured extraction idempotency."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.modules.company_incorporation.structured_extraction.types import PageBlockIndex


def compute_input_fingerprint(
    *,
    document_checksum: str,
    document_version_id: str,
    processing_run_id: str,
    processor_version: str,
    output_schema_version: int | str,
    block_index: PageBlockIndex,
    extractor_version: str,
    fact_schema_version: str,
    prompt_version: str,
    provider: str | None,
    model_name: str | None,
    comparison_version: str | None = None,
) -> str:
    """Return SHA-256 hex digest of structured extraction inputs."""

    payload: dict[str, Any] = {
        "document_checksum": document_checksum,
        "document_version_id": document_version_id,
        "processing_run_id": processing_run_id,
        "processor_version": processor_version,
        "output_schema_version": output_schema_version,
        "page_text_hashes": [block_index.page_text_hash(page) for page in block_index.pages],
        "block_hashes": [
            {
                "block_id": block.block_id,
                "text_hash": block_index.block_text_hash(block),
            }
            for page in block_index.pages
            for block in page.blocks
        ],
        "extractor_version": extractor_version,
        "fact_schema_version": fact_schema_version,
        "prompt_version": prompt_version,
        "comparison_version": comparison_version or "",
        "provider": provider or "",
        "model_name": model_name or "",
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()
