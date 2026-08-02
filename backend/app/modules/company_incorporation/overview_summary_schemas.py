"""Pydantic contracts for overview readiness summary."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.modules.company_incorporation.schemas import ApiModel

SectionStatusLiteral = Literal["not_started", "in_progress", "complete"]
ReadinessStatusLiteral = Literal[
    "not_started",
    "in_progress",
    "complete",
    "failed",
    "review_required",
    "clear",
    "blocking",
    "processing",
    "not_assessed",
]


class OverviewSectionStatus(ApiModel):
    section_id: str
    status: SectionStatusLiteral


class OverviewInformationSummary(ApiModel):
    completed_sections: int
    total_sections: int
    status: SectionStatusLiteral
    sections: list[OverviewSectionStatus] = Field(default_factory=list)


class OverviewDocumentsSummary(ApiModel):
    mandatory_required: int = 0
    mandatory_uploaded: int = 0
    mandatory_processed: int = 0
    mandatory_failed: int = 0
    active_processing_count: int = 0
    structured_extraction_active_count: int = 0
    documents_with_warnings: int = 0
    status: ReadinessStatusLiteral = "not_started"


class OverviewFactsSummary(ApiModel):
    fact_group_count: int = 0
    assertion_count: int = 0
    approved_assertion_count: int = 0
    pending_review_count: int = 0
    rejected_count: int = 0
    historical_count: int = 0
    low_quality_count: int = 0
    invalid_assertion_count: int = 0
    facts_with_multiple_sources: int = 0
    status: ReadinessStatusLiteral = "not_started"


class OverviewConflictsSummary(ApiModel):
    open_issue_count: int = 0
    blocking_issue_count: int = 0
    warning_issue_count: int = 0
    awaiting_clarification_count: int = 0
    escalated_count: int = 0
    resolved_issue_count: int = 0
    status: ReadinessStatusLiteral = "not_started"


class OverviewDisclosuresSummary(ApiModel):
    status: Literal["not_assessed"] = "not_assessed"


class OverviewProfessionalReviewSummary(ApiModel):
    status: Literal["not_assessed"] = "not_assessed"


class OverviewBlocker(ApiModel):
    code: str
    message: str


class OverviewWarning(ApiModel):
    code: str
    message: str


class OverviewSummaryResponse(ApiModel):
    information: OverviewInformationSummary
    documents: OverviewDocumentsSummary
    facts: OverviewFactsSummary
    conflicts: OverviewConflictsSummary
    disclosures: OverviewDisclosuresSummary
    professional_review: OverviewProfessionalReviewSummary
    overall_status: str
    ready_for_disclosure_generation: bool = False
    blockers: list[OverviewBlocker] = Field(default_factory=list)
    warnings: list[OverviewWarning] = Field(default_factory=list)
    last_updated_at: datetime
