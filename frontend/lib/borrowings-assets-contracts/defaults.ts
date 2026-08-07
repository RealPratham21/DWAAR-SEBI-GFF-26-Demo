/**
 * Empty-record factories for Borrowings, Assets & Contracts (BAC1).
 */

import type {
  AssetFinancialsReconciliation,
  BacChangeRecord,
  BacConfirmations,
  BorrowingPowers,
  BorrowingSnapshot,
  BorrowingsAssetsContractsPayload,
  BreachDisputeReadinessRecord,
  ChargeRecord,
  ContractMaterialityRecord,
  ContractRecord,
  CovenantRecord,
  CrossDefaultRecord,
  DefaultEventRecord,
  FacilityRecord,
  FinancialCovenantDetails,
  FinancialsReconciliation,
  GroupEntitiesReconciliation,
  CapitalOwnershipReconciliation,
  BusinessOperationsReconciliation,
  GuaranteeRecord,
  InspectionCandidateRecord,
  InsuranceLinkageRecord,
  IpContractualDependencyRecord,
  LenderConsentRecord,
  MaterialAssetRecord,
  NonOrdinaryCourseReviewRecord,
  ObjectsOfIssueRepaymentItem,
  PropertyIssueRecord,
  PropertyRecord,
  RestrictiveCovenantDetails,
  RestructuringEventRecord,
  SecurityRecord,
} from '@/lib/schemas/borrowings-assets-contracts';
import { BORROWINGS_ASSETS_CONTRACTS_SCHEMA_VERSION } from '@/lib/schemas/borrowings-assets-contracts';

function newId(): string {
  return crypto.randomUUID();
}

export function createEmptyBorrowingSnapshot(): BorrowingSnapshot {
  return {
    positionAsOfDate: '',
    reportingCurrency: '',
    displayUnit: '',
    currentBorrowingsExist: '',
    securedBorrowingsExist: '',
    unsecuredBorrowingsExist: '',
    workingCapitalFacilitiesExist: '',
    nonFundBasedFacilitiesExist: '',
    relatedPartyBorrowingsExist: '',
    foreignCurrencyBorrowingsExist: '',
    leaseLiabilitiesExist: '',
    debtSecuritiesNcdsExist: '',
    materialSubsidiaryFacilitiesRelevant: '',
  };
}

export function createEmptyFacilityRecord(): FacilityRecord {
  return {
    id: newId(),
    borrower: {
      borrowerType: '',
      linkedGroupEntityId: '',
      displayName: '',
    },
    lender: {
      lenderName: '',
      lenderType: '',
      branch: '',
      contactReference: '',
      relatedPartyStatus: '',
      linkedGroupEntityId: '',
      linkedRelatedPartyReference: '',
    },
    facilityType: '',
    fundBasedNonFundBased: '',
    securedUnsecured: '',
    sanctionAndUtilisation: {
      sanctionLetterDate: '',
      originalSanctionAmount: '',
      currentSanctionedLimit: '',
      currency: '',
      amountUnit: '',
      firstDisbursementDate: '',
      totalAmountDisbursed: '',
      amountRepaid: '',
      principalOutstanding: '',
      accruedInterest: '',
      totalOutstanding: '',
      undrawnAmount: '',
      currentNonCurrentClassification: '',
      lastBalanceConfirmationDate: '',
      sourceStatus: '',
      notes: '',
    },
    interest: {
      rateType: '',
      benchmark: '',
      benchmarkRate: '',
      spread: '',
      enteredEffectiveRate: '',
      resetFrequency: '',
      nextResetDate: '',
      penalInterest: '',
      defaultInterest: '',
      interestPaymentFrequency: '',
    },
    tenorAndRepayment: {
      facilityStartDate: '',
      maturityDate: '',
      tenor: '',
      moratorium: '',
      repaymentType: '',
      repaymentFrequency: '',
      numberOfInstalments: '',
      nextRepaymentDate: '',
      finalRepaymentDate: '',
      balloonPayment: '',
      repaymentScheduleAvailable: '',
      notes: '',
    },
    purpose: {
      purposes: [],
      exactSanctionPurposeWording: '',
      managementPurposeDescription: '',
    },
    prepayment: {
      prepaymentAllowed: '',
      lenderConsentRequired: '',
      lockIn: '',
      noticePeriod: '',
      prepaymentPremiumPenalty: '',
      percentageOrFormula: '',
      sourceOfFundsRestriction: '',
      ipoProceedsTreatment: '',
      otherConditions: '',
      professionalReviewStatus: '',
    },
  };
}

export function createEmptySecurityRecord(): SecurityRecord {
  return {
    id: newId(),
    linkedFacilityId: '',
    securityProvider: '',
    linkedEntityId: '',
    linkedPersonId: '',
    securityType: '',
    securedObject: '',
    linkedPropertyId: '',
    linkedAssetId: '',
    assetDescription: '',
    chargeRanking: '',
    sharedWithAnotherLender: '',
    otherLenders: '',
    interCreditorAgreement: '',
    chargeHolder: '',
    amountSecured: '',
    maximumSecuredAmount: '',
    notes: '',
  };
}

export function createEmptyChargeRecord(): ChargeRecord {
  return {
    id: newId(),
    linkedSecurityId: '',
    linkedFacilityId: '',
    chargeIdentifier: '',
    creationDate: '',
    modificationDate: '',
    satisfactionDate: '',
    status: '',
    rocFilingTypeReference: '',
    srn: '',
    certificateReceived: '',
    amountSecured: '',
    chargeHolder: '',
    assetDescription: '',
    modificationPending: '',
    satisfactionPending: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyGuaranteeRecord(): GuaranteeRecord {
  return {
    id: newId(),
    guaranteeType: '',
    guarantor: '',
    linkedPromoterDirectorEntityId: '',
    borrower: '',
    beneficiaryLender: '',
    linkedFacilityId: '',
    guaranteeDate: '',
    guaranteeAmountCap: '',
    continuingGuarantee: '',
    expiry: '',
    releaseConditions: '',
    ipoListingReleaseProposed: '',
    lenderConsentRequired: '',
    invocationStatus: '',
    counterGuarantee: '',
    securitySupportingGuarantee: '',
    currentStatus: '',
    relatedPartyStatus: '',
    purpose: '',
    boardApproval: '',
    shareholderApproval: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyBorrowingPowers(): BorrowingPowers {
  return {
    boardBorrowingResolutionExists: '',
    resolutionDateReference: '',
    approvedBorrowingLimit: '',
    shareholderBorrowingApprovalExists: '',
    shareholderResolutionDateReference: '',
    shareholderApprovedLimit: '',
    articlesPermitBorrowing: '',
    lenderImposedBorrowingCap: '',
    authorityState: '',
    notes: '',
  };
}

export function createEmptyFinancialCovenantDetails(): FinancialCovenantDetails {
  return {
    covenantName: '',
    category: '',
    formula: '',
    thresholdOperator: '',
    thresholdValue: '',
    testingFrequency: '',
    latestTestedPeriod: '',
    actualValue: '',
    complianceStatus: '',
    complianceCertificateSubmitted: '',
    curePeriod: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyRestrictiveCovenantDetails(): RestrictiveCovenantDetails {
  return {
    trigger: '',
    consentRequired: '',
    priorIntimationRequired: '',
    threshold: '',
    exceptions: '',
    currentStatus: '',
    notes: '',
  };
}

export function createEmptyCovenantRecord(): CovenantRecord {
  return {
    id: newId(),
    linkedFacilityId: '',
    covenantType: '',
    financialDetails: createEmptyFinancialCovenantDetails(),
    restrictiveDetails: createEmptyRestrictiveCovenantDetails(),
  };
}

export function createEmptyLenderConsentRecord(): LenderConsentRecord {
  return {
    id: newId(),
    linkedFacilityId: '',
    lenderName: '',
    ipoConsentRequirement: '',
    requirementBasis: '',
    consentRequested: '',
    requestDate: '',
    consentReceived: '',
    consentDate: '',
    conditionsAttached: '',
    conditions: '',
    conditionsSatisfied: '',
    expiry: '',
    followUpRequired: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyDefaultEventRecord(): DefaultEventRecord {
  return {
    id: newId(),
    linkedFacilityId: '',
    eventType: '',
    eventDate: '',
    amount: '',
    daysDelayed: '',
    continuingStatus: '',
    cureDate: '',
    penalInterest: '',
    waiverObtained: '',
    waiverDate: '',
    conditions: '',
    auditorInformed: '',
    financialStatementsDisclosureStatus: '',
    notes: '',
  };
}

export function createEmptyRestructuringEventRecord(): RestructuringEventRecord {
  return {
    id: newId(),
    linkedFacilityId: '',
    eventType: '',
    eventDate: '',
    reason: '',
    amount: '',
    concessionHaircut: '',
    currentStatus: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyCrossDefaultRecord(): CrossDefaultRecord {
  return {
    id: newId(),
    linkedFacilityId: '',
    clauseExists: '',
    linkedFacilityIds: [],
    threshold: '',
    trigger: '',
    crossAcceleration: '',
    currentlyTriggered: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyPropertyRecord(): PropertyRecord {
  return {
    id: newId(),
    identity: {
      propertyName: '',
      address: '',
      city: '',
      state: '',
      country: '',
      surveyKhasraPlotNumber: '',
      landArea: '',
      builtUpArea: '',
      areaUnit: '',
      propertyType: '',
      businessPurpose: '',
      linkedBusinessOperationsFacilityId: '',
    },
    occupancyBasis: '',
    ownedDetails: {
      legalOwner: '',
      titleInIssuerName: '',
      acquisitionDate: '',
      seller: '',
      relatedPartyStatus: '',
      acquisitionConsideration: '',
      titleDeedType: '',
      titleDeedDate: '',
      registrationDetails: '',
      mutationStatus: '',
      propertyTaxStatus: '',
      possessionStatus: '',
      encumbered: '',
      linkedSecurityIds: [],
      titleSearchStatus: '',
      titleDefectStatus: '',
      thirdPartyClaimStatus: '',
      professionalTitleReviewStatus: '',
    },
    leasedDetails: {
      lessorLicensor: '',
      linkedRelatedPartyEntityId: '',
      relatedPartyStatus: '',
      agreementType: '',
      agreementDate: '',
      commencement: '',
      expiry: '',
      lockIn: '',
      monthlyAnnualRent: '',
      securityDeposit: '',
      escalation: '',
      renewalOption: '',
      renewalTerms: '',
      noticePeriod: '',
      terminationRights: '',
      subLettingRights: '',
      assignmentRights: '',
      changeOfControlRestriction: '',
      registrationRequirementStatus: '',
      stampDutyStatus: '',
      lessorTitleVerified: '',
      renewalStatus: '',
      notes: '',
    },
  };
}

export function createEmptyPropertyIssueRecord(): PropertyIssueRecord {
  return {
    id: newId(),
    linkedPropertyId: '',
    issueType: '',
    explanation: '',
    readinessState: '',
    remediation: '',
    responsibleOwner: '',
    targetResolutionDate: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyMaterialAssetRecord(): MaterialAssetRecord {
  return {
    id: newId(),
    description: '',
    assetClass: '',
    identificationSerialRegistrationNumber: '',
    location: '',
    linkedPropertyId: '',
    linkedBusinessFacilityId: '',
    legalOwner: '',
    ownershipBasis: '',
    acquisitionDate: '',
    acquisitionCost: '',
    latestBookValue: '',
    operationalStatus: '',
    materialToOperations: '',
    imported: '',
    vendor: '',
    warrantyStatus: '',
    amcStatus: '',
    encumbered: '',
    linkedSecurityIds: [],
    linkedFacilityId: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyAssetFinancialsReconciliation(): AssetFinancialsReconciliation {
  return {
    id: newId(),
    linkedAssetId: '',
    materialAssetRegisterValue: '',
    linkedFinancialsAmount: '',
    difference: '',
    reconciliationStatus: '',
    professionalReconciliationPending: '',
    notes: '',
  };
}

export function createEmptyInsuranceLinkageRecord(): InsuranceLinkageRecord {
  return {
    id: newId(),
    linkedPropertyId: '',
    linkedAssetId: '',
    linkedBusinessOperationsPolicyId: '',
    insurer: '',
    policyType: '',
    coverageAmount: '',
    assetPropertyCovered: '',
    startDate: '',
    expiryDate: '',
    deductible: '',
    lenderLossPayeeClause: '',
    policyAssignedNotedToLender: '',
    coverageStatus: '',
    renewalStatus: '',
    underInsuranceConcern: '',
    notes: '',
  };
}

export function createEmptyIpContractualDependencyRecord(): IpContractualDependencyRecord {
  return {
    id: newId(),
    linkedBusinessOperationsIpRecordId: '',
    ownedLicensed: '',
    licensor: '',
    relatedParty: '',
    exclusiveNonExclusive: '',
    transferable: '',
    term: '',
    termination: '',
    changeOfControl: '',
    encumbered: '',
    securityGranted: '',
    linkedContractId: '',
    notes: '',
  };
}

export function createEmptyContractRecord(): ContractRecord {
  return {
    id: newId(),
    category: '',
    parties: {
      counterparty: '',
      linkedGroupEntityId: '',
      relatedPartyStatus: '',
      role: '',
      jurisdiction: '',
    },
    basicTerms: {
      agreementTitle: '',
      executionDate: '',
      effectiveDate: '',
      expiry: '',
      contractTerm: '',
      autoRenewal: '',
      renewalMechanism: '',
      amendmentHistory: '',
      status: '',
      governingLaw: '',
      disputeResolutionMechanism: '',
      arbitrationSeatJurisdiction: '',
      notes: '',
    },
    commercialImportance: {
      contractValue: '',
      minimumCommitment: '',
      annualRevenueCostAttributable: '',
      percentageOfIssuerRevenueCost: '',
      takeOrPay: '',
      minimumPurchase: '',
      minimumVolume: '',
      exclusivity: '',
      territory: '',
      performanceMilestones: '',
      sla: '',
      pricingMechanism: '',
      escalationMechanism: '',
    },
    rightsAndObligations: {
      materialIssuerObligations: '',
      materialCounterpartyObligations: '',
      conditionsPrecedent: '',
      performanceGuarantee: '',
      warranties: '',
      indemnities: '',
      limitationOfLiability: '',
      liquidatedDamages: '',
      penalties: '',
      securityDeposit: '',
      bankGuaranteePbg: '',
      retention: '',
      insuranceRequirement: '',
      auditRights: '',
      confidentiality: '',
      ipOwnership: '',
      dataRights: '',
      nonCompete: '',
      nonSolicit: '',
      exclusivityClause: '',
      mostFavouredCustomer: '',
      changeInLaw: '',
      forceMajeure: '',
      rightsObligationsNotes: '',
    },
    termination: {
      terminationForConvenience: '',
      terminationForBreach: '',
      insolvencyTermination: '',
      changeOfControlTermination: '',
      ipoListingTrigger: '',
      promoterChangeTrigger: '',
      noticePeriod: '',
      curePeriod: '',
      terminationPayment: '',
      survivalObligations: '',
    },
    assignmentChangeOfControl: {
      assignmentRestricted: '',
      counterpartyConsentRequired: '',
      changeOfControlConsentRequired: '',
      ipoTreatedAsChangeOfControl: '',
      promoterDilutionRestriction: '',
      consentRequested: '',
      consentReceived: '',
      consentDate: '',
      professionalReview: '',
    },
  };
}

export function createEmptyContractMaterialityRecord(): ContractMaterialityRecord {
  return {
    id: newId(),
    linkedContractId: '',
    ordinaryCourse: '',
    materialOperationally: '',
    materialFinancially: '',
    materialDueToDependency: '',
    materialDueToUnusualRightsObligations: '',
    relatedPartyAgreement: '',
    nonOrdinaryCourseAgreement: '',
    enteredWithinPrecedingTwoYears: '',
    stillSubsisting: '',
    potentiallyRelevantToDrhp: '',
    materialityStatus: '',
    professionalMaterialityReview: '',
    notes: '',
  };
}

export function createEmptyNonOrdinaryCourseReviewRecord(): NonOrdinaryCourseReviewRecord {
  return {
    id: newId(),
    linkedContractId: '',
    reasonOutsideOrdinaryCourse: '',
    executionDate: '',
    stillSubsisting: '',
    materialityBasis: '',
    proposedDrhpLocation: '',
    inspectionCandidate: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyBreachDisputeReadinessRecord(): BreachDisputeReadinessRecord {
  return {
    id: newId(),
    linkedContractId: '',
    currentBreach: '',
    historicalMaterialBreach: '',
    counterpartyAllegedIssuerBreach: '',
    issuerAllegedCounterpartyBreach: '',
    noticeReceived: '',
    curePeriodActive: '',
    terminationThreatened: '',
    damagesClaimed: '',
    disputeLitigationExists: '',
    linkedFutureLitigationRecordId: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyInspectionCandidateRecord(): InspectionCandidateRecord {
  return {
    id: newId(),
    linkedContractId: '',
    externalDocumentReference: '',
    candidateType: '',
    sourceWorkstream: '',
    documentDate: '',
    currentVersion: '',
    executedFinal: '',
    inspectionCandidate: '',
    confidentialityConcern: '',
    redactionProfessionalReview: '',
    availabilityStatus: '',
    notes: '',
  };
}

export function createEmptyFinancialsReconciliation(): FinancialsReconciliation {
  return {
    bacFacilityTotal: '',
    financialsValue: '',
    difference: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyObjectsOfIssueRepaymentItem(): ObjectsOfIssueRepaymentItem {
  return {
    id: newId(),
    linkedObjectsOfIssueRecordId: '',
    linkedFacilityId: '',
    lender: '',
    proposedRepayment: '',
    relevantOutstandingAmount: '',
    accruedInterest: '',
    prepaymentPenalty: '',
    lenderConsentNocRequirement: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyGroupEntitiesReconciliation(): GroupEntitiesReconciliation {
  return {
    interCompanyLoansReconciled: '',
    relatedPartyBorrowingsReconciled: '',
    corporateGuaranteesReconciled: '',
    securityCollateralReconciled: '',
    groupDependenciesReconciled: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyCapitalOwnershipReconciliation(): CapitalOwnershipReconciliation {
  return {
    promotersReconciled: '',
    promoterShareholdingReconciled: '',
    pledgedEncumberedSharesReconciled: '',
    guaranteeProvidersReconciled: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyBusinessOperationsReconciliation(): BusinessOperationsReconciliation {
  return {
    facilitiesMapped: '',
    officesMapped: '',
    plantsMapped: '',
    warehousesMapped: '',
    materialMachineryMapped: '',
    ipMapped: '',
    insuranceMapped: '',
    reconciliationStatus: '',
    notes: '',
  };
}

export function createEmptyBacChangeRecord(): BacChangeRecord {
  return {
    id: newId(),
    eventType: '',
    effectiveDate: '',
    relatedRecordType: '',
    relatedRecordId: '',
    previousState: '',
    newState: '',
    reason: '',
    approval: '',
    sourceReference: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyBacConfirmations(): BacConfirmations {
  return {
    allMaterialBorrowingsDisclosed: '',
    fundNonFundFacilitiesIncluded: '',
    securedUnsecuredFacilitiesIncluded: '',
    relatedPartyBorrowingsIncluded: '',
    sanctionOutstandingAmountsCurrent: '',
    repaymentTermsComplete: '',
    prepaymentRestrictionsDisclosed: '',
    allSecuritiesCollateralDisclosed: '',
    personalGuaranteesDisclosed: '',
    corporateGuaranteesDisclosed: '',
    registrableChargesConsidered: '',
    chargeModificationsSatisfactionsDisclosed: '',
    financialCovenantsDisclosed: '',
    restrictiveCovenantsDisclosed: '',
    defaultsDelaysDisclosed: '',
    waiversCuresDisclosed: '',
    crossDefaultsDisclosed: '',
    ipoChangeOfControlLenderConsentRequirementsReviewed: '',
    lenderConsentsAccuratelyShown: '',
    debtProposedForIpoRepaymentReconcilesWithObjects: '',
    materialOwnedPropertiesDisclosed: '',
    materialLeasedLicensedPremisesDisclosed: '',
    relatedPartyPropertyArrangementsDisclosed: '',
    titleLeaseIssuesDisclosed: '',
    materialAssetEncumbrancesDisclosed: '',
    criticalInsuranceLinkageCaptured: '',
    materialContractsDisclosed: '',
    nonOrdinaryCourseMaterialAgreementsConsidered: '',
    expiryRenewalRisksDisclosed: '',
    changeOfControlIpoClausesConsidered: '',
    contractBreachesDisputesIdentified: '',
    linkedWorkstreamDifferencesFlagged: '',
    professionalConfirmationRequired: '',
  };
}

export function createEmptyBorrowingsAssetsContractsPayload(): BorrowingsAssetsContractsPayload {
  return {
    schemaVersion: BORROWINGS_ASSETS_CONTRACTS_SCHEMA_VERSION,
    financialIndebtednessAndFacilityMaster: {
      borrowingSnapshot: createEmptyBorrowingSnapshot(),
      facilities: [],
    },
    securityChargesGuaranteesAndBorrowingPowers: {
      securities: [],
      charges: [],
      guarantees: [],
      borrowingPowers: createEmptyBorrowingPowers(),
    },
    covenantsDefaultsWaiversAndLenderConsents: {
      covenants: [],
      lenderConsents: [],
      defaultEvents: [],
      restructuringEvents: [],
      crossDefaults: [],
    },
    immovablePropertiesAndOccupancyRights: {
      properties: [],
      propertyIssues: [],
    },
    materialAssetsEncumbranceAndInsuranceLinkage: {
      assets: [],
      assetFinancialsReconciliations: [],
      insuranceLinkages: [],
      ipContractualDependencies: [],
    },
    materialBusinessStrategicAndOtherContracts: {
      contracts: [],
    },
    contractMaterialityExpiryAndInspectionReadiness: {
      materialityRecords: [],
      nonOrdinaryCourseReviews: [],
      breachDisputeReadiness: [],
      inspectionCandidates: [],
    },
    reconciliationChangesAndIssuerConfirmations: {
      financialsReconciliation: createEmptyFinancialsReconciliation(),
      objectsOfIssueRepayments: [],
      groupEntitiesReconciliation: createEmptyGroupEntitiesReconciliation(),
      capitalOwnershipReconciliation: createEmptyCapitalOwnershipReconciliation(),
      businessOperationsReconciliation: createEmptyBusinessOperationsReconciliation(),
      changes: [],
      confirmations: createEmptyBacConfirmations(),
    },
  };
}
