"""Postgres API tests for Objects of the Issue persistence."""

import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/objects-issue"


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
    headers = await _register_and_submit(auth_client, "objects-issue.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert first_body["payload"]["objectsRegisterAndAllocation"]["objects"] == []
    assert first_body["linkedReferences"]["company"]["available"] is False
    assert first_body["progress"]["sectionsComplete"] == 0
    assert first_body["progress"]["totalSections"] == 7

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_load_all_sections_version_conflict_and_assessment(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "objects-issue.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert init.status_code == 200
    version = init.json()["version"]
    payload = init.json()["payload"]

    # 1. Proceeds & funding summary
    proceeds = payload["proceedsAndFundingSummary"]
    proceeds.update(
        {
            "declaredOfferType": "fresh-issue",
            "freshIssueGrossProceeds": "100000000",
            "estimatedIssueRelatedExpenses": "8000000",
            "issueMadeToRaiseFundsForObjects": "yes",
        }
    )
    save = await auth_client.patch(
        f"{BASE}/sections/proceeds-and-funding-summary",
        headers=headers,
        json={"version": version, "data": proceeds},
    )
    assert save.status_code == 200, save.text
    saved = save.json()
    assert saved["version"] == version + 1
    assert saved["computations"]["netFreshIssueProceeds"] == "92000000"
    assert saved["notification"]["title"] == "Proceeds & Funding Summary saved"
    version = saved["version"]

    # 2. Objects register & allocation
    register = payload["objectsRegisterAndAllocation"]
    object_id = "obj-1"
    register["objects"] = [
        {
            "id": object_id,
            "objectName": "Plant expansion",
            "objectCategory": "capital-expenditure",
            "description": "New manufacturing line",
            "estimatedCost": "60000000",
            "amountFromNetProceeds": "60000000",
            "amountFromInternalAccruals": "",
            "amountFromOtherSources": "",
            "appraisalStatus": "appraised-by-bank-or-fi",
            "appraisingAgencyName": "State Bank",
            "expectedUtilisationPeriod": "24 months",
            "priorityRank": "1",
            "notes": "",
        }
    ]
    register["objectsAreFinalised"] = "yes"
    save = await auth_client.patch(
        f"{BASE}/sections/objects-register-and-allocation",
        headers=headers,
        json={"version": version, "data": register},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 3. Capital expenditure
    capex = payload["capitalExpenditureFacilitiesAndExpansion"]
    capex["capexItems"] = [
        {
            "id": "capex-1",
            "itemType": "new-plant-and-machinery",
            "description": "CNC machines",
            "location": "Pune",
            "relatedObjectId": object_id,
            "estimatedCost": "60000000",
            "expectedCommissioningDate": "2027-03-31",
            "quotationSource": "multiple-quotations",
            "relatedPartyPurchase": "no",
            "governmentApprovalsRequired": "no",
            "approvalsStatus": "not-required",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/capital-expenditure-facilities-and-expansion",
        headers=headers,
        json={"version": version, "data": capex},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 4. Working capital & borrowing repayment
    working_capital = payload["workingCapitalAndBorrowingRepayment"]
    working_capital.update(
        {
            "workingCapitalRequirementAmount": "20000000",
            "workingCapitalMethodology": "turnover-method",
            "workingCapitalAppraisalStatus": "appraised-by-bank-or-fi",
        }
    )
    save = await auth_client.patch(
        f"{BASE}/sections/working-capital-and-borrowing-repayment",
        headers=headers,
        json={"version": version, "data": working_capital},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 5. Acquisitions
    acquisitions = payload["acquisitionsSubsidiariesJvsAndInvestments"]
    acquisitions["investmentItems"] = [
        {
            "id": "inv-1",
            "targetEntityName": "Target Co",
            "transactionType": "acquisition",
            "relatedObjectId": "",
            "estimatedAmount": "10000000",
            "proposedStakePercentage": "51",
            "definitiveAgreementStatus": "term-sheet-or-mou-signed",
            "regulatoryApprovalsRequired": "no",
            "regulatoryApprovalDetails": "",
            "isRelatedPartyTransaction": "no",
            "rationale": "Strategic expansion",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/acquisitions-subsidiaries-jvs-and-investments",
        headers=headers,
        json={"version": version, "data": acquisitions},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 6. Means of finance & deployment
    means = payload["meansOfFinanceAndDeploymentSchedule"]
    means["meansOfFinanceRows"] = [
        {
            "id": "mof-1",
            "source": "net-proceeds-of-the-issue",
            "amount": "60000000",
            "notes": "",
        }
    ]
    means["deploymentScheduleRows"] = [
        {
            "id": "dep-1",
            "periodLabel": "Year 1",
            "amountToBeDeployed": "30000000",
            "notes": "",
        }
    ]
    means["fundingTieUpStatus"] = "fully-tied-up"
    save = await auth_client.patch(
        f"{BASE}/sections/means-of-finance-and-deployment-schedule",
        headers=headers,
        json={"version": version, "data": means},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    # 7. Expenses, GCP, monitoring & confirmations
    expenses = payload["expensesGcpMonitoringAndConfirmations"]
    expenses["issueExpenseItems"] = [
        {
            "id": "exp-1",
            "expenseCategory": "lead-manager-and-underwriting-fees",
            "estimatedAmount": "5000000",
            "notes": "",
        }
    ]
    expenses["generalCorporatePurposesAmount"] = "10000000"
    expenses["monitoringAgencyRequired"] = "yes"
    expenses["monitoringAgencyStatus"] = "appointed"
    expenses["monitoringAgencyName"] = "CRISIL"
    expenses["confirmations"] = {key: True for key in expenses["confirmations"]}
    save = await auth_client.patch(
        f"{BASE}/sections/expenses-gcp-monitoring-and-confirmations",
        headers=headers,
        json={"version": version, "data": expenses},
    )
    assert save.status_code == 200, save.text
    version = save.json()["version"]

    stale = await auth_client.patch(
        f"{BASE}/sections/proceeds-and-funding-summary",
        headers=headers,
        json={"version": 1, "data": proceeds},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "OBJECTS_ISSUE_VERSION_CONFLICT"

    loaded = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert loaded.status_code == 200
    loaded_payload = loaded.json()["payload"]
    assert loaded_payload["proceedsAndFundingSummary"]["freshIssueGrossProceeds"] == "100000000"
    assert loaded_payload["objectsRegisterAndAllocation"]["objects"][0]["id"] == object_id

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    overview_body = overview.json()
    assert overview_body["objectsCount"] == 1
    assert overview_body["gcpApplicableCap"] != ""
    assert overview_body["assessmentResult"] in {
        "blocking_concerns_identified",
        "potential_concerns_identified",
        "disclosure_in_progress",
        "no_blocking_concerns",
    }

    assessment = await auth_client.get(f"{BASE}/objects-assessment", headers=headers)
    assert assessment.status_code == 200
    assessment_body = assessment.json()
    assert len(assessment_body["groups"]) == 7
    assert assessment_body["metrics"]["objects"] == 1


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_ownership_isolation(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "objects-issue.a@example.com")
    headers_b = await _register_and_submit(auth_client, "objects-issue.b@example.com")

    init_a = await auth_client.post(f"{BASE}/workspace", headers=headers_a)
    assert init_a.status_code == 200
    proceeds = init_a.json()["payload"]["proceedsAndFundingSummary"]
    proceeds["freshIssueGrossProceeds"] = "50000000"
    save_a = await auth_client.patch(
        f"{BASE}/sections/proceeds-and-funding-summary",
        headers=headers_a,
        json={"version": 1, "data": proceeds},
    )
    assert save_a.status_code == 200

    init_b = await auth_client.post(f"{BASE}/workspace", headers=headers_b)
    assert init_b.status_code == 200
    assert init_b.json()["payload"]["proceedsAndFundingSummary"]["freshIssueGrossProceeds"] == ""

    get_b = await auth_client.get(f"{BASE}/workspace", headers=headers_b)
    assert get_b.json()["payload"]["proceedsAndFundingSummary"]["freshIssueGrossProceeds"] == ""


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_related_object_reference_validation(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "objects-issue.validate@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    register = payload["objectsRegisterAndAllocation"]
    register["objects"] = [
        {
            "id": "obj-keep",
            "objectName": "Capex object",
            "objectCategory": "capital-expenditure",
            "description": "Purpose",
            "estimatedCost": "1000000",
            "amountFromNetProceeds": "1000000",
            "amountFromInternalAccruals": "",
            "amountFromOtherSources": "",
            "appraisalStatus": "",
            "appraisingAgencyName": "",
            "expectedUtilisationPeriod": "",
            "priorityRank": "",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/objects-register-and-allocation",
        headers=headers,
        json={"version": version, "data": register},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    capex = payload["capitalExpenditureFacilitiesAndExpansion"]
    capex["capexItems"] = [
        {
            "id": "capex-1",
            "itemType": "new-plant-and-machinery",
            "description": "",
            "location": "",
            "relatedObjectId": "obj-keep",
            "estimatedCost": "1000000",
            "expectedCommissioningDate": "",
            "quotationSource": "",
            "relatedPartyPurchase": "",
            "governmentApprovalsRequired": "",
            "approvalsStatus": "",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/capital-expenditure-facilities-and-expansion",
        headers=headers,
        json={"version": version, "data": capex},
    )
    assert save.status_code == 200
    version = save.json()["version"]

    invalid_ref = await auth_client.patch(
        f"{BASE}/sections/capital-expenditure-facilities-and-expansion",
        headers=headers,
        json={
            "version": version,
            "data": {
                **capex,
                "capexItems": [{**capex["capexItems"][0], "relatedObjectId": "missing-id"}],
            },
        },
    )
    assert invalid_ref.status_code == 422
    assert invalid_ref.json()["error"]["code"] == "OBJECTS_ISSUE_VALIDATION_FAILED"

    register_removed = {"objects": [], "objectsAreFinalised": "", "notes": ""}
    blocked_delete = await auth_client.patch(
        f"{BASE}/sections/objects-register-and-allocation",
        headers=headers,
        json={"version": version, "data": register_removed},
    )
    assert blocked_delete.status_code == 422
    assert "referenced" in str(blocked_delete.json()["error"]["details"]["fieldErrors"]).lower()


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_pure_ofs_overview_and_assessment(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "objects-issue.ofs@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    payload = init.json()["payload"]

    proceeds = payload["proceedsAndFundingSummary"]
    proceeds.update(
        {
            "declaredOfferType": "offer-for-sale",
            "offerForSaleProceedsNote": "Pure OFS — issuer receives no fresh-issue proceeds.",
        }
    )
    save = await auth_client.patch(
        f"{BASE}/sections/proceeds-and-funding-summary",
        headers=headers,
        json={"version": 1, "data": proceeds},
    )
    assert save.status_code == 200
    assert save.json()["computations"]["isPureOfs"] is True
    assert save.json()["computations"]["netFreshIssueProceeds"] == ""

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["isPureOfs"] is True

    assessment = await auth_client.get(f"{BASE}/objects-assessment", headers=headers)
    assert assessment.status_code == 200
    ofs_criterion = next(
        item for item in assessment.json()["criteria"] if item["id"] == "ofs-proceeds-excluded"
    )
    assert ofs_criterion["state"] == "reconciled"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_related_party_repayment_blocked_in_assessment(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "objects-issue.rp@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    payload = init.json()["payload"]

    working_capital = payload["workingCapitalAndBorrowingRepayment"]
    working_capital["borrowingRepaymentItems"] = [
        {
            "id": "loan-1",
            "lenderName": "Promoter Finance Pvt Ltd",
            "loanType": "unsecured-loan",
            "outstandingAmount": "5000000",
            "amountProposedForRepayment": "5000000",
            "interestRatePercentage": "",
            "isRelatedPartyLender": "yes",
            "repaymentRationale": "",
            "notes": "",
        }
    ]
    save = await auth_client.patch(
        f"{BASE}/sections/working-capital-and-borrowing-repayment",
        headers=headers,
        json={"version": 1, "data": working_capital},
    )
    assert save.status_code == 200

    assessment = await auth_client.get(f"{BASE}/objects-assessment", headers=headers)
    assert assessment.status_code == 200
    flagged = next(
        item for item in assessment.json()["criteria"] if item["id"] == "related-party-repayment"
    )
    assert flagged["state"] == "blocked"
    assert assessment.json()["result"] == "blocking_concerns_identified"
