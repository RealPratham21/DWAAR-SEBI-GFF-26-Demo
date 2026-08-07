/**
 * Empty-record factories for Management & Governance (Increment M1).
 */

import type {
  BoardChangeRecord,
  BoardCommitteesAndGovernanceBodies,
  BoardLeadership,
  BoardProcessReadiness,
  BoardSnapshot,
  BoardStructureAndIpoGovernanceReadiness,
  ChangesContinuityAndSuccession,
  CommitteeMember,
  CommitteeMeetingRecord,
  CommitteeRecord,
  DirectorEligibility,
  DirectorOfferDocumentInterest,
  DirectorRecord,
  DirectorRemunerationRecord,
  DirectorsProfilesAppointmentsAndEligibility,
  EsopGovernance,
  ExecutiveAppointmentTerm,
  FamilyRelationshipRecord,
  FinancialArrangementRecord,
  GovernancePoliciesRptOversightAndConfirmations,
  GovernancePolicyRecord,
  GovernanceReadiness,
  IndependentDirectorDetails,
  IndependentDirectorPriceBandProcess,
  IncentiveArrangementRecord,
  InterestInIssuerRecord,
  InterestsConflictsAndManagementRelationships,
  IpoCommittee,
  KeyPersonDependencyRecord,
  KmpRoleReadiness,
  KmpSeniorManagementAndOrganisationStructure,
  KmpSmpChangeRecord,
  KmpSmpRecord,
  KmpSmpRemunerationRecord,
  ManagementGovernanceConfirmations,
  ManagementGovernancePayload,
  OrgStructureNode,
  OtherDirectorshipRecord,
  OutsideInterestRecord,
  AppointmentArrangementRecord,
  PreviousEmploymentRecord,
  RemunerationServiceContractsEsopsAndBenefits,
  RptGovernance,
  ServiceContractBenefitRecord,
  SuccessionReadiness,
  VacancyRecord,
} from '@/lib/schemas/management-governance';
import { MANAGEMENT_GOVERNANCE_SCHEMA_VERSION } from '@/lib/schemas/management-governance';

function newId(id?: string): string {
  return id ?? crypto.randomUUID();
}

export function createEmptyDirectorEligibility(): DirectorEligibility {
  return {
    dinActive: '',
    section164DisqualificationConcern: '',
    section164_2Concern: '',
    sebiDebarment: '',
    stockExchangeDebarment: '',
    securitiesMarketRestraint: '',
    relevantConviction: '',
    insolvencyBankruptcyConcern: '',
    directorshipLimitConcern: '',
    requiredConsentDeclarationAvailable: '',
    professionalEligibilityReviewPending: '',
    adverseExplanation: '',
  };
}

export function createEmptyIndependentDirectorDetails(): IndependentDirectorDetails {
  return {
    independenceDeclarationReceived: '',
    section149CriteriaStatus: '',
    promoterRelationship: '',
    relationshipWithDirectorsPromoters: '',
    pecuniaryRelationshipConcern: '',
    employmentAdvisoryRelationshipConcern: '',
    relativeRelationshipConcern: '',
    databankStatus: '',
    proficiencyTestRequirementStatus: '',
    termNumber: '',
    firstTermCommencement: '',
    secondTermApprovalStatus: '',
    coolingOffConcern: '',
    professionalConfirmation: '',
  };
}

export function createEmptyPreviousEmploymentRecord(id?: string): PreviousEmploymentRecord {
  return {
    id: newId(id),
    employerEntity: '',
    position: '',
    fromDate: '',
    toDate: '',
    roleDescription: '',
    relevantExperience: '',
    notes: '',
  };
}

export function createEmptyOtherDirectorshipRecord(id?: string): OtherDirectorshipRecord {
  return {
    id: newId(id),
    entityName: '',
    cinOrRegistrationNumber: '',
    entityListingStatus: '',
    position: '',
    appointmentDate: '',
    independentOrExecutiveStatus: '',
    currentOrCeased: '',
    cessationDate: '',
    committeeMemberships: '',
    notes: '',
  };
}

export function createEmptyDirectorRecord(id?: string): DirectorRecord {
  return {
    id: newId(id),
    fullLegalName: '',
    previousName: '',
    din: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    countryOfResidence: '',
    occupation: '',
    designation: '',
    executiveNonExecutive: '',
    independentStatus: '',
    promoterStatus: '',
    nomineeStatus: '',
    nominationSource: '',
    functionalResponsibility: '',
    dateFirstAppointed: '',
    dateOfCurrentAppointment: '',
    currentTermStart: '',
    currentTermEnd: '',
    liableToRetireByRotation: '',
    appointmentStatus: '',
    boardApprovalDate: '',
    shareholderApprovalDate: '',
    resolutionReference: '',
    dir12FilingStatusReference: '',
    educationalQualifications: '',
    professionalQualifications: '',
    professionalMemberships: '',
    totalExperience: '',
    relevantIndustryExperience: '',
    areasOfExpertise: '',
    currentResponsibilities: '',
    briefProfessionalBiography: '',
    previousEmployment: [],
    otherDirectorships: [],
    eligibility: createEmptyDirectorEligibility(),
    independentDirectorDetails: createEmptyIndependentDirectorDetails(),
    notes: '',
  };
}

export function createEmptyBoardSnapshot(): BoardSnapshot {
  return {
    asOfDate: '',
    companyStatus: '',
    currentBoardSize: '',
    vacantBoardSeats: '',
    proposedBoardSizeForListing: '',
    notes: '',
  };
}

export function createEmptyBoardLeadership(): BoardLeadership {
  return {
    chairmanDirectorId: '',
    chairmanClassification: '',
    managingDirectorDirectorId: '',
    ceoDirectorId: '',
    managerDirectorId: '',
    wholeTimeDirectorIds: [],
    chairmanAndMdRolesCombined: '',
    combinedRolesBasisApproval: '',
    leadIndependentDirectorId: '',
    notes: '',
  };
}

export function createEmptyGovernanceReadiness(): GovernanceReadiness {
  return {
    publicCompanyConversion: '',
    boardReconstitution: '',
    independentDirectorAppointments: '',
    womanDirectorAppointment: '',
    residentDirectorRequirement: '',
    boardVacancies: '',
    ipoSpecificBoardApprovals: '',
    professionalGovernanceReview: '',
    notes: '',
  };
}

export function createEmptyIpoCommittee(): IpoCommittee {
  return {
    constituted: '',
    constitutionDate: '',
    boardResolutionReference: '',
    delegatedPowers: '',
    chairpersonDirectorId: '',
    memberDirectorIds: [],
    currentStatus: '',
    notes: '',
  };
}

export function createEmptyIndependentDirectorPriceBandProcess(): IndependentDirectorPriceBandProcess {
  return {
    requiredApplicabilityStatus: '',
    committeeConstituted: '',
    independentDirectorsInvolved: '',
    recommendationStatus: '',
    recommendationDate: '',
    resolutionReference: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyBoardStructureAndIpoGovernanceReadiness(): BoardStructureAndIpoGovernanceReadiness {
  return {
    boardSnapshot: createEmptyBoardSnapshot(),
    leadership: createEmptyBoardLeadership(),
    governanceReadiness: createEmptyGovernanceReadiness(),
    ipoCommittee: createEmptyIpoCommittee(),
    independentDirectorPriceBandProcess: createEmptyIndependentDirectorPriceBandProcess(),
    notes: '',
  };
}

export function createEmptyDirectorsProfilesAppointmentsAndEligibility(): DirectorsProfilesAppointmentsAndEligibility {
  return {
    directors: [],
    notes: '',
  };
}

export function createEmptyOrgStructureNode(id?: string): OrgStructureNode {
  return {
    id: newId(id),
    personId: '',
    role: '',
    functionOrBusinessUnit: '',
    reportsToPersonId: '',
    boardReportingRelationship: '',
    directReports: [],
    status: '',
    notes: '',
  };
}

export function createEmptyKmpSmpRecord(id?: string): KmpSmpRecord {
  return {
    id: newId(id),
    fullName: '',
    classification: '',
    designation: '',
    functionalRole: '',
    department: '',
    joiningDate: '',
    currentRoleAppointmentDate: '',
    employmentType: '',
    currentStatus: '',
    reportsToPersonId: '',
    keyResponsibilities: '',
    dateOfBirth: '',
    educationalQualifications: '',
    professionalQualifications: '',
    professionalMemberships: '',
    totalExperience: '',
    relevantExperience: '',
    previousEmployment: '',
    briefBiography: '',
    linkedDirectorId: '',
    notes: '',
  };
}

export function createEmptyKmpRoleReadiness(): KmpRoleReadiness {
  return {
    mdCeoManagerWtd: '',
    cfo: '',
    companySecretary: '',
    complianceOfficer: '',
    otherBoardDesignatedKmp: '',
    notes: '',
  };
}

export function createEmptyVacancyRecord(id?: string): VacancyRecord {
  return {
    id: newId(id),
    role: '',
    vacancyDate: '',
    reason: '',
    interimResponsibility: '',
    recruitmentStatus: '',
    expectedFillDate: '',
    boardActionStatus: '',
    notes: '',
  };
}

export function createEmptyFamilyRelationshipRecord(id?: string): FamilyRelationshipRecord {
  return {
    id: newId(id),
    personOneId: '',
    personOneType: '',
    personTwoId: '',
    personTwoType: '',
    relationshipType: '',
    notes: '',
  };
}

export function createEmptyKmpSeniorManagementAndOrganisationStructure(): KmpSeniorManagementAndOrganisationStructure {
  return {
    organisationStructure: [],
    kmpSmpRecords: [],
    kmpRoleReadiness: createEmptyKmpRoleReadiness(),
    vacancies: [],
    familyRelationships: [],
    notes: '',
  };
}

export function createEmptyCommitteeMember(id?: string): CommitteeMember {
  return {
    id: newId(id),
    directorId: '',
    role: '',
    appointmentDate: '',
    cessationDate: '',
    independentStatus: '',
    executiveNonExecutive: '',
    financialLiteracyExpertise: '',
    notes: '',
  };
}

export function createEmptyCommitteeMeetingRecord(id?: string): CommitteeMeetingRecord {
  return {
    id: newId(id),
    meetingDate: '',
    financialYear: '',
    membersEntitled: '',
    membersPresent: '',
    quorumMet: '',
    keyMatterCategory: '',
    minutesApproved: '',
    minutesReference: '',
    notes: '',
  };
}

export function createEmptyCommitteeRecord(id?: string): CommitteeRecord {
  return {
    id: newId(id),
    committeeType: '',
    name: '',
    applicability: '',
    constitutionDate: '',
    boardResolutionReference: '',
    activeStatus: '',
    chairpersonDirectorId: '',
    members: [],
    termsOfReferenceAdopted: '',
    termsOfReferenceDate: '',
    quorumRule: '',
    meetingFrequency: '',
    companySecretaryActsAsSecretary: '',
    professionalReviewStatus: '',
    meetingHistory: [],
    notes: '',
  };
}

export function createEmptyBoardCommitteesAndGovernanceBodies(): BoardCommitteesAndGovernanceBodies {
  return {
    committees: [],
    notes: '',
  };
}

export function createEmptyDirectorRemunerationRecord(id?: string): DirectorRemunerationRecord {
  return {
    id: newId(id),
    directorId: '',
    financialYear: '',
    salary: '',
    commission: '',
    performanceBonus: '',
    sittingFees: '',
    perquisites: '',
    retirementBenefits: '',
    esopShareBasedCompensation: '',
    otherRemuneration: '',
    totalRemuneration: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyExecutiveAppointmentTerm(id?: string): ExecutiveAppointmentTerm {
  return {
    id: newId(id),
    directorId: '',
    appointmentAgreementExists: '',
    fixedSalary: '',
    variablePay: '',
    commission: '',
    performanceLinkedIncentive: '',
    perquisites: '',
    retirementBenefits: '',
    noticePeriod: '',
    severanceTerminationAmount: '',
    term: '',
    nrcApproval: '',
    boardApproval: '',
    shareholderApproval: '',
    specialResolutionStatus: '',
    creditorApprovalWhereRelevant: '',
    scheduleVRelianceStatus: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyKmpSmpRemunerationRecord(id?: string): KmpSmpRemunerationRecord {
  return {
    id: newId(id),
    personId: '',
    financialYear: '',
    fixedCompensation: '',
    variableCompensation: '',
    bonus: '',
    commission: '',
    esopShareBasedBenefits: '',
    otherBenefits: '',
    total: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyIncentiveArrangementRecord(id?: string): IncentiveArrangementRecord {
  return {
    id: newId(id),
    participantPersonId: '',
    arrangementType: '',
    basisOrFormula: '',
    amount: '',
    approval: '',
    vestingPaymentConditions: '',
    terminationTreatment: '',
    notes: '',
  };
}

export function createEmptyServiceContractBenefitRecord(id?: string): ServiceContractBenefitRecord {
  return {
    id: newId(id),
    personId: '',
    employmentAppointmentLetterExists: '',
    additionalServiceAgreement: '',
    retirementBenefitOutsideOrdinaryTerms: '',
    terminationBenefit: '',
    nonCompete: '',
    nonSolicit: '',
    changeOfControlBenefit: '',
    ipoTriggeredPayment: '',
    otherSpecialArrangement: '',
    notes: '',
  };
}

export function createEmptyEsopGovernance(): EsopGovernance {
  return {
    esopSchemeExists: '',
    schemeName: '',
    approvalDate: '',
    nrcAdministration: '',
    directorsParticipating: '',
    kmpSmpParticipating: '',
    ipoTreatmentStatus: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyRemunerationServiceContractsEsopsAndBenefits(): RemunerationServiceContractsEsopsAndBenefits {
  return {
    directorRemuneration: [],
    executiveAppointmentTerms: [],
    kmpSmpRemuneration: [],
    incentiveArrangements: [],
    serviceContractsAndBenefits: [],
    esopGovernance: createEmptyEsopGovernance(),
    notes: '',
  };
}

export function createEmptyInterestInIssuerRecord(id?: string): InterestInIssuerRecord {
  return {
    id: newId(id),
    personId: '',
    personType: '',
    sharesOrOptions: '',
    dividendInterest: '',
    remunerationInterest: '',
    employmentInterest: '',
    promoterStatus: '',
    sellingShareholderStatus: '',
    loanDepositRelationship: '',
    guaranteeRelationship: '',
    otherFinancialInterest: '',
    notes: '',
  };
}

export function createEmptyDirectorOfferDocumentInterest(id?: string): DirectorOfferDocumentInterest {
  return {
    id: newId(id),
    directorId: '',
    interestInPromotionFormation: '',
    interestInPropertyAcquiredPrecedingTwoYears: '',
    interestInPropertyProposedToBeAcquired: '',
    interestThroughFirmEntity: '',
    paymentReceivedForPromotionFormationServices: '',
    natureOfInterest: '',
    amount: '',
    explanation: '',
    notes: '',
  };
}

export function createEmptyOutsideInterestRecord(id?: string): OutsideInterestRecord {
  return {
    id: newId(id),
    personId: '',
    personType: '',
    relatedEntity: '',
    role: '',
    ownershipPercentage: '',
    natureOfBusiness: '',
    competesWithIssuer: '',
    customer: '',
    supplier: '',
    lender: '',
    landlord: '',
    serviceProvider: '',
    materialFinancialRelationship: '',
    relatedPartyStatus: '',
    currentStatus: '',
    explanation: '',
    notes: '',
  };
}

export function createEmptyAppointmentArrangementRecord(id?: string): AppointmentArrangementRecord {
  return {
    id: newId(id),
    personId: '',
    personType: '',
    selectedPursuantToArrangement: '',
    personOrEntity: '',
    relationship: '',
    natureOfArrangement: '',
    arrangementDate: '',
    agreementReference: '',
    continuingRights: '',
    nominationRights: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyFinancialArrangementRecord(id?: string): FinancialArrangementRecord {
  return {
    id: newId(id),
    personId: '',
    personType: '',
    arrangementType: '',
    amount: '',
    outstandingAmount: '',
    relationship: '',
    linkedRptRecordReference: '',
    notes: '',
  };
}

export function createEmptyInterestsConflictsAndManagementRelationships(): InterestsConflictsAndManagementRelationships {
  return {
    interestsInIssuer: [],
    directorOfferDocumentInterests: [],
    outsideInterests: [],
    appointmentArrangements: [],
    financialArrangements: [],
    notes: '',
  };
}

export function createEmptyBoardChangeRecord(id?: string): BoardChangeRecord {
  return {
    id: newId(id),
    directorId: '',
    previousDesignation: '',
    newDesignation: '',
    event: '',
    effectiveDate: '',
    reason: '',
    boardApproval: '',
    shareholderApproval: '',
    filingReference: '',
    replacementAppointed: '',
    notes: '',
  };
}

export function createEmptyKmpSmpChangeRecord(id?: string): KmpSmpChangeRecord {
  return {
    id: newId(id),
    personId: '',
    previousDesignation: '',
    newDesignation: '',
    event: '',
    effectiveDate: '',
    reason: '',
    previousIncumbent: '',
    vacancyPeriod: '',
    interimHolder: '',
    replacementRecruitmentStatus: '',
    boardApproval: '',
    notes: '',
  };
}

export function createEmptySuccessionReadiness(): SuccessionReadiness {
  return {
    formalSuccessionPlan: '',
    criticalRolesIdentified: '',
    emergencySuccessionProcess: '',
    mdCeoSuccessionCoverage: '',
    cfoSuccessionCoverage: '',
    companySecretaryComplianceCoverage: '',
    nrcSuccessionReview: '',
    lastReviewDate: '',
    professionalReview: '',
    notes: '',
  };
}

export function createEmptyKeyPersonDependencyRecord(id?: string): KeyPersonDependencyRecord {
  return {
    id: newId(id),
    personId: '',
    role: '',
    natureOfDependency: '',
    businessAreasAffected: '',
    replacementDepth: '',
    mitigation: '',
    relatedRiskFactorReference: '',
    notes: '',
  };
}

export function createEmptyChangesContinuityAndSuccession(): ChangesContinuityAndSuccession {
  return {
    boardChanges: [],
    kmpSmpChanges: [],
    successionReadiness: createEmptySuccessionReadiness(),
    keyPersonDependencies: [],
    notes: '',
  };
}

export function createEmptyGovernancePolicyRecord(id?: string): GovernancePolicyRecord {
  return {
    id: newId(id),
    policyType: '',
    policyName: '',
    applicableStatus: '',
    adoptedStatus: '',
    approvalDate: '',
    approvingBoardOrCommittee: '',
    effectiveDate: '',
    lastReviewed: '',
    websitePublicationRequirementStatus: '',
    policyOwner: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyRptGovernance(): RptGovernance {
  return {
    regulation23ApplicabilityStatus: '',
    auditCommitteeProcess: '',
    omnibusApprovalFramework: '',
    shareholderApprovalProcess: '',
    relatedPartyAbstentionControlProcess: '',
    materialRptThresholdStatus: '',
    rptRegisterMaintained: '',
    periodicReviewProcess: '',
    rptPolicyAdopted: '',
    outstandingApprovals: '',
    professionalConfirmation: '',
    notes: '',
  };
}

export function createEmptyBoardProcessReadiness(): BoardProcessReadiness {
  return {
    boardMeetingCalendar: '',
    meetingFrequencyReview: '',
    directorAttendanceRecords: '',
    committeeAttendanceRecords: '',
    annualInterestDisclosures: '',
    independentDirectorDeclarations: '',
    directorEvaluationProcess: '',
    boardEvaluation: '',
    committeeEvaluation: '',
    chairpersonEvaluation: '',
    independentDirectorMeetingProcess: '',
    familiarisationProgramme: '',
    doInsurance: '',
    secretarialComplianceProcess: '',
    investorGrievanceEscalationProcess: '',
    notes: '',
  };
}

export function createEmptyManagementGovernanceConfirmations(): ManagementGovernanceConfirmations {
  return {
    currentBoardCompletelyDisclosed: false,
    proposedAppointmentsAndCessationsDisclosed: false,
    directorBiographiesAccurate: false,
    otherDirectorshipsComplete: false,
    eligibilityAndDebarmentDeclarationsComplete: false,
    independentDirectorRelationshipsDisclosed: false,
    allKmpAndSmpIdentified: false,
    organisationStructureComplete: false,
    committeesCompletelyDisclosed: false,
    remunerationAndBenefitsComplete: false,
    serviceContractsAndSpecialCompensationDisclosed: false,
    managementShareholdingAndOptionsDisclosed: false,
    familyRelationshipsDisclosed: false,
    appointmentArrangementsDisclosed: false,
    conflictsAndInterestsDisclosed: false,
    threeYearManagementChangesComplete: false,
    governancePoliciesReflectCurrentStatus: false,
    proposedAppointmentsNotRepresentedAsCompleted: false,
    professionalLegalSecretarialConfirmationRemainsRequired: false,
    rptGovernanceDisclosuresComplete: false,
    boardProcessReadinessCaptured: false,
    governanceApplicabilityProfileReviewed: false,
  };
}

export function createEmptyGovernancePoliciesRptOversightAndConfirmations(): GovernancePoliciesRptOversightAndConfirmations {
  return {
    governancePolicies: [],
    rptGovernance: createEmptyRptGovernance(),
    boardProcessReadiness: createEmptyBoardProcessReadiness(),
    confirmations: createEmptyManagementGovernanceConfirmations(),
    notes: '',
  };
}

export function createEmptyManagementGovernancePayload(): ManagementGovernancePayload {
  return {
    schemaVersion: MANAGEMENT_GOVERNANCE_SCHEMA_VERSION,
    boardStructureAndIpoGovernanceReadiness: createEmptyBoardStructureAndIpoGovernanceReadiness(),
    directorsProfilesAppointmentsAndEligibility:
      createEmptyDirectorsProfilesAppointmentsAndEligibility(),
    kmpSeniorManagementAndOrganisationStructure:
      createEmptyKmpSeniorManagementAndOrganisationStructure(),
    boardCommitteesAndGovernanceBodies: createEmptyBoardCommitteesAndGovernanceBodies(),
    remunerationServiceContractsEsopsAndBenefits:
      createEmptyRemunerationServiceContractsEsopsAndBenefits(),
    interestsConflictsAndManagementRelationships:
      createEmptyInterestsConflictsAndManagementRelationships(),
    changesContinuityAndSuccession: createEmptyChangesContinuityAndSuccession(),
    governancePoliciesRptOversightAndConfirmations:
      createEmptyGovernancePoliciesRptOversightAndConfirmations(),
  };
}
