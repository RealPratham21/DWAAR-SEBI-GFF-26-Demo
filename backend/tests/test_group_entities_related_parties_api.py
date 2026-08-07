"""Postgres API and logic tests for Group Entities & Related Parties persistence."""

import pytest
from httpx import AsyncClient

from app.modules.group_entities_related_parties.assessment import assess_group_entities
from app.modules.group_entities_related_parties.constants import SECTION_IDS
from app.modules.group_entities_related_parties.defaults import (
    clone_empty_payload,
    create_empty_entity_record,
    create_empty_ownership_relationship_record,
    create_empty_related_party_relationship_record,
    create_empty_rpt_transaction_record,
)
from app.modules.group_entities_related_parties.progress import calculate_group_entities_progress
from app.modules.group_entities_related_parties.references import count_entity_references
from app.modules.group_entities_related_parties.rpt import calculate_rpt_summary
from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/group-entities-related-parties"


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
    assert payload["groupStructureAndEntityMaster"]["entities"] == []
    assert payload["changesRptReadinessAndConfirmations"]["confirmations"]["rptRegisterComplete"] == ""


def test_progress_for_empty_payload() -> None:
    progress = calculate_group_entities_progress(clone_empty_payload())
    assert progress["totalSections"] == 8
    assert progress["sectionsComplete"] == 0
    assert progress["overallStatus"] == "not_started"


def test_rpt_calculation_uses_decimal_strings() -> None:
    payload = clone_empty_payload()
    rp = create_empty_related_party_relationship_record("rp-1")
    payload["relatedPartyUniverseAndClassification"]["relatedPartyRelationships"] = [rp]

    tx = create_empty_rpt_transaction_record("tx-1")
    tx["relatedPartyRelationshipId"] = "rp-1"
    tx["financialPeriod"] = "FY2024"
    tx["transactionType"] = "sale-of-goods-materials"
    tx["transactionValue"] = "100"
    payload["relatedPartyTransactionsBalancesAndCommitments"]["transactions"] = [tx]

    summary = calculate_rpt_summary(payload, {"financialsKpis": {"available": False}})
    assert summary["rptSales"] == "100"
    assert summary["totalByFinancialYear"]["FY2024"] == "100"


def test_entity_reference_blocking_message() -> None:
    payload = clone_empty_payload()
    entity = create_empty_entity_record("entity-1")
    entity["identity"]["legalName"] = "Test Subsidiary Pvt Ltd"
    payload["groupStructureAndEntityMaster"]["entities"] = [entity]

    rel = create_empty_ownership_relationship_record("rel-1")
    rel["investeeEntityId"] = "entity-1"
    payload["ownershipControlAndRelationshipMapping"]["ownershipRelationships"] = [rel]

    deps = count_entity_references(payload, "entity-1")
    assert len(deps) > 0


def test_assessment_states_for_empty_payload() -> None:
    assessment = assess_group_entities(clone_empty_payload(), {})
    assert assessment["result"] in {
        "insufficient_information",
        "readiness_in_progress",
        "pending_linked_workstream",
    }
    assert len(assessment["criteria"]) > 0
    assert len(assessment["groups"]) > 0


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "group-entities.init@example.com")

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
async def test_entity_deletion_blocked_when_referenced(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "group-entities.delete@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    entity = create_empty_entity_record("entity-block-1")
    entity["entityType"] = "indian-company"
    entity["identity"]["legalName"] = "Blocked Entity Pvt Ltd"
    entity_section = payload["groupStructureAndEntityMaster"]
    entity_section["entities"] = [entity]
    entity_section["groupSnapshot"]["structureAsOfDate"] = "2024-03-31"
    entity_section["groupSnapshot"]["subsidiariesExist"] = "yes"

    save_entities = await auth_client.patch(
        f"{BASE}/sections/group-structure-and-entity-master",
        headers=headers,
        json={"version": version, "data": entity_section},
    )
    assert save_entities.status_code == 200
    version = save_entities.json()["version"]
    payload = save_entities.json()["payload"]

    ownership_section = payload["ownershipControlAndRelationshipMapping"]
    rel = create_empty_ownership_relationship_record("rel-block-1")
    rel["investeeEntityId"] = "entity-block-1"
    rel["relationshipType"] = "subsidiary"
    ownership_section["ownershipRelationships"] = [rel]

    save_ownership = await auth_client.patch(
        f"{BASE}/sections/ownership-control-and-relationship-mapping",
        headers=headers,
        json={"version": version, "data": ownership_section},
    )
    assert save_ownership.status_code == 200
    version = save_ownership.json()["version"]
    payload = save_ownership.json()["payload"]

    entity_section = payload["groupStructureAndEntityMaster"]
    entity_section["entities"] = []
    blocked = await auth_client.patch(
        f"{BASE}/sections/group-structure-and-entity-master",
        headers=headers,
        json={"version": version, "data": entity_section},
    )
    assert blocked.status_code == 422
    assert blocked.json()["error"]["code"] == "GROUP_ENTITIES_VALIDATION_FAILED"
    assert "entities" in blocked.json()["error"]["details"]["fieldErrors"]
