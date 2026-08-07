/**
 * Canonical Group Entities & Related Parties payload schema (Increment GR1).
 *
 * - Persist `GroupEntitiesRelatedPartiesPayload` (`schemaVersion: 1`) for GR2.
 * - One canonical Entity Master — entities exist once with multiple classifications.
 * - Monetary amounts and percentages are Decimal-safe strings (`''` when empty).
 * - Ternary answers: `'' | 'yes' | 'no' | 'not_sure'`.
 * - Computed totals, ratios and assessment outcomes are DERIVED — never persisted here.
 * - UI labels live in `lib/group-entities-related-parties/options.ts`.
 */

import { z } from 'zod';

export const GROUP_ENTITIES_SCHEMA_VERSION = 1 as const;

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];
export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Entity Master enums                                                         */
/* -------------------------------------------------------------------------- */

export const ENTITY_TYPE_VALUES = [
  'indian-company',
  'foreign-body-corporate',
  'llp',
  'partnership',
  'proprietorship',
  'trust',
  'huf',
  'joint-venture',
  'association-body-of-persons',
  'fund',
  'other',
] as const;
export type EntityType = (typeof ENTITY_TYPE_VALUES)[number];

export const ENTITY_STATUS_VALUES = [
  'active',
  'dormant',
  'under-strike-off',
  'struck-off',
  'under-liquidation',
  'under-insolvency',
  'wound-up',
  'amalgamated',
  'dissolved',
  'other',
] as const;
export type EntityStatus = (typeof ENTITY_STATUS_VALUES)[number];

export const LISTED_STATUS_VALUES = ['listed', 'unlisted', 'delisted', 'not-applicable'] as const;
export type ListedStatus = (typeof LISTED_STATUS_VALUES)[number];

export const ENTITY_CLASSIFICATION_BADGE_VALUES = [
  'parent',
  'ultimate-parent',
  'subsidiary',
  'step-down-subsidiary',
  'associate',
  'jv',
  'common-control-entity',
  'promoter-group-entity',
  'related-party',
  'icdr-group-company',
  'material-subsidiary',
  'other',
] as const;
export type EntityClassificationBadge = (typeof ENTITY_CLASSIFICATION_BADGE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Ownership / relationship enums                                              */
/* -------------------------------------------------------------------------- */

export const OWNERSHIP_RELATIONSHIP_TYPE_VALUES = [
  'direct-holding',
  'indirect-holding',
  'subsidiary',
  'step-down-subsidiary',
  'associate',
  'joint-venture',
  'holding-company',
  'fellow-subsidiary',
  'common-control-entity',
  'promoter-controlled',
  'significant-influence',
  'other',
] as const;
export type OwnershipRelationshipType = (typeof OWNERSHIP_RELATIONSHIP_TYPE_VALUES)[number];

export const CURRENT_HISTORICAL_VALUES = ['current', 'historical'] as const;
export type CurrentHistorical = (typeof CURRENT_HISTORICAL_VALUES)[number];

export const PROFESSIONAL_CONFIRMATION_STATUS_VALUES = [
  'confirmed',
  'pending',
  'not-required',
  'not-applicable',
] as const;
export type ProfessionalConfirmationStatus =
  (typeof PROFESSIONAL_CONFIRMATION_STATUS_VALUES)[number];

export const AGREEMENT_TYPE_VALUES = [
  'shareholders-agreement',
  'voting-agreement',
  'management-agreement',
  'joint-control-arrangement',
  'other',
] as const;
export type AgreementType = (typeof AGREEMENT_TYPE_VALUES)[number];

export const COMMON_PERSON_RELATIONSHIP_TYPE_VALUES = [
  'common-promoter',
  'common-director',
  'common-kmp',
  'common-beneficial-owner',
  'promoter-relative',
  'nominee-director',
] as const;
export type CommonPersonRelationshipType =
  (typeof COMMON_PERSON_RELATIONSHIP_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Group Company / materiality enums                                           */
/* -------------------------------------------------------------------------- */

export const REGULATORY_CLASSIFICATION_TYPE_VALUES = [
  'subsidiary',
  'step-down-subsidiary',
  'associate',
  'joint-venture',
  'holding-company',
  'common-control-entity',
  'promoter-group-entity',
  'icdr-group-company',
  'material-subsidiary',
] as const;
export type RegulatoryClassificationType =
  (typeof REGULATORY_CLASSIFICATION_TYPE_VALUES)[number];

export const CLASSIFICATION_READINESS_STATE_VALUES = [
  'appears_consistent',
  'potential_classification',
  'potential_inconsistency',
  'missing_information',
  'pending_professional_confirmation',
] as const;
export type ClassificationReadinessState =
  (typeof CLASSIFICATION_READINESS_STATE_VALUES)[number];

export const ICDR_GROUP_COMPANY_STATE_VALUES = [
  'identified',
  'potentially_identified',
  'not_group_company',
  'pending_financial_reconciliation',
  'pending_board_determination',
  'pending_professional_confirmation',
] as const;
export type IcdrGroupCompanyState = (typeof ICDR_GROUP_COMPANY_STATE_VALUES)[number];

export const ICDR_IDENTIFICATION_BASIS_VALUES = [
  'rpt-based',
  'board-materiality',
  'both',
  'other',
] as const;
export type IcdrIdentificationBasis = (typeof ICDR_IDENTIFICATION_BASIS_VALUES)[number];

export const MATERIALITY_METRIC_TYPE_VALUES = [
  'revenue',
  'net-worth',
  'turnover',
  'rpt-amount',
  'qualitative-materiality',
  'material-adverse-effect',
  'other',
] as const;
export type MaterialityMetricType = (typeof MATERIALITY_METRIC_TYPE_VALUES)[number];

export const THRESHOLD_TYPE_VALUES = ['percentage', 'amount', 'qualitative'] as const;
export type ThresholdType = (typeof THRESHOLD_TYPE_VALUES)[number];

export const STANDALONE_CONSOLIDATED_VALUES = ['standalone', 'consolidated', 'both'] as const;
export type StandaloneConsolidated = (typeof STANDALONE_CONSOLIDATED_VALUES)[number];

export const MATERIAL_SUBSIDIARY_PURPOSE_VALUES = [
  'lodr',
  'subsidiary-financial-publication',
  'tax-benefit-disclosure',
  'approval-due-diligence',
  'offer-document-purpose',
  'other',
] as const;
export type MaterialSubsidiaryPurpose = (typeof MATERIAL_SUBSIDIARY_PURPOSE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Related party enums                                                         */
/* -------------------------------------------------------------------------- */

export const RELATED_PARTY_PARTY_TYPE_VALUES = ['entity', 'person'] as const;
export type RelatedPartyPartyType = (typeof RELATED_PARTY_PARTY_TYPE_VALUES)[number];

export const LINKED_PERSON_ROLE_VALUES = [
  'promoter',
  'director',
  'kmp',
  'smp',
  'relative-of-director',
  'relative-of-kmp',
  'other',
] as const;
export type LinkedPersonRole = (typeof LINKED_PERSON_ROLE_VALUES)[number];

export const RELATED_PARTY_CATEGORY_VALUES = [
  'parent',
  'subsidiary',
  'fellow-subsidiary',
  'associate',
  'joint-venture',
  'promoter',
  'promoter-group-entity',
  'director',
  'kmp',
  'relative-of-director',
  'relative-of-kmp',
  'entity-controlled-by-director-kmp-relative',
  'entity-under-significant-influence',
  'common-control-entity',
  'management-entity',
  'post-employment-benefit-plan',
  'other',
] as const;
export type RelatedPartyCategory = (typeof RELATED_PARTY_CATEGORY_VALUES)[number];

export const CLASSIFICATION_FRAMEWORK_VALUES = [
  'companies-act',
  'ind-as-24',
  'as-18',
  'other-accounting-standard',
  'sebi-lodr',
  'sebi-icdr-group-company',
  'promoter-group',
  'other',
] as const;
export type ClassificationFramework = (typeof CLASSIFICATION_FRAMEWORK_VALUES)[number];

export const RELATIONSHIP_SOURCE_TYPE_VALUES = [
  'financial-statements',
  'rpt-schedule',
  'register-of-members',
  'director-kmp-declaration',
  'mbp-1',
  'group-structure',
  'agreement',
  'mca-record',
  'management-representation',
  'other',
] as const;
export type RelationshipSourceType = (typeof RELATIONSHIP_SOURCE_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* RPT enums                                                                   */
/* -------------------------------------------------------------------------- */

export const RPT_TRANSACTION_TYPE_VALUES = [
  'sale-of-goods-materials',
  'purchase-of-goods-materials',
  'sale-of-services',
  'purchase-receipt-of-services',
  'property-purchase',
  'property-sale',
  'lease-rent-paid',
  'lease-rent-received',
  'agent-arrangement',
  'management-services',
  'employee-deputation',
  'rd-transfer',
  'licence-royalty',
  'loan-given',
  'loan-received',
  'advance-given',
  'advance-received',
  'equity-contribution',
  'investment',
  'share-security-issuance',
  'guarantee',
  'corporate-guarantee',
  'collateral-security',
  'reimbursement-of-expenses',
  'remuneration',
  'dividend',
  'office-place-of-profit',
  'underwriting',
  'asset-transfer',
  'other',
] as const;
export type RptTransactionType = (typeof RPT_TRANSACTION_TYPE_VALUES)[number];

export const ARMS_LENGTH_STATUS_VALUES = [
  'confirmed',
  'management_believes_yes',
  'no',
  'not_sure',
  'pending_professional_confirmation',
] as const;
export type ArmsLengthStatus = (typeof ARMS_LENGTH_STATUS_VALUES)[number];

export const RECURRING_NON_RECURRING_VALUES = ['recurring', 'non-recurring', 'not-applicable'] as const;
export type RecurringNonRecurring = (typeof RECURRING_NON_RECURRING_VALUES)[number];

export const CASH_NON_CASH_VALUES = ['cash', 'non-cash', 'mixed', 'not-applicable'] as const;
export type CashNonCash = (typeof CASH_NON_CASH_VALUES)[number];

export const RPT_BALANCE_TYPE_VALUES = [
  'receivable',
  'payable',
  'loan-receivable',
  'loan-payable',
  'advance',
  'deposit',
  'accrued-income',
  'accrued-expense',
  'guarantee-exposure',
  'security-collateral',
  'commitment',
  'other',
] as const;
export type RptBalanceType = (typeof RPT_BALANCE_TYPE_VALUES)[number];

export const SECURED_UNSECURED_VALUES = ['secured', 'unsecured', 'not-applicable'] as const;
export type SecuredUnsecured = (typeof SECURED_UNSECURED_VALUES)[number];

export const INTEREST_BEARING_VALUES = [
  'interest-bearing',
  'non-interest-bearing',
  'not-applicable',
] as const;
export type InterestBearing = (typeof INTEREST_BEARING_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Common pursuits / dependencies enums                                        */
/* -------------------------------------------------------------------------- */

export const DEPENDENCY_TYPE_VALUES = [
  'supplier',
  'customer',
  'service-provider',
  'distributor',
  'manufacturer',
  'technology-provider',
  'lender',
  'landlord',
  'licensor',
  'employee-resource-sharing',
  'shared-facility',
  'shared-brand',
  'shared-ip',
  'shared-infrastructure',
  'other',
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPE_VALUES)[number];

export const OTHER_BUSINESS_INTEREST_TYPE_VALUES = [
  'commercial-business-with-issuer',
  'proposed-future-business',
  'interest-in-issuer-property',
  'interest-in-assets-machinery-supplied',
  'land-building-relationship',
  'ip-licence-relationship',
  'financing-relationship',
  'other',
] as const;
export type OtherBusinessInterestType =
  (typeof OTHER_BUSINESS_INTEREST_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Entity financial / regulatory enums                                           */
/* -------------------------------------------------------------------------- */

export const ENTITY_INFORMATION_STATUS_VALUES = [
  'complete',
  'partial',
  'refused',
  'unavailable',
  'not-requested',
] as const;
export type EntityInformationStatus = (typeof ENTITY_INFORMATION_STATUS_VALUES)[number];

export const AUDIT_STATUS_VALUES = [
  'audited',
  'unaudited',
  'reviewed',
  'not-available',
] as const;
export type AuditStatus = (typeof AUDIT_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Change register enums                                                         */
/* -------------------------------------------------------------------------- */

export const RELATIONSHIP_CHANGE_EVENT_VALUES = [
  'became-subsidiary',
  'ceased-subsidiary',
  'became-associate',
  'ceased-associate',
  'jv-formed',
  'jv-terminated',
  'entity-acquired',
  'entity-disposed',
  'merger',
  'demerger',
  'amalgamation',
  'promoter-relationship-created',
  'promoter-relationship-ceased',
  'became-related-party',
  'ceased-related-party',
  'became-group-company',
  'ceased-group-company',
  'control-acquired',
  'control-lost',
  'renamed-reconstituted',
  'other',
] as const;
export type RelationshipChangeEvent = (typeof RELATIONSHIP_CHANGE_EVENT_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 1: Group Structure & Entity Master                                  */
/* -------------------------------------------------------------------------- */

export const entityIdentitySchema = z.object({
  legalName: text,
  formerName: text,
  displayName: text,
});
export type EntityIdentity = z.infer<typeof entityIdentitySchema>;

export const entityRegistrationSchema = z.object({
  cin: text,
  llpin: text,
  registrationNumber: text,
  otherIdentifier: text,
  countryOfIncorporation: text,
  state: text,
  incorporationDate: text,
  registeredOffice: text,
  corporateOffice: text,
  website: text,
  financialYearEnd: text,
});
export type EntityRegistration = z.infer<typeof entityRegistrationSchema>;

export const entityListingSchema = z.object({
  listedStatus: z.enum(['', ...LISTED_STATUS_VALUES]),
  exchange: text,
  securityTypeListed: text,
  listingDate: text,
  delistedStatus: yesNoNotSureOrEmptySchema,
  delistingDate: text,
});
export type EntityListing = z.infer<typeof entityListingSchema>;

export const entityBusinessProfileSchema = z.object({
  principalBusiness: text,
  otherBusinesses: text,
  industry: text,
  productsServices: text,
  geographies: text,
  operationalStatus: text,
  relationshipRelevantFrom: text,
  relationshipRelevantUntil: text,
  notes: text,
});
export type EntityBusinessProfile = z.infer<typeof entityBusinessProfileSchema>;

export const entityRecordSchema = z.object({
  id: idSchema,
  entityType: z.enum(['', ...ENTITY_TYPE_VALUES]),
  identity: entityIdentitySchema,
  registration: entityRegistrationSchema,
  status: z.enum(['', ...ENTITY_STATUS_VALUES]),
  listing: entityListingSchema,
  businessProfile: entityBusinessProfileSchema,
  classificationBadges: z.array(z.enum(ENTITY_CLASSIFICATION_BADGE_VALUES)),
  currentlyActive: z.boolean(),
});
export type EntityRecord = z.infer<typeof entityRecordSchema>;

export const groupSnapshotSchema = z.object({
  structureAsOfDate: text,
  holdingParentCompanyExists: yesNoNotSureOrEmptySchema,
  ultimateHoldingCompanyExists: yesNoNotSureOrEmptySchema,
  subsidiariesExist: yesNoNotSureOrEmptySchema,
  stepDownSubsidiariesExist: yesNoNotSureOrEmptySchema,
  associatesExist: yesNoNotSureOrEmptySchema,
  jointVenturesExist: yesNoNotSureOrEmptySchema,
  foreignGroupEntitiesExist: yesNoNotSureOrEmptySchema,
  promoterGroupEntitiesExist: yesNoNotSureOrEmptySchema,
  otherCommonControlEntitiesExist: yesNoNotSureOrEmptySchema,
  historicalEntitiesRelevant: yesNoNotSureOrEmptySchema,
});
export type GroupSnapshot = z.infer<typeof groupSnapshotSchema>;

export const groupStructureAndEntityMasterSchema = z.object({
  groupSnapshot: groupSnapshotSchema,
  entities: z.array(entityRecordSchema),
});
export type GroupStructureAndEntityMaster = z.infer<
  typeof groupStructureAndEntityMasterSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 2: Ownership, Control & Relationship Mapping                        */
/* -------------------------------------------------------------------------- */

export const ownershipRelationshipRecordSchema = z.object({
  id: idSchema,
  parentPartyEntityId: text,
  investeeEntityId: text,
  relationshipType: z.enum(['', ...OWNERSHIP_RELATIONSHIP_TYPE_VALUES]),
  equityOwnershipPercent: decimalStringSchema,
  votingRightsPercent: decimalStringSchema,
  economicInterestPercent: decimalStringSchema,
  fullyDilutedInterestPercent: decimalStringSchema,
  effectiveIndirectInterestPercent: decimalStringSchema,
  effectiveFrom: text,
  effectiveUntil: text,
  currentHistorical: z.enum(['', ...CURRENT_HISTORICAL_VALUES]),
  sourceReference: text,
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  rightToAppointRemoveBoard: yesNoNotSureOrEmptySchema,
  boardNominationRights: yesNoNotSureOrEmptySchema,
  vetoRights: yesNoNotSureOrEmptySchema,
  affirmativeVotingRights: yesNoNotSureOrEmptySchema,
  managementControlRights: yesNoNotSureOrEmptySchema,
  jointControlArrangement: yesNoNotSureOrEmptySchema,
  participationInBusinessDecisions: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type OwnershipRelationshipRecord = z.infer<typeof ownershipRelationshipRecordSchema>;

export const contractualArrangementRecordSchema = z.object({
  id: idSchema,
  partyEntityIds: z.array(text),
  agreementType: z.enum(['', ...AGREEMENT_TYPE_VALUES]),
  agreementDate: text,
  rightsDescription: text,
  effectiveDate: text,
  expiryDate: text,
  currentStatus: text,
  reference: text,
  notes: text,
});
export type ContractualArrangementRecord = z.infer<typeof contractualArrangementRecordSchema>;

export const commonPersonRelationshipRecordSchema = z.object({
  id: idSchema,
  relationshipType: z.enum(['', ...COMMON_PERSON_RELATIONSHIP_TYPE_VALUES]),
  linkedPersonId: text,
  linkedPersonRole: z.enum(['', ...LINKED_PERSON_ROLE_VALUES]),
  linkedPersonName: text,
  linkedWorkstreamSource: text,
  entityIds: z.array(text),
  notes: text,
});
export type CommonPersonRelationshipRecord = z.infer<
  typeof commonPersonRelationshipRecordSchema
>;

export const ownershipControlAndRelationshipMappingSchema = z.object({
  ownershipRelationships: z.array(ownershipRelationshipRecordSchema),
  contractualArrangements: z.array(contractualArrangementRecordSchema),
  commonPersonRelationships: z.array(commonPersonRelationshipRecordSchema),
  notes: text,
});
export type OwnershipControlAndRelationshipMapping = z.infer<
  typeof ownershipControlAndRelationshipMappingSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 3: Group Company & Materiality Classification                       */
/* -------------------------------------------------------------------------- */

export const entityClassificationRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  classificationType: z.enum(['', ...REGULATORY_CLASSIFICATION_TYPE_VALUES]),
  currentHistorical: z.enum(['', ...CURRENT_HISTORICAL_VALUES]),
  relevantPeriods: text,
  basis: text,
  ownershipPercent: decimalStringSchema,
  votingPercent: decimalStringSchema,
  controlSignificantInfluenceBasis: text,
  managementConclusion: text,
  readinessState: z.enum(['', ...CLASSIFICATION_READINESS_STATE_VALUES]),
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type EntityClassificationRecord = z.infer<typeof entityClassificationRecordSchema>;

export const icdrGroupCompanyDeterminationSchema = z.object({
  entityId: text,
  isCompany: yesNoNotSureOrEmptySchema,
  isPromoter: yesNoNotSureOrEmptySchema,
  isCurrentSubsidiary: yesNoNotSureOrEmptySchema,
  rptsDuringRelevantPeriods: yesNoNotSureOrEmptySchema,
  includedInAccountingStandardRptDisclosures: yesNoNotSureOrEmptySchema,
  boardConsidersMaterial: yesNoNotSureOrEmptySchema,
  classificationState: z.enum(['', ...ICDR_GROUP_COMPANY_STATE_VALUES]),
  identificationBasis: z.enum(['', ...ICDR_IDENTIFICATION_BASIS_VALUES]),
  relevantReportingPeriods: text,
  dateFirstIdentified: text,
  boardConfirmationStatus: text,
  boardReference: text,
  notes: text,
});
export type IcdrGroupCompanyDetermination = z.infer<typeof icdrGroupCompanyDeterminationSchema>;

export const groupCompanyMaterialityPolicySchema = z.object({
  policyExists: yesNoNotSureOrEmptySchema,
  adopted: yesNoNotSureOrEmptySchema,
  adoptionDate: text,
  boardResolutionReference: text,
  effectiveDate: text,
  lastReviewed: text,
  policyVersion: text,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type GroupCompanyMaterialityPolicy = z.infer<typeof groupCompanyMaterialityPolicySchema>;

export const materialityCriterionRecordSchema = z.object({
  id: idSchema,
  metricType: z.enum(['', ...MATERIALITY_METRIC_TYPE_VALUES]),
  thresholdType: z.enum(['', ...THRESHOLD_TYPE_VALUES]),
  thresholdValue: decimalStringSchema,
  measurementPeriod: text,
  standaloneConsolidatedBasis: z.enum(['', ...STANDALONE_CONSOLIDATED_VALUES]),
  calculationMethodology: text,
  notes: text,
});
export type MaterialityCriterionRecord = z.infer<typeof materialityCriterionRecordSchema>;

export const materialSubsidiaryPurposeRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  purpose: z.enum(['', ...MATERIAL_SUBSIDIARY_PURPOSE_VALUES]),
  ruleBasis: text,
  calculationBasis: text,
  relevantPeriod: text,
  result: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type MaterialSubsidiaryPurposeRecord = z.infer<
  typeof materialSubsidiaryPurposeRecordSchema
>;

export const groupCompanyAndMaterialityClassificationSchema = z.object({
  entityClassifications: z.array(entityClassificationRecordSchema),
  icdrGroupCompanyDeterminations: z.array(icdrGroupCompanyDeterminationSchema),
  materialityPolicy: groupCompanyMaterialityPolicySchema,
  materialityCriteria: z.array(materialityCriterionRecordSchema),
  materialSubsidiaryPurposeRecords: z.array(materialSubsidiaryPurposeRecordSchema),
});
export type GroupCompanyAndMaterialityClassification = z.infer<
  typeof groupCompanyAndMaterialityClassificationSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 4: Related Party Universe & Classification                          */
/* -------------------------------------------------------------------------- */

export const frameworkClassificationSchema = z.object({
  framework: z.enum(['', ...CLASSIFICATION_FRAMEWORK_VALUES]),
  related: yesNoNotSureOrEmptySchema,
  basisRationale: text,
  relationshipStartDate: text,
  relationshipEndDate: text,
  relevantFinancialPeriods: text,
  currentHistorical: z.enum(['', ...CURRENT_HISTORICAL_VALUES]),
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type FrameworkClassification = z.infer<typeof frameworkClassificationSchema>;

export const relatedPartyRelationshipRecordSchema = z.object({
  id: idSchema,
  partyType: z.enum(['', ...RELATED_PARTY_PARTY_TYPE_VALUES]),
  linkedEntityId: text,
  linkedPersonId: text,
  linkedPersonRole: z.enum(['', ...LINKED_PERSON_ROLE_VALUES]),
  linkedPersonName: text,
  linkedWorkstreamSource: text,
  relationshipCategory: z.enum(['', ...RELATED_PARTY_CATEGORY_VALUES]),
  frameworkClassifications: z.array(frameworkClassificationSchema),
  relationshipSourceType: z.enum(['', ...RELATIONSHIP_SOURCE_TYPE_VALUES]),
  reference: text,
  notes: text,
});
export type RelatedPartyRelationshipRecord = z.infer<
  typeof relatedPartyRelationshipRecordSchema
>;

export const relatedPartyUniverseAndClassificationSchema = z.object({
  relatedPartyRelationships: z.array(relatedPartyRelationshipRecordSchema),
});
export type RelatedPartyUniverseAndClassification = z.infer<
  typeof relatedPartyUniverseAndClassificationSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 5: RPT Transactions, Balances & Commitments                         */
/* -------------------------------------------------------------------------- */

export const rptTransactionRecordSchema = z.object({
  id: idSchema,
  relatedPartyRelationshipId: text,
  linkedEntityId: text,
  linkedPersonId: text,
  financialPeriod: text,
  transactionDateFrom: text,
  transactionDateTo: text,
  transactionType: z.enum(['', ...RPT_TRANSACTION_TYPE_VALUES]),
  description: text,
  agreementReference: text,
  agreementDate: text,
  transactionValue: decimalStringSchema,
  currency: text,
  amountUnit: text,
  pricingBasis: text,
  transferPricingMethodology: text,
  comparableUncontrolledBasis: text,
  armsLengthStatus: z.enum(['', ...ARMS_LENGTH_STATUS_VALUES]),
  ordinaryCourseOfBusiness: yesNoNotSureOrEmptySchema,
  recurringNonRecurring: z.enum(['', ...RECURRING_NON_RECURRING_VALUES]),
  cashNonCash: z.enum(['', ...CASH_NON_CASH_VALUES]),
  auditCommitteeApproval: yesNoNotSureOrEmptySchema,
  omnibusApproval: yesNoNotSureOrEmptySchema,
  boardApproval: yesNoNotSureOrEmptySchema,
  shareholderApproval: yesNoNotSureOrEmptySchema,
  priorSubsequentApproval: yesNoNotSureOrEmptySchema,
  approvalDate: text,
  resolutionReference: text,
  interestedPartyAbstentionStatus: text,
  ratificationRequired: yesNoNotSureOrEmptySchema,
  ratificationStatus: text,
  professionalConfirmationStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type RptTransactionRecord = z.infer<typeof rptTransactionRecordSchema>;

export const rptBalanceRecordSchema = z.object({
  id: idSchema,
  relatedPartyRelationshipId: text,
  linkedEntityId: text,
  linkedPersonId: text,
  relatedTransactionId: text,
  reportingDate: text,
  reportingPeriod: text,
  balanceType: z.enum(['', ...RPT_BALANCE_TYPE_VALUES]),
  openingBalance: decimalStringSchema,
  transactionsDuringPeriod: decimalStringSchema,
  settlements: decimalStringSchema,
  closingBalance: decimalStringSchema,
  securedUnsecured: z.enum(['', ...SECURED_UNSECURED_VALUES]),
  interestBearing: z.enum(['', ...INTEREST_BEARING_VALUES]),
  interestRate: decimalStringSchema,
  repaymentTerms: text,
  dueDate: text,
  doubtfulAmountProvision: decimalStringSchema,
  writtenOffAmount: decimalStringSchema,
  writtenBackAmount: decimalStringSchema,
  sourceReference: text,
  notes: text,
});
export type RptBalanceRecord = z.infer<typeof rptBalanceRecordSchema>;

export const relatedPartyTransactionsBalancesAndCommitmentsSchema = z.object({
  transactions: z.array(rptTransactionRecordSchema),
  balances: z.array(rptBalanceRecordSchema),
});
export type RelatedPartyTransactionsBalancesAndCommitments = z.infer<
  typeof relatedPartyTransactionsBalancesAndCommitmentsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 6: Common Pursuits, Dependencies & Conflicts                        */
/* -------------------------------------------------------------------------- */

export const commonPursuitScreeningSchema = z.object({
  entityId: text,
  sameLineOfBusiness: yesNoNotSureOrEmptySchema,
  constitutionalObjectsPermitSameBusiness: yesNoNotSureOrEmptySchema,
  overlappingProductsServices: yesNoNotSureOrEmptySchema,
  sameCustomerSegment: yesNoNotSureOrEmptySchema,
  sameGeography: yesNoNotSureOrEmptySchema,
  sameSuppliers: yesNoNotSureOrEmptySchema,
  sameTenderBiddingOpportunities: yesNoNotSureOrEmptySchema,
  sameDistributionChannels: yesNoNotSureOrEmptySchema,
  sameTechnologyIp: yesNoNotSureOrEmptySchema,
  sameBrand: yesNoNotSureOrEmptySchema,
  sharedEmployeesResources: yesNoNotSureOrEmptySchema,
  sharedPromotersManagement: yesNoNotSureOrEmptySchema,
});
export type CommonPursuitScreening = z.infer<typeof commonPursuitScreeningSchema>;

export const commonPursuitRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  natureOfOverlap: text,
  productsServicesInvolved: text,
  geography: text,
  customers: text,
  extentOfActualCompetition: text,
  potentialCompetition: text,
  existingRevenueFromOverlappingBusiness: decimalStringSchema,
  businessOpportunitiesPotentiallyShared: text,
  historicalConflict: yesNoNotSureOrEmptySchema,
  conflictManagementMechanism: text,
  businessAllocationArrangement: text,
  nonCompeteAgreement: yesNoNotSureOrEmptySchema,
  exclusivityAgreement: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type CommonPursuitRecord = z.infer<typeof commonPursuitRecordSchema>;

export const interCompanyDependencyRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  dependencyType: z.enum(['', ...DEPENDENCY_TYPE_VALUES]),
  description: text,
  annualTransactionValue: decimalStringSchema,
  percentageOfIssuerRevenuePurchasesCost: decimalStringSchema,
  contractExists: yesNoNotSureOrEmptySchema,
  contractExpiry: text,
  pricingBasis: text,
  alternativesAvailable: yesNoNotSureOrEmptySchema,
  terminationImpact: text,
  linkedBusinessOperationsRecordId: text,
  notes: text,
});
export type InterCompanyDependencyRecord = z.infer<typeof interCompanyDependencyRecordSchema>;

export const otherBusinessInterestRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  interestType: z.enum(['', ...OTHER_BUSINESS_INTEREST_TYPE_VALUES]),
  nature: text,
  value: decimalStringSchema,
  relevantAgreement: text,
  currentStatus: text,
  notes: text,
});
export type OtherBusinessInterestRecord = z.infer<typeof otherBusinessInterestRecordSchema>;

export const commonPursuitsDependenciesAndConflictsSchema = z.object({
  commonPursuitScreenings: z.array(commonPursuitScreeningSchema),
  commonPursuitRecords: z.array(commonPursuitRecordSchema),
  interCompanyDependencies: z.array(interCompanyDependencyRecordSchema),
  otherBusinessInterests: z.array(otherBusinessInterestRecordSchema),
});
export type CommonPursuitsDependenciesAndConflicts = z.infer<
  typeof commonPursuitsDependenciesAndConflictsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 7: Group Entity Financial, Regulatory & Litigation Readiness        */
/* -------------------------------------------------------------------------- */

export const entityFinancialPeriodSummarySchema = z.object({
  period: text,
  equityShareCapital: decimalStringSchema,
  reservesOtherEquity: decimalStringSchema,
  netWorth: decimalStringSchema,
  revenueTurnover: decimalStringSchema,
  totalIncome: decimalStringSchema,
  profitLossAfterTax: decimalStringSchema,
  eps: decimalStringSchema,
  totalBorrowings: decimalStringSchema,
  sourceStatus: text,
  auditedStatus: z.enum(['', ...AUDIT_STATUS_VALUES]),
  auditorQualificationPresent: yesNoNotSureOrEmptySchema,
});
export type EntityFinancialPeriodSummary = z.infer<typeof entityFinancialPeriodSummarySchema>;

export const entityFinancialReadinessRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  financialInformationAvailable: yesNoNotSureOrEmptySchema,
  latestAuditedFinancialYear: text,
  threePriorFinancialYearsAvailable: yesNoNotSureOrEmptySchema,
  auditor: text,
  auditStatus: z.enum(['', ...AUDIT_STATUS_VALUES]),
  source: text,
  financialInformationWebsiteUrl: text,
  websitePublicationStatus: text,
  informationVerified: yesNoNotSureOrEmptySchema,
  entityConfirmationReceived: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  financialPeriodSummaries: z.array(entityFinancialPeriodSummarySchema),
  negativeNetWorth: yesNoNotSureOrEmptySchema,
  lossMaking: yesNoNotSureOrEmptySchema,
  auditorQualification: yesNoNotSureOrEmptySchema,
  goingConcernConcern: yesNoNotSureOrEmptySchema,
  materialDefault: yesNoNotSureOrEmptySchema,
  significantRptDependence: yesNoNotSureOrEmptySchema,
  materialIndebtednessToIssuer: yesNoNotSureOrEmptySchema,
  materialIndebtednessFromIssuer: yesNoNotSureOrEmptySchema,
  listed: yesNoNotSureOrEmptySchema,
  publicIssueMadeHistorically: yesNoNotSureOrEmptySchema,
  rightsIssuePrecedingThreeYears: yesNoNotSureOrEmptySchema,
  listingRefusedHistorically: yesNoNotSureOrEmptySchema,
  securitiesLawViolation: yesNoNotSureOrEmptySchema,
  sebiExchangeProceeding: yesNoNotSureOrEmptySchema,
  wilfulDefaulterConcern: yesNoNotSureOrEmptySchema,
  fraudulentBorrowerConcern: yesNoNotSureOrEmptySchema,
  ibcProceeding: yesNoNotSureOrEmptySchema,
  windingUpPetition: yesNoNotSureOrEmptySchema,
  liquidation: yesNoNotSureOrEmptySchema,
  defunct: yesNoNotSureOrEmptySchema,
  strikeOffApplication: yesNoNotSureOrEmptySchema,
  struckOff: yesNoNotSureOrEmptySchema,
  materialRocDefault: yesNoNotSureOrEmptySchema,
  regulatoryExplanation: text,
  materialLitigationExists: yesNoNotSureOrEmptySchema,
  litigationMatterCount: text,
  litigationAggregateAmount: decimalStringSchema,
  couldMateriallyAffectIssuer: yesNoNotSureOrEmptySchema,
  linkedLitigationRecordId: text,
  litigationInformationComplete: yesNoNotSureOrEmptySchema,
  litigationProfessionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  informationRequested: yesNoNotSureOrEmptySchema,
  requestDate: text,
  informationReceived: yesNoNotSureOrEmptySchema,
  informationStatus: z.enum(['', ...ENTITY_INFORMATION_STATUS_VALUES]),
  confirmationConsentStatus: text,
  followUpRequired: yesNoNotSureOrEmptySchema,
  publicInformationAvailable: yesNoNotSureOrEmptySchema,
  exemptionReliefPotentiallyRequired: yesNoNotSureOrEmptySchema,
  exemptionApplicationStatusReference: text,
  disclosureLimitation: text,
  riskFactorImplication: text,
  notes: text,
});
export type EntityFinancialReadinessRecord = z.infer<
  typeof entityFinancialReadinessRecordSchema
>;

export const groupEntityFinancialRegulatoryAndLitigationReadinessSchema = z.object({
  entityFinancialReadiness: z.array(entityFinancialReadinessRecordSchema),
});
export type GroupEntityFinancialRegulatoryAndLitigationReadiness = z.infer<
  typeof groupEntityFinancialRegulatoryAndLitigationReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 8: Changes, RPT Readiness & Confirmations                             */
/* -------------------------------------------------------------------------- */

export const relationshipChangeRecordSchema = z.object({
  id: idSchema,
  entityId: text,
  linkedPersonId: text,
  eventDate: text,
  eventType: z.enum(['', ...RELATIONSHIP_CHANGE_EVENT_VALUES]),
  previousRelationship: text,
  newRelationship: text,
  reason: text,
  transactionInvolved: yesNoNotSureOrEmptySchema,
  accountingTreatment: text,
  relevantReportingPeriods: text,
  boardAcknowledgement: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type RelationshipChangeRecord = z.infer<typeof relationshipChangeRecordSchema>;

export const groupCompanyClassificationReviewSchema = z.object({
  allRptEntitiesReviewed: yesNoNotSureOrEmptySchema,
  subsidiariesHandledSeparately: yesNoNotSureOrEmptySchema,
  promotersHandledSeparately: yesNoNotSureOrEmptySchema,
  boardMaterialEntitiesConsidered: yesNoNotSureOrEmptySchema,
  materialityPolicyApplied: yesNoNotSureOrEmptySchema,
  boardFinalListApproved: yesNoNotSureOrEmptySchema,
  reviewDate: text,
  merchantBankerProfessionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type GroupCompanyClassificationReview = z.infer<
  typeof groupCompanyClassificationReviewSchema
>;

export const rptReadinessSchema = z.object({
  completeRptScheduleAvailable: yesNoNotSureOrEmptySchema,
  reconciledWithRestatedFinancialInformation: yesNoNotSureOrEmptySchema,
  outstandingBalancesReconciled: yesNoNotSureOrEmptySchema,
  commitmentsIncluded: yesNoNotSureOrEmptySchema,
  guaranteesSecurityIncluded: yesNoNotSureOrEmptySchema,
  nonCashTransactionsIncluded: yesNoNotSureOrEmptySchema,
  kmpCompensationIncluded: yesNoNotSureOrEmptySchema,
  historicalRelatedPartiesIncluded: yesNoNotSureOrEmptySchema,
  approvalsMapped: yesNoNotSureOrEmptySchema,
  pendingAuditCommitteeAction: yesNoNotSureOrEmptySchema,
  pendingBoardAction: yesNoNotSureOrEmptySchema,
  pendingShareholderAction: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type RptReadiness = z.infer<typeof rptReadinessSchema>;

export const groupEntitiesConfirmationsSchema = z.object({
  allSubsidiariesDisclosed: yesNoNotSureOrEmptySchema,
  stepDownSubsidiariesDisclosed: yesNoNotSureOrEmptySchema,
  associatesJvsDisclosed: yesNoNotSureOrEmptySchema,
  ultimateParentControlStructureAccurate: yesNoNotSureOrEmptySchema,
  promoterGroupRelationshipsComplete: yesNoNotSureOrEmptySchema,
  accountingStandardRelatedPartiesIdentified: yesNoNotSureOrEmptySchema,
  companiesActRelatedPartiesConsidered: yesNoNotSureOrEmptySchema,
  historicalRelatedPartiesIncluded: yesNoNotSureOrEmptySchema,
  icdrGroupCompaniesIdentified: yesNoNotSureOrEmptySchema,
  subsidiariesPromotersNotDuplicatedAsGroupCompanies: yesNoNotSureOrEmptySchema,
  currentMaterialityPolicyCaptured: yesNoNotSureOrEmptySchema,
  rptRegisterComplete: yesNoNotSureOrEmptySchema,
  outstandingBalancesComplete: yesNoNotSureOrEmptySchema,
  commitmentsComplete: yesNoNotSureOrEmptySchema,
  guaranteesCollateralComplete: yesNoNotSureOrEmptySchema,
  loansAdvancesComplete: yesNoNotSureOrEmptySchema,
  commonPursuitsDisclosed: yesNoNotSureOrEmptySchema,
  groupCompanyDependenciesDisclosed: yesNoNotSureOrEmptySchema,
  competingGroupBusinessesDisclosed: yesNoNotSureOrEmptySchema,
  groupCompanyFinancialInformationCurrent: yesNoNotSureOrEmptySchema,
  negativeNetWorthAuditorConcernsDisclosed: yesNoNotSureOrEmptySchema,
  ibcWindingUpStrikeOffDisclosed: yesNoNotSureOrEmptySchema,
  informationUnavailableFromGroupCompaniesIdentified: yesNoNotSureOrEmptySchema,
  conflictingClassificationsFlagged: yesNoNotSureOrEmptySchema,
  linkedWorkstreamValuesReconciled: yesNoNotSureOrEmptySchema,
  professionalConfirmationRequired: yesNoNotSureOrEmptySchema,
});
export type GroupEntitiesConfirmations = z.infer<typeof groupEntitiesConfirmationsSchema>;

export const changesRptReadinessAndConfirmationsSchema = z.object({
  relationshipChanges: z.array(relationshipChangeRecordSchema),
  groupCompanyClassificationReview: groupCompanyClassificationReviewSchema,
  rptReadiness: rptReadinessSchema,
  confirmations: groupEntitiesConfirmationsSchema,
});
export type ChangesRptReadinessAndConfirmations = z.infer<
  typeof changesRptReadinessAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Root payload                                                                */
/* -------------------------------------------------------------------------- */

export const GROUP_ENTITIES_SECTION_IDS = [
  'group-structure-and-entity-master',
  'ownership-control-and-relationship-mapping',
  'group-company-and-materiality-classification',
  'related-party-universe-and-classification',
  'related-party-transactions-balances-and-commitments',
  'common-pursuits-dependencies-and-conflicts',
  'group-entity-financial-regulatory-and-litigation-readiness',
  'changes-rpt-readiness-and-confirmations',
] as const;

export type GroupEntitiesSectionId = (typeof GROUP_ENTITIES_SECTION_IDS)[number];

export const sectionIdSchema = z.enum(GROUP_ENTITIES_SECTION_IDS);

export const groupEntitiesRelatedPartiesPayloadSchema = z.object({
  schemaVersion: z.literal(GROUP_ENTITIES_SCHEMA_VERSION),
  groupStructureAndEntityMaster: groupStructureAndEntityMasterSchema,
  ownershipControlAndRelationshipMapping: ownershipControlAndRelationshipMappingSchema,
  groupCompanyAndMaterialityClassification: groupCompanyAndMaterialityClassificationSchema,
  relatedPartyUniverseAndClassification: relatedPartyUniverseAndClassificationSchema,
  relatedPartyTransactionsBalancesAndCommitments:
    relatedPartyTransactionsBalancesAndCommitmentsSchema,
  commonPursuitsDependenciesAndConflicts: commonPursuitsDependenciesAndConflictsSchema,
  groupEntityFinancialRegulatoryAndLitigationReadiness:
    groupEntityFinancialRegulatoryAndLitigationReadinessSchema,
  changesRptReadinessAndConfirmations: changesRptReadinessAndConfirmationsSchema,
});

export type GroupEntitiesRelatedPartiesPayload = z.infer<
  typeof groupEntitiesRelatedPartiesPayloadSchema
>;
