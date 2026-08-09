"""Aggregate global Data Room context (G6)."""

from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.data_room.applicability import derive_applicability, load_snapshots_for_user
from app.modules.data_room.ci_adapter import ci_requirement_keys_with_documents, load_ci_documents
from app.modules.data_room.constants import (
    REQUIREMENT_NOT_APPLICABLE,
    REQUIREMENT_NOT_PROVIDED,
    REQUIREMENT_PARTIALLY_PROVIDED,
    REQUIREMENT_PROVIDED,
    REQUIREMENT_REVIEW_APPLICABILITY,
)
from app.modules.data_room.drhp_bridge import attach_drhp_usage
from app.modules.data_room.generic_service import load_generic_documents
from app.modules.data_room.inspection_bridge import inspection_for_document
from app.modules.data_room.issues_bridge import build_document_issue_links, build_requirement_issue_links
from app.modules.data_room.labels import workstream_url
from app.modules.data_room.requirements_registry import all_requirement_definitions
from app.modules.data_room.schemas import RawDataRoomDocument, RawDataRoomRequirement


@dataclass
class DataRoomContext:
    documents: list[RawDataRoomDocument] = field(default_factory=list)
    requirements: list[RawDataRoomRequirement] = field(default_factory=list)


def _requirement_status(
    *,
    applicability: str,
    matched_ids: list[str],
    allow_multiple: bool,
) -> str:
    if applicability == REQUIREMENT_NOT_APPLICABLE:
        return REQUIREMENT_NOT_APPLICABLE
    if applicability == REQUIREMENT_REVIEW_APPLICABILITY and not matched_ids:
        return REQUIREMENT_REVIEW_APPLICABILITY
    if not matched_ids:
        return REQUIREMENT_NOT_PROVIDED
    if allow_multiple and len(matched_ids) == 1:
        return REQUIREMENT_PARTIALLY_PROVIDED
    return REQUIREMENT_PROVIDED


def aggregate_data_room(db: Session, user: User) -> DataRoomContext:
    snapshots = load_snapshots_for_user(db, user)
    ci_docs = load_ci_documents(db, user)
    generic_docs = load_generic_documents(db, user)
    documents = ci_docs + generic_docs

    attach_drhp_usage(db, user, documents)
    build_document_issue_links(db, user, documents)

    ci_matches = ci_requirement_keys_with_documents(ci_docs)
    generic_matches: dict[str, list[str]] = {}
    for doc in generic_docs:
        if doc.requirement_key:
            generic_matches.setdefault(doc.requirement_key, []).append(doc.global_document_id)

    all_matches = {**ci_matches}
    for key, ids in generic_matches.items():
        all_matches.setdefault(key, []).extend(ids)

    requirements: list[RawDataRoomRequirement] = []
    for definition in all_requirement_definitions():
        applicability_override = derive_applicability(definition, snapshots)
        applicability = applicability_override or (
            REQUIREMENT_REVIEW_APPLICABILITY
            if definition.applicability in {"conditional", "professional"}
            else "applicable"
        )
        matched = all_matches.get(definition.key, [])
        status = _requirement_status(
            applicability=applicability,
            matched_ids=matched,
            allow_multiple=definition.allow_multiple,
        )
        section = definition.source_section_keys[0] if definition.source_section_keys else ""
        requirements.append(
            RawDataRoomRequirement(
                requirement_key=definition.key,
                workstream_key=definition.workstream_key,
                category=definition.category,
                title=definition.title,
                purpose=definition.purpose,
                expected_stage=definition.expected_stage,
                applicability_state=applicability,
                status=status,
                matched_document_ids=matched,
                professional_confirmation_required=definition.applicability == "professional",
                evidence_pipeline_capability=definition.evidence_pipeline_capability,
                open_workstream_url=workstream_url(definition.workstream_key, section_key=section or None),
            )
        )

    build_requirement_issue_links(db, user, requirements)

    for document in documents:
        document.metadata["inspection"] = (
            inspection_for_document(snapshots=snapshots, document=document).model_dump()
            if inspection_for_document(snapshots=snapshots, document=document)
            else None
        )

    return DataRoomContext(documents=documents, requirements=requirements)
