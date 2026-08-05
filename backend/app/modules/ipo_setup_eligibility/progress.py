"""Section progress — mirrors frontend I1 completion rules."""

from __future__ import annotations

from typing import Any

from app.modules.ipo_setup_eligibility.constants import (
    DECLARATION_FIELDS,
    ISSUER_CONFIRMATION_KEYS,
    SECTION_IDS,
    SECTION_LABELS,
)
from app.modules.ipo_setup_eligibility.offer_compute import offer_type_flags


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (int, float)):
        return True
    return True


def _details_complete(details: list[Any]) -> bool:
    if not details:
        return False
    for detail in details:
        if not isinstance(detail, dict):
            return False
        if not all(
            _filled(detail.get(key))
            for key in (
                "personOrEntityInvolved",
                "authorityOrForum",
                "currentStatus",
                "explanation",
            )
        ):
            return False
    return True


def evaluate_ipo_direction(payload: dict[str, Any]) -> str:
    d = payload.get("ipoDirection") or {}
    core = [
        d.get("preparationStage"),
        d.get("targetSmePlatform"),
        d.get("eligibilityProfile"),
        d.get("proposedOfferType"),
        d.get("proposedPricingMethod"),
        d.get("publicCompanyConversionStatus"),
    ]
    any_started = any(_filled(v) for v in core) or _filled(
        d.get("targetFilingQuarter")
    ) or _filled(d.get("targetFilingFinancialYear"))
    if not any_started:
        return "not_started"

    core_complete = all(_filled(v) for v in core)
    conversion = d.get("publicCompanyConversionStatus") or ""
    conversion_ok = True
    if conversion == "in-progress":
        conversion_ok = _filled(d.get("proposedConversionDate"))
    elif conversion == "completed":
        conversion_ok = _filled(d.get("actualConversionDate")) and _filled(
            d.get("freshCertificateOfIncorporationAvailable")
        )
    return "complete" if core_complete and conversion_ok else "in_progress"


def evaluate_offer_structure(payload: dict[str, Any]) -> str:
    o = payload.get("offerStructure") or {}
    offer_type = str((payload.get("ipoDirection") or {}).get("proposedOfferType") or "")
    includes_fresh, includes_ofs = offer_type_flags(offer_type)

    base = [
        o.get("faceValuePerEquityShare"),
        o.get("existingIssuedEquityShares"),
        o.get("existingPaidUpEquityShareCapital"),
        o.get("proposedIssuePriceStatus"),
    ]
    any_base = any(_filled(v) for v in base) or _filled(
        o.get("proposedFreshIssueShares")
    ) or _filled(o.get("proposedOfsShares"))
    if not any_base:
        return "not_started"

    complete = all(_filled(v) for v in base) and _filled(offer_type) and offer_type != "undecided"
    if o.get("proposedIssuePriceStatus") in {"indicative", "finalised-internally"}:
        complete = complete and _filled(o.get("proposedIssuePrice"))
    if includes_fresh:
        complete = (
            complete
            and _filled(o.get("proposedFreshIssueShares"))
            and _filled(o.get("proposedFreshIssueAmount"))
            and _filled(o.get("preIpoPlacementBeingConsidered"))
        )
    if includes_ofs:
        complete = (
            complete
            and _filled(o.get("proposedOfsShares"))
            and _filled(o.get("proposedOfsAmount"))
            and _filled(o.get("numberOfSellingShareholders"))
            and _filled(o.get("sellerConsentsObtained"))
        )
    return "complete" if complete else "in_progress"


def evaluate_track_record(payload: dict[str, Any]) -> str:
    t = payload.get("trackRecordAndFinancialEligibility") or {}
    if not _filled(t.get("operatingTrackRecordBasis")):
        return "not_started"

    basis = t.get("operatingTrackRecordBasis") or ""
    needs_entity = basis not in {"issuer-company", "not-yet-established", ""}
    years = t.get("financialYears") or []

    complete = (
        _filled(t.get("threeCompleteFinancialYearsAvailable"))
        and _filled(t.get("auditedRecordsAvailable"))
        and len(years) >= 3
        and all(
            isinstance(row, dict)
            and _filled(row.get("financialYearEnding"))
            and _filled(row.get("auditedStatus"))
            and _filled(row.get("sourceType"))
            for row in years[:3]
        )
    )
    if needs_entity:
        complete = (
            complete
            and _filled(t.get("trackRecordEntityName"))
            and _filled(t.get("sameLineOfBusiness"))
            and _filled(t.get("relationshipToIssuer"))
        )
    if t.get("modifiedAuditOpinionRelevantToEligibility") == "yes":
        complete = complete and _filled(t.get("modifiedAuditOpinionExplanation"))
    return "complete" if complete else "in_progress"


def evaluate_declarations(payload: dict[str, Any]) -> str:
    declarations = payload.get("eligibilityDeclarations") or {}
    answered = 0
    incomplete_yes = False
    for key, details_key in DECLARATION_FIELDS:
        answer = declarations.get(key)
        if not _filled(answer):
            continue
        answered += 1
        if answer == "yes":
            details = declarations.get(details_key) or []
            if not isinstance(details, list) or not _details_complete(details):
                incomplete_yes = True
    if answered == 0:
        return "not_started"
    if answered < len(DECLARATION_FIELDS) or incomplete_yes:
        return "in_progress"
    return "complete"


def evaluate_process_readiness(payload: dict[str, Any]) -> str:
    p = payload.get("processReadiness") or {}
    keys = [
        "boardApprovalStatus",
        "shareholderApprovalStatus",
        "existingSharesFullyDematerialised",
        "isinAllotted",
        "leadManagerAppointmentStatus",
        "registrarAppointmentStatus",
        "inPrincipleApplicationStatus",
    ]
    answered = sum(1 for key in keys if _filled(p.get(key)))
    if answered == 0:
        return "not_started"
    return "complete" if answered == len(keys) else "in_progress"


def evaluate_issuer_confirmations(payload: dict[str, Any]) -> str:
    c = payload.get("issuerConfirmations") or {}
    values = [bool(c.get(key)) for key in ISSUER_CONFIRMATION_KEYS]
    checked = sum(1 for v in values if v)
    if checked == 0:
        return "not_started"
    return "complete" if checked == len(values) else "in_progress"


_EVALUATORS = {
    "ipo-direction": evaluate_ipo_direction,
    "offer-structure": evaluate_offer_structure,
    "track-record-financial": evaluate_track_record,
    "eligibility-declarations": evaluate_declarations,
    "process-readiness": evaluate_process_readiness,
    "issuer-confirmations": evaluate_issuer_confirmations,
}


def calculate_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: _EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    statuses = list(sections.values())
    sections_complete = sum(1 for status in statuses if status == "complete")
    total_sections = len(statuses)
    if sections_complete == total_sections:
        overall = "complete"
    elif any(status != "not_started" for status in statuses):
        overall = "in_progress"
    else:
        overall = "not_started"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall,
    }


def list_missing_required(payload: dict[str, Any]) -> list[str]:
    progress = calculate_progress(payload)
    missing: list[str] = []
    for section_id, status in progress["sections"].items():
        if status != "complete":
            missing.append(f"{SECTION_LABELS[section_id]} incomplete")
    return missing
