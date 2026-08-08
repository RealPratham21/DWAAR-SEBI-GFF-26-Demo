"""Generation snapshot creation and persistence."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.drhp_generation_snapshot import DrhpGenerationSnapshot
from app.models.user import User
from app.modules.drhp.bundles.builders import build_all_chapter_bundles
from app.modules.drhp.constants import (
    GENERATION_SNAPSHOT_SCHEMA_VERSION,
    REGISTRY_VERSION,
    DrhpErrorCode,
    WORKSTREAM_SLUGS,
)
from app.modules.drhp.generation.context import build_canonical_context
from app.modules.drhp.generation.registries import build_entity_registry, build_person_registry
from app.modules.drhp.generation.terms import build_term_registry
from app.modules.drhp.hashing import compute_source_hash
from app.modules.drhp.ownership import detect_share_count_conflict
from app.modules.drhp.workstreams import (
    WorkstreamSnapshot,
    load_all_workstreams,
    missing_workstream_slugs,
)


def _detect_global_conflicts(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, Any]]:
    conflicts: list[dict[str, Any]] = []
    capital = snapshots.get("capital-ownership")
    ipo = snapshots.get("ipo-setup-eligibility")
    if capital and ipo:
        cap_fresh = ((capital.payload.get("prePostIssueOwnership") or {}).get("freshIssueShares"))
        ipo_fresh = ((ipo.payload.get("offerStructure") or {}).get("freshIssueShares"))
        row = detect_share_count_conflict(
            capital_value=cap_fresh,
            ipo_value=ipo_fresh,
            field_path="freshIssueShares",
        )
        if row:
            conflicts.append(row.__dict__)
    return conflicts


def build_normalized_snapshot_payload(
    snapshots: dict[str, WorkstreamSnapshot],
) -> dict[str, Any]:
    person_registry, _ = build_person_registry(snapshots)
    entity_registry, _ = build_entity_registry(snapshots)
    context = build_canonical_context(
        snapshots,
        person_registry=person_registry,
        entity_registry=entity_registry,
    )
    terms = build_term_registry(context, snapshots)
    conflicts = _detect_global_conflicts(snapshots)

    workstream_versions = {
        slug: {
            "workspaceId": str(row.workspace_id),
            "version": row.version,
            "schemaVersion": row.schema_version,
            "payloadHash": row.payload_hash,
            "lastSavedAt": row.last_saved_at,
        }
        for slug, row in snapshots.items()
    }

    return {
        "workstreams": {slug: row.payload for slug, row in snapshots.items()},
        "workstreamVersions": workstream_versions,
        "canonicalContext": context,
        "personRegistry": person_registry,
        "entityRegistry": entity_registry,
        "termRegistry": terms,
        "conflicts": conflicts,
    }


def create_generation_snapshot(db: Session, user: User) -> DrhpGenerationSnapshot:
    snapshots = load_all_workstreams(db, user.id)
    missing = missing_workstream_slugs(snapshots)
    if missing:
        raise AppException(
            status_code=422,
            code=DrhpErrorCode.WORKSTREAMS_INCOMPLETE,
            message="Cannot create generation snapshot until all workstreams are initialized.",
            details={"missingWorkstreams": missing, "requiredWorkstreams": list(WORKSTREAM_SLUGS)},
        )

    normalized = build_normalized_snapshot_payload(snapshots)
    aggregate_hash = compute_source_hash(normalized)

    snapshot = DrhpGenerationSnapshot(
        user_id=user.id,
        snapshot_version=1,
        registry_version=REGISTRY_VERSION,
        snapshot_schema_version=GENERATION_SNAPSHOT_SCHEMA_VERSION,
        source_workstream_versions=normalized["workstreamVersions"],
        normalized_payload=normalized,
        canonical_context=normalized["canonicalContext"],
        source_registry={
            "personRegistry": normalized["personRegistry"],
            "entityRegistry": normalized["entityRegistry"],
            "termRegistry": normalized["termRegistry"],
            "conflicts": normalized["conflicts"],
        },
        aggregate_source_hash=aggregate_hash,
        readiness_summary=_build_readiness_summary(str(uuid.uuid4()), snapshots),
        created_by=user.id,
    )
    db.add(snapshot)
    db.flush()
    db.refresh(snapshot)

    # Re-build bundles with real snapshot id
    snapshot.readiness_summary = _build_readiness_summary(str(snapshot.id), snapshots)
    db.flush()
    return snapshot


def _build_readiness_summary(
    snapshot_id: str,
    snapshots: dict[str, WorkstreamSnapshot],
) -> dict[str, Any]:
    bundles = build_all_chapter_bundles(snapshot_id, snapshots)
    chapters: dict[str, Any] = {}
    for key, bundle in bundles.items():
        chapters[key] = {
            "connectionStatus": bundle.readiness.connection_status,
            "generationStatus": bundle.readiness.generation_status,
            "canGenerate": bundle.readiness.can_generate,
            "missingCount": bundle.readiness.missing_count,
            "blockerCount": bundle.readiness.blocker_count,
            "placeholderCount": bundle.readiness.placeholder_count,
            "warningCount": bundle.readiness.warning_count,
        }
    return {"chapters": chapters, "chapterCount": len(chapters)}


def get_generation_snapshot(db: Session, user: User, snapshot_id: uuid.UUID) -> DrhpGenerationSnapshot:
    snapshot = db.get(DrhpGenerationSnapshot, snapshot_id)
    if snapshot is None:
        raise AppException(
            status_code=404,
            code=DrhpErrorCode.GENERATION_SNAPSHOT_NOT_FOUND,
            message="Generation snapshot not found.",
        )
    if snapshot.user_id != user.id:
        raise AppException(
            status_code=403,
            code=DrhpErrorCode.GENERATION_SNAPSHOT_FORBIDDEN,
            message="Generation snapshot access denied.",
        )
    return snapshot
