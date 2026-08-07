"""Ownership chain and effective indirect interest helpers."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.modules.group_entities_related_parties import decimal_utils as dm
from app.modules.group_entities_related_parties.entities import format_entity_label, get_entities


def derive_ownership_chain_summary(payload: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    entities = get_entities(payload)
    issuer = next(
        (entity for entity in entities if "parent" in (entity.get("classificationBadges") or [])),
        entities[0] if entities else None,
    )
    if issuer is None:
        return lines

    issuer_id = str(issuer.get("id") or "")
    ownership = payload.get("ownershipControlAndRelationshipMapping") or {}
    relationships = [
        rel
        for rel in (ownership.get("ownershipRelationships") or [])
        if isinstance(rel, dict) and rel.get("currentHistorical") != "historical"
    ]

    for rel in relationships:
        parent_id = str(rel.get("parentPartyEntityId") or "")
        child_id = str(rel.get("investeeEntityId") or "")
        if child_id != issuer_id and parent_id != issuer_id:
            continue
        parent = next((e for e in entities if e.get("id") == parent_id), None)
        child = next((e for e in entities if e.get("id") == child_id), None)
        parent_name = format_entity_label(parent, parent_id)
        child_name = format_entity_label(child, child_id)
        relationship_type = str(rel.get("relationshipType") or "relationship")
        lines.append(f"{parent_name} → {child_name} ({relationship_type})")

    return lines[:12]


def _direct_percent(relationship: dict[str, Any]) -> Decimal | None:
    for field in (
        "effectiveIndirectInterestPercent",
        "equityOwnershipPercent",
        "votingRightsPercent",
        "economicInterestPercent",
    ):
        parsed = dm.parse_decimal(str(relationship.get(field) or ""))
        if parsed is not None:
            return parsed
    return None


def compute_effective_indirect_interest(
    payload: dict[str, Any],
    *,
    parent_entity_id: str,
    investee_entity_id: str,
) -> str:
    """Compute effective indirect interest where an explicit ownership path exists."""
    if not parent_entity_id or not investee_entity_id or parent_entity_id == investee_entity_id:
        return ""

    ownership = payload.get("ownershipControlAndRelationshipMapping") or {}
    relationships = [
        rel
        for rel in (ownership.get("ownershipRelationships") or [])
        if isinstance(rel, dict) and rel.get("currentHistorical") != "historical"
    ]

    adjacency: dict[str, list[tuple[str, Decimal]]] = {}
    for rel in relationships:
        parent_id = str(rel.get("parentPartyEntityId") or "")
        child_id = str(rel.get("investeeEntityId") or "")
        percent = _direct_percent(rel)
        if not parent_id or not child_id or percent is None:
            continue
        adjacency.setdefault(parent_id, []).append((child_id, percent))

    memo: dict[tuple[str, str], Decimal | None] = {}

    def walk(current: str, target: str, visited: set[str]) -> Decimal | None:
        key = (current, target)
        if key in memo:
            return memo[key]
        if current == target:
            return Decimal("100")
        if current in visited:
            return None
        visited.add(current)
        total = Decimal("0")
        found = False
        for child, percent in adjacency.get(current, []):
            child_total = walk(child, target, visited)
            if child_total is None:
                continue
            found = True
            total += (percent * child_total) / Decimal("100")
        visited.remove(current)
        memo[key] = total if found else None
        return memo[key]

    result = walk(parent_entity_id, investee_entity_id, set())
    if result is None:
        return ""
    return dm.to_decimal_string(result)


def summarize_ownership_paths(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Return ownership path summaries for issuer-linked relationships."""
    entities = get_entities(payload)
    issuer = next(
        (entity for entity in entities if "parent" in (entity.get("classificationBadges") or [])),
        entities[0] if entities else None,
    )
    if issuer is None:
        return []

    issuer_id = str(issuer.get("id") or "")
    ownership = payload.get("ownershipControlAndRelationshipMapping") or {}
    summaries: list[dict[str, Any]] = []
    for rel in ownership.get("ownershipRelationships") or []:
        if not isinstance(rel, dict):
            continue
        if rel.get("currentHistorical") == "historical":
            continue
        parent_id = str(rel.get("parentPartyEntityId") or "")
        child_id = str(rel.get("investeeEntityId") or "")
        if child_id != issuer_id and parent_id != issuer_id:
            continue
        explicit = str(rel.get("effectiveIndirectInterestPercent") or "")
        computed = compute_effective_indirect_interest(
            payload,
            parent_entity_id=parent_id,
            investee_entity_id=child_id,
        )
        summaries.append(
            {
                "relationshipId": str(rel.get("id") or ""),
                "parentEntityId": parent_id,
                "investeeEntityId": child_id,
                "relationshipType": str(rel.get("relationshipType") or ""),
                "explicitEffectiveIndirectPercent": explicit,
                "derivedEffectiveIndirectPercent": computed or explicit,
            }
        )
    return summaries
