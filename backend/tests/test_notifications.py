import pytest
from httpx import AsyncClient

from tests.test_company_incorporation import _register_and_submit


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_notifications_require_auth(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/notifications")
    assert response.status_code == 401


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_section_save_creates_notification(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "notifications.save@example.com")
    init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    version = init.json()["version"]
    identity = init.json()["payload"]["identity"]
    identity["incorporationCity"] = "Mumbai"

    save = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={"version": version, "data": identity},
    )
    assert save.status_code == 200, save.text
    body = save.json()
    assert body["acknowledgement"]["message"] == (
        "Your Company & Incorporation information was saved successfully."
    )
    assert body["notification"]["title"] == "Legal Identity saved"
    assert body["notification"]["notificationType"] == "workstream_save"
    assert body["notification"]["readAt"] is None

    listed = await auth_client.get("/api/v1/notifications", headers=headers)
    assert listed.status_code == 200
    payload = listed.json()
    assert payload["unreadCount"] == 1
    assert payload["notifications"][0]["id"] == body["notification"]["id"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_mark_notification_read(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "notifications.read@example.com")
    init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    identity = init.json()["payload"]["identity"]
    save = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={"version": init.json()["version"], "data": identity},
    )
    notification_id = save.json()["notification"]["id"]

    read = await auth_client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=headers,
    )
    assert read.status_code == 200
    assert read.json()["readAt"] is not None

    listed = await auth_client.get("/api/v1/notifications", headers=headers)
    assert listed.json()["unreadCount"] == 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_mark_all_notifications_read(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "notifications.read-all@example.com")
    init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    version = init.json()["version"]
    identity = init.json()["payload"]["identity"]

    await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers,
        json={"version": version, "data": identity},
    )
    await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/corporate-history",
        headers=headers,
        json={"version": version + 1, "data": {"corporateEvents": []}},
    )

    before = await auth_client.get("/api/v1/notifications", headers=headers)
    assert before.json()["unreadCount"] == 2

    mark_all = await auth_client.patch("/api/v1/notifications/read-all", headers=headers)
    assert mark_all.status_code == 200
    assert mark_all.json()["updatedCount"] == 2

    after = await auth_client.get("/api/v1/notifications", headers=headers)
    assert after.json()["unreadCount"] == 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_users_cannot_access_other_users_notifications(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "notifications.user-a@example.com")
    headers_b = await _register_and_submit(auth_client, "notifications.user-b@example.com")

    init = await auth_client.post(
        "/api/v1/workstreams/company-incorporation/workspace",
        headers=headers_a,
    )
    save = await auth_client.patch(
        "/api/v1/workstreams/company-incorporation/sections/legal-identity",
        headers=headers_a,
        json={
            "version": init.json()["version"],
            "data": init.json()["payload"]["identity"],
        },
    )
    notification_id = save.json()["notification"]["id"]

    forbidden = await auth_client.patch(
        f"/api/v1/notifications/{notification_id}/read",
        headers=headers_b,
    )
    assert forbidden.status_code == 404

    listed = await auth_client.get("/api/v1/notifications", headers=headers_b)
    assert listed.json()["notifications"] == []
    assert listed.json()["unreadCount"] == 0
