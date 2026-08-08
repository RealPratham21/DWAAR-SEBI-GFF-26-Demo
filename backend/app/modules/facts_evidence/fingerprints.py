"""Deterministic fact fingerprints for G5."""

from __future__ import annotations

import hashlib


def build_fact_fingerprint(
    *,
    workstream_key: str,
    section_key: str = "",
    record_id: str = "",
    field_path: str,
    reporting_period: str = "",
) -> str:
    raw = "|".join(
        [
            workstream_key.strip(),
            section_key.strip(),
            record_id.strip(),
            field_path.strip(),
            reporting_period.strip(),
        ]
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
