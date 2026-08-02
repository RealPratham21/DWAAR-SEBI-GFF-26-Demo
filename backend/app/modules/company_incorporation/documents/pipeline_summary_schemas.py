"""Pydantic contracts for the document pipeline summary endpoint."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field

from app.modules.company_incorporation.schemas import ApiModel


class PageProcessingPipelineSummary(ApiModel):
    latest_attempt_id: str | None = None
    latest_attempt_status: str | None = None
    latest_completed_run_id: str | None = None
    latest_evidence_ready_run_id: str | None = None
    evidence_ready: bool = False
    page_count: int = 0
    extraction_method_counts: dict[str, Any] = Field(default_factory=dict)
    warning_count: int = 0
    warnings: list[str] = Field(default_factory=list)
    retry_available: bool = False
    safe_error_message: str | None = None
    queued_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class StructuredExtractionPipelineSummary(ApiModel):
    latest_run_id: str | None = None
    latest_run_status: str | None = None
    latest_usable_run_id: str | None = None
    deterministic_status: str | None = None
    semantic_status: str | None = None
    provider: str | None = None
    model_name: str | None = None
    assertion_count: int = 0
    pending_review_count: int = 0
    approved_count: int = 0
    open_issue_count: int = 0
    blocking_issue_count: int = 0
    warning_issue_count: int = 0
    warnings: list[str] = Field(default_factory=list)
    retry_available: bool = False
    safe_error_message: str | None = None
    queued_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class DocumentPipelineSummaryItem(ApiModel):
    document_id: str
    document_version_id: str
    requirement_key: str
    requirement_label: str
    original_filename: str
    version_number: int
    uploaded_at: datetime | None = None
    document_version_status: str
    is_current: bool = True
    archived: bool = False
    page_processing: PageProcessingPipelineSummary
    structured_extraction: StructuredExtractionPipelineSummary


class WorkstreamPipelineAggregation(ApiModel):
    has_active_page_processing: bool = False
    has_active_structured_extraction: bool = False
    has_any_active_pipeline: bool = False
    total_current_documents: int = 0
    documents_awaiting_processing: int = 0
    documents_processing: int = 0
    documents_extracting_facts: int = 0
    documents_ready_for_review: int = 0
    documents_with_failures: int = 0
    last_updated_at: datetime


class DocumentPipelineSummaryResponse(ApiModel):
    documents: list[DocumentPipelineSummaryItem] = Field(default_factory=list)
    aggregation: WorkstreamPipelineAggregation
