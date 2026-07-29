import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps


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
async def test_initialize_workspace_prefills_from_onboarding(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "company-inc.init@example.com")

    response = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["created"] is True
    assert body["initializedFromOnboarding"] is True
    assert body["version"] == 1

    identity = body["payload"]["identity"]
    assert identity["legalName"] == "Acme Components Private Limited"
    assert identity["cin"] == "U12345MH2020PTC123456"
    assert identity["incorporationState"] == "Maharashtra"
    assert identity["email"] == "info@acme.example.com"
    assert identity["incorporationCity"] == ""
    assert identity["companyCategory"] == ""

    offices = body["payload"]["offices"]
    assert len(offices) == 1
    assert offices[0]["officeType"] == "registered-office"
    assert offices[0]["addressLine1"] == "123 Industrial Estate"
    assert offices[0]["occupancyType"] == ""

    registrations = body["payload"]["registrations"]
    assert len(registrations) == 1
    assert registrations[0]["registrationType"] == "pan"
    assert registrations[0]["registrationNumber"] == "ABCDE1234F"

    assert body["progress"]["sectionsComplete"] >= 1


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "company-inc.idempotent@example.com")

    first = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    assert first.status_code == 200
    first_body = first.json()

    second = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["payload"] == first_body["payload"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_legal_identity_persists_and_increments_version(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "company-inc.save@example.com")
    init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    version = init.json()["version"]
    identity = init.json()["payload"]["identity"]
    identity["incorporationCity"] = "Mumbai"
    identity["companyCategory"] = "company-limited-by-shares"
    identity["companySubCategory"] = "non-government-company"
    identity["companyStatus"] = "active"
    identity["listedStatus"] = "unlisted"
    identity["governingAct"] = "companies-act-2013"
    identity["telephone"] = "9876543210"

    save = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={"version": version, "data": identity},
    )
    assert save.status_code == 200, save.text
    save_body = save.json()
    assert save_body["version"] == version + 1
    assert save_body["payload"]["identity"]["incorporationCity"] == "Mumbai"

    fetch = await auth_client.get(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    assert fetch.json()["payload"]["identity"]["incorporationCity"] == "Mumbai"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_rejects_stale_version(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "company-inc.conflict@example.com")
    init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    identity = init.json()["payload"]["identity"]

    first = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={"version": 1, "data": {**identity, "incorporationCity": "Mumbai"}},
    )
    assert first.status_code == 200

    stale = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={"version": 1, "data": {**identity, "incorporationCity": "Pune"}},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "COMPANY_INCORPORATION_VERSION_CONFLICT"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_dashboard_bootstrap_includes_company_incorporation_progress(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "company-inc.dashboard@example.com")

    bootstrap_before = await auth_client.get("/api/v1/dashboard/bootstrap", headers=headers)
    assert bootstrap_before.json()["companyIncorporation"]["overallStatus"] == "not_started"

    await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )

    bootstrap_after = await auth_client.get("/api/v1/dashboard/bootstrap", headers=headers)
    progress = bootstrap_after.json()["companyIncorporation"]
    assert progress["totalSections"] == 6
    assert progress["sectionsComplete"] >= 1
    assert progress["overallStatus"] in {"in_progress", "complete"}
