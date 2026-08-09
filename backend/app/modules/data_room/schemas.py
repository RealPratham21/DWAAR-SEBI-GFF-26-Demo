"""Internal and API schemas for Global Data Room (G6)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from pydantic import Field

from app.modules.drhp.schemas import ApiModel


@dataclass(slots=True)
class RawDataRoomDocument:
    global_document_id: str
    origin_type: str
    origin_document_id: str
    title: str
    filename: str
    category: str
    mime_type: str
    file_size: int
    workstream_key: str
    section_key: str
    requirement_key: str | None
    current_version: int
    status: str
    processing_capability: str
    uploaded_at: datetime | None
    updated_at: datetime | None
    fact_count: int = 0
    evidence_count: int = 0
    issue_count: int = 0
    drhp_usage_count: int = 0
    open_url: str = ""
    download_available: bool = False
    version_history: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class RawDataRoomRequirement:
    requirement_key: str
    workstream_key: str
    category: str
    title: str
    purpose: str
    expected_stage: str
    applicability_state: str
    status: str
    matched_document_ids: list[str] = field(default_factory=list)
    linked_issue_ids: list[str] = field(default_factory=list)
    professional_confirmation_required: bool = False
    evidence_pipeline_capability: str = "stored_only"
    open_workstream_url: str = ""


class DocumentVersionSummaryResponse(ApiModel):
    version_number: int
    original_filename: str
    content_type: str
    size_bytes: int
    status: str
    uploaded_at: datetime | None = None
    is_current: bool = False
    note: str = ""


class RelatedIssueSummary(ApiModel):
    issue_id: str
    title: str
    severity: str
    open_url: str = ""


class DrhpUsageSummary(ApiModel):
    chapter_key: str
    chapter_label: str
    section_heading: str
    block_id: str
    open_url: str = ""


class InspectionSummary(ApiModel):
    status: str
    label: str = ""


class DataRoomDocumentResponse(ApiModel):
    global_document_id: str
    origin_type: str
    title: str
    filename: str
    category: str
    mime_type: str
    file_size: int
    workstream_key: str
    workstream_label: str
    section_key: str
    section_label: str
    requirement_key: str | None = None
    current_version: int
    status: str
    status_label: str
    processing_capability: str
    processing_capability_label: str
    uploaded_at: datetime | None = None
    updated_at: datetime | None = None
    fact_count: int = 0
    evidence_count: int = 0
    issue_count: int = 0
    drhp_usage_count: int = 0
    open_url: str = ""
    open_workstream_url: str = ""
    open_facts_url: str = ""
    versions: list[DocumentVersionSummaryResponse] = Field(default_factory=list)
    related_issues: list[RelatedIssueSummary] = Field(default_factory=list)
    drhp_usage: list[DrhpUsageSummary] = Field(default_factory=list)
    inspection: InspectionSummary | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class DataRoomDocumentListResponse(ApiModel):
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    documents: list[DataRoomDocumentResponse]


class DataRoomRequirementResponse(ApiModel):
    requirement_key: str
    workstream_key: str
    workstream_label: str
    category: str
    title: str
    purpose: str
    expected_stage: str
    applicability: str
    status: str
    status_label: str
    matched_document_ids: list[str] = Field(default_factory=list)
    linked_issue_ids: list[str] = Field(default_factory=list)
    professional_confirmation_required: bool = False
    evidence_pipeline_capability: str = "stored_only"
    open_workstream_url: str = ""
    open_upload: bool = False


class DataRoomRequirementListResponse(ApiModel):
    total: int
    requirements: list[DataRoomRequirementResponse]


class DataRoomSummaryResponse(ApiModel):
    total_documents: int = Field(alias="totalDocuments")
    current_versions: int = Field(alias="currentVersions")
    document_backed_documents: int = Field(alias="documentBackedDocuments")
    stored_only_documents: int = Field(alias="storedOnlyDocuments")
    applicable_requirements: int = Field(alias="applicableRequirements")
    provided_requirements: int = Field(alias="providedRequirements")
    missing_requirements: int = Field(alias="missingRequirements")
    review_applicability_requirements: int = Field(alias="reviewApplicabilityRequirements")
    documents_used_in_drhp: int = Field(alias="documentsUsedInDrhp")
    documents_with_issues: int = Field(alias="documentsWithIssues")


class WorkstreamDocumentGroupResponse(ApiModel):
    workstream_key: str = Field(alias="workstreamKey")
    workstream_label: str = Field(alias="workstreamLabel")
    provided_count: int = Field(alias="providedCount")
    expected_count: int = Field(alias="expectedCount")
    missing_count: int = Field(alias="missingCount")
    documents: list[DataRoomDocumentResponse] = Field(default_factory=list)
    missing_requirements: list[DataRoomRequirementResponse] = Field(default_factory=list)


class InitiateUploadRequest(ApiModel):
    workstream_key: str = Field(alias="workstreamKey")
    requirement_key: str | None = Field(default=None, alias="requirementKey")
    title: str
    category: str = ""
    filename: str
    content_type: str = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes")
    checksum_sha256: str = Field(alias="checksumSha256")
    note: str = ""


class InitiateUploadResponse(ApiModel):
    global_document_id: str = Field(alias="globalDocumentId")
    document_id: str = Field(alias="documentId")
    version_id: str = Field(alias="versionId")
    upload_url: str = Field(alias="uploadUrl")
    storage_key: str = Field(alias="storageKey")


class FinalizeUploadRequest(ApiModel):
    version_id: str = Field(alias="versionId")


class FinalizeUploadResponse(ApiModel):
    global_document_id: str = Field(alias="globalDocumentId")
    status: str
    current_version: int = Field(alias="currentVersion")


class DownloadUrlResponse(ApiModel):
    download_url: str = Field(alias="downloadUrl")
    expires_in_seconds: int = Field(alias="expiresInSeconds")


class InitiateVersionUploadRequest(ApiModel):
    filename: str
    content_type: str = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes")
    checksum_sha256: str = Field(alias="checksumSha256")
    note: str = ""


class InitiateCiUploadRequest(ApiModel):
    requirement_key: str = Field(alias="requirementKey")
    filename: str
    content_type: str = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes")
    checksum_sha256: str = Field(alias="checksumSha256")
