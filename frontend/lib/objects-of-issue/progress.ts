/**
 * Section completeness and overall progress for Objects of the Issue (Increment O1).
 *
 * Status is derived live from the payload — there is no separate "submitted" flag. `complete`
 * means every field this workstream currently treats as required is filled; it never implies the
 * data has been reviewed or approved.
 */

import type {
  BorrowingRepaymentItem,
  CapexItem,
  InvestmentItem,
  IssueObject,
  ObjectsOfIssuePayload,
  ObjectsOfIssueSectionId,
} from '@/lib/schemas/objects-of-issue';
import { OBJECTS_OF_ISSUE_SECTION_IDS } from '@/lib/schemas/objects-of-issue';
import type { ObjectsOfIssueProgress, SectionStatus } from '@/lib/objects-of-issue/types';

function filled(value: string | null | undefined): boolean {
  return (value ?? '').trim() !== '';
}

function statusFrom(anyFilled: boolean, allRequiredFilled: boolean): SectionStatus {
  if (allRequiredFilled) return 'complete';
  if (anyFilled) return 'in_progress';
  return 'not_started';
}

export function evaluateProceedsAndFundingStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.proceedsAndFundingSummary;
  const isPureOfs = value.declaredOfferType === 'offer-for-sale';
  const any =
    filled(value.declaredOfferType) ||
    filled(value.freshIssueGrossProceeds) ||
    filled(value.estimatedIssueRelatedExpenses) ||
    filled(value.issueMadeToRaiseFundsForObjects) ||
    filled(value.schemeOfArrangementInvolved) ||
    filled(value.offerForSaleProceedsNote) ||
    filled(value.notes);
  const required = isPureOfs
    ? filled(value.declaredOfferType) && filled(value.offerForSaleProceedsNote)
    : filled(value.declaredOfferType) &&
      filled(value.issueMadeToRaiseFundsForObjects) &&
      filled(value.freshIssueGrossProceeds);
  return statusFrom(any, required);
}

function isObjectComplete(object: IssueObject): boolean {
  return (
    filled(object.objectName) && filled(object.objectCategory) && filled(object.estimatedCost)
  );
}

function isObjectStarted(object: IssueObject): boolean {
  return (
    filled(object.objectName) ||
    filled(object.objectCategory) ||
    filled(object.estimatedCost) ||
    filled(object.description)
  );
}

export function evaluateObjectsRegisterStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.objectsRegisterAndAllocation;
  const any =
    value.objects.some(isObjectStarted) || filled(value.objectsAreFinalised) || filled(value.notes);
  const required =
    value.objects.length > 0 &&
    value.objects.every(isObjectComplete) &&
    filled(value.objectsAreFinalised);
  return statusFrom(any, required);
}

function isCapexItemComplete(item: CapexItem): boolean {
  return filled(item.itemType) && filled(item.estimatedCost);
}

function isCapexItemStarted(item: CapexItem): boolean {
  return filled(item.itemType) || filled(item.estimatedCost) || filled(item.description);
}

export function evaluateCapexStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.capitalExpenditureFacilitiesAndExpansion;
  if (value.capexItems.length === 0) {
    return filled(value.notApplicableNote) ? 'complete' : 'not_started';
  }
  const any = value.capexItems.some(isCapexItemStarted) || filled(value.notes);
  const required = value.capexItems.every(isCapexItemComplete);
  return statusFrom(any, required);
}

function isBorrowingItemComplete(item: BorrowingRepaymentItem): boolean {
  return filled(item.lenderName) && filled(item.amountProposedForRepayment);
}

function isBorrowingItemStarted(item: BorrowingRepaymentItem): boolean {
  return filled(item.lenderName) || filled(item.outstandingAmount) || filled(item.amountProposedForRepayment);
}

export function evaluateWorkingCapitalStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.workingCapitalAndBorrowingRepayment;
  const any =
    filled(value.workingCapitalRequirementAmount) ||
    filled(value.workingCapitalMethodology) ||
    value.borrowingRepaymentItems.some(isBorrowingItemStarted) ||
    filled(value.notes);
  const required =
    filled(value.workingCapitalRequirementAmount) &&
    value.borrowingRepaymentItems.every(isBorrowingItemComplete);
  return statusFrom(any, required);
}

function isInvestmentItemComplete(item: InvestmentItem): boolean {
  return filled(item.targetEntityName) && filled(item.transactionType) && filled(item.estimatedAmount);
}

function isInvestmentItemStarted(item: InvestmentItem): boolean {
  return filled(item.targetEntityName) || filled(item.transactionType) || filled(item.estimatedAmount);
}

export function evaluateAcquisitionsStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.acquisitionsSubsidiariesJvsAndInvestments;
  if (value.investmentItems.length === 0) {
    return filled(value.notes) ? 'in_progress' : 'not_started';
  }
  const any = value.investmentItems.some(isInvestmentItemStarted) || filled(value.notes);
  const required = value.investmentItems.every(isInvestmentItemComplete);
  return statusFrom(any, required);
}

export function evaluateMeansOfFinanceStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.meansOfFinanceAndDeploymentSchedule;
  const any =
    value.meansOfFinanceRows.length > 0 ||
    value.deploymentScheduleRows.length > 0 ||
    filled(value.fundingTieUpStatus) ||
    filled(value.notes);
  const required =
    value.meansOfFinanceRows.length > 0 &&
    value.deploymentScheduleRows.length > 0 &&
    filled(value.fundingTieUpStatus);
  return statusFrom(any, required);
}

export function evaluateExpensesGcpStatus(payload: ObjectsOfIssuePayload): SectionStatus {
  const value = payload.expensesGcpMonitoringAndConfirmations;
  const any =
    value.issueExpenseItems.length > 0 ||
    filled(value.generalCorporatePurposesAmount) ||
    filled(value.monitoringAgencyRequired) ||
    filled(value.notes);
  const required = value.issueExpenseItems.length > 0 && filled(value.monitoringAgencyRequired);
  return statusFrom(any, required);
}

const EVALUATORS: Record<
  ObjectsOfIssueSectionId,
  (payload: ObjectsOfIssuePayload) => SectionStatus
> = {
  'proceeds-and-funding-summary': evaluateProceedsAndFundingStatus,
  'objects-register-and-allocation': evaluateObjectsRegisterStatus,
  'capital-expenditure-facilities-and-expansion': evaluateCapexStatus,
  'working-capital-and-borrowing-repayment': evaluateWorkingCapitalStatus,
  'acquisitions-subsidiaries-jvs-and-investments': evaluateAcquisitionsStatus,
  'means-of-finance-and-deployment-schedule': evaluateMeansOfFinanceStatus,
  'expenses-gcp-monitoring-and-confirmations': evaluateExpensesGcpStatus,
};

export function calculateObjectsOfIssueProgress(
  payload: ObjectsOfIssuePayload,
): ObjectsOfIssueProgress {
  const sections = {} as Record<ObjectsOfIssueSectionId, SectionStatus>;
  for (const sectionId of OBJECTS_OF_ISSUE_SECTION_IDS) {
    sections[sectionId] = EVALUATORS[sectionId](payload);
  }
  const sectionsComplete = OBJECTS_OF_ISSUE_SECTION_IDS.filter(
    (id) => sections[id] === 'complete',
  ).length;
  const overallStatus: SectionStatus =
    sectionsComplete === OBJECTS_OF_ISSUE_SECTION_IDS.length
      ? 'complete'
      : sectionsComplete > 0 || OBJECTS_OF_ISSUE_SECTION_IDS.some((id) => sections[id] !== 'not_started')
        ? 'in_progress'
        : 'not_started';

  return {
    sections,
    sectionsComplete,
    totalSections: OBJECTS_OF_ISSUE_SECTION_IDS.length,
    overallStatus,
  };
}

export function listIncompleteObjectsOfIssueSections(payload: ObjectsOfIssuePayload): string[] {
  const progress = calculateObjectsOfIssueProgress(payload);
  return OBJECTS_OF_ISSUE_SECTION_IDS.filter((id) => progress.sections[id] !== 'complete');
}
