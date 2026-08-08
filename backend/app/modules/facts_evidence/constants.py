"""Shared constants for Global Facts & Evidence (G5)."""

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

SUPPORT_TYPE_LABELS: dict[str, str] = {
    "document_backed": "Document-backed",
    "structured_issuer_input": "Structured issuer input",
    "deterministic_calculation": "Calculated",
    "linked_workstream": "Linked workstream",
    "professional_confirmation": "Professional confirmation",
    "placeholder": "Placeholder",
    "mixed_support": "Mixed support",
}

SUPPORT_STATE_LABELS: dict[str, str] = {
    "supported": "Supported",
    "supported_by_structured_input": "Supported by structured input",
    "calculated": "Calculated",
    "partial_support": "Partial support",
    "professional_confirmation_pending": "Professional confirmation pending",
    "documentary_evidence_not_connected": "Documentary evidence not connected",
    "placeholder": "Placeholder",
    "conflicting_source": "Conflicting source",
}

EXCLUDED_FIELD_PREFIXES = (
    "schemaVersion",
    "lastSaved",
    "dirty",
    "completion",
    "progress",
    "_meta",
)
