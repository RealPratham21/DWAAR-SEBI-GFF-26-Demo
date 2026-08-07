import { describe, expect, it } from 'vitest';

import {
  assessFinancialsKpis,
  calculateFinancialsKpisProgress,
  computeFinancialsKpisModel,
  createEmptyFinancialPeriod,
  createEmptyFinancialsKpisPayload,
  createEmptyLinkedWorkstreamReferences,
  createEmptyPlLineValue,
  createEmptyRestatementAdjustment,
  createEmptySmeEligibilityByPeriod,
  FINANCIALS_KPIS_SCHEMA_VERSION,
  FINANCIALS_KPIS_SECTION_IDS,
  financialsKpisPayloadSchema,
  getFullYearPeriods,
  getPeriodComparisonWarnings,
  isInterimPeriod,
  PL_LINE_KEYS,
  SECTION_PAYLOAD_KEYS,
  validatePeriodDeletion,
  type FinancialsKpisPayload,
} from '@/lib/financials-kpis';

describe('financials & KPIs foundation', () => {
  it('freezes schema version and eight sections', () => {
    expect(FINANCIALS_KPIS_SCHEMA_VERSION).toBe(1);
    expect(FINANCIALS_KPIS_SECTION_IDS).toHaveLength(8);
    const empty = createEmptyFinancialsKpisPayload();
    expect(empty.schemaVersion).toBe(1);
    expect(financialsKpisPayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('maps all eight section ids to payload keys', () => {
    expect(SECTION_PAYLOAD_KEYS['reporting-scope-periods-and-auditor-readiness']).toBe(
      'reportingScopePeriodsAndAuditorReadiness',
    );
    expect(SECTION_PAYLOAD_KEYS['mda-trends-material-developments-and-confirmations']).toBe(
      'mdaTrendsMaterialDevelopmentsAndConfirmations',
    );
  });

  it('defaults all eight canonical section keys', () => {
    const empty = createEmptyFinancialsKpisPayload();
    expect(empty.reportingScopePeriodsAndAuditorReadiness).toBeDefined();
    expect(empty.restatedStatementOfProfitAndLoss).toBeDefined();
    expect(empty.assetsLiabilitiesEquityAndCashFlows).toBeDefined();
    expect(empty.restatementAdjustmentsPoliciesAndAuditorMatters).toBeDefined();
    expect(empty.otherFinancialInformation).toBeDefined();
    expect(empty.ratiosCapitalisationAndIssuePriceMetrics).toBeDefined();
    expect(empty.kpiSelectionGovernanceAndPeerComparison).toBeDefined();
    expect(empty.mdaTrendsMaterialDevelopmentsAndConfirmations).toBeDefined();
  });

  it('assigns stable ids to repeatable records', () => {
    const period = createEmptyFinancialPeriod();
    expect(period.id.length).toBeGreaterThan(8);
    expect(period.label).toBe('');
  });

  it('never coerces an unanswered ternary to "no"', () => {
    const empty = createEmptyFinancialsKpisPayload();
    expect(empty.reportingScopePeriodsAndAuditorReadiness.reportingBasis.ociApplies).toBe('');
  });

  describe('period registry', () => {
    it('identifies full-year and interim periods', () => {
      const fy = {
        ...createEmptyFinancialPeriod('fy-1'),
        label: 'FY 2024',
        fullYearOrInterim: 'full-year' as const,
        startDate: '2023-04-01',
        endDate: '2024-03-31',
        months: '12',
      };
      const interim = {
        ...createEmptyFinancialPeriod('int-1'),
        label: 'H1 FY 2025',
        fullYearOrInterim: 'interim' as const,
        startDate: '2024-04-01',
        endDate: '2024-09-30',
        months: '6',
      };
      expect(isInterimPeriod(fy)).toBe(false);
      expect(isInterimPeriod(interim)).toBe(true);
    });

    it('blocks deletion when a period is referenced', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = {
        ...createEmptyFinancialPeriod('p1'),
        label: 'FY 2024',
        fullYearOrInterim: 'full-year' as const,
      };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        restatedStatementOfProfitAndLoss: {
          ...empty.restatedStatementOfProfitAndLoss,
          plLineValues: [
            {
              ...createEmptyPlLineValue('pl-1'),
              periodId: 'p1',
              lineKey: 'revenueFromOperations',
              amount: '1000000',
            },
          ],
        },
      };
      const validation = validatePeriodDeletion(payload, 'p1');
      expect(validation.canDelete).toBe(false);
      expect(validation.dependencies.length).toBeGreaterThan(0);
    });

    it('returns three full-year periods when registered', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [
            {
              ...createEmptyFinancialPeriod('y1'),
              label: 'FY 2022',
              fullYearOrInterim: 'full-year',
              startDate: '2021-04-01',
              endDate: '2022-03-31',
            },
            {
              ...createEmptyFinancialPeriod('y2'),
              label: 'FY 2023',
              fullYearOrInterim: 'full-year',
              startDate: '2022-04-01',
              endDate: '2023-03-31',
            },
            {
              ...createEmptyFinancialPeriod('y3'),
              label: 'FY 2024',
              fullYearOrInterim: 'full-year',
              startDate: '2023-04-01',
              endDate: '2024-03-31',
            },
          ],
        },
      };
      expect(getFullYearPeriods(payload)).toHaveLength(3);
    });
  });

  describe('P&L calculations', () => {
    it('derives total income and profit before tax from components', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = {
        ...createEmptyFinancialPeriod('p1'),
        label: 'FY 2024',
        endDate: '2024-03-31',
        fullYearOrInterim: 'full-year' as const,
      };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        restatedStatementOfProfitAndLoss: {
          ...empty.restatedStatementOfProfitAndLoss,
          plLineValues: [
            {
              ...createEmptyPlLineValue('r1'),
              periodId: 'p1',
              lineKey: 'revenueFromOperations',
              amount: '10000000',
            },
            {
              ...createEmptyPlLineValue('e1'),
              periodId: 'p1',
              lineKey: 'employeeBenefitExpenses',
              amount: '2000000',
            },
            {
              ...createEmptyPlLineValue('e2'),
              periodId: 'p1',
              lineKey: 'financeCosts',
              amount: '500000',
            },
            {
              ...createEmptyPlLineValue('e3'),
              periodId: 'p1',
              lineKey: 'depreciation',
              amount: '300000',
            },
          ],
        },
      };
      const model = computeFinancialsKpisModel(payload);
      const pl = model.plByPeriod.find((row) => row.periodId === 'p1');
      expect(pl?.totalIncome).toBe('10000000');
      expect(pl?.totalExpenses).toBe('2800000');
      expect(pl?.profitBeforeTax).toBe('7200000');
      expect(pl?.ebitda).toBe('8000000');
    });

    it('exposes all canonical P&L line keys', () => {
      expect(PL_LINE_KEYS).toContain('revenueFromOperations');
      expect(PL_LINE_KEYS).toContain('profitAfterTax');
      expect(PL_LINE_KEYS.length).toBeGreaterThan(20);
    });
  });

  describe('balance sheet reconciliation', () => {
    it('reconciles when total assets equal equity and liabilities', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = {
        ...createEmptyFinancialPeriod('p1'),
        label: 'FY 2024',
        endDate: '2024-03-31',
      };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        assetsLiabilitiesEquityAndCashFlows: {
          ...empty.assetsLiabilitiesEquityAndCashFlows,
          balanceSheetLineValues: [
            {
              id: 'bs-1',
              periodId: 'p1',
              lineKey: 'totalAssets',
              amount: '50000000',
              sourceStatus: 'audited_financial_statements',
              note: '',
            },
            {
              id: 'bs-2',
              periodId: 'p1',
              lineKey: 'totalEquityAndLiabilities',
              amount: '50000000',
              sourceStatus: 'audited_financial_statements',
              note: '',
            },
          ],
        },
      };
      const model = computeFinancialsKpisModel(payload);
      const bs = model.bsByPeriod.find((row) => row.periodId === 'p1');
      expect(bs?.assetsReconciles).toBe(true);
      const check = model.reconciliation.find((item) => item.id === 'bs-balance-p1');
      expect(check?.status).toBe('reconciled');
    });

    it('flags variance when balance sheet does not tie', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = { ...createEmptyFinancialPeriod('p1'), label: 'FY 2024', endDate: '2024-03-31' };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        assetsLiabilitiesEquityAndCashFlows: {
          ...empty.assetsLiabilitiesEquityAndCashFlows,
          balanceSheetLineValues: [
            {
              id: 'bs-1',
              periodId: 'p1',
              lineKey: 'totalAssets',
              amount: '50000000',
              sourceStatus: '',
              note: '',
            },
            {
              id: 'bs-2',
              periodId: 'p1',
              lineKey: 'totalEquityAndLiabilities',
              amount: '49000000',
              sourceStatus: '',
              note: '',
            },
          ],
        },
      };
      const model = computeFinancialsKpisModel(payload);
      const bs = model.bsByPeriod.find((row) => row.periodId === 'p1');
      expect(bs?.assetsReconciles).toBe(false);
    });
  });

  describe('ratios and SME eligibility', () => {
    it('calculates current ratio from entered balance sheet lines', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = { ...createEmptyFinancialPeriod('p1'), label: 'FY 2024', endDate: '2024-03-31' };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        assetsLiabilitiesEquityAndCashFlows: {
          ...empty.assetsLiabilitiesEquityAndCashFlows,
          balanceSheetLineValues: [
            {
              id: 'ca',
              periodId: 'p1',
              lineKey: 'totalCurrentAssets',
              amount: '20000000',
              sourceStatus: '',
              note: '',
            },
            {
              id: 'cl',
              periodId: 'p1',
              lineKey: 'totalCurrentLiabilities',
              amount: '10000000',
              sourceStatus: '',
              note: '',
            },
          ],
        },
      };
      const model = computeFinancialsKpisModel(payload);
      const ratios = model.ratiosByPeriod.find((row) => row.periodId === 'p1');
      expect(ratios?.currentRatio).toBe('2');
    });

    it('marks SME operating profit as appears_satisfied when below threshold', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = { ...createEmptyFinancialPeriod('p1'), label: 'FY 2024' };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        ratiosCapitalisationAndIssuePriceMetrics: {
          ...empty.ratiosCapitalisationAndIssuePriceMetrics,
          smeEligibilityByPeriod: [
            {
              ...createEmptySmeEligibilityByPeriod('sme-1'),
              periodId: 'p1',
              operatingProfit: '1000000000',
              netWorth: '500000000',
              fcfe: '200000000',
              sourceStatus: 'audited_financial_statements',
            },
          ],
        },
      };
      const model = computeFinancialsKpisModel(payload);
      expect(model.smeEligibility[0]?.operatingProfitState).toBe('appears_satisfied');
      expect(model.smeEligibility[0]?.netWorthState).toBe('appears_satisfied');
      expect(model.smeEligibility[0]?.fcfeState).toBe('appears_satisfied');
    });

    it('marks issue-price metrics pending when IPO Setup is unavailable', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const model = computeFinancialsKpisModel(empty, createEmptyLinkedWorkstreamReferences());
      const assessment = assessFinancialsKpis(empty);
      expect(
        assessment.criteria.some(
          (item) =>
            item.id === 'ipo-setup-link' && item.state === 'pending_linked_workstream',
        ),
      ).toBe(true);
      expect(model.ratiosByPeriod.every((row) => row.issuePricePending)).toBe(true);
    });
  });

  describe('restatement and assessment', () => {
    it('validates restatement adjustment arithmetic', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const payload: FinancialsKpisPayload = {
        ...empty,
        restatementAdjustmentsPoliciesAndAuditorMatters: {
          ...empty.restatementAdjustmentsPoliciesAndAuditorMatters,
          restatementAdjustments: [
            {
              ...createEmptyRestatementAdjustment('adj-1'),
              periodId: 'p1',
              originalAuditedAmount: '1000',
              adjustmentAmount: '200',
              restatedAmount: '1200',
            },
          ],
        },
      };
      const model = computeFinancialsKpisModel(payload);
      expect(model.restatementChecks[0]?.reconciles).toBe(true);
    });

    it('returns assessment states including potential_inconsistency', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const period = { ...createEmptyFinancialPeriod('p1'), label: 'FY 2024', endDate: '2024-03-31' };
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [period],
        },
        assetsLiabilitiesEquityAndCashFlows: {
          ...empty.assetsLiabilitiesEquityAndCashFlows,
          balanceSheetLineValues: [
            {
              id: 'bs-1',
              periodId: 'p1',
              lineKey: 'totalAssets',
              amount: '100',
              sourceStatus: '',
              note: '',
            },
            {
              id: 'bs-2',
              periodId: 'p1',
              lineKey: 'totalEquityAndLiabilities',
              amount: '90',
              sourceStatus: '',
              note: '',
            },
          ],
        },
      };
      const assessment = assessFinancialsKpis(payload);
      expect(
        assessment.criteria.some((item) => item.state === 'potential_inconsistency'),
      ).toBe(true);
    });
  });

  describe('interim period warnings', () => {
    it('warns when comparing interim to full-year periods', () => {
      const empty = createEmptyFinancialsKpisPayload();
      const payload: FinancialsKpisPayload = {
        ...empty,
        reportingScopePeriodsAndAuditorReadiness: {
          ...empty.reportingScopePeriodsAndAuditorReadiness,
          financialPeriods: [
            {
              ...createEmptyFinancialPeriod('fy'),
              label: 'FY 2024',
              fullYearOrInterim: 'full-year',
              months: '12',
            },
            {
              ...createEmptyFinancialPeriod('int'),
              label: 'H1 FY 2025',
              fullYearOrInterim: 'interim',
              months: '6',
            },
          ],
        },
        mdaTrendsMaterialDevelopmentsAndConfirmations: {
          ...empty.mdaTrendsMaterialDevelopmentsAndConfirmations,
          varianceAnalyses: [
            {
              id: 'var-1',
              lineItem: 'Revenue',
              previousPeriodId: 'fy',
              currentPeriodId: 'int',
              previousValue: '10000000',
              currentValue: '6000000',
              explanation: '',
              primaryDriver: '',
              oneOffOrRecurring: '',
              supportingSource: '',
              managementConfirmation: '',
              professionalReviewStatus: '',
              notes: '',
            },
          ],
        },
      };
      const warnings = getPeriodComparisonWarnings(payload);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  it('calculates section progress across eight sections', () => {
    const empty = createEmptyFinancialsKpisPayload();
    const progress = calculateFinancialsKpisProgress(empty);
    expect(progress.totalSections).toBe(8);
    expect(progress.overallStatus).toBe('not_started');
  });
});
