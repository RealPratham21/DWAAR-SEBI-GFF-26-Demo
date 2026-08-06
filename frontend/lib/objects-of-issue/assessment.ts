/**
 * Objects Assessment for Objects of the Issue (Increment O1).
 *
 * This is a disclosure-readiness view, never a strong/weak or investment-quality score. An
 * unanswered question is always treated as missing information, never as a negative declaration.
 */

import { computeObjectsOfIssueModel } from '@/lib/objects-of-issue/compute';
import { calculateObjectsOfIssueProgress } from '@/lib/objects-of-issue/progress';
import {
  createEmptyIpoSetupReference,
  createEmptyLinkedWorkstreamReferences,
  type IpoSetupReference,
  type LinkedWorkstreamReferences,
} from '@/lib/objects-of-issue/types';
import type { ObjectsOfIssuePayload } from '@/lib/schemas/objects-of-issue';

export const OBJECTS_CRITERION_STATES = [
  'reconciled',
  'potential_concern',
  'missing_information',
  'pending_linked_workstream',
  'pending_supporting_source',
  'blocked',
  'pending_professional_confirmation',
  'not_applicable',
] as const;
export type ObjectsCriterionState = (typeof OBJECTS_CRITERION_STATES)[number];

export const OBJECTS_CRITERION_STATE_LABELS: Record<ObjectsCriterionState, string> = {
  reconciled: 'Reconciled',
  potential_concern: 'Potential concern',
  missing_information: 'Missing information',
  pending_linked_workstream: 'Pending linked workstream',
  pending_supporting_source: 'Pending supporting source',
  blocked: 'Blocked',
  pending_professional_confirmation: 'Pending professional confirmation',
  not_applicable: 'Not applicable',
};

/** Thematic assessment groups (not 1:1 with Information sections). */
export const OBJECTS_ASSESSMENT_GROUPS = [
  'proceeds-reconciliation',
  'object-substantiation',
  'capex-project-readiness',
  'working-capital-and-borrowing-repayment',
  'means-of-finance-and-deployment',
  'sme-specific-limits',
  'governance-and-confirmations',
] as const;
export type ObjectsAssessmentGroupId = (typeof OBJECTS_ASSESSMENT_GROUPS)[number];

export const OBJECTS_ASSESSMENT_GROUP_LABELS: Record<ObjectsAssessmentGroupId, string> = {
  'proceeds-reconciliation': 'Proceeds reconciliation',
  'object-substantiation': 'Object substantiation',
  'capex-project-readiness': 'Capex / project readiness',
  'working-capital-and-borrowing-repayment': 'Working capital and borrowing repayment',
  'means-of-finance-and-deployment': 'Means of finance and deployment',
  'sme-specific-limits': 'SME-specific limits',
  'governance-and-confirmations': 'Governance and confirmations',
};

export type ObjectsAssessmentCriterion = {
  id: string;
  label: string;
  state: ObjectsCriterionState;
  reason: string;
};

export type ObjectsAssessmentGroup = {
  group: ObjectsAssessmentGroupId;
  label: string;
  headlineState: ObjectsCriterionState;
  criteria: ObjectsAssessmentCriterion[];
};

export type ObjectsAssessmentMetrics = {
  objects: number;
  sectionsComplete: number;
  unansweredConfirmations: number;
  unreconciledChecks: number;
  blockingConcerns: number;
  netFreshIssueProceeds: string;
  totalEstimatedObjectsCost: string;
};

export type ObjectsAssessment = {
  resultLabel: string;
  summary: string;
  metrics: ObjectsAssessmentMetrics;
  counts: Record<ObjectsCriterionState, number>;
  groups: ObjectsAssessmentGroup[];
  criteria: ObjectsAssessmentCriterion[];
};

const STATE_PRIORITY: ObjectsCriterionState[] = [
  'blocked',
  'potential_concern',
  'pending_professional_confirmation',
  'pending_linked_workstream',
  'pending_supporting_source',
  'missing_information',
  'reconciled',
  'not_applicable',
];

function headlineOf(criteria: ObjectsAssessmentCriterion[]): ObjectsCriterionState {
  for (const state of STATE_PRIORITY) {
    if (criteria.some((criterion) => criterion.state === state)) return state;
  }
  return 'not_applicable';
}

function criterion(
  id: string,
  label: string,
  state: ObjectsCriterionState,
  reason: string,
): ObjectsAssessmentCriterion {
  return { id, label, state, reason };
}

export function assessObjectsOfIssue(
  payload: ObjectsOfIssuePayload,
  ipoReference: IpoSetupReference = createEmptyIpoSetupReference(),
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): ObjectsAssessment {
  const model = computeObjectsOfIssueModel(payload, ipoReference);
  const progress = calculateObjectsOfIssueProgress(payload);
  const expenses = payload.expensesGcpMonitoringAndConfirmations;
  const unansweredConfirmations = Object.values(expenses.confirmations).filter((value) => !value)
    .length;

  const groups: ObjectsAssessmentGroup[] = [];

  /* Proceeds reconciliation */
  {
    const proceeds = payload.proceedsAndFundingSummary;
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'ofs-proceeds-excluded',
        'OFS proceeds excluded from issuer utilisation',
        model.isPureOfs ? 'reconciled' : 'not_applicable',
        model.isPureOfs
          ? 'Pure offer for sale — the issuer receives no offer proceeds; fund-utilisation objects are not applicable.'
          : 'Fresh issue or mixed offer — issuer proceeds utilisation applies.',
      ),
      criterion(
        'net-proceeds-calculated',
        'Net proceeds calculated',
        model.isPureOfs
          ? 'not_applicable'
          : model.netFreshIssueProceeds
            ? 'reconciled'
            : 'missing_information',
        model.isPureOfs
          ? 'Not applicable for a pure offer for sale.'
          : model.netFreshIssueProceeds
            ? 'Derived from gross fresh-issue proceeds less estimated issue-related expenses.'
            : 'Gross fresh-issue proceeds or issue expenses are not yet recorded.',
      ),
      criterion(
        'ipo-setup-linked',
        'Offer terms linked from IPO Setup & Eligibility',
        ipoReference.available ? 'reconciled' : 'pending_linked_workstream',
        ipoReference.available
          ? 'Offer type and sizing are read from IPO Setup & Eligibility.'
          : 'IPO Setup & Eligibility is not yet wired — offer terms are entered manually in O1.',
      ),
      criterion(
        'declared-offer-type-recorded',
        'Declared offer type is recorded',
        proceeds.declaredOfferType ? 'reconciled' : 'missing_information',
        proceeds.declaredOfferType
          ? `Declared offer type: ${proceeds.declaredOfferType}.`
          : 'Declared offer type has not been recorded yet.',
      ),
    ];
    groups.push({
      group: 'proceeds-reconciliation',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['proceeds-reconciliation'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  /* Object substantiation */
  {
    const register = payload.objectsRegisterAndAllocation;
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'objects-register-recorded',
        'Objects register is recorded',
        register.objects.length === 0 ? 'missing_information' : 'reconciled',
        register.objects.length === 0
          ? 'No object of the issue has been recorded yet.'
          : `${register.objects.length} object(s) recorded.`,
      ),
      criterion(
        'object-allocations-reconcile',
        'Object allocations reconcile to estimated cost',
        model.isPureOfs
          ? 'not_applicable'
          : !model.totalEstimatedObjectsCost || !model.totalAllocatedFromAllSources
            ? 'missing_information'
            : model.allocationReconciles
              ? 'reconciled'
              : 'potential_concern',
        model.isPureOfs
          ? 'Fund-utilisation objects are not applicable for a pure offer for sale.'
          : 'Compares total estimated cost against amounts from net proceeds, internal accruals and other sources.',
      ),
      criterion(
        'unallocated-net-proceeds-identified',
        'Unallocated net proceeds identified',
        model.isPureOfs
          ? 'not_applicable'
          : !model.netFreshIssueProceeds
            ? 'missing_information'
            : 'reconciled',
        model.isPureOfs
          ? 'Not applicable for a pure offer for sale.'
          : model.unallocatedNetProceeds
            ? `Unallocated net proceeds: ₹${model.unallocatedNetProceeds}.`
            : 'Net proceeds are fully allocated across objects.',
      ),
      criterion(
        'material-objects-have-basis',
        'Material objects have an amount and basis',
        register.objects.length === 0
          ? 'missing_information'
          : register.objects.some((obj) => !obj.estimatedCost || !obj.description)
            ? 'missing_information'
            : register.objectsAreFinalised === 'no'
              ? 'potential_concern'
              : 'reconciled',
        register.objects.length === 0
          ? 'No objects recorded yet.'
          : `${register.objects.filter((obj) => obj.estimatedCost && obj.description).length} of ${register.objects.length} object(s) have cost and purpose recorded.`,
      ),
    ];
    groups.push({
      group: 'object-substantiation',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['object-substantiation'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  /* Capex / project readiness */
  {
    const capex = payload.capitalExpenditureFacilitiesAndExpansion;
    const relatedPartyCapex = capex.capexItems.some((item) => item.relatedPartyPurchase === 'yes');
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'capex-items-recorded',
        'Capex projects recorded where relevant',
        model.hasCapexRelevantObjects
          ? capex.capexItems.length > 0
            ? 'reconciled'
            : 'missing_information'
          : capex.capexItems.length > 0
            ? 'reconciled'
            : 'not_applicable',
        model.hasCapexRelevantObjects && capex.capexItems.length === 0
          ? 'The objects register includes a capital-expenditure object, but no capex item has been entered yet.'
          : `${capex.capexItems.length} capex item(s) recorded.`,
      ),
      criterion(
        'capex-costs-reconcile',
        'Capex costs and funding reconcile',
        !model.hasCapexRelevantObjects || capex.capexItems.length === 0
          ? 'not_applicable'
          : model.totalCapexCost && model.totalEstimatedObjectsCost
            ? 'reconciled'
            : 'missing_information',
        'Capex project costs are tracked against the objects register in O1; detailed cost line reconciliation is expanded in O2.',
      ),
      criterion(
        'capex-related-party-purchases',
        'Related-party capex purchases disclosed',
        capex.capexItems.length === 0
          ? 'not_applicable'
          : relatedPartyCapex
            ? 'potential_concern'
            : 'reconciled',
        relatedPartyCapex
          ? 'One or more capex items are flagged as a related-party purchase.'
          : 'No capex item is currently flagged as a related-party purchase.',
      ),
    ];
    groups.push({
      group: 'capex-project-readiness',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['capex-project-readiness'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  /* Working capital and borrowing repayment */
  {
    const workingCapital = payload.workingCapitalAndBorrowingRepayment;
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'working-capital-supported',
        'Working capital amount is supported',
        workingCapital.workingCapitalRequirementAmount ? 'reconciled' : 'missing_information',
        workingCapital.workingCapitalRequirementAmount
          ? `Methodology: ${workingCapital.workingCapitalMethodology || 'not recorded'}.`
          : 'Working capital requirement has not been recorded yet.',
      ),
      criterion(
        'debt-repayment-within-outstanding',
        'Debt repayment does not exceed outstanding balance',
        workingCapital.borrowingRepaymentItems.length === 0
          ? 'not_applicable'
          : workingCapital.borrowingRepaymentItems.some(
                (item) =>
                  item.outstandingAmount &&
                  item.amountProposedForRepayment &&
                  Number(item.amountProposedForRepayment) > Number(item.outstandingAmount),
              )
            ? 'potential_concern'
            : 'reconciled',
        'Each proposed repayment is compared against the recorded outstanding balance.',
      ),
      criterion(
        'related-party-repayment',
        'Related-party loan repayment',
        workingCapital.borrowingRepaymentItems.length === 0
          ? 'not_applicable'
          : model.relatedPartyBorrowingFlag
            ? 'blocked'
            : 'reconciled',
        model.relatedPartyBorrowingFlag
          ? 'Repayment proposed to a promoter, promoter-group member or related-party lender — blocking concern.'
          : 'No related-party lender is currently flagged for repayment.',
      ),
    ];
    groups.push({
      group: 'working-capital-and-borrowing-repayment',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['working-capital-and-borrowing-repayment'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  /* Means of finance and deployment */
  {
    const meansOfFinance = payload.meansOfFinanceAndDeploymentSchedule;
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'means-of-finance-reconcile',
        'Means of finance reconcile to object costs',
        !model.totalEstimatedObjectsCost || !model.totalMeansOfFinance
          ? 'missing_information'
          : model.meansOfFinanceReconciles
            ? 'reconciled'
            : 'potential_concern',
        'Compares the total means of finance against the total estimated cost of the objects.',
      ),
      criterion(
        'deployment-schedule-exists',
        'Deployment schedule exists',
        meansOfFinance.deploymentScheduleRows.length === 0
          ? 'missing_information'
          : 'reconciled',
        meansOfFinance.deploymentScheduleRows.length === 0
          ? 'No deployment schedule row has been recorded yet.'
          : `${meansOfFinance.deploymentScheduleRows.length} deployment schedule row(s) recorded.`,
      ),
      criterion(
        'bridge-finance-disclosed',
        'Bridge or temporary financing disclosed',
        meansOfFinance.fundingTieUpStatus === 'not-tied-up'
          ? 'potential_concern'
          : meansOfFinance.fundingTieUpStatus
            ? 'reconciled'
            : 'missing_information',
        meansOfFinance.fundingTieUpDetails || 'Funding tie-up status not recorded yet.',
      ),
    ];
    groups.push({
      group: 'means-of-finance-and-deployment',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['means-of-finance-and-deployment'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  /* SME-specific limits */
  {
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'gcp-within-limit',
        'GCP remains within the applicable limit',
        model.isPureOfs
          ? 'not_applicable'
          : !expenses.generalCorporatePurposesAmount
            ? 'missing_information'
            : model.gcpWithinLimit
              ? 'reconciled'
              : 'potential_concern',
        model.gcpWithinLimit
          ? `GCP is within the applicable cap (lower of 15% of fresh issue proceeds or ₹10 crore). Applicable cap: ₹${model.gcpApplicableCap || '—'}.`
          : 'General Corporate Purposes exceeds the applicable SME cap.',
      ),
      criterion(
        'issue-expenses-excluded-from-gcp',
        'Issue expenses excluded from GCP',
        model.gcpIncludesIssueExpenses ? 'potential_concern' : 'reconciled',
        'Issue expenses are tracked separately from General Corporate Purposes by product rule.',
      ),
    ];
    groups.push({
      group: 'sme-specific-limits',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['sme-specific-limits'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  /* Governance and confirmations */
  {
    const acquisitions = payload.acquisitionsSubsidiariesJvsAndInvestments;
    const criteria: ObjectsAssessmentCriterion[] = [
      criterion(
        'monitoring-applicability-answered',
        'Monitoring agency applicability is answered',
        expenses.monitoringAgencyStatus
          ? expenses.monitoringAgencyStatus === 'not-applicable'
            ? 'not_applicable'
            : expenses.monitoringAgencyStatus === 'appointed'
              ? 'reconciled'
              : 'pending_supporting_source'
          : 'missing_information',
        expenses.monitoringAgencyName
          ? `Monitoring agency: ${expenses.monitoringAgencyName}.`
          : 'Monitoring agency status not fully recorded yet.',
      ),
      criterion(
        'acquisition-related-party',
        'Acquisition related-party counterparty disclosed',
        acquisitions.investmentItems.length === 0
          ? 'not_applicable'
          : model.relatedPartyInvestmentFlag
            ? 'potential_concern'
            : 'reconciled',
        model.relatedPartyInvestmentFlag
          ? 'One or more proposed acquisitions or investments involve a related party.'
          : 'No related-party counterparty is currently flagged.',
      ),
      criterion(
        'issuer-confirmations-complete',
        'Issuer confirmations are complete',
        unansweredConfirmations === 0 ? 'reconciled' : 'pending_professional_confirmation',
        unansweredConfirmations === 0
          ? 'All issuer confirmations are checked.'
          : `${unansweredConfirmations} confirmation(s) are not yet checked.`,
      ),
    ];
    groups.push({
      group: 'governance-and-confirmations',
      label: OBJECTS_ASSESSMENT_GROUP_LABELS['governance-and-confirmations'],
      headlineState: headlineOf(criteria),
      criteria,
    });
  }

  void linkedReferences;

  const criteria = groups.flatMap((group) => group.criteria);
  const counts = OBJECTS_CRITERION_STATES.reduce(
    (acc, state) => {
      acc[state] = criteria.filter((item) => item.state === state).length;
      return acc;
    },
    {} as Record<ObjectsCriterionState, number>,
  );

  const blockingConcerns = counts.blocked + counts.potential_concern;
  const metrics: ObjectsAssessmentMetrics = {
    objects: payload.objectsRegisterAndAllocation.objects.length,
    sectionsComplete: progress.sectionsComplete,
    unansweredConfirmations,
    unreconciledChecks: model.reconciliation.filter((check) => check.status === 'variance').length,
    blockingConcerns,
    netFreshIssueProceeds: model.netFreshIssueProceeds,
    totalEstimatedObjectsCost: model.totalEstimatedObjectsCost,
  };

  const resultLabel =
    counts.blocked > 0
      ? `${counts.blocked} blocking concern(s) identified`
      : counts.potential_concern > 0
        ? `${counts.potential_concern} potential concern(s) to review`
        : counts.missing_information > 0
          ? 'Disclosure readiness in progress'
          : 'No blocking concerns currently identified';

  const summary =
    'This is a disclosure-readiness view derived from the current in-memory draft, not a strong-or-weak score or a substitute for professional advice. Unanswered questions are treated as missing information, never as a negative declaration.';

  return {
    resultLabel,
    summary,
    metrics,
    counts,
    groups,
    criteria,
  };
}
