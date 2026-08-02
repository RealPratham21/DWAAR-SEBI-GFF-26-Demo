from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.modules.company_incorporation.schemas import ApiModel

StructuredRunStatusLiteral = Literal[
    "queued",
    "running",
    "completed",
    "completed_with_warnings",
    "failed",
    "cancelled",
]

DeterministicStatusLiteral = Literal["pending", "running", "completed", "failed"]

SemanticStatusLiteral = Literal[
    "pending",
    "running",
    "completed",
    "not_required",
    "skipped_disabled",
    "failed",
]

ComparisonStatusLiteral = Literal[
    "not_compared",
    "matched",
    "conflicting",
    "possible_match",
    "possible_historical",
    "no_information",
    "extractor_disagreement",
]

ReviewStatusLiteral = Literal["pending", "approved", "rejected", "historical", "superseded"]

QualityCategoryLiteral = Literal["high", "medium", "low", "review_required"]

ReviewActionLiteral = Literal["approve", "reject", "mark_historical", "return_to_pending"]

IssueStatusLiteral = Literal[
    "open",
    "awaiting_clarification",
    "escalated",
    "resolved",
    "dismissed",
]

IssueSeverityLiteral = Literal["info", "warning", "blocking"]

ResolutionDecisionLiteral = Literal[
    "keep_information",
    "accept_document",
    "mark_document_historical",
    "reject_document_value",
    "request_clarification",
    "escalate_for_professional_review",
    "dismiss_non_material",
]


class StructuredExtractionStatusResponse(ApiModel):
    document_version_id: str
    document_status: str
    document_processing_run_id: str | None = None
    latest_run_status: StructuredRunStatusLiteral | None = None
    latest_attempt_status: StructuredRunStatusLiteral | None = None
    latest_completed_run_status: StructuredRunStatusLiteral | None = None
    latest_usable_run_id: str | None = None
    attempt_number: int | None = None
    extractor_version: str | None = None
    fact_schema_version: str | None = None
    prompt_version: str | None = None
    provider: str | None = None
    model_name: str | None = None
    deterministic_status: DeterministicStatusLiteral | None = None
    semantic_status: SemanticStatusLiteral | None = None
    usable: bool = False
    queued_at: datetime | None = None
    claimed_at: datetime | None = None
    completed_at: datetime | None = None
    assertion_count: int = 0
    open_issue_count: int = 0
    warnings: list[str] = Field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None
    cancelled: bool = False
    cancellation_reason: str | None = None
    retry_available: bool = False


class StructuredExtractionRunSummaryResponse(ApiModel):
    id: str
    status: StructuredRunStatusLiteral
    attempt_number: int
    document_processing_run_id: str
    extractor_version: str
    fact_schema_version: str
    prompt_version: str
    provider: str | None = None
    model_name: str | None = None
    deterministic_status: DeterministicStatusLiteral
    semantic_status: SemanticStatusLiteral
    usable: bool = False
    queued_at: datetime
    claimed_at: datetime | None = None
    completed_at: datetime | None = None
    assertion_count: int = 0
    warnings: list[str] = Field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None
    cancelled: bool = False
    cancellation_reason: str | None = None


class StructuredExtractionHistoryResponse(ApiModel):
    document_version_id: str
    latest_attempt_run_id: str | None = None
    latest_completed_run_id: str | None = None
    latest_usable_run_id: str | None = None
    runs: list[StructuredExtractionRunSummaryResponse]


class RetryStructuredExtractionResponse(ApiModel):
    document_version_id: str
    document_processing_run_id: str
    structured_extraction_run_id: str
    status: StructuredRunStatusLiteral
    extractor_version: str
    fact_schema_version: str
    prompt_version: str


class FactAssertionSummaryResponse(ApiModel):
    id: str
    fact_key: str
    requirement_key: str
    document_version_id: str
    structured_extraction_run_id: str
    display_value: str
    comparison_status: ComparisonStatusLiteral
    review_status: ReviewStatusLiteral
    quality_category: QualityCategoryLiteral
    quality_score: float | None = None
    extractor_kind: str
    validation_status: str
    source_temporality: str


class FactGroupResponse(ApiModel):
    fact_key: str
    display_label: str
    information_value: Any | None = None
    assertions: list[FactAssertionSummaryResponse] = Field(default_factory=list)


class FactsListResponse(ApiModel):
    total_fact_keys: int = 0
    total_assertions: int = 0
    groups: list[FactGroupResponse] = Field(default_factory=list)


class FactAssertionReviewEntryResponse(ApiModel):
    id: str
    action: ReviewActionLiteral
    rationale: str | None = None
    reviewed_by_user_id: str
    created_at: datetime


class FactAssertionDetailResponse(FactAssertionSummaryResponse):
    raw_value: Any | None = None
    normalized_value: Any | None = None
    quality_signals: dict[str, Any] = Field(default_factory=dict)
    document_processing_run_id: str
    reviews: list[FactAssertionReviewEntryResponse] = Field(default_factory=list)


class FactEvidenceItemResponse(ApiModel):
    id: str
    document_page_id: str
    block_id: str
    evidence_role: str
    quote_snapshot: str
    bbox_snapshot: dict[str, Any]
    page_number: int
    extraction_method: str
    ocr_confidence: float | None = None
    block_order_index: int


class FactEvidenceResponse(ApiModel):
    assertion_id: str
    items: list[FactEvidenceItemResponse] = Field(default_factory=list)


class ReviewAssertionRequest(ApiModel):
    action: ReviewActionLiteral
    rationale: str | None = None


class ReviewAssertionResponse(ApiModel):
    assertion_id: str
    review_status: ReviewStatusLiteral
    action: ReviewActionLiteral
    review_id: str
    created_at: datetime


class FactIssueResolutionHistoryItem(ApiModel):
    id: str
    decision: ResolutionDecisionLiteral | str
    rationale: str
    selected_assertion_id: str | None = None
    resolved_by_user_id: str | None = None
    resolver_display_name: str | None = None
    information_value_snapshot: Any | None = None
    document_value_snapshot: Any | None = None
    created_at: datetime


class FactIssueAssertionLinkResponse(ApiModel):
    fact_assertion_id: str
    role: str
    fact_key: str | None = None
    display_value: str | None = None
    normalized_value: Any | None = None
    comparison_status: ComparisonStatusLiteral | None = None
    review_status: ReviewStatusLiteral | None = None
    quality_category: QualityCategoryLiteral | None = None
    source_temporality: str | None = None
    document_id: str | None = None
    document_version_id: str | None = None
    original_filename: str | None = None
    version_number: int | None = None
    requirement_key: str | None = None
    requirement_label: str | None = None
    page_numbers: list[int] = Field(default_factory=list)
    evidence_summary: list[str] = Field(default_factory=list)
    extraction_methods: list[str] = Field(default_factory=list)
    ocr_derived: bool = False


class FactIssueSummaryResponse(ApiModel):
    id: str
    fact_key: str
    issue_type: str
    title: str
    severity: IssueSeverityLiteral
    blocking: bool
    status: IssueStatusLiteral
    created_at: datetime
    resolved_at: datetime | None = None


class FactIssuesListResponse(ApiModel):
    total: int = 0
    issues: list[FactIssueSummaryResponse] = Field(default_factory=list)


class FactIssueDetailResponse(FactIssueSummaryResponse):
    description: str
    suggested_actions: list[str] = Field(default_factory=list)
    information_value_snapshot: Any | None = None
    information_normalized_snapshot: Any | None = None
    linked_assertions: list[FactIssueAssertionLinkResponse] = Field(default_factory=list)
    resolution_history: list[FactIssueResolutionHistoryItem] = Field(default_factory=list)


class ResolveIssueRequest(ApiModel):
    decision: ResolutionDecisionLiteral
    rationale: str
    selected_assertion_id: str | None = None


class ResolveIssueResponse(ApiModel):
    issue_id: str
    status: IssueStatusLiteral
    decision: ResolutionDecisionLiteral
    resolution_id: str
    information_update_required: bool = False
