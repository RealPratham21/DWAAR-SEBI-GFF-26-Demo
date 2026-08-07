/**
 * UI option arrays and label maps for Intermediaries & Filing.
 */

import {
  ACCOUNT_SETUP_STATUS_VALUES,
  APPOINTMENT_STATUS_VALUES,
  CERTIFICATE_FILED_TO_VALUES,
  CERTIFICATE_STATUS_VALUES,
  CERTIFICATE_TYPE_VALUES,
  CONSENT_PARTY_TYPE_VALUES,
  DUE_DILIGENCE_AREA_VALUES,
  EXCHANGE_QUERY_STATUS_VALUES,
  FILING_AUTHORITY_VALUES,
  FILING_STAGE_VALUES,
  FILING_STATUS_VALUES,
  IF_SECTION_IDS,
  INTERMEDIARY_ROLE_VALUES,
  INVESTOR_CATEGORY_VALUES,
  ISSUE_AGREEMENT_STATUS_VALUES,
  ISSUE_AGREEMENT_TYPE_VALUES,
  ISSUE_BANK_ROLE_VALUES,
  ISIN_STATUS_VALUES,
  OFFER_DOCUMENT_FORM_VALUES,
  PLACEHOLDER_STATUS_VALUES,
  PLACEHOLDER_TYPE_VALUES,
  POST_ISSUE_ACTION_STATUS_VALUES,
  POST_ISSUE_ACTION_TYPE_VALUES,
  PRIMARY_SECONDARY_VALUES,
  PROFESSIONAL_CONFIRMATION_STATUS_VALUES,
  PUBLIC_COMMUNICATION_TYPE_VALUES,
  READINESS_STATE_VALUES,
  RECONCILIATION_STATUS_VALUES,
  REGISTRATION_STATUS_VALUES,
  RESPONSIBILITY_AREA_VALUES,
  YES_NO_NOT_SURE_VALUES,
  type IfFinalConfirmations,
  type IntermediariesFilingSectionId,
} from '@/lib/schemas/intermediaries-filing';

export type SelectOption = { value: string; label: string };

function toOptions(values: readonly string[], labels?: Record<string, string>): SelectOption[] {
  return values.map((value) => ({
    value,
    label: labels?.[value] ?? value.replaceAll('-', ' ').replaceAll('_', ' '),
  }));
}

export const IF_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'filing-readiness', label: 'Filing Readiness' },
] as const;

export type IntermediariesFilingTabId = (typeof IF_TABS)[number]['id'];

export const IF_INFORMATION_SECTIONS: Array<{
  id: IntermediariesFilingSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'issue-team-and-intermediary-master',
    label: 'Issue Team & Intermediary Master',
    description:
      'Issue team snapshot, canonical Intermediary Master, inter-se responsibilities and agreements.',
  },
  {
    id: 'issue-configuration-and-filing-snapshot',
    label: 'Issue Configuration & Filing Snapshot',
    description:
      'Read-only linked IPO Setup/Capital snapshot, filing freeze status, pricing and investor allocations.',
  },
  {
    id: 'filing-and-regulatory-milestone-tracker',
    label: 'Filing & Regulatory Milestone Tracker',
    description:
      'Canonical Filing records, Exchange queries, resubmissions, in-principle, SEBI SME and RoC milestones.',
  },
  {
    id: 'due-diligence-certificates-consents-and-signoffs',
    label: 'Due Diligence, Certificates, Consents & Sign-offs',
    description:
      'DD area tracker, certificate and consent registers, and offer-document chapter sign-off matrix.',
  },
  {
    id: 'depositories-banking-asba-upi-and-issue-infrastructure',
    label: 'Depositories, Banking, ASBA/UPI & Issue Infrastructure',
    description:
      'ISIN/depository readiness, issue bank roles, Sponsor Bank/UPI and ASBA configuration.',
  },
  {
    id: 'underwriting-market-making-and-distribution-arrangements',
    label: 'Underwriting, Market Making & Distribution Arrangements',
    description:
      'Underwriting commitments, nominated investors, Market Maker configuration and reservation.',
  },
  {
    id: 'issue-programme-allotment-listing-and-post-issue-execution',
    label: 'Issue Programme, Allotment, Listing & Post-Issue Execution',
    description:
      'Issue calendar, subscription/allotment, funds/unblocking, demat credit, listing and post-issue actions.',
  },
  {
    id: 'final-offer-document-advertisements-material-documents-and-filing-readiness',
    label: 'Final Offer Document, Advertisements & Filing Readiness',
    description:
      'Offer-document versions, placeholders, inspection register, agreements, communications and confirmations.',
  },
];

export const IF_SECTION_LABELS: Record<IntermediariesFilingSectionId, string> = Object.fromEntries(
  IF_INFORMATION_SECTIONS.map((section) => [section.id, section.label]),
) as Record<IntermediariesFilingSectionId, string>;

export const SESSION_SAVE_NOTICE_IF1 =
  'Your section updates are saved for this session. Permanent saving will be connected in the next increment.';

export const YES_NO_NOT_SURE_OPTIONS = toOptions(YES_NO_NOT_SURE_VALUES, {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
});

export const INTERMEDIARY_ROLE_OPTIONS = toOptions(INTERMEDIARY_ROLE_VALUES);
export const REGISTRATION_STATUS_OPTIONS = toOptions(REGISTRATION_STATUS_VALUES);
export const APPOINTMENT_STATUS_OPTIONS = toOptions(APPOINTMENT_STATUS_VALUES);
export const RESPONSIBILITY_AREA_OPTIONS = toOptions(RESPONSIBILITY_AREA_VALUES);
export const PRIMARY_SECONDARY_OPTIONS = toOptions(PRIMARY_SECONDARY_VALUES);
export const FILING_STAGE_OPTIONS = toOptions(FILING_STAGE_VALUES);
export const OFFER_DOCUMENT_FORM_OPTIONS = toOptions(OFFER_DOCUMENT_FORM_VALUES);
export const INVESTOR_CATEGORY_OPTIONS = toOptions(INVESTOR_CATEGORY_VALUES);
export const FILING_STATUS_OPTIONS = toOptions(FILING_STATUS_VALUES);
export const FILING_AUTHORITY_OPTIONS = toOptions(FILING_AUTHORITY_VALUES);
export const EXCHANGE_QUERY_STATUS_OPTIONS = toOptions(EXCHANGE_QUERY_STATUS_VALUES);
export const DUE_DILIGENCE_AREA_OPTIONS = toOptions(DUE_DILIGENCE_AREA_VALUES);
export const CERTIFICATE_TYPE_OPTIONS = toOptions(CERTIFICATE_TYPE_VALUES);
export const CERTIFICATE_STATUS_OPTIONS = toOptions(CERTIFICATE_STATUS_VALUES);
export const CERTIFICATE_FILED_TO_OPTIONS = toOptions(CERTIFICATE_FILED_TO_VALUES);
export const CONSENT_PARTY_TYPE_OPTIONS = toOptions(CONSENT_PARTY_TYPE_VALUES);
export const ISIN_STATUS_OPTIONS = toOptions(ISIN_STATUS_VALUES);
export const ISSUE_BANK_ROLE_OPTIONS = toOptions(ISSUE_BANK_ROLE_VALUES);
export const ACCOUNT_SETUP_STATUS_OPTIONS = toOptions(ACCOUNT_SETUP_STATUS_VALUES);
export const PLACEHOLDER_TYPE_OPTIONS = toOptions(PLACEHOLDER_TYPE_VALUES);
export const PLACEHOLDER_STATUS_OPTIONS = toOptions(PLACEHOLDER_STATUS_VALUES);
export const ISSUE_AGREEMENT_TYPE_OPTIONS = toOptions(ISSUE_AGREEMENT_TYPE_VALUES);
export const ISSUE_AGREEMENT_STATUS_OPTIONS = toOptions(ISSUE_AGREEMENT_STATUS_VALUES);
export const PUBLIC_COMMUNICATION_TYPE_OPTIONS = toOptions(PUBLIC_COMMUNICATION_TYPE_VALUES);
export const POST_ISSUE_ACTION_TYPE_OPTIONS = toOptions(POST_ISSUE_ACTION_TYPE_VALUES);
export const POST_ISSUE_ACTION_STATUS_OPTIONS = toOptions(POST_ISSUE_ACTION_STATUS_VALUES);
export const READINESS_STATE_OPTIONS = toOptions(READINESS_STATE_VALUES);
export const RECONCILIATION_STATUS_OPTIONS = toOptions(RECONCILIATION_STATUS_VALUES);
export const PROFESSIONAL_CONFIRMATION_OPTIONS = toOptions(PROFESSIONAL_CONFIRMATION_STATUS_VALUES);

export const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  reconciled: 'Reconciled',
  'potential-inconsistency': 'Potential inconsistency',
  'missing-information': 'Missing information',
  'pending-linked-workstream': 'Pending linked workstream',
  'pending-professional-confirmation': 'Pending professional confirmation',
};

export const IF_CONFIRMATION_FIELDS: Array<{
  key: keyof IfFinalConfirmations;
  label: string;
}> = [
  { key: 'leadManagerAppointedCurrent', label: 'Lead Manager appointed/current' },
  { key: 'registrarAppointedCurrent', label: 'Registrar appointed/current' },
  { key: 'legalCounselAppointedCurrent', label: 'Legal counsel appointed/current' },
  {
    key: 'auditorsCertifyingProfessionalsEngaged',
    label: 'Auditors/certifying professionals engaged',
  },
  {
    key: 'applicableIntermediaryRegistrationsReviewed',
    label: 'Applicable intermediary registrations reviewed',
  },
  {
    key: 'interSeResponsibilitiesDocumentedWhereNeeded',
    label: 'Inter-se responsibilities documented where needed',
  },
  { key: 'issueBankingArrangementsReady', label: 'Issue banking arrangements ready' },
  { key: 'sponsorBankReady', label: 'Sponsor Bank ready' },
  { key: 'depositoryArrangementsReady', label: 'Depository arrangements ready' },
  { key: 'isinReady', label: 'ISIN ready' },
  { key: 'underwritingArrangementComplete', label: 'Underwriting arrangement complete' },
  {
    key: 'applicableSmeUnderwritingCoverageReviewed',
    label: 'Applicable SME underwriting coverage reviewed',
  },
  {
    key: 'merchantBankerOwnAccountRequirementReviewed',
    label: 'Merchant banker own-account requirement reviewed',
  },
  { key: 'marketMakerAppointed', label: 'Market Maker appointed' },
  { key: 'marketMakingAgreementExecuted', label: 'Market Making Agreement executed' },
  {
    key: 'applicableMarketMakingPeriodAddressed',
    label: 'Applicable market-making period addressed',
  },
  {
    key: 'nominatedInvestorArrangementsDisclosedWhereApplicable',
    label: 'Nominated investor arrangements disclosed where applicable',
  },
  { key: 'exchangeFilingChecklistComplete', label: 'Exchange filing checklist complete' },
  { key: 'openExchangeQueriesAccuratelyShown', label: 'Open Exchange queries accurately shown' },
  {
    key: 'inPrincipleApprovalStatusAccuratelyShown',
    label: 'In-principle approval status accurately shown',
  },
  { key: 'sebiSmeFilingStatusAccuratelyShown', label: 'SEBI SME filing status accurately shown' },
  { key: 'ddCertificatesCurrent', label: 'DD certificates current' },
  {
    key: 'applicableProfessionalCertificatesCurrent',
    label: 'Applicable professional certificates current',
  },
  { key: 'intermediaryExpertConsentsCurrent', label: 'Intermediary/expert consents current' },
  { key: 'rocFilingReadinessReviewed', label: 'RoC filing readiness reviewed' },
  {
    key: 'issueStructureReconcilesWithIpoSetup',
    label: 'Issue structure reconciles with IPO Setup',
  },
  {
    key: 'capitalStructureReconcilesWithCapital',
    label: 'Capital structure reconciles with Capital',
  },
  { key: 'objectsReconcile', label: 'Objects reconcile' },
  { key: 'financialsReconcile', label: 'Financials reconcile' },
  { key: 'managementDataReconcile', label: 'Management data reconcile' },
  { key: 'groupEntitiesReconcile', label: 'Group Entities reconcile' },
  { key: 'bacMattersReconcile', label: 'BAC matters reconcile' },
  { key: 'lacUpdatedThroughFilingCutOff', label: 'LAC updated through filing cut-off' },
  { key: 'materialDevelopmentsReviewed', label: 'Material developments reviewed' },
  { key: 'finalInspectionListReviewed', label: 'Final inspection list reviewed' },
  {
    key: 'applicableIssueAgreementsExecutedCurrent',
    label: 'Applicable issue agreements executed/current',
  },
  {
    key: 'publicCommunicationsReadinessReviewed',
    label: 'Public communications readiness reviewed',
  },
  { key: 'applicableT3ExecutionPlanReviewed', label: 'Applicable T+3 execution plan reviewed' },
  {
    key: 'unresolvedPlaceholdersAccuratelyShown',
    label: 'Unresolved placeholders accurately shown',
  },
  {
    key: 'noCriticalFilingItemIntentionallyOmitted',
    label: 'No critical filing item intentionally omitted',
  },
  {
    key: 'finalProfessionalLeadManagerLegalAuditorReviewRemainsRequired',
    label: 'Final professional/Lead Manager/legal/auditor review remains required',
  },
];

export { IF_SECTION_IDS };
