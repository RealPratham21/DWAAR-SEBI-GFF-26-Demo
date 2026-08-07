/**
 * Section completion for Industry & Market.
 */

import {
  INDUSTRY_MARKET_CONFIRMATION_FIELDS,
  INDUSTRY_MARKET_SECTION_LABELS,
} from '@/lib/industry-market/options';
import { isFilledDecimal } from '@/lib/industry-market/decimal';
import type {
  IndustryMarketPayload,
  IndustryMarketProgress,
  IndustryMarketSectionId,
  SectionStatus,
} from '@/lib/industry-market/types';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function statusFrom(answered: number, total: number, extraComplete = true): SectionStatus {
  if (answered === 0) return 'not_started';
  if (answered < total || !extraComplete) return 'in_progress';
  return 'complete';
}

export function evaluateIndustryScopeStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.industryScopeAndCompanyMarketMapping;
  const classification = section.industryClassification;
  const market = section.marketDefinition;
  const core = [
    filled(classification.primaryIndustry),
    filled(classification.classificationSource),
    filled(market.marketName),
    filled(market.geography),
    filled(market.marketBoundaryExplanation),
    section.companyMarketMappings.length > 0 || filled(market.relevanceToIssuerExplanation),
  ];
  const answered = core.filter(Boolean).length;
  const mappingsComplete = section.companyMarketMappings.every(
    (mapping) => filled(mapping.marketSegment) && filled(mapping.natureOfParticipation),
  );
  return statusFrom(answered, core.length, mappingsComplete);
}

export function evaluateSourcesStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.researchSourcesAndIndustryReportGovernance;
  const core = [section.sources.length > 0];
  const answered = core.filter(Boolean).length;
  const sourcesComplete = section.sources.every(
    (source) =>
      filled(source.sourceType) &&
      filled(source.title) &&
      filled(source.sourceReadinessStatus) &&
      filled(source.dataNature),
  );
  return statusFrom(answered, core.length, sourcesComplete);
}

export function evaluateMacroContextStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.macroeconomicAndIndustryContext;
  const evolution = section.industryEvolution;
  const core = [
    section.macroeconomicIndicators.length > 0 || filled(evolution.industryOriginDevelopment),
    section.industryMilestones.length > 0 || filled(evolution.structuralEvolution),
    filled(evolution.importantRegulatoryChanges) || filled(evolution.digitalisation),
  ];
  const answered = core.filter(Boolean).length;
  const indicatorsComplete = section.macroeconomicIndicators.every(
    (indicator) =>
      filled(indicator.indicatorName) &&
      filled(indicator.relevanceExplanation) &&
      (filled(indicator.sourceId) || isFilledDecimal(indicator.value)),
  );
  return statusFrom(answered, core.length, indicatorsComplete);
}

export function evaluateMarketSizeStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.marketSizeSegmentationAndGrowth;
  const core = [
    section.marketSeries.length > 0,
    section.marketSegmentations.length > 0 || section.segmentMappings.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const seriesComplete = section.marketSeries.every(
    (series) =>
      filled(series.marketName) &&
      filled(series.metric) &&
      filled(series.primarySourceId) &&
      series.periodValues.length > 0,
  );
  return statusFrom(answered, core.length, seriesComplete);
}

export function evaluateDemandTrendsStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.demandDriversEndMarketsTrendsAndPolicy;
  const core = [
    section.demandDrivers.length > 0,
    section.endMarkets.length > 0 || section.industryTrends.length > 0,
    section.governmentPolicies.length > 0 || section.industryTrends.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const driversComplete = section.demandDrivers.every(
    (driver) => filled(driver.title) && filled(driver.category) && filled(driver.description),
  );
  return statusFrom(answered, core.length, driversComplete);
}

export function evaluateValueChainStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.valueChainSupplyStructureAndEntryBarriers;
  const core = [
    section.valueChainStages.length > 0,
    filled(section.supplySideStructure.majorRawMaterialsInputs) ||
      section.supplySideStructure.supplyFactors.length > 0,
    section.entryBarriers.length > 0 || section.industryCapacityRecords.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const stagesComplete = section.valueChainStages.every(
    (stage) => filled(stage.name) && filled(stage.sequenceOrder),
  );
  return statusFrom(answered, core.length, stagesComplete);
}

export function evaluateCompetitionStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.competitionMarketShareAndIssuerPositioning;
  const core = [
    section.competitors.length > 0,
    section.marketShareRecords.length > 0 || section.competitiveMetrics.length > 0,
    section.claims.length > 0 || section.competitiveDimensions.length > 0,
  ];
  const answered = core.filter(Boolean).length;
  const shareComplete = section.marketShareRecords.every(
    (record) =>
      isFilledDecimal(record.issuerNumerator) &&
      isFilledDecimal(record.totalMarketDenominator) &&
      filled(record.denominatorSourceId),
  );
  return statusFrom(answered, core.length, shareComplete);
}

export function evaluateOutlookStatus(payload: IndustryMarketPayload): SectionStatus {
  const section = payload.outlookIndustryRisksAndConfirmations;
  const confirmationsChecked = INDUSTRY_MARKET_CONFIRMATION_FIELDS.filter(
    (field) => section.confirmations[field.key],
  ).length;
  const core = [
    section.outlookRecords.length > 0,
    section.industryRisks.length > 0 || section.conflictingResearch.length > 0,
    confirmationsChecked > 0,
  ];
  const answered = core.filter(Boolean).length;
  const confirmationsComplete =
    confirmationsChecked === INDUSTRY_MARKET_CONFIRMATION_FIELDS.length;
  return statusFrom(answered, core.length, confirmationsComplete);
}

export function calculateIndustryMarketProgress(
  payload: IndustryMarketPayload,
): IndustryMarketProgress {
  const sections: Record<IndustryMarketSectionId, SectionStatus> = {
    'industry-scope-and-company-market-mapping': evaluateIndustryScopeStatus(payload),
    'research-sources-and-industry-report-governance': evaluateSourcesStatus(payload),
    'macroeconomic-and-industry-context': evaluateMacroContextStatus(payload),
    'market-size-segmentation-and-growth': evaluateMarketSizeStatus(payload),
    'demand-drivers-end-markets-trends-and-policy': evaluateDemandTrendsStatus(payload),
    'value-chain-supply-structure-and-entry-barriers': evaluateValueChainStatus(payload),
    'competition-market-share-and-issuer-positioning': evaluateCompetitionStatus(payload),
    'outlook-industry-risks-and-confirmations': evaluateOutlookStatus(payload),
  };

  const statuses = Object.values(sections);
  const sectionsComplete = statuses.filter((status) => status === 'complete').length;
  const totalSections = statuses.length;
  let overallStatus: SectionStatus = 'not_started';
  if (sectionsComplete === totalSections) overallStatus = 'complete';
  else if (statuses.some((status) => status !== 'not_started')) overallStatus = 'in_progress';

  return { sections, sectionsComplete, totalSections, overallStatus };
}

export function listIncompleteIndustryMarketSections(payload: IndustryMarketPayload): string[] {
  const progress = calculateIndustryMarketProgress(payload);
  const incomplete: string[] = [];
  for (const [id, status] of Object.entries(progress.sections) as Array<
    [IndustryMarketSectionId, SectionStatus]
  >) {
    if (status !== 'complete') {
      incomplete.push(`${INDUSTRY_MARKET_SECTION_LABELS[id]} incomplete`);
    }
  }
  return incomplete;
}
