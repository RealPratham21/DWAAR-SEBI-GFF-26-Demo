"""Shared constants for Global Issues & Gaps (G4)."""

from __future__ import annotations

from typing import Literal

IssueCategory = Literal[
    "missing_information",
    "inconsistent_information",
    "evidence_gap",
    "reconciliation_issue",
    "professional_confirmation",
    "approval_or_renewal",
    "filing_readiness",
    "financial_readiness",
    "legal_or_regulatory",
    "document_readiness",
    "drhp_readiness",
    "generation_warning",
    "stale_draft",
    "other_review_required",
]

IssueSeverity = Literal["blocking", "high", "medium", "low"]
IssueLifecycleState = Literal["open", "acknowledged", "cleared"]
IssueSourceKind = Literal[
    "workstream_assessment",
    "company_incorporation_issue",
    "cross_workstream_conflict",
    "drhp_readiness",
    "drhp_generation",
    "drhp_staleness",
]

GREEN_ASSESSMENT_STATES = frozenset(
    {
        "reconciled",
        "substantiated",
        "appears_satisfied",
        "appears_ready",
        "appears_reconciled",
        "broadly_substantiated",
        "ready",
        "not_applicable",
        "preliminary_criteria_appear_satisfied",
    }
)

WORKSTREAM_LABELS: dict[str, str] = {
    "company-incorporation": "Company & Incorporation",
    "ipo-setup-eligibility": "IPO Setup & Eligibility",
    "capital-ownership": "Capital & Ownership",
    "business-operations": "Business & Operations",
    "objects-of-issue": "Objects of the Issue",
    "financials-kpis": "Financials & KPIs",
    "management-governance": "Management & Governance",
    "industry-market": "Industry & Market",
    "group-entities-related-parties": "Group Entities & Related Parties",
    "borrowings-assets-contracts": "Borrowings, Assets & Contracts",
    "litigation-approvals-compliance": "Litigation, Approvals & Compliance",
    "intermediaries-filing": "Intermediaries & Filing",
}

DRHP_RELATED_CATEGORIES = frozenset(
    {
        "drhp_readiness",
        "generation_warning",
        "stale_draft",
    }
)

EVIDENCE_GAP_CATEGORIES = frozenset({"evidence_gap", "document_readiness"})
INCONSISTENCY_CATEGORIES = frozenset({"inconsistent_information", "reconciliation_issue"})

GENERATION_WARNING_MESSAGES: dict[str, str] = {
    "unauthorized_placeholder": (
        "An unresolved placeholder appears in the generated chapter although the source "
        "requirement does not permit one."
    ),
    "unsupported_numeric_claim": (
        "Generated narrative includes numeric claims that could not be traced to source references."
    ),
    "unsupported_number": (
        "Generated narrative includes a numeric value that could not be traced to source references."
    ),
    "unknown_source_ref": "Generated content references a source that is not in the chapter bundle.",
    "prohibited_claim": "Generated content includes wording that requires professional review.",
}
