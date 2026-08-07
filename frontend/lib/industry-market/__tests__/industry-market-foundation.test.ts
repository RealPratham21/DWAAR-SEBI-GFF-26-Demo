import { describe, expect, it } from 'vitest';

import {
  assessIndustryMarket,
  calculateCagr,
  calculateIndustryMarketProgress,
  calculateMarketShare,
  calculateYoYGrowth,
  computeIndustryMarketModel,
  countSourceReferences,
  createEmptyClaimRecord,
  createEmptyIndustryMarketPayload,
  createEmptyMarketSegmentationRecord,
  createEmptyMarketSeriesRecord,
  createEmptyMarketShareRecord,
  createEmptySourceRecord,
  deriveClaimStatus,
  detectUnsupportedClaimWording,
  INDUSTRY_CRITERION_STATES,
  INDUSTRY_MARKET_CONFIRMATION_FIELDS,
  INDUSTRY_MARKET_SCHEMA_VERSION,
  INDUSTRY_MARKET_SECTION_IDS,
  industryMarketPayloadSchema,
  reconcileReportedVsCalculatedCagr,
  reconcileSegmentPercentages,
  validateMarketShareRecord,
} from '@/lib/industry-market';
import { SECTION_PAYLOAD_KEYS } from '@/lib/industry-market/context';
import type { IndustryMarketPayload } from '@/lib/schemas/industry-market';

describe('industry & market foundation', () => {
  it('freezes schema version and eight sections', () => {
    expect(INDUSTRY_MARKET_SCHEMA_VERSION).toBe(1);
    expect(INDUSTRY_MARKET_SECTION_IDS).toHaveLength(8);
    const empty = createEmptyIndustryMarketPayload();
    expect(empty.schemaVersion).toBe(1);
    expect(industryMarketPayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('maps all eight section ids to payload keys', () => {
    expect(SECTION_PAYLOAD_KEYS['industry-scope-and-company-market-mapping']).toBe(
      'industryScopeAndCompanyMarketMapping',
    );
    expect(SECTION_PAYLOAD_KEYS['outlook-industry-risks-and-confirmations']).toBe(
      'outlookIndustryRisksAndConfirmations',
    );
  });

  it('assigns stable ids to repeatable records', () => {
    const source = createEmptySourceRecord();
    expect(source.id.length).toBeGreaterThan(8);
    expect(source.title).toBe('');
  });

  it('never coerces an unanswered ternary to "no"', () => {
    const source = createEmptySourceRecord();
    expect(source.commissionedReportDetails.commissionedByIssuer).toBe('');
  });

  it('exposes eighteen confirmation fields', () => {
    expect(INDUSTRY_MARKET_CONFIRMATION_FIELDS).toHaveLength(18);
  });

  it('calculates YoY growth from decimal period values', () => {
    const growth = calculateYoYGrowth('110', '100');
    expect(growth).toBe('10');
  });

  it('calculates CAGR and reconciles reported versus calculated', () => {
    const cagr = calculateCagr('100', '121', 2);
    expect(cagr).toBe('10.00');
    const reconciliation = reconcileReportedVsCalculatedCagr('12', cagr);
    expect(reconciliation.difference).not.toBe('');
  });

  it('flags segment percentages that exceed 100%', () => {
    const parentId = 'series-1';
    const results = reconcileSegmentPercentages([
      {
        ...createEmptyMarketSegmentationRecord(),
        parentMarketSeriesId: parentId,
        period: 'FY2024',
        marketSharePercentage: '60',
      },
      {
        ...createEmptyMarketSegmentationRecord(),
        parentMarketSeriesId: parentId,
        period: 'FY2024',
        marketSharePercentage: '50',
      },
    ]);
    expect(results[0]?.reconciles).toBe(false);
    expect(results[0]?.flags.length).toBeGreaterThan(0);
  });

  it('calculates market share deterministically', () => {
    const share = calculateMarketShare('25', '100');
    expect(share).toBe('25');
  });

  it('flags market-share period mismatch', () => {
    const empty = createEmptyIndustryMarketPayload();
    const series = {
      ...createEmptyMarketSeriesRecord('series-1'),
      marketName: 'Widget market',
      geography: 'india',
      periodValues: [
        {
          id: 'pv-1',
          period: 'FY2024',
          value: '100',
          actualEstimateForecast: 'actual' as const,
          sourceId: '',
          notes: '',
        },
      ],
    };
    const record = {
      ...createEmptyMarketShareRecord(),
      marketDefinition: 'Widget market',
      geography: 'india',
      period: 'FY2023',
      issuerNumerator: '10',
      totalMarketDenominator: '100',
      denominatorSourceId: 'src-1',
    };
    const payload: IndustryMarketPayload = {
      ...empty,
      marketSizeSegmentationAndGrowth: {
        ...empty.marketSizeSegmentationAndGrowth,
        marketSeries: [series],
      },
      competitionMarketShareAndIssuerPositioning: {
        ...empty.competitionMarketShareAndIssuerPositioning,
        marketShareRecords: [record],
      },
    };
    const flags = validateMarketShareRecord(record, payload);
    expect(flags.periodMismatch).toBe(true);
  });

  it('detects unsupported claim wording', () => {
    expect(detectUnsupportedClaimWording('largest player in India')).toContain('largest');
    expect(detectUnsupportedClaimWording('stable market dynamics')).toHaveLength(0);
  });

  it('marks unsupported claims as insufficient source without a source id', () => {
    const claim = {
      ...createEmptyClaimRecord(),
      exactProposedWording: 'Leading player in India',
      claimType: 'leading' as const,
    };
    const empty = createEmptyIndustryMarketPayload();
    const status = deriveClaimStatus(claim, empty);
    expect(status).toBe('do_not_use');
  });

  it('counts source references across the payload', () => {
    const empty = createEmptyIndustryMarketPayload();
    const source = createEmptySourceRecord();
    const payload: IndustryMarketPayload = {
      ...empty,
      researchSourcesAndIndustryReportGovernance: {
        sources: [source],
        notes: '',
      },
      macroeconomicAndIndustryContext: {
        ...empty.macroeconomicAndIndustryContext,
        macroeconomicIndicators: [
          {
            ...empty.macroeconomicAndIndustryContext.macroeconomicIndicators[0]!,
            sourceId: source.id,
          },
        ],
      },
    };
    const refs = countSourceReferences(payload, source.id);
    expect(refs.total).toBeGreaterThan(0);
    expect(refs.locations.length).toBeGreaterThan(0);
  });

  it('runs industry assessment with eleven criterion states', () => {
    expect(INDUSTRY_CRITERION_STATES).toHaveLength(11);
    const empty = createEmptyIndustryMarketPayload();
    const assessment = assessIndustryMarket(empty);
    expect(assessment.result).toBeTruthy();
    expect(assessment.groups.length).toBeGreaterThan(0);
  });

  it('computes overview model from payload', () => {
    const empty = createEmptyIndustryMarketPayload();
    const model = computeIndustryMarketModel(empty);
    expect(model.marketSeriesCount).toBe(0);
    expect(calculateIndustryMarketProgress(empty).totalSections).toBe(8);
  });
});
