"""Entity Master helpers — single canonical entity namespace."""

from __future__ import annotations

from typing import Any


def get_entities(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("groupStructureAndEntityMaster") or {}
    return [e for e in (section.get("entities") or []) if isinstance(e, dict)]


def get_entity_by_id(payload: dict[str, Any], entity_id: str) -> dict[str, Any] | None:
    if not entity_id:
        return None
    for entity in get_entities(payload):
        if entity.get("id") == entity_id:
            return entity
    return None


def format_entity_label(entity: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not entity:
        if fallback_id:
            return f"Unknown entity ({fallback_id[:8]})"
        return "Unknown entity"
    identity = entity.get("identity") or {}
    name = (
        str(identity.get("displayName") or "").strip()
        or str(identity.get("legalName") or "").strip()
        or str(identity.get("formerName") or "").strip()
    )
    entity_id = str(entity.get("id") or "")
    return name or entity_id[:8]


def count_entities_by_badge(payload: dict[str, Any], badge: str) -> int:
    return sum(
        1
        for entity in get_entities(payload)
        if entity.get("currentlyActive") and badge in (entity.get("classificationBadges") or [])
    )


def count_active_entities(payload: dict[str, Any]) -> int:
    return sum(1 for entity in get_entities(payload) if entity.get("currentlyActive"))


def is_company_entity_type(entity_type: str) -> bool:
    return entity_type in ("indian-company", "foreign-body-corporate")


def is_llp_entity_type(entity_type: str) -> bool:
    return entity_type == "llp"


def is_listed_entity(entity: dict[str, Any]) -> bool:
    listing = entity.get("listing") or {}
    return listing.get("listedStatus") == "listed"


def entity_ids(payload: dict[str, Any]) -> set[str]:
    return {str(e.get("id")) for e in get_entities(payload) if e.get("id")}
