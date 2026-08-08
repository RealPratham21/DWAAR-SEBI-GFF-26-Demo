"""Pydantic API contracts for the DRHP module."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class WorkstreamLinkResponse(ApiModel):
    slug: str
    title: str
    href: str
    section_id: str | None = None


class EvidenceRefResponse(ApiModel):
    assertion_id: UUID
    evidence_ids: list[UUID] = Field(default_factory=list)
    document_id: UUID | None = None
    document_version_id: UUID
    requirement_key: str | None = None
    requirement_label: str | None = None
    original_filename: str | None = None
    page_numbers: list[int] = Field(default_factory=list)
    quote_snapshots: list[str] = Field(default_factory=list)
    role: str
    review_status: str
    comparison_status: str
    source_temporality: str
    display_value: str


class RequirementReadinessResponse(ApiModel):
    key: str
    label: str
    classification: str
    applicability: str
    coverage_status: str
    blocks_generation: bool
    placeholder_allowed: bool
    historical: bool
    selected_source_type: str
    selected_value: Any = None
    information_paths: list[str] = Field(default_factory=list)
    assertion_ids: list[UUID] = Field(default_factory=list)
    evidence_refs: list[EvidenceRefResponse] = Field(default_factory=list)
    issue_ids: list[UUID] = Field(default_factory=list)
    generation_permitted: bool = False
    workstream_link: WorkstreamLinkResponse | None = None
    notes: str = ""


class ChapterReadinessResponse(ApiModel):
    chapter_key: str
    title: str
    supported: bool
    source_adapter: str
    connection_status: str
    generation_status: str
    can_generate: bool
    registry_version: str
    source_hash: str
    requirement_total: int
    satisfied_count: int
    missing_count: int
    unknown_applicability_count: int
    blocking_count: int
    gap_count: int
    warning_count: int
    satisfied_requirements: list[RequirementReadinessResponse] = Field(default_factory=list)
    missing_requirements: list[RequirementReadinessResponse] = Field(default_factory=list)
    unknown_applicability_requirements: list[RequirementReadinessResponse] = Field(
        default_factory=list
    )
    blocking_requirements: list[RequirementReadinessResponse] = Field(default_factory=list)
    gap_requirements: list[RequirementReadinessResponse] = Field(default_factory=list)
    requirements: list[RequirementReadinessResponse] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    workstream_links: list[WorkstreamLinkResponse] = Field(default_factory=list)
    company_incorporation_workspace_id: UUID | None = None


class ChapterListItemResponse(ApiModel):
    key: str
    title: str
    order: int
    supported: bool
    connection_status: str
    generation_status: str
    can_generate: bool
    requirement_total: int
    satisfied_count: int
    missing_count: int
    unknown_applicability_count: int
    blocking_count: int
    gap_count: int
    source_hash: str = ""
    workstream_links: list[WorkstreamLinkResponse] = Field(default_factory=list)


class ChapterListResponse(ApiModel):
    registry_version: str
    chapters: list[ChapterListItemResponse]


class SnapshotItemResponse(ApiModel):
    id: UUID
    item_key: str
    requirement_key: str
    requirement_label: str
    applicability: str
    coverage_status: str
    selected_source_type: str
    selected_value: Any = None
    information_paths: list[str] = Field(default_factory=list)
    assertion_ids: list[UUID] = Field(default_factory=list)
    evidence_ids: list[UUID] = Field(default_factory=list)
    document_ids: list[UUID] = Field(default_factory=list)
    document_version_ids: list[UUID] = Field(default_factory=list)
    document_requirement_keys: list[str] = Field(default_factory=list)
    document_requirement_labels: list[str] = Field(default_factory=list)
    page_numbers: list[int] = Field(default_factory=list)
    quote_snapshots: list[str] = Field(default_factory=list)
    issue_ids: list[UUID] = Field(default_factory=list)
    evidence_refs: list[EvidenceRefResponse] = Field(default_factory=list)
    generation_permitted: bool
    placeholder_allowed: bool
    notes: str = ""


class SourceSnapshotResponse(ApiModel):
    id: UUID
    user_id: UUID
    company_incorporation_workspace_id: UUID
    chapter_key: str
    registry_version: str
    snapshot_schema_version: str
    source_hash: str
    readiness_result: dict[str, Any]
    created_by: UUID
    created_at: datetime
    created: bool = False
    items: list[SnapshotItemResponse] = Field(default_factory=list)


class GenerationSnapshotSummaryResponse(ApiModel):
    id: UUID
    snapshot_version: int
    registry_version: str
    snapshot_schema_version: str
    aggregate_source_hash: str
    readiness_summary: dict[str, Any]
    created_at: datetime
    created: bool = True


class GenerationSnapshotDetailResponse(GenerationSnapshotSummaryResponse):
    source_workstream_versions: dict[str, Any] = Field(default_factory=dict)
    canonical_context: dict[str, Any] = Field(default_factory=dict)
    source_registry: dict[str, Any] = Field(default_factory=dict)


class ChapterSourceBundleResponse(ApiModel):
    snapshot_id: str
    chapter_key: str
    chapter_title: str
    global_context: dict[str, Any] = Field(default_factory=dict)
    deterministic_facts: list[dict[str, Any]] = Field(default_factory=list)
    narrative_facts: list[dict[str, Any]] = Field(default_factory=list)
    structured_tables: list[dict[str, Any]] = Field(default_factory=list)
    entities: list[dict[str, Any]] = Field(default_factory=list)
    calculations: list[dict[str, Any]] = Field(default_factory=list)
    risk_candidates: list[dict[str, Any]] = Field(default_factory=list)
    source_refs: list[dict[str, Any]] = Field(default_factory=list)
    evidence_refs: list[dict[str, Any]] = Field(default_factory=list)
    allowed_placeholders: list[dict[str, Any]] = Field(default_factory=list)
    unresolved_required_inputs: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    conflicts: list[dict[str, Any]] = Field(default_factory=list)
    readiness: dict[str, Any] = Field(default_factory=dict)
    dependency_chapters: list[str] = Field(default_factory=list)
    generation_phase: str = ""


class SnapshotStalenessResponse(ApiModel):
    snapshot_id: UUID
    is_stale: bool
    stale_workstreams: list[dict[str, Any]] = Field(default_factory=list)
    affected_chapters: list[str] = Field(default_factory=list)


class GenerateDrhpRequest(ApiModel):
    snapshot_id: UUID | None = None
    create_snapshot: bool = True


class GenerateDrhpResponse(ApiModel):
    document_id: UUID
    document_version_id: UUID
    version_number: int
    snapshot_id: UUID
    status: str
    total_chapters: int


class ChapterGenerationStatusItem(ApiModel):
    chapter_key: str
    title: str
    status: str
    generation_mode: str = ""
    warnings: list[str] = Field(default_factory=list)
    error_message: str | None = None


class DocumentGenerationStatusResponse(ApiModel):
    document_id: UUID
    document_version_id: UUID
    version_number: int
    snapshot_id: UUID
    status: str
    generation_started_at: datetime | None = None
    completed_at: datetime | None = None
    total_chapters: int
    completed_chapters: int
    warning_chapters: int
    failed_chapters: int
    blocked_chapters: int
    chapters: list[ChapterGenerationStatusItem] = Field(default_factory=list)
    is_stale: bool = False
    stale_workstream_count: int = 0


class GeneratedChapterResponse(ApiModel):
    chapter_key: str
    title: str
    status: str
    ast: dict[str, Any] | None = None
    source_refs_summary: list[dict[str, Any]] = Field(default_factory=list)
    evidence_refs_summary: list[dict[str, Any]] = Field(default_factory=list)
    generation_warnings: list[str] = Field(default_factory=list)
    validation_warnings: list[str] = Field(default_factory=list)
    model: str = ""
    prompt_version: str = ""


class DrhpDocumentSummaryResponse(ApiModel):
    document_id: UUID
    latest_version_id: UUID | None = None
    latest_version_number: int | None = None
    latest_status: str | None = None
    snapshot_id: UUID | None = None
    created_at: datetime | None = None

