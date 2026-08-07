/**
 * Empty-record factories for Intermediaries & Filing (IF1).
 */

import type {
  AllotmentSummaryRecord,
  AsbaConfiguration,
  AudiovisualPresentation,
  BasisOfAllotment,
  CapitalLinkedSnapshot,
  CertificateRecord,
  ChapterSignoffRecord,
  ConsentRecord,
  DematCredit,
  DepositoriesBankingAsbaUpiAndIssueInfrastructure,
  DepositoryAgreement,
  DepositoryAgreements,
  DepositoryReadiness,
  DueDiligenceAreaRecord,
  DueDiligenceCertificatesConsentsAndSignoffs,
  ExchangeDraftFiling,
  ExchangeQueryRecord,
  FilingAndRegulatoryMilestoneTracker,
  FilingRecord,
  FilingSnapshot,
  FilingSnapshotReconciliation,
  FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness,
  FundsUnblocking,
  IfFinalConfirmations,
  InPrincipleApproval,
  InspectionItemRecord,
  InterSeAgreement,
  InterSeResponsibilityRecord,
  IntermediariesFilingPayload,
  IntermediaryAppointment,
  IntermediaryContact,
  IntermediaryRecord,
  IntermediaryRegistration,
  InvestorAllocationRecord,
  IssueAgreementRecord,
  IssueBankRoleRecord,
  IssueCalendar,
  IssueConfigurationAndFilingSnapshot,
  IssueOpeningReadiness,
  IssueProgrammeAllotmentListingAndPostIssueExecution,
  IssueTeamAndIntermediaryMaster,
  IssueTeamSnapshot,
  IpoSetupLinkedSnapshot,
  Listing,
  LotApplicationDetails,
  MarketMakerConfiguration,
  MarketMakerReservation,
  MarketMakingArrangement,
  MerchantBankerDdRepositoryReadiness,
  NominatedInvestorRecord,
  OfferDocumentVersionRecord,
  PlaceholderRecord,
  PostIssueActionRecord,
  Pricing,
  PublicCommunicationRecord,
  ResubmissionRecord,
  RocFilingRecord,
  SebiSmeFilingRecord,
  SponsorBankUpiReadiness,
  SubscriptionRowRecord,
  UnderwritingCommitmentRecord,
  UnderwritingMarketMakingAndDistributionArrangements,
  UnderwritingSummary,
} from '@/lib/schemas/intermediaries-filing';
import { INTERMEDIARIES_FILING_SCHEMA_VERSION } from '@/lib/schemas/intermediaries-filing';

function newId(): string {
  return crypto.randomUUID();
}

export function createEmptyIssueTeamSnapshot(): IssueTeamSnapshot {
  return {
    teamAsOfDate: '',
    leadManagerAppointed: '',
    registrarAppointed: '',
    legalCounselAppointed: '',
    statutoryPeerReviewAuditorEngaged: '',
    marketMakerAppointed: '',
    underwritersAppointed: '',
    bankersToIssueAppointed: '',
    sponsorBankAppointed: '',
    monitoringAgencyApplicable: '',
    monitoringAgencyAppointed: '',
    syndicateMembersApplicable: '',
    syndicateMembersAppointed: '',
    allRequiredEngagementAgreementsExecuted: '',
    applicableRegistrationsReviewed: '',
  };
}

export function createEmptyIntermediaryContact(): IntermediaryContact {
  return {
    registeredOffice: '',
    relevantCorporateBranchOffice: '',
    telephone: '',
    email: '',
    investorGrievanceEmail: '',
    website: '',
    contactPerson: '',
    designation: '',
    cin: '',
  };
}

export function createEmptyIntermediaryRegistration(): IntermediaryRegistration {
  return {
    registrationRequired: '',
    sebiRegistrationNumber: '',
    registrationCategory: '',
    registrationStatus: '',
    registrationExpiry: '',
    exchangeMembership: '',
    exchange: '',
    marketMakerRegistrationReference: '',
    otherRelevantRegistrationReference: '',
  };
}

export function createEmptyIntermediaryAppointment(): IntermediaryAppointment {
  return {
    appointmentDate: '',
    boardApprovalReference: '',
    engagementLetterDate: '',
    agreementDate: '',
    effectiveDate: '',
    scope: '',
    feeStructureSummary: '',
    reimbursementArrangement: '',
    status: '',
    replacementIntermediaryId: '',
    replacementReason: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyIntermediaryRecord(): IntermediaryRecord {
  return {
    intermediaryId: newId(),
    legalName: '',
    displayName: '',
    roles: [],
    contact: createEmptyIntermediaryContact(),
    registration: createEmptyIntermediaryRegistration(),
    appointment: createEmptyIntermediaryAppointment(),
  };
}

export function createEmptyInterSeResponsibilityRecord(): InterSeResponsibilityRecord {
  return {
    responsibilityId: newId(),
    intermediaryId: '',
    responsibilityAreas: [],
    detailedResponsibility: '',
    primarySecondary: '',
    notes: '',
  };
}

export function createEmptyInterSeAgreement(): InterSeAgreement {
  return {
    interSeAgreementRequired: '',
    interSeAgreementExecuted: '',
    agreementDate: '',
    coordinatingLeadManagerIntermediaryId: '',
    identifiedResponsibilityGaps: '',
    identifiedOverlaps: '',
    professionalReview: '',
  };
}

export function createEmptyIssueTeamAndIntermediaryMaster(): IssueTeamAndIntermediaryMaster {
  return {
    issueTeamSnapshot: createEmptyIssueTeamSnapshot(),
    intermediaries: [],
    interSeResponsibilities: [],
    interSeAgreement: createEmptyInterSeAgreement(),
  };
}

export function createEmptyIpoSetupLinkedSnapshot(): IpoSetupLinkedSnapshot {
  return {
    targetSmePlatform: '',
    issueMethod: '',
    freshIssue: '',
    ofs: '',
    totalOffer: '',
    faceValue: '',
    proposedFinalIssuePrice: '',
    floorCapPrice: '',
    priceBand: '',
    offerSize: '',
    preIpoPlacement: '',
    reservations: '',
    targetFilingDate: '',
    publicCompanyConversionStatus: '',
    issueStage: '',
  };
}

export function createEmptyCapitalLinkedSnapshot(): CapitalLinkedSnapshot {
  return {
    preIssueShares: '',
    freshIssueShares: '',
    ofsShares: '',
    postIssueShares: '',
    preIssuePaidUpCapital: '',
    postIssuePaidUpCapital: '',
    sellingShareholders: '',
    promoterContribution: '',
    lockInRelatedContext: '',
  };
}

export function createEmptyFilingSnapshot(): FilingSnapshot {
  return {
    snapshotDate: '',
    filingStage: '',
    selectedDesignatedStockExchange: '',
    additionalExchange: '',
    currentOfferDocumentForm: '',
    issueMethodConfirmed: '',
    issueStructureFrozen: '',
    capitalStructureFrozen: '',
    objectsFrozen: '',
    financialsPeriodFrozen: '',
    legalDdCutOffFrozen: '',
    offerDocumentCutOffDate: '',
  };
}

export function createEmptyFilingSnapshotReconciliation(): FilingSnapshotReconciliation {
  return {
    freshIssueShares: '',
    ofsShares: '',
    totalOfferShares: '',
    freshIssueAmount: '',
    ofsAmount: '',
    totalOfferAmount: '',
    marketMakerReservation: '',
    netIssueToPublic: '',
    postIssueShares: '',
    postIssueCapital: '',
    filingConfirmationStatus: '',
    discrepancyNote: '',
    professionalConfirmation: '',
  };
}

export function createEmptyPricing(): Pricing {
  return {
    pricingMethod: '',
    fixedIssuePrice: '',
    floorPrice: '',
    capPrice: '',
    priceBand: '',
    priceBandApprovalDate: '',
    boardPricingCommitteeApproval: '',
    priceDiscoveryPending: '',
    finalIssuePrice: '',
    pricingDate: '',
    basisForIssuePriceReadiness: '',
    professionalConfirmation: '',
  };
}

export function createEmptyInvestorAllocationRecord(): InvestorAllocationRecord {
  return {
    allocationId: newId(),
    category: '',
    applicable: '',
    shares: '',
    percentage: '',
    amount: '',
    sourceRuleBasis: '',
    professionalConfirmation: '',
  };
}

export function createEmptyLotApplicationDetails(): LotApplicationDetails {
  return {
    lotSize: '',
    minimumApplicationLots: '',
    minimumApplicationAmount: '',
    bidMultiples: '',
    cutOffPricePermitted: '',
    investorCategoryDistinctions: '',
    exchangeValidationStatus: '',
    professionalConfirmation: '',
  };
}

export function createEmptyIssueConfigurationAndFilingSnapshot(): IssueConfigurationAndFilingSnapshot {
  return {
    ipoSetupLinkedSnapshot: createEmptyIpoSetupLinkedSnapshot(),
    capitalLinkedSnapshot: createEmptyCapitalLinkedSnapshot(),
    filingSnapshot: createEmptyFilingSnapshot(),
    filingSnapshotReconciliation: createEmptyFilingSnapshotReconciliation(),
    pricing: createEmptyPricing(),
    investorAllocations: [],
    lotApplicationDetails: createEmptyLotApplicationDetails(),
  };
}

export function createEmptyFilingRecord(): FilingRecord {
  return {
    filingId: newId(),
    linkedDocumentVersionId: '',
    documentType: '',
    documentDate: '',
    internalVersion: '',
    filingStage: '',
    status: '',
    authority: '',
    selectedAuthorityExchange: '',
    filingDate: '',
    filingTime: '',
    referenceApplicationNumber: '',
    acknowledgementReceived: '',
    acknowledgementDate: '',
    submittedBy: '',
    responsibleLeadManagerIntermediaryId: '',
    supersededByFilingId: '',
    notes: '',
  };
}

export function createEmptyExchangeDraftFiling(): ExchangeDraftFiling {
  return {
    exchange: '',
    draftFilingDate: '',
    filingChecklistSubmitted: '',
    checklistVersion: '',
    completenessConfirmation: '',
    feesPaid: '',
    feePaymentReference: '',
    filingAcknowledgement: '',
    applicationAccepted: '',
    vettingReviewStarted: '',
    initialQueryDate: '',
    notes: '',
  };
}

export function createEmptyExchangeQueryRecord(): ExchangeQueryRecord {
  return {
    queryId: newId(),
    filingId: '',
    queryRound: '',
    queryReferenceNumber: '',
    queryDate: '',
    category: '',
    questionRequest: '',
    responsibleDwaarWorkstream: '',
    responsibleOwner: '',
    responsibleLeadManagerIntermediaryId: '',
    responseDueDate: '',
    status: '',
    responseDate: '',
    responseSummary: '',
    offerDocumentChangeRequired: '',
    affectedChapterSection: '',
    supportingCertificateRequired: '',
    linkedCertificateId: '',
    closedByExchange: '',
    closureDate: '',
    notes: '',
  };
}

export function createEmptyResubmissionRecord(): ResubmissionRecord {
  return {
    resubmissionId: newId(),
    linkedFilingId: '',
    draftReturned: '',
    returnDate: '',
    returnBasisCategory: '',
    resubmissionPermitted: '',
    requiredChanges: '',
    resubmissionDate: '',
    newFilingId: '',
    exchangeReference: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyInPrincipleApproval(): InPrincipleApproval {
  return {
    applied: '',
    applicationDate: '',
    exchange: '',
    approvalReceived: '',
    approvalLetterDate: '',
    approvalReference: '',
    conditions: '',
    conditionsSatisfied: '',
    outstandingConditions: '',
    validityDate: '',
    nameUsePermissionStatus: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptySebiSmeFilingRecord(): SebiSmeFilingRecord {
  return {
    filingApplicability: '',
    filedThroughLeadManager: '',
    filingDate: '',
    filingReferenceNumber: '',
    linkedFilingId: '',
    documentVersion: '',
    dueDiligenceCertificateIncluded: '',
    smeAdditionalConfirmationFormHIncluded: '',
    displayedOnSebiWebsite: '',
    displayedOnIssuerWebsite: '',
    displayedOnLeadManagerWebsite: '',
    displayedOnSmeExchangeWebsite: '',
    status: '',
    professionalConfirmation: '',
  };
}

export function createEmptyRocFilingRecord(): RocFilingRecord {
  return {
    filingRecordId: '',
    documentType: '',
    boardApprovalStatus: '',
    shareholderAuthorityReference: '',
    filingDate: '',
    rocJurisdiction: '',
    formReferenceSrn: '',
    registrationAcknowledgement: '',
    registrationDate: '',
    finalSignedVersion: '',
    requiredAttachmentsIncluded: '',
    applicableConsentsIncluded: '',
    filingComplete: '',
    professionalLegalReview: '',
    notes: '',
  };
}

export function createEmptyFilingAndRegulatoryMilestoneTracker(): FilingAndRegulatoryMilestoneTracker {
  return {
    filings: [],
    exchangeDraftFiling: createEmptyExchangeDraftFiling(),
    exchangeQueries: [],
    resubmissions: [],
    inPrincipleApproval: createEmptyInPrincipleApproval(),
    sebiSmeFiling: createEmptySebiSmeFilingRecord(),
    rocFiling: createEmptyRocFilingRecord(),
  };
}

export function createEmptyDueDiligenceAreaRecord(): DueDiligenceAreaRecord {
  return {
    dueDiligenceAreaId: newId(),
    area: '',
    sourceWorkstream: '',
    dueDiligenceStarted: '',
    informationProvided: '',
    leadManagerReviewed: '',
    legalCounselReviewed: '',
    auditorReviewed: '',
    independentVerificationPerformed: '',
    siteVisitApplicable: '',
    siteVisitCompleted: '',
    openQueryCount: '',
    materialUnresolvedIssue: '',
    finalSignOff: '',
    signOffDate: '',
    responsibleProfessionalIntermediaryId: '',
    notes: '',
  };
}

export function createEmptyCertificateRecord(): CertificateRecord {
  return {
    certificateId: newId(),
    certificateType: '',
    provider: '',
    linkedIntermediaryId: '',
    certificateDate: '',
    regulationFormReference: '',
    subject: '',
    reportingPeriod: '',
    linkedOfferDocumentVersionId: '',
    documentVersionReviewed: '',
    status: '',
    signed: '',
    udinReference: '',
    qualificationReservationExists: '',
    qualificationDetails: '',
    validityReadinessForCurrentFilingStage: '',
    filedSubmittedTo: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyConsentRecord(): ConsentRecord {
  return {
    consentId: newId(),
    partyType: '',
    linkedPersonIntermediaryId: '',
    displayName: '',
    capacity: '',
    consentRequired: '',
    requested: '',
    requestDate: '',
    received: '',
    consentDate: '',
    wordingVersion: '',
    reference: '',
    linkedOfferDocumentVersionId: '',
    withdrawn: '',
    withdrawalDate: '',
    validForCurrentFilingStage: '',
    includedInFiling: '',
    notes: '',
  };
}

export function createEmptyChapterSignoffRecord(): ChapterSignoffRecord {
  return {
    signoffId: newId(),
    chapterSectionKey: '',
    chapterLabel: '',
    responsibleInternalOwner: '',
    responsibleAdviserIntermediaryId: '',
    informationFrozen: '',
    linkedSourceWorkstreamsReconciled: '',
    legalSignOff: '',
    financialSignOff: '',
    leadManagerSignOff: '',
    managementSignOff: '',
    openCommentCount: '',
    finalSignOff: '',
    finalSignOffDate: '',
    notes: '',
  };
}

export function createEmptyDueDiligenceCertificatesConsentsAndSignoffs(): DueDiligenceCertificatesConsentsAndSignoffs {
  return {
    dueDiligenceAreas: [],
    certificates: [],
    consents: [],
    chapterSignoffs: [],
  };
}

export function createEmptyDepositoryReadiness(): DepositoryReadiness {
  return {
    isin: '',
    isinStatus: '',
    newTemporaryIsinRequirement: '',
    nsdlConnectivityStatus: '',
    cdslConnectivityStatus: '',
    registrarConnectivityStatus: '',
    promoterHoldingsDematerialisedStatus: '',
    existingSpecifiedSecuritiesDematerialisationReadiness: '',
    corporateActionReadiness: '',
    professionalConfirmation: '',
  };
}

export function createEmptyDepositoryAgreement(): DepositoryAgreement {
  return {
    agreementExists: '',
    agreementDate: '',
    issuer: '',
    registrarIntermediaryId: '',
    depository: '',
    reference: '',
    current: '',
    amendmentRequired: '',
    notes: '',
  };
}

export function createEmptyDepositoryAgreements(): DepositoryAgreements {
  return {
    nsdl: createEmptyDepositoryAgreement(),
    cdsl: createEmptyDepositoryAgreement(),
  };
}

export function createEmptyIssueBankRoleRecord(): IssueBankRoleRecord {
  return {
    bankRoleId: newId(),
    intermediaryId: '',
    role: '',
    branch: '',
    applicableRegistrationReference: '',
    agreementDate: '',
    accountSetupStatus: '',
    accountReferenceMaskedIdentifier: '',
    testingCompleted: '',
    testDate: '',
    currentStatus: '',
    notes: '',
  };
}

export function createEmptySponsorBankUpiReadiness(): SponsorBankUpiReadiness {
  return {
    sponsorBankAppointed: '',
    intermediaryId: '',
    agreementExecuted: '',
    upiSetupComplete: '',
    exchangeConnectivityConfirmed: '',
    npciReadinessConfirmed: '',
    testCompleted: '',
    testDate: '',
    operationalContact: '',
    escalationContact: '',
    contingencyProcess: '',
    professionalConfirmation: '',
  };
}

export function createEmptyAsbaConfiguration(): AsbaConfiguration {
  return {
    asbaApplicable: '',
    upiMechanismApplicable: '',
    issueMethod: '',
    bidCollectionConfigurationReviewed: '',
    bidCumApplicationFormReady: '',
    electronicApplicationReadiness: '',
    investorCategoryHandlingReviewed: '',
    technicalRejectionCriteriaReviewed: '',
    panDematBankValidationFlowReviewed: '',
    registrarReconciliationProcessReady: '',
    professionalConfirmation: '',
  };
}

export function createEmptyDepositoriesBankingAsbaUpiAndIssueInfrastructure(): DepositoriesBankingAsbaUpiAndIssueInfrastructure {
  return {
    depositoryReadiness: createEmptyDepositoryReadiness(),
    depositoryAgreements: createEmptyDepositoryAgreements(),
    issueBankRoles: [],
    sponsorBankUpiReadiness: createEmptySponsorBankUpiReadiness(),
    asbaConfiguration: createEmptyAsbaConfiguration(),
  };
}

export function createEmptyUnderwritingSummary(): UnderwritingSummary {
  return {
    issueShares: '',
    issueAmount: '',
    totalUnderwritingCommitment: '',
    totalUnderwritingPercentage: '',
    fullCoverageState: '',
    leadManagerOwnAccountCommitment: '',
    ownAccountPercentage: '',
    underwritingAgreementExecuted: '',
    underwritingAgreementDate: '',
    resourceSufficiencyReview: '',
    professionalConfirmation: '',
  };
}

export function createEmptyUnderwritingCommitmentRecord(): UnderwritingCommitmentRecord {
  return {
    underwritingCommitmentId: newId(),
    intermediaryId: '',
    sharesUnderwritten: '',
    amountUnderwritten: '',
    percentageOfIssue: '',
    ownAccount: '',
    subUnderwritingExists: '',
    subUnderwriterDetails: '',
    conditionalObligation: '',
    commitmentStatus: '',
    agreementReference: '',
    devolvementDefaultMechanism: '',
    notes: '',
  };
}

export function createEmptyNominatedInvestorRecord(): NominatedInvestorRecord {
  return {
    nominatedInvestorId: newId(),
    applicable: '',
    investorName: '',
    linkedIntermediaryEntityId: '',
    investorTypeStatus: '',
    agreementDate: '',
    underwritingRole: '',
    marketMakingRole: '',
    securitiesCount: '',
    value: '',
    exchangePriorApprovalRequired: '',
    approvalRequested: '',
    approvalReceived: '',
    disclosureIncluded: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyMarketMakerConfiguration(): MarketMakerConfiguration {
  return {
    marketMakerIntermediaryId: '',
    exchange: '',
    registrationReference: '',
    agreementDate: '',
    agreementExecuted: '',
    marketMakingCommencementDate: '',
    mandatoryPeriod: '',
    proposedEndDate: '',
    operationalResponsibilitiesReviewed: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyMarketMakerReservation(): MarketMakerReservation {
  return {
    reservedShares: '',
    reservationAmount: '',
    percentage: '',
    issuePrice: '',
    subscriptionResponsibility: '',
    allocationStatus: '',
    inventoryReadiness: '',
    discrepancyWithIpoSetup: '',
    professionalConfirmation: '',
  };
}

export function createEmptyMarketMakingArrangement(): MarketMakingArrangement {
  return {
    quoteObligationsReviewed: '',
    inventorySource: '',
    nominatedInvestorArrangement: '',
    settlementArrangement: '',
    fundingReadiness: '',
    exchangeApprovalStatus: '',
    promoterShareRestrictionsReviewed: '',
    operationalContact: '',
    backupContact: '',
    continuityProcess: '',
    agreementDisclosed: '',
    notes: '',
  };
}

export function createEmptyUnderwritingMarketMakingAndDistributionArrangements(): UnderwritingMarketMakingAndDistributionArrangements {
  return {
    underwritingSummary: createEmptyUnderwritingSummary(),
    underwritingCommitments: [],
    nominatedInvestors: [],
    marketMakerConfiguration: createEmptyMarketMakerConfiguration(),
    marketMakerReservation: createEmptyMarketMakerReservation(),
    marketMakingArrangement: createEmptyMarketMakingArrangement(),
  };
}

export function createEmptyIssueCalendar(): IssueCalendar {
  return {
    priceBandFixedPriceAnnouncementDate: '',
    preIssueAdvertisementDate: '',
    anchorDate: '',
    issueOpeningDate: '',
    issueClosingDate: '',
    bidRevisionDeadline: '',
    upiMandateDeadline: '',
    basisOfAllotmentTarget: '',
    basisApprovalTarget: '',
    fundTransferTarget: '',
    unblockTarget: '',
    shareCreditTarget: '',
    listingApplicationTarget: '',
    tradingApprovalTarget: '',
    listingTradingDate: '',
  };
}

export function createEmptyIssueOpeningReadiness(): IssueOpeningReadiness {
  return {
    rhpProspectusRocFilingReady: '',
    pricingFinalized: '',
    advertisementsReady: '',
    applicationFormsReady: '',
    exchangePlatformReady: '',
    registrarReady: '',
    sponsorBankReady: '',
    bankingInfrastructureReady: '',
    underwritingReady: '',
    marketMakerReady: '',
    consentsCurrent: '',
    certificatesCurrent: '',
    materialDevelopmentsUpdated: '',
    professionalGoLiveConfirmation: '',
  };
}

export function createEmptySubscriptionRowRecord(): SubscriptionRowRecord {
  return {
    subscriptionId: newId(),
    category: '',
    sharesOffered: '',
    applicationCount: '',
    sharesBidApplied: '',
    bidApplicationAmount: '',
    validApplicationCount: '',
    validDemand: '',
    rejectedApplicationCount: '',
    withdrawalCancellationCount: '',
    subscriptionMultiple: '',
    notes: '',
  };
}

export function createEmptyBasisOfAllotment(): BasisOfAllotment {
  return {
    registrarReconciliationComplete: '',
    technicalRejectionsFinalized: '',
    basisPrepared: '',
    basisDate: '',
    exchangeApprovalReceived: '',
    approvalDateTime: '',
    allotmentFinalized: '',
    boardCommitteeApproval: '',
    approvalReference: '',
    allotmentDate: '',
  };
}

export function createEmptyAllotmentSummaryRecord(): AllotmentSummaryRecord {
  return {
    allotmentId: newId(),
    category: '',
    sharesOffered: '',
    validDemand: '',
    sharesAllotted: '',
    numberOfAllottees: '',
    oversubscriptionBasis: '',
    notes: '',
  };
}

export function createEmptyFundsUnblocking(): FundsUnblocking {
  return {
    debitInstructionsIssued: '',
    sponsorBankInstructionsIssued: '',
    scsbInstructionsStatus: '',
    fundsReceived: '',
    publicIssueAccountCredited: '',
    nonAllotteeUnblockComplete: '',
    partialAllotteeUnblockComplete: '',
    exceptions: '',
    delayedUnblockCases: '',
    investorGrievances: '',
    notes: '',
  };
}

export function createEmptyDematCredit(): DematCredit {
  return {
    corporateActionSubmitted: '',
    nsdlConfirmation: '',
    cdslConfirmation: '',
    sharesCredited: '',
    completionDate: '',
    completionTime: '',
    exceptions: '',
  };
}

export function createEmptyListing(): Listing {
  return {
    finalListingApplicationSubmitted: '',
    applicationDateTime: '',
    finalListingChecklistComplete: '',
    exchangeQueries: '',
    tradingApprovalReceived: '',
    tradingNoticeReference: '',
    listingDate: '',
    tradingCommencement: '',
    marketMakingCommenced: '',
    listingCompletionStatus: '',
  };
}

export function createEmptyPostIssueActionRecord(): PostIssueActionRecord {
  return {
    postIssueActionId: newId(),
    actionType: '',
    applicable: '',
    status: '',
    dueDate: '',
    completedDate: '',
    responsibleIntermediaryId: '',
    reference: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyIssueProgrammeAllotmentListingAndPostIssueExecution(): IssueProgrammeAllotmentListingAndPostIssueExecution {
  return {
    issueCalendar: createEmptyIssueCalendar(),
    issueOpeningReadiness: createEmptyIssueOpeningReadiness(),
    subscriptionRows: [],
    basisOfAllotment: createEmptyBasisOfAllotment(),
    allotmentSummaries: [],
    fundsUnblocking: createEmptyFundsUnblocking(),
    dematCredit: createEmptyDematCredit(),
    listing: createEmptyListing(),
    postIssueActions: [],
  };
}

export function createEmptyOfferDocumentVersionRecord(): OfferDocumentVersionRecord {
  return {
    documentVersionId: newId(),
    type: '',
    date: '',
    versionLabel: '',
    filingStage: '',
    filedAuthority: '',
    boardApproved: '',
    signed: '',
    supersedesDocumentVersionId: '',
    currentAuthoritativeVersion: '',
    pageCount: '',
    openPlaceholderCount: '',
    openCommentCount: '',
    chapterSignOffCompletionStatus: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyPlaceholderRecord(): PlaceholderRecord {
  return {
    placeholderId: newId(),
    documentVersionId: '',
    placeholderType: '',
    chapterSection: '',
    description: '',
    responsibleOwner: '',
    sourceWorkstream: '',
    linkedSourceRecord: '',
    targetResolution: '',
    status: '',
    notes: '',
  };
}

export function createEmptyInspectionItemRecord(): InspectionItemRecord {
  return {
    inspectionItemId: newId(),
    itemType: '',
    title: '',
    sourceWorkstream: '',
    linkedSourceRecordId: '',
    date: '',
    parties: '',
    currentVersion: '',
    executedFinal: '',
    inclusionStatus: '',
    inclusionRationale: '',
    exclusionRationale: '',
    available: '',
    format: '',
    inspectionLocation: '',
    inspectionHours: '',
    inspectionStartDate: '',
    inspectionEndDate: '',
    websiteAvailability: '',
    confidentialityConcern: '',
    redactionRequired: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyIssueAgreementRecord(): IssueAgreementRecord {
  return {
    issueAgreementId: newId(),
    type: '',
    linkedIntermediaryIds: [],
    agreementDate: '',
    status: '',
    currentVersion: '',
    filingInspectionRelevance: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyPublicCommunicationRecord(): PublicCommunicationRecord {
  return {
    communicationId: newId(),
    type: '',
    draftDate: '',
    approvalDate: '',
    publicationDate: '',
    publicationChannelsNewspapers: '',
    englishPublication: '',
    hindiPublication: '',
    regionalLanguagePublication: '',
    linkedDocumentVersionId: '',
    leadManagerApproval: '',
    legalApproval: '',
    filedSubmittedWhereRequired: '',
    finalCopyAvailable: '',
    notes: '',
  };
}

export function createEmptyAudiovisualPresentation(): AudiovisualPresentation {
  return {
    applicability: '',
    englishAvReady: '',
    hindiAvReady: '',
    contentApproved: '',
    linkedOfferDocumentVersionId: '',
    published: '',
    publicationPlatformReference: '',
    leadManagerApproval: '',
    professionalConfirmation: '',
  };
}

export function createEmptyMerchantBankerDdRepositoryReadiness(): MerchantBankerDdRepositoryReadiness {
  return {
    repositoryRequirementReviewed: '',
    responsibleLeadManagerIntermediaryId: '',
    uploadProcessStarted: '',
    companyIncorporationDocsComplete: '',
    capitalDocsComplete: '',
    financialDocsComplete: '',
    businessDocsComplete: '',
    legalDocsComplete: '',
    otherRequiredDdSetsComplete: '',
    uploadComplete: '',
    completionDate: '',
    missingRepositoryItems: '',
    professionalConfirmation: '',
  };
}

export function createEmptyIfFinalConfirmations(): IfFinalConfirmations {
  return {
    leadManagerAppointedCurrent: '',
    registrarAppointedCurrent: '',
    legalCounselAppointedCurrent: '',
    auditorsCertifyingProfessionalsEngaged: '',
    applicableIntermediaryRegistrationsReviewed: '',
    interSeResponsibilitiesDocumentedWhereNeeded: '',
    issueBankingArrangementsReady: '',
    sponsorBankReady: '',
    depositoryArrangementsReady: '',
    isinReady: '',
    underwritingArrangementComplete: '',
    applicableSmeUnderwritingCoverageReviewed: '',
    merchantBankerOwnAccountRequirementReviewed: '',
    marketMakerAppointed: '',
    marketMakingAgreementExecuted: '',
    applicableMarketMakingPeriodAddressed: '',
    nominatedInvestorArrangementsDisclosedWhereApplicable: '',
    exchangeFilingChecklistComplete: '',
    openExchangeQueriesAccuratelyShown: '',
    inPrincipleApprovalStatusAccuratelyShown: '',
    sebiSmeFilingStatusAccuratelyShown: '',
    ddCertificatesCurrent: '',
    applicableProfessionalCertificatesCurrent: '',
    intermediaryExpertConsentsCurrent: '',
    rocFilingReadinessReviewed: '',
    issueStructureReconcilesWithIpoSetup: '',
    capitalStructureReconcilesWithCapital: '',
    objectsReconcile: '',
    financialsReconcile: '',
    managementDataReconcile: '',
    groupEntitiesReconcile: '',
    bacMattersReconcile: '',
    lacUpdatedThroughFilingCutOff: '',
    materialDevelopmentsReviewed: '',
    finalInspectionListReviewed: '',
    applicableIssueAgreementsExecutedCurrent: '',
    publicCommunicationsReadinessReviewed: '',
    applicableT3ExecutionPlanReviewed: '',
    unresolvedPlaceholdersAccuratelyShown: '',
    noCriticalFilingItemIntentionallyOmitted: '',
    finalProfessionalLeadManagerLegalAuditorReviewRemainsRequired: '',
  };
}

export function createEmptyFinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness(): FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness {
  return {
    offerDocumentVersions: [],
    placeholders: [],
    inspectionItems: [],
    issueAgreements: [],
    publicCommunications: [],
    audiovisualPresentation: createEmptyAudiovisualPresentation(),
    merchantBankerDdRepositoryReadiness: createEmptyMerchantBankerDdRepositoryReadiness(),
    finalConfirmations: createEmptyIfFinalConfirmations(),
  };
}

export function createEmptyIntermediariesFilingPayload(): IntermediariesFilingPayload {
  return {
    schemaVersion: INTERMEDIARIES_FILING_SCHEMA_VERSION,
    issueTeamAndIntermediaryMaster: createEmptyIssueTeamAndIntermediaryMaster(),
    issueConfigurationAndFilingSnapshot: createEmptyIssueConfigurationAndFilingSnapshot(),
    filingAndRegulatoryMilestoneTracker: createEmptyFilingAndRegulatoryMilestoneTracker(),
    dueDiligenceCertificatesConsentsAndSignoffs:
      createEmptyDueDiligenceCertificatesConsentsAndSignoffs(),
    depositoriesBankingAsbaUpiAndIssueInfrastructure:
      createEmptyDepositoriesBankingAsbaUpiAndIssueInfrastructure(),
    underwritingMarketMakingAndDistributionArrangements:
      createEmptyUnderwritingMarketMakingAndDistributionArrangements(),
    issueProgrammeAllotmentListingAndPostIssueExecution:
      createEmptyIssueProgrammeAllotmentListingAndPostIssueExecution(),
    finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness:
      createEmptyFinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness(),
  };
}
