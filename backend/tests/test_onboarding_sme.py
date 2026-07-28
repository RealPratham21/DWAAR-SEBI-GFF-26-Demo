
import pytest
from httpx import AsyncClient

from tests.conftest import register_payload


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_create_sme_onboarding_returns_application(auth_client: AsyncClient) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    token = register.json()["accessToken"]

    response = await auth_client.post(
        "/api/v1/onboarding/sme",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "draft"
    assert payload["currentStep"] == "role_authority"
    assert "roleAuthority" in payload["draftData"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_create_sme_onboarding_is_idempotent(auth_client: AsyncClient) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    first = await auth_client.post("/api/v1/onboarding/sme", headers=headers)
    second = await auth_client.post("/api/v1/onboarding/sme", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_role_authority_step_persists(auth_client: AsyncClient) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    created = await auth_client.post("/api/v1/onboarding/sme", headers=headers)
    onboarding_id = created.json()["id"]

    step_payload = {
        "designation": "Managing Director",
        "relationship": "director",
        "relationshipOther": "",
        "authorisedSignatory": "yes",
        "basisOfAuthority": "board-resolution",
        "basisOfAuthorityOther": "",
        "primaryOnboardingContact": "yes",
        "addAlternateContact": False,
        "alternateContact": {
            "fullName": "",
            "designation": "",
            "email": "",
            "mobile": "",
        },
    }

    saved = await auth_client.patch(
        f"/api/v1/onboarding/sme/{onboarding_id}/role-authority",
        headers=headers,
        json=step_payload,
    )
    assert saved.status_code == 200
    body = saved.json()
    assert body["status"] == "in_progress"
    assert body["currentStep"] == "company_identity"
    assert "role_authority" in body["completedSteps"]
    assert body["draftData"]["roleAuthority"]["designation"] == "Managing Director"

    current = await auth_client.get("/api/v1/onboarding/sme/current", headers=headers)
    assert current.status_code == 200
    assert current.json()["draftData"]["roleAuthority"]["designation"] == "Managing Director"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_submit_onboarding_requires_completed_steps(auth_client: AsyncClient) -> None:
    register = await auth_client.post("/api/v1/auth/register", json=register_payload())
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    created = await auth_client.post("/api/v1/onboarding/sme", headers=headers)
    onboarding_id = created.json()["id"]

    response = await auth_client.post(
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
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "ONBOARDING_INCOMPLETE"


def _full_onboarding_steps() -> list[tuple[str, str, dict]]:
    return [
        (
            "role-authority",
            "role_authority",
            {
                "designation": "Managing Director",
                "relationship": "director",
                "relationshipOther": "",
                "authorisedSignatory": "yes",
                "basisOfAuthority": "board-resolution",
                "basisOfAuthorityOther": "",
                "primaryOnboardingContact": "yes",
                "addAlternateContact": False,
                "alternateContact": {
                    "fullName": "",
                    "designation": "",
                    "email": "",
                    "mobile": "",
                },
            },
        ),
        (
            "company-identity",
            "company_identity",
            {
                "legalName": "Acme Components Private Limited",
                "cin": "U12345MH2020PTC123456",
                "incorporationDate": "2020-01-15",
                "companyClass": "private",
                "registeredState": "Maharashtra",
                "registrarOfCompanies": "Registrar of Companies, Mumbai",
                "registeredOffice": {
                    "addressLine1": "123 Industrial Estate",
                    "addressLine2": "",
                    "locality": "Andheri",
                    "city": "Mumbai",
                    "district": "Mumbai Suburban",
                    "state": "Maharashtra",
                    "pinCode": "400001",
                    "country": "India",
                },
                "companyEmail": "info@acme.example.com",
                "companyWebsite": "",
            },
        ),
        (
            "business-classification",
            "business_classification",
            {
                "primaryIndustry": "manufacturing",
                "primaryIndustryOther": "",
                "businessSector": "Precision components",
                "operationsDescription": (
                    "Manufacturing precision components for automotive OEMs across India."
                ),
                "pan": "ABCDE1234F",
                "gstRegistrationRequired": "no",
                "gstRegistrations": [],
                "udyamRegistration": "",
                "importExportCode": "",
                "employeeCountRange": "51-100",
            },
        ),
        (
            "ownership-snapshot",
            "ownership_snapshot",
            {
                "promoterCount": "2",
                "directorCount": "3",
                "promoterHoldingPercent": "75",
                "nonPromoterHoldingPercent": "25",
                "institutionalShareholdersPresent": "no",
                "foreignShareholdersPresent": "no",
                "promoterGroupEntitiesPresent": "no",
            },
        ),
        (
            "ipo-intent",
            "ipo_intent",
            {
                "proposedIssueType": "fresh-issue",
                "issueSizeCrore": "50",
                "issueSizeNotDecided": False,
                "targetTimeline": "6-12-months",
                "intendedExchange": "nse-emerge",
                "primaryPurposes": ["capital-expenditure"],
                "primaryPurposeOther": "",
                "merchantBankerAppointed": "no",
                "merchantBankerName": "",
                "preparationStage": "internal-preparation",
            },
        ),
        (
            "initial-documents",
            "initial_documents",
            {
                "selections": {
                    "certificate-of-incorporation": {
                        "fileName": "coi.pdf",
                        "fileSize": 1024,
                        "mimeType": "application/pdf",
                    },
                    "current-moa": None,
                    "current-aoa": None,
                    "pan": None,
                    "latest-audited-financials": None,
                    "representative-authorisation": None,
                },
                "skippedForNow": True,
            },
        ),
    ]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_full_onboarding_submit_and_auth_state(auth_client: AsyncClient) -> None:
    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email="onboarding.complete@example.com"),
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
    assert submit.json()["nextAction"] == "open_dashboard"
    assert submit.json()["redirectTo"] == "/projects/demo"

    me = await auth_client.get("/api/v1/auth/me", headers=headers)
    assert me.json()["nextAction"] == "open_dashboard"
    assert me.json()["redirectTo"] == "/projects/demo"
