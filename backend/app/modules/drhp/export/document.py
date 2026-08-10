"""Assemble persisted chapter ASTs into a logical export document."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.modules.drhp.ast.schemas import DrhpChapterAST
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    CHAPTER_TITLES,
    ChapterVersionStatus,
)

COVER_CHAPTER_KEY = "cover-page-front-matter"
from app.modules.drhp.export.content import cell_text, normalize_chapter_ast
from app.modules.drhp.export.publication_safety import scan_document_chapters
from app.modules.drhp.export.styles import DRAFT_FOOTER_NOTICE, EXPORTER_VERSION

logger = logging.getLogger(__name__)


@dataclass
class ExportChapter:
    chapter_key: str
    title: str
    order: int
    available: bool
    unavailable_reason: str | None = None
    chapter_ast: DrhpChapterAST | None = None


@dataclass(frozen=True)
class TocEntry:
    """Body-chapter TOC row — cover is excluded from publication contents."""

    display_number: int
    title: str
    chapter_key: str


@dataclass
class DRHPExportDocument:
    exporter_version: str = EXPORTER_VERSION
    document_title: str = "Draft Red Herring Prospectus"
    issuer_name: str | None = None
    version_number: int = 1
    generated_at: datetime | None = None
    is_partial: bool = False
    partial_label: str | None = None
    draft_notice: str = DRAFT_FOOTER_NOTICE
    table_of_contents: list[TocEntry] = field(default_factory=list)
    chapters: list[ExportChapter] = field(default_factory=list)

    def cover_chapter(self) -> ExportChapter | None:
        return next((c for c in self.chapters if c.chapter_key == COVER_CHAPTER_KEY), None)

    def body_chapters(self) -> list[ExportChapter]:
        return [c for c in self.chapters if c.chapter_key != COVER_CHAPTER_KEY]

    def publication_chapters(self) -> list[ExportChapter]:
        """Render order: cover (if present) then all body chapters."""
        ordered: list[ExportChapter] = []
        cover = self.cover_chapter()
        if cover is not None:
            ordered.append(cover)
        ordered.extend(self.body_chapters())
        return ordered


def _unavailable_message(*, status: str, error_message: str | None) -> str:
    if status == ChapterVersionStatus.FAILED:
        message = "This chapter could not be generated in this draft."
        if error_message and _is_user_facing_error(error_message):
            return f"{message} {error_message[:240]}"
        return message
    if status == ChapterVersionStatus.BLOCKED:
        message = "This chapter is unavailable in this draft due to readiness constraints."
        if error_message and _is_user_facing_error(error_message):
            return f"{message} {error_message[:240]}"
        return message
    if status in {ChapterVersionStatus.QUEUED, ChapterVersionStatus.WAITING_FOR_DEPENDENCY}:
        return "This chapter was not generated in this draft."
    if status == ChapterVersionStatus.GENERATING:
        return "This chapter was still generating when export was requested."
    return "This chapter is unavailable in this draft."


def _is_user_facing_error(message: str) -> bool:
    lowered = message.casefold()
    blocked_tokens = ("traceback", "exception", "runtimeerror", "attributeerror", "cohere")
    return not any(token in lowered for token in blocked_tokens)


def _parse_chapter_ast(payload: dict[str, Any] | None, chapter_key: str) -> DrhpChapterAST | None:
    if not payload:
        return None
    try:
        chapter = DrhpChapterAST.model_validate(payload)
    except Exception:  # noqa: BLE001
        return None
    if not chapter.title:
        chapter = chapter.model_copy(update={"title": CHAPTER_TITLES.get(chapter_key, chapter_key)})
    return normalize_chapter_ast(chapter)


def extract_issuer_name(chapters: list[ExportChapter]) -> str | None:
    cover = next((chapter for chapter in chapters if chapter.chapter_key == "cover-page-front-matter"), None)
    if cover is None or not cover.available or cover.chapter_ast is None:
        return None
    for section in cover.chapter_ast.sections:
        for block in section.blocks:
            if block.kind not in {"table", "key_value_table"}:
                continue
            rows = block.content.get("rows") or []
            for row in rows:
                if not isinstance(row, list) or len(row) < 2:
                    continue
                label = cell_text(row[0]).casefold()
                if "issuer" in label and "name" in label:
                    issuer = cell_text(row[1])
                    if issuer and issuer != "[●]":
                        return issuer
    return None


def assemble_export_document(
    *,
    version_number: int,
    generated_at: datetime | None,
    is_partial: bool,
    chapter_rows_by_key: dict[str, Any],
) -> DRHPExportDocument:
    chapters: list[ExportChapter] = []
    for index, chapter_key in enumerate(ALL_CHAPTER_KEYS, start=1):
        row = chapter_rows_by_key.get(chapter_key)
        title = CHAPTER_TITLES.get(chapter_key, chapter_key)
        if row is None:
            chapters.append(
                ExportChapter(
                    chapter_key=chapter_key,
                    title=title,
                    order=index,
                    available=False,
                    unavailable_reason="This chapter is unavailable in this draft.",
                )
            )
            continue

        status = getattr(row, "status", row.get("status") if isinstance(row, dict) else "")
        if status in {ChapterVersionStatus.GENERATED, ChapterVersionStatus.GENERATED_WITH_WARNINGS}:
            payload = getattr(row, "ast_payload", None)
            if payload is None and isinstance(row, dict):
                payload = row.get("ast_payload")
            chapter_ast = _parse_chapter_ast(payload, chapter_key)
            chapters.append(
                ExportChapter(
                    chapter_key=chapter_key,
                    title=title,
                    order=index,
                    available=chapter_ast is not None,
                    unavailable_reason=None if chapter_ast else "Generated chapter content is missing.",
                    chapter_ast=chapter_ast,
                )
            )
            continue

        error_message = getattr(row, "error_message", None)
        if isinstance(row, dict):
            error_message = row.get("error_message")
        chapters.append(
            ExportChapter(
                chapter_key=chapter_key,
                title=title,
                order=index,
                available=False,
                unavailable_reason=_unavailable_message(status=str(status), error_message=error_message),
            )
        )

    issuer = extract_issuer_name(chapters)
    toc: list[TocEntry] = []
    display_number = 0
    for chapter in chapters:
        if chapter.chapter_key == COVER_CHAPTER_KEY:
            continue
        display_number += 1
        toc.append(
            TocEntry(
                display_number=display_number,
                title=chapter.title,
                chapter_key=chapter.chapter_key,
            )
        )
    partial_label = "Partial Draft" if is_partial else None
    available_asts = [chapter.chapter_ast for chapter in chapters if chapter.available and chapter.chapter_ast]
    safety_warnings = scan_document_chapters(available_asts)
    if safety_warnings:
        logger.warning("DRHP publication safety scan findings: %s", "; ".join(safety_warnings[:20]))
    return DRHPExportDocument(
        issuer_name=issuer,
        version_number=version_number,
        generated_at=generated_at,
        is_partial=is_partial,
        partial_label=partial_label,
        table_of_contents=toc,
        chapters=chapters,
    )
