"""Postgres API and logic tests for Borrowings, Assets & Contracts persistence."""

import pytest
from httpx import AsyncClient

from app.modules.borrowings_assets_contracts.assessment import assess_borrowings_assets_contracts
from app.modules.borrowings_assets_contracts.compute import compute_borrowings_assets_contracts_model
from app.modules.borrowings_assets_contracts.constants import SECTION_IDS
from app.modules.borrowings_assets_contracts.defaults import (
    clone_empty_payload,
    create_empty_covenant_record,
    create_empty_facility_record,
    create_empty_security_record,
)
from app.modules.borrowings_assets_contracts.progress import calculate_borrowings_assets_contracts_progress
from app.modules.borrowings_assets_contracts.references import count_facility_references
from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/borrowings-assets-contracts"


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


def test_payload_defaults_match_schema() -> None:
    payload = clone_empty_payload()
    assert payload["schemaVersion"] == 1
    assert len(SECTION_IDS) == 8
    assert payload["financialIndebtednessAndFacilityMaster"]["facilities"] == []
    assert (
        payload["reconciliationChangesAndIssuerConfirmations"]["confirmations"][
            "allMaterialBorrowingsDisclosed"
        ]
        == ""
    )


def test_progress_for_empty_payload() -> None:
    progress = calculate_borrowings_assets_contracts_progress(clone_empty_payload())
    assert progress["totalSections"] == 8
    assert progress["sectionsComplete"] == 0
    assert progress["overallStatus"] == "not_started"


def test_facility_calculation_uses_decimal_strings() -> None:
    payload = clone_empty_payload()
    facility = create_empty_facility_record("facility-1")
    facility["lender"]["lenderName"] = "Test Bank"
    facility["facilityType"] = "term-loan"
    facility["fundBasedNonFundBased"] = "fund-based"
    facility["securedUnsecured"] = "secured"
    facility["sanctionAndUtilisation"]["currency"] = "INR"
    facility["sanctionAndUtilisation"]["amountUnit"] = "lakhs"
    facility["sanctionAndUtilisation"]["currentSanctionedLimit"] = "100"
    facility["sanctionAndUtilisation"]["totalOutstanding"] = "75.5"
    payload["financialIndebtednessAndFacilityMaster"]["facilities"] = [facility]

    model = compute_borrowings_assets_contracts_model(payload, {})
    assert model["facilityCount"] == 1
    assert model["currencyTotals"][0]["totalSanctioned"] == "100"
    assert model["currencyTotals"][0]["totalOutstanding"] == "75.5"
    assert model["currencyTotals"][0]["securedDebt"] == "75.5"


def test_facility_reference_blocking_message() -> None:
    payload = clone_empty_payload()
    facility = create_empty_facility_record("facility-block-1")
    facility["lender"]["lenderName"] = "Blocked Lender"
    payload["financialIndebtednessAndFacilityMaster"]["facilities"] = [facility]

    security = create_empty_security_record("security-1")
    security["linkedFacilityId"] = "facility-block-1"
    payload["securityChargesGuaranteesAndBorrowingPowers"]["securities"] = [security]

    deps = count_facility_references(payload, "facility-block-1")
    assert len(deps) > 0


def test_assessment_states_for_empty_payload() -> None:
    assessment = assess_borrowings_assets_contracts(clone_empty_payload(), {})
    assert assessment["result"] in {
        "insufficient_information",
        "readiness_in_progress",
        "pending_linked_workstream",
    }
    assert len(assessment["criteria"]) > 0
    assert len(assessment["groups"]) > 0


def test_interest_variance_detection() -> None:
    payload = clone_empty_payload()
    facility = create_empty_facility_record("facility-float-1")
    facility["interest"]["rateType"] = "floating"
    facility["interest"]["benchmarkRate"] = "8"
    facility["interest"]["spread"] = "1.5"
    facility["interest"]["enteredEffectiveRate"] = "12"
    payload["financialIndebtednessAndFacilityMaster"]["facilities"] = [facility]

    model = compute_borrowings_assets_contracts_model(payload, {})
    assert model["interestVarianceCount"] == 1


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "bac.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert first_body["progress"]["totalSections"] == 8

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    assert second.json()["created"] is False
    assert second.json()["id"] == first_body["id"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_facility_deletion_blocked_when_referenced(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "bac.delete@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    facility = create_empty_facility_record("facility-block-1")
    facility["lender"]["lenderName"] = "Blocked Bank"
    facility["facilityType"] = "term-loan"
    facility_section = payload["financialIndebtednessAndFacilityMaster"]
    facility_section["borrowingSnapshot"]["positionAsOfDate"] = "2024-03-31"
    facility_section["borrowingSnapshot"]["reportingCurrency"] = "INR"
    facility_section["borrowingSnapshot"]["currentBorrowingsExist"] = "yes"
    facility_section["facilities"] = [facility]

    save_facility = await auth_client.patch(
        f"{BASE}/sections/financial-indebtedness-and-facility-master",
        headers=headers,
        json={"version": version, "data": facility_section},
    )
    assert save_facility.status_code == 200, save_facility.text
    version = save_facility.json()["version"]

    security_section = save_facility.json()["payload"]["securityChargesGuaranteesAndBorrowingPowers"]
    security = create_empty_security_record("security-1")
    security["linkedFacilityId"] = "facility-block-1"
    security["securityType"] = "hypothecation"
    security_section["securities"] = [security]

    save_security = await auth_client.patch(
        f"{BASE}/sections/security-charges-guarantees-and-borrowing-powers",
        headers=headers,
        json={"version": version, "data": security_section},
    )
    assert save_security.status_code == 200, save_security.text
    version = save_security.json()["version"]

    blocked_section = save_security.json()["payload"]["financialIndebtednessAndFacilityMaster"]
    blocked_section["facilities"] = []

    blocked = await auth_client.patch(
        f"{BASE}/sections/financial-indebtedness-and-facility-master",
        headers=headers,
        json={"version": version, "data": blocked_section},
    )
    assert blocked.status_code == 422
    assert "facilities" in blocked.json()["details"]["fieldErrors"]
