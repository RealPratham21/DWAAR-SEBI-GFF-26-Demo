"""DRHP module constants for readiness and source snapshots."""

from __future__ import annotations

REGISTRY_VERSION = "1.0.0"
SNAPSHOT_SCHEMA_VERSION = "1.0.0"


class ConnectionStatus:
    NOT_CONNECTED = "not_connected"
    PARTIALLY_CONNECTED = "partially_connected"
    CONNECTED = "connected"


class GenerationStatus:
    BLOCKED = "blocked"
    READY_WITH_GAPS = "ready_with_gaps"
    READY_TO_GENERATE = "ready_to_generate"


class RequirementClassification:
    REQUIRED = "required"
    CONDITIONAL = "conditional"
    OPTIONAL = "optional"
    FUTURE_GAP = "future_gap"
    UNKNOWN_APPLICABILITY = "unknown_applicability"


class ApplicabilityStatus:
    APPLICABLE = "applicable"
    NOT_APPLICABLE = "not_applicable"
    UNKNOWN = "unknown"


class CoverageStatus:
    SATISFIED = "satisfied"
    MISSING = "missing"
    UNKNOWN_APPLICABILITY = "unknown_applicability"
    BLOCKED = "blocked"
    GAP = "gap"
    WARNING = "warning"


class SelectedSourceType:
    INFORMATION = "information"
    NONE = "none"
    CANDIDATE_ASSERTION = "candidate_assertion"


class SourceAdapterKey:
    NONE = "none"
    COMPANY_INCORPORATION = "company_incorporation"


class DrhpErrorCode:
    CHAPTER_NOT_FOUND = "DRHP_CHAPTER_NOT_FOUND"
    CHAPTER_NOT_CONNECTED = "DRHP_CHAPTER_NOT_CONNECTED"
    WORKSPACE_NOT_FOUND = "DRHP_WORKSPACE_NOT_FOUND"
    SNAPSHOT_NOT_FOUND = "DRHP_SNAPSHOT_NOT_FOUND"
    SNAPSHOT_FORBIDDEN = "DRHP_SNAPSHOT_FORBIDDEN"


# Frontend chapter keys (must stay aligned with frontend/lib/drhp/chapters.ts).
ALL_CHAPTER_KEYS: tuple[str, ...] = (
    "cover-page-front-matter",
    "definitions-abbreviations",
    "risk-factors",
    "general-information",
    "company-history-incorporation",
    "capital-structure-ownership",
    "objects-of-the-issue",
    "business-operations",
    "management-governance",
    "financial-information-kpis",
    "legal-regulatory-information",
    "material-contracts",
    "related-party-transactions",
    "main-terms-of-the-issue",
    "declarations-miscellaneous",
)

SUPPORTED_CHAPTER_KEYS: frozenset[str] = frozenset(
    {
        "cover-page-front-matter",
        "company-history-incorporation",
    }
)

CHAPTER_TITLES: dict[str, str] = {
    "cover-page-front-matter": "Cover Page & Front Matter",
    "definitions-abbreviations": "Definitions & Abbreviations",
    "risk-factors": "Risk Factors",
    "general-information": "General Information",
    "company-history-incorporation": "Company History & Incorporation",
    "capital-structure-ownership": "Capital Structure & Ownership",
    "objects-of-the-issue": "Objects of the Issue",
    "business-operations": "Business & Operations",
    "management-governance": "Management & Governance",
    "financial-information-kpis": "Financial Information & KPIs",
    "legal-regulatory-information": "Legal & Regulatory Information",
    "material-contracts": "Material Contracts",
    "related-party-transactions": "Related Party Transactions",
    "main-terms-of-the-issue": "Main Terms of the Issue",
    "declarations-miscellaneous": "Declarations & Miscellaneous",
}

OPEN_ISSUE_STATUSES: frozenset[str] = frozenset(
    {
        "open",
        "awaiting_clarification",
        "escalated",
    }
)
