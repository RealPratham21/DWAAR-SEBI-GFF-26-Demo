/**
 * Empty-record factories for Group Entities & Related Parties (GR1).
 */

import type {
  CommonPersonRelationshipRecord,
  CommonPursuitRecord,
  CommonPursuitScreening,
  ContractualArrangementRecord,
  EntityClassificationRecord,
  EntityFinancialPeriodSummary,
  EntityFinancialReadinessRecord,
  EntityRecord,
  FrameworkClassification,
  GroupCompanyClassificationReview,
  GroupEntitiesConfirmations,
  GroupEntitiesRelatedPartiesPayload,
  GroupCompanyMaterialityPolicy,
  GroupSnapshot,
  IcdrGroupCompanyDetermination,
  InterCompanyDependencyRecord,
  MaterialityCriterionRecord,
  MaterialSubsidiaryPurposeRecord,
  OtherBusinessInterestRecord,
  OwnershipRelationshipRecord,
  RelatedPartyRelationshipRecord,
  RelationshipChangeRecord,
  RptBalanceRecord,
  RptReadiness,
  RptTransactionRecord,
} from '@/lib/schemas/group-entities-related-parties';
import { GROUP_ENTITIES_SCHEMA_VERSION } from '@/lib/schemas/group-entities-related-parties';

function newId(): string {
  return crypto.randomUUID();
}

export function createEmptyGroupSnapshot(): GroupSnapshot {
  return {
    structureAsOfDate: '',
    holdingParentCompanyExists: '',
    ultimateHoldingCompanyExists: '',
    subsidiariesExist: '',
    stepDownSubsidiariesExist: '',
    associatesExist: '',
    jointVenturesExist: '',
    foreignGroupEntitiesExist: '',
    promoterGroupEntitiesExist: '',
    otherCommonControlEntitiesExist: '',
    historicalEntitiesRelevant: '',
  };
}

export function createEmptyEntityRecord(): EntityRecord {
  return {
    id: newId(),
    entityType: '',
    identity: {
      legalName: '',
      formerName: '',
      displayName: '',
    },
    registration: {
      cin: '',
      llpin: '',
      registrationNumber: '',
      otherIdentifier: '',
      countryOfIncorporation: '',
      state: '',
      incorporationDate: '',
      registeredOffice: '',
      corporateOffice: '',
      website: '',
      financialYearEnd: '',
    },
    status: '',
    listing: {
      listedStatus: '',
      exchange: '',
      securityTypeListed: '',
      listingDate: '',
      delistedStatus: '',
      delistingDate: '',
    },
    businessProfile: {
      principalBusiness: '',
      otherBusinesses: '',
      industry: '',
      productsServices: '',
      geographies: '',
      operationalStatus: '',
      relationshipRelevantFrom: '',
      relationshipRelevantUntil: '',
      notes: '',
    },
    classificationBadges: [],
    currentlyActive: true,
  };
}

export function createEmptyOwnershipRelationshipRecord(): OwnershipRelationshipRecord {
  return {
    id: newId(),
    parentPartyEntityId: '',
    investeeEntityId: '',
    relationshipType: '',
    equityOwnershipPercent: '',
    votingRightsPercent: '',
    economicInterestPercent: '',
    fullyDilutedInterestPercent: '',
    effectiveIndirectInterestPercent: '',
    effectiveFrom: '',
    effectiveUntil: '',
    currentHistorical: '',
    sourceReference: '',
    professionalConfirmationStatus: '',
    rightToAppointRemoveBoard: '',
    boardNominationRights: '',
    vetoRights: '',
    affirmativeVotingRights: '',
    managementControlRights: '',
    jointControlArrangement: '',
    participationInBusinessDecisions: '',
    notes: '',
  };
}

export function createEmptyContractualArrangementRecord(): ContractualArrangementRecord {
  return {
    id: newId(),
    partyEntityIds: [],
    agreementType: '',
    agreementDate: '',
    rightsDescription: '',
    effectiveDate: '',
    expiryDate: '',
    currentStatus: '',
    reference: '',
    notes: '',
  };
}

export function createEmptyCommonPersonRelationshipRecord(): CommonPersonRelationshipRecord {
  return {
    id: newId(),
    relationshipType: '',
    linkedPersonId: '',
    linkedPersonRole: '',
    linkedPersonName: '',
    linkedWorkstreamSource: '',
    entityIds: [],
    notes: '',
  };
}

export function createEmptyEntityClassificationRecord(): EntityClassificationRecord {
  return {
    id: newId(),
    entityId: '',
    classificationType: '',
    currentHistorical: '',
    relevantPeriods: '',
    basis: '',
    ownershipPercent: '',
    votingPercent: '',
    controlSignificantInfluenceBasis: '',
    managementConclusion: '',
    readinessState: '',
    professionalConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptyIcdrGroupCompanyDetermination(): IcdrGroupCompanyDetermination {
  return {
    entityId: '',
    isCompany: '',
    isPromoter: '',
    isCurrentSubsidiary: '',
    rptsDuringRelevantPeriods: '',
    includedInAccountingStandardRptDisclosures: '',
    boardConsidersMaterial: '',
    classificationState: '',
    identificationBasis: '',
    relevantReportingPeriods: '',
    dateFirstIdentified: '',
    boardConfirmationStatus: '',
    boardReference: '',
    notes: '',
  };
}

export function createEmptyGroupCompanyMaterialityPolicy(): GroupCompanyMaterialityPolicy {
  return {
    policyExists: '',
    adopted: '',
    adoptionDate: '',
    boardResolutionReference: '',
    effectiveDate: '',
    lastReviewed: '',
    policyVersion: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyMaterialityCriterionRecord(): MaterialityCriterionRecord {
  return {
    id: newId(),
    metricType: '',
    thresholdType: '',
    thresholdValue: '',
    measurementPeriod: '',
    standaloneConsolidatedBasis: '',
    calculationMethodology: '',
    notes: '',
  };
}

export function createEmptyMaterialSubsidiaryPurposeRecord(): MaterialSubsidiaryPurposeRecord {
  return {
    id: newId(),
    entityId: '',
    purpose: '',
    ruleBasis: '',
    calculationBasis: '',
    relevantPeriod: '',
    result: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyFrameworkClassification(): FrameworkClassification {
  return {
    framework: '',
    related: '',
    basisRationale: '',
    relationshipStartDate: '',
    relationshipEndDate: '',
    relevantFinancialPeriods: '',
    currentHistorical: '',
    professionalConfirmationStatus: '',
  };
}

export function createEmptyRelatedPartyRelationshipRecord(): RelatedPartyRelationshipRecord {
  return {
    id: newId(),
    partyType: '',
    linkedEntityId: '',
    linkedPersonId: '',
    linkedPersonRole: '',
    linkedPersonName: '',
    linkedWorkstreamSource: '',
    relationshipCategory: '',
    frameworkClassifications: [],
    relationshipSourceType: '',
    reference: '',
    notes: '',
  };
}

export function createEmptyRptTransactionRecord(): RptTransactionRecord {
  return {
    id: newId(),
    relatedPartyRelationshipId: '',
    linkedEntityId: '',
    linkedPersonId: '',
    financialPeriod: '',
    transactionDateFrom: '',
    transactionDateTo: '',
    transactionType: '',
    description: '',
    agreementReference: '',
    agreementDate: '',
    transactionValue: '',
    currency: '',
    amountUnit: '',
    pricingBasis: '',
    transferPricingMethodology: '',
    comparableUncontrolledBasis: '',
    armsLengthStatus: '',
    ordinaryCourseOfBusiness: '',
    recurringNonRecurring: '',
    cashNonCash: '',
    auditCommitteeApproval: '',
    omnibusApproval: '',
    boardApproval: '',
    shareholderApproval: '',
    priorSubsequentApproval: '',
    approvalDate: '',
    resolutionReference: '',
    interestedPartyAbstentionStatus: '',
    ratificationRequired: '',
    ratificationStatus: '',
    professionalConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptyRptBalanceRecord(): RptBalanceRecord {
  return {
    id: newId(),
    relatedPartyRelationshipId: '',
    linkedEntityId: '',
    linkedPersonId: '',
    relatedTransactionId: '',
    reportingDate: '',
    reportingPeriod: '',
    balanceType: '',
    openingBalance: '',
    transactionsDuringPeriod: '',
    settlements: '',
    closingBalance: '',
    securedUnsecured: '',
    interestBearing: '',
    interestRate: '',
    repaymentTerms: '',
    dueDate: '',
    doubtfulAmountProvision: '',
    writtenOffAmount: '',
    writtenBackAmount: '',
    sourceReference: '',
    notes: '',
  };
}

export function createEmptyCommonPursuitScreening(): CommonPursuitScreening {
  return {
    entityId: '',
    sameLineOfBusiness: '',
    constitutionalObjectsPermitSameBusiness: '',
    overlappingProductsServices: '',
    sameCustomerSegment: '',
    sameGeography: '',
    sameSuppliers: '',
    sameTenderBiddingOpportunities: '',
    sameDistributionChannels: '',
    sameTechnologyIp: '',
    sameBrand: '',
    sharedEmployeesResources: '',
    sharedPromotersManagement: '',
  };
}

export function createEmptyCommonPursuitRecord(): CommonPursuitRecord {
  return {
    id: newId(),
    entityId: '',
    natureOfOverlap: '',
    productsServicesInvolved: '',
    geography: '',
    customers: '',
    extentOfActualCompetition: '',
    potentialCompetition: '',
    existingRevenueFromOverlappingBusiness: '',
    businessOpportunitiesPotentiallyShared: '',
    historicalConflict: '',
    conflictManagementMechanism: '',
    businessAllocationArrangement: '',
    nonCompeteAgreement: '',
    exclusivityAgreement: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyInterCompanyDependencyRecord(): InterCompanyDependencyRecord {
  return {
    id: newId(),
    entityId: '',
    dependencyType: '',
    description: '',
    annualTransactionValue: '',
    percentageOfIssuerRevenuePurchasesCost: '',
    contractExists: '',
    contractExpiry: '',
    pricingBasis: '',
    alternativesAvailable: '',
    terminationImpact: '',
    linkedBusinessOperationsRecordId: '',
    notes: '',
  };
}

export function createEmptyOtherBusinessInterestRecord(): OtherBusinessInterestRecord {
  return {
    id: newId(),
    entityId: '',
    interestType: '',
    nature: '',
    value: '',
    relevantAgreement: '',
    currentStatus: '',
    notes: '',
  };
}

export function createEmptyEntityFinancialPeriodSummary(): EntityFinancialPeriodSummary {
  return {
    period: '',
    equityShareCapital: '',
    reservesOtherEquity: '',
    netWorth: '',
    revenueTurnover: '',
    totalIncome: '',
    profitLossAfterTax: '',
    eps: '',
    totalBorrowings: '',
    sourceStatus: '',
    auditedStatus: '',
    auditorQualificationPresent: '',
  };
}

export function createEmptyEntityFinancialReadinessRecord(): EntityFinancialReadinessRecord {
  return {
    id: newId(),
    entityId: '',
    financialInformationAvailable: '',
    latestAuditedFinancialYear: '',
    threePriorFinancialYearsAvailable: '',
    auditor: '',
    auditStatus: '',
    source: '',
    financialInformationWebsiteUrl: '',
    websitePublicationStatus: '',
    informationVerified: '',
    entityConfirmationReceived: '',
    professionalReviewStatus: '',
    financialPeriodSummaries: [],
    negativeNetWorth: '',
    lossMaking: '',
    auditorQualification: '',
    goingConcernConcern: '',
    materialDefault: '',
    significantRptDependence: '',
    materialIndebtednessToIssuer: '',
    materialIndebtednessFromIssuer: '',
    listed: '',
    publicIssueMadeHistorically: '',
    rightsIssuePrecedingThreeYears: '',
    listingRefusedHistorically: '',
    securitiesLawViolation: '',
    sebiExchangeProceeding: '',
    wilfulDefaulterConcern: '',
    fraudulentBorrowerConcern: '',
    ibcProceeding: '',
    windingUpPetition: '',
    liquidation: '',
    defunct: '',
    strikeOffApplication: '',
    struckOff: '',
    materialRocDefault: '',
    regulatoryExplanation: '',
    materialLitigationExists: '',
    litigationMatterCount: '',
    litigationAggregateAmount: '',
    couldMateriallyAffectIssuer: '',
    linkedLitigationRecordId: '',
    litigationInformationComplete: '',
    litigationProfessionalConfirmation: '',
    informationRequested: '',
    requestDate: '',
    informationReceived: '',
    informationStatus: '',
    confirmationConsentStatus: '',
    followUpRequired: '',
    publicInformationAvailable: '',
    exemptionReliefPotentiallyRequired: '',
    exemptionApplicationStatusReference: '',
    disclosureLimitation: '',
    riskFactorImplication: '',
    notes: '',
  };
}

export function createEmptyRelationshipChangeRecord(): RelationshipChangeRecord {
  return {
    id: newId(),
    entityId: '',
    linkedPersonId: '',
    eventDate: '',
    eventType: '',
    previousRelationship: '',
    newRelationship: '',
    reason: '',
    transactionInvolved: '',
    accountingTreatment: '',
    relevantReportingPeriods: '',
    boardAcknowledgement: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyGroupCompanyClassificationReview(): GroupCompanyClassificationReview {
  return {
    allRptEntitiesReviewed: '',
    subsidiariesHandledSeparately: '',
    promotersHandledSeparately: '',
    boardMaterialEntitiesConsidered: '',
    materialityPolicyApplied: '',
    boardFinalListApproved: '',
    reviewDate: '',
    merchantBankerProfessionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyRptReadiness(): RptReadiness {
  return {
    completeRptScheduleAvailable: '',
    reconciledWithRestatedFinancialInformation: '',
    outstandingBalancesReconciled: '',
    commitmentsIncluded: '',
    guaranteesSecurityIncluded: '',
    nonCashTransactionsIncluded: '',
    kmpCompensationIncluded: '',
    historicalRelatedPartiesIncluded: '',
    approvalsMapped: '',
    pendingAuditCommitteeAction: '',
    pendingBoardAction: '',
    pendingShareholderAction: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyGroupEntitiesConfirmations(): GroupEntitiesConfirmations {
  return {
    allSubsidiariesDisclosed: '',
    stepDownSubsidiariesDisclosed: '',
    associatesJvsDisclosed: '',
    ultimateParentControlStructureAccurate: '',
    promoterGroupRelationshipsComplete: '',
    accountingStandardRelatedPartiesIdentified: '',
    companiesActRelatedPartiesConsidered: '',
    historicalRelatedPartiesIncluded: '',
    icdrGroupCompaniesIdentified: '',
    subsidiariesPromotersNotDuplicatedAsGroupCompanies: '',
    currentMaterialityPolicyCaptured: '',
    rptRegisterComplete: '',
    outstandingBalancesComplete: '',
    commitmentsComplete: '',
    guaranteesCollateralComplete: '',
    loansAdvancesComplete: '',
    commonPursuitsDisclosed: '',
    groupCompanyDependenciesDisclosed: '',
    competingGroupBusinessesDisclosed: '',
    groupCompanyFinancialInformationCurrent: '',
    negativeNetWorthAuditorConcernsDisclosed: '',
    ibcWindingUpStrikeOffDisclosed: '',
    informationUnavailableFromGroupCompaniesIdentified: '',
    conflictingClassificationsFlagged: '',
    linkedWorkstreamValuesReconciled: '',
    professionalConfirmationRequired: '',
  };
}

export function createEmptyGroupEntitiesRelatedPartiesPayload(): GroupEntitiesRelatedPartiesPayload {
  return {
    schemaVersion: GROUP_ENTITIES_SCHEMA_VERSION,
    groupStructureAndEntityMaster: {
      groupSnapshot: createEmptyGroupSnapshot(),
      entities: [],
    },
    ownershipControlAndRelationshipMapping: {
      ownershipRelationships: [],
      contractualArrangements: [],
      commonPersonRelationships: [],
      notes: '',
    },
    groupCompanyAndMaterialityClassification: {
      entityClassifications: [],
      icdrGroupCompanyDeterminations: [],
      materialityPolicy: createEmptyGroupCompanyMaterialityPolicy(),
      materialityCriteria: [],
      materialSubsidiaryPurposeRecords: [],
    },
    relatedPartyUniverseAndClassification: {
      relatedPartyRelationships: [],
    },
    relatedPartyTransactionsBalancesAndCommitments: {
      transactions: [],
      balances: [],
    },
    commonPursuitsDependenciesAndConflicts: {
      commonPursuitScreenings: [],
      commonPursuitRecords: [],
      interCompanyDependencies: [],
      otherBusinessInterests: [],
    },
    groupEntityFinancialRegulatoryAndLitigationReadiness: {
      entityFinancialReadiness: [],
    },
    changesRptReadinessAndConfirmations: {
      relationshipChanges: [],
      groupCompanyClassificationReview: createEmptyGroupCompanyClassificationReview(),
      rptReadiness: createEmptyRptReadiness(),
      confirmations: createEmptyGroupEntitiesConfirmations(),
    },
  };
}
