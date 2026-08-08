"""Stable SourceRef helpers for evidence-traceable generation."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.modules.drhp.constants import SourceRefType
from app.modules.drhp.sources.models import EvidenceRef, SourceRef
from app.modules.drhp.workstreams import WorkstreamSnapshot


def stable_ref_id(
    *,
    workstream: str,
    section: str,
    field_path: str,
    record_id: str = "",
) -> str:
    key = f"{workstream}|{section}|{record_id}|{field_path}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    return f"src:{digest}"


def make_source_ref(
    *,
    workstream: str,
    section: str,
    field_path: str,
    label: str,
    value: Any,
    record_id: str = "",
    version: int | None = None,
    source_type: str = SourceRefType.STRUCTURED_USER_INPUT,
) -> SourceRef:
    return SourceRef(
        ref_id=stable_ref_id(
            workstream=workstream,
            section=section,
            field_path=field_path,
            record_id=record_id,
        ),
        workstream_key=workstream,
        section_key=section,
        record_id=record_id,
        field_path=field_path,
        field_label=label,
        source_type=source_type,
        value_preview=_preview(value),
        workspace_version=version,
    )


def make_evidence_ref(
    *,
    source_ref_id: str,
    assertion_id: str | None = None,
    document_id: str | None = None,
    document_version_id: str | None = None,
    page_number: int | None = None,
    evidence_id: str | None = None,
    quote_snapshot: str = "",
    role: str = "",
) -> EvidenceRef:
    ref_id = hashlib.sha256(
        f"{source_ref_id}|{assertion_id}|{evidence_id}|{page_number}".encode()
    ).hexdigest()[:16]
    return EvidenceRef(
        ref_id=f"ev:{ref_id}",
        source_ref_id=source_ref_id,
        document_id=document_id,
        document_version_id=document_version_id,
        page_number=page_number,
        assertion_id=assertion_id,
        evidence_id=evidence_id,
        quote_snapshot=quote_snapshot[:500],
        role=role,
    )


def _preview(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        text = str(value)
        return text[:200] if len(text) > 200 else text
    if isinstance(value, list):
        return f"[{len(value)} items]"
    if isinstance(value, dict):
        return f"{{{len(value)} fields}}"
    return str(value)[:200]


def bundle_source_hash(bundle_payload: dict[str, Any]) -> str:
    encoded = json.dumps(bundle_payload, sort_keys=True, default=str)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def snapshot_from_normalized(
    slug: str,
    normalized: dict[str, Any],
    versions: dict[str, Any],
) -> WorkstreamSnapshot | None:
    payload = (normalized.get("workstreams") or {}).get(slug)
    version_row = versions.get(slug) or {}
    if payload is None:
        return None
    from uuid import UUID

    ws_id = version_row.get("workspaceId")
    return WorkstreamSnapshot(
        slug=slug,
        workspace_id=UUID(str(ws_id)) if ws_id else UUID(int=0),
        version=int(version_row.get("version") or 1),
        schema_version=int(version_row.get("schemaVersion") or 1),
        payload=payload,
        payload_hash=str(version_row.get("payloadHash") or ""),
        last_saved_at=str(version_row.get("lastSavedAt") or ""),
    )


def load_snapshots_from_generation_snapshot(snapshot) -> dict[str, WorkstreamSnapshot]:
    normalized = snapshot.normalized_payload or {}
    versions = snapshot.source_workstream_versions or {}
    from app.modules.drhp.constants import WORKSTREAM_SLUGS

    result: dict[str, WorkstreamSnapshot] = {}
    for slug in WORKSTREAM_SLUGS:
        row = snapshot_from_normalized(slug, normalized, versions)
        if row:
            result[slug] = row
    return result
