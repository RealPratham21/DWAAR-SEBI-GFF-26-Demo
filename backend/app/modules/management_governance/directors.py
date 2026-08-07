"""Director master helpers — ports frontend directors.ts."""

from __future__ import annotations

from typing import Any


def get_directors(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("directorsProfilesAppointmentsAndEligibility") or {}
    directors = section.get("directors") or []
    return [d for d in directors if isinstance(d, dict)]


def get_director_by_id(payload: dict[str, Any], director_id: str) -> dict[str, Any] | None:
    for director in get_directors(payload):
        if director.get("id") == director_id:
            return director
    return None


def _is_current_director(director: dict[str, Any]) -> bool:
    status = director.get("appointmentStatus") or ""
    return status in ("current", "")


def _is_independent_director(director: dict[str, Any]) -> bool:
    return (
        director.get("designation") == "independent-director"
        or director.get("independentStatus") == "yes"
    )


def _is_woman_director(director: dict[str, Any]) -> bool:
    return director.get("gender") == "female"


def _is_resident_director(director: dict[str, Any]) -> bool:
    residence = str(director.get("countryOfResidence") or "").strip().lower()
    return residence in ("india", "in")


def count_by_category(payload: dict[str, Any]) -> dict[str, int]:
    directors = get_directors(payload)
    current_directors = [d for d in directors if _is_current_director(d)]

    return {
        "total": len(directors),
        "current": len(current_directors),
        "proposed": len(
            [
                d
                for d in directors
                if str(d.get("appointmentStatus") or "").startswith("proposed")
            ]
        ),
        "executive": len(
            [d for d in current_directors if d.get("executiveNonExecutive") == "executive"]
        ),
        "nonExecutive": len(
            [d for d in current_directors if d.get("executiveNonExecutive") == "non-executive"]
        ),
        "independent": len([d for d in current_directors if _is_independent_director(d)]),
        "nominee": len(
            [
                d
                for d in current_directors
                if d.get("designation") == "nominee-director" or d.get("nomineeStatus") == "yes"
            ]
        ),
        "promoter": len(
            [d for d in current_directors if d.get("promoterStatus") == "yes"]
        ),
        "women": len([d for d in current_directors if _is_woman_director(d)]),
        "resident": len([d for d in current_directors if _is_resident_director(d)]),
    }


def compute_directorship_counts(director: dict[str, Any]) -> dict[str, int]:
    current = [
        d
        for d in (director.get("otherDirectorships") or [])
        if isinstance(d, dict) and d.get("currentOrCeased") == "current"
    ]
    return {
        "totalCurrent": len(current),
        "currentPublicCompany": len(
            [
                d
                for d in current
                if d.get("entityListingStatus") in ("public-listed", "public-unlisted")
            ]
        ),
    }


def validate_director_deletion(payload: dict[str, Any], director_id: str) -> dict[str, Any]:
    dependencies: list[str] = []
    board = payload.get("boardStructureAndIpoGovernanceReadiness") or {}
    leadership = board.get("leadership") or {}

    if leadership.get("chairmanDirectorId") == director_id:
        dependencies.append("Board leadership — Chairman")
    if leadership.get("managingDirectorDirectorId") == director_id:
        dependencies.append("Board leadership — Managing Director")
    if leadership.get("ceoDirectorId") == director_id:
        dependencies.append("Board leadership — CEO")
    if leadership.get("leadIndependentDirectorId") == director_id:
        dependencies.append("Board leadership — Lead Independent Director")
    if director_id in (leadership.get("wholeTimeDirectorIds") or []):
        dependencies.append("Board leadership — Whole-Time Director")

    ipo_committee = board.get("ipoCommittee") or {}
    if ipo_committee.get("chairpersonDirectorId") == director_id:
        dependencies.append("IPO Committee — Chairperson")
    if director_id in (ipo_committee.get("memberDirectorIds") or []):
        dependencies.append("IPO Committee — Member")

    committees_section = payload.get("boardCommitteesAndGovernanceBodies") or {}
    for committee in committees_section.get("committees") or []:
        if not isinstance(committee, dict):
            continue
        label = committee.get("name") or committee.get("committeeType") or "Committee"
        if committee.get("chairpersonDirectorId") == director_id:
            dependencies.append(f'Committee "{label}" — Chairperson')
        for member in committee.get("members") or []:
            if isinstance(member, dict) and member.get("directorId") == director_id:
                dependencies.append(f'Committee "{label}" — Member')

    remuneration = payload.get("remunerationServiceContractsEsopsAndBenefits") or {}
    for row in remuneration.get("directorRemuneration") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            dependencies.append("Director remuneration record")
    for row in remuneration.get("executiveAppointmentTerms") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            dependencies.append("Executive appointment terms")

    interests = payload.get("interestsConflictsAndManagementRelationships") or {}
    for row in interests.get("directorOfferDocumentInterests") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            dependencies.append("Director offer-document interests")

    changes = payload.get("changesContinuityAndSuccession") or {}
    for row in changes.get("boardChanges") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            dependencies.append("Board change record")

    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    if any(
        isinstance(k, dict) and k.get("linkedDirectorId") == director_id
        for k in kmp_section.get("kmpSmpRecords") or []
    ):
        dependencies.append("Linked KMP/SMP record")

    unique = list(dict.fromkeys(dependencies))
    return {"canDelete": len(unique) == 0, "dependencies": unique}
