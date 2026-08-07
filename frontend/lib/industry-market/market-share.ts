/**
 * Market-share calculation and validation (NOT persisted).
 */

import {
  differsBeyond,
  isFilledDecimal,
  pct,
  round,
} from '@/lib/industry-market/decimal';
import { getSourceById } from '@/lib/industry-market/sources';
import type { IndustryMarketPayload, MarketShareRecord } from '@/lib/schemas/industry-market';

export type MarketShareValidationResult = {
  calculatedMarketShare: string;
  periodMismatch: boolean;
  geographyMismatch: boolean;
  segmentMismatch: boolean;
  unitMismatch: boolean;
  unsupportedNumerator: boolean;
  denominatorWithoutSource: boolean;
  calculatedVsReportedDifference: boolean;
  flags: string[];
};

export function calculateMarketShare(
  numerator: string,
  denominator: string,
  decimalPlaces = 4,
): string {
  return pct(numerator, denominator, decimalPlaces);
}

export function validateMarketShareRecord(
  record: MarketShareRecord,
  payload: IndustryMarketPayload,
): MarketShareValidationResult {
  const flags: string[] = [];

  const calculatedMarketShare = calculateMarketShare(
    record.issuerNumerator,
    record.totalMarketDenominator,
  );

  const denominatorWithoutSource = !record.denominatorSourceId.trim();
  if (denominatorWithoutSource) {
    flags.push('Denominator lacks a supporting source.');
  }

  let unsupportedNumerator =
    !record.numeratorSource.trim() &&
    !record.linkedIssuerRecordId.trim() &&
    !isFilledDecimal(record.issuerNumerator);
  if (unsupportedNumerator) {
    flags.push('Issuer numerator is not linked to a verified source or workstream record.');
  }

  const calculatedVsReportedDifference =
    isFilledDecimal(record.reportedMarketShare) &&
    isFilledDecimal(calculatedMarketShare) &&
    differsBeyond(record.reportedMarketShare, calculatedMarketShare, '0.5');
  if (calculatedVsReportedDifference) {
    flags.push('Reported market share differs from calculated share.');
  }

  const linkedSeries = payload.marketSizeSegmentationAndGrowth.marketSeries.find(
    (series) =>
      series.marketName.trim() === record.marketDefinition.trim() ||
      series.id === record.segment.trim(),
  );

  let geographyMismatch = false;
  let unitMismatch = false;
  let periodMismatch = false;
  let segmentMismatch = false;

  if (linkedSeries) {
    if (
      record.geography.trim() &&
      linkedSeries.geography.trim() &&
      record.geography.trim().toLowerCase() !== linkedSeries.geography.trim().toLowerCase()
    ) {
      geographyMismatch = true;
      flags.push('Record geography differs from linked market series geography.');
    }

    if (
      record.period.trim() &&
      linkedSeries.periodValues.length > 0 &&
      !linkedSeries.periodValues.some((pv) => pv.period.trim() === record.period.trim())
    ) {
      periodMismatch = true;
      flags.push('Record period does not match any period on the linked market series.');
    }
  }

  if (record.segment.trim() && record.marketDefinition.trim()) {
    const segmentRecord = payload.marketSizeSegmentationAndGrowth.marketSegmentations.find(
      (segment) => segment.id === record.segment.trim() || segment.segmentName === record.segment.trim(),
    );
    if (segmentRecord && segmentRecord.period.trim() && record.period.trim()) {
      if (segmentRecord.period.trim() !== record.period.trim()) {
        periodMismatch = true;
        flags.push('Market-share period differs from linked segment period.');
      }
    }
    if (
      segmentRecord &&
      segmentRecord.parentMarketSeriesId.trim() &&
      linkedSeries &&
      segmentRecord.parentMarketSeriesId !== linkedSeries.id
    ) {
      segmentMismatch = true;
      flags.push('Segment mapping does not align with the selected market definition.');
    }
  }

  const denominatorSource = getSourceById(payload, record.denominatorSourceId);
  if (denominatorSource?.unit.trim() && record.metricBasis.trim()) {
    const basisUnitMap: Record<string, string[]> = {
      revenue: ['revenue', 'value', 'inr', 'usd'],
      volume: ['volume', 'units', 'tonnes', 'litres'],
      units: ['units', 'volume'],
      capacity: ['capacity', 'mw', 'mtpa'],
    };
    const allowed = basisUnitMap[record.metricBasis] ?? [];
    const unitLower = denominatorSource.unit.toLowerCase();
    if (allowed.length > 0 && !allowed.some((token) => unitLower.includes(token))) {
      unitMismatch = true;
      flags.push('Denominator source unit may not match the selected metric basis.');
    }
  }

  if (
    record.numeratorSource === 'business-operations' ||
    record.numeratorSource === 'financials-kpis'
  ) {
    if (!record.linkedIssuerRecordId.trim()) {
      unsupportedNumerator = true;
      flags.push('Linked workstream numerator selected but no linked record ID provided.');
    }
  }

  return {
    calculatedMarketShare: round(calculatedMarketShare, 4),
    periodMismatch,
    geographyMismatch,
    segmentMismatch,
    unitMismatch,
    unsupportedNumerator,
    denominatorWithoutSource,
    calculatedVsReportedDifference,
    flags,
  };
}
