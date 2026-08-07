"""Section completion for Management & Governance — ports frontend progress.ts."""

from __future__ import annotations

from typing import Any

from app.modules.management_governance.constants import MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return len(value.strip()) > 0
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def evaluate_board_structure_status(payload: dict[str, Any]) -> str:
    section = payload.get("boardStructureAndIpoGovernanceReadiness") or {}
    snapshot = section.get("boardSnapshot") or {}
    leadership = section.get("leadership") or {}
    readiness = section.get("governanceReadiness") or {}
    core = [
        _filled(snapshot.get("asOfDate")),
        _filled(snapshot.get("companyStatus")),
        _filled(leadership.get("chairmanDirectorId"))
        or _filled(leadership.get("managingDirectorDirectorId")),
        _filled(readiness.get("publicCompanyConversion")),
        _filled(readiness.get("independentDirectorAppointments")),
        _filled(readiness.get("womanDirectorAppointment")),
    ]
    answered = sum(1 for item in core if item)
    readiness_complete = any(
        isinstance(v, str) and v.strip() for v in readiness.values()
    )
    return _status_from(answered, len(core), readiness_complete)


def evaluate_directors_status(payload: dict[str, Any]) -> str:
    section = payload.get("directorsProfilesAppointmentsAndEligibility") or {}
    directors = [d for d in (section.get("directors") or []) if isinstance(d, dict)]
    core = [len(directors) > 0]
    answered = sum(1 for item in core if item)
    directors_complete = all(
        _filled(d.get("fullLegalName"))
        and _filled(d.get("designation"))
        and _filled(d.get("appointmentStatus"))
        for d in directors
    )
    eligibility_complete = all(
        _filled((d.get("eligibility") or {}).get("dinActive"))
        and (
            d.get("designation") != "independent-director"
            or _filled((d.get("independentDirectorDetails") or {}).get(
                "independenceDeclarationReceived"
            ))
        )
        for d in directors
    )
    return _status_from(answered, len(core), directors_complete and eligibility_complete)


def evaluate_kmp_status(payload: dict[str, Any]) -> str:
    section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    readiness = section.get("kmpRoleReadiness") or {}
    core = [
        len([k for k in (section.get("kmpSmpRecords") or []) if isinstance(k, dict)]) > 0,
        _filled(readiness.get("cfo")) or _filled(readiness.get("companySecretary")),
        len([n for n in (section.get("organisationStructure") or []) if isinstance(n, dict)]) > 0,
    ]
    answered = sum(1 for item in core if item)
    kmp_complete = all(
        _filled(k.get("fullName"))
        and _filled(k.get("classification"))
        and _filled(k.get("designation"))
        for k in (section.get("kmpSmpRecords") or [])
        if isinstance(k, dict)
    )
    readiness_complete = all(
        _filled(readiness.get(key))
        for key in ("mdCeoManagerWtd", "cfo", "companySecretary")
    )
    return _status_from(answered, len(core), kmp_complete and readiness_complete)


def evaluate_committees_status(payload: dict[str, Any]) -> str:
    section = payload.get("boardCommitteesAndGovernanceBodies") or {}
    committees = [c for c in (section.get("committees") or []) if isinstance(c, dict)]
    core = [len(committees) > 0]
    answered = sum(1 for item in core if item)
    committees_complete = all(
        _filled(c.get("committeeType"))
        and _filled(c.get("applicability"))
        and len(c.get("members") or []) > 0
        for c in committees
    )
    return _status_from(answered, len(core), committees_complete)


def evaluate_remuneration_status(payload: dict[str, Any]) -> str:
    section = payload.get("remunerationServiceContractsEsopsAndBenefits") or {}
    esop = section.get("esopGovernance") or {}
    core = [
        len(section.get("directorRemuneration") or []) > 0
        or len(section.get("kmpSmpRemuneration") or []) > 0
        or _filled(esop.get("esopSchemeExists")),
        len(section.get("executiveAppointmentTerms") or []) > 0
        or len(section.get("incentiveArrangements") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    remuneration_complete = all(
        _filled(r.get("directorId")) and _filled(r.get("financialYear"))
        for r in (section.get("directorRemuneration") or [])
        if isinstance(r, dict)
    )
    return _status_from(answered, len(core), remuneration_complete)


def evaluate_interests_status(payload: dict[str, Any]) -> str:
    section = payload.get("interestsConflictsAndManagementRelationships") or {}
    core = [
        len(section.get("interestsInIssuer") or []) > 0
        or len(section.get("outsideInterests") or []) > 0
        or len(section.get("appointmentArrangements") or []) > 0,
        len(section.get("directorOfferDocumentInterests") or []) > 0
        or len(section.get("financialArrangements") or []) > 0,
    ]
    answered = sum(1 for item in core if item)
    return _status_from(answered, len(core), answered == len(core))


def evaluate_continuity_status(payload: dict[str, Any]) -> str:
    section = payload.get("changesContinuityAndSuccession") or {}
    succession = section.get("successionReadiness") or {}
    core = [
        len(section.get("boardChanges") or []) > 0
        or len(section.get("kmpSmpChanges") or []) > 0,
        _filled(succession.get("formalSuccessionPlan")),
        len(section.get("keyPersonDependencies") or []) > 0
        or _filled(succession.get("criticalRolesIdentified")),
    ]
    answered = sum(1 for item in core if item)
    changes_complete = all(
        _filled(c.get("directorId"))
        and _filled(c.get("event"))
        and _filled(c.get("effectiveDate"))
        for c in (section.get("boardChanges") or [])
        if isinstance(c, dict)
    )
    return _status_from(answered, len(core), changes_complete)


def evaluate_governance_policies_status(payload: dict[str, Any]) -> str:
    section = payload.get("governancePoliciesRptOversightAndConfirmations") or {}
    confirmations = section.get("confirmations") or {}
    confirmations_checked = sum(
        1 for key, _ in MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS if confirmations.get(key)
    )
    core = [
        len(section.get("governancePolicies") or []) > 0,
        _filled((section.get("rptGovernance") or {}).get("regulation23ApplicabilityStatus")),
        _filled((section.get("boardProcessReadiness") or {}).get("boardMeetingCalendar")),
        confirmations_checked > 0,
    ]
    answered = sum(1 for item in core if item)
    policies_complete = all(
        _filled(p.get("policyType")) and _filled(p.get("adoptedStatus"))
        for p in (section.get("governancePolicies") or [])
        if isinstance(p, dict)
    )
    confirmations_complete = confirmations_checked == len(MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS)
    return _status_from(answered, len(core), policies_complete and confirmations_complete)


def calculate_management_governance_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {
        "board-structure-and-ipo-governance-readiness": evaluate_board_structure_status(payload),
        "directors-profiles-appointments-and-eligibility": evaluate_directors_status(payload),
        "kmp-senior-management-and-organisation-structure": evaluate_kmp_status(payload),
        "board-committees-and-governance-bodies": evaluate_committees_status(payload),
        "remuneration-service-contracts-esops-and-benefits": evaluate_remuneration_status(payload),
        "interests-conflicts-and-management-relationships": evaluate_interests_status(payload),
        "changes-continuity-and-succession": evaluate_continuity_status(payload),
        "governance-policies-rpt-oversight-and-confirmations": evaluate_governance_policies_status(
            payload
        ),
    }
    statuses = list(sections.values())
    sections_complete = sum(1 for status in statuses if status == "complete")
    total_sections = len(statuses)
    if sections_complete == total_sections:
        overall_status = "complete"
    elif any(status != "not_started" for status in statuses):
        overall_status = "in_progress"
    else:
        overall_status = "not_started"

    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
