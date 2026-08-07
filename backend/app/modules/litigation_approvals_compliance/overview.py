"""Overview summary derived from the Litigation, Approvals & Compliance draft."""

from __future__ import annotations

from typing import Any

from app.modules.litigation_approvals_compliance.assessment import assess_litigation_approvals_compliance
from app.modules.litigation_approvals_compliance.compute import compute_litigation_approvals_compliance_model
from app.modules.litigation_approvals_compliance.constants import SECTION_LABELS
from app.modules.litigation_approvals_compliance.progress import calculate_litigation_approvals_compliance_progress


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    progress = calculate_litigation_approvals_compliance_progress(payload)
    model = compute_litigation_approvals_compliance_model(payload, linked)
    assessment = assess_litigation_approvals_compliance(payload, linked)
    primary_exposure = (model.get("exposureByCurrency") or [{}])[0].get("totalExposure", "")

    sections_in_progress = sum(
        1 for status in (progress.get("sections") or {}).values() if status == "in_progress"
    )

    incomplete_sections = [
        (section_id, status)
        for section_id, status in (progress.get("sections") or {}).items()
        if status != "complete"
    ]

    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS.get(section_id, section_id)}",
        }
        for section_id, _ in incomplete_sections[:4]
    ]

    counts = assessment.get("counts") or {}
    assessment_concerns = (
        counts.get("potentialConcern", 0)
        + counts.get("materialityReviewRequired", 0)
        + counts.get("approvalRenewalReviewRequired", 0)
        + counts.get("complianceReviewRequired", 0)
        + counts.get("pendingLegalReview", 0)
        + counts.get("financialReconciliationPending", 0)
    )
    pending_professional_review_items = counts.get("pendingProfessionalConfirmation", 0) + counts.get(
        "pendingBoardDetermination", 0
    )

    expiry_windows = model.get("approvalExpiryWindows") or {}
    compliance_counts = model.get("complianceCounts") or {}
    creditor_totals = model.get("creditorTotals") or {}
    reconciliation = model.get("reconciliation") or {}
    section7 = payload.get("materialCreditorsPenaltiesAndMaterialDevelopments") or {}

    return {
        "sectionStatuses": progress.get("sections") or {},
        "sectionsComplete": progress.get("sectionsComplete", 0),
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress.get("totalSections", 0),
        "overallStatus": progress.get("overallStatus", "not_started"),
        "legalDdAsOfDate": model.get("legalDdAsOfDate", ""),
        "matterCount": model.get("matterCount", 0),
        "criminalMatterCount": model.get("criminalMatterCount", 0),
        "taxMatterCount": model.get("taxMatterCount", 0),
        "pendingOutcomeCount": model.get("pendingOutcomeCount", 0),
        "primaryExposure": primary_exposure,
        "taxAggregateDemand": (model.get("taxAggregates") or {}).get("totalDemand", ""),
        "approvalCount": model.get("approvalCount", 0),
        "expiredApprovalCount": model.get("expiredApprovalCount", 0),
        "renewalPendingCount": model.get("renewalPendingCount", 0),
        "approvalsExpiringWithin30Days": len(expiry_windows.get("within30Days") or []),
        "approvalsExpiringWithin90Days": len(expiry_windows.get("within90Days") or []),
        "complianceIssueCount": compliance_counts.get("complianceIssueCount", 0),
        "delayedStatutoryDues": compliance_counts.get("delayedStatutoryDues", 0),
        "approvalConditionsOutstanding": compliance_counts.get("approvalConditionsOutstanding", 0),
        "materialCreditorCount": creditor_totals.get("materialCreditorCount", 0),
        "msmeCreditorCount": creditor_totals.get("msmeCreditorCount", 0),
        "creditorAggregateOutstanding": creditor_totals.get("aggregateOutstanding", ""),
        "materialDevelopmentCount": len(section7.get("materialDevelopments") or []),
        "remediationOpenCount": model.get("remediationOpenCount", 0),
        "financialsReconciliationStatus": (reconciliation.get("financials") or {}).get("status", ""),
        "groupEntitiesReconciliationStatus": (reconciliation.get("groupEntities") or {}).get(
            "status", ""
        ),
        "managementGovernanceReconciliationStatus": (
            reconciliation.get("managementGovernance") or {}
        ).get("status", ""),
        "bacReconciliationStatus": (reconciliation.get("bac") or {}).get("status", ""),
        "businessOperationsReconciliationStatus": (reconciliation.get("businessOperations") or {}).get(
            "status", ""
        ),
        "objectsReconciliationStatus": (reconciliation.get("objectsOfIssue") or {}).get("status", ""),
        "ipoSetupReconciliationStatus": (reconciliation.get("ipoSetup") or {}).get("status", ""),
        "assessmentConcerns": assessment_concerns,
        "pendingProfessionalReviewItems": pending_professional_review_items,
        "assessmentResult": assessment.get("result", ""),
        "assessmentResultLabel": assessment.get("resultLabel", ""),
        "assessmentSummary": assessment.get("summary", ""),
        "recommendedNextActions": recommended_next_actions,
    }
