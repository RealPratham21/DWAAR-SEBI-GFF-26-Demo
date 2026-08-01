class NotificationType:
    WORKSTREAM_SAVE = "workstream_save"
    WORKSTREAM_DOCUMENT = "workstream_document"


class NotificationErrorCode:
    NOT_FOUND = "NOTIFICATION_NOT_FOUND"


DEFAULT_NOTIFICATION_LIMIT = 20
MAX_NOTIFICATION_LIMIT = 50

WORKSTREAM_SAVE_MESSAGE = "Your Company & Incorporation information was saved successfully."
COMPANY_INCORPORATION_SLUG = "company-incorporation"

SECTION_SAVE_TITLES: dict[str, str] = {
    "legal-identity": "Legal Identity saved",
    "corporate-history": "Corporate History saved",
    "offices-contact": "Offices & Contact Information saved",
    "constitutional-documents": "Constitutional Documents saved",
    "core-registrations": "Core Registrations saved",
    "issuer-confirmations": "Issuer Confirmations saved",
}


def build_company_incorporation_target_route(section_id: str) -> str:
    return (
        f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}"
        f"?tab=information&section={section_id}"
    )


def build_company_incorporation_documents_route() -> str:
    return f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}?tab=documents"


def build_company_incorporation_questions_route(*, issue_id: str | None = None) -> str:
    route = f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}?tab=questions-conflicts"
    if issue_id:
        return f"{route}&issueId={issue_id}"
    return route


def build_company_incorporation_facts_route(*, structured_run_id: str | None = None) -> str:
    route = f"/projects/demo/workstreams/{COMPANY_INCORPORATION_SLUG}?tab=facts-evidence"
    if structured_run_id:
        return f"{route}&structuredRunId={structured_run_id}"
    return route


DOCUMENT_UPLOAD_TITLE = "Document uploaded"
DOCUMENT_REPLACE_TITLE = "Document replaced"
DOCUMENT_ARCHIVE_TITLE = "Document archived"
DOCUMENT_PROCESSING_FAILED_PREFIX = "We could not process"
STRUCTURED_EXTRACTION_FAILED_PREFIX = "We could not extract facts from"
STRUCTURED_ISSUE_TITLE_PREFIX = "Review needed"
