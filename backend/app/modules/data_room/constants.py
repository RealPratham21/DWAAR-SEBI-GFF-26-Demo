"""Constants for Global Data Room (G6)."""

from __future__ import annotations

WORKSTREAM_LABELS: dict[str, str] = {
    "company-incorporation": "Company & Incorporation",
    "ipo-setup-eligibility": "IPO Setup & Eligibility",
    "capital-ownership": "Capital & Ownership",
    "business-operations": "Business & Operations",
    "objects-of-issue": "Objects of the Issue",
    "financials-kpis": "Financials & KPIs",
    "management-governance": "Management & Governance",
    "industry-market": "Industry & Market",
    "group-entities-related-parties": "Group Entities & Related Parties",
    "borrowings-assets-contracts": "Borrowings, Assets & Contracts",
    "litigation-approvals-compliance": "Litigation, Approvals & Compliance",
    "intermediaries-filing": "Intermediaries & Filing",
}

ORIGIN_COMPANY_INCORPORATION = "company_incorporation"
ORIGIN_DATA_ROOM = "data_room"

PROCESSING_DOCUMENT_EXTRACTION = "document_extraction"
PROCESSING_STORED_ONLY = "stored_only"

REQUIREMENT_NOT_PROVIDED = "not_provided"
REQUIREMENT_PROVIDED = "provided"
REQUIREMENT_PARTIALLY_PROVIDED = "partially_provided"
REQUIREMENT_NOT_APPLICABLE = "not_applicable"
REQUIREMENT_REVIEW_APPLICABILITY = "review_applicability"

DOC_STATUS_UPLOADED = "uploaded"
DOC_STATUS_PROCESSING = "processing"
DOC_STATUS_PROCESSED = "processed"
DOC_STATUS_PROCESSING_FAILED = "processing_failed"
DOC_STATUS_SUPERSEDED = "superseded"
DOC_STATUS_ARCHIVED = "archived"

DOC_STATUS_LABELS: dict[str, str] = {
    DOC_STATUS_UPLOADED: "Uploaded",
    DOC_STATUS_PROCESSING: "Processing",
    DOC_STATUS_PROCESSED: "Processed",
    DOC_STATUS_PROCESSING_FAILED: "Processing failed",
    DOC_STATUS_SUPERSEDED: "Superseded",
    DOC_STATUS_ARCHIVED: "Archived",
}

REQUIREMENT_STATUS_LABELS: dict[str, str] = {
    REQUIREMENT_NOT_PROVIDED: "Not provided",
    REQUIREMENT_PROVIDED: "Provided",
    REQUIREMENT_PARTIALLY_PROVIDED: "Partially provided",
    REQUIREMENT_NOT_APPLICABLE: "Not applicable",
    REQUIREMENT_REVIEW_APPLICABILITY: "Review applicability",
}

PROCESSING_CAPABILITY_LABELS: dict[str, str] = {
    PROCESSING_DOCUMENT_EXTRACTION: "Document extraction + evidence linkage",
    PROCESSING_STORED_ONLY: "Stored only — structured extraction not connected in this prototype",
}

MAX_GENERIC_FILE_SIZE_BYTES = 25 * 1024 * 1024

GENERIC_ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "image/png",
        "image/jpeg",
    },
)

GENERIC_ALLOWED_EXTENSIONS: frozenset[str] = frozenset(
    {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"},
)
