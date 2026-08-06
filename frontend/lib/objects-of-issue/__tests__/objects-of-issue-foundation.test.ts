import { describe, expect, it } from 'vitest';

import {
  assessObjectsOfIssue,
  calculateGcpCap,
  calculateObjectsOfIssueProgress,
  computeObjectsOfIssueModel,
  createEmptyIpoSetupReference,
  createEmptyIssueObject,
  createEmptyLinkedWorkstreamReferences,
  createEmptyObjectsOfIssuePayload,
  GCP_ABSOLUTE_CAP_RUPEES,
  GCP_PERCENT_OF_FRESH_PROCEEDS,
  GCP_RULE_VERSION,
  OBJECTS_ASSESSMENT_GROUPS,
  OBJECTS_OF_ISSUE_SCHEMA_VERSION,
  OBJECTS_OF_ISSUE_SECTION_IDS,
  objectsOfIssuePayloadSchema,
  type ObjectsOfIssuePayload,
} from '@/lib/objects-of-issue';

describe('objects of the issue foundation', () => {
  it('freezes schema version and seven sections', () => {
    expect(OBJECTS_OF_ISSUE_SCHEMA_VERSION).toBe(1);
    expect(OBJECTS_OF_ISSUE_SECTION_IDS).toHaveLength(7);
    const empty = createEmptyObjectsOfIssuePayload();
    expect(empty.schemaVersion).toBe(1);
    expect(objectsOfIssuePayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('defaults all seven canonical section keys', () => {
    const empty = createEmptyObjectsOfIssuePayload();
    expect(empty.proceedsAndFundingSummary).toBeDefined();
    expect(empty.objectsRegisterAndAllocation).toBeDefined();
    expect(empty.capitalExpenditureFacilitiesAndExpansion).toBeDefined();
    expect(empty.workingCapitalAndBorrowingRepayment).toBeDefined();
    expect(empty.acquisitionsSubsidiariesJvsAndInvestments).toBeDefined();
    expect(empty.meansOfFinanceAndDeploymentSchedule).toBeDefined();
    expect(empty.expensesGcpMonitoringAndConfirmations).toBeDefined();
  });

  it('assigns stable ids to repeatable records', () => {
    const object = createEmptyIssueObject();
    expect(object.id.length).toBeGreaterThan(8);
    expect(object.estimatedCost).toBe('');
  });

  it('never coerces an unanswered ternary to "no"', () => {
    const object = createEmptyIssueObject();
    expect(object.appraisalStatus).toBe('');
    const empty = createEmptyObjectsOfIssuePayload();
    expect(empty.proceedsAndFundingSummary.issueMadeToRaiseFundsForObjects).toBe('');
  });

  describe('net proceeds and pure OFS handling', () => {
    it('derives net proceeds from gross fresh-issue proceeds and issue expenses', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const payload: ObjectsOfIssuePayload = {
        ...empty,
        proceedsAndFundingSummary: {
          ...empty.proceedsAndFundingSummary,
          declaredOfferType: 'fresh-issue',
          freshIssueGrossProceeds: '100000000',
          estimatedIssueRelatedExpenses: '8000000',
        },
      };
      const model = computeObjectsOfIssueModel(payload, createEmptyIpoSetupReference());
      expect(model.isPureOfs).toBe(false);
      expect(model.netFreshIssueProceeds).toBe('92000000');
    });

    it('treats a pure offer for sale as having no fresh-issue net proceeds to deploy', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const payload: ObjectsOfIssuePayload = {
        ...empty,
        proceedsAndFundingSummary: {
          ...empty.proceedsAndFundingSummary,
          declaredOfferType: 'offer-for-sale',
        },
      };
      const model = computeObjectsOfIssueModel(payload, createEmptyIpoSetupReference());
      expect(model.isPureOfs).toBe(true);
      expect(model.netFreshIssueProceeds).toBe('');
      expect(model.allocationReconciles).toBe(true);
      const check = model.reconciliation.find((c) => c.id === 'net-proceeds-known');
      expect(check?.status).toBe('not_applicable');
    });
  });

  describe('object allocation reconciliation', () => {
    it('reconciles when total allocation is within tolerance of estimated cost', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const objectA = {
        ...createEmptyIssueObject('obj-a'),
        objectCategory: 'capital-expenditure' as const,
        estimatedCost: '60000000',
        amountFromNetProceeds: '60000000',
      };
      const objectB = {
        ...createEmptyIssueObject('obj-b'),
        objectCategory: 'general-corporate-purposes' as const,
        estimatedCost: '30000000',
        amountFromNetProceeds: '30000000',
      };
      const payload: ObjectsOfIssuePayload = {
        ...empty,
        proceedsAndFundingSummary: {
          ...empty.proceedsAndFundingSummary,
          declaredOfferType: 'fresh-issue',
          freshIssueGrossProceeds: '100000000',
        },
        objectsRegisterAndAllocation: {
          ...empty.objectsRegisterAndAllocation,
          objects: [objectA, objectB],
        },
      };
      const model = computeObjectsOfIssueModel(payload, createEmptyIpoSetupReference());
      expect(model.totalEstimatedObjectsCost).toBe('90000000');
      expect(model.totalAllocatedFromAllSources).toBe('90000000');
      expect(model.allocationReconciles).toBe(true);
      const check = model.reconciliation.find((c) => c.id === 'allocation-reconciles');
      expect(check?.status).toBe('reconciled');
    });

    it('flags a variance when allocation materially differs from estimated cost', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const object = {
        ...createEmptyIssueObject('obj-a'),
        objectCategory: 'capital-expenditure' as const,
        estimatedCost: '100000000',
        amountFromNetProceeds: '10000000',
      };
      const payload: ObjectsOfIssuePayload = {
        ...empty,
        proceedsAndFundingSummary: {
          ...empty.proceedsAndFundingSummary,
          declaredOfferType: 'fresh-issue',
          freshIssueGrossProceeds: '100000000',
        },
        objectsRegisterAndAllocation: {
          ...empty.objectsRegisterAndAllocation,
          objects: [object],
        },
      };
      const model = computeObjectsOfIssueModel(payload, createEmptyIpoSetupReference());
      expect(model.allocationReconciles).toBe(false);
      const check = model.reconciliation.find((c) => c.id === 'allocation-reconciles');
      expect(check?.status).toBe('variance');
    });
  });

  describe('GCP cap', () => {
    it('is versioned and applies the lower of the percentage and absolute caps', () => {
      expect(GCP_RULE_VERSION).toBe(1);
      expect(GCP_PERCENT_OF_FRESH_PROCEEDS).toBe('15');
      expect(GCP_ABSOLUTE_CAP_RUPEES).toBe('100000000');

      const smallIssue = calculateGcpCap('10000000');
      expect(smallIssue.percentCap).toBe('1500000');
      expect(smallIssue.applicableCap).toBe('1500000');
      expect(smallIssue.ruleVersion).toBe(1);

      const largeIssue = calculateGcpCap('10000000000');
      expect(largeIssue.percentCap).toBe('1500000000');
      expect(largeIssue.applicableCap).toBe('100000000');
    });
  });

  describe('assessment', () => {
    it('never returns approved/compliant/investment-quality language', () => {
      const assessment = assessObjectsOfIssue(createEmptyObjectsOfIssuePayload());
      expect(assessment.resultLabel.toLowerCase()).not.toMatch(
        /approved|compliant|investment|strong|weak/,
      );
      expect(assessment.summary.toLowerCase()).not.toMatch(/approved|compliant|investment-quality/);
    });

    it('flags a related-party loan repayment as blocked', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const relatedPartyLoan = {
        id: 'loan-1',
        lenderName: 'Promoter Finance Pvt Ltd',
        loanType: 'unsecured-loan' as const,
        outstandingAmount: '5000000',
        amountProposedForRepayment: '5000000',
        interestRatePercentage: '',
        isRelatedPartyLender: 'yes' as const,
        repaymentRationale: '',
        notes: '',
      };
      const payload: ObjectsOfIssuePayload = {
        ...empty,
        workingCapitalAndBorrowingRepayment: {
          ...empty.workingCapitalAndBorrowingRepayment,
          borrowingRepaymentItems: [relatedPartyLoan],
        },
      };
      const assessment = assessObjectsOfIssue(payload);
      const flagged = assessment.criteria.find((c) => c.id === 'related-party-repayment');
      expect(flagged?.state).toBe('blocked');
    });

    it('groups assessment criteria into seven thematic categories', () => {
      const assessment = assessObjectsOfIssue(createEmptyObjectsOfIssuePayload());
      for (const group of OBJECTS_ASSESSMENT_GROUPS) {
        expect(assessment.groups.some((g) => g.group === group)).toBe(true);
      }
      expect(OBJECTS_ASSESSMENT_GROUPS.length).toBe(7);
    });
  });

  describe('progress', () => {
    it('marks sections not_started when empty and in_progress when partial', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const progress = calculateObjectsOfIssueProgress(empty);
      expect(progress.sections['proceeds-and-funding-summary']).toBe('not_started');
      expect(progress.sectionsComplete).toBe(0);
      expect(progress.totalSections).toBe(7);

      const partial: ObjectsOfIssuePayload = {
        ...empty,
        proceedsAndFundingSummary: {
          ...empty.proceedsAndFundingSummary,
          declaredOfferType: 'fresh-issue',
        },
      };
      expect(
        calculateObjectsOfIssueProgress(partial).sections['proceeds-and-funding-summary'],
      ).toBe('in_progress');
    });

    it('stays not_started for capex, working capital and means of finance when nothing is entered', () => {
      const empty = createEmptyObjectsOfIssuePayload();
      const progress = calculateObjectsOfIssueProgress(empty);
      expect(progress.sections['capital-expenditure-facilities-and-expansion']).toBe(
        'not_started',
      );
      expect(progress.sections['working-capital-and-borrowing-repayment']).toBe('not_started');
      expect(progress.sections['means-of-finance-and-deployment-schedule']).toBe('not_started');
    });
  });

  it('never writes back to Company & Incorporation or IPO Setup & Eligibility', () => {
    const linked = createEmptyLinkedWorkstreamReferences();
    expect(linked.company.available).toBe(false);
    expect(linked.businessOperations.available).toBe(false);
    const ipoRef = createEmptyIpoSetupReference();
    expect(ipoRef.available).toBe(false);
  });
});
