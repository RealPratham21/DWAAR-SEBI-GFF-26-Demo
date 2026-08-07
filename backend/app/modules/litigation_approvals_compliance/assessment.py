"""Deterministic Legal & Compliance Assessment (LAC1) — ports frontend assessment.ts."""

from __future__ import annotations

from typing import Any

from app.modules.litigation_approvals_compliance.approvals import get_approvals
from app.modules.litigation_approvals_compliance.compute import (
    compute_litigation_approvals_compliance_model,
)
from app.modules.litigation_approvals_compliance.constants import (
    LAC_ASSESSMENT_GROUP_LABELS,
    LAC_ASSESSMENT_GROUPS,
    LAC_CONFIRMATION_FIELDS,
)
from app.modules.litigation_approvals_compliance.matters import get_matters
from app.modules.litigation_approvals_compliance.progress import (
    calculate_litigation_approvals_compliance_progress,
)

RESULT_LABELS: dict[str, str] = {
    "insufficient_information": "Insufficient information",
    "broadly_reconciled": "Broadly reconciled",
    "litigation_disclosure_gaps_identified": "Litigation disclosure gaps identified",
    "approval_compliance_gaps_identified": "Approval/compliance gaps identified",
    "materiality_review_required": "Materiality review required",
    "professional_confirmation_required": "Professional confirmation required",
    "pending_linked_workstream": "Pending linked workstream data",
}

WORST_STATE_PRIORITY = [
    "potential_concern",
    "materiality_review_required",
    "pending_legal_review",
    "approval_renewal_review_required",
    "compliance_review_required",
    "financial_reconciliation_pending",
    "pending_board_determination",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "missing_information",
    "reconciled",
    "not_applicable",
]

STATE_TO_COUNT_KEY: dict[str, str] = {
    "reconciled": "reconciled",
    "potential_concern": "potentialConcern",
    "missing_information": "missingInformation",
    "materiality_review_required": "materialityReviewRequired",
    "pending_legal_review": "pendingLegalReview",
    "approval_renewal_review_required": "approvalRenewalReviewRequired",
    "compliance_review_required": "complianceReviewRequired",
    "financial_reconciliation_pending": "financialReconciliationPending",
    "pending_linked_workstream": "pendingLinkedWorkstream",
    "pending_professional_confirmation": "pendingProfessionalConfirmation",
    "pending_board_determination": "pendingBoardDetermination",
    "not_applicable": "notApplicable",
}


def _filled(value: Any) -> bool:
    if value is None:
        return False
    return str(value).strip() != ""


def _worst_state(states: list[str]) -> str:
    for state in WORST_STATE_PRIORITY:
        if state in states:
            return state
    return "missing_information"


def _criterion(
    criterion_id: str,
    group: str,
    label: str,
    state: str,
    reason: str,
    related_section: str,
) -> dict[str, Any]:
    return {
        "id": criterion_id,
        "group": group,
        "label": label,
        "state": state,
        "reason": reason,
        "relatedSection": related_section,
    }


def _linked_reconciliation_state(available: bool, status: str) -> str:
    if not available:
        return "pending_linked_workstream"
    if status == "Reconciled":
        return "reconciled"
    if status == "Potential inconsistency":
        return "potential_concern"
    if status == "Pending professional confirmation":
        return "pending_professional_confirmation"
    if status == "Missing information":
        return "missing_information"
    return "financial_reconciliation_pending"


def assess_litigation_approvals_compliance(
    payload: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_litigation_approvals_compliance_progress(payload)
    model = compute_litigation_approvals_compliance_model(payload, linked_references)
    criteria: list[dict[str, Any]] = []
    matters = get_matters(payload)
    approvals = get_approvals(payload)
    section1 = payload.get("legalUniverseMaterialityPolicyAndPartyMapping") or {}
    snapshot = section1.get("legalDdSnapshot") or {}

    # Legal universe & materiality
    criteria.append(
        _criterion(
            "legal-dd-snapshot",
            "legal_universe_materiality",
            "Legal DD snapshot captured",
            "reconciled" if _filled(snapshot.get("legalDdAsOfDate")) else "missing_information",
            (
                f"Legal DD as-of date: {snapshot.get('legalDdAsOfDate')}."
                if _filled(snapshot.get("legalDdAsOfDate"))
                else "Legal DD snapshot dates not yet captured."
            ),
            "legal-universe-materiality-policy-and-party-mapping",
        )
    )

    party_reviews = section1.get("legalPartyReviews") or []
    criteria.append(
        _criterion(
            "party-review-register",
            "legal_universe_materiality",
            "Relevant party review register",
            (
                "reconciled"
                if len(party_reviews) > 0
                else "missing_information"
                if snapshot.get("litigationExists") == "yes"
                else "not_applicable"
            ),
            (
                f"{len(party_reviews)} party review record(s) captured."
                if len(party_reviews) > 0
                else "No party review records captured yet."
            ),
            "legal-universe-materiality-policy-and-party-mapping",
        )
    )

    materiality_policy = section1.get("litigationMaterialityPolicy") or {}
    policy_exists = materiality_policy.get("policyExists")
    adopted = materiality_policy.get("adopted")
    criteria.append(
        _criterion(
            "materiality-policy",
            "legal_universe_materiality",
            "Litigation materiality policy",
            (
                "reconciled"
                if policy_exists == "yes" and adopted != "no"
                else "pending_board_determination"
                if policy_exists == "yes"
                else "materiality_review_required"
                if len(matters) > 0
                else "missing_information"
            ),
            (
                f"Policy exists: {policy_exists}; adopted: {adopted or 'not answered'}."
                if policy_exists
                else "Board-approved litigation materiality policy not yet captured."
            ),
            "legal-universe-materiality-policy-and-party-mapping",
        )
    )

    # Litigation & proceedings
    criteria.append(
        _criterion(
            "matter-master",
            "litigation_proceedings",
            "Matter Master populated",
            (
                "reconciled"
                if len(matters) > 0
                else "missing_information"
                if snapshot.get("litigationExists") == "yes"
                else "not_applicable"
            ),
            (
                f"{len(matters)} matter record(s) in the Matter Master."
                if len(matters) > 0
                else "No matters recorded in the Matter Master."
            ),
            "litigation-and-proceedings-master",
        )
    )

    pending_materiality = sum(
        1
        for matter in matters
        if (matter.get("materiality") or {}).get("readinessState")
        in {
            "pending-board-determination",
            "mandatory-category-review",
            "missing-information",
        }
    )
    if pending_materiality > 0 or any(
        (m.get("materiality") or {}).get("professionalReview") == "pending" for m in matters
    ):
        criteria.append(
            _criterion(
                "matter-materiality",
                "litigation_proceedings",
                "Matter materiality assessments",
                (
                    "materiality_review_required"
                    if pending_materiality > 0
                    else "pending_professional_confirmation"
                ),
                f"{pending_materiality} matter(s) require materiality or professional review.",
                "litigation-and-proceedings-master",
            )
        )

    # Criminal, regulatory & tax
    section3 = payload.get("criminalRegulatoryTaxAndEnforcementReadiness") or {}
    criminal_screenings = section3.get("criminalScreenings") or []
    if snapshot.get("criminalMattersExist") == "yes" or model.get("criminalMatterCount", 0) > 0:
        criteria.append(
            _criterion(
                "criminal-screening",
                "criminal_regulatory_tax",
                "Criminal screening captured",
                "reconciled" if len(criminal_screenings) > 0 else "missing_information",
                (
                    f"{len(criminal_screenings)} criminal screening record(s) captured."
                    if len(criminal_screenings) > 0
                    else "Criminal matters indicated but screening records not captured."
                ),
                "criminal-regulatory-tax-and-enforcement-readiness",
            )
        )

    regulatory_actions = section3.get("regulatoryActions") or []
    if len(regulatory_actions) > 0:
        regulatory_state = "reconciled"
    elif snapshot.get("regulatoryStatutoryActionsExist") != "yes":
        regulatory_state = "not_applicable"
    else:
        regulatory_state = "missing_information"
    criteria.append(
        _criterion(
            "regulatory-actions",
            "criminal_regulatory_tax",
            "Regulatory/statutory actions",
            regulatory_state,
            (
                f"{len(regulatory_actions)} regulatory action record(s) captured."
                if len(regulatory_actions) > 0
                else "Regulatory actions not yet captured."
            ),
            "criminal-regulatory-tax-and-enforcement-readiness",
        )
    )

    tax_aggregates = model.get("taxAggregates") or {}
    tax_proceeding_count = tax_aggregates.get("proceedingCount") or 0
    criteria.append(
        _criterion(
            "tax-proceedings",
            "criminal_regulatory_tax",
            "Tax proceedings and aggregates",
            (
                "reconciled"
                if tax_proceeding_count > 0 or model.get("taxMatterCount", 0) > 0
                else "missing_information"
                if snapshot.get("taxDisputesExist") == "yes"
                else "not_applicable"
            ),
            (
                f"{tax_proceeding_count} tax proceeding detail(s); aggregate demand {tax_aggregates.get('totalDemand') or '—'}."
                if tax_proceeding_count > 0
                else "Tax proceedings not yet captured."
            ),
            "criminal-regulatory-tax-and-enforcement-readiness",
        )
    )

    # Approvals master
    criteria.append(
        _criterion(
            "approval-master",
            "approvals_master",
            "Approval Master populated",
            (
                "reconciled"
                if len(approvals) > 0
                else "missing_information"
                if snapshot.get("materialApprovalsPending") == "yes"
                else "not_applicable"
            ),
            (
                f"{len(approvals)} approval record(s) in the Approval Master."
                if len(approvals) > 0
                else "No approvals recorded in the Approval Master."
            ),
            "government-regulatory-and-business-approvals-master",
        )
    )

    expired_count = model.get("expiredApprovalCount") or 0
    renewal_pending_count = model.get("renewalPendingCount") or 0
    if expired_count > 0 or renewal_pending_count > 0:
        criteria.append(
            _criterion(
                "approval-status-review",
                "approvals_master",
                "Expired/renewal-pending approvals",
                "approval_renewal_review_required",
                (
                    f"{expired_count} expired and {renewal_pending_count} "
                    "renewal/application-pending approval(s) recorded."
                ),
                "government-regulatory-and-business-approvals-master",
            )
        )

    # Approval conditions & renewal
    approval_expiry_windows = model.get("approvalExpiryWindows") or {}
    within_90_days = approval_expiry_windows.get("within90Days") or []
    within_30_days = approval_expiry_windows.get("within30Days") or []
    if len(within_90_days) > 0:
        criteria.append(
            _criterion(
                "approval-expiry-windows",
                "approval_conditions_renewal",
                "Approvals expiring within 90 days",
                "approval_renewal_review_required",
                (
                    f"{len(within_90_days)} approval(s) expiring within 90 days "
                    f"({len(within_30_days)} within 30 days)."
                ),
                "approval-conditions-facility-compliance-and-renewal-readiness",
            )
        )

    compliance_counts = model.get("complianceCounts") or {}
    approval_conditions_outstanding = compliance_counts.get("approvalConditionsOutstanding") or 0
    if approval_conditions_outstanding > 0:
        criteria.append(
            _criterion(
                "approval-conditions",
                "approval_conditions_renewal",
                "Outstanding approval conditions",
                "compliance_review_required",
                (
                    f"{approval_conditions_outstanding} approval condition(s) pending, "
                    "delayed or not sure."
                ),
                "approval-conditions-facility-compliance-and-renewal-readiness",
            )
        )

    # Compliance exceptions
    compliance_issue_count = compliance_counts.get("complianceIssueCount") or 0
    known_exceptions = snapshot.get("knownComplianceExceptionsExist")
    if compliance_issue_count > 0:
        compliance_state = "reconciled"
    elif known_exceptions == "yes":
        compliance_state = "missing_information"
    elif known_exceptions == "":
        compliance_state = "missing_information"
    else:
        compliance_state = "not_applicable"
    criteria.append(
        _criterion(
            "compliance-exceptions",
            "compliance_exceptions",
            "Compliance exceptions register",
            compliance_state,
            (
                f"{compliance_issue_count} compliance issue(s); "
                f"{compliance_counts.get('continuingIssues') or 0} continuing."
                if compliance_issue_count > 0
                else "No compliance exceptions captured yet."
            ),
            "corporate-statutory-and-operational-compliance-exceptions",
        )
    )

    delayed_statutory_dues = compliance_counts.get("delayedStatutoryDues") or 0
    if delayed_statutory_dues > 0:
        criteria.append(
            _criterion(
                "statutory-dues-delays",
                "compliance_exceptions",
                "Statutory due delays",
                "compliance_review_required",
                f"{delayed_statutory_dues} statutory due record(s) with delay.",
                "corporate-statutory-and-operational-compliance-exceptions",
            )
        )

    # Creditors, penalties & developments
    creditor_totals = model.get("creditorTotals") or {}
    material_creditor_count = creditor_totals.get("materialCreditorCount") or 0
    if material_creditor_count > 0:
        creditors_state = "reconciled"
    elif snapshot.get("materialCreditorDuesExist") == "yes":
        creditors_state = "missing_information"
    else:
        creditors_state = "not_applicable"
    criteria.append(
        _criterion(
            "material-creditors",
            "creditors_penalties_developments",
            "Material creditors captured",
            creditors_state,
            (
                f"{material_creditor_count} material creditor(s); outstanding "
                f"{creditor_totals.get('materialOutstanding') or '—'}."
                if material_creditor_count > 0
                else "Material creditors not yet captured."
            ),
            "material-creditors-penalties-and-material-developments",
        )
    )

    section7 = payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}
    material_developments = section7.get("materialDevelopments") or []
    if len(material_developments) > 0:
        developments_state = "reconciled"
    elif snapshot.get("materialDevelopmentsSinceLatestFinancialsExist") == "yes":
        developments_state = "missing_information"
    elif snapshot.get("materialDevelopmentsSinceLatestFinancialsExist") != "yes":
        developments_state = "not_applicable"
    else:
        developments_state = "missing_information"
    criteria.append(
        _criterion(
            "material-developments",
            "creditors_penalties_developments",
            "Material developments since latest financials",
            developments_state,
            (
                f"{len(material_developments)} material development(s) recorded."
                if len(material_developments) > 0
                else "Material developments not yet captured."
            ),
            "material-creditors-penalties-and-material-developments",
        )
    )

    # Cross-workstream reconciliation
    reconciliation = model.get("reconciliation") or {}
    linked_checks = [
        {
            "id": "linked-financials",
            "label": "Financials reconciliation",
            "available": bool((linked_references.get("financialsKpis") or {}).get("available")),
            "status": (reconciliation.get("financials") or {}).get("status", ""),
        },
        {
            "id": "linked-group-entities",
            "label": "Group Entities reconciliation",
            "available": bool((linked_references.get("groupEntities") or {}).get("available")),
            "status": (reconciliation.get("groupEntities") or {}).get("status", ""),
        },
        {
            "id": "linked-management",
            "label": "Management & Governance reconciliation",
            "available": bool(
                (linked_references.get("managementGovernance") or {}).get("available")
            ),
            "status": (reconciliation.get("managementGovernance") or {}).get("status", ""),
        },
        {
            "id": "linked-bac",
            "label": "Borrowings, Assets & Contracts reconciliation",
            "available": bool(
                (linked_references.get("borrowingsAssetsContracts") or {}).get("available")
            ),
            "status": (reconciliation.get("bac") or {}).get("status", ""),
        },
        {
            "id": "linked-business",
            "label": "Business & Operations reconciliation",
            "available": bool(
                (linked_references.get("businessOperations") or {}).get("available")
            ),
            "status": (reconciliation.get("businessOperations") or {}).get("status", ""),
        },
        {
            "id": "linked-objects",
            "label": "Objects of the Issue reconciliation",
            "available": bool((linked_references.get("objectsOfIssue") or {}).get("available")),
            "status": (reconciliation.get("objectsOfIssue") or {}).get("status", ""),
        },
        {
            "id": "linked-ipo",
            "label": "IPO Setup reconciliation",
            "available": bool((linked_references.get("ipoSetup") or {}).get("available")),
            "status": (reconciliation.get("ipoSetup") or {}).get("status", ""),
        },
    ]

    for check in linked_checks:
        criteria.append(
            _criterion(
                check["id"],
                "cross_workstream_reconciliation",
                check["label"],
                _linked_reconciliation_state(check["available"], str(check["status"])),
                (
                    f"{check['label']}: {check['status']}."
                    if check["available"]
                    else f"{check['label']} linked data not yet available."
                ),
                "reconciliation-remediation-and-issuer-confirmations",
            )
        )

    confirmations = (
        (payload.get("reconciliationRemediationAndIssuerConfirmations") or {}).get("confirmations")
        or {}
    )
    unanswered_confirmations = sum(
        1 for key, _ in LAC_CONFIRMATION_FIELDS if confirmations.get(key) == ""
    )
    criteria.append(
        _criterion(
            "issuer-confirmations",
            "cross_workstream_reconciliation",
            "Issuer confirmations",
            "reconciled" if unanswered_confirmations == 0 else "missing_information",
            (
                "All issuer confirmations answered."
                if unanswered_confirmations == 0
                else f"{unanswered_confirmations} confirmation(s) still unanswered."
            ),
            "reconciliation-remediation-and-issuer-confirmations",
        )
    )

    remediation_open_count = model.get("remediationOpenCount") or 0
    if remediation_open_count > 0:
        criteria.append(
            _criterion(
                "remediation-actions",
                "cross_workstream_reconciliation",
                "Open remediation actions",
                "pending_legal_review",
                (
                    f"{remediation_open_count} remediation action(s) open, "
                    "in progress or blocked."
                ),
                "reconciliation-remediation-and-issuer-confirmations",
            )
        )

    counts: dict[str, int] = {
        "reconciled": 0,
        "potentialConcern": 0,
        "missingInformation": 0,
        "materialityReviewRequired": 0,
        "pendingLegalReview": 0,
        "approvalRenewalReviewRequired": 0,
        "complianceReviewRequired": 0,
        "financialReconciliationPending": 0,
        "pendingLinkedWorkstream": 0,
        "pendingProfessionalConfirmation": 0,
        "pendingBoardDetermination": 0,
        "notApplicable": 0,
    }
    for item in criteria:
        count_key = STATE_TO_COUNT_KEY.get(item["state"])
        if count_key:
            counts[count_key] += 1

    groups = []
    for group in LAC_ASSESSMENT_GROUPS:
        group_criteria = [item for item in criteria if item["group"] == group]
        if not group_criteria:
            continue
        groups.append(
            {
                "group": group,
                "label": LAC_ASSESSMENT_GROUP_LABELS[group],
                "headlineState": _worst_state([item["state"] for item in group_criteria]),
                "criteria": group_criteria,
            }
        )

    potential_concerns = (
        counts["potentialConcern"]
        + counts["materialityReviewRequired"]
        + counts["approvalRenewalReviewRequired"]
        + counts["complianceReviewRequired"]
        + counts["pendingLegalReview"]
    )

    result = "broadly_reconciled"
    if counts["pendingLinkedWorkstream"] > 0 and progress["sectionsComplete"] == 0:
        result = "pending_linked_workstream"
    elif counts["pendingProfessionalConfirmation"] > 0 or counts["pendingBoardDetermination"] > 0:
        result = "professional_confirmation_required"
    elif counts["materialityReviewRequired"] > 0:
        result = "materiality_review_required"
    elif counts["approvalRenewalReviewRequired"] > 0 or counts["complianceReviewRequired"] > 0:
        result = "approval_compliance_gaps_identified"
    elif (
        counts["missingInformation"] > 0
        and len(matters) == 0
        and len(approvals) == 0
    ):
        result = "insufficient_information"
    elif counts["potentialConcern"] > 0 or counts["financialReconciliationPending"] > 0:
        result = "litigation_disclosure_gaps_identified"
    elif progress["sectionsComplete"] == 0:
        result = "insufficient_information"

    return {
        "result": result,
        "resultLabel": RESULT_LABELS[result],
        "summary": (
            "This is a disclosure readiness view derived from the current in-memory draft, "
            "not a legal opinion or compliant/non-compliant determination. Unanswered "
            "questions are treated as missing information."
        ),
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "matterCount": model.get("matterCount") or 0,
            "approvalCount": model.get("approvalCount") or 0,
            "sectionsComplete": progress["sectionsComplete"],
            "unansweredConfirmations": unanswered_confirmations,
            "expiringApprovals30Days": len(within_30_days),
            "delayedStatutoryDues": delayed_statutory_dues,
            "potentialConcerns": potential_concerns,
        },
    }
