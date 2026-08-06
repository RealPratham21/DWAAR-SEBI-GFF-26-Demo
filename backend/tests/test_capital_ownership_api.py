"""Postgres API tests for Capital & Ownership persistence."""

import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/capital-ownership"


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


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "capital-ownership.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert len(first_body["payload"]["currentCapitalStructure"]["equityClasses"]) == 1
    assert first_body["ipoSetupReference"]["available"] is False

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_survives_concurrent_insert(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A parallel initialise must load the existing row, not raise a unique violation."""
    headers = await _register_and_submit(auth_client, "capital-ownership.race@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()

    from app.modules.capital_ownership import service as capital_service

    real_lookup = capital_service.get_workspace_for_user
    calls = {"count": 0}

    def lookup_missing_once(db, user_id):  # noqa: ANN001, ANN202
        calls["count"] += 1
        if calls["count"] == 1:
            return None
        return real_lookup(db, user_id)

    monkeypatch.setattr(capital_service, "get_workspace_for_user", lookup_missing_once)

    racing = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert racing.status_code == 200, racing.text
    racing_body = racing.json()
    assert racing_body["created"] is False
    assert racing_body["id"] == first_body["id"]
    assert racing_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_section_saves_conflict_overview_and_assessment(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "capital-ownership.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert init.status_code == 200
    version = init.json()["version"]

    structure = init.json()["payload"]["currentCapitalStructure"]
    equity_class = structure["equityClasses"][0]
    equity_class.update(
        {
            "className": "Equity Shares",
            "classType": "ordinary-equity",
            "faceValuePerShare": "10",
            "authorisedShares": "2000000",
            "issuedShares": "1000000",
            "subscribedShares": "1000000",
            "paidUpShares": "1000000",
            "dematStatus": "fully-dematerialised",
        }
    )
    structure.update(
        {
            "asOnDate": "2025-01-01",
            "authorisedEquityShareCapital": "20000000",
            "issuedEquityShareCapital": "10000000",
            "paidUpEquityShareCapital": "10000000",
            "hasPreferenceShares": "no",
            "shareCapitalMatchesMcaRecords": "yes",
            "allSharesFullyPaidUp": "yes",
            "partlyPaidSharesOutstanding": "no",
            "hasCallsInArrears": "no",
            "hasForfeitedShares": "no",
            "hasCapitalReduction": "no",
            "sharesWithDifferentialVotingRightsExist": "no",
            "capitalAlterationCurrentlyPending": "no",
            "depositoryConnectivity": "both",
            "dematStatusOverall": "fully-dematerialised",
            "authorisedCapitalSufficientForProposedIssue": "yes",
        }
    )

    save = await auth_client.patch(
        f"{BASE}/sections/current-capital-structure",
        headers=headers,
        json={"version": version, "data": structure},
    )
    assert save.status_code == 200, save.text
    saved = save.json()
    assert saved["version"] == version + 1
    assert saved["progress"]["sections"]["current-capital-structure"] == "complete"
    assert saved["computations"]["currentEquityShares"] == "1000000"
    assert saved["notification"]["title"] == "Current Capital Structure saved"

    # Share capital history
    history = init.json()["payload"]["shareCapitalHistory"]
    history.update(
        {
            "historyCoversPeriodSinceIncorporation": "yes",
            "allHistoricalAllotmentsDocumented": "yes",
            "historyReconciledWithMcaFilings": "yes",
            "bonusIssueInLastTwelveMonths": "no",
            "sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths": "no",
            "anyPendingAllotments": "no",
            "capitalEvents": [
                {
                    "id": "event-1",
                    "eventDate": "2020-01-01",
                    "eventType": "incorporation-initial-subscription",
                    "securityType": "equity",
                    "description": "Initial subscription",
                    "numberOfShares": "1000000",
                    "faceValuePerShare": "10",
                    "issuePricePerShare": "10",
                    "premiumPerShare": "0",
                    "totalConsiderationAmount": "10000000",
                    "considerationType": "cash",
                    "considerationDetails": "",
                    "splitOrConsolidationRatioFrom": "",
                    "splitOrConsolidationRatioTo": "",
                    "preEventFaceValuePerShare": "",
                    "postEventFaceValuePerShare": "",
                    "numberOfAllottees": "5",
                    "alloteesDescription": "",
                    "includesPromoterAllotment": "yes",
                    "promoterSharesInEvent": "1000000",
                    "isRelatedPartyAllotment": "no",
                    "resolutionType": "board-resolution",
                    "resolutionDate": "2020-01-01",
                    "resolutionReference": "",
                    "formFiledWithRoc": "",
                    "filingSrn": "",
                    "filingDate": "",
                    "rocFilingCompleted": "yes",
                    "valuationReportObtained": "",
                    "valuerName": "",
                    "valuationDate": "",
                    "lockInImplication": "",
                    "supportingDocumentReference": "",
                    "notes": "",
                }
            ],
        }
    )
    history_save = await auth_client.patch(
        f"{BASE}/sections/share-capital-history",
        headers=headers,
        json={"version": saved["version"], "data": history},
    )
    assert history_save.status_code == 200, history_save.text
    version = history_save.json()["version"]

    # Shareholders
    shareholders_section = init.json()["payload"]["shareholdersAndBeneficialOwnership"]
    shareholders_section.update(
        {
            "shareholdingAsOnDate": "2025-01-01",
            "totalNumberOfShareholders": "1",
            "registerOfMembersMaintained": "yes",
            "registerOfMembersUpToDate": "yes",
            "significantBeneficialOwnerDeterminationCompleted": "yes",
            "foreignShareholdingExists": "no",
            "anyShareholderAgreementsWithInvestors": "no",
            "shareholders": [
                {
                    "id": "sh-1",
                    "name": "Promoter One",
                    "holderType": "individual",
                    "category": "promoter",
                    "residentialStatus": "resident",
                    "nationality": "Indian",
                    "identifierType": "pan",
                    "identifierValue": "ABCDE1234F",
                    "directorIdentificationNumber": "",
                    "equityClassId": equity_class["id"],
                    "equitySharesHeld": "1000000",
                    "preferenceSharesHeld": "",
                    "sharesInDematerialisedForm": "1000000",
                    "sharesInPhysicalForm": "",
                    "folioOrDpClientId": "",
                    "dateOfEarliestAcquisition": "2020-01-01",
                    "dateOfLatestAcquisition": "2020-01-01",
                    "modeOfAcquisition": "subscription-to-memorandum",
                    "averageCostOfAcquisitionPerShare": "10",
                    "votingRightsDifferFromShareholding": "no",
                    "votingRightsPercentageIfDifferent": "",
                    "sharesEncumbered": "",
                    "isPartOfPromoterGroup": "no",
                    "beneficialOwnerIsDifferent": "no",
                    "beneficialOwnerName": "",
                    "isSellingShareholderInOffer": "no",
                    "notes": "",
                }
            ],
        }
    )
    shareholders_save = await auth_client.patch(
        f"{BASE}/sections/shareholders-beneficial-ownership",
        headers=headers,
        json={"version": version, "data": shareholders_section},
    )
    assert shareholders_save.status_code == 200, shareholders_save.text
    version = shareholders_save.json()["version"]

    # Promoters & control
    promoters_section = init.json()["payload"]["promotersAndControl"]
    promoters_section.update(
        {
            "companyHasIdentifiedPromoter": "yes",
            "promoterIdentificationComplete": "yes",
            "promoterGroupIdentificationComplete": "yes",
            "anyPersonExercisingControlWithoutShareholding": "no",
            "changeInControlInLastThreeYears": "no",
            "promoters": [
                {
                    "id": "p-1",
                    "name": "Promoter One",
                    "promoterType": "individual",
                    "linkedShareholderId": "sh-1",
                    "identifierType": "pan",
                    "identifierValue": "ABCDE1234F",
                    "directorIdentificationNumber": "",
                    "nationality": "Indian",
                    "residentialStatus": "resident",
                    "dateOfBecomingPromoter": "2020-01-01",
                    "basisOfPromoterStatus": "shareholding",
                    "basisExplanation": "",
                    "equitySharesHeld": "1000000",
                    "isAlsoDirector": "yes",
                    "designation": "Managing Director",
                    "relationshipWithOtherPromoters": "",
                    "isPartOfPromoterSellingInOffer": "no",
                    "notes": "",
                }
            ],
        }
    )
    promoters_save = await auth_client.patch(
        f"{BASE}/sections/promoters-and-control",
        headers=headers,
        json={"version": version, "data": promoters_section},
    )
    assert promoters_save.status_code == 200, promoters_save.text
    version = promoters_save.json()["version"]

    # Pre & post-issue ownership
    pre_post_section = init.json()["payload"]["preAndPostIssueOwnership"]
    pre_post_section.update(
        {
            "preIssueCapitalConfirmedWithLeadManager": "yes",
            "sellingShareholderConsentsObtained": "",
            "anyExpectedPreIssueTransfers": "no",
        }
    )
    pre_post_save = await auth_client.patch(
        f"{BASE}/sections/pre-post-issue-ownership",
        headers=headers,
        json={"version": version, "data": pre_post_section},
    )
    assert pre_post_save.status_code == 200, pre_post_save.text
    version = pre_post_save.json()["version"]

    # Promoter contribution, lock-in & encumbrances
    lock_in_section = init.json()["payload"]["promoterContributionLockInAndEncumbrances"]
    lock_in_section.update(
        {
            "minimumPromoterContributionApplicable": "yes",
            "contributionBroughtInBeforeIssueOpening": "yes",
            "anyEncumbranceOnPromoterShares": "no",
            "entirePreIssueCapitalLockInUnderstood": "yes",
            "sharesIneligibleForContributionExist": "no",
            "lockInSharesToBeHeldInDematerialisedForm": "yes",
            "lockInComplianceProfessionallyConfirmed": "not_sure",
            "contributionLots": [
                {
                    "id": "lot-1",
                    "promoterId": "p-1",
                    "shareholderId": "sh-1",
                    "holderName": "Promoter One",
                    "numberOfShares": "300000",
                    "faceValuePerShare": "10",
                    "dateOfAcquisition": "2020-01-01",
                    "dateOfAllotmentOrTransfer": "2020-01-01",
                    "modeOfAcquisition": "cash-subscription",
                    "acquisitionPricePerShare": "10",
                    "considerationType": "cash",
                    "fullyPaidUp": "yes",
                    "dematerialised": "yes",
                    "eligibleForMinimumPromoterContribution": "yes",
                    "ineligibilityReason": "",
                    "proposedLockInPeriod": "eighteen-months",
                    "lockInStartDateBasis": "",
                    "isEncumbered": "no",
                    "isin": "",
                    "notes": "",
                }
            ],
        }
    )
    lock_in_save = await auth_client.patch(
        f"{BASE}/sections/promoter-contribution-lock-in",
        headers=headers,
        json={"version": version, "data": lock_in_section},
    )
    assert lock_in_save.status_code == 200, lock_in_save.text
    version = lock_in_save.json()["version"]

    # Outstanding securities, transactions & confirmations
    outstanding_section = init.json()["payload"][
        "outstandingSecuritiesTransactionsAndConfirmations"
    ]
    outstanding_section.update(
        {
            "anyOutstandingConvertibleInstruments": "no",
            "anyTransactionsInLastEighteenMonths": "no",
            "allSharesDematerialisedBeforeFiling": "yes",
            "anyPendingShareTransfers": "no",
            "anyDisputesOverTitleToShares": "no",
            "confirmations": {
                key: True
                for key in outstanding_section["confirmations"]
            },
        }
    )
    outstanding_save = await auth_client.patch(
        f"{BASE}/sections/outstanding-securities-confirmations",
        headers=headers,
        json={"version": version, "data": outstanding_section},
    )
    assert outstanding_save.status_code == 200, outstanding_save.text
    version = outstanding_save.json()["version"]

    # Stale version now conflicts.
    stale = await auth_client.patch(
        f"{BASE}/sections/current-capital-structure",
        headers=headers,
        json={"version": 1, "data": structure},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "CAPITAL_OWNERSHIP_VERSION_CONFLICT"
    assert "currentVersion" in stale.json()["error"]["details"]

    loaded = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json()["payload"]["currentCapitalStructure"]["asOnDate"] == "2025-01-01"

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    overview_body = overview.json()
    assert overview_body["sectionsComplete"] >= 1
    assert overview_body["currentEquityShares"] == "1000000"

    assessment = await auth_client.get(f"{BASE}/capital-assessment", headers=headers)
    assert assessment.status_code == 200
    assessment_body = assessment.json()
    assert assessment_body["result"] in {
        "insufficient_information",
        "appears_reconciled",
        "inconsistencies_identified",
        "pending_linked_workstream",
        "professional_confirmation_required",
    }
    assert assessment_body["metrics"]["currentEquityShares"] == "1000000"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_ownership_isolation(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "capital-ownership.a@example.com")
    headers_b = await _register_and_submit(auth_client, "capital-ownership.b@example.com")

    init_a = await auth_client.post(f"{BASE}/workspace", headers=headers_a)
    assert init_a.status_code == 200
    structure = init_a.json()["payload"]["currentCapitalStructure"]
    structure["asOnDate"] = "2025-06-01"
    save_a = await auth_client.patch(
        f"{BASE}/sections/current-capital-structure",
        headers=headers_a,
        json={"version": 1, "data": structure},
    )
    assert save_a.status_code == 200

    init_b = await auth_client.post(f"{BASE}/workspace", headers=headers_b)
    assert init_b.status_code == 200
    assert init_b.json()["payload"]["currentCapitalStructure"]["asOnDate"] == ""

    get_b = await auth_client.get(f"{BASE}/workspace", headers=headers_b)
    assert get_b.json()["payload"]["currentCapitalStructure"]["asOnDate"] == ""


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_unknown_section_and_deleting_referenced_shareholder_rejected(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "capital-ownership.validate@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]

    unknown = await auth_client.patch(
        f"{BASE}/sections/not-a-section",
        headers=headers,
        json={"version": version, "data": {}},
    )
    assert unknown.status_code == 404

    # Save a shareholder first.
    shareholders_section = init.json()["payload"]["shareholdersAndBeneficialOwnership"]
    shareholders_section["shareholders"] = [
        {
            "id": "sh-1",
            "name": "Promoter One",
            "holderType": "individual",
            "category": "promoter",
            "residentialStatus": "resident",
            "nationality": "Indian",
            "identifierType": "pan",
            "identifierValue": "ABCDE1234F",
            "directorIdentificationNumber": "",
            "equityClassId": "",
            "equitySharesHeld": "1000000",
            "preferenceSharesHeld": "",
            "sharesInDematerialisedForm": "",
            "sharesInPhysicalForm": "",
            "folioOrDpClientId": "",
            "dateOfEarliestAcquisition": "",
            "dateOfLatestAcquisition": "",
            "modeOfAcquisition": "",
            "averageCostOfAcquisitionPerShare": "",
            "votingRightsDifferFromShareholding": "",
            "votingRightsPercentageIfDifferent": "",
            "sharesEncumbered": "",
            "isPartOfPromoterGroup": "",
            "beneficialOwnerIsDifferent": "",
            "beneficialOwnerName": "",
            "isSellingShareholderInOffer": "",
            "notes": "",
        }
    ]
    shareholders_save = await auth_client.patch(
        f"{BASE}/sections/shareholders-beneficial-ownership",
        headers=headers,
        json={"version": version, "data": shareholders_section},
    )
    assert shareholders_save.status_code == 200, shareholders_save.text
    version = shareholders_save.json()["version"]

    # Reference the shareholder from promoters.
    promoters_section = init.json()["payload"]["promotersAndControl"]
    promoters_section["companyHasIdentifiedPromoter"] = "yes"
    promoters_section["promoters"] = [
        {
            "id": "p-1",
            "name": "Promoter One",
            "promoterType": "individual",
            "linkedShareholderId": "sh-1",
            "identifierType": "",
            "identifierValue": "",
            "directorIdentificationNumber": "",
            "nationality": "",
            "residentialStatus": "",
            "dateOfBecomingPromoter": "",
            "basisOfPromoterStatus": "",
            "basisExplanation": "",
            "equitySharesHeld": "",
            "isAlsoDirector": "",
            "designation": "",
            "relationshipWithOtherPromoters": "",
            "isPartOfPromoterSellingInOffer": "",
            "notes": "",
        }
    ]
    promoters_save = await auth_client.patch(
        f"{BASE}/sections/promoters-and-control",
        headers=headers,
        json={"version": version, "data": promoters_section},
    )
    assert promoters_save.status_code == 200, promoters_save.text
    version = promoters_save.json()["version"]

    # Now try to delete the shareholder referenced by that promoter.
    shareholders_section["shareholders"] = []
    delete_attempt = await auth_client.patch(
        f"{BASE}/sections/shareholders-beneficial-ownership",
        headers=headers,
        json={"version": version, "data": shareholders_section},
    )
    assert delete_attempt.status_code == 422
    assert delete_attempt.json()["error"]["code"] == "CAPITAL_OWNERSHIP_VALIDATION_FAILED"
    assert "shareholders" in delete_attempt.json()["error"]["details"]["fieldErrors"]
