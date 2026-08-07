"""Conflicting source logic for Industry & Market."""

from __future__ import annotations

from typing import Any

from app.modules.industry_market import decimal_utils as dm
from app.modules.industry_market.sources import get_source_by_id


def get_conflicting_research_records(payload: dict[str, Any]) -> list[dict[str, Any]]:
    outlook = payload.get("outlookIndustryRisksAndConfirmations") or {}
    return [
        r for r in (outlook.get("conflictingResearch") or []) if isinstance(r, dict)
    ]


def get_unreconciled_conflicts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        conflict
        for conflict in get_conflicting_research_records(payload)
        if conflict.get("reconciled") != "yes"
    ]


def evaluate_conflict_record(
    conflict: dict[str, Any],
    payload: dict[str, Any],
) -> dict[str, Any]:
    source_a_id = str(conflict.get("sourceAId") or "").strip()
    source_b_id = str(conflict.get("sourceBId") or "").strip()
    flags: list[str] = []

    if not source_a_id or not source_b_id:
        flags.append("Both conflicting sources must be identified.")
    if source_a_id == source_b_id and source_a_id:
        flags.append("Conflicting sources must be distinct.")

    source_a = get_source_by_id(payload, source_a_id)
    source_b = get_source_by_id(payload, source_b_id)
    if source_a_id and source_a is None:
        flags.append("Source A is not in the registry.")
    if source_b_id and source_b is None:
        flags.append("Source B is not in the registry.")

    preferred_id = str(conflict.get("preferredSourceId") or "").strip()
    if preferred_id and preferred_id not in {source_a_id, source_b_id}:
        flags.append("Preferred source must be one of the conflicting sources.")

    value_a = str(conflict.get("valueFromA") or "")
    value_b = str(conflict.get("valueFromB") or "")
    values_differ = (
        dm.is_filled(value_a)
        and dm.is_filled(value_b)
        and dm.differs_beyond(value_a, value_b, "0")
    )

    reconciled = conflict.get("reconciled") == "yes"
    state = "reconciled" if reconciled else "conflicting"
    if not source_a_id or not source_b_id:
        state = "incomplete"
    elif reconciled:
        state = "reconciled"
    elif values_differ:
        state = "conflicting"

    return {
        "conflictId": conflict.get("id"),
        "topic": conflict.get("topic") or conflict.get("id"),
        "state": state,
        "valuesDiffer": values_differ,
        "reconciled": reconciled,
        "flags": flags,
    }


def evaluate_all_conflicts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [evaluate_conflict_record(conflict, payload) for conflict in get_conflicting_research_records(payload)]
