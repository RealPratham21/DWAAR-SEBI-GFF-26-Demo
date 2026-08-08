"""First-class SourceRef and EvidenceRef models for DRHP generation."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class SourceRef(ApiModel):
    ref_id: str
    workstream_key: str
    section_key: str
    record_id: str = ""
    field_path: str
    field_label: str = ""
    source_type: str
    value_preview: Any = None
    workspace_version: int | None = None


class EvidenceRef(ApiModel):
    ref_id: str
    source_ref_id: str
    document_id: UUID | None = None
    document_version_id: UUID | None = None
    page_number: int | None = None
    assertion_id: UUID | None = None
    evidence_id: UUID | None = None
    quote_snapshot: str = ""
    role: str = ""


class PlaceholderRef(ApiModel):
    placeholder_id: str
    chapter_key: str
    section_key: str = ""
    placeholder_type: str
    reason: str
    source_ref_id: str = ""
    allowed_at_stage: str = ""
    required_before_stage: str = ""
    display_token: str = "[●]"


class SourceConflictRef(ApiModel):
    conflict_id: str
    fact_domain: str
    field_path: str
    authoritative_workstream: str
    authoritative_value: Any = None
    conflicting_workstream: str
    conflicting_value: Any = None
    severity: str
    message: str


class BundleReadiness(ApiModel):
    connection_status: str
    generation_status: str
    can_generate: bool
    satisfied_count: int = 0
    missing_count: int = 0
    blocker_count: int = 0
    placeholder_count: int = 0
    warning_count: int = 0
    generated_dependency_count: int = 0


class ChapterSourceBundle(ApiModel):
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
    source_refs: list[SourceRef] = Field(default_factory=list)
    evidence_refs: list[EvidenceRef] = Field(default_factory=list)
    allowed_placeholders: list[PlaceholderRef] = Field(default_factory=list)
    unresolved_required_inputs: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    conflicts: list[SourceConflictRef] = Field(default_factory=list)
    readiness: BundleReadiness
    dependency_chapters: list[str] = Field(default_factory=list)
    generation_phase: str = ""
