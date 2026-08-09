"""DRHP usage linkage for document-backed evidence (G6)."""

from __future__ import annotations

from app.models.user import User
from app.modules.data_room.schemas import DrhpUsageSummary, RawDataRoomDocument
from app.modules.facts_evidence.aggregator import aggregate_facts_context
from app.modules.facts_evidence.labels import chapter_label, drhp_block_url
from app.modules.facts_evidence.service import _usage_for_fact
from sqlalchemy.orm import Session


def attach_drhp_usage(db: Session, user: User, documents: list[RawDataRoomDocument]) -> None:
    ctx = aggregate_facts_context(db, user)

    for document in documents:
        version_id = str(document.metadata.get("currentVersionId") or "")
        if not version_id:
            continue
        seen: set[str] = set()
        summaries: list[dict[str, str]] = []
        for fact in ctx.facts:
            if not fact.evidence_refs:
                continue
            if not any(str(ev.get("documentVersionId") or "") == version_id for ev in fact.evidence_refs):
                continue
            for usage in _usage_for_fact(fact, ctx.drhp_usage):
                key = f"{usage.chapter_key}:{usage.block_id}"
                if key in seen:
                    continue
                seen.add(key)
                summaries.append(
                    {
                        "chapterKey": usage.chapter_key,
                        "chapterLabel": usage.chapter_label or chapter_label(usage.chapter_key),
                        "sectionHeading": usage.section_heading,
                        "blockId": usage.block_id,
                        "openUrl": usage.open_url or drhp_block_url(usage.chapter_key, usage.block_id),
                    }
                )
        document.drhp_usage_count = len(summaries)
        document.metadata["drhpUsage"] = summaries


def drhp_usage_summaries(document: RawDataRoomDocument) -> list[DrhpUsageSummary]:
    raw = document.metadata.get("drhpUsage") or []
    return [
        DrhpUsageSummary(
            chapter_key=item["chapterKey"],
            chapter_label=item["chapterLabel"],
            section_heading=item.get("sectionHeading") or "",
            block_id=item["blockId"],
            open_url=item.get("openUrl") or "",
        )
        for item in raw
        if isinstance(item, dict)
    ]
