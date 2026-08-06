"""Postgres API tests for Business & Operations persistence."""

import pytest
from httpx import AsyncClient

from tests.conftest import register_payload
from tests.test_onboarding_sme import _full_onboarding_steps

BASE = "/api/v1/workstreams/business-operations"


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
    headers = await _register_and_submit(auth_client, "business-operations.init@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["created"] is True
    assert first_body["version"] == 1
    assert first_body["payload"]["schemaVersion"] == 1
    assert first_body["payload"]["productsServicesAndRevenueMix"]["productsServices"] == []
    assert first_body["linkedReferences"]["company"]["available"] is False
    assert first_body["linkedReferences"]["financials"]["available"] is False
    assert first_body["progress"]["sectionsComplete"] == 0
    assert first_body["progress"]["totalSections"] == 8

    second = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["created"] is False
    assert second_body["id"] == first_body["id"]
    assert second_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_initialize_workspace_survives_concurrent_insert(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A parallel initialise must load the existing row, not raise a unique violation."""
    headers = await _register_and_submit(auth_client, "business-operations.race@example.com")

    first = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert first.status_code == 200
    first_body = first.json()

    from app.modules.business_operations import service as business_operations_service

    real_lookup = business_operations_service.get_workspace_for_user
    calls = {"count": 0}

    def lookup_missing_once(db, user_id):  # noqa: ANN001, ANN202
        calls["count"] += 1
        if calls["count"] == 1:
            return None
        return real_lookup(db, user_id)

    monkeypatch.setattr(business_operations_service, "get_workspace_for_user", lookup_missing_once)

    racing = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert racing.status_code == 200, racing.text
    racing_body = racing.json()
    assert racing_body["created"] is False
    assert racing_body["id"] == first_body["id"]
    assert racing_body["version"] == first_body["version"]


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_section_saves_conflict_overview_and_assessment(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "business-operations.save@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    assert init.status_code == 200
    version = init.json()["version"]
    payload = init.json()["payload"]

    # 1. Business profile & operating model
    profile = payload["businessProfileAndOperatingModel"]
    profile.update(
        {
            "businessCommencementDate": "2015-01-01",
            "businessClassifications": ["manufacturing"],
            "primaryBusinessActivity": "Manufacturing of precision components",
            "briefBusinessOverview": "We manufacture precision components for industrial use.",
            "customerModel": "b2b",
            "revenueModels": ["product-sales"],
            "orderModel": "purchase-orders",
            "domesticOperations": "yes",
            "exportOperations": "no",
            "seasonalityOrCyclicality": "no",
            "workingCapitalIntensiveBusiness": "no",
            "materialThirdPartyDependence": "no",
            "materialRegulatoryDependence": "no",
            "valueCreationAndDeliveryExplanation": "We source raw materials and manufacture in-house.",
        }
    )
    profile_save = await auth_client.patch(
        f"{BASE}/sections/business-profile-operating-model",
        headers=headers,
        json={"version": version, "data": profile},
    )
    assert profile_save.status_code == 200, profile_save.text
    saved = profile_save.json()
    assert saved["version"] == version + 1
    assert saved["progress"]["sections"]["business-profile-operating-model"] == "complete"
    assert saved["notification"]["title"] == "Business Profile & Operating Model saved"
    version = saved["version"]

    # 2. Products, services & revenue mix
    products_section = payload["productsServicesAndRevenueMix"]
    product_id = "prod-1"
    products_section["productsServices"] = [
        {
            "id": product_id,
            "name": "Widget A",
            "productType": "product",
            "businessSegment": "Industrial",
            "description": "",
            "mainFeatures": "",
            "customerProblemAddressed": "",
            "customerOrEndUserType": "",
            "industryServed": "",
            "brandName": "",
            "launchDate": "",
            "lifecycleStage": "growth",
            "sourcingModel": "in-house",
            "pricingModel": "",
            "typicalOrderOrContractSize": "",
            "revenueRecognitionModel": "",
            "domesticExportClassification": "domestic",
            "requiredLicencesOrCertifications": "",
            "notes": "",
        }
    ]
    products_section["revenueMixRows"] = [
        {
            "id": "rev-1",
            "productOrSegmentId": product_id,
            "productOrSegmentLabel": "Widget A",
            "financialYear": "FY24",
            "revenue": "600000",
            "percentageOfRevenueFromOperations": "60",
            "source": "audited-financials",
            "notes": "",
        },
        {
            "id": "rev-2",
            "productOrSegmentId": "",
            "productOrSegmentLabel": "Widget B",
            "financialYear": "FY24",
            "revenue": "400000",
            "percentageOfRevenueFromOperations": "40",
            "source": "audited-financials",
            "notes": "",
        },
    ]
    products_save = await auth_client.patch(
        f"{BASE}/sections/products-services-revenue-mix",
        headers=headers,
        json={"version": version, "data": products_section},
    )
    assert products_save.status_code == 200, products_save.text
    saved = products_save.json()
    assert saved["computations"]["productsCount"] == 1
    assert saved["computations"]["revenuePercentagesReconcile"] is True
    version = saved["version"]

    # 3. Customers, sales, distribution & geography
    customers_section = payload["customersSalesDistributionAndGeography"]
    customers_section.update(
        {
            "approximateActiveCustomerCount": "25",
            "governmentTenderDependence": "no",
            "largeEnterpriseDependence": "yes",
            "longTermContractsAvailable": "no",
            "purchaseOrderDependence": "yes",
            "orderBookAvailable": "no",
        }
    )
    customers_section["customerConcentrationPeriods"] = [
        {
            "id": "cust-period-1",
            "periodLabel": "FY24",
            "isCurrentPeriod": True,
            "largestCustomerRevenue": "100000",
            "largestCustomerPercentage": "10",
            "top3Revenue": "",
            "top3Percentage": "",
            "top5Revenue": "",
            "top5Percentage": "",
            "top10Revenue": "",
            "top10Percentage": "",
            "totalRevenueFromOperations": "1000000",
            "source": "audited-financials",
            "notes": "",
        }
    ]
    customers_save = await auth_client.patch(
        f"{BASE}/sections/customers-sales-distribution-geography",
        headers=headers,
        json={"version": version, "data": customers_section},
    )
    assert customers_save.status_code == 200, customers_save.text
    version = customers_save.json()["version"]

    # 4. Suppliers, procurement, inventory & logistics
    suppliers_section = payload["suppliersProcurementInventoryAndLogistics"]
    suppliers_section.update(
        {
            "procurementModel": "centralised",
            "relatedPartySupplierDependence": "no",
            "productionModel": "make-to-order",
            "logisticsModel": "third-party",
        }
    )
    suppliers_section["supplierConcentrationPeriods"] = [
        {
            "id": "sup-period-1",
            "periodLabel": "FY24",
            "isCurrentPeriod": True,
            "totalSuppliers": "10",
            "largestSupplierPurchaseValue": "50000",
            "largestSupplierPercentage": "15",
            "top3PurchaseValue": "",
            "top3Percentage": "",
            "top5PurchaseValue": "",
            "top5Percentage": "",
            "top10PurchaseValue": "",
            "top10Percentage": "",
            "totalPurchases": "333333",
            "importedPurchasePercentage": "",
            "relatedPartySupplierPercentage": "",
            "source": "audited-financials",
            "notes": "",
        }
    ]
    suppliers_save = await auth_client.patch(
        f"{BASE}/sections/suppliers-procurement-inventory-logistics",
        headers=headers,
        json={"version": version, "data": suppliers_section},
    )
    assert suppliers_save.status_code == 200, suppliers_save.text
    version = suppliers_save.json()["version"]

    # 5. Facilities, capacity & operational process
    facilities_section = payload["facilitiesCapacityAndOperationalProcess"]
    facility_id = "fac-1"
    facilities_section.update(
        {
            "electricityDependency": "yes",
            "waterDependency": "no",
        }
    )
    facilities_section["facilities"] = [
        {
            "id": facility_id,
            "name": "Plant 1",
            "facilityType": "manufacturing-plant",
            "address": "",
            "stateOrCountry": "",
            "tenure": "owned",
            "operationalSince": "",
            "status": "operational",
            "area": "",
            "mainFunctions": "",
            "productsServicesSupported": "",
            "numberOfShifts": "",
            "workforceCount": "",
            "leaseExpiry": "",
            "materialLicencesRequired": "",
            "notes": "",
        }
    ]
    facilities_section["capacityRecords"] = [
        {
            "id": "cap-1",
            "facilityId": facility_id,
            "facilityName": "Plant 1",
            "periodLabel": "FY24",
            "isCurrentPeriod": True,
            "metricOrCapacityUnit": "units",
            "metricDescription": "",
            "installedCapacity": "1000",
            "availableCapacity": "800",
            "actualOutput": "600",
            "numberOfShifts": "",
            "bottleneckCapacity": "",
            "utilisationAbove100Explanation": "",
            "sourceStatus": "available",
            "notes": "",
        }
    ]
    facilities_save = await auth_client.patch(
        f"{BASE}/sections/facilities-capacity-operational-process",
        headers=headers,
        json={"version": version, "data": facilities_section},
    )
    assert facilities_save.status_code == 200, facilities_save.text
    saved = facilities_save.json()
    assert saved["computations"]["facilitiesCount"] == 1
    assert saved["computations"]["capacityUtilisationLatest"] == "75"
    version = saved["version"]

    # 6. Technology, quality, R&D & intellectual property
    tech_section = payload["technologyQualityResearchAndIntellectualProperty"]
    tech_section.update(
        {
            "coreOperatingTechnology": "CNC machining",
            "technologyOwnership": "proprietary",
            "automationLevel": "semi-automated",
            "hostingModel": "on-premise",
            "qualityProcess": "ISO 9001",
            "rdFunctionExists": "no",
            "thirdPartyTechnologyDependence": "no",
            "materialRecallDeclaration": "no",
        }
    )
    tech_save = await auth_client.patch(
        f"{BASE}/sections/technology-quality-rd-ip",
        headers=headers,
        json={"version": version, "data": tech_section},
    )
    assert tech_save.status_code == 200, tech_save.text
    version = tech_save.json()["version"]

    # 7. Workforce, collaborations, insurance & continuity
    workforce_section = payload["workforceCollaborationsInsuranceAndContinuity"]
    workforce_section.update(
        {
            "labourDisputes": "no",
            "specialisedSkillDependence": "no",
            "managementConsidersCoverageAdequate": "yes",
            "businessContinuityPlanExists": "yes",
            "disasterRecoveryPlanExists": "yes",
        }
    )
    workforce_section["workforcePeriods"] = [
        {
            "id": "wf-period-1",
            "asOfDate": "2024-03-31",
            "periodLabel": "FY24",
            "isCurrentPeriod": True,
            "permanentEmployees": "50",
            "contractWorkers": "20",
            "factoryOrOperationalWorkers": "",
            "technicalOrRdEmployees": "",
            "salesEmployees": "",
            "administrationEmployees": "",
            "womenEmployees": "",
            "personsWithDisabilities": "",
            "unionisedEmployees": "",
            "attritionPercentage": "",
            "geographicDistribution": "",
            "notes": "",
        }
    ]
    workforce_save = await auth_client.patch(
        f"{BASE}/sections/workforce-collaborations-insurance-continuity",
        headers=headers,
        json={"version": version, "data": workforce_section},
    )
    assert workforce_save.status_code == 200, workforce_save.text
    saved = workforce_save.json()
    assert saved["computations"]["employeesTotal"] == "70"
    version = saved["version"]

    # 8. Competitive strengths, strategy, dependencies & confirmations
    strategy_section = payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]
    strategy_section["competitiveStrengths"] = [
        {
            "id": "strength-1",
            "title": "Established customer relationships",
            "explanation": "Long-standing relationships with key customers",
            "supportingMetric": "",
            "period": "",
            "supportingSource": "Audited financials FY24",
            "relatedProductFacilityOrCustomer": "",
            "companyConfirmation": "yes",
            "professionalReviewStatus": "completed",
            "notes": "",
        }
    ]
    strategy_section["strategies"] = [
        {
            "id": "strategy-1",
            "title": "Expand production capacity",
            "description": "Add a second production line",
            "category": "growth",
            "timeHorizon": "medium-term",
            "currentStatus": "approved",
            "requiredResources": "",
            "dependencies": "",
            "relatedObjectsOfTheIssueReference": "",
            "boardApprovedStatus": "yes",
            "supportingPlanOrSource": "",
            "risks": "",
            "containsUnsupportedProjections": "no",
            "notes": "",
        }
    ]
    strategy_section["confirmations"] = {key: True for key in strategy_section["confirmations"]}
    strategy_save = await auth_client.patch(
        f"{BASE}/sections/competitive-strengths-strategy-confirmations",
        headers=headers,
        json={"version": version, "data": strategy_section},
    )
    assert strategy_save.status_code == 200, strategy_save.text
    version = strategy_save.json()["version"]

    # Stale version now conflicts.
    stale = await auth_client.patch(
        f"{BASE}/sections/business-profile-operating-model",
        headers=headers,
        json={"version": 1, "data": profile},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "BUSINESS_OPERATIONS_VERSION_CONFLICT"
    assert "currentVersion" in stale.json()["error"]["details"]

    loaded = await auth_client.get(f"{BASE}/workspace", headers=headers)
    assert loaded.status_code == 200
    loaded_payload = loaded.json()["payload"]
    assert (
        loaded_payload["businessProfileAndOperatingModel"]["businessCommencementDate"]
        == "2015-01-01"
    )
    # Stable ids survive round-trip.
    assert loaded_payload["productsServicesAndRevenueMix"]["productsServices"][0]["id"] == product_id
    assert (
        loaded_payload["facilitiesCapacityAndOperationalProcess"]["facilities"][0]["id"]
        == facility_id
    )

    overview = await auth_client.get(f"{BASE}/overview-summary", headers=headers)
    assert overview.status_code == 200
    overview_body = overview.json()
    assert overview_body["sectionsComplete"] >= 1
    assert overview_body["productsCount"] == 1
    assert overview_body["facilitiesCount"] == 1

    assessment = await auth_client.get(f"{BASE}/business-assessment", headers=headers)
    assert assessment.status_code == 200
    assessment_body = assessment.json()
    assert assessment_body["result"] in {
        "insufficient_information",
        "broadly_substantiated",
        "inconsistencies_identified",
        "professional_confirmation_required",
        "pending_supporting_source",
    }
    assert set(assessment_body["counts"].keys()) == {
        "substantiated",
        "potentialInconsistency",
        "missingInformation",
        "pendingLinkedWorkstream",
        "pendingSupportingSource",
        "pendingProfessionalConfirmation",
        "notApplicable",
    }
    assert assessment_body["metrics"]["products"] == 1
    assert assessment_body["metrics"]["facilities"] == 1


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_ownership_isolation(auth_client: AsyncClient) -> None:
    headers_a = await _register_and_submit(auth_client, "business-operations.a@example.com")
    headers_b = await _register_and_submit(auth_client, "business-operations.b@example.com")

    init_a = await auth_client.post(f"{BASE}/workspace", headers=headers_a)
    assert init_a.status_code == 200
    profile = init_a.json()["payload"]["businessProfileAndOperatingModel"]
    profile["primaryBusinessActivity"] = "Isolated Business A activity"
    save_a = await auth_client.patch(
        f"{BASE}/sections/business-profile-operating-model",
        headers=headers_a,
        json={"version": 1, "data": profile},
    )
    assert save_a.status_code == 200

    init_b = await auth_client.post(f"{BASE}/workspace", headers=headers_b)
    assert init_b.status_code == 200
    assert (
        init_b.json()["payload"]["businessProfileAndOperatingModel"]["primaryBusinessActivity"]
        == ""
    )

    get_b = await auth_client.get(f"{BASE}/workspace", headers=headers_b)
    assert (
        get_b.json()["payload"]["businessProfileAndOperatingModel"]["primaryBusinessActivity"]
        == ""
    )


@pytest.mark.asyncio
@pytest.mark.postgres
async def test_unknown_section_and_cross_reference_rejected(
    auth_client: AsyncClient,
) -> None:
    headers = await _register_and_submit(auth_client, "business-operations.validate@example.com")
    init = await auth_client.post(f"{BASE}/workspace", headers=headers)
    version = init.json()["version"]

    unknown = await auth_client.patch(
        f"{BASE}/sections/not-a-section",
        headers=headers,
        json={"version": version, "data": {}},
    )
    assert unknown.status_code == 404

    products_section = init.json()["payload"]["productsServicesAndRevenueMix"]
    products_section["revenueMixRows"] = [
        {
            "id": "rev-1",
            "productOrSegmentId": "does-not-exist",
            "productOrSegmentLabel": "",
            "financialYear": "FY24",
            "revenue": "100000",
            "percentageOfRevenueFromOperations": "100",
            "source": "",
            "notes": "",
        }
    ]
    invalid_ref = await auth_client.patch(
        f"{BASE}/sections/products-services-revenue-mix",
        headers=headers,
        json={"version": version, "data": products_section},
    )
    assert invalid_ref.status_code == 422
    assert invalid_ref.json()["error"]["code"] == "BUSINESS_OPERATIONS_VALIDATION_FAILED"
    assert "productOrSegmentId" in str(invalid_ref.json()["error"]["details"]["fieldErrors"])
