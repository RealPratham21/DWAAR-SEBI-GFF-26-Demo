"""Section completion for Business & Operations — ports `frontend/lib/business-operations/progress.ts`.

Each section resolves to `not_started | in_progress | complete`. An unanswered ternary is never
treated as "no".
"""

from __future__ import annotations

from typing import Any

from app.modules.business_operations import decimal_math as dm
from app.modules.business_operations.constants import (
    BUSINESS_OPERATIONS_CONFIRMATION_FIELDS,
    SECTION_IDS,
    SECTION_LABELS,
)


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip() != ""
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _is_filled_decimal(value: Any) -> bool:
    return dm.is_filled(value)


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def evaluate_business_profile_status(payload: dict[str, Any]) -> str:
    section = payload["businessProfileAndOperatingModel"]
    core = [
        _filled(section.get("businessCommencementDate")),
        len(section.get("businessClassifications") or []) > 0,
        _filled(section.get("primaryBusinessActivity")),
        _filled(section.get("briefBusinessOverview")),
        _filled(section.get("customerModel")),
        len(section.get("revenueModels") or []) > 0,
        _filled(section.get("orderModel")),
        _filled(section.get("domesticOperations")),
        _filled(section.get("exportOperations")),
        _filled(section.get("valueCreationAndDeliveryExplanation")),
    ]
    answered = sum(1 for item in core if item)

    units_complete = all(
        _filled(unit.get("unitName")) and _filled(unit.get("status"))
        for unit in section.get("businessUnits") or []
    )
    seasonality_explained = section.get("seasonalityOrCyclicality") != "yes" or _filled(
        section.get("seasonalityDetails")
    )
    third_party_explained = section.get("materialThirdPartyDependence") != "yes" or _filled(
        section.get("materialThirdPartyDependenceDetails")
    )
    regulatory_explained = section.get("materialRegulatoryDependence") != "yes" or _filled(
        section.get("materialRegulatoryDependenceDetails")
    )

    return _status_from(
        answered,
        len(core),
        units_complete
        and seasonality_explained
        and third_party_explained
        and regulatory_explained,
    )


def evaluate_products_revenue_status(payload: dict[str, Any]) -> str:
    section = payload["productsServicesAndRevenueMix"]
    products_entered = [item for item in section.get("productsServices") or [] if _filled(item.get("name"))]
    core = [
        len(products_entered) > 0,
        len(section.get("revenueMixRows") or []) > 0,
    ]
    answered = sum(1 for item in core if item)

    products_complete = all(
        _filled(item.get("productType")) and _filled(item.get("businessSegment"))
        for item in products_entered
    )
    mix_complete = all(
        _filled(row.get("financialYear"))
        and (
            _is_filled_decimal(row.get("revenue"))
            or _is_filled_decimal(row.get("percentageOfRevenueFromOperations"))
        )
        for row in section.get("revenueMixRows") or []
    )
    changes_complete = all(
        _filled(item.get("offeringName")) and _filled(item.get("changeType"))
        for item in section.get("offeringChanges") or []
    )

    return _status_from(
        answered, len(core), products_complete and mix_complete and changes_complete
    )


def evaluate_customers_sales_status(payload: dict[str, Any]) -> str:
    section = payload["customersSalesDistributionAndGeography"]
    core = [
        _is_filled_decimal(section.get("approximateActiveCustomerCount"))
        or _filled(section.get("customerCategories")),
        _filled(section.get("governmentTenderDependence")),
        _filled(section.get("largeEnterpriseDependence")),
        _filled(section.get("longTermContractsAvailable")),
        _filled(section.get("purchaseOrderDependence")),
        len(section.get("customerConcentrationPeriods") or []) > 0
        or len(section.get("materialCustomers") or []) > 0,
    ]
    answered = sum(1 for item in core if item)

    concentration_complete = all(
        _filled(row.get("periodLabel"))
        and (
            _is_filled_decimal(row.get("largestCustomerPercentage"))
            or _is_filled_decimal(row.get("totalRevenueFromOperations"))
        )
        for row in section.get("customerConcentrationPeriods") or []
    )
    customers_complete = all(
        _filled(item.get("customerNameOrConfidentialLabel"))
        for item in section.get("materialCustomers") or []
    )
    channels_complete = all(
        _filled(item.get("channelType")) or _filled(item.get("geography"))
        for item in section.get("salesChannels") or []
    )
    geo_complete = all(
        _filled(row.get("periodLabel"))
        and (_is_filled_decimal(row.get("revenue")) or _is_filled_decimal(row.get("percentageOfRevenue")))
        for row in section.get("geographicRevenueRows") or []
    )
    order_book_complete = section.get("orderBookAvailable") != "yes" or (
        _is_filled_decimal(section.get("orderBookValue")) and _filled(section.get("orderBookAsOfDate"))
    )

    return _status_from(
        answered,
        len(core),
        concentration_complete
        and customers_complete
        and channels_complete
        and geo_complete
        and order_book_complete,
    )


def evaluate_suppliers_procurement_status(payload: dict[str, Any]) -> str:
    section = payload["suppliersProcurementInventoryAndLogistics"]
    core = [
        len(section.get("keyInputs") or []) > 0 or len(section.get("materialSuppliers") or []) > 0,
        len(section.get("supplierConcentrationPeriods") or []) > 0,
        _filled(section.get("procurementModel")),
        _filled(section.get("relatedPartySupplierDependence")),
        _filled(section.get("productionModel")),
        _filled(section.get("logisticsModel")),
    ]
    answered = sum(1 for item in core if item)

    inputs_complete = all(_filled(item.get("inputName")) for item in section.get("keyInputs") or [])
    concentration_complete = all(
        _filled(row.get("periodLabel"))
        and (
            _is_filled_decimal(row.get("largestSupplierPercentage"))
            or _is_filled_decimal(row.get("totalPurchases"))
        )
        for row in section.get("supplierConcentrationPeriods") or []
    )
    suppliers_complete = all(
        _filled(item.get("supplierNameOrConfidentialLabel"))
        for item in section.get("materialSuppliers") or []
    )
    write_offs_explained = section.get("materialWriteOffs") != "yes" or _filled(
        section.get("materialWriteOffDetails")
    )

    return _status_from(
        answered,
        len(core),
        inputs_complete and concentration_complete and suppliers_complete and write_offs_explained,
    )


def evaluate_facilities_capacity_status(payload: dict[str, Any]) -> str:
    section = payload["facilitiesCapacityAndOperationalProcess"]
    facilities_entered = [item for item in section.get("facilities") or [] if _filled(item.get("name"))]
    core = [
        len(facilities_entered) > 0,
        _filled(section.get("electricityDependency")),
        _filled(section.get("waterDependency")),
    ]
    answered = sum(1 for item in core if item)

    facilities_complete = all(
        _filled(item.get("facilityType")) and _filled(item.get("status")) for item in facilities_entered
    )
    capacity_complete = all(
        (_filled(row.get("facilityId")) or _filled(row.get("facilityName")))
        and _filled(row.get("periodLabel"))
        and (
            _is_filled_decimal(row.get("installedCapacity"))
            or _is_filled_decimal(row.get("actualOutput"))
        )
        for row in section.get("capacityRecords") or []
    )
    process_complete = all(
        _filled(step.get("processName")) and _filled(step.get("stepNumber"))
        for step in section.get("operatingProcessSteps") or []
    )

    return _status_from(
        answered, len(core), facilities_complete and capacity_complete and process_complete
    )


def evaluate_technology_quality_ip_status(payload: dict[str, Any]) -> str:
    section = payload["technologyQualityResearchAndIntellectualProperty"]
    core = [
        _filled(section.get("coreOperatingTechnology")),
        _filled(section.get("technologyOwnership")),
        _filled(section.get("qualityProcess")),
        _filled(section.get("rdFunctionExists")),
        _filled(section.get("thirdPartyTechnologyDependence")),
        _filled(section.get("materialRecallDeclaration")),
    ]
    answered = sum(1 for item in core if item)

    equipment_complete = all(
        _filled(item.get("nameOrType")) for item in section.get("machineryAndEquipment") or []
    )
    certifications_complete = all(
        _filled(item.get("standard")) for item in section.get("certifications") or []
    )
    ip_complete = all(
        _filled(item.get("ipType")) and _filled(item.get("nameOrDescription"))
        for item in section.get("intellectualPropertyRecords") or []
    )
    claims_explained = section.get("qualityClaims") != "yes" or _filled(section.get("qualityClaimsDetails"))
    recall_explained = section.get("materialRecallDeclaration") != "yes" or _filled(
        section.get("materialRecallDetails")
    )

    return _status_from(
        answered,
        len(core),
        equipment_complete
        and certifications_complete
        and ip_complete
        and claims_explained
        and recall_explained,
    )


def evaluate_workforce_insurance_status(payload: dict[str, Any]) -> str:
    section = payload["workforceCollaborationsInsuranceAndContinuity"]
    core = [
        len(section.get("workforcePeriods") or []) > 0,
        _filled(section.get("labourDisputes")),
        _filled(section.get("specialisedSkillDependence")),
        _filled(section.get("managementConsidersCoverageAdequate")),
        _filled(section.get("businessContinuityPlanExists")),
        _filled(section.get("disasterRecoveryPlanExists")),
    ]
    answered = sum(1 for item in core if item)

    workforce_complete = all(
        _filled(row.get("periodLabel"))
        and (
            _is_filled_decimal(row.get("permanentEmployees"))
            or _is_filled_decimal(row.get("contractWorkers"))
        )
        for row in section.get("workforcePeriods") or []
    )
    collaborations_complete = all(
        _filled(item.get("party")) for item in section.get("collaborations") or []
    )
    dependencies_complete = all(
        _filled(item.get("dependencyType")) or _filled(item.get("description"))
        for item in section.get("operatingDependencies") or []
    )
    policies_complete = all(
        _filled(item.get("policyType")) or _filled(item.get("insurer"))
        for item in section.get("insurancePolicies") or []
    )
    disputes_explained = section.get("labourDisputes") != "yes" or _filled(
        section.get("labourDisputeDetails")
    )

    return _status_from(
        answered,
        len(core),
        workforce_complete
        and collaborations_complete
        and dependencies_complete
        and policies_complete
        and disputes_explained,
    )


def evaluate_strategy_confirmations_status(payload: dict[str, Any]) -> str:
    section = payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]
    confirmations = section.get("confirmations") or {}
    confirmations_checked = sum(
        1 for key in BUSINESS_OPERATIONS_CONFIRMATION_FIELDS if confirmations.get(key)
    )
    core = [
        len(section.get("competitiveStrengths") or []) > 0
        or len(section.get("strategies") or []) > 0,
        len(section.get("keyDependencies") or []) > 0 or _filled(section.get("notes")),
        confirmations_checked > 0,
    ]
    answered = sum(1 for item in core if item)

    strengths_complete = all(
        _filled(item.get("title")) and _filled(item.get("explanation"))
        for item in section.get("competitiveStrengths") or []
    )
    strategies_complete = all(
        _filled(item.get("title")) and _filled(item.get("description"))
        for item in section.get("strategies") or []
    )
    dependencies_complete = all(
        _filled(item.get("dependencyType")) and _filled(item.get("description"))
        for item in section.get("keyDependencies") or []
    )
    confirmations_complete = confirmations_checked == len(BUSINESS_OPERATIONS_CONFIRMATION_FIELDS)

    return _status_from(
        answered,
        len(core),
        strengths_complete
        and strategies_complete
        and dependencies_complete
        and confirmations_complete,
    )


_EVALUATORS: dict[str, Any] = {
    "business-profile-operating-model": evaluate_business_profile_status,
    "products-services-revenue-mix": evaluate_products_revenue_status,
    "customers-sales-distribution-geography": evaluate_customers_sales_status,
    "suppliers-procurement-inventory-logistics": evaluate_suppliers_procurement_status,
    "facilities-capacity-operational-process": evaluate_facilities_capacity_status,
    "technology-quality-rd-ip": evaluate_technology_quality_ip_status,
    "workforce-collaborations-insurance-continuity": evaluate_workforce_insurance_status,
    "competitive-strengths-strategy-confirmations": evaluate_strategy_confirmations_status,
}


def calculate_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: _EVALUATORS[section_id](payload) for section_id in SECTION_IDS}

    statuses = list(sections.values())
    sections_complete = sum(1 for status in statuses if status == "complete")
    total_sections = len(statuses)
    overall_status = "not_started"
    if sections_complete == total_sections:
        overall_status = "complete"
    elif any(status != "not_started" for status in statuses):
        overall_status = "in_progress"

    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }


def list_incomplete_sections(payload: dict[str, Any]) -> list[str]:
    progress = calculate_progress(payload)
    incomplete: list[str] = []
    for section_id, status in progress["sections"].items():
        if status != "complete":
            incomplete.append(f"{SECTION_LABELS[section_id]} incomplete")
    return incomplete
