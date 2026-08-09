"""Deep links and labels for Data Room (G6)."""

from __future__ import annotations

from app.modules.data_room.constants import WORKSTREAM_LABELS
from app.modules.drhp.generation.source_extractors import SECTION_TITLES


def workstream_label(slug: str) -> str:
    return WORKSTREAM_LABELS.get(slug, slug.replace("-", " ").title())


def section_label(section_key: str) -> str:
    if not section_key:
        return ""
    return SECTION_TITLES.get(section_key) or section_key.replace("-", " ").replace("_", " ").title()


def workstream_url(workstream_key: str, *, section_key: str | None = None) -> str:
    if workstream_key == "company-incorporation":
        base = "/projects/demo/workstreams/company-incorporation?tab=documents"
    else:
        base = f"/projects/demo/workstreams/{workstream_key}?tab=information"
    if section_key:
        base = f"{base}&section={section_key}"
    return base


def ci_document_url(document_id: str, *, version_id: str | None = None) -> str:
    url = f"/projects/demo/workstreams/company-incorporation?tab=documents&document={document_id}"
    if version_id:
        url = f"{url}&version={version_id}"
    return url


def facts_evidence_url(*, workstream: str | None = None) -> str:
    if workstream:
        return f"/projects/demo/facts?workstream={workstream}"
    return "/projects/demo/facts"


def issues_url(issue_id: str | None = None) -> str:
    if issue_id:
        return f"/projects/demo/issues-gaps?issue={issue_id}"
    return "/projects/demo/issues-gaps"
