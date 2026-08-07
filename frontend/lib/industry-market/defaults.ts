/**
 * Empty-record factories for Industry & Market (Increment IM1).
 */

import type {
  ClaimRecord,
  CommissionedReportDetails,
  CompanyMarketMappingRecord,
  CompetitionMarketShareAndIssuerPositioning,
  CompetitiveDimensionRecord,
  CompetitiveMetricRecord,
  CompetitorRecord,
  ConflictingResearchRecord,
  DemandDriverRecord,
  DemandDriversEndMarketsTrendsAndPolicy,
  EndMarketRecord,
  EntryBarrierRecord,
  GovernmentPolicyRecord,
  IndustryCapacityRecord,
  IndustryClassification,
  IndustryEvolution,
  IndustryMarketConfirmations,
  IndustryMarketPayload,
  IndustryMilestoneRecord,
  IndustryRiskRecord,
  IndustryScopeAndCompanyMarketMapping,
  IndustryTrendRecord,
  MacroeconomicAndIndustryContext,
  MacroeconomicIndicatorRecord,
  MarketDefinition,
  MarketSegmentationRecord,
  MarketSeriesForecastMetadata,
  MarketSeriesPeriodValue,
  MarketSeriesRecord,
  MarketShareRecord,
  MarketSizeSegmentationAndGrowth,
  OutlookIndustryRisksAndConfirmations,
  OutlookRecord,
  ResearchSourcesAndIndustryReportGovernance,
  ScopeExclusionRecord,
  SegmentMappingRecord,
  SourceMethodology,
  SourceRecord,
  SupplyFactorRecord,
  SupplySideStructure,
  ValueChainStageRecord,
  ValueChainSupplyStructureAndEntryBarriers,
} from '@/lib/schemas/industry-market';
import { INDUSTRY_MARKET_SCHEMA_VERSION } from '@/lib/schemas/industry-market';

function newId(id?: string): string {
  return id ?? crypto.randomUUID();
}

export function createEmptyIndustryClassification(): IndustryClassification {
  return {
    primaryIndustry: '',
    primarySubIndustry: '',
    secondaryIndustries: [],
    classificationSource: '',
    classificationCode: '',
    industryDescription: '',
    subIndustryDescription: '',
  };
}

export function createEmptyMarketDefinition(): MarketDefinition {
  return {
    marketName: '',
    marketDescription: '',
    productServiceCategory: '',
    relevantValueChainStage: '',
    geography: '',
    geographyDetail: '',
    endUserCustomerSegment: '',
    channelScope: '',
    organisedUnorganisedScope: '',
    b2bB2cB2gScope: '',
    marketBoundaryExplanation: '',
    relevanceToIssuerExplanation: '',
  };
}

export function createEmptyCompanyMarketMappingRecord(id?: string): CompanyMarketMappingRecord {
  return {
    id: newId(id),
    marketSegment: '',
    linkedProductServiceIds: [],
    linkedBusinessSegmentIds: [],
    customerIndustries: [],
    geographies: [],
    salesChannels: [],
    linkedFacilityIds: [],
    relevantRevenueContribution: '',
    relevantGeography: '',
    directIndirectParticipation: '',
    natureOfParticipation: '',
    materiality: '',
    relevantFinancialPeriod: '',
    notes: '',
  };
}

export function createEmptyScopeExclusionRecord(id?: string): ScopeExclusionRecord {
  return {
    id: newId(id),
    exclusionType: '',
    description: '',
    reasonExcluded: '',
    impactOnMarketSizeInterpretation: '',
    notes: '',
  };
}

export function createEmptyIndustryScopeAndCompanyMarketMapping(): IndustryScopeAndCompanyMarketMapping {
  return {
    industryClassification: createEmptyIndustryClassification(),
    marketDefinition: createEmptyMarketDefinition(),
    companyMarketMappings: [],
    scopeExclusions: [],
    notes: '',
  };
}

export function createEmptyCommissionedReportDetails(): CommissionedReportDetails {
  return {
    researchProvider: '',
    commissionedByIssuer: '',
    commissionedByPromoter: '',
    commissionedBySellingShareholder: '',
    whoPaid: '',
    engagementDate: '',
    reportDate: '',
    purpose: '',
    feePaymentStatus: '',
    independenceConfirmed: '',
    relationshipWithIssuerPromotersDirectorsKmpBrlm: '',
    consentNoObjectionStatus: '',
    consentDateReference: '',
    publicAvailabilityStatus: '',
    proposedWebsiteLocation: '',
    includedProposedAsMaterialDocument: '',
    providerDisclaimerCaptured: '',
    riskFactorDisclosureStatus: '',
    professionalReviewStatus: '',
  };
}

export function createEmptySourceMethodology(): SourceMethodology {
  return {
    primaryResearchUsed: '',
    secondaryResearchUsed: '',
    sampleSize: '',
    surveyPopulation: '',
    dataSources: '',
    calculationMethodology: '',
    forecastMethodology: '',
    keyAssumptions: '',
    limitations: '',
    confidenceRange: '',
    methodologyComparability: '',
    notes: '',
  };
}

export function createEmptySourceRecord(id?: string): SourceRecord {
  return {
    id: newId(id),
    sourceType: '',
    title: '',
    publisherAuthor: '',
    publicationDate: '',
    dataCutOffDate: '',
    version: '',
    urlReference: '',
    pageSectionReference: '',
    dateAccessed: '',
    geographyCovered: '',
    industryCovered: '',
    historicalPeriodCovered: '',
    forecastPeriodCovered: '',
    currency: '',
    unit: '',
    dataNature: '',
    commissionedReportDetails: createEmptyCommissionedReportDetails(),
    methodology: createEmptySourceMethodology(),
    sourceReadinessStatus: '',
    notes: '',
  };
}

export function createEmptyResearchSourcesAndIndustryReportGovernance(): ResearchSourcesAndIndustryReportGovernance {
  return {
    sources: [],
    notes: '',
  };
}

export function createEmptyMacroeconomicIndicatorRecord(id?: string): MacroeconomicIndicatorRecord {
  return {
    id: newId(id),
    indicatorName: '',
    category: '',
    geography: '',
    period: '',
    value: '',
    unit: '',
    actualEstimateForecast: '',
    sourceId: '',
    relevanceExplanation: '',
    notes: '',
  };
}

export function createEmptyIndustryEvolution(): IndustryEvolution {
  return {
    industryOriginDevelopment: '',
    structuralEvolution: '',
    formalisation: '',
    organisedUnorganisedTransition: '',
    consolidation: '',
    digitalisation: '',
    importSubstitution: '',
    exportDevelopment: '',
    consumerBusinessBehaviourChanges: '',
    importantRegulatoryChanges: '',
  };
}

export function createEmptyIndustryMilestoneRecord(id?: string): IndustryMilestoneRecord {
  return {
    id: newId(id),
    datePeriod: '',
    event: '',
    whatChanged: '',
    industryImpact: '',
    sourceId: '',
    notes: '',
  };
}

export function createEmptyMacroeconomicAndIndustryContext(): MacroeconomicAndIndustryContext {
  return {
    macroeconomicIndicators: [],
    industryEvolution: createEmptyIndustryEvolution(),
    industryMilestones: [],
    notes: '',
  };
}

export function createEmptyMarketSeriesPeriodValue(id?: string): MarketSeriesPeriodValue {
  return {
    id: newId(id),
    period: '',
    value: '',
    actualEstimateForecast: '',
    sourceId: '',
    notes: '',
  };
}

export function createEmptyMarketSeriesForecastMetadata(): MarketSeriesForecastMetadata {
  return {
    forecastStartPeriod: '',
    forecastEndPeriod: '',
    forecastValue: '',
    reportedCagr: '',
    forecastSourceId: '',
    keyAssumptions: '',
    forecastMethodology: '',
    forecastDate: '',
    scenario: '',
  };
}

export function createEmptyMarketSeriesRecord(id?: string): MarketSeriesRecord {
  return {
    id: newId(id),
    marketName: '',
    marketDefinition: '',
    geography: '',
    metric: '',
    currency: '',
    unit: '',
    nominalReal: '',
    primarySourceId: '',
    methodologyReference: '',
    periodValues: [],
    forecastMetadata: createEmptyMarketSeriesForecastMetadata(),
    notes: '',
  };
}

export function createEmptyMarketSegmentationRecord(id?: string): MarketSegmentationRecord {
  return {
    id: newId(id),
    parentMarketSeriesId: '',
    segmentationDimension: '',
    segmentName: '',
    period: '',
    marketSize: '',
    marketSharePercentage: '',
    growthRate: '',
    forecastValue: '',
    sourceId: '',
    relevanceToIssuer: '',
    notes: '',
  };
}

export function createEmptySegmentMappingRecord(id?: string): SegmentMappingRecord {
  return {
    id: newId(id),
    marketSegmentId: '',
    linkedBusinessOperationsSegmentId: '',
    linkedFinancialsReportingSegmentId: '',
    sameDefinition: '',
    differenceExplanation: '',
    notes: '',
  };
}

export function createEmptyMarketSizeSegmentationAndGrowth(): MarketSizeSegmentationAndGrowth {
  return {
    marketSeries: [],
    marketSegmentations: [],
    segmentMappings: [],
    notes: '',
  };
}

export function createEmptyDemandDriverRecord(id?: string): DemandDriverRecord {
  return {
    id: newId(id),
    title: '',
    category: '',
    description: '',
    mechanismAffectingDemand: '',
    marketSegmentsAffected: '',
    geography: '',
    historicalEvidence: '',
    quantifiedImpact: '',
    expectedDuration: '',
    actualEstimateForecast: '',
    sourceId: '',
    relevanceToIssuer: '',
    notes: '',
  };
}

export function createEmptyEndMarketRecord(id?: string): EndMarketRecord {
  return {
    id: newId(id),
    endUserIndustry: '',
    geography: '',
    currentSize: '',
    growth: '',
    shareOfIssuerRelevantDemand: '',
    demandCharacteristics: '',
    cyclicalDefensive: '',
    seasonality: '',
    keyPurchasingFactors: '',
    sourceId: '',
    linkedBusinessOperationsCustomerIndustry: '',
    notes: '',
  };
}

export function createEmptyIndustryTrendRecord(id?: string): IndustryTrendRecord {
  return {
    id: newId(id),
    trend: '',
    startObservedPeriod: '',
    timelineStatus: '',
    quantification: '',
    industryImpact: '',
    issuerSegmentImpact: '',
    expectedPersistence: '',
    sourceId: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyGovernmentPolicyRecord(id?: string): GovernmentPolicyRecord {
  return {
    id: newId(id),
    policyScheme: '',
    governmentRegulator: '',
    effectiveDate: '',
    expirySunsetDate: '',
    applicableMarket: '',
    nature: '',
    benefitRestriction: '',
    marketImpact: '',
    currentStatus: '',
    sourceId: '',
    notes: '',
  };
}

export function createEmptyDemandDriversEndMarketsTrendsAndPolicy(): DemandDriversEndMarketsTrendsAndPolicy {
  return {
    demandDrivers: [],
    endMarkets: [],
    industryTrends: [],
    governmentPolicies: [],
    notes: '',
  };
}

export function createEmptyValueChainStageRecord(id?: string): ValueChainStageRecord {
  return {
    id: newId(id),
    sequenceOrder: '',
    name: '',
    description: '',
    majorParticipantTypes: '',
    inputs: '',
    outputs: '',
    customerOfStage: '',
    supplierToStage: '',
    typicalEconomicsMargin: '',
    consolidatedFragmentedStatus: '',
    issuerParticipates: '',
    linkedBusinessOperationsActivity: '',
    sourceId: '',
    notes: '',
  };
}

export function createEmptySupplyFactorRecord(id?: string): SupplyFactorRecord {
  return {
    id: newId(id),
    factor: '',
    description: '',
    quantification: '',
    geography: '',
    sourceId: '',
    issuerRelevance: '',
    notes: '',
  };
}

export function createEmptySupplySideStructure(): SupplySideStructure {
  return {
    majorRawMaterialsInputs: '',
    domesticImportDependence: '',
    supplyConcentration: '',
    commodityExposure: '',
    capacityConstraints: '',
    availabilityConcerns: '',
    typicalLeadTimes: '',
    logisticsDependency: '',
    workingCapitalCharacteristics: '',
    importExportStructure: '',
    geographicProductionClusters: '',
    supplyFactors: [],
  };
}

export function createEmptyIndustryCapacityRecord(id?: string): IndustryCapacityRecord {
  return {
    id: newId(id),
    period: '',
    installedIndustryCapacity: '',
    production: '',
    capacityUtilisation: '',
    capacityAnnounced: '',
    capacityUnderConstruction: '',
    expectedCommissioning: '',
    demandCapacityBalance: '',
    unit: '',
    geography: '',
    sourceId: '',
    notes: '',
  };
}

export function createEmptyEntryBarrierRecord(id?: string): EntryBarrierRecord {
  return {
    id: newId(id),
    barrierType: '',
    description: '',
    strength: '',
    evidence: '',
    sourceId: '',
    relevanceToIssuer: '',
    notes: '',
  };
}

export function createEmptyValueChainSupplyStructureAndEntryBarriers(): ValueChainSupplyStructureAndEntryBarriers {
  return {
    valueChainStages: [],
    supplySideStructure: createEmptySupplySideStructure(),
    industryCapacityRecords: [],
    entryBarriers: [],
    notes: '',
  };
}

export function createEmptyCompetitorRecord(id?: string): CompetitorRecord {
  return {
    id: newId(id),
    companyName: '',
    listedUnlisted: '',
    publicPrivate: '',
    country: '',
    headquarters: '',
    industrySubIndustry: '',
    relevantProductsServices: '',
    relevantGeography: '',
    businessModel: '',
    scaleIndicator: '',
    sourceId: '',
    notes: '',
  };
}

export function createEmptyCompetitiveMetricRecord(id?: string): CompetitiveMetricRecord {
  return {
    id: newId(id),
    competitorId: '',
    metricType: '',
    value: '',
    periodDate: '',
    unit: '',
    marketScope: '',
    sourceId: '',
    comparableToIssuer: '',
    methodologyDifferences: '',
    notes: '',
  };
}

export function createEmptyCompetitiveDimensionRecord(id?: string): CompetitiveDimensionRecord {
  return {
    id: newId(id),
    competitorId: '',
    dimension: '',
    issuerPosition: '',
    competitorPosition: '',
    evidence: '',
    sourceId: '',
    comparable: '',
    notes: '',
  };
}

export function createEmptyMarketShareRecord(id?: string): MarketShareRecord {
  return {
    id: newId(id),
    metricBasis: '',
    marketDefinition: '',
    geography: '',
    segment: '',
    period: '',
    issuerNumerator: '',
    numeratorSource: '',
    linkedIssuerRecordId: '',
    totalMarketDenominator: '',
    denominatorSourceId: '',
    reportedMarketShare: '',
    independentVerificationStatus: '',
    professionalConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptyClaimRecord(id?: string): ClaimRecord {
  return {
    id: newId(id),
    exactProposedWording: '',
    claimType: '',
    metric: '',
    geography: '',
    marketDefinition: '',
    periodDate: '',
    comparatorUniverse: '',
    sourceId: '',
    pageReference: '',
    calculation: '',
    independentSource: '',
    commissionedReportSource: '',
    currentFreshEnough: '',
    conflictingSourceExists: '',
    proposedDrhpLocation: '',
    reviewStatus: '',
    notes: '',
  };
}

export function createEmptyCompetitionMarketShareAndIssuerPositioning(): CompetitionMarketShareAndIssuerPositioning {
  return {
    competitors: [],
    competitiveMetrics: [],
    competitiveDimensions: [],
    marketShareRecords: [],
    claims: [],
    notes: '',
  };
}

export function createEmptyOutlookRecord(id?: string): OutlookRecord {
  return {
    id: newId(id),
    market: '',
    geography: '',
    outlookPeriod: '',
    currentMarketSize: '',
    expectedMarketSize: '',
    expectedCagr: '',
    structuralChanges: '',
    demandDevelopments: '',
    supplyDevelopments: '',
    technologyOutlook: '',
    regulatoryPolicyOutlook: '',
    sourceId: '',
    dataNature: '',
    notes: '',
  };
}

export function createEmptyIndustryRiskRecord(id?: string): IndustryRiskRecord {
  return {
    id: newId(id),
    title: '',
    category: '',
    description: '',
    historicalEvidence: '',
    segmentsAffected: '',
    severityIfSourceProvides: '',
    duration: '',
    sourceId: '',
    relatedFutureRiskFactor: '',
    notes: '',
  };
}

export function createEmptyConflictingResearchRecord(id?: string): ConflictingResearchRecord {
  return {
    id: newId(id),
    topic: '',
    sourceAId: '',
    sourceBId: '',
    valueFromA: '',
    valueFromB: '',
    differentMarketDefinition: '',
    differentDates: '',
    differentMethodology: '',
    differentGeography: '',
    reconciled: '',
    preferredSourceId: '',
    basisForPreference: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyIndustryMarketConfirmations(): IndustryMarketConfirmations {
  return {
    industryScopeReflectsActualIssuerBusiness: false,
    marketDefinitionNotIntentionallyOverstated: false,
    materialIndustryClaimsHaveSources: false,
    sourcePublicationAccessDatesRecorded: false,
    historicalDataAndForecastsDistinguished: false,
    commissionedReportStatusDisclosed: false,
    researchProviderRelationshipDisclosed: false,
    methodologyLimitationsCaptured: false,
    industrySegmentsNotConfusedWithAccountingSegments: false,
    competitorListIsReasonable: false,
    marketShareNumeratorDenominatorDefinitionsMatch: false,
    comparatorUniversesDefined: false,
    leadingLargestTopClaimsSourced: false,
    conflictingMarketDataIdentified: false,
    staleDataFlagged: false,
    policySchemeStatusCurrent: false,
    companyOperationalDataReconcilesWithLinkedWorkstreams: false,
    professionalMerchantBankerReviewRemainsRequired: false,
  };
}

export function createEmptyOutlookIndustryRisksAndConfirmations(): OutlookIndustryRisksAndConfirmations {
  return {
    outlookRecords: [],
    industryRisks: [],
    conflictingResearch: [],
    confirmations: createEmptyIndustryMarketConfirmations(),
    notes: '',
  };
}

export function createEmptyIndustryMarketPayload(): IndustryMarketPayload {
  return {
    schemaVersion: INDUSTRY_MARKET_SCHEMA_VERSION,
    industryScopeAndCompanyMarketMapping: createEmptyIndustryScopeAndCompanyMarketMapping(),
    researchSourcesAndIndustryReportGovernance:
      createEmptyResearchSourcesAndIndustryReportGovernance(),
    macroeconomicAndIndustryContext: createEmptyMacroeconomicAndIndustryContext(),
    marketSizeSegmentationAndGrowth: createEmptyMarketSizeSegmentationAndGrowth(),
    demandDriversEndMarketsTrendsAndPolicy: createEmptyDemandDriversEndMarketsTrendsAndPolicy(),
    valueChainSupplyStructureAndEntryBarriers:
      createEmptyValueChainSupplyStructureAndEntryBarriers(),
    competitionMarketShareAndIssuerPositioning:
      createEmptyCompetitionMarketShareAndIssuerPositioning(),
    outlookIndustryRisksAndConfirmations: createEmptyOutlookIndustryRisksAndConfirmations(),
  };
}
