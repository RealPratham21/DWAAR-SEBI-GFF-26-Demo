"""Internal and API schemas for Global Issues & Gaps (G4)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from pydantic import Field

from app.modules.drhp.schemas import ApiModel


@dataclass(slots=True)
class RawGlobalIssue:
    fingerprint: str
    title: str
    description: str
    category: str
    severity: str
    source_kind: str
    workstream_key: str = ""
    workstream_label: str = ""
    section_key: str = ""
    section_label: str = ""
    record_id: str = ""
    record_label: str = ""
    source_refs: list[dict[str, Any]] = field(default_factory=list)
    evidence_refs: list[dict[str, Any]] = field(default_factory=list)
    why_it_matters: str = ""
    suggested_action: str = ""
    affected_drhp_chapters: list[str] = field(default_factory=list)
    open_source_url: str = ""
    open_drhp_url: str | None = None
    professional_review_required: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)
    merge_group: str | None = None
    source_kinds: list[str] = field(default_factory=list)
    detected_at: datetime | None = None


class SourceRefResponse(ApiModel):
    ref_id: str | None = None
    workstream_key: str | None = None
    section_key: str | None = None
    field_path: str | None = None
    field_label: str | None = None
    value_preview: str | None = None


class EvidenceRefResponse(ApiModel):
    document_id: str | None = None
    document_version_id: str | None = None
    original_filename: str | None = None
    page_numbers: list[int] = Field(default_factory=list)
    requirement_key: str | None = None
    requirement_label: str | None = None


class GlobalIssueResponse(ApiModel):
    id: str
    fingerprint: str
    title: str
    description: str
    category: str
    severity: str
    lifecycle_state: str
    source_kind: str
    source_kinds: list[str] = Field(default_factory=list)
    workstream_key: str = ""
    workstream_label: str = ""
    section_key: str = ""
    section_label: str = ""
    record_id: str = ""
    record_label: str = ""
    source_refs: list[SourceRefResponse] = Field(default_factory=list)
    evidence_refs: list[EvidenceRefResponse] = Field(default_factory=list)
    why_it_matters: str = ""
    suggested_action: str = ""
    affected_drhp_chapters: list[str] = Field(default_factory=list)
    affected_drhp_chapter_labels: list[str] = Field(default_factory=list)
    open_source_url: str = ""
    open_drhp_url: str | None = None
    detected_at: datetime | None = None
    last_seen_at: datetime | None = None
    professional_review_required: bool = False
    acknowledged: bool = False
    acknowledgement_note: str | None = None
    acknowledged_at: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class GlobalIssueListResponse(ApiModel):
    total: int
    issues: list[GlobalIssueResponse]


class GlobalIssueSummaryResponse(ApiModel):
    total_open: int
    blocking: int
    high: int
    medium: int
    low: int
    professional_review: int
    evidence_gaps: int
    inconsistencies: int
    drhp_related: int
    acknowledged: int
    by_workstream: dict[str, int] = Field(default_factory=dict)
    by_category: dict[str, int] = Field(default_factory=dict)


class AcknowledgementPatchRequest(ApiModel):
    acknowledged: bool
    note: str | None = None


class AcknowledgementPatchResponse(ApiModel):
    issue_id: str
    fingerprint: str
    acknowledged: bool
    note: str | None = None
    acknowledged_at: datetime | None = None
