/**
 * Market-series growth and segmentation reconciliation (NOT persisted).
 */

import {
  abs,
  compare,
  difference,
  differsBeyond,
  div,
  isFilledDecimal,
  pct,
  round,
  subtract,
  sumDecimals,
  toFixedString,
  toNumber,
} from '@/lib/industry-market/decimal';
import type { MarketSegmentationRecord } from '@/lib/schemas/industry-market';

export type CagrReconciliation = {
  reported: string;
  calculated: string;
  difference: string;
  reconciles: boolean;
  message: string;
};

export type SegmentPercentageReconciliation = {
  parentMarketSeriesId: string;
  period: string;
  totalPercentage: string;
  reconciles: boolean;
  flags: string[];
};

/** Year-on-year growth: ((current - prior) / |prior|) × 100. */
export function calculateYoYGrowth(
  currentValue: string,
  priorValue: string,
  decimalPlaces = 2,
): string {
  if (!isFilledDecimal(currentValue) || !isFilledDecimal(priorValue)) return '';
  const priorCmp = compare(priorValue, '0');
  if (priorCmp === null || priorCmp === 0) return '';
  return pct(difference(currentValue, priorValue), abs(priorValue), decimalPlaces);
}

/**
 * CAGR over `periodCount` intervals: ((end / start) ^ (1 / periodCount) - 1) × 100.
 *
 * Fractional exponent uses `toNumber` for the root step; inputs and output remain decimal strings.
 */
export function calculateCagr(
  startValue: string,
  endValue: string,
  periodCount: number,
  decimalPlaces = 2,
): string {
  if (!isFilledDecimal(startValue) || !isFilledDecimal(endValue)) return '';
  if (periodCount <= 0) return '';
  const startCmp = compare(startValue, '0');
  if (startCmp === null || startCmp <= 0) return '';

  const ratio = div(endValue, startValue, 12);
  if (ratio === '') return '';

  const ratioNum = toNumber(ratio);
  if (ratioNum === null || ratioNum <= 0) return '';

  const cagr = (Math.pow(ratioNum, 1 / periodCount) - 1) * 100;
  if (!Number.isFinite(cagr)) return '';
  return toFixedString(String(cagr), decimalPlaces);
}

export function reconcileReportedVsCalculatedCagr(
  reported: string,
  calculated: string,
  tolerance = '0.5',
): CagrReconciliation {
  const hasReported = isFilledDecimal(reported);
  const hasCalculated = isFilledDecimal(calculated);

  if (!hasReported && !hasCalculated) {
    return {
      reported: '',
      calculated: '',
      difference: '',
      reconciles: false,
      message: 'Neither reported nor calculated CAGR is available.',
    };
  }

  if (!hasReported) {
    return {
      reported: '',
      calculated,
      difference: '',
      reconciles: false,
      message: 'Reported CAGR not entered — calculated value shown for reference only.',
    };
  }

  if (!hasCalculated) {
    return {
      reported,
      calculated: '',
      difference: '',
      reconciles: false,
      message: 'Calculated CAGR cannot be computed from available period values.',
    };
  }

  const delta = round(difference(reported, calculated), 2);
  const reconciles = !differsBeyond(reported, calculated, tolerance);

  return {
    reported,
    calculated,
    difference: delta,
    reconciles,
    message: reconciles
      ? 'Reported and calculated CAGR reconcile within tolerance.'
      : `Reported CAGR differs from calculated by ${delta} percentage points.`,
  };
}

/**
 * Sum sibling segment percentages for each parent market series and period.
 * Flags totals materially above 100% or with overlapping-definition concerns.
 */
export function reconcileSegmentPercentages(
  segments: MarketSegmentationRecord[],
  tolerance = '2',
): SegmentPercentageReconciliation[] {
  const groups = new Map<string, MarketSegmentationRecord[]>();

  for (const segment of segments) {
    if (!segment.parentMarketSeriesId.trim()) continue;
    const key = `${segment.parentMarketSeriesId}::${segment.period.trim()}`;
    const existing = groups.get(key) ?? [];
    existing.push(segment);
    groups.set(key, existing);
  }

  const results: SegmentPercentageReconciliation[] = [];

  for (const [key, group] of groups) {
    const [parentMarketSeriesId, period] = key.split('::');
    const percentages = group
      .map((segment) => segment.marketSharePercentage)
      .filter(isFilledDecimal);
    const totalPercentage =
      percentages.length > 0 ? sumDecimals(percentages) : '';

    const flags: string[] = [];
    if (group.some((segment) => !segment.parentMarketSeriesId.trim())) {
      flags.push('Segment missing parent market series.');
    }
    if (group.some((segment) => !isFilledDecimal(segment.marketSharePercentage))) {
      flags.push('One or more segments lack a market-share percentage.');
    }
    if (isFilledDecimal(totalPercentage)) {
      const totalVs100 = compare(totalPercentage, '100');
      if (totalVs100 !== null) {
        if (totalVs100 > 0 && !differsBeyond(totalPercentage, '100', tolerance)) {
          flags.push(`Segment percentages sum to ${totalPercentage}% — exceeds 100%.`);
        } else if (totalVs100 > 0) {
          flags.push(`Segment percentages sum to ${totalPercentage}% — materially above 100%.`);
        }
        const totalVsLowerBound = compare(totalPercentage, subtract('100', tolerance));
        if (totalVsLowerBound !== null && totalVsLowerBound < 0) {
          flags.push(`Segment percentages sum to ${totalPercentage}% — materially below 100%.`);
        }
      }
    }

    const reconciles =
      flags.length === 0 &&
      isFilledDecimal(totalPercentage) &&
      !differsBeyond(totalPercentage, '100', tolerance);

    results.push({
      parentMarketSeriesId,
      period,
      totalPercentage,
      reconciles,
      flags,
    });
  }

  return results;
}
