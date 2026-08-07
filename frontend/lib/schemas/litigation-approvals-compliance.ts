/**
 * Canonical Litigation, Approvals & Compliance payload schema (Increment LAC1).
 *
 * - Persist `LitigationApprovalsCompliancePayload` (`schemaVersion: 1`) for LAC2.
 * - One canonical master per real-world object: Matter, Approval.
 * - Monetary amounts and percentages are Decimal-safe strings (`''` when empty).
 * - Ternary answers: `'' | 'yes' | 'no' | 'not_sure'`.
 * - Computed totals, ratios and assessment outcomes are DERIVED — never persisted here.
 * - UI labels live in `lib/litigation-approvals-compliance/options.ts`.
 */

import { z } from 'zod';

export const LITIGATION_APPROVALS_COMPLIANCE_SCHEMA_VERSION = 1 as const;

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
  'missing-information',
  'pending-linked-workstream',
  'pending-professional-confirmation',
] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUS_VALUES)[number];

export const CURRENT_HISTORICAL_VALUES = ['current', 'historical'] as const;
export type CurrentHistorical = (typeof CURRENT_HISTORICAL_VALUES)[number];

export const STANDALONE_CONSOLIDATED_VALUES = ['standalone', 'consolidated', 'both'] as const;
export type StandaloneConsolidated = (typeof STANDALONE_CONSOLIDATED_VALUES)[number];

export const READINESS_STATE_VALUES = [
  'appears-consistent',
  'potential-concern',
  'missing-information',
  'pending-professional-confirmation',
] as const;
export type ReadinessState = (typeof READINESS_STATE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 1 enums — legal universe & materiality                            */
/* -------------------------------------------------------------------------- */

export const LEGAL_PARTY_CATEGORY_VALUES = [
  'issuer',
  'promoter',
  'director',
  'kmp',
  'smp',
  'former-director',
  'former-kmp',
  'selling-shareholder',
  'subsidiary',
  'material-subsidiary',
  'group-company',
  'promoter-group-entity',
  'associate',
  'joint-venture',
  'other-relevant-person',
  'other-relevant-entity',
] as const;
export type LegalPartyCategory = (typeof LEGAL_PARTY_CATEGORY_VALUES)[number];

export const MATERIALITY_METRIC_TYPE_VALUES = [
  'pat',
  'revenue',
  'turnover',
  'net-worth',
  'total-assets',
  'absolute-amount',
  'other',
] as const;
export type MaterialityMetricType = (typeof MATERIALITY_METRIC_TYPE_VALUES)[number];

export const QUALITATIVE_CRITERION_TYPE_VALUES = [
  'business-operations',
  'reputation',
  'licence-approval',
  'key-asset',
  'management',
  'financing',
  'ipo-listing',
  'ability-to-continue-material-activity',
  'financial-position',
  'future-operations',
  'other',
] as const;
export type QualitativeCriterionType = (typeof QUALITATIVE_CRITERION_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 2 enums — matter master                                             */
/* -------------------------------------------------------------------------- */

export const MATTER_CATEGORY_VALUES = [
  'criminal',
  'civil',
  'commercial',
  'arbitration',
  'tax',
  'regulatory',
  'statutory',
  'administrative',
  'consumer',
  'labour-employment',
  'environmental',
  'intellectual-property',
  'property-land',
  'insolvency-ibc',
  'competition-antitrust',
  'data-privacy-cyber',
  'customs',
  'foreign-exchange-fema',
  'company-law-nclt',
  'securities-law',
  'economic-offence',
  'other',
] as const;
export type MatterCategory = (typeof MATTER_CATEGORY_VALUES)[number];

export const MATTER_DIRECTION_VALUES = [
  'filed-by-relevant-party',
  'filed-against-relevant-party',
  'cross-proceedings',
  'investigation-enquiry',
  'notice-or-proceeding-by-authority',
  'suo-motu-authority-action',
  'other',
] as const;
export type MatterDirection = (typeof MATTER_DIRECTION_VALUES)[number];

export const MATTER_PARTY_ROLE_VALUES = [
  'petitioner',
  'claimant',
  'complainant',
  'appellant',
  'respondent',
  'defendant',
  'accused',
  'co-accused',
  'noticee',
  'investigated-party',
  'other',
] as const;
export type MatterPartyRole = (typeof MATTER_PARTY_ROLE_VALUES)[number];

export const FORUM_CATEGORY_VALUES = [
  'supreme-court',
  'high-court',
  'district-or-civil-court',
  'magistrate-or-criminal-court',
  'nclt',
  'nclat',
  'drt',
  'drat',
  'arbitral-tribunal',
  'consumer-commission',
  'income-tax-authority',
  'gst-authority',
  'customs-authority',
  'sebi',
  'stock-exchange',
  'roc-mca',
  'rbi',
  'competition-commission',
  'pollution-control-board',
  'labour-authority',
  'police-or-investigating-agency',
  'other',
] as const;
export type ForumCategory = (typeof FORUM_CATEGORY_VALUES)[number];

export const PROCEEDING_STAGE_VALUES = [
  'complaint',
  'fir',
  'investigation',
  'show-cause',
  'adjudication',
  'trial',
  'appeal',
  'revision',
  'arbitration',
  'order-passed',
  'stayed',
  'settlement-discussions',
  'closed-or-disposed',
  'other',
] as const;
export type ProceedingStage = (typeof PROCEEDING_STAGE_VALUES)[number];

export const MATTER_OUTCOME_STATUS_VALUES = [
  'pending',
  'partly-decided',
  'decided-in-favour',
  'decided-against',
  'dismissed',
  'withdrawn',
  'settled',
  'compounded',
  'quashed',
  'appeal-pending',
  'closed',
  'other',
] as const;
export type MatterOutcomeStatus = (typeof MATTER_OUTCOME_STATUS_VALUES)[number];

export const MATTER_MATERIALITY_STATE_VALUES = [
  'potentially-material',
  'appears-below-entered-threshold',
  'material-by-board-determination',
  'mandatory-category-review',
  'missing-information',
  'pending-board-determination',
  'pending-professional-confirmation',
] as const;
export type MatterMaterialityState = (typeof MATTER_MATERIALITY_STATE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 3 enums — criminal / regulatory / tax                               */
/* -------------------------------------------------------------------------- */

export const REGULATORY_ACTION_TYPE_VALUES = [
  'notice',
  'show-cause-notice',
  'inspection',
  'investigation',
  'enquiry',
  'adjudication',
  'warning',
  'direction',
  'penalty',
  'suspension',
  'cancellation',
  'restriction',
  'search-seizure',
  'prosecution',
  'compounding',
  'other',
] as const;
export type RegulatoryActionType = (typeof REGULATORY_ACTION_TYPE_VALUES)[number];

export const TAX_TYPE_VALUES = [
  'direct-tax',
  'gst',
  'customs',
  'excise',
  'vat-sales-tax',
  'service-tax',
  'stamp-duty',
  'professional-tax',
  'other',
] as const;
export type TaxType = (typeof TAX_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 4 enums — approvals master                                          */
/* -------------------------------------------------------------------------- */

export const APPROVAL_CATEGORY_VALUES = [
  'corporate',
  'business-sector',
  'factory',
  'labour',
  'environment',
  'pollution',
  'fire',
  'municipal-local',
  'shops-establishments',
  'tax',
  'import-export',
  'customs',
  'foreign-exchange-rbi',
  'fdi-investment',
  'food-drug',
  'telecom',
  'technology',
  'data-privacy',
  'safety',
  'building-occupancy',
  'land-use',
  'electricity-utilities',
  'boiler',
  'waste-hazardous-materials',
  'quality-certification',
  'intellectual-property-registration',
  'sector-regulator',
  'other',
] as const;
export type ApprovalCategory = (typeof APPROVAL_CATEGORY_VALUES)[number];

export const APPROVAL_HOLDER_TYPE_VALUES = [
  'issuer',
  'subsidiary',
  'material-subsidiary',
  'group-company',
  'business-facility-site',
  'business-unit',
  'product',
  'other-linked-entity',
] as const;
export type ApprovalHolderType = (typeof APPROVAL_HOLDER_TYPE_VALUES)[number];

export const APPROVAL_STATUS_VALUES = [
  'valid',
  'application-pending',
  'renewal-pending',
  'expired-renewal-applied',
  'expired-renewal-not-applied',
  'required-not-applied',
  'not-yet-required',
  'suspended',
  'revoked',
  'cancelled',
  'not-sure',
  'pending-professional-confirmation',
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];

export const CONTINUATION_PENDING_RENEWAL_VALUES = [
  'confirmed',
  'management-believes-yes',
  'no',
  'not-sure',
  'pending-professional-confirmation',
] as const;
export type ContinuationPendingRenewal =
  (typeof CONTINUATION_PENDING_RENEWAL_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 5 enums — approval conditions & facility matrix                     */
/* -------------------------------------------------------------------------- */

export const APPROVAL_CONDITION_CATEGORY_VALUES = [
  'periodic-filing',
  'reporting',
  'capacity-limit',
  'environmental-standard',
  'staffing',
  'safety',
  'inspection',
  'testing',
  'display-publication',
  'record-maintenance',
  'fee',
  'insurance',
  'site-specific',
  'other',
] as const;
export type ApprovalConditionCategory =
  (typeof APPROVAL_CONDITION_CATEGORY_VALUES)[number];

export const CONDITION_COMPLIANCE_STATUS_VALUES = [
  'met',
  'pending',
  'delayed',
  'not-sure',
  'not-applicable',
] as const;
export type ConditionComplianceStatus =
  (typeof CONDITION_COMPLIANCE_STATUS_VALUES)[number];

export const REQUIRED_BEFORE_VALUES = [
  'construction',
  'installation',
  'commissioning',
  'operations',
  'acquisition-completion',
  'other',
] as const;
export type RequiredBefore = (typeof REQUIRED_BEFORE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 6 enums — compliance exceptions                                     */
/* -------------------------------------------------------------------------- */

export const COMPLIANCE_DOMAIN_VALUES = [
  'companies-act-mca',
  'securities-law',
  'fema-fdi',
  'labour-employment',
  'provident-fund',
  'esi',
  'wages',
  'posh',
  'occupational-health-safety',
  'factories',
  'environment-pollution',
  'tax',
  'gst',
  'customs-import-export',
  'consumer',
  'competition',
  'data-privacy',
  'cybersecurity',
  'sector-specific',
  'product-standards',
  'legal-metrology',
  'local-municipal',
  'other',
] as const;
export type ComplianceDomain = (typeof COMPLIANCE_DOMAIN_VALUES)[number];

export const COMPLIANCE_ISSUE_TYPE_VALUES = [
  'late-filing',
  'missing-filing',
  'incorrect-filing',
  'missing-register',
  'approval-lapse',
  'non-renewal',
  'delayed-payment',
  'underpayment',
  'governance-lapse',
  'reporting-failure',
  'recordkeeping-issue',
  'operational-non-compliance',
  'other',
] as const;
export type ComplianceIssueType = (typeof COMPLIANCE_ISSUE_TYPE_VALUES)[number];

export const ISSUE_IDENTIFIED_BY_VALUES = [
  'internal-review',
  'auditor',
  'secretarial-auditor',
  'authority-inspection',
  'legal-counsel',
  'management',
  'other',
] as const;
export type IssueIdentifiedBy = (typeof ISSUE_IDENTIFIED_BY_VALUES)[number];

export const STATUTORY_DUE_TYPE_VALUES = [
  'gst',
  'tds',
  'income-tax',
  'pf',
  'esi',
  'customs',
  'excise',
  'vat',
  'professional-tax',
  'labour-welfare-fund',
  'cess',
  'stamp-duty',
  'other',
] as const;
export type StatutoryDueType = (typeof STATUTORY_DUE_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 7 enums — creditors, penalties, developments                        */
/* -------------------------------------------------------------------------- */

export const MATERIAL_CREDITOR_THRESHOLD_TYPE_VALUES = [
  'percentage-of-trade-payables',
  'percentage-of-revenue',
  'absolute-amount',
  'custom',
] as const;
export type MaterialCreditorThresholdType =
  (typeof MATERIAL_CREDITOR_THRESHOLD_TYPE_VALUES)[number];

export const MATERIAL_DEVELOPMENT_CATEGORY_VALUES = [
  'litigation',
  'regulatory-action',
  'tax',
  'approval',
  'business-disruption',
  'material-contract',
  'borrowing-default',
  'accident-fire',
  'fraud-misconduct',
  'cyber-incident',
  'acquisition-disposal',
  'management',
  'financial',
  'government-policy-change',
  'other',
] as const;
export type MaterialDevelopmentCategory =
  (typeof MATERIAL_DEVELOPMENT_CATEGORY_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 8 enums — remediation                                               */
/* -------------------------------------------------------------------------- */

export const REMEDIATION_LINKED_RECORD_TYPE_VALUES = [
  'matter',
  'regulatory-action',
  'approval',
  'approval-condition',
  'compliance-issue',
  'statutory-due',
  'material-creditor',
  'material-development',
  'other',
] as const;
export type RemediationLinkedRecordType =
  (typeof REMEDIATION_LINKED_RECORD_TYPE_VALUES)[number];

export const REMEDIATION_PRIORITY_VALUES = [
  'critical-for-filing',
  'high',
  'medium',
  'low',
  'professional-review',
] as const;
export type RemediationPriority = (typeof REMEDIATION_PRIORITY_VALUES)[number];

export const REMEDIATION_STATUS_VALUES = [
  'open',
  'in-progress',
  'blocked',
  'completed',
  'not-applicable',
] as const;
export type RemediationStatus = (typeof REMEDIATION_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 1: Legal Universe, Materiality Policy & Party Mapping                 */
/* -------------------------------------------------------------------------- */

export const legalDdSnapshotSchema = z.object({
  legalDdAsOfDate: text,
  latestLegalSearchUpdateDate: text,
  latestFinancialInformationDate: text,
  targetDrhpFilingDate: text,
  litigationExists: yesNoNotSureOrEmptySchema,
  criminalMattersExist: yesNoNotSureOrEmptySchema,
  taxDisputesExist: yesNoNotSureOrEmptySchema,
  regulatoryStatutoryActionsExist: yesNoNotSureOrEmptySchema,
  civilArbitrationMattersExist: yesNoNotSureOrEmptySchema,
  sebiExchangeActionsExist: yesNoNotSureOrEmptySchema,
  materialApprovalsPending: yesNoNotSureOrEmptySchema,
  expiredApprovalsExist: yesNoNotSureOrEmptySchema,
  knownComplianceExceptionsExist: yesNoNotSureOrEmptySchema,
  materialCreditorDuesExist: yesNoNotSureOrEmptySchema,
  materialDevelopmentsSinceLatestFinancialsExist: yesNoNotSureOrEmptySchema,
});
export type LegalDdSnapshot = z.infer<typeof legalDdSnapshotSchema>;

export const legalPartyReviewRecordSchema = z.object({
  legalPartyReviewId: idSchema,
  partyCategory: z.enum(['', ...LEGAL_PARTY_CATEGORY_VALUES]),
  linkedWorkstream: text,
  linkedPartyId: text,
  displayName: text,
  unresolvedManualReference: text,
  currentHistorical: z.enum(['', ...CURRENT_HISTORICAL_VALUES]),
  legalSearchCompleted: yesNoNotSureOrEmptySchema,
  searchAsOfDate: text,
  managementConfirmationObtained: yesNoNotSureOrEmptySchema,
  externalCounselReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  identifiedMatterCount: text,
  notes: text,
});
export type LegalPartyReviewRecord = z.infer<typeof legalPartyReviewRecordSchema>;

export const litigationMaterialityPolicySchema = z.object({
  policyExists: yesNoNotSureOrEmptySchema,
  adopted: yesNoNotSureOrEmptySchema,
  boardApprovalDate: text,
  boardResolutionReference: text,
  effectiveDate: text,
  policyVersion: text,
  lastReviewed: text,
  partiesToWhichPolicyApplies: text,
  legalCounselReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  brlmProfessionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type LitigationMaterialityPolicy = z.infer<typeof litigationMaterialityPolicySchema>;

export const quantitativeMaterialityCriterionSchema = z.object({
  materialityCriterionId: idSchema,
  metric: z.enum(['', ...MATERIALITY_METRIC_TYPE_VALUES]),
  percentageThreshold: decimalStringSchema,
  absoluteThreshold: decimalStringSchema,
  relevantFinancialPeriod: text,
  standaloneConsolidatedBasis: z.enum(['', ...STANDALONE_CONSOLIDATED_VALUES]),
  formulaMethodology: text,
  linkedFinancialsReference: text,
  sourceFinancialValue: decimalStringSchema,
  notes: text,
});
export type QuantitativeMaterialityCriterion = z.infer<
  typeof quantitativeMaterialityCriterionSchema
>;

export const qualitativeMaterialityCriterionSchema = z.object({
  qualitativeCriterionId: idSchema,
  criterionType: z.enum(['', ...QUALITATIVE_CRITERION_TYPE_VALUES]),
  description: text,
  enabled: yesNoNotSureOrEmptySchema,
  boardPolicyBasis: text,
  notes: text,
});
export type QualitativeMaterialityCriterion = z.infer<
  typeof qualitativeMaterialityCriterionSchema
>;

export const legalUniverseMaterialityPolicyAndPartyMappingSchema = z.object({
  legalDdSnapshot: legalDdSnapshotSchema,
  legalPartyReviews: z.array(legalPartyReviewRecordSchema),
  litigationMaterialityPolicy: litigationMaterialityPolicySchema,
  quantitativeMaterialityCriteria: z.array(quantitativeMaterialityCriterionSchema),
  qualitativeMaterialityCriteria: z.array(qualitativeMaterialityCriterionSchema),
});
export type LegalUniverseMaterialityPolicyAndPartyMapping = z.infer<
  typeof legalUniverseMaterialityPolicyAndPartyMappingSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 2: Litigation & Proceedings Master                                  */
/* -------------------------------------------------------------------------- */

export const matterExternalPartySchema = z.object({
  partyName: text,
  partyRole: text,
  notes: text,
});
export type MatterExternalParty = z.infer<typeof matterExternalPartySchema>;

export const matterPartyLinkSchema = z.object({
  matterPartyLinkId: idSchema,
  legalPartyReviewId: text,
  role: z.enum(['', ...MATTER_PARTY_ROLE_VALUES]),
});
export type MatterPartyLink = z.infer<typeof matterPartyLinkSchema>;

export const matterIdentitySchema = z.object({
  matterTitle: text,
  internalShortName: text,
  caseReferenceNumber: text,
  category: z.enum(['', ...MATTER_CATEGORY_VALUES]),
  direction: z.enum(['', ...MATTER_DIRECTION_VALUES]),
});
export type MatterIdentity = z.infer<typeof matterIdentitySchema>;

export const matterForumSchema = z.object({
  authorityForumName: text,
  forumCategory: z.enum(['', ...FORUM_CATEGORY_VALUES]),
  location: text,
  jurisdiction: text,
  bench: text,
  presidingAuthority: text,
});
export type MatterForum = z.infer<typeof matterForumSchema>;

export const matterDatesAndStageSchema = z.object({
  causeEventDate: text,
  filingInitiationDate: text,
  noticeDate: text,
  admissionDate: text,
  lastHearingActionDate: text,
  nextHearingActionDate: text,
  currentStage: z.enum(['', ...PROCEEDING_STAGE_VALUES]),
  currentSubsisting: yesNoNotSureOrEmptySchema,
  interimOrderExists: yesNoNotSureOrEmptySchema,
  stayExists: yesNoNotSureOrEmptySchema,
  injunctionExists: yesNoNotSureOrEmptySchema,
  attachmentFreezingOrderExists: yesNoNotSureOrEmptySchema,
  bailStatus: text,
  appealAvailable: yesNoNotSureOrEmptySchema,
  appealFiled: yesNoNotSureOrEmptySchema,
  appealLimitationDeadline: text,
  notes: text,
});
export type MatterDatesAndStage = z.infer<typeof matterDatesAndStageSchema>;

export const matterSubjectMatterSchema = z.object({
  shortFactualBackground: text,
  allegationClaim: text,
  relevantPartyPosition: text,
  reliefSoughtAgainstRelevantParty: text,
  reliefSoughtByRelevantParty: text,
  keyLegalProvisions: text,
  businessActivityAffected: text,
  linkedBusinessRecordId: text,
  linkedBacFacilityId: text,
  linkedBacPropertyId: text,
  linkedBacAssetId: text,
  linkedBacContractId: text,
  linkedApprovalId: text,
  financialPeriodAffected: text,
});
export type MatterSubjectMatter = z.infer<typeof matterSubjectMatterSchema>;

export const matterAmountsSchema = z.object({
  principalClaim: decimalStringSchema,
  taxDemand: decimalStringSchema,
  interest: decimalStringSchema,
  penalty: decimalStringSchema,
  fine: decimalStringSchema,
  damages: decimalStringSchema,
  compensation: decimalStringSchema,
  otherExposure: decimalStringSchema,
  totalQuantifiedAmount: decimalStringSchema,
  amountUnquantifiable: yesNoNotSureOrEmptySchema,
  currency: text,
  amountUnit: text,
  amountDisputed: decimalStringSchema,
  amountPaidDepositedUnderProtest: decimalStringSchema,
  provisionRecognised: decimalStringSchema,
  contingentLiabilityRecognised: decimalStringSchema,
  linkedFinancialsReference: text,
});
export type MatterAmounts = z.infer<typeof matterAmountsSchema>;

export const matterStatusOutcomeSchema = z.object({
  outcomeStatus: z.enum(['', ...MATTER_OUTCOME_STATUS_VALUES]),
  latestOrderDate: text,
  latestOrderSummary: text,
  nextAction: text,
  responsibleCounsel: text,
  internalOwner: text,
  counselOpinionStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type MatterStatusOutcome = z.infer<typeof matterStatusOutcomeSchema>;

export const matterMaterialitySchema = z.object({
  mandatoryCategoryConsideration: yesNoNotSureOrEmptySchema,
  quantitativePolicyRelevance: yesNoNotSureOrEmptySchema,
  qualitativePolicyRelevance: yesNoNotSureOrEmptySchema,
  managementMaterialityPosition: text,
  boardMaterialityDetermination: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  readinessState: z.enum(['', ...MATTER_MATERIALITY_STATE_VALUES]),
  notes: text,
});
export type MatterMateriality = z.infer<typeof matterMaterialitySchema>;

export const matterRecordSchema = z.object({
  matterId: idSchema,
  identity: matterIdentitySchema,
  matterPartyLinks: z.array(matterPartyLinkSchema),
  externalParties: z.array(matterExternalPartySchema),
  forum: matterForumSchema,
  datesAndStage: matterDatesAndStageSchema,
  subjectMatter: matterSubjectMatterSchema,
  amounts: matterAmountsSchema,
  statusOutcome: matterStatusOutcomeSchema,
  materiality: matterMaterialitySchema,
});
export type MatterRecord = z.infer<typeof matterRecordSchema>;

export const litigationAndProceedingsMasterSchema = z.object({
  matters: z.array(matterRecordSchema),
});
export type LitigationAndProceedingsMaster = z.infer<
  typeof litigationAndProceedingsMasterSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 3: Criminal, Regulatory, Tax & Enforcement Readiness                */
/* -------------------------------------------------------------------------- */

export const criminalScreeningRecordSchema = z.object({
  legalPartyReviewId: text,
  criminalSearchCompleted: yesNoNotSureOrEmptySchema,
  complaintsIdentified: yesNoNotSureOrEmptySchema,
  firsIdentified: yesNoNotSureOrEmptySchema,
  chargeSheetsIdentified: yesNoNotSureOrEmptySchema,
  summonsIdentified: yesNoNotSureOrEmptySchema,
  prosecutionsIdentified: yesNoNotSureOrEmptySchema,
  economicOffenceMattersIdentified: yesNoNotSureOrEmptySchema,
  convictionsIdentified: yesNoNotSureOrEmptySchema,
  acquittalsIdentified: yesNoNotSureOrEmptySchema,
  appealsIdentified: yesNoNotSureOrEmptySchema,
  investigationsIdentified: yesNoNotSureOrEmptySchema,
  linkedMatterIds: z.array(text),
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type CriminalScreeningRecord = z.infer<typeof criminalScreeningRecordSchema>;

export const regulatoryActionRecordSchema = z.object({
  regulatoryActionId: idSchema,
  matterId: text,
  authority: text,
  affectedPartyLegalReviewId: text,
  actionType: z.enum(['', ...REGULATORY_ACTION_TYPE_VALUES]),
  initiationDate: text,
  lawRegulation: text,
  allegedContravention: text,
  monetaryAmount: decimalStringSchema,
  responseSubmitted: yesNoNotSureOrEmptySchema,
  responseDate: text,
  hearingStatus: text,
  orderPassed: yesNoNotSureOrEmptySchema,
  appealFiled: yesNoNotSureOrEmptySchema,
  currentStatus: text,
  remediation: text,
  repeatIssue: yesNoNotSureOrEmptySchema,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type RegulatoryActionRecord = z.infer<typeof regulatoryActionRecordSchema>;

export const sebiExchangeScreeningRecordSchema = z.object({
  legalPartyReviewId: text,
  sebiActionExists: yesNoNotSureOrEmptySchema,
  stockExchangeActionExists: yesNoNotSureOrEmptySchema,
  actionDate: text,
  lastFiveYearRelevance: yesNoNotSureOrEmptySchema,
  outstandingAction: yesNoNotSureOrEmptySchema,
  showCauseNotice: yesNoNotSureOrEmptySchema,
  monetaryPenalty: yesNoNotSureOrEmptySchema,
  debarment: yesNoNotSureOrEmptySchema,
  securitiesMarketRestraint: yesNoNotSureOrEmptySchema,
  settlement: yesNoNotSureOrEmptySchema,
  consentOrder: yesNoNotSureOrEmptySchema,
  adjudication: yesNoNotSureOrEmptySchema,
  appeal: yesNoNotSureOrEmptySchema,
  currentStatus: text,
  linkedMatterId: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type SebiExchangeScreeningRecord = z.infer<typeof sebiExchangeScreeningRecordSchema>;

export const taxProceedingDetailSchema = z.object({
  matterId: text,
  taxType: z.enum(['', ...TAX_TYPE_VALUES]),
  assessmentYearFinancialYear: text,
  authority: text,
  noticeOrderType: text,
  demand: decimalStringSchema,
  interest: decimalStringSchema,
  penalty: decimalStringSchema,
  amountPaid: decimalStringSchema,
  preDeposit: decimalStringSchema,
  balanceDisputed: decimalStringSchema,
  appealLevel: text,
  stayGranted: yesNoNotSureOrEmptySchema,
  linkedFinancialsContingentLiabilityReference: text,
  notes: text,
});
export type TaxProceedingDetail = z.infer<typeof taxProceedingDetailSchema>;

export const criminalRegulatoryTaxAndEnforcementReadinessSchema = z.object({
  criminalScreenings: z.array(criminalScreeningRecordSchema),
  regulatoryActions: z.array(regulatoryActionRecordSchema),
  sebiExchangeScreenings: z.array(sebiExchangeScreeningRecordSchema),
  taxProceedingDetails: z.array(taxProceedingDetailSchema),
});
export type CriminalRegulatoryTaxAndEnforcementReadiness = z.infer<
  typeof criminalRegulatoryTaxAndEnforcementReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 4: Government, Regulatory & Business Approvals Master               */
/* -------------------------------------------------------------------------- */

export const approvalIdentitySchema = z.object({
  approvalLicenceName: text,
  category: z.enum(['', ...APPROVAL_CATEGORY_VALUES]),
});
export type ApprovalIdentity = z.infer<typeof approvalIdentitySchema>;

export const approvalHolderSchema = z.object({
  holderType: z.enum(['', ...APPROVAL_HOLDER_TYPE_VALUES]),
  linkedEntityBusinessFacilityId: text,
  displayName: text,
});
export type ApprovalHolder = z.infer<typeof approvalHolderSchema>;

export const approvalAuthoritySchema = z.object({
  issuingAuthority: text,
  ministryDepartment: text,
  centralStateLocal: text,
  jurisdiction: text,
  officeLocation: text,
});
export type ApprovalAuthority = z.infer<typeof approvalAuthoritySchema>;

export const approvalDetailsSchema = z.object({
  licenceRegistrationNumber: text,
  applicationNumber: text,
  issueDate: text,
  effectiveDate: text,
  expiryDate: text,
  perpetualNoExpiry: yesNoNotSureOrEmptySchema,
  renewalFrequency: text,
  scope: text,
  activityAuthorised: text,
  locationSiteCovered: text,
  capacityCovered: text,
  productsCovered: text,
  conditionsSummary: text,
  restrictions: text,
  transferable: yesNoNotSureOrEmptySchema,
  changeOfControlNotificationRequired: yesNoNotSureOrEmptySchema,
  changeOfNameAmendmentRequired: yesNoNotSureOrEmptySchema,
  publicCompanyConversionAmendmentRequired: yesNoNotSureOrEmptySchema,
  currentDocumentVersion: text,
  notes: text,
});
export type ApprovalDetails = z.infer<typeof approvalDetailsSchema>;

export const approvalApplicationMetadataSchema = z.object({
  applicationDate: text,
  acknowledgementReference: text,
  currentStage: text,
  expectedTimeline: text,
  authorityQueryReceived: yesNoNotSureOrEmptySchema,
  responsePending: yesNoNotSureOrEmptySchema,
  inspectionRequired: yesNoNotSureOrEmptySchema,
  feePaid: yesNoNotSureOrEmptySchema,
  followUpDate: text,
  notes: text,
});
export type ApprovalApplicationMetadata = z.infer<typeof approvalApplicationMetadataSchema>;

export const approvalRenewalMetadataSchema = z.object({
  renewalDueDate: text,
  renewalApplicationDate: text,
  submittedBeforeExpiry: yesNoNotSureOrEmptySchema,
  continuationPendingRenewal: z.enum(['', ...CONTINUATION_PENDING_RENEWAL_VALUES]),
  renewalAcknowledgement: text,
  currentRenewalStage: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ApprovalRenewalMetadata = z.infer<typeof approvalRenewalMetadataSchema>;

export const approvalRecordSchema = z.object({
  approvalId: idSchema,
  identity: approvalIdentitySchema,
  holder: approvalHolderSchema,
  authority: approvalAuthoritySchema,
  details: approvalDetailsSchema,
  status: z.enum(['', ...APPROVAL_STATUS_VALUES]),
  applicationMetadata: approvalApplicationMetadataSchema,
  renewalMetadata: approvalRenewalMetadataSchema,
});
export type ApprovalRecord = z.infer<typeof approvalRecordSchema>;

export const governmentRegulatoryAndBusinessApprovalsMasterSchema = z.object({
  approvals: z.array(approvalRecordSchema),
});
export type GovernmentRegulatoryAndBusinessApprovalsMaster = z.infer<
  typeof governmentRegulatoryAndBusinessApprovalsMasterSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 5: Approval Conditions, Facility Compliance & Renewal Readiness     */
/* -------------------------------------------------------------------------- */

export const approvalConditionRecordSchema = z.object({
  conditionId: idSchema,
  approvalId: text,
  condition: text,
  category: z.enum(['', ...APPROVAL_CONDITION_CATEGORY_VALUES]),
  frequency: text,
  dueDate: text,
  lastCompletedDate: text,
  complianceStatus: z.enum(['', ...CONDITION_COMPLIANCE_STATUS_VALUES]),
  evidenceReference: text,
  responsibleOwner: text,
  remediation: text,
  targetCompletionDate: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ApprovalConditionRecord = z.infer<typeof approvalConditionRecordSchema>;

export const facilityApprovalReviewRecordSchema = z.object({
  facilityApprovalReviewId: idSchema,
  linkedBusinessFacilityId: text,
  requiredApprovalCategoriesIdentified: z.array(z.enum(APPROVAL_CATEGORY_VALUES)),
  linkedApprovalIds: z.array(text),
  allApprovalsObtained: yesNoNotSureOrEmptySchema,
  applicationsPending: yesNoNotSureOrEmptySchema,
  requiredButNotApplied: yesNoNotSureOrEmptySchema,
  renewalsPending: yesNoNotSureOrEmptySchema,
  conditionsOutstanding: yesNoNotSureOrEmptySchema,
  siteOperationalBeforeRequiredApproval: yesNoNotSureOrEmptySchema,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type FacilityApprovalReviewRecord = z.infer<typeof facilityApprovalReviewRecordSchema>;

export const projectApprovalRequirementRecordSchema = z.object({
  projectApprovalRequirementId: idSchema,
  linkedObjectsRecordId: text,
  approvalCategory: z.enum(['', ...APPROVAL_CATEGORY_VALUES]),
  linkedApprovalId: text,
  requiredBefore: z.enum(['', ...REQUIRED_BEFORE_VALUES]),
  applicationTiming: text,
  currentStatus: text,
  expectedCompletion: text,
  criticalPathImpact: yesNoNotSureOrEmptySchema,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ProjectApprovalRequirementRecord = z.infer<
  typeof projectApprovalRequirementRecordSchema
>;

export const approvalConditionsFacilityComplianceAndRenewalReadinessSchema = z.object({
  approvalConditions: z.array(approvalConditionRecordSchema),
  facilityApprovalReviews: z.array(facilityApprovalReviewRecordSchema),
  projectApprovalRequirements: z.array(projectApprovalRequirementRecordSchema),
});
export type ApprovalConditionsFacilityComplianceAndRenewalReadiness = z.infer<
  typeof approvalConditionsFacilityComplianceAndRenewalReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 6: Corporate, Statutory & Operational Compliance Exceptions         */
/* -------------------------------------------------------------------------- */

export const complianceDomainReviewRecordSchema = z.object({
  domainReviewId: idSchema,
  domain: z.enum(['', ...COMPLIANCE_DOMAIN_VALUES]),
  applicable: yesNoNotSureOrEmptySchema,
  responsibleFunction: text,
  externalAdviser: text,
  complianceCalendarExists: yesNoNotSureOrEmptySchema,
  lastInternalReview: text,
  lastProfessionalReview: text,
  knownExceptions: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type ComplianceDomainReviewRecord = z.infer<typeof complianceDomainReviewRecordSchema>;

export const complianceIssueRecordSchema = z.object({
  complianceIssueId: idSchema,
  domain: z.enum(['', ...COMPLIANCE_DOMAIN_VALUES]),
  affectedEntitySitePerson: text,
  linkedDwaarId: text,
  obligation: text,
  lawRuleReference: text,
  dueDate: text,
  actualCompletionDate: text,
  issueType: z.enum(['', ...COMPLIANCE_ISSUE_TYPE_VALUES]),
  identifiedBy: z.enum(['', ...ISSUE_IDENTIFIED_BY_VALUES]),
  affectedPeriod: text,
  continuing: yesNoNotSureOrEmptySchema,
  corrected: yesNoNotSureOrEmptySchema,
  correctionDate: text,
  additionalFee: decimalStringSchema,
  penalty: decimalStringSchema,
  showCauseNoticeExists: yesNoNotSureOrEmptySchema,
  officerInDefault: yesNoNotSureOrEmptySchema,
  compoundingAdjudication: text,
  linkedMatterId: text,
  rootCause: text,
  remediation: text,
  preventiveAction: text,
  owner: text,
  targetResolution: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ComplianceIssueRecord = z.infer<typeof complianceIssueRecordSchema>;

export const statutoryDueRecordSchema = z.object({
  statutoryDueId: idSchema,
  entity: text,
  dueType: z.enum(['', ...STATUTORY_DUE_TYPE_VALUES]),
  financialPeriod: text,
  amountDue: decimalStringSchema,
  dueDate: text,
  amountPaid: decimalStringSchema,
  paymentDate: text,
  delayDays: text,
  interest: decimalStringSchema,
  penalty: decimalStringSchema,
  disputed: yesNoNotSureOrEmptySchema,
  linkedTaxMatterId: text,
  linkedFinancialsReference: text,
  auditorCaroObservation: text,
  remediated: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type StatutoryDueRecord = z.infer<typeof statutoryDueRecordSchema>;

export const corporateStatutoryAndOperationalComplianceExceptionsSchema = z.object({
  complianceDomainReviews: z.array(complianceDomainReviewRecordSchema),
  complianceIssues: z.array(complianceIssueRecordSchema),
  statutoryDues: z.array(statutoryDueRecordSchema),
});
export type CorporateStatutoryAndOperationalComplianceExceptions = z.infer<
  typeof corporateStatutoryAndOperationalComplianceExceptionsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 7: Material Creditors, Penalties & Material Developments            */
/* -------------------------------------------------------------------------- */

export const materialCreditorPolicySchema = z.object({
  policyExists: yesNoNotSureOrEmptySchema,
  adopted: yesNoNotSureOrEmptySchema,
  boardDate: text,
  resolutionReference: text,
  thresholdType: z.enum(['', ...MATERIAL_CREDITOR_THRESHOLD_TYPE_VALUES]),
  percentage: decimalStringSchema,
  absoluteAmount: decimalStringSchema,
  relevantFinancialDate: text,
  calculationBasis: text,
  linkedFinancialsReference: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type MaterialCreditorPolicy = z.infer<typeof materialCreditorPolicySchema>;

export const materialCreditorRecordSchema = z.object({
  creditorId: idSchema,
  creditorName: text,
  linkedBusinessSupplierId: text,
  linkedGroupEntityId: text,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  msmeStatus: yesNoNotSureOrEmptySchema,
  natureOfSupplyService: text,
  amountOutstanding: decimalStringSchema,
  currency: text,
  amountUnit: text,
  ageing: text,
  dueDate: text,
  disputed: yesNoNotSureOrEmptySchema,
  reasonOutstanding: text,
  paymentArrangement: text,
  legalNotice: yesNoNotSureOrEmptySchema,
  linkedMatterId: text,
  notes: text,
});
export type MaterialCreditorRecord = z.infer<typeof materialCreditorRecordSchema>;

export const creditorAggregateInputsSchema = z.object({
  numberOfMsmeCreditors: text,
  msmeOutstandingAmount: decimalStringSchema,
  numberOfMaterialCreditors: text,
  materialCreditorAmount: decimalStringSchema,
  numberOfOtherCreditors: text,
  otherCreditorAmount: decimalStringSchema,
  totalTradePayableReference: decimalStringSchema,
  linkedFinancialsTradePayables: decimalStringSchema,
  reconciliationDifference: decimalStringSchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type CreditorAggregateInputs = z.infer<typeof creditorAggregateInputsSchema>;

export const historicalPenaltyRecordSchema = z.object({
  penaltyId: idSchema,
  affectedParty: text,
  authority: text,
  lawRegulation: text,
  eventDate: text,
  contravention: text,
  penaltyFineType: text,
  amount: decimalStringSchema,
  paid: yesNoNotSureOrEmptySchema,
  paymentDate: text,
  appeal: yesNoNotSureOrEmptySchema,
  finalStatus: text,
  continuingRestriction: yesNoNotSureOrEmptySchema,
  repeatOccurrence: yesNoNotSureOrEmptySchema,
  linkedMatterId: text,
  notes: text,
});
export type HistoricalPenaltyRecord = z.infer<typeof historicalPenaltyRecordSchema>;

export const materialDevelopmentRecordSchema = z.object({
  developmentId: idSchema,
  eventDate: text,
  discoveryDate: text,
  category: z.enum(['', ...MATERIAL_DEVELOPMENT_CATEGORY_VALUES]),
  description: text,
  linkedWorkstream: text,
  linkedRecordId: text,
  materialityAssessment: text,
  financialImpact: decimalStringSchema,
  operationalImpact: text,
  assetImpact: text,
  liabilityImpact: text,
  reputationalImpact: text,
  ipoImpact: text,
  potentialRiskFactorRequirement: yesNoNotSureOrEmptySchema,
  offerDocumentSectionsAffected: text,
  boardConsidered: yesNoNotSureOrEmptySchema,
  counselReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  brlmProfessionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  disclosureStatus: text,
  notes: text,
});
export type MaterialDevelopmentRecord = z.infer<typeof materialDevelopmentRecordSchema>;

export const materialCreditorsPenaltiesAndMaterialDevelopmentsSchema = z.object({
  materialCreditorPolicy: materialCreditorPolicySchema,
  materialCreditors: z.array(materialCreditorRecordSchema),
  creditorAggregateInputs: creditorAggregateInputsSchema,
  historicalPenalties: z.array(historicalPenaltyRecordSchema),
  materialDevelopments: z.array(materialDevelopmentRecordSchema),
});
export type MaterialCreditorsPenaltiesAndMaterialDevelopments = z.infer<
  typeof materialCreditorsPenaltiesAndMaterialDevelopmentsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 8: Reconciliation, Remediation & Issuer Confirmations               */
/* -------------------------------------------------------------------------- */

export const lacGroupEntitiesReconciliationSchema = z.object({
  relevantGroupEntitiesInLegalDdUniverse: yesNoNotSureOrEmptySchema,
  legalDeclarationDisagreements: yesNoNotSureOrEmptySchema,
  groupEntityMattersRepresented: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacGroupEntitiesReconciliation = z.infer<
  typeof lacGroupEntitiesReconciliationSchema
>;

export const lacManagementGovernanceReconciliationSchema = z.object({
  promoterDirectorKmpDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  debarmentDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  criminalRegulatoryDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  eligibilityDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacManagementGovernanceReconciliation = z.infer<
  typeof lacManagementGovernanceReconciliationSchema
>;

export const lacFinancialsReconciliationSchema = z.object({
  litigationAggregateAmount: decimalStringSchema,
  financialsContingentLiabilities: decimalStringSchema,
  litigationDifference: decimalStringSchema,
  taxAggregateAmount: decimalStringSchema,
  financialsTaxDisputes: decimalStringSchema,
  taxDifference: decimalStringSchema,
  provisionsAmount: decimalStringSchema,
  financialsProvisions: decimalStringSchema,
  provisionsDifference: decimalStringSchema,
  creditorTotalsAmount: decimalStringSchema,
  financialsTradePayables: decimalStringSchema,
  creditorDifference: decimalStringSchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacFinancialsReconciliation = z.infer<typeof lacFinancialsReconciliationSchema>;

export const lacBacReconciliationSchema = z.object({
  defaultsReconciled: yesNoNotSureOrEmptySchema,
  recallNoticesReconciled: yesNoNotSureOrEmptySchema,
  guaranteeInvocationsReconciled: yesNoNotSureOrEmptySchema,
  lenderDisputesReconciled: yesNoNotSureOrEmptySchema,
  propertyDisputesReconciled: yesNoNotSureOrEmptySchema,
  contractDisputesReconciled: yesNoNotSureOrEmptySchema,
  pendingNocsReconciled: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacBacReconciliation = z.infer<typeof lacBacReconciliationSchema>;

export const lacBusinessOperationsReconciliationSchema = z.object({
  facilitiesMapped: yesNoNotSureOrEmptySchema,
  operationsMapped: yesNoNotSureOrEmptySchema,
  licenceApprovalReferencesMapped: yesNoNotSureOrEmptySchema,
  environmentalLabourInformationMapped: yesNoNotSureOrEmptySchema,
  operationalIncidentsMapped: yesNoNotSureOrEmptySchema,
  facilitiesUnderConstructionMapped: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacBusinessOperationsReconciliation = z.infer<
  typeof lacBusinessOperationsReconciliationSchema
>;

export const lacObjectsOfIssueReconciliationSchema = z.object({
  newFacilitiesMapped: yesNoNotSureOrEmptySchema,
  expansionsMapped: yesNoNotSureOrEmptySchema,
  acquisitionsMapped: yesNoNotSureOrEmptySchema,
  newProjectsGeographiesMapped: yesNoNotSureOrEmptySchema,
  approvalPlanReconciled: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacObjectsOfIssueReconciliation = z.infer<
  typeof lacObjectsOfIssueReconciliationSchema
>;

export const lacIpoSetupReconciliationSchema = z.object({
  debarmentDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  ibcWindingUpDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  seriousProceedingsDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  defaultsDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  regulatoryActionDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  reconciliationStatus: z.enum(['', ...RECONCILIATION_STATUS_VALUES]),
  notes: text,
});
export type LacIpoSetupReconciliation = z.infer<typeof lacIpoSetupReconciliationSchema>;

export const remediationActionRecordSchema = z.object({
  remediationActionId: idSchema,
  linkedRecordType: z.enum(['', ...REMEDIATION_LINKED_RECORD_TYPE_VALUES]),
  linkedRecordId: text,
  actionRequired: text,
  owner: text,
  priority: z.enum(['', ...REMEDIATION_PRIORITY_VALUES]),
  targetDate: text,
  dependency: text,
  status: z.enum(['', ...REMEDIATION_STATUS_VALUES]),
  completionDate: text,
  professionalSignOffRequired: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type RemediationActionRecord = z.infer<typeof remediationActionRecordSchema>;

export const lacConfirmationsSchema = z.object({
  allCriminalProceedingsInvolvingRelevantPartiesDisclosed: yesNoNotSureOrEmptySchema,
  firComplaintProsecutionMattersConsidered: yesNoNotSureOrEmptySchema,
  allMaterialCivilArbitrationProceedingsDisclosed: yesNoNotSureOrEmptySchema,
  currentBoardApprovedLitigationMaterialityPolicyCaptured: yesNoNotSureOrEmptySchema,
  allStatutoryRegulatoryProceedingsDisclosed: yesNoNotSureOrEmptySchema,
  showCauseNoticesConsidered: yesNoNotSureOrEmptySchema,
  inspectionsInvestigationsEnquiriesConsidered: yesNoNotSureOrEmptySchema,
  sebiAndStockExchangeActionsDisclosed: yesNoNotSureOrEmptySchema,
  taxProceedingsComplete: yesNoNotSureOrEmptySchema,
  directTaxTotalsReconciled: yesNoNotSureOrEmptySchema,
  indirectTaxTotalsReconciled: yesNoNotSureOrEmptySchema,
  historicalPenaltiesMaterialRegulatoryActionsDisclosed: yesNoNotSureOrEmptySchema,
  materialSubsidiariesGroupCompaniesIncludedInLegalDd: yesNoNotSureOrEmptySchema,
  allMaterialBusinessApprovalsDisclosed: yesNoNotSureOrEmptySchema,
  approvalExpiriesAccurate: yesNoNotSureOrEmptySchema,
  pendingRenewalApplicationsDisclosed: yesNoNotSureOrEmptySchema,
  requiredButNotAppliedApprovalsDisclosed: yesNoNotSureOrEmptySchema,
  approvalConditionNonCompliancesDisclosed: yesNoNotSureOrEmptySchema,
  materialStatutorySecretarialExceptionsDisclosed: yesNoNotSureOrEmptySchema,
  statutoryDuesDelaysDefaultsDisclosed: yesNoNotSureOrEmptySchema,
  materialCreditorsCaptured: yesNoNotSureOrEmptySchema,
  msmeDuesCaptured: yesNoNotSureOrEmptySchema,
  materialDevelopmentsSinceLatestFinancialsDisclosed: yesNoNotSureOrEmptySchema,
  postPreparationLegalDevelopmentsWillContinueToBeUpdated: yesNoNotSureOrEmptySchema,
  contingentLiabilitiesProvisionsReconciledWithFinancials: yesNoNotSureOrEmptySchema,
  borrowingDefaultLegalMattersReconciledWithBac: yesNoNotSureOrEmptySchema,
  managementLegalDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  groupEntityLegalDeclarationsReconciled: yesNoNotSureOrEmptySchema,
  unresolvedInconsistenciesFlagged: yesNoNotSureOrEmptySchema,
  professionalLegalBrlmSecretarialAccountingConfirmationRequired: yesNoNotSureOrEmptySchema,
});
export type LacConfirmations = z.infer<typeof lacConfirmationsSchema>;

export const reconciliationRemediationAndIssuerConfirmationsSchema = z.object({
  groupEntitiesReconciliation: lacGroupEntitiesReconciliationSchema,
  managementGovernanceReconciliation: lacManagementGovernanceReconciliationSchema,
  financialsReconciliation: lacFinancialsReconciliationSchema,
  bacReconciliation: lacBacReconciliationSchema,
  businessOperationsReconciliation: lacBusinessOperationsReconciliationSchema,
  objectsOfIssueReconciliation: lacObjectsOfIssueReconciliationSchema,
  ipoSetupReconciliation: lacIpoSetupReconciliationSchema,
  remediationActions: z.array(remediationActionRecordSchema),
  confirmations: lacConfirmationsSchema,
});
export type ReconciliationRemediationAndIssuerConfirmations = z.infer<
  typeof reconciliationRemediationAndIssuerConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Root payload                                                                */
/* -------------------------------------------------------------------------- */

export const LAC_SECTION_IDS = [
  'legal-universe-materiality-policy-and-party-mapping',
  'litigation-and-proceedings-master',
  'criminal-regulatory-tax-and-enforcement-readiness',
  'government-regulatory-and-business-approvals-master',
  'approval-conditions-facility-compliance-and-renewal-readiness',
  'corporate-statutory-and-operational-compliance-exceptions',
  'material-creditors-penalties-and-material-developments',
  'reconciliation-remediation-and-issuer-confirmations',
] as const;

export type LitigationApprovalsComplianceSectionId = (typeof LAC_SECTION_IDS)[number];

export const sectionIdSchema = z.enum(LAC_SECTION_IDS);

export const litigationApprovalsCompliancePayloadSchema = z.object({
  schemaVersion: z.literal(LITIGATION_APPROVALS_COMPLIANCE_SCHEMA_VERSION),
  legalUniverseMaterialityPolicyAndPartyMapping:
    legalUniverseMaterialityPolicyAndPartyMappingSchema,
  litigationAndProceedingsMaster: litigationAndProceedingsMasterSchema,
  criminalRegulatoryTaxAndEnforcementReadiness:
    criminalRegulatoryTaxAndEnforcementReadinessSchema,
  governmentRegulatoryAndBusinessApprovalsMaster:
    governmentRegulatoryAndBusinessApprovalsMasterSchema,
  approvalConditionsFacilityComplianceAndRenewalReadiness:
    approvalConditionsFacilityComplianceAndRenewalReadinessSchema,
  corporateStatutoryAndOperationalComplianceExceptions:
    corporateStatutoryAndOperationalComplianceExceptionsSchema,
  materialCreditorsPenaltiesAndMaterialDevelopments:
    materialCreditorsPenaltiesAndMaterialDevelopmentsSchema,
  reconciliationRemediationAndIssuerConfirmations:
    reconciliationRemediationAndIssuerConfirmationsSchema,
});

export type LitigationApprovalsCompliancePayload = z.infer<
  typeof litigationApprovalsCompliancePayloadSchema
>;
