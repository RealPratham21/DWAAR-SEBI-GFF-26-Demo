from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.modules.company_incorporation.schemas import ApiModel

ProcessingRunStatusLiteral = Literal[
    "queued",
    "processing",
    "completed",
    "failed",
    "cancelled",
]

ExtractionMethodLiteral = Literal[
    "native_text",
    "ocr",
    "native_text_with_ocr_fallback",
]


class ProcessingStatusResponse(ApiModel):
    document_version_id: str
    document_status: str
    latest_run_status: ProcessingRunStatusLiteral | None = None
    latest_attempt_status: ProcessingRunStatusLiteral | None = None
    latest_completed_run_status: ProcessingRunStatusLiteral | None = None
    latest_evidence_ready_run_id: str | None = None
    attempt_number: int | None = None
    processor_version: str | None = None
    output_schema_version: int | None = None
    evidence_ready: bool = False
    queued_at: datetime | None = None
    claimed_at: datetime | None = None
    completed_at: datetime | None = None
    page_count: int = 0
    schema_v2_page_count: int = 0
    block_count: int = 0
    extraction_method_counts: dict[str, int] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None
    cancelled: bool = False
    cancellation_reason: str | None = None
    retry_available: bool = False


class ProcessingRunSummaryResponse(ApiModel):
    id: str
    status: ProcessingRunStatusLiteral
    attempt_number: int
    processor_version: str
    output_schema_version: int
    evidence_ready: bool = False
    queued_at: datetime
    claimed_at: datetime | None = None
    completed_at: datetime | None = None
    page_count: int = 0
    schema_v2_page_count: int = 0
    block_count: int = 0
    warnings: list[str] = Field(default_factory=list)
    error_code: str | None = None
    error_message: str | None = None
    cancelled: bool = False
    cancellation_reason: str | None = None


class ProcessingHistoryResponse(ApiModel):
    document_version_id: str
    latest_attempt_run_id: str | None = None
    latest_completed_run_id: str | None = None
    latest_evidence_ready_run_id: str | None = None
    runs: list[ProcessingRunSummaryResponse]


class DocumentPageResponse(ApiModel):
    id: str
    page_number: int
    extraction_method: ExtractionMethodLiteral
    block_count: int = 0
    page_width: float | None = None
    page_height: float | None = None
    detected_rotation: float = 0.0
    native_text_length: int = 0
    average_ocr_confidence: float | None = None
    warnings: list[str] = Field(default_factory=list)
    coordinate_space: str | None = None
    coordinate_metadata: dict[str, Any] | None = None
    evidence_ready: bool = False
    text: str | None = None
    text_blocks: list[dict[str, Any]] | None = None


class DocumentPagesResponse(ApiModel):
    document_version_id: str
    processing_run_id: str | None = None
    output_schema_version: int | None = None
    evidence_ready: bool = False
    processor_version: str | None = None
    page_count: int = 0
    offset: int = 0
    limit: int = 0
    include_content: bool = False
    pages: list[DocumentPageResponse]


class RetryProcessingResponse(ApiModel):
    document_version_id: str
    processing_run_id: str
    status: ProcessingRunStatusLiteral
    output_schema_version: int
    processor_version: str
