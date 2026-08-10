"""Merge deterministic disclosure blocks with optional Cohere narrative (P2.2)."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.ast.schemas import CohereStructuredChapterOutput, DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import CHAPTER_TITLES, PLACEHOLDER_TOKEN, ChapterGenerationMode
from app.modules.drhp.generation.ast_sanitizer import sanitize_chapter_ast
from app.modules.drhp.generation.content_plan import ChapterContentPlan, DisclosureItem, build_chapter_content_plan
from app.modules.drhp.generation.disclosure_renderers import (
    render_definitions_chapter,
    render_deterministic_sections_for_plan,
    render_missing_item_section,
    render_narrative_fallback_section,
)
from app.modules.drhp.generation.fact_locking import allowed_display_values, build_global_locked_facts
from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry
from app.modules.drhp.generation.structured_narrative import GENERIC_FILLER_PHRASES
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot

_DETERMINISTIC_ONLY = {
    "definitions-abbreviations",
    "cover-page-front-matter",
    "general-information-issue",
    "capital-structure-ownership",
    "terms-structure-procedure",
    "material-contracts-inspection",
}


def _section_text(section: DrhpSectionAST) -> str:
    parts: list[str] = []
    for block in section.blocks:
        content = block.content or {}
        if content.get("text"):
            parts.append(str(content["text"]))
        for row in content.get("rows") or []:
            if isinstance(row, list):
                parts.extend(str(c) for c in row)
    return " ".join(parts).strip()


def _is_usable_narrative(section: DrhpSectionAST) -> bool:
    text = _section_text(section)
    if not text or text == PLACEHOLDER_TOKEN:
        return False
    lowered = text.lower()
    if all(phrase not in lowered for phrase in GENERIC_FILLER_PHRASES):
        return True
    return len(text) > 120


def _index_sections(sections: list[DrhpSectionAST]) -> dict[str, DrhpSectionAST]:
    indexed: dict[str, DrhpSectionAST] = {}
    for section in sections:
        indexed[section.section_key] = section
    return indexed


def _merge_sections(
    plan: ChapterContentPlan,
    deterministic_sections: list[DrhpSectionAST],
    narrative_sections: dict[str, DrhpSectionAST],
    *,
    refs: list[str],
) -> list[DrhpSectionAST]:
    det_index = _index_sections(deterministic_sections)
    merged: list[DrhpSectionAST] = []
    seen_keys: set[str] = set()
    order = 1

    for item in sorted(plan.items, key=lambda i: i.order):
        if item.support_state == "not_applicable":
            continue
        section = det_index.get(item.section_key)
        if section and item.section_key not in seen_keys:
            merged.append(section.model_copy(update={"order": order}))
            seen_keys.add(item.section_key)
            order += 1
            continue
        if item.content_type != "narrative":
            continue
        if item.support_state == "missing":
            if item.required:
                merged.append(render_missing_item_section(item, refs).model_copy(update={"order": order}))
                order += 1
            continue
        section = narrative_sections.get(item.section_key)
        if section and item.section_key not in seen_keys:
            merged.append(section.model_copy(update={"order": order}))
            seen_keys.add(item.section_key)
            order += 1

    for section in deterministic_sections:
        if section.section_key not in seen_keys:
            merged.append(section.model_copy(update={"order": order}))
            seen_keys.add(section.section_key)
            order += 1

    return merged


def _try_cohere_narrative(
    *,
    chapter_key: str,
    bundle_dict: dict[str, Any],
    provider: Any,
    validation_failures: list[str] | None,
    narrative_items: list[DisclosureItem],
) -> CohereStructuredChapterOutput | None:
    if not narrative_items:
        return None
    bundle_dict = dict(bundle_dict)
    bundle_dict["narrativeOnly"] = True
    bundle_dict["narrativeRequests"] = [
        {"sectionKey": i.section_key, "title": i.title, "fieldPaths": i.field_paths}
        for i in narrative_items
    ]
    try:
        return provider.generate_chapter_narrative(
            chapter_key=chapter_key,
            bundle=bundle_dict,
            validation_failures=validation_failures,
        )
    except Exception:  # noqa: BLE001
        return None


def assemble_chapter_with_plan(
    *,
    chapter_key: str,
    mode: str,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    provider: Any,
    chapter_rows: dict[str, Any] | None = None,
    validation_failures: list[str] | None = None,
    snapshot_id: str = "",
) -> tuple[DrhpChapterAST, dict[str, Any]]:
    from app.modules.drhp.generation.deterministic_ast import build_deterministic_chapter_ast
    from app.modules.drhp.generation.fact_locking import (
        build_metric_terminology_registry,
        bundle_locked_facts_payload,
        enrich_bundle_context,
    )
    from app.modules.drhp.generation.source_extractors import extract_directors

    bundle = enrich_bundle_context(bundle, snapshots)
    plan = build_chapter_content_plan(chapter_key, snapshots, bundle=bundle)
    refs = [r.ref_id for r in bundle.source_refs[:5]]

    metrics: dict[str, Any] = {
        **plan.metrics(),
        "deterministicBlocks": 0,
        "cohereNarrativeBlocks": 0,
        "deterministicFallbackBlocks": 0,
        "placeholderBlocks": 0,
    }

    if mode == ChapterGenerationMode.DETERMINISTIC or chapter_key in _DETERMINISTIC_ONLY:
        if chapter_key == "definitions-abbreviations":
            chapter = render_definitions_chapter(bundle, snapshots)
        else:
            chapter = build_deterministic_chapter_ast(chapter_key, bundle, snapshots)
        metrics["deterministicBlocks"] = sum(len(s.blocks) for s in chapter.sections)
        return _finalize(chapter, plan, bundle, snapshots), metrics

    risk_candidates: list[dict[str, Any]] | None = None
    if chapter_key == "risk-factors":
        risk_candidates, extra_refs = build_risk_candidate_registry(snapshots)
        bundle.risk_candidates = risk_candidates
        bundle.source_refs.extend(extra_refs)

    deterministic_sections = render_deterministic_sections_for_plan(
        plan,
        bundle,
        snapshots,
        risk_candidates=risk_candidates,
    )
    metrics["deterministicBlocks"] = sum(len(s.blocks) for s in deterministic_sections)

    narrative_sections: dict[str, DrhpSectionAST] = {}
    narrative_items = plan.narrative_items()

    bundle_dict = bundle.model_dump(by_alias=True, mode="json")
    bundle_dict["lockedFacts"] = bundle_locked_facts_payload(bundle, snapshots)
    bundle_dict["personRegistry"] = bundle.global_context.get("personRegistry") or {}
    bundle_dict["entityRegistry"] = bundle.global_context.get("entityRegistry") or {}
    bundle_dict["metricTerminology"] = build_metric_terminology_registry(snapshots)

    if chapter_key == "summary-of-drhp" and chapter_rows:
        digests = []
        for key, row in chapter_rows.items():
            if key in ("summary-of-drhp", "definitions-abbreviations", "declarations-aoa-miscellaneous"):
                continue
            digest = getattr(row, "chapter_digest", None) or (row.get("chapter_digest") if isinstance(row, dict) else None)
            if digest:
                digests.append(digest)
        bundle_dict["chapterDigests"] = digests
        bundle_dict["canonicalDirectors"] = [
            {"name": d["name"], "designation": d["designation"]} for d in extract_directors(snapshots)
        ]

    if narrative_items and mode != ChapterGenerationMode.DETERMINISTIC:
        cohere_output = _try_cohere_narrative(
            chapter_key=chapter_key,
            bundle_dict=bundle_dict,
            provider=provider,
            validation_failures=validation_failures,
            narrative_items=narrative_items,
        )
        cohere_index = _index_sections(list(cohere_output.sections)) if cohere_output else {}
        for item in narrative_items:
            cohere_sec = cohere_index.get(item.section_key)
            if cohere_sec and _is_usable_narrative(cohere_sec):
                narrative_sections[item.section_key] = cohere_sec
                metrics["cohereNarrativeBlocks"] += 1
                continue
            fallback = render_narrative_fallback_section(item, bundle, snapshots)
            if fallback is None and chapter_key == "risk-factors":
                from app.modules.drhp.generation.disclosure_renderers import render_risk_deterministic_sections

                for sec in render_risk_deterministic_sections(bundle, snapshots, candidates=risk_candidates or []):
                    if sec.section_key == item.section_key:
                        fallback = sec
                        break
            if fallback:
                narrative_sections[item.section_key] = fallback
                metrics["deterministicFallbackBlocks"] += 1

    merged_sections = _merge_sections(plan, deterministic_sections, narrative_sections, refs=refs)

    if not merged_sections and chapter_key != "declarations-aoa-miscellaneous":
        fallback_ast = build_deterministic_chapter_ast(chapter_key, bundle, snapshots)
        merged_sections = list(fallback_ast.sections)
        metrics["deterministicFallbackBlocks"] += len(merged_sections)

    metrics["placeholderBlocks"] = sum(
        1
        for section in merged_sections
        for block in section.blocks
        if block.kind == "placeholder"
        or str((block.content or {}).get("text") or "") == PLACEHOLDER_TOKEN
    )

    chapter = DrhpChapterAST(
        chapter_key=chapter_key,
        title=CHAPTER_TITLES.get(chapter_key, chapter_key),
        order=0,
        sections=merged_sections,
    )
    return _finalize(chapter, plan, bundle, snapshots), metrics


def _finalize(
    chapter: DrhpChapterAST,
    plan: ChapterContentPlan,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> DrhpChapterAST:
    locked = build_global_locked_facts(snapshots)
    missing_keys = {item.section_key for item in plan.missing_items() if item.required}
    return sanitize_chapter_ast(
        chapter,
        global_context=bundle.global_context,
        allowed_displays=allowed_display_values(locked),
        content_plan=plan,
        allow_placeholder_sections=missing_keys,
    )
