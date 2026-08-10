"""Render ChapterContentPlan items into deterministic DRHP AST sections (P2.2)."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN, BlockSupportState, CHAPTER_TITLES
from app.modules.drhp.generation.content_plan import ChapterContentPlan, DisclosureItem
from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast, build_deterministic_tables_for_hybrid
from app.modules.drhp.generation.structured_narrative import (
    _build_definitions,
    _build_financial_mda,
    _build_risk_factors,
    _risk_body_for_candidate,
)
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _block(kind: str, content: dict[str, Any], refs: list[str], order: int = 1) -> DrhpBlockAST:
    return DrhpBlockAST(
        block_id=f"blk-{uuid4()}",
        kind=kind,  # type: ignore[arg-type]
        order=order,
        content=content,
        source_ref_ids=refs,
        support_state=BlockSupportState.STRUCTURED_INPUT_BACKED,
    )


def _table(headers: list[str], rows: list[list[str]], caption: str, refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("table", {"headers": headers, "rows": rows, "caption": caption}, refs, order)


def _paragraph(text: str, refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("paragraph", {"text": text}, refs, order)


def _refs(bundle: ChapterSourceBundle, limit: int = 5) -> list[str]:
    return [r.ref_id for r in bundle.source_refs[:limit]]


def render_definitions_chapter(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> DrhpChapterAST:
    sections, _ = _build_definitions(bundle, snapshots, [])
    return DrhpChapterAST(
        chapter_key="definitions-abbreviations",
        title=CHAPTER_TITLES["definitions-abbreviations"],
        order=0,
        sections=sections,
    )


def render_risk_deterministic_sections(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    candidates: list[dict[str, Any]],
) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    rendered: list[DrhpSectionAST] = []
    for idx, candidate in enumerate(candidates[:12], start=1):
        heading = candidate.get("headingSeed") or "Risk factor"
        body = _risk_body_for_candidate(candidate, snapshots)
        if not body:
            facts = candidate.get("supportingFacts") or []
            if facts:
                body = " ".join(str(f) for f in facts[:4])
        if not body:
            body = (
                f"Our business and operations may be affected by factors relating to "
                f"{heading.lower()}, based on information currently available in our records."
            )
        rendered.append(
            DrhpSectionAST(
                section_key=f"risk-{candidate.get('riskCandidateId', idx)}",
                heading=heading[:120],
                order=idx,
                blocks=[_paragraph(body, candidate.get("sourceRefIds") or refs[:1])],
            )
        )
    if rendered:
        return rendered
    sections, _ = _build_risk_factors(bundle, snapshots, [])
    return sections


def render_business_deterministic_sections(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> list[DrhpSectionAST]:
    from app.modules.drhp.generation.business_disclosures import build_business_sections

    return build_business_sections(bundle, snapshots)


def render_financial_deterministic_sections(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    sections: list[DrhpSectionAST] = []
    table_blocks = build_deterministic_tables_for_hybrid("financial-information-mda", bundle, snapshots)
    if table_blocks:
        sections.append(
            DrhpSectionAST(
                section_key="financial-structured-disclosures",
                heading="Financial Information — Structured Disclosures",
                order=1,
                blocks=table_blocks,
            )
        )
    from app.modules.drhp.generation.source_extractors import extract_basis_metrics

    ratio_rows = extract_basis_metrics(snapshots)[:12]
    if ratio_rows:
        sections.append(
            DrhpSectionAST(
                section_key="ratios-sme-eligibility",
                heading="Ratios and SME Eligibility",
                order=2,
                blocks=[_table(["Metric", "Value"], ratio_rows, "Financial ratios and SME eligibility metrics", refs)],
            )
        )
    mda_sections, _ = _build_financial_mda(bundle, snapshots, [])
    for sec in mda_sections:
        sec.order = len(sections) + 1
        sections.append(sec)
    return sections


def render_legal_deterministic_sections(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> list[DrhpSectionAST]:
    from app.modules.drhp.generation.structured_narrative import _build_legal

    sections, _ = _build_legal(bundle, snapshots, [])
    return sections


def render_deterministic_sections_for_plan(
    plan: ChapterContentPlan,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    risk_candidates: list[dict[str, Any]] | None = None,
) -> list[DrhpSectionAST]:
    from app.modules.drhp.generation.chapter_density import enrich_chapter_sections

    key = plan.chapter_key
    if key == "definitions-abbreviations":
        return render_definitions_chapter(bundle, snapshots).sections
    if key == "financial-information-mda":
        return render_financial_deterministic_sections(bundle, snapshots)
    if key == "business-operations":
        return render_business_deterministic_sections(bundle, snapshots)

    enriched = enrich_chapter_sections(key, bundle, snapshots, risk_candidates=risk_candidates)
    if enriched:
        return enriched

    if key == "risk-factors":
        return render_risk_deterministic_sections(bundle, snapshots, candidates=risk_candidates or [])

    ast = build_deterministic_chapter_ast(key, bundle, snapshots)
    if ast.sections:
        return list(ast.sections)

    table_blocks = build_deterministic_tables_for_hybrid(key, bundle, snapshots)
    if table_blocks:
        return [
            DrhpSectionAST(
                section_key=f"{key}-structured-disclosures",
                heading=f"{CHAPTER_TITLES.get(key, key)} — Structured Disclosures",
                order=1,
                blocks=table_blocks,
            )
        ]
    return []


def render_narrative_fallback_section(
    item: DisclosureItem,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> DrhpSectionAST | None:
    from app.modules.drhp.generation.structured_narrative import build_structured_chapter_narrative

    chapter_key = item.structured_facts.get("chapterKey") or _chapter_for_section(item.section_key)
    if not chapter_key:
        return None
    try:
        output = build_structured_chapter_narrative(
            chapter_key=chapter_key,
            bundle=bundle,
            snapshots=snapshots,
        )
    except Exception:  # noqa: BLE001
        return None
    for section in output.sections:
        if section.section_key == item.section_key or section.section_key == item.fallback_section_key:
            return section
    if output.sections and item.fallback_section_key == "any":
        return output.sections[0]
    return None


def _chapter_for_section(section_key: str) -> str | None:
    mapping = {
        "business-overview": "business-operations",
        "operating-model": "business-operations",
        "products-services": "business-operations",
        "customers": "business-operations",
        "mda": "financial-information-mda",
        "pricing-factors": "basis-for-issue-price",
        "executive-summary": "summary-of-drhp",
    }
    if section_key in mapping:
        return mapping[section_key]
    if section_key.startswith("risk-"):
        return "risk-factors"
    return None


def render_missing_item_section(item: DisclosureItem, refs: list[str]) -> DrhpSectionAST:
    return DrhpSectionAST(
        section_key=item.section_key,
        heading=item.title,
        order=item.order,
        blocks=[
            DrhpBlockAST(
                block_id=f"blk-missing-{item.id}",
                kind="placeholder",
                order=1,
                content={"text": PLACEHOLDER_TOKEN, "reason": f"Pending disclosure: {item.title}"},
                source_ref_ids=refs[:1],
                support_state=BlockSupportState.PLACEHOLDER,
            )
        ],
    )
