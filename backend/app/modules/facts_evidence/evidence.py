"""Build documentary evidence registry from C&I (G5)."""

from __future__ import annotations

import uuid
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.fact_assertion import FactAssertion
from app.models.fact_evidence_reference import FactEvidenceReference
from app.models.user import User
from app.modules.company_incorporation.structured_extraction.registry import get_fact
from app.modules.company_incorporation.structured_extraction.service import _require_workspace
from app.modules.facts_evidence.labels import document_url
from app.modules.facts_evidence.schemas import GlobalEvidenceResponse


def build_evidence_registry(db: Session, user: User) -> list[GlobalEvidenceResponse]:
    try:
        workspace = _require_workspace(db, user)
    except Exception:
        return []

    assertions = db.scalars(
        select(FactAssertion)
        .options(selectinload(FactAssertion.evidence_references))
        .where(FactAssertion.workspace_id == workspace.id)
    ).all()
    if not assertions:
        return []

    version_ids = {row.document_version_id for row in assertions}
    versions: dict[uuid.UUID, DocumentVersion] = {}
    documents: dict[uuid.UUID, Document] = {}
    for version, document in db.execute(
        select(DocumentVersion, Document)
        .join(Document, Document.id == DocumentVersion.document_id)
        .where(DocumentVersion.id.in_(version_ids))
    ).all():
        versions[version.id] = version
        documents[document.id] = document

    items: list[GlobalEvidenceResponse] = []
    seen: set[str] = set()

    for assertion in assertions:
        for ev in assertion.evidence_references or []:
            evidence_id = str(ev.id)
            if evidence_id in seen:
                continue
            seen.add(evidence_id)
            version = versions.get(assertion.document_version_id)
            document = documents.get(version.document_id) if version else None
            if document is None or version is None:
                continue
            try:
                fact_label = get_fact(assertion.fact_key).display_label
            except KeyError:
                fact_label = assertion.fact_key
            items.append(
                GlobalEvidenceResponse(
                    evidence_id=evidence_id,
                    document_id=str(document.id),
                    document_version_id=str(version.id),
                    document_name=version.original_filename or document.requirement_key,
                    document_category=document.requirement_key or "",
                    version_number=version.version_number,
                    page_number=ev.page_number,
                    evidence_type="document_extraction",
                    extracted_text_preview=(ev.quote_snapshot or "")[:300],
                    assertion_label=fact_label,
                    supported_fact_ids=[assertion.fact_key],
                    supported_fact_labels=[fact_label],
                    processing_state=version.status or "uploaded",
                    open_document_url=document_url(
                        str(document.id),
                        version_id=str(version.id),
                        page=ev.page_number,
                    ),
                )
            )

    return items
