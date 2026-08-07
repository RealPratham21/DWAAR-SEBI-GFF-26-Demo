"""Draft-tolerant section validation for Management & Governance."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.management_governance.committees import validate_committee_member_refs
from app.modules.management_governance.constants import (
    APPOINTMENT_STATUS,
    BOARD_CHANGE_EVENT,
    CHAIRMAN_CLASSIFICATION,
    COMMITTEE_APPLICABILITY,
    COMMITTEE_MEMBER_ROLE,
    COMMITTEE_TYPE,
    COMPANY_STATUS,
    CURRENT_OR_CEASED,
    DIRECTOR_DESIGNATION,
    EMPLOYMENT_TYPE,
    ENTITY_LISTING_STATUS,
    EXECUTIVE_NON_EXECUTIVE,
    FAMILY_RELATIONSHIP_TYPE,
    GENDER,
    GOVERNANCE_POLICY_TYPE,
    GOVERNANCE_READINESS_STATUS,
    INTEREST_PERSON_TYPE,
    KMP_CLASSIFICATION,
    PERSON_STATUS,
    PERSON_TYPE,
    POLICY_ADOPTED_STATUS,
    SOURCE_STATUS,
    YES_NO_NOT_SURE,
)
from app.modules.management_governance.directors import (
    get_directors,
    validate_director_deletion,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    if value is None:
        errors[field] = "Invalid value."
        return
    text = str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_bool(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None:
        return
    if not isinstance(value, bool):
        errors[field] = "Must be true or false."


def _check_unique_ids(errors: dict[str, str], field: str, items: list[Any]) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            errors[f"{field}[{index}].id"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].id"] = "Duplicate id within this collection."
        seen.add(item_id)


def _director_ids(payload: dict[str, Any]) -> set[str]:
    return {str(d.get("id")) for d in get_directors(payload) if d.get("id")}


def _person_ids(payload: dict[str, Any]) -> set[str]:
    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    return {
        str(k.get("id"))
        for k in (kmp_section.get("kmpSmpRecords") or [])
        if isinstance(k, dict) and k.get("id")
    }


def _optional_director_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a director that does not exist."


def _optional_person_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a person that does not exist."


def _validate_director_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_directors: list[Any] | None,
) -> None:
    old_ids = _director_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_directors or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["directorsProfilesAppointmentsAndEligibility"] = {
        **(full_payload.get("directorsProfilesAppointmentsAndEligibility") or {}),
        "directors": new_directors or [],
    }
    for removed_id in old_ids - new_ids:
        validation = validate_director_deletion(merged, removed_id)
        if not validation["canDelete"]:
            deps = ", ".join(validation["dependencies"])
            errors["directors"] = f"Cannot remove director referenced elsewhere: {deps}"


def _validate_nested_ynns_object(
    errors: dict[str, str],
    prefix: str,
    obj: dict[str, Any] | None,
    fields: tuple[str, ...],
) -> None:
    if not isinstance(obj, dict):
        errors[prefix] = "Must be an object."
        return
    for field in fields:
        _ynns(errors, f"{prefix}.{field}", obj.get(field, ""))


def validate_board_structure_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    director_ids = _director_ids(full_payload)

    snapshot = data.get("boardSnapshot") or {}
    if isinstance(snapshot, dict):
        _require_enum(errors, "boardSnapshot.companyStatus", snapshot.get("companyStatus", ""), COMPANY_STATUS)

    leadership = data.get("leadership") or {}
    if isinstance(leadership, dict):
        _require_enum(
            errors,
            "leadership.chairmanClassification",
            leadership.get("chairmanClassification", ""),
            CHAIRMAN_CLASSIFICATION,
        )
        _ynns(errors, "leadership.chairmanAndMdRolesCombined", leadership.get("chairmanAndMdRolesCombined", ""))
        for field in (
            "chairmanDirectorId",
            "managingDirectorDirectorId",
            "ceoDirectorId",
            "managerDirectorId",
            "leadIndependentDirectorId",
        ):
            _optional_director_ref(errors, f"leadership.{field}", leadership.get(field), director_ids)
        for index, director_id in enumerate(leadership.get("wholeTimeDirectorIds") or []):
            _optional_director_ref(
                errors,
                f"leadership.wholeTimeDirectorIds[{index}]",
                director_id,
                director_ids,
            )

    readiness = data.get("governanceReadiness") or {}
    if isinstance(readiness, dict):
        for field in readiness:
            if field != "notes" and isinstance(readiness.get(field), str):
                _require_enum(
                    errors,
                    f"governanceReadiness.{field}",
                    readiness.get(field, ""),
                    GOVERNANCE_READINESS_STATUS,
                )

    ipo_committee = data.get("ipoCommittee") or {}
    if isinstance(ipo_committee, dict):
        _ynns(errors, "ipoCommittee.constituted", ipo_committee.get("constituted", ""))
        _optional_director_ref(
            errors,
            "ipoCommittee.chairpersonDirectorId",
            ipo_committee.get("chairpersonDirectorId"),
            director_ids,
        )
        for index, director_id in enumerate(ipo_committee.get("memberDirectorIds") or []):
            _optional_director_ref(
                errors,
                f"ipoCommittee.memberDirectorIds[{index}]",
                director_id,
                director_ids,
            )

    price_band = data.get("independentDirectorPriceBandProcess") or {}
    if isinstance(price_band, dict):
        _require_enum(
            errors,
            "independentDirectorPriceBandProcess.requiredApplicabilityStatus",
            price_band.get("requiredApplicabilityStatus", ""),
            COMMITTEE_APPLICABILITY,
        )
        _ynns(errors, "independentDirectorPriceBandProcess.committeeConstituted", price_band.get("committeeConstituted", ""))

    if errors:
        raise ValidationError(errors)


def validate_directors_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    directors = data.get("directors") or []
    _check_unique_ids(errors, "directors", directors)
    _validate_director_deletions(errors, full_payload, directors)

    for index, director in enumerate(directors):
        if not isinstance(director, dict):
            continue
        prefix = f"directors[{index}]"
        _require_enum(errors, f"{prefix}.designation", director.get("designation", ""), DIRECTOR_DESIGNATION)
        _require_enum(
            errors,
            f"{prefix}.executiveNonExecutive",
            director.get("executiveNonExecutive", ""),
            EXECUTIVE_NON_EXECUTIVE,
        )
        _require_enum(errors, f"{prefix}.gender", director.get("gender", ""), GENDER)
        _require_enum(
            errors,
            f"{prefix}.appointmentStatus",
            director.get("appointmentStatus", ""),
            APPOINTMENT_STATUS,
        )
        _ynns(errors, f"{prefix}.independentStatus", director.get("independentStatus", ""))
        _ynns(errors, f"{prefix}.promoterStatus", director.get("promoterStatus", ""))
        _ynns(errors, f"{prefix}.nomineeStatus", director.get("nomineeStatus", ""))
        _ynns(errors, f"{prefix}.liableToRetireByRotation", director.get("liableToRetireByRotation", ""))

        eligibility = director.get("eligibility") or {}
        if isinstance(eligibility, dict):
            for field in eligibility:
                if field != "adverseExplanation":
                    _ynns(errors, f"{prefix}.eligibility.{field}", eligibility.get(field, ""))

        independent = director.get("independentDirectorDetails") or {}
        if isinstance(independent, dict):
            for field in independent:
                if field not in ("section149CriteriaStatus", "relationshipWithDirectorsPromoters", "databankStatus", "proficiencyTestRequirementStatus", "secondTermApprovalStatus", "professionalConfirmation", "termNumber", "firstTermCommencement"):
                    if isinstance(independent.get(field), str) and field.endswith("Concern") or field.startswith("independence") or field == "promoterRelationship" or field == "coolingOffConcern":
                        _ynns(errors, f"{prefix}.independentDirectorDetails.{field}", independent.get(field, ""))

        _check_unique_ids(errors, f"{prefix}.previousEmployment", director.get("previousEmployment") or [])
        _check_unique_ids(errors, f"{prefix}.otherDirectorships", director.get("otherDirectorships") or [])
        for od_index, od in enumerate(director.get("otherDirectorships") or []):
            if isinstance(od, dict):
                _require_enum(
                    errors,
                    f"{prefix}.otherDirectorships[{od_index}].entityListingStatus",
                    od.get("entityListingStatus", ""),
                    ENTITY_LISTING_STATUS,
                )
                _require_enum(
                    errors,
                    f"{prefix}.otherDirectorships[{od_index}].currentOrCeased",
                    od.get("currentOrCeased", ""),
                    CURRENT_OR_CEASED,
                )

    if errors:
        raise ValidationError(errors)


def validate_kmp_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    person_ids = _person_ids(full_payload)
    director_ids = _director_ids(full_payload)

    _check_unique_ids(errors, "organisationStructure", data.get("organisationStructure") or [])
    _check_unique_ids(errors, "kmpSmpRecords", data.get("kmpSmpRecords") or [])
    _check_unique_ids(errors, "vacancies", data.get("vacancies") or [])
    _check_unique_ids(errors, "familyRelationships", data.get("familyRelationships") or [])

    new_person_ids = {
        str(k.get("id"))
        for k in (data.get("kmpSmpRecords") or [])
        if isinstance(k, dict) and k.get("id")
    }
    all_person_ids = person_ids | new_person_ids

    readiness = data.get("kmpRoleReadiness") or {}
    if isinstance(readiness, dict):
        for field in readiness:
            if field != "notes":
                _require_enum(
                    errors,
                    f"kmpRoleReadiness.{field}",
                    readiness.get(field, ""),
                    GOVERNANCE_READINESS_STATUS,
                )

    for index, record in enumerate(data.get("kmpSmpRecords") or []):
        if not isinstance(record, dict):
            continue
        prefix = f"kmpSmpRecords[{index}]"
        _require_enum(errors, f"{prefix}.classification", record.get("classification", ""), KMP_CLASSIFICATION)
        _require_enum(errors, f"{prefix}.employmentType", record.get("employmentType", ""), EMPLOYMENT_TYPE)
        _require_enum(errors, f"{prefix}.currentStatus", record.get("currentStatus", ""), PERSON_STATUS)
        _optional_director_ref(errors, f"{prefix}.linkedDirectorId", record.get("linkedDirectorId"), director_ids)
        _optional_person_ref(errors, f"{prefix}.reportsToPersonId", record.get("reportsToPersonId"), all_person_ids)

    for index, node in enumerate(data.get("organisationStructure") or []):
        if not isinstance(node, dict):
            continue
        prefix = f"organisationStructure[{index}]"
        _require_enum(errors, f"{prefix}.status", node.get("status", ""), PERSON_STATUS)
        _optional_person_ref(errors, f"{prefix}.personId", node.get("personId"), all_person_ids)
        _optional_person_ref(
            errors,
            f"{prefix}.reportsToPersonId",
            node.get("reportsToPersonId"),
            all_person_ids,
        )

    for index, rel in enumerate(data.get("familyRelationships") or []):
        if not isinstance(rel, dict):
            continue
        prefix = f"familyRelationships[{index}]"
        _require_enum(errors, f"{prefix}.personOneType", rel.get("personOneType", ""), PERSON_TYPE)
        _require_enum(errors, f"{prefix}.personTwoType", rel.get("personTwoType", ""), PERSON_TYPE)
        _require_enum(
            errors,
            f"{prefix}.relationshipType",
            rel.get("relationshipType", ""),
            FAMILY_RELATIONSHIP_TYPE,
        )

    if errors:
        raise ValidationError(errors)


def validate_committees_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    director_ids = _director_ids(full_payload)
    committees = data.get("committees") or []
    _check_unique_ids(errors, "committees", committees)

    merged = dict(full_payload)
    merged["boardCommitteesAndGovernanceBodies"] = data

    for index, committee in enumerate(committees):
        if not isinstance(committee, dict):
            continue
        prefix = f"committees[{index}]"
        _require_enum(errors, f"{prefix}.committeeType", committee.get("committeeType", ""), COMMITTEE_TYPE)
        _require_enum(errors, f"{prefix}.applicability", committee.get("applicability", ""), COMMITTEE_APPLICABILITY)
        _ynns(errors, f"{prefix}.activeStatus", committee.get("activeStatus", ""))
        _optional_director_ref(
            errors,
            f"{prefix}.chairpersonDirectorId",
            committee.get("chairpersonDirectorId"),
            director_ids,
        )
        _check_unique_ids(errors, f"{prefix}.members", committee.get("members") or [])
        for member_index, member in enumerate(committee.get("members") or []):
            if isinstance(member, dict):
                _require_enum(
                    errors,
                    f"{prefix}.members[{member_index}].role",
                    member.get("role", ""),
                    COMMITTEE_MEMBER_ROLE,
                )
                _optional_director_ref(
                    errors,
                    f"{prefix}.members[{member_index}].directorId",
                    member.get("directorId"),
                    director_ids,
                )
        _check_unique_ids(errors, f"{prefix}.meetingHistory", committee.get("meetingHistory") or [])

        committee_id = str(committee.get("id") or "")
        if committee_id:
            ref_validation = validate_committee_member_refs(merged, committee_id)
            if not ref_validation["valid"]:
                errors[prefix] = "; ".join(ref_validation["messages"])

    if errors:
        raise ValidationError(errors)


def validate_remuneration_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    director_ids = _director_ids(full_payload)
    person_ids = _person_ids(full_payload)

    for field in (
        "directorRemuneration",
        "executiveAppointmentTerms",
        "kmpSmpRemuneration",
        "incentiveArrangements",
        "serviceContractsAndBenefits",
    ):
        _check_unique_ids(errors, field, data.get(field) or [])

    for index, row in enumerate(data.get("directorRemuneration") or []):
        if isinstance(row, dict):
            _optional_director_ref(
                errors,
                f"directorRemuneration[{index}].directorId",
                row.get("directorId"),
                director_ids,
            )
            _require_enum(
                errors,
                f"directorRemuneration[{index}].sourceStatus",
                row.get("sourceStatus", ""),
                SOURCE_STATUS,
            )

    for index, row in enumerate(data.get("executiveAppointmentTerms") or []):
        if isinstance(row, dict):
            _optional_director_ref(
                errors,
                f"executiveAppointmentTerms[{index}].directorId",
                row.get("directorId"),
                director_ids,
            )

    for index, row in enumerate(data.get("kmpSmpRemuneration") or []):
        if isinstance(row, dict):
            _optional_person_ref(
                errors,
                f"kmpSmpRemuneration[{index}].personId",
                row.get("personId"),
                person_ids,
            )

    esop = data.get("esopGovernance") or {}
    if isinstance(esop, dict):
        for field in esop:
            if field not in ("schemeName", "approvalDate", "ipoTreatmentStatus", "professionalConfirmation", "notes"):
                _ynns(errors, f"esopGovernance.{field}", esop.get(field, ""))

    if errors:
        raise ValidationError(errors)


def validate_interests_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    director_ids = _director_ids(full_payload)
    person_ids = _person_ids(full_payload)

    for field in (
        "interestsInIssuer",
        "directorOfferDocumentInterests",
        "outsideInterests",
        "appointmentArrangements",
        "financialArrangements",
    ):
        _check_unique_ids(errors, field, data.get(field) or [])

    for index, row in enumerate(data.get("interestsInIssuer") or []):
        if isinstance(row, dict):
            _require_enum(
                errors,
                f"interestsInIssuer[{index}].personType",
                row.get("personType", ""),
                INTEREST_PERSON_TYPE,
            )

    for index, row in enumerate(data.get("directorOfferDocumentInterests") or []):
        if isinstance(row, dict):
            _optional_director_ref(
                errors,
                f"directorOfferDocumentInterests[{index}].directorId",
                row.get("directorId"),
                director_ids,
            )

    for field in ("outsideInterests", "appointmentArrangements", "financialArrangements"):
        for index, row in enumerate(data.get(field) or []):
            if isinstance(row, dict):
                _require_enum(
                    errors,
                    f"{field}[{index}].personType",
                    row.get("personType", ""),
                    INTEREST_PERSON_TYPE,
                )

    if errors:
        raise ValidationError(errors)


def validate_continuity_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    director_ids = _director_ids(full_payload)
    person_ids = _person_ids(full_payload)

    _check_unique_ids(errors, "boardChanges", data.get("boardChanges") or [])
    _check_unique_ids(errors, "kmpSmpChanges", data.get("kmpSmpChanges") or [])
    _check_unique_ids(errors, "keyPersonDependencies", data.get("keyPersonDependencies") or [])

    for index, row in enumerate(data.get("boardChanges") or []):
        if isinstance(row, dict):
            _optional_director_ref(
                errors,
                f"boardChanges[{index}].directorId",
                row.get("directorId"),
                director_ids,
            )
            _require_enum(
                errors,
                f"boardChanges[{index}].event",
                row.get("event", ""),
                BOARD_CHANGE_EVENT,
            )

    for index, row in enumerate(data.get("kmpSmpChanges") or []):
        if isinstance(row, dict):
            _require_enum(
                errors,
                f"kmpSmpChanges[{index}].event",
                row.get("event", ""),
                BOARD_CHANGE_EVENT,
            )

    succession = data.get("successionReadiness") or {}
    if isinstance(succession, dict):
        for field in succession:
            if field not in ("lastReviewDate", "professionalReview", "notes"):
                _ynns(errors, f"successionReadiness.{field}", succession.get(field, ""))

    if errors:
        raise ValidationError(errors)


def validate_governance_policies_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    _check_unique_ids(errors, "governancePolicies", data.get("governancePolicies") or [])

    for index, policy in enumerate(data.get("governancePolicies") or []):
        if isinstance(policy, dict):
            _require_enum(
                errors,
                f"governancePolicies[{index}].policyType",
                policy.get("policyType", ""),
                GOVERNANCE_POLICY_TYPE,
            )
            _require_enum(
                errors,
                f"governancePolicies[{index}].applicableStatus",
                policy.get("applicableStatus", ""),
                COMMITTEE_APPLICABILITY,
            )
            _require_enum(
                errors,
                f"governancePolicies[{index}].adoptedStatus",
                policy.get("adoptedStatus", ""),
                POLICY_ADOPTED_STATUS,
            )

    rpt = data.get("rptGovernance") or {}
    if isinstance(rpt, dict):
        _require_enum(
            errors,
            "rptGovernance.regulation23ApplicabilityStatus",
            rpt.get("regulation23ApplicabilityStatus", ""),
            COMMITTEE_APPLICABILITY,
        )
        for field in rpt:
            if field not in (
                "auditCommitteeProcess",
                "shareholderApprovalProcess",
                "relatedPartyAbstentionControlProcess",
                "materialRptThresholdStatus",
                "periodicReviewProcess",
                "outstandingApprovals",
                "professionalConfirmation",
                "notes",
            ):
                if isinstance(rpt.get(field), str):
                    _ynns(errors, f"rptGovernance.{field}", rpt.get(field, ""))

    board_process = data.get("boardProcessReadiness") or {}
    if isinstance(board_process, dict):
        for field in board_process:
            if field != "notes":
                _ynns(errors, f"boardProcessReadiness.{field}", board_process.get(field, ""))

    confirmations = data.get("confirmations") or {}
    if isinstance(confirmations, dict):
        for key, value in confirmations.items():
            _optional_bool(errors, f"confirmations.{key}", value)

    if errors:
        raise ValidationError(errors)


Validator = Callable[[dict[str, Any], dict[str, Any]], None]

VALIDATORS: dict[str, Validator] = {
    "board-structure-and-ipo-governance-readiness": validate_board_structure_draft,
    "directors-profiles-appointments-and-eligibility": validate_directors_draft,
    "kmp-senior-management-and-organisation-structure": validate_kmp_draft,
    "board-committees-and-governance-bodies": validate_committees_draft,
    "remuneration-service-contracts-esops-and-benefits": validate_remuneration_draft,
    "interests-conflicts-and-management-relationships": validate_interests_draft,
    "changes-continuity-and-succession": validate_continuity_draft,
    "governance-policies-rpt-oversight-and-confirmations": validate_governance_policies_draft,
}
