"""Draft-tolerant section validation for Business & Operations.

Stricter than the frontend zod schema only where values are actually present: enums must be
valid, decimal strings must parse and be non-negative, repeatable-record ids must be unique,
and cross-record references (productOrSegmentId, facilityId) must point at records that exist.

Missing optional fields are always allowed — this module never requires a field to be filled,
only that *filled* values are structurally valid. An empty ternary answer is never treated as
"no".
"""

from __future__ import annotations

from typing import Any

from app.modules.business_operations import decimal_math as dm
from app.modules.business_operations.constants import (
    AUTOMATION_LEVEL_VALUES,
    BUSINESS_CLASSIFICATION_VALUES,
    BUSINESS_UNIT_STATUS_VALUES,
    CAPACITY_METRIC_UNIT_VALUES,
    CERTIFICATION_RENEWAL_STATUS_VALUES,
    COLLABORATION_NATURE_VALUES,
    CUSTOMER_MODEL_VALUES,
    DEPENDENCY_TYPE_VALUES,
    DISCLOSURE_CONSENT_VALUES,
    DOMESTIC_EXPORT_CLASSIFICATION_VALUES,
    DOMESTIC_OR_IMPORTED_VALUES,
    EQUIPMENT_ORIGIN_VALUES,
    EQUIPMENT_STATUS_VALUES,
    EQUIPMENT_TENURE_VALUES,
    FACILITY_STATUS_VALUES,
    FACILITY_TENURE_VALUES,
    FACILITY_TYPE_VALUES,
    FIGURE_SOURCE_VALUES,
    GEOGRAPHIC_SCOPE_VALUES,
    HOSTING_MODEL_VALUES,
    INPUT_CATEGORY_VALUES,
    INSURANCE_POLICY_TYPE_VALUES,
    IP_OWNERSHIP_MODEL_VALUES,
    IP_STATUS_VALUES,
    IP_TYPE_VALUES,
    LIFECYCLE_STAGE_VALUES,
    LOGISTICS_MODEL_VALUES,
    MATERIALITY_STATUS_VALUES,
    OFFERING_CHANGE_TYPE_VALUES,
    OFFERING_COMMERCIAL_STATUS_VALUES,
    ORDER_BOOK_SECURITY_VALUES,
    ORDER_MODEL_VALUES,
    PLANNED_CAPACITY_STATUS_VALUES,
    PROCESS_EXECUTION_VALUES,
    PROCUREMENT_MODEL_VALUES,
    PRODUCT_TYPE_VALUES,
    PRODUCTION_MODEL_VALUES,
    PROFESSIONAL_REVIEW_STATUS_VALUES,
    RD_DELIVERY_MODEL_VALUES,
    REVENUE_MODEL_VALUES,
    SALES_CHANNEL_TYPE_VALUES,
    SOURCE_STATUS_VALUES,
    SOURCING_MODEL_VALUES,
    STRATEGY_CATEGORY_VALUES,
    STRATEGY_STATUS_VALUES,
    STRATEGY_TIME_HORIZON_VALUES,
    TECHNOLOGY_OWNERSHIP_VALUES,
    YES_NO_NOT_SURE,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


# --------------------------------------------------------------------------- #
# Generic helpers                                                             #
# --------------------------------------------------------------------------- #


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    if value is None:
        errors[field] = "Invalid value."
        return
    text = str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _require_array_enum(
    errors: dict[str, str], field: str, values: Any, allowed: frozenset[str]
) -> None:
    if values is None:
        return
    if not isinstance(values, list):
        errors[field] = "Must be a list."
        return
    for index, value in enumerate(values):
        if str(value) not in allowed:
            errors[f"{field}[{index}]"] = "Select a valid option."


def _optional_decimal(
    errors: dict[str, str],
    field: str,
    value: Any,
    *,
    allow_negative: bool = False,
) -> None:
    if value is None or value == "":
        return
    if not dm.is_filled(value):
        errors[field] = "Enter a valid number."
        return
    if not allow_negative and dm.is_negative(value):
        errors[field] = "Value cannot be negative."


def _optional_bool(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None:
        return
    if not isinstance(value, bool):
        errors[field] = "Must be true or false."


def _check_unique_ids(errors: dict[str, str], field: str, items: list[Any]) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            errors[f"{field}[{index}].id"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].id"] = "Duplicate id within this collection."
        seen.add(item_id)


def _ids_of(items: list[Any] | None) -> set[str]:
    return {str(item.get("id")) for item in (items or []) if isinstance(item, dict) and item.get("id")}


def _optional_ref(errors: dict[str, str], field: str, value: Any, valid_ids: set[str]) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a record that does not exist."


# --------------------------------------------------------------------------- #
# 1. Business profile & operating model                                       #
# --------------------------------------------------------------------------- #


def validate_business_profile_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    _require_array_enum(
        errors, "businessClassifications", data.get("businessClassifications"), BUSINESS_CLASSIFICATION_VALUES
    )
    _require_array_enum(errors, "revenueModels", data.get("revenueModels"), REVENUE_MODEL_VALUES)
    _require_enum(errors, "customerModel", data.get("customerModel", ""), CUSTOMER_MODEL_VALUES)
    _require_enum(errors, "orderModel", data.get("orderModel", ""), ORDER_MODEL_VALUES)

    for field in (
        "domesticOperations",
        "exportOperations",
        "seasonalityOrCyclicality",
        "workingCapitalIntensiveBusiness",
        "materialThirdPartyDependence",
        "materialRegulatoryDependence",
    ):
        _ynns(errors, field, data.get(field, ""))

    units = data.get("businessUnits")
    _check_unique_ids(errors, "businessUnits", units or [])
    for index, item in enumerate(units or []):
        if not isinstance(item, dict):
            continue
        prefix = f"businessUnits[{index}]"
        _require_enum(errors, f"{prefix}.status", item.get("status", ""), BUSINESS_UNIT_STATUS_VALUES)
        _optional_decimal(
            errors, f"{prefix}.revenueContributionPercentage", item.get("revenueContributionPercentage")
        )

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 2. Products, services & revenue mix                                         #
# --------------------------------------------------------------------------- #


def validate_products_revenue_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    products = data.get("productsServices")
    _check_unique_ids(errors, "productsServices", products or [])
    for index, item in enumerate(products or []):
        if not isinstance(item, dict):
            continue
        prefix = f"productsServices[{index}]"
        _require_enum(errors, f"{prefix}.productType", item.get("productType", ""), PRODUCT_TYPE_VALUES)
        _require_enum(errors, f"{prefix}.lifecycleStage", item.get("lifecycleStage", ""), LIFECYCLE_STAGE_VALUES)
        _require_enum(errors, f"{prefix}.sourcingModel", item.get("sourcingModel", ""), SOURCING_MODEL_VALUES)
        _require_enum(
            errors,
            f"{prefix}.domesticExportClassification",
            item.get("domesticExportClassification", ""),
            DOMESTIC_EXPORT_CLASSIFICATION_VALUES,
        )
        _optional_decimal(
            errors, f"{prefix}.typicalOrderOrContractSize", item.get("typicalOrderOrContractSize")
        )

    product_ids = _ids_of(products)

    rows = data.get("revenueMixRows")
    _check_unique_ids(errors, "revenueMixRows", rows or [])
    for index, item in enumerate(rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"revenueMixRows[{index}]"
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), FIGURE_SOURCE_VALUES)
        _optional_decimal(errors, f"{prefix}.revenue", item.get("revenue"))
        _optional_decimal(
            errors,
            f"{prefix}.percentageOfRevenueFromOperations",
            item.get("percentageOfRevenueFromOperations"),
        )
        _optional_ref(errors, f"{prefix}.productOrSegmentId", item.get("productOrSegmentId"), product_ids)

    changes = data.get("offeringChanges")
    _check_unique_ids(errors, "offeringChanges", changes or [])
    for index, item in enumerate(changes or []):
        if not isinstance(item, dict):
            continue
        prefix = f"offeringChanges[{index}]"
        _require_enum(errors, f"{prefix}.changeType", item.get("changeType", ""), OFFERING_CHANGE_TYPE_VALUES)
        _require_enum(
            errors,
            f"{prefix}.currentCommercialStatus",
            item.get("currentCommercialStatus", ""),
            OFFERING_COMMERCIAL_STATUS_VALUES,
        )

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 3. Customers, sales, distribution & geography                               #
# --------------------------------------------------------------------------- #


def validate_customers_sales_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    _optional_decimal(errors, "approximateActiveCustomerCount", data.get("approximateActiveCustomerCount"))
    _optional_decimal(errors, "repeatCustomerPercentage", data.get("repeatCustomerPercentage"))
    _optional_decimal(errors, "orderBookValue", data.get("orderBookValue"))
    _optional_decimal(errors, "orderBookRevenueAlreadyRecognised", data.get("orderBookRevenueAlreadyRecognised"))

    for field in (
        "governmentTenderDependence",
        "largeEnterpriseDependence",
        "longTermContractsAvailable",
        "purchaseOrderDependence",
        "orderBookAvailable",
        "orderBookExcludesQuotationsAndNonBindingProposals",
    ):
        _ynns(errors, field, data.get(field, ""))

    _require_enum(
        errors,
        "orderBookSecurityClassification",
        data.get("orderBookSecurityClassification", ""),
        ORDER_BOOK_SECURITY_VALUES,
    )
    _require_enum(errors, "orderBookSourceStatus", data.get("orderBookSourceStatus", ""), SOURCE_STATUS_VALUES)

    periods = data.get("customerConcentrationPeriods")
    _check_unique_ids(errors, "customerConcentrationPeriods", periods or [])
    for index, item in enumerate(periods or []):
        if not isinstance(item, dict):
            continue
        prefix = f"customerConcentrationPeriods[{index}]"
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), FIGURE_SOURCE_VALUES)
        for field in (
            "largestCustomerRevenue",
            "largestCustomerPercentage",
            "top3Revenue",
            "top3Percentage",
            "top5Revenue",
            "top5Percentage",
            "top10Revenue",
            "top10Percentage",
            "totalRevenueFromOperations",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    customers = data.get("materialCustomers")
    _check_unique_ids(errors, "materialCustomers", customers or [])
    for index, item in enumerate(customers or []):
        if not isinstance(item, dict):
            continue
        prefix = f"materialCustomers[{index}]"
        _require_enum(
            errors, f"{prefix}.disclosureConsentStatus", item.get("disclosureConsentStatus", ""), DISCLOSURE_CONSENT_VALUES
        )
        _optional_decimal(
            errors, f"{prefix}.revenueContributionPercentage", item.get("revenueContributionPercentage")
        )

    channels = data.get("salesChannels")
    _check_unique_ids(errors, "salesChannels", channels or [])
    for index, item in enumerate(channels or []):
        if not isinstance(item, dict):
            continue
        prefix = f"salesChannels[{index}]"
        _require_enum(errors, f"{prefix}.channelType", item.get("channelType", ""), SALES_CHANNEL_TYPE_VALUES)
        for field in ("exclusivity", "keyDependency"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        _optional_decimal(
            errors, f"{prefix}.revenueContributionPercentage", item.get("revenueContributionPercentage")
        )

    geo_rows = data.get("geographicRevenueRows")
    _check_unique_ids(errors, "geographicRevenueRows", geo_rows or [])
    for index, item in enumerate(geo_rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"geographicRevenueRows[{index}]"
        _require_enum(errors, f"{prefix}.geographicScope", item.get("geographicScope", ""), GEOGRAPHIC_SCOPE_VALUES)
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), FIGURE_SOURCE_VALUES)
        _optional_decimal(errors, f"{prefix}.revenue", item.get("revenue"))
        _optional_decimal(errors, f"{prefix}.percentageOfRevenue", item.get("percentageOfRevenue"))

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 4. Suppliers, procurement, inventory & logistics                            #
# --------------------------------------------------------------------------- #


def validate_suppliers_procurement_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    _require_enum(errors, "procurementModel", data.get("procurementModel", ""), PROCUREMENT_MODEL_VALUES)
    _require_enum(errors, "productionModel", data.get("productionModel", ""), PRODUCTION_MODEL_VALUES)
    _require_enum(errors, "logisticsModel", data.get("logisticsModel", ""), LOGISTICS_MODEL_VALUES)

    for field in (
        "relatedPartySupplierDependence",
        "obsolescenceOrPerishabilityExposure",
        "materialWriteOffs",
        "materialLogisticsDependency",
    ):
        _ynns(errors, field, data.get(field, ""))

    inputs = data.get("keyInputs")
    _check_unique_ids(errors, "keyInputs", inputs or [])
    for index, item in enumerate(inputs or []):
        if not isinstance(item, dict):
            continue
        prefix = f"keyInputs[{index}]"
        _require_enum(errors, f"{prefix}.category", item.get("category", ""), INPUT_CATEGORY_VALUES)
        _require_enum(
            errors, f"{prefix}.domesticOrImported", item.get("domesticOrImported", ""), DOMESTIC_OR_IMPORTED_VALUES
        )
        for field in (
            "criticalInput",
            "commodityLinkedPrice",
            "substituteAvailable",
            "priceVolatility",
            "regulatoryOrImportRestriction",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))

    periods = data.get("supplierConcentrationPeriods")
    _check_unique_ids(errors, "supplierConcentrationPeriods", periods or [])
    for index, item in enumerate(periods or []):
        if not isinstance(item, dict):
            continue
        prefix = f"supplierConcentrationPeriods[{index}]"
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), FIGURE_SOURCE_VALUES)
        for field in (
            "totalSuppliers",
            "largestSupplierPurchaseValue",
            "largestSupplierPercentage",
            "top3PurchaseValue",
            "top3Percentage",
            "top5PurchaseValue",
            "top5Percentage",
            "top10PurchaseValue",
            "top10Percentage",
            "totalPurchases",
            "importedPurchasePercentage",
            "relatedPartySupplierPercentage",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    suppliers = data.get("materialSuppliers")
    _check_unique_ids(errors, "materialSuppliers", suppliers or [])
    for index, item in enumerate(suppliers or []):
        if not isinstance(item, dict):
            continue
        prefix = f"materialSuppliers[{index}]"
        _require_enum(
            errors, f"{prefix}.disclosureConsentStatus", item.get("disclosureConsentStatus", ""), DISCLOSURE_CONSENT_VALUES
        )
        for field in ("longTermAgreement", "exclusivity", "singleSourceDependency", "alternativeSupplierAvailable"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 5. Facilities, capacity & operational process                               #
# --------------------------------------------------------------------------- #


def validate_facilities_capacity_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "electricityDependency",
        "captivePowerAvailable",
        "waterDependency",
        "fuelDependency",
        "internetOrDataInfrastructureDependency",
        "utilityInterruptionsExperienced",
        "utilityCapacityConstraints",
    ):
        _ynns(errors, field, data.get(field, ""))

    facilities = data.get("facilities")
    _check_unique_ids(errors, "facilities", facilities or [])
    for index, item in enumerate(facilities or []):
        if not isinstance(item, dict):
            continue
        prefix = f"facilities[{index}]"
        _require_enum(errors, f"{prefix}.facilityType", item.get("facilityType", ""), FACILITY_TYPE_VALUES)
        _require_enum(errors, f"{prefix}.tenure", item.get("tenure", ""), FACILITY_TENURE_VALUES)
        _require_enum(errors, f"{prefix}.status", item.get("status", ""), FACILITY_STATUS_VALUES)
        for field in ("numberOfShifts", "workforceCount"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    facility_ids = _ids_of(facilities)

    capacity_records = data.get("capacityRecords")
    _check_unique_ids(errors, "capacityRecords", capacity_records or [])
    for index, item in enumerate(capacity_records or []):
        if not isinstance(item, dict):
            continue
        prefix = f"capacityRecords[{index}]"
        _require_enum(
            errors, f"{prefix}.metricOrCapacityUnit", item.get("metricOrCapacityUnit", ""), CAPACITY_METRIC_UNIT_VALUES
        )
        _require_enum(errors, f"{prefix}.sourceStatus", item.get("sourceStatus", ""), SOURCE_STATUS_VALUES)
        for field in (
            "installedCapacity",
            "availableCapacity",
            "actualOutput",
            "numberOfShifts",
            "bottleneckCapacity",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))
        _optional_ref(errors, f"{prefix}.facilityId", item.get("facilityId"), facility_ids)

    planned = data.get("plannedCapacityItems")
    _check_unique_ids(errors, "plannedCapacityItems", planned or [])
    for index, item in enumerate(planned or []):
        if not isinstance(item, dict):
            continue
        prefix = f"plannedCapacityItems[{index}]"
        _require_enum(errors, f"{prefix}.status", item.get("status", ""), PLANNED_CAPACITY_STATUS_VALUES)
        _optional_ref(errors, f"{prefix}.facilityId", item.get("facilityId"), facility_ids)

    steps = data.get("operatingProcessSteps")
    _check_unique_ids(errors, "operatingProcessSteps", steps or [])
    for index, item in enumerate(steps or []):
        if not isinstance(item, dict):
            continue
        prefix = f"operatingProcessSteps[{index}]"
        _require_enum(errors, f"{prefix}.executionModel", item.get("executionModel", ""), PROCESS_EXECUTION_VALUES)
        _ynns(errors, f"{prefix}.qualityCheckpoint", item.get("qualityCheckpoint", ""))
        _optional_decimal(errors, f"{prefix}.stepNumber", item.get("stepNumber"))
        _optional_ref(errors, f"{prefix}.facilityId", item.get("facilityId"), facility_ids)

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 6. Technology, quality, R&D & intellectual property                         #
# --------------------------------------------------------------------------- #


def validate_technology_quality_ip_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    _require_enum(errors, "technologyOwnership", data.get("technologyOwnership", ""), TECHNOLOGY_OWNERSHIP_VALUES)
    _require_enum(errors, "automationLevel", data.get("automationLevel", ""), AUTOMATION_LEVEL_VALUES)
    _require_enum(errors, "hostingModel", data.get("hostingModel", ""), HOSTING_MODEL_VALUES)
    _require_enum(errors, "rdDeliveryModel", data.get("rdDeliveryModel", ""), RD_DELIVERY_MODEL_VALUES)

    for field in (
        "obsolescenceExposure",
        "thirdPartyTechnologyDependence",
        "qualityClaims",
        "materialRecallDeclaration",
        "rdFunctionExists",
    ):
        _ynns(errors, field, data.get(field, ""))

    for field in ("rejectionRatePercentage", "returnOrRecallRatePercentage", "rdEmployeeCount"):
        _optional_decimal(errors, field, data.get(field))

    facility_ids = _ids_of(
        (full_payload.get("facilitiesCapacityAndOperationalProcess") or {}).get("facilities")
    )

    equipment = data.get("machineryAndEquipment")
    _check_unique_ids(errors, "machineryAndEquipment", equipment or [])
    for index, item in enumerate(equipment or []):
        if not isinstance(item, dict):
            continue
        prefix = f"machineryAndEquipment[{index}]"
        _require_enum(errors, f"{prefix}.tenure", item.get("tenure", ""), EQUIPMENT_TENURE_VALUES)
        _require_enum(errors, f"{prefix}.origin", item.get("origin", ""), EQUIPMENT_ORIGIN_VALUES)
        _require_enum(errors, f"{prefix}.status", item.get("status", ""), EQUIPMENT_STATUS_VALUES)
        for field in ("quantity", "ageYears"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))
        _optional_ref(errors, f"{prefix}.facilityId", item.get("facilityId"), facility_ids)

    certifications = data.get("certifications")
    _check_unique_ids(errors, "certifications", certifications or [])
    for index, item in enumerate(certifications or []):
        if not isinstance(item, dict):
            continue
        prefix = f"certifications[{index}]"
        _require_enum(
            errors, f"{prefix}.renewalStatus", item.get("renewalStatus", ""), CERTIFICATION_RENEWAL_STATUS_VALUES
        )

    rd_rows = data.get("rdSpendRows")
    _check_unique_ids(errors, "rdSpendRows", rd_rows or [])
    for index, item in enumerate(rd_rows or []):
        if not isinstance(item, dict):
            continue
        prefix = f"rdSpendRows[{index}]"
        _require_enum(errors, f"{prefix}.source", item.get("source", ""), FIGURE_SOURCE_VALUES)
        _optional_decimal(errors, f"{prefix}.spendAmount", item.get("spendAmount"))

    ip_records = data.get("intellectualPropertyRecords")
    _check_unique_ids(errors, "intellectualPropertyRecords", ip_records or [])
    for index, item in enumerate(ip_records or []):
        if not isinstance(item, dict):
            continue
        prefix = f"intellectualPropertyRecords[{index}]"
        _require_enum(errors, f"{prefix}.ipType", item.get("ipType", ""), IP_TYPE_VALUES)
        _require_enum(errors, f"{prefix}.status", item.get("status", ""), IP_STATUS_VALUES)
        _require_enum(errors, f"{prefix}.ownershipModel", item.get("ownershipModel", ""), IP_OWNERSHIP_MODEL_VALUES)
        _require_enum(
            errors, f"{prefix}.materialityStatus", item.get("materialityStatus", ""), MATERIALITY_STATUS_VALUES
        )
        _ynns(errors, f"{prefix}.disputeOrOpposition", item.get("disputeOrOpposition", ""))

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 7. Workforce, collaborations, insurance & continuity                        #
# --------------------------------------------------------------------------- #


def validate_workforce_insurance_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "labourDisputes",
        "specialisedSkillDependence",
        "labourContractorUsage",
        "managementConsidersCoverageAdequate",
        "professionalInsuranceReviewPerformed",
        "materialUninsuredOperations",
        "keyPersonInsuranceInPlace",
        "cyberInsuranceInPlace",
        "businessContinuityPlanExists",
        "disasterRecoveryPlanExists",
        "alternateFacilityAvailable",
        "backupSuppliersAvailable",
        "backupPowerOrDataAvailable",
        "cyberIncidentResponsePlanExists",
        "materialInterruptionsExperienced",
    ):
        _ynns(errors, field, data.get(field, ""))

    periods = data.get("workforcePeriods")
    _check_unique_ids(errors, "workforcePeriods", periods or [])
    for index, item in enumerate(periods or []):
        if not isinstance(item, dict):
            continue
        prefix = f"workforcePeriods[{index}]"
        for field in (
            "permanentEmployees",
            "contractWorkers",
            "factoryOrOperationalWorkers",
            "technicalOrRdEmployees",
            "salesEmployees",
            "administrationEmployees",
            "womenEmployees",
            "personsWithDisabilities",
            "unionisedEmployees",
            "attritionPercentage",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    collaborations = data.get("collaborations")
    _check_unique_ids(errors, "collaborations", collaborations or [])
    for index, item in enumerate(collaborations or []):
        if not isinstance(item, dict):
            continue
        prefix = f"collaborations[{index}]"
        _require_enum(errors, f"{prefix}.nature", item.get("nature", ""), COLLABORATION_NATURE_VALUES)
        for field in ("exclusivity", "materialDependency"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))

    dependencies = data.get("operatingDependencies")
    _check_unique_ids(errors, "operatingDependencies", dependencies or [])
    for index, item in enumerate(dependencies or []):
        if not isinstance(item, dict):
            continue
        prefix = f"operatingDependencies[{index}]"
        _require_enum(errors, f"{prefix}.dependencyType", item.get("dependencyType", ""), DEPENDENCY_TYPE_VALUES)
        _ynns(errors, f"{prefix}.applicable", item.get("applicable", ""))
        _require_enum(
            errors, f"{prefix}.materialityStatus", item.get("materialityStatus", ""), MATERIALITY_STATUS_VALUES
        )

    policies = data.get("insurancePolicies")
    _check_unique_ids(errors, "insurancePolicies", policies or [])
    for index, item in enumerate(policies or []):
        if not isinstance(item, dict):
            continue
        prefix = f"insurancePolicies[{index}]"
        _require_enum(errors, f"{prefix}.policyType", item.get("policyType", ""), INSURANCE_POLICY_TYPE_VALUES)
        _optional_decimal(errors, f"{prefix}.sumInsured", item.get("sumInsured"))

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 8. Competitive strengths, strategy, dependencies & confirmations            #
# --------------------------------------------------------------------------- #


def validate_strategy_confirmations_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    strengths = data.get("competitiveStrengths")
    _check_unique_ids(errors, "competitiveStrengths", strengths or [])
    for index, item in enumerate(strengths or []):
        if not isinstance(item, dict):
            continue
        prefix = f"competitiveStrengths[{index}]"
        _ynns(errors, f"{prefix}.companyConfirmation", item.get("companyConfirmation", ""))
        _require_enum(
            errors,
            f"{prefix}.professionalReviewStatus",
            item.get("professionalReviewStatus", ""),
            PROFESSIONAL_REVIEW_STATUS_VALUES,
        )

    strategies = data.get("strategies")
    _check_unique_ids(errors, "strategies", strategies or [])
    for index, item in enumerate(strategies or []):
        if not isinstance(item, dict):
            continue
        prefix = f"strategies[{index}]"
        _require_enum(errors, f"{prefix}.category", item.get("category", ""), STRATEGY_CATEGORY_VALUES)
        _require_enum(errors, f"{prefix}.timeHorizon", item.get("timeHorizon", ""), STRATEGY_TIME_HORIZON_VALUES)
        _require_enum(errors, f"{prefix}.currentStatus", item.get("currentStatus", ""), STRATEGY_STATUS_VALUES)
        for field in ("boardApprovedStatus", "containsUnsupportedProjections"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))

    dependencies = data.get("keyDependencies")
    _check_unique_ids(errors, "keyDependencies", dependencies or [])
    for index, item in enumerate(dependencies or []):
        if not isinstance(item, dict):
            continue
        prefix = f"keyDependencies[{index}]"
        _require_enum(errors, f"{prefix}.dependencyType", item.get("dependencyType", ""), DEPENDENCY_TYPE_VALUES)
        _require_enum(
            errors, f"{prefix}.materialityStatus", item.get("materialityStatus", ""), MATERIALITY_STATUS_VALUES
        )

    confirmations = data.get("confirmations")
    if confirmations is not None:
        if not isinstance(confirmations, dict):
            errors["confirmations"] = "Must be an object of true/false values."
        else:
            for key, value in confirmations.items():
                _optional_bool(errors, f"confirmations.{key}", value)

    if errors:
        raise ValidationError(errors)


VALIDATORS = {
    "business-profile-operating-model": validate_business_profile_draft,
    "products-services-revenue-mix": validate_products_revenue_draft,
    "customers-sales-distribution-geography": validate_customers_sales_draft,
    "suppliers-procurement-inventory-logistics": validate_suppliers_procurement_draft,
    "facilities-capacity-operational-process": validate_facilities_capacity_draft,
    "technology-quality-rd-ip": validate_technology_quality_ip_draft,
    "workforce-collaborations-insurance-continuity": validate_workforce_insurance_draft,
    "competitive-strengths-strategy-confirmations": validate_strategy_confirmations_draft,
}
