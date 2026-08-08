"""DRHP module constants for readiness, generation snapshots, and chapter registry."""

from __future__ import annotations

REGISTRY_VERSION = "2.0.0"
SNAPSHOT_SCHEMA_VERSION = "1.0.0"
GENERATION_SNAPSHOT_SCHEMA_VERSION = "1.0.0"
AST_SCHEMA_VERSION = "1.0.0"
BUNDLE_SCHEMA_VERSION = "1.0.0"

PLACEHOLDER_TOKEN = "[●]"


class ConnectionStatus:
    NOT_CONNECTED = "not_connected"
    PARTIALLY_CONNECTED = "partially_connected"
    CONNECTED = "connected"


class GenerationStatus:
    BLOCKED = "blocked"
    READY_WITH_GAPS = "ready_with_gaps"
    READY_WITH_PLACEHOLDERS = "ready_with_placeholders"
    READY_TO_GENERATE = "ready_to_generate"
    DEPENDS_ON_GENERATED = "depends_on_generated_chapters"


class RequirementClassification:
    REQUIRED = "required"
    CONDITIONAL = "conditional"
    OPTIONAL = "optional"
    FUTURE_GAP = "future_gap"
    UNKNOWN_APPLICABILITY = "unknown_applicability"
    PLACEHOLDER_ALLOWED = "placeholder_allowed"
    PROFESSIONAL_CONFIRMATION = "professional_confirmation_required"
    GENERATED_DEPENDENCY = "generated_dependency_pending"


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
    PLACEHOLDER = "placeholder"
    GENERATED_DEPENDENCY = "generated_dependency_pending"


class SelectedSourceType:
    INFORMATION = "information"
    NONE = "none"
    CANDIDATE_ASSERTION = "candidate_assertion"
    STRUCTURED_USER_INPUT = "structured_user_input"
    DOCUMENT_BACKED_FACT = "document_backed_fact"
    DETERMINISTIC_CALCULATION = "deterministic_calculation"
    LINKED_WORKSTREAM_VALUE = "linked_workstream_value"
    PLACEHOLDER = "placeholder"


class SourceRefType:
    STRUCTURED_USER_INPUT = "structured_user_input"
    DOCUMENT_BACKED_FACT = "document_backed_fact"
    ASSERTION_OR_EVIDENCE = "assertion_or_evidence"
    DETERMINISTIC_CALCULATION = "deterministic_calculation"
    LINKED_WORKSTREAM_VALUE = "linked_workstream_value"
    PROFESSIONAL_CONFIRMATION = "professional_confirmation"
    PLACEHOLDER = "placeholder"


class BlockSupportState:
    EVIDENCE_BACKED = "evidence_backed"
    STRUCTURED_INPUT_BACKED = "structured_input_backed"
    CALCULATION_BACKED = "calculation_backed"
    PROFESSIONAL_CONFIRMATION_PENDING = "professional_confirmation_pending"
    PLACEHOLDER = "placeholder"
    MIXED_SUPPORT = "mixed_support"


class GenerationPhase:
    SNAPSHOT_CONTEXT = "phase_0_snapshot_context"
    CORE_SUBSTANTIVE = "phase_1_core_substantive"
    DERIVED_ANALYTICAL = "phase_2_derived_analytical"
    WHOLE_DOCUMENT_SYNTHESIS = "phase_3_whole_document_synthesis"
    FINAL_ASSEMBLY = "phase_4_final_assembly"


class SourceAdapterKey:
    NONE = "none"
    COMPANY_INCORPORATION = "company_incorporation"
    GENERATION_SNAPSHOT = "generation_snapshot"


PROMPT_VERSION = "drhp-g2-v1"
RULES_VERSION = "1.0.0"


class DocumentVersionStatus:
    QUEUED = "queued"
    GENERATING = "generating"
    GENERATED = "generated"
    GENERATED_WITH_WARNINGS = "generated_with_warnings"
    PARTIALLY_GENERATED = "partially_generated"
    FAILED = "failed"


class ChapterVersionStatus:
    QUEUED = "queued"
    WAITING_FOR_DEPENDENCY = "waiting_for_dependency"
    GENERATING = "generating"
    GENERATED = "generated"
    GENERATED_WITH_WARNINGS = "generated_with_warnings"
    BLOCKED = "blocked"
    FAILED = "failed"


class ChapterGenerationMode:
    DETERMINISTIC = "deterministic"
    HYBRID = "hybrid"
    DERIVED = "derived"


CHAPTER_GENERATION_MODES: dict[str, str] = {
    "cover-page-front-matter": ChapterGenerationMode.DETERMINISTIC,
    "general-information-issue": ChapterGenerationMode.DETERMINISTIC,
    "capital-structure-ownership": ChapterGenerationMode.DETERMINISTIC,
    "terms-structure-procedure": ChapterGenerationMode.DETERMINISTIC,
    "material-contracts-inspection": ChapterGenerationMode.DETERMINISTIC,
    "declarations-aoa-miscellaneous": ChapterGenerationMode.DETERMINISTIC,
    "objects-of-the-issue": ChapterGenerationMode.HYBRID,
    "basis-for-issue-price": ChapterGenerationMode.HYBRID,
    "industry-overview": ChapterGenerationMode.HYBRID,
    "business-operations": ChapterGenerationMode.HYBRID,
    "company-history-promoters-structure": ChapterGenerationMode.HYBRID,
    "management-governance": ChapterGenerationMode.HYBRID,
    "financial-information-mda": ChapterGenerationMode.HYBRID,
    "legal-regulatory-approvals": ChapterGenerationMode.HYBRID,
    "group-companies-rpt": ChapterGenerationMode.HYBRID,
    "risk-factors": ChapterGenerationMode.DERIVED,
    "definitions-abbreviations": ChapterGenerationMode.DERIVED,
    "summary-of-drhp": ChapterGenerationMode.DERIVED,
}


class DrhpErrorCode:
    CHAPTER_NOT_FOUND = "DRHP_CHAPTER_NOT_FOUND"
    CHAPTER_NOT_CONNECTED = "DRHP_CHAPTER_NOT_CONNECTED"
    WORKSPACE_NOT_FOUND = "DRHP_WORKSPACE_NOT_FOUND"
    SNAPSHOT_NOT_FOUND = "DRHP_SNAPSHOT_NOT_FOUND"
    SNAPSHOT_FORBIDDEN = "DRHP_SNAPSHOT_FORBIDDEN"
    GENERATION_SNAPSHOT_NOT_FOUND = "DRHP_GENERATION_SNAPSHOT_NOT_FOUND"
    GENERATION_SNAPSHOT_FORBIDDEN = "DRHP_GENERATION_SNAPSHOT_FORBIDDEN"
    WORKSTREAMS_INCOMPLETE = "DRHP_WORKSTREAMS_INCOMPLETE"
    DOCUMENT_NOT_FOUND = "DRHP_DOCUMENT_NOT_FOUND"
    DOCUMENT_VERSION_NOT_FOUND = "DRHP_DOCUMENT_VERSION_NOT_FOUND"
    DOCUMENT_FORBIDDEN = "DRHP_DOCUMENT_FORBIDDEN"
    GENERATION_IN_PROGRESS = "DRHP_GENERATION_IN_PROGRESS"
    CHAPTER_VERSION_NOT_FOUND = "DRHP_CHAPTER_VERSION_NOT_FOUND"
    EXPORT_NOT_AVAILABLE = "DRHP_EXPORT_NOT_AVAILABLE"


# Canonical 18-chapter registry (aligned with frontend/lib/drhp/chapters.ts).
ALL_CHAPTER_KEYS: tuple[str, ...] = (
    "cover-page-front-matter",
    "definitions-abbreviations",
    "summary-of-drhp",
    "risk-factors",
    "general-information-issue",
    "capital-structure-ownership",
    "objects-of-the-issue",
    "basis-for-issue-price",
    "industry-overview",
    "business-operations",
    "company-history-promoters-structure",
    "management-governance",
    "financial-information-mda",
    "legal-regulatory-approvals",
    "group-companies-rpt",
    "terms-structure-procedure",
    "material-contracts-inspection",
    "declarations-aoa-miscellaneous",
)

# Legacy keys from G1 v1 registry — resolved to canonical keys.
CHAPTER_KEY_ALIASES: dict[str, str] = {
    "general-information": "general-information-issue",
    "company-history-incorporation": "company-history-promoters-structure",
    "financial-information-kpis": "financial-information-mda",
    "legal-regulatory-information": "legal-regulatory-approvals",
    "related-party-transactions": "group-companies-rpt",
    "main-terms-of-the-issue": "terms-structure-procedure",
    "material-contracts": "material-contracts-inspection",
    "declarations-miscellaneous": "declarations-aoa-miscellaneous",
}

SUPPORTED_CHAPTER_KEYS: frozenset[str] = frozenset(ALL_CHAPTER_KEYS)

CHAPTER_TITLES: dict[str, str] = {
    "cover-page-front-matter": "Cover Page & Front Matter",
    "definitions-abbreviations": "Definitions & Abbreviations",
    "summary-of-drhp": "Summary of DRHP",
    "risk-factors": "Risk Factors",
    "general-information-issue": "General Information & The Issue",
    "capital-structure-ownership": "Capital Structure & Ownership",
    "objects-of-the-issue": "Objects of the Issue",
    "basis-for-issue-price": "Basis for Issue Price",
    "industry-overview": "Industry Overview",
    "business-operations": "Business & Operations",
    "company-history-promoters-structure": "Company History, Promoters & Corporate Structure",
    "management-governance": "Management & Governance",
    "financial-information-mda": "Financial Information & MD&A",
    "legal-regulatory-approvals": "Legal, Regulatory & Approvals",
    "group-companies-rpt": "Group Companies & Related Party Transactions",
    "terms-structure-procedure": "Terms, Structure & Procedure of the Issue",
    "material-contracts-inspection": "Material Contracts & Documents for Inspection",
    "declarations-aoa-miscellaneous": "Declarations, AOA & Miscellaneous",
}

OPEN_ISSUE_STATUSES: frozenset[str] = frozenset(
    {
        "open",
        "awaiting_clarification",
        "escalated",
    }
)

WORKSTREAM_SLUGS: tuple[str, ...] = (
    "company-incorporation",
    "ipo-setup-eligibility",
    "capital-ownership",
    "business-operations",
    "objects-of-issue",
    "financials-kpis",
    "management-governance",
    "industry-market",
    "group-entities-related-parties",
    "borrowings-assets-contracts",
    "litigation-approvals-compliance",
    "intermediaries-filing",
)


def resolve_chapter_key(key: str) -> str | None:
    """Resolve alias or canonical chapter key."""
    normalized = key.strip()
    if normalized in ALL_CHAPTER_KEYS:
        return normalized
    return CHAPTER_KEY_ALIASES.get(normalized)
