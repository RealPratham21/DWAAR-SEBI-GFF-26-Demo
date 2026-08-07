/**
 * Canonical Borrowings, Assets & Contracts payload schema (Increment BAC1).
 *
 * - Persist `BorrowingsAssetsContractsPayload` (`schemaVersion: 1`) for BAC2.
 * - One canonical master per real-world object: Facility, Property, Asset, Contract.
 * - Monetary amounts and percentages are Decimal-safe strings (`''` when empty).
 * - Ternary answers: `'' | 'yes' | 'no' | 'not_sure'`.
 * - Computed totals, ratios and assessment outcomes are DERIVED — never persisted here.
 * - UI labels live in `lib/borrowings-assets-contracts/options.ts`.
 */

import { z } from 'zod';

export const BORROWINGS_ASSETS_CONTRACTS_SCHEMA_VERSION = 1 as const;

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];
export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Shared enums                                                                */
/* -------------------------------------------------------------------------- */

export const PROFESSIONAL_CONFIRMATION_STATUS_VALUES = [
  'confirmed',
  'pending',
  'not-required',
  'not-applicable',
] as const;
export type ProfessionalConfirmationStatus =
  (typeof PROFESSIONAL_CONFIRMATION_STATUS_VALUES)[number];

export const RECONCILIATION_STATUS_VALUES = [
  'reconciled',
  'potential-inconsistency',
  'pending-linked-workstream',
  'pending-professional-confirmation',
] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUS_VALUES)[number];

export const READINESS_STATE_VALUES = [
  'appears-consistent',
  'potential-concern',
  'missing-information',
  'pending-professional-confirmation',
] as const;
export type ReadinessState = (typeof READINESS_STATE_VALUES)[number];

export const CURRENT_NON_CURRENT_VALUES = ['current', 'non-current'] as const;
export type CurrentNonCurrent = (typeof CURRENT_NON_CURRENT_VALUES)[number];

export const FUND_NON_FUND_VALUES = ['fund-based', 'non-fund-based'] as const;
export type FundNonFund = (typeof FUND_NON_FUND_VALUES)[number];

export const SECURED_CLASSIFICATION_VALUES = [
  'secured',
  'unsecured',
  'partially-secured',
] as const;
export type SecuredClassification = (typeof SECURED_CLASSIFICATION_VALUES)[number];

export const RATE_TYPE_VALUES = ['fixed', 'floating'] as const;
export type RateType = (typeof RATE_TYPE_VALUES)[number];

export const INTEREST_BENCHMARK_VALUES = [
  'mclr',
  'repo-linked',
  'external-benchmark',
  'sofr-or-foreign-benchmark',
  'fixed',
  'other',
] as const;
export type InterestBenchmark = (typeof INTEREST_BENCHMARK_VALUES)[number];

export const REPAYMENT_TYPE_VALUES = [
  'bullet',
  'emi',
  'equal-principal',
  'instalments',
  'on-demand',
  'revolving',
  'other',
] as const;
export type RepaymentType = (typeof REPAYMENT_TYPE_VALUES)[number];

export const FACILITY_PURPOSE_VALUES = [
  'working-capital',
  'capital-expenditure',
  'machinery',
  'acquisition',
  'refinancing',
  'general-corporate-purposes',
  'project-financing',
  'inventory',
  'receivables',
  'export-financing',
  'vehicle-or-equipment',
  'property',
  'other',
] as const;
export type FacilityPurpose = (typeof FACILITY_PURPOSE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Facility Master enums                                                       */
/* -------------------------------------------------------------------------- */

export const BORROWER_TYPE_VALUES = [
  'issuer',
  'subsidiary',
  'material-subsidiary',
  'other-linked-entity',
] as const;
export type BorrowerType = (typeof BORROWER_TYPE_VALUES)[number];

export const LENDER_TYPE_VALUES = [
  'scheduled-bank',
  'cooperative-bank',
  'nbfc',
  'financial-institution',
  'related-party',
  'promoter',
  'group-entity',
  'director',
  'inter-corporate-lender',
  'debenture-holder-or-trustee',
  'other',
] as const;
export type LenderType = (typeof LENDER_TYPE_VALUES)[number];

export const FACILITY_TYPE_VALUES = [
  'term-loan',
  'cash-credit',
  'overdraft',
  'working-capital-demand-loan',
  'packing-credit',
  'bill-discounting',
  'buyers-credit',
  'external-commercial-borrowing',
  'inter-corporate-deposit',
  'unsecured-loan',
  'promoter-loan',
  'related-party-loan',
  'equipment-finance',
  'vehicle-finance',
  'lease-financing',
  'non-convertible-debenture',
  'commercial-paper',
  'letter-of-credit',
  'bank-guarantee',
  'forex-derivative-facility',
  'other',
] as const;
export type FacilityType = (typeof FACILITY_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Security / charge / guarantee enums                                         */
/* -------------------------------------------------------------------------- */

export const SECURITY_TYPE_VALUES = [
  'mortgage',
  'hypothecation',
  'pledge',
  'assignment',
  'lien',
  'fixed-charge',
  'floating-charge',
  'negative-lien',
  'escrow-account-control',
  'dsra',
  'other',
] as const;
export type SecurityType = (typeof SECURITY_TYPE_VALUES)[number];

export const SECURED_OBJECT_VALUES = [
  'existing-assets',
  'future-assets',
  'receivables',
  'current-assets',
  'movable-fixed-assets',
  'immovable-property',
  'shares-securities',
  'inventory',
  'bank-account',
  'insurance-proceeds',
  'other',
] as const;
export type SecuredObject = (typeof SECURED_OBJECT_VALUES)[number];

export const CHARGE_RANKING_VALUES = [
  'exclusive',
  'first-charge',
  'second-charge',
  'pari-passu',
  'subservient',
  'residual',
  'not-sure',
] as const;
export type ChargeRanking = (typeof CHARGE_RANKING_VALUES)[number];

export const CHARGE_STATUS_VALUES = [
  'registered',
  'pending-registration',
  'modified-pending-filing',
  'satisfied',
  'satisfaction-pending',
  'not-applicable',
  'not-sure',
  'professional-confirmation-required',
] as const;
export type ChargeStatus = (typeof CHARGE_STATUS_VALUES)[number];

export const GUARANTEE_TYPE_VALUES = [
  'personal',
  'corporate',
  'issuer-given',
  'counter-guarantee',
  'other',
] as const;
export type GuaranteeType = (typeof GUARANTEE_TYPE_VALUES)[number];

export const BORROWING_AUTHORITY_STATE_VALUES = [
  'appears-within-entered-authority',
  'potential-concern',
  'missing-information',
  'pending-professional-confirmation',
] as const;
export type BorrowingAuthorityState = (typeof BORROWING_AUTHORITY_STATE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Covenant / consent / default enums                                          */
/* -------------------------------------------------------------------------- */

export const COVENANT_TYPE_VALUES = [
  'financial',
  'restrictive',
  'information-reporting',
  'security',
  'promoter',
  'other',
] as const;
export type CovenantType = (typeof COVENANT_TYPE_VALUES)[number];

export const FINANCIAL_COVENANT_CATEGORY_VALUES = [
  'debt-equity',
  'dscr',
  'interest-coverage',
  'current-ratio',
  'tangible-net-worth',
  'minimum-net-worth',
  'tol-tnw',
  'working-capital',
  'ebitda-debt',
  'security-cover',
  'promoter-contribution',
  'custom',
] as const;
export type FinancialCovenantCategory = (typeof FINANCIAL_COVENANT_CATEGORY_VALUES)[number];

export const COVENANT_COMPLIANCE_STATUS_VALUES = [
  'satisfied',
  'breached',
  'not-tested',
  'not-sure',
] as const;
export type CovenantComplianceStatus = (typeof COVENANT_COMPLIANCE_STATUS_VALUES)[number];

export const RESTRICTIVE_COVENANT_TRIGGER_VALUES = [
  'additional-borrowing',
  'additional-security',
  'capital-expenditure',
  'dividends',
  'change-in-share-capital',
  'issue-of-securities',
  'ipo-listing',
  'promoter-dilution',
  'change-in-promoter-holding',
  'change-in-control',
  'change-in-management',
  'board-reconstitution',
  'constitutional-document-changes',
  'merger-demerger',
  'acquisition-investment',
  'subsidiary-creation',
  'loans-advances',
  'guarantees-security',
  'asset-disposal',
  'business-diversification',
  'rpts',
  'registered-office-change',
  'bank-account-changes',
  'prepayment-of-other-debt',
  'other',
] as const;
export type RestrictiveCovenantTrigger = (typeof RESTRICTIVE_COVENANT_TRIGGER_VALUES)[number];

export const IPO_CONSENT_REQUIREMENT_VALUES = [
  'required',
  'not-required',
  'not-sure',
  'pending-professional-review',
] as const;
export type IpoConsentRequirement = (typeof IPO_CONSENT_REQUIREMENT_VALUES)[number];

export const DEFAULT_EVENT_TYPE_VALUES = [
  'principal-delay',
  'interest-delay',
  'covenant-breach',
  'security-perfection-issue',
  'documentation-breach',
  'reporting-delay',
  'cross-default',
  'account-irregularity',
  'npa-classification',
  'recall-notice',
  'guarantee-invocation',
  'other',
] as const;
export type DefaultEventType = (typeof DEFAULT_EVENT_TYPE_VALUES)[number];

export const RESTRUCTURING_EVENT_TYPE_VALUES = [
  'restructuring',
  'rescheduling',
  'one-time-settlement',
  'waiver',
  'compromise',
  'refinancing',
] as const;
export type RestructuringEventType = (typeof RESTRUCTURING_EVENT_TYPE_VALUES)[number];

export const EVENT_CONTINUING_STATUS_VALUES = ['continuing', 'resolved'] as const;
export type EventContinuingStatus = (typeof EVENT_CONTINUING_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Property enums                                                              */
/* -------------------------------------------------------------------------- */

export const PROPERTY_TYPE_VALUES = [
  'land',
  'factory',
  'warehouse',
  'office',
  'registered-office',
  'corporate-office',
  'branch',
  'store',
  'data-centre',
  'other',
] as const;
export type PropertyType = (typeof PROPERTY_TYPE_VALUES)[number];

export const OCCUPANCY_BASIS_VALUES = [
  'owned',
  'leased',
  'leave-and-licence',
  'rented',
  'subleased',
  'licence',
  'informal-arrangement',
  'shared-premises',
  'other',
] as const;
export type OccupancyBasis = (typeof OCCUPANCY_BASIS_VALUES)[number];

export const PROPERTY_ISSUE_TYPE_VALUES = [
  'title-not-in-issuer-name',
  'missing-registered-deed',
  'stamp-issue',
  'expired-lease',
  'renewal-pending',
  'informal-occupancy',
  'lessor-title-unverified',
  'encumbrance',
  'property-dispute',
  'mortgage-inconsistency',
  'related-party-lease',
  'approval-or-noc-pending',
  'other',
] as const;
export type PropertyIssueType = (typeof PROPERTY_ISSUE_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Material asset enums                                                        */
/* -------------------------------------------------------------------------- */

export const ASSET_CLASS_VALUES = [
  'plant-machinery',
  'production-line',
  'critical-equipment',
  'vehicle-fleet',
  'it-server-infrastructure',
  'furniture-equipment',
  'specialised-tooling',
  'pledged-inventory',
  'other',
] as const;
export type AssetClass = (typeof ASSET_CLASS_VALUES)[number];

export const ASSET_OWNERSHIP_BASIS_VALUES = ['owned', 'leased', 'hire-purchase', 'other'] as const;
export type AssetOwnershipBasis = (typeof ASSET_OWNERSHIP_BASIS_VALUES)[number];

export const INSURANCE_COVERAGE_STATUS_VALUES = [
  'current',
  'expired',
  'renewal-pending',
  'not-applicable',
  'not-sure',
] as const;
export type InsuranceCoverageStatus = (typeof INSURANCE_COVERAGE_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Contract enums                                                              */
/* -------------------------------------------------------------------------- */

export const CONTRACT_CATEGORY_VALUES = [
  'key-customer',
  'key-supplier',
  'distribution-dealership',
  'franchise',
  'manufacturing',
  'contract-manufacturing',
  'epc-project',
  'technology',
  'saas-cloud',
  'ip-trademark-licence',
  'patent-software-licence',
  'service',
  'shared-service',
  'logistics',
  'outsourcing',
  'strategic-alliance',
  'collaboration',
  'joint-venture',
  'shareholders-agreement',
  'business-transfer',
  'asset-purchase-sale',
  'acquisition',
  'non-compete',
  'business-allocation',
  'government-concession',
  'property-lease',
  'related-party-commercial',
  'other',
] as const;
export type ContractCategory = (typeof CONTRACT_CATEGORY_VALUES)[number];

export const COUNTERPARTY_ROLE_VALUES = [
  'customer',
  'supplier',
  'distributor',
  'partner',
  'licensor',
  'licensee',
  'service-provider',
  'other',
] as const;
export type CounterpartyRole = (typeof COUNTERPARTY_ROLE_VALUES)[number];

export const CONTRACT_STATUS_VALUES = [
  'current',
  'expired',
  'terminated',
  'pending-execution',
  'other',
] as const;
export type ContractStatus = (typeof CONTRACT_STATUS_VALUES)[number];

export const MATERIALITY_STATUS_VALUES = [
  'material',
  'potentially-material',
  'not-material',
  'pending-information',
  'pending-professional-confirmation',
] as const;
export type MaterialityStatus = (typeof MATERIALITY_STATUS_VALUES)[number];

export const INSPECTION_CANDIDATE_TYPE_VALUES = ['material-contract', 'material-document'] as const;
export type InspectionCandidateType = (typeof INSPECTION_CANDIDATE_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Change register enums                                                       */
/* -------------------------------------------------------------------------- */

export const BAC_CHANGE_EVENT_TYPE_VALUES = [
  'new-facility',
  'facility-enhancement',
  'refinancing',
  'facility-closure',
  'charge-creation',
  'charge-modification',
  'charge-satisfaction',
  'guarantee-created',
  'guarantee-released',
  'covenant-amended',
  'default-or-waiver',
  'property-acquired',
  'property-disposed',
  'lease-entered',
  'lease-renewed',
  'lease-terminated',
  'contract-entered',
  'contract-amended',
  'contract-renewed',
  'contract-terminated',
  'other',
] as const;
export type BacChangeEventType = (typeof BAC_CHANGE_EVENT_TYPE_VALUES)[number];

export const RELATED_RECORD_TYPE_VALUES = [
  'facility',
  'security',
  'charge',
  'guarantee',
  'covenant',
  'consent',
  'default',
  'property',
  'asset',
  'contract',
  'other',
] as const;
export type RelatedRecordType = (typeof RELATED_RECORD_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 1: Financial Indebtedness & Facility Master                         */
/* -------------------------------------------------------------------------- */

export const borrowingSnapshotSchema = z.object({
  positionAsOfDate: text,
  reportingCurrency: text,
  displayUnit: text,
  currentBorrowingsExist: yesNoNotSureOrEmptySchema,
  securedBorrowingsExist: yesNoNotSureOrEmptySchema,
  unsecuredBorrowingsExist: yesNoNotSureOrEmptySchema,
  workingCapitalFacilitiesExist: yesNoNotSureOrEmptySchema,
  nonFundBasedFacilitiesExist: yesNoNotSureOrEmptySchema,
  relatedPartyBorrowingsExist: yesNoNotSureOrEmptySchema,
  foreignCurrencyBorrowingsExist: yesNoNotSureOrEmptySchema,
  leaseLiabilitiesExist: yesNoNotSureOrEmptySchema,
  debtSecuritiesNcdsExist: yesNoNotSureOrEmptySchema,
  materialSubsidiaryFacilitiesRelevant: yesNoNotSureOrEmptySchema,
});
export type BorrowingSnapshot = z.infer<typeof borrowingSnapshotSchema>;

export const facilityBorrowerSchema = z.object({
  borrowerType: z.enum(['', ...BORROWER_TYPE_VALUES]),
  linkedGroupEntityId: text,
  displayName: text,
});
export type FacilityBorrower = z.infer<typeof facilityBorrowerSchema>;

export const facilityLenderSchema = z.object({
  lenderName: text,
  lenderType: z.enum(['', ...LENDER_TYPE_VALUES]),
  branch: text,
  contactReference: text,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  linkedGroupEntityId: text,
  linkedRelatedPartyReference: text,
});
export type FacilityLender = z.infer<typeof facilityLenderSchema>;

export const facilitySanctionAndUtilisationSchema = z.object({
  sanctionLetterDate: text,
  originalSanctionAmount: decimalStringSchema,
  currentSanctionedLimit: decimalStringSchema,
  currency: text,
  amountUnit: text,
  firstDisbursementDate: text,
  totalAmountDisbursed: decimalStringSchema,
  amountRepaid: decimalStringSchema,
  principalOutstanding: decimalStringSchema,
  accruedInterest: decimalStringSchema,
  totalOutstanding: decimalStringSchema,
  undrawnAmount: decimalStringSchema,
  currentNonCurrentClassification: z.enum(['', ...CURRENT_NON_CURRENT_VALUES]),
  lastBalanceConfirmationDate: text,
  sourceStatus: text,
  notes: text,
});
export type FacilitySanctionAndUtilisation = z.infer<typeof facilitySanctionAndUtilisationSchema>;

export const facilityInterestSchema = z.object({
  rateType: z.enum(['', ...RATE_TYPE_VALUES]),
  benchmark: z.enum(['', ...INTEREST_BENCHMARK_VALUES]),
  benchmarkRate: decimalStringSchema,
  spread: decimalStringSchema,
  enteredEffectiveRate: decimalStringSchema,
  resetFrequency: text,
  nextResetDate: text,
  penalInterest: decimalStringSchema,
  defaultInterest: decimalStringSchema,
  interestPaymentFrequency: text,
});
export type FacilityInterest = z.infer<typeof facilityInterestSchema>;

export const facilityTenorAndRepaymentSchema = z.object({
  facilityStartDate: text,
  maturityDate: text,
  tenor: text,
  moratorium: text,
  repaymentType: z.enum(['', ...REPAYMENT_TYPE_VALUES]),
  repaymentFrequency: text,
  numberOfInstalments: text,
  nextRepaymentDate: text,
  finalRepaymentDate: text,
  balloonPayment: decimalStringSchema,
  repaymentScheduleAvailable: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type FacilityTenorAndRepayment = z.infer<typeof facilityTenorAndRepaymentSchema>;

export const facilityPurposeSchema = z.object({
  purposes: z.array(z.enum(FACILITY_PURPOSE_VALUES)),
  exactSanctionPurposeWording: text,
  managementPurposeDescription: text,
});
export type FacilityPurposeFields = z.infer<typeof facilityPurposeSchema>;

export const facilityPrepaymentSchema = z.object({
  prepaymentAllowed: yesNoNotSureOrEmptySchema,
  lenderConsentRequired: yesNoNotSureOrEmptySchema,
  lockIn: text,
  noticePeriod: text,
  prepaymentPremiumPenalty: text,
  percentageOrFormula: text,
  sourceOfFundsRestriction: text,
  ipoProceedsTreatment: text,
  otherConditions: text,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type FacilityPrepayment = z.infer<typeof facilityPrepaymentSchema>;

export const facilityRecordSchema = z.object({
  id: idSchema,
  borrower: facilityBorrowerSchema,
  lender: facilityLenderSchema,
  facilityType: z.enum(['', ...FACILITY_TYPE_VALUES]),
  fundBasedNonFundBased: z.enum(['', ...FUND_NON_FUND_VALUES]),
  securedUnsecured: z.enum(['', ...SECURED_CLASSIFICATION_VALUES]),
  sanctionAndUtilisation: facilitySanctionAndUtilisationSchema,
  interest: facilityInterestSchema,
  tenorAndRepayment: facilityTenorAndRepaymentSchema,
  purpose: facilityPurposeSchema,
  prepayment: facilityPrepaymentSchema,
});
export type FacilityRecord = z.infer<typeof facilityRecordSchema>;

export const financialIndebtednessAndFacilityMasterSchema = z.object({
  borrowingSnapshot: borrowingSnapshotSchema,
  facilities: z.array(facilityRecordSchema),
});
export type FinancialIndebtednessAndFacilityMaster = z.infer<
  typeof financialIndebtednessAndFacilityMasterSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 2: Security, Charges, Guarantees & Borrowing Powers                 */
/* -------------------------------------------------------------------------- */

export const securityRecordSchema = z.object({
  id: idSchema,
  linkedFacilityId: text,
  securityProvider: text,
  linkedEntityId: text,
  linkedPersonId: text,
  securityType: z.enum(['', ...SECURITY_TYPE_VALUES]),
  securedObject: z.enum(['', ...SECURED_OBJECT_VALUES]),
  linkedPropertyId: text,
  linkedAssetId: text,
  assetDescription: text,
  chargeRanking: z.enum(['', ...CHARGE_RANKING_VALUES]),
  sharedWithAnotherLender: yesNoNotSureOrEmptySchema,
  otherLenders: text,
  interCreditorAgreement: yesNoNotSureOrEmptySchema,
  chargeHolder: text,
  amountSecured: decimalStringSchema,
  maximumSecuredAmount: decimalStringSchema,
  notes: text,
});
export type SecurityRecord = z.infer<typeof securityRecordSchema>;

export const chargeRecordSchema = z.object({
  id: idSchema,
  linkedSecurityId: text,
  linkedFacilityId: text,
  chargeIdentifier: text,
  creationDate: text,
  modificationDate: text,
  satisfactionDate: text,
  status: z.enum(['', ...CHARGE_STATUS_VALUES]),
  rocFilingTypeReference: text,
  srn: text,
  certificateReceived: yesNoNotSureOrEmptySchema,
  amountSecured: decimalStringSchema,
  chargeHolder: text,
  assetDescription: text,
  modificationPending: yesNoNotSureOrEmptySchema,
  satisfactionPending: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ChargeRecord = z.infer<typeof chargeRecordSchema>;

export const guaranteeRecordSchema = z.object({
  id: idSchema,
  guaranteeType: z.enum(['', ...GUARANTEE_TYPE_VALUES]),
  guarantor: text,
  linkedPromoterDirectorEntityId: text,
  borrower: text,
  beneficiaryLender: text,
  linkedFacilityId: text,
  guaranteeDate: text,
  guaranteeAmountCap: decimalStringSchema,
  continuingGuarantee: yesNoNotSureOrEmptySchema,
  expiry: text,
  releaseConditions: text,
  ipoListingReleaseProposed: yesNoNotSureOrEmptySchema,
  lenderConsentRequired: yesNoNotSureOrEmptySchema,
  invocationStatus: text,
  counterGuarantee: yesNoNotSureOrEmptySchema,
  securitySupportingGuarantee: text,
  currentStatus: text,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  purpose: text,
  boardApproval: yesNoNotSureOrEmptySchema,
  shareholderApproval: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type GuaranteeRecord = z.infer<typeof guaranteeRecordSchema>;

export const borrowingPowersSchema = z.object({
  boardBorrowingResolutionExists: yesNoNotSureOrEmptySchema,
  resolutionDateReference: text,
  approvedBorrowingLimit: decimalStringSchema,
  shareholderBorrowingApprovalExists: yesNoNotSureOrEmptySchema,
  shareholderResolutionDateReference: text,
  shareholderApprovedLimit: decimalStringSchema,
  articlesPermitBorrowing: yesNoNotSureOrEmptySchema,
  lenderImposedBorrowingCap: decimalStringSchema,
  authorityState: z.enum(['', ...BORROWING_AUTHORITY_STATE_VALUES]),
  notes: text,
});
export type BorrowingPowers = z.infer<typeof borrowingPowersSchema>;

export const securityChargesGuaranteesAndBorrowingPowersSchema = z.object({
  securities: z.array(securityRecordSchema),
  charges: z.array(chargeRecordSchema),
  guarantees: z.array(guaranteeRecordSchema),
  borrowingPowers: borrowingPowersSchema,
});
export type SecurityChargesGuaranteesAndBorrowingPowers = z.infer<
  typeof securityChargesGuaranteesAndBorrowingPowersSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 3: Covenants, Defaults, Waivers & Lender Consents                   */
/* -------------------------------------------------------------------------- */

export const financialCovenantDetailsSchema = z.object({
  covenantName: text,
  category: z.enum(['', ...FINANCIAL_COVENANT_CATEGORY_VALUES]),
  formula: text,
  thresholdOperator: text,
  thresholdValue: decimalStringSchema,
  testingFrequency: text,
  latestTestedPeriod: text,
  actualValue: decimalStringSchema,
  complianceStatus: z.enum(['', ...COVENANT_COMPLIANCE_STATUS_VALUES]),
  complianceCertificateSubmitted: yesNoNotSureOrEmptySchema,
  curePeriod: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type FinancialCovenantDetails = z.infer<typeof financialCovenantDetailsSchema>;

export const restrictiveCovenantDetailsSchema = z.object({
  trigger: z.enum(['', ...RESTRICTIVE_COVENANT_TRIGGER_VALUES]),
  consentRequired: yesNoNotSureOrEmptySchema,
  priorIntimationRequired: yesNoNotSureOrEmptySchema,
  threshold: text,
  exceptions: text,
  currentStatus: text,
  notes: text,
});
export type RestrictiveCovenantDetails = z.infer<typeof restrictiveCovenantDetailsSchema>;

export const covenantRecordSchema = z.object({
  id: idSchema,
  linkedFacilityId: text,
  covenantType: z.enum(['', ...COVENANT_TYPE_VALUES]),
  financialDetails: financialCovenantDetailsSchema,
  restrictiveDetails: restrictiveCovenantDetailsSchema,
});
export type CovenantRecord = z.infer<typeof covenantRecordSchema>;

export const lenderConsentRecordSchema = z.object({
  id: idSchema,
  linkedFacilityId: text,
  lenderName: text,
  ipoConsentRequirement: z.enum(['', ...IPO_CONSENT_REQUIREMENT_VALUES]),
  requirementBasis: text,
  consentRequested: yesNoNotSureOrEmptySchema,
  requestDate: text,
  consentReceived: yesNoNotSureOrEmptySchema,
  consentDate: text,
  conditionsAttached: yesNoNotSureOrEmptySchema,
  conditions: text,
  conditionsSatisfied: yesNoNotSureOrEmptySchema,
  expiry: text,
  followUpRequired: yesNoNotSureOrEmptySchema,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type LenderConsentRecord = z.infer<typeof lenderConsentRecordSchema>;

export const defaultEventRecordSchema = z.object({
  id: idSchema,
  linkedFacilityId: text,
  eventType: z.enum(['', ...DEFAULT_EVENT_TYPE_VALUES]),
  eventDate: text,
  amount: decimalStringSchema,
  daysDelayed: text,
  continuingStatus: z.enum(['', ...EVENT_CONTINUING_STATUS_VALUES]),
  cureDate: text,
  penalInterest: decimalStringSchema,
  waiverObtained: yesNoNotSureOrEmptySchema,
  waiverDate: text,
  conditions: text,
  auditorInformed: yesNoNotSureOrEmptySchema,
  financialStatementsDisclosureStatus: text,
  notes: text,
});
export type DefaultEventRecord = z.infer<typeof defaultEventRecordSchema>;

export const restructuringEventRecordSchema = z.object({
  id: idSchema,
  linkedFacilityId: text,
  eventType: z.enum(['', ...RESTRUCTURING_EVENT_TYPE_VALUES]),
  eventDate: text,
  reason: text,
  amount: decimalStringSchema,
  concessionHaircut: text,
  currentStatus: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type RestructuringEventRecord = z.infer<typeof restructuringEventRecordSchema>;

export const crossDefaultRecordSchema = z.object({
  id: idSchema,
  linkedFacilityId: text,
  clauseExists: yesNoNotSureOrEmptySchema,
  linkedFacilityIds: z.array(text),
  threshold: text,
  trigger: text,
  crossAcceleration: yesNoNotSureOrEmptySchema,
  currentlyTriggered: yesNoNotSureOrEmptySchema,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type CrossDefaultRecord = z.infer<typeof crossDefaultRecordSchema>;

export const covenantsDefaultsWaiversAndLenderConsentsSchema = z.object({
  covenants: z.array(covenantRecordSchema),
  lenderConsents: z.array(lenderConsentRecordSchema),
  defaultEvents: z.array(defaultEventRecordSchema),
  restructuringEvents: z.array(restructuringEventRecordSchema),
  crossDefaults: z.array(crossDefaultRecordSchema),
});
export type CovenantsDefaultsWaiversAndLenderConsents = z.infer<
  typeof covenantsDefaultsWaiversAndLenderConsentsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 4: Immovable Properties & Occupancy Rights                          */
/* -------------------------------------------------------------------------- */

export const propertyIdentitySchema = z.object({
  propertyName: text,
  address: text,
  city: text,
  state: text,
  country: text,
  surveyKhasraPlotNumber: text,
  landArea: decimalStringSchema,
  builtUpArea: decimalStringSchema,
  areaUnit: text,
  propertyType: z.enum(['', ...PROPERTY_TYPE_VALUES]),
  businessPurpose: text,
  linkedBusinessOperationsFacilityId: text,
});
export type PropertyIdentity = z.infer<typeof propertyIdentitySchema>;

export const ownedPropertyDetailsSchema = z.object({
  legalOwner: text,
  titleInIssuerName: yesNoNotSureOrEmptySchema,
  acquisitionDate: text,
  seller: text,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  acquisitionConsideration: decimalStringSchema,
  titleDeedType: text,
  titleDeedDate: text,
  registrationDetails: text,
  mutationStatus: text,
  propertyTaxStatus: text,
  possessionStatus: text,
  encumbered: yesNoNotSureOrEmptySchema,
  linkedSecurityIds: z.array(text),
  titleSearchStatus: text,
  titleDefectStatus: text,
  thirdPartyClaimStatus: text,
  professionalTitleReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type OwnedPropertyDetails = z.infer<typeof ownedPropertyDetailsSchema>;

export const leasedPropertyDetailsSchema = z.object({
  lessorLicensor: text,
  linkedRelatedPartyEntityId: text,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  agreementType: text,
  agreementDate: text,
  commencement: text,
  expiry: text,
  lockIn: text,
  monthlyAnnualRent: decimalStringSchema,
  securityDeposit: decimalStringSchema,
  escalation: text,
  renewalOption: yesNoNotSureOrEmptySchema,
  renewalTerms: text,
  noticePeriod: text,
  terminationRights: text,
  subLettingRights: yesNoNotSureOrEmptySchema,
  assignmentRights: yesNoNotSureOrEmptySchema,
  changeOfControlRestriction: yesNoNotSureOrEmptySchema,
  registrationRequirementStatus: text,
  stampDutyStatus: text,
  lessorTitleVerified: yesNoNotSureOrEmptySchema,
  renewalStatus: text,
  notes: text,
});
export type LeasedPropertyDetails = z.infer<typeof leasedPropertyDetailsSchema>;

export const propertyRecordSchema = z.object({
  id: idSchema,
  identity: propertyIdentitySchema,
  occupancyBasis: z.enum(['', ...OCCUPANCY_BASIS_VALUES]),
  ownedDetails: ownedPropertyDetailsSchema,
  leasedDetails: leasedPropertyDetailsSchema,
});
export type PropertyRecord = z.infer<typeof propertyRecordSchema>;

export const propertyIssueRecordSchema = z.object({
  id: idSchema,
  linkedPropertyId: text,
  issueType: z.enum(['', ...PROPERTY_ISSUE_TYPE_VALUES]),
  explanation: text,
  readinessState: z.enum(['', ...READINESS_STATE_VALUES]),
  remediation: text,
  responsibleOwner: text,
  targetResolutionDate: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type PropertyIssueRecord = z.infer<typeof propertyIssueRecordSchema>;

export const immovablePropertiesAndOccupancyRightsSchema = z.object({
  properties: z.array(propertyRecordSchema),
  propertyIssues: z.array(propertyIssueRecordSchema),
});
export type ImmovablePropertiesAndOccupancyRights = z.infer<
  typeof immovablePropertiesAndOccupancyRightsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 5: Material Assets, Encumbrance & Insurance Linkage                 */
/* -------------------------------------------------------------------------- */

export const materialAssetRecordSchema = z.object({
  id: idSchema,
  description: text,
  assetClass: z.enum(['', ...ASSET_CLASS_VALUES]),
  identificationSerialRegistrationNumber: text,
  location: text,
  linkedPropertyId: text,
  linkedBusinessFacilityId: text,
  legalOwner: text,
  ownershipBasis: z.enum(['', ...ASSET_OWNERSHIP_BASIS_VALUES]),
  acquisitionDate: text,
  acquisitionCost: decimalStringSchema,
  latestBookValue: decimalStringSchema,
  operationalStatus: text,
  materialToOperations: yesNoNotSureOrEmptySchema,
  imported: yesNoNotSureOrEmptySchema,
  vendor: text,
  warrantyStatus: text,
  amcStatus: text,
  encumbered: yesNoNotSureOrEmptySchema,
  linkedSecurityIds: z.array(text),
  linkedFacilityId: text,
  sourceStatus: text,
  notes: text,
});
export type MaterialAssetRecord = z.infer<typeof materialAssetRecordSchema>;

export const assetFinancialsReconciliationSchema = z.object({
  id: idSchema,
  linkedAssetId: text,
  materialAssetRegisterValue: decimalStringSchema,
  linkedFinancialsAmount: decimalStringSchema,
  difference: decimalStringSchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  professionalReconciliationPending: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type AssetFinancialsReconciliation = z.infer<typeof assetFinancialsReconciliationSchema>;

export const insuranceLinkageRecordSchema = z.object({
  id: idSchema,
  linkedPropertyId: text,
  linkedAssetId: text,
  linkedBusinessOperationsPolicyId: text,
  insurer: text,
  policyType: text,
  coverageAmount: decimalStringSchema,
  assetPropertyCovered: text,
  startDate: text,
  expiryDate: text,
  deductible: decimalStringSchema,
  lenderLossPayeeClause: yesNoNotSureOrEmptySchema,
  policyAssignedNotedToLender: yesNoNotSureOrEmptySchema,
  coverageStatus: z.enum(['', ...INSURANCE_COVERAGE_STATUS_VALUES]),
  renewalStatus: text,
  underInsuranceConcern: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type InsuranceLinkageRecord = z.infer<typeof insuranceLinkageRecordSchema>;

export const ipContractualDependencyRecordSchema = z.object({
  id: idSchema,
  linkedBusinessOperationsIpRecordId: text,
  ownedLicensed: text,
  licensor: text,
  relatedParty: yesNoNotSureOrEmptySchema,
  exclusiveNonExclusive: text,
  transferable: yesNoNotSureOrEmptySchema,
  term: text,
  termination: text,
  changeOfControl: yesNoNotSureOrEmptySchema,
  encumbered: yesNoNotSureOrEmptySchema,
  securityGranted: yesNoNotSureOrEmptySchema,
  linkedContractId: text,
  notes: text,
});
export type IpContractualDependencyRecord = z.infer<typeof ipContractualDependencyRecordSchema>;

export const materialAssetsEncumbranceAndInsuranceLinkageSchema = z.object({
  assets: z.array(materialAssetRecordSchema),
  assetFinancialsReconciliations: z.array(assetFinancialsReconciliationSchema),
  insuranceLinkages: z.array(insuranceLinkageRecordSchema),
  ipContractualDependencies: z.array(ipContractualDependencyRecordSchema),
});
export type MaterialAssetsEncumbranceAndInsuranceLinkage = z.infer<
  typeof materialAssetsEncumbranceAndInsuranceLinkageSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 6: Material Business, Strategic & Other Contracts                     */
/* -------------------------------------------------------------------------- */

export const contractPartiesSchema = z.object({
  counterparty: text,
  linkedGroupEntityId: text,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  role: z.enum(['', ...COUNTERPARTY_ROLE_VALUES]),
  jurisdiction: text,
});
export type ContractParties = z.infer<typeof contractPartiesSchema>;

export const contractBasicTermsSchema = z.object({
  agreementTitle: text,
  executionDate: text,
  effectiveDate: text,
  expiry: text,
  contractTerm: text,
  autoRenewal: yesNoNotSureOrEmptySchema,
  renewalMechanism: text,
  amendmentHistory: text,
  status: z.enum(['', ...CONTRACT_STATUS_VALUES]),
  governingLaw: text,
  disputeResolutionMechanism: text,
  arbitrationSeatJurisdiction: text,
  notes: text,
});
export type ContractBasicTerms = z.infer<typeof contractBasicTermsSchema>;

export const contractCommercialImportanceSchema = z.object({
  contractValue: decimalStringSchema,
  minimumCommitment: decimalStringSchema,
  annualRevenueCostAttributable: decimalStringSchema,
  percentageOfIssuerRevenueCost: decimalStringSchema,
  takeOrPay: yesNoNotSureOrEmptySchema,
  minimumPurchase: decimalStringSchema,
  minimumVolume: decimalStringSchema,
  exclusivity: yesNoNotSureOrEmptySchema,
  territory: text,
  performanceMilestones: text,
  sla: text,
  pricingMechanism: text,
  escalationMechanism: text,
});
export type ContractCommercialImportance = z.infer<typeof contractCommercialImportanceSchema>;

export const contractRightsAndObligationsSchema = z.object({
  materialIssuerObligations: yesNoNotSureOrEmptySchema,
  materialCounterpartyObligations: yesNoNotSureOrEmptySchema,
  conditionsPrecedent: yesNoNotSureOrEmptySchema,
  performanceGuarantee: yesNoNotSureOrEmptySchema,
  warranties: yesNoNotSureOrEmptySchema,
  indemnities: yesNoNotSureOrEmptySchema,
  limitationOfLiability: yesNoNotSureOrEmptySchema,
  liquidatedDamages: yesNoNotSureOrEmptySchema,
  penalties: yesNoNotSureOrEmptySchema,
  securityDeposit: decimalStringSchema,
  bankGuaranteePbg: yesNoNotSureOrEmptySchema,
  retention: decimalStringSchema,
  insuranceRequirement: yesNoNotSureOrEmptySchema,
  auditRights: yesNoNotSureOrEmptySchema,
  confidentiality: yesNoNotSureOrEmptySchema,
  ipOwnership: yesNoNotSureOrEmptySchema,
  dataRights: yesNoNotSureOrEmptySchema,
  nonCompete: yesNoNotSureOrEmptySchema,
  nonSolicit: yesNoNotSureOrEmptySchema,
  exclusivityClause: yesNoNotSureOrEmptySchema,
  mostFavouredCustomer: yesNoNotSureOrEmptySchema,
  changeInLaw: yesNoNotSureOrEmptySchema,
  forceMajeure: yesNoNotSureOrEmptySchema,
  rightsObligationsNotes: text,
});
export type ContractRightsAndObligations = z.infer<typeof contractRightsAndObligationsSchema>;

export const contractTerminationSchema = z.object({
  terminationForConvenience: yesNoNotSureOrEmptySchema,
  terminationForBreach: yesNoNotSureOrEmptySchema,
  insolvencyTermination: yesNoNotSureOrEmptySchema,
  changeOfControlTermination: yesNoNotSureOrEmptySchema,
  ipoListingTrigger: yesNoNotSureOrEmptySchema,
  promoterChangeTrigger: yesNoNotSureOrEmptySchema,
  noticePeriod: text,
  curePeriod: text,
  terminationPayment: decimalStringSchema,
  survivalObligations: text,
});
export type ContractTermination = z.infer<typeof contractTerminationSchema>;

export const contractAssignmentChangeOfControlSchema = z.object({
  assignmentRestricted: yesNoNotSureOrEmptySchema,
  counterpartyConsentRequired: yesNoNotSureOrEmptySchema,
  changeOfControlConsentRequired: yesNoNotSureOrEmptySchema,
  ipoTreatedAsChangeOfControl: yesNoNotSureOrEmptySchema,
  promoterDilutionRestriction: yesNoNotSureOrEmptySchema,
  consentRequested: yesNoNotSureOrEmptySchema,
  consentReceived: yesNoNotSureOrEmptySchema,
  consentDate: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type ContractAssignmentChangeOfControl = z.infer<
  typeof contractAssignmentChangeOfControlSchema
>;

export const contractRecordSchema = z.object({
  id: idSchema,
  category: z.enum(['', ...CONTRACT_CATEGORY_VALUES]),
  parties: contractPartiesSchema,
  basicTerms: contractBasicTermsSchema,
  commercialImportance: contractCommercialImportanceSchema,
  rightsAndObligations: contractRightsAndObligationsSchema,
  termination: contractTerminationSchema,
  assignmentChangeOfControl: contractAssignmentChangeOfControlSchema,
});
export type ContractRecord = z.infer<typeof contractRecordSchema>;

export const materialBusinessStrategicAndOtherContractsSchema = z.object({
  contracts: z.array(contractRecordSchema),
});
export type MaterialBusinessStrategicAndOtherContracts = z.infer<
  typeof materialBusinessStrategicAndOtherContractsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 7: Contract Materiality, Expiry & Inspection Readiness              */
/* -------------------------------------------------------------------------- */

export const contractMaterialityRecordSchema = z.object({
  id: idSchema,
  linkedContractId: text,
  ordinaryCourse: yesNoNotSureOrEmptySchema,
  materialOperationally: yesNoNotSureOrEmptySchema,
  materialFinancially: yesNoNotSureOrEmptySchema,
  materialDueToDependency: yesNoNotSureOrEmptySchema,
  materialDueToUnusualRightsObligations: yesNoNotSureOrEmptySchema,
  relatedPartyAgreement: yesNoNotSureOrEmptySchema,
  nonOrdinaryCourseAgreement: yesNoNotSureOrEmptySchema,
  enteredWithinPrecedingTwoYears: yesNoNotSureOrEmptySchema,
  stillSubsisting: yesNoNotSureOrEmptySchema,
  potentiallyRelevantToDrhp: yesNoNotSureOrEmptySchema,
  materialityStatus: z.enum(['', ...MATERIALITY_STATUS_VALUES]),
  professionalMaterialityReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ContractMaterialityRecord = z.infer<typeof contractMaterialityRecordSchema>;

export const nonOrdinaryCourseReviewRecordSchema = z.object({
  id: idSchema,
  linkedContractId: text,
  reasonOutsideOrdinaryCourse: text,
  executionDate: text,
  stillSubsisting: yesNoNotSureOrEmptySchema,
  materialityBasis: text,
  proposedDrhpLocation: text,
  inspectionCandidate: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type NonOrdinaryCourseReviewRecord = z.infer<typeof nonOrdinaryCourseReviewRecordSchema>;

export const breachDisputeReadinessRecordSchema = z.object({
  id: idSchema,
  linkedContractId: text,
  currentBreach: yesNoNotSureOrEmptySchema,
  historicalMaterialBreach: yesNoNotSureOrEmptySchema,
  counterpartyAllegedIssuerBreach: yesNoNotSureOrEmptySchema,
  issuerAllegedCounterpartyBreach: yesNoNotSureOrEmptySchema,
  noticeReceived: yesNoNotSureOrEmptySchema,
  curePeriodActive: yesNoNotSureOrEmptySchema,
  terminationThreatened: yesNoNotSureOrEmptySchema,
  damagesClaimed: decimalStringSchema,
  disputeLitigationExists: yesNoNotSureOrEmptySchema,
  linkedFutureLitigationRecordId: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type BreachDisputeReadinessRecord = z.infer<typeof breachDisputeReadinessRecordSchema>;

export const inspectionCandidateRecordSchema = z.object({
  id: idSchema,
  linkedContractId: text,
  externalDocumentReference: text,
  candidateType: z.enum(['', ...INSPECTION_CANDIDATE_TYPE_VALUES]),
  sourceWorkstream: text,
  documentDate: text,
  currentVersion: text,
  executedFinal: yesNoNotSureOrEmptySchema,
  inspectionCandidate: yesNoNotSureOrEmptySchema,
  confidentialityConcern: yesNoNotSureOrEmptySchema,
  redactionProfessionalReview: yesNoNotSureOrEmptySchema,
  availabilityStatus: text,
  notes: text,
});
export type InspectionCandidateRecord = z.infer<typeof inspectionCandidateRecordSchema>;

export const contractMaterialityExpiryAndInspectionReadinessSchema = z.object({
  materialityRecords: z.array(contractMaterialityRecordSchema),
  nonOrdinaryCourseReviews: z.array(nonOrdinaryCourseReviewRecordSchema),
  breachDisputeReadiness: z.array(breachDisputeReadinessRecordSchema),
  inspectionCandidates: z.array(inspectionCandidateRecordSchema),
});
export type ContractMaterialityExpiryAndInspectionReadiness = z.infer<
  typeof contractMaterialityExpiryAndInspectionReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 8: Reconciliation, Changes & Issuer Confirmations                   */
/* -------------------------------------------------------------------------- */

export const financialsReconciliationSchema = z.object({
  bacFacilityTotal: decimalStringSchema,
  financialsValue: decimalStringSchema,
  difference: decimalStringSchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type FinancialsReconciliation = z.infer<typeof financialsReconciliationSchema>;

export const objectsOfIssueRepaymentItemSchema = z.object({
  id: idSchema,
  linkedObjectsOfIssueRecordId: text,
  linkedFacilityId: text,
  lender: text,
  proposedRepayment: decimalStringSchema,
  relevantOutstandingAmount: decimalStringSchema,
  accruedInterest: decimalStringSchema,
  prepaymentPenalty: decimalStringSchema,
  lenderConsentNocRequirement: z.enum(['', ...IPO_CONSENT_REQUIREMENT_VALUES]),
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type ObjectsOfIssueRepaymentItem = z.infer<typeof objectsOfIssueRepaymentItemSchema>;

export const groupEntitiesReconciliationSchema = z.object({
  interCompanyLoansReconciled: yesNoNotSureOrEmptySchema,
  relatedPartyBorrowingsReconciled: yesNoNotSureOrEmptySchema,
  corporateGuaranteesReconciled: yesNoNotSureOrEmptySchema,
  securityCollateralReconciled: yesNoNotSureOrEmptySchema,
  groupDependenciesReconciled: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type GroupEntitiesReconciliation = z.infer<typeof groupEntitiesReconciliationSchema>;

export const capitalOwnershipReconciliationSchema = z.object({
  promotersReconciled: yesNoNotSureOrEmptySchema,
  promoterShareholdingReconciled: yesNoNotSureOrEmptySchema,
  pledgedEncumberedSharesReconciled: yesNoNotSureOrEmptySchema,
  guaranteeProvidersReconciled: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type CapitalOwnershipReconciliation = z.infer<typeof capitalOwnershipReconciliationSchema>;

export const businessOperationsReconciliationSchema = z.object({
  facilitiesMapped: yesNoNotSureOrEmptySchema,
  officesMapped: yesNoNotSureOrEmptySchema,
  plantsMapped: yesNoNotSureOrEmptySchema,
  warehousesMapped: yesNoNotSureOrEmptySchema,
  materialMachineryMapped: yesNoNotSureOrEmptySchema,
  ipMapped: yesNoNotSureOrEmptySchema,
  insuranceMapped: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type BusinessOperationsReconciliation = z.infer<
  typeof businessOperationsReconciliationSchema
>;

export const bacChangeRecordSchema = z.object({
  id: idSchema,
  eventType: z.enum(['', ...BAC_CHANGE_EVENT_TYPE_VALUES]),
  effectiveDate: text,
  relatedRecordType: z.enum(['', ...RELATED_RECORD_TYPE_VALUES]),
  relatedRecordId: text,
  previousState: text,
  newState: text,
  reason: text,
  approval: text,
  sourceReference: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type BacChangeRecord = z.infer<typeof bacChangeRecordSchema>;

export const bacConfirmationsSchema = z.object({
  allMaterialBorrowingsDisclosed: yesNoNotSureOrEmptySchema,
  fundNonFundFacilitiesIncluded: yesNoNotSureOrEmptySchema,
  securedUnsecuredFacilitiesIncluded: yesNoNotSureOrEmptySchema,
  relatedPartyBorrowingsIncluded: yesNoNotSureOrEmptySchema,
  sanctionOutstandingAmountsCurrent: yesNoNotSureOrEmptySchema,
  repaymentTermsComplete: yesNoNotSureOrEmptySchema,
  prepaymentRestrictionsDisclosed: yesNoNotSureOrEmptySchema,
  allSecuritiesCollateralDisclosed: yesNoNotSureOrEmptySchema,
  personalGuaranteesDisclosed: yesNoNotSureOrEmptySchema,
  corporateGuaranteesDisclosed: yesNoNotSureOrEmptySchema,
  registrableChargesConsidered: yesNoNotSureOrEmptySchema,
  chargeModificationsSatisfactionsDisclosed: yesNoNotSureOrEmptySchema,
  financialCovenantsDisclosed: yesNoNotSureOrEmptySchema,
  restrictiveCovenantsDisclosed: yesNoNotSureOrEmptySchema,
  defaultsDelaysDisclosed: yesNoNotSureOrEmptySchema,
  waiversCuresDisclosed: yesNoNotSureOrEmptySchema,
  crossDefaultsDisclosed: yesNoNotSureOrEmptySchema,
  ipoChangeOfControlLenderConsentRequirementsReviewed: yesNoNotSureOrEmptySchema,
  lenderConsentsAccuratelyShown: yesNoNotSureOrEmptySchema,
  debtProposedForIpoRepaymentReconcilesWithObjects: yesNoNotSureOrEmptySchema,
  materialOwnedPropertiesDisclosed: yesNoNotSureOrEmptySchema,
  materialLeasedLicensedPremisesDisclosed: yesNoNotSureOrEmptySchema,
  relatedPartyPropertyArrangementsDisclosed: yesNoNotSureOrEmptySchema,
  titleLeaseIssuesDisclosed: yesNoNotSureOrEmptySchema,
  materialAssetEncumbrancesDisclosed: yesNoNotSureOrEmptySchema,
  criticalInsuranceLinkageCaptured: yesNoNotSureOrEmptySchema,
  materialContractsDisclosed: yesNoNotSureOrEmptySchema,
  nonOrdinaryCourseMaterialAgreementsConsidered: yesNoNotSureOrEmptySchema,
  expiryRenewalRisksDisclosed: yesNoNotSureOrEmptySchema,
  changeOfControlIpoClausesConsidered: yesNoNotSureOrEmptySchema,
  contractBreachesDisputesIdentified: yesNoNotSureOrEmptySchema,
  linkedWorkstreamDifferencesFlagged: yesNoNotSureOrEmptySchema,
  professionalConfirmationRequired: yesNoNotSureOrEmptySchema,
});
export type BacConfirmations = z.infer<typeof bacConfirmationsSchema>;

export const reconciliationChangesAndIssuerConfirmationsSchema = z.object({
  financialsReconciliation: financialsReconciliationSchema,
  objectsOfIssueRepayments: z.array(objectsOfIssueRepaymentItemSchema),
  groupEntitiesReconciliation: groupEntitiesReconciliationSchema,
  capitalOwnershipReconciliation: capitalOwnershipReconciliationSchema,
  businessOperationsReconciliation: businessOperationsReconciliationSchema,
  changes: z.array(bacChangeRecordSchema),
  confirmations: bacConfirmationsSchema,
});
export type ReconciliationChangesAndIssuerConfirmations = z.infer<
  typeof reconciliationChangesAndIssuerConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Root payload                                                                */
/* -------------------------------------------------------------------------- */

export const BAC_SECTION_IDS = [
  'financial-indebtedness-and-facility-master',
  'security-charges-guarantees-and-borrowing-powers',
  'covenants-defaults-waivers-and-lender-consents',
  'immovable-properties-and-occupancy-rights',
  'material-assets-encumbrance-and-insurance-linkage',
  'material-business-strategic-and-other-contracts',
  'contract-materiality-expiry-and-inspection-readiness',
  'reconciliation-changes-and-issuer-confirmations',
] as const;

export type BorrowingsAssetsContractsSectionId = (typeof BAC_SECTION_IDS)[number];

export const sectionIdSchema = z.enum(BAC_SECTION_IDS);

export const borrowingsAssetsContractsPayloadSchema = z.object({
  schemaVersion: z.literal(BORROWINGS_ASSETS_CONTRACTS_SCHEMA_VERSION),
  financialIndebtednessAndFacilityMaster: financialIndebtednessAndFacilityMasterSchema,
  securityChargesGuaranteesAndBorrowingPowers: securityChargesGuaranteesAndBorrowingPowersSchema,
  covenantsDefaultsWaiversAndLenderConsents: covenantsDefaultsWaiversAndLenderConsentsSchema,
  immovablePropertiesAndOccupancyRights: immovablePropertiesAndOccupancyRightsSchema,
  materialAssetsEncumbranceAndInsuranceLinkage: materialAssetsEncumbranceAndInsuranceLinkageSchema,
  materialBusinessStrategicAndOtherContracts: materialBusinessStrategicAndOtherContractsSchema,
  contractMaterialityExpiryAndInspectionReadiness:
    contractMaterialityExpiryAndInspectionReadinessSchema,
  reconciliationChangesAndIssuerConfirmations: reconciliationChangesAndIssuerConfirmationsSchema,
});

export type BorrowingsAssetsContractsPayload = z.infer<
  typeof borrowingsAssetsContractsPayloadSchema
>;
