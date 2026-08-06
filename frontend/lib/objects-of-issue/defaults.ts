/**
 * Empty-record factories for Objects of the Issue (Increment O1).
 *
 * Every money / count / percentage field starts as `''` (never `0`, never `null`) and every
 * repeatable record receives a stable `crypto.randomUUID()` id so React keys and cross-section
 * links survive re-renders and round-trips.
 */

import type {
  AcquisitionsSubsidiariesJvsAndInvestments,
  BorrowingRepaymentItem,
  CapexItem,
  CapitalExpenditureFacilitiesAndExpansion,
  DeploymentScheduleRow,
  ExpensesGcpMonitoringAndConfirmations,
  InvestmentItem,
  IssueExpenseItem,
  IssueObject,
  MeansOfFinanceAndDeploymentSchedule,
  MeansOfFinanceRow,
  ObjectsOfIssueConfirmations,
  ObjectsOfIssuePayload,
  ObjectsRegisterAndAllocation,
  ProceedsAndFundingSummary,
  WorkingCapitalAndBorrowingRepayment,
} from '@/lib/schemas/objects-of-issue';
import { OBJECTS_OF_ISSUE_SCHEMA_VERSION } from '@/lib/schemas/objects-of-issue';

function newId(id?: string): string {
  return id ?? crypto.randomUUID();
}

/* -------------------------------------------------------------------------- */
/* 1. Proceeds & funding summary                                              */
/* -------------------------------------------------------------------------- */

export function createEmptyProceedsAndFundingSummary(): ProceedsAndFundingSummary {
  return {
    declaredOfferType: '',
    freshIssueGrossProceeds: '',
    estimatedIssueRelatedExpenses: '',
    issueMadeToRaiseFundsForObjects: '',
    schemeOfArrangementInvolved: '',
    offerForSaleProceedsNote: '',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* 2. Objects register & allocation                                          */
/* -------------------------------------------------------------------------- */

export function createEmptyIssueObject(id?: string): IssueObject {
  return {
    id: newId(id),
    objectName: '',
    objectCategory: '',
    description: '',
    estimatedCost: '',
    amountFromNetProceeds: '',
    amountFromInternalAccruals: '',
    amountFromOtherSources: '',
    appraisalStatus: '',
    appraisingAgencyName: '',
    expectedUtilisationPeriod: '',
    priorityRank: '',
    notes: '',
  };
}

export function createEmptyObjectsRegisterAndAllocation(): ObjectsRegisterAndAllocation {
  return {
    objects: [],
    objectsAreFinalised: '',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* 3. Capital expenditure, facilities & expansion                            */
/* -------------------------------------------------------------------------- */

export function createEmptyCapexItem(id?: string): CapexItem {
  return {
    id: newId(id),
    itemType: '',
    description: '',
    location: '',
    relatedObjectId: '',
    estimatedCost: '',
    expectedCommissioningDate: '',
    quotationSource: '',
    relatedPartyPurchase: '',
    governmentApprovalsRequired: '',
    approvalsStatus: '',
    notes: '',
  };
}

export function createEmptyCapitalExpenditureFacilitiesAndExpansion(): CapitalExpenditureFacilitiesAndExpansion {
  return {
    capexItems: [],
    notApplicableNote: '',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Working capital & borrowing repayment                                  */
/* -------------------------------------------------------------------------- */

export function createEmptyBorrowingRepaymentItem(id?: string): BorrowingRepaymentItem {
  return {
    id: newId(id),
    lenderName: '',
    loanType: '',
    outstandingAmount: '',
    amountProposedForRepayment: '',
    interestRatePercentage: '',
    isRelatedPartyLender: '',
    repaymentRationale: '',
    notes: '',
  };
}

export function createEmptyWorkingCapitalAndBorrowingRepayment(): WorkingCapitalAndBorrowingRepayment {
  return {
    workingCapitalRequirementAmount: '',
    workingCapitalMethodology: '',
    workingCapitalAppraisalStatus: '',
    borrowingRepaymentItems: [],
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* 5. Acquisitions, subsidiaries, JVs & investments                          */
/* -------------------------------------------------------------------------- */

export function createEmptyInvestmentItem(id?: string): InvestmentItem {
  return {
    id: newId(id),
    targetEntityName: '',
    transactionType: '',
    relatedObjectId: '',
    estimatedAmount: '',
    proposedStakePercentage: '',
    definitiveAgreementStatus: '',
    regulatoryApprovalsRequired: '',
    regulatoryApprovalDetails: '',
    isRelatedPartyTransaction: '',
    rationale: '',
    notes: '',
  };
}

export function createEmptyAcquisitionsSubsidiariesJvsAndInvestments(): AcquisitionsSubsidiariesJvsAndInvestments {
  return {
    investmentItems: [],
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* 6. Means of finance & deployment schedule                                 */
/* -------------------------------------------------------------------------- */

export function createEmptyMeansOfFinanceRow(id?: string): MeansOfFinanceRow {
  return {
    id: newId(id),
    source: '',
    amount: '',
    notes: '',
  };
}

export function createEmptyDeploymentScheduleRow(id?: string): DeploymentScheduleRow {
  return {
    id: newId(id),
    periodLabel: '',
    amountToBeDeployed: '',
    notes: '',
  };
}

export function createEmptyMeansOfFinanceAndDeploymentSchedule(): MeansOfFinanceAndDeploymentSchedule {
  return {
    meansOfFinanceRows: [],
    deploymentScheduleRows: [],
    fundingTieUpStatus: '',
    fundingTieUpDetails: '',
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* 7. Expenses, GCP, monitoring & confirmations                              */
/* -------------------------------------------------------------------------- */

export function createEmptyIssueExpenseItem(id?: string): IssueExpenseItem {
  return {
    id: newId(id),
    expenseCategory: '',
    estimatedAmount: '',
    notes: '',
  };
}

export function createEmptyObjectsOfIssueConfirmations(): ObjectsOfIssueConfirmations {
  return {
    objectsServeBonafideBusinessPurposes: false,
    noPartOfProceedsBenefitsRelatedPartiesBeyondDisclosed: false,
    deploymentScheduleIsManagementEstimate: false,
    shortfallToBeMetFromInternalAccrualsOrOtherSources: false,
    meansOfFinanceExcludingIssueProceedsAlreadyTiedUp: false,
    monitoringAndUtilisationCertificationRequirementUnderstood: false,
    professionalReviewRemainsRequired: false,
  };
}

/** Back-compat alias. */
export const createEmptyObjectConfirmations = createEmptyObjectsOfIssueConfirmations;

export function createEmptyExpensesGcpMonitoringAndConfirmations(): ExpensesGcpMonitoringAndConfirmations {
  return {
    issueExpenseItems: [],
    generalCorporatePurposesAmount: '',
    monitoringAgencyRequired: '',
    monitoringAgencyName: '',
    monitoringAgencyStatus: '',
    confirmations: createEmptyObjectsOfIssueConfirmations(),
    notes: '',
  };
}

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export function createEmptyObjectsOfIssuePayload(): ObjectsOfIssuePayload {
  return {
    schemaVersion: OBJECTS_OF_ISSUE_SCHEMA_VERSION,
    proceedsAndFundingSummary: createEmptyProceedsAndFundingSummary(),
    objectsRegisterAndAllocation: createEmptyObjectsRegisterAndAllocation(),
    capitalExpenditureFacilitiesAndExpansion:
      createEmptyCapitalExpenditureFacilitiesAndExpansion(),
    workingCapitalAndBorrowingRepayment: createEmptyWorkingCapitalAndBorrowingRepayment(),
    acquisitionsSubsidiariesJvsAndInvestments:
      createEmptyAcquisitionsSubsidiariesJvsAndInvestments(),
    meansOfFinanceAndDeploymentSchedule: createEmptyMeansOfFinanceAndDeploymentSchedule(),
    expensesGcpMonitoringAndConfirmations: createEmptyExpensesGcpMonitoringAndConfirmations(),
  };
}
