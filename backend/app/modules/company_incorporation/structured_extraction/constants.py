"""Enumerations and version constants for structured fact extraction."""

from __future__ import annotations

EXTRACTOR_VERSION = "1.1.0"
FACT_SCHEMA_VERSION = "1.0.0"
PROMPT_VERSION = "1.0.0"
COMPARISON_VERSION = "1.1.0"


class StructuredRunStatus:
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"
    FAILED = "failed"
    CANCELLED = "cancelled"


ACTIVE_STRUCTURED_RUN_STATUSES: frozenset[str] = frozenset(
    {
        StructuredRunStatus.QUEUED,
        StructuredRunStatus.RUNNING,
    }
)


class DeterministicStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SemanticStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    NOT_REQUIRED = "not_required"
    SKIPPED_DISABLED = "skipped_disabled"
    FAILED = "failed"


class ExtractorKind:
    DETERMINISTIC = "deterministic"
    SEMANTIC = "semantic"
    HYBRID = "hybrid"


class ValidationStatus:
    VALID = "valid"
    INVALID = "invalid"
    UNCERTAIN = "uncertain"


class ComparisonStatus:
    NOT_COMPARED = "not_compared"
    MATCHED = "matched"
    CONFLICTING = "conflicting"
    POSSIBLE_MATCH = "possible_match"
    POSSIBLE_HISTORICAL = "possible_historical"
    NO_INFORMATION = "no_information"
    EXTRACTOR_DISAGREEMENT = "extractor_disagreement"


class ReviewStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    HISTORICAL = "historical"
    SUPERSEDED = "superseded"


class QualityCategory:
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    REVIEW_REQUIRED = "review_required"


class SourceTemporality:
    CURRENT = "current"
    HISTORICAL = "historical"
    UNKNOWN = "unknown"


class EvidenceRole:
    LABEL = "label"
    VALUE = "value"
    CONTEXT = "context"
    CLAUSE = "clause"
    SUPPORTING = "supporting"


class IssueType:
    CONFLICTING_VALUE = "conflicting_value"
    POSSIBLE_HISTORICAL_VALUE = "possible_historical_value"
    OUTDATED_REGISTRATION = "outdated_registration"
    MISSING_EXPECTED_FACT = "missing_expected_fact"
    LOW_EXTRACTION_QUALITY = "low_extraction_quality"
    INVALID_IDENTIFIER = "invalid_identifier"
    EXTRACTOR_DISAGREEMENT = "extractor_disagreement"
    DOCUMENT_CONTENT_MISMATCH = "document_content_mismatch"
    CLARIFICATION_REQUIRED = "clarification_required"


class IssueSeverity:
    INFO = "info"
    WARNING = "warning"
    BLOCKING = "blocking"


class IssueStatus:
    OPEN = "open"
    AWAITING_CLARIFICATION = "awaiting_clarification"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class IssueAssertionRole:
    CONFLICTING = "conflicting"
    SUPPORTING = "supporting"
    HISTORICAL = "historical"
    SELECTED = "selected"
    REJECTED = "rejected"


class ResolutionDecision:
    KEEP_INFORMATION = "keep_information"
    ACCEPT_DOCUMENT = "accept_document"
    MARK_DOCUMENT_HISTORICAL = "mark_document_historical"
    REJECT_DOCUMENT_VALUE = "reject_document_value"
    REQUEST_CLARIFICATION = "request_clarification"
    ESCALATE_FOR_PROFESSIONAL_REVIEW = "escalate_for_professional_review"
    DISMISS_NON_MATERIAL = "dismiss_non_material"


class ReviewAction:
    APPROVE = "approve"
    REJECT = "reject"
    MARK_HISTORICAL = "mark_historical"
    RETURN_TO_PENDING = "return_to_pending"


class FactValueType:
    STRING = "string"
    DATE = "date"
    ADDRESS = "address"
    IDENTIFIER = "identifier"
    TEXT = "text"
    STRING_LIST = "string_list"


class ComparisonStrategy:
    EXACT_IDENTIFIER = "exact_identifier"
    DATE = "date"
    LEGAL_NAME = "legal_name"
    ADDRESS = "address"
    TEXT = "text"
    STRING_LIST = "string_list"


class StructuredExtractionErrorCode:
    DISABLED = "STRUCTURED_EXTRACTION_DISABLED"
    UNSUPPORTED_REQUIREMENT = "STRUCTURED_EXTRACTION_UNSUPPORTED_REQUIREMENT"
    NOT_EVIDENCE_READY = "STRUCTURED_EXTRACTION_NOT_EVIDENCE_READY"
    NO_USABLE_PAGES = "STRUCTURED_EXTRACTION_NO_USABLE_PAGES"
    TIMEOUT = "STRUCTURED_EXTRACTION_TIMEOUT"
    PROVIDER_ERROR = "STRUCTURED_EXTRACTION_PROVIDER_ERROR"
    PROVIDER_UNAVAILABLE = "STRUCTURED_EXTRACTION_PROVIDER_UNAVAILABLE"
    MISSING_API_KEY = "STRUCTURED_EXTRACTION_MISSING_API_KEY"
    VALIDATION_FAILED = "STRUCTURED_EXTRACTION_VALIDATION_FAILED"
    INTERNAL_ERROR = "STRUCTURED_EXTRACTION_INTERNAL_ERROR"
    CANCELLED = "STRUCTURED_EXTRACTION_CANCELLED"
    RETRY_NOT_ALLOWED = "STRUCTURED_EXTRACTION_RETRY_NOT_ALLOWED"
    ACTIVE_RUN_EXISTS = "STRUCTURED_EXTRACTION_ACTIVE_RUN_EXISTS"
    RUN_NOT_FOUND = "STRUCTURED_EXTRACTION_RUN_NOT_FOUND"
    ARCHIVED_OR_SUPERSEDED = "STRUCTURED_EXTRACTION_ARCHIVED_OR_SUPERSEDED"
