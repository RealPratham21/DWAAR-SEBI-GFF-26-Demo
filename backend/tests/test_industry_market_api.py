"""Postgres API and logic tests for Industry & Market persistence."""

import pytest
from httpx import AsyncClient

from app.modules.industry_market.claims import derive_claim_status, detect_unsupported_claim_wording
from app.modules.industry_market.defaults import clone_empty_payload, create_empty_claim_record
from app.modules.industry_market.market_series import (
    calculate_cagr,
    calculate_yoy_growth,
    reconcile_reported_vs_calculated_cagr,
    reconcile_segment_percentages,
)
from app.modules.industry_market.market_share import calculate_market_share, validate_market_share_record
from app.modules.industry_market.references import count_source_references
from app.modules.industry_market.sources import evaluate_source_freshness, get_source_freshness_rules
from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/industry-market"


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


def _sample_source(source_id: str = "src-1") -> dict:
    return {
        "id": source_id,
        "sourceType": "public-research-report",
        "title": "Industry Report 2024",
        "publisherAuthor": "Research Co",
        "publicationDate": "2024-01-15",
        "dataCutOffDate": "2023-12-31",
        "version": "1.0",
        "urlReference": "https://example.com/report",
        "pageSectionReference": "p. 12",
        "dateAccessed": "2024-02-01",
        "geographyCovered": "India",
        "industryCovered": "Widgets",
        "historicalPeriodCovered": "FY2019-FY2023",
        "forecastPeriodCovered": "FY2024-FY2028",
        "currency": "INR",
        "unit": "revenue",
        "dataNature": "estimated",
        "commissionedReportDetails": {
            "researchProvider": "",
            "commissionedByIssuer": "",
            "commissionedByPromoter": "",
            "commissionedBySellingShareholder": "",
            "whoPaid": "",
            "engagementDate": "",
            "reportDate": "",
            "purpose": "",
            "feePaymentStatus": "",
            "independenceConfirmed": "",
            "relationshipWithIssuerPromotersDirectorsKmpBrlm": "",
            "consentNoObjectionStatus": "",
            "consentDateReference": "",
            "publicAvailabilityStatus": "",
            "proposedWebsiteLocation": "",
            "includedProposedAsMaterialDocument": "",
            "providerDisclaimerCaptured": "",
            "riskFactorDisclosureStatus": "",
            "professionalReviewStatus": "",
        },
        "methodology": {
            "primaryResearchUsed": "no",
            "secondaryResearchUsed": "yes",
            "sampleSize": "",
            "surveyPopulation": "",
            "dataSources": "",
            "calculationMethodology": "",
            "forecastMethodology": "",
            "keyAssumptions": "",
            "limitations": "",
            "confidenceRange": "",
            "methodologyComparability": "",
            "notes": "",
        },
        "sourceReadinessStatus": "current",
        "notes": "",
    }


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_is_idempotent(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "industry-market.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert first_body["linkedReferences"]["company"]["available"] is False
    assert first_body["progress"]["sectionsComplete"] == 0
    assert first_body["progress"]["totalSections"] == 8

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    assert second.json()["created"] is False
    assert second.json()["id"] == first_body["id"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_unknown_section_returns_error(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "industry-market.unknown@example.com")
    await auth_client.post(f"{BASE}/workspace", headers=headers)

    response = await auth_client.patch(
        f"{BASE}/sections/not-a-real-section",
        headers=headers,
        json={"version": 1, "data": {}},
    )
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "INDUSTRY_MARKET_UNKNOWN_SECTION"


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_save_sources_scope_and_assessment(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "industry-market.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    sources_section = payload["researchSourcesAndIndustryReportGovernance"]
    sources_section["sources"] = [_sample_source()]
    save_sources = await auth_client.patch(
        f"{BASE}/sections/research-sources-and-industry-report-governance",
        headers=headers,
        json={"version": version, "data": sources_section},
    )
    assert save_sources.status_code == 200
    version = save_sources.json()["version"]
    assert save_sources.json()["computations"]["sourceCount"] == 1

    scope_section = payload["industryScopeAndCompanyMarketMapping"]
    scope_section["industryClassification"]["primaryIndustry"] = "Manufacturing"
    scope_section["industryClassification"]["classificationSource"] = "nic"
    scope_section["marketDefinition"]["marketName"] = "Widget market"
    scope_section["marketDefinition"]["geography"] = "india"
    scope_section["marketDefinition"]["marketBoundaryExplanation"] = "Defined boundary"
    save_scope = await auth_client.patch(
        f"{BASE}/sections/industry-scope-and-company-market-mapping",
        headers=headers,
        json={"version": version, "data": scope_section},
    )
    assert save_scope.status_code == 200
    assert save_scope.json()["computations"]["primaryIndustry"] == "Manufacturing"

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["primaryIndustry"] == "Manufacturing"
    assert overview.json()["externalSourceCount"] == 1

    assessment = await auth_client.get(f"{BASE}/industry-assessment", headers=headers)
    assert assessment.status_code == 200
    assert assessment.json()["result"]
    assert len(assessment.json()["groups"]) == 10


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_version_conflict_returns_current_state(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "industry-market.conflict@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    payload = init.json()["payload"]
    version = init.json()["version"]

    scope_section = payload["industryScopeAndCompanyMarketMapping"]
    scope_section["industryClassification"]["primaryIndustry"] = "First save"
    first = await auth_client.patch(
        f"{BASE}/sections/industry-scope-and-company-market-mapping",
        headers=headers,
        json={"version": version, "data": scope_section},
    )
    assert first.status_code == 200

    scope_section["industryClassification"]["primaryIndustry"] = "Stale save"
    conflict = await auth_client.patch(
        f"{BASE}/sections/industry-scope-and-company-market-mapping",
        headers=headers,
        json={"version": version, "data": scope_section},
    )
    assert conflict.status_code == 409
    body = conflict.json()["error"]
    assert body["code"] == "INDUSTRY_MARKET_VERSION_CONFLICT"
    assert body["details"]["currentVersion"] == 2


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_source_deletion_blocked_when_referenced(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "industry-market.source-del@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]
    payload = init.json()["payload"]

    sources_section = payload["researchSourcesAndIndustryReportGovernance"]
    sources_section["sources"] = [_sample_source("src-ref")]
    save_sources = await auth_client.patch(
        f"{BASE}/sections/research-sources-and-industry-report-governance",
        headers=headers,
        json={"version": version, "data": sources_section},
    )
    assert save_sources.status_code == 200
    version = save_sources.json()["version"]
    payload = save_sources.json()["payload"]

    macro_section = payload["macroeconomicAndIndustryContext"]
    macro_section["macroeconomicIndicators"] = [
        {
            "id": "macro-1",
            "indicatorName": "GDP growth",
            "category": "gdp-growth",
            "geography": "India",
            "period": "FY2024",
            "value": "7.2",
            "unit": "%",
            "actualEstimateForecast": "actual",
            "sourceId": "src-ref",
            "relevanceExplanation": "Relevant",
            "notes": "",
        },
    ]
    save_macro = await auth_client.patch(
        f"{BASE}/sections/macroeconomic-and-industry-context",
        headers=headers,
        json={"version": version, "data": macro_section},
    )
    assert save_macro.status_code == 200
    version = save_macro.json()["version"]
    payload = save_macro.json()["payload"]

    sources_section = payload["researchSourcesAndIndustryReportGovernance"]
    sources_section["sources"] = []
    blocked = await auth_client.patch(
        f"{BASE}/sections/research-sources-and-industry-report-governance",
        headers=headers,
        json={"version": version, "data": sources_section},
    )
    assert blocked.status_code == 422
    assert blocked.json()["error"]["code"] == "INDUSTRY_MARKET_VALIDATION_FAILED"
    assert "sources" in blocked.json()["error"]["details"]["fieldErrors"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_invalid_enum_rejected(auth_client: AsyncClient) -> None:
    headers = await _register_and_submit(auth_client, "industry-market.enum@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    payload = init.json()["payload"]

    scope_section = payload["industryScopeAndCompanyMarketMapping"]
    scope_section["marketDefinition"]["geography"] = "invalid-geography"
    response = await auth_client.patch(
        f"{BASE}/sections/industry-scope-and-company-market-mapping",
        headers=headers,
        json={"version": init.json()["version"], "data": scope_section},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INDUSTRY_MARKET_VALIDATION_FAILED"


def test_decimal_helpers_match_frontend() -> None:
    assert calculate_yoy_growth("110", "100") == "10"
    assert calculate_cagr("100", "121", 2) == "10.00"
    reconciliation = reconcile_reported_vs_calculated_cagr("12", calculate_cagr("100", "121", 2))
    assert reconciliation["difference"] != ""
    assert calculate_market_share("25", "100") == "25"

    results = reconcile_segment_percentages(
        [
            {
                "id": "seg-1",
                "parentMarketSeriesId": "series-1",
                "period": "FY2024",
                "marketSharePercentage": "60",
            },
            {
                "id": "seg-2",
                "parentMarketSeriesId": "series-1",
                "period": "FY2024",
                "marketSharePercentage": "50",
            },
        ],
    )
    assert results[0]["reconciles"] is False
    assert results[0]["flags"]


def test_claim_and_source_reference_logic() -> None:
    payload = clone_empty_payload()
    source = _sample_source("src-claim")
    payload["researchSourcesAndIndustryReportGovernance"]["sources"] = [source]
    payload["macroeconomicAndIndustryContext"]["macroeconomicIndicators"] = [
        {
            "id": "macro-1",
            "indicatorName": "GDP",
            "category": "gdp",
            "geography": "India",
            "period": "FY2024",
            "value": "7",
            "unit": "%",
            "actualEstimateForecast": "actual",
            "sourceId": "src-claim",
            "relevanceExplanation": "Relevant",
            "notes": "",
        },
    ]

    refs = count_source_references(payload, "src-claim")
    assert refs["total"] > 0

    claim = create_empty_claim_record()
    claim["exactProposedWording"] = "Leading player in India"
    claim["claimType"] = "leading"
    assert derive_claim_status(claim, payload) == "do_not_use"
    assert "largest" in detect_unsupported_claim_wording("largest player in India")

    rules = get_source_freshness_rules()
    assert rules["rulesVersion"] == 1
    assert rules["rulesAsOf"]
    freshness = evaluate_source_freshness(source)
    assert freshness["suggestedReadinessStatus"]


def test_market_share_period_mismatch_flag() -> None:
    payload = clone_empty_payload()
    payload["marketSizeSegmentationAndGrowth"]["marketSeries"] = [
        {
            "id": "series-1",
            "marketName": "Widget market",
            "marketDefinition": "",
            "geography": "india",
            "metric": "revenue-value",
            "currency": "INR",
            "unit": "",
            "nominalReal": "",
            "primarySourceId": "",
            "methodologyReference": "",
            "periodValues": [
                {
                    "id": "pv-1",
                    "period": "FY2024",
                    "value": "100",
                    "actualEstimateForecast": "actual",
                    "sourceId": "",
                    "notes": "",
                },
            ],
            "forecastMetadata": {
                "forecastStartPeriod": "",
                "forecastEndPeriod": "",
                "forecastValue": "",
                "reportedCagr": "",
                "forecastSourceId": "",
                "keyAssumptions": "",
                "forecastMethodology": "",
                "forecastDate": "",
                "scenario": "",
            },
            "notes": "",
        },
    ]
    record = {
        "id": "share-1",
        "metricBasis": "revenue",
        "marketDefinition": "Widget market",
        "geography": "india",
        "segment": "",
        "period": "FY2023",
        "issuerNumerator": "10",
        "numeratorSource": "",
        "linkedIssuerRecordId": "",
        "totalMarketDenominator": "100",
        "denominatorSourceId": "src-1",
        "reportedMarketShare": "",
        "independentVerificationStatus": "",
        "professionalConfirmationStatus": "",
        "notes": "",
    }
    flags = validate_market_share_record(record, payload)
    assert flags["periodMismatch"] is True
