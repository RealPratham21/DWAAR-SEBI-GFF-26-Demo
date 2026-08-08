"""Human-readable labels for global issues (G4)."""

from __future__ import annotations

from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.issues_gaps.constants import WORKSTREAM_LABELS


def workstream_label(slug: str) -> str:
    return WORKSTREAM_LABELS.get(slug, slug.replace("-", " ").title())


def section_label(section_key: str) -> str:
    if not section_key:
        return ""
    return section_key.replace("-", " ").replace("_", " ").title()


def chapter_labels(chapter_keys: list[str]) -> list[str]:
    return [CHAPTER_TITLES.get(key, key.replace("-", " ").title()) for key in chapter_keys]


def workstream_url(slug: str, *, section: str | None = None, tab: str = "information") -> str:
    base = f"/projects/demo/workstreams/{slug}?tab={tab}"
    if section:
        return f"{base}&section={section}"
    return base


def drhp_chapter_url(chapter_key: str) -> str:
    return f"/projects/demo/drhp?chapter={chapter_key}"


def ci_issue_url(issue_id: str) -> str:
    return f"/projects/demo/workstreams/company-incorporation?tab=documents&issue={issue_id}"
