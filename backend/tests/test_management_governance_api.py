"""Postgres API tests for Management & Governance persistence."""

import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/management-governance"

SECTION_IDS = [
    "board-structure-and-ipo-governance-readiness",
    "directors-profiles-appointments-and-eligibility",
    "kmp-senior-management-and-organisation-structure",
    "board-committees-and-governance-bodies",
    "remuneration-service-contracts-esops-and-benefits",
    "interests-conflicts-and-management-relationships",
    "changes-continuity-and-succession",
    "governance-policies-rpt-oversight-and-confirmations",
]


async def _register_and_submit(auth_client: AsyncClient, email: str) -> dict[str, str]:
    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email=email),
    )
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    created = await auth_client.post("/api/v1/onboarding/sme", headers=headers)
    onboarding_id = created.json()["id"]

    for route_suffix, _step, payload in _full_onboarding_steps():
        response = await auth_client.patch(
            f"/api/v1/onboarding/sme/{onboarding_id}/{route_suffix}",
            headers=headers,
            json=payload,
        )
        assert response.status_code == 200, response.text

    submit = await auth_client.post(
        f"/api/v1/onboarding/sme/{onboarding_id}/submit",
        headers=headers,
        json={
            "submissionConfirmations": {
                "confirmAccuracy": True,
                "confirmAuthorised": True,
                "confirmVerification": True,
                "agreeTerms": True,
            },
        },
    )
    assert submit.status_code == 200
    return headers


def _sample_director(director_id: str = "dir-1") -> dict:
    return {
        "id": director_id,
        "fullLegalName": "Jane Director",
        "previousName": "",
        "din": "12345678",
        "dateOfBirth": "1975-06-15",
        "gender": "female",
        "nationality": "Indian",
        "countryOfResidence": "India",
        "occupation": "Professional",
        "designation": "independent-director",
        "executiveNonExecutive": "non-executive",
        "independentStatus": "yes",
        "promoterStatus": "no",
        "nomineeStatus": "no",
        "nominationSource": "",
        "functionalResponsibility": "",
        "dateFirstAppointed": "2020-01-01",
        "dateOfCurrentAppointment": "2023-04-01",
        "currentTermStart": "2023-04-01",
        "currentTermEnd": "2028-03-31",
        "liableToRetireByRotation": "no",
        "appointmentStatus": "current",
        "boardApprovalDate": "2023-03-15",
        "shareholderApprovalDate": "2023-03-20",
        "resolutionReference": "BR/2023/01",
        "dir12FilingStatusReference": "",
        "educationalQualifications": "MBA",
        "professionalQualifications": "",
        "professionalMemberships": "",
        "totalExperience": "20 years",
        "relevantIndustryExperience": "15 years",
        "areasOfExpertise": "Finance",
        "currentResponsibilities": "Board oversight",
        "briefProfessionalBiography": "Experienced director.",
        "previousEmployment": [],
        "otherDirectorships": [],
        "eligibility": {
            "dinActive": "yes",
            "section164DisqualificationConcern": "no",
            "section164_2Concern": "no",
            "sebiDebarment": "no",
            "stockExchangeDebarment": "no",
            "securitiesMarketRestraint": "no",
            "relevantConviction": "no",
            "insolvencyBankruptcyConcern": "no",
            "directorshipLimitConcern": "no",
            "requiredConsentDeclarationAvailable": "yes",
            "professionalEligibilityReviewPending": "no",
            "adverseExplanation": "",
        },
        "independentDirectorDetails": {
            "independenceDeclarationReceived": "yes",
            "section149CriteriaStatus": "Met",
            "promoterRelationship": "no",
            "relationshipWithDirectorsPromoters": "",
            "pecuniaryRelationshipConcern": "no",
            "employmentAdvisoryRelationshipConcern": "no",
            "relativeRelationshipConcern": "no",
            "databankStatus": "Registered",
            "proficiencyTestRequirementStatus": "Not required",
            "termNumber": "1",
            "firstTermCommencement": "2023-04-01",
            "secondTermApprovalStatus": "",
            "coolingOffConcern": "no",
            "professionalConfirmation": "",
        },
        "notes": "",
    }


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert first_body["payload"]["directorsProfilesAppointmentsAndEligibility"]["directors"] == []
    assert first_body["linkedReferences"]["company"]["available"] is False
    assert first_body["progress"]["sectionsComplete"] == 0
    assert first_body["progress"]["totalSections"] == 8

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_unknown_section_returns_error(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.unknown@example.com")
    await auth_client.post(f"{BASE}/workspace", headers=headers)

    response = await auth_client.patch(
        f"{BASE}/sections/not-a-real-section",
        headers=headers,
        json={"version": 1, "data": {}},
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "MANAGEMENT_GOVERNANCE_UNKNOWN_SECTION"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_directors_board_structure_and_assessment(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert init.status_code == 200
    version = init.json()["version"]
    payload = init.json()["payload"]

    directors_section = payload["directorsProfilesAppointmentsAndEligibility"]
    directors_section["directors"] = [_sample_director()]
    save = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers,
        json={"version": version, "data": directors_section},
    )
    assert save.status_code == 200
    version = save.json()["version"]
    assert save.json()["computations"]["currentDirectorCount"] == 1
    assert save.json()["computations"]["independentDirectorCount"] == 1

    board_section = payload["boardStructureAndIpoGovernanceReadiness"]
    board_section["boardSnapshot"].update(
        {
            "asOfDate": "2024-03-31",
            "companyStatus": "private-company",
            "currentBoardSize": "1",
            "vacantBoardSeats": "0",
            "proposedBoardSizeForListing": "6",
        }
    )
    board_section["leadership"]["chairmanDirectorId"] = "dir-1"
    board_section["leadership"]["chairmanClassification"] = "independent"
    board_section["governanceReadiness"]["publicCompanyConversion"] = "in_progress"
    board_section["governanceReadiness"]["independentDirectorAppointments"] = "in_progress"
    board_section["governanceReadiness"]["womanDirectorAppointment"] = "completed"
    board_section["ipoCommittee"]["constituted"] = "yes"

    save = await auth_client.patch(
        f"{BASE}/sections/board-structure-and-ipo-governance-readiness",
        headers=headers,
        json={"version": version, "data": board_section},
    )
    assert save.status_code == 200
    version = save.json()["version"]
    assert save.json()["computations"]["boardSize"] == 1

    assessment = await auth_client.get(f"{BASE}/governance-assessment", headers=headers)
    assert assessment.status_code == 200
    body = assessment.json()
    assert body["result"] in {
        "insufficient_information",
        "readiness_in_progress",
        "potential_concerns_identified",
        "professional_confirmation_required",
        "pending_appointments",
    }
    assert len(body["criteria"]) > 0
    assert len(body["groups"]) == 8
    assert body["metrics"]["boardSize"] == 1

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    overview_body = overview.json()
    assert overview_body["boardSize"] == 1
    assert overview_body["womenDirectors"] == 1
    assert overview_body["totalSections"] == 8


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_version_conflict(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.conflict@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    payload = init.json()["payload"]

    directors_section = payload["directorsProfilesAppointmentsAndEligibility"]
    directors_section["directors"] = [_sample_director()]
    save = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers,
        json={"version": 1, "data": directors_section},
    )
    assert save.status_code == 200

    conflict = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers,
        json={"version": 1, "data": directors_section},
    )
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "MANAGEMENT_GOVERNANCE_VERSION_CONFLICT"
    assert conflict.json()["error"]["details"]["currentVersion"] == 2


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_director_reference_validation_and_deletion_block(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.validate@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    directors_section = payload["directorsProfilesAppointmentsAndEligibility"]
    directors_section["directors"] = [_sample_director()]
    save = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers,
        json={"version": version, "data": directors_section},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    board_section = payload["boardStructureAndIpoGovernanceReadiness"]
    board_section["leadership"]["chairmanDirectorId"] = "dir-1"
    save = await auth_client.patch(
        f"{BASE}/sections/board-structure-and-ipo-governance-readiness",
        headers=headers,
        json={"version": version, "data": board_section},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    invalid_board = {
        **board_section,
        "leadership": {
            **board_section["leadership"],
            "chairmanDirectorId": "missing-director",
        },
    }
    invalid = await auth_client.patch(
        f"{BASE}/sections/board-structure-and-ipo-governance-readiness",
        headers=headers,
        json={"version": version, "data": invalid_board},
    )
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "MANAGEMENT_GOVERNANCE_VALIDATION_FAILED"

    blocked_delete = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers,
        json={"version": version, "data": {"directors": [], "notes": ""}},
    )
    assert blocked_delete.status_code == 422
    assert "referenced" in str(
        blocked_delete.json()["error"]["details"]["fieldErrors"]
    ).lower()


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_committee_member_reference_validation(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.committee@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    directors_section = payload["directorsProfilesAppointmentsAndEligibility"]
    directors_section["directors"] = [_sample_director()]
    save = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers,
        json={"version": version, "data": directors_section},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    committees_section = payload["boardCommitteesAndGovernanceBodies"]
    committees_section["committees"] = [
        {
            "id": "comm-1",
            "committeeType": "audit-committee",
            "name": "Audit Committee",
            "applicability": "required",
            "constitutionDate": "2023-04-01",
            "boardResolutionReference": "BR/2023/02",
            "activeStatus": "yes",
            "chairpersonDirectorId": "dir-1",
            "members": [
                {
                    "id": "mem-1",
                    "directorId": "dir-1",
                    "role": "chair",
                    "appointmentDate": "2023-04-01",
                    "cessationDate": "",
                    "independentStatus": "yes",
                    "executiveNonExecutive": "non-executive",
                    "financialLiteracyExpertise": "High",
                    "notes": "",
                }
            ],
            "termsOfReferenceAdopted": "yes",
            "termsOfReferenceDate": "2023-04-01",
            "quorumRule": "2",
            "meetingFrequency": "Quarterly",
            "companySecretaryActsAsSecretary": "yes",
            "professionalReviewStatus": "",
            "meetingHistory": [],
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/board-committees-and-governance-bodies",
        headers=headers,
        json={"version": version, "data": committees_section},
    )
    assert save.status_code == 200
    assert save.json()["computations"]["committeesReadyCount"] >= 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_ownership_isolation(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "mgmt-gov.a@example.com")
    headers_b = await _register_and_submit(auth_client, "mgmt-gov.b@example.com")

    init_a = await auth_client.post(f"{BASE}/workspace", headers=headers_a)
    directors_section = init_a.json()["payload"]["directorsProfilesAppointmentsAndEligibility"]
    directors_section["directors"] = [_sample_director()]
    save_a = await auth_client.patch(
        f"{BASE}/sections/directors-profiles-appointments-and-eligibility",
        headers=headers_a,
        json={"version": 1, "data": directors_section},
    )
    assert save_a.status_code == 200

    init_b = await auth_client.post(f"{BASE}/workspace", headers=headers_b)
    assert init_b.status_code == 200
    assert init_b.json()["payload"]["directorsProfilesAppointmentsAndEligibility"]["directors"] == []

    get_b = await auth_client.get(f"{BASE}/workspace", headers=headers_b)
    assert get_b.json()["payload"]["directorsProfilesAppointmentsAndEligibility"]["directors"] == []


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_get_workspace_before_initialize_returns_not_found(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.notinit@example.com")
    response = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "MANAGEMENT_GOVERNANCE_WORKSPACE_NOT_FOUND"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_all_remaining_sections(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "mgmt-gov.all@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    saves = [
        (
            "directors-profiles-appointments-and-eligibility",
            {
                **payload["directorsProfilesAppointmentsAndEligibility"],
                "directors": [_sample_director()],
            },
        ),
        (
            "kmp-senior-management-and-organisation-structure",
            {
                **payload["kmpSeniorManagementAndOrganisationStructure"],
                "kmpSmpRecords": [
                    {
                        "id": "kmp-1",
                        "fullName": "Chief Financial Officer",
                        "classification": "kmp",
                        "designation": "CFO",
                        "functionalRole": "Finance",
                        "department": "Finance",
                        "joiningDate": "2019-01-01",
                        "currentRoleAppointmentDate": "2019-01-01",
                        "employmentType": "permanent",
                        "currentStatus": "current",
                        "reportsToPersonId": "",
                        "keyResponsibilities": "Financial reporting",
                        "dateOfBirth": "",
                        "educationalQualifications": "",
                        "professionalQualifications": "",
                        "professionalMemberships": "",
                        "totalExperience": "",
                        "relevantExperience": "",
                        "previousEmployment": "",
                        "briefBiography": "",
                        "linkedDirectorId": "",
                        "notes": "",
                    }
                ],
                "kmpRoleReadiness": {
                    **payload["kmpSeniorManagementAndOrganisationStructure"]["kmpRoleReadiness"],
                    "cfo": "completed",
                    "companySecretary": "in_progress",
                    "mdCeoManagerWtd": "completed",
                },
            },
        ),
        (
            "remuneration-service-contracts-esops-and-benefits",
            {
                **payload["remunerationServiceContractsEsopsAndBenefits"],
                "directorRemuneration": [
                    {
                        "id": "rem-1",
                        "directorId": "dir-1",
                        "financialYear": "FY 2024",
                        "salary": "1200000",
                        "commission": "",
                        "performanceBonus": "",
                        "sittingFees": "200000",
                        "perquisites": "",
                        "retirementBenefits": "",
                        "esopShareBasedCompensation": "",
                        "otherRemuneration": "",
                        "totalRemuneration": "1400000",
                        "sourceStatus": "audited-financial-statements",
                        "notes": "",
                    }
                ],
                "esopGovernance": {
                    **payload["remunerationServiceContractsEsopsAndBenefits"]["esopGovernance"],
                    "esopSchemeExists": "no",
                },
            },
        ),
        (
            "interests-conflicts-and-management-relationships",
            {
                **payload["interestsConflictsAndManagementRelationships"],
                "interestsInIssuer": [
                    {
                        "id": "int-1",
                        "personId": "kmp-1",
                        "personType": "kmp",
                        "sharesOrOptions": "1000",
                        "dividendInterest": "no",
                        "remunerationInterest": "yes",
                        "employmentInterest": "yes",
                        "promoterStatus": "no",
                        "sellingShareholderStatus": "no",
                        "loanDepositRelationship": "no",
                        "guaranteeRelationship": "no",
                        "otherFinancialInterest": "",
                        "notes": "",
                    }
                ],
            },
        ),
        (
            "changes-continuity-and-succession",
            {
                **payload["changesContinuityAndSuccession"],
                "boardChanges": [
                    {
                        "id": "bc-1",
                        "directorId": "dir-1",
                        "previousDesignation": "",
                        "newDesignation": "Independent Director",
                        "event": "appointment",
                        "effectiveDate": "2023-04-01",
                        "reason": "Board expansion",
                        "boardApproval": "yes",
                        "shareholderApproval": "yes",
                        "filingReference": "",
                        "replacementAppointed": "",
                        "notes": "",
                    }
                ],
                "successionReadiness": {
                    **payload["changesContinuityAndSuccession"]["successionReadiness"],
                    "formalSuccessionPlan": "yes",
                    "criticalRolesIdentified": "yes",
                },
            },
        ),
        (
            "governance-policies-rpt-oversight-and-confirmations",
            {
                **payload["governancePoliciesRptOversightAndConfirmations"],
                "governancePolicies": [
                    {
                        "id": "pol-1",
                        "policyType": "code-of-conduct-board-senior-management",
                        "policyName": "Code of Conduct",
                        "applicableStatus": "required",
                        "adoptedStatus": "adopted",
                        "approvalDate": "2022-01-01",
                        "approvingBoardOrCommittee": "Board",
                        "effectiveDate": "2022-01-01",
                        "lastReviewed": "2024-01-01",
                        "websitePublicationRequirementStatus": "",
                        "policyOwner": "Company Secretary",
                        "professionalConfirmation": "",
                        "notes": "",
                    }
                ],
                "rptGovernance": {
                    **payload["governancePoliciesRptOversightAndConfirmations"]["rptGovernance"],
                    "regulation23ApplicabilityStatus": "required",
                },
                "boardProcessReadiness": {
                    **payload["governancePoliciesRptOversightAndConfirmations"][
                        "boardProcessReadiness"
                    ],
                    "boardMeetingCalendar": "yes",
                },
                "confirmations": {
                    key: True
                    for key in payload["governancePoliciesRptOversightAndConfirmations"][
                        "confirmations"
                    ]
                },
            },
        ),
    ]

    for section_id, data in saves:
        response = await auth_client.patch(
            f"{BASE}/sections/{section_id}",
            headers=headers,
            json={"version": version, "data": data},
        )
        assert response.status_code == 200, (section_id, response.text)
        version = response.json()["version"]
        assert response.json()["savedSectionId"] == section_id
        assert response.json()["notification"]["workstreamSlug"] == "management-governance"

    final = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert final.status_code == 200
    assert final.json()["progress"]["sectionsComplete"] >= 1
