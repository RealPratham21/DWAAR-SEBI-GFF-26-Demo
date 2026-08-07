/**
 * Section completion for Litigation, Approvals & Compliance.
 */

import { isFilledDecimal } from '@/lib/litigation-approvals-compliance/decimal';
import { LAC_CONFIRMATION_FIELDS } from '@/lib/litigation-approvals-compliance/options';
import type {
  LacProgress,
  LitigationApprovalsComplianceSectionId,
  SectionStatus,
} from '@/lib/litigation-approvals-compliance/types';
import type { LitigationApprovalsCompliancePayload } from '@/lib/schemas/litigation-approvals-compliance';

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function statusFrom(answered: number, total: number, extraComplete = true): SectionStatus {
  if (answered === 0) return 'not_started';
  if (answered < total || !extraComplete) return 'in_progress';
  return 'complete';
}

export function evaluateLegalUniverseStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const section = payload.legalUniverseMaterialityPolicyAndPartyMapping;
  const snapshot = section.legalDdSnapshot;
  const core = [
    filled(snapshot.legalDdAsOfDate),
    filled(snapshot.litigationExists),
    section.legalPartyReviews.length > 0,
    filled(section.litigationMaterialityPolicy.policyExists),
  ];
  const answered = core.filter(Boolean).length;
  const partiesComplete = section.legalPartyReviews.every(
    (party) => filled(party.displayName) || filled(party.partyCategory),
  );
  return statusFrom(answered, core.length, partiesComplete);
}

export function evaluateLitigationMasterStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const matters = payload.litigationAndProceedingsMaster.matters;
  if (matters.length === 0) return 'not_started';
  const complete = matters.every(
    (matter) =>
      filled(matter.identity.matterTitle) ||
      filled(matter.identity.caseReferenceNumber) ||
      filled(matter.identity.category),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateCriminalRegulatoryTaxStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const section = payload.criminalRegulatoryTaxAndEnforcementReadiness;
  const hasData =
    section.criminalScreenings.length > 0 ||
    section.regulatoryActions.length > 0 ||
    section.sebiExchangeScreenings.length > 0 ||
    section.taxProceedingDetails.length > 0;
  if (!hasData) return 'not_started';

  const actionsComplete = section.regulatoryActions.every(
    (action) => filled(action.authority) || filled(action.actionType),
  );
  const taxComplete = section.taxProceedingDetails.every(
    (detail) => filled(detail.matterId) || filled(detail.taxType),
  );
  return actionsComplete && taxComplete ? 'complete' : 'in_progress';
}

export function evaluateApprovalsMasterStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const approvals = payload.governmentRegulatoryAndBusinessApprovalsMaster.approvals;
  if (approvals.length === 0) return 'not_started';
  const complete = approvals.every(
    (approval) =>
      filled(approval.identity.approvalLicenceName) || filled(approval.identity.category),
  );
  return complete ? 'complete' : 'in_progress';
}

export function evaluateApprovalConditionsStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const section = payload.approvalConditionsFacilityComplianceAndRenewalReadiness;
  const hasData =
    section.approvalConditions.length > 0 ||
    section.facilityApprovalReviews.length > 0 ||
    section.projectApprovalRequirements.length > 0;
  if (!hasData) return 'not_started';

  const conditionsComplete = section.approvalConditions.every(
    (condition) => filled(condition.approvalId) && filled(condition.condition),
  );
  return conditionsComplete ? 'complete' : 'in_progress';
}

export function evaluateComplianceExceptionsStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const section = payload.corporateStatutoryAndOperationalComplianceExceptions;
  const hasData =
    section.complianceDomainReviews.length > 0 ||
    section.complianceIssues.length > 0 ||
    section.statutoryDues.length > 0;
  if (!hasData) return 'not_started';

  const issuesComplete = section.complianceIssues.every(
    (issue) => filled(issue.domain) || filled(issue.obligation),
  );
  return issuesComplete ? 'complete' : 'in_progress';
}

export function evaluateCreditorsPenaltiesDevelopmentsStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const section = payload.materialCreditorsPenaltiesAndMaterialDevelopments;
  const hasData =
    section.materialCreditors.length > 0 ||
    section.historicalPenalties.length > 0 ||
    section.materialDevelopments.length > 0 ||
    filled(section.materialCreditorPolicy.policyExists);
  if (!hasData) return 'not_started';

  const creditorsComplete = section.materialCreditors.every(
    (creditor) =>
      filled(creditor.creditorName) || isFilledDecimal(creditor.amountOutstanding),
  );
  return creditorsComplete ? 'complete' : 'in_progress';
}

export function evaluateReconciliationConfirmationsStatus(
  payload: LitigationApprovalsCompliancePayload,
): SectionStatus {
  const confirmations = payload.reconciliationRemediationAndIssuerConfirmations.confirmations;
  const answered = LAC_CONFIRMATION_FIELDS.filter((field) => confirmations[field.key] !== '').length;
  if (answered === 0) return 'not_started';
  if (answered < LAC_CONFIRMATION_FIELDS.length) return 'in_progress';
  return 'complete';
}

const SECTION_EVALUATORS: Record<
  LitigationApprovalsComplianceSectionId,
  (payload: LitigationApprovalsCompliancePayload) => SectionStatus
> = {
  'legal-universe-materiality-policy-and-party-mapping': evaluateLegalUniverseStatus,
  'litigation-and-proceedings-master': evaluateLitigationMasterStatus,
  'criminal-regulatory-tax-and-enforcement-readiness': evaluateCriminalRegulatoryTaxStatus,
  'government-regulatory-and-business-approvals-master': evaluateApprovalsMasterStatus,
  'approval-conditions-facility-compliance-and-renewal-readiness':
    evaluateApprovalConditionsStatus,
  'corporate-statutory-and-operational-compliance-exceptions':
    evaluateComplianceExceptionsStatus,
  'material-creditors-penalties-and-material-developments':
    evaluateCreditorsPenaltiesDevelopmentsStatus,
  'reconciliation-remediation-and-issuer-confirmations':
    evaluateReconciliationConfirmationsStatus,
};

export function calculateLitigationApprovalsComplianceProgress(
  payload: LitigationApprovalsCompliancePayload,
): LacProgress {
  const sections = Object.fromEntries(
    (Object.keys(SECTION_EVALUATORS) as LitigationApprovalsComplianceSectionId[]).map(
      (sectionId) => [sectionId, SECTION_EVALUATORS[sectionId](payload)],
    ),
  ) as LacProgress['sections'];

  const sectionsComplete = Object.values(sections).filter((status) => status === 'complete').length;
  const overallStatus: SectionStatus =
    sectionsComplete === 0
      ? 'not_started'
      : sectionsComplete === Object.keys(sections).length
        ? 'complete'
        : 'in_progress';

  return {
    sections,
    sectionsComplete,
    totalSections: Object.keys(sections).length,
    overallStatus,
  };
}
