/**
 * IF1 canonical contract for IF2.
 *
 * Canonical Intermediaries & Filing payload schema (Increment IF1).
 *
 * - Persist `IntermediariesFilingPayload` (`schemaVersion: 1`) for IF2.
 * - One canonical master per real-world object: Intermediary, Filing, Offer Document Version.
 * - Monetary amounts and percentages are Decimal-safe strings (`''` when empty).
 * - Ternary answers: `'' | 'yes' | 'no' | 'not_sure'`.
 * - Computed totals, ratios, T+3 dates and assessment outcomes are DERIVED — never persisted here.
 * - UI labels live in `lib/intermediaries-filing/options.ts`.
 */

import { z } from 'zod';

export const INTERMEDIARIES_FILING_SCHEMA_VERSION = 1 as const;

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

export const READINESS_STATE_VALUES = [
  'appears-consistent',
  'potential-concern',
  'missing-information',
  'pending-professional-confirmation',
] as const;
export type ReadinessState = (typeof READINESS_STATE_VALUES)[number];

export const PRIMARY_SECONDARY_VALUES = ['primary', 'secondary'] as const;
export type PrimarySecondary = (typeof PRIMARY_SECONDARY_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 1 enums — intermediary master                                       */
/* -------------------------------------------------------------------------- */

export const INTERMEDIARY_ROLE_VALUES = [
  'lead_manager',
  'book_running_lead_manager',
  'additional_lead_manager',
  'registrar_to_issue',
  'legal_adviser',
  'domestic_legal_counsel',
  'international_counsel',
  'statutory_auditor',
  'peer_review_auditor',
  'restated_financial_auditor',
  'kpi_certifying_professional',
  'industry_research_provider',
  'banker_to_issue',
  'escrow_collection_bank',
  'public_issue_account_bank',
  'refund_bank',
  'sponsor_bank',
  'market_maker',
  'underwriter',
  'syndicate_member',
  'sub_syndicate_member',
  'monitoring_agency',
  'advertising_publicity_agency',
  'stabilising_agent',
  'other_expert',
  'other_adviser',
] as const;
export type IntermediaryRole = (typeof INTERMEDIARY_ROLE_VALUES)[number];

export const REGISTRATION_STATUS_VALUES = [
  'confirmed',
  'pending_verification',
  'not_sure',
  'professional_confirmation_required',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUS_VALUES)[number];

export const APPOINTMENT_STATUS_VALUES = [
  'proposed',
  'appointed',
  'agreement_pending',
  'active',
  'replaced',
  'resigned',
  'terminated',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

export const RESPONSIBILITY_AREA_VALUES = [
  'due_diligence',
  'offer_document_coordination',
  'capital_structure',
  'objects',
  'business_due_diligence',
  'legal_due_diligence',
  'financial_due_diligence',
  'industry',
  'marketing',
  'syndication',
  'underwriting',
  'registrar_coordination',
  'exchange_coordination',
  'sebi_coordination',
  'post_issue',
  'other',
] as const;
export type ResponsibilityArea = (typeof RESPONSIBILITY_AREA_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 2 enums — issue configuration & filing snapshot                     */
/* -------------------------------------------------------------------------- */

export const FILING_STAGE_VALUES = [
  'preparation',
  'internal_due_diligence',
  'adviser_review',
  'board_approval',
  'exchange_draft_filing',
  'exchange_vetting',
  'revision',
  'in_principle_stage',
  'pre_issue_filing',
  'roc_filing',
  'issue_open',
  'issue_closed',
  'allotment',
  'listing_application',
  'listed',
  'other',
] as const;
export type FilingStage = (typeof FILING_STAGE_VALUES)[number];

export const OFFER_DOCUMENT_FORM_VALUES = [
  'draft_prospectus',
  'drhp',
  'rhp',
  'prospectus',
  'abridged_prospectus',
  'addendum',
  'corrigendum',
  'other',
] as const;
export type OfferDocumentForm = (typeof OFFER_DOCUMENT_FORM_VALUES)[number];

export const INVESTOR_CATEGORY_VALUES = [
  'retail',
  'nii',
  'qib',
  'anchor',
  'market_maker',
  'employee',
  'shareholder',
  'other',
] as const;
export type InvestorCategory = (typeof INVESTOR_CATEGORY_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 3 enums — filing & regulatory milestones                            */
/* -------------------------------------------------------------------------- */

export const FILING_STATUS_VALUES = [
  'working_draft',
  'adviser_review',
  'board_approved',
  'filed',
  'returned',
  'queries_received',
  'response_submitted',
  'revised',
  'approved_for_next_stage',
  'superseded',
] as const;
export type FilingStatus = (typeof FILING_STATUS_VALUES)[number];

export const FILING_AUTHORITY_VALUES = [
  'sme_exchange',
  'sebi',
  'roc',
  'depository',
  'other',
] as const;
export type FilingAuthority = (typeof FILING_AUTHORITY_VALUES)[number];

export const EXCHANGE_QUERY_STATUS_VALUES = [
  'open',
  'drafting_response',
  'adviser_review',
  'response_submitted',
  'follow_up_received',
  'closed',
  'superseded',
] as const;
export type ExchangeQueryStatus = (typeof EXCHANGE_QUERY_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 4 enums — due diligence, certificates, consents                     */
/* -------------------------------------------------------------------------- */

export const DUE_DILIGENCE_AREA_VALUES = [
  'company_incorporation',
  'ipo_eligibility',
  'capital_structure',
  'promoters_promoter_group',
  'objects',
  'business',
  'industry_market',
  'financials',
  'kpis',
  'management_governance',
  'group_entities',
  'related_parties',
  'borrowings',
  'assets_properties',
  'material_contracts',
  'litigation',
  'approvals',
  'tax',
  'material_creditors',
  'risk_factors',
  'other',
] as const;
export type DueDiligenceArea = (typeof DUE_DILIGENCE_AREA_VALUES)[number];

export const CERTIFICATE_TYPE_VALUES = [
  'merchant_banker_due_diligence',
  'sme_additional_due_diligence_or_form_h',
  'restated_financials_auditor',
  'kpi',
  'share_capital',
  'capital_structure',
  'objects_means_of_finance',
  'working_capital',
  'debt_repayment_aup',
  'tax_benefits',
  'promoter_contribution',
  'industry_report',
  'legal_opinion_or_certificate',
  'secretarial',
  'eligibility_or_default',
  'other',
] as const;
export type CertificateType = (typeof CERTIFICATE_TYPE_VALUES)[number];

export const CERTIFICATE_STATUS_VALUES = [
  'not_started',
  'draft',
  'under_review',
  'final',
  'signed',
  'superseded',
] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUS_VALUES)[number];

export const CERTIFICATE_FILED_TO_VALUES = [
  'exchange',
  'sebi',
  'roc',
  'not_filed',
  'other',
] as const;
export type CertificateFiledTo = (typeof CERTIFICATE_FILED_TO_VALUES)[number];

export const CONSENT_PARTY_TYPE_VALUES = [
  'director',
  'promoter',
  'cfo',
  'company_secretary',
  'compliance_officer',
  'lead_manager',
  'registrar',
  'legal_adviser',
  'statutory_auditor',
  'peer_review_auditor',
  'expert',
  'industry_research_provider',
  'banker_to_issue',
  'sponsor_bank',
  'market_maker',
  'underwriter',
  'monitoring_agency',
  'other',
] as const;
export type ConsentPartyType = (typeof CONSENT_PARTY_TYPE_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 5 enums — depository, banking, ASBA/UPI                             */
/* -------------------------------------------------------------------------- */

export const ISIN_STATUS_VALUES = [
  'not_started',
  'application_pending',
  'allotted',
  'active',
  'not_sure',
] as const;
export type IsinStatus = (typeof ISIN_STATUS_VALUES)[number];

export const ISSUE_BANK_ROLE_VALUES = [
  'banker_to_issue',
  'escrow_collection_bank',
  'public_issue_account_bank',
  'refund_bank',
  'sponsor_bank',
] as const;
export type IssueBankRole = (typeof ISSUE_BANK_ROLE_VALUES)[number];

export const ACCOUNT_SETUP_STATUS_VALUES = [
  'not_started',
  'pending',
  'configured',
  'tested',
  'ready',
] as const;
export type AccountSetupStatus = (typeof ACCOUNT_SETUP_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 8 enums — final offer document & filing readiness                   */
/* -------------------------------------------------------------------------- */

export const PLACEHOLDER_TYPE_VALUES = [
  'unresolved_dot',
  'missing_date',
  'missing_intermediary',
  'missing_price',
  'missing_agreement',
  'missing_certificate',
  'missing_approval_reference',
  'missing_page_reference',
  'missing_financial_value',
  'other',
] as const;
export type PlaceholderType = (typeof PLACEHOLDER_TYPE_VALUES)[number];

export const PLACEHOLDER_STATUS_VALUES = [
  'open',
  'in_progress',
  'resolved',
  'not_applicable',
] as const;
export type PlaceholderStatus = (typeof PLACEHOLDER_STATUS_VALUES)[number];

export const INSPECTION_ITEM_TYPE_VALUES = ['material_contract', 'material_document'] as const;
export type InspectionItemType = (typeof INSPECTION_ITEM_TYPE_VALUES)[number];

export const INSPECTION_INCLUSION_STATUS_VALUES = [
  'included',
  'excluded',
  'pending_review',
] as const;
export type InspectionInclusionStatus = (typeof INSPECTION_INCLUSION_STATUS_VALUES)[number];

export const INSPECTION_FORMAT_VALUES = ['physical', 'digital', 'both'] as const;
export type InspectionFormat = (typeof INSPECTION_FORMAT_VALUES)[number];

export const ISSUE_AGREEMENT_TYPE_VALUES = [
  'lead_manager_issue_agreement',
  'registrar_agreement',
  'underwriting_agreement',
  'market_making_agreement',
  'banker_to_issue_escrow_public_issue_account_agreement',
  'sponsor_bank_agreement',
  'syndicate_agreement',
  'inter_se_agreement',
  'nsdl_tripartite_agreement',
  'cdsl_tripartite_agreement',
  'monitoring_agency_agreement',
  'other_issue_agreement',
] as const;
export type IssueAgreementType = (typeof ISSUE_AGREEMENT_TYPE_VALUES)[number];

export const ISSUE_AGREEMENT_STATUS_VALUES = [
  'not_started',
  'drafting',
  'under_review',
  'executed',
  'amendment_required',
  'superseded',
  'not_applicable',
] as const;
export type IssueAgreementStatus = (typeof ISSUE_AGREEMENT_STATUS_VALUES)[number];

export const PUBLIC_COMMUNICATION_TYPE_VALUES = [
  'pre_issue_advertisement',
  'price_band_advertisement',
  'issue_opening_advertisement',
  'issue_closing_advertisement',
  'allotment_advertisement',
  'corrigendum',
  'material_development_notice',
  'other',
] as const;
export type PublicCommunicationType = (typeof PUBLIC_COMMUNICATION_TYPE_VALUES)[number];

export const AV_APPLICABILITY_VALUES = [
  'required',
  'not_applicable',
  'potentially_applicable',
  'pending_professional_confirmation',
] as const;
export type AvApplicability = (typeof AV_APPLICABILITY_VALUES)[number];

export const POST_ISSUE_ACTION_TYPE_VALUES = [
  'post_issue_lead_manager_report',
  'final_post_issue_documentation',
  'underwriting_devolvement',
  'market_maker_inventory_allocation',
  'investor_grievances',
  'allotment_advertisement',
  'website_allotment_disclosure',
  'issue_proceeds_account_movement',
  'monitoring_agency_handover',
  'final_issue_expense_reconciliation',
  'issue_closure_sign_off',
] as const;
export type PostIssueActionType = (typeof POST_ISSUE_ACTION_TYPE_VALUES)[number];

export const POST_ISSUE_ACTION_STATUS_VALUES = [
  'not_yet_due',
  'not_applicable',
  'pending',
  'in_progress',
  'complete',
] as const;
export type PostIssueActionStatus = (typeof POST_ISSUE_ACTION_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* Section 1: Issue Team & Intermediary Master                                 */
/* -------------------------------------------------------------------------- */

export const issueTeamSnapshotSchema = z.object({
  teamAsOfDate: text,
  leadManagerAppointed: yesNoNotSureOrEmptySchema,
  registrarAppointed: yesNoNotSureOrEmptySchema,
  legalCounselAppointed: yesNoNotSureOrEmptySchema,
  statutoryPeerReviewAuditorEngaged: yesNoNotSureOrEmptySchema,
  marketMakerAppointed: yesNoNotSureOrEmptySchema,
  underwritersAppointed: yesNoNotSureOrEmptySchema,
  bankersToIssueAppointed: yesNoNotSureOrEmptySchema,
  sponsorBankAppointed: yesNoNotSureOrEmptySchema,
  monitoringAgencyApplicable: yesNoNotSureOrEmptySchema,
  monitoringAgencyAppointed: yesNoNotSureOrEmptySchema,
  syndicateMembersApplicable: yesNoNotSureOrEmptySchema,
  syndicateMembersAppointed: yesNoNotSureOrEmptySchema,
  allRequiredEngagementAgreementsExecuted: yesNoNotSureOrEmptySchema,
  applicableRegistrationsReviewed: yesNoNotSureOrEmptySchema,
});
export type IssueTeamSnapshot = z.infer<typeof issueTeamSnapshotSchema>;

export const intermediaryContactSchema = z.object({
  registeredOffice: text,
  relevantCorporateBranchOffice: text,
  telephone: text,
  email: text,
  investorGrievanceEmail: text,
  website: text,
  contactPerson: text,
  designation: text,
  cin: text,
});
export type IntermediaryContact = z.infer<typeof intermediaryContactSchema>;

export const intermediaryRegistrationSchema = z.object({
  registrationRequired: yesNoNotSureOrEmptySchema,
  sebiRegistrationNumber: text,
  registrationCategory: text,
  registrationStatus: z.enum(['', ...REGISTRATION_STATUS_VALUES]),
  registrationExpiry: text,
  exchangeMembership: text,
  exchange: text,
  marketMakerRegistrationReference: text,
  otherRelevantRegistrationReference: text,
});
export type IntermediaryRegistration = z.infer<typeof intermediaryRegistrationSchema>;

export const intermediaryAppointmentSchema = z.object({
  appointmentDate: text,
  boardApprovalReference: text,
  engagementLetterDate: text,
  agreementDate: text,
  effectiveDate: text,
  scope: text,
  feeStructureSummary: text,
  reimbursementArrangement: text,
  status: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  replacementIntermediaryId: text,
  replacementReason: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type IntermediaryAppointment = z.infer<typeof intermediaryAppointmentSchema>;

export const intermediaryRecordSchema = z.object({
  intermediaryId: idSchema,
  legalName: text,
  displayName: text,
  roles: z.array(z.enum(INTERMEDIARY_ROLE_VALUES)),
  contact: intermediaryContactSchema,
  registration: intermediaryRegistrationSchema,
  appointment: intermediaryAppointmentSchema,
});
export type IntermediaryRecord = z.infer<typeof intermediaryRecordSchema>;

export const interSeResponsibilityRecordSchema = z.object({
  responsibilityId: idSchema,
  intermediaryId: text,
  responsibilityAreas: z.array(z.enum(RESPONSIBILITY_AREA_VALUES)),
  detailedResponsibility: text,
  primarySecondary: z.enum(['', ...PRIMARY_SECONDARY_VALUES]),
  notes: text,
});
export type InterSeResponsibilityRecord = z.infer<typeof interSeResponsibilityRecordSchema>;

export const interSeAgreementSchema = z.object({
  interSeAgreementRequired: yesNoNotSureOrEmptySchema,
  interSeAgreementExecuted: yesNoNotSureOrEmptySchema,
  agreementDate: text,
  coordinatingLeadManagerIntermediaryId: text,
  identifiedResponsibilityGaps: text,
  identifiedOverlaps: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type InterSeAgreement = z.infer<typeof interSeAgreementSchema>;

export const issueTeamAndIntermediaryMasterSchema = z.object({
  issueTeamSnapshot: issueTeamSnapshotSchema,
  intermediaries: z.array(intermediaryRecordSchema),
  interSeResponsibilities: z.array(interSeResponsibilityRecordSchema),
  interSeAgreement: interSeAgreementSchema,
});
export type IssueTeamAndIntermediaryMaster = z.infer<typeof issueTeamAndIntermediaryMasterSchema>;

/* -------------------------------------------------------------------------- */
/* Section 2: Issue Configuration & Filing Snapshot                            */
/* -------------------------------------------------------------------------- */

export const ipoSetupLinkedSnapshotSchema = z.object({
  targetSmePlatform: text,
  issueMethod: text,
  freshIssue: text,
  ofs: text,
  totalOffer: text,
  faceValue: text,
  proposedFinalIssuePrice: text,
  floorCapPrice: text,
  priceBand: text,
  offerSize: text,
  preIpoPlacement: text,
  reservations: text,
  targetFilingDate: text,
  publicCompanyConversionStatus: text,
  issueStage: text,
});
export type IpoSetupLinkedSnapshot = z.infer<typeof ipoSetupLinkedSnapshotSchema>;

export const capitalLinkedSnapshotSchema = z.object({
  preIssueShares: text,
  freshIssueShares: text,
  ofsShares: text,
  postIssueShares: text,
  preIssuePaidUpCapital: text,
  postIssuePaidUpCapital: text,
  sellingShareholders: text,
  promoterContribution: text,
  lockInRelatedContext: text,
});
export type CapitalLinkedSnapshot = z.infer<typeof capitalLinkedSnapshotSchema>;

export const filingSnapshotSchema = z.object({
  snapshotDate: text,
  filingStage: z.enum(['', ...FILING_STAGE_VALUES]),
  selectedDesignatedStockExchange: text,
  additionalExchange: text,
  currentOfferDocumentForm: z.enum(['', ...OFFER_DOCUMENT_FORM_VALUES]),
  issueMethodConfirmed: yesNoNotSureOrEmptySchema,
  issueStructureFrozen: yesNoNotSureOrEmptySchema,
  capitalStructureFrozen: yesNoNotSureOrEmptySchema,
  objectsFrozen: yesNoNotSureOrEmptySchema,
  financialsPeriodFrozen: yesNoNotSureOrEmptySchema,
  legalDdCutOffFrozen: yesNoNotSureOrEmptySchema,
  offerDocumentCutOffDate: text,
});
export type FilingSnapshot = z.infer<typeof filingSnapshotSchema>;

export const filingSnapshotReconciliationSchema = z.object({
  freshIssueShares: text,
  ofsShares: text,
  totalOfferShares: text,
  freshIssueAmount: text,
  ofsAmount: text,
  totalOfferAmount: text,
  marketMakerReservation: text,
  netIssueToPublic: text,
  postIssueShares: text,
  postIssueCapital: text,
  filingConfirmationStatus: z.enum(['', ...READINESS_STATE_VALUES]),
  discrepancyNote: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type FilingSnapshotReconciliation = z.infer<typeof filingSnapshotReconciliationSchema>;

export const pricingSchema = z.object({
  pricingMethod: text,
  fixedIssuePrice: decimalStringSchema,
  floorPrice: decimalStringSchema,
  capPrice: decimalStringSchema,
  priceBand: text,
  priceBandApprovalDate: text,
  boardPricingCommitteeApproval: text,
  priceDiscoveryPending: yesNoNotSureOrEmptySchema,
  finalIssuePrice: decimalStringSchema,
  pricingDate: text,
  basisForIssuePriceReadiness: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type Pricing = z.infer<typeof pricingSchema>;

export const investorAllocationRecordSchema = z.object({
  allocationId: idSchema,
  category: z.enum(['', ...INVESTOR_CATEGORY_VALUES]),
  applicable: yesNoNotSureOrEmptySchema,
  shares: decimalStringSchema,
  percentage: decimalStringSchema,
  amount: decimalStringSchema,
  sourceRuleBasis: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type InvestorAllocationRecord = z.infer<typeof investorAllocationRecordSchema>;

export const lotApplicationDetailsSchema = z.object({
  lotSize: text,
  minimumApplicationLots: text,
  minimumApplicationAmount: decimalStringSchema,
  bidMultiples: text,
  cutOffPricePermitted: yesNoNotSureOrEmptySchema,
  investorCategoryDistinctions: text,
  exchangeValidationStatus: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type LotApplicationDetails = z.infer<typeof lotApplicationDetailsSchema>;

export const issueConfigurationAndFilingSnapshotSchema = z.object({
  ipoSetupLinkedSnapshot: ipoSetupLinkedSnapshotSchema,
  capitalLinkedSnapshot: capitalLinkedSnapshotSchema,
  filingSnapshot: filingSnapshotSchema,
  filingSnapshotReconciliation: filingSnapshotReconciliationSchema,
  pricing: pricingSchema,
  investorAllocations: z.array(investorAllocationRecordSchema),
  lotApplicationDetails: lotApplicationDetailsSchema,
});
export type IssueConfigurationAndFilingSnapshot = z.infer<
  typeof issueConfigurationAndFilingSnapshotSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 3: Filing & Regulatory Milestone Tracker                            */
/* -------------------------------------------------------------------------- */

export const filingRecordSchema = z.object({
  filingId: idSchema,
  linkedDocumentVersionId: text,
  documentType: z.enum(['', ...OFFER_DOCUMENT_FORM_VALUES]),
  documentDate: text,
  internalVersion: text,
  filingStage: z.enum(['', ...FILING_STAGE_VALUES]),
  status: z.enum(['', ...FILING_STATUS_VALUES]),
  authority: z.enum(['', ...FILING_AUTHORITY_VALUES]),
  selectedAuthorityExchange: text,
  filingDate: text,
  filingTime: text,
  referenceApplicationNumber: text,
  acknowledgementReceived: yesNoNotSureOrEmptySchema,
  acknowledgementDate: text,
  submittedBy: text,
  responsibleLeadManagerIntermediaryId: text,
  supersededByFilingId: text,
  notes: text,
});
export type FilingRecord = z.infer<typeof filingRecordSchema>;

export const exchangeDraftFilingSchema = z.object({
  exchange: text,
  draftFilingDate: text,
  filingChecklistSubmitted: yesNoNotSureOrEmptySchema,
  checklistVersion: text,
  completenessConfirmation: yesNoNotSureOrEmptySchema,
  feesPaid: yesNoNotSureOrEmptySchema,
  feePaymentReference: text,
  filingAcknowledgement: text,
  applicationAccepted: yesNoNotSureOrEmptySchema,
  vettingReviewStarted: yesNoNotSureOrEmptySchema,
  initialQueryDate: text,
  notes: text,
});
export type ExchangeDraftFiling = z.infer<typeof exchangeDraftFilingSchema>;

export const exchangeQueryRecordSchema = z.object({
  queryId: idSchema,
  filingId: text,
  queryRound: text,
  queryReferenceNumber: text,
  queryDate: text,
  category: text,
  questionRequest: text,
  responsibleDwaarWorkstream: text,
  responsibleOwner: text,
  responsibleLeadManagerIntermediaryId: text,
  responseDueDate: text,
  status: z.enum(['', ...EXCHANGE_QUERY_STATUS_VALUES]),
  responseDate: text,
  responseSummary: text,
  offerDocumentChangeRequired: yesNoNotSureOrEmptySchema,
  affectedChapterSection: text,
  supportingCertificateRequired: yesNoNotSureOrEmptySchema,
  linkedCertificateId: text,
  closedByExchange: yesNoNotSureOrEmptySchema,
  closureDate: text,
  notes: text,
});
export type ExchangeQueryRecord = z.infer<typeof exchangeQueryRecordSchema>;

export const resubmissionRecordSchema = z.object({
  resubmissionId: idSchema,
  linkedFilingId: text,
  draftReturned: yesNoNotSureOrEmptySchema,
  returnDate: text,
  returnBasisCategory: text,
  resubmissionPermitted: yesNoNotSureOrEmptySchema,
  requiredChanges: text,
  resubmissionDate: text,
  newFilingId: text,
  exchangeReference: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type ResubmissionRecord = z.infer<typeof resubmissionRecordSchema>;

export const inPrincipleApprovalSchema = z.object({
  applied: yesNoNotSureOrEmptySchema,
  applicationDate: text,
  exchange: text,
  approvalReceived: yesNoNotSureOrEmptySchema,
  approvalLetterDate: text,
  approvalReference: text,
  conditions: text,
  conditionsSatisfied: yesNoNotSureOrEmptySchema,
  outstandingConditions: text,
  validityDate: text,
  nameUsePermissionStatus: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type InPrincipleApproval = z.infer<typeof inPrincipleApprovalSchema>;

export const sebiSmeFilingRecordSchema = z.object({
  filingApplicability: yesNoNotSureOrEmptySchema,
  filedThroughLeadManager: yesNoNotSureOrEmptySchema,
  filingDate: text,
  filingReferenceNumber: text,
  linkedFilingId: text,
  documentVersion: text,
  dueDiligenceCertificateIncluded: yesNoNotSureOrEmptySchema,
  smeAdditionalConfirmationFormHIncluded: yesNoNotSureOrEmptySchema,
  displayedOnSebiWebsite: yesNoNotSureOrEmptySchema,
  displayedOnIssuerWebsite: yesNoNotSureOrEmptySchema,
  displayedOnLeadManagerWebsite: yesNoNotSureOrEmptySchema,
  displayedOnSmeExchangeWebsite: yesNoNotSureOrEmptySchema,
  status: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type SebiSmeFilingRecord = z.infer<typeof sebiSmeFilingRecordSchema>;

export const rocFilingRecordSchema = z.object({
  filingRecordId: text,
  documentType: z.enum(['', ...OFFER_DOCUMENT_FORM_VALUES]),
  boardApprovalStatus: text,
  shareholderAuthorityReference: text,
  filingDate: text,
  rocJurisdiction: text,
  formReferenceSrn: text,
  registrationAcknowledgement: text,
  registrationDate: text,
  finalSignedVersion: text,
  requiredAttachmentsIncluded: yesNoNotSureOrEmptySchema,
  applicableConsentsIncluded: yesNoNotSureOrEmptySchema,
  filingComplete: yesNoNotSureOrEmptySchema,
  professionalLegalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type RocFilingRecord = z.infer<typeof rocFilingRecordSchema>;

export const filingAndRegulatoryMilestoneTrackerSchema = z.object({
  filings: z.array(filingRecordSchema),
  exchangeDraftFiling: exchangeDraftFilingSchema,
  exchangeQueries: z.array(exchangeQueryRecordSchema),
  resubmissions: z.array(resubmissionRecordSchema),
  inPrincipleApproval: inPrincipleApprovalSchema,
  sebiSmeFiling: sebiSmeFilingRecordSchema,
  rocFiling: rocFilingRecordSchema,
});
export type FilingAndRegulatoryMilestoneTracker = z.infer<
  typeof filingAndRegulatoryMilestoneTrackerSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 4: Due Diligence, Certificates, Consents & Sign-offs                */
/* -------------------------------------------------------------------------- */

export const dueDiligenceAreaRecordSchema = z.object({
  dueDiligenceAreaId: idSchema,
  area: z.enum(['', ...DUE_DILIGENCE_AREA_VALUES]),
  sourceWorkstream: text,
  dueDiligenceStarted: yesNoNotSureOrEmptySchema,
  informationProvided: yesNoNotSureOrEmptySchema,
  leadManagerReviewed: yesNoNotSureOrEmptySchema,
  legalCounselReviewed: yesNoNotSureOrEmptySchema,
  auditorReviewed: yesNoNotSureOrEmptySchema,
  independentVerificationPerformed: yesNoNotSureOrEmptySchema,
  siteVisitApplicable: yesNoNotSureOrEmptySchema,
  siteVisitCompleted: yesNoNotSureOrEmptySchema,
  openQueryCount: text,
  materialUnresolvedIssue: yesNoNotSureOrEmptySchema,
  finalSignOff: yesNoNotSureOrEmptySchema,
  signOffDate: text,
  responsibleProfessionalIntermediaryId: text,
  notes: text,
});
export type DueDiligenceAreaRecord = z.infer<typeof dueDiligenceAreaRecordSchema>;

export const certificateRecordSchema = z.object({
  certificateId: idSchema,
  certificateType: z.enum(['', ...CERTIFICATE_TYPE_VALUES]),
  provider: text,
  linkedIntermediaryId: text,
  certificateDate: text,
  regulationFormReference: text,
  subject: text,
  reportingPeriod: text,
  linkedOfferDocumentVersionId: text,
  documentVersionReviewed: text,
  status: z.enum(['', ...CERTIFICATE_STATUS_VALUES]),
  signed: yesNoNotSureOrEmptySchema,
  udinReference: text,
  qualificationReservationExists: yesNoNotSureOrEmptySchema,
  qualificationDetails: text,
  validityReadinessForCurrentFilingStage: text,
  filedSubmittedTo: z.enum(['', ...CERTIFICATE_FILED_TO_VALUES]),
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type CertificateRecord = z.infer<typeof certificateRecordSchema>;

export const consentRecordSchema = z.object({
  consentId: idSchema,
  partyType: z.enum(['', ...CONSENT_PARTY_TYPE_VALUES]),
  linkedPersonIntermediaryId: text,
  displayName: text,
  capacity: text,
  consentRequired: yesNoNotSureOrEmptySchema,
  requested: yesNoNotSureOrEmptySchema,
  requestDate: text,
  received: yesNoNotSureOrEmptySchema,
  consentDate: text,
  wordingVersion: text,
  reference: text,
  linkedOfferDocumentVersionId: text,
  withdrawn: yesNoNotSureOrEmptySchema,
  withdrawalDate: text,
  validForCurrentFilingStage: yesNoNotSureOrEmptySchema,
  includedInFiling: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type ConsentRecord = z.infer<typeof consentRecordSchema>;

export const chapterSignoffRecordSchema = z.object({
  signoffId: idSchema,
  chapterSectionKey: text,
  chapterLabel: text,
  responsibleInternalOwner: text,
  responsibleAdviserIntermediaryId: text,
  informationFrozen: yesNoNotSureOrEmptySchema,
  linkedSourceWorkstreamsReconciled: yesNoNotSureOrEmptySchema,
  legalSignOff: yesNoNotSureOrEmptySchema,
  financialSignOff: yesNoNotSureOrEmptySchema,
  leadManagerSignOff: yesNoNotSureOrEmptySchema,
  managementSignOff: yesNoNotSureOrEmptySchema,
  openCommentCount: text,
  finalSignOff: yesNoNotSureOrEmptySchema,
  finalSignOffDate: text,
  notes: text,
});
export type ChapterSignoffRecord = z.infer<typeof chapterSignoffRecordSchema>;

export const dueDiligenceCertificatesConsentsAndSignoffsSchema = z.object({
  dueDiligenceAreas: z.array(dueDiligenceAreaRecordSchema),
  certificates: z.array(certificateRecordSchema),
  consents: z.array(consentRecordSchema),
  chapterSignoffs: z.array(chapterSignoffRecordSchema),
});
export type DueDiligenceCertificatesConsentsAndSignoffs = z.infer<
  typeof dueDiligenceCertificatesConsentsAndSignoffsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 5: Depositories, Banking, ASBA/UPI & Issue Infrastructure           */
/* -------------------------------------------------------------------------- */

export const depositoryReadinessSchema = z.object({
  isin: text,
  isinStatus: z.enum(['', ...ISIN_STATUS_VALUES]),
  newTemporaryIsinRequirement: yesNoNotSureOrEmptySchema,
  nsdlConnectivityStatus: text,
  cdslConnectivityStatus: text,
  registrarConnectivityStatus: text,
  promoterHoldingsDematerialisedStatus: text,
  existingSpecifiedSecuritiesDematerialisationReadiness: text,
  corporateActionReadiness: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type DepositoryReadiness = z.infer<typeof depositoryReadinessSchema>;

export const depositoryAgreementSchema = z.object({
  agreementExists: yesNoNotSureOrEmptySchema,
  agreementDate: text,
  issuer: text,
  registrarIntermediaryId: text,
  depository: text,
  reference: text,
  current: yesNoNotSureOrEmptySchema,
  amendmentRequired: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type DepositoryAgreement = z.infer<typeof depositoryAgreementSchema>;

export const depositoryAgreementsSchema = z.object({
  nsdl: depositoryAgreementSchema,
  cdsl: depositoryAgreementSchema,
});
export type DepositoryAgreements = z.infer<typeof depositoryAgreementsSchema>;

export const issueBankRoleRecordSchema = z.object({
  bankRoleId: idSchema,
  intermediaryId: text,
  role: z.enum(['', ...ISSUE_BANK_ROLE_VALUES]),
  branch: text,
  applicableRegistrationReference: text,
  agreementDate: text,
  accountSetupStatus: z.enum(['', ...ACCOUNT_SETUP_STATUS_VALUES]),
  accountReferenceMaskedIdentifier: text,
  testingCompleted: yesNoNotSureOrEmptySchema,
  testDate: text,
  currentStatus: text,
  notes: text,
});
export type IssueBankRoleRecord = z.infer<typeof issueBankRoleRecordSchema>;

export const sponsorBankUpiReadinessSchema = z.object({
  sponsorBankAppointed: yesNoNotSureOrEmptySchema,
  intermediaryId: text,
  agreementExecuted: yesNoNotSureOrEmptySchema,
  upiSetupComplete: yesNoNotSureOrEmptySchema,
  exchangeConnectivityConfirmed: yesNoNotSureOrEmptySchema,
  npciReadinessConfirmed: yesNoNotSureOrEmptySchema,
  testCompleted: yesNoNotSureOrEmptySchema,
  testDate: text,
  operationalContact: text,
  escalationContact: text,
  contingencyProcess: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type SponsorBankUpiReadiness = z.infer<typeof sponsorBankUpiReadinessSchema>;

export const asbaConfigurationSchema = z.object({
  asbaApplicable: yesNoNotSureOrEmptySchema,
  upiMechanismApplicable: yesNoNotSureOrEmptySchema,
  issueMethod: text,
  bidCollectionConfigurationReviewed: yesNoNotSureOrEmptySchema,
  bidCumApplicationFormReady: yesNoNotSureOrEmptySchema,
  electronicApplicationReadiness: yesNoNotSureOrEmptySchema,
  investorCategoryHandlingReviewed: yesNoNotSureOrEmptySchema,
  technicalRejectionCriteriaReviewed: yesNoNotSureOrEmptySchema,
  panDematBankValidationFlowReviewed: yesNoNotSureOrEmptySchema,
  registrarReconciliationProcessReady: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type AsbaConfiguration = z.infer<typeof asbaConfigurationSchema>;

export const depositoriesBankingAsbaUpiAndIssueInfrastructureSchema = z.object({
  depositoryReadiness: depositoryReadinessSchema,
  depositoryAgreements: depositoryAgreementsSchema,
  issueBankRoles: z.array(issueBankRoleRecordSchema),
  sponsorBankUpiReadiness: sponsorBankUpiReadinessSchema,
  asbaConfiguration: asbaConfigurationSchema,
});
export type DepositoriesBankingAsbaUpiAndIssueInfrastructure = z.infer<
  typeof depositoriesBankingAsbaUpiAndIssueInfrastructureSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 6: Underwriting, Market Making & Distribution Arrangements          */
/* -------------------------------------------------------------------------- */

export const underwritingSummarySchema = z.object({
  issueShares: decimalStringSchema,
  issueAmount: decimalStringSchema,
  totalUnderwritingCommitment: decimalStringSchema,
  totalUnderwritingPercentage: decimalStringSchema,
  fullCoverageState: text,
  leadManagerOwnAccountCommitment: decimalStringSchema,
  ownAccountPercentage: decimalStringSchema,
  underwritingAgreementExecuted: yesNoNotSureOrEmptySchema,
  underwritingAgreementDate: text,
  resourceSufficiencyReview: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type UnderwritingSummary = z.infer<typeof underwritingSummarySchema>;

export const underwritingCommitmentRecordSchema = z.object({
  underwritingCommitmentId: idSchema,
  intermediaryId: text,
  sharesUnderwritten: decimalStringSchema,
  amountUnderwritten: decimalStringSchema,
  percentageOfIssue: decimalStringSchema,
  ownAccount: yesNoNotSureOrEmptySchema,
  subUnderwritingExists: yesNoNotSureOrEmptySchema,
  subUnderwriterDetails: text,
  conditionalObligation: text,
  commitmentStatus: text,
  agreementReference: text,
  devolvementDefaultMechanism: text,
  notes: text,
});
export type UnderwritingCommitmentRecord = z.infer<typeof underwritingCommitmentRecordSchema>;

export const nominatedInvestorRecordSchema = z.object({
  nominatedInvestorId: idSchema,
  applicable: yesNoNotSureOrEmptySchema,
  investorName: text,
  linkedIntermediaryEntityId: text,
  investorTypeStatus: text,
  agreementDate: text,
  underwritingRole: yesNoNotSureOrEmptySchema,
  marketMakingRole: yesNoNotSureOrEmptySchema,
  securitiesCount: decimalStringSchema,
  value: decimalStringSchema,
  exchangePriorApprovalRequired: yesNoNotSureOrEmptySchema,
  approvalRequested: yesNoNotSureOrEmptySchema,
  approvalReceived: yesNoNotSureOrEmptySchema,
  disclosureIncluded: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type NominatedInvestorRecord = z.infer<typeof nominatedInvestorRecordSchema>;

export const marketMakerConfigurationSchema = z.object({
  marketMakerIntermediaryId: text,
  exchange: text,
  registrationReference: text,
  agreementDate: text,
  agreementExecuted: yesNoNotSureOrEmptySchema,
  marketMakingCommencementDate: text,
  mandatoryPeriod: text,
  proposedEndDate: text,
  operationalResponsibilitiesReviewed: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type MarketMakerConfiguration = z.infer<typeof marketMakerConfigurationSchema>;

export const marketMakerReservationSchema = z.object({
  reservedShares: decimalStringSchema,
  reservationAmount: decimalStringSchema,
  percentage: decimalStringSchema,
  issuePrice: decimalStringSchema,
  subscriptionResponsibility: text,
  allocationStatus: text,
  inventoryReadiness: text,
  discrepancyWithIpoSetup: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type MarketMakerReservation = z.infer<typeof marketMakerReservationSchema>;

export const marketMakingArrangementSchema = z.object({
  quoteObligationsReviewed: yesNoNotSureOrEmptySchema,
  inventorySource: text,
  nominatedInvestorArrangement: text,
  settlementArrangement: text,
  fundingReadiness: text,
  exchangeApprovalStatus: text,
  promoterShareRestrictionsReviewed: yesNoNotSureOrEmptySchema,
  operationalContact: text,
  backupContact: text,
  continuityProcess: text,
  agreementDisclosed: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type MarketMakingArrangement = z.infer<typeof marketMakingArrangementSchema>;

export const underwritingMarketMakingAndDistributionArrangementsSchema = z.object({
  underwritingSummary: underwritingSummarySchema,
  underwritingCommitments: z.array(underwritingCommitmentRecordSchema),
  nominatedInvestors: z.array(nominatedInvestorRecordSchema),
  marketMakerConfiguration: marketMakerConfigurationSchema,
  marketMakerReservation: marketMakerReservationSchema,
  marketMakingArrangement: marketMakingArrangementSchema,
});
export type UnderwritingMarketMakingAndDistributionArrangements = z.infer<
  typeof underwritingMarketMakingAndDistributionArrangementsSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 7: Issue Programme, Allotment, Listing & Post-Issue Execution       */
/* -------------------------------------------------------------------------- */

export const issueCalendarSchema = z.object({
  priceBandFixedPriceAnnouncementDate: text,
  preIssueAdvertisementDate: text,
  anchorDate: text,
  issueOpeningDate: text,
  issueClosingDate: text,
  bidRevisionDeadline: text,
  upiMandateDeadline: text,
  basisOfAllotmentTarget: text,
  basisApprovalTarget: text,
  fundTransferTarget: text,
  unblockTarget: text,
  shareCreditTarget: text,
  listingApplicationTarget: text,
  tradingApprovalTarget: text,
  listingTradingDate: text,
});
export type IssueCalendar = z.infer<typeof issueCalendarSchema>;

export const issueOpeningReadinessSchema = z.object({
  rhpProspectusRocFilingReady: yesNoNotSureOrEmptySchema,
  pricingFinalized: yesNoNotSureOrEmptySchema,
  advertisementsReady: yesNoNotSureOrEmptySchema,
  applicationFormsReady: yesNoNotSureOrEmptySchema,
  exchangePlatformReady: yesNoNotSureOrEmptySchema,
  registrarReady: yesNoNotSureOrEmptySchema,
  sponsorBankReady: yesNoNotSureOrEmptySchema,
  bankingInfrastructureReady: yesNoNotSureOrEmptySchema,
  underwritingReady: yesNoNotSureOrEmptySchema,
  marketMakerReady: yesNoNotSureOrEmptySchema,
  consentsCurrent: yesNoNotSureOrEmptySchema,
  certificatesCurrent: yesNoNotSureOrEmptySchema,
  materialDevelopmentsUpdated: yesNoNotSureOrEmptySchema,
  professionalGoLiveConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type IssueOpeningReadiness = z.infer<typeof issueOpeningReadinessSchema>;

export const subscriptionRowRecordSchema = z.object({
  subscriptionId: idSchema,
  category: z.enum(['', ...INVESTOR_CATEGORY_VALUES]),
  sharesOffered: decimalStringSchema,
  applicationCount: text,
  sharesBidApplied: decimalStringSchema,
  bidApplicationAmount: decimalStringSchema,
  validApplicationCount: text,
  validDemand: decimalStringSchema,
  rejectedApplicationCount: text,
  withdrawalCancellationCount: text,
  subscriptionMultiple: decimalStringSchema,
  notes: text,
});
export type SubscriptionRowRecord = z.infer<typeof subscriptionRowRecordSchema>;

export const basisOfAllotmentSchema = z.object({
  registrarReconciliationComplete: yesNoNotSureOrEmptySchema,
  technicalRejectionsFinalized: yesNoNotSureOrEmptySchema,
  basisPrepared: yesNoNotSureOrEmptySchema,
  basisDate: text,
  exchangeApprovalReceived: yesNoNotSureOrEmptySchema,
  approvalDateTime: text,
  allotmentFinalized: yesNoNotSureOrEmptySchema,
  boardCommitteeApproval: text,
  approvalReference: text,
  allotmentDate: text,
});
export type BasisOfAllotment = z.infer<typeof basisOfAllotmentSchema>;

export const allotmentSummaryRecordSchema = z.object({
  allotmentId: idSchema,
  category: z.enum(['', ...INVESTOR_CATEGORY_VALUES]),
  sharesOffered: decimalStringSchema,
  validDemand: decimalStringSchema,
  sharesAllotted: decimalStringSchema,
  numberOfAllottees: text,
  oversubscriptionBasis: text,
  notes: text,
});
export type AllotmentSummaryRecord = z.infer<typeof allotmentSummaryRecordSchema>;

export const fundsUnblockingSchema = z.object({
  debitInstructionsIssued: yesNoNotSureOrEmptySchema,
  sponsorBankInstructionsIssued: yesNoNotSureOrEmptySchema,
  scsbInstructionsStatus: text,
  fundsReceived: yesNoNotSureOrEmptySchema,
  publicIssueAccountCredited: yesNoNotSureOrEmptySchema,
  nonAllotteeUnblockComplete: yesNoNotSureOrEmptySchema,
  partialAllotteeUnblockComplete: yesNoNotSureOrEmptySchema,
  exceptions: text,
  delayedUnblockCases: text,
  investorGrievances: text,
  notes: text,
});
export type FundsUnblocking = z.infer<typeof fundsUnblockingSchema>;

export const dematCreditSchema = z.object({
  corporateActionSubmitted: yesNoNotSureOrEmptySchema,
  nsdlConfirmation: yesNoNotSureOrEmptySchema,
  cdslConfirmation: yesNoNotSureOrEmptySchema,
  sharesCredited: yesNoNotSureOrEmptySchema,
  completionDate: text,
  completionTime: text,
  exceptions: text,
});
export type DematCredit = z.infer<typeof dematCreditSchema>;

export const listingSchema = z.object({
  finalListingApplicationSubmitted: yesNoNotSureOrEmptySchema,
  applicationDateTime: text,
  finalListingChecklistComplete: yesNoNotSureOrEmptySchema,
  exchangeQueries: text,
  tradingApprovalReceived: yesNoNotSureOrEmptySchema,
  tradingNoticeReference: text,
  listingDate: text,
  tradingCommencement: text,
  marketMakingCommenced: yesNoNotSureOrEmptySchema,
  listingCompletionStatus: text,
});
export type Listing = z.infer<typeof listingSchema>;

export const postIssueActionRecordSchema = z.object({
  postIssueActionId: idSchema,
  actionType: z.enum(['', ...POST_ISSUE_ACTION_TYPE_VALUES]),
  applicable: yesNoNotSureOrEmptySchema,
  status: z.enum(['', ...POST_ISSUE_ACTION_STATUS_VALUES]),
  dueDate: text,
  completedDate: text,
  responsibleIntermediaryId: text,
  reference: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type PostIssueActionRecord = z.infer<typeof postIssueActionRecordSchema>;

export const issueProgrammeAllotmentListingAndPostIssueExecutionSchema = z.object({
  issueCalendar: issueCalendarSchema,
  issueOpeningReadiness: issueOpeningReadinessSchema,
  subscriptionRows: z.array(subscriptionRowRecordSchema),
  basisOfAllotment: basisOfAllotmentSchema,
  allotmentSummaries: z.array(allotmentSummaryRecordSchema),
  fundsUnblocking: fundsUnblockingSchema,
  dematCredit: dematCreditSchema,
  listing: listingSchema,
  postIssueActions: z.array(postIssueActionRecordSchema),
});
export type IssueProgrammeAllotmentListingAndPostIssueExecution = z.infer<
  typeof issueProgrammeAllotmentListingAndPostIssueExecutionSchema
>;

/* -------------------------------------------------------------------------- */
/* Section 8: Final Offer Document, Advertisements & Filing Readiness          */
/* -------------------------------------------------------------------------- */

export const offerDocumentVersionRecordSchema = z.object({
  documentVersionId: idSchema,
  type: z.enum(['', ...OFFER_DOCUMENT_FORM_VALUES]),
  date: text,
  versionLabel: text,
  filingStage: z.enum(['', ...FILING_STAGE_VALUES]),
  filedAuthority: z.enum(['', ...FILING_AUTHORITY_VALUES]),
  boardApproved: yesNoNotSureOrEmptySchema,
  signed: yesNoNotSureOrEmptySchema,
  supersedesDocumentVersionId: text,
  currentAuthoritativeVersion: yesNoNotSureOrEmptySchema,
  pageCount: text,
  openPlaceholderCount: text,
  openCommentCount: text,
  chapterSignOffCompletionStatus: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type OfferDocumentVersionRecord = z.infer<typeof offerDocumentVersionRecordSchema>;

export const placeholderRecordSchema = z.object({
  placeholderId: idSchema,
  documentVersionId: text,
  placeholderType: z.enum(['', ...PLACEHOLDER_TYPE_VALUES]),
  chapterSection: text,
  description: text,
  responsibleOwner: text,
  sourceWorkstream: text,
  linkedSourceRecord: text,
  targetResolution: text,
  status: z.enum(['', ...PLACEHOLDER_STATUS_VALUES]),
  notes: text,
});
export type PlaceholderRecord = z.infer<typeof placeholderRecordSchema>;

export const inspectionItemRecordSchema = z.object({
  inspectionItemId: idSchema,
  itemType: z.enum(['', ...INSPECTION_ITEM_TYPE_VALUES]),
  title: text,
  sourceWorkstream: text,
  linkedSourceRecordId: text,
  date: text,
  parties: text,
  currentVersion: text,
  executedFinal: yesNoNotSureOrEmptySchema,
  inclusionStatus: z.enum(['', ...INSPECTION_INCLUSION_STATUS_VALUES]),
  inclusionRationale: text,
  exclusionRationale: text,
  available: yesNoNotSureOrEmptySchema,
  format: z.enum(['', ...INSPECTION_FORMAT_VALUES]),
  inspectionLocation: text,
  inspectionHours: text,
  inspectionStartDate: text,
  inspectionEndDate: text,
  websiteAvailability: yesNoNotSureOrEmptySchema,
  confidentialityConcern: yesNoNotSureOrEmptySchema,
  redactionRequired: yesNoNotSureOrEmptySchema,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type InspectionItemRecord = z.infer<typeof inspectionItemRecordSchema>;

export const issueAgreementRecordSchema = z.object({
  issueAgreementId: idSchema,
  type: z.enum(['', ...ISSUE_AGREEMENT_TYPE_VALUES]),
  linkedIntermediaryIds: z.array(text),
  agreementDate: text,
  status: z.enum(['', ...ISSUE_AGREEMENT_STATUS_VALUES]),
  currentVersion: text,
  filingInspectionRelevance: text,
  professionalReview: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
  notes: text,
});
export type IssueAgreementRecord = z.infer<typeof issueAgreementRecordSchema>;

export const publicCommunicationRecordSchema = z.object({
  communicationId: idSchema,
  type: z.enum(['', ...PUBLIC_COMMUNICATION_TYPE_VALUES]),
  draftDate: text,
  approvalDate: text,
  publicationDate: text,
  publicationChannelsNewspapers: text,
  englishPublication: yesNoNotSureOrEmptySchema,
  hindiPublication: yesNoNotSureOrEmptySchema,
  regionalLanguagePublication: yesNoNotSureOrEmptySchema,
  linkedDocumentVersionId: text,
  leadManagerApproval: yesNoNotSureOrEmptySchema,
  legalApproval: yesNoNotSureOrEmptySchema,
  filedSubmittedWhereRequired: yesNoNotSureOrEmptySchema,
  finalCopyAvailable: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type PublicCommunicationRecord = z.infer<typeof publicCommunicationRecordSchema>;

export const audiovisualPresentationSchema = z.object({
  applicability: z.enum(['', ...AV_APPLICABILITY_VALUES]),
  englishAvReady: yesNoNotSureOrEmptySchema,
  hindiAvReady: yesNoNotSureOrEmptySchema,
  contentApproved: yesNoNotSureOrEmptySchema,
  linkedOfferDocumentVersionId: text,
  published: yesNoNotSureOrEmptySchema,
  publicationPlatformReference: text,
  leadManagerApproval: yesNoNotSureOrEmptySchema,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type AudiovisualPresentation = z.infer<typeof audiovisualPresentationSchema>;

export const merchantBankerDdRepositoryReadinessSchema = z.object({
  repositoryRequirementReviewed: yesNoNotSureOrEmptySchema,
  responsibleLeadManagerIntermediaryId: text,
  uploadProcessStarted: yesNoNotSureOrEmptySchema,
  companyIncorporationDocsComplete: yesNoNotSureOrEmptySchema,
  capitalDocsComplete: yesNoNotSureOrEmptySchema,
  financialDocsComplete: yesNoNotSureOrEmptySchema,
  businessDocsComplete: yesNoNotSureOrEmptySchema,
  legalDocsComplete: yesNoNotSureOrEmptySchema,
  otherRequiredDdSetsComplete: yesNoNotSureOrEmptySchema,
  uploadComplete: yesNoNotSureOrEmptySchema,
  completionDate: text,
  missingRepositoryItems: text,
  professionalConfirmation: z.enum(['', ...PROFESSIONAL_CONFIRMATION_STATUS_VALUES]),
});
export type MerchantBankerDdRepositoryReadiness = z.infer<
  typeof merchantBankerDdRepositoryReadinessSchema
>;

export const ifFinalConfirmationsSchema = z.object({
  leadManagerAppointedCurrent: yesNoNotSureOrEmptySchema,
  registrarAppointedCurrent: yesNoNotSureOrEmptySchema,
  legalCounselAppointedCurrent: yesNoNotSureOrEmptySchema,
  auditorsCertifyingProfessionalsEngaged: yesNoNotSureOrEmptySchema,
  applicableIntermediaryRegistrationsReviewed: yesNoNotSureOrEmptySchema,
  interSeResponsibilitiesDocumentedWhereNeeded: yesNoNotSureOrEmptySchema,
  issueBankingArrangementsReady: yesNoNotSureOrEmptySchema,
  sponsorBankReady: yesNoNotSureOrEmptySchema,
  depositoryArrangementsReady: yesNoNotSureOrEmptySchema,
  isinReady: yesNoNotSureOrEmptySchema,
  underwritingArrangementComplete: yesNoNotSureOrEmptySchema,
  applicableSmeUnderwritingCoverageReviewed: yesNoNotSureOrEmptySchema,
  merchantBankerOwnAccountRequirementReviewed: yesNoNotSureOrEmptySchema,
  marketMakerAppointed: yesNoNotSureOrEmptySchema,
  marketMakingAgreementExecuted: yesNoNotSureOrEmptySchema,
  applicableMarketMakingPeriodAddressed: yesNoNotSureOrEmptySchema,
  nominatedInvestorArrangementsDisclosedWhereApplicable: yesNoNotSureOrEmptySchema,
  exchangeFilingChecklistComplete: yesNoNotSureOrEmptySchema,
  openExchangeQueriesAccuratelyShown: yesNoNotSureOrEmptySchema,
  inPrincipleApprovalStatusAccuratelyShown: yesNoNotSureOrEmptySchema,
  sebiSmeFilingStatusAccuratelyShown: yesNoNotSureOrEmptySchema,
  ddCertificatesCurrent: yesNoNotSureOrEmptySchema,
  applicableProfessionalCertificatesCurrent: yesNoNotSureOrEmptySchema,
  intermediaryExpertConsentsCurrent: yesNoNotSureOrEmptySchema,
  rocFilingReadinessReviewed: yesNoNotSureOrEmptySchema,
  issueStructureReconcilesWithIpoSetup: yesNoNotSureOrEmptySchema,
  capitalStructureReconcilesWithCapital: yesNoNotSureOrEmptySchema,
  objectsReconcile: yesNoNotSureOrEmptySchema,
  financialsReconcile: yesNoNotSureOrEmptySchema,
  managementDataReconcile: yesNoNotSureOrEmptySchema,
  groupEntitiesReconcile: yesNoNotSureOrEmptySchema,
  bacMattersReconcile: yesNoNotSureOrEmptySchema,
  lacUpdatedThroughFilingCutOff: yesNoNotSureOrEmptySchema,
  materialDevelopmentsReviewed: yesNoNotSureOrEmptySchema,
  finalInspectionListReviewed: yesNoNotSureOrEmptySchema,
  applicableIssueAgreementsExecutedCurrent: yesNoNotSureOrEmptySchema,
  publicCommunicationsReadinessReviewed: yesNoNotSureOrEmptySchema,
  applicableT3ExecutionPlanReviewed: yesNoNotSureOrEmptySchema,
  unresolvedPlaceholdersAccuratelyShown: yesNoNotSureOrEmptySchema,
  noCriticalFilingItemIntentionallyOmitted: yesNoNotSureOrEmptySchema,
  finalProfessionalLeadManagerLegalAuditorReviewRemainsRequired: yesNoNotSureOrEmptySchema,
});
export type IfFinalConfirmations = z.infer<typeof ifFinalConfirmationsSchema>;

export const finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadinessSchema =
  z.object({
    offerDocumentVersions: z.array(offerDocumentVersionRecordSchema),
    placeholders: z.array(placeholderRecordSchema),
    inspectionItems: z.array(inspectionItemRecordSchema),
    issueAgreements: z.array(issueAgreementRecordSchema),
    publicCommunications: z.array(publicCommunicationRecordSchema),
    audiovisualPresentation: audiovisualPresentationSchema,
    merchantBankerDdRepositoryReadiness: merchantBankerDdRepositoryReadinessSchema,
    finalConfirmations: ifFinalConfirmationsSchema,
  });
export type FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness = z.infer<
  typeof finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* Root payload                                                                */
/* -------------------------------------------------------------------------- */

export const IF_SECTION_IDS = [
  'issue-team-and-intermediary-master',
  'issue-configuration-and-filing-snapshot',
  'filing-and-regulatory-milestone-tracker',
  'due-diligence-certificates-consents-and-signoffs',
  'depositories-banking-asba-upi-and-issue-infrastructure',
  'underwriting-market-making-and-distribution-arrangements',
  'issue-programme-allotment-listing-and-post-issue-execution',
  'final-offer-document-advertisements-material-documents-and-filing-readiness',
] as const;

export type IntermediariesFilingSectionId = (typeof IF_SECTION_IDS)[number];

export const sectionIdSchema = z.enum(IF_SECTION_IDS);

export const intermediariesFilingPayloadSchema = z.object({
  schemaVersion: z.literal(INTERMEDIARIES_FILING_SCHEMA_VERSION),
  issueTeamAndIntermediaryMaster: issueTeamAndIntermediaryMasterSchema,
  issueConfigurationAndFilingSnapshot: issueConfigurationAndFilingSnapshotSchema,
  filingAndRegulatoryMilestoneTracker: filingAndRegulatoryMilestoneTrackerSchema,
  dueDiligenceCertificatesConsentsAndSignoffs:
    dueDiligenceCertificatesConsentsAndSignoffsSchema,
  depositoriesBankingAsbaUpiAndIssueInfrastructure:
    depositoriesBankingAsbaUpiAndIssueInfrastructureSchema,
  underwritingMarketMakingAndDistributionArrangements:
    underwritingMarketMakingAndDistributionArrangementsSchema,
  issueProgrammeAllotmentListingAndPostIssueExecution:
    issueProgrammeAllotmentListingAndPostIssueExecutionSchema,
  finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness:
    finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadinessSchema,
});

export type IntermediariesFilingPayload = z.infer<typeof intermediariesFilingPayloadSchema>;
