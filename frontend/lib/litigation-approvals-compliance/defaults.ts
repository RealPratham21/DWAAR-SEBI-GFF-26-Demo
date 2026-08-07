/**
 * Empty-record factories for Litigation, Approvals & Compliance (LAC1).
 */

import type {
  ApprovalApplicationMetadata,
  ApprovalAuthority,
  ApprovalConditionRecord,
  ApprovalDetails,
  ApprovalHolder,
  ApprovalIdentity,
  ApprovalRecord,
  ApprovalRenewalMetadata,
  ComplianceDomainReviewRecord,
  ComplianceIssueRecord,
  CreditorAggregateInputs,
  CriminalRegulatoryTaxAndEnforcementReadiness,
  CriminalScreeningRecord,
  FacilityApprovalReviewRecord,
  HistoricalPenaltyRecord,
  LacBacReconciliation,
  LacBusinessOperationsReconciliation,
  LacConfirmations,
  LacFinancialsReconciliation,
  LacGroupEntitiesReconciliation,
  LacIpoSetupReconciliation,
  LacManagementGovernanceReconciliation,
  LacObjectsOfIssueReconciliation,
  LegalDdSnapshot,
  LegalPartyReviewRecord,
  LegalUniverseMaterialityPolicyAndPartyMapping,
  LitigationAndProceedingsMaster,
  LitigationApprovalsCompliancePayload,
  LitigationMaterialityPolicy,
  MatterAmounts,
  MatterDatesAndStage,
  MatterForum,
  MatterIdentity,
  MatterMateriality,
  MatterPartyLink,
  MatterRecord,
  MatterStatusOutcome,
  MatterSubjectMatter,
  MaterialCreditorPolicy,
  MaterialCreditorRecord,
  MaterialDevelopmentRecord,
  ProjectApprovalRequirementRecord,
  QualitativeMaterialityCriterion,
  QuantitativeMaterialityCriterion,
  RegulatoryActionRecord,
  RemediationActionRecord,
  SebiExchangeScreeningRecord,
  StatutoryDueRecord,
  TaxProceedingDetail,
} from '@/lib/schemas/litigation-approvals-compliance';
import { LITIGATION_APPROVALS_COMPLIANCE_SCHEMA_VERSION } from '@/lib/schemas/litigation-approvals-compliance';

function newId(): string {
  return crypto.randomUUID();
}

export function createEmptyLegalDdSnapshot(): LegalDdSnapshot {
  return {
    legalDdAsOfDate: '',
    latestLegalSearchUpdateDate: '',
    latestFinancialInformationDate: '',
    targetDrhpFilingDate: '',
    litigationExists: '',
    criminalMattersExist: '',
    taxDisputesExist: '',
    regulatoryStatutoryActionsExist: '',
    civilArbitrationMattersExist: '',
    sebiExchangeActionsExist: '',
    materialApprovalsPending: '',
    expiredApprovalsExist: '',
    knownComplianceExceptionsExist: '',
    materialCreditorDuesExist: '',
    materialDevelopmentsSinceLatestFinancialsExist: '',
  };
}

export function createEmptyLegalPartyReviewRecord(): LegalPartyReviewRecord {
  return {
    legalPartyReviewId: newId(),
    partyCategory: '',
    linkedWorkstream: '',
    linkedPartyId: '',
    displayName: '',
    unresolvedManualReference: '',
    currentHistorical: '',
    legalSearchCompleted: '',
    searchAsOfDate: '',
    managementConfirmationObtained: '',
    externalCounselReviewStatus: '',
    identifiedMatterCount: '',
    notes: '',
  };
}

export function createEmptyLitigationMaterialityPolicy(): LitigationMaterialityPolicy {
  return {
    policyExists: '',
    adopted: '',
    boardApprovalDate: '',
    boardResolutionReference: '',
    effectiveDate: '',
    policyVersion: '',
    lastReviewed: '',
    partiesToWhichPolicyApplies: '',
    legalCounselReview: '',
    brlmProfessionalReview: '',
    notes: '',
  };
}

export function createEmptyQuantitativeMaterialityCriterion(): QuantitativeMaterialityCriterion {
  return {
    materialityCriterionId: newId(),
    metric: '',
    percentageThreshold: '',
    absoluteThreshold: '',
    relevantFinancialPeriod: '',
    standaloneConsolidatedBasis: '',
    formulaMethodology: '',
    linkedFinancialsReference: '',
    sourceFinancialValue: '',
    notes: '',
  };
}

export function createEmptyQualitativeMaterialityCriterion(): QualitativeMaterialityCriterion {
  return {
    qualitativeCriterionId: newId(),
    criterionType: '',
    description: '',
    enabled: '',
    boardPolicyBasis: '',
    notes: '',
  };
}

export function createEmptyLegalUniverseMaterialityPolicyAndPartyMapping(): LegalUniverseMaterialityPolicyAndPartyMapping {
  return {
    legalDdSnapshot: createEmptyLegalDdSnapshot(),
    legalPartyReviews: [],
    litigationMaterialityPolicy: createEmptyLitigationMaterialityPolicy(),
    quantitativeMaterialityCriteria: [],
    qualitativeMaterialityCriteria: [],
  };
}

export function createEmptyMatterPartyLink(): MatterPartyLink {
  return {
    matterPartyLinkId: newId(),
    legalPartyReviewId: '',
    role: '',
  };
}

export function createEmptyMatterIdentity(): MatterIdentity {
  return {
    matterTitle: '',
    internalShortName: '',
    caseReferenceNumber: '',
    category: '',
    direction: '',
  };
}

export function createEmptyMatterForum(): MatterForum {
  return {
    authorityForumName: '',
    forumCategory: '',
    location: '',
    jurisdiction: '',
    bench: '',
    presidingAuthority: '',
  };
}

export function createEmptyMatterDatesAndStage(): MatterDatesAndStage {
  return {
    causeEventDate: '',
    filingInitiationDate: '',
    noticeDate: '',
    admissionDate: '',
    lastHearingActionDate: '',
    nextHearingActionDate: '',
    currentStage: '',
    currentSubsisting: '',
    interimOrderExists: '',
    stayExists: '',
    injunctionExists: '',
    attachmentFreezingOrderExists: '',
    bailStatus: '',
    appealAvailable: '',
    appealFiled: '',
    appealLimitationDeadline: '',
    notes: '',
  };
}

export function createEmptyMatterSubjectMatter(): MatterSubjectMatter {
  return {
    shortFactualBackground: '',
    allegationClaim: '',
    relevantPartyPosition: '',
    reliefSoughtAgainstRelevantParty: '',
    reliefSoughtByRelevantParty: '',
    keyLegalProvisions: '',
    businessActivityAffected: '',
    linkedBusinessRecordId: '',
    linkedBacFacilityId: '',
    linkedBacPropertyId: '',
    linkedBacAssetId: '',
    linkedBacContractId: '',
    linkedApprovalId: '',
    financialPeriodAffected: '',
  };
}

export function createEmptyMatterAmounts(): MatterAmounts {
  return {
    principalClaim: '',
    taxDemand: '',
    interest: '',
    penalty: '',
    fine: '',
    damages: '',
    compensation: '',
    otherExposure: '',
    totalQuantifiedAmount: '',
    amountUnquantifiable: '',
    currency: '',
    amountUnit: '',
    amountDisputed: '',
    amountPaidDepositedUnderProtest: '',
    provisionRecognised: '',
    contingentLiabilityRecognised: '',
    linkedFinancialsReference: '',
  };
}

export function createEmptyMatterStatusOutcome(): MatterStatusOutcome {
  return {
    outcomeStatus: '',
    latestOrderDate: '',
    latestOrderSummary: '',
    nextAction: '',
    responsibleCounsel: '',
    internalOwner: '',
    counselOpinionStatus: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyMatterMateriality(): MatterMateriality {
  return {
    mandatoryCategoryConsideration: '',
    quantitativePolicyRelevance: '',
    qualitativePolicyRelevance: '',
    managementMaterialityPosition: '',
    boardMaterialityDetermination: '',
    professionalReview: '',
    readinessState: '',
    notes: '',
  };
}

export function createEmptyMatterRecord(): MatterRecord {
  return {
    matterId: newId(),
    identity: createEmptyMatterIdentity(),
    matterPartyLinks: [],
    externalParties: [],
    forum: createEmptyMatterForum(),
    datesAndStage: createEmptyMatterDatesAndStage(),
    subjectMatter: createEmptyMatterSubjectMatter(),
    amounts: createEmptyMatterAmounts(),
    statusOutcome: createEmptyMatterStatusOutcome(),
    materiality: createEmptyMatterMateriality(),
  };
}

export function createEmptyLitigationAndProceedingsMaster(): LitigationAndProceedingsMaster {
  return {
    matters: [],
  };
}

export function createEmptyCriminalScreeningRecord(): CriminalScreeningRecord {
  return {
    legalPartyReviewId: '',
    criminalSearchCompleted: '',
    complaintsIdentified: '',
    firsIdentified: '',
    chargeSheetsIdentified: '',
    summonsIdentified: '',
    prosecutionsIdentified: '',
    economicOffenceMattersIdentified: '',
    convictionsIdentified: '',
    acquittalsIdentified: '',
    appealsIdentified: '',
    investigationsIdentified: '',
    linkedMatterIds: [],
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyRegulatoryActionRecord(): RegulatoryActionRecord {
  return {
    regulatoryActionId: newId(),
    matterId: '',
    authority: '',
    affectedPartyLegalReviewId: '',
    actionType: '',
    initiationDate: '',
    lawRegulation: '',
    allegedContravention: '',
    monetaryAmount: '',
    responseSubmitted: '',
    responseDate: '',
    hearingStatus: '',
    orderPassed: '',
    appealFiled: '',
    currentStatus: '',
    remediation: '',
    repeatIssue: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptySebiExchangeScreeningRecord(): SebiExchangeScreeningRecord {
  return {
    legalPartyReviewId: '',
    sebiActionExists: '',
    stockExchangeActionExists: '',
    actionDate: '',
    lastFiveYearRelevance: '',
    outstandingAction: '',
    showCauseNotice: '',
    monetaryPenalty: '',
    debarment: '',
    securitiesMarketRestraint: '',
    settlement: '',
    consentOrder: '',
    adjudication: '',
    appeal: '',
    currentStatus: '',
    linkedMatterId: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyTaxProceedingDetail(): TaxProceedingDetail {
  return {
    matterId: '',
    taxType: '',
    assessmentYearFinancialYear: '',
    authority: '',
    noticeOrderType: '',
    demand: '',
    interest: '',
    penalty: '',
    amountPaid: '',
    preDeposit: '',
    balanceDisputed: '',
    appealLevel: '',
    stayGranted: '',
    linkedFinancialsContingentLiabilityReference: '',
    notes: '',
  };
}

export function createEmptyCriminalRegulatoryTaxAndEnforcementReadiness(): CriminalRegulatoryTaxAndEnforcementReadiness {
  return {
    criminalScreenings: [],
    regulatoryActions: [],
    sebiExchangeScreenings: [],
    taxProceedingDetails: [],
  };
}

export function createEmptyApprovalIdentity(): ApprovalIdentity {
  return {
    approvalLicenceName: '',
    category: '',
  };
}

export function createEmptyApprovalHolder(): ApprovalHolder {
  return {
    holderType: '',
    linkedEntityBusinessFacilityId: '',
    displayName: '',
  };
}

export function createEmptyApprovalAuthority(): ApprovalAuthority {
  return {
    issuingAuthority: '',
    ministryDepartment: '',
    centralStateLocal: '',
    jurisdiction: '',
    officeLocation: '',
  };
}

export function createEmptyApprovalDetails(): ApprovalDetails {
  return {
    licenceRegistrationNumber: '',
    applicationNumber: '',
    issueDate: '',
    effectiveDate: '',
    expiryDate: '',
    perpetualNoExpiry: '',
    renewalFrequency: '',
    scope: '',
    activityAuthorised: '',
    locationSiteCovered: '',
    capacityCovered: '',
    productsCovered: '',
    conditionsSummary: '',
    restrictions: '',
    transferable: '',
    changeOfControlNotificationRequired: '',
    changeOfNameAmendmentRequired: '',
    publicCompanyConversionAmendmentRequired: '',
    currentDocumentVersion: '',
    notes: '',
  };
}

export function createEmptyApprovalApplicationMetadata(): ApprovalApplicationMetadata {
  return {
    applicationDate: '',
    acknowledgementReference: '',
    currentStage: '',
    expectedTimeline: '',
    authorityQueryReceived: '',
    responsePending: '',
    inspectionRequired: '',
    feePaid: '',
    followUpDate: '',
    notes: '',
  };
}

export function createEmptyApprovalRenewalMetadata(): ApprovalRenewalMetadata {
  return {
    renewalDueDate: '',
    renewalApplicationDate: '',
    submittedBeforeExpiry: '',
    continuationPendingRenewal: '',
    renewalAcknowledgement: '',
    currentRenewalStage: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyApprovalRecord(): ApprovalRecord {
  return {
    approvalId: newId(),
    identity: createEmptyApprovalIdentity(),
    holder: createEmptyApprovalHolder(),
    authority: createEmptyApprovalAuthority(),
    details: createEmptyApprovalDetails(),
    status: '',
    applicationMetadata: createEmptyApprovalApplicationMetadata(),
    renewalMetadata: createEmptyApprovalRenewalMetadata(),
  };
}

export function createEmptyApprovalConditionRecord(): ApprovalConditionRecord {
  return {
    conditionId: newId(),
    approvalId: '',
    condition: '',
    category: '',
    frequency: '',
    dueDate: '',
    lastCompletedDate: '',
    complianceStatus: '',
    evidenceReference: '',
    responsibleOwner: '',
    remediation: '',
    targetCompletionDate: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyFacilityApprovalReviewRecord(): FacilityApprovalReviewRecord {
  return {
    facilityApprovalReviewId: newId(),
    linkedBusinessFacilityId: '',
    requiredApprovalCategoriesIdentified: [],
    linkedApprovalIds: [],
    allApprovalsObtained: '',
    applicationsPending: '',
    requiredButNotApplied: '',
    renewalsPending: '',
    conditionsOutstanding: '',
    siteOperationalBeforeRequiredApproval: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyProjectApprovalRequirementRecord(): ProjectApprovalRequirementRecord {
  return {
    projectApprovalRequirementId: newId(),
    linkedObjectsRecordId: '',
    approvalCategory: '',
    linkedApprovalId: '',
    requiredBefore: '',
    applicationTiming: '',
    currentStatus: '',
    expectedCompletion: '',
    criticalPathImpact: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyComplianceDomainReviewRecord(): ComplianceDomainReviewRecord {
  return {
    domainReviewId: newId(),
    domain: '',
    applicable: '',
    responsibleFunction: '',
    externalAdviser: '',
    complianceCalendarExists: '',
    lastInternalReview: '',
    lastProfessionalReview: '',
    knownExceptions: '',
    notes: '',
  };
}

export function createEmptyComplianceIssueRecord(): ComplianceIssueRecord {
  return {
    complianceIssueId: newId(),
    domain: '',
    affectedEntitySitePerson: '',
    linkedDwaarId: '',
    obligation: '',
    lawRuleReference: '',
    dueDate: '',
    actualCompletionDate: '',
    issueType: '',
    identifiedBy: '',
    affectedPeriod: '',
    continuing: '',
    corrected: '',
    correctionDate: '',
    additionalFee: '',
    penalty: '',
    showCauseNoticeExists: '',
    officerInDefault: '',
    compoundingAdjudication: '',
    linkedMatterId: '',
    rootCause: '',
    remediation: '',
    preventiveAction: '',
    owner: '',
    targetResolution: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyStatutoryDueRecord(): StatutoryDueRecord {
  return {
    statutoryDueId: newId(),
    entity: '',
    dueType: '',
    financialPeriod: '',
    amountDue: '',
    dueDate: '',
    amountPaid: '',
    paymentDate: '',
    delayDays: '',
    interest: '',
    penalty: '',
    disputed: '',
    linkedTaxMatterId: '',
    linkedFinancialsReference: '',
    auditorCaroObservation: '',
    remediated: '',
    notes: '',
  };
}

export function createEmptyMaterialCreditorPolicy(): MaterialCreditorPolicy {
  return {
    policyExists: '',
    adopted: '',
    boardDate: '',
    resolutionReference: '',
    thresholdType: '',
    percentage: '',
    absoluteAmount: '',
    relevantFinancialDate: '',
    calculationBasis: '',
    linkedFinancialsReference: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyMaterialCreditorRecord(): MaterialCreditorRecord {
  return {
    creditorId: newId(),
    creditorName: '',
    linkedBusinessSupplierId: '',
    linkedGroupEntityId: '',
    relatedPartyStatus: '',
    msmeStatus: '',
    natureOfSupplyService: '',
    amountOutstanding: '',
    currency: '',
    amountUnit: '',
    ageing: '',
    dueDate: '',
    disputed: '',
    reasonOutstanding: '',
    paymentArrangement: '',
    legalNotice: '',
    linkedMatterId: '',
    notes: '',
  };
}

export function createEmptyCreditorAggregateInputs(): CreditorAggregateInputs {
  return {
    numberOfMsmeCreditors: '',
    msmeOutstandingAmount: '',
    numberOfMaterialCreditors: '',
    materialCreditorAmount: '',
    numberOfOtherCreditors: '',
    otherCreditorAmount: '',
    totalTradePayableReference: '',
    linkedFinancialsTradePayables: '',
    reconciliationDifference: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyHistoricalPenaltyRecord(): HistoricalPenaltyRecord {
  return {
    penaltyId: newId(),
    affectedParty: '',
    authority: '',
    lawRegulation: '',
    eventDate: '',
    contravention: '',
    penaltyFineType: '',
    amount: '',
    paid: '',
    paymentDate: '',
    appeal: '',
    finalStatus: '',
    continuingRestriction: '',
    repeatOccurrence: '',
    linkedMatterId: '',
    notes: '',
  };
}

export function createEmptyMaterialDevelopmentRecord(): MaterialDevelopmentRecord {
  return {
    developmentId: newId(),
    eventDate: '',
    discoveryDate: '',
    category: '',
    description: '',
    linkedWorkstream: '',
    linkedRecordId: '',
    materialityAssessment: '',
    financialImpact: '',
    operationalImpact: '',
    assetImpact: '',
    liabilityImpact: '',
    reputationalImpact: '',
    ipoImpact: '',
    potentialRiskFactorRequirement: '',
    offerDocumentSectionsAffected: '',
    boardConsidered: '',
    counselReview: '',
    brlmProfessionalReview: '',
    disclosureStatus: '',
    notes: '',
  };
}

export function createEmptyLacGroupEntitiesReconciliation(): LacGroupEntitiesReconciliation {
  return {
    relevantGroupEntitiesInLegalDdUniverse: '',
    legalDeclarationDisagreements: '',
    groupEntityMattersRepresented: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyLacManagementGovernanceReconciliation(): LacManagementGovernanceReconciliation {
  return {
    promoterDirectorKmpDeclarationsReconciled: '',
    debarmentDeclarationsReconciled: '',
    criminalRegulatoryDeclarationsReconciled: '',
    eligibilityDeclarationsReconciled: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyLacFinancialsReconciliation(): LacFinancialsReconciliation {
  return {
    litigationAggregateAmount: '',
    financialsContingentLiabilities: '',
    litigationDifference: '',
    taxAggregateAmount: '',
    financialsTaxDisputes: '',
    taxDifference: '',
    provisionsAmount: '',
    financialsProvisions: '',
    provisionsDifference: '',
    creditorTotalsAmount: '',
    financialsTradePayables: '',
    creditorDifference: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyLacBacReconciliation(): LacBacReconciliation {
  return {
    defaultsReconciled: '',
    recallNoticesReconciled: '',
    guaranteeInvocationsReconciled: '',
    lenderDisputesReconciled: '',
    propertyDisputesReconciled: '',
    contractDisputesReconciled: '',
    pendingNocsReconciled: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyLacBusinessOperationsReconciliation(): LacBusinessOperationsReconciliation {
  return {
    facilitiesMapped: '',
    operationsMapped: '',
    licenceApprovalReferencesMapped: '',
    environmentalLabourInformationMapped: '',
    operationalIncidentsMapped: '',
    facilitiesUnderConstructionMapped: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyLacObjectsOfIssueReconciliation(): LacObjectsOfIssueReconciliation {
  return {
    newFacilitiesMapped: '',
    expansionsMapped: '',
    acquisitionsMapped: '',
    newProjectsGeographiesMapped: '',
    approvalPlanReconciled: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyLacIpoSetupReconciliation(): LacIpoSetupReconciliation {
  return {
    debarmentDeclarationsReconciled: '',
    ibcWindingUpDeclarationsReconciled: '',
    seriousProceedingsDeclarationsReconciled: '',
    defaultsDeclarationsReconciled: '',
    regulatoryActionDeclarationsReconciled: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyRemediationActionRecord(): RemediationActionRecord {
  return {
    remediationActionId: newId(),
    linkedRecordType: '',
    linkedRecordId: '',
    actionRequired: '',
    owner: '',
    priority: '',
    targetDate: '',
    dependency: '',
    status: '',
    completionDate: '',
    professionalSignOffRequired: '',
    notes: '',
  };
}

export function createEmptyLacConfirmations(): LacConfirmations {
  return {
    allCriminalProceedingsInvolvingRelevantPartiesDisclosed: '',
    firComplaintProsecutionMattersConsidered: '',
    allMaterialCivilArbitrationProceedingsDisclosed: '',
    currentBoardApprovedLitigationMaterialityPolicyCaptured: '',
    allStatutoryRegulatoryProceedingsDisclosed: '',
    showCauseNoticesConsidered: '',
    inspectionsInvestigationsEnquiriesConsidered: '',
    sebiAndStockExchangeActionsDisclosed: '',
    taxProceedingsComplete: '',
    directTaxTotalsReconciled: '',
    indirectTaxTotalsReconciled: '',
    historicalPenaltiesMaterialRegulatoryActionsDisclosed: '',
    materialSubsidiariesGroupCompaniesIncludedInLegalDd: '',
    allMaterialBusinessApprovalsDisclosed: '',
    approvalExpiriesAccurate: '',
    pendingRenewalApplicationsDisclosed: '',
    requiredButNotAppliedApprovalsDisclosed: '',
    approvalConditionNonCompliancesDisclosed: '',
    materialStatutorySecretarialExceptionsDisclosed: '',
    statutoryDuesDelaysDefaultsDisclosed: '',
    materialCreditorsCaptured: '',
    msmeDuesCaptured: '',
    materialDevelopmentsSinceLatestFinancialsDisclosed: '',
    postPreparationLegalDevelopmentsWillContinueToBeUpdated: '',
    contingentLiabilitiesProvisionsReconciledWithFinancials: '',
    borrowingDefaultLegalMattersReconciledWithBac: '',
    managementLegalDeclarationsReconciled: '',
    groupEntityLegalDeclarationsReconciled: '',
    unresolvedInconsistenciesFlagged: '',
    professionalLegalBrlmSecretarialAccountingConfirmationRequired: '',
  };
}

export function createEmptyLitigationApprovalsCompliancePayload(): LitigationApprovalsCompliancePayload {
  return {
    schemaVersion: LITIGATION_APPROVALS_COMPLIANCE_SCHEMA_VERSION,
    legalUniverseMaterialityPolicyAndPartyMapping:
      createEmptyLegalUniverseMaterialityPolicyAndPartyMapping(),
    litigationAndProceedingsMaster: createEmptyLitigationAndProceedingsMaster(),
    criminalRegulatoryTaxAndEnforcementReadiness:
      createEmptyCriminalRegulatoryTaxAndEnforcementReadiness(),
    governmentRegulatoryAndBusinessApprovalsMaster: {
      approvals: [],
    },
    approvalConditionsFacilityComplianceAndRenewalReadiness: {
      approvalConditions: [],
      facilityApprovalReviews: [],
      projectApprovalRequirements: [],
    },
    corporateStatutoryAndOperationalComplianceExceptions: {
      complianceDomainReviews: [],
      complianceIssues: [],
      statutoryDues: [],
    },
    materialCreditorsPenaltiesAndMaterialDevelopments: {
      materialCreditorPolicy: createEmptyMaterialCreditorPolicy(),
      materialCreditors: [],
      creditorAggregateInputs: createEmptyCreditorAggregateInputs(),
      historicalPenalties: [],
      materialDevelopments: [],
    },
    reconciliationRemediationAndIssuerConfirmations: {
      groupEntitiesReconciliation: createEmptyLacGroupEntitiesReconciliation(),
      managementGovernanceReconciliation: createEmptyLacManagementGovernanceReconciliation(),
      financialsReconciliation: createEmptyLacFinancialsReconciliation(),
      bacReconciliation: createEmptyLacBacReconciliation(),
      businessOperationsReconciliation: createEmptyLacBusinessOperationsReconciliation(),
      objectsOfIssueReconciliation: createEmptyLacObjectsOfIssueReconciliation(),
      ipoSetupReconciliation: createEmptyLacIpoSetupReconciliation(),
      remediationActions: [],
      confirmations: createEmptyLacConfirmations(),
    },
  };
}
