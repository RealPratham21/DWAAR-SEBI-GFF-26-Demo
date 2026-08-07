/**
 * Overview summary derived from the in-memory Litigation, Approvals & Compliance draft (LAC1).
 */

import {
  assessLitigationApprovalsCompliance,
  type LacAssessmentResponse,
} from '@/lib/litigation-approvals-compliance/assessment';
import {
  computeLitigationApprovalsComplianceModel,
  type LitigationApprovalsComplianceModel,
} from '@/lib/litigation-approvals-compliance/compute';
import { LAC_SECTION_LABELS } from '@/lib/litigation-approvals-compliance/options';
import { calculateLitigationApprovalsComplianceProgress } from '@/lib/litigation-approvals-compliance/progress';
import {
  createEmptyLinkedWorkstreamReferences,
  type LacProgress,
  type LinkedWorkstreamReferences,
} from '@/lib/litigation-approvals-compliance/types';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

export type LitigationApprovalsComplianceOverviewSummary = {
  sectionStatuses: LacProgress['sections'];
  sectionsComplete: number;
  sectionsInProgress: number;
  totalSections: number;
  overallStatus: LacProgress['overallStatus'];
  legalDdAsOfDate: string;
  matterCount: number;
  criminalMatterCount: number;
  taxMatterCount: number;
  pendingOutcomeCount: number;
  primaryExposure: string;
  taxAggregateDemand: string;
  approvalCount: number;
  expiredApprovalCount: number;
  renewalPendingCount: number;
  approvalsExpiringWithin30Days: number;
  approvalsExpiringWithin90Days: number;
  complianceIssueCount: number;
  delayedStatutoryDues: number;
  approvalConditionsOutstanding: number;
  materialCreditorCount: number;
  msmeCreditorCount: number;
  creditorAggregateOutstanding: string;
  materialDevelopmentCount: number;
  remediationOpenCount: number;
  financialsReconciliationStatus: string;
  groupEntitiesReconciliationStatus: string;
  managementGovernanceReconciliationStatus: string;
  bacReconciliationStatus: string;
  businessOperationsReconciliationStatus: string;
  objectsReconciliationStatus: string;
  ipoSetupReconciliationStatus: string;
  assessmentConcerns: number;
  pendingProfessionalReviewItems: number;
  assessmentResult: LacAssessmentResponse['result'];
  assessmentResultLabel: string;
  assessmentSummary: string;
  recommendedNextActions: Array<{ sectionId: LitigationApprovalsComplianceSectionId; label: string }>;
};

export function buildOverviewSummary(
  payload: LitigationApprovalsCompliancePayload,
  linkedReferences: LinkedWorkstreamReferences = createEmptyLinkedWorkstreamReferences(),
): LitigationApprovalsComplianceOverviewSummary {
  const progress = calculateLitigationApprovalsComplianceProgress(payload);
  const model = computeLitigationApprovalsComplianceModel(payload, linkedReferences);
  const assessment = assessLitigationApprovalsCompliance(payload, linkedReferences);
  const primaryExposure = model.exposureByCurrency[0]?.totalExposure ?? '';

  const sectionsInProgress = Object.values(progress.sections).filter(
    (status) => status === 'in_progress',
  ).length;

  const incompleteSections = (
    Object.entries(progress.sections) as Array<
      [
        LitigationApprovalsComplianceSectionId,
        LacProgress['sections'][LitigationApprovalsComplianceSectionId],
      ]
    >
  ).filter(([, status]) => status !== 'complete');

  const recommendedNextActions = incompleteSections.slice(0, 4).map(([sectionId]) => ({
    sectionId,
    label: `Continue with ${LAC_SECTION_LABELS[sectionId]}`,
  }));

  const assessmentConcerns =
    assessment.counts.potentialConcern +
    assessment.counts.materialityReviewRequired +
    assessment.counts.approvalRenewalReviewRequired +
    assessment.counts.complianceReviewRequired +
    assessment.counts.pendingLegalReview +
    assessment.counts.financialReconciliationPending;

  const pendingProfessionalReviewItems =
    assessment.counts.pendingProfessionalConfirmation +
    assessment.counts.pendingBoardDetermination;

  return {
    sectionStatuses: progress.sections,
    sectionsComplete: progress.sectionsComplete,
    sectionsInProgress,
    totalSections: progress.totalSections,
    overallStatus: progress.overallStatus,
    legalDdAsOfDate: model.legalDdAsOfDate,
    matterCount: model.matterCount,
    criminalMatterCount: model.criminalMatterCount,
    taxMatterCount: model.taxMatterCount,
    pendingOutcomeCount: model.pendingOutcomeCount,
    primaryExposure,
    taxAggregateDemand: model.taxAggregates.totalDemand,
    approvalCount: model.approvalCount,
    expiredApprovalCount: model.expiredApprovalCount,
    renewalPendingCount: model.renewalPendingCount,
    approvalsExpiringWithin30Days: model.approvalExpiryWindows.within30Days.length,
    approvalsExpiringWithin90Days: model.approvalExpiryWindows.within90Days.length,
    complianceIssueCount: model.complianceCounts.complianceIssueCount,
    delayedStatutoryDues: model.complianceCounts.delayedStatutoryDues,
    approvalConditionsOutstanding: model.complianceCounts.approvalConditionsOutstanding,
    materialCreditorCount: model.creditorTotals.materialCreditorCount,
    msmeCreditorCount: model.creditorTotals.msmeCreditorCount,
    creditorAggregateOutstanding: model.creditorTotals.aggregateOutstanding,
    materialDevelopmentCount:
      payload.materialCreditorsPenaltiesAndMaterialDevelopments.materialDevelopments.length,
    remediationOpenCount: model.remediationOpenCount,
    financialsReconciliationStatus: model.reconciliation.financials.status,
    groupEntitiesReconciliationStatus: model.reconciliation.groupEntities.status,
    managementGovernanceReconciliationStatus: model.reconciliation.managementGovernance.status,
    bacReconciliationStatus: model.reconciliation.bac.status,
    businessOperationsReconciliationStatus: model.reconciliation.businessOperations.status,
    objectsReconciliationStatus: model.reconciliation.objectsOfIssue.status,
    ipoSetupReconciliationStatus: model.reconciliation.ipoSetup.status,
    assessmentConcerns,
    pendingProfessionalReviewItems,
    assessmentResult: assessment.result,
    assessmentResultLabel: assessment.resultLabel,
    assessmentSummary: assessment.summary,
    recommendedNextActions,
  };
}

export type { LitigationApprovalsComplianceModel };
