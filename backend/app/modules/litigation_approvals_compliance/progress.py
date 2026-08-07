"""Section completion for Litigation, Approvals & Compliance."""

from __future__ import annotations

from typing import Any

from app.modules.litigation_approvals_compliance.constants import LAC_CONFIRMATION_FIELDS, SECTION_IDS
from app.modules.litigation_approvals_compliance.decimal_utils import is_filled_decimal


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


def evaluate_legal_universe_status(payload: dict[str, Any]) -> str:
    section = payload.get("legalUniverseMaterialityPolicyAndPartyMapping") or {}
    snapshot = section.get("legalDdSnapshot") or {}
    core = [
        _filled(snapshot.get("legalDdAsOfDate")),
        _filled(snapshot.get("litigationExists")),
        len(section.get("legalPartyReviews") or []) > 0,
        _filled((section.get("litigationMaterialityPolicy") or {}).get("policyExists")),
    ]
    answered = sum(1 for item in core if item)
    parties_complete = all(
        _filled(party.get("displayName")) or _filled(party.get("partyCategory"))
        for party in (section.get("legalPartyReviews") or [])
        if isinstance(party, dict)
    )
    return _status_from(answered, len(core), parties_complete)


def evaluate_litigation_master_status(payload: dict[str, Any]) -> str:
    matters = (payload.get("litigationAndProceedingsMaster") or {}).get("matters") or []
    if not matters:
        return "not_started"
    complete = all(
        isinstance(matter, dict)
        and (
            _filled((matter.get("identity") or {}).get("matterTitle"))
            or _filled((matter.get("identity") or {}).get("caseReferenceNumber"))
            or _filled((matter.get("identity") or {}).get("category"))
        )
        for matter in matters
    )
    return "complete" if complete else "in_progress"


def evaluate_criminal_regulatory_tax_status(payload: dict[str, Any]) -> str:
    section = payload.get("criminalRegulatoryTaxAndEnforcementReadiness") or {}
    has_data = any(
        [
            section.get("criminalScreenings"),
            section.get("regulatoryActions"),
            section.get("sebiExchangeScreenings"),
            section.get("taxProceedingDetails"),
        ]
    )
    if not has_data:
        return "not_started"

    actions_complete = all(
        _filled(action.get("authority")) or _filled(action.get("actionType"))
        for action in (section.get("regulatoryActions") or [])
        if isinstance(action, dict)
    )
    tax_complete = all(
        _filled(detail.get("matterId")) or _filled(detail.get("taxType"))
        for detail in (section.get("taxProceedingDetails") or [])
        if isinstance(detail, dict)
    )
    return "complete" if actions_complete and tax_complete else "in_progress"


def evaluate_approvals_master_status(payload: dict[str, Any]) -> str:
    approvals = (payload.get("governmentRegulatoryAndBusinessApprovalsMaster") or {}).get(
        "approvals"
    ) or []
    if not approvals:
        return "not_started"
    complete = all(
        _filled((approval.get("identity") or {}).get("approvalLicenceName"))
        or _filled((approval.get("identity") or {}).get("category"))
        for approval in approvals
        if isinstance(approval, dict)
    )
    return "complete" if complete else "in_progress"


def evaluate_approval_conditions_status(payload: dict[str, Any]) -> str:
    section = payload.get("approvalConditionsFacilityComplianceAndRenewalReadiness") or {}
    has_data = any(
        [
            section.get("approvalConditions"),
            section.get("facilityApprovalReviews"),
            section.get("projectApprovalRequirements"),
        ]
    )
    if not has_data:
        return "not_started"

    conditions_complete = all(
        _filled(condition.get("approvalId")) and _filled(condition.get("condition"))
        for condition in (section.get("approvalConditions") or [])
        if isinstance(condition, dict)
    )
    return "complete" if conditions_complete else "in_progress"


def evaluate_compliance_exceptions_status(payload: dict[str, Any]) -> str:
    section = payload.get("corporateStatutoryAndOperationalComplianceExceptions") or {}
    has_data = any(
        [
            section.get("complianceDomainReviews"),
            section.get("complianceIssues"),
            section.get("statutoryDues"),
        ]
    )
    if not has_data:
        return "not_started"

    issues_complete = all(
        _filled(issue.get("domain")) or _filled(issue.get("obligation"))
        for issue in (section.get("complianceIssues") or [])
        if isinstance(issue, dict)
    )
    return "complete" if issues_complete else "in_progress"


def evaluate_creditors_penalties_developments_status(payload: dict[str, Any]) -> str:
    section = payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}
    has_data = (
        bool(section.get("materialCreditors"))
        or bool(section.get("historicalPenalties"))
        or bool(section.get("materialDevelopments"))
        or _filled((section.get("materialCreditorPolicy") or {}).get("policyExists"))
    )
    if not has_data:
        return "not_started"

    creditors_complete = all(
        _filled(creditor.get("creditorName"))
        or is_filled_decimal(str(creditor.get("amountOutstanding") or ""))
        for creditor in (section.get("materialCreditors") or [])
        if isinstance(creditor, dict)
    )
    return "complete" if creditors_complete else "in_progress"


def evaluate_reconciliation_confirmations_status(payload: dict[str, Any]) -> str:
    confirmations = (
        (payload.get("reconciliationRemediationAndIssuerConfirmations") or {}).get("confirmations")
        or {}
    )
    answered = sum(1 for key, _ in LAC_CONFIRMATION_FIELDS if confirmations.get(key) != "")
    if answered == 0:
        return "not_started"
    if answered < len(LAC_CONFIRMATION_FIELDS):
        return "in_progress"
    return "complete"


SECTION_EVALUATORS = {
    "legal-universe-materiality-policy-and-party-mapping": evaluate_legal_universe_status,
    "litigation-and-proceedings-master": evaluate_litigation_master_status,
    "criminal-regulatory-tax-and-enforcement-readiness": evaluate_criminal_regulatory_tax_status,
    "government-regulatory-and-business-approvals-master": evaluate_approvals_master_status,
    "approval-conditions-facility-compliance-and-renewal-readiness": evaluate_approval_conditions_status,
    "corporate-statutory-and-operational-compliance-exceptions": evaluate_compliance_exceptions_status,
    "material-creditors-penalties-and-material-developments": (
        evaluate_creditors_penalties_developments_status
    ),
    "reconciliation-remediation-and-issuer-confirmations": evaluate_reconciliation_confirmations_status,
}


def calculate_litigation_approvals_compliance_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: SECTION_EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    sections_complete = sum(1 for status in sections.values() if status == "complete")
    total_sections = len(sections)
    if sections_complete == 0:
        overall_status = "not_started"
    elif sections_complete == total_sections:
        overall_status = "complete"
    else:
        overall_status = "in_progress"

    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
