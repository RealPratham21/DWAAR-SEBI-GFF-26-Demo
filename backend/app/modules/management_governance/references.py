"""Cross-payload reference counting — ports frontend references.ts."""

from __future__ import annotations

from typing import Any


def _push_count(
    counts: dict[str, dict[str, Any]],
    ref_id: str,
    location: str,
) -> None:
    if not ref_id.strip():
        return
    entry = counts.setdefault(ref_id, {"total": 0, "locations": []})
    entry["total"] += 1
    entry["locations"].append(location)


def count_director_references(payload: dict[str, Any], director_id: str) -> dict[str, Any]:
    counts: dict[str, dict[str, Any]] = {}
    board = payload.get("boardStructureAndIpoGovernanceReadiness") or {}
    leadership = board.get("leadership") or {}

    if leadership.get("chairmanDirectorId") == director_id:
        _push_count(counts, director_id, "Board leadership — Chairman")
    if leadership.get("managingDirectorDirectorId") == director_id:
        _push_count(counts, director_id, "Board leadership — Managing Director")
    if leadership.get("ceoDirectorId") == director_id:
        _push_count(counts, director_id, "Board leadership — CEO")
    if leadership.get("managerDirectorId") == director_id:
        _push_count(counts, director_id, "Board leadership — Manager")
    if leadership.get("leadIndependentDirectorId") == director_id:
        _push_count(counts, director_id, "Board leadership — Lead Independent Director")
    for wtd_id in leadership.get("wholeTimeDirectorIds") or []:
        if wtd_id == director_id:
            _push_count(counts, director_id, "Board leadership — Whole-Time Director")

    ipo_committee = board.get("ipoCommittee") or {}
    if ipo_committee.get("chairpersonDirectorId") == director_id:
        _push_count(counts, director_id, "IPO Committee — Chairperson")
    for member_id in ipo_committee.get("memberDirectorIds") or []:
        if member_id == director_id:
            _push_count(counts, director_id, "IPO Committee — Member")

    committees_section = payload.get("boardCommitteesAndGovernanceBodies") or {}
    for committee in committees_section.get("committees") or []:
        if not isinstance(committee, dict):
            continue
        label = committee.get("name") or committee.get("committeeType") or "Committee"
        if committee.get("chairpersonDirectorId") == director_id:
            _push_count(counts, director_id, f"Committee — {label} chair")
        for member in committee.get("members") or []:
            if isinstance(member, dict) and member.get("directorId") == director_id:
                _push_count(counts, director_id, f"Committee — {label} member")

    remuneration = payload.get("remunerationServiceContractsEsopsAndBenefits") or {}
    for row in remuneration.get("directorRemuneration") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            _push_count(counts, director_id, "Director remuneration")
    for row in remuneration.get("executiveAppointmentTerms") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            _push_count(counts, director_id, "Executive appointment terms")

    interests = payload.get("interestsConflictsAndManagementRelationships") or {}
    for row in interests.get("directorOfferDocumentInterests") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            _push_count(counts, director_id, "Offer-document interests")

    changes = payload.get("changesContinuityAndSuccession") or {}
    for row in changes.get("boardChanges") or []:
        if isinstance(row, dict) and row.get("directorId") == director_id:
            _push_count(counts, director_id, "Board change record")

    entry = counts.get(director_id)
    return {
        "directorId": director_id,
        "total": entry["total"] if entry else 0,
        "locations": entry["locations"] if entry else [],
    }


def count_person_references(payload: dict[str, Any], person_id: str) -> dict[str, Any]:
    counts: dict[str, dict[str, Any]] = {}
    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}

    for node in kmp_section.get("organisationStructure") or []:
        if not isinstance(node, dict):
            continue
        if node.get("personId") == person_id:
            _push_count(counts, person_id, "Organisation structure node")
        if node.get("reportsToPersonId") == person_id:
            _push_count(counts, person_id, "Organisation structure — reports-to")
        for report_id in node.get("directReports") or []:
            if report_id == person_id:
                _push_count(counts, person_id, "Organisation structure — direct report")

    for kmp in kmp_section.get("kmpSmpRecords") or []:
        if not isinstance(kmp, dict):
            continue
        if kmp.get("id") == person_id:
            _push_count(counts, person_id, "KMP/SMP record")
        if kmp.get("reportsToPersonId") == person_id:
            _push_count(counts, person_id, "KMP/SMP — reports-to")

    remuneration = payload.get("remunerationServiceContractsEsopsAndBenefits") or {}
    for row in remuneration.get("kmpSmpRemuneration") or []:
        if isinstance(row, dict) and row.get("personId") == person_id:
            _push_count(counts, person_id, "KMP/SMP remuneration")
    for row in remuneration.get("incentiveArrangements") or []:
        if isinstance(row, dict) and row.get("participantPersonId") == person_id:
            _push_count(counts, person_id, "Incentive arrangement")
    for row in remuneration.get("serviceContractsAndBenefits") or []:
        if isinstance(row, dict) and row.get("personId") == person_id:
            _push_count(counts, person_id, "Service contract / benefits")

    interests = payload.get("interestsConflictsAndManagementRelationships") or {}
    for field, label in (
        ("interestsInIssuer", "Interest in issuer"),
        ("outsideInterests", "Outside interest"),
        ("appointmentArrangements", "Appointment arrangement"),
        ("financialArrangements", "Financial arrangement"),
    ):
        for row in interests.get(field) or []:
            if isinstance(row, dict) and row.get("personId") == person_id:
                _push_count(counts, person_id, label)

    changes = payload.get("changesContinuityAndSuccession") or {}
    for row in changes.get("kmpSmpChanges") or []:
        if isinstance(row, dict) and row.get("personId") == person_id:
            _push_count(counts, person_id, "KMP/SMP change record")
    for row in changes.get("keyPersonDependencies") or []:
        if isinstance(row, dict) and row.get("personId") == person_id:
            _push_count(counts, person_id, "Key-person dependency")

    for rel in kmp_section.get("familyRelationships") or []:
        if not isinstance(rel, dict):
            continue
        if rel.get("personOneId") == person_id or rel.get("personTwoId") == person_id:
            _push_count(counts, person_id, "Family relationship")

    entry = counts.get(person_id)
    return {
        "personId": person_id,
        "total": entry["total"] if entry else 0,
        "locations": entry["locations"] if entry else [],
    }


def count_all_director_references(payload: dict[str, Any]) -> list[dict[str, Any]]:
    director_ids = {d.get("id") for d in get_directors_from_payload(payload) if d.get("id")}
    return [count_director_references(payload, director_id) for director_id in director_ids]


def count_all_person_references(payload: dict[str, Any]) -> list[dict[str, Any]]:
    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    person_ids = {
        k.get("id")
        for k in (kmp_section.get("kmpSmpRecords") or [])
        if isinstance(k, dict) and k.get("id")
    }
    return [count_person_references(payload, person_id) for person_id in person_ids]


def get_directors_from_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("directorsProfilesAppointmentsAndEligibility") or {}
    return [d for d in (section.get("directors") or []) if isinstance(d, dict)]
