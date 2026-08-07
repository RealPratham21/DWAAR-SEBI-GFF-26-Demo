/**
 * Shared Industry & Market types.
 *
 * Persisted shapes live in `@/lib/schemas/industry-market` and are re-exported here so UI
 * code has a single import surface. Types declared in this file describe DERIVED state
 * (progress, cross-workstream references) and are never persisted.
 */

import type {
  IndustryMarketPayload,
  IndustryMarketSectionId,
} from '@/lib/schemas/industry-market';

export type {
  IndustryMarketPayload,
  IndustryMarketSectionId,
  IndustryScopeAndCompanyMarketMapping,
  IndustryClassification,
  MarketDefinition,
  CompanyMarketMappingRecord,
  ScopeExclusionRecord,
  ResearchSourcesAndIndustryReportGovernance,
  SourceRecord,
  CommissionedReportDetails,
  SourceMethodology,
  MacroeconomicAndIndustryContext,
  MacroeconomicIndicatorRecord,
  IndustryEvolution,
  IndustryMilestoneRecord,
  MarketSizeSegmentationAndGrowth,
  MarketSeriesRecord,
  MarketSeriesPeriodValue,
  MarketSeriesForecastMetadata,
  MarketSegmentationRecord,
  SegmentMappingRecord,
  DemandDriversEndMarketsTrendsAndPolicy,
  DemandDriverRecord,
  EndMarketRecord,
  IndustryTrendRecord,
  GovernmentPolicyRecord,
  ValueChainSupplyStructureAndEntryBarriers,
  ValueChainStageRecord,
  SupplySideStructure,
  SupplyFactorRecord,
  IndustryCapacityRecord,
  EntryBarrierRecord,
  CompetitionMarketShareAndIssuerPositioning,
  CompetitorRecord,
  CompetitiveMetricRecord,
  CompetitiveDimensionRecord,
  MarketShareRecord,
  ClaimRecord,
  OutlookIndustryRisksAndConfirmations,
  OutlookRecord,
  IndustryRiskRecord,
  ConflictingResearchRecord,
  IndustryMarketConfirmations,
  ClassificationSource,
  Geography,
  SourceType,
  DataNature,
  SourceReadinessStatus,
  MarketMetric,
  ActualEstimateForecast,
  SegmentationDimension,
  DemandDriverCategory,
  PolicyNature,
  BarrierType,
  BarrierStrength,
  ClaimType,
  ClaimStatus,
  CompetitorMetricType,
  YesNoNotSure,
  YesNoNotSureOrEmpty,
  DecimalString,
} from '@/lib/schemas/industry-market';

export type { IndustryMarketTabId } from '@/lib/industry-market/options';

import {
  createEmptyIpoSetupReference,
  type IpoSetupReference,
} from '@/lib/capital-ownership/types';

export { createEmptyIpoSetupReference };
export type { IpoSetupReference };

export type SectionStatus = 'not_started' | 'in_progress' | 'complete';

export type IndustryMarketProgress = {
  sections: Record<IndustryMarketSectionId, SectionStatus>;
  sectionsComplete: number;
  totalSections: number;
  overallStatus: SectionStatus;
};

export type CompanyLegalReference = {
  available: boolean;
  legalName: string | null;
  companyClass: string | null;
  cin: string | null;
};

export type LinkedWorkstreamPlaceholder = {
  available: false;
};

export type BusinessOperationsReference = LinkedWorkstreamPlaceholder & {
  productServiceContextAvailable: boolean;
  businessSegmentContextAvailable: boolean;
  segmentIds: string[];
};

export type FinancialsKpisReference = LinkedWorkstreamPlaceholder & {
  reportingSegmentContextAvailable: boolean;
  certifiedKpiContextAvailable: boolean;
  segmentIds: string[];
};

/**
 * Read-only mirrors of other workstreams.
 *
 * Industry & Market never writes back. Placeholders remain empty until IM2 wiring.
 */
export type LinkedWorkstreamReferences = {
  company: CompanyLegalReference;
  businessOperations: BusinessOperationsReference;
  financialsKpis: FinancialsKpisReference;
  ipoSetup: IpoSetupReference;
};

export function createEmptyLinkedWorkstreamReferences(): LinkedWorkstreamReferences {
  return {
    company: {
      available: false,
      legalName: null,
      companyClass: null,
      cin: null,
    },
    businessOperations: {
      available: false,
      productServiceContextAvailable: false,
      businessSegmentContextAvailable: false,
      segmentIds: [],
    },
    financialsKpis: {
      available: false,
      reportingSegmentContextAvailable: false,
      certifiedKpiContextAvailable: false,
      segmentIds: [],
    },
    ipoSetup: createEmptyIpoSetupReference(),
  };
}

/** Convenience alias used by hooks and page components. */
export type IndustryMarketPayloadDraft = IndustryMarketPayload;
