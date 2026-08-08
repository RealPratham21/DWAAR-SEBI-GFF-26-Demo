"""Internal and API schemas for Global Facts & Evidence (G5)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from pydantic import Field

from app.modules.drhp.schemas import ApiModel


@dataclass(slots=True)
class RawGlobalFact:
    fingerprint: str
    label: str
    display_value: str
    raw_value: Any
    semantic_type: str
    data_type: str
    canonical_workstream_key: str
    section_key: str
    field_path: str
    support_type: str
    support_state: str
    source_ref: dict[str, Any] = field(default_factory=dict)
    evidence_refs: list[dict[str, Any]] = field(default_factory=list)
    calculated_from: list[dict[str, Any]] = field(default_factory=list)
    calculation_expression: str = ""
    professional_confirmation_required: bool = False
    workstream_label: str = ""
    section_label: str = ""
    record_id: str = ""
    record_label: str = ""
    unit: str = ""
    currency: str = ""
    as_of_date: str = ""
    reporting_period: str = ""
    open_source_url: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    conflicting_source: dict[str, Any] | None = None


class SourceRefResponse(ApiModel):
    ref_id: str
    workstream_key: str
    section_key: str = ""
    record_id: str = ""
    field_path: str = ""
    field_label: str = ""
    source_type: str = ""
    value_preview: Any = None
    workspace_version: int | None = None


class EvidenceRefResponse(ApiModel):
    ref_id: str = ""
    document_id: str | None = None
    document_version_id: str | None = None
    original_filename: str | None = None
    page_number: int | None = None
    assertion_id: str | None = None
    quote_snapshot: str = ""
    role: str = ""


class DrhpUsageBlockResponse(ApiModel):
    document_version_id: str
    document_version_number: int
    chapter_key: str
    chapter_label: str
    section_key: str
    section_heading: str
    block_id: str
    block_kind: str
    draft_value_preview: Any = None
    open_url: str = ""


class RelatedIssueResponse(ApiModel):
    issue_id: str
    fingerprint: str
    title: str
    severity: str
    lifecycle_state: str
    open_url: str = ""


class GlobalFactResponse(ApiModel):
    fact_id: str
    fingerprint: str
    label: str
    display_value: str
    semantic_type: str
    data_type: str
    unit: str = ""
    currency: str = ""
    as_of_date: str = ""
    reporting_period: str = ""
    canonical_workstream_key: str
    canonical_workstream_label: str
    section_key: str
    section_label: str
    record_id: str = ""
    record_label: str = ""
    field_path: str = ""
    source_ref: SourceRefResponse
    support_type: str
    support_state: str
    support_type_label: str = ""
    support_state_label: str = ""
    evidence_refs: list[EvidenceRefResponse] = Field(default_factory=list)
    calculated_from: list[SourceRefResponse] = Field(default_factory=list)
    calculation_expression: str = ""
    professional_confirmation_required: bool = False
    drhp_usage: list[DrhpUsageBlockResponse] = Field(default_factory=list)
    drhp_usage_count: int = 0
    related_issues: list[RelatedIssueResponse] = Field(default_factory=list)
    related_issue_count: int = 0
    open_source_url: str = ""
    conflicting_source: dict[str, Any] | None = None
    workspace_version: int | None = None
    last_updated_at: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class GlobalFactListResponse(ApiModel):
    total: int
    page: int
    page_size: int
    facts: list[GlobalFactResponse]


class GlobalFactSummaryResponse(ApiModel):
    canonical_facts: int
    document_backed: int
    structured_input: int
    calculated: int
    professional_confirmation: int
    used_in_drhp: int
    with_issues: int
    by_workstream: dict[str, int] = Field(default_factory=dict)


class GlobalEvidenceResponse(ApiModel):
    evidence_id: str
    document_id: str
    document_version_id: str
    document_name: str
    document_category: str = ""
    version_number: int | None = None
    page_number: int | None = None
    evidence_type: str = "document_extraction"
    extracted_text_preview: str = ""
    assertion_label: str = ""
    supported_fact_ids: list[str] = Field(default_factory=list)
    supported_fact_labels: list[str] = Field(default_factory=list)
    drhp_usage_count: int = 0
    processing_state: str = ""
    open_document_url: str = ""


class GlobalEvidenceListResponse(ApiModel):
    total: int
    page: int
    page_size: int
    evidence: list[GlobalEvidenceResponse]


class GlobalEvidenceSummaryResponse(ApiModel):
    documents: int
    document_versions: int
    evidence_items: int
    evidence_backed_facts: int
    drhp_blocks_using_evidence: int
