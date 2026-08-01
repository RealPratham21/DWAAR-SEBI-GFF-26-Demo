import re

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {
        "application/pdf",
        "image/png",
        "image/jpeg",
    },
)

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".pdf", ".png", ".jpg", ".jpeg"})

SHA256_PATTERN = re.compile(r"^[a-f0-9]{64}$")


class DocumentVersionStatus:
    PENDING_UPLOAD = "pending_upload"
    UPLOADED = "uploaded"
    UPLOAD_FAILED = "upload_failed"
    PENDING_PROCESSING = "pending_processing"
    PROCESSING = "processing"
    PROCESSED = "processed"
    PROCESSING_FAILED = "processing_failed"
    SUPERSEDED = "superseded"


CURRENT_VERSION_STATUSES: frozenset[str] = frozenset(
    {
        DocumentVersionStatus.UPLOADED,
        DocumentVersionStatus.PENDING_PROCESSING,
        DocumentVersionStatus.PROCESSING,
        DocumentVersionStatus.PROCESSED,
        DocumentVersionStatus.PROCESSING_FAILED,
    },
)

SUPERSEDABLE_VERSION_STATUSES: frozenset[str] = frozenset(
    {
        DocumentVersionStatus.UPLOADED,
        DocumentVersionStatus.PENDING_PROCESSING,
        DocumentVersionStatus.PROCESSING,
        DocumentVersionStatus.PROCESSED,
        DocumentVersionStatus.PROCESSING_FAILED,
    },
)

DISCARDABLE_VERSION_STATUSES: frozenset[str] = frozenset(
    {
        DocumentVersionStatus.PENDING_UPLOAD,
        DocumentVersionStatus.UPLOAD_FAILED,
    },
)


class DocumentErrorCode:
    WORKSPACE_NOT_FOUND = "COMPANY_INCORPORATION_WORKSPACE_NOT_FOUND"
    REQUIREMENT_NOT_FOUND = "DOCUMENT_REQUIREMENT_NOT_FOUND"
    DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND"
    VERSION_NOT_FOUND = "DOCUMENT_VERSION_NOT_FOUND"
    DOCUMENT_EXISTS_USE_REPLACE = "DOCUMENT_EXISTS_USE_REPLACE"
    INVALID_FILE_TYPE = "DOCUMENT_INVALID_FILE_TYPE"
    INVALID_FILE_SIZE = "DOCUMENT_INVALID_FILE_SIZE"
    INVALID_CHECKSUM = "DOCUMENT_INVALID_CHECKSUM"
    UPLOAD_NOT_READY = "DOCUMENT_UPLOAD_NOT_READY"
    UPLOAD_VALIDATION_FAILED = "DOCUMENT_UPLOAD_VALIDATION_FAILED"
    STORAGE_ERROR = "DOCUMENT_STORAGE_ERROR"
    VERSION_NOT_DISCARDABLE = "DOCUMENT_VERSION_NOT_DISCARDABLE"
    DOCUMENT_ARCHIVED = "DOCUMENT_ARCHIVED"
    FORBIDDEN = "DOCUMENT_FORBIDDEN"
    PROCESSING_RETRY_NOT_ALLOWED = "DOCUMENT_PROCESSING_RETRY_NOT_ALLOWED"
    PROCESSING_ACTIVE_RUN = "DOCUMENT_PROCESSING_ACTIVE_RUN_EXISTS"


ONBOARDING_SELECTION_HINT = (
    "A file was selected during onboarding, but it was not uploaded. "
    "Upload the source file to continue."
)

DOCUMENT_UPLOAD_MESSAGE = "Your Company & Incorporation document was uploaded successfully."
DOCUMENT_REPLACE_MESSAGE = "Your Company & Incorporation document was replaced successfully."
DOCUMENT_ARCHIVE_MESSAGE = "Your Company & Incorporation document was archived successfully."


def build_storage_key(*, workspace_id: str, document_id: str, version_id: str) -> str:
    return f"ci/{workspace_id}/{document_id}/{version_id}"
