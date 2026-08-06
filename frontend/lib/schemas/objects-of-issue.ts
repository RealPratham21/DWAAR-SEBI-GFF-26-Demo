/**
 * Canonical Objects of the Issue payload schema (Increment O1).
 *
 * Contract notes for the backend increment that follows (O2):
 * - Persist `ObjectsOfIssuePayload` (`schemaVersion: 1`) exactly — same keys, enums, emptiness.
 * - Every monetary amount, count, ratio and percentage is a Decimal-safe STRING.
 *   Empty is `''` (never `null`, never `0`). Values are plain decimal strings such as
 *   `'1000000'` or `'12.50'` — never JavaScript numbers, so no float drift on round-trip.
 * - Ternary answers use `'' | 'yes' | 'no' | 'not_sure'`. Empty must never be coerced to `'no'`.
 * - Computed values (allocation totals, GCP percentage, assessment outcomes) are DERIVED and
 *   are never persisted here.
 * - Repeatable records carry stable `id`s generated with `crypto.randomUUID()`.
 * - UI labels live in `lib/objects-of-issue/options.ts` and must never appear in the payload.
 * - Section ids match the increment contract exactly (long form, e.g.
 *   `capital-expenditure-facilities-and-expansion`) — never rename these once persisted.
 */

import { z } from 'zod';

export const OBJECTS_OF_ISSUE_SCHEMA_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];

/** Unanswered ternary — never coerce empty to "no". */
export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

/**
 * Decimal-safe string. `''` means "not provided". Otherwise a plain decimal string.
 * Validation is intentionally permissive so partially typed input can still be saved;
 * `lib/objects-of-issue/decimal.ts` owns normalisation and arithmetic.
 */
export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const DECLARED_OFFER_TYPE_VALUES = [
  'fresh-issue',
  'offer-for-sale',
  'fresh-issue-and-offer-for-sale',
] as const;
export type DeclaredOfferType = (typeof DECLARED_OFFER_TYPE_VALUES)[number];

export const OBJECT_CATEGORY_VALUES = [
  'capital-expenditure',
  'working-capital',
  'repayment-prepayment-of-borrowings',
  'acquisition-or-investment',
  'general-corporate-purposes',
  'other',
] as const;
export type ObjectCategory = (typeof OBJECT_CATEGORY_VALUES)[number];

export const APPRAISAL_STATUS_VALUES = [
  'appraised-by-bank-or-fi',
  'not-appraised',
  'not_sure',
] as const;
export type AppraisalStatus = (typeof APPRAISAL_STATUS_VALUES)[number];

export const CAPEX_ITEM_TYPE_VALUES = [
  'new-plant-and-machinery',
  'facility-expansion',
  'technology-or-it-upgrade',
  'branch-or-outlet-expansion',
  'land-and-building',
  'research-and-development-infrastructure',
  'other',
] as const;
export type CapexItemType = (typeof CAPEX_ITEM_TYPE_VALUES)[number];

export const QUOTATION_SOURCE_VALUES = [
  'single-quotation',
  'multiple-quotations',
  'not-obtained',
] as const;
export type QuotationSource = (typeof QUOTATION_SOURCE_VALUES)[number];

export const APPROVAL_STATUS_VALUES = [
  'not-required',
  'applied',
  'received',
  'pending',
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];

export const WORKING_CAPITAL_METHODOLOGY_VALUES = [
  'turnover-method',
  'lending-norms-method',
  'management-estimate',
  'other',
] as const;
export type WorkingCapitalMethodology = (typeof WORKING_CAPITAL_METHODOLOGY_VALUES)[number];

export const LOAN_TYPE_VALUES = [
  'term-loan',
  'working-capital-facility',
  'unsecured-loan',
  'debenture',
  'inter-corporate-deposit',
  'other',
] as const;
export type LoanType = (typeof LOAN_TYPE_VALUES)[number];

export const TRANSACTION_TYPE_VALUES = [
  'acquisition',
  'subsidiary-investment',
  'joint-venture',
  'strategic-investment',
  'other',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPE_VALUES)[number];

export const DEFINITIVE_AGREEMENT_STATUS_VALUES = [
  'definitive-agreement-executed',
  'term-sheet-or-mou-signed',
  'target-not-yet-identified',
  'not_sure',
] as const;
export type DefinitiveAgreementStatus = (typeof DEFINITIVE_AGREEMENT_STATUS_VALUES)[number];

export const MEANS_OF_FINANCE_SOURCE_VALUES = [
  'net-proceeds-of-the-issue',
  'internal-accruals',
  'term-loan-or-debt',
  'existing-cash-and-bank-balances',
  'promoter-or-promoter-group-contribution',
  'other',
] as const;
export type MeansOfFinanceSource = (typeof MEANS_OF_FINANCE_SOURCE_VALUES)[number];

export const FUNDING_TIE_UP_STATUS_VALUES = [
  'fully-tied-up',
  'partially-tied-up',
  'not-tied-up',
  'not_sure',
] as const;
export type FundingTieUpStatus = (typeof FUNDING_TIE_UP_STATUS_VALUES)[number];

export const EXPENSE_CATEGORY_VALUES = [
  'lead-manager-and-underwriting-fees',
  'registrar-fees',
  'legal-and-professional-fees',
  'advertising-and-marketing',
  'printing-and-stationery',
  'listing-and-regulatory-fees',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORY_VALUES)[number];

export const MONITORING_AGENCY_STATUS_VALUES = [
  'appointed',
  'identified-not-appointed',
  'not-yet-identified',
  'not-applicable',
] as const;
export type MonitoringAgencyStatus = (typeof MONITORING_AGENCY_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* 1. Proceeds & funding summary                                              */
/* -------------------------------------------------------------------------- */

export const proceedsAndFundingSummarySchema = z.object({
  declaredOfferType: z.enum(['', ...DECLARED_OFFER_TYPE_VALUES]),
  freshIssueGrossProceeds: decimalStringSchema,
  estimatedIssueRelatedExpenses: decimalStringSchema,
  issueMadeToRaiseFundsForObjects: yesNoNotSureOrEmptySchema,
  schemeOfArrangementInvolved: yesNoNotSureOrEmptySchema,
  offerForSaleProceedsNote: text,
  notes: text,
});
export type ProceedsAndFundingSummary = z.infer<typeof proceedsAndFundingSummarySchema>;

/* -------------------------------------------------------------------------- */
/* 2. Objects register & allocation                                          */
/* -------------------------------------------------------------------------- */

export const issueObjectSchema = z.object({
  id: idSchema,
  objectName: text,
  objectCategory: z.enum(['', ...OBJECT_CATEGORY_VALUES]),
  description: text,
  estimatedCost: decimalStringSchema,
  amountFromNetProceeds: decimalStringSchema,
  amountFromInternalAccruals: decimalStringSchema,
  amountFromOtherSources: decimalStringSchema,
  appraisalStatus: z.enum(['', ...APPRAISAL_STATUS_VALUES]),
  appraisingAgencyName: text,
  expectedUtilisationPeriod: text,
  priorityRank: decimalStringSchema,
  notes: text,
});
export type IssueObject = z.infer<typeof issueObjectSchema>;

export const objectsRegisterAndAllocationSchema = z.object({
  objects: z.array(issueObjectSchema),
  objectsAreFinalised: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type ObjectsRegisterAndAllocation = z.infer<typeof objectsRegisterAndAllocationSchema>;

/* -------------------------------------------------------------------------- */
/* 3. Capital expenditure, facilities & expansion                            */
/* -------------------------------------------------------------------------- */

export const capexItemSchema = z.object({
  id: idSchema,
  itemType: z.enum(['', ...CAPEX_ITEM_TYPE_VALUES]),
  description: text,
  location: text,
  relatedObjectId: text,
  estimatedCost: decimalStringSchema,
  expectedCommissioningDate: text,
  quotationSource: z.enum(['', ...QUOTATION_SOURCE_VALUES]),
  relatedPartyPurchase: yesNoNotSureOrEmptySchema,
  governmentApprovalsRequired: yesNoNotSureOrEmptySchema,
  approvalsStatus: z.enum(['', ...APPROVAL_STATUS_VALUES]),
  notes: text,
});
export type CapexItem = z.infer<typeof capexItemSchema>;

export const capitalExpenditureFacilitiesAndExpansionSchema = z.object({
  capexItems: z.array(capexItemSchema),
  notApplicableNote: text,
  notes: text,
});
export type CapitalExpenditureFacilitiesAndExpansion = z.infer<
  typeof capitalExpenditureFacilitiesAndExpansionSchema
>;

/* -------------------------------------------------------------------------- */
/* 4. Working capital & borrowing repayment                                  */
/* -------------------------------------------------------------------------- */

export const borrowingRepaymentItemSchema = z.object({
  id: idSchema,
  lenderName: text,
  loanType: z.enum(['', ...LOAN_TYPE_VALUES]),
  outstandingAmount: decimalStringSchema,
  amountProposedForRepayment: decimalStringSchema,
  interestRatePercentage: decimalStringSchema,
  isRelatedPartyLender: yesNoNotSureOrEmptySchema,
  repaymentRationale: text,
  notes: text,
});
export type BorrowingRepaymentItem = z.infer<typeof borrowingRepaymentItemSchema>;

export const workingCapitalAndBorrowingRepaymentSchema = z.object({
  workingCapitalRequirementAmount: decimalStringSchema,
  workingCapitalMethodology: z.enum(['', ...WORKING_CAPITAL_METHODOLOGY_VALUES]),
  workingCapitalAppraisalStatus: z.enum(['', ...APPRAISAL_STATUS_VALUES]),
  borrowingRepaymentItems: z.array(borrowingRepaymentItemSchema),
  notes: text,
});
export type WorkingCapitalAndBorrowingRepayment = z.infer<
  typeof workingCapitalAndBorrowingRepaymentSchema
>;

/* -------------------------------------------------------------------------- */
/* 5. Acquisitions, subsidiaries, JVs & investments                          */
/* -------------------------------------------------------------------------- */

export const investmentItemSchema = z.object({
  id: idSchema,
  targetEntityName: text,
  transactionType: z.enum(['', ...TRANSACTION_TYPE_VALUES]),
  relatedObjectId: text,
  estimatedAmount: decimalStringSchema,
  proposedStakePercentage: decimalStringSchema,
  definitiveAgreementStatus: z.enum(['', ...DEFINITIVE_AGREEMENT_STATUS_VALUES]),
  regulatoryApprovalsRequired: yesNoNotSureOrEmptySchema,
  regulatoryApprovalDetails: text,
  isRelatedPartyTransaction: yesNoNotSureOrEmptySchema,
  rationale: text,
  notes: text,
});
export type InvestmentItem = z.infer<typeof investmentItemSchema>;

export const acquisitionsSubsidiariesJvsAndInvestmentsSchema = z.object({
  investmentItems: z.array(investmentItemSchema),
  notes: text,
});
export type AcquisitionsSubsidiariesJvsAndInvestments = z.infer<
  typeof acquisitionsSubsidiariesJvsAndInvestmentsSchema
>;

/* -------------------------------------------------------------------------- */
/* 6. Means of finance & deployment schedule                                 */
/* -------------------------------------------------------------------------- */

export const meansOfFinanceRowSchema = z.object({
  id: idSchema,
  source: z.enum(['', ...MEANS_OF_FINANCE_SOURCE_VALUES]),
  amount: decimalStringSchema,
  notes: text,
});
export type MeansOfFinanceRow = z.infer<typeof meansOfFinanceRowSchema>;

export const deploymentScheduleRowSchema = z.object({
  id: idSchema,
  periodLabel: text,
  amountToBeDeployed: decimalStringSchema,
  notes: text,
});
export type DeploymentScheduleRow = z.infer<typeof deploymentScheduleRowSchema>;

export const meansOfFinanceAndDeploymentScheduleSchema = z.object({
  meansOfFinanceRows: z.array(meansOfFinanceRowSchema),
  deploymentScheduleRows: z.array(deploymentScheduleRowSchema),
  fundingTieUpStatus: z.enum(['', ...FUNDING_TIE_UP_STATUS_VALUES]),
  fundingTieUpDetails: text,
  notes: text,
});
export type MeansOfFinanceAndDeploymentSchedule = z.infer<
  typeof meansOfFinanceAndDeploymentScheduleSchema
>;

/* -------------------------------------------------------------------------- */
/* 7. Expenses, GCP, monitoring & confirmations                              */
/* -------------------------------------------------------------------------- */

export const issueExpenseItemSchema = z.object({
  id: idSchema,
  expenseCategory: z.enum(['', ...EXPENSE_CATEGORY_VALUES]),
  estimatedAmount: decimalStringSchema,
  notes: text,
});
export type IssueExpenseItem = z.infer<typeof issueExpenseItemSchema>;

export const objectsOfIssueConfirmationsSchema = z.object({
  objectsServeBonafideBusinessPurposes: z.boolean(),
  noPartOfProceedsBenefitsRelatedPartiesBeyondDisclosed: z.boolean(),
  deploymentScheduleIsManagementEstimate: z.boolean(),
  shortfallToBeMetFromInternalAccrualsOrOtherSources: z.boolean(),
  meansOfFinanceExcludingIssueProceedsAlreadyTiedUp: z.boolean(),
  monitoringAndUtilisationCertificationRequirementUnderstood: z.boolean(),
  professionalReviewRemainsRequired: z.boolean(),
});
export type ObjectsOfIssueConfirmations = z.infer<typeof objectsOfIssueConfirmationsSchema>;

export const expensesGcpMonitoringAndConfirmationsSchema = z.object({
  issueExpenseItems: z.array(issueExpenseItemSchema),
  generalCorporatePurposesAmount: decimalStringSchema,
  monitoringAgencyRequired: yesNoNotSureOrEmptySchema,
  monitoringAgencyName: text,
  monitoringAgencyStatus: z.enum(['', ...MONITORING_AGENCY_STATUS_VALUES]),
  confirmations: objectsOfIssueConfirmationsSchema,
  notes: text,
});
export type ExpensesGcpMonitoringAndConfirmations = z.infer<
  typeof expensesGcpMonitoringAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export const objectsOfIssuePayloadSchema = z.object({
  schemaVersion: z.literal(OBJECTS_OF_ISSUE_SCHEMA_VERSION),
  proceedsAndFundingSummary: proceedsAndFundingSummarySchema,
  objectsRegisterAndAllocation: objectsRegisterAndAllocationSchema,
  capitalExpenditureFacilitiesAndExpansion: capitalExpenditureFacilitiesAndExpansionSchema,
  workingCapitalAndBorrowingRepayment: workingCapitalAndBorrowingRepaymentSchema,
  acquisitionsSubsidiariesJvsAndInvestments: acquisitionsSubsidiariesJvsAndInvestmentsSchema,
  meansOfFinanceAndDeploymentSchedule: meansOfFinanceAndDeploymentScheduleSchema,
  expensesGcpMonitoringAndConfirmations: expensesGcpMonitoringAndConfirmationsSchema,
});

export type ObjectsOfIssuePayload = z.infer<typeof objectsOfIssuePayloadSchema>;

export type ObjectsOfIssueSectionId =
  | 'proceeds-and-funding-summary'
  | 'objects-register-and-allocation'
  | 'capital-expenditure-facilities-and-expansion'
  | 'working-capital-and-borrowing-repayment'
  | 'acquisitions-subsidiaries-jvs-and-investments'
  | 'means-of-finance-and-deployment-schedule'
  | 'expenses-gcp-monitoring-and-confirmations';

export const OBJECTS_OF_ISSUE_SECTION_IDS: ObjectsOfIssueSectionId[] = [
  'proceeds-and-funding-summary',
  'objects-register-and-allocation',
  'capital-expenditure-facilities-and-expansion',
  'working-capital-and-borrowing-repayment',
  'acquisitions-subsidiaries-jvs-and-investments',
  'means-of-finance-and-deployment-schedule',
  'expenses-gcp-monitoring-and-confirmations',
];

export const sectionIdSchema = z.enum([
  'proceeds-and-funding-summary',
  'objects-register-and-allocation',
  'capital-expenditure-facilities-and-expansion',
  'working-capital-and-borrowing-repayment',
  'acquisitions-subsidiaries-jvs-and-investments',
  'means-of-finance-and-deployment-schedule',
  'expenses-gcp-monitoring-and-confirmations',
]);
