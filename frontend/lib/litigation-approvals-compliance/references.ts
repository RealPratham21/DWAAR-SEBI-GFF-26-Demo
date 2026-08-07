/**
 * Cross-record reference integrity for Litigation, Approvals & Compliance.
 */

import { formatApprovalLabel, getApprovalById } from '@/lib/litigation-approvals-compliance/approvals';
import { formatMatterLabel, getMatterById } from '@/lib/litigation-approvals-compliance/matters';
import { LAC_SECTION_LABELS } from '@/lib/litigation-approvals-compliance/options';
import type { LacDependency, LacDependencyCategory } from '@/lib/litigation-approvals-compliance/types';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

function push(
  deps: LacDependency[],
  category: LacDependencyCategory,
  recordId: string,
  sectionId: LitigationApprovalsComplianceSectionId,
  label: string,
) {
  deps.push({ category, recordId, sectionId, label });
}

export function countMatterReferences(
  payload: LitigationApprovalsCompliancePayload,
  matterId: string,
): LacDependency[] {
  if (!matterId) return [];
  const deps: LacDependency[] = [];

  const section3 = payload.criminalRegulatoryTaxAndEnforcementReadiness;
  for (const screening of section3.criminalScreenings) {
    if (screening.linkedMatterIds.includes(matterId)) {
      push(
        deps,
        'criminal-screening',
        screening.legalPartyReviewId,
        'criminal-regulatory-tax-and-enforcement-readiness',
        'Criminal screening → Matter',
      );
    }
  }

  for (const action of section3.regulatoryActions) {
    if (action.matterId === matterId) {
      push(
        deps,
        'regulatory-action',
        action.regulatoryActionId,
        'criminal-regulatory-tax-and-enforcement-readiness',
        'Regulatory action → Matter',
      );
    }
  }

  for (const screening of section3.sebiExchangeScreenings) {
    if (screening.linkedMatterId === matterId) {
      push(
        deps,
        'sebi-exchange-screening',
        screening.legalPartyReviewId,
        'criminal-regulatory-tax-and-enforcement-readiness',
        'SEBI/exchange screening → Matter',
      );
    }
  }

  for (const tax of section3.taxProceedingDetails) {
    if (tax.matterId === matterId) {
      push(
        deps,
        'tax-proceeding',
        tax.matterId,
        'criminal-regulatory-tax-and-enforcement-readiness',
        'Tax proceeding detail → Matter',
      );
    }
  }

  const section6 = payload.corporateStatutoryAndOperationalComplianceExceptions;
  for (const issue of section6.complianceIssues) {
    if (issue.linkedMatterId === matterId) {
      push(
        deps,
        'compliance-issue',
        issue.complianceIssueId,
        'corporate-statutory-and-operational-compliance-exceptions',
        'Compliance issue → Matter',
      );
    }
  }

  for (const due of section6.statutoryDues) {
    if (due.linkedTaxMatterId === matterId) {
      push(
        deps,
        'statutory-due',
        due.statutoryDueId,
        'corporate-statutory-and-operational-compliance-exceptions',
        'Statutory due → Tax matter',
      );
    }
  }

  const section7 = payload.materialCreditorsPenaltiesAndMaterialDevelopments;
  for (const creditor of section7.materialCreditors) {
    if (creditor.linkedMatterId === matterId) {
      push(
        deps,
        'material-creditor',
        creditor.creditorId,
        'material-creditors-penalties-and-material-developments',
        'Material creditor → Matter',
      );
    }
  }

  for (const penalty of section7.historicalPenalties) {
    if (penalty.linkedMatterId === matterId) {
      push(
        deps,
        'historical-penalty',
        penalty.penaltyId,
        'material-creditors-penalties-and-material-developments',
        'Historical penalty → Matter',
      );
    }
  }

  for (const development of section7.materialDevelopments) {
    if (
      development.category === 'litigation' ||
      development.category === 'regulatory-action' ||
      development.category === 'tax'
    ) {
      if (development.linkedRecordId === matterId) {
        push(
          deps,
          'material-development',
          development.developmentId,
          'material-creditors-penalties-and-material-developments',
          'Material development → Matter',
        );
      }
    }
  }

  for (const action of payload.reconciliationRemediationAndIssuerConfirmations.remediationActions) {
    if (action.linkedRecordType === 'matter' && action.linkedRecordId === matterId) {
      push(
        deps,
        'remediation-action',
        action.remediationActionId,
        'reconciliation-remediation-and-issuer-confirmations',
        'Remediation action → Matter',
      );
    }
    if (action.linkedRecordType === 'regulatory-action') {
      const linked = section3.regulatoryActions.find(
        (record) => record.regulatoryActionId === action.linkedRecordId,
      );
      if (linked?.matterId === matterId) {
        push(
          deps,
          'remediation-action',
          action.remediationActionId,
          'reconciliation-remediation-and-issuer-confirmations',
          'Remediation action → Regulatory action → Matter',
        );
      }
    }
  }

  return deps;
}

export function countApprovalReferences(
  payload: LitigationApprovalsCompliancePayload,
  approvalId: string,
): LacDependency[] {
  if (!approvalId) return [];
  const deps: LacDependency[] = [];

  const section5 = payload.approvalConditionsFacilityComplianceAndRenewalReadiness;

  for (const condition of section5.approvalConditions) {
    if (condition.approvalId === approvalId) {
      push(
        deps,
        'approval-condition',
        condition.conditionId,
        'approval-conditions-facility-compliance-and-renewal-readiness',
        'Approval condition → Approval',
      );
    }
  }

  for (const review of section5.facilityApprovalReviews) {
    if (review.linkedApprovalIds.includes(approvalId)) {
      push(
        deps,
        'facility-approval-review',
        review.facilityApprovalReviewId,
        'approval-conditions-facility-compliance-and-renewal-readiness',
        'Facility approval review → Approval',
      );
    }
  }

  for (const requirement of section5.projectApprovalRequirements) {
    if (requirement.linkedApprovalId === approvalId) {
      push(
        deps,
        'project-approval-requirement',
        requirement.projectApprovalRequirementId,
        'approval-conditions-facility-compliance-and-renewal-readiness',
        'Project approval requirement → Approval',
      );
    }
  }

  for (const matter of payload.litigationAndProceedingsMaster.matters) {
    if (matter.subjectMatter.linkedApprovalId === approvalId) {
      push(
        deps,
        'matter-subject-link',
        matter.matterId,
        'litigation-and-proceedings-master',
        'Matter → Approval',
      );
    }
  }

  for (const development of payload.materialCreditorsPenaltiesAndMaterialDevelopments
    .materialDevelopments) {
    if (development.category === 'approval' && development.linkedRecordId === approvalId) {
      push(
        deps,
        'material-development',
        development.developmentId,
        'material-creditors-penalties-and-material-developments',
        'Material development → Approval',
      );
    }
  }

  for (const action of payload.reconciliationRemediationAndIssuerConfirmations.remediationActions) {
    if (
      (action.linkedRecordType === 'approval' ||
        action.linkedRecordType === 'approval-condition') &&
      (action.linkedRecordId === approvalId ||
        section5.approvalConditions.some(
          (condition) =>
            condition.conditionId === action.linkedRecordId &&
            condition.approvalId === approvalId,
        ))
    ) {
      push(
        deps,
        'remediation-action',
        action.remediationActionId,
        'reconciliation-remediation-and-issuer-confirmations',
        'Remediation action → Approval',
      );
    }
  }

  return deps;
}

export function formatMatterDependencyMessage(
  payload: LitigationApprovalsCompliancePayload,
  matterId: string,
  deps: LacDependency[],
): string {
  if (deps.length === 0) return '';
  const matter = getMatterById(payload, matterId);
  const label = formatMatterLabel(matter, matterId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => LAC_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}

export function formatApprovalDependencyMessage(
  payload: LitigationApprovalsCompliancePayload,
  approvalId: string,
  deps: LacDependency[],
): string {
  if (deps.length === 0) return '';
  const approval = getApprovalById(payload, approvalId);
  const label = formatApprovalLabel(approval, approvalId);
  const categories = [...new Set(deps.map((dep) => dep.label))];
  const sections = [...new Set(deps.map((dep) => LAC_SECTION_LABELS[dep.sectionId]))];
  return `"${label}" is referenced by ${deps.length} record(s) (${categories.join(', ')}) across: ${sections.join(', ')}. Remove or reassign dependent records first.`;
}
