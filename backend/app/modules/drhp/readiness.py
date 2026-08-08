"""Chapter readiness evaluation (pure logic)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.modules.drhp.constants import (
    REGISTRY_VERSION,
    ConnectionStatus,
    CoverageStatus,
    GenerationStatus,
    RequirementClassification,
    SourceAdapterKey,
)
from app.modules.drhp.hashing import build_chapter_source_material, compute_source_hash
from app.modules.drhp.registry import ChapterDefinition, WorkstreamLink, get_chapter_definition
from app.modules.drhp.source_selection import (
    AssertionView,
    IssueView,
    SelectedSource,
    select_source_for_requirement,
)


@dataclass(slots=True)
class RequirementReadiness:
    key: str
    label: str
    classification: str
    applicability: str
    coverage_status: str
    blocks_generation: bool
    placeholder_allowed: bool
    historical: bool
    selected: SelectedSource
    workstream_link: WorkstreamLink | None
    notes: str = ""


@dataclass(slots=True)
class ChapterReadiness:
    chapter_key: str
    title: str
    supported: bool
    source_adapter: str
    connection_status: str
    generation_status: str
    can_generate: bool
    registry_version: str
    source_hash: str
    requirement_total: int
    satisfied_count: int
    missing_count: int
    unknown_applicability_count: int
    blocking_count: int
    gap_count: int
    warning_count: int
    requirements: list[RequirementReadiness] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    workstream_links: list[WorkstreamLink] = field(default_factory=list)
    company_incorporation_workspace_id: UUID | None = None


def _not_connected_result(definition: ChapterDefinition) -> ChapterReadiness:
    return ChapterReadiness(
        chapter_key=definition.key,
        title=definition.title,
        supported=False,
        source_adapter=SourceAdapterKey.NONE,
        connection_status=ConnectionStatus.NOT_CONNECTED,
        generation_status=GenerationStatus.BLOCKED,
        can_generate=False,
        registry_version=REGISTRY_VERSION,
        source_hash="",
        requirement_total=0,
        satisfied_count=0,
        missing_count=0,
        unknown_applicability_count=0,
        blocking_count=0,
        gap_count=0,
        warning_count=0,
        requirements=[],
        warnings=["Chapter is not connected to a source adapter in G1."],
        workstream_links=[],
    )


def evaluate_chapter_readiness(
    definition: ChapterDefinition,
    *,
    payload: dict[str, Any] | None,
    assertions: list[AssertionView],
    open_issues: list[IssueView],
    workspace_id: UUID | None = None,
) -> ChapterReadiness:
    if not definition.supported:
        return _not_connected_result(definition)

    if payload is None or workspace_id is None:
        return ChapterReadiness(
            chapter_key=definition.key,
            title=definition.title,
            supported=True,
            source_adapter=definition.source_adapter,
            connection_status=ConnectionStatus.NOT_CONNECTED,
            generation_status=GenerationStatus.BLOCKED,
            can_generate=False,
            registry_version=REGISTRY_VERSION,
            source_hash="",
            requirement_total=len(definition.requirements),
            satisfied_count=0,
            missing_count=0,
            unknown_applicability_count=0,
            blocking_count=0,
            gap_count=sum(
                1
                for req in definition.requirements
                if req.classification == RequirementClassification.FUTURE_GAP
            ),
            warning_count=0,
            requirements=[],
            warnings=["Company & Incorporation workspace has not been initialized."],
            workstream_links=list(definition.workstream_links),
        )

    if not definition.requirements and definition.source_adapter == SourceAdapterKey.NONE:
        return ChapterReadiness(
            chapter_key=definition.key,
            title=definition.title,
            supported=True,
            source_adapter=definition.source_adapter,
            connection_status=ConnectionStatus.NOT_CONNECTED,
            generation_status=GenerationStatus.BLOCKED,
            can_generate=False,
            registry_version=REGISTRY_VERSION,
            source_hash="",
            requirement_total=0,
            satisfied_count=0,
            missing_count=0,
            unknown_applicability_count=0,
            blocking_count=0,
            gap_count=0,
            warning_count=0,
            requirements=[],
            warnings=[
                "Legacy G1 requirements do not apply; readiness is evaluated via generation source bundles."
            ],
            workstream_links=list(definition.workstream_links),
            company_incorporation_workspace_id=workspace_id,
        )

    requirement_rows: list[RequirementReadiness] = []
    for requirement in definition.requirements:
        applicability, coverage, selected = select_source_for_requirement(
            requirement,
            payload=payload,
            assertions=assertions,
            open_issues=open_issues,
        )
        requirement_rows.append(
            RequirementReadiness(
                key=requirement.key,
                label=requirement.label,
                classification=requirement.classification,
                applicability=applicability,
                coverage_status=coverage,
                blocks_generation=requirement.blocks_generation,
                placeholder_allowed=requirement.placeholder_allowed,
                historical=requirement.historical,
                selected=selected,
                workstream_link=requirement.workstream_link,
                notes=selected.notes or requirement.notes,
            )
        )

    satisfied = [row for row in requirement_rows if row.coverage_status == CoverageStatus.SATISFIED]
    missing = [row for row in requirement_rows if row.coverage_status == CoverageStatus.MISSING]
    unknown = [
        row
        for row in requirement_rows
        if row.coverage_status == CoverageStatus.UNKNOWN_APPLICABILITY
    ]
    blocked = [row for row in requirement_rows if row.coverage_status == CoverageStatus.BLOCKED]
    gaps = [row for row in requirement_rows if row.coverage_status == CoverageStatus.GAP]
    warnings_rows = [
        row for row in requirement_rows if row.coverage_status == CoverageStatus.WARNING
    ]

    blocking_generation = [
        row
        for row in requirement_rows
        if row.blocks_generation
        and row.coverage_status in {CoverageStatus.MISSING, CoverageStatus.BLOCKED}
    ]

    required_rows = [
        row
        for row in requirement_rows
        if row.classification == RequirementClassification.REQUIRED
    ]
    required_covered = [
        row
        for row in required_rows
        if row.coverage_status
        in {CoverageStatus.SATISFIED, CoverageStatus.WARNING, CoverageStatus.BLOCKED}
    ]

    if not required_covered:
        connection_status = ConnectionStatus.NOT_CONNECTED
    elif len(required_covered) < len(required_rows):
        connection_status = ConnectionStatus.PARTIALLY_CONNECTED
    else:
        connection_status = ConnectionStatus.CONNECTED

    if blocking_generation:
        generation_status = GenerationStatus.BLOCKED
        can_generate = False
    elif gaps or unknown or missing or warnings_rows or blocked:
        generation_status = GenerationStatus.READY_WITH_GAPS
        can_generate = True
    else:
        generation_status = GenerationStatus.READY_TO_GENERATE
        can_generate = True

    warning_messages: list[str] = []
    for row in warnings_rows:
        warning_messages.append(f"{row.label}: open warning issue on linked facts.")
    for row in gaps:
        warning_messages.append(f"{row.label}: not connected (placeholder allowed for G2).")
    for row in unknown:
        warning_messages.append(f"{row.label}: applicability unknown.")

    material = build_chapter_source_material(
        definition,
        payload=payload,
        assertions=assertions,
        open_issues=open_issues,
    )
    source_hash = compute_source_hash(material)

    return ChapterReadiness(
        chapter_key=definition.key,
        title=definition.title,
        supported=True,
        source_adapter=definition.source_adapter,
        connection_status=connection_status,
        generation_status=generation_status,
        can_generate=can_generate,
        registry_version=REGISTRY_VERSION,
        source_hash=source_hash,
        requirement_total=len(requirement_rows),
        satisfied_count=len(satisfied) + len(warnings_rows),
        missing_count=len(missing),
        unknown_applicability_count=len(unknown),
        blocking_count=len(blocked),
        gap_count=len(gaps),
        warning_count=len(warnings_rows),
        requirements=requirement_rows,
        warnings=warning_messages,
        workstream_links=list(definition.workstream_links),
        company_incorporation_workspace_id=workspace_id,
    )


def evaluate_chapter_key(
    chapter_key: str,
    *,
    payload: dict[str, Any] | None,
    assertions: list[AssertionView],
    open_issues: list[IssueView],
    workspace_id: UUID | None = None,
) -> ChapterReadiness | None:
    definition = get_chapter_definition(chapter_key)
    if definition is None:
        return None
    return evaluate_chapter_readiness(
        definition,
        payload=payload,
        assertions=assertions,
        open_issues=open_issues,
        workspace_id=workspace_id,
    )
