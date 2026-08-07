"""Cross-record reference integrity for Litigation, Approvals & Compliance."""

from __future__ import annotations

from typing import Any

from app.modules.litigation_approvals_compliance.approvals import format_approval_label, get_approval_by_id
from app.modules.litigation_approvals_compliance.constants import SECTION_LABELS
from app.modules.litigation_approvals_compliance.matters import format_matter_label, get_matter_by_id


def _push(
    deps: list[dict[str, str]],
    category: str,
    record_id: str,
    section_id: str,
    label: str,
) -> None:
    deps.append(
        {
            "category": category,
            "recordId": record_id,
            "sectionId": section_id,
            "label": label,
        }
    )


def count_matter_references(payload: dict[str, Any], matter_id: str) -> list[dict[str, str]]:
    if not matter_id:
        return []
    deps: list[dict[str, str]] = []

    section3 = payload.get("criminalRegulatoryTaxAndEnforcementReadiness") or {}
    for screening in section3.get("criminalScreenings") or []:
        if not isinstance(screening, dict):
            continue
        if matter_id in (screening.get("linkedMatterIds") or []):
            _push(
                deps,
                "criminal-screening",
                str(screening.get("legalPartyReviewId") or ""),
                "criminal-regulatory-tax-and-enforcement-readiness",
                "Criminal screening → Matter",
            )

    for action in section3.get("regulatoryActions") or []:
        if isinstance(action, dict) and action.get("matterId") == matter_id:
            _push(
                deps,
                "regulatory-action",
                str(action.get("regulatoryActionId") or ""),
                "criminal-regulatory-tax-and-enforcement-readiness",
                "Regulatory action → Matter",
            )

    for screening in section3.get("sebiExchangeScreenings") or []:
        if isinstance(screening, dict) and screening.get("linkedMatterId") == matter_id:
            _push(
                deps,
                "sebi-exchange-screening",
                str(screening.get("legalPartyReviewId") or ""),
                "criminal-regulatory-tax-and-enforcement-readiness",
                "SEBI/exchange screening → Matter",
            )

    for tax in section3.get("taxProceedingDetails") or []:
        if isinstance(tax, dict) and tax.get("matterId") == matter_id:
            _push(
                deps,
                "tax-proceeding",
                str(tax.get("matterId") or ""),
                "criminal-regulatory-tax-and-enforcement-readiness",
                "Tax proceeding detail → Matter",
            )

    section6 = payload.get("corporateStatutoryAndOperationalComplianceExceptions") or {}
    for issue in section6.get("complianceIssues") or []:
        if isinstance(issue, dict) and issue.get("linkedMatterId") == matter_id:
            _push(
                deps,
                "compliance-issue",
                str(issue.get("complianceIssueId") or ""),
                "corporate-statutory-and-operational-compliance-exceptions",
                "Compliance issue → Matter",
            )

    for due in section6.get("statutoryDues") or []:
        if isinstance(due, dict) and due.get("linkedTaxMatterId") == matter_id:
            _push(
                deps,
                "statutory-due",
                str(due.get("statutoryDueId") or ""),
                "corporate-statutory-and-operational-compliance-exceptions",
                "Statutory due → Tax matter",
            )

    section7 = payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}
    for creditor in section7.get("materialCreditors") or []:
        if isinstance(creditor, dict) and creditor.get("linkedMatterId") == matter_id:
            _push(
                deps,
                "material-creditor",
                str(creditor.get("creditorId") or ""),
                "material-creditors-penalties-and-material-developments",
                "Material creditor → Matter",
            )

    for penalty in section7.get("historicalPenalties") or []:
        if isinstance(penalty, dict) and penalty.get("linkedMatterId") == matter_id:
            _push(
                deps,
                "historical-penalty",
                str(penalty.get("penaltyId") or ""),
                "material-creditors-penalties-and-material-developments",
                "Historical penalty → Matter",
            )

    for development in section7.get("materialDevelopments") or []:
        if not isinstance(development, dict):
            continue
        if development.get("category") in {"litigation", "regulatory-action", "tax"}:
            if development.get("linkedRecordId") == matter_id:
                _push(
                    deps,
                    "material-development",
                    str(development.get("developmentId") or ""),
                    "material-creditors-penalties-and-material-developments",
                    "Material development → Matter",
                )

    section8 = payload.get("reconciliationRemediationAndIssuerConfirmations") or {}
    regulatory_actions = section3.get("regulatoryActions") or []
    for action in section8.get("remediationActions") or []:
        if not isinstance(action, dict):
            continue
        if action.get("linkedRecordType") == "matter" and action.get("linkedRecordId") == matter_id:
            _push(
                deps,
                "remediation-action",
                str(action.get("remediationActionId") or ""),
                "reconciliation-remediation-and-issuer-confirmations",
                "Remediation action → Matter",
            )
        if action.get("linkedRecordType") == "regulatory-action":
            linked = next(
                (
                    record
                    for record in regulatory_actions
                    if isinstance(record, dict)
                    and record.get("regulatoryActionId") == action.get("linkedRecordId")
                ),
                None,
            )
            if linked and linked.get("matterId") == matter_id:
                _push(
                    deps,
                    "remediation-action",
                    str(action.get("remediationActionId") or ""),
                    "reconciliation-remediation-and-issuer-confirmations",
                    "Remediation action → Regulatory action → Matter",
                )

    return deps


def count_approval_references(payload: dict[str, Any], approval_id: str) -> list[dict[str, str]]:
    if not approval_id:
        return []
    deps: list[dict[str, str]] = []

    section5 = payload.get("approvalConditionsFacilityComplianceAndRenewalReadiness") or {}

    for condition in section5.get("approvalConditions") or []:
        if isinstance(condition, dict) and condition.get("approvalId") == approval_id:
            _push(
                deps,
                "approval-condition",
                str(condition.get("conditionId") or ""),
                "approval-conditions-facility-compliance-and-renewal-readiness",
                "Approval condition → Approval",
            )

    for review in section5.get("facilityApprovalReviews") or []:
        if isinstance(review, dict) and approval_id in (review.get("linkedApprovalIds") or []):
            _push(
                deps,
                "facility-approval-review",
                str(review.get("facilityApprovalReviewId") or ""),
                "approval-conditions-facility-compliance-and-renewal-readiness",
                "Facility approval review → Approval",
            )

    for requirement in section5.get("projectApprovalRequirements") or []:
        if isinstance(requirement, dict) and requirement.get("linkedApprovalId") == approval_id:
            _push(
                deps,
                "project-approval-requirement",
                str(requirement.get("projectApprovalRequirementId") or ""),
                "approval-conditions-facility-compliance-and-renewal-readiness",
                "Project approval requirement → Approval",
            )

    matters_section = payload.get("litigationAndProceedingsMaster") or {}
    for matter in matters_section.get("matters") or []:
        if not isinstance(matter, dict):
            continue
        subject = matter.get("subjectMatter") or {}
        if subject.get("linkedApprovalId") == approval_id:
            _push(
                deps,
                "matter-subject-link",
                str(matter.get("matterId") or ""),
                "litigation-and-proceedings-master",
                "Matter → Approval",
            )

    section7 = payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}
    for development in section7.get("materialDevelopments") or []:
        if (
            isinstance(development, dict)
            and development.get("category") == "approval"
            and development.get("linkedRecordId") == approval_id
        ):
            _push(
                deps,
                "material-development",
                str(development.get("developmentId") or ""),
                "material-creditors-penalties-and-material-developments",
                "Material development → Approval",
            )

    section8 = payload.get("reconciliationRemediationAndIssuerConfirmations") or {}
    approval_conditions = section5.get("approvalConditions") or []
    for action in section8.get("remediationActions") or []:
        if not isinstance(action, dict):
            continue
        if action.get("linkedRecordType") in {"approval", "approval-condition"} and (
            action.get("linkedRecordId") == approval_id
            or any(
                isinstance(condition, dict)
                and condition.get("conditionId") == action.get("linkedRecordId")
                and condition.get("approvalId") == approval_id
                for condition in approval_conditions
            )
        ):
            _push(
                deps,
                "remediation-action",
                str(action.get("remediationActionId") or ""),
                "reconciliation-remediation-and-issuer-confirmations",
                "Remediation action → Approval",
            )

    return deps


def format_matter_dependency_message(
    payload: dict[str, Any],
    matter_id: str,
    deps: list[dict[str, str]],
) -> str:
    if not deps:
        return ""
    matter = get_matter_by_id(payload, matter_id)
    label = format_matter_label(matter, matter_id)
    categories = list(dict.fromkeys(dep["label"] for dep in deps))
    sections = list(dict.fromkeys(SECTION_LABELS.get(dep["sectionId"], dep["sectionId"]) for dep in deps))
    return (
        f'"{label}" is referenced by {len(deps)} record(s) ({", ".join(categories)}) '
        f"across: {', '.join(sections)}. Remove or reassign dependent records first."
    )


def format_approval_dependency_message(
    payload: dict[str, Any],
    approval_id: str,
    deps: list[dict[str, str]],
) -> str:
    if not deps:
        return ""
    approval = get_approval_by_id(payload, approval_id)
    label = format_approval_label(approval, approval_id)
    categories = list(dict.fromkeys(dep["label"] for dep in deps))
    sections = list(dict.fromkeys(SECTION_LABELS.get(dep["sectionId"], dep["sectionId"]) for dep in deps))
    return (
        f'"{label}" is referenced by {len(deps)} record(s) ({", ".join(categories)}) '
        f"across: {', '.join(sections)}. Remove or reassign dependent records first."
    )
