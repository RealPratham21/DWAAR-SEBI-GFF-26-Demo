"""Claims Register helpers — derived status and unsupported wording detection."""

from __future__ import annotations

import re
from typing import Any

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.sources import get_source_by_id

_UNSUPPORTED_WORDING_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bmarket leader\b", re.I), "market leader"),
    (re.compile(r"\blargest\b", re.I), "largest"),
    (re.compile(r"\bfastest[- ]growing\b", re.I), "fastest-growing"),
    (re.compile(r"\bleading\b", re.I), "leading"),
    (re.compile(r"\btop\s+\d+\b", re.I), "top X"),
    (re.compile(r"\bonly player\b", re.I), "only player"),
    (re.compile(r"\bonly\b", re.I), "only"),
    (re.compile(r"\b\d+(\.\d+)?%\s*market share\b", re.I), "explicit market-share percentage"),
]


def detect_unsupported_claim_wording(text: str) -> list[str]:
    if not str(text or "").strip():
        return []
    detected: list[str] = []
    for pattern, label in _UNSUPPORTED_WORDING_PATTERNS:
        if pattern.search(text):
            detected.append(label)
    return list(dict.fromkeys(detected))


def _has_required_substantiation_fields(claim: dict[str, Any]) -> bool:
    return all(
        str(claim.get(field) or "").strip() != ""
        for field in (
            "metric",
            "geography",
            "marketDefinition",
            "periodDate",
            "comparatorUniverse",
        )
    )


def derive_claim_status(claim: dict[str, Any], payload: dict[str, Any]) -> str:
    wording_flags = detect_unsupported_claim_wording(str(claim.get("exactProposedWording") or ""))
    source_id = str(claim.get("sourceId") or "").strip()
    source = get_source_by_id(payload, source_id)

    if claim.get("conflictingSourceExists") == "yes":
        return "contradictory_sources"

    if not source_id:
        if wording_flags or claim.get("claimType") != "other":
            return "do_not_use"
        return "insufficient_source"

    if source is None:
        return "insufficient_source"

    readiness = str(source.get("sourceReadinessStatus") or "")
    if readiness in ("potentially_stale", "superseded") or claim.get("currentFreshEnough") == "no":
        return "stale_source"

    if readiness == "professional_confirmation_required":
        return "professional_confirmation_required"

    if source.get("sourceType") == "commissioned-industry-report":
        commissioned = source.get("commissionedReportDetails") or {}
        if (
            commissioned.get("independenceConfirmed") != "yes"
            or not str(commissioned.get("consentNoObjectionStatus") or "").strip()
        ):
            return "professional_confirmation_required"

    if wording_flags and not _has_required_substantiation_fields(claim):
        return "do_not_use"

    substantiation_complete = _has_required_substantiation_fields(claim) and (
        str(claim.get("calculation") or "").strip() != ""
        or dm.is_filled(claim.get("metric"))
    )

    if substantiation_complete and source_id:
        if claim.get("independentSource") == "yes" or claim.get("commissionedReportSource") == "no":
            return "substantiated"
        return "potentially_substantiated"

    if source_id:
        return "potentially_substantiated"

    return "insufficient_source"
