"""Postgres API and logic tests for Litigation, Approvals & Compliance persistence."""

import pytest
from httpx import AsyncClient

from app.modules.litigation_approvals_compliance.assessment import assess_litigation_approvals_compliance
from app.modules.litigation_approvals_compliance.compute import compute_litigation_approvals_compliance_model
from app.modules.litigation_approvals_compliance.constants import SECTION_IDS
from app.modules.litigation_approvals_compliance.defaults import (
    clone_empty_payload,
    create_empty_matter_record,
    create_empty_regulatory_action_record,
)
from app.modules.litigation_approvals_compliance.progress import (
    calculate_litigation_approvals_compliance_progress,
)
from app.modules.litigation_approvals_compliance.references import count_matter_references
from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/litigation-approvals-compliance"


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
    assert payload["litigationAndProceedingsMaster"]["matters"] == []
    assert (
        payload["reconciliationRemediationAndIssuerConfirmations"]["confirmations"][
            "allCriminalProceedingsInvolvingRelevantPartiesDisclosed"
        ]
        == ""
    )


def test_progress_for_empty_payload() -> None:
    progress = calculate_litigation_approvals_compliance_progress(clone_empty_payload())
    assert progress["totalSections"] == 8
    assert progress["sectionsComplete"] == 0
    assert progress["overallStatus"] == "not_started"


def test_matter_exposure_uses_decimal_strings() -> None:
    payload = clone_empty_payload()
    matter = create_empty_matter_record("matter-1")
    matter["identity"]["matterTitle"] = "Tax demand matter"
    matter["identity"]["category"] = "tax"
    matter["amounts"]["principalClaim"] = "100"
    matter["amounts"]["interest"] = "10.5"
    payload["litigationAndProceedingsMaster"]["matters"] = [matter]

    model = compute_litigation_approvals_compliance_model(payload, {})
    assert model["matterCount"] == 1
    assert model["exposureByCurrency"][0]["totalExposure"] == "110.5"


def test_matter_reference_blocking_message() -> None:
    payload = clone_empty_payload()
    matter = create_empty_matter_record("matter-block-1")
    matter["identity"]["matterTitle"] = "Blocked Matter"
    payload["litigationAndProceedingsMaster"]["matters"] = [matter]

    action = create_empty_regulatory_action_record("action-1")
    action["matterId"] = "matter-block-1"
    payload["criminalRegulatoryTaxAndEnforcementReadiness"]["regulatoryActions"] = [action]

    deps = count_matter_references(payload, "matter-block-1")
    assert len(deps) > 0


def test_assessment_states_for_empty_payload() -> None:
    assessment = assess_litigation_approvals_compliance(clone_empty_payload(), {})
    assert assessment["result"] in {
        "insufficient_information",
        "broadly_reconciled",
        "pending_linked_workstream",
    }
    assert len(assessment["criteria"]) > 0
    assert len(assessment["groups"]) > 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "lac.init@example.com")

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
async def test_matter_deletion_blocked_when_referenced(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "lac.delete@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    matter = create_empty_matter_record("matter-block-1")
    matter["identity"]["matterTitle"] = "Blocked Matter"
    matter["identity"]["category"] = "tax"
    matters_section = payload["litigationAndProceedingsMaster"]
    matters_section["matters"] = [matter]

    save_matter = await auth_client.patch(
        f"{BASE}/sections/litigation-and-proceedings-master",
        headers=headers,
        json={"version": version, "data": matters_section},
    )
    assert save_matter.status_code == 200, save_matter.text
    version = save_matter.json()["version"]

    criminal_section = save_matter.json()["payload"]["criminalRegulatoryTaxAndEnforcementReadiness"]
    action = create_empty_regulatory_action_record("action-1")
    action["matterId"] = "matter-block-1"
    action["authority"] = "Income Tax Department"
    criminal_section["regulatoryActions"] = [action]

    save_criminal = await auth_client.patch(
        f"{BASE}/sections/criminal-regulatory-tax-and-enforcement-readiness",
        headers=headers,
        json={"version": version, "data": criminal_section},
    )
    assert save_criminal.status_code == 200, save_criminal.text
    version = save_criminal.json()["version"]

    blocked_section = save_criminal.json()["payload"]["litigationAndProceedingsMaster"]
    blocked_section["matters"] = []

    blocked = await auth_client.patch(
        f"{BASE}/sections/litigation-and-proceedings-master",
        headers=headers,
        json={"version": version, "data": blocked_section},
    )
    assert blocked.status_code == 422
    assert "matters" in blocked.json()["details"]["fieldErrors"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_version_conflict_returns_current_state(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "lac.conflict@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    section = payload["legalUniverseMaterialityPolicyAndPartyMapping"]
    section["legalDdSnapshot"]["legalDdAsOfDate"] = "2024-03-31"
    section["legalDdSnapshot"]["litigationExists"] = "yes"

    first_save = await auth_client.patch(
        f"{BASE}/sections/legal-universe-materiality-policy-and-party-mapping",
        headers=headers,
        json={"version": version, "data": section},
    )
    assert first_save.status_code == 200
    assert first_save.json()["version"] == version + 1

    conflict = await auth_client.patch(
        f"{BASE}/sections/legal-universe-materiality-policy-and-party-mapping",
        headers=headers,
        json={"version": version, "data": section},
    )
    assert conflict.status_code == 409
    body = conflict.json()
    assert body["details"]["currentVersion"] == version + 1
    assert "progress" in body["details"]
    assert "computations" in body["details"]
