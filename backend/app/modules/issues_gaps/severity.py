"""Map source detector states to user-facing severity (G4)."""

from __future__ import annotations

from app.modules.issues_gaps.constants import IssueSeverity


def severity_from_assessment_state(state: str, *, blocking_hint: bool = False) -> IssueSeverity:
    normalized = state.strip().lower()
    if blocking_hint or normalized in {"blocking", "blocker", "failed"}:
        return "blocking"
    if normalized in {
        "potential_inconsistency",
        "potential_concern",
        "eligibility_concerns_identified",
        "inconsistencies_identified",
        "variance",
        "escalated",
    }:
        return "high"
    if normalized in {
        "missing_information",
        "pending_linked_workstream",
        "pending_supporting_document",
        "pending_supporting_source",
        "insufficient_information",
        "awaiting_clarification",
    }:
        return "medium"
    if normalized in {
        "professional_confirmation_required",
        "pending_professional_confirmation",
        "professional_assessment_required",
        "pending_board_approval",
        "exchange_query_pending",
        "underwriting_pending",
        "market_making_pending",
        "issue_infrastructure_pending",
        "listing_action_pending",
    }:
        return "medium"
    if normalized in {"unknown_applicability", "review_required"}:
        return "low"
    return "medium"


def severity_from_ci_issue(*, severity: str, blocking: bool) -> IssueSeverity:
    if blocking:
        return "blocking"
    normalized = severity.strip().lower()
    if normalized in {"critical", "high", "blocking"}:
        return "high" if normalized != "blocking" else "blocking"
    if normalized == "medium":
        return "medium"
    return "low"


def severity_from_conflict(conflict_severity: str) -> IssueSeverity:
    if conflict_severity == "blocker":
        return "blocking"
    return "high"


def severity_from_drhp_requirement(
    *,
    blocks_generation: bool,
    classification: str,
    placeholder_allowed: bool,
    applicability: str,
) -> IssueSeverity:
    if blocks_generation:
        return "blocking"
    if applicability == "unknown":
        return "low"
    if classification in {"allowed_placeholder", "placeholder"} and placeholder_allowed:
        return "low"
    if classification in {"professional_confirmation", "review_required"}:
        return "medium"
    if classification in {"missing", "gap"}:
        return "medium"
    return "medium"


def severity_from_generation_status(status: str) -> IssueSeverity:
    normalized = status.strip().lower()
    if normalized in {"failed", "blocked"}:
        return "blocking"
    if normalized in {"warning", "completed_with_warnings"}:
        return "medium"
    return "low"
