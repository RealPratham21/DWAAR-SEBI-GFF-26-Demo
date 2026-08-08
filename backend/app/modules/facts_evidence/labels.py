"""Human-readable labels for global facts (G5)."""

from __future__ import annotations

from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.drhp.generation.source_extractors import SECTION_TITLES, WORKSTREAM_TITLES
from app.modules.facts_evidence.constants import WORKSTREAM_LABELS


def workstream_label(slug: str) -> str:
    return WORKSTREAM_LABELS.get(slug) or WORKSTREAM_TITLES.get(slug, slug.replace("-", " ").title())


def section_label(section_key: str) -> str:
    if not section_key:
        return ""
    return SECTION_TITLES.get(section_key) or section_key.replace("-", " ").replace("_", " ").title()


def chapter_label(chapter_key: str) -> str:
    return CHAPTER_TITLES.get(chapter_key, chapter_key.replace("-", " ").title())


def workstream_url(slug: str, *, section: str | None = None, record_id: str | None = None) -> str:
    base = f"/projects/demo/workstreams/{slug}?tab=information"
    if section:
        base = f"{base}&section={section}"
    if record_id:
        base = f"{base}&record={record_id}"
    return base


def drhp_block_url(chapter_key: str, block_id: str) -> str:
    return f"/projects/demo/drhp?chapter={chapter_key}&blockId={block_id}"


def document_url(document_id: str, *, version_id: str | None = None, page: int | None = None) -> str:
    url = f"/projects/demo/workstreams/company-incorporation?tab=documents&document={document_id}"
    if version_id:
        url = f"{url}&version={version_id}"
    if page is not None:
        url = f"{url}&page={page}"
    return url
