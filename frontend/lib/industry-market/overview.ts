/**
 * Overview summary derived from the in-memory Industry & Market draft (IM1).
 */

import { assessIndustryMarket, type IndustryAssessmentResponse } from '@/lib/industry-market/assessment';
import {
  computeIndustryMarketModel,
  type IndustryMarketModel,
} from '@/lib/industry-market/compute';
import { INDUSTRY_MARKET_SECTION_LABELS } from '@/lib/industry-market/options';
import { calculateIndustryMarketProgress } from '@/lib/industry-market/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type IndustryMarketProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/industry-market/types';
import type {
  IndustryMarketPayload,
  IndustryMarketSectionId,
} from '@/lib/schemas/industry-market';

export type IndustryMarketOverviewSummary = {
  sectionStatuses: IndustryMarketProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: IndustryMarketProgress['overallStatus'];
  primaryIndustry: string;
  relevantMarket: string;
  geography: string;
  latestMarketSize: string;
  latestMarketSizePeriod: string;
  latestMarketSizeUnit: string;
  forecastMarketSize: string;
  forecastPeriod: string;
  forecastCagr: string;
  relevantMarketSegmentCount: number;
  issuerLinkedSegmentCount: number;
  competitorsIdentified: number;
  calculatedIssuerMarketShare: string;
  marketShareBasis: string;
  marketSharePeriod: string;
  externalSourceCount: number;
  currentSourceCount: number;
  potentiallyStaleSourceCount: number;
  pendingVerificationSourceCount: number;
  commissionedReportCount: number;
  claimsProposed: number;
  claimsSubstantiated: number;
  claimsNeedingEvidence: number;
  conflictingSourceCount: number;
  assessmentConcerns: number;
  assessmentResult: IndustryAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: IndustryMarketSectionId; label: string }>;
};

export function buildOverviewSummary(
  payload: IndustryMarketPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): IndustryMarketOverviewSummary {
  const progress = calculateIndustryMarketProgress(payload);
  const model = computeIndustryMarketModel(payload, linkedReferences);
  const assessment = assessIndustryMarket(payload, linkedReferences);

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const incompleteSections = (
    Object.entries(progress.sections) as Array<
      [IndustryMarketSectionId, IndustryMarketProgress['sections'][IndustryMarketSectionId]]
    >
  ).filter(([, status]) => status !== 'complete');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${INDUSTRY_MARKET_SECTION_LABELS[sectionId]}`,
  }));

  const assessmentConcerns =
    assessment.counts.potentialInconsistency +
    assessment.counts.missingSource +
    assessment.counts.staleSource +
    assessment.counts.conflictingSources;

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    primaryIndustry: model.primaryIndustry,
    relevantMarket: model.relevantMarket,
    geography: model.geography,
    latestMarketSize: model.latestMarketSize,
    latestMarketSizePeriod: model.latestMarketSizePeriod,
    latestMarketSizeUnit: model.latestMarketSizeUnit,
    forecastMarketSize: model.forecastMarketSize,
    forecastPeriod: model.forecastPeriod,
    forecastCagr: model.forecastCagr,
    relevantMarketSegmentCount: model.marketSegmentCount,
    issuerLinkedSegmentCount: model.issuerLinkedSegmentCount,
    competitorsIdentified: model.competitorCount,
    calculatedIssuerMarketShare: model.calculatedIssuerMarketShare,
    marketShareBasis: model.marketShareBasis,
    marketSharePeriod: model.marketSharePeriod,
    externalSourceCount: model.sourceCount,
    currentSourceCount: model.currentSourceCount,
    potentiallyStaleSourceCount: model.potentiallyStaleSourceCount,
    pendingVerificationSourceCount: model.pendingVerificationSourceCount,
    commissionedReportCount: model.commissionedReportCount,
    claimsProposed: model.claimsProposed,
    claimsSubstantiated: model.claimsSubstantiated,
    claimsNeedingEvidence: model.claimsNeedingEvidence,
    conflictingSourceCount: model.conflictingSourceCount,
    assessmentConcerns,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
  };
}

/** Alias used by barrels and external imports. */
export const buildIndustryMarketOverviewSummary = buildOverviewSummary;
