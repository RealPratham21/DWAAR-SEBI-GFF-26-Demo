/**
 * Empty-record factories for Capital & Ownership (Increment C1).
 *
 * Every money / share / percentage field starts as `''` (never `0`, never `null`) and every
 * repeatable record receives a stable `crypto.randomUUID()` id so React keys and cross-section
 * links survive re-renders and round-trips.
 */

import type {
  BeneficialOwner,
  CapitalEvent,
  CapitalOwnershipConfirmations,
  CapitalOwnershipPayload,
  ControlArrangement,
  CurrentCapitalStructure,
  Encumbrance,
  EquityShareClass,
  OutstandingInstrument,
  PreAndPostIssueOwnership,
  PreferenceShareClass,
  Promoter,
  PromoterContributionLockInAndEncumbrances,
  PromoterContributionLot,
  PromoterGroupMember,
  PromotersAndControl,
  RecentTransaction,
  ShareCapitalHistory,
  Shareholder,
  ShareholderOfferOverlay,
  ShareholdersAndBeneficialOwnership,
  OutstandingSecuritiesTransactionsAndConfirmations,
} from '@/lib/schemas/capital-ownership';
import { CAPITAL_OWNERSHIP_SCHEMA_VERSION } from '@/lib/schemas/capital-ownership';

function newId(id?: string): string {
  return id ?? crypto.randomUUID();
}

export function createEmptyEquityShareClass(id?: string): EquityShareClass {
  return {
    id: newId(id),
    className: '',
    classType: '',
    faceValuePerShare: '',
    votingRightsPerShare: '',
    authorisedShares: '',
    issuedShares: '',
    subscribedShares: '',
    paidUpShares: '',
    partlyPaidShares: '',
    amountPaidUpPerPartlyPaidShare: '',
    sharePremiumBalance: '',
    callsUnpaidAmount: '',
    sharesForfeited: '',
    isin: '',
    dematStatus: '',
    sharesInDematerialisedForm: '',
    rightsAndRestrictions: '',
    notes: '',
  };
}

export function createEmptyPreferenceShareClass(id?: string): PreferenceShareClass {
  return {
    id: newId(id),
    className: '',
    classType: '',
    faceValuePerShare: '',
    authorisedShares: '',
    issuedShares: '',
    paidUpShares: '',
    dividendRatePercentage: '',
    isCumulative: '',
    isParticipating: '',
    isConvertible: '',
    conversionTerms: '',
    potentialEquitySharesOnConversion: '',
    isRedeemable: '',
    redemptionDate: '',
    redemptionAmount: '',
    carriesVotingRights: '',
    votingRightsDescription: '',
    isin: '',
    notes: '',
  };
}

export function createEmptyCapitalEvent(id?: string): CapitalEvent {
  return {
    id: newId(id),
    eventDate: '',
    eventType: '',
    securityType: '',
    description: '',
    numberOfShares: '',
    faceValuePerShare: '',
    issuePricePerShare: '',
    premiumPerShare: '',
    totalConsiderationAmount: '',
    considerationType: '',
    considerationDetails: '',
    splitOrConsolidationRatioFrom: '',
    splitOrConsolidationRatioTo: '',
    preEventFaceValuePerShare: '',
    postEventFaceValuePerShare: '',
    numberOfAllottees: '',
    alloteesDescription: '',
    includesPromoterAllotment: '',
    promoterSharesInEvent: '',
    isRelatedPartyAllotment: '',
    resolutionType: '',
    resolutionDate: '',
    resolutionReference: '',
    formFiledWithRoc: '',
    filingSrn: '',
    filingDate: '',
    rocFilingCompleted: '',
    valuationReportObtained: '',
    valuerName: '',
    valuationDate: '',
    lockInImplication: '',
    supportingDocumentReference: '',
    notes: '',
  };
}

export function createEmptyShareholder(id?: string): Shareholder {
  return {
    id: newId(id),
    name: '',
    holderType: '',
    category: '',
    residentialStatus: '',
    nationality: '',
    identifierType: '',
    identifierValue: '',
    directorIdentificationNumber: '',
    equityClassId: '',
    equitySharesHeld: '',
    preferenceSharesHeld: '',
    sharesInDematerialisedForm: '',
    sharesInPhysicalForm: '',
    folioOrDpClientId: '',
    dateOfEarliestAcquisition: '',
    dateOfLatestAcquisition: '',
    modeOfAcquisition: '',
    averageCostOfAcquisitionPerShare: '',
    votingRightsDifferFromShareholding: '',
    votingRightsPercentageIfDifferent: '',
    sharesEncumbered: '',
    isPartOfPromoterGroup: '',
    beneficialOwnerIsDifferent: '',
    beneficialOwnerName: '',
    isSellingShareholderInOffer: '',
    notes: '',
  };
}

export function createEmptyBeneficialOwner(id?: string): BeneficialOwner {
  return {
    id: newId(id),
    name: '',
    linkedShareholderId: '',
    identifierType: '',
    identifierValue: '',
    nationality: '',
    residentialStatus: '',
    isSignificantBeneficialOwner: '',
    natureOfInterest: '',
    directHoldingPercentage: '',
    indirectHoldingPercentage: '',
    chainOfOwnershipDescription: '',
    dateOfBecomingBeneficialOwner: '',
    declarationInFormBen1Received: '',
    formBen2Filed: '',
    formBen2SrnOrReference: '',
    registerInFormBen3Maintained: '',
    notes: '',
  };
}

export function createEmptyPromoter(id?: string): Promoter {
  return {
    id: newId(id),
    name: '',
    promoterType: '',
    linkedShareholderId: '',
    identifierType: '',
    identifierValue: '',
    directorIdentificationNumber: '',
    nationality: '',
    residentialStatus: '',
    dateOfBecomingPromoter: '',
    basisOfPromoterStatus: '',
    basisExplanation: '',
    equitySharesHeld: '',
    isAlsoDirector: '',
    designation: '',
    relationshipWithOtherPromoters: '',
    isPartOfPromoterSellingInOffer: '',
    notes: '',
  };
}

export function createEmptyPromoterGroupMember(id?: string): PromoterGroupMember {
  return {
    id: newId(id),
    name: '',
    relatedPromoterId: '',
    linkedShareholderId: '',
    memberType: '',
    relationshipToPromoter: '',
    inclusionBasis: '',
    inclusionBasisExplanation: '',
    identifierType: '',
    identifierValue: '',
    isShareholder: '',
    equitySharesHeld: '',
    notes: '',
  };
}

export function createEmptyControlArrangement(id?: string): ControlArrangement {
  return {
    id: newId(id),
    arrangementType: '',
    arrangementName: '',
    partiesInvolved: '',
    effectiveDate: '',
    expiryDate: '',
    keyRightsSummary: '',
    conferControlOverIssuer: '',
    survivesPostListing: '',
    terminationOnListingAgreed: '',
    amendmentRequiredBeforeFiling: '',
    disclosedInOfferDocument: '',
    documentReference: '',
    notes: '',
  };
}

export function createEmptyShareholderOfferOverlay(
  shareholderId = '',
  id?: string,
): ShareholderOfferOverlay {
  return {
    id: newId(id),
    shareholderId,
    sharesOfferedForSale: '',
    otherExpectedPreIssueTransfer: '',
    notes: '',
  };
}

export function createEmptyPromoterContributionLot(id?: string): PromoterContributionLot {
  return {
    id: newId(id),
    promoterId: '',
    shareholderId: '',
    holderName: '',
    numberOfShares: '',
    faceValuePerShare: '',
    dateOfAcquisition: '',
    dateOfAllotmentOrTransfer: '',
    modeOfAcquisition: '',
    acquisitionPricePerShare: '',
    considerationType: '',
    fullyPaidUp: '',
    dematerialised: '',
    eligibleForMinimumPromoterContribution: '',
    ineligibilityReason: '',
    proposedLockInPeriod: '',
    lockInStartDateBasis: '',
    isEncumbered: '',
    isin: '',
    notes: '',
  };
}

export function createEmptyEncumbrance(id?: string): Encumbrance {
  return {
    id: newId(id),
    shareholderId: '',
    holderName: '',
    holderCategory: '',
    encumbranceType: '',
    numberOfSharesEncumbered: '',
    inFavourOf: '',
    purpose: '',
    createdDate: '',
    expectedReleaseDate: '',
    willBeReleasedBeforeFiling: '',
    releasePlan: '',
    affectsPromoterContributionShares: '',
    disclosedToStockExchangeOrDepository: '',
    documentReference: '',
    notes: '',
  };
}

export function createEmptyOutstandingInstrument(id?: string): OutstandingInstrument {
  return {
    id: newId(id),
    instrumentType: '',
    schemeOrInstrumentName: '',
    dateOfGrantOrIssue: '',
    numberOfInstrumentsOutstanding: '',
    potentialEquitySharesOnConversion: '',
    conversionOrExercisePricePerShare: '',
    conversionRatio: '',
    conversionOrExercisePeriod: '',
    vestedInstrumentsOutstanding: '',
    unvestedInstrumentsOutstanding: '',
    holderCategory: '',
    numberOfHolders: '',
    willConvertOrLapseBeforeFiling: '',
    expectedConversionOrLapseDate: '',
    shareholderApprovalObtained: '',
    compliantWithShareBasedBenefitRegulations: '',
    documentReference: '',
    notes: '',
  };
}

export function createEmptyRecentTransaction(id?: string): RecentTransaction {
  return {
    id: newId(id),
    transactionDate: '',
    transactionType: '',
    transferorName: '',
    transferorCategory: '',
    transfereeName: '',
    transfereeCategory: '',
    numberOfShares: '',
    pricePerShare: '',
    totalConsideration: '',
    considerationType: '',
    involvesPromoterOrPromoterGroup: '',
    isRelatedPartyTransaction: '',
    valuationBasis: '',
    formSh4OrTransferDeedAvailable: '',
    disclosedInOfferDocument: '',
    notes: '',
  };
}

export function createEmptyCapitalOwnershipConfirmations(): CapitalOwnershipConfirmations {
  return {
    capitalStructureFiguresMatchStatutoryRegisters: false,
    shareCapitalHistoryIsComplete: false,
    shareholdingDetailsAreCurrentAsOnStatedDate: false,
    promoterAndPromoterGroupIdentificationIsComplete: false,
    allOutstandingConvertibleInstrumentsDisclosed: false,
    allEncumbrancesOnPromoterSharesDisclosed: false,
    noUndisclosedShareholderAgreementsOrControlArrangements: false,
    offerForSaleSharesAreWithinExistingHoldings: false,
    missingAnswersMustNotBeInterpretedAsNegative: false,
    computedFiguresAreIndicativeOnly: false,
    professionalAndRegistrarConfirmationRemainRequired: false,
  };
}

export function createEmptyCurrentCapitalStructure(): CurrentCapitalStructure {
  return {
    amountDisplayUnit: 'rupees',
    asOnDate: '',
    equityClasses: [createEmptyEquityShareClass()],
    hasPreferenceShares: '',
    preferenceClasses: [],
    authorisedEquityShareCapital: '',
    authorisedPreferenceShareCapital: '',
    totalAuthorisedShareCapitalAsPerMoa: '',
    issuedEquityShareCapital: '',
    subscribedEquityShareCapital: '',
    paidUpEquityShareCapital: '',
    paidUpPreferenceShareCapital: '',
    paidUpCapitalAsPerLatestAuditedFinancials: '',
    latestAuditedFinancialYearEnd: '',
    shareCapitalMatchesMcaRecords: '',
    discrepancyWithMcaRecordsExplanation: '',
    allSharesFullyPaidUp: '',
    partlyPaidSharesOutstanding: '',
    partlyPaidSharesDetails: '',
    hasCallsInArrears: '',
    callsInArrearsExplanation: '',
    hasForfeitedShares: '',
    forfeitedSharesExplanation: '',
    hasCapitalReduction: '',
    capitalReductionExplanation: '',
    sharesWithDifferentialVotingRightsExist: '',
    differentialVotingRightsDetails: '',
    capitalAlterationCurrentlyPending: '',
    capitalAlterationPendingExplanation: '',
    equityIsin: '',
    depositoryConnectivity: '',
    registrarAndTransferAgentName: '',
    dematStatusOverall: '',
    lastCapitalChangeDate: '',
    authorisedCapitalSufficientForProposedIssue: '',
    authorisedCapitalIncreaseRequiredAmount: '',
    notes: '',
  };
}

export function createEmptyShareCapitalHistory(): ShareCapitalHistory {
  return {
    historyCoversPeriodSinceIncorporation: '',
    historyStartDate: '',
    capitalEvents: [],
    allHistoricalAllotmentsDocumented: '',
    gapsInHistoryExplanation: '',
    historyReconciledWithMcaFilings: '',
    historyReconciledWithRegisterOfMembers: '',
    reconciliationDifferenceExplanation: '',
    bonusIssueInLastTwelveMonths: '',
    bonusIssueOutOfRevaluationReserves: '',
    sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths: '',
    sharesIssuedAtDifferentPricesInLastTwelveMonths: '',
    differentialPricingExplanation: '',
    anyPendingAllotments: '',
    pendingAllotmentDetails: '',
    shareApplicationMoneyPendingAllotment: '',
    notes: '',
  };
}

export function createEmptyShareholdersAndBeneficialOwnership(): ShareholdersAndBeneficialOwnership {
  return {
    shareholdingAsOnDate: '',
    shareholders: [],
    beneficialOwners: [],
    totalNumberOfShareholders: '',
    registerOfMembersMaintained: '',
    registerOfMembersUpToDate: '',
    shareholdingReconciledWithRegisterOfMembers: '',
    significantBeneficialOwnerDeterminationCompleted: '',
    significantBeneficialOwnerNotApplicableReason: '',
    nomineeShareholdersExist: '',
    nomineeShareholderDetails: '',
    foreignShareholdingExists: '',
    foreignDirectInvestmentComplianceConfirmed: '',
    formFcGprFilingsCompleted: '',
    sectoralCapComplianceConfirmed: '',
    foreignInvestmentNotes: '',
    anyShareholderAgreementsWithInvestors: '',
    investorAgreementSummary: '',
    notes: '',
  };
}

export function createEmptyPromotersAndControl(): PromotersAndControl {
  return {
    companyHasIdentifiedPromoter: '',
    noPromoterExplanation: '',
    promoters: [],
    promoterGroupMembers: [],
    controlArrangements: [],
    promoterIdentificationComplete: '',
    promoterGroupIdentificationComplete: '',
    anyPersonExercisingControlWithoutShareholding: '',
    controlWithoutShareholdingDetails: '',
    changeInControlInLastThreeYears: '',
    changeInControlDetails: '',
    anyPromoterIsBodyCorporate: '',
    promoterBodyCorporateOwnershipDisclosed: '',
    anyPromoterClassifiedAsWilfulDefaulter: '',
    promoterDisqualificationDetails: '',
    professionalConfirmationOnPromoterIdentification: '',
    notes: '',
  };
}

export function createEmptyPreAndPostIssueOwnership(): PreAndPostIssueOwnership {
  return {
    shareholderOverlays: [],
    freshIssueSharesOverride: '',
    freshIssueOverrideReason: '',
    expectedPreIpoPlacementShares: '',
    expectedConversionSharesBeforeIssue: '',
    expectedEsopAllotmentSharesBeforeIssue: '',
    preIssueCapitalConfirmedWithLeadManager: '',
    sellingShareholderConsentsObtained: '',
    sellingShareholderEligibilityConfirmed: '',
    offerForSaleSharesHeldForRequiredPeriod: '',
    anyExpectedPreIssueTransfers: '',
    expectedPreIssueTransferDetails: '',
    notes: '',
  };
}

export function createEmptyPromoterContributionLockInAndEncumbrances(): PromoterContributionLockInAndEncumbrances {
  return {
    minimumPromoterContributionApplicable: '',
    exemptionFromMinimumContributionClaimed: '',
    exemptionBasis: '',
    targetMinimumContributionPercentage: '',
    proposedMinimumContributionShares: '',
    contributionLots: [],
    encumbrances: [],
    contributionBroughtInBeforeIssueOpening: '',
    sharesIneligibleForContributionExist: '',
    ineligibleSharesDetails: '',
    entirePreIssueCapitalLockInUnderstood: '',
    preIssueCapitalExemptFromLockInShares: '',
    preIssueCapitalExemptFromLockInBasis: '',
    anyEncumbranceOnPromoterShares: '',
    encumbranceReleaseBeforeLockInConfirmed: '',
    lockInSharesToBeHeldInDematerialisedForm: '',
    lockInComplianceProfessionallyConfirmed: '',
    notes: '',
  };
}

export function createEmptyOutstandingSecuritiesTransactionsAndConfirmations(): OutstandingSecuritiesTransactionsAndConfirmations {
  return {
    anyOutstandingConvertibleInstruments: '',
    outstandingInstruments: [],
    allConvertiblesToBeSettledBeforeFiling: '',
    outstandingInstrumentNotes: '',
    anyTransactionsInLastEighteenMonths: '',
    recentTransactions: [],
    weightedAverageCostDisclosureRequired: '',
    transactionNotes: '',
    allSharesDematerialisedBeforeFiling: '',
    anyPendingShareTransfers: '',
    pendingShareTransferDetails: '',
    anyDisputesOverTitleToShares: '',
    titleDisputeDetails: '',
    confirmations: createEmptyCapitalOwnershipConfirmations(),
    notes: '',
  };
}

export function createEmptyCapitalOwnershipPayload(): CapitalOwnershipPayload {
  return {
    schemaVersion: CAPITAL_OWNERSHIP_SCHEMA_VERSION,
    currentCapitalStructure: createEmptyCurrentCapitalStructure(),
    shareCapitalHistory: createEmptyShareCapitalHistory(),
    shareholdersAndBeneficialOwnership: createEmptyShareholdersAndBeneficialOwnership(),
    promotersAndControl: createEmptyPromotersAndControl(),
    preAndPostIssueOwnership: createEmptyPreAndPostIssueOwnership(),
    promoterContributionLockInAndEncumbrances:
      createEmptyPromoterContributionLockInAndEncumbrances(),
    outstandingSecuritiesTransactionsAndConfirmations:
      createEmptyOutstandingSecuritiesTransactionsAndConfirmations(),
  };
}
