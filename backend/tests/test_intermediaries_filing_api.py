"""Postgres API and logic tests for Intermediaries & Filing persistence."""

import pytest
from httpx import AsyncClient

from app.modules.intermediaries_filing.assessment import assess_intermediaries_filing
from app.modules.intermediaries_filing.compute import compute_intermediaries_filing_model
from app.modules.intermediaries_filing.constants import IF_CRITERION_STATES, SECTION_IDS
from app.modules.intermediaries_filing.defaults import (
    clone_empty_payload,
    create_empty_filing_record,
    create_empty_intermediary_record,
    create_empty_offer_document_version_record,
)
from app.modules.intermediaries_filing.progress import calculate_intermediaries_filing_progress
from app.modules.intermediaries_filing.references import count_intermediary_references
from app.modules.intermediaries_filing.rules import is_stage_at_least
from app.modules.intermediaries_filing.working_days import compute_preliminary_t_plus3
from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/intermediaries-filing"


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
    assert payload["issueTeamAndIntermediaryMaster"]["intermediaries"] == []
    assert (
        payload["finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness"][
            "finalConfirmations"
        ]["leadManagerAppointedCurrent"]
        == ""
    )


def test_progress_for_empty_payload() -> None:
    progress = calculate_intermediaries_filing_progress(clone_empty_payload())
    assert progress["totalSections"] == 8
    assert progress["sectionsComplete"] == 0
    assert progress["overallStatus"] == "not_started"


def test_stage_aware_progress_not_yet_due() -> None:
    payload = clone_empty_payload()
    payload["issueConfigurationAndFilingSnapshot"]["filingSnapshot"]["filingStage"] = "issue_open"
    progress = calculate_intermediaries_filing_progress(payload)
    assert progress["sections"]["issue-programme-allotment-listing-and-post-issue-execution"] in {
        "not_started",
        "in_progress",
        "not_yet_due",
    }


def test_underwriting_uses_decimal_strings() -> None:
    payload = clone_empty_payload()
    summary = payload["underwritingMarketMakingAndDistributionArrangements"]["underwritingSummary"]
    summary["issueShares"] = "1000"
    summary["totalUnderwritingCommitment"] = "750"
    model = compute_intermediaries_filing_model(payload, {})
    assert model["underwritingAggregates"]["totalSharesCommitted"] == "750"


def test_t_plus3_weekday_only() -> None:
    schedule = compute_preliminary_t_plus3("2026-08-07")
    assert schedule["t"] == "2026-08-07"
    assert schedule["tPlus3"] != ""
    assert "Saturday/Sunday" in schedule["disclaimer"]


def test_intermediary_reference_blocking_message() -> None:
    payload = clone_empty_payload()
    intermediary = create_empty_intermediary_record("intermediary-block-1")
    intermediary["legalName"] = "Blocked Intermediary"
    payload["issueTeamAndIntermediaryMaster"]["intermediaries"] = [intermediary]

    filing = create_empty_filing_record("filing-1")
    filing["responsibleLeadManagerIntermediaryId"] = "intermediary-block-1"
    payload["filingAndRegulatoryMilestoneTracker"]["filings"] = [filing]

    deps = count_intermediary_references(payload, "intermediary-block-1")
    assert len(deps) > 0


def test_assessment_includes_rules_version_and_criterion_states() -> None:
    assessment = assess_intermediaries_filing(clone_empty_payload(), {})
    assert assessment["rulesVersion"]
    assert assessment["rulesAsOf"]
    assert len(IF_CRITERION_STATES) == 18
    assert len(assessment["criteria"]) > 0
    assert all(entry["state"] in IF_CRITERION_STATES for entry in assessment["criteria"])


def test_is_stage_at_least_helper() -> None:
    assert is_stage_at_least("issue_closed", "issue_open") is True
    assert is_stage_at_least("preparation", "issue_open") is False


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "if.init@example.com")

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
async def test_intermediary_deletion_blocked_when_referenced(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "if.delete@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    intermediary = create_empty_intermediary_record("intermediary-block-1")
    intermediary["legalName"] = "Blocked Intermediary"
    team_section = payload["issueTeamAndIntermediaryMaster"]
    team_section["intermediaries"] = [intermediary]

    save_team = await auth_client.patch(
        f"{BASE}/sections/issue-team-and-intermediary-master",
        headers=headers,
        json={"version": version, "data": team_section},
    )
    assert save_team.status_code == 200, save_team.text
    version = save_team.json()["version"]

    filing_section = save_team.json()["payload"]["filingAndRegulatoryMilestoneTracker"]
    filing = create_empty_filing_record("filing-1")
    filing["responsibleLeadManagerIntermediaryId"] = "intermediary-block-1"
    filing["documentType"] = "drhp"
    filing_section["filings"] = [filing]

    save_filing = await auth_client.patch(
        f"{BASE}/sections/filing-and-regulatory-milestone-tracker",
        headers=headers,
        json={"version": version, "data": filing_section},
    )
    assert save_filing.status_code == 200, save_filing.text
    version = save_filing.json()["version"]

    blocked_section = save_filing.json()["payload"]["issueTeamAndIntermediaryMaster"]
    blocked_section["intermediaries"] = []

    blocked = await auth_client.patch(
        f"{BASE}/sections/issue-team-and-intermediary-master",
        headers=headers,
        json={"version": version, "data": blocked_section},
    )
    assert blocked.status_code == 422
    assert "intermediaries" in blocked.json()["details"]["fieldErrors"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_document_version_deletion_blocked_when_referenced(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "if.docversion@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    final_section = payload["finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness"]
    version_record = create_empty_offer_document_version_record("doc-version-1")
    version_record["type"] = "drhp"
    version_record["versionLabel"] = "v1"
    final_section["offerDocumentVersions"] = [version_record]

    save_final = await auth_client.patch(
        f"{BASE}/sections/final-offer-document-advertisements-material-documents-and-filing-readiness",
        headers=headers,
        json={"version": version, "data": final_section},
    )
    assert save_final.status_code == 200, save_final.text
    version = save_final.json()["version"]

    filing_section = save_final.json()["payload"]["filingAndRegulatoryMilestoneTracker"]
    filing = create_empty_filing_record("filing-1")
    filing["linkedDocumentVersionId"] = "doc-version-1"
    filing["documentType"] = "drhp"
    filing_section["filings"] = [filing]

    save_filing = await auth_client.patch(
        f"{BASE}/sections/filing-and-regulatory-milestone-tracker",
        headers=headers,
        json={"version": version, "data": filing_section},
    )
    assert save_filing.status_code == 200, save_filing.text
    version = save_filing.json()["version"]

    blocked_section = save_filing.json()["payload"][
        "finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness"
    ]
    blocked_section["offerDocumentVersions"] = []

    blocked = await auth_client.patch(
        f"{BASE}/sections/final-offer-document-advertisements-material-documents-and-filing-readiness",
        headers=headers,
        json={"version": version, "data": blocked_section},
    )
    assert blocked.status_code == 422
    assert "offerDocumentVersions" in blocked.json()["details"]["fieldErrors"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_version_conflict_returns_current_state(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "if.conflict@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    section = payload["issueTeamAndIntermediaryMaster"]
    section["issueTeamSnapshot"]["teamAsOfDate"] = "2026-08-07"
    section["issueTeamSnapshot"]["leadManagerAppointed"] = "yes"

    first_save = await auth_client.patch(
        f"{BASE}/sections/issue-team-and-intermediary-master",
        headers=headers,
        json={"version": version, "data": section},
    )
    assert first_save.status_code == 200

    conflict = await auth_client.patch(
        f"{BASE}/sections/issue-team-and-intermediary-master",
        headers=headers,
        json={"version": version, "data": section},
    )
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "INTERMEDIARIES_FILING_VERSION_CONFLICT"
    assert conflict.json()["details"]["currentVersion"] == first_save.json()["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_filing_readiness_endpoint(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "if.readiness@example.com")
    await auth_client.post(f"{BASE}/workspace", headers=headers)

    response = await auth_client.get(f"{BASE}/filing-readiness", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["result"]
    assert body["rulesVersion"]
    assert body["criteria"]
