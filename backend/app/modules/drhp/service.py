"""DRHP service: readiness evaluation and immutable source snapshots."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import AppException
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.drhp_source_snapshot import DrhpSnapshotItem, DrhpSourceSnapshot
from app.models.fact_evidence_reference import FactEvidenceReference
from app.models.fact_issue import FactIssue
from app.models.user import User
from app.modules.company_incorporation.documents.requirements_config import (
    REQUIREMENT_DEFINITIONS,
)
from app.modules.company_incorporation.structured_extraction.service import (
    _usable_assertions_for_workspace,
)
from app.modules.drhp.constants import (
    OPEN_ISSUE_STATUSES,
    REGISTRY_VERSION,
    SNAPSHOT_SCHEMA_VERSION,
    SUPPORTED_CHAPTER_KEYS,
    CoverageStatus,
    DrhpErrorCode,
)
from app.modules.drhp.readiness import ChapterReadiness, evaluate_chapter_readiness
from app.modules.drhp.registry import (
    ChapterDefinition,
    WorkstreamLink,
    get_chapter_definition,
    iter_chapter_definitions,
    registry_meta,
)
from app.modules.drhp.schemas import (
    ChapterListItemResponse,
    ChapterListResponse,
    ChapterReadinessResponse,
    EvidenceRefResponse,
    RequirementReadinessResponse,
    SnapshotItemResponse,
    SourceSnapshotResponse,
    WorkstreamLinkResponse,
)
from app.modules.drhp.source_selection import AssertionView, IssueView


def _workspace_for_user(
    db: Session,
    user: User,
) -> CompanyIncorporationWorkspace | None:
    return db.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == user.id,
        )
    )


def _requirement_label(requirement_key: str | None) -> str | None:
    if not requirement_key:
        return None
    definition = REQUIREMENT_DEFINITIONS.get(requirement_key)
    if definition is None:
        return requirement_key
    return str(definition.name)


def _load_assertion_views(
    db: Session,
    workspace_id: uuid.UUID,
) -> list[AssertionView]:
    assertions = _usable_assertions_for_workspace(db, workspace_id)
    if not assertions:
        return []

    assertion_ids = [row.id for row in assertions]
    evidence_rows = db.scalars(
        select(FactEvidenceReference).where(
            FactEvidenceReference.fact_assertion_id.in_(assertion_ids),
        )
    ).all()
    evidence_by_assertion: dict[uuid.UUID, list[FactEvidenceReference]] = {}
    for evidence in evidence_rows:
        evidence_by_assertion.setdefault(evidence.fact_assertion_id, []).append(evidence)

    version_ids = {row.document_version_id for row in assertions}
    versions = {
        version.id: version
        for version in db.scalars(
            select(DocumentVersion).where(DocumentVersion.id.in_(version_ids))
        ).all()
    }
    document_ids = {version.document_id for version in versions.values()}
    documents = {
        document.id: document
        for document in db.scalars(select(Document).where(Document.id.in_(document_ids))).all()
    }

    views: list[AssertionView] = []
    for assertion in assertions:
        version = versions.get(assertion.document_version_id)
        document = documents.get(version.document_id) if version is not None else None
        evidence_list = evidence_by_assertion.get(assertion.id, [])
        page_numbers = sorted({item.page_number for item in evidence_list})
        # Cap quote snapshots — never include full page text.
        quotes = [item.quote_snapshot for item in evidence_list[:8] if item.quote_snapshot]
        views.append(
            AssertionView(
                id=assertion.id,
                fact_key=assertion.fact_key,
                review_status=assertion.review_status,
                comparison_status=assertion.comparison_status,
                source_temporality=assertion.source_temporality,
                display_value=assertion.display_value,
                normalized_value=assertion.normalized_value,
                document_version_id=assertion.document_version_id,
                document_id=document.id if document is not None else None,
                requirement_key=assertion.requirement_key,
                requirement_label=_requirement_label(assertion.requirement_key),
                original_filename=(
                    version.original_filename if version is not None else None
                ),
                page_numbers=page_numbers,
                evidence_ids=[item.id for item in evidence_list],
                quote_snapshots=quotes,
            )
        )
    return views


def _load_open_issues(db: Session, workspace_id: uuid.UUID) -> list[IssueView]:
    rows = db.scalars(
        select(FactIssue).where(
            FactIssue.workspace_id == workspace_id,
            FactIssue.status.in_(OPEN_ISSUE_STATUSES),
        )
    ).all()
    return [
        IssueView(
            id=row.id,
            fact_key=row.fact_key,
            issue_type=row.issue_type,
            severity=row.severity,
            blocking=bool(row.blocking),
            status=row.status,
            title=row.title,
        )
        for row in rows
    ]


def _link_response(link: WorkstreamLink | None) -> WorkstreamLinkResponse | None:
    if link is None:
        return None
    return WorkstreamLinkResponse(
        slug=link.slug,
        title=link.title,
        href=link.href,
        section_id=link.section_id,
    )


def _evidence_response(ref: Any) -> EvidenceRefResponse:
    return EvidenceRefResponse(
        assertion_id=ref.assertion_id,
        evidence_ids=list(ref.evidence_ids),
        document_id=ref.document_id,
        document_version_id=ref.document_version_id,
        requirement_key=ref.requirement_key,
        requirement_label=ref.requirement_label,
        original_filename=ref.original_filename,
        page_numbers=list(ref.page_numbers),
        quote_snapshots=list(ref.quote_snapshots),
        role=ref.role,
        review_status=ref.review_status,
        comparison_status=ref.comparison_status,
        source_temporality=ref.source_temporality,
        display_value=ref.display_value,
    )


def _requirement_response(row: Any) -> RequirementReadinessResponse:
    return RequirementReadinessResponse(
        key=row.key,
        label=row.label,
        classification=row.classification,
        applicability=row.applicability,
        coverage_status=row.coverage_status,
        blocks_generation=row.blocks_generation,
        placeholder_allowed=row.placeholder_allowed,
        historical=row.historical,
        selected_source_type=row.selected.source_type,
        selected_value=row.selected.value,
        information_paths=list(row.selected.information_paths),
        assertion_ids=list(row.selected.assertion_ids),
        evidence_refs=[_evidence_response(ref) for ref in row.selected.evidence_refs],
        issue_ids=list(row.selected.issue_ids),
        generation_permitted=row.selected.generation_permitted,
        workstream_link=_link_response(row.workstream_link),
        notes=row.notes,
    )


def _readiness_response(result: ChapterReadiness) -> ChapterReadinessResponse:
    requirements = [_requirement_response(row) for row in result.requirements]
    return ChapterReadinessResponse(
        chapter_key=result.chapter_key,
        title=result.title,
        supported=result.supported,
        source_adapter=result.source_adapter,
        connection_status=result.connection_status,
        generation_status=result.generation_status,
        can_generate=result.can_generate,
        registry_version=result.registry_version,
        source_hash=result.source_hash,
        requirement_total=result.requirement_total,
        satisfied_count=result.satisfied_count,
        missing_count=result.missing_count,
        unknown_applicability_count=result.unknown_applicability_count,
        blocking_count=result.blocking_count,
        gap_count=result.gap_count,
        warning_count=result.warning_count,
        satisfied_requirements=[
            item
            for item in requirements
            if item.coverage_status in {CoverageStatus.SATISFIED, CoverageStatus.WARNING}
        ],
        missing_requirements=[
            item for item in requirements if item.coverage_status == CoverageStatus.MISSING
        ],
        unknown_applicability_requirements=[
            item
            for item in requirements
            if item.coverage_status == CoverageStatus.UNKNOWN_APPLICABILITY
        ],
        blocking_requirements=[
            item for item in requirements if item.coverage_status == CoverageStatus.BLOCKED
        ],
        gap_requirements=[
            item for item in requirements if item.coverage_status == CoverageStatus.GAP
        ],
        requirements=requirements,
        warnings=list(result.warnings),
        workstream_links=[
            link
            for link in (_link_response(item) for item in result.workstream_links)
            if link is not None
        ],
        company_incorporation_workspace_id=result.company_incorporation_workspace_id,
    )


def _evaluate_definition(
    db: Session,
    user: User,
    definition: ChapterDefinition,
) -> ChapterReadiness:
    workspace = _workspace_for_user(db, user)
    if not definition.supported:
        return evaluate_chapter_readiness(
            definition,
            payload=None,
            assertions=[],
            open_issues=[],
            workspace_id=None,
        )

    if workspace is None:
        return evaluate_chapter_readiness(
            definition,
            payload=None,
            assertions=[],
            open_issues=[],
            workspace_id=None,
        )

    payload = dict(workspace.payload or {})
    assertions = _load_assertion_views(db, workspace.id)
    open_issues = _load_open_issues(db, workspace.id)
    return evaluate_chapter_readiness(
        definition,
        payload=payload,
        assertions=assertions,
        open_issues=open_issues,
        workspace_id=workspace.id,
    )


def list_chapters(db: Session, user: User) -> ChapterListResponse:
    chapters: list[ChapterListItemResponse] = []
    for index, definition in enumerate(iter_chapter_definitions(), start=1):
        result = _evaluate_definition(db, user, definition)
        chapters.append(
            ChapterListItemResponse(
                key=definition.key,
                title=definition.title,
                order=definition.order or index,
                supported=definition.supported,
                connection_status=result.connection_status,
                generation_status=result.generation_status,
                can_generate=result.can_generate,
                requirement_total=result.requirement_total,
                satisfied_count=result.satisfied_count,
                missing_count=result.missing_count,
                unknown_applicability_count=result.unknown_applicability_count,
                blocking_count=result.blocking_count,
                gap_count=result.gap_count,
                source_hash=result.source_hash,
                workstream_links=[
                    link
                    for link in (_link_response(item) for item in result.workstream_links)
                    if link is not None
                ],
            )
        )
    return ChapterListResponse(
        registry_version=registry_meta()["registryVersion"],
        chapters=chapters,
    )


def get_chapter_readiness(
    db: Session,
    user: User,
    chapter_key: str,
) -> ChapterReadinessResponse:
    definition = get_chapter_definition(chapter_key)
    if definition is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.CHAPTER_NOT_FOUND,
            message=f"Unknown DRHP chapter key: {chapter_key}",
        )
    result = _evaluate_definition(db, user, definition)
    return _readiness_response(result)


def _readiness_result_dict(response: ChapterReadinessResponse) -> dict[str, Any]:
    return response.model_dump(mode="json", by_alias=True)


def _build_snapshot_item(
    *,
    snapshot_id: uuid.UUID,
    requirement: RequirementReadinessResponse,
) -> DrhpSnapshotItem:
    evidence_ids: list[str] = []
    document_ids: list[str] = []
    document_version_ids: list[str] = []
    requirement_keys: list[str] = []
    requirement_labels: list[str] = []
    page_numbers: list[int] = []
    quote_snapshots: list[str] = []
    evidence_payload: list[dict[str, Any]] = []

    for ref in requirement.evidence_refs:
        evidence_payload.append(ref.model_dump(mode="json", by_alias=True))
        evidence_ids.extend(str(item) for item in ref.evidence_ids)
        if ref.document_id is not None:
            document_ids.append(str(ref.document_id))
        document_version_ids.append(str(ref.document_version_id))
        if ref.requirement_key:
            requirement_keys.append(ref.requirement_key)
        if ref.requirement_label:
            requirement_labels.append(ref.requirement_label)
        page_numbers.extend(ref.page_numbers)
        quote_snapshots.extend(ref.quote_snapshots)

    # Deduplicate while preserving order.
    def _unique(values: list[Any]) -> list[Any]:
        seen: set[str] = set()
        out: list[Any] = []
        for value in values:
            key = str(value)
            if key in seen:
                continue
            seen.add(key)
            out.append(value)
        return out

    return DrhpSnapshotItem(
        id=uuid.uuid4(),
        snapshot_id=snapshot_id,
        item_key=requirement.key,
        requirement_key=requirement.key,
        requirement_label=requirement.label,
        applicability=requirement.applicability,
        coverage_status=requirement.coverage_status,
        selected_source_type=requirement.selected_source_type,
        selected_value=requirement.selected_value,
        information_paths=list(requirement.information_paths),
        assertion_ids=[str(item) for item in requirement.assertion_ids],
        evidence_ids=_unique(evidence_ids),
        document_ids=_unique(document_ids),
        document_version_ids=_unique(document_version_ids),
        document_requirement_keys=_unique(requirement_keys),
        document_requirement_labels=_unique(requirement_labels),
        page_numbers=_unique(page_numbers),
        quote_snapshots=_unique(quote_snapshots),
        issue_ids=[str(item) for item in requirement.issue_ids],
        evidence_refs=evidence_payload,
        generation_permitted=requirement.generation_permitted,
        placeholder_allowed=requirement.placeholder_allowed,
        notes=requirement.notes,
    )


def _snapshot_response(
    snapshot: DrhpSourceSnapshot,
    *,
    created: bool,
) -> SourceSnapshotResponse:
    items = [
        SnapshotItemResponse(
            id=item.id,
            item_key=item.item_key,
            requirement_key=item.requirement_key,
            requirement_label=item.requirement_label,
            applicability=item.applicability,
            coverage_status=item.coverage_status,
            selected_source_type=item.selected_source_type,
            selected_value=item.selected_value,
            information_paths=list(item.information_paths or []),
            assertion_ids=[uuid.UUID(str(value)) for value in (item.assertion_ids or [])],
            evidence_ids=[uuid.UUID(str(value)) for value in (item.evidence_ids or [])],
            document_ids=[uuid.UUID(str(value)) for value in (item.document_ids or [])],
            document_version_ids=[
                uuid.UUID(str(value)) for value in (item.document_version_ids or [])
            ],
            document_requirement_keys=list(item.document_requirement_keys or []),
            document_requirement_labels=list(item.document_requirement_labels or []),
            page_numbers=[int(value) for value in (item.page_numbers or [])],
            quote_snapshots=list(item.quote_snapshots or []),
            issue_ids=[uuid.UUID(str(value)) for value in (item.issue_ids or [])],
            evidence_refs=[
                EvidenceRefResponse.model_validate(ref) for ref in (item.evidence_refs or [])
            ],
            generation_permitted=bool(item.generation_permitted),
            placeholder_allowed=bool(item.placeholder_allowed),
            notes=item.notes or "",
        )
        for item in snapshot.items
    ]
    return SourceSnapshotResponse(
        id=snapshot.id,
        user_id=snapshot.user_id,
        company_incorporation_workspace_id=snapshot.company_incorporation_workspace_id,
        chapter_key=snapshot.chapter_key,
        registry_version=snapshot.registry_version,
        snapshot_schema_version=snapshot.snapshot_schema_version,
        source_hash=snapshot.source_hash,
        readiness_result=dict(snapshot.readiness_result or {}),
        created_by=snapshot.created_by,
        created_at=snapshot.created_at,
        created=created,
        items=items,
    )


def create_source_snapshot(
    db: Session,
    user: User,
    chapter_key: str,
) -> SourceSnapshotResponse:
    if chapter_key not in SUPPORTED_CHAPTER_KEYS:
        raise AppException(
            status_code=400,
            code=DrhpErrorCode.CHAPTER_NOT_CONNECTED,
            message="Source snapshots are only available for connected G1 chapters.",
            details={"chapterKey": chapter_key},
        )

    definition = get_chapter_definition(chapter_key)
    if definition is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.CHAPTER_NOT_FOUND,
            message=f"Unknown DRHP chapter key: {chapter_key}",
        )

    workspace = _workspace_for_user(db, user)
    if workspace is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.WORKSPACE_NOT_FOUND,
            message="Company & Incorporation workspace has not been initialized.",
        )

    readiness = _evaluate_definition(db, user, definition)
    if not readiness.source_hash:
        raise AppException(
            status_code=400,
            code=DrhpErrorCode.CHAPTER_NOT_CONNECTED,
            message="Cannot freeze a snapshot while the chapter source adapter is disconnected.",
        )

    existing = db.scalar(
        select(DrhpSourceSnapshot)
        .options(selectinload(DrhpSourceSnapshot.items))
        .where(
            DrhpSourceSnapshot.company_incorporation_workspace_id == workspace.id,
            DrhpSourceSnapshot.chapter_key == chapter_key,
            DrhpSourceSnapshot.source_hash == readiness.source_hash,
        )
    )
    if existing is not None:
        return _snapshot_response(existing, created=False)

    readiness_response = _readiness_response(readiness)
    snapshot_id = uuid.uuid4()
    snapshot = DrhpSourceSnapshot(
        id=snapshot_id,
        user_id=user.id,
        company_incorporation_workspace_id=workspace.id,
        chapter_key=chapter_key,
        registry_version=REGISTRY_VERSION,
        snapshot_schema_version=SNAPSHOT_SCHEMA_VERSION,
        source_hash=readiness.source_hash,
        readiness_result=_readiness_result_dict(readiness_response),
        created_by=user.id,
    )
    db.add(snapshot)
    for requirement in readiness_response.requirements:
        db.add(
            _build_snapshot_item(
                snapshot_id=snapshot_id,
                requirement=requirement,
            )
        )
    db.flush()
    db.refresh(snapshot)
    # Reload with items for response.
    loaded = db.scalar(
        select(DrhpSourceSnapshot)
        .options(selectinload(DrhpSourceSnapshot.items))
        .where(DrhpSourceSnapshot.id == snapshot.id)
    )
    assert loaded is not None
    return _snapshot_response(loaded, created=True)


def get_source_snapshot(
    db: Session,
    user: User,
    snapshot_id: uuid.UUID,
) -> SourceSnapshotResponse:
    snapshot = db.scalar(
        select(DrhpSourceSnapshot)
        .options(selectinload(DrhpSourceSnapshot.items))
        .where(DrhpSourceSnapshot.id == snapshot_id)
    )
    if snapshot is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.SNAPSHOT_NOT_FOUND,
            message="DRHP source snapshot was not found.",
        )
    if snapshot.user_id != user.id:
        raise AppException(
            status_code=403,
            code=DrhpErrorCode.SNAPSHOT_FORBIDDEN,
            message="You do not have access to this DRHP source snapshot.",
        )
    return _snapshot_response(snapshot, created=False)
