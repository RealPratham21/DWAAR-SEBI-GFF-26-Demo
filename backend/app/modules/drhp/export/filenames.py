"""Deterministic export filenames."""

from __future__ import annotations

import re

from app.modules.drhp.export.document import DRHPExportDocument

_FILENAME_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename_part(value: str, *, fallback: str = "DRHP") -> str:
    cleaned = value.strip().replace("&", "and")
    cleaned = _FILENAME_SAFE.sub("_", cleaned)
    cleaned = cleaned.strip("._")
    return cleaned or fallback


def build_export_filename(document: DRHPExportDocument, *, extension: str) -> str:
    issuer = document.issuer_name or "DRHP_Draft"
    issuer_part = sanitize_filename_part(issuer, fallback="DRHP_Draft")
    version_part = f"v{document.version_number}"
    suffix = ""
    if document.is_partial:
        suffix = "_Partial"
    return f"{issuer_part}_DRHP_{version_part}{suffix}.{extension}"
