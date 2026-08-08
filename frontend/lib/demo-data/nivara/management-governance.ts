import {
  createEmptyBoardChangeRecord,
  createEmptyCommitteeMember,
  createEmptyCommitteeRecord,
  createEmptyDirectorOfferDocumentInterest,
  createEmptyDirectorRecord,
  createEmptyDirectorRemunerationRecord,
  createEmptyExecutiveAppointmentTerm,
  createEmptyGovernancePolicyRecord,
  createEmptyInterestInIssuerRecord,
  createEmptyKeyPersonDependencyRecord,
  createEmptyKmpSmpRecord,
  createEmptyManagementGovernancePayload,
  createEmptyOrgStructureNode,
} from '@/lib/management-governance/defaults';
import type { ManagementGovernancePayload } from '@/lib/schemas/management-governance';
import {
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IDS,
  NIVARA_PEOPLE,
} from '@/lib/demo-data/nivara/constants';

const NIVARA_AUDIT_COMMITTEE_ID = 'nivara-audit-committee-001';
const NIVARA_GOVERNANCE_POLICY_ID = 'nivara-governance-policy-001';
const NIVARA_DIRECTOR_REMUNERATION_ID = 'nivara-director-remuneration-001';
const NIVARA_EXECUTIVE_TERM_ID = 'nivara-executive-term-001';
const NIVARA_INTEREST_ISSUER_ID = 'nivara-interest-issuer-001';
const NIVARA_OFFER_DOC_INTEREST_ID = 'nivara-offer-doc-interest-001';
const NIVARA_BOARD_CHANGE_ID = 'nivara-board-change-001';
const NIVARA_KEY_PERSON_DEPENDENCY_ID = 'nivara-key-person-dependency-001';

export function createNivaraManagementGovernancePayload(): ManagementGovernancePayload {
  const base = createEmptyManagementGovernancePayload();

  const directorArjun = {
    ...createEmptyDirectorRecord(NIVARA_IDS.director001),
    fullLegalName: NIVARA_PEOPLE.promoter1.name,
    din: NIVARA_PEOPLE.promoter1.din,
    gender: 'male' as const,
    nationality: 'Indian',
    countryOfResidence: 'India',
    occupation: 'Business',
    designation: 'managing-director' as const,
    executiveNonExecutive: 'executive' as const,
    independentStatus: 'no' as const,
    promoterStatus: 'yes' as const,
    nomineeStatus: 'no' as const,
    functionalResponsibility: 'Overall management and strategy',
    dateFirstAppointed: '2019-06-12',
    dateOfCurrentAppointment: '2019-06-12',
    appointmentStatus: 'current' as const,
    boardApprovalDate: '2019-06-01',
    relevantIndustryExperience: 'Precision manufacturing and automotive components',
    briefProfessionalBiography:
      'Co-founder of Nivara Techfab with over 18 years in precision metal fabrication.',
    eligibility: {
      ...createEmptyDirectorRecord().eligibility,
      dinActive: 'yes',
    },
  };

  const directorPriya = {
    ...createEmptyDirectorRecord(NIVARA_IDS.director002),
    fullLegalName: NIVARA_PEOPLE.promoter2.name,
    din: NIVARA_PEOPLE.promoter2.din,
    gender: 'female' as const,
    nationality: 'Indian',
    countryOfResidence: 'India',
    occupation: 'Business',
    designation: 'whole-time-director' as const,
    executiveNonExecutive: 'executive' as const,
    independentStatus: 'no' as const,
    promoterStatus: 'yes' as const,
    nomineeStatus: 'no' as const,
    functionalResponsibility: 'Operations and supply chain',
    dateFirstAppointed: '2019-06-12',
    dateOfCurrentAppointment: '2019-06-12',
    appointmentStatus: 'current' as const,
    boardApprovalDate: '2019-06-01',
    relevantIndustryExperience: 'Automotive supplier operations and quality systems',
    briefProfessionalBiography:
      'Co-founder overseeing plant operations, procurement and OEM customer relationships.',
    eligibility: {
      ...createEmptyDirectorRecord().eligibility,
      dinActive: 'yes',
    },
  };

  const directorRahul = {
    ...createEmptyDirectorRecord(NIVARA_IDS.director003),
    fullLegalName: NIVARA_PEOPLE.director3.name,
    din: NIVARA_PEOPLE.director3.din,
    gender: 'male' as const,
    nationality: 'Indian',
    countryOfResidence: 'India',
    occupation: 'Professional',
    designation: 'non-executive-director' as const,
    executiveNonExecutive: 'non-executive' as const,
    independentStatus: 'no' as const,
    promoterStatus: 'no' as const,
    nomineeStatus: 'no' as const,
    functionalResponsibility: 'Finance oversight and IPO readiness',
    dateFirstAppointed: '2021-04-01',
    dateOfCurrentAppointment: '2021-04-01',
    appointmentStatus: 'current' as const,
    boardApprovalDate: '2021-03-20',
    relevantIndustryExperience: 'SME manufacturing finance and governance',
    briefProfessionalBiography:
      'Non-executive director supporting board governance ahead of proposed NSE Emerge listing.',
    eligibility: {
      ...createEmptyDirectorRecord().eligibility,
      dinActive: 'yes',
    },
  };

  const cfoRecord = {
    ...createEmptyKmpSmpRecord(NIVARA_IDS.kmpCfo),
    fullName: NIVARA_PEOPLE.cfo.name,
    classification: 'kmp' as const,
    designation: 'Chief Financial Officer',
    functionalRole: 'Finance and accounts',
    department: 'Finance',
    joiningDate: '2020-01-15',
    currentRoleAppointmentDate: '2020-01-15',
    employmentType: 'permanent' as const,
    currentStatus: 'current' as const,
    keyResponsibilities: 'Financial reporting, IPO financial due diligence and lender coordination',
    relevantExperience: 'Manufacturing SME finance and statutory compliance',
    briefBiography: 'Appointed CFO to strengthen financial controls ahead of IPO preparation.',
  };

  const csRecord = {
    ...createEmptyKmpSmpRecord(NIVARA_IDS.kmpCs),
    fullName: NIVARA_PEOPLE.companySecretary.name,
    classification: 'kmp' as const,
    designation: 'Company Secretary',
    functionalRole: 'Secretarial and compliance',
    department: 'Legal & Compliance',
    joiningDate: '2020-07-01',
    currentRoleAppointmentDate: '2020-07-01',
    employmentType: 'permanent' as const,
    currentStatus: 'current' as const,
    keyResponsibilities: 'Board secretarial support, ROC filings and IPO documentation coordination',
    relevantExperience: 'Private company secretarial practice and SME listings',
    briefBiography: 'Company Secretary supporting conversion readiness and DRHP governance.',
  };

  const auditCommittee = {
    ...createEmptyCommitteeRecord(NIVARA_AUDIT_COMMITTEE_ID),
    committeeType: 'audit-committee',
    name: 'Audit Committee (pre-listing)',
    applicability: 'required',
    constitutionDate: '2024-10-01',
    boardResolutionReference: 'BR/2024-10/AUD-01',
    activeStatus: 'yes',
    chairpersonDirectorId: NIVARA_IDS.director003,
    members: [
      {
        ...createEmptyCommitteeMember('nivara-audit-committee-member-001'),
        directorId: NIVARA_IDS.director003,
        role: 'chair',
        appointmentDate: '2024-10-01',
        independentStatus: 'no',
        executiveNonExecutive: 'non-executive',
      },
    ],
    termsOfReferenceAdopted: 'yes',
    meetingFrequency: 'Quarterly',
    notes: 'Audit committee constituted ahead of SME platform listing.',
  };

  const directorRemuneration = {
    ...createEmptyDirectorRemunerationRecord(NIVARA_DIRECTOR_REMUNERATION_ID),
    directorId: NIVARA_IDS.director001,
    financialYear: 'FY2024',
    salary: '36',
    totalRemuneration: '36',
    sourceStatus: 'audited-financial-statements',
    notes: 'Managing Director remuneration for FY2024.',
  };

  const executiveAppointmentTerm = {
    ...createEmptyExecutiveAppointmentTerm(NIVARA_EXECUTIVE_TERM_ID),
    directorId: NIVARA_IDS.director001,
    appointmentAgreementExists: 'yes',
    fixedSalary: '36',
    noticePeriod: '3 months',
    term: '3 years',
    boardApproval: 'yes',
    notes: 'Managing Director service terms for IPO readiness disclosure.',
  };

  const interestInIssuer = {
    ...createEmptyInterestInIssuerRecord(NIVARA_INTEREST_ISSUER_ID),
    personId: NIVARA_IDS.promoter001,
    personType: 'director',
    sharesOrOptions: 'Promoter shareholding in issuer equity',
    promoterStatus: 'yes',
    notes: 'Promoter director shareholding disclosed in capital ownership workstream.',
  };

  const directorOfferDocumentInterest = {
    ...createEmptyDirectorOfferDocumentInterest(NIVARA_OFFER_DOC_INTEREST_ID),
    directorId: NIVARA_IDS.director001,
    interestInPromotionFormation: 'no',
    interestInPropertyAcquiredPrecedingTwoYears: 'no',
    interestInPropertyProposedToBeAcquired: 'no',
    notes: 'No offer-document interests identified for managing director.',
  };

  const boardChange = {
    ...createEmptyBoardChangeRecord(NIVARA_BOARD_CHANGE_ID),
    directorId: NIVARA_IDS.director003,
    previousDesignation: '',
    newDesignation: 'non-executive-director',
    event: 'appointment',
    effectiveDate: '2021-04-01',
    reason: 'Board expansion for governance oversight',
    notes: 'Appointment of non-executive director ahead of IPO preparation.',
  };

  const keyPersonDependency = {
    ...createEmptyKeyPersonDependencyRecord(NIVARA_KEY_PERSON_DEPENDENCY_ID),
    personId: NIVARA_IDS.director001,
    role: 'Managing Director',
    natureOfDependency: 'Strategic customer relationships and plant leadership',
    businessAreasAffected: 'Operations, OEM customer retention and capacity expansion',
    replacementDepth: 'Identified internal successor for operations; MD succession under review',
    mitigation: 'Documented succession plan and cross-functional deputy coverage',
    notes: 'Key-person dependency typical for promoter-led SME manufacturer.',
  };

  const governancePolicy = {
    ...createEmptyGovernancePolicyRecord(NIVARA_GOVERNANCE_POLICY_ID),
    policyType: 'related-party-transaction-policy',
    policyName: 'Related Party Transactions Policy',
    applicableStatus: 'required',
    adoptedStatus: 'adopted',
    approvalDate: '2024-08-15',
    approvingBoardOrCommittee: 'Board of Directors',
    effectiveDate: '2024-08-15',
    notes: 'RPT policy adopted for IPO readiness.',
  };

  return {
    ...base,
    boardStructureAndIpoGovernanceReadiness: {
      ...base.boardStructureAndIpoGovernanceReadiness,
      boardSnapshot: {
        ...base.boardStructureAndIpoGovernanceReadiness.boardSnapshot,
        asOfDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        companyStatus: 'private-company',
        currentBoardSize: '3',
        vacantBoardSeats: '0',
        proposedBoardSizeForListing: '5',
        notes: 'Private SME board preparing for NSE Emerge IPO with planned independent director additions.',
      },
      leadership: {
        ...base.boardStructureAndIpoGovernanceReadiness.leadership,
        chairmanDirectorId: NIVARA_IDS.director001,
        chairmanClassification: 'executive',
        managingDirectorDirectorId: NIVARA_IDS.director001,
        wholeTimeDirectorIds: [NIVARA_IDS.director002],
        chairmanAndMdRolesCombined: 'yes',
        combinedRolesBasisApproval: 'Initial incorporation board resolution',
        notes: 'Chairman and Managing Director roles currently combined; reconstitution planned pre-listing.',
      },
      governanceReadiness: {
        ...base.boardStructureAndIpoGovernanceReadiness.governanceReadiness,
        publicCompanyConversion: 'in_progress',
        boardReconstitution: 'in_progress',
        independentDirectorAppointments: 'in_progress',
        womanDirectorAppointment: 'completed',
        residentDirectorRequirement: 'completed',
        boardVacancies: 'not_applicable',
        ipoSpecificBoardApprovals: 'in_progress',
        professionalGovernanceReview: 'professional_confirmation_required',
        notes: 'Governance uplift underway for SME platform listing.',
      },
      ipoCommittee: {
        ...base.boardStructureAndIpoGovernanceReadiness.ipoCommittee,
        constituted: 'yes',
        constitutionDate: '2024-09-15',
        boardResolutionReference: 'BR/2024-09/IPO-01',
        delegatedPowers: 'Oversee IPO timetable, adviser coordination and DRHP preparation',
        chairpersonDirectorId: NIVARA_IDS.director001,
        memberDirectorIds: [NIVARA_IDS.director002, NIVARA_IDS.director003],
        currentStatus: 'active',
      },
    },
    directorsProfilesAppointmentsAndEligibility: {
      ...base.directorsProfilesAppointmentsAndEligibility,
      directors: [directorArjun, directorPriya, directorRahul],
      notes: 'Current promoter-led board with one additional non-executive director.',
    },
    kmpSeniorManagementAndOrganisationStructure: {
      ...base.kmpSeniorManagementAndOrganisationStructure,
      organisationStructure: [
        {
          ...createEmptyOrgStructureNode('nivara-org-structure-md'),
          personId: NIVARA_IDS.director001,
          role: 'Managing Director',
          functionOrBusinessUnit: 'Executive leadership',
          status: 'current',
        },
        {
          ...createEmptyOrgStructureNode('nivara-org-structure-cfo'),
          personId: NIVARA_IDS.kmpCfo,
          role: 'Chief Financial Officer',
          functionOrBusinessUnit: 'Finance',
          reportsToPersonId: NIVARA_IDS.director001,
          status: 'current',
        },
        {
          ...createEmptyOrgStructureNode('nivara-org-structure-cs'),
          personId: NIVARA_IDS.kmpCs,
          role: 'Company Secretary',
          functionOrBusinessUnit: 'Legal & Compliance',
          reportsToPersonId: NIVARA_IDS.director001,
          status: 'current',
        },
      ],
      kmpSmpRecords: [cfoRecord, csRecord],
      kmpRoleReadiness: {
        ...base.kmpSeniorManagementAndOrganisationStructure.kmpRoleReadiness,
        mdCeoManagerWtd: 'completed',
        cfo: 'completed',
        companySecretary: 'completed',
        complianceOfficer: 'in_progress',
        otherBoardDesignatedKmp: 'not_applicable',
      },
      notes: 'CFO and Company Secretary identified as KMP for IPO readiness.',
    },
    boardCommitteesAndGovernanceBodies: {
      ...base.boardCommitteesAndGovernanceBodies,
      committees: [auditCommittee],
      notes: 'Audit committee constituted for pre-listing governance.',
    },
    remunerationServiceContractsEsopsAndBenefits: {
      ...base.remunerationServiceContractsEsopsAndBenefits,
      directorRemuneration: [directorRemuneration],
      executiveAppointmentTerms: [executiveAppointmentTerm],
      esopGovernance: {
        ...base.remunerationServiceContractsEsopsAndBenefits.esopGovernance,
        esopSchemeExists: 'no',
        notes: 'No ESOP scheme currently in place.',
      },
      notes: 'Director remuneration and executive appointment terms captured for IPO disclosure.',
    },
    interestsConflictsAndManagementRelationships: {
      ...base.interestsConflictsAndManagementRelationships,
      interestsInIssuer: [interestInIssuer],
      directorOfferDocumentInterests: [directorOfferDocumentInterest],
      notes: 'Promoter shareholding and offer-document interests disclosed.',
    },
    changesContinuityAndSuccession: {
      ...base.changesContinuityAndSuccession,
      boardChanges: [boardChange],
      successionReadiness: {
        ...base.changesContinuityAndSuccession.successionReadiness,
        formalSuccessionPlan: 'yes',
        criticalRolesIdentified: 'yes',
        mdCeoSuccessionCoverage: 'yes',
        cfoSuccessionCoverage: 'yes',
        companySecretaryComplianceCoverage: 'yes',
        notes: 'Succession planning underway for MD and key management roles.',
      },
      keyPersonDependencies: [keyPersonDependency],
      notes: 'Board change history and key-person dependencies documented.',
    },
    governancePoliciesRptOversightAndConfirmations: {
      ...base.governancePoliciesRptOversightAndConfirmations,
      governancePolicies: [governancePolicy],
      rptGovernance: {
        ...base.governancePoliciesRptOversightAndConfirmations.rptGovernance,
        regulation23ApplicabilityStatus: 'required',
        auditCommitteeProcess: 'documented',
        rptRegisterMaintained: 'yes',
        rptPolicyAdopted: 'yes',
        notes: 'RPT governance framework captured for IPO readiness.',
      },
      boardProcessReadiness: {
        ...base.governancePoliciesRptOversightAndConfirmations.boardProcessReadiness,
        boardMeetingCalendar: 'yes',
        directorAttendanceRecords: 'yes',
        secretarialComplianceProcess: 'yes',
        notes: 'Board process readiness documented ahead of listing.',
      },
      confirmations: {
        currentBoardCompletelyDisclosed: true,
        proposedAppointmentsAndCessationsDisclosed: true,
        directorBiographiesAccurate: true,
        otherDirectorshipsComplete: true,
        eligibilityAndDebarmentDeclarationsComplete: true,
        independentDirectorRelationshipsDisclosed: true,
        allKmpAndSmpIdentified: true,
        organisationStructureComplete: true,
        committeesCompletelyDisclosed: true,
        remunerationAndBenefitsComplete: true,
        serviceContractsAndSpecialCompensationDisclosed: true,
        managementShareholdingAndOptionsDisclosed: true,
        familyRelationshipsDisclosed: true,
        appointmentArrangementsDisclosed: true,
        conflictsAndInterestsDisclosed: true,
        threeYearManagementChangesComplete: true,
        governancePoliciesReflectCurrentStatus: true,
        proposedAppointmentsNotRepresentedAsCompleted: true,
        professionalLegalSecretarialConfirmationRemainsRequired: true,
        rptGovernanceDisclosuresComplete: true,
        boardProcessReadinessCaptured: true,
        governanceApplicabilityProfileReviewed: true,
      },
      notes: 'Governance policies, RPT oversight and confirmations captured for demo.',
    },
  };
}
