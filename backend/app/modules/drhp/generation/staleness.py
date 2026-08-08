"""Source staleness comparison between live workspaces and generation snapshots."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.modules.drhp.mapping.impact import get_affected_chapters_for_workstream
from app.modules.drhp.workstreams import load_all_workstreams


def compare_snapshot_staleness(
    db: Session,
    user_id: uuid.UUID,
    snapshot: DrhpGenerationSnapshot,
) -> dict[str, Any]:
    live = load_all_workstreams(db, user_id)
    frozen_versions = snapshot.source_workstream_versions or {}
    stale_workstreams: list[dict[str, Any]] = []
    affected_chapters: set[str] = set()

    for slug, frozen in frozen_versions.items():
        live_row = live.get(slug)
        if live_row is None:
            stale_workstreams.append({"slug": slug, "reason": "workspace_missing"})
            affected_chapters.update(get_affected_chapters_for_workstream(slug))
            continue
        if live_row.version != frozen.get("version") or live_row.payload_hash != frozen.get("payloadHash"):
            stale_workstreams.append(
                {
                    "slug": slug,
                    "reason": "version_or_hash_changed",
                    "frozenVersion": frozen.get("version"),
                    "liveVersion": live_row.version,
                }
            )
            affected_chapters.update(get_affected_chapters_for_workstream(slug))

    return {
        "snapshotId": str(snapshot.id),
        "isStale": bool(stale_workstreams),
        "staleWorkstreams": stale_workstreams,
        "affectedChapters": sorted(affected_chapters),
    }
