/**
 * Derived, non-persisted computations for Objects of the Issue (Increment O1).
 *
 * Every figure here is recalculated live from the payload — nothing computed in this file is
 * ever written back into `ObjectsOfIssuePayload`.
 */

import {
  compare,
  differsBeyond,
  greaterThan,
  isFilledDecimal,
  pct,
  subtract,
  sumDecimals,
} from '@/lib/objects-of-issue/decimal';
import { calculateGcpCap } from '@/lib/objects-of-issue/gcp';
import type { ObjectsOfIssuePayload } from '@/lib/schemas/objects-of-issue';
import type { IpoSetupReference } from '@/lib/objects-of-issue/types';

/** Rupee tolerance used when comparing two independently-entered totals. */
const RECONCILIATION_TOLERANCE = '1';

export type ReconciliationStatus = 'reconciled' | 'variance' | 'not_applicable' | 'pending';

export type ReconciliationCheck = {
  id: string;
  label: string;
  status: ReconciliationStatus;
  detail: string;
};

export type ObjectsOfIssueCounts = {
  objects: number;
  capexItems: number;
  borrowingRepaymentItems: number;
  investmentItems: number;
  meansOfFinanceRows: number;
  deploymentScheduleRows: number;
  issueExpenseItems: number;
};

export type ObjectsOfIssueModel = {
  isPureOfs: boolean;
  netFreshIssueProceeds: string;
  totalEstimatedObjectsCost: string;
  totalAllocatedFromNetProceeds: string;
  totalAllocatedFromAllSources: string;
  unallocatedNetProceeds: string;
  allocationReconciles: boolean;
  hasCapexRelevantObjects: boolean;
  totalCapexCost: string;
  hasAcquisitionRelevantObjects: boolean;
  totalInvestmentAmount: string;
  relatedPartyInvestmentFlag: boolean;
  totalBorrowingRepayment: string;
  relatedPartyBorrowingFlag: boolean;
  totalMeansOfFinance: string;
  totalDeploymentScheduled: string;
  meansOfFinanceReconciles: boolean;
  totalIssueExpenses: string;
  gcpPercentageOfFreshIssue: string;
  gcpApplicableCap: string;
  gcpWithinLimit: boolean;
  gcpIncludesIssueExpenses: boolean;
  counts: ObjectsOfIssueCounts;
  reconciliation: ReconciliationCheck[];
};

function subtractSafe(a: string, b: string): string {
  if (!isFilledDecimal(a)) return '';
  return subtract(a, isFilledDecimal(b) ? b : '0');
}

export function computeObjectsOfIssueModel(
  payload: ObjectsOfIssuePayload,
  ipoReference?: IpoSetupReference,
): ObjectsOfIssueModel {
  const proceeds = payload.proceedsAndFundingSummary;
  const isPureOfs =
    proceeds.declaredOfferType === 'offer-for-sale' ||
    (ipoReference?.available === true && ipoReference.proposedOfferType === 'offer-for-sale');

  const netFreshIssueProceeds = isPureOfs
    ? ''
    : subtractSafe(proceeds.freshIssueGrossProceeds, proceeds.estimatedIssueRelatedExpenses);

  const objects = payload.objectsRegisterAndAllocation.objects;
  const totalEstimatedObjectsCost = sumDecimals(objects.map((item) => item.estimatedCost));
  const totalAllocatedFromNetProceeds = sumDecimals(
    objects.map((item) => item.amountFromNetProceeds),
  );
  const totalAllocatedFromAllSources = sumDecimals(
    objects.flatMap((item) => [
      item.amountFromNetProceeds,
      item.amountFromInternalAccruals,
      item.amountFromOtherSources,
    ]),
  );
  const unallocatedNetProceeds = subtractSafe(netFreshIssueProceeds, totalAllocatedFromNetProceeds);
  const allocationReconciles =
    isPureOfs ||
    !isFilledDecimal(totalEstimatedObjectsCost) ||
    !isFilledDecimal(totalAllocatedFromAllSources)
      ? true
      : !differsBeyond(totalEstimatedObjectsCost, totalAllocatedFromAllSources, RECONCILIATION_TOLERANCE);

  const hasCapexRelevantObjects = objects.some(
    (item) => item.objectCategory === 'capital-expenditure',
  );
  const capexItems = payload.capitalExpenditureFacilitiesAndExpansion.capexItems;
  const totalCapexCost = sumDecimals(capexItems.map((item) => item.estimatedCost));

  const hasAcquisitionRelevantObjects = objects.some(
    (item) => item.objectCategory === 'acquisition-or-investment',
  );
  const investmentItems = payload.acquisitionsSubsidiariesJvsAndInvestments.investmentItems;
  const totalInvestmentAmount = sumDecimals(investmentItems.map((item) => item.estimatedAmount));
  const relatedPartyInvestmentFlag = investmentItems.some(
    (item) => item.isRelatedPartyTransaction === 'yes',
  );

  const borrowingItems = payload.workingCapitalAndBorrowingRepayment.borrowingRepaymentItems;
  const totalBorrowingRepayment = sumDecimals(
    borrowingItems.map((item) => item.amountProposedForRepayment),
  );
  const relatedPartyBorrowingFlag = borrowingItems.some(
    (item) => item.isRelatedPartyLender === 'yes',
  );

  const meansOfFinance = payload.meansOfFinanceAndDeploymentSchedule;
  const totalMeansOfFinance = sumDecimals(meansOfFinance.meansOfFinanceRows.map((row) => row.amount));
  const totalDeploymentScheduled = sumDecimals(
    meansOfFinance.deploymentScheduleRows.map((row) => row.amountToBeDeployed),
  );
  const meansOfFinanceReconciles =
    !isFilledDecimal(totalEstimatedObjectsCost) || !isFilledDecimal(totalMeansOfFinance)
      ? true
      : !differsBeyond(totalEstimatedObjectsCost, totalMeansOfFinance, RECONCILIATION_TOLERANCE);

  const expenses = payload.expensesGcpMonitoringAndConfirmations;
  const totalIssueExpenses = sumDecimals(expenses.issueExpenseItems.map((item) => item.estimatedAmount));
  const gcpCap = calculateGcpCap(proceeds.freshIssueGrossProceeds);
  const gcpPercentageOfFreshIssue = isPureOfs
    ? ''
    : pct(expenses.generalCorporatePurposesAmount, proceeds.freshIssueGrossProceeds, 2);
  const gcpWithinLimit =
    isPureOfs ||
    !isFilledDecimal(expenses.generalCorporatePurposesAmount) ||
    !isFilledDecimal(gcpCap.applicableCap) ||
    (compare(expenses.generalCorporatePurposesAmount, gcpCap.applicableCap) ?? 0) <= 0;
  /** Issue expenses are always excluded from GCP by product rule. */
  const gcpIncludesIssueExpenses = false;

  const counts: ObjectsOfIssueCounts = {
    objects: objects.length,
    capexItems: capexItems.length,
    borrowingRepaymentItems: borrowingItems.length,
    investmentItems: investmentItems.length,
    meansOfFinanceRows: meansOfFinance.meansOfFinanceRows.length,
    deploymentScheduleRows: meansOfFinance.deploymentScheduleRows.length,
    issueExpenseItems: expenses.issueExpenseItems.length,
  };

  const reconciliation = buildReconciliationChecks({
    isPureOfs,
    netFreshIssueProceeds,
    totalEstimatedObjectsCost,
    totalAllocatedFromAllSources,
    allocationReconciles,
    totalMeansOfFinance,
    meansOfFinanceReconciles,
    gcpWithinLimit,
    gcpApplicableCap: gcpCap.applicableCap,
    gcpPercentageOfFreshIssue,
    relatedPartyBorrowingFlag,
    relatedPartyInvestmentFlag,
  });

  return {
    isPureOfs,
    netFreshIssueProceeds,
    totalEstimatedObjectsCost,
    totalAllocatedFromNetProceeds,
    totalAllocatedFromAllSources,
    unallocatedNetProceeds,
    allocationReconciles,
    hasCapexRelevantObjects,
    totalCapexCost,
    hasAcquisitionRelevantObjects,
    totalInvestmentAmount,
    relatedPartyInvestmentFlag,
    totalBorrowingRepayment,
    relatedPartyBorrowingFlag,
    totalMeansOfFinance,
    totalDeploymentScheduled,
    meansOfFinanceReconciles,
    totalIssueExpenses,
    gcpPercentageOfFreshIssue,
    gcpApplicableCap: gcpCap.applicableCap,
    gcpWithinLimit,
    gcpIncludesIssueExpenses,
    counts,
    reconciliation,
  };
}

function buildReconciliationChecks(args: {
  isPureOfs: boolean;
  netFreshIssueProceeds: string;
  totalEstimatedObjectsCost: string;
  totalAllocatedFromAllSources: string;
  allocationReconciles: boolean;
  totalMeansOfFinance: string;
  meansOfFinanceReconciles: boolean;
  gcpWithinLimit: boolean;
  gcpApplicableCap: string;
  gcpPercentageOfFreshIssue: string;
  relatedPartyBorrowingFlag: boolean;
  relatedPartyInvestmentFlag: boolean;
}): ReconciliationCheck[] {
  const checks: ReconciliationCheck[] = [];

  checks.push({
    id: 'net-proceeds-known',
    label: 'Net fresh-issue proceeds are known',
    status: args.isPureOfs
      ? 'not_applicable'
      : isFilledDecimal(args.netFreshIssueProceeds)
        ? 'reconciled'
        : 'pending',
    detail: args.isPureOfs
      ? 'Pure offer for sale — the issuer receives no fresh-issue proceeds.'
      : isFilledDecimal(args.netFreshIssueProceeds)
        ? 'Gross fresh-issue proceeds and issue expenses are recorded.'
        : 'Gross fresh-issue proceeds are not yet recorded.',
  });

  checks.push({
    id: 'allocation-reconciles',
    label: 'Object allocation reconciles to estimated cost',
    status: args.isPureOfs
      ? 'not_applicable'
      : !isFilledDecimal(args.totalEstimatedObjectsCost) ||
          !isFilledDecimal(args.totalAllocatedFromAllSources)
        ? 'pending'
        : args.allocationReconciles
          ? 'reconciled'
          : 'variance',
    detail: 'Sum of amounts funded from net proceeds, internal accruals and other sources vs. total estimated cost of the objects.',
  });

  checks.push({
    id: 'means-of-finance-reconciles',
    label: 'Means of finance reconciles to estimated cost',
    status: !isFilledDecimal(args.totalEstimatedObjectsCost) || !isFilledDecimal(args.totalMeansOfFinance)
      ? 'pending'
      : args.meansOfFinanceReconciles
        ? 'reconciled'
        : 'variance',
    detail: 'Total means of finance vs. total estimated cost of the objects.',
  });

  checks.push({
    id: 'gcp-within-limit',
    label: 'General Corporate Purposes within the applicable SME cap',
    status: args.isPureOfs
      ? 'not_applicable'
      : !isFilledDecimal(args.gcpPercentageOfFreshIssue)
        ? 'pending'
        : args.gcpWithinLimit
          ? 'reconciled'
          : 'variance',
    detail:
      'Lower of 15% of fresh issue proceeds and ₹10 crore (versioned helper). Issue expenses are excluded from GCP.',
  });

  checks.push({
    id: 'related-party-borrowing',
    label: 'Related-party loan repayment',
    status: args.relatedPartyBorrowingFlag ? 'variance' : 'reconciled',
    detail: args.relatedPartyBorrowingFlag
      ? 'Repayment proposed to a promoter, promoter-group member or related-party lender — treated as a blocking concern.'
      : 'No related-party lender is currently flagged for repayment.',
  });

  checks.push({
    id: 'related-party-investment',
    label: 'No related-party counterparty flagged for acquisitions or investments',
    status: args.relatedPartyInvestmentFlag ? 'variance' : 'reconciled',
    detail: args.relatedPartyInvestmentFlag
      ? 'One or more proposed acquisitions or investments involve a related party.'
      : 'No related-party counterparty is currently flagged.',
  });

  return checks;
}
