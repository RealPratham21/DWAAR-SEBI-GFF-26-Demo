/**
 * UI option arrays and label maps for Litigation, Approvals & Compliance.
 */

import {
  APPROVAL_CATEGORY_VALUES,
  APPROVAL_CONDITION_CATEGORY_VALUES,
  APPROVAL_HOLDER_TYPE_VALUES,
  APPROVAL_STATUS_VALUES,
  COMPLIANCE_DOMAIN_VALUES,
  COMPLIANCE_ISSUE_TYPE_VALUES,
  CONDITION_COMPLIANCE_STATUS_VALUES,
  CONTINUATION_PENDING_RENEWAL_VALUES,
  CURRENT_HISTORICAL_VALUES,
  FORUM_CATEGORY_VALUES,
  ISSUE_IDENTIFIED_BY_VALUES,
  LEGAL_PARTY_CATEGORY_VALUES,
  MATTER_CATEGORY_VALUES,
  MATTER_DIRECTION_VALUES,
  MATTER_MATERIALITY_STATE_VALUES,
  MATTER_OUTCOME_STATUS_VALUES,
  MATTER_PARTY_ROLE_VALUES,
  MATERIALITY_METRIC_TYPE_VALUES,
  MATERIAL_CREDITOR_THRESHOLD_TYPE_VALUES,
  MATERIAL_DEVELOPMENT_CATEGORY_VALUES,
  PROCEEDING_STAGE_VALUES,
  PROFESSIONAL_CONFIRMATION_STATUS_VALUES,
  QUALITATIVE_CRITERION_TYPE_VALUES,
  READINESS_STATE_VALUES,
  RECONCILIATION_STATUS_VALUES,
  REGULATORY_ACTION_TYPE_VALUES,
  REMEDIATION_LINKED_RECORD_TYPE_VALUES,
  REMEDIATION_PRIORITY_VALUES,
  REMEDIATION_STATUS_VALUES,
  REQUIRED_BEFORE_VALUES,
  STANDALONE_CONSOLIDATED_VALUES,
  STATUTORY_DUE_TYPE_VALUES,
  TAX_TYPE_VALUES,
  YES_NO_NOT_SURE_VALUES,
  type LacConfirmations,
  type LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

export type SelectOption = { value: string; label: string };

function toOptions(values: readonly string[], labels?: Record<string, string>): SelectOption[] {
  return values.map((value) => ({
    value,
    label: labels?.[value] ?? value.replaceAll('-', ' ').replaceAll('_', ' '),
  }));
}

export const LAC_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'legal-compliance-assessment', label: 'Legal & Compliance Assessment' },
] as const;

export type LitigationApprovalsComplianceTabId = (typeof LAC_TABS)[number]['id'];

export const LAC_INFORMATION_SECTIONS: Array<{
  id: LitigationApprovalsComplianceSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'legal-universe-materiality-policy-and-party-mapping',
    label: 'Legal Universe, Materiality Policy & Party Mapping',
    description: 'Legal DD snapshot, party review register and board-approved materiality policy.',
  },
  {
    id: 'litigation-and-proceedings-master',
    label: 'Litigation & Proceedings Master',
    description: 'Canonical Matter Master for civil, criminal, regulatory and other proceedings.',
  },
  {
    id: 'criminal-regulatory-tax-and-enforcement-readiness',
    label: 'Criminal, Regulatory, Tax & Enforcement Readiness',
    description: 'Criminal screening, regulatory actions, SEBI/exchange actions and tax proceedings.',
  },
  {
    id: 'government-regulatory-and-business-approvals-master',
    label: 'Government, Regulatory & Business Approvals Master',
    description: 'Canonical Approval Master for licences, registrations and business approvals.',
  },
  {
    id: 'approval-conditions-facility-compliance-and-renewal-readiness',
    label: 'Approval Conditions, Facility Compliance & Renewal Readiness',
    description: 'Approval conditions, facility/project approval matrix and renewal tracking.',
  },
  {
    id: 'corporate-statutory-and-operational-compliance-exceptions',
    label: 'Corporate, Statutory & Operational Compliance Exceptions',
    description: 'Compliance domain reviews, exceptions register and statutory due delays.',
  },
  {
    id: 'material-creditors-penalties-and-material-developments',
    label: 'Material Creditors, Penalties & Material Developments',
    description: 'Material creditor policy, MSME dues, historical penalties and post-balance-sheet developments.',
  },
  {
    id: 'reconciliation-remediation-and-issuer-confirmations',
    label: 'Reconciliation, Remediation & Issuer Confirmations',
    description: 'Cross-workstream reconciliation, remediation actions and issuer confirmations.',
  },
];

export const LAC_SECTION_LABELS: Record<LitigationApprovalsComplianceSectionId, string> =
  Object.fromEntries(
    LAC_INFORMATION_SECTIONS.map((section) => [section.id, section.label]),
  ) as Record<LitigationApprovalsComplianceSectionId, string>;

export const SESSION_SAVE_NOTICE_LAC1 =
  'Your section updates are saved for this session. Permanent saving will be connected in the next increment.';

export const YES_NO_NOT_SURE_OPTIONS = toOptions(YES_NO_NOT_SURE_VALUES, {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
});

export const LEGAL_PARTY_CATEGORY_OPTIONS = toOptions(LEGAL_PARTY_CATEGORY_VALUES);
export const MATTER_CATEGORY_OPTIONS = toOptions(MATTER_CATEGORY_VALUES);
export const MATTER_DIRECTION_OPTIONS = toOptions(MATTER_DIRECTION_VALUES);
export const MATTER_PARTY_ROLE_OPTIONS = toOptions(MATTER_PARTY_ROLE_VALUES);
export const FORUM_CATEGORY_OPTIONS = toOptions(FORUM_CATEGORY_VALUES);
export const PROCEEDING_STAGE_OPTIONS = toOptions(PROCEEDING_STAGE_VALUES);
export const MATTER_OUTCOME_STATUS_OPTIONS = toOptions(MATTER_OUTCOME_STATUS_VALUES);
export const MATTER_MATERIALITY_STATE_OPTIONS = toOptions(MATTER_MATERIALITY_STATE_VALUES);
export const MATERIALITY_METRIC_TYPE_OPTIONS = toOptions(MATERIALITY_METRIC_TYPE_VALUES);
export const QUALITATIVE_CRITERION_TYPE_OPTIONS = toOptions(QUALITATIVE_CRITERION_TYPE_VALUES);
export const STANDALONE_CONSOLIDATED_OPTIONS = toOptions(STANDALONE_CONSOLIDATED_VALUES);
export const CURRENT_HISTORICAL_OPTIONS = toOptions(CURRENT_HISTORICAL_VALUES);
export const READINESS_STATE_OPTIONS = toOptions(READINESS_STATE_VALUES);
export const REGULATORY_ACTION_TYPE_OPTIONS = toOptions(REGULATORY_ACTION_TYPE_VALUES);
export const TAX_TYPE_OPTIONS = toOptions(TAX_TYPE_VALUES);
export const APPROVAL_CATEGORY_OPTIONS = toOptions(APPROVAL_CATEGORY_VALUES);
export const APPROVAL_HOLDER_TYPE_OPTIONS = toOptions(APPROVAL_HOLDER_TYPE_VALUES);
export const APPROVAL_STATUS_OPTIONS = toOptions(APPROVAL_STATUS_VALUES);
export const CONTINUATION_PENDING_RENEWAL_OPTIONS = toOptions(
  CONTINUATION_PENDING_RENEWAL_VALUES,
);
export const APPROVAL_CONDITION_CATEGORY_OPTIONS = toOptions(
  APPROVAL_CONDITION_CATEGORY_VALUES,
);
export const CONDITION_COMPLIANCE_STATUS_OPTIONS = toOptions(CONDITION_COMPLIANCE_STATUS_VALUES);
export const REQUIRED_BEFORE_OPTIONS = toOptions(REQUIRED_BEFORE_VALUES);
export const COMPLIANCE_DOMAIN_OPTIONS = toOptions(COMPLIANCE_DOMAIN_VALUES);
export const COMPLIANCE_ISSUE_TYPE_OPTIONS = toOptions(COMPLIANCE_ISSUE_TYPE_VALUES);
export const ISSUE_IDENTIFIED_BY_OPTIONS = toOptions(ISSUE_IDENTIFIED_BY_VALUES);
export const STATUTORY_DUE_TYPE_OPTIONS = toOptions(STATUTORY_DUE_TYPE_VALUES);
export const MATERIAL_CREDITOR_THRESHOLD_TYPE_OPTIONS = toOptions(
  MATERIAL_CREDITOR_THRESHOLD_TYPE_VALUES,
);
export const MATERIAL_DEVELOPMENT_CATEGORY_OPTIONS = toOptions(
  MATERIAL_DEVELOPMENT_CATEGORY_VALUES,
);
export const REMEDIATION_LINKED_RECORD_TYPE_OPTIONS = toOptions(
  REMEDIATION_LINKED_RECORD_TYPE_VALUES,
);
export const REMEDIATION_PRIORITY_OPTIONS = toOptions(REMEDIATION_PRIORITY_VALUES);
export const REMEDIATION_STATUS_OPTIONS = toOptions(REMEDIATION_STATUS_VALUES);
export const RECONCILIATION_STATUS_OPTIONS = toOptions(RECONCILIATION_STATUS_VALUES);
export const PROFESSIONAL_CONFIRMATION_OPTIONS = toOptions(PROFESSIONAL_CONFIRMATION_STATUS_VALUES);

export const MATTER_OUTCOME_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  MATTER_OUTCOME_STATUS_VALUES.map((value) => [value, value.replaceAll('-', ' ')]),
);

export const APPROVAL_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  APPROVAL_STATUS_VALUES.map((value) => [value, value.replaceAll('-', ' ')]),
);

export const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  reconciled: 'Reconciled',
  'potential-inconsistency': 'Potential inconsistency',
  'missing-information': 'Missing information',
  'pending-linked-workstream': 'Pending linked workstream',
  'pending-professional-confirmation': 'Pending professional confirmation',
};

export const CONDITION_COMPLIANCE_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  CONDITION_COMPLIANCE_STATUS_VALUES.map((value) => [value, value.replaceAll('-', ' ')]),
);

export const LAC_CONFIRMATION_FIELDS: Array<{
  key: keyof LacConfirmations;
  label: string;
}> = [
  {
    key: 'allCriminalProceedingsInvolvingRelevantPartiesDisclosed',
    label: 'All criminal proceedings involving relevant parties are disclosed',
  },
  {
    key: 'firComplaintProsecutionMattersConsidered',
    label: 'FIR/complaint/prosecution matters considered',
  },
  {
    key: 'allMaterialCivilArbitrationProceedingsDisclosed',
    label: 'All material civil/arbitration proceedings disclosed',
  },
  {
    key: 'currentBoardApprovedLitigationMaterialityPolicyCaptured',
    label: 'Current board-approved litigation materiality policy captured',
  },
  {
    key: 'allStatutoryRegulatoryProceedingsDisclosed',
    label: 'All statutory/regulatory proceedings disclosed',
  },
  { key: 'showCauseNoticesConsidered', label: 'Show-cause notices considered' },
  {
    key: 'inspectionsInvestigationsEnquiriesConsidered',
    label: 'Inspections/investigations/enquiries considered',
  },
  {
    key: 'sebiAndStockExchangeActionsDisclosed',
    label: 'SEBI and stock exchange actions disclosed',
  },
  { key: 'taxProceedingsComplete', label: 'Tax proceedings complete' },
  { key: 'directTaxTotalsReconciled', label: 'Direct tax totals reconciled' },
  { key: 'indirectTaxTotalsReconciled', label: 'Indirect tax totals reconciled' },
  {
    key: 'historicalPenaltiesMaterialRegulatoryActionsDisclosed',
    label: 'Historical penalties/material regulatory actions disclosed',
  },
  {
    key: 'materialSubsidiariesGroupCompaniesIncludedInLegalDd',
    label: 'Material subsidiaries/group companies included in legal DD',
  },
  {
    key: 'allMaterialBusinessApprovalsDisclosed',
    label: 'All material business approvals disclosed',
  },
  { key: 'approvalExpiriesAccurate', label: 'Approval expiries accurate' },
  {
    key: 'pendingRenewalApplicationsDisclosed',
    label: 'Pending renewal applications disclosed',
  },
  {
    key: 'requiredButNotAppliedApprovalsDisclosed',
    label: 'Required but not applied approvals disclosed',
  },
  {
    key: 'approvalConditionNonCompliancesDisclosed',
    label: 'Approval condition non-compliances disclosed',
  },
  {
    key: 'materialStatutorySecretarialExceptionsDisclosed',
    label: 'Material statutory/secretarial exceptions disclosed',
  },
  {
    key: 'statutoryDuesDelaysDefaultsDisclosed',
    label: 'Statutory dues delays/defaults disclosed',
  },
  { key: 'materialCreditorsCaptured', label: 'Material creditors captured' },
  { key: 'msmeDuesCaptured', label: 'MSME dues captured' },
  {
    key: 'materialDevelopmentsSinceLatestFinancialsDisclosed',
    label: 'Material developments since latest financials disclosed',
  },
  {
    key: 'postPreparationLegalDevelopmentsWillContinueToBeUpdated',
    label: 'Post-preparation legal developments will continue to be updated',
  },
  {
    key: 'contingentLiabilitiesProvisionsReconciledWithFinancials',
    label: 'Contingent liabilities/provisions reconciled with Financials',
  },
  {
    key: 'borrowingDefaultLegalMattersReconciledWithBac',
    label: 'Borrowing/default legal matters reconciled with BAC',
  },
  {
    key: 'managementLegalDeclarationsReconciled',
    label: 'Management legal declarations reconciled',
  },
  {
    key: 'groupEntityLegalDeclarationsReconciled',
    label: 'Group entity legal declarations reconciled',
  },
  {
    key: 'unresolvedInconsistenciesFlagged',
    label: 'Unresolved inconsistencies flagged',
  },
  {
    key: 'professionalLegalBrlmSecretarialAccountingConfirmationRequired',
    label: 'Professional legal/BRLM/secretarial/accounting confirmation remains required',
  },
];
