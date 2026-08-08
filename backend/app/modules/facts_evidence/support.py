"""Map SourceRef types to user-facing support categories (G5)."""

from __future__ import annotations

from app.modules.drhp.constants import SourceRefType


def map_support_type(source_type: str) -> str:
    mapping = {
        SourceRefType.DOCUMENT_BACKED_FACT: "document_backed",
        SourceRefType.ASSERTION_OR_EVIDENCE: "document_backed",
        SourceRefType.STRUCTURED_USER_INPUT: "structured_issuer_input",
        SourceRefType.DETERMINISTIC_CALCULATION: "deterministic_calculation",
        SourceRefType.LINKED_WORKSTREAM_VALUE: "linked_workstream",
        SourceRefType.PROFESSIONAL_CONFIRMATION: "professional_confirmation",
        SourceRefType.PLACEHOLDER: "placeholder",
    }
    return mapping.get(source_type, "structured_issuer_input")


def map_support_state(
    *,
    support_type: str,
    has_evidence: bool,
    is_placeholder: bool,
    professional_confirmation: bool,
    has_conflict: bool,
) -> str:
    if has_conflict:
        return "conflicting_source"
    if is_placeholder or support_type == "placeholder":
        return "placeholder"
    if professional_confirmation:
        return "professional_confirmation_pending"
    if support_type == "deterministic_calculation":
        return "calculated"
    if support_type == "document_backed" and has_evidence:
        return "supported"
    if support_type == "document_backed":
        return "partial_support"
    if support_type == "structured_issuer_input":
        return "supported_by_structured_input"
    if support_type == "linked_workstream":
        return "supported_by_structured_input"
    return "documentary_evidence_not_connected"
