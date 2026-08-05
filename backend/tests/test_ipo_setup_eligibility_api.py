"""Postgres API tests for IPO Setup & Eligibility persistence."""

import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/ipo-setup-eligibility"


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
    headers = await _register_and_submit(auth_client, "ipo-setup.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert len(first_body["payload"]["trackRecordAndFinancialEligibility"]["financialYears"]) == 3

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_section_save_load_version_conflict_and_assessment(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "ipo-setup.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert init.status_code == 200
    version = init.json()["version"]
    direction = init.json()["payload"]["ipoDirection"]
    direction.update(
        {
            "preparationStage": "preparing-internally",
            "targetSmePlatform": "nse-emerge",
            "eligibilityProfile": "standard-sme-ipo",
            "proposedOfferType": "fresh-and-ofs",
            "proposedPricingMethod": "book-built",
            "publicCompanyConversionStatus": "not-started",
        }
    )

    save = await auth_client.patch(
        f"{BASE}/sections/ipo-direction",
        headers=headers,
        json={"version": version, "data": direction},
    )
    assert save.status_code == 200, save.text
    saved = save.json()
    assert saved["version"] == version + 1
    assert saved["progress"]["sections"]["ipo-direction"] == "complete"

    offer = init.json()["payload"]["offerStructure"]
    offer.update(
        {
            "faceValuePerEquityShare": 10,
            "existingIssuedEquityShares": 1_000_000,
            "existingPaidUpEquityShareCapital": 10_000_000,
            "proposedIssuePriceStatus": "indicative",
            "proposedIssuePrice": 100,
            "proposedFreshIssueShares": 200_000,
            "proposedFreshIssueAmount": 20_000_000,
            "preIpoPlacementBeingConsidered": "no",
            "proposedOfsShares": 100_000,
            "proposedOfsAmount": 10_000_000,
            "numberOfSellingShareholders": 2,
            "sellerConsentsObtained": "yes",
        }
    )
    offer_save = await auth_client.patch(
        f"{BASE}/sections/offer-structure",
        headers=headers,
        json={"version": saved["version"], "data": offer},
    )
    assert offer_save.status_code == 200, offer_save.text
    offer_body = offer_save.json()
    assert offer_body["offerComputations"]["proposedPostIssuePaidUpCapital"] == "12000000"
    assert offer_body["offerComputations"]["paidUpCapitalIncreaseFromOffer"] == "2000000"

    stale = await auth_client.patch(
        f"{BASE}/sections/ipo-direction",
        headers=headers,
        json={"version": version, "data": direction},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "IPO_SETUP_VERSION_CONFLICT"

    loaded = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json()["payload"]["ipoDirection"]["targetSmePlatform"] == "nse-emerge"

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["targetPlatform"] == "nse-emerge"
    assert overview.json()["sectionsComplete"] >= 1

    assessment = await auth_client.get(f"{BASE}/eligibility-assessment", headers=headers)
    assert assessment.status_code == 200
    body = assessment.json()
    assert body["result"] in {
        "insufficient_information",
        "preliminary_criteria_appear_satisfied",
        "eligibility_concerns_identified",
        "professional_assessment_required",
    }
    assert "eligible" not in body["result"]
    assert body["metrics"]["proposedPostIssuePaidUpCapital"] == "12000000"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_ownership_isolation(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "ipo-setup.a@example.com")
    headers_b = await _register_and_submit(auth_client, "ipo-setup.b@example.com")

    init_a = await auth_client.post(f"{BASE}/workspace", headers=headers_a)
    assert init_a.status_code == 200
    direction = init_a.json()["payload"]["ipoDirection"]
    direction["preparationStage"] = "exploring-ipo"
    save_a = await auth_client.patch(
        f"{BASE}/sections/ipo-direction",
        headers=headers_a,
        json={"version": 1, "data": direction},
    )
    assert save_a.status_code == 200

    init_b = await auth_client.post(f"{BASE}/workspace", headers=headers_b)
    assert init_b.status_code == 200
    assert init_b.json()["payload"]["ipoDirection"]["preparationStage"] == ""

    get_b = await auth_client.get(f"{BASE}/workspace", headers=headers_b)
    assert get_b.json()["payload"]["ipoDirection"]["preparationStage"] == ""


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_unknown_section_and_yes_details_validation(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "ipo-setup.validate@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]

    unknown = await auth_client.patch(
        f"{BASE}/sections/not-a-section",
        headers=headers,
        json={"version": version, "data": {}},
    )
    assert unknown.status_code == 404

    declarations = init.json()["payload"]["eligibilityDeclarations"]
    declarations["admittedIbcAgainstIssuer"] = "yes"
    declarations["admittedIbcAgainstIssuerDetails"] = []
    invalid = await auth_client.patch(
        f"{BASE}/sections/eligibility-declarations",
        headers=headers,
        json={"version": version, "data": declarations},
    )
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "IPO_SETUP_VALIDATION_FAILED"
