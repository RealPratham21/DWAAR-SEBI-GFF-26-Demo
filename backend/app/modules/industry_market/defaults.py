"""Empty-record factories for Industry & Market — mirrors frontend IM1 exactly."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.industry_market.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_industry_classification() -> dict[str, Any]:
    return {
        "primaryIndustry": "",
        "primarySubIndustry": "",
        "secondaryIndustries": [],
        "classificationSource": "",
        "classificationCode": "",
        "industryDescription": "",
        "subIndustryDescription": "",
    }


def create_empty_market_definition() -> dict[str, Any]:
    return {
        "marketName": "",
        "marketDescription": "",
        "productServiceCategory": "",
        "relevantValueChainStage": "",
        "geography": "",
        "geographyDetail": "",
        "endUserCustomerSegment": "",
        "channelScope": "",
        "organisedUnorganisedScope": "",
        "b2bB2cB2gScope": "",
        "marketBoundaryExplanation": "",
        "relevanceToIssuerExplanation": "",
    }


def create_empty_company_market_mapping_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "marketSegment": "",
        "linkedProductServiceIds": [],
        "linkedBusinessSegmentIds": [],
        "customerIndustries": [],
        "geographies": [],
        "salesChannels": [],
        "linkedFacilityIds": [],
        "relevantRevenueContribution": "",
        "relevantGeography": "",
        "directIndirectParticipation": "",
        "natureOfParticipation": "",
        "materiality": "",
        "relevantFinancialPeriod": "",
        "notes": "",
    }


def create_empty_scope_exclusion_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "exclusionType": "",
        "description": "",
        "reasonExcluded": "",
        "impactOnMarketSizeInterpretation": "",
        "notes": "",
    }


def create_empty_industry_scope_and_company_market_mapping() -> dict[str, Any]:
    return {
        "industryClassification": create_empty_industry_classification(),
        "marketDefinition": create_empty_market_definition(),
        "companyMarketMappings": [],
        "scopeExclusions": [],
        "notes": "",
    }


def create_empty_commissioned_report_details() -> dict[str, Any]:
    return {
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
    }


def create_empty_source_methodology() -> dict[str, Any]:
    return {
        "primaryResearchUsed": "",
        "secondaryResearchUsed": "",
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
    }


def create_empty_source_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "sourceType": "",
        "title": "",
        "publisherAuthor": "",
        "publicationDate": "",
        "dataCutOffDate": "",
        "version": "",
        "urlReference": "",
        "pageSectionReference": "",
        "dateAccessed": "",
        "geographyCovered": "",
        "industryCovered": "",
        "historicalPeriodCovered": "",
        "forecastPeriodCovered": "",
        "currency": "",
        "unit": "",
        "dataNature": "",
        "commissionedReportDetails": create_empty_commissioned_report_details(),
        "methodology": create_empty_source_methodology(),
        "sourceReadinessStatus": "",
        "notes": "",
    }


def create_empty_research_sources_and_industry_report_governance() -> dict[str, Any]:
    return {"sources": [], "notes": ""}


def create_empty_macroeconomic_indicator_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "indicatorName": "",
        "category": "",
        "geography": "",
        "period": "",
        "value": "",
        "unit": "",
        "actualEstimateForecast": "",
        "sourceId": "",
        "relevanceExplanation": "",
        "notes": "",
    }


def create_empty_industry_evolution() -> dict[str, Any]:
    return {
        "industryOriginDevelopment": "",
        "structuralEvolution": "",
        "formalisation": "",
        "organisedUnorganisedTransition": "",
        "consolidation": "",
        "digitalisation": "",
        "importSubstitution": "",
        "exportDevelopment": "",
        "consumerBusinessBehaviourChanges": "",
        "importantRegulatoryChanges": "",
    }


def create_empty_industry_milestone_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "datePeriod": "",
        "event": "",
        "whatChanged": "",
        "industryImpact": "",
        "sourceId": "",
        "notes": "",
    }


def create_empty_macroeconomic_and_industry_context() -> dict[str, Any]:
    return {
        "macroeconomicIndicators": [],
        "industryEvolution": create_empty_industry_evolution(),
        "industryMilestones": [],
        "notes": "",
    }


def create_empty_market_series_period_value(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "period": "",
        "value": "",
        "actualEstimateForecast": "",
        "sourceId": "",
        "notes": "",
    }


def create_empty_market_series_forecast_metadata() -> dict[str, Any]:
    return {
        "forecastStartPeriod": "",
        "forecastEndPeriod": "",
        "forecastValue": "",
        "reportedCagr": "",
        "forecastSourceId": "",
        "keyAssumptions": "",
        "forecastMethodology": "",
        "forecastDate": "",
        "scenario": "",
    }


def create_empty_market_series_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "marketName": "",
        "marketDefinition": "",
        "geography": "",
        "metric": "",
        "currency": "",
        "unit": "",
        "nominalReal": "",
        "primarySourceId": "",
        "methodologyReference": "",
        "periodValues": [],
        "forecastMetadata": create_empty_market_series_forecast_metadata(),
        "notes": "",
    }


def create_empty_market_segmentation_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "parentMarketSeriesId": "",
        "segmentationDimension": "",
        "segmentName": "",
        "period": "",
        "marketSize": "",
        "marketSharePercentage": "",
        "growthRate": "",
        "forecastValue": "",
        "sourceId": "",
        "relevanceToIssuer": "",
        "notes": "",
    }


def create_empty_segment_mapping_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "marketSegmentId": "",
        "linkedBusinessOperationsSegmentId": "",
        "linkedFinancialsReportingSegmentId": "",
        "sameDefinition": "",
        "differenceExplanation": "",
        "notes": "",
    }


def create_empty_market_size_segmentation_and_growth() -> dict[str, Any]:
    return {
        "marketSeries": [],
        "marketSegmentations": [],
        "segmentMappings": [],
        "notes": "",
    }


def create_empty_demand_driver_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "title": "",
        "category": "",
        "description": "",
        "mechanismAffectingDemand": "",
        "marketSegmentsAffected": "",
        "geography": "",
        "historicalEvidence": "",
        "quantifiedImpact": "",
        "expectedDuration": "",
        "actualEstimateForecast": "",
        "sourceId": "",
        "relevanceToIssuer": "",
        "notes": "",
    }


def create_empty_end_market_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "endUserIndustry": "",
        "geography": "",
        "currentSize": "",
        "growth": "",
        "shareOfIssuerRelevantDemand": "",
        "demandCharacteristics": "",
        "cyclicalDefensive": "",
        "seasonality": "",
        "keyPurchasingFactors": "",
        "sourceId": "",
        "linkedBusinessOperationsCustomerIndustry": "",
        "notes": "",
    }


def create_empty_industry_trend_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "trend": "",
        "startObservedPeriod": "",
        "timelineStatus": "",
        "quantification": "",
        "industryImpact": "",
        "issuerSegmentImpact": "",
        "expectedPersistence": "",
        "sourceId": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_government_policy_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "policyScheme": "",
        "governmentRegulator": "",
        "effectiveDate": "",
        "expirySunsetDate": "",
        "applicableMarket": "",
        "nature": "",
        "benefitRestriction": "",
        "marketImpact": "",
        "currentStatus": "",
        "sourceId": "",
        "notes": "",
    }


def create_empty_demand_drivers_end_markets_trends_and_policy() -> dict[str, Any]:
    return {
        "demandDrivers": [],
        "endMarkets": [],
        "industryTrends": [],
        "governmentPolicies": [],
        "notes": "",
    }


def create_empty_value_chain_stage_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "sequenceOrder": "",
        "name": "",
        "description": "",
        "majorParticipantTypes": "",
        "inputs": "",
        "outputs": "",
        "customerOfStage": "",
        "supplierToStage": "",
        "typicalEconomicsMargin": "",
        "consolidatedFragmentedStatus": "",
        "issuerParticipates": "",
        "linkedBusinessOperationsActivity": "",
        "sourceId": "",
        "notes": "",
    }


def create_empty_supply_factor_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "factor": "",
        "description": "",
        "quantification": "",
        "geography": "",
        "sourceId": "",
        "issuerRelevance": "",
        "notes": "",
    }


def create_empty_supply_side_structure() -> dict[str, Any]:
    return {
        "majorRawMaterialsInputs": "",
        "domesticImportDependence": "",
        "supplyConcentration": "",
        "commodityExposure": "",
        "capacityConstraints": "",
        "availabilityConcerns": "",
        "typicalLeadTimes": "",
        "logisticsDependency": "",
        "workingCapitalCharacteristics": "",
        "importExportStructure": "",
        "geographicProductionClusters": "",
        "supplyFactors": [],
    }


def create_empty_industry_capacity_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "period": "",
        "installedIndustryCapacity": "",
        "production": "",
        "capacityUtilisation": "",
        "capacityAnnounced": "",
        "capacityUnderConstruction": "",
        "expectedCommissioning": "",
        "demandCapacityBalance": "",
        "unit": "",
        "geography": "",
        "sourceId": "",
        "notes": "",
    }


def create_empty_entry_barrier_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "barrierType": "",
        "description": "",
        "strength": "",
        "evidence": "",
        "sourceId": "",
        "relevanceToIssuer": "",
        "notes": "",
    }


def create_empty_value_chain_supply_structure_and_entry_barriers() -> dict[str, Any]:
    return {
        "valueChainStages": [],
        "supplySideStructure": create_empty_supply_side_structure(),
        "industryCapacityRecords": [],
        "entryBarriers": [],
        "notes": "",
    }


def create_empty_competitor_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "companyName": "",
        "listedUnlisted": "",
        "publicPrivate": "",
        "country": "",
        "headquarters": "",
        "industrySubIndustry": "",
        "relevantProductsServices": "",
        "relevantGeography": "",
        "businessModel": "",
        "scaleIndicator": "",
        "sourceId": "",
        "notes": "",
    }


def create_empty_competitive_metric_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "competitorId": "",
        "metricType": "",
        "value": "",
        "periodDate": "",
        "unit": "",
        "marketScope": "",
        "sourceId": "",
        "comparableToIssuer": "",
        "methodologyDifferences": "",
        "notes": "",
    }


def create_empty_competitive_dimension_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "competitorId": "",
        "dimension": "",
        "issuerPosition": "",
        "competitorPosition": "",
        "evidence": "",
        "sourceId": "",
        "comparable": "",
        "notes": "",
    }


def create_empty_market_share_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "metricBasis": "",
        "marketDefinition": "",
        "geography": "",
        "segment": "",
        "period": "",
        "issuerNumerator": "",
        "numeratorSource": "",
        "linkedIssuerRecordId": "",
        "totalMarketDenominator": "",
        "denominatorSourceId": "",
        "reportedMarketShare": "",
        "independentVerificationStatus": "",
        "professionalConfirmationStatus": "",
        "notes": "",
    }


def create_empty_claim_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "exactProposedWording": "",
        "claimType": "",
        "metric": "",
        "geography": "",
        "marketDefinition": "",
        "periodDate": "",
        "comparatorUniverse": "",
        "sourceId": "",
        "pageReference": "",
        "calculation": "",
        "independentSource": "",
        "commissionedReportSource": "",
        "currentFreshEnough": "",
        "conflictingSourceExists": "",
        "proposedDrhpLocation": "",
        "reviewStatus": "",
        "notes": "",
    }


def create_empty_competition_market_share_and_issuer_positioning() -> dict[str, Any]:
    return {
        "competitors": [],
        "competitiveMetrics": [],
        "competitiveDimensions": [],
        "marketShareRecords": [],
        "claims": [],
        "notes": "",
    }


def create_empty_outlook_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "market": "",
        "geography": "",
        "outlookPeriod": "",
        "currentMarketSize": "",
        "expectedMarketSize": "",
        "expectedCagr": "",
        "structuralChanges": "",
        "demandDevelopments": "",
        "supplyDevelopments": "",
        "technologyOutlook": "",
        "regulatoryPolicyOutlook": "",
        "sourceId": "",
        "dataNature": "",
        "notes": "",
    }


def create_empty_industry_risk_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "title": "",
        "category": "",
        "description": "",
        "historicalEvidence": "",
        "segmentsAffected": "",
        "severityIfSourceProvides": "",
        "duration": "",
        "sourceId": "",
        "relatedFutureRiskFactor": "",
        "notes": "",
    }


def create_empty_conflicting_research_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "topic": "",
        "sourceAId": "",
        "sourceBId": "",
        "valueFromA": "",
        "valueFromB": "",
        "differentMarketDefinition": "",
        "differentDates": "",
        "differentMethodology": "",
        "differentGeography": "",
        "reconciled": "",
        "preferredSourceId": "",
        "basisForPreference": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_industry_market_confirmations() -> dict[str, Any]:
    return {
        "industryScopeReflectsActualIssuerBusiness": False,
        "marketDefinitionNotIntentionallyOverstated": False,
        "materialIndustryClaimsHaveSources": False,
        "sourcePublicationAccessDatesRecorded": False,
        "historicalDataAndForecastsDistinguished": False,
        "commissionedReportStatusDisclosed": False,
        "researchProviderRelationshipDisclosed": False,
        "methodologyLimitationsCaptured": False,
        "industrySegmentsNotConfusedWithAccountingSegments": False,
        "competitorListIsReasonable": False,
        "marketShareNumeratorDenominatorDefinitionsMatch": False,
        "comparatorUniversesDefined": False,
        "leadingLargestTopClaimsSourced": False,
        "conflictingMarketDataIdentified": False,
        "staleDataFlagged": False,
        "policySchemeStatusCurrent": False,
        "companyOperationalDataReconcilesWithLinkedWorkstreams": False,
        "professionalMerchantBankerReviewRemainsRequired": False,
    }


def create_empty_outlook_industry_risks_and_confirmations() -> dict[str, Any]:
    return {
        "outlookRecords": [],
        "industryRisks": [],
        "conflictingResearch": [],
        "confirmations": create_empty_industry_market_confirmations(),
        "notes": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "industryScopeAndCompanyMarketMapping": (
            create_empty_industry_scope_and_company_market_mapping()
        ),
        "researchSourcesAndIndustryReportGovernance": (
            create_empty_research_sources_and_industry_report_governance()
        ),
        "macroeconomicAndIndustryContext": create_empty_macroeconomic_and_industry_context(),
        "marketSizeSegmentationAndGrowth": create_empty_market_size_segmentation_and_growth(),
        "demandDriversEndMarketsTrendsAndPolicy": (
            create_empty_demand_drivers_end_markets_trends_and_policy()
        ),
        "valueChainSupplyStructureAndEntryBarriers": (
            create_empty_value_chain_supply_structure_and_entry_barriers()
        ),
        "competitionMarketShareAndIssuerPositioning": (
            create_empty_competition_market_share_and_issuer_positioning()
        ),
        "outlookIndustryRisksAndConfirmations": (
            create_empty_outlook_industry_risks_and_confirmations()
        ),
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
