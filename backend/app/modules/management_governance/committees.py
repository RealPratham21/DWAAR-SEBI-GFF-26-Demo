"""Committee validation helpers — ports frontend committees.ts."""

from __future__ import annotations

from typing import Any

from app.modules.management_governance.directors import get_director_by_id


def validate_committee_member_refs(
    payload: dict[str, Any],
    committee_id: str,
) -> dict[str, Any]:
    committees_section = payload.get("boardCommitteesAndGovernanceBodies") or {}
    committee = next(
        (
            c
            for c in (committees_section.get("committees") or [])
            if isinstance(c, dict) and c.get("id") == committee_id
        ),
        None,
    )
    if committee is None:
        return {"valid": True, "invalidDirectorIds": [], "messages": []}

    invalid_director_ids: list[str] = []
    messages: list[str] = []

    chair_id = str(committee.get("chairpersonDirectorId") or "").strip()
    if chair_id and get_director_by_id(payload, chair_id) is None:
        invalid_director_ids.append(chair_id)
        messages.append("Chairperson references a director that does not exist.")

    for member in committee.get("members") or []:
        if not isinstance(member, dict):
            continue
        member_id = str(member.get("directorId") or "").strip()
        if not member_id:
            continue
        if get_director_by_id(payload, member_id) is None:
            invalid_director_ids.append(member_id)
            messages.append(f"Member references missing director ID: {member_id}")

    unique_ids = list(dict.fromkeys(invalid_director_ids))
    return {
        "valid": len(unique_ids) == 0,
        "invalidDirectorIds": unique_ids,
        "messages": messages,
    }


def validate_committee_deletion(
    _payload: dict[str, Any],
    _committee_id: str,
) -> dict[str, Any]:
    return {"canDelete": True, "dependencies": []}
