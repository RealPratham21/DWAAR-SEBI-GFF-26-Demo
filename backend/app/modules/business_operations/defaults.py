"""Empty canonical Business & Operations payload (schemaVersion 1) — mirrors frontend B1 exactly.

Every money / count / percentage field starts as `''` (never `0`, never `null`) and every
repeatable record receives a stable uuid `id` so cross-section links survive round-trips.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.business_operations.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_business_unit(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "unitName": "",
        "description": "",
        "activity": "",
        "commencementDate": "",
        "productsServicesCovered": "",
        "geography": "",
        "revenueContributionPercentage": "",
        "status": "",
        "notes": "",
    }


def create_empty_product_service(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "name": "",
        "productType": "",
        "businessSegment": "",
        "description": "",
        "mainFeatures": "",
        "customerProblemAddressed": "",
        "customerOrEndUserType": "",
        "industryServed": "",
        "brandName": "",
        "launchDate": "",
        "lifecycleStage": "",
        "sourcingModel": "",
        "pricingModel": "",
        "typicalOrderOrContractSize": "",
        "revenueRecognitionModel": "",
        "domesticExportClassification": "",
        "requiredLicencesOrCertifications": "",
        "notes": "",
    }


def create_empty_revenue_mix_row(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "productOrSegmentId": "",
        "productOrSegmentLabel": "",
        "financialYear": "",
        "revenue": "",
        "percentageOfRevenueFromOperations": "",
        "source": "",
        "notes": "",
    }


def create_empty_offering_change(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "offeringName": "",
        "changeType": "",
        "changeDate": "",
        "reason": "",
        "currentCommercialStatus": "",
        "notes": "",
    }


def create_empty_customer_concentration_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodLabel": "",
        "isCurrentPeriod": False,
        "largestCustomerRevenue": "",
        "largestCustomerPercentage": "",
        "top3Revenue": "",
        "top3Percentage": "",
        "top5Revenue": "",
        "top5Percentage": "",
        "top10Revenue": "",
        "top10Percentage": "",
        "totalRevenueFromOperations": "",
        "source": "",
        "notes": "",
    }


def create_empty_material_customer(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "customerNameOrConfidentialLabel": "",
        "industry": "",
        "country": "",
        "relationshipSince": "",
        "revenueContributionPercentage": "",
        "contractType": "",
        "contractExpiry": "",
        "disclosureConsentStatus": "",
        "notes": "",
    }


def create_empty_sales_channel(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "channelType": "",
        "geography": "",
        "revenueContributionPercentage": "",
        "commissionOrMarginStructure": "",
        "exclusivity": "",
        "creditTerms": "",
        "keyDependency": "",
        "notes": "",
    }


def create_empty_geographic_revenue(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodLabel": "",
        "geographicScope": "",
        "regionOrCountry": "",
        "revenue": "",
        "percentageOfRevenue": "",
        "source": "",
        "notes": "",
    }


def create_empty_key_input(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "inputName": "",
        "category": "",
        "productsServicesSupported": "",
        "domesticOrImported": "",
        "criticalInput": "",
        "commodityLinkedPrice": "",
        "substituteAvailable": "",
        "typicalLeadTime": "",
        "storageRequirement": "",
        "priceVolatility": "",
        "regulatoryOrImportRestriction": "",
        "notes": "",
    }


def create_empty_supplier_concentration_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodLabel": "",
        "isCurrentPeriod": False,
        "totalSuppliers": "",
        "largestSupplierPurchaseValue": "",
        "largestSupplierPercentage": "",
        "top3PurchaseValue": "",
        "top3Percentage": "",
        "top5PurchaseValue": "",
        "top5Percentage": "",
        "top10PurchaseValue": "",
        "top10Percentage": "",
        "totalPurchases": "",
        "importedPurchasePercentage": "",
        "relatedPartySupplierPercentage": "",
        "source": "",
        "notes": "",
    }


def create_empty_material_supplier(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "supplierNameOrConfidentialLabel": "",
        "inputSupplied": "",
        "relationshipSince": "",
        "country": "",
        "longTermAgreement": "",
        "exclusivity": "",
        "singleSourceDependency": "",
        "contractExpiry": "",
        "alternativeSupplierAvailable": "",
        "creditTerms": "",
        "disclosureConsentStatus": "",
        "notes": "",
    }


def create_empty_facility(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "name": "",
        "facilityType": "",
        "address": "",
        "stateOrCountry": "",
        "tenure": "",
        "operationalSince": "",
        "status": "",
        "area": "",
        "mainFunctions": "",
        "productsServicesSupported": "",
        "numberOfShifts": "",
        "workforceCount": "",
        "leaseExpiry": "",
        "materialLicencesRequired": "",
        "notes": "",
    }


def create_empty_capacity_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "facilityId": "",
        "facilityName": "",
        "periodLabel": "",
        "isCurrentPeriod": False,
        "metricOrCapacityUnit": "",
        "metricDescription": "",
        "installedCapacity": "",
        "availableCapacity": "",
        "actualOutput": "",
        "numberOfShifts": "",
        "bottleneckCapacity": "",
        "utilisationAbove100Explanation": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_planned_capacity(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "description": "",
        "facilityId": "",
        "facilityName": "",
        "capacityBeingAdded": "",
        "expectedCommissioningPeriod": "",
        "status": "",
        "approvalStatus": "",
        "fundingSource": "",
        "relatedObjectsOfTheIssueReference": "",
        "keyDependencies": "",
        "notes": "",
    }


def create_empty_operating_process_step(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "stepNumber": "",
        "processName": "",
        "description": "",
        "input": "",
        "output": "",
        "facilityId": "",
        "facilityName": "",
        "technologyOrMachinery": "",
        "qualityCheckpoint": "",
        "executionModel": "",
        "notes": "",
    }


def create_empty_machinery_equipment(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "nameOrType": "",
        "facilityId": "",
        "facilityName": "",
        "functionDescription": "",
        "quantity": "",
        "ageYears": "",
        "tenure": "",
        "supplier": "",
        "installedDate": "",
        "remainingUsefulLife": "",
        "origin": "",
        "status": "",
        "notes": "",
    }


def create_empty_quality_certification(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "standard": "",
        "certificateNumber": "",
        "issuingBody": "",
        "scope": "",
        "issueDate": "",
        "expiryDate": "",
        "renewalStatus": "",
        "notes": "",
    }


def create_empty_rd_spend_row(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "financialYear": "",
        "spendAmount": "",
        "source": "",
        "notes": "",
    }


def create_empty_intellectual_property_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "ipType": "",
        "nameOrDescription": "",
        "ownerOrApplicant": "",
        "registrationOrApplicationNumber": "",
        "jurisdiction": "",
        "status": "",
        "filingDate": "",
        "registrationDate": "",
        "expiryDate": "",
        "relatedProducts": "",
        "ownershipModel": "",
        "licenceTerms": "",
        "materialityStatus": "",
        "disputeOrOpposition": "",
        "disputeOrOppositionDetails": "",
        "notes": "",
    }


def create_empty_workforce_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "asOfDate": "",
        "periodLabel": "",
        "isCurrentPeriod": False,
        "permanentEmployees": "",
        "contractWorkers": "",
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


def create_empty_collaboration(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "party": "",
        "country": "",
        "nature": "",
        "agreementDate": "",
        "term": "",
        "exclusivity": "",
        "geography": "",
        "supportOrServicesReceived": "",
        "renewalOrTerminationStatus": "",
        "materialDependency": "",
        "notes": "",
    }


def create_empty_operating_dependency(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "dependencyType": "",
        "description": "",
        "applicable": "",
        "counterpartyOrProvider": "",
        "quantification": "",
        "mitigation": "",
        "materialityStatus": "",
        "notes": "",
    }


def create_empty_insurance_policy(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "policyType": "",
        "insurer": "",
        "coverage": "",
        "sumInsured": "",
        "policyPeriod": "",
        "deductible": "",
        "keyExclusions": "",
        "claimsHistory": "",
        "renewalStatus": "",
        "notes": "",
    }


def create_empty_competitive_strength(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "title": "",
        "explanation": "",
        "supportingMetric": "",
        "period": "",
        "supportingSource": "",
        "relatedProductFacilityOrCustomer": "",
        "companyConfirmation": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_strategy_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "title": "",
        "description": "",
        "category": "",
        "timeHorizon": "",
        "currentStatus": "",
        "requiredResources": "",
        "dependencies": "",
        "relatedObjectsOfTheIssueReference": "",
        "boardApprovedStatus": "",
        "supportingPlanOrSource": "",
        "risks": "",
        "containsUnsupportedProjections": "",
        "notes": "",
    }


def create_empty_key_dependency(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "dependencyType": "",
        "description": "",
        "quantification": "",
        "mitigation": "",
        "materialityStatus": "",
        "relatedFutureRiskFactor": "",
        "notes": "",
    }


def create_empty_business_operations_confirmations() -> dict[str, Any]:
    return {
        "allMaterialActivitiesDisclosed": False,
        "productsAndServicesAreComplete": False,
        "revenueMixReconciles": False,
        "customerConcentrationIsComplete": False,
        "supplierConcentrationIsComplete": False,
        "allFacilitiesAreIncluded": False,
        "capacityUnitsAndFiguresAreConsistent": False,
        "outsourcedOperationsAreDisclosed": False,
        "technologyAndIpDependenciesAreDisclosed": False,
        "qualityIncidentsAndRecallsAreDisclosed": False,
        "insuranceAndContinuityInformationIsComplete": False,
        "strengthClaimsHaveSupportingSources": False,
        "strategiesContainNoUnsupportedProjections": False,
        "professionalReviewRemainsRequired": False,
    }


def create_empty_business_profile_and_operating_model() -> dict[str, Any]:
    return {
        "businessCommencementDate": "",
        "businessClassifications": [],
        "otherBusinessClassificationDetails": "",
        "primaryBusinessActivity": "",
        "secondaryBusinessActivities": "",
        "briefBusinessOverview": "",
        "positionInValueChain": "",
        "customerModel": "",
        "revenueModels": [],
        "otherRevenueModelDetails": "",
        "orderModel": "",
        "domesticOperations": "",
        "exportOperations": "",
        "regionsCountriesServed": "",
        "seasonalityOrCyclicality": "",
        "seasonalityDetails": "",
        "workingCapitalIntensiveBusiness": "",
        "materialThirdPartyDependence": "",
        "materialThirdPartyDependenceDetails": "",
        "materialRegulatoryDependence": "",
        "materialRegulatoryDependenceDetails": "",
        "valueCreationAndDeliveryExplanation": "",
        "businessUnits": [],
        "notes": "",
    }


def create_empty_products_services_and_revenue_mix() -> dict[str, Any]:
    return {
        "productsServices": [],
        "revenueMixRows": [],
        "offeringChanges": [],
        "notes": "",
    }


def create_empty_customers_sales_distribution_and_geography() -> dict[str, Any]:
    return {
        "approximateActiveCustomerCount": "",
        "customerCategories": "",
        "industriesServed": "",
        "repeatCustomerPercentage": "",
        "averageRelationshipDuration": "",
        "governmentTenderDependence": "",
        "largeEnterpriseDependence": "",
        "longTermContractsAvailable": "",
        "purchaseOrderDependence": "",
        "creditTerms": "",
        "returnsOrCancellationPolicy": "",
        "customerConcentrationPeriods": [],
        "materialCustomers": [],
        "salesChannels": [],
        "geographicRevenueRows": [],
        "orderBookAvailable": "",
        "orderBookValue": "",
        "orderBookAsOfDate": "",
        "orderBookExecutionPeriod": "",
        "orderBookCancellationConditions": "",
        "orderBookSecurityClassification": "",
        "orderBookCustomerConcentration": "",
        "orderBookRevenueAlreadyRecognised": "",
        "orderBookSourceStatus": "",
        "orderBookExcludesQuotationsAndNonBindingProposals": "",
        "notes": "",
    }


def create_empty_suppliers_procurement_inventory_and_logistics() -> dict[str, Any]:
    return {
        "keyInputs": [],
        "supplierConcentrationPeriods": [],
        "materialSuppliers": [],
        "procurementModel": "",
        "purchaseOrderOrContractModel": "",
        "pricingMethod": "",
        "supplierQualificationProcess": "",
        "qualityInspectionProcess": "",
        "replacementProcess": "",
        "typicalProcurementLeadTime": "",
        "relatedPartySupplierDependence": "",
        "productionModel": "",
        "inventoryHoldingPeriodRawMaterials": "",
        "inventoryHoldingPeriodFinishedGoods": "",
        "safetyStockApproach": "",
        "obsolescenceOrPerishabilityExposure": "",
        "materialWriteOffs": "",
        "materialWriteOffDetails": "",
        "warehousingArrangement": "",
        "logisticsModel": "",
        "transportModes": "",
        "portsUsed": "",
        "deliveryResponsibilities": "",
        "materialLogisticsDependency": "",
        "logisticsBackupArrangements": "",
        "notes": "",
    }


def create_empty_facilities_capacity_and_operational_process() -> dict[str, Any]:
    return {
        "facilities": [],
        "capacityRecords": [],
        "plannedCapacityItems": [],
        "operatingProcessSteps": [],
        "electricityDependency": "",
        "captivePowerAvailable": "",
        "waterDependency": "",
        "fuelDependency": "",
        "internetOrDataInfrastructureDependency": "",
        "wasteManagementArrangements": "",
        "utilityBackupArrangements": "",
        "utilityInterruptionsExperienced": "",
        "utilityInterruptionsDetails": "",
        "utilityCapacityConstraints": "",
        "utilityCapacityConstraintDetails": "",
        "notes": "",
    }


def create_empty_technology_quality_research_and_intellectual_property() -> dict[str, Any]:
    return {
        "coreOperatingTechnology": "",
        "technologyOwnership": "",
        "automationLevel": "",
        "criticalSoftwareSystems": "",
        "erpOrCrmSystems": "",
        "hostingModel": "",
        "cybersecurityFramework": "",
        "backupAndDisasterRecovery": "",
        "obsolescenceExposure": "",
        "thirdPartyTechnologyDependence": "",
        "thirdPartyTechnologyDependenceDetails": "",
        "technologyCollaborations": "",
        "machineryAndEquipment": [],
        "qualityProcess": "",
        "inspectionStages": "",
        "laboratoryOrTestingArrangements": "",
        "rejectionRatePercentage": "",
        "returnOrRecallRatePercentage": "",
        "qualityClaims": "",
        "qualityClaimsDetails": "",
        "materialRecallDeclaration": "",
        "materialRecallDetails": "",
        "certifications": [],
        "rdFunctionExists": "",
        "rdDeliveryModel": "",
        "rdEmployeeCount": "",
        "rdFacilities": "",
        "rdSpendRows": [],
        "rdCurrentProjects": "",
        "rdCommercialisedOutcomes": "",
        "rdGrants": "",
        "rdCollaborations": "",
        "intellectualPropertyRecords": [],
        "notes": "",
    }


def create_empty_workforce_collaborations_insurance_and_continuity() -> dict[str, Any]:
    return {
        "workforcePeriods": [],
        "labourDisputes": "",
        "labourDisputeDetails": "",
        "trainingProgrammes": "",
        "specialisedSkillDependence": "",
        "specialisedSkillDependenceDetails": "",
        "labourContractorUsage": "",
        "labourContractorDetails": "",
        "collaborations": [],
        "operatingDependencies": [],
        "insurancePolicies": [],
        "managementConsidersCoverageAdequate": "",
        "professionalInsuranceReviewPerformed": "",
        "materialUninsuredOperations": "",
        "materialUninsuredOperationsDetails": "",
        "keyPersonInsuranceInPlace": "",
        "cyberInsuranceInPlace": "",
        "businessContinuityPlanExists": "",
        "disasterRecoveryPlanExists": "",
        "alternateFacilityAvailable": "",
        "backupSuppliersAvailable": "",
        "backupPowerOrDataAvailable": "",
        "cyberIncidentResponsePlanExists": "",
        "continuityLastTestDate": "",
        "materialInterruptionsExperienced": "",
        "materialInterruptionsDetails": "",
        "maximumDowntimeExperienced": "",
        "recoveryStatus": "",
        "notes": "",
    }


def create_empty_competitive_strengths_strategy_dependencies_and_confirmations() -> dict[str, Any]:
    return {
        "competitiveStrengths": [],
        "strategies": [],
        "keyDependencies": [],
        "confirmations": create_empty_business_operations_confirmations(),
        "notes": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "businessProfileAndOperatingModel": create_empty_business_profile_and_operating_model(),
        "productsServicesAndRevenueMix": create_empty_products_services_and_revenue_mix(),
        "customersSalesDistributionAndGeography": (
            create_empty_customers_sales_distribution_and_geography()
        ),
        "suppliersProcurementInventoryAndLogistics": (
            create_empty_suppliers_procurement_inventory_and_logistics()
        ),
        "facilitiesCapacityAndOperationalProcess": (
            create_empty_facilities_capacity_and_operational_process()
        ),
        "technologyQualityResearchAndIntellectualProperty": (
            create_empty_technology_quality_research_and_intellectual_property()
        ),
        "workforceCollaborationsInsuranceAndContinuity": (
            create_empty_workforce_collaborations_insurance_and_continuity()
        ),
        "competitiveStrengthsStrategyDependenciesAndConfirmations": (
            create_empty_competitive_strengths_strategy_dependencies_and_confirmations()
        ),
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
