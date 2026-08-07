"""Matter Master helpers — single canonical matter namespace."""

from __future__ import annotations

from typing import Any

CRIMINAL_MATTER_CATEGORIES = frozenset({"criminal", "economic-offence"})
TAX_MATTER_CATEGORIES = frozenset({"tax"})


def get_matters(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("litigationAndProceedingsMaster") or {}
    return [m for m in (section.get("matters") or []) if isinstance(m, dict)]


def matter_ids(payload: dict[str, Any]) -> set[str]:
    return {str(m.get("matterId")) for m in get_matters(payload) if m.get("matterId")}


def get_matter_by_id(payload: dict[str, Any], matter_id: str) -> dict[str, Any] | None:
    if not matter_id:
        return None
    for matter in get_matters(payload):
        if matter.get("matterId") == matter_id:
            return matter
    return None


def format_matter_label(matter: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not matter:
        if fallback_id:
            return f"Unknown matter ({fallback_id[:8]})"
        return "Unknown matter"

    identity = matter.get("identity") or {}
    title = str(identity.get("matterTitle") or "").strip()
    short_name = str(identity.get("internalShortName") or "").strip()
    reference = str(identity.get("caseReferenceNumber") or "").strip()
    category = str(identity.get("category") or "").replace("-", " ")

    parts = [part for part in (title or short_name, reference, category) if part]
    if parts:
        return " — ".join(parts)
    return str(matter.get("matterId") or fallback_id)[:8]


def is_tax_matter(matter: dict[str, Any] | None) -> bool:
    if not matter:
        return False
    category = str((matter.get("identity") or {}).get("category") or "")
    return category in TAX_MATTER_CATEGORIES


def is_criminal_matter(matter: dict[str, Any] | None) -> bool:
    if not matter:
        return False
    category = str((matter.get("identity") or {}).get("category") or "")
    return category in CRIMINAL_MATTER_CATEGORIES
