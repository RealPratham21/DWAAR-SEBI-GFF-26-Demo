/**
 * Derived Industry & Market computations (NOT persisted).
 */

import { deriveClaimStatus } from '@/lib/industry-market/claims';
import { isFilledDecimal } from '@/lib/industry-market/decimal';
import { calculateCagr, calculateYoYGrowth } from '@/lib/industry-market/market-series';
import { calculateMarketShare, validateMarketShareRecord } from '@/lib/industry-market/market-share';
import { getSources } from '@/lib/industry-market/sources';
import {
  createEmptyLinkedWorkstreamReferences,
  type LinkedWorkstreamReferences,
} from '@/lib/industry-market/types';
import type { IndustryMarketPayload } from '@/lib/schemas/industry-market';

export type IndustryMarketModel = {
  primaryIndustry: string;
  relevantMarket: string;
  geography: string;
  latestMarketSize: string;
  latestMarketSizePeriod: string;
  latestMarketSizeUnit: string;
  forecastMarketSize: string;
  forecastPeriod: string;
  forecastCagr: string;
  marketSeriesCount: number;
  marketSegmentCount: number;
  issuerLinkedSegmentCount: number;
  competitorCount: number;
  calculatedIssuerMarketShare: string;
  marketShareBasis: string;
  marketSharePeriod: string;
  sourceCount: number;
  currentSourceCount: number;
  potentiallyStaleSourceCount: number;
  pendingVerificationSourceCount: number;
  commissionedReportCount: number;
  claimsProposed: number;
  claimsSubstantiated: number;
  claimsNeedingEvidence: number;
  conflictingSourceCount: number;
};

function latestPeriodValue(series: IndustryMarketPayload['marketSizeSegmentationAndGrowth']['marketSeries'][number]) {
  const filledValues = series.periodValues.filter((pv) => isFilledDecimal(pv.value));
  if (filledValues.length === 0) return null;
  return filledValues[filledValues.length - 1];
}

export function computeIndustryMarketModel(
  payload: IndustryMarketPayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): IndustryMarketModel {
  const scope = payload.industryScopeAndCompanyMarketMapping;
  const marketSection = payload.marketSizeSegmentationAndGrowth;
  const competition = payload.competitionMarketShareAndIssuerPositioning;
  const outlook = payload.outlookIndustryRisksAndConfirmations;
  const sources = getSources(payload);

  const primarySeries = marketSection.marketSeries[0] ?? null;
  const latestPoint = primarySeries ? latestPeriodValue(primarySeries) : null;

  let forecastMarketSize = '';
  let forecastPeriod = '';
  let forecastCagr = '';
  if (primarySeries) {
    forecastMarketSize = primarySeries.forecastMetadata.forecastValue;
    forecastPeriod = [
      primarySeries.forecastMetadata.forecastStartPeriod,
      primarySeries.forecastMetadata.forecastEndPeriod,
    ]
      .filter(Boolean)
      .join(' – ');
    forecastCagr =
      primarySeries.forecastMetadata.reportedCagr ||
      calculateCagr(
        latestPoint?.value ?? '',
        primarySeries.forecastMetadata.forecastValue,
        Math.max(primarySeries.periodValues.length - 1, 1),
      );
  }

  const primaryShare = competition.marketShareRecords[0];
  const shareValidation = primaryShare
    ? validateMarketShareRecord(primaryShare, payload)
    : null;

  const claims = competition.claims.map((claim) => ({
    claim,
    status: deriveClaimStatus(claim, payload),
  }));

  const issuerLinkedSegmentCount = marketSection.segmentMappings.filter(
    (mapping) =>
      mapping.linkedBusinessOperationsSegmentId.trim() !== '' ||
      mapping.linkedFinancialsReportingSegmentId.trim() !== '',
  ).length;

  void linkedReferences;

  return {
    primaryIndustry: scope.industryClassification.primaryIndustry,
    relevantMarket: scope.marketDefinition.marketName,
    geography: scope.marketDefinition.geography,
    latestMarketSize: latestPoint?.value ?? '',
    latestMarketSizePeriod: latestPoint?.period ?? '',
    latestMarketSizeUnit: primarySeries?.unit ?? '',
    forecastMarketSize,
    forecastPeriod,
    forecastCagr,
    marketSeriesCount: marketSection.marketSeries.length,
    marketSegmentCount: marketSection.marketSegmentations.length,
    issuerLinkedSegmentCount,
    competitorCount: competition.competitors.length,
    calculatedIssuerMarketShare: shareValidation?.calculatedMarketShare ?? '',
    marketShareBasis: primaryShare?.metricBasis ?? '',
    marketSharePeriod: primaryShare?.period ?? '',
    sourceCount: sources.length,
    currentSourceCount: sources.filter((source) => source.sourceReadinessStatus === 'current').length,
    potentiallyStaleSourceCount: sources.filter(
      (source) => source.sourceReadinessStatus === 'potentially_stale',
    ).length,
    pendingVerificationSourceCount: sources.filter(
      (source) =>
        source.sourceReadinessStatus === 'pending_verification' ||
        source.sourceReadinessStatus === 'professional_confirmation_required',
    ).length,
    commissionedReportCount: sources.filter(
      (source) => source.sourceType === 'commissioned-industry-report',
    ).length,
    claimsProposed: claims.length,
    claimsSubstantiated: claims.filter((entry) => entry.status === 'substantiated').length,
    claimsNeedingEvidence: claims.filter((entry) =>
      ['insufficient_source', 'do_not_use', 'stale_source', 'contradictory_sources'].includes(
        entry.status,
      ),
    ).length,
    conflictingSourceCount: outlook.conflictingResearch.length,
  };
}

/** Re-export helpers used by overview and assessment consumers. */
export { calculateYoYGrowth, calculateMarketShare };
