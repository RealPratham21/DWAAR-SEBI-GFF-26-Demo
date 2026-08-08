"""Map source detector states to global issue categories (G4)."""

from __future__ import annotations

from app.modules.issues_gaps.constants import IssueCategory


def category_from_assessment_state(state: str) -> IssueCategory:
    normalized = state.strip().lower()
    mapping: dict[str, IssueCategory] = {
        "missing_information": "missing_information",
        "pending_supporting_document": "document_readiness",
        "pending_supporting_source": "document_readiness",
        "potential_inconsistency": "inconsistent_information",
        "potential_concern": "other_review_required",
        "pending_linked_workstream": "reconciliation_issue",
        "pending_professional_confirmation": "professional_confirmation",
        "professional_confirmation_required": "professional_confirmation",
        "professional_assessment_required": "professional_confirmation",
        "pending_board_approval": "approval_or_renewal",
        "exchange_query_pending": "filing_readiness",
        "underwriting_pending": "filing_readiness",
        "market_making_pending": "filing_readiness",
        "issue_infrastructure_pending": "filing_readiness",
        "listing_action_pending": "filing_readiness",
        "not_applicable": "other_review_required",
    }
    return mapping.get(normalized, "other_review_required")


def category_from_ci_issue_type(issue_type: str) -> IssueCategory:
    normalized = issue_type.strip().lower()
    if "evidence" in normalized or "document" in normalized:
        return "evidence_gap"
    if "discrep" in normalized or "conflict" in normalized or "contradict" in normalized:
        return "inconsistent_information"
    if "missing" in normalized:
        return "missing_information"
    return "other_review_required"


def category_from_drhp_requirement(
    *,
    classification: str,
    placeholder_allowed: bool,
) -> IssueCategory:
    normalized = classification.strip().lower()
    if normalized in {"allowed_placeholder", "placeholder"} and placeholder_allowed:
        return "drhp_readiness"
    if normalized in {"missing", "gap"}:
        return "drhp_readiness"
    if normalized in {"professional_confirmation", "review_required"}:
        return "professional_confirmation"
    if normalized == "unknown_applicability":
        return "other_review_required"
    return "drhp_readiness"
