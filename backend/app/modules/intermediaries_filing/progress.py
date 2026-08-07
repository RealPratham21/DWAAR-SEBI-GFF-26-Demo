"""Stage-aware section completion for Intermediaries & Filing."""

from __future__ import annotations

from typing import Any

from app.modules.intermediaries_filing.constants import IF_CONFIRMATION_FIELDS, SECTION_IDS
from app.modules.intermediaries_filing.rules import is_stage_at_least


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def _current_filing_stage(payload: dict[str, Any]) -> str:
    config = payload.get("issueConfigurationAndFilingSnapshot") or {}
    return str((config.get("filingSnapshot") or {}).get("filingStage") or "")


def evaluate_issue_team_status(payload: dict[str, Any]) -> str:
    section = payload.get("issueTeamAndIntermediaryMaster") or {}
    snapshot = section.get("issueTeamSnapshot") or {}
    intermediaries = section.get("intermediaries") or []
    core = [
        _filled(snapshot.get("teamAsOfDate")),
        _filled(snapshot.get("leadManagerAppointed")),
        len(intermediaries) > 0,
    ]
    answered = sum(1 for item in core if item)
    intermediaries_complete = all(
        _filled(item.get("legalName")) or _filled(item.get("displayName"))
        for item in intermediaries
        if isinstance(item, dict)
    )
    return _status_from(answered, len(core), intermediaries_complete)


def evaluate_issue_configuration_status(payload: dict[str, Any]) -> str:
    section = payload.get("issueConfigurationAndFilingSnapshot") or {}
    filing_snapshot = section.get("filingSnapshot") or {}
    reconciliation = section.get("filingSnapshotReconciliation") or {}
    core = [
        _filled(filing_snapshot.get("snapshotDate")),
        _filled(filing_snapshot.get("filingStage")),
        _filled(filing_snapshot.get("currentOfferDocumentForm")),
        _filled(reconciliation.get("filingConfirmationStatus")),
    ]
    answered = sum(1 for item in core if item)
    return _status_from(answered, len(core))


def evaluate_filing_tracker_status(payload: dict[str, Any]) -> str:
    section = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    has_data = any(
        [
            section.get("filings"),
            _filled((section.get("exchangeDraftFiling") or {}).get("exchange")),
            _filled((section.get("inPrincipleApproval") or {}).get("applied")),
            _filled((section.get("sebiSmeFiling") or {}).get("filingApplicability")),
            _filled((section.get("rocFiling") or {}).get("filingDate")),
        ]
    )
    if not has_data:
        return "not_started"
    filings_complete = all(
        _filled(filing.get("documentType")) or _filled(filing.get("filingDate"))
        for filing in (section.get("filings") or [])
        if isinstance(filing, dict)
    )
    return "complete" if filings_complete else "in_progress"


def evaluate_due_diligence_status(payload: dict[str, Any]) -> str:
    section = payload.get("dueDiligenceCertificatesConsentsAndSignoffs") or {}
    has_data = any(
        [
            section.get("dueDiligenceAreas"),
            section.get("certificates"),
            section.get("consents"),
            section.get("chapterSignoffs"),
        ]
    )
    if not has_data:
        return "not_started"
    certificates_complete = all(
        _filled(certificate.get("certificateType")) or _filled(certificate.get("provider"))
        for certificate in (section.get("certificates") or [])
        if isinstance(certificate, dict)
    )
    return "complete" if certificates_complete else "in_progress"


def evaluate_infrastructure_status(payload: dict[str, Any]) -> str:
    section = payload.get("depositoriesBankingAsbaUpiAndIssueInfrastructure") or {}
    core = [
        _filled((section.get("depositoryReadiness") or {}).get("isinStatus")),
        _filled((section.get("sponsorBankUpiReadiness") or {}).get("sponsorBankAppointed")),
        _filled((section.get("asbaConfiguration") or {}).get("asbaApplicable")),
        len(section.get("issueBankRoles") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    if answered == 0:
        return "not_started"
    return _status_from(answered, len(core))


def evaluate_underwriting_status(payload: dict[str, Any]) -> str:
    section = payload.get("underwritingMarketMakingAndDistributionArrangements") or {}
    summary = section.get("underwritingSummary") or {}
    has_data = any(
        [
            _filled(summary.get("issueShares")),
            _filled(summary.get("totalUnderwritingCommitment")),
            section.get("underwritingCommitments"),
            _filled((section.get("marketMakerConfiguration") or {}).get("marketMakerIntermediaryId")),
        ]
    )
    if not has_data:
        return "not_started"
    commitments_complete = all(
        _filled(commitment.get("intermediaryId")) or _filled(commitment.get("sharesUnderwritten"))
        for commitment in (section.get("underwritingCommitments") or [])
        if isinstance(commitment, dict)
    )
    return "complete" if commitments_complete else "in_progress"


def evaluate_issue_programme_status(payload: dict[str, Any]) -> str:
    stage = _current_filing_stage(payload)
    section = payload.get("issueProgrammeAllotmentListingAndPostIssueExecution") or {}
    calendar = section.get("issueCalendar") or {}

    if not is_stage_at_least(stage, "issue_open"):
        calendar_started = _filled(calendar.get("issueOpeningDate")) or _filled(calendar.get("issueClosingDate"))
        return "in_progress" if calendar_started else "not_started"

    if not is_stage_at_least(stage, "issue_closed"):
        opening = section.get("issueOpeningReadiness") or {}
        answered = sum(
            1
            for key in ("rhpProspectusRocFilingReady", "pricingFinalized", "registrarReady")
            if opening.get(key) != ""
        )
        if answered == 0:
            return "not_started"
        return "complete" if answered >= 3 else "in_progress"

    if not is_stage_at_least(stage, "allotment"):
        return "in_progress" if section.get("subscriptionRows") else "not_yet_due"

    if not is_stage_at_least(stage, "listing_application"):
        basis = section.get("basisOfAllotment") or {}
        answered = sum(
            1
            for key in ("basisPrepared", "allotmentFinalized", "exchangeApprovalReceived")
            if basis.get(key) != ""
        )
        if answered == 0:
            return "not_yet_due"
        return "complete" if answered >= 3 else "in_progress"

    listing = section.get("listing") or {}
    listing_started = _filled(listing.get("finalListingApplicationSubmitted")) or _filled(
        listing.get("listingDate")
    )
    return "in_progress" if listing_started else "not_yet_due"


def evaluate_final_document_status(payload: dict[str, Any]) -> str:
    section = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    confirmations = section.get("finalConfirmations") or {}
    answered = sum(1 for key, _ in IF_CONFIRMATION_FIELDS if confirmations.get(key) != "")
    if answered == 0 and not section.get("offerDocumentVersions"):
        return "not_started"
    if answered < len(IF_CONFIRMATION_FIELDS):
        return "in_progress"
    return "complete"


SECTION_EVALUATORS = {
    "issue-team-and-intermediary-master": evaluate_issue_team_status,
    "issue-configuration-and-filing-snapshot": evaluate_issue_configuration_status,
    "filing-and-regulatory-milestone-tracker": evaluate_filing_tracker_status,
    "due-diligence-certificates-consents-and-signoffs": evaluate_due_diligence_status,
    "depositories-banking-asba-upi-and-issue-infrastructure": evaluate_infrastructure_status,
    "underwriting-market-making-and-distribution-arrangements": evaluate_underwriting_status,
    "issue-programme-allotment-listing-and-post-issue-execution": evaluate_issue_programme_status,
    "final-offer-document-advertisements-material-documents-and-filing-readiness": (
        evaluate_final_document_status
    ),
}


def _derive_overall_status(sections: dict[str, str]) -> str:
    actionable = [
        status for status in sections.values() if status not in {"not_yet_due", "not_applicable"}
    ]
    if not actionable:
        return "not_started"
    complete_count = sum(1 for status in actionable if status == "complete")
    if complete_count == 0:
        return "not_started"
    if complete_count == len(actionable):
        return "complete"
    return "in_progress"


def calculate_intermediaries_filing_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: SECTION_EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    sections_complete = sum(1 for status in sections.values() if status == "complete")
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": len(sections),
        "overallStatus": _derive_overall_status(sections),
        "currentFilingStage": _current_filing_stage(payload),
    }
