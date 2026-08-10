"""ChapterContentPlan — deterministic disclosure assembly contract (P2.2)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

ContentType = Literal["table", "narrative", "list", "key_value", "calculated"]
SupportState = Literal["supported", "missing", "not_applicable"]


@dataclass
class DisclosureItem:
    id: str
    title: str
    section_key: str
    workstream: str
    field_paths: list[str] = field(default_factory=list)
    source_ref_ids: list[str] = field(default_factory=list)
    content_type: ContentType = "narrative"
    required: bool = True
    support_state: SupportState = "supported"
    structured_facts: dict[str, Any] = field(default_factory=dict)
    display_values: list[str] = field(default_factory=list)
    order: int = 1
    allow_cohere: bool = False
    fallback_section_key: str = ""


@dataclass
class ChapterContentPlan:
    chapter_key: str
    items: list[DisclosureItem] = field(default_factory=list)
    mapped_field_paths: list[str] = field(default_factory=list)
    unmapped_notes: list[str] = field(default_factory=list)

    def supported_items(self) -> list[DisclosureItem]:
        return [i for i in self.items if i.support_state == "supported"]

    def deterministic_items(self) -> list[DisclosureItem]:
        return [
            i
            for i in self.supported_items()
            if i.content_type in {"table", "list", "key_value", "calculated"}
        ]

    def narrative_items(self) -> list[DisclosureItem]:
        return [i for i in self.supported_items() if i.content_type == "narrative" and i.allow_cohere]

    def missing_items(self) -> list[DisclosureItem]:
        return [i for i in self.items if i.support_state == "missing"]

    def metrics(self) -> dict[str, int]:
        supported = self.supported_items()
        return {
            "disclosureItemsSupported": len(supported),
            "disclosureItemsMissing": len(self.missing_items()),
            "disclosureItemsNotApplicable": sum(1 for i in self.items if i.support_state == "not_applicable"),
            "deterministicItems": len(self.deterministic_items()),
            "narrativeRequests": len(self.narrative_items()),
            "mappedFieldPaths": len(self.mapped_field_paths),
        }


def build_chapter_content_plan(
    chapter_key: str,
    snapshots: dict[str, Any],
    *,
    bundle: Any = None,
) -> ChapterContentPlan:
    from app.modules.drhp.generation.content_plan_builders import PLAN_BUILDERS

    builder = PLAN_BUILDERS.get(chapter_key)
    if builder is None:
        return ChapterContentPlan(chapter_key=chapter_key)
    return builder(chapter_key, snapshots, bundle=bundle)
