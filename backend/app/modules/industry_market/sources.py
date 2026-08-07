"""Source Registry helpers and freshness rules for Industry & Market."""

from __future__ import annotations

import re
from datetime import date
from typing import Any

from app.modules.industry_market.constants import (
    SOURCE_FRESHNESS_RULES_AS_OF,
    SOURCE_FRESHNESS_RULES_VERSION,
)

_STALE_THRESHOLD_MONTHS = 24
_VERY_STALE_THRESHOLD_MONTHS = 36
_DATE_PATTERNS = (
    re.compile(r"^(\d{4})-(\d{2})-(\d{2})$"),
    re.compile(r"^(\d{2})[/-](\d{2})[/-](\d{4})$"),
    re.compile(r"^(\d{4})$"),
)


def get_sources(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("researchSourcesAndIndustryReportGovernance") or {}
    return [s for s in (section.get("sources") or []) if isinstance(s, dict)]


def get_source_by_id(payload: dict[str, Any], source_id: str) -> dict[str, Any] | None:
    if not str(source_id or "").strip():
        return None
    for source in get_sources(payload):
        if source.get("id") == source_id:
            return source
    return None


def format_source_label(source: dict[str, Any]) -> str:
    title = str(source.get("title") or "").strip()
    publisher = str(source.get("publisherAuthor") or "").strip()
    pub_date = str(source.get("publicationDate") or "").strip()
    if title and publisher and pub_date:
        return f"{title} — {publisher} ({pub_date})"
    if title and publisher:
        return f"{title} — {publisher}"
    if title and pub_date:
        return f"{title} ({pub_date})"
    if title:
        return title
    if publisher:
        return publisher
    return str(source.get("id") or "")


def _parse_reference_date(text: str) -> date | None:
    cleaned = str(text or "").strip()
    if not cleaned:
        return None
    for pattern in _DATE_PATTERNS:
        match = pattern.match(cleaned)
        if not match:
            continue
        groups = match.groups()
        if len(groups) == 1:
            return date(int(groups[0]), 1, 1)
        if len(groups) == 3 and len(groups[0]) == 4:
            return date(int(groups[0]), int(groups[1]), int(groups[2]))
        if len(groups) == 3:
            return date(int(groups[2]), int(groups[1]), int(groups[0]))
    return None


def _months_between(earlier: date, later: date) -> int:
    return (later.year - earlier.year) * 12 + (later.month - earlier.month)


def get_source_freshness_rules() -> dict[str, Any]:
    return {
        "rulesVersion": SOURCE_FRESHNESS_RULES_VERSION,
        "rulesAsOf": SOURCE_FRESHNESS_RULES_AS_OF,
        "staleThresholdMonths": _STALE_THRESHOLD_MONTHS,
        "veryStaleThresholdMonths": _VERY_STALE_THRESHOLD_MONTHS,
    }


def evaluate_source_freshness(
    source: dict[str, Any],
    *,
    as_of: date | None = None,
) -> dict[str, Any]:
    """Derive freshness guidance from publication / cut-off dates (not persisted)."""
    reference = _parse_reference_date(str(source.get("dataCutOffDate") or ""))
    if reference is None:
        reference = _parse_reference_date(str(source.get("publicationDate") or ""))

    rules = get_source_freshness_rules()
    today = as_of or date.fromisoformat(SOURCE_FRESHNESS_RULES_AS_OF)

    if reference is None:
        return {
            **rules,
            "referenceDate": "",
            "ageMonths": None,
            "suggestedReadinessStatus": "pending_verification",
            "flags": ["Publication or data cut-off date missing."],
        }

    age_months = _months_between(reference, today)
    flags: list[str] = []
    suggested = "current"

    if age_months >= _VERY_STALE_THRESHOLD_MONTHS:
        suggested = "potentially_stale"
        flags.append(
            f"Source reference date is {age_months} months old — may be stale for IPO use.",
        )
    elif age_months >= _STALE_THRESHOLD_MONTHS:
        suggested = "pending_verification"
        flags.append(
            f"Source reference date is {age_months} months old — verify freshness.",
        )

    if not str(source.get("publicationDate") or "").strip():
        flags.append("Publication date not recorded.")
    if not str(source.get("dataCutOffDate") or "").strip():
        flags.append("Data cut-off date not recorded.")

    recorded = str(source.get("sourceReadinessStatus") or "").strip()
    if recorded == "superseded":
        suggested = "superseded"
    elif recorded == "professional_confirmation_required":
        suggested = "professional_confirmation_required"

    return {
        **rules,
        "referenceDate": reference.isoformat(),
        "ageMonths": age_months,
        "suggestedReadinessStatus": suggested,
        "flags": flags,
    }


def evaluate_all_source_freshness(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {"sourceId": source.get("id"), **evaluate_source_freshness(source)}
        for source in get_sources(payload)
    ]
