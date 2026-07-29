import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps


async def _submit_full_onboarding(auth_client: AsyncClient, headers: dict[str, str]) -> None:
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


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_dashboard_bootstrap_requires_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/dashboard/bootstrap")
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_dashboard_bootstrap_rejects_incomplete_onboarding(auth_client: AsyncClient) -> None:
    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email="bootstrap.incomplete@example.com"),
    )
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await auth_client.get("/api/v1/dashboard/bootstrap", headers=headers)
    assert response.status_code == 403
    body = response.json()
    assert body["error"]["code"] == "ONBOARDING_NOT_SUBMITTED"
    assert body["error"]["details"]["nextAction"] == "start_sme_onboarding"
    assert body["error"]["details"]["redirectTo"] == "/onboarding/sme"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_dashboard_bootstrap_returns_submitted_workspace(auth_client: AsyncClient) -> None:
    register = await auth_client.post(
        "/api/v1/auth/register",
        json=register_payload(email="bootstrap.complete@example.com"),
    )
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    await _submit_full_onboarding(auth_client, headers)

    response = await auth_client.get("/api/v1/dashboard/bootstrap", headers=headers)
    assert response.status_code == 200
    payload = response.json()

    assert payload["user"]["email"] == "bootstrap.complete@example.com"
    assert payload["company"]["legalName"] == "Acme Components Private Limited"
    assert payload["company"]["cin"] == "U12345MH2020PTC123456"
    assert payload["workspace"]["displayName"] == "Acme Components Private Limited"
    assert payload["ownership"]["directorCount"] == 3
    assert payload["ownership"]["promoterHoldingPercent"] == 75.0
    assert payload["onboarding"]["status"] == "submitted"
    assert payload["companyIncorporation"]["overallStatus"] == "not_started"
    assert payload["companyIncorporation"]["totalSections"] == 6
    assert "submissionConfirmations" not in payload
    assert "draftData" not in payload
