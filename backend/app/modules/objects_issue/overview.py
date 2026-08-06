"""Overview-tab summary for Objects of the Issue — ports overview.ts."""

from __future__ import annotations

from typing import Any

from app.modules.objects_issue.assessment import assess_objects_of_issue
from app.modules.objects_issue.compute import compute_objects_of_issue_model
from app.modules.objects_issue.constants import SECTION_IDS, SECTION_LABELS
from app.modules.objects_issue.progress import calculate_progress

SLUG = "objects-of-issue"


def build_overview_summary(
    payload: dict[str, Any],
    ipo_reference: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    progress = calculate_progress(payload)
    model = compute_objects_of_issue_model(payload, ipo_reference)
    assessment = assess_objects_of_issue(payload, ipo_reference, linked_references)

    sections_in_progress = sum(
        1 for section_id in SECTION_IDS if progress["sections"].get(section_id) == "in_progress"
    )

    reconciled_checks_count = sum(
        1 for criterion in assessment["criteria"] if criterion["state"] == "reconciled"
    )
    variance_checks_count = sum(
        1
        for criterion in assessment["criteria"]
        if criterion["state"] in ("potential_concern", "blocked")
    )
    missing_information_checks_count = sum(
        1 for criterion in assessment["criteria"] if criterion["state"] == "missing_information"
    )

    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue {SECTION_LABELS[section_id]}",
        }
        for section_id in SECTION_IDS
        if progress["sections"].get(section_id) != "complete"
    ][:3]

    company = linked_references.get("company") or {
        "available": False,
        "legalName": None,
        "companyClass": None,
        "cin": None,
    }

    return {
        "isPureOfs": model["isPureOfs"],
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "objectsCount": len((payload.get("objectsRegisterAndAllocation") or {}).get("objects") or []),
        "netFreshIssueProceeds": model["netFreshIssueProceeds"],
        "totalEstimatedObjectsCost": model["totalEstimatedObjectsCost"],
        "totalAllocatedFromNetProceeds": model["totalAllocatedFromNetProceeds"],
        "gcpPercentageOfFreshIssue": model["gcpPercentageOfFreshIssue"],
        "gcpApplicableCap": model["gcpApplicableCap"],
        "hasCapexRelevantObjects": model["hasCapexRelevantObjects"],
        "hasAcquisitionRelevantObjects": model["hasAcquisitionRelevantObjects"],
        "companyReference": company,
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "blockingConcernCount": assessment["metrics"]["blockingConcerns"],
        "reconciledChecksCount": reconciled_checks_count,
        "varianceChecksCount": variance_checks_count,
        "missingInformationChecksCount": missing_information_checks_count,
        "recommendedNextActions": recommended_next_actions,
    }
