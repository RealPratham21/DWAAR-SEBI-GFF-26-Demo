"""Derive requirement applicability from workstream payloads (G6)."""

from __future__ import annotations

from typing import Any

from app.modules.data_room.constants import REQUIREMENT_NOT_APPLICABLE, REQUIREMENT_REVIEW_APPLICABILITY
from app.modules.data_room.requirements_registry import DataRoomRequirementDefinition
from app.modules.drhp.workstreams import WorkstreamSnapshot, load_all_workstreams


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _payload_value(payload: dict[str, Any], *paths: str) -> Any:
    for path in paths:
        node: Any = payload
        for part in path.split("."):
            if not isinstance(node, dict):
                node = None
                break
            node = node.get(part)
        if node not in (None, "", [], {}):
            return node
    return None


def derive_applicability(
    requirement: DataRoomRequirementDefinition,
    snapshots: dict[str, WorkstreamSnapshot],
) -> str | None:
    """Return not_applicable, review_applicability, or None (applicable/default)."""
    key_suffix = requirement.key.split(":", 1)[-1]

    if key_suffix == "ofs-selling-shareholder-support":
        ipo = snapshots.get("ipo-setup-eligibility")
        if ipo:
            ofs = _payload_value(ipo.payload, "offerStructure.ofsShares")
            try:
                if ofs is not None and int(str(ofs).replace(",", "")) <= 0:
                    return REQUIREMENT_NOT_APPLICABLE
            except ValueError:
                pass

    if key_suffix == "acquisition-documents":
        objects = snapshots.get("objects-of-issue")
        if objects:
            objs = _payload_value(objects.payload, "objectsRegisterAndAllocation.objects") or []
            if isinstance(objs, list):
                has_acquisition = any(
                    isinstance(item, dict)
                    and "acquisition" in _clean(item.get("category") or item.get("objectCategory")).lower()
                    for item in objs
                )
                if not has_acquisition:
                    return REQUIREMENT_NOT_APPLICABLE

    if key_suffix == "subsidiary-records":
        group = snapshots.get("group-entities-related-parties")
        if group:
            entities = _payload_value(group.payload, "groupStructureAndEntityMaster.entities") or []
            if isinstance(entities, list):
                has_subsidiary = any(
                    isinstance(item, dict)
                    and _clean(item.get("relationship") or item.get("entityType")).lower()
                    in {"subsidiary", "associate", "joint-venture", "joint venture"}
                    for item in entities
                )
                if not has_subsidiary:
                    return REQUIREMENT_NOT_APPLICABLE

    if requirement.applicability == "conditional":
        return REQUIREMENT_REVIEW_APPLICABILITY

    if requirement.applicability == "professional":
        return REQUIREMENT_REVIEW_APPLICABILITY

    return None


def load_snapshots_for_user(db, user) -> dict[str, WorkstreamSnapshot]:
    return load_all_workstreams(db, user.id)
