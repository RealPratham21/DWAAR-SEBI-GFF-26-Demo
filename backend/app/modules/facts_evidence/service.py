"""Global Facts & Evidence service layer (G5)."""

from __future__ import annotations

from app.core.exceptions import AppException
from app.models.user import User
from app.modules.facts_evidence.aggregator import aggregate_evidence, aggregate_facts_context
from app.modules.facts_evidence.constants import SUPPORT_STATE_LABELS, SUPPORT_TYPE_LABELS
from app.modules.facts_evidence.drhp_usage import DrhpUsageEntry
from app.modules.facts_evidence.labels import drhp_block_url
from app.modules.facts_evidence.schemas import (
    DrhpUsageBlockResponse,
    EvidenceRefResponse,
    GlobalEvidenceListResponse,
    GlobalEvidenceSummaryResponse,
    GlobalFactListResponse,
    GlobalFactResponse,
    GlobalFactSummaryResponse,
    RawGlobalFact,
    RelatedIssueResponse,
    SourceRefResponse,
)
from sqlalchemy.orm import Session


class FactsEvidenceErrorCode:
    FACT_NOT_FOUND = "facts_evidence_fact_not_found"
    EVIDENCE_NOT_FOUND = "facts_evidence_evidence_not_found"


def _usage_for_fact(fact: RawGlobalFact, usage_index) -> list[DrhpUsageBlockResponse]:
    ref_id = (fact.source_ref or {}).get("refId") or (fact.source_ref or {}).get("ref_id")
    if not ref_id:
        return []
    entries: list[DrhpUsageEntry] = usage_index.by_ref_id.get(str(ref_id), [])
    blocks: list[DrhpUsageBlockResponse] = []
    for entry in entries:
        blocks.append(
            DrhpUsageBlockResponse(
                document_version_id=entry.document_version_id,
                document_version_number=entry.document_version_number,
                chapter_key=entry.chapter_key,
                chapter_label=entry.chapter_label,
                section_key=entry.section_key,
                section_heading=entry.section_heading,
                block_id=entry.block_id,
                block_kind=entry.block_kind,
                draft_value_preview=entry.draft_value_preview,
                open_url=drhp_block_url(entry.chapter_key, entry.block_id),
            )
        )
    return blocks


def _to_fact_response(
    fact: RawGlobalFact,
    *,
    usage_index,
    issue_links: dict[str, list[RelatedIssueResponse]],
) -> GlobalFactResponse:
    usage = _usage_for_fact(fact, usage_index)
    related = issue_links.get(fact.fingerprint, [])
    source_ref = SourceRefResponse.model_validate(fact.source_ref)
    evidence_refs = [EvidenceRefResponse.model_validate(ref) for ref in fact.evidence_refs]
    calculated_from = [SourceRefResponse.model_validate(ref) for ref in fact.calculated_from]

    workspace_version = source_ref.workspace_version
    draft_note = None
    if usage and usage_index.is_stale and fact.display_value != (usage[0].draft_value_preview or ""):
        draft_note = "Draft generated before source update"

    return GlobalFactResponse(
        fact_id=fact.fingerprint,
        fingerprint=fact.fingerprint,
        label=fact.label,
        display_value=fact.display_value,
        semantic_type=fact.semantic_type,
        data_type=fact.data_type,
        unit=fact.unit,
        currency=fact.currency,
        as_of_date=fact.as_of_date,
        reporting_period=fact.reporting_period,
        canonical_workstream_key=fact.canonical_workstream_key,
        canonical_workstream_label=fact.workstream_label,
        section_key=fact.section_key,
        section_label=fact.section_label,
        record_id=fact.record_id,
        record_label=fact.record_label,
        field_path=fact.field_path,
        source_ref=source_ref,
        support_type=fact.support_type,
        support_state=fact.support_state,
        support_type_label=SUPPORT_TYPE_LABELS.get(fact.support_type, fact.support_type),
        support_state_label=SUPPORT_STATE_LABELS.get(fact.support_state, fact.support_state),
        evidence_refs=evidence_refs,
        calculated_from=calculated_from,
        calculation_expression=fact.calculation_expression,
        professional_confirmation_required=fact.professional_confirmation_required,
        drhp_usage=usage,
        drhp_usage_count=len(usage),
        related_issues=related,
        related_issue_count=len(related),
        open_source_url=fact.open_source_url,
        conflicting_source=fact.conflicting_source,
        workspace_version=workspace_version,
        metadata={**(fact.metadata or {}), **({"draftStaleNote": draft_note} if draft_note else {})},
    )


def _filter_facts(
    facts: list[RawGlobalFact],
    *,
    search: str | None,
    workstream: str | None,
    support_type: str | None,
    used_in_drhp: bool | None,
    has_issue: bool | None,
    issue_links: dict[str, list],
    usage_index,
) -> list[RawGlobalFact]:
    filtered = facts
    if workstream:
        filtered = [f for f in filtered if f.canonical_workstream_key == workstream]
    if support_type:
        filtered = [f for f in filtered if f.support_type == support_type]
    if used_in_drhp is True:
        filtered = [f for f in filtered if _usage_for_fact(f, usage_index)]
    elif used_in_drhp is False:
        filtered = [f for f in filtered if not _usage_for_fact(f, usage_index)]
    if has_issue is True:
        filtered = [f for f in filtered if issue_links.get(f.fingerprint)]
    elif has_issue is False:
        filtered = [f for f in filtered if not issue_links.get(f.fingerprint)]
    if search:
        needle = search.strip().lower()
        filtered = [
            f
            for f in filtered
            if needle
            in " ".join(
                [
                    f.label,
                    f.display_value,
                    f.record_label,
                    f.section_label,
                    f.workstream_label,
                ]
            ).lower()
        ]
    return filtered


def list_facts(
    db: Session,
    user: User,
    *,
    search: str | None = None,
    workstream: str | None = None,
    support_type: str | None = None,
    used_in_drhp: bool | None = None,
    has_issue: bool | None = None,
    page: int = 1,
    page_size: int = 50,
) -> GlobalFactListResponse:
    ctx = aggregate_facts_context(db, user)
    filtered = _filter_facts(
        ctx.facts,
        search=search,
        workstream=workstream,
        support_type=support_type,
        used_in_drhp=used_in_drhp,
        has_issue=has_issue,
        issue_links=ctx.issue_links,
        usage_index=ctx.drhp_usage,
    )
    filtered.sort(key=lambda row: (row.workstream_label, row.section_label, row.label))
    start = max(page - 1, 0) * page_size
    page_rows = filtered[start : start + page_size]
    return GlobalFactListResponse(
        total=len(filtered),
        page=page,
        page_size=page_size,
        facts=[
            _to_fact_response(row, usage_index=ctx.drhp_usage, issue_links=ctx.issue_links)
            for row in page_rows
        ],
    )


def get_fact(db: Session, user: User, fact_id: str) -> GlobalFactResponse:
    ctx = aggregate_facts_context(db, user)
    for row in ctx.facts:
        if row.fingerprint == fact_id:
            return _to_fact_response(row, usage_index=ctx.drhp_usage, issue_links=ctx.issue_links)
    raise AppException(
        status_code=404,
        code=FactsEvidenceErrorCode.FACT_NOT_FOUND,
        message="Fact not found.",
    )


def build_fact_summary(db: Session, user: User) -> GlobalFactSummaryResponse:
    ctx = aggregate_facts_context(db, user)
    facts = ctx.facts
    by_ws: dict[str, int] = {}
    for fact in facts:
        by_ws[fact.canonical_workstream_key] = by_ws.get(fact.canonical_workstream_key, 0) + 1

    used = sum(1 for fact in facts if _usage_for_fact(fact, ctx.drhp_usage))
    with_issues = sum(1 for fact in facts if ctx.issue_links.get(fact.fingerprint))

    return GlobalFactSummaryResponse(
        canonical_facts=len(facts),
        document_backed=sum(1 for f in facts if f.support_type == "document_backed"),
        structured_input=sum(1 for f in facts if f.support_type == "structured_issuer_input"),
        calculated=sum(1 for f in facts if f.support_type == "deterministic_calculation"),
        professional_confirmation=sum(1 for f in facts if f.professional_confirmation_required),
        used_in_drhp=used,
        with_issues=with_issues,
        by_workstream=by_ws,
    )


def list_evidence(
    db: Session,
    user: User,
    *,
    page: int = 1,
    page_size: int = 50,
) -> GlobalEvidenceListResponse:
    rows = aggregate_evidence(db, user)
    start = max(page - 1, 0) * page_size
    page_rows = rows[start : start + page_size]
    return GlobalEvidenceListResponse(
        total=len(rows),
        page=page,
        page_size=page_size,
        evidence=page_rows,
    )


def get_evidence(db: Session, user: User, evidence_id: str):
    for row in aggregate_evidence(db, user):
        if row.evidence_id == evidence_id:
            return row
    raise AppException(
        status_code=404,
        code=FactsEvidenceErrorCode.EVIDENCE_NOT_FOUND,
        message="Evidence item not found.",
    )


def build_evidence_summary(db: Session, user: User) -> GlobalEvidenceSummaryResponse:
    rows = aggregate_evidence(db, user)
    doc_ids = {row.document_id for row in rows}
    version_ids = {row.document_version_id for row in rows}
    fact_ids = {fid for row in rows for fid in row.supported_fact_ids}
    return GlobalEvidenceSummaryResponse(
        documents=len(doc_ids),
        document_versions=len(version_ids),
        evidence_items=len(rows),
        evidence_backed_facts=len(fact_ids),
        drhp_blocks_using_evidence=0,
    )


def get_fact_drhp_usage(db: Session, user: User, fact_id: str) -> list[DrhpUsageBlockResponse]:
    fact = get_fact(db, user, fact_id)
    return fact.drhp_usage
