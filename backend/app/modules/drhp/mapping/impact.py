"""Workstream change → affected chapters impact map."""

from __future__ import annotations

from app.modules.drhp.constants import ALL_CHAPTER_KEYS
from app.modules.drhp.mapping.chapters import CHAPTER_MAPPINGS


def get_affected_chapters_for_workstream(workstream_slug: str) -> tuple[str, ...]:
    affected: list[str] = []
    for key in ALL_CHAPTER_KEYS:
        mapping = CHAPTER_MAPPINGS[key]
        if workstream_slug in mapping.primary_workstreams or workstream_slug in mapping.supporting_workstreams:
            affected.append(key)
    return tuple(affected)


WORKSTREAM_IMPACT_MAP: dict[str, tuple[str, ...]] = {
    slug: get_affected_chapters_for_workstream(slug)
    for slug in (
        "company-incorporation",
        "ipo-setup-eligibility",
        "capital-ownership",
        "business-operations",
        "objects-of-issue",
        "financials-kpis",
        "management-governance",
        "industry-market",
        "group-entities-related-parties",
        "borrowings-assets-contracts",
        "litigation-approvals-compliance",
        "intermediaries-filing",
    )
}
