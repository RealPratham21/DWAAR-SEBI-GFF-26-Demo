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
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
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
    resolve_chapter_key,
    CoverageStatus,
    DrhpErrorCode,
)
from app.modules.drhp.generation.readiness_bridge import (
    build_list_item_from_bundle,
    evaluate_chapter_for_listing,
    should_use_g1_legacy,
    G1_LEGACY_CHAPTER_KEYS,
)
from app.modules.drhp.generation.snapshot_service import (
    create_generation_snapshot,
    get_generation_snapshot,
)
from app.modules.drhp.generation.staleness import compare_snapshot_staleness
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.workstreams import load_all_workstreams, missing_workstream_slugs
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
    ChapterSourceBundleResponse,
    DocumentGenerationStatusResponse,
    DrhpDocumentSummaryResponse,
    EvidenceRefResponse,
    GenerateDrhpResponse,
    GeneratedChapterResponse,
    GenerationSnapshotDetailResponse,
    GenerationSnapshotSummaryResponse,
    RequirementReadinessResponse,
    SnapshotItemResponse,
    SnapshotStalenessResponse,
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
        g1_item: ChapterListItemResponse | None = None
        if should_use_g1_legacy(definition):
            result = _evaluate_definition(db, user, definition)
            g1_item = ChapterListItemResponse(
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
        chapters.append(
            evaluate_chapter_for_listing(
                db,
                user,
                definition,
                order=index,
                g1_result=g1_item,
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
    resolved = resolve_chapter_key(chapter_key) or chapter_key
    definition = get_chapter_definition(resolved)
    if definition is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.CHAPTER_NOT_FOUND,
            message=f"Unknown DRHP chapter key: {chapter_key}",
        )
    if should_use_g1_legacy(definition):
        result = _evaluate_definition(db, user, definition)
        return _readiness_response(result)

    snapshots = load_all_workstreams(db, user.id)
    if missing_workstream_slugs(snapshots):
        bundle = build_chapter_source_bundle("preview", definition.key, snapshots)
    else:
        bundle = build_chapter_source_bundle("preview", definition.key, snapshots)
    readiness = bundle.readiness
    return ChapterReadinessResponse(
        chapter_key=definition.key,
        title=definition.title,
        supported=True,
        source_adapter=definition.source_adapter,
        connection_status=readiness.connection_status,
        generation_status=readiness.generation_status,
        can_generate=readiness.can_generate,
        registry_version=REGISTRY_VERSION,
        source_hash="",
        requirement_total=readiness.satisfied_count + readiness.missing_count,
        satisfied_count=readiness.satisfied_count,
        missing_count=readiness.missing_count,
        unknown_applicability_count=0,
        blocking_count=readiness.blocker_count,
        gap_count=readiness.missing_count,
        warning_count=readiness.warning_count,
        warnings=bundle.warnings,
        workstream_links=[
            WorkstreamLinkResponse(
                slug=ref.workstream_key,
                title=ref.field_label or ref.workstream_key,
                href=f"/projects/demo/workstreams/{ref.workstream_key}?tab=information",
                section_id=ref.section_key,
            )
            for ref in bundle.source_refs[:5]
        ],
    )


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
    resolved = resolve_chapter_key(chapter_key) or chapter_key
    if resolved not in G1_LEGACY_CHAPTER_KEYS:
        raise AppException(
            status_code=400,
            code=DrhpErrorCode.CHAPTER_NOT_CONNECTED,
            message="Per-chapter G1 source snapshots are only available for legacy C&I adapters.",
            details={"chapterKey": chapter_key},
        )

    definition = get_chapter_definition(resolved)
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


def create_generation_snapshot_for_user(
    db: Session,
    user: User,
) -> GenerationSnapshotSummaryResponse:
    snapshot = create_generation_snapshot(db, user)
    return GenerationSnapshotSummaryResponse(
        id=snapshot.id,
        snapshot_version=snapshot.snapshot_version,
        registry_version=snapshot.registry_version,
        snapshot_schema_version=snapshot.snapshot_schema_version,
        aggregate_source_hash=snapshot.aggregate_source_hash,
        readiness_summary=snapshot.readiness_summary,
        created_at=snapshot.created_at,
        created=True,
    )


def get_generation_snapshot_detail(
    db: Session,
    user: User,
    snapshot_id: uuid.UUID,
) -> GenerationSnapshotDetailResponse:
    snapshot = get_generation_snapshot(db, user, snapshot_id)
    return GenerationSnapshotDetailResponse(
        id=snapshot.id,
        snapshot_version=snapshot.snapshot_version,
        registry_version=snapshot.registry_version,
        snapshot_schema_version=snapshot.snapshot_schema_version,
        aggregate_source_hash=snapshot.aggregate_source_hash,
        readiness_summary=snapshot.readiness_summary,
        created_at=snapshot.created_at,
        created=False,
        source_workstream_versions=snapshot.source_workstream_versions,
        canonical_context=snapshot.canonical_context,
        source_registry=snapshot.source_registry,
    )


def get_chapter_source_bundle_for_snapshot(
    db: Session,
    user: User,
    snapshot_id: uuid.UUID,
    chapter_key: str,
) -> ChapterSourceBundleResponse:
    resolved = resolve_chapter_key(chapter_key) or chapter_key
    snapshot = get_generation_snapshot(db, user, snapshot_id)
    from app.modules.drhp.workstreams import WorkstreamSnapshot

    snapshots: dict[str, WorkstreamSnapshot] = {}
    versions = snapshot.source_workstream_versions or {}
    workstreams = (snapshot.normalized_payload or {}).get("workstreams") or {}
    for slug, payload in workstreams.items():
        version_meta = versions.get(slug) or {}
        snapshots[slug] = WorkstreamSnapshot(
            slug=slug,
            workspace_id=uuid.UUID(str(version_meta.get("workspaceId"))) if version_meta.get("workspaceId") else uuid.uuid4(),
            version=int(version_meta.get("version") or 1),
            schema_version=int(version_meta.get("schemaVersion") or 1),
            payload=payload if isinstance(payload, dict) else {},
            payload_hash=str(version_meta.get("payloadHash") or ""),
            last_saved_at=version_meta.get("lastSavedAt"),
        )
    bundle = build_chapter_source_bundle(str(snapshot.id), resolved, snapshots)
    return ChapterSourceBundleResponse.model_validate(bundle.model_dump(mode="json"))


def get_snapshot_staleness(
    db: Session,
    user: User,
    snapshot_id: uuid.UUID,
) -> SnapshotStalenessResponse:
    snapshot = get_generation_snapshot(db, user, snapshot_id)
    result = compare_snapshot_staleness(db, user.id, snapshot)
    return SnapshotStalenessResponse(
        snapshot_id=snapshot.id,
        is_stale=result["isStale"],
        stale_workstreams=result["staleWorkstreams"],
        affected_chapters=result["affectedChapters"],
    )


def _get_or_create_document(db: Session, user: User):
    from app.models.drhp_document import DrhpDocument

    doc = db.scalar(select(DrhpDocument).where(DrhpDocument.user_id == user.id))
    if doc is None:
        doc = DrhpDocument(user_id=user.id)
        db.add(doc)
        db.flush()
    return doc


def start_drhp_generation(
    db: Session,
    user: User,
    *,
    snapshot_id: uuid.UUID | None = None,
    create_snapshot: bool = True,
) -> GenerateDrhpResponse:
    from app.models.drhp_document import DrhpChapterVersion, DrhpDocument, DrhpDocumentVersion
    from app.modules.drhp.constants import (
        ALL_CHAPTER_KEYS,
        CHAPTER_GENERATION_MODES,
        ChapterVersionStatus,
        DocumentVersionStatus,
        PROMPT_VERSION,
        RULES_VERSION,
    )
    if snapshot_id:
        snapshot = get_generation_snapshot(db, user, snapshot_id)
    elif create_snapshot:
        snapshot = create_generation_snapshot(db, user)
    else:
        raise AppException(
            status_code=422,
            code=DrhpErrorCode.GENERATION_SNAPSHOT_NOT_FOUND,
            message="snapshotId is required when createSnapshot is false.",
        )

    document = _get_or_create_document(db, user)
    latest_version = db.scalar(
        select(DrhpDocumentVersion)
        .where(DrhpDocumentVersion.document_id == document.id)
        .order_by(DrhpDocumentVersion.version_number.desc())
    )
    next_version = (latest_version.version_number + 1) if latest_version else 1

    from app.core.config import get_settings

    settings = get_settings()
    model_name = settings.cohere_drhp_model or settings.cohere_model or "fake"

    doc_version = DrhpDocumentVersion(
        document_id=document.id,
        user_id=user.id,
        version_number=next_version,
        generation_snapshot_id=snapshot.id,
        status=DocumentVersionStatus.QUEUED,
        total_chapters=len(ALL_CHAPTER_KEYS),
        generation_model=model_name,
        prompt_version=PROMPT_VERSION,
        rules_version=RULES_VERSION,
        generation_metadata={"registryVersion": REGISTRY_VERSION},
    )
    db.add(doc_version)
    db.flush()

    for chapter_key in ALL_CHAPTER_KEYS:
        db.add(
            DrhpChapterVersion(
                document_version_id=doc_version.id,
                chapter_key=chapter_key,
                generation_mode=CHAPTER_GENERATION_MODES.get(chapter_key, "hybrid"),
                status=ChapterVersionStatus.QUEUED,
                prompt_version=PROMPT_VERSION,
                model=model_name,
            )
        )
    db.flush()

    return GenerateDrhpResponse(
        document_id=document.id,
        document_version_id=doc_version.id,
        version_number=next_version,
        snapshot_id=snapshot.id,
        status=DocumentVersionStatus.QUEUED,
        total_chapters=len(ALL_CHAPTER_KEYS),
    )


def get_document_generation_status(
    db: Session,
    user: User,
    document_version_id: uuid.UUID,
) -> DocumentGenerationStatusResponse:
    from app.models.drhp_document import DrhpChapterVersion, DrhpDocumentVersion
    from app.modules.drhp.constants import CHAPTER_TITLES

    doc_version = db.get(DrhpDocumentVersion, document_version_id)
    if doc_version is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.DOCUMENT_VERSION_NOT_FOUND,
            message="DRHP document version not found.",
        )
    if doc_version.user_id != user.id:
        raise AppException(
            status_code=403,
            code=DrhpErrorCode.DOCUMENT_FORBIDDEN,
            message="DRHP document access denied.",
        )

    from app.modules.drhp.schemas import ChapterGenerationStatusItem

    from app.modules.drhp.export.content import ast_has_renderable_content

    chapter_rows = db.scalars(
        select(DrhpChapterVersion)
        .where(DrhpChapterVersion.document_version_id == document_version_id)
        .order_by(DrhpChapterVersion.chapter_key)
    ).all()
    chapters = [
        ChapterGenerationStatusItem(
            chapter_key=row.chapter_key,
            title=CHAPTER_TITLES.get(row.chapter_key, row.chapter_key),
            status=row.status,
            generation_mode=row.generation_mode,
            warnings=list(row.generation_warnings or []),
            error_message=row.error_message,
            has_ast_content=ast_has_renderable_content(row.ast_payload),
        )
        for row in chapter_rows
    ]

    stale = False
    stale_count = 0
    snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
    if snapshot:
        stale_result = compare_snapshot_staleness(db, user.id, snapshot)
        stale = stale_result["isStale"]
        stale_count = len(stale_result["staleWorkstreams"])

    return DocumentGenerationStatusResponse(
        document_id=doc_version.document_id,
        document_version_id=doc_version.id,
        version_number=doc_version.version_number,
        snapshot_id=doc_version.generation_snapshot_id,
        status=doc_version.status,
        generation_started_at=doc_version.generation_started_at,
        completed_at=doc_version.completed_at,
        total_chapters=doc_version.total_chapters,
        completed_chapters=doc_version.completed_chapters,
        warning_chapters=doc_version.warning_chapters,
        failed_chapters=doc_version.failed_chapters,
        blocked_chapters=doc_version.blocked_chapters,
        chapters=chapters,
        is_stale=stale,
        stale_workstream_count=stale_count,
    )


def get_generated_chapter(
    db: Session,
    user: User,
    document_version_id: uuid.UUID,
    chapter_key: str,
) -> GeneratedChapterResponse:
    from app.models.drhp_document import DrhpChapterVersion, DrhpDocumentVersion
    from app.modules.drhp.constants import CHAPTER_TITLES

    resolved = resolve_chapter_key(chapter_key) or chapter_key
    doc_version = db.get(DrhpDocumentVersion, document_version_id)
    if doc_version is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.DOCUMENT_VERSION_NOT_FOUND,
            message="DRHP document version not found.",
        )
    if doc_version.user_id != user.id:
        raise AppException(
            status_code=403,
            code=DrhpErrorCode.DOCUMENT_FORBIDDEN,
            message="DRHP document access denied.",
        )

    row = db.scalar(
        select(DrhpChapterVersion).where(
            DrhpChapterVersion.document_version_id == document_version_id,
            DrhpChapterVersion.chapter_key == resolved,
        )
    )
    if row is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.CHAPTER_VERSION_NOT_FOUND,
            message=f"No generated chapter for key: {chapter_key}",
        )

    return GeneratedChapterResponse(
        chapter_key=row.chapter_key,
        title=CHAPTER_TITLES.get(row.chapter_key, row.chapter_key),
        status=row.status,
        ast=row.ast_payload,
        source_refs_summary=list(row.source_refs_summary or []),
        evidence_refs_summary=list(row.evidence_refs_summary or []),
        generation_warnings=list(row.generation_warnings or []),
        validation_warnings=list(row.validation_warnings or []),
        model=row.model,
        prompt_version=row.prompt_version,
    )


def get_latest_drhp_document(db: Session, user: User) -> DrhpDocumentSummaryResponse | None:
    from app.models.drhp_document import DrhpDocument, DrhpDocumentVersion

    document = db.scalar(select(DrhpDocument).where(DrhpDocument.user_id == user.id))
    if document is None:
        return None
    latest = db.scalar(
        select(DrhpDocumentVersion)
        .where(DrhpDocumentVersion.document_id == document.id)
        .order_by(DrhpDocumentVersion.version_number.desc())
    )
    return DrhpDocumentSummaryResponse(
        document_id=document.id,
        latest_version_id=latest.id if latest else None,
        latest_version_number=latest.version_number if latest else None,
        latest_status=latest.status if latest else None,
        snapshot_id=latest.generation_snapshot_id if latest else None,
        created_at=document.created_at,
    )
