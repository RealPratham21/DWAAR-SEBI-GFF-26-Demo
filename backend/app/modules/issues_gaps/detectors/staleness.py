"""Detect stale DRHP draft issues from source workstream changes (G4)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.drhp_document import DrhpDocument, DrhpDocumentVersion
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.models.user import User
from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.drhp.generation.staleness import compare_snapshot_staleness
from app.modules.issues_gaps.constants import WORKSTREAM_LABELS
from app.modules.issues_gaps.fingerprints import build_fingerprint
from app.modules.issues_gaps.labels import drhp_chapter_url
from app.modules.issues_gaps.schemas import RawGlobalIssue


def detect_stale_draft_issue(db: Session, user: User) -> list[RawGlobalIssue]:
    issues: list[RawGlobalIssue] = []
    now = datetime.now(tz=UTC)

    document = db.scalar(select(DrhpDocument).where(DrhpDocument.user_id == user.id))
    if document is None:
        return issues

    doc_version = db.scalar(
        select(DrhpDocumentVersion)
        .where(DrhpDocumentVersion.document_id == document.id)
        .order_by(DrhpDocumentVersion.version_number.desc())
    )
    if doc_version is None or doc_version.completed_chapters == 0:
        return issues

    snapshot = db.get(DrhpGenerationSnapshot, doc_version.generation_snapshot_id)
    if snapshot is None:
        return issues

    stale_result = compare_snapshot_staleness(db, user.id, snapshot)
    if not stale_result.get("isStale"):
        return issues

    stale_workstreams = stale_result.get("staleWorkstreams") or []
    affected = list(stale_result.get("affectedChapters") or [])
    ws_labels = [
        WORKSTREAM_LABELS.get(row.get("slug", ""), row.get("slug", "")) for row in stale_workstreams
    ]
    chapter_labels = [CHAPTER_TITLES.get(key, key) for key in affected[:8]]

    issues.append(
        RawGlobalIssue(
            fingerprint=build_fingerprint(
                source_kind="drhp_staleness",
                workstream_key="drhp",
                section_key=str(doc_version.id),
                record_id=str(snapshot.id),
                issue_code="stale_draft",
            ),
            title="DRHP draft may be stale after source updates",
            description=(
                f"Source data changed in {len(stale_workstreams)} workstream(s) "
                f"({', '.join(ws_labels[:4])}{'…' if len(ws_labels) > 4 else ''}) "
                f"after draft version {doc_version.version_number} was generated."
            ),
            category="stale_draft",
            severity="medium",
            source_kind="drhp_staleness",
            workstream_key="drhp",
            workstream_label="DRHP",
            section_key=str(doc_version.id),
            section_label=f"Draft v{doc_version.version_number}",
            record_id=str(snapshot.id),
            record_label=f"Snapshot {snapshot.created_at.isoformat() if snapshot.created_at else ''}",
            why_it_matters=(
                f"The current draft may not reflect updated source data across "
                f"{len(affected)} affected chapter(s)."
            ),
            suggested_action="Regenerate the draft after reviewing the updated source data.",
            affected_drhp_chapters=affected,
            open_source_url=drhp_chapter_url(affected[0]) if affected else "/projects/demo/drhp",
            open_drhp_url="/projects/demo/drhp",
            metadata={
                "provenance": [
                    {
                        "sourceKind": "drhp_staleness",
                        "documentVersionId": str(doc_version.id),
                        "snapshotId": str(snapshot.id),
                        "staleWorkstreams": stale_workstreams,
                        "affectedChapterLabels": chapter_labels,
                        "snapshotTimestamp": snapshot.created_at.isoformat() if snapshot.created_at else None,
                    }
                ]
            },
            detected_at=now,
        )
    )

    return issues
