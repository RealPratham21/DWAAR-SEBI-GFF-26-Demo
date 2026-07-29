"""Derive section progress from saved workspace payload."""

from typing import Any, Literal

from app.modules.company_incorporation.validation import (
    constitutional_has_meaningful_data,
    identity_has_meaningful_data,
    is_confirmations_complete,
    is_constitutional_complete,
    is_corporate_history_complete,
    is_identity_complete,
    is_offices_complete,
    is_registrations_complete,
)

SectionStatus = Literal["not_started", "in_progress", "complete"]
OverallStatus = Literal["not_started", "in_progress", "complete"]

SECTION_IDS = (
    "legal-identity",
    "corporate-history",
    "offices-contact",
    "constitutional-documents",
    "core-registrations",
    "issuer-confirmations",
)

TOTAL_SECTIONS = len(SECTION_IDS)


def _section_status(*, complete: bool, meaningful: bool) -> SectionStatus:
    if complete:
        return "complete"
    if meaningful:
        return "in_progress"
    return "not_started"


def calculate_section_progress(payload: dict[str, Any]) -> dict[str, SectionStatus]:
    identity = payload.get("identity") or {}
    events = payload.get("corporateEvents") or []
    offices = payload.get("offices") or []
    record = payload.get("constitutionalRecord") or {}
    amendments = payload.get("constitutionalAmendments") or []
    registrations = payload.get("registrations") or []
    confirmations = payload.get("confirmations") or {}

    return {
        "legal-identity": _section_status(
            complete=is_identity_complete(identity),
            meaningful=identity_has_meaningful_data(identity),
        ),
        "corporate-history": _section_status(
            complete=is_corporate_history_complete(events),
            meaningful=len(events) > 0,
        ),
        "offices-contact": _section_status(
            complete=is_offices_complete(offices),
            meaningful=len(offices) > 0,
        ),
        "constitutional-documents": _section_status(
            complete=is_constitutional_complete(record, amendments),
            meaningful=constitutional_has_meaningful_data(record, amendments),
        ),
        "core-registrations": _section_status(
            complete=is_registrations_complete(registrations),
            meaningful=len(registrations) > 0,
        ),
        "issuer-confirmations": _section_status(
            complete=is_confirmations_complete(confirmations),
            meaningful=any(value is True for value in confirmations.values()),
        ),
    }


def calculate_overall_status(section_progress: dict[str, SectionStatus]) -> OverallStatus:
    statuses = list(section_progress.values())
    if all(status == "complete" for status in statuses):
        return "complete"
    if all(status == "not_started" for status in statuses):
        return "not_started"
    return "in_progress"


def calculate_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = calculate_section_progress(payload)
    sections_complete = sum(1 for status in sections.values() if status == "complete")
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": TOTAL_SECTIONS,
        "overallStatus": calculate_overall_status(sections),
    }
