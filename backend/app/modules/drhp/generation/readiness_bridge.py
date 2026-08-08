"""Bridge G1 legacy readiness and generation snapshot bundle readiness."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.constants import (
    REGISTRY_VERSION,
    ConnectionStatus,
    GenerationStatus,
    SourceAdapterKey,
)
from app.modules.drhp.mapping.chapters import get_chapter_mapping
from app.modules.drhp.registry import ChapterDefinition
from app.modules.drhp.schemas import ChapterListItemResponse, WorkstreamLinkResponse
from app.modules.drhp.workstreams import load_all_workstreams, missing_workstream_slugs


G1_LEGACY_CHAPTER_KEYS = frozenset({"cover-page-front-matter", "company-history-promoters-structure"})


def _workstream_links(chapter_key: str) -> list[WorkstreamLinkResponse]:
    mapping = get_chapter_mapping(chapter_key)
    if mapping is None:
        return []
    links: list[WorkstreamLinkResponse] = []
    for slug in mapping.primary_workstreams:
        links.append(
            WorkstreamLinkResponse(
                slug=slug,
                title=slug.replace("-", " ").title(),
                href=f"/projects/demo/workstreams/{slug}?tab=information",
            )
        )
    return links


def chapter_list_item_from_bundle(
    definition: ChapterDefinition,
    *,
    snapshot_id: str,
    order: int,
) -> ChapterListItemResponse | None:
    from app.modules.drhp.workstreams import WorkstreamSnapshot

    # Caller passes snapshots via closure in service — re-import pattern avoided;
    # this function is invoked from service with snapshots loaded.
    return None


def build_list_item_from_bundle(
    definition: ChapterDefinition,
    snapshots: dict,
    *,
    order: int,
) -> ChapterListItemResponse:
    bundle = build_chapter_source_bundle("preview", definition.key, snapshots)
    readiness = bundle.readiness
    return ChapterListItemResponse(
        key=definition.key,
        title=definition.title,
        order=definition.order or order,
        supported=True,
        connection_status=readiness.connection_status,
        generation_status=readiness.generation_status,
        can_generate=readiness.can_generate,
        requirement_total=readiness.satisfied_count + readiness.missing_count + readiness.blocker_count,
        satisfied_count=readiness.satisfied_count,
        missing_count=readiness.missing_count,
        unknown_applicability_count=0,
        blocking_count=readiness.blocker_count,
        gap_count=readiness.missing_count,
        source_hash="",
        workstream_links=_workstream_links(definition.key),
    )


def should_use_g1_legacy(definition: ChapterDefinition) -> bool:
    return (
        definition.key in G1_LEGACY_CHAPTER_KEYS
        and definition.source_adapter == SourceAdapterKey.COMPANY_INCORPORATION
    )


def bundle_fallback_list_item(
    definition: ChapterDefinition,
    *,
    order: int,
    missing_workstreams: list[str],
) -> ChapterListItemResponse:
    if missing_workstreams:
        status = ConnectionStatus.PARTIALLY_CONNECTED
        generation = GenerationStatus.BLOCKED
        can_generate = False
    else:
        status = ConnectionStatus.CONNECTED
        generation = GenerationStatus.READY_WITH_GAPS
        can_generate = False
    return ChapterListItemResponse(
        key=definition.key,
        title=definition.title,
        order=definition.order or order,
        supported=True,
        connection_status=status,
        generation_status=generation,
        can_generate=can_generate,
        requirement_total=0,
        satisfied_count=0,
        missing_count=len(missing_workstreams),
        unknown_applicability_count=0,
        blocking_count=0,
        gap_count=len(missing_workstreams),
        source_hash="",
        workstream_links=_workstream_links(definition.key),
    )


def evaluate_chapter_for_listing(
    db: Session,
    user: User,
    definition: ChapterDefinition,
    *,
    order: int,
    g1_result: ChapterListItemResponse | None,
) -> ChapterListItemResponse:
    if should_use_g1_legacy(definition) and g1_result is not None:
        return g1_result

    snapshots = load_all_workstreams(db, user.id)
    missing = missing_workstream_slugs(snapshots)
    if missing:
        return bundle_fallback_list_item(definition, order=order, missing_workstreams=missing)
    return build_list_item_from_bundle(definition, snapshots, order=order)
