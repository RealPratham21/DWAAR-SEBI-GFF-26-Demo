"""Commissioned industry report readiness evaluation (NOT persisted)."""

from __future__ import annotations

from typing import Any


def evaluate_commissioned_report_readiness(source: dict[str, Any]) -> dict[str, Any]:
    """Review commissioned-report governance fields for IPO readiness."""
    if source.get("sourceType") != "commissioned-industry-report":
        return {
            "isCommissionedReport": False,
            "ready": True,
            "flags": [],
            "missingFields": [],
        }

    details = source.get("commissionedReportDetails") or {}
    flags: list[str] = []
    missing: list[str] = []

    required_text_fields = (
        ("researchProvider", "Research provider"),
        ("whoPaid", "Who paid"),
        ("consentNoObjectionStatus", "Consent / no-objection status"),
        ("publicAvailabilityStatus", "Public availability status"),
    )
    for field, label in required_text_fields:
        if not str(details.get(field) or "").strip():
            missing.append(label)

    required_ynns = (
        ("commissionedByIssuer", "Commissioned by issuer"),
        ("independenceConfirmed", "Independence confirmed"),
        ("providerDisclaimerCaptured", "Provider disclaimer captured"),
    )
    for field, label in required_ynns:
        if str(details.get(field) or "").strip() == "":
            missing.append(label)

    if details.get("independenceConfirmed") == "no":
        flags.append("Independence not confirmed.")
    if details.get("independenceConfirmed") == "not_sure":
        flags.append("Independence confirmation pending.")
    if not str(details.get("consentNoObjectionStatus") or "").strip():
        flags.append("Consent / no-objection status not recorded.")
    if details.get("includedProposedAsMaterialDocument") == "not_sure":
        flags.append("Material document inclusion requires confirmation.")

    ready = len(flags) == 0 and len(missing) == 0

    return {
        "isCommissionedReport": True,
        "ready": ready,
        "flags": flags,
        "missingFields": missing,
    }


def evaluate_all_commissioned_reports(payload: dict[str, Any]) -> list[dict[str, Any]]:
    from app.modules.industry_market.sources import get_sources

    results: list[dict[str, Any]] = []
    for source in get_sources(payload):
        if source.get("sourceType") == "commissioned-industry-report":
            results.append(
                {
                    "sourceId": source.get("id"),
                    "title": source.get("title") or source.get("id"),
                    **evaluate_commissioned_report_readiness(source),
                },
            )
    return results
