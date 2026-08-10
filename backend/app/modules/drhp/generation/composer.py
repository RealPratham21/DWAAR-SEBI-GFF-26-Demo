"""Merge deterministic structure and Cohere narrative into canonical chapter AST."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.ast.schemas import CohereStructuredChapterOutput, DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.drhp.generation.deterministic_ast import build_deterministic_tables_for_hybrid
from app.modules.drhp.generation.ast_sanitizer import sanitize_chapter_ast
from app.modules.drhp.generation.fact_locking import allowed_display_values, build_global_locked_facts
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot


def compose_chapter_ast(
    *,
    chapter_key: str,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    deterministic_ast: DrhpChapterAST | None = None,
    cohere_output: CohereStructuredChapterOutput | None = None,
) -> DrhpChapterAST:
    if deterministic_ast and not cohere_output:
        return deterministic_ast

    sections: list[DrhpSectionAST] = []
    order = 1

    if deterministic_ast:
        sections.extend(deterministic_ast.sections)

    table_blocks = build_deterministic_tables_for_hybrid(chapter_key, bundle, snapshots)
    if table_blocks and not deterministic_ast:
        sections.append(
            DrhpSectionAST(
                section_key=f"{chapter_key}-structured-disclosures",
                heading=f"{CHAPTER_TITLES.get(chapter_key, chapter_key)} — Structured Disclosures",
                order=order,
                blocks=table_blocks,
            )
        )
        order += 1

    if cohere_output:
        for section in cohere_output.sections:
            blocks = [_normalize_block(block) for block in section.blocks]
            sections.append(
                DrhpSectionAST(
                    section_key=section.section_key,
                    heading=section.heading,
                    order=order,
                    blocks=blocks,
                )
            )
            order += 1

    chapter = DrhpChapterAST(
        chapter_key=chapter_key,
        title=CHAPTER_TITLES.get(chapter_key, chapter_key),
        order=0,
        sections=sections,
    )
    locked = build_global_locked_facts(snapshots)
    return sanitize_chapter_ast(
        chapter,
        global_context=bundle.global_context,
        allowed_displays=allowed_display_values(locked),
    )


def _normalize_block(block: DrhpBlockAST | dict[str, Any]) -> DrhpBlockAST:
    if isinstance(block, DrhpBlockAST):
        return block
    return DrhpBlockAST.model_validate(block)


def build_chapter_digest(chapter_ast: DrhpChapterAST) -> dict[str, Any]:
    lines: list[str] = []
    for section in chapter_ast.sections:
        for block in section.blocks:
            text = _extract_text(block.content)
            if text:
                lines.append(text[:240])
    summary = lines[0] if lines else f"{chapter_ast.title} generated."
    return {
        "chapterKey": chapter_ast.chapter_key,
        "title": chapter_ast.title,
        "summaryLine": summary[:300],
        "blockCount": sum(len(s.blocks) for s in chapter_ast.sections),
    }


def ast_source_refs_summary(chapter_ast: DrhpChapterAST, bundle: ChapterSourceBundle) -> list[dict[str, Any]]:
    ref_map = {ref.ref_id: ref for ref in bundle.source_refs}
    seen: set[str] = set()
    summary: list[dict[str, Any]] = []
    for section in chapter_ast.sections:
        for block in section.blocks:
            for ref_id in block.source_ref_ids:
                if ref_id in seen:
                    continue
                seen.add(ref_id)
                ref = ref_map.get(ref_id)
                if ref:
                    summary.append(ref.model_dump(by_alias=True, mode="json"))
    return summary


def _extract_text(content: dict[str, Any]) -> str:
    if "text" in content:
        return str(content["text"])
    if "items" in content:
        return "; ".join(str(i) for i in content["items"][:3])
    return ""
