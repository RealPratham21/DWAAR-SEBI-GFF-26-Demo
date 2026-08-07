/**
 * Canonical Financials & KPIs payload schema (Increment F1).
 *
 * Contract notes for the backend increment that follows (F2):
 * - Persist `FinancialsKpisPayload` (`schemaVersion: 1`) exactly — same keys, enums, emptiness.
 * - Every monetary amount, share count, ratio and percentage is a Decimal-safe STRING.
 *   Empty is `''` (never `null`, never `0`). Values are plain decimal strings such as
 *   `'1000000'` or `'12.50'` — never JavaScript numbers, so no float drift on round-trip.
 * - Ternary answers use `'' | 'yes' | 'no' | 'not_sure'`. Empty must never be coerced to `'no'`.
 * - Computed values (P&L totals, reconciliations, ratios, assessment outcomes) are DERIVED and
 *   are never persisted here.
 * - Repeatable records carry stable `id`s generated with `crypto.randomUUID()`.
 * - UI labels live in `lib/financials-kpis/options.ts` and must never appear in the payload.
 */

import { z } from 'zod';

export const FINANCIALS_KPIS_SCHEMA_VERSION = 1 as const;

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

export const SOURCE_STATUS_VALUES = [
  'audited_financial_statements',
  'restated_financial_information',
  'auditor_certificate',
  'management_accounts',
  'management_estimate',
  'pending_confirmation',
  'not_available',
] as const;
export type SourceStatus = (typeof SOURCE_STATUS_VALUES)[number];

export const PROFESSIONAL_CONFIRMATION_STATUS_VALUES = [
  'confirmed',
  'pending',
  'not_required',
  'not_sure',
] as const;
export type ProfessionalConfirmationStatus =
  (typeof PROFESSIONAL_CONFIRMATION_STATUS_VALUES)[number];

export const ACCOUNTING_FRAMEWORK_VALUES = [
  'indian-gaap',
  'ind-as',
  'sector-specific',
  'transition-in-progress',
  'professional-confirmation-required',
] as const;
export type AccountingFramework = (typeof ACCOUNTING_FRAMEWORK_VALUES)[number];

export const FINANCIAL_PRESENTATION_VALUES = ['standalone', 'consolidated', 'both'] as const;
export type FinancialPresentation = (typeof FINANCIAL_PRESENTATION_VALUES)[number];

export const DISPLAY_UNIT_VALUES = ['rupees', 'thousand', 'lakh', 'crore', 'million'] as const;
export type DisplayUnit = (typeof DISPLAY_UNIT_VALUES)[number];

export const REPORTING_ENTITY_TYPE_VALUES = [
  'issuer',
  'subsidiary',
  'associate',
  'joint-venture',
  'foreign-entity',
  'predecessor',
  'promoting-company',
  'other',
] as const;
export type ReportingEntityType = (typeof REPORTING_ENTITY_TYPE_VALUES)[number];

export const CONSOLIDATION_METHOD_VALUES = [
  'full-consolidation',
  'equity-method',
  'proportionate',
  'not-consolidated',
  'other',
] as const;
export type ConsolidationMethod = (typeof CONSOLIDATION_METHOD_VALUES)[number];

export const PERIOD_BASIS_VALUES = ['standalone', 'consolidated'] as const;
export type PeriodBasis = (typeof PERIOD_BASIS_VALUES)[number];

export const FULL_YEAR_OR_INTERIM_VALUES = ['full-year', 'interim'] as const;
export type FullYearOrInterim = (typeof FULL_YEAR_OR_INTERIM_VALUES)[number];

export const AUDITED_STATUS_VALUES = [
  'audited',
  'unaudited',
  'reviewed',
  'pending',
  'not-applicable',
] as const;
export type AuditedStatus = (typeof AUDITED_STATUS_VALUES)[number];

export const RESTATED_STATUS_VALUES = [
  'restated',
  'not-restated',
  'restatement-in-progress',
  'pending',
] as const;
export type RestatedStatus = (typeof RESTATED_STATUS_VALUES)[number];

export const FINALISATION_STATUS_VALUES = [
  'finalised',
  'draft',
  'pending-auditor',
  'pending-board',
] as const;
export type FinalisationStatus = (typeof FINALISATION_STATUS_VALUES)[number];

export const RESTATEMENT_EXERCISE_STATUS_VALUES = [
  'not-started',
  'data-collection',
  'under-preparation',
  'under-auditor-review',
  'completed',
  'pending-professional-appointment',
] as const;
export type RestatementExerciseStatus = (typeof RESTATEMENT_EXERCISE_STATUS_VALUES)[number];

export const PL_LINE_KEY_VALUES = [
  'revenueFromOperations',
  'saleOfProducts',
  'saleOfServices',
  'otherOperatingRevenue',
  'otherIncome',
  'financeIncome',
  'governmentGrants',
  'foreignExchangeIncome',
  'gainOnDisposal',
  'totalIncome',
  'costOfMaterialsConsumed',
  'purchasesOfStockInTrade',
  'changesInInventory',
  'manufacturingDirectOperatingExpenses',
  'employeeBenefitExpenses',
  'contractLabour',
  'sellingAndDistributionExpenses',
  'technologyHostingExpenses',
  'rentAndLeaseExpense',
  'otherOperatingExpenses',
  'financeCosts',
  'depreciation',
  'amortisation',
  'impairment',
  'otherExpenses',
  'totalExpenses',
  'profitBeforeExceptionalItemsAndTax',
  'exceptionalItems',
  'profitBeforeTax',
  'currentTax',
  'deferredTax',
  'earlierYearTaxAdjustment',
  'profitAfterTax',
  'otherComprehensiveIncome',
  'totalComprehensiveIncome',
  'profitAttributableToOwners',
  'profitAttributableToNci',
] as const;
export type PlLineKey = (typeof PL_LINE_KEY_VALUES)[number];

export const BS_LINE_KEY_VALUES = [
  'propertyPlantAndEquipment',
  'capitalWorkInProgress',
  'rightOfUseAssets',
  'investmentProperty',
  'goodwill',
  'otherIntangibleAssets',
  'intangiblesUnderDevelopment',
  'investmentsNonCurrent',
  'loansNonCurrent',
  'otherFinancialAssetsNonCurrent',
  'deferredTaxAssets',
  'nonCurrentTaxAssets',
  'otherNonCurrentAssets',
  'totalNonCurrentAssets',
  'inventories',
  'tradeReceivables',
  'cashAndCashEquivalents',
  'otherBankBalances',
  'currentInvestments',
  'loansCurrent',
  'otherFinancialAssetsCurrent',
  'currentTaxAssets',
  'otherCurrentAssets',
  'assetsHeldForSale',
  'totalCurrentAssets',
  'totalAssets',
  'equityShareCapital',
  'preferenceShareCapital',
  'securitiesPremium',
  'retainedEarnings',
  'capitalReserve',
  'generalReserve',
  'otherReserves',
  'ociReserve',
  'totalOtherEquity',
  'nonControllingInterests',
  'totalEquity',
  'nonCurrentBorrowings',
  'leaseLiabilitiesNonCurrent',
  'otherFinancialLiabilitiesNonCurrent',
  'longTermProvisions',
  'deferredTaxLiabilities',
  'otherNonCurrentLiabilities',
  'totalNonCurrentLiabilities',
  'currentBorrowings',
  'currentMaturitiesLongTermDebt',
  'leaseLiabilitiesCurrent',
  'tradePayablesMsme',
  'otherTradePayables',
  'otherFinancialLiabilitiesCurrent',
  'employeeLiabilities',
  'currentTaxLiabilities',
  'shortTermProvisions',
  'otherCurrentLiabilities',
  'liabilitiesHeldForSale',
  'totalCurrentLiabilities',
  'totalLiabilities',
  'totalEquityAndLiabilities',
] as const;
export type BsLineKey = (typeof BS_LINE_KEY_VALUES)[number];

export const CF_LINE_KEY_VALUES = [
  'cashFlowFromOperatingActivities',
  'cashFlowFromInvestingActivities',
  'cashFlowFromFinancingActivities',
  'netIncreaseDecreaseInCash',
  'openingCashAndCashEquivalents',
  'exchangeRateImpact',
  'closingCashAndCashEquivalents',
  'profitBeforeTax',
  'nonCashAdjustments',
  'workingCapitalMovements',
  'taxPaid',
  'capex',
  'investmentPurchasesSales',
  'borrowingProceeds',
  'borrowingRepayments',
  'interestPaid',
  'dividendsPaid',
  'shareIssueProceeds',
] as const;
export type CfLineKey = (typeof CF_LINE_KEY_VALUES)[number];

export const EQUITY_LINE_KEY_VALUES = [
  'openingShareCapital',
  'sharesIssuedCancelledAdjusted',
  'closingShareCapital',
  'openingOtherEquity',
  'profitForPeriod',
  'oci',
  'dividends',
  'shareBasedPayments',
  'otherCapitalTransactions',
  'restatementAdjustments',
  'closingOtherEquity',
] as const;
export type EquityLineKey = (typeof EQUITY_LINE_KEY_VALUES)[number];

export const FINANCIAL_STATEMENT_VALUES = [
  'profit-and-loss',
  'assets-and-liabilities',
  'cash-flow',
  'changes-in-equity',
  'other',
] as const;
export type FinancialStatement = (typeof FINANCIAL_STATEMENT_VALUES)[number];

export const RESTATEMENT_ADJUSTMENT_CATEGORY_VALUES = [
  'prior-period-error',
  'accounting-policy-change',
  'accounting-estimate-change',
  'auditor-qualification',
  'reclassification',
  'regrouping',
  'consolidation-adjustment',
  'merger-acquisition',
  'related-party-adjustment',
  'tax-adjustment',
  'share-based-payment-adjustment',
  'capital-adjustment',
  'exceptional-non-recurring',
  'other',
] as const;
export type RestatementAdjustmentCategory =
  (typeof RESTATEMENT_ADJUSTMENT_CATEGORY_VALUES)[number];

export const ACCOUNTING_POLICY_CATEGORY_VALUES = [
  'revenue-recognition',
  'inventory',
  'ppe-and-depreciation',
  'intangibles',
  'impairment',
  'borrowing-costs',
  'leases',
  'employee-benefits',
  'foreign-currency',
  'financial-instruments',
  'taxation',
  'provisions-and-contingencies',
  'government-grants',
  'business-combinations',
  'consolidation',
  'related-parties',
  'share-based-payments',
  'other',
] as const;
export type AccountingPolicyCategory = (typeof ACCOUNTING_POLICY_CATEGORY_VALUES)[number];

export const AUDIT_OPINION_VALUES = [
  'unmodified',
  'qualified',
  'adverse',
  'disclaimer',
  'pending',
] as const;
export type AuditOpinion = (typeof AUDIT_OPINION_VALUES)[number];

export const KPI_CATEGORY_VALUES = ['gaap-financial', 'non-gaap-financial', 'operational'] as const;
export type KpiCategory = (typeof KPI_CATEGORY_VALUES)[number];

export const KPI_PROPOSED_TREATMENT_VALUES = [
  'include-as-kpi',
  'disclose-elsewhere',
  'exclude',
] as const;
export type KpiProposedTreatment = (typeof KPI_PROPOSED_TREATMENT_VALUES)[number];

export const DRHP_LOCATION_VALUES = ['basis-for-issue-price', 'our-business', 'both'] as const;
export type DrhpLocation = (typeof DRHP_LOCATION_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* 1. Reporting scope, periods & auditor readiness                             */
/* -------------------------------------------------------------------------- */

export const reportingBasisSchema = z.object({
  financialYearEnd: text,
  accountingFramework: z.enum(['', ...ACCOUNTING_FRAMEWORK_VALUES]),
  financialPresentation: z.enum(['', ...FINANCIAL_PRESENTATION_VALUES]),
  currency: text,
  displayUnit: z.enum(['', ...DISPLAY_UNIT_VALUES]),
  roundingConvention: text,
  ociApplies: yesNoNotSureOrEmptySchema,
  cashFlowAvailable: yesNoNotSureOrEmptySchema,
  changesInEquityAvailable: yesNoNotSureOrEmptySchema,
  comparativePeriodConsistency: yesNoNotSureOrEmptySchema,
  subsidiariesDeclared: yesNoNotSureOrEmptySchema,
  associatesDeclared: yesNoNotSureOrEmptySchema,
  jointVenturesDeclared: yesNoNotSureOrEmptySchema,
  foreignEntitiesDeclared: yesNoNotSureOrEmptySchema,
  recentlyAcquiredDisposedDeclared: yesNoNotSureOrEmptySchema,
  predecessorEntityDeclared: yesNoNotSureOrEmptySchema,
  promotingCompanyTrackRecordDeclared: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type ReportingBasis = z.infer<typeof reportingBasisSchema>;

export const reportingEntitySchema = z.object({
  id: idSchema,
  name: text,
  entityType: z.enum(['', ...REPORTING_ENTITY_TYPE_VALUES]),
  country: text,
  ownershipPct: decimalStringSchema,
  consolidationMethod: z.enum(['', ...CONSOLIDATION_METHOD_VALUES]),
  includedFromPeriodId: text,
  excludedFromPeriodId: text,
  exclusionReason: text,
  financialStatementsAvailable: yesNoNotSureOrEmptySchema,
  auditedStatus: z.enum(['', ...AUDITED_STATUS_VALUES]),
  linkedGroupEntityId: text,
  notes: text,
});
export type ReportingEntity = z.infer<typeof reportingEntitySchema>;

export const financialPeriodSchema = z.object({
  id: idSchema,
  label: text,
  startDate: text,
  endDate: text,
  months: decimalStringSchema,
  fullYearOrInterim: z.enum(['', ...FULL_YEAR_OR_INTERIM_VALUES]),
  comparablePeriodId: text,
  basis: z.enum(['', ...PERIOD_BASIS_VALUES]),
  auditedStatus: z.enum(['', ...AUDITED_STATUS_VALUES]),
  restatedStatus: z.enum(['', ...RESTATED_STATUS_VALUES]),
  boardApprovalStatus: text,
  auditReportDate: text,
  restatementReportDate: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  finalisationStatus: z.enum(['', ...FINALISATION_STATUS_VALUES]),
  notes: text,
});
export type FinancialPeriod = z.infer<typeof financialPeriodSchema>;

export const auditorReadinessSchema = z.object({
  currentStatutoryAuditor: text,
  firmRegistrationNumber: text,
  signingPartner: text,
  peerReviewStatus: yesNoNotSureOrEmptySchema,
  peerReviewCertificateValidity: text,
  appointmentPeriod: text,
  restatementAuditor: text,
  restatementEngagementStatus: text,
  restatementExerciseStatus: z.enum(['', ...RESTATEMENT_EXERCISE_STATUS_VALUES]),
  expectedCompletionDate: text,
  restatedInformationBoardApproved: yesNoNotSureOrEmptySchema,
  approvalDateReference: text,
  latestFilingReadyPeriodId: text,
  financialInformationSufficientlyCurrent: yesNoNotSureOrEmptySchema,
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type AuditorReadiness = z.infer<typeof auditorReadinessSchema>;

export const auditorChangeRecordSchema = z.object({
  id: idSchema,
  previousAuditor: text,
  appointmentResignationDate: text,
  reason: text,
  disagreementWithManagement: yesNoNotSureOrEmptySchema,
  professionalClearanceStatus: text,
  disclosureReference: text,
  notes: text,
});
export type AuditorChangeRecord = z.infer<typeof auditorChangeRecordSchema>;

export const reportingScopePeriodsAndAuditorReadinessSchema = z.object({
  reportingBasis: reportingBasisSchema,
  reportingEntities: z.array(reportingEntitySchema),
  financialPeriods: z.array(financialPeriodSchema),
  auditorReadiness: auditorReadinessSchema,
  auditorChangeRecords: z.array(auditorChangeRecordSchema),
  notes: text,
});
export type ReportingScopePeriodsAndAuditorReadiness = z.infer<
  typeof reportingScopePeriodsAndAuditorReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* 2. Restated statement of profit & loss                                      */
/* -------------------------------------------------------------------------- */

export const plLineValueSchema = z.object({
  id: idSchema,
  periodId: text,
  lineKey: z.enum(['', ...PL_LINE_KEY_VALUES]),
  amount: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  note: text,
  adjustmentPresent: yesNoNotSureOrEmptySchema,
  managementExplanation: text,
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type PlLineValue = z.infer<typeof plLineValueSchema>;

export const exceptionalItemSchema = z.object({
  id: idSchema,
  periodId: text,
  title: text,
  description: text,
  amount: decimalStringSchema,
  incomeOrExpense: z.enum(['', 'income', 'expense']),
  cashOrNonCash: z.enum(['', 'cash', 'non-cash']),
  recurringOrNonRecurring: z.enum(['', 'recurring', 'non-recurring']),
  includedInEbitda: yesNoNotSureOrEmptySchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type ExceptionalItem = z.infer<typeof exceptionalItemSchema>;

export const perShareByPeriodSchema = z.object({
  id: idSchema,
  periodId: text,
  weightedAvgBasicShares: decimalStringSchema,
  weightedAvgDilutedShares: decimalStringSchema,
  basicEps: decimalStringSchema,
  dilutedEps: decimalStringSchema,
  faceValue: decimalStringSchema,
  retrospectiveCapitalAdjustmentApplied: yesNoNotSureOrEmptySchema,
  bonusSplitConsolidationAdjustmentStatus: text,
  notes: text,
});
export type PerShareByPeriod = z.infer<typeof perShareByPeriodSchema>;

export const restatedStatementOfProfitAndLossSchema = z.object({
  plLineValues: z.array(plLineValueSchema),
  exceptionalItems: z.array(exceptionalItemSchema),
  perShareByPeriod: z.array(perShareByPeriodSchema),
  notes: text,
});
export type RestatedStatementOfProfitAndLoss = z.infer<
  typeof restatedStatementOfProfitAndLossSchema
>;

/* -------------------------------------------------------------------------- */
/* 3. Assets, liabilities, equity & cash flows                                  */
/* -------------------------------------------------------------------------- */

export const balanceSheetLineValueSchema = z.object({
  id: idSchema,
  periodId: text,
  lineKey: z.enum(['', ...BS_LINE_KEY_VALUES]),
  amount: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  note: text,
});
export type BalanceSheetLineValue = z.infer<typeof balanceSheetLineValueSchema>;

export const cashFlowLineValueSchema = z.object({
  id: idSchema,
  periodId: text,
  lineKey: z.enum(['', ...CF_LINE_KEY_VALUES]),
  amount: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  note: text,
});
export type CashFlowLineValue = z.infer<typeof cashFlowLineValueSchema>;

export const changesInEquityLineValueSchema = z.object({
  id: idSchema,
  periodId: text,
  lineKey: z.enum(['', ...EQUITY_LINE_KEY_VALUES]),
  amount: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  note: text,
});
export type ChangesInEquityLineValue = z.infer<typeof changesInEquityLineValueSchema>;

export const assetsLiabilitiesEquityAndCashFlowsSchema = z.object({
  balanceSheetLineValues: z.array(balanceSheetLineValueSchema),
  cashFlowLineValues: z.array(cashFlowLineValueSchema),
  changesInEquityLineValues: z.array(changesInEquityLineValueSchema),
  notes: text,
});
export type AssetsLiabilitiesEquityAndCashFlows = z.infer<
  typeof assetsLiabilitiesEquityAndCashFlowsSchema
>;

/* -------------------------------------------------------------------------- */
/* 4. Restatement adjustments, policies & auditor matters                      */
/* -------------------------------------------------------------------------- */

export const restatementAdjustmentSchema = z.object({
  id: idSchema,
  periodId: text,
  financialStatement: z.enum(['', ...FINANCIAL_STATEMENT_VALUES]),
  originalLineItem: text,
  originalAuditedAmount: decimalStringSchema,
  adjustmentAmount: decimalStringSchema,
  restatedAmount: decimalStringSchema,
  debitCreditDirection: z.enum(['', 'debit', 'credit']),
  category: z.enum(['', ...RESTATEMENT_ADJUSTMENT_CATEGORY_VALUES]),
  detailedRationale: text,
  accountingStandardReference: text,
  taxEffect: decimalStringSchema,
  cashOrNonCash: z.enum(['', 'cash', 'non-cash']),
  recurringOrNonRecurring: z.enum(['', 'recurring', 'non-recurring']),
  epsImpact: decimalStringSchema,
  netWorthImpact: decimalStringSchema,
  auditorReviewStatus: text,
  professionalConclusionStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  reference: text,
  notes: text,
});
export type RestatementAdjustment = z.infer<typeof restatementAdjustmentSchema>;

export const accountingPolicySchema = z.object({
  id: idSchema,
  policyCategory: z.enum(['', ...ACCOUNTING_POLICY_CATEGORY_VALUES]),
  existingTreatment: text,
  changeDuringPeriod: yesNoNotSureOrEmptySchema,
  effectiveDate: text,
  reason: text,
  financialImpact: text,
  retrospectiveProspectiveTreatment: z.enum(['', 'retrospective', 'prospective', 'not-applicable']),
  auditorConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type AccountingPolicy = z.infer<typeof accountingPolicySchema>;

export const auditReportMatterSchema = z.object({
  id: idSchema,
  periodId: text,
  auditOpinion: z.enum(['', ...AUDIT_OPINION_VALUES]),
  qualificationReservation: text,
  emphasisOfMatter: text,
  keyAuditMatter: text,
  goingConcernUncertainty: yesNoNotSureOrEmptySchema,
  internalFinancialControlQualification: yesNoNotSureOrEmptySchema,
  caroRemark: yesNoNotSureOrEmptySchema,
  fraudReported: yesNoNotSureOrEmptySchema,
  statutoryDuesDefaultDelay: yesNoNotSureOrEmptySchema,
  accountingSystemOrAuditTrailConcern: yesNoNotSureOrEmptySchema,
  managementResponse: text,
  adjustedInRestatedInformation: yesNoNotSureOrEmptySchema,
  ifNotAdjustedReason: text,
  resolutionStatus: text,
  reference: text,
  notes: text,
});
export type AuditReportMatter = z.infer<typeof auditReportMatterSchema>;

export const restatementAdjustmentsPoliciesAndAuditorMattersSchema = z.object({
  restatementAdjustments: z.array(restatementAdjustmentSchema),
  accountingPolicies: z.array(accountingPolicySchema),
  auditReportMatters: z.array(auditReportMatterSchema),
  notes: text,
});
export type RestatementAdjustmentsPoliciesAndAuditorMatters = z.infer<
  typeof restatementAdjustmentsPoliciesAndAuditorMattersSchema
>;

/* -------------------------------------------------------------------------- */
/* 5. Other financial information                                              */
/* -------------------------------------------------------------------------- */

export const segmentRecordSchema = z.object({
  id: idSchema,
  periodId: text,
  linkedBusinessSegmentId: text,
  segmentName: text,
  productsServices: text,
  externalRevenue: decimalStringSchema,
  interSegmentRevenue: decimalStringSchema,
  totalSegmentRevenue: decimalStringSchema,
  segmentResult: decimalStringSchema,
  segmentAssets: decimalStringSchema,
  segmentLiabilities: decimalStringSchema,
  capitalExpenditure: decimalStringSchema,
  depreciation: decimalStringSchema,
  reconciliationToCompanyTotals: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type SegmentRecord = z.infer<typeof segmentRecordSchema>;

export const relatedPartyTransactionSchema = z.object({
  id: idSchema,
  relatedPartyEntity: text,
  relationship: text,
  transactionType: text,
  periodId: text,
  transactionAmount: decimalStringSchema,
  outstandingBalance: decimalStringSchema,
  relevantPercentage: decimalStringSchema,
  armsLengthStatus: yesNoNotSureOrEmptySchema,
  approvalStatus: text,
  restatedFinancialNoteReference: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type RelatedPartyTransaction = z.infer<typeof relatedPartyTransactionSchema>;

export const contingentLiabilitySchema = z.object({
  id: idSchema,
  category: text,
  description: text,
  authorityCounterparty: text,
  periodId: text,
  amountClaimed: decimalStringSchema,
  amountProvided: decimalStringSchema,
  contingentAmount: decimalStringSchema,
  probabilityStatus: text,
  forum: text,
  currentStage: text,
  expectedFinancialEffect: text,
  linkedLitigationReference: text,
  noteReference: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type ContingentLiability = z.infer<typeof contingentLiabilitySchema>;

export const workingCapitalSummarySchema = z.object({
  id: idSchema,
  periodId: text,
  currentAssets: decimalStringSchema,
  currentLiabilities: decimalStringSchema,
  netWorkingCapital: decimalStringSchema,
  inventory: decimalStringSchema,
  receivables: decimalStringSchema,
  payables: decimalStringSchema,
  inventoryDays: decimalStringSchema,
  receivableDays: decimalStringSchema,
  payableDays: decimalStringSchema,
  cashConversionCycle: decimalStringSchema,
  workingCapitalBorrowings: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type WorkingCapitalSummary = z.infer<typeof workingCapitalSummarySchema>;

export const indebtednessSummarySchema = z.object({
  longTermDebt: decimalStringSchema,
  shortTermDebt: decimalStringSchema,
  currentMaturities: decimalStringSchema,
  leaseLiabilities: decimalStringSchema,
  totalDebt: decimalStringSchema,
  securedDebt: decimalStringSchema,
  unsecuredDebt: decimalStringSchema,
  relatedPartyDebt: decimalStringSchema,
  cashAndCashEquivalents: decimalStringSchema,
  netDebt: decimalStringSchema,
  undrawnFacilities: decimalStringSchema,
  defaultsDelays: text,
  debtProposedForIpoRepayment: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type IndebtednessSummary = z.infer<typeof indebtednessSummarySchema>;

export const taxByPeriodSchema = z.object({
  id: idSchema,
  periodId: text,
  currentTax: decimalStringSchema,
  deferredTax: decimalStringSchema,
  effectiveTaxRate: decimalStringSchema,
  taxLossesCarriedForward: decimalStringSchema,
  unabsorbedDepreciation: decimalStringSchema,
  deferredTaxAssetsRecognised: decimalStringSchema,
  deferredTaxAssetsNotRecognised: decimalStringSchema,
  materialIncentivesExemptions: text,
  taxDisputes: text,
  auditorConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type TaxByPeriod = z.infer<typeof taxByPeriodSchema>;

export const dividendRecordSchema = z.object({
  id: idSchema,
  periodId: text,
  dividendDeclared: decimalStringSchema,
  dividendPaid: decimalStringSchema,
  dividendPerShare: decimalStringSchema,
  totalDividendAmount: decimalStringSchema,
  payoutRatio: decimalStringSchema,
  sourceOfDividend: text,
  boardApproval: yesNoNotSureOrEmptySchema,
  shareholderApproval: yesNoNotSureOrEmptySchema,
  unpaidDividend: decimalStringSchema,
  lendingRestriction: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type DividendRecord = z.infer<typeof dividendRecordSchema>;

export const dividendPolicySchema = z.object({
  policyExists: yesNoNotSureOrEmptySchema,
  approvalDate: text,
  factorsConsidered: text,
  futureDividendDiscretionary: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type DividendPolicy = z.infer<typeof dividendPolicySchema>;

export const otherFinancialInformationSchema = z.object({
  segmentRecords: z.array(segmentRecordSchema),
  relatedPartyTransactions: z.array(relatedPartyTransactionSchema),
  contingentLiabilities: z.array(contingentLiabilitySchema),
  workingCapitalSummaries: z.array(workingCapitalSummarySchema),
  indebtednessSummary: indebtednessSummarySchema,
  taxByPeriod: z.array(taxByPeriodSchema),
  dividendRecords: z.array(dividendRecordSchema),
  dividendPolicy: dividendPolicySchema,
  notes: text,
});
export type OtherFinancialInformation = z.infer<typeof otherFinancialInformationSchema>;

/* -------------------------------------------------------------------------- */
/* 6. Ratios, capitalisation & issue-price metrics                             */
/* -------------------------------------------------------------------------- */

export const formulaRecordSchema = z.object({
  id: idSchema,
  metricKey: text,
  displayName: text,
  definition: text,
  formula: text,
  components: text,
  excludedItems: text,
  reconciliationToFinancialStatement: text,
  comparableAcrossPeriods: yesNoNotSureOrEmptySchema,
  methodologyChanged: yesNoNotSureOrEmptySchema,
  changeExplanation: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type FormulaRecord = z.infer<typeof formulaRecordSchema>;

export const smeEligibilityByPeriodSchema = z.object({
  id: idSchema,
  periodId: text,
  operatingProfit: decimalStringSchema,
  operatingProfitFormula: text,
  netWorth: decimalStringSchema,
  fcfe: decimalStringSchema,
  fcfeFormula: text,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  auditorCertificateStatus: text,
  notes: text,
});
export type SmeEligibilityByPeriod = z.infer<typeof smeEligibilityByPeriodSchema>;

export const ratiosCapitalisationAndIssuePriceMetricsSchema = z.object({
  formulaRecords: z.array(formulaRecordSchema),
  smeEligibilityByPeriod: z.array(smeEligibilityByPeriodSchema),
  notes: text,
});
export type RatiosCapitalisationAndIssuePriceMetrics = z.infer<
  typeof ratiosCapitalisationAndIssuePriceMetricsSchema
>;

/* -------------------------------------------------------------------------- */
/* 7. KPI selection, governance & peer comparison                              */
/* -------------------------------------------------------------------------- */

export const selectedDataCandidateSchema = z.object({
  id: idSchema,
  metricName: text,
  category: z.enum(['', ...KPI_CATEGORY_VALUES]),
  definition: text,
  unit: text,
  valuesByPeriod: z.array(
    z.object({
      periodId: text,
      value: decimalStringSchema,
    }),
  ),
  sourceType: z.enum(['', ...SOURCE_STATUS_VALUES]),
  sharedWithInvestorsPriorThreeYears: yesNoNotSureOrEmptySchema,
  sharingDateContext: text,
  relatedCapitalTransaction: text,
  presentedToBoardAuditCommittee: yesNoNotSureOrEmptySchema,
  historicallyUsedByManagement: yesNoNotSureOrEmptySchema,
  usedInIssuePriceDeliberations: yesNoNotSureOrEmptySchema,
  usedByPeers: yesNoNotSureOrEmptySchema,
  verifiable: yesNoNotSureOrEmptySchema,
  certifiable: yesNoNotSureOrEmptySchema,
  containsProjections: yesNoNotSureOrEmptySchema,
  confidentialBusinessSensitive: yesNoNotSureOrEmptySchema,
  relevantToCurrentBusiness: yesNoNotSureOrEmptySchema,
  proposedTreatment: z.enum(['', ...KPI_PROPOSED_TREATMENT_VALUES]),
  exclusionRationale: text,
  managementNotes: text,
});
export type SelectedDataCandidate = z.infer<typeof selectedDataCandidateSchema>;

export const kpiRegisterEntrySchema = z.object({
  id: idSchema,
  linkedSelectedDataId: text,
  name: text,
  category: z.enum(['', ...KPI_CATEGORY_VALUES]),
  drhpLocation: z.enum(['', ...DRHP_LOCATION_VALUES]),
  plainEnglishDefinition: text,
  formula: text,
  numerator: text,
  denominator: text,
  components: text,
  unit: text,
  currency: text,
  frequency: text,
  valuesByPeriod: z.array(
    z.object({
      periodId: text,
      value: decimalStringSchema,
    }),
  ),
  source: z.enum(['', ...SOURCE_STATUS_VALUES]),
  dataOwner: text,
  whyManagementTracksIt: text,
  performanceRelevance: text,
  valuationRelevance: text,
  limitations: text,
  methodologyChanges: text,
  comparableAcrossPeriods: yesNoNotSureOrEmptySchema,
  restatementRecalculationRequired: yesNoNotSureOrEmptySchema,
  professionalCertificationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type KpiRegisterEntry = z.infer<typeof kpiRegisterEntrySchema>;

export const peerComparisonSchema = z.object({
  id: idSchema,
  companyName: text,
  exchange: text,
  country: text,
  industry: text,
  businessModel: text,
  selectionRationale: text,
  comparableSizeExplanation: text,
  differencesFromIssuer: text,
  indianOrGlobal: z.enum(['', 'indian', 'global']),
  reportingFramework: text,
  financialYear: text,
  sourcePublicationDate: text,
  currency: text,
  conversionRateSource: text,
  revenueTotalIncome: decimalStringSchema,
  eps: decimalStringSchema,
  pe: decimalStringSchema,
  ronw: decimalStringSchema,
  nav: decimalStringSchema,
  kpiValues: text,
  notes: text,
});
export type PeerComparison = z.infer<typeof peerComparisonSchema>;

export const managementCertificationSchema = z.object({
  status: text,
  signatoryRole: text,
  signatoryName: text,
  certificationDate: text,
  accuracyConfirmed: yesNoNotSureOrEmptySchema,
  historicalUseConfirmed: yesNoNotSureOrEmptySchema,
  projectionsExcluded: yesNoNotSureOrEmptySchema,
  managementNotePrepared: yesNoNotSureOrEmptySchema,
  reference: text,
  notes: text,
});
export type ManagementCertification = z.infer<typeof managementCertificationSchema>;

export const auditCommitteeGovernanceSchema = z.object({
  auditCommitteeConstituted: yesNoNotSureOrEmptySchema,
  selectedDataPresented: yesNoNotSureOrEmptySchema,
  kpiDisclosuresPresented: yesNoNotSureOrEmptySchema,
  exclusionRationalesPresented: yesNoNotSureOrEmptySchema,
  peerDataPresented: yesNoNotSureOrEmptySchema,
  definitionsFormulasReviewed: yesNoNotSureOrEmptySchema,
  approvalStatus: text,
  meetingDate: text,
  resolutionReference: text,
  minutesAvailable: yesNoNotSureOrEmptySchema,
  changesRequested: text,
  changesImplemented: yesNoNotSureOrEmptySchema,
  finalApprovalDate: text,
  notes: text,
});
export type AuditCommitteeGovernance = z.infer<typeof auditCommitteeGovernanceSchema>;

export const professionalCertificationSchema = z.object({
  certifyingProfessional: text,
  professionalType: text,
  firm: text,
  peerReviewStatus: yesNoNotSureOrEmptySchema,
  peerReviewValidity: text,
  engagementDate: text,
  certificationStatus: text,
  certificateDate: text,
  udinReference: text,
  qualificationsLimitations: text,
  materialDocumentInspectionStatus: text,
  notes: text,
});
export type ProfessionalCertification = z.infer<typeof professionalCertificationSchema>;

export const ongoingDisclosureReadinessSchema = z.object({
  reportingFrequency: text,
  responsibleFunction: text,
  auditCommitteeProcess: text,
  boardProcess: text,
  professionalCertificationProcess: text,
  kpiNoLongerRelevantHandling: text,
  exclusionRationaleProcess: text,
  reportingOwner: text,
  notes: text,
});
export type OngoingDisclosureReadiness = z.infer<typeof ongoingDisclosureReadinessSchema>;

export const kpiSelectionGovernanceAndPeerComparisonSchema = z.object({
  selectedDataCandidates: z.array(selectedDataCandidateSchema),
  kpiRegister: z.array(kpiRegisterEntrySchema),
  peerComparisons: z.array(peerComparisonSchema),
  suitablePeersFoundCount: decimalStringSchema,
  searchPerformed: yesNoNotSureOrEmptySchema,
  fewerThanThreePeersReason: text,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  managementCertification: managementCertificationSchema,
  auditCommitteeGovernance: auditCommitteeGovernanceSchema,
  professionalCertification: professionalCertificationSchema,
  ongoingDisclosureReadiness: ongoingDisclosureReadinessSchema,
  notes: text,
});
export type KpiSelectionGovernanceAndPeerComparison = z.infer<
  typeof kpiSelectionGovernanceAndPeerComparisonSchema
>;

/* -------------------------------------------------------------------------- */
/* 8. MD&A, trends, material developments & confirmations                      */
/* -------------------------------------------------------------------------- */

export const performanceFactorSchema = z.object({
  id: idSchema,
  title: text,
  category: text,
  affectedFinancialLineItems: text,
  periodsAffected: text,
  quantifiedImpact: decimalStringSchema,
  explanation: text,
  temporaryOrContinuing: z.enum(['', 'temporary', 'continuing']),
  managementResponse: text,
  linkedRiskFactor: text,
  supportingSource: text,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type PerformanceFactor = z.infer<typeof performanceFactorSchema>;

export const varianceAnalysisSchema = z.object({
  id: idSchema,
  lineItem: text,
  previousPeriodId: text,
  currentPeriodId: text,
  previousValue: decimalStringSchema,
  currentValue: decimalStringSchema,
  explanation: text,
  primaryDriver: text,
  oneOffOrRecurring: z.enum(['', 'one-off', 'recurring']),
  supportingSource: text,
  managementConfirmation: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type VarianceAnalysis = z.infer<typeof varianceAnalysisSchema>;

export const liquidityCapitalResourcesSchema = z.object({
  principalLiquiditySources: text,
  cashAvailable: decimalStringSchema,
  workingCapitalFacilities: decimalStringSchema,
  undrawnLimits: decimalStringSchema,
  operatingCashFlowAdequacy: yesNoNotSureOrEmptySchema,
  debtRepaymentsDue: decimalStringSchema,
  capitalCommitments: decimalStringSchema,
  expectedCapex: decimalStringSchema,
  restrictedCash: decimalStringSchema,
  dividendRestrictions: text,
  covenantConcerns: text,
  goingConcernConcerns: yesNoNotSureOrEmptySchema,
  managementResponse: text,
  notes: text,
});
export type LiquidityCapitalResources = z.infer<typeof liquidityCapitalResourcesSchema>;

export const trendUncertaintySchema = z.object({
  id: idSchema,
  title: text,
  category: text,
  description: text,
  periodObserved: text,
  financialAreasAffected: text,
  quantifiedHistoricalImpact: decimalStringSchema,
  expectedNatureOfImpact: text,
  supportingSource: text,
  relatedRiskFactor: text,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type TrendUncertainty = z.infer<typeof trendUncertaintySchema>;

export const subsequentEventSchema = z.object({
  id: idSchema,
  eventDate: text,
  eventType: text,
  description: text,
  financialImpact: decimalStringSchema,
  amountKnown: yesNoNotSureOrEmptySchema,
  adjustingNonAdjusting: z.enum(['', 'adjusting', 'non-adjusting']),
  includedInFinancialInformation: yesNoNotSureOrEmptySchema,
  updatedInterimInformationRequired: yesNoNotSureOrEmptySchema,
  auditorNotified: yesNoNotSureOrEmptySchema,
  boardNotified: yesNoNotSureOrEmptySchema,
  drhpChaptersAffected: text,
  professionalConclusion: text,
  notes: text,
});
export type SubsequentEvent = z.infer<typeof subsequentEventSchema>;

export const financialsKpisConfirmationsSchema = z.object({
  reportingScopeAndEntitiesComplete: z.boolean(),
  periodsAreCorrect: z.boolean(),
  valuesMatchIdentifiedSources: z.boolean(),
  shareCapitalReconcilesWithCapitalOwnership: z.boolean(),
  revenueSegmentsReconcileWithBusinessOperations: z.boolean(),
  workingCapitalReconcilesWithObjectsOfIssue: z.boolean(),
  borrowingTotalsReconcileWithAvailableRecords: z.boolean(),
  restatementAdjustmentsComplete: z.boolean(),
  auditorRemarksDisclosed: z.boolean(),
  exceptionalItemsDisclosed: z.boolean(),
  relatedPartyTransactionsComplete: z.boolean(),
  contingenciesAndCommitmentsComplete: z.boolean(),
  subsequentDevelopmentsDisclosed: z.boolean(),
  investorSharedHistoricalMetricsConsidered: z.boolean(),
  boardUsedMetricsConsidered: z.boolean(),
  kpiFormulasComplete: z.boolean(),
  historicalKpiDisclosuresExcludeProjections: z.boolean(),
  peerInformationWillUseTraceableSources: z.boolean(),
  auditCommitteeApprovalRemainsRequired: z.boolean(),
  professionalCertificationRemainsRequired: z.boolean(),
  noRegulatoryOrAuditorConclusionRepresented: z.boolean(),
});
export type FinancialsKpisConfirmations = z.infer<typeof financialsKpisConfirmationsSchema>;

export const mdaTrendsMaterialDevelopmentsAndConfirmationsSchema = z.object({
  performanceFactors: z.array(performanceFactorSchema),
  varianceAnalyses: z.array(varianceAnalysisSchema),
  liquidityCapitalResources: liquidityCapitalResourcesSchema,
  trendsUncertainties: z.array(trendUncertaintySchema),
  subsequentEvents: z.array(subsequentEventSchema),
  confirmations: financialsKpisConfirmationsSchema,
  notes: text,
});
export type MdaTrendsMaterialDevelopmentsAndConfirmations = z.infer<
  typeof mdaTrendsMaterialDevelopmentsAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export const financialsKpisPayloadSchema = z.object({
  schemaVersion: z.literal(FINANCIALS_KPIS_SCHEMA_VERSION),
  reportingScopePeriodsAndAuditorReadiness: reportingScopePeriodsAndAuditorReadinessSchema,
  restatedStatementOfProfitAndLoss: restatedStatementOfProfitAndLossSchema,
  assetsLiabilitiesEquityAndCashFlows: assetsLiabilitiesEquityAndCashFlowsSchema,
  restatementAdjustmentsPoliciesAndAuditorMatters:
    restatementAdjustmentsPoliciesAndAuditorMattersSchema,
  otherFinancialInformation: otherFinancialInformationSchema,
  ratiosCapitalisationAndIssuePriceMetrics: ratiosCapitalisationAndIssuePriceMetricsSchema,
  kpiSelectionGovernanceAndPeerComparison: kpiSelectionGovernanceAndPeerComparisonSchema,
  mdaTrendsMaterialDevelopmentsAndConfirmations:
    mdaTrendsMaterialDevelopmentsAndConfirmationsSchema,
});

export type FinancialsKpisPayload = z.infer<typeof financialsKpisPayloadSchema>;

export type FinancialsKpisSectionId =
  | 'reporting-scope-periods-and-auditor-readiness'
  | 'restated-statement-of-profit-and-loss'
  | 'assets-liabilities-equity-and-cash-flows'
  | 'restatement-adjustments-policies-and-auditor-matters'
  | 'other-financial-information'
  | 'ratios-capitalisation-and-issue-price-metrics'
  | 'kpi-selection-governance-and-peer-comparison'
  | 'mda-trends-material-developments-and-confirmations';

export const FINANCIALS_KPIS_SECTION_IDS: FinancialsKpisSectionId[] = [
  'reporting-scope-periods-and-auditor-readiness',
  'restated-statement-of-profit-and-loss',
  'assets-liabilities-equity-and-cash-flows',
  'restatement-adjustments-policies-and-auditor-matters',
  'other-financial-information',
  'ratios-capitalisation-and-issue-price-metrics',
  'kpi-selection-governance-and-peer-comparison',
  'mda-trends-material-developments-and-confirmations',
];

export const sectionIdSchema = z.enum([
  'reporting-scope-periods-and-auditor-readiness',
  'restated-statement-of-profit-and-loss',
  'assets-liabilities-equity-and-cash-flows',
  'restatement-adjustments-policies-and-auditor-matters',
  'other-financial-information',
  'ratios-capitalisation-and-issue-price-metrics',
  'kpi-selection-governance-and-peer-comparison',
  'mda-trends-material-developments-and-confirmations',
]);
