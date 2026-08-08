"""Deterministic issue fingerprints for G4."""

from __future__ import annotations

import hashlib


def build_fingerprint(
    *,
    source_kind: str,
    workstream_key: str = "",
    section_key: str = "",
    record_id: str = "",
    issue_code: str,
) -> str:
    raw = "|".join(
        [
            source_kind.strip(),
            workstream_key.strip(),
            section_key.strip(),
            record_id.strip(),
            issue_code.strip(),
        ]
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_merge_group(*parts: str) -> str:
    return "merge:" + "|".join(part.strip() for part in parts if part.strip())
