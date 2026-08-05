/**
 * Canonical IPO Setup & Eligibility payload schema (Increment I1).
 *
 * Increment I2 backend contract:
 * - Persist `IpoSetupPayload` (`schemaVersion: 1`) exactly — same keys, enums, nullability.
 * - Amounts are stored in rupees (number | null). `offerStructure.amountDisplayUnit` is a
 *   display preference (lakh | crore), not a regulatory field.
 * - Ternary answers use '' | 'yes' | 'no' | 'not-sure'. Empty must never be coerced to 'no'.
 * - `ipoDirection.referencedCompanyClass` is read-only mirror from Company & Incorporation;
 *   do not write it back to C&I.
 * - Computed offer metrics and assessment results are derived client/server-side — do not
 *   require them in the persisted body unless I2 explicitly decides to snapshot them.
 * - Do not embed UI-only labels inside persisted data.
 */

import { z } from 'zod';

export const IPO_SETUP_SCHEMA_VERSION = 1 as const;

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not-sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];

/** Unanswered ternary — never coerce empty to "no". */
export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);

export const PREPARATION_STAGE_VALUES = [
  'exploring-ipo',
  'preparing-internally',
  'advisers-being-appointed',
  'preparing-draft-offer-document',
  'preparing-exchange-application',
  'application-filed',
] as const;

export const TARGET_SME_PLATFORM_VALUES = ['nse-emerge', 'bse-sme', 'undecided'] as const;

export const ELIGIBILITY_PROFILE_VALUES = [
  'standard-sme-ipo',
  'nse-technology-startup-route',
  'undecided',
] as const;

export const PROPOSED_OFFER_TYPE_VALUES = [
  'fresh-issue',
  'offer-for-sale',
  'fresh-and-ofs',
  'undecided',
] as const;

export const PRICING_METHOD_VALUES = [
  'fixed-price',
  'book-built',
  'undecided',
] as const;

export const PUBLIC_CONVERSION_STATUS_VALUES = [
  'not-started',
  'in-progress',
  'completed',
  'professional-confirmation-required',
] as const;

export const ISSUE_PRICE_STATUS_VALUES = [
  'not-determined',
  'indicative',
  'finalised-internally',
  'to-be-determined-book-building',
] as const;

export const TRACK_RECORD_BASIS_VALUES = [
  'issuer-company',
  'promoter-promoting-company',
  'predecessor-proprietorship',
  'predecessor-partnership-llp',
  'combination',
  'not-yet-established',
] as const;

export const FINANCIAL_SOURCE_TYPE_VALUES = [
  'audited-financial-statements',
  'auditor-certificate',
  'management-estimate',
  'not-yet-available',
] as const;

export const AUDITED_STATUS_VALUES = [
  'audited',
  'unaudited',
  'not-available',
] as const;

export const APPROVAL_STATUS_VALUES = [
  'not-started',
  'draft-prepared',
  'passed',
] as const;

export const SHAREHOLDER_APPROVAL_STATUS_VALUES = [
  'not-started',
  'notice-issued',
  'passed',
] as const;

export const APPOINTMENT_STATUS_VALUES = [
  'not-started',
  'discussions-ongoing',
  'appointed',
  'not-applicable',
  'not-sure',
] as const;

export const CONNECTIVITY_STATUS_VALUES = [
  'not-started',
  'in-progress',
  'completed',
  'not-applicable',
  'not-sure',
] as const;

export const IN_PRINCIPLE_STATUS_VALUES = [
  'not-started',
  'drafting',
  'filed',
  'clarifications-pending',
  'approved',
  'not-applicable',
  'not-sure',
] as const;

export const AMOUNT_UNIT_VALUES = ['lakh', 'crore'] as const;

const emptyOrString = z.string();
const optionalNumber = z.union([z.number(), z.null()]);

export const declarationDetailSchema = z.object({
  id: z.string().min(1),
  personOrEntityInvolved: z.string(),
  authorityOrForum: z.string(),
  date: z.string(),
  currentStatus: z.string(),
  explanation: z.string(),
});

export type DeclarationDetail = z.infer<typeof declarationDetailSchema>;

export const financialYearRowSchema = z.object({
  id: z.string().min(1),
  financialYearEnding: z.string(),
  operatingProfitFromOperations: optionalNumber,
  netWorth: optionalNumber,
  freeCashFlowToEquity: optionalNumber,
  auditedStatus: z.enum(['', ...AUDITED_STATUS_VALUES]),
  sourceType: z.enum(['', ...FINANCIAL_SOURCE_TYPE_VALUES]),
});

export type FinancialYearRow = z.infer<typeof financialYearRowSchema>;

export const ipoDirectionSchema = z.object({
  preparationStage: z.enum(['', ...PREPARATION_STAGE_VALUES]),
  targetSmePlatform: z.enum(['', ...TARGET_SME_PLATFORM_VALUES]),
  eligibilityProfile: z.enum(['', ...ELIGIBILITY_PROFILE_VALUES]),
  proposedOfferType: z.enum(['', ...PROPOSED_OFFER_TYPE_VALUES]),
  proposedPricingMethod: z.enum(['', ...PRICING_METHOD_VALUES]),
  targetFilingQuarter: z.string(),
  targetFilingFinancialYear: z.string(),
  tentativeFilingDate: z.string(),
  targetListingPeriod: z.string(),
  /** Display-only reference from C&I — never authoritative write-back. */
  referencedCompanyClass: z.string(),
  publicCompanyConversionStatus: z.enum(['', ...PUBLIC_CONVERSION_STATUS_VALUES]),
  proposedConversionDate: z.string(),
  actualConversionDate: z.string(),
  newLegalNameAfterConversion: z.string(),
  conversionSrnOrReference: z.string(),
  freshCertificateOfIncorporationAvailable: yesNoNotSureOrEmptySchema,
});

export const offerStructureSchema = z.object({
  /** UI preference for entering amounts; not a regulatory field. */
  amountDisplayUnit: z.enum(AMOUNT_UNIT_VALUES),
  faceValuePerEquityShare: optionalNumber,
  existingIssuedEquityShares: optionalNumber,
  existingPaidUpEquityShareCapital: optionalNumber,
  proposedIssuePriceStatus: z.enum(['', ...ISSUE_PRICE_STATUS_VALUES]),
  proposedIssuePrice: optionalNumber,
  proposedFreshIssueShares: optionalNumber,
  proposedFreshIssueAmount: optionalNumber,
  preIpoPlacementBeingConsidered: yesNoNotSureOrEmptySchema,
  proposedPreIpoPlacementAmount: optionalNumber,
  proposedOfsShares: optionalNumber,
  proposedOfsAmount: optionalNumber,
  numberOfSellingShareholders: optionalNumber,
  sellerConsentsObtained: yesNoNotSureOrEmptySchema,
  employeeReservationPlanned: yesNoNotSureOrEmptySchema,
  existingShareholderReservationPlanned: yesNoNotSureOrEmptySchema,
  marketMakerReservationStatus: z.string(),
  otherReservationNotes: z.string(),
});

export const trackRecordAndFinancialEligibilitySchema = z.object({
  operatingTrackRecordBasis: z.enum(['', ...TRACK_RECORD_BASIS_VALUES]),
  trackRecordEntityName: z.string(),
  natureOfEntity: z.string(),
  sameLineOfBusiness: yesNoNotSureOrEmptySchema,
  businessCommencementDate: z.string(),
  conversionOrSuccessionDate: z.string(),
  relationshipToIssuer: z.string(),
  threeCompleteFinancialYearsAvailable: yesNoNotSureOrEmptySchema,
  auditedRecordsAvailable: yesNoNotSureOrEmptySchema,
  continuityExplanation: z.string(),
  financialYears: z.array(financialYearRowSchema),
  latestAuditedFinancialYear: z.string(),
  latestFinancialStatementsAvailable: yesNoNotSureOrEmptySchema,
  stubPeriodFinancialsAvailable: yesNoNotSureOrEmptySchema,
  auditorHasConfirmedEligibilityFigures: yesNoNotSureOrEmptySchema,
  modifiedAuditOpinionRelevantToEligibility: yesNoNotSureOrEmptySchema,
  modifiedAuditOpinionExplanation: z.string(),
});

export const eligibilityDeclarationsSchema = z.object({
  admittedIbcAgainstIssuer: yesNoNotSureOrEmptySchema,
  admittedIbcAgainstIssuerDetails: z.array(declarationDetailSchema),
  admittedIbcAgainstPromotingCompany: yesNoNotSureOrEmptySchema,
  admittedIbcAgainstPromotingCompanyDetails: z.array(declarationDetailSchema),
  admittedWindingUpPetition: yesNoNotSureOrEmptySchema,
  admittedWindingUpPetitionDetails: z.array(declarationDetailSchema),
  issuerDebarredFromCapitalMarkets: yesNoNotSureOrEmptySchema,
  issuerDebarredFromCapitalMarketsDetails: z.array(declarationDetailSchema),
  promoterDirectorSellingShareholderDebarred: yesNoNotSureOrEmptySchema,
  promoterDirectorSellingShareholderDebarredDetails: z.array(declarationDetailSchema),
  promoterDirectorAssociatedWithDebarredCompany: yesNoNotSureOrEmptySchema,
  promoterDirectorAssociatedWithDebarredCompanyDetails: z.array(declarationDetailSchema),
  wilfulDefaulterOrFraudulentBorrower: yesNoNotSureOrEmptySchema,
  wilfulDefaulterOrFraudulentBorrowerDetails: z.array(declarationDetailSchema),
  fugitiveEconomicOffender: yesNoNotSureOrEmptySchema,
  fugitiveEconomicOffenderDetails: z.array(declarationDetailSchema),
  materialRegulatoryOrDisciplinaryAction: yesNoNotSureOrEmptySchema,
  materialRegulatoryOrDisciplinaryActionDetails: z.array(declarationDetailSchema),
  seriousCriminalProceedingsInvolvingDirector: yesNoNotSureOrEmptySchema,
  seriousCriminalProceedingsInvolvingDirectorDetails: z.array(declarationDetailSchema),
  materialFinancialDefaultDuringRelevantPeriod: yesNoNotSureOrEmptySchema,
  materialFinancialDefaultDuringRelevantPeriodDetails: z.array(declarationDetailSchema),
  materialUnresolvedEligibilityLitigation: yesNoNotSureOrEmptySchema,
  materialUnresolvedEligibilityLitigationDetails: z.array(declarationDetailSchema),
  proceedsIncludeRelatedPartyLoanRepayment: yesNoNotSureOrEmptySchema,
  proceedsIncludeRelatedPartyLoanRepaymentDetails: z.array(declarationDetailSchema),
});

export const processReadinessSchema = z.object({
  boardApprovalStatus: z.enum(['', ...APPROVAL_STATUS_VALUES]),
  boardResolutionDate: z.string(),
  boardResolutionReference: z.string(),
  shareholderApprovalStatus: z.enum(['', ...SHAREHOLDER_APPROVAL_STATUS_VALUES]),
  shareholderResolutionDate: z.string(),
  shareholderResolutionReference: z.string(),
  existingSharesFullyDematerialised: yesNoNotSureOrEmptySchema,
  isinAllotted: yesNoNotSureOrEmptySchema,
  nsdlConnectivityStatus: z.enum(['', ...CONNECTIVITY_STATUS_VALUES]),
  cdslConnectivityStatus: z.enum(['', ...CONNECTIVITY_STATUS_VALUES]),
  rtaArrangementsInitiated: yesNoNotSureOrEmptySchema,
  leadManagerAppointmentStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  registrarAppointmentStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  marketMakerAppointmentStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  underwriterAppointmentStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  legalAdviserAppointmentStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  statutoryAuditorCoordinationStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  inPrincipleApplicationStatus: z.enum(['', ...IN_PRINCIPLE_STATUS_VALUES]),
  inPrincipleApplicationDate: z.string(),
  inPrincipleApplicationReference: z.string(),
  clarificationsReceived: yesNoNotSureOrEmptySchema,
  inPrincipleApprovalReceived: yesNoNotSureOrEmptySchema,
  inPrincipleApprovalDate: z.string(),
  inPrincipleApprovalReference: z.string(),
});

export const issuerConfirmationsSchema = z.object({
  offerInputsAreLatestInternalProposal: z.boolean(),
  financialFiguresTraceableToSelectedSource: z.boolean(),
  knownEligibilityConcernsDisclosed: z.boolean(),
  missingAnswersMustNotBeInterpretedAsNegative: z.boolean(),
  proposedOfsIncludesAllIntendedSellingShareholders: z.boolean(),
  assessmentIsPreliminary: z.boolean(),
  professionalAndExchangeConfirmationRemainRequired: z.boolean(),
});

export const ipoSetupPayloadSchema = z.object({
  schemaVersion: z.literal(IPO_SETUP_SCHEMA_VERSION),
  ipoDirection: ipoDirectionSchema,
  offerStructure: offerStructureSchema,
  trackRecordAndFinancialEligibility: trackRecordAndFinancialEligibilitySchema,
  eligibilityDeclarations: eligibilityDeclarationsSchema,
  processReadiness: processReadinessSchema,
  issuerConfirmations: issuerConfirmationsSchema,
});

export type IpoDirection = z.infer<typeof ipoDirectionSchema>;
export type OfferStructure = z.infer<typeof offerStructureSchema>;
export type TrackRecordAndFinancialEligibility = z.infer<
  typeof trackRecordAndFinancialEligibilitySchema
>;
export type EligibilityDeclarations = z.infer<typeof eligibilityDeclarationsSchema>;
export type ProcessReadiness = z.infer<typeof processReadinessSchema>;
export type IssuerConfirmations = z.infer<typeof issuerConfirmationsSchema>;
export type IpoSetupPayload = z.infer<typeof ipoSetupPayloadSchema>;

export type IpoSetupSectionId =
  | 'ipo-direction'
  | 'offer-structure'
  | 'track-record-financial'
  | 'eligibility-declarations'
  | 'process-readiness'
  | 'issuer-confirmations';

export const IPO_SETUP_SECTION_IDS: IpoSetupSectionId[] = [
  'ipo-direction',
  'offer-structure',
  'track-record-financial',
  'eligibility-declarations',
  'process-readiness',
  'issuer-confirmations',
];
