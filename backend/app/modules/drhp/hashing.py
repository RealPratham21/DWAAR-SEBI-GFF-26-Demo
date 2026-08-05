"""Deterministic chapter source hashing for immutable snapshots."""

from __future__ import annotations

import hashlib
import json
from typing import Any
from uuid import UUID

from app.modules.drhp.constants import REGISTRY_VERSION
from app.modules.drhp.registry import ChapterDefinition
from app.modules.drhp.source_selection import (
    AssertionView,
    IssueView,
    select_source_for_requirement,
)


def _json_default(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    raise TypeError(f"Object of type {type(value)!r} is not JSON serializable")


def canonical_json(payload: Any) -> str:
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=_json_default,
    )


def build_chapter_source_material(
    definition: ChapterDefinition,
    *,
    payload: dict[str, Any],
    assertions: list[AssertionView],
    open_issues: list[IssueView],
) -> dict[str, Any]:
    """Build the canonical hash input for a chapter (relevant sources only)."""

    items: list[dict[str, Any]] = []
    for requirement in definition.requirements:
        applicability, coverage, selected = select_source_for_requirement(
            requirement,
            payload=payload,
            assertions=assertions,
            open_issues=open_issues,
        )
        items.append(
            {
                "requirementKey": requirement.key,
                "classification": requirement.classification,
                "applicability": applicability,
                "coverageStatus": coverage,
                "selectedSourceType": selected.source_type,
                "selectedValue": selected.value,
                "informationPaths": list(selected.information_paths),
                "assertionIds": [str(item) for item in selected.assertion_ids],
                "evidence": [
                    {
                        "assertionId": str(ref.assertion_id),
                        "role": ref.role,
                        "reviewStatus": ref.review_status,
                        "comparisonStatus": ref.comparison_status,
                        "sourceTemporality": ref.source_temporality,
                        "documentVersionId": str(ref.document_version_id),
                        "evidenceIds": [str(item) for item in ref.evidence_ids],
                        "pageNumbers": list(ref.page_numbers),
                        "quoteSnapshots": list(ref.quote_snapshots),
                    }
                    for ref in selected.evidence_refs
                ],
                "issueIds": [str(item) for item in selected.issue_ids],
            }
        )

    return {
        "registryVersion": REGISTRY_VERSION,
        "chapterKey": definition.key,
        "items": items,
    }


def compute_source_hash(material: dict[str, Any]) -> str:
    digest = hashlib.sha256(canonical_json(material).encode("utf-8"))
    return digest.hexdigest()
