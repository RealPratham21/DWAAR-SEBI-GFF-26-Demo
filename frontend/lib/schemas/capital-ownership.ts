/**
 * Canonical Capital & Ownership payload schema (Increment C1).
 *
 * Contract notes for the backend increment that follows:
 * - Persist `CapitalOwnershipPayload` (`schemaVersion: 1`) exactly — same keys, enums, emptiness.
 * - Every monetary amount, share quantity, ratio and percentage is a Decimal-safe STRING.
 *   Empty is `''` (never `null`, never `0`). Values are plain decimal strings such as
 *   `'1000000'` or `'12.50'` — never JavaScript numbers, so no float drift on round-trip.
 * - Money is always stored in RUPEES. `currentCapitalStructure.amountDisplayUnit`
 *   (`rupees | lakh | crore`) is a display preference only, not a regulatory field.
 * - Ternary answers use `'' | 'yes' | 'no' | 'not_sure'`. Empty must never be coerced to `'no'`.
 * - Computed values (totals, cap table percentages, pre/post-issue views, dilution,
 *   reconciliation results, assessment outcomes) are DERIVED and are never persisted here.
 * - Repeatable records carry stable `id`s generated with `crypto.randomUUID()`.
 * - `preAndPostIssueOwnership` stores only user-editable overlays; the pre/post cap table is
 *   computed from shareholders + overlays + the IPO Setup reference.
 */

import { z } from 'zod';

export const CAPITAL_OWNERSHIP_SCHEMA_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];

/** Unanswered ternary — never coerce empty to "no". */
export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

/**
 * Decimal-safe string. `''` means "not provided". Otherwise a plain decimal string.
 * Validation is intentionally permissive so partially typed input can still be saved;
 * `lib/capital-ownership/decimal.ts` owns normalisation and arithmetic.
 */
export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const CAPITAL_AMOUNT_UNIT_VALUES = ['rupees', 'lakh', 'crore'] as const;
export type CapitalAmountUnit = (typeof CAPITAL_AMOUNT_UNIT_VALUES)[number];

export const DEMAT_STATUS_VALUES = [
  'fully-dematerialised',
  'partly-dematerialised',
  'fully-physical',
  'unknown',
] as const;

export const DEPOSITORY_CONNECTIVITY_VALUES = ['nsdl', 'cdsl', 'both', 'none', 'unknown'] as const;

export const SECURITY_TYPE_VALUES = [
  'equity',
  'preference',
  'convertible-instrument',
  'warrant',
  'debenture',
  'other',
] as const;

export const EQUITY_CLASS_TYPE_VALUES = [
  'ordinary-equity',
  'equity-with-differential-voting-rights',
  'equity-with-superior-voting-rights',
  'partly-paid-equity',
  'other',
] as const;

export const PREFERENCE_CLASS_TYPE_VALUES = [
  'cumulative-redeemable',
  'non-cumulative-redeemable',
  'cumulative-convertible',
  'non-cumulative-convertible',
  'compulsorily-convertible',
  'optionally-convertible',
  'other',
] as const;

export const CAPITAL_EVENT_TYPE_VALUES = [
  'incorporation-initial-subscription',
  'further-allotment-cash',
  'rights-issue',
  'bonus-issue',
  'preferential-allotment',
  'private-placement',
  'esop-allotment',
  'sweat-equity-allotment',
  'conversion-of-securities',
  'conversion-of-loan',
  'scheme-of-arrangement',
  'share-split-subdivision',
  'share-consolidation',
  'buyback',
  'capital-reduction',
  'forfeiture-of-shares',
  'redemption-of-preference-shares',
  'cancellation-of-shares',
  'increase-in-authorised-capital',
  'other',
] as const;
export type CapitalEventType = (typeof CAPITAL_EVENT_TYPE_VALUES)[number];

export const CONSIDERATION_TYPE_VALUES = [
  'cash',
  'other-than-cash',
  'part-cash-part-other',
  'bonus-capitalisation',
  'conversion',
  'scheme-of-arrangement',
  'nil-consideration',
  'unknown',
] as const;

export const RESOLUTION_TYPE_VALUES = [
  'board-resolution',
  'shareholder-ordinary-resolution',
  'shareholder-special-resolution',
  'nclt-order',
  'court-order',
  'not-applicable',
  'unknown',
] as const;

export const HOLDER_TYPE_VALUES = [
  'individual',
  'hindu-undivided-family',
  'body-corporate',
  'limited-liability-partnership',
  'partnership-firm',
  'trust',
  'bank',
  'financial-institution',
  'insurance-company',
  'mutual-fund',
  'alternative-investment-fund',
  'venture-capital-fund',
  'foreign-venture-capital-investor',
  'foreign-portfolio-investor',
  'foreign-company',
  'non-resident-indian',
  'employee',
  'employee-welfare-trust',
  'government-or-government-body',
  'other',
] as const;
export type HolderType = (typeof HOLDER_TYPE_VALUES)[number];

export const RESIDENTIAL_STATUS_VALUES = [
  'resident',
  'non-resident-indian',
  'foreign-national',
  'foreign-entity',
  'unknown',
] as const;

export const SHAREHOLDER_CATEGORY_VALUES = [
  'promoter',
  'promoter-group',
  'public',
  'employee',
  'institutional-investor',
  'body-corporate',
  'other',
] as const;
export type ShareholderCategory = (typeof SHAREHOLDER_CATEGORY_VALUES)[number];

export const ACQUISITION_MODE_VALUES = [
  'subscription-to-memorandum',
  'cash-subscription-allotment',
  'rights-issue',
  'bonus-issue',
  'preferential-allotment',
  'private-placement',
  'secondary-purchase',
  'gift',
  'transmission',
  'scheme-of-arrangement',
  'conversion-of-securities',
  'esop-exercise',
  'sweat-equity',
  'other-than-cash',
  'other',
] as const;

export const IDENTIFIER_TYPE_VALUES = [
  'pan',
  'cin',
  'llpin',
  'passport',
  'foreign-registration-number',
  'other',
] as const;

export const BENEFICIAL_INTEREST_NATURE_VALUES = [
  'shares',
  'voting-rights',
  'right-to-distributions',
  'significant-influence-or-control',
  'other',
] as const;

export const PROMOTER_TYPE_VALUES = [
  'individual',
  'body-corporate',
  'hindu-undivided-family',
  'partnership-firm',
  'limited-liability-partnership',
  'trust',
  'other',
] as const;

export const PROMOTER_STATUS_BASIS_VALUES = [
  'shareholding',
  'control-over-affairs',
  'named-in-offer-document',
  'board-representation',
  'shareholders-agreement-rights',
  'management-control',
  'other',
] as const;

export const PROMOTER_GROUP_RELATIONSHIP_VALUES = [
  'spouse',
  'father',
  'mother',
  'brother',
  'sister',
  'son',
  'daughter',
  'spouse-father',
  'spouse-mother',
  'spouse-brother',
  'spouse-sister',
  'hindu-undivided-family-member',
  'body-corporate-controlled-by-promoter',
  'body-corporate-in-which-promoter-holds-twenty-percent',
  'body-corporate-holding-twenty-percent-in-promoter',
  'firm-in-which-promoter-is-partner',
  'llp-in-which-promoter-is-partner',
  'trust-with-promoter-as-trustee-or-beneficiary',
  'other',
] as const;

export const PROMOTER_GROUP_BASIS_VALUES = [
  'immediate-relative',
  'shareholding-threshold',
  'common-control',
  'hindu-undivided-family',
  'firm-or-llp',
  'trust',
  'other',
] as const;

export const CONTROL_ARRANGEMENT_TYPE_VALUES = [
  'shareholders-agreement',
  'voting-agreement',
  'share-subscription-agreement',
  'joint-venture-agreement',
  'articles-of-association-special-rights',
  'board-nomination-right',
  'affirmative-vote-rights',
  'veto-rights',
  'put-or-call-option',
  'right-of-first-refusal',
  'tag-along-right',
  'drag-along-right',
  'anti-dilution-right',
  'share-pledge-with-voting-rights',
  'power-of-attorney',
  'family-arrangement',
  'management-agreement',
  'other',
] as const;

export const LOCK_IN_PERIOD_VALUES = [
  'three-years',
  'eighteen-months',
  'one-year',
  'six-months',
  'not-applicable',
] as const;

export const CONTRIBUTION_ACQUISITION_MODE_VALUES = [
  'cash-subscription',
  'cash-purchase',
  'bonus-out-of-free-reserves',
  'bonus-out-of-revaluation-reserves',
  'conversion-of-convertible-security',
  'consideration-other-than-cash',
  'gift',
  'transmission',
  'scheme-of-arrangement',
  'esop-exercise',
  'other',
] as const;

export const ENCUMBRANCE_TYPE_VALUES = [
  'pledge',
  'lien',
  'non-disposal-undertaking',
  'negative-lien',
  'mortgage',
  'charge',
  'option-arrangement',
  'other',
] as const;

export const OUTSTANDING_INSTRUMENT_TYPE_VALUES = [
  'employee-stock-option-scheme',
  'employee-stock-purchase-scheme',
  'sweat-equity',
  'compulsorily-convertible-preference-shares',
  'optionally-convertible-preference-shares',
  'compulsorily-convertible-debentures',
  'optionally-convertible-debentures',
  'warrants',
  'convertible-loan',
  'share-purchase-option',
  'right-to-subscribe',
  'other',
] as const;

export const INSTRUMENT_HOLDER_CATEGORY_VALUES = [
  'promoter',
  'promoter-group',
  'directors',
  'key-managerial-personnel',
  'employees',
  'investors',
  'lenders',
  'other',
] as const;

export const TRANSACTION_TYPE_VALUES = [
  'primary-allotment',
  'secondary-transfer',
  'gift',
  'transmission',
  'buyback',
  'pledge-invocation',
  'conversion',
  'esop-exercise',
  'capital-reduction',
  'other',
] as const;

/* -------------------------------------------------------------------------- */
/* 1. Current capital structure                                                */
/* -------------------------------------------------------------------------- */

export const equityShareClassSchema = z.object({
  id: idSchema,
  className: text,
  /** Rights classification — maps Ordinary / Differential / Other for the UI. */
  classType: z.enum(['', ...EQUITY_CLASS_TYPE_VALUES]),
  faceValuePerShare: decimalStringSchema,
  votingRightsPerShare: decimalStringSchema,
  authorisedShares: decimalStringSchema,
  issuedShares: decimalStringSchema,
  subscribedShares: decimalStringSchema,
  paidUpShares: decimalStringSchema,
  partlyPaidShares: decimalStringSchema,
  amountPaidUpPerPartlyPaidShare: decimalStringSchema,
  sharePremiumBalance: decimalStringSchema,
  callsUnpaidAmount: decimalStringSchema,
  sharesForfeited: decimalStringSchema,
  isin: text,
  dematStatus: z.enum(['', ...DEMAT_STATUS_VALUES]),
  sharesInDematerialisedForm: decimalStringSchema,
  rightsAndRestrictions: text,
  notes: text,
});
export type EquityShareClass = z.infer<typeof equityShareClassSchema>;

export const preferenceShareClassSchema = z.object({
  id: idSchema,
  className: text,
  classType: z.enum(['', ...PREFERENCE_CLASS_TYPE_VALUES]),
  faceValuePerShare: decimalStringSchema,
  authorisedShares: decimalStringSchema,
  issuedShares: decimalStringSchema,
  paidUpShares: decimalStringSchema,
  dividendRatePercentage: decimalStringSchema,
  isCumulative: yesNoNotSureOrEmptySchema,
  isParticipating: yesNoNotSureOrEmptySchema,
  isConvertible: yesNoNotSureOrEmptySchema,
  conversionTerms: text,
  potentialEquitySharesOnConversion: decimalStringSchema,
  isRedeemable: yesNoNotSureOrEmptySchema,
  redemptionDate: text,
  redemptionAmount: decimalStringSchema,
  carriesVotingRights: yesNoNotSureOrEmptySchema,
  votingRightsDescription: text,
  isin: text,
  notes: text,
});
export type PreferenceShareClass = z.infer<typeof preferenceShareClassSchema>;

export const currentCapitalStructureSchema = z.object({
  /** UI preference for entering amounts; payload always stores rupees. */
  amountDisplayUnit: z.enum(CAPITAL_AMOUNT_UNIT_VALUES),
  asOnDate: text,
  equityClasses: z.array(equityShareClassSchema),
  /** Explicit preference-share presence — unanswered is never treated as No. */
  hasPreferenceShares: yesNoNotSureOrEmptySchema,
  preferenceClasses: z.array(preferenceShareClassSchema),
  authorisedEquityShareCapital: decimalStringSchema,
  authorisedPreferenceShareCapital: decimalStringSchema,
  totalAuthorisedShareCapitalAsPerMoa: decimalStringSchema,
  issuedEquityShareCapital: decimalStringSchema,
  subscribedEquityShareCapital: decimalStringSchema,
  paidUpEquityShareCapital: decimalStringSchema,
  paidUpPreferenceShareCapital: decimalStringSchema,
  paidUpCapitalAsPerLatestAuditedFinancials: decimalStringSchema,
  latestAuditedFinancialYearEnd: text,
  shareCapitalMatchesMcaRecords: yesNoNotSureOrEmptySchema,
  discrepancyWithMcaRecordsExplanation: text,
  allSharesFullyPaidUp: yesNoNotSureOrEmptySchema,
  partlyPaidSharesOutstanding: yesNoNotSureOrEmptySchema,
  partlyPaidSharesDetails: text,
  hasCallsInArrears: yesNoNotSureOrEmptySchema,
  callsInArrearsExplanation: text,
  hasForfeitedShares: yesNoNotSureOrEmptySchema,
  forfeitedSharesExplanation: text,
  hasCapitalReduction: yesNoNotSureOrEmptySchema,
  capitalReductionExplanation: text,
  sharesWithDifferentialVotingRightsExist: yesNoNotSureOrEmptySchema,
  differentialVotingRightsDetails: text,
  capitalAlterationCurrentlyPending: yesNoNotSureOrEmptySchema,
  capitalAlterationPendingExplanation: text,
  equityIsin: text,
  depositoryConnectivity: z.enum(['', ...DEPOSITORY_CONNECTIVITY_VALUES]),
  registrarAndTransferAgentName: text,
  dematStatusOverall: z.enum(['', ...DEMAT_STATUS_VALUES]),
  lastCapitalChangeDate: text,
  authorisedCapitalSufficientForProposedIssue: yesNoNotSureOrEmptySchema,
  authorisedCapitalIncreaseRequiredAmount: decimalStringSchema,
  notes: text,
});
export type CurrentCapitalStructure = z.infer<typeof currentCapitalStructureSchema>;

/* -------------------------------------------------------------------------- */
/* 2. Share capital history                                                    */
/* -------------------------------------------------------------------------- */

export const capitalEventSchema = z.object({
  id: idSchema,
  eventDate: text,
  eventType: z.enum(['', ...CAPITAL_EVENT_TYPE_VALUES]),
  securityType: z.enum(['', ...SECURITY_TYPE_VALUES]),
  description: text,
  numberOfShares: decimalStringSchema,
  faceValuePerShare: decimalStringSchema,
  issuePricePerShare: decimalStringSchema,
  premiumPerShare: decimalStringSchema,
  totalConsiderationAmount: decimalStringSchema,
  considerationType: z.enum(['', ...CONSIDERATION_TYPE_VALUES]),
  considerationDetails: text,
  /** Split / consolidation ratio expressed as `from : to` share counts. */
  splitOrConsolidationRatioFrom: decimalStringSchema,
  splitOrConsolidationRatioTo: decimalStringSchema,
  preEventFaceValuePerShare: decimalStringSchema,
  postEventFaceValuePerShare: decimalStringSchema,
  numberOfAllottees: decimalStringSchema,
  alloteesDescription: text,
  includesPromoterAllotment: yesNoNotSureOrEmptySchema,
  promoterSharesInEvent: decimalStringSchema,
  isRelatedPartyAllotment: yesNoNotSureOrEmptySchema,
  resolutionType: z.enum(['', ...RESOLUTION_TYPE_VALUES]),
  resolutionDate: text,
  resolutionReference: text,
  formFiledWithRoc: text,
  filingSrn: text,
  filingDate: text,
  rocFilingCompleted: yesNoNotSureOrEmptySchema,
  valuationReportObtained: yesNoNotSureOrEmptySchema,
  valuerName: text,
  valuationDate: text,
  lockInImplication: text,
  supportingDocumentReference: text,
  notes: text,
});
export type CapitalEvent = z.infer<typeof capitalEventSchema>;

export const shareCapitalHistorySchema = z.object({
  historyCoversPeriodSinceIncorporation: yesNoNotSureOrEmptySchema,
  historyStartDate: text,
  capitalEvents: z.array(capitalEventSchema),
  allHistoricalAllotmentsDocumented: yesNoNotSureOrEmptySchema,
  gapsInHistoryExplanation: text,
  historyReconciledWithMcaFilings: yesNoNotSureOrEmptySchema,
  historyReconciledWithRegisterOfMembers: yesNoNotSureOrEmptySchema,
  reconciliationDifferenceExplanation: text,
  bonusIssueInLastTwelveMonths: yesNoNotSureOrEmptySchema,
  bonusIssueOutOfRevaluationReserves: yesNoNotSureOrEmptySchema,
  sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths: yesNoNotSureOrEmptySchema,
  sharesIssuedAtDifferentPricesInLastTwelveMonths: yesNoNotSureOrEmptySchema,
  differentialPricingExplanation: text,
  anyPendingAllotments: yesNoNotSureOrEmptySchema,
  pendingAllotmentDetails: text,
  shareApplicationMoneyPendingAllotment: decimalStringSchema,
  notes: text,
});
export type ShareCapitalHistory = z.infer<typeof shareCapitalHistorySchema>;

/* -------------------------------------------------------------------------- */
/* 3. Shareholders & beneficial ownership                                      */
/* -------------------------------------------------------------------------- */

export const shareholderSchema = z.object({
  id: idSchema,
  name: text,
  holderType: z.enum(['', ...HOLDER_TYPE_VALUES]),
  category: z.enum(['', ...SHAREHOLDER_CATEGORY_VALUES]),
  residentialStatus: z.enum(['', ...RESIDENTIAL_STATUS_VALUES]),
  nationality: text,
  identifierType: z.enum(['', ...IDENTIFIER_TYPE_VALUES]),
  identifierValue: text,
  directorIdentificationNumber: text,
  /** Optional link to an equity class in `currentCapitalStructure`; `''` when unlinked. */
  equityClassId: text,
  equitySharesHeld: decimalStringSchema,
  preferenceSharesHeld: decimalStringSchema,
  sharesInDematerialisedForm: decimalStringSchema,
  sharesInPhysicalForm: decimalStringSchema,
  folioOrDpClientId: text,
  dateOfEarliestAcquisition: text,
  dateOfLatestAcquisition: text,
  modeOfAcquisition: z.enum(['', ...ACQUISITION_MODE_VALUES]),
  averageCostOfAcquisitionPerShare: decimalStringSchema,
  votingRightsDifferFromShareholding: yesNoNotSureOrEmptySchema,
  votingRightsPercentageIfDifferent: decimalStringSchema,
  sharesEncumbered: decimalStringSchema,
  isPartOfPromoterGroup: yesNoNotSureOrEmptySchema,
  beneficialOwnerIsDifferent: yesNoNotSureOrEmptySchema,
  beneficialOwnerName: text,
  isSellingShareholderInOffer: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type Shareholder = z.infer<typeof shareholderSchema>;

export const beneficialOwnerSchema = z.object({
  id: idSchema,
  name: text,
  /** Optional link to a `shareholders[].id`; `''` when the SBO holds only indirectly. */
  linkedShareholderId: text,
  identifierType: z.enum(['', ...IDENTIFIER_TYPE_VALUES]),
  identifierValue: text,
  nationality: text,
  residentialStatus: z.enum(['', ...RESIDENTIAL_STATUS_VALUES]),
  isSignificantBeneficialOwner: yesNoNotSureOrEmptySchema,
  natureOfInterest: z.enum(['', ...BENEFICIAL_INTEREST_NATURE_VALUES]),
  directHoldingPercentage: decimalStringSchema,
  indirectHoldingPercentage: decimalStringSchema,
  chainOfOwnershipDescription: text,
  dateOfBecomingBeneficialOwner: text,
  declarationInFormBen1Received: yesNoNotSureOrEmptySchema,
  formBen2Filed: yesNoNotSureOrEmptySchema,
  formBen2SrnOrReference: text,
  registerInFormBen3Maintained: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type BeneficialOwner = z.infer<typeof beneficialOwnerSchema>;

export const shareholdersAndBeneficialOwnershipSchema = z.object({
  shareholdingAsOnDate: text,
  shareholders: z.array(shareholderSchema),
  beneficialOwners: z.array(beneficialOwnerSchema),
  totalNumberOfShareholders: decimalStringSchema,
  registerOfMembersMaintained: yesNoNotSureOrEmptySchema,
  registerOfMembersUpToDate: yesNoNotSureOrEmptySchema,
  shareholdingReconciledWithRegisterOfMembers: yesNoNotSureOrEmptySchema,
  significantBeneficialOwnerDeterminationCompleted: yesNoNotSureOrEmptySchema,
  significantBeneficialOwnerNotApplicableReason: text,
  nomineeShareholdersExist: yesNoNotSureOrEmptySchema,
  nomineeShareholderDetails: text,
  foreignShareholdingExists: yesNoNotSureOrEmptySchema,
  foreignDirectInvestmentComplianceConfirmed: yesNoNotSureOrEmptySchema,
  formFcGprFilingsCompleted: yesNoNotSureOrEmptySchema,
  sectoralCapComplianceConfirmed: yesNoNotSureOrEmptySchema,
  foreignInvestmentNotes: text,
  anyShareholderAgreementsWithInvestors: yesNoNotSureOrEmptySchema,
  investorAgreementSummary: text,
  notes: text,
});
export type ShareholdersAndBeneficialOwnership = z.infer<
  typeof shareholdersAndBeneficialOwnershipSchema
>;

/* -------------------------------------------------------------------------- */
/* 4. Promoters & control                                                      */
/* -------------------------------------------------------------------------- */

export const promoterSchema = z.object({
  id: idSchema,
  name: text,
  promoterType: z.enum(['', ...PROMOTER_TYPE_VALUES]),
  /** Optional link to a `shareholders[].id`; `''` when the promoter holds no shares directly. */
  linkedShareholderId: text,
  identifierType: z.enum(['', ...IDENTIFIER_TYPE_VALUES]),
  identifierValue: text,
  directorIdentificationNumber: text,
  nationality: text,
  residentialStatus: z.enum(['', ...RESIDENTIAL_STATUS_VALUES]),
  dateOfBecomingPromoter: text,
  basisOfPromoterStatus: z.enum(['', ...PROMOTER_STATUS_BASIS_VALUES]),
  basisExplanation: text,
  equitySharesHeld: decimalStringSchema,
  isAlsoDirector: yesNoNotSureOrEmptySchema,
  designation: text,
  relationshipWithOtherPromoters: text,
  isPartOfPromoterSellingInOffer: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type Promoter = z.infer<typeof promoterSchema>;

export const promoterGroupMemberSchema = z.object({
  id: idSchema,
  name: text,
  /** Optional link to a `promoters[].id`; `''` when not attributable to a single promoter. */
  relatedPromoterId: text,
  /** Optional link to a `shareholders[].id`; `''` when the member holds no shares. */
  linkedShareholderId: text,
  memberType: z.enum(['', ...PROMOTER_TYPE_VALUES]),
  relationshipToPromoter: z.enum(['', ...PROMOTER_GROUP_RELATIONSHIP_VALUES]),
  inclusionBasis: z.enum(['', ...PROMOTER_GROUP_BASIS_VALUES]),
  inclusionBasisExplanation: text,
  identifierType: z.enum(['', ...IDENTIFIER_TYPE_VALUES]),
  identifierValue: text,
  isShareholder: yesNoNotSureOrEmptySchema,
  equitySharesHeld: decimalStringSchema,
  notes: text,
});
export type PromoterGroupMember = z.infer<typeof promoterGroupMemberSchema>;

export const controlArrangementSchema = z.object({
  id: idSchema,
  arrangementType: z.enum(['', ...CONTROL_ARRANGEMENT_TYPE_VALUES]),
  arrangementName: text,
  partiesInvolved: text,
  effectiveDate: text,
  expiryDate: text,
  keyRightsSummary: text,
  conferControlOverIssuer: yesNoNotSureOrEmptySchema,
  survivesPostListing: yesNoNotSureOrEmptySchema,
  terminationOnListingAgreed: yesNoNotSureOrEmptySchema,
  amendmentRequiredBeforeFiling: yesNoNotSureOrEmptySchema,
  disclosedInOfferDocument: yesNoNotSureOrEmptySchema,
  documentReference: text,
  notes: text,
});
export type ControlArrangement = z.infer<typeof controlArrangementSchema>;

export const promotersAndControlSchema = z.object({
  companyHasIdentifiedPromoter: yesNoNotSureOrEmptySchema,
  noPromoterExplanation: text,
  promoters: z.array(promoterSchema),
  promoterGroupMembers: z.array(promoterGroupMemberSchema),
  controlArrangements: z.array(controlArrangementSchema),
  promoterIdentificationComplete: yesNoNotSureOrEmptySchema,
  promoterGroupIdentificationComplete: yesNoNotSureOrEmptySchema,
  anyPersonExercisingControlWithoutShareholding: yesNoNotSureOrEmptySchema,
  controlWithoutShareholdingDetails: text,
  changeInControlInLastThreeYears: yesNoNotSureOrEmptySchema,
  changeInControlDetails: text,
  anyPromoterIsBodyCorporate: yesNoNotSureOrEmptySchema,
  promoterBodyCorporateOwnershipDisclosed: yesNoNotSureOrEmptySchema,
  anyPromoterClassifiedAsWilfulDefaulter: yesNoNotSureOrEmptySchema,
  promoterDisqualificationDetails: text,
  professionalConfirmationOnPromoterIdentification: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type PromotersAndControl = z.infer<typeof promotersAndControlSchema>;

/* -------------------------------------------------------------------------- */
/* 5. Pre & post issue ownership (user-editable overlays only)                 */
/* -------------------------------------------------------------------------- */

export const shareholderOfferOverlaySchema = z.object({
  id: idSchema,
  /** Links to `shareholdersAndBeneficialOwnership.shareholders[].id`. */
  shareholderId: text,
  sharesOfferedForSale: decimalStringSchema,
  otherExpectedPreIssueTransfer: decimalStringSchema,
  notes: text,
});
export type ShareholderOfferOverlay = z.infer<typeof shareholderOfferOverlaySchema>;

export const preAndPostIssueOwnershipSchema = z.object({
  shareholderOverlays: z.array(shareholderOfferOverlaySchema),
  /** Optional override when the IPO Setup fresh-issue size is not yet the working number. */
  freshIssueSharesOverride: decimalStringSchema,
  freshIssueOverrideReason: text,
  expectedPreIpoPlacementShares: decimalStringSchema,
  expectedConversionSharesBeforeIssue: decimalStringSchema,
  expectedEsopAllotmentSharesBeforeIssue: decimalStringSchema,
  preIssueCapitalConfirmedWithLeadManager: yesNoNotSureOrEmptySchema,
  sellingShareholderConsentsObtained: yesNoNotSureOrEmptySchema,
  sellingShareholderEligibilityConfirmed: yesNoNotSureOrEmptySchema,
  offerForSaleSharesHeldForRequiredPeriod: yesNoNotSureOrEmptySchema,
  anyExpectedPreIssueTransfers: yesNoNotSureOrEmptySchema,
  expectedPreIssueTransferDetails: text,
  notes: text,
});
export type PreAndPostIssueOwnership = z.infer<typeof preAndPostIssueOwnershipSchema>;

/* -------------------------------------------------------------------------- */
/* 6. Promoter contribution, lock-in & encumbrances                            */
/* -------------------------------------------------------------------------- */

export const promoterContributionLotSchema = z.object({
  id: idSchema,
  /** Optional link to a `promoters[].id`; `''` when not yet attributed. */
  promoterId: text,
  /** Optional link to a `shareholders[].id`. */
  shareholderId: text,
  holderName: text,
  numberOfShares: decimalStringSchema,
  faceValuePerShare: decimalStringSchema,
  dateOfAcquisition: text,
  dateOfAllotmentOrTransfer: text,
  modeOfAcquisition: z.enum(['', ...CONTRIBUTION_ACQUISITION_MODE_VALUES]),
  acquisitionPricePerShare: decimalStringSchema,
  considerationType: z.enum(['', ...CONSIDERATION_TYPE_VALUES]),
  fullyPaidUp: yesNoNotSureOrEmptySchema,
  dematerialised: yesNoNotSureOrEmptySchema,
  eligibleForMinimumPromoterContribution: yesNoNotSureOrEmptySchema,
  ineligibilityReason: text,
  proposedLockInPeriod: z.enum(['', ...LOCK_IN_PERIOD_VALUES]),
  lockInStartDateBasis: text,
  isEncumbered: yesNoNotSureOrEmptySchema,
  isin: text,
  notes: text,
});
export type PromoterContributionLot = z.infer<typeof promoterContributionLotSchema>;

export const encumbranceSchema = z.object({
  id: idSchema,
  /** Optional link to a `shareholders[].id`; `''` when recorded by name only. */
  shareholderId: text,
  holderName: text,
  holderCategory: z.enum(['', ...SHAREHOLDER_CATEGORY_VALUES]),
  encumbranceType: z.enum(['', ...ENCUMBRANCE_TYPE_VALUES]),
  numberOfSharesEncumbered: decimalStringSchema,
  inFavourOf: text,
  purpose: text,
  createdDate: text,
  expectedReleaseDate: text,
  willBeReleasedBeforeFiling: yesNoNotSureOrEmptySchema,
  releasePlan: text,
  affectsPromoterContributionShares: yesNoNotSureOrEmptySchema,
  disclosedToStockExchangeOrDepository: yesNoNotSureOrEmptySchema,
  documentReference: text,
  notes: text,
});
export type Encumbrance = z.infer<typeof encumbranceSchema>;

export const promoterContributionLockInAndEncumbrancesSchema = z.object({
  minimumPromoterContributionApplicable: yesNoNotSureOrEmptySchema,
  exemptionFromMinimumContributionClaimed: yesNoNotSureOrEmptySchema,
  exemptionBasis: text,
  targetMinimumContributionPercentage: decimalStringSchema,
  proposedMinimumContributionShares: decimalStringSchema,
  contributionLots: z.array(promoterContributionLotSchema),
  encumbrances: z.array(encumbranceSchema),
  contributionBroughtInBeforeIssueOpening: yesNoNotSureOrEmptySchema,
  sharesIneligibleForContributionExist: yesNoNotSureOrEmptySchema,
  ineligibleSharesDetails: text,
  entirePreIssueCapitalLockInUnderstood: yesNoNotSureOrEmptySchema,
  preIssueCapitalExemptFromLockInShares: decimalStringSchema,
  preIssueCapitalExemptFromLockInBasis: text,
  anyEncumbranceOnPromoterShares: yesNoNotSureOrEmptySchema,
  encumbranceReleaseBeforeLockInConfirmed: yesNoNotSureOrEmptySchema,
  lockInSharesToBeHeldInDematerialisedForm: yesNoNotSureOrEmptySchema,
  lockInComplianceProfessionallyConfirmed: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type PromoterContributionLockInAndEncumbrances = z.infer<
  typeof promoterContributionLockInAndEncumbrancesSchema
>;

/* -------------------------------------------------------------------------- */
/* 7. Outstanding securities, transactions & confirmations                     */
/* -------------------------------------------------------------------------- */

export const outstandingInstrumentSchema = z.object({
  id: idSchema,
  instrumentType: z.enum(['', ...OUTSTANDING_INSTRUMENT_TYPE_VALUES]),
  schemeOrInstrumentName: text,
  dateOfGrantOrIssue: text,
  numberOfInstrumentsOutstanding: decimalStringSchema,
  potentialEquitySharesOnConversion: decimalStringSchema,
  conversionOrExercisePricePerShare: decimalStringSchema,
  conversionRatio: text,
  conversionOrExercisePeriod: text,
  vestedInstrumentsOutstanding: decimalStringSchema,
  unvestedInstrumentsOutstanding: decimalStringSchema,
  holderCategory: z.enum(['', ...INSTRUMENT_HOLDER_CATEGORY_VALUES]),
  numberOfHolders: decimalStringSchema,
  willConvertOrLapseBeforeFiling: yesNoNotSureOrEmptySchema,
  expectedConversionOrLapseDate: text,
  shareholderApprovalObtained: yesNoNotSureOrEmptySchema,
  compliantWithShareBasedBenefitRegulations: yesNoNotSureOrEmptySchema,
  documentReference: text,
  notes: text,
});
export type OutstandingInstrument = z.infer<typeof outstandingInstrumentSchema>;

export const recentTransactionSchema = z.object({
  id: idSchema,
  transactionDate: text,
  transactionType: z.enum(['', ...TRANSACTION_TYPE_VALUES]),
  transferorName: text,
  transferorCategory: z.enum(['', ...SHAREHOLDER_CATEGORY_VALUES]),
  transfereeName: text,
  transfereeCategory: z.enum(['', ...SHAREHOLDER_CATEGORY_VALUES]),
  numberOfShares: decimalStringSchema,
  pricePerShare: decimalStringSchema,
  totalConsideration: decimalStringSchema,
  considerationType: z.enum(['', ...CONSIDERATION_TYPE_VALUES]),
  involvesPromoterOrPromoterGroup: yesNoNotSureOrEmptySchema,
  isRelatedPartyTransaction: yesNoNotSureOrEmptySchema,
  valuationBasis: text,
  formSh4OrTransferDeedAvailable: yesNoNotSureOrEmptySchema,
  disclosedInOfferDocument: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type RecentTransaction = z.infer<typeof recentTransactionSchema>;

export const capitalOwnershipConfirmationsSchema = z.object({
  capitalStructureFiguresMatchStatutoryRegisters: z.boolean(),
  shareCapitalHistoryIsComplete: z.boolean(),
  shareholdingDetailsAreCurrentAsOnStatedDate: z.boolean(),
  promoterAndPromoterGroupIdentificationIsComplete: z.boolean(),
  allOutstandingConvertibleInstrumentsDisclosed: z.boolean(),
  allEncumbrancesOnPromoterSharesDisclosed: z.boolean(),
  noUndisclosedShareholderAgreementsOrControlArrangements: z.boolean(),
  offerForSaleSharesAreWithinExistingHoldings: z.boolean(),
  missingAnswersMustNotBeInterpretedAsNegative: z.boolean(),
  computedFiguresAreIndicativeOnly: z.boolean(),
  professionalAndRegistrarConfirmationRemainRequired: z.boolean(),
});
export type CapitalOwnershipConfirmations = z.infer<typeof capitalOwnershipConfirmationsSchema>;

export const outstandingSecuritiesTransactionsAndConfirmationsSchema = z.object({
  anyOutstandingConvertibleInstruments: yesNoNotSureOrEmptySchema,
  outstandingInstruments: z.array(outstandingInstrumentSchema),
  allConvertiblesToBeSettledBeforeFiling: yesNoNotSureOrEmptySchema,
  outstandingInstrumentNotes: text,
  anyTransactionsInLastEighteenMonths: yesNoNotSureOrEmptySchema,
  recentTransactions: z.array(recentTransactionSchema),
  weightedAverageCostDisclosureRequired: yesNoNotSureOrEmptySchema,
  transactionNotes: text,
  allSharesDematerialisedBeforeFiling: yesNoNotSureOrEmptySchema,
  anyPendingShareTransfers: yesNoNotSureOrEmptySchema,
  pendingShareTransferDetails: text,
  anyDisputesOverTitleToShares: yesNoNotSureOrEmptySchema,
  titleDisputeDetails: text,
  confirmations: capitalOwnershipConfirmationsSchema,
  notes: text,
});
export type OutstandingSecuritiesTransactionsAndConfirmations = z.infer<
  typeof outstandingSecuritiesTransactionsAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export const capitalOwnershipPayloadSchema = z.object({
  schemaVersion: z.literal(CAPITAL_OWNERSHIP_SCHEMA_VERSION),
  currentCapitalStructure: currentCapitalStructureSchema,
  shareCapitalHistory: shareCapitalHistorySchema,
  shareholdersAndBeneficialOwnership: shareholdersAndBeneficialOwnershipSchema,
  promotersAndControl: promotersAndControlSchema,
  preAndPostIssueOwnership: preAndPostIssueOwnershipSchema,
  promoterContributionLockInAndEncumbrances: promoterContributionLockInAndEncumbrancesSchema,
  outstandingSecuritiesTransactionsAndConfirmations:
    outstandingSecuritiesTransactionsAndConfirmationsSchema,
});

export type CapitalOwnershipPayload = z.infer<typeof capitalOwnershipPayloadSchema>;

export type CapitalOwnershipSectionId =
  | 'current-capital-structure'
  | 'share-capital-history'
  | 'shareholders-beneficial-ownership'
  | 'promoters-and-control'
  | 'pre-post-issue-ownership'
  | 'promoter-contribution-lock-in'
  | 'outstanding-securities-confirmations';

export const CAPITAL_OWNERSHIP_SECTION_IDS: CapitalOwnershipSectionId[] = [
  'current-capital-structure',
  'share-capital-history',
  'shareholders-beneficial-ownership',
  'promoters-and-control',
  'pre-post-issue-ownership',
  'promoter-contribution-lock-in',
  'outstanding-securities-confirmations',
];
