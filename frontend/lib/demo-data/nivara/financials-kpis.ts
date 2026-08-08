import {
  createEmptyAccountingPolicy,
  createEmptyAuditReportMatter,
  createEmptyBalanceSheetLineValue,
  createEmptyCashFlowLineValue,
  createEmptyFinancialPeriod,
  createEmptyFinancialsKpisPayload,
  createEmptyKpiRegisterEntry,
  createEmptyLiquidityCapitalResources,
  createEmptyPerformanceFactor,
  createEmptyPerShareByPeriod,
  createEmptyPlLineValue,
  createEmptySegmentRecord,
  createEmptySmeEligibilityByPeriod,
  createEmptyTaxByPeriod,
  createEmptyTrendUncertainty,
  createEmptyVarianceAnalysis,
  createEmptyWorkingCapitalSummary,
} from '@/lib/financials-kpis/defaults';
import { FINANCIALS_KPIS_CONFIRMATION_FIELDS } from '@/lib/financials-kpis/options';
import type {
  BsLineKey,
  CashFlowLineKey,
  FinancialsKpisPayload,
  PlLineKey,
  PlLineValue,
} from '@/lib/schemas/financials-kpis';
import {
  NIVARA_BORROWINGS,
  NIVARA_BUSINESS,
  NIVARA_CAPITAL,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_ISSUER,
} from './constants';

const PERIOD_FY2022 = 'nivara-fy2022';
const PERIOD_FY2023 = 'nivara-fy2023';
const PERIOD_FY2024 = 'nivara-fy2024';
const ALL_PERIODS = [PERIOD_FY2022, PERIOD_FY2023, PERIOD_FY2024] as const;

type PeriodPlLines = Partial<Record<PlLineKey, string>>;

function plLinesForPeriod(periodId: string, lines: PeriodPlLines): PlLineValue[] {
  return Object.entries(lines).map(([lineKey, amount], index) => ({
    ...createEmptyPlLineValue(`${periodId}-${lineKey}-${index}`),
    periodId,
    lineKey: lineKey as PlLineKey,
    amount,
    sourceStatus: 'restated_financial_information',
    adjustmentPresent: 'no',
    professionalConfirmationStatus: 'pending',
  }));
}

function balanceSheetLinesForPeriod(
  periodId: string,
  lines: Partial<Record<BsLineKey, string>>,
): ReturnType<typeof createEmptyBalanceSheetLineValue>[] {
  return Object.entries(lines).map(([lineKey, amount], index) => ({
    ...createEmptyBalanceSheetLineValue(`${periodId}-bs-${lineKey}-${index}`),
    periodId,
    lineKey: lineKey as BsLineKey,
    amount,
    sourceStatus: 'restated_financial_information',
  }));
}

function cashFlowLinesForPeriod(
  periodId: string,
  lines: Partial<Record<CashFlowLineKey, string>>,
): ReturnType<typeof createEmptyCashFlowLineValue>[] {
  return Object.entries(lines).map(([lineKey, amount], index) => ({
    ...createEmptyCashFlowLineValue(`${periodId}-cf-${lineKey}-${index}`),
    periodId,
    lineKey: lineKey as CashFlowLineKey,
    amount,
    sourceStatus: 'restated_financial_information',
  }));
}

const FY2022_LINES: PeriodPlLines = {
  revenueFromOperations: '4200',
  costOfMaterialsConsumed: '2400',
  employeeBenefitExpenses: '650',
  otherOperatingExpenses: '280',
  financeCosts: '100',
  depreciation: '180',
  currentTax: '98',
};

const FY2023_LINES: PeriodPlLines = {
  revenueFromOperations: '5100',
  costOfMaterialsConsumed: '2900',
  employeeBenefitExpenses: '780',
  otherOperatingExpenses: '330',
  financeCosts: '110',
  depreciation: '210',
  currentTax: '143',
};

const FY2024_LINES: PeriodPlLines = {
  revenueFromOperations: '6300',
  costOfMaterialsConsumed: '3500',
  employeeBenefitExpenses: '950',
  otherOperatingExpenses: '400',
  financeCosts: '120',
  depreciation: '250',
  currentTax: '170',
};

const BALANCE_SHEET_BY_PERIOD: Record<(typeof ALL_PERIODS)[number], Partial<Record<BsLineKey, string>>> =
  {
    [PERIOD_FY2022]: {
      totalAssets: '4100',
      totalEquityAndLiabilities: '4100',
    },
    [PERIOD_FY2023]: {
      totalAssets: '4800',
      totalEquityAndLiabilities: '4800',
    },
    [PERIOD_FY2024]: {
      totalAssets: '5600',
      totalEquityAndLiabilities: '5600',
    },
  };

const CASH_FLOW_BY_PERIOD: Record<
  (typeof ALL_PERIODS)[number],
  Partial<Record<CashFlowLineKey, string>>
> = {
  [PERIOD_FY2022]: {
    cashFlowFromOperatingActivities: '520',
    cashFlowFromInvestingActivities: '-240',
    cashFlowFromFinancingActivities: '-180',
    netIncreaseDecreaseInCash: '100',
  },
  [PERIOD_FY2023]: {
    cashFlowFromOperatingActivities: '610',
    cashFlowFromInvestingActivities: '-280',
    cashFlowFromFinancingActivities: '-190',
    netIncreaseDecreaseInCash: '140',
  },
  [PERIOD_FY2024]: {
    cashFlowFromOperatingActivities: '740',
    cashFlowFromInvestingActivities: '-320',
    cashFlowFromFinancingActivities: '-210',
    netIncreaseDecreaseInCash: '210',
  },
};

const SME_OPERATING_PROFIT_BY_PERIOD: Record<(typeof ALL_PERIODS)[number], string> = {
  [PERIOD_FY2022]: '590',
  [PERIOD_FY2023]: '780',
  [PERIOD_FY2024]: '980',
};

function allConfirmationsTrue() {
  return Object.fromEntries(
    FINANCIALS_KPIS_CONFIRMATION_FIELDS.map((field) => [field.key, true]),
  ) as ReturnType<
    typeof createEmptyFinancialsKpisPayload
  >['mdaTrendsMaterialDevelopmentsAndConfirmations']['confirmations'];
}

export function createNivaraFinancialsKpisPayload(): FinancialsKpisPayload {
  const payload = createEmptyFinancialsKpisPayload();

  payload.reportingScopePeriodsAndAuditorReadiness = {
    ...payload.reportingScopePeriodsAndAuditorReadiness,
    reportingBasis: {
      ...payload.reportingScopePeriodsAndAuditorReadiness.reportingBasis,
      financialYearEnd: 'March 31',
      accountingFramework: 'indian-gaap',
      financialPresentation: 'standalone',
      currency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
      displayUnit: NIVARA_FINANCIAL_PERIODS.amountUnit,
      roundingConvention: 'Nearest lakh',
      ociApplies: 'no',
      cashFlowAvailable: 'yes',
      changesInEquityAvailable: 'yes',
      comparativePeriodConsistency: 'yes',
      subsidiariesDeclared: 'no',
      associatesDeclared: 'no',
      jointVenturesDeclared: 'no',
      foreignEntitiesDeclared: 'no',
    },
    financialPeriods: [
      {
        ...createEmptyFinancialPeriod(PERIOD_FY2022),
        label: 'FY 2022',
        startDate: '2021-04-01',
        endDate: NIVARA_FINANCIAL_PERIODS.fy2022End,
        months: '12',
        fullYearOrInterim: 'full-year',
        basis: 'standalone',
        auditedStatus: 'audited',
        restatedStatus: 'restated',
        sourceStatus: 'restated_financial_information',
        finalisationStatus: 'finalised',
      },
      {
        ...createEmptyFinancialPeriod(PERIOD_FY2023),
        label: 'FY 2023',
        startDate: '2022-04-01',
        endDate: NIVARA_FINANCIAL_PERIODS.fy2023End,
        months: '12',
        fullYearOrInterim: 'full-year',
        basis: 'standalone',
        auditedStatus: 'audited',
        restatedStatus: 'restated',
        sourceStatus: 'restated_financial_information',
        finalisationStatus: 'finalised',
      },
      {
        ...createEmptyFinancialPeriod(PERIOD_FY2024),
        label: 'FY 2024',
        startDate: '2023-04-01',
        endDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        months: '12',
        fullYearOrInterim: 'full-year',
        basis: 'standalone',
        auditedStatus: 'audited',
        restatedStatus: 'restated',
        sourceStatus: 'restated_financial_information',
        finalisationStatus: 'finalised',
      },
    ],
    auditorReadiness: {
      ...payload.reportingScopePeriodsAndAuditorReadiness.auditorReadiness,
      currentStatutoryAuditor: 'KPMG & Associates',
      firmRegistrationNumber: '003983N/N500029',
      signingPartner: 'Rajesh Iyer',
      appointmentPeriod: 'FY 2022 to FY 2026',
      restatementEngagementStatus: 'engaged',
      restatementExerciseStatus: 'under-preparation',
      latestFilingReadyPeriodId: PERIOD_FY2024,
      financialInformationSufficientlyCurrent: 'yes',
    },
  };

  payload.restatedStatementOfProfitAndLoss = {
    ...payload.restatedStatementOfProfitAndLoss,
    plLineValues: [
      ...plLinesForPeriod(PERIOD_FY2022, FY2022_LINES),
      ...plLinesForPeriod(PERIOD_FY2023, FY2023_LINES),
      ...plLinesForPeriod(PERIOD_FY2024, FY2024_LINES),
    ],
    perShareByPeriod: ALL_PERIODS.map((periodId) => ({
      ...createEmptyPerShareByPeriod(`nivara-per-share-${periodId}`),
      periodId,
      weightedAvgBasicShares: NIVARA_CAPITAL.preIssueEquityShares,
      faceValue: NIVARA_CAPITAL.faceValuePerShare,
    })),
    notes: `${NIVARA_ISSUER.legalName} restated standalone P&L for SME IPO eligibility.`,
  };

  payload.assetsLiabilitiesEquityAndCashFlows = {
    ...payload.assetsLiabilitiesEquityAndCashFlows,
    balanceSheetLineValues: ALL_PERIODS.flatMap((periodId) =>
      balanceSheetLinesForPeriod(periodId, BALANCE_SHEET_BY_PERIOD[periodId]),
    ),
    cashFlowLineValues: ALL_PERIODS.flatMap((periodId) =>
      cashFlowLinesForPeriod(periodId, CASH_FLOW_BY_PERIOD[periodId]),
    ),
    notes: 'Restated standalone balance sheet and cash flow statements in INR lakh.',
  };

  payload.restatementAdjustmentsPoliciesAndAuditorMatters = {
    ...payload.restatementAdjustmentsPoliciesAndAuditorMatters,
    accountingPolicies: [
      {
        ...createEmptyAccountingPolicy('nivara-policy-revenue'),
        policyCategory: 'revenue-recognition',
        existingTreatment: 'Revenue from sale of goods recognised on dispatch per Ind AS 115 / Schedule III.',
        changeDuringPeriod: 'no',
        auditorConfirmationStatus: 'pending',
      },
    ],
    auditReportMatters: ALL_PERIODS.map((periodId) => ({
      ...createEmptyAuditReportMatter(`nivara-audit-${periodId}`),
      periodId,
      auditOpinion: 'unmodified',
      adjustedInRestatedInformation: 'yes',
    })),
    notes: 'Limited restatement adjustments for IPO filing presentation; policies and audit opinions captured.',
  };

  payload.otherFinancialInformation = {
    ...payload.otherFinancialInformation,
    segmentRecords: [
      {
        ...createEmptySegmentRecord('nivara-segment-automotive-fy2024'),
        periodId: PERIOD_FY2024,
        segmentName: 'Automotive components',
        productsServices: NIVARA_BUSINESS.primaryIndustry,
        externalRevenue: '5200',
        totalSegmentRevenue: '5200',
        sourceStatus: 'restated_financial_information',
      },
    ],
    workingCapitalSummaries: [
      {
        ...createEmptyWorkingCapitalSummary('nivara-wc-fy2024'),
        periodId: PERIOD_FY2024,
        inventory: '980',
        receivables: '760',
        payables: '540',
        netWorkingCapital: '1200',
        sourceStatus: 'restated_financial_information',
      },
    ],
    indebtednessSummary: {
      ...payload.otherFinancialInformation.indebtednessSummary,
      longTermDebt: NIVARA_BORROWINGS.termLoanOutstanding,
      totalDebt: NIVARA_BORROWINGS.termLoanOutstanding,
      securedDebt: NIVARA_BORROWINGS.termLoanOutstanding,
      sourceStatus: 'restated_financial_information',
      notes: NIVARA_BORROWINGS.facilityLabel,
    },
    taxByPeriod: [
      {
        ...createEmptyTaxByPeriod('nivara-tax-fy2024'),
        periodId: PERIOD_FY2024,
        currentTax: FY2024_LINES.currentTax ?? '170',
        effectiveTaxRate: '25.5',
      },
    ],
    notes: 'Segment, working capital, indebtedness and tax disclosures for Nivara standalone entity.',
  };

  payload.ratiosCapitalisationAndIssuePriceMetrics = {
    ...payload.ratiosCapitalisationAndIssuePriceMetrics,
    smeEligibilityByPeriod: ALL_PERIODS.map((periodId) => ({
      ...createEmptySmeEligibilityByPeriod(`nivara-sme-${periodId}`),
      periodId,
      operatingProfit: SME_OPERATING_PROFIT_BY_PERIOD[periodId],
      netWorth: '2200',
      fcfe: '640',
      sourceStatus: 'restated_financial_information',
    })),
    notes: 'SME eligibility metrics derived from restated standalone financial information.',
  };

  payload.kpiSelectionGovernanceAndPeerComparison = {
    ...payload.kpiSelectionGovernanceAndPeerComparison,
    kpiRegister: [
      {
        ...createEmptyKpiRegisterEntry('nivara-kpi-capacity-utilisation'),
        name: 'Capacity utilisation',
        category: 'operational',
        plainEnglishDefinition:
          'Actual production output as a percentage of installed manufacturing capacity at the Bhosari facility.',
        unit: 'percentage',
        frequency: 'annual',
        source: 'management_accounts',
        professionalCertificationStatus: 'pending',
      },
    ],
    managementCertification: {
      ...payload.kpiSelectionGovernanceAndPeerComparison.managementCertification,
      status: 'draft-prepared',
      signatoryRole: 'chief-financial-officer',
      signatoryName: 'Neha Patil',
    },
    professionalCertification: {
      ...payload.kpiSelectionGovernanceAndPeerComparison.professionalCertification,
      certificationStatus: 'pending-engagement',
    },
    notes: 'Initial KPI register and governance records for Nivara SME IPO readiness.',
  };

  payload.mdaTrendsMaterialDevelopmentsAndConfirmations = {
    ...payload.mdaTrendsMaterialDevelopmentsAndConfirmations,
    performanceFactors: [
      {
        ...createEmptyPerformanceFactor('nivara-mda-revenue-growth'),
        title: 'Revenue growth from automotive OEM demand',
        category: 'demand',
        affectedFinancialLineItems: 'revenueFromOperations',
        periodsAffected: 'FY 2023 to FY 2024',
        explanation:
          'Higher offtake from existing automotive customers and incremental export orders drove revenue growth.',
        temporaryOrContinuing: 'continuing',
      },
    ],
    varianceAnalyses: [
      {
        ...createEmptyVarianceAnalysis('nivara-variance-revenue-fy2024'),
        lineItem: 'Revenue from operations',
        previousPeriodId: PERIOD_FY2023,
        currentPeriodId: PERIOD_FY2024,
        previousValue: FY2023_LINES.revenueFromOperations ?? '5100',
        currentValue: FY2024_LINES.revenueFromOperations ?? '6300',
        explanation:
          'Volume growth in precision components and improved realisation on export shipments.',
        primaryDriver: 'volume',
        oneOffOrRecurring: 'recurring',
      },
    ],
    liquidityCapitalResources: {
      ...createEmptyLiquidityCapitalResources(),
      principalLiquiditySources:
        'Operating cash flows, undrawn working capital limits with HDFC Bank and expected IPO proceeds.',
      cashAvailable: '420',
      workingCapitalFacilities: '250',
      operatingCashFlowAdequacy: 'yes',
    },
    trendsUncertainties: [
      {
        ...createEmptyTrendUncertainty('nivara-trend-raw-material'),
        title: 'Raw material price volatility',
        category: 'input-costs',
        description: 'Steel and alloy input costs remain volatile amid global supply constraints.',
        periodObserved: 'FY 2024',
        financialAreasAffected: 'costOfMaterialsConsumed',
        expectedNatureOfImpact: 'Moderate margin pressure if prices rise without pass-through.',
      },
    ],
    confirmations: allConfirmationsTrue(),
    notes: 'MD&A trends and issuer confirmations for Nivara demo DRHP preparation.',
  };

  return payload;
}
