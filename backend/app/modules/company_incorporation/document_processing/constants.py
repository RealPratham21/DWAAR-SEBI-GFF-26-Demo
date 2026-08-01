class ProcessingRunStatus:
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


ACTIVE_PROCESSING_RUN_STATUSES: frozenset[str] = frozenset(
    {
        ProcessingRunStatus.QUEUED,
        ProcessingRunStatus.PROCESSING,
    },
)


class ExtractionMethod:
    NATIVE_TEXT = "native_text"
    OCR = "ocr"
    NATIVE_TEXT_WITH_OCR_FALLBACK = "native_text_with_ocr_fallback"


class ProcessingWarning:
    LOW_RESOLUTION = "low_resolution"
    LOW_OCR_CONFIDENCE = "low_ocr_confidence"
    SIGNIFICANT_SKEW = "significant_skew"
    PERSPECTIVE_DISTORTION = "perspective_distortion"
    PAGE_ROTATION_CORRECTED = "page_rotation_corrected"
    NATIVE_TEXT_UNUSABLE = "native_text_unusable"
    MOSTLY_BLANK_PAGE = "mostly_blank_page"
    CORRUPTED_PAGE = "corrupted_page"
    PAGE_LIMIT_EXCEEDED = "page_limit_exceeded"
    ENCRYPTED_PDF = "encrypted_pdf"
    UNSUPPORTED_FILE_TYPE = "unsupported_file_type"


class ProcessingErrorCode:
    UNSUPPORTED_FILE_TYPE = "DOCUMENT_PROCESSING_UNSUPPORTED_FILE_TYPE"
    CORRUPTED_FILE = "DOCUMENT_PROCESSING_CORRUPTED_FILE"
    ENCRYPTED_PDF = "DOCUMENT_PROCESSING_ENCRYPTED_PDF"
    PAGE_LIMIT_EXCEEDED = "DOCUMENT_PROCESSING_PAGE_LIMIT_EXCEEDED"
    TIMEOUT = "DOCUMENT_PROCESSING_TIMEOUT"
    STORAGE_ERROR = "DOCUMENT_PROCESSING_STORAGE_ERROR"
    INTERNAL_ERROR = "DOCUMENT_PROCESSING_INTERNAL_ERROR"
    RETRY_NOT_ALLOWED = "DOCUMENT_PROCESSING_RETRY_NOT_ALLOWED"
    ACTIVE_RUN_EXISTS = "DOCUMENT_PROCESSING_ACTIVE_RUN_EXISTS"
    RUN_NOT_FOUND = "DOCUMENT_PROCESSING_RUN_NOT_FOUND"
    CANCELLED = "DOCUMENT_PROCESSING_CANCELLED"


# New processing runs persist schema-v2 evidence-ready blocks.
CURRENT_OUTPUT_SCHEMA_VERSION = 2
LEGACY_OUTPUT_SCHEMA_VERSION = 1


RETRYABLE_VERSION_STATUSES: frozenset[str] = frozenset(
    {
        "pending_processing",
        "processed",
        "processing_failed",
        "uploaded",
    },
)
