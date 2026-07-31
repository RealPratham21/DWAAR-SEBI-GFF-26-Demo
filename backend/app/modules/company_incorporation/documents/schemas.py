from datetime import datetime
from typing import Literal

from pydantic import Field

from app.modules.company_incorporation.schemas import ApiModel
from app.modules.notifications.schemas import NotificationResponse, SaveAcknowledgementResponse

DocumentVersionStatusLiteral = Literal[
    "pending_upload",
    "uploaded",
    "upload_failed",
    "pending_processing",
    "processing",
    "processed",
    "processing_failed",
    "superseded",
]

RequirementLevelLiteral = Literal["mandatory", "conditional"]


class OnboardingSelectionHintResponse(ApiModel):
    file_name: str
    file_size: int
    mime_type: str
    message: str


class DocumentVersionSummaryResponse(ApiModel):
    id: str
    version_number: int
    original_filename: str
    content_type: str
    size_bytes: int
    checksum_sha256: str
    status: DocumentVersionStatusLiteral
    uploaded_at: datetime | None = None
    is_current: bool = False


class StoredDocumentResponse(ApiModel):
    id: str
    requirement_key: str
    archived_at: datetime | None = None
    current_version: DocumentVersionSummaryResponse | None = None


class DocumentRequirementStateResponse(ApiModel):
    key: str
    name: str
    requirement_level: RequirementLevelLiteral
    explanation: str
    allow_multiple: bool
    onboarding_hint: OnboardingSelectionHintResponse | None = None
    documents: list[StoredDocumentResponse] = Field(default_factory=list)


class DocumentRequirementGroupResponse(ApiModel):
    id: str
    title: str
    requirements: list[DocumentRequirementStateResponse]


class StorageSummaryResponse(ApiModel):
    connected: bool
    private: bool = True
    description: str


class DocumentsListResponse(ApiModel):
    groups: list[DocumentRequirementGroupResponse]
    storage_summary: StorageSummaryResponse


class InitiateUploadRequest(ApiModel):
    requirement_key: str
    filename: str
    content_type: str
    size_bytes: int = Field(ge=1)
    checksum_sha256: str
    document_id: str | None = None


class InitiateUploadResponse(ApiModel):
    document_id: str
    version_id: str
    upload_url: str
    required_headers: dict[str, str]
    expires_in_seconds: int


class FinalizeUploadResponse(ApiModel):
    document: StoredDocumentResponse
    acknowledgement: SaveAcknowledgementResponse
    notification: NotificationResponse


class DownloadUrlResponse(ApiModel):
    download_url: str
    expires_in_seconds: int
    original_filename: str
    content_type: str
    size_bytes: int
    version_number: int


class VersionHistoryResponse(ApiModel):
    document_id: str
    requirement_key: str
    versions: list[DocumentVersionSummaryResponse]


class ArchiveDocumentResponse(ApiModel):
    document: StoredDocumentResponse
    acknowledgement: SaveAcknowledgementResponse
    notification: NotificationResponse


class DiscardUploadResponse(ApiModel):
    discarded: bool
