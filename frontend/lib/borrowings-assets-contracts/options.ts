/**
 * UI option arrays and label maps for Borrowings, Assets & Contracts.
 */

import {
  ASSET_CLASS_VALUES,
  ASSET_OWNERSHIP_BASIS_VALUES,
  BAC_CHANGE_EVENT_TYPE_VALUES,
  BORROWER_TYPE_VALUES,
  BORROWING_AUTHORITY_STATE_VALUES,
  CHARGE_RANKING_VALUES,
  CHARGE_STATUS_VALUES,
  CONTRACT_CATEGORY_VALUES,
  CONTRACT_STATUS_VALUES,
  COVENANT_COMPLIANCE_STATUS_VALUES,
  COVENANT_TYPE_VALUES,
  COUNTERPARTY_ROLE_VALUES,
  CURRENT_NON_CURRENT_VALUES,
  DEFAULT_EVENT_TYPE_VALUES,
  FACILITY_PURPOSE_VALUES,
  FACILITY_TYPE_VALUES,
  FINANCIAL_COVENANT_CATEGORY_VALUES,
  FUND_NON_FUND_VALUES,
  GUARANTEE_TYPE_VALUES,
  INSURANCE_COVERAGE_STATUS_VALUES,
  INTEREST_BENCHMARK_VALUES,
  INSPECTION_CANDIDATE_TYPE_VALUES,
  IPO_CONSENT_REQUIREMENT_VALUES,
  LENDER_TYPE_VALUES,
  MATERIALITY_STATUS_VALUES,
  OCCUPANCY_BASIS_VALUES,
  PROFESSIONAL_CONFIRMATION_STATUS_VALUES,
  PROPERTY_ISSUE_TYPE_VALUES,
  PROPERTY_TYPE_VALUES,
  RATE_TYPE_VALUES,
  READINESS_STATE_VALUES,
  RECONCILIATION_STATUS_VALUES,
  RELATED_RECORD_TYPE_VALUES,
  REPAYMENT_TYPE_VALUES,
  RESTRICTIVE_COVENANT_TRIGGER_VALUES,
  RESTRUCTURING_EVENT_TYPE_VALUES,
  SECURED_CLASSIFICATION_VALUES,
  SECURED_OBJECT_VALUES,
  SECURITY_TYPE_VALUES,
  YES_NO_NOT_SURE_VALUES,
  type BacConfirmations,
  type BorrowingsAssetsContractsSectionId,
} from '@/lib/schemas/borrowings-assets-contracts';

export type SelectOption = { value: string; label: string };

function toOptions(values: readonly string[], labels?: Record<string, string>): SelectOption[] {
  return values.map((value) => ({
    value,
    label: labels?.[value] ?? value.replaceAll('-', ' ').replaceAll('_', ' '),
  }));
}

export const BAC_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information' },
  { id: 'borrowings-contracts-assessment', label: 'Borrowings & Contracts Assessment' },
] as const;

export type BorrowingsAssetsContractsTabId = (typeof BAC_TABS)[number]['id'];

export const BAC_INFORMATION_SECTIONS: Array<{
  id: BorrowingsAssetsContractsSectionId;
  label: string;
  description: string;
}> = [
  {
    id: 'financial-indebtedness-and-facility-master',
    label: 'Financial Indebtedness & Facility Master',
    description: 'Borrowing snapshot and canonical Facility Master register.',
  },
  {
    id: 'security-charges-guarantees-and-borrowing-powers',
    label: 'Security, Charges, Guarantees & Borrowing Powers',
    description: 'Security/collateral register, RoC charges, guarantees and borrowing authority.',
  },
  {
    id: 'covenants-defaults-waivers-and-lender-consents',
    label: 'Covenants, Defaults, Waivers & Lender Consents',
    description: 'Financial/restrictive covenants, defaults, waivers and IPO lender consent matrix.',
  },
  {
    id: 'immovable-properties-and-occupancy-rights',
    label: 'Immovable Properties & Occupancy Rights',
    description: 'Property Master with owned/leased occupancy and title/lease issue register.',
  },
  {
    id: 'material-assets-encumbrance-and-insurance-linkage',
    label: 'Material Assets, Encumbrance & Insurance Linkage',
    description: 'Material asset register, encumbrance, insurance and IP dependency linkage.',
  },
  {
    id: 'material-business-strategic-and-other-contracts',
    label: 'Material Business, Strategic & Other Contracts',
    description: 'Canonical Contract Master for material commercial and strategic agreements.',
  },
  {
    id: 'contract-materiality-expiry-and-inspection-readiness',
    label: 'Contract Materiality, Expiry & Inspection Readiness',
    description: 'Materiality review, expiry readiness, breach/dispute and inspection candidates.',
  },
  {
    id: 'reconciliation-changes-and-issuer-confirmations',
    label: 'Reconciliation, Changes & Issuer Confirmations',
    description: 'Cross-workstream reconciliation, change register and issuer confirmations.',
  },
];

export const BAC_SECTION_LABELS: Record<BorrowingsAssetsContractsSectionId, string> =
  Object.fromEntries(
    BAC_INFORMATION_SECTIONS.map((section) => [section.id, section.label]),
  ) as Record<BorrowingsAssetsContractsSectionId, string>;

export const SESSION_SAVE_NOTICE_BAC1 =
  'Your section updates are saved for this session. Permanent saving will be connected in the next increment.';

export const YES_NO_NOT_SURE_OPTIONS = toOptions(YES_NO_NOT_SURE_VALUES, {
  yes: 'Yes',
  no: 'No',
  not_sure: 'Not sure',
});

export const BORROWER_TYPE_OPTIONS = toOptions(BORROWER_TYPE_VALUES);
export const LENDER_TYPE_OPTIONS = toOptions(LENDER_TYPE_VALUES);
export const FACILITY_TYPE_OPTIONS = toOptions(FACILITY_TYPE_VALUES);
export const FUND_NON_FUND_OPTIONS = toOptions(FUND_NON_FUND_VALUES);
export const SECURED_CLASSIFICATION_OPTIONS = toOptions(SECURED_CLASSIFICATION_VALUES);
export const CURRENT_NON_CURRENT_OPTIONS = toOptions(CURRENT_NON_CURRENT_VALUES);
export const RATE_TYPE_OPTIONS = toOptions(RATE_TYPE_VALUES);
export const INTEREST_BENCHMARK_OPTIONS = toOptions(INTEREST_BENCHMARK_VALUES);
export const REPAYMENT_TYPE_OPTIONS = toOptions(REPAYMENT_TYPE_VALUES);
export const FACILITY_PURPOSE_OPTIONS = toOptions(FACILITY_PURPOSE_VALUES);
export const SECURITY_TYPE_OPTIONS = toOptions(SECURITY_TYPE_VALUES);
export const SECURED_OBJECT_OPTIONS = toOptions(SECURED_OBJECT_VALUES);
export const CHARGE_RANKING_OPTIONS = toOptions(CHARGE_RANKING_VALUES);
export const CHARGE_STATUS_OPTIONS = toOptions(CHARGE_STATUS_VALUES);
export const GUARANTEE_TYPE_OPTIONS = toOptions(GUARANTEE_TYPE_VALUES);
export const BORROWING_AUTHORITY_STATE_OPTIONS = toOptions(BORROWING_AUTHORITY_STATE_VALUES);
export const COVENANT_TYPE_OPTIONS = toOptions(COVENANT_TYPE_VALUES);
export const FINANCIAL_COVENANT_CATEGORY_OPTIONS = toOptions(FINANCIAL_COVENANT_CATEGORY_VALUES);
export const COVENANT_COMPLIANCE_STATUS_OPTIONS = toOptions(COVENANT_COMPLIANCE_STATUS_VALUES);
export const RESTRICTIVE_COVENANT_TRIGGER_OPTIONS = toOptions(RESTRICTIVE_COVENANT_TRIGGER_VALUES);
export const IPO_CONSENT_REQUIREMENT_OPTIONS = toOptions(IPO_CONSENT_REQUIREMENT_VALUES);
export const DEFAULT_EVENT_TYPE_OPTIONS = toOptions(DEFAULT_EVENT_TYPE_VALUES);
export const RESTRUCTURING_EVENT_TYPE_OPTIONS = toOptions(RESTRUCTURING_EVENT_TYPE_VALUES);
export const PROPERTY_TYPE_OPTIONS = toOptions(PROPERTY_TYPE_VALUES);
export const OCCUPANCY_BASIS_OPTIONS = toOptions(OCCUPANCY_BASIS_VALUES);
export const PROPERTY_ISSUE_TYPE_OPTIONS = toOptions(PROPERTY_ISSUE_TYPE_VALUES);
export const READINESS_STATE_OPTIONS = toOptions(READINESS_STATE_VALUES);
export const ASSET_CLASS_OPTIONS = toOptions(ASSET_CLASS_VALUES);
export const ASSET_OWNERSHIP_BASIS_OPTIONS = toOptions(ASSET_OWNERSHIP_BASIS_VALUES);
export const INSURANCE_COVERAGE_STATUS_OPTIONS = toOptions(INSURANCE_COVERAGE_STATUS_VALUES);
export const CONTRACT_CATEGORY_OPTIONS = toOptions(CONTRACT_CATEGORY_VALUES);
export const COUNTERPARTY_ROLE_OPTIONS = toOptions(COUNTERPARTY_ROLE_VALUES);
export const CONTRACT_STATUS_OPTIONS = toOptions(CONTRACT_STATUS_VALUES);
export const MATERIALITY_STATUS_OPTIONS = toOptions(MATERIALITY_STATUS_VALUES);
export const INSPECTION_CANDIDATE_TYPE_OPTIONS = toOptions(INSPECTION_CANDIDATE_TYPE_VALUES);
export const RECONCILIATION_STATUS_OPTIONS = toOptions(RECONCILIATION_STATUS_VALUES);
export const PROFESSIONAL_CONFIRMATION_OPTIONS = toOptions(PROFESSIONAL_CONFIRMATION_STATUS_VALUES);
export const BAC_CHANGE_EVENT_TYPE_OPTIONS = toOptions(BAC_CHANGE_EVENT_TYPE_VALUES);
export const RELATED_RECORD_TYPE_OPTIONS = toOptions(RELATED_RECORD_TYPE_VALUES);

export const BAC_CONFIRMATION_FIELDS: Array<{
  key: keyof BacConfirmations;
  label: string;
}> = [
  { key: 'allMaterialBorrowingsDisclosed', label: 'All material borrowings are disclosed' },
  { key: 'fundNonFundFacilitiesIncluded', label: 'Fund and non-fund facilities included' },
  {
    key: 'securedUnsecuredFacilitiesIncluded',
    label: 'Secured and unsecured facilities included',
  },
  { key: 'relatedPartyBorrowingsIncluded', label: 'Related-party borrowings included' },
  {
    key: 'sanctionOutstandingAmountsCurrent',
    label: 'Sanction and outstanding amounts are current',
  },
  { key: 'repaymentTermsComplete', label: 'Repayment terms are complete' },
  { key: 'prepaymentRestrictionsDisclosed', label: 'Prepayment restrictions disclosed' },
  { key: 'allSecuritiesCollateralDisclosed', label: 'All securities/collateral disclosed' },
  { key: 'personalGuaranteesDisclosed', label: 'Personal guarantees disclosed' },
  { key: 'corporateGuaranteesDisclosed', label: 'Corporate guarantees disclosed' },
  { key: 'registrableChargesConsidered', label: 'Registrable charges considered' },
  {
    key: 'chargeModificationsSatisfactionsDisclosed',
    label: 'Charge modifications/satisfactions disclosed',
  },
  { key: 'financialCovenantsDisclosed', label: 'Financial covenants disclosed' },
  { key: 'restrictiveCovenantsDisclosed', label: 'Restrictive covenants disclosed' },
  { key: 'defaultsDelaysDisclosed', label: 'Defaults/delays disclosed' },
  { key: 'waiversCuresDisclosed', label: 'Waivers/cures disclosed' },
  { key: 'crossDefaultsDisclosed', label: 'Cross-defaults disclosed' },
  {
    key: 'ipoChangeOfControlLenderConsentRequirementsReviewed',
    label: 'IPO/change-of-control lender consent requirements reviewed',
  },
  { key: 'lenderConsentsAccuratelyShown', label: 'Lender consents accurately shown' },
  {
    key: 'debtProposedForIpoRepaymentReconcilesWithObjects',
    label: 'Debt proposed for IPO repayment reconciles with Objects of the Issue',
  },
  { key: 'materialOwnedPropertiesDisclosed', label: 'Material owned properties disclosed' },
  {
    key: 'materialLeasedLicensedPremisesDisclosed',
    label: 'Material leased/licensed premises disclosed',
  },
  {
    key: 'relatedPartyPropertyArrangementsDisclosed',
    label: 'Related-party property arrangements disclosed',
  },
  { key: 'titleLeaseIssuesDisclosed', label: 'Title/lease issues disclosed' },
  { key: 'materialAssetEncumbrancesDisclosed', label: 'Material asset encumbrances disclosed' },
  { key: 'criticalInsuranceLinkageCaptured', label: 'Critical insurance linkage captured' },
  { key: 'materialContractsDisclosed', label: 'Material contracts disclosed' },
  {
    key: 'nonOrdinaryCourseMaterialAgreementsConsidered',
    label: 'Non-ordinary-course material agreements considered',
  },
  { key: 'expiryRenewalRisksDisclosed', label: 'Expiry/renewal risks disclosed' },
  {
    key: 'changeOfControlIpoClausesConsidered',
    label: 'Change-of-control/IPO clauses considered',
  },
  { key: 'contractBreachesDisputesIdentified', label: 'Contract breaches/disputes identified' },
  {
    key: 'linkedWorkstreamDifferencesFlagged',
    label: 'Linked-workstream differences flagged',
  },
  {
    key: 'professionalConfirmationRequired',
    label: 'Professional/legal/accounting/merchant-banker confirmation remains required',
  },
];
