"""Issuer-aware export filenames (G7)."""

from __future__ import annotations

import re
from datetime import UTC, datetime

_FILENAME_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename_part(value: str, *, fallback: str = "Issuer") -> str:
    cleaned = value.strip().replace("&", "and")
    cleaned = _FILENAME_SAFE.sub("_", cleaned)
    cleaned = cleaned.strip("._")
    return cleaned or fallback


def issuer_prefix(issuer_name: str) -> str:
    return sanitize_filename_part(issuer_name, fallback="Issuer")


def dated_suffix() -> str:
    return datetime.now(tz=UTC).strftime("%Y-%m-%d")
