"""Overview summary — ports frontend overview.ts."""

from __future__ import annotations

from typing import Any

from app.modules.management_governance.assessment import build_governance_assessment
from app.modules.management_governance.compute import compute_management_governance_model
from app.modules.management_governance.constants import SECTION_LABELS
from app.modules.management_governance.progress import calculate_management_governance_progress


def build_overview_summary(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    progress = calculate_management_governance_progress(payload)
    model = compute_management_governance_model(payload, linked)
    assessment = build_governance_assessment(payload, model, progress, linked)

    sections_in_progress = sum(
        1 for status in progress["sections"].values() if status == "in_progress"
    )

    incomplete_sections = [
        (section_id, status)
        for section_id, status in progress["sections"].items()
        if status != "complete"
    ]

    recommended_next_actions = [
        {
            "sectionId": section_id,
            "label": f"Continue with {SECTION_LABELS.get(section_id, section_id)}",
        }
        for section_id, _ in incomplete_sections[:4]
    ]

    continuity = model.get("continuity") or {}
    board_counts = model.get("boardCounts") or {}
    applicability = model.get("applicability") or {}

    return {
        "sectionStatuses": progress["sections"],
        "sectionsComplete": progress["sectionsComplete"],
        "sectionsInProgress": sections_in_progress,
        "totalSections": progress["totalSections"],
        "overallStatus": progress["overallStatus"],
        "boardSize": model.get("boardSize", 0),
        "proposedBoardSize": model.get("proposedBoardSize", 0),
        "executiveDirectors": board_counts.get("executive", 0),
        "nonExecutiveDirectors": board_counts.get("nonExecutive", 0),
        "independentDirectors": board_counts.get("independent", 0),
        "womenDirectors": board_counts.get("women", 0),
        "residentDirectors": board_counts.get("resident", 0),
        "chairmanName": model.get("chairmanName", ""),
        "managingDirectorName": model.get("managingDirectorName", ""),
        "kmpCount": model.get("kmpCount", 0),
        "seniorManagementCount": model.get("smpCount", 0),
        "criticalVacancies": continuity.get("criticalRoleVacancies", 0),
        "committeesReady": model.get("committeesReadyCount", 0),
        "committeesRequired": model.get("committeesRequiredCount", 0),
        "policiesAdopted": model.get("policiesAdoptedCount", 0),
        "policiesRequired": model.get("policiesRequiredCount", 0),
        "boardChangesLastThreeYears": continuity.get("boardAdditionsLastThreeYears", 0)
        + continuity.get("boardCessationsLastThreeYears", 0),
        "kmpChangesLastThreeYears": continuity.get("kmpSmpAdditionsLastThreeYears", 0)
        + continuity.get("kmpSmpCessationsLastThreeYears", 0),
        "pendingAppointments": model.get("pendingAppointments", 0),
        "potentialConcerns": assessment["counts"]["potentialConcern"],
        "professionalReviewItems": assessment["counts"]["pendingProfessionalConfirmation"],
        "listingSegment": applicability.get("listingSegment", "unknown"),
        "assessmentResult": assessment["result"],
        "assessmentResultLabel": assessment["resultLabel"],
        "assessmentSummary": assessment["summary"],
        "recommendedNextActions": recommended_next_actions,
    }
