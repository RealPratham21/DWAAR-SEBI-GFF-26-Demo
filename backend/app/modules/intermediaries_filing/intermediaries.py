"""Intermediary Master helpers — single canonical intermediary namespace."""

from __future__ import annotations

from typing import Any

from app.modules.intermediaries_filing.constants import LEAD_MANAGER_ROLES


def get_intermediaries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("issueTeamAndIntermediaryMaster") or {}
    return [item for item in (section.get("intermediaries") or []) if isinstance(item, dict)]


def intermediary_ids(payload: dict[str, Any]) -> set[str]:
    return {
        str(item.get("intermediaryId"))
        for item in get_intermediaries(payload)
        if item.get("intermediaryId")
    }


def get_intermediary_by_id(
    payload: dict[str, Any],
    intermediary_id: str,
) -> dict[str, Any] | None:
    if not intermediary_id:
        return None
    for intermediary in get_intermediaries(payload):
        if intermediary.get("intermediaryId") == intermediary_id:
            return intermediary
    return None


def format_intermediary_label(
    intermediary: dict[str, Any] | None,
    fallback_id: str = "",
) -> str:
    if not intermediary:
        if fallback_id:
            return f"Unknown intermediary ({fallback_id[:8]})"
        return "Unknown intermediary"

    display = str(intermediary.get("displayName") or "").strip() or str(
        intermediary.get("legalName") or "",
    ).strip()
    roles = [
        str(role).replace("_", " ")
        for role in (intermediary.get("roles") or [])
        if role
    ]
    parts = [part for part in [display, ", ".join(roles)] if part]
    if parts:
        return " — ".join(parts)
    return str(intermediary.get("intermediaryId") or fallback_id)[:8]


def has_lead_manager_role(intermediary: dict[str, Any] | None) -> bool:
    if not intermediary:
        return False
    return any(role in LEAD_MANAGER_ROLES for role in (intermediary.get("roles") or []))


def get_lead_managers(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [item for item in get_intermediaries(payload) if has_lead_manager_role(item)]
