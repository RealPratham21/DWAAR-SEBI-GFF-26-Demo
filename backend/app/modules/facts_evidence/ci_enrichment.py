"""Enrich C&I facts with document-backed evidence (G5)."""

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
from app.modules.drhp.constants import SourceRefType
from app.modules.drhp.generation.source_refs import make_evidence_ref, make_source_ref, stable_ref_id
from app.modules.facts_evidence.fingerprints import build_fact_fingerprint
from app.modules.facts_evidence.formatting import format_display_value
from app.modules.facts_evidence.labels import document_url, section_label, workstream_label, workstream_url
from app.modules.facts_evidence.schemas import RawGlobalFact
from app.modules.facts_evidence.support import map_support_state, map_support_type


FACT_KEY_TO_FIELD: dict[str, tuple[str, str, str]] = {
    "legal_name": ("legal-identity", "identity.legalName", "Legal company name"),
    "cin": ("legal-identity", "identity.cin", "CIN"),
    "incorporation_date": ("legal-identity", "identity.incorporationDate", "Incorporation date"),
    "registered_office": ("offices-contact", "offices.registeredOffice", "Registered office"),
}


def enrich_ci_document_facts(db: Session, user: User, facts: list[RawGlobalFact]) -> list[RawGlobalFact]:
    try:
        workspace = _require_workspace(db, user)
    except Exception:
        return facts

    assertions = db.scalars(
        select(FactAssertion)
        .options(selectinload(FactAssertion.evidence_references))
        .where(FactAssertion.workspace_id == workspace.id)
    ).all()
    if not assertions:
        return facts

    version_ids = {row.document_version_id for row in assertions}
    versions: dict[uuid.UUID, DocumentVersion] = {}
    documents: dict[uuid.UUID, Document] = {}
    if version_ids:
        for version, document in db.execute(
            select(DocumentVersion, Document)
            .join(Document, Document.id == DocumentVersion.document_id)
            .where(DocumentVersion.id.in_(version_ids))
        ).all():
            versions[version.id] = version
            documents[document.id] = document

    by_fact_key: dict[str, list[FactAssertion]] = defaultdict(list)
    for assertion in assertions:
        by_fact_key[assertion.fact_key].append(assertion)

    existing = {fact.fingerprint: fact for fact in facts}
    enriched: list[RawGlobalFact] = list(facts)

    for fact_key, mapping in FACT_KEY_TO_FIELD.items():
        section_key, field_path, label = mapping
        rows = by_fact_key.get(fact_key) or []
        if not rows:
            continue
        preferred = next((row for row in rows if row.evidence_references), rows[0])
        fingerprint = build_fact_fingerprint(
            workstream_key="company-incorporation",
            section_key=section_key,
            field_path=field_path,
        )
        source_ref = make_source_ref(
            workstream="company-incorporation",
            section=section_key,
            field_path=field_path,
            label=label,
            value=preferred.display_value,
            version=workspace.version,
            source_type=SourceRefType.DOCUMENT_BACKED_FACT,
        )
        evidence_refs: list[dict] = []
        for ev in preferred.evidence_references or []:
            version = versions.get(preferred.document_version_id)
            document = documents.get(version.document_id) if version else None
            evidence_refs.append(
                make_evidence_ref(
                    source_ref_id=source_ref.ref_id,
                    assertion_id=str(preferred.id),
                    document_id=str(document.id) if document else None,
                    document_version_id=str(version.id) if version else None,
                    page_number=ev.page_number,
                    evidence_id=str(ev.id),
                    quote_snapshot=ev.quote_snapshot or "",
                    role=ev.evidence_role or "",
                ).model_dump(by_alias=True, mode="json")
            )
            if document and version:
                evidence_refs[-1]["originalFilename"] = version.original_filename
        support_type = map_support_type(SourceRefType.DOCUMENT_BACKED_FACT)
        support_state = map_support_state(
            support_type=support_type,
            has_evidence=bool(evidence_refs),
            is_placeholder=False,
            professional_confirmation=False,
            has_conflict=preferred.comparison_status not in {"match", "information_only", ""},
        )
        try:
            display_label = get_fact(fact_key).display_label
        except KeyError:
            display_label = label
        raw = RawGlobalFact(
            fingerprint=fingerprint,
            label=display_label,
            display_value=format_display_value(preferred.display_value, semantic_type="text"),
            raw_value=preferred.display_value,
            semantic_type="text",
            data_type="text",
            canonical_workstream_key="company-incorporation",
            section_key=section_key,
            field_path=field_path,
            support_type=support_type,
            support_state=support_state,
            source_ref=source_ref.model_dump(by_alias=True, mode="json"),
            evidence_refs=evidence_refs,
            workstream_label=workstream_label("company-incorporation"),
            section_label=section_label(section_key),
            open_source_url=workstream_url("company-incorporation", section=section_key),
            metadata={
                "assertionId": str(preferred.id),
                "factKey": fact_key,
                "comparisonStatus": preferred.comparison_status,
            },
        )
        if fingerprint in existing:
            for idx, fact in enumerate(enriched):
                if fact.fingerprint == fingerprint:
                    enriched[idx] = raw
                    break
        else:
            enriched.append(raw)

    return enriched
