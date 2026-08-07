import { describe, expect, it } from 'vitest';
import {
  addDecimals,
  assessLitigationApprovalsCompliance,
  buildOverviewSummary,
  calculateLitigationApprovalsComplianceProgress,
  computeLitigationApprovalsComplianceModel,
  countApprovalReferences,
  countMatterReferences,
  createEmptyApprovalRecord,
  createEmptyLinkedWorkstreamReferences,
  createEmptyLitigationApprovalsCompliancePayload,
  createEmptyMatterRecord,
  createEmptyRegulatoryActionRecord,
  daysBetweenDates,
  isTaxMatter,
  LAC_CRITERION_STATES,
  LAC_SECTION_IDS,
  litigationApprovalsCompliancePayloadSchema,
  SECTION_PAYLOAD_KEYS,
  subtractDecimals,
} from '@/lib/litigation-approvals-compliance';

describe('Litigation, Approvals & Compliance foundation (LAC1)', () => {
  it('parses empty payload with schemaVersion 1', () => {
    const empty = createEmptyLitigationApprovalsCompliancePayload();
    expect(empty.schemaVersion).toBe(1);
    expect(litigationApprovalsCompliancePayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('defines eight section IDs mapped to payload keys', () => {
    expect(LAC_SECTION_IDS).toHaveLength(8);
    expect(Object.keys(SECTION_PAYLOAD_KEYS)).toHaveLength(8);
    for (const sectionId of LAC_SECTION_IDS) {
      expect(SECTION_PAYLOAD_KEYS[sectionId]).toBeTruthy();
    }
  });

  it('assigns stable IDs to repeatable matter and approval records', () => {
    const matter = createEmptyMatterRecord();
    const matter2 = createEmptyMatterRecord();
    const approval = createEmptyApprovalRecord();
    const approval2 = createEmptyApprovalRecord();
    expect(matter.matterId).not.toBe(matter2.matterId);
    expect(approval.approvalId).not.toBe(approval2.approvalId);
  });

  it('tracks matter references for deletion protection', () => {
    const payload = createEmptyLitigationApprovalsCompliancePayload();
    const matter = createEmptyMatterRecord();
    matter.identity.matterTitle = 'SEBI show-cause notice';
    payload.litigationAndProceedingsMaster.matters = [matter];

    const action = createEmptyRegulatoryActionRecord();
    action.matterId = matter.matterId;
    payload.criminalRegulatoryTaxAndEnforcementReadiness.regulatoryActions = [action];

    const deps = countMatterReferences(payload, matter.matterId);
    expect(deps.length).toBeGreaterThan(0);
  });

  it('tracks approval references for deletion protection', () => {
    const payload = createEmptyLitigationApprovalsCompliancePayload();
    const approval = createEmptyApprovalRecord();
    approval.identity.approvalLicenceName = 'Factory licence';
    payload.governmentRegulatoryAndBusinessApprovalsMaster.approvals = [approval];

    payload.approvalConditionsFacilityComplianceAndRenewalReadiness.approvalConditions = [
      {
        conditionId: crypto.randomUUID(),
        approvalId: approval.approvalId,
        condition: 'Quarterly effluent report',
        category: 'environmental-standard',
        frequency: 'Quarterly',
        dueDate: '2025-06-30',
        lastCompletedDate: '',
        complianceStatus: 'pending',
        evidenceReference: '',
        responsibleOwner: '',
        remediation: '',
        targetCompletionDate: '',
        professionalReview: '',
        notes: '',
      },
    ];

    const deps = countApprovalReferences(payload, approval.approvalId);
    expect(deps.length).toBeGreaterThan(0);
  });

  it('calculates decimal totals and statutory due delay days', () => {
    expect(addDecimals('100', '50.5')).toBe('150.5');
    expect(subtractDecimals('100', '40')).toBe('60');
    expect(daysBetweenDates('2025-01-01', '2025-01-11')).toBe(10);
  });

  it('identifies tax matters and aggregates exposure by category', () => {
    const payload = createEmptyLitigationApprovalsCompliancePayload();
    const matter = createEmptyMatterRecord();
    matter.identity.category = 'tax';
    matter.amounts.totalQuantifiedAmount = '250000';
    matter.amounts.currency = 'INR';
    payload.litigationAndProceedingsMaster.matters = [matter];

    expect(isTaxMatter(matter)).toBe(true);

    const model = computeLitigationApprovalsComplianceModel(
      payload,
      createEmptyLinkedWorkstreamReferences(),
    );
    expect(model.mattersByCategory.find((entry) => entry.category === 'tax')?.count).toBe(1);
    expect(model.exposureByCurrency[0]?.totalExposure).toBe('250000');
  });

  it('derives progress, assessment states and overview without throwing', () => {
    const payload = createEmptyLitigationApprovalsCompliancePayload();
    const linked = createEmptyLinkedWorkstreamReferences();
    const progress = calculateLitigationApprovalsComplianceProgress(payload);
    expect(progress.totalSections).toBe(8);
    expect(progress.overallStatus).toBe('not_started');

    const assessment = assessLitigationApprovalsCompliance(payload, linked);
    expect(assessment.criteria.length).toBeGreaterThan(0);
    expect(assessment.result).toBeTruthy();
    expect(LAC_CRITERION_STATES.length).toBeGreaterThan(10);

    const overview = buildOverviewSummary(payload, linked);
    expect(overview.matterCount).toBe(0);
    expect(overview.approvalCount).toBe(0);
  });
});
