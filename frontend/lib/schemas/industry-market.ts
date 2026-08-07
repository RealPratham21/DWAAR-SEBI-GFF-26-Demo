/**
 * Canonical Industry & Market payload schema (Increment IM1).
 *
 * Contract notes for the backend increment that follows (IM2):
 * - Persist `IndustryMarketPayload` (`schemaVersion: 1`) exactly — same keys, enums, emptiness.
 * - Every market value, percentage and CAGR is a Decimal-safe STRING.
 *   Empty is `''` (never `null`, never `0`).
 * - Ternary answers use `'' | 'yes' | 'no' | 'not_sure'`. Empty must never be coerced to `'no'`.
 * - Computed values (YoY growth, CAGR, market share, segment reconciliation, assessment outcomes)
 *   are DERIVED and are never persisted here.
 * - Repeatable records carry stable `id`s generated with `crypto.randomUUID()`.
 * - UI labels live in `lib/industry-market/options.ts` and must never appear in the payload.
 * - Assessment states are defined in lib helpers only — not persisted in this schema.
 */

import { z } from 'zod';

export const INDUSTRY_MARKET_SCHEMA_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];

export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const CLASSIFICATION_SOURCE_VALUES = [
  'nic',
  'government-classification',
  'exchange-sector-classification',
  'research-provider-taxonomy',
  'internal-classification',
  'other',
] as const;
export type ClassificationSource = (typeof CLASSIFICATION_SOURCE_VALUES)[number];

export const GEOGRAPHY_VALUES = [
  'india',
  'specific-state',
  'specific-region',
  'global',
  'india-export-markets',
  'other',
] as const;
export type Geography = (typeof GEOGRAPHY_VALUES)[number];

export const SOURCE_TYPE_VALUES = [
  'commissioned-industry-report',
  'government-publication',
  'regulatory-publication',
  'industry-association',
  'multilateral-institution',
  'academic-publication',
  'company-filing',
  'exchange-filing',
  'paid-database',
  'public-research-report',
  'news-publication',
  'internal-company-information',
  'other',
] as const;
export type SourceType = (typeof SOURCE_TYPE_VALUES)[number];

export const DATA_NATURE_VALUES = [
  'actual',
  'estimated',
  'forecast-projected',
  'survey-based',
  'modelled',
  'derived',
  'management-estimate',
] as const;
export type DataNature = (typeof DATA_NATURE_VALUES)[number];

export const SOURCE_READINESS_STATUS_VALUES = [
  'current',
  'potentially_stale',
  'superseded',
  'methodology_unclear',
  'pending_verification',
  'professional_confirmation_required',
] as const;
export type SourceReadinessStatus = (typeof SOURCE_READINESS_STATUS_VALUES)[number];

export const MARKET_METRIC_VALUES = [
  'revenue-value',
  'volume',
  'installed-base',
  'units-sold',
  'production',
  'consumption',
  'capacity',
  'transactions',
  'users',
  'aum-assets',
  'stores-outlets',
  'beds',
  'other',
] as const;
export type MarketMetric = (typeof MARKET_METRIC_VALUES)[number];

export const ACTUAL_ESTIMATE_FORECAST_VALUES = ['actual', 'estimate', 'forecast'] as const;
export type ActualEstimateForecast = (typeof ACTUAL_ESTIMATE_FORECAST_VALUES)[number];

export const SEGMENTATION_DIMENSION_VALUES = [
  'product',
  'service',
  'customer-end-user',
  'geography',
  'price-tier',
  'channel',
  'technology',
  'organised-unorganised',
  'application',
  'industry-vertical',
  'other',
] as const;
export type SegmentationDimension = (typeof SEGMENTATION_DIMENSION_VALUES)[number];

export const DEMAND_DRIVER_CATEGORY_VALUES = [
  'economic',
  'demographic',
  'consumer-behaviour',
  'technology',
  'regulatory',
  'government-spending',
  'infrastructure',
  'digitisation',
  'export',
  'import-substitution',
  'environmental',
  'financing-credit',
  'other',
] as const;
export type DemandDriverCategory = (typeof DEMAND_DRIVER_CATEGORY_VALUES)[number];

export const POLICY_NATURE_VALUES = [
  'incentive',
  'subsidy',
  'mandate',
  'tariff',
  'import-restriction',
  'export-support',
  'procurement-scheme',
  'tax-support',
  'other',
] as const;
export type PolicyNature = (typeof POLICY_NATURE_VALUES)[number];

export const BARRIER_TYPE_VALUES = [
  'capital-intensity',
  'technology-ip',
  'brand',
  'distribution',
  'regulatory-approvals',
  'customer-relationships',
  'vendor-qualification',
  'scale',
  'network-effect',
  'data',
  'switching-costs',
  'skilled-labour',
  'raw-material-access',
  'working-capital',
  'other',
] as const;
export type BarrierType = (typeof BARRIER_TYPE_VALUES)[number];

export const BARRIER_STRENGTH_VALUES = [
  'low',
  'moderate',
  'high',
  'source-does-not-quantify',
] as const;
export type BarrierStrength = (typeof BARRIER_STRENGTH_VALUES)[number];

export const CLAIM_TYPE_VALUES = [
  'largest',
  'leading',
  'fastest-growing',
  'top-x',
  'only',
  'market-share-claim',
  'scale-claim',
  'growth-claim',
  'other',
] as const;
export type ClaimType = (typeof CLAIM_TYPE_VALUES)[number];

export const CLAIM_STATUS_VALUES = [
  'substantiated',
  'potentially_substantiated',
  'insufficient_source',
  'stale_source',
  'contradictory_sources',
  'professional_confirmation_required',
  'do_not_use',
] as const;
export type ClaimStatus = (typeof CLAIM_STATUS_VALUES)[number];

export const COMPETITOR_METRIC_TYPE_VALUES = [
  'revenue-in-relevant-market',
  'volume',
  'capacity',
  'installed-base',
  'stores',
  'customers',
  'orders',
  'production',
  'assets-aum',
  'beds',
  'locations',
  'other',
] as const;
export type CompetitorMetricType = (typeof COMPETITOR_METRIC_TYPE_VALUES)[number];

export const SCOPE_EXCLUSION_TYPE_VALUES = [
  'adjacent-market-excluded',
  'upstream-market-excluded',
  'downstream-market-excluded',
  'geography-excluded',
  'product-category-excluded',
  'other',
] as const;
export type ScopeExclusionType = (typeof SCOPE_EXCLUSION_TYPE_VALUES)[number];

export const MACRO_INDICATOR_CATEGORY_VALUES = [
  'gdp',
  'gdp-growth',
  'private-consumption',
  'industrial-production',
  'inflation',
  'interest-rates',
  'urbanisation',
  'population-demographics',
  'disposable-income',
  'infrastructure-spending',
  'credit-growth',
  'digital-adoption',
  'export-growth',
  'other',
] as const;
export type MacroIndicatorCategory = (typeof MACRO_INDICATOR_CATEGORY_VALUES)[number];

export const FORECAST_SCENARIO_VALUES = ['base', 'upside', 'downside', 'not-specified'] as const;
export type ForecastScenario = (typeof FORECAST_SCENARIO_VALUES)[number];

export const NOMINAL_REAL_VALUES = ['nominal', 'real'] as const;
export type NominalReal = (typeof NOMINAL_REAL_VALUES)[number];

export const COMMISSIONED_REPORT_PURPOSE_VALUES = [
  'specifically-for-ipo',
  'existing-research-subscription',
  'other',
] as const;
export type CommissionedReportPurpose = (typeof COMMISSIONED_REPORT_PURPOSE_VALUES)[number];

export const NUMERATOR_SOURCE_VALUES = [
  'business-operations',
  'financials-kpis',
  'industry-report',
  'certified-company-data',
  'other',
] as const;
export type NumeratorSource = (typeof NUMERATOR_SOURCE_VALUES)[number];

export const MARKET_SHARE_METRIC_BASIS_VALUES = [
  'revenue',
  'volume',
  'units',
  'capacity',
  'orders',
  'customers',
  'installed-base',
  'other',
] as const;
export type MarketShareMetricBasis = (typeof MARKET_SHARE_METRIC_BASIS_VALUES)[number];

export const TREND_TIMELINE_STATUS_VALUES = ['historical', 'current', 'emerging'] as const;
export type TrendTimelineStatus = (typeof TREND_TIMELINE_STATUS_VALUES)[number];

export const CYCLICAL_DEFENSIVE_VALUES = ['cyclical', 'defensive', 'mixed', 'not-sure'] as const;
export type CyclicalDefensive = (typeof CYCLICAL_DEFENSIVE_VALUES)[number];

export const OUTLOOK_DATA_NATURE_VALUES = [
  'historical-fact',
  'current-estimate',
  'third-party-forecast',
  'issuer-expectation',
] as const;
export type OutlookDataNature = (typeof OUTLOOK_DATA_NATURE_VALUES)[number];

export const INDUSTRY_RISK_CATEGORY_VALUES = [
  'competition',
  'demand-cyclicality',
  'raw-material-volatility',
  'imports',
  'technology-disruption',
  'regulation',
  'policy-dependence',
  'customer-concentration',
  'fragmentation',
  'capacity-oversupply',
  'infrastructure',
  'skilled-labour',
  'currency',
  'macroeconomic',
  'other',
] as const;
export type IndustryRiskCategory = (typeof INDUSTRY_RISK_CATEGORY_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* 1. Industry scope & company-to-market mapping                               */
/* -------------------------------------------------------------------------- */

export const industryClassificationSchema = z.object({
  primaryIndustry: text,
  primarySubIndustry: text,
  secondaryIndustries: z.array(text),
  classificationSource: z.enum(['', ...CLASSIFICATION_SOURCE_VALUES]),
  classificationCode: text,
  industryDescription: text,
  subIndustryDescription: text,
});
export type IndustryClassification = z.infer<typeof industryClassificationSchema>;

export const marketDefinitionSchema = z.object({
  marketName: text,
  marketDescription: text,
  productServiceCategory: text,
  relevantValueChainStage: text,
  geography: z.enum(['', ...GEOGRAPHY_VALUES]),
  geographyDetail: text,
  endUserCustomerSegment: text,
  channelScope: text,
  organisedUnorganisedScope: text,
  b2bB2cB2gScope: text,
  marketBoundaryExplanation: text,
  relevanceToIssuerExplanation: text,
});
export type MarketDefinition = z.infer<typeof marketDefinitionSchema>;

export const companyMarketMappingRecordSchema = z.object({
  id: idSchema,
  marketSegment: text,
  linkedProductServiceIds: z.array(text),
  linkedBusinessSegmentIds: z.array(text),
  customerIndustries: z.array(text),
  geographies: z.array(text),
  salesChannels: z.array(text),
  linkedFacilityIds: z.array(text),
  relevantRevenueContribution: decimalStringSchema,
  relevantGeography: text,
  directIndirectParticipation: text,
  natureOfParticipation: text,
  materiality: text,
  relevantFinancialPeriod: text,
  notes: text,
});
export type CompanyMarketMappingRecord = z.infer<typeof companyMarketMappingRecordSchema>;

export const scopeExclusionRecordSchema = z.object({
  id: idSchema,
  exclusionType: z.enum(['', ...SCOPE_EXCLUSION_TYPE_VALUES]),
  description: text,
  reasonExcluded: text,
  impactOnMarketSizeInterpretation: text,
  notes: text,
});
export type ScopeExclusionRecord = z.infer<typeof scopeExclusionRecordSchema>;

export const industryScopeAndCompanyMarketMappingSchema = z.object({
  industryClassification: industryClassificationSchema,
  marketDefinition: marketDefinitionSchema,
  companyMarketMappings: z.array(companyMarketMappingRecordSchema),
  scopeExclusions: z.array(scopeExclusionRecordSchema),
  notes: text,
});
export type IndustryScopeAndCompanyMarketMapping = z.infer<
  typeof industryScopeAndCompanyMarketMappingSchema
>;

/* -------------------------------------------------------------------------- */
/* 2. Research sources & industry report governance                            */
/* -------------------------------------------------------------------------- */

export const commissionedReportDetailsSchema = z.object({
  researchProvider: text,
  commissionedByIssuer: yesNoNotSureOrEmptySchema,
  commissionedByPromoter: yesNoNotSureOrEmptySchema,
  commissionedBySellingShareholder: yesNoNotSureOrEmptySchema,
  whoPaid: text,
  engagementDate: text,
  reportDate: text,
  purpose: z.enum(['', ...COMMISSIONED_REPORT_PURPOSE_VALUES]),
  feePaymentStatus: text,
  independenceConfirmed: yesNoNotSureOrEmptySchema,
  relationshipWithIssuerPromotersDirectorsKmpBrlm: text,
  consentNoObjectionStatus: text,
  consentDateReference: text,
  publicAvailabilityStatus: text,
  proposedWebsiteLocation: text,
  includedProposedAsMaterialDocument: yesNoNotSureOrEmptySchema,
  providerDisclaimerCaptured: yesNoNotSureOrEmptySchema,
  riskFactorDisclosureStatus: text,
  professionalReviewStatus: text,
});
export type CommissionedReportDetails = z.infer<typeof commissionedReportDetailsSchema>;

export const sourceMethodologySchema = z.object({
  primaryResearchUsed: yesNoNotSureOrEmptySchema,
  secondaryResearchUsed: yesNoNotSureOrEmptySchema,
  sampleSize: text,
  surveyPopulation: text,
  dataSources: text,
  calculationMethodology: text,
  forecastMethodology: text,
  keyAssumptions: text,
  limitations: text,
  confidenceRange: text,
  methodologyComparability: text,
  notes: text,
});
export type SourceMethodology = z.infer<typeof sourceMethodologySchema>;

export const sourceRecordSchema = z.object({
  id: idSchema,
  sourceType: z.enum(['', ...SOURCE_TYPE_VALUES]),
  title: text,
  publisherAuthor: text,
  publicationDate: text,
  dataCutOffDate: text,
  version: text,
  urlReference: text,
  pageSectionReference: text,
  dateAccessed: text,
  geographyCovered: text,
  industryCovered: text,
  historicalPeriodCovered: text,
  forecastPeriodCovered: text,
  currency: text,
  unit: text,
  dataNature: z.enum(['', ...DATA_NATURE_VALUES]),
  commissionedReportDetails: commissionedReportDetailsSchema,
  methodology: sourceMethodologySchema,
  sourceReadinessStatus: z.enum(['', ...SOURCE_READINESS_STATUS_VALUES]),
  notes: text,
});
export type SourceRecord = z.infer<typeof sourceRecordSchema>;

export const researchSourcesAndIndustryReportGovernanceSchema = z.object({
  sources: z.array(sourceRecordSchema),
  notes: text,
});
export type ResearchSourcesAndIndustryReportGovernance = z.infer<
  typeof researchSourcesAndIndustryReportGovernanceSchema
>;

/* -------------------------------------------------------------------------- */
/* 3. Macroeconomic & industry context                                         */
/* -------------------------------------------------------------------------- */

export const macroeconomicIndicatorRecordSchema = z.object({
  id: idSchema,
  indicatorName: text,
  category: z.enum(['', ...MACRO_INDICATOR_CATEGORY_VALUES]),
  geography: text,
  period: text,
  value: decimalStringSchema,
  unit: text,
  actualEstimateForecast: z.enum(['', ...ACTUAL_ESTIMATE_FORECAST_VALUES]),
  sourceId: text,
  relevanceExplanation: text,
  notes: text,
});
export type MacroeconomicIndicatorRecord = z.infer<typeof macroeconomicIndicatorRecordSchema>;

export const industryEvolutionSchema = z.object({
  industryOriginDevelopment: text,
  structuralEvolution: text,
  formalisation: text,
  organisedUnorganisedTransition: text,
  consolidation: text,
  digitalisation: text,
  importSubstitution: text,
  exportDevelopment: text,
  consumerBusinessBehaviourChanges: text,
  importantRegulatoryChanges: text,
});
export type IndustryEvolution = z.infer<typeof industryEvolutionSchema>;

export const industryMilestoneRecordSchema = z.object({
  id: idSchema,
  datePeriod: text,
  event: text,
  whatChanged: text,
  industryImpact: text,
  sourceId: text,
  notes: text,
});
export type IndustryMilestoneRecord = z.infer<typeof industryMilestoneRecordSchema>;

export const macroeconomicAndIndustryContextSchema = z.object({
  macroeconomicIndicators: z.array(macroeconomicIndicatorRecordSchema),
  industryEvolution: industryEvolutionSchema,
  industryMilestones: z.array(industryMilestoneRecordSchema),
  notes: text,
});
export type MacroeconomicAndIndustryContext = z.infer<
  typeof macroeconomicAndIndustryContextSchema
>;

/* -------------------------------------------------------------------------- */
/* 4. Market size, segmentation & growth                                       */
/* -------------------------------------------------------------------------- */

export const marketSeriesPeriodValueSchema = z.object({
  id: idSchema,
  period: text,
  value: decimalStringSchema,
  actualEstimateForecast: z.enum(['', ...ACTUAL_ESTIMATE_FORECAST_VALUES]),
  sourceId: text,
  notes: text,
});
export type MarketSeriesPeriodValue = z.infer<typeof marketSeriesPeriodValueSchema>;

export const marketSeriesForecastMetadataSchema = z.object({
  forecastStartPeriod: text,
  forecastEndPeriod: text,
  forecastValue: decimalStringSchema,
  reportedCagr: decimalStringSchema,
  forecastSourceId: text,
  keyAssumptions: text,
  forecastMethodology: text,
  forecastDate: text,
  scenario: z.enum(['', ...FORECAST_SCENARIO_VALUES]),
});
export type MarketSeriesForecastMetadata = z.infer<typeof marketSeriesForecastMetadataSchema>;

export const marketSeriesRecordSchema = z.object({
  id: idSchema,
  marketName: text,
  marketDefinition: text,
  geography: text,
  metric: z.enum(['', ...MARKET_METRIC_VALUES]),
  currency: text,
  unit: text,
  nominalReal: z.enum(['', ...NOMINAL_REAL_VALUES]),
  primarySourceId: text,
  methodologyReference: text,
  periodValues: z.array(marketSeriesPeriodValueSchema),
  forecastMetadata: marketSeriesForecastMetadataSchema,
  notes: text,
});
export type MarketSeriesRecord = z.infer<typeof marketSeriesRecordSchema>;

export const marketSegmentationRecordSchema = z.object({
  id: idSchema,
  parentMarketSeriesId: text,
  segmentationDimension: z.enum(['', ...SEGMENTATION_DIMENSION_VALUES]),
  segmentName: text,
  period: text,
  marketSize: decimalStringSchema,
  marketSharePercentage: decimalStringSchema,
  growthRate: decimalStringSchema,
  forecastValue: decimalStringSchema,
  sourceId: text,
  relevanceToIssuer: text,
  notes: text,
});
export type MarketSegmentationRecord = z.infer<typeof marketSegmentationRecordSchema>;

export const segmentMappingRecordSchema = z.object({
  id: idSchema,
  marketSegmentId: text,
  linkedBusinessOperationsSegmentId: text,
  linkedFinancialsReportingSegmentId: text,
  sameDefinition: yesNoNotSureOrEmptySchema,
  differenceExplanation: text,
  notes: text,
});
export type SegmentMappingRecord = z.infer<typeof segmentMappingRecordSchema>;

export const marketSizeSegmentationAndGrowthSchema = z.object({
  marketSeries: z.array(marketSeriesRecordSchema),
  marketSegmentations: z.array(marketSegmentationRecordSchema),
  segmentMappings: z.array(segmentMappingRecordSchema),
  notes: text,
});
export type MarketSizeSegmentationAndGrowth = z.infer<
  typeof marketSizeSegmentationAndGrowthSchema
>;

/* -------------------------------------------------------------------------- */
/* 5. Demand drivers, end markets, trends & policy                           */
/* -------------------------------------------------------------------------- */

export const demandDriverRecordSchema = z.object({
  id: idSchema,
  title: text,
  category: z.enum(['', ...DEMAND_DRIVER_CATEGORY_VALUES]),
  description: text,
  mechanismAffectingDemand: text,
  marketSegmentsAffected: text,
  geography: text,
  historicalEvidence: text,
  quantifiedImpact: decimalStringSchema,
  expectedDuration: text,
  actualEstimateForecast: z.enum(['', ...ACTUAL_ESTIMATE_FORECAST_VALUES]),
  sourceId: text,
  relevanceToIssuer: text,
  notes: text,
});
export type DemandDriverRecord = z.infer<typeof demandDriverRecordSchema>;

export const endMarketRecordSchema = z.object({
  id: idSchema,
  endUserIndustry: text,
  geography: text,
  currentSize: decimalStringSchema,
  growth: decimalStringSchema,
  shareOfIssuerRelevantDemand: decimalStringSchema,
  demandCharacteristics: text,
  cyclicalDefensive: z.enum(['', ...CYCLICAL_DEFENSIVE_VALUES]),
  seasonality: text,
  keyPurchasingFactors: text,
  sourceId: text,
  linkedBusinessOperationsCustomerIndustry: text,
  notes: text,
});
export type EndMarketRecord = z.infer<typeof endMarketRecordSchema>;

export const industryTrendRecordSchema = z.object({
  id: idSchema,
  trend: text,
  startObservedPeriod: text,
  timelineStatus: z.enum(['', ...TREND_TIMELINE_STATUS_VALUES]),
  quantification: decimalStringSchema,
  industryImpact: text,
  issuerSegmentImpact: text,
  expectedPersistence: text,
  sourceId: text,
  professionalReviewStatus: text,
  notes: text,
});
export type IndustryTrendRecord = z.infer<typeof industryTrendRecordSchema>;

export const governmentPolicyRecordSchema = z.object({
  id: idSchema,
  policyScheme: text,
  governmentRegulator: text,
  effectiveDate: text,
  expirySunsetDate: text,
  applicableMarket: text,
  nature: z.enum(['', ...POLICY_NATURE_VALUES]),
  benefitRestriction: text,
  marketImpact: text,
  currentStatus: text,
  sourceId: text,
  notes: text,
});
export type GovernmentPolicyRecord = z.infer<typeof governmentPolicyRecordSchema>;

export const demandDriversEndMarketsTrendsAndPolicySchema = z.object({
  demandDrivers: z.array(demandDriverRecordSchema),
  endMarkets: z.array(endMarketRecordSchema),
  industryTrends: z.array(industryTrendRecordSchema),
  governmentPolicies: z.array(governmentPolicyRecordSchema),
  notes: text,
});
export type DemandDriversEndMarketsTrendsAndPolicy = z.infer<
  typeof demandDriversEndMarketsTrendsAndPolicySchema
>;

/* -------------------------------------------------------------------------- */
/* 6. Value chain, supply structure & entry barriers                           */
/* -------------------------------------------------------------------------- */

export const valueChainStageRecordSchema = z.object({
  id: idSchema,
  sequenceOrder: decimalStringSchema,
  name: text,
  description: text,
  majorParticipantTypes: text,
  inputs: text,
  outputs: text,
  customerOfStage: text,
  supplierToStage: text,
  typicalEconomicsMargin: text,
  consolidatedFragmentedStatus: text,
  issuerParticipates: yesNoNotSureOrEmptySchema,
  linkedBusinessOperationsActivity: text,
  sourceId: text,
  notes: text,
});
export type ValueChainStageRecord = z.infer<typeof valueChainStageRecordSchema>;

export const supplyFactorRecordSchema = z.object({
  id: idSchema,
  factor: text,
  description: text,
  quantification: decimalStringSchema,
  geography: text,
  sourceId: text,
  issuerRelevance: text,
  notes: text,
});
export type SupplyFactorRecord = z.infer<typeof supplyFactorRecordSchema>;

export const supplySideStructureSchema = z.object({
  majorRawMaterialsInputs: text,
  domesticImportDependence: text,
  supplyConcentration: text,
  commodityExposure: text,
  capacityConstraints: text,
  availabilityConcerns: text,
  typicalLeadTimes: text,
  logisticsDependency: text,
  workingCapitalCharacteristics: text,
  importExportStructure: text,
  geographicProductionClusters: text,
  supplyFactors: z.array(supplyFactorRecordSchema),
});
export type SupplySideStructure = z.infer<typeof supplySideStructureSchema>;

export const industryCapacityRecordSchema = z.object({
  id: idSchema,
  period: text,
  installedIndustryCapacity: decimalStringSchema,
  production: decimalStringSchema,
  capacityUtilisation: decimalStringSchema,
  capacityAnnounced: decimalStringSchema,
  capacityUnderConstruction: decimalStringSchema,
  expectedCommissioning: text,
  demandCapacityBalance: text,
  unit: text,
  geography: text,
  sourceId: text,
  notes: text,
});
export type IndustryCapacityRecord = z.infer<typeof industryCapacityRecordSchema>;

export const entryBarrierRecordSchema = z.object({
  id: idSchema,
  barrierType: z.enum(['', ...BARRIER_TYPE_VALUES]),
  description: text,
  strength: z.enum(['', ...BARRIER_STRENGTH_VALUES]),
  evidence: text,
  sourceId: text,
  relevanceToIssuer: text,
  notes: text,
});
export type EntryBarrierRecord = z.infer<typeof entryBarrierRecordSchema>;

export const valueChainSupplyStructureAndEntryBarriersSchema = z.object({
  valueChainStages: z.array(valueChainStageRecordSchema),
  supplySideStructure: supplySideStructureSchema,
  industryCapacityRecords: z.array(industryCapacityRecordSchema),
  entryBarriers: z.array(entryBarrierRecordSchema),
  notes: text,
});
export type ValueChainSupplyStructureAndEntryBarriers = z.infer<
  typeof valueChainSupplyStructureAndEntryBarriersSchema
>;

/* -------------------------------------------------------------------------- */
/* 7. Competition, market share & issuer positioning                           */
/* -------------------------------------------------------------------------- */

export const competitorRecordSchema = z.object({
  id: idSchema,
  companyName: text,
  listedUnlisted: text,
  publicPrivate: text,
  country: text,
  headquarters: text,
  industrySubIndustry: text,
  relevantProductsServices: text,
  relevantGeography: text,
  businessModel: text,
  scaleIndicator: text,
  sourceId: text,
  notes: text,
});
export type CompetitorRecord = z.infer<typeof competitorRecordSchema>;

export const competitiveMetricRecordSchema = z.object({
  id: idSchema,
  competitorId: text,
  metricType: z.enum(['', ...COMPETITOR_METRIC_TYPE_VALUES]),
  value: decimalStringSchema,
  periodDate: text,
  unit: text,
  marketScope: text,
  sourceId: text,
  comparableToIssuer: yesNoNotSureOrEmptySchema,
  methodologyDifferences: text,
  notes: text,
});
export type CompetitiveMetricRecord = z.infer<typeof competitiveMetricRecordSchema>;

export const competitiveDimensionRecordSchema = z.object({
  id: idSchema,
  competitorId: text,
  dimension: text,
  issuerPosition: text,
  competitorPosition: text,
  evidence: text,
  sourceId: text,
  comparable: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type CompetitiveDimensionRecord = z.infer<typeof competitiveDimensionRecordSchema>;

export const marketShareRecordSchema = z.object({
  id: idSchema,
  metricBasis: z.enum(['', ...MARKET_SHARE_METRIC_BASIS_VALUES]),
  marketDefinition: text,
  geography: text,
  segment: text,
  period: text,
  issuerNumerator: decimalStringSchema,
  numeratorSource: z.enum(['', ...NUMERATOR_SOURCE_VALUES]),
  linkedIssuerRecordId: text,
  totalMarketDenominator: decimalStringSchema,
  denominatorSourceId: text,
  reportedMarketShare: decimalStringSchema,
  independentVerificationStatus: text,
  professionalConfirmationStatus: text,
  notes: text,
});
export type MarketShareRecord = z.infer<typeof marketShareRecordSchema>;

export const claimRecordSchema = z.object({
  id: idSchema,
  exactProposedWording: text,
  claimType: z.enum(['', ...CLAIM_TYPE_VALUES]),
  metric: text,
  geography: text,
  marketDefinition: text,
  periodDate: text,
  comparatorUniverse: text,
  sourceId: text,
  pageReference: text,
  calculation: text,
  independentSource: yesNoNotSureOrEmptySchema,
  commissionedReportSource: yesNoNotSureOrEmptySchema,
  currentFreshEnough: yesNoNotSureOrEmptySchema,
  conflictingSourceExists: yesNoNotSureOrEmptySchema,
  proposedDrhpLocation: text,
  reviewStatus: z.enum(['', ...CLAIM_STATUS_VALUES]),
  notes: text,
});
export type ClaimRecord = z.infer<typeof claimRecordSchema>;

export const competitionMarketShareAndIssuerPositioningSchema = z.object({
  competitors: z.array(competitorRecordSchema),
  competitiveMetrics: z.array(competitiveMetricRecordSchema),
  competitiveDimensions: z.array(competitiveDimensionRecordSchema),
  marketShareRecords: z.array(marketShareRecordSchema),
  claims: z.array(claimRecordSchema),
  notes: text,
});
export type CompetitionMarketShareAndIssuerPositioning = z.infer<
  typeof competitionMarketShareAndIssuerPositioningSchema
>;

/* -------------------------------------------------------------------------- */
/* 8. Outlook, industry risks & confirmations                                  */
/* -------------------------------------------------------------------------- */

export const outlookRecordSchema = z.object({
  id: idSchema,
  market: text,
  geography: text,
  outlookPeriod: text,
  currentMarketSize: decimalStringSchema,
  expectedMarketSize: decimalStringSchema,
  expectedCagr: decimalStringSchema,
  structuralChanges: text,
  demandDevelopments: text,
  supplyDevelopments: text,
  technologyOutlook: text,
  regulatoryPolicyOutlook: text,
  sourceId: text,
  dataNature: z.enum(['', ...OUTLOOK_DATA_NATURE_VALUES]),
  notes: text,
});
export type OutlookRecord = z.infer<typeof outlookRecordSchema>;

export const industryRiskRecordSchema = z.object({
  id: idSchema,
  title: text,
  category: z.enum(['', ...INDUSTRY_RISK_CATEGORY_VALUES]),
  description: text,
  historicalEvidence: text,
  segmentsAffected: text,
  severityIfSourceProvides: text,
  duration: text,
  sourceId: text,
  relatedFutureRiskFactor: text,
  notes: text,
});
export type IndustryRiskRecord = z.infer<typeof industryRiskRecordSchema>;

export const conflictingResearchRecordSchema = z.object({
  id: idSchema,
  topic: text,
  sourceAId: text,
  sourceBId: text,
  valueFromA: decimalStringSchema,
  valueFromB: decimalStringSchema,
  differentMarketDefinition: yesNoNotSureOrEmptySchema,
  differentDates: yesNoNotSureOrEmptySchema,
  differentMethodology: yesNoNotSureOrEmptySchema,
  differentGeography: yesNoNotSureOrEmptySchema,
  reconciled: yesNoNotSureOrEmptySchema,
  preferredSourceId: text,
  basisForPreference: text,
  professionalReviewStatus: text,
  notes: text,
});
export type ConflictingResearchRecord = z.infer<typeof conflictingResearchRecordSchema>;

export const industryMarketConfirmationsSchema = z.object({
  industryScopeReflectsActualIssuerBusiness: z.boolean(),
  marketDefinitionNotIntentionallyOverstated: z.boolean(),
  materialIndustryClaimsHaveSources: z.boolean(),
  sourcePublicationAccessDatesRecorded: z.boolean(),
  historicalDataAndForecastsDistinguished: z.boolean(),
  commissionedReportStatusDisclosed: z.boolean(),
  researchProviderRelationshipDisclosed: z.boolean(),
  methodologyLimitationsCaptured: z.boolean(),
  industrySegmentsNotConfusedWithAccountingSegments: z.boolean(),
  competitorListIsReasonable: z.boolean(),
  marketShareNumeratorDenominatorDefinitionsMatch: z.boolean(),
  comparatorUniversesDefined: z.boolean(),
  leadingLargestTopClaimsSourced: z.boolean(),
  conflictingMarketDataIdentified: z.boolean(),
  staleDataFlagged: z.boolean(),
  policySchemeStatusCurrent: z.boolean(),
  companyOperationalDataReconcilesWithLinkedWorkstreams: z.boolean(),
  professionalMerchantBankerReviewRemainsRequired: z.boolean(),
});
export type IndustryMarketConfirmations = z.infer<typeof industryMarketConfirmationsSchema>;

export const outlookIndustryRisksAndConfirmationsSchema = z.object({
  outlookRecords: z.array(outlookRecordSchema),
  industryRisks: z.array(industryRiskRecordSchema),
  conflictingResearch: z.array(conflictingResearchRecordSchema),
  confirmations: industryMarketConfirmationsSchema,
  notes: text,
});
export type OutlookIndustryRisksAndConfirmations = z.infer<
  typeof outlookIndustryRisksAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export const industryMarketPayloadSchema = z.object({
  schemaVersion: z.literal(INDUSTRY_MARKET_SCHEMA_VERSION),
  industryScopeAndCompanyMarketMapping: industryScopeAndCompanyMarketMappingSchema,
  researchSourcesAndIndustryReportGovernance: researchSourcesAndIndustryReportGovernanceSchema,
  macroeconomicAndIndustryContext: macroeconomicAndIndustryContextSchema,
  marketSizeSegmentationAndGrowth: marketSizeSegmentationAndGrowthSchema,
  demandDriversEndMarketsTrendsAndPolicy: demandDriversEndMarketsTrendsAndPolicySchema,
  valueChainSupplyStructureAndEntryBarriers: valueChainSupplyStructureAndEntryBarriersSchema,
  competitionMarketShareAndIssuerPositioning: competitionMarketShareAndIssuerPositioningSchema,
  outlookIndustryRisksAndConfirmations: outlookIndustryRisksAndConfirmationsSchema,
});

export type IndustryMarketPayload = z.infer<typeof industryMarketPayloadSchema>;

export type IndustryMarketSectionId =
  | 'industry-scope-and-company-market-mapping'
  | 'research-sources-and-industry-report-governance'
  | 'macroeconomic-and-industry-context'
  | 'market-size-segmentation-and-growth'
  | 'demand-drivers-end-markets-trends-and-policy'
  | 'value-chain-supply-structure-and-entry-barriers'
  | 'competition-market-share-and-issuer-positioning'
  | 'outlook-industry-risks-and-confirmations';

export const INDUSTRY_MARKET_SECTION_IDS: IndustryMarketSectionId[] = [
  'industry-scope-and-company-market-mapping',
  'research-sources-and-industry-report-governance',
  'macroeconomic-and-industry-context',
  'market-size-segmentation-and-growth',
  'demand-drivers-end-markets-trends-and-policy',
  'value-chain-supply-structure-and-entry-barriers',
  'competition-market-share-and-issuer-positioning',
  'outlook-industry-risks-and-confirmations',
];

export const sectionIdSchema = z.enum([
  'industry-scope-and-company-market-mapping',
  'research-sources-and-industry-report-governance',
  'macroeconomic-and-industry-context',
  'market-size-segmentation-and-growth',
  'demand-drivers-end-markets-trends-and-policy',
  'value-chain-supply-structure-and-entry-barriers',
  'competition-market-share-and-issuer-positioning',
  'outlook-industry-risks-and-confirmations',
]);
