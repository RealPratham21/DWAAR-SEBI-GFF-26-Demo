"""Attach cross-workstream conflicts to global facts (G5)."""

from __future__ import annotations

from app.modules.drhp.generation.snapshot_service import _detect_global_conflicts
from app.modules.drhp.workstreams import WorkstreamSnapshot
from app.modules.facts_evidence.schemas import RawGlobalFact


def attach_conflicts(facts: list[RawGlobalFact], snapshots: dict[str, WorkstreamSnapshot]) -> None:
    conflicts = _detect_global_conflicts(snapshots)
    if not conflicts:
        return

    for conflict in conflicts:
        field_path = str(conflict.get("field_path") or conflict.get("fieldPath") or "")
        auth_ws = str(conflict.get("authoritative_workstream") or conflict.get("authoritativeWorkstream") or "")
        conflict_ws = str(conflict.get("conflicting_workstream") or conflict.get("conflictingWorkstream") or "")
        auth_value = conflict.get("authoritative_value") or conflict.get("authoritativeValue")
        conflict_value = conflict.get("conflicting_value") or conflict.get("conflictingValue")

        for fact in facts:
            if fact.canonical_workstream_key != auth_ws:
                continue
            if "freshIssueShares" in field_path and "freshIssue" in fact.field_path.lower():
                fact.conflicting_source = {
                    "workstreamKey": conflict_ws,
                    "fieldPath": field_path,
                    "value": conflict_value,
                    "label": f"Fresh Issue shares — {conflict_ws}",
                }
                fact.support_state = "conflicting_source"
            elif field_path and field_path.split(".")[-1] in fact.field_path:
                fact.conflicting_source = {
                    "workstreamKey": conflict_ws,
                    "fieldPath": field_path,
                    "value": conflict_value,
                }
                fact.support_state = "conflicting_source"
