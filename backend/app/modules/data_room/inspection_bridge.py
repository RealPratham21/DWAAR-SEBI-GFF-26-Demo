"""Intermediaries & Filing inspection register integration (G6)."""

from __future__ import annotations

from typing import Any

from app.modules.data_room.schemas import InspectionSummary
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _inspection_items(snapshot: WorkstreamSnapshot | None) -> list[dict[str, Any]]:
    if snapshot is None:
        return []
    section = snapshot.payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    items = section.get("inspectionItems") or []
    return [item for item in items if isinstance(item, dict)]


def inspection_for_document(
    *,
    snapshots: dict[str, WorkstreamSnapshot],
    document: Any,
) -> InspectionSummary | None:
    items = _inspection_items(snapshots.get("intermediaries-filing"))
    if not items:
        return None

    origin_id = getattr(document, "origin_document_id", None) or ""
    requirement_key = getattr(document, "requirement_key", None) or ""
    title = (getattr(document, "title", None) or "").strip().lower()

    for item in items:
        linked = str(item.get("linkedSourceRecordId") or "")
        item_title = str(item.get("title") or "").strip().lower()
        if linked and linked == origin_id:
            status = str(item.get("inclusionStatus") or "pending_review")
            return InspectionSummary(status=status, label=item.get("title") or "")
        if title and item_title and title in item_title:
            status = str(item.get("inclusionStatus") or "pending_review")
            return InspectionSummary(status=status, label=item.get("title") or "")

    if requirement_key and "intermediaries-filing:" in requirement_key:
        return None
    return None
