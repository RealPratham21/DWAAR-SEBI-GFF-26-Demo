/**
 * Canonical Management & Governance payload schema (Increment M1).
 *
 * Contract notes for the backend increment that follows (M2):
 * - Persist `ManagementGovernancePayload` (`schemaVersion: 1`) exactly — same keys, enums, emptiness.
 * - Every monetary amount and percentage is a Decimal-safe STRING.
 *   Empty is `''` (never `null`, never `0`).
 * - Ternary answers use `'' | 'yes' | 'no' | 'not_sure'`. Empty must never be coerced to `'no'`.
 * - Computed values (board counts, continuity metrics, assessment outcomes, applicability profile)
 *   are DERIVED and are never persisted here.
 * - Repeatable records carry stable `id`s generated with `crypto.randomUUID()`.
 * - UI labels live in `lib/management-governance/options.ts` and must never appear in the payload.
 */

import { z } from 'zod';

export const MANAGEMENT_GOVERNANCE_SCHEMA_VERSION = 1 as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

export const YES_NO_NOT_SURE_VALUES = ['yes', 'no', 'not_sure'] as const;
export type YesNoNotSure = (typeof YES_NO_NOT_SURE_VALUES)[number];

export const yesNoNotSureOrEmptySchema = z.enum(['', ...YES_NO_NOT_SURE_VALUES]);
export type YesNoNotSureOrEmpty = z.infer<typeof yesNoNotSureOrEmptySchema>;

export const decimalStringSchema = z.string();
export type DecimalString = z.infer<typeof decimalStringSchema>;

const text = z.string();
const idSchema = z.string().min(1);

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const COMPANY_STATUS_VALUES = [
  'private-company',
  'public-unlisted-company',
  'proposed-listed-public-company',
] as const;
export type CompanyStatus = (typeof COMPANY_STATUS_VALUES)[number];

export const CHAIRMAN_CLASSIFICATION_VALUES = [
  'executive',
  'non-executive',
  'independent',
] as const;
export type ChairmanClassification = (typeof CHAIRMAN_CLASSIFICATION_VALUES)[number];

export const GOVERNANCE_READINESS_STATUS_VALUES = [
  'not_started',
  'in_progress',
  'completed',
  'not_applicable',
  'not_sure',
  'professional_confirmation_required',
] as const;
export type GovernanceReadinessStatus = (typeof GOVERNANCE_READINESS_STATUS_VALUES)[number];

export const APPOINTMENT_STATUS_VALUES = [
  'current',
  'proposed-for-drhp-filing',
  'proposed-before-listing',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

export const DIRECTOR_DESIGNATION_VALUES = [
  'chairman',
  'managing-director',
  'whole-time-director',
  'executive-director',
  'non-executive-director',
  'independent-director',
  'nominee-director',
  'additional-director',
  'other',
] as const;
export type DirectorDesignation = (typeof DIRECTOR_DESIGNATION_VALUES)[number];

export const EXECUTIVE_NON_EXECUTIVE_VALUES = ['executive', 'non-executive'] as const;
export type ExecutiveNonExecutive = (typeof EXECUTIVE_NON_EXECUTIVE_VALUES)[number];

export const GENDER_VALUES = ['male', 'female', 'other', 'prefer-not-to-say'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const ENTITY_LISTING_STATUS_VALUES = [
  'public-listed',
  'public-unlisted',
  'private',
  'other',
] as const;
export type EntityListingStatus = (typeof ENTITY_LISTING_STATUS_VALUES)[number];

export const KMP_CLASSIFICATION_VALUES = ['kmp', 'senior-management', 'both'] as const;
export type KmpClassification = (typeof KMP_CLASSIFICATION_VALUES)[number];

export const EMPLOYMENT_TYPE_VALUES = [
  'permanent',
  'contract',
  'consultant',
  'other',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPE_VALUES)[number];

export const PERSON_STATUS_VALUES = ['current', 'vacant', 'proposed', 'ceased'] as const;
export type PersonStatus = (typeof PERSON_STATUS_VALUES)[number];

export const COMMITTEE_TYPE_VALUES = [
  'audit-committee',
  'nomination-remuneration-committee',
  'stakeholders-relationship-committee',
  'csr-committee',
  'risk-management-committee',
  'ipo-committee',
  'independent-directors-price-band-committee',
  'finance-borrowing-committee',
  'other',
] as const;
export type CommitteeType = (typeof COMMITTEE_TYPE_VALUES)[number];

export const COMMITTEE_APPLICABILITY_VALUES = [
  'required',
  'voluntarily-constituted',
  'potentially-applicable',
  'not-applicable',
  'professional-confirmation-required',
] as const;
export type CommitteeApplicability = (typeof COMMITTEE_APPLICABILITY_VALUES)[number];

export const COMMITTEE_MEMBER_ROLE_VALUES = ['chair', 'member'] as const;
export type CommitteeMemberRole = (typeof COMMITTEE_MEMBER_ROLE_VALUES)[number];

export const FAMILY_RELATIONSHIP_TYPE_VALUES = [
  'spouse',
  'parent',
  'child',
  'sibling',
  'other-statutory-relative',
  'no-relationship',
  'not-sure',
] as const;
export type FamilyRelationshipType = (typeof FAMILY_RELATIONSHIP_TYPE_VALUES)[number];

export const BOARD_CHANGE_EVENT_VALUES = [
  'appointment',
  'reappointment',
  'resignation',
  'cessation',
  'retirement',
  're-designation',
  'death',
  'removal',
  'nominee-withdrawal',
  'other',
] as const;
export type BoardChangeEvent = (typeof BOARD_CHANGE_EVENT_VALUES)[number];

export const GOVERNANCE_POLICY_TYPE_VALUES = [
  'nomination-remuneration-policy',
  'related-party-transaction-policy',
  'code-of-conduct-board-senior-management',
  'vigil-mechanism-whistleblower-policy',
  'insider-trading-code',
  'code-of-fair-disclosure',
  'materiality-policy',
  'document-preservation-policy',
  'independent-director-familiarisation-programme',
  'board-diversity-policy',
  'succession-policy',
  'risk-management-framework',
  'csr-policy',
  'posh-policy',
  'investor-grievance-mechanism',
  'other',
] as const;
export type GovernancePolicyType = (typeof GOVERNANCE_POLICY_TYPE_VALUES)[number];

export const POLICY_ADOPTED_STATUS_VALUES = [
  'adopted',
  'draft',
  'under-review',
  'not-adopted',
  'not-applicable',
  'professional-confirmation-required',
] as const;
export type PolicyAdoptedStatus = (typeof POLICY_ADOPTED_STATUS_VALUES)[number];

export const SOURCE_STATUS_VALUES = [
  'audited-financial-statements',
  'annual-report',
  'board-resolution',
  'management-estimate',
  'pending-confirmation',
  'not-available',
] as const;
export type SourceStatus = (typeof SOURCE_STATUS_VALUES)[number];

/* -------------------------------------------------------------------------- */
/* 1. Board structure & IPO governance readiness                               */
/* -------------------------------------------------------------------------- */

export const boardSnapshotSchema = z.object({
  asOfDate: text,
  companyStatus: z.enum(['', ...COMPANY_STATUS_VALUES]),
  currentBoardSize: decimalStringSchema,
  vacantBoardSeats: decimalStringSchema,
  proposedBoardSizeForListing: decimalStringSchema,
  notes: text,
});
export type BoardSnapshot = z.infer<typeof boardSnapshotSchema>;

export const boardLeadershipSchema = z.object({
  chairmanDirectorId: text,
  chairmanClassification: z.enum(['', ...CHAIRMAN_CLASSIFICATION_VALUES]),
  managingDirectorDirectorId: text,
  ceoDirectorId: text,
  managerDirectorId: text,
  wholeTimeDirectorIds: z.array(text),
  chairmanAndMdRolesCombined: yesNoNotSureOrEmptySchema,
  combinedRolesBasisApproval: text,
  leadIndependentDirectorId: text,
  notes: text,
});
export type BoardLeadership = z.infer<typeof boardLeadershipSchema>;

export const governanceReadinessSchema = z.object({
  publicCompanyConversion: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  boardReconstitution: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  independentDirectorAppointments: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  womanDirectorAppointment: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  residentDirectorRequirement: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  boardVacancies: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  ipoSpecificBoardApprovals: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  professionalGovernanceReview: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  notes: text,
});
export type GovernanceReadiness = z.infer<typeof governanceReadinessSchema>;

export const ipoCommitteeSchema = z.object({
  constituted: yesNoNotSureOrEmptySchema,
  constitutionDate: text,
  boardResolutionReference: text,
  delegatedPowers: text,
  chairpersonDirectorId: text,
  memberDirectorIds: z.array(text),
  currentStatus: text,
  notes: text,
});
export type IpoCommittee = z.infer<typeof ipoCommitteeSchema>;

export const independentDirectorPriceBandProcessSchema = z.object({
  requiredApplicabilityStatus: z.enum(['', ...COMMITTEE_APPLICABILITY_VALUES]),
  committeeConstituted: yesNoNotSureOrEmptySchema,
  independentDirectorsInvolved: text,
  recommendationStatus: text,
  recommendationDate: text,
  resolutionReference: text,
  professionalConfirmation: text,
  notes: text,
});
export type IndependentDirectorPriceBandProcess = z.infer<
  typeof independentDirectorPriceBandProcessSchema
>;

export const boardStructureAndIpoGovernanceReadinessSchema = z.object({
  boardSnapshot: boardSnapshotSchema,
  leadership: boardLeadershipSchema,
  governanceReadiness: governanceReadinessSchema,
  ipoCommittee: ipoCommitteeSchema,
  independentDirectorPriceBandProcess: independentDirectorPriceBandProcessSchema,
  notes: text,
});
export type BoardStructureAndIpoGovernanceReadiness = z.infer<
  typeof boardStructureAndIpoGovernanceReadinessSchema
>;

/* -------------------------------------------------------------------------- */
/* 2. Directors — profiles, appointments & eligibility                         */
/* -------------------------------------------------------------------------- */

export const previousEmploymentRecordSchema = z.object({
  id: idSchema,
  employerEntity: text,
  position: text,
  fromDate: text,
  toDate: text,
  roleDescription: text,
  relevantExperience: text,
  notes: text,
});
export type PreviousEmploymentRecord = z.infer<typeof previousEmploymentRecordSchema>;

export const otherDirectorshipRecordSchema = z.object({
  id: idSchema,
  entityName: text,
  cinOrRegistrationNumber: text,
  entityListingStatus: z.enum(['', ...ENTITY_LISTING_STATUS_VALUES]),
  position: text,
  appointmentDate: text,
  independentOrExecutiveStatus: text,
  currentOrCeased: z.enum(['', 'current', 'ceased']),
  cessationDate: text,
  committeeMemberships: text,
  notes: text,
});
export type OtherDirectorshipRecord = z.infer<typeof otherDirectorshipRecordSchema>;

export const directorEligibilitySchema = z.object({
  dinActive: yesNoNotSureOrEmptySchema,
  section164DisqualificationConcern: yesNoNotSureOrEmptySchema,
  section164_2Concern: yesNoNotSureOrEmptySchema,
  sebiDebarment: yesNoNotSureOrEmptySchema,
  stockExchangeDebarment: yesNoNotSureOrEmptySchema,
  securitiesMarketRestraint: yesNoNotSureOrEmptySchema,
  relevantConviction: yesNoNotSureOrEmptySchema,
  insolvencyBankruptcyConcern: yesNoNotSureOrEmptySchema,
  directorshipLimitConcern: yesNoNotSureOrEmptySchema,
  requiredConsentDeclarationAvailable: yesNoNotSureOrEmptySchema,
  professionalEligibilityReviewPending: yesNoNotSureOrEmptySchema,
  adverseExplanation: text,
});
export type DirectorEligibility = z.infer<typeof directorEligibilitySchema>;

export const independentDirectorDetailsSchema = z.object({
  independenceDeclarationReceived: yesNoNotSureOrEmptySchema,
  section149CriteriaStatus: text,
  promoterRelationship: yesNoNotSureOrEmptySchema,
  relationshipWithDirectorsPromoters: text,
  pecuniaryRelationshipConcern: yesNoNotSureOrEmptySchema,
  employmentAdvisoryRelationshipConcern: yesNoNotSureOrEmptySchema,
  relativeRelationshipConcern: yesNoNotSureOrEmptySchema,
  databankStatus: text,
  proficiencyTestRequirementStatus: text,
  termNumber: decimalStringSchema,
  firstTermCommencement: text,
  secondTermApprovalStatus: text,
  coolingOffConcern: yesNoNotSureOrEmptySchema,
  professionalConfirmation: text,
});
export type IndependentDirectorDetails = z.infer<typeof independentDirectorDetailsSchema>;

export const directorRecordSchema = z.object({
  id: idSchema,
  fullLegalName: text,
  previousName: text,
  din: text,
  dateOfBirth: text,
  gender: z.enum(['', ...GENDER_VALUES]),
  nationality: text,
  countryOfResidence: text,
  occupation: text,
  designation: z.enum(['', ...DIRECTOR_DESIGNATION_VALUES]),
  executiveNonExecutive: z.enum(['', ...EXECUTIVE_NON_EXECUTIVE_VALUES]),
  independentStatus: yesNoNotSureOrEmptySchema,
  promoterStatus: yesNoNotSureOrEmptySchema,
  nomineeStatus: yesNoNotSureOrEmptySchema,
  nominationSource: text,
  functionalResponsibility: text,
  dateFirstAppointed: text,
  dateOfCurrentAppointment: text,
  currentTermStart: text,
  currentTermEnd: text,
  liableToRetireByRotation: yesNoNotSureOrEmptySchema,
  appointmentStatus: z.enum(['', ...APPOINTMENT_STATUS_VALUES]),
  boardApprovalDate: text,
  shareholderApprovalDate: text,
  resolutionReference: text,
  dir12FilingStatusReference: text,
  educationalQualifications: text,
  professionalQualifications: text,
  professionalMemberships: text,
  totalExperience: text,
  relevantIndustryExperience: text,
  areasOfExpertise: text,
  currentResponsibilities: text,
  briefProfessionalBiography: text,
  previousEmployment: z.array(previousEmploymentRecordSchema),
  otherDirectorships: z.array(otherDirectorshipRecordSchema),
  eligibility: directorEligibilitySchema,
  independentDirectorDetails: independentDirectorDetailsSchema,
  notes: text,
});
export type DirectorRecord = z.infer<typeof directorRecordSchema>;

export const directorsProfilesAppointmentsAndEligibilitySchema = z.object({
  directors: z.array(directorRecordSchema),
  notes: text,
});
export type DirectorsProfilesAppointmentsAndEligibility = z.infer<
  typeof directorsProfilesAppointmentsAndEligibilitySchema
>;

/* -------------------------------------------------------------------------- */
/* 3. KMP, senior management & organisation structure                           */
/* -------------------------------------------------------------------------- */

export const orgStructureNodeSchema = z.object({
  id: idSchema,
  personId: text,
  role: text,
  functionOrBusinessUnit: text,
  reportsToPersonId: text,
  boardReportingRelationship: text,
  directReports: z.array(text),
  status: z.enum(['', ...PERSON_STATUS_VALUES]),
  notes: text,
});
export type OrgStructureNode = z.infer<typeof orgStructureNodeSchema>;

export const kmpSmpRecordSchema = z.object({
  id: idSchema,
  fullName: text,
  classification: z.enum(['', ...KMP_CLASSIFICATION_VALUES]),
  designation: text,
  functionalRole: text,
  department: text,
  joiningDate: text,
  currentRoleAppointmentDate: text,
  employmentType: z.enum(['', ...EMPLOYMENT_TYPE_VALUES]),
  currentStatus: z.enum(['', ...PERSON_STATUS_VALUES]),
  reportsToPersonId: text,
  keyResponsibilities: text,
  dateOfBirth: text,
  educationalQualifications: text,
  professionalQualifications: text,
  professionalMemberships: text,
  totalExperience: text,
  relevantExperience: text,
  previousEmployment: text,
  briefBiography: text,
  linkedDirectorId: text,
  notes: text,
});
export type KmpSmpRecord = z.infer<typeof kmpSmpRecordSchema>;

export const kmpRoleReadinessSchema = z.object({
  mdCeoManagerWtd: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  cfo: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  companySecretary: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  complianceOfficer: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  otherBoardDesignatedKmp: z.enum(['', ...GOVERNANCE_READINESS_STATUS_VALUES]),
  notes: text,
});
export type KmpRoleReadiness = z.infer<typeof kmpRoleReadinessSchema>;

export const vacancyRecordSchema = z.object({
  id: idSchema,
  role: text,
  vacancyDate: text,
  reason: text,
  interimResponsibility: text,
  recruitmentStatus: text,
  expectedFillDate: text,
  boardActionStatus: text,
  notes: text,
});
export type VacancyRecord = z.infer<typeof vacancyRecordSchema>;

export const familyRelationshipRecordSchema = z.object({
  id: idSchema,
  personOneId: text,
  personOneType: z.enum(['', 'director', 'kmp', 'smp', 'promoter']),
  personTwoId: text,
  personTwoType: z.enum(['', 'director', 'kmp', 'smp', 'promoter']),
  relationshipType: z.enum(['', ...FAMILY_RELATIONSHIP_TYPE_VALUES]),
  notes: text,
});
export type FamilyRelationshipRecord = z.infer<typeof familyRelationshipRecordSchema>;

export const kmpSeniorManagementAndOrganisationStructureSchema = z.object({
  organisationStructure: z.array(orgStructureNodeSchema),
  kmpSmpRecords: z.array(kmpSmpRecordSchema),
  kmpRoleReadiness: kmpRoleReadinessSchema,
  vacancies: z.array(vacancyRecordSchema),
  familyRelationships: z.array(familyRelationshipRecordSchema),
  notes: text,
});
export type KmpSeniorManagementAndOrganisationStructure = z.infer<
  typeof kmpSeniorManagementAndOrganisationStructureSchema
>;

/* -------------------------------------------------------------------------- */
/* 4. Board committees & governance bodies                                     */
/* -------------------------------------------------------------------------- */

export const committeeMemberSchema = z.object({
  id: idSchema,
  directorId: text,
  role: z.enum(['', ...COMMITTEE_MEMBER_ROLE_VALUES]),
  appointmentDate: text,
  cessationDate: text,
  independentStatus: yesNoNotSureOrEmptySchema,
  executiveNonExecutive: z.enum(['', ...EXECUTIVE_NON_EXECUTIVE_VALUES]),
  financialLiteracyExpertise: text,
  notes: text,
});
export type CommitteeMember = z.infer<typeof committeeMemberSchema>;

export const committeeMeetingRecordSchema = z.object({
  id: idSchema,
  meetingDate: text,
  financialYear: text,
  membersEntitled: decimalStringSchema,
  membersPresent: decimalStringSchema,
  quorumMet: yesNoNotSureOrEmptySchema,
  keyMatterCategory: text,
  minutesApproved: yesNoNotSureOrEmptySchema,
  minutesReference: text,
  notes: text,
});
export type CommitteeMeetingRecord = z.infer<typeof committeeMeetingRecordSchema>;

export const committeeRecordSchema = z.object({
  id: idSchema,
  committeeType: z.enum(['', ...COMMITTEE_TYPE_VALUES]),
  name: text,
  applicability: z.enum(['', ...COMMITTEE_APPLICABILITY_VALUES]),
  constitutionDate: text,
  boardResolutionReference: text,
  activeStatus: yesNoNotSureOrEmptySchema,
  chairpersonDirectorId: text,
  members: z.array(committeeMemberSchema),
  termsOfReferenceAdopted: yesNoNotSureOrEmptySchema,
  termsOfReferenceDate: text,
  quorumRule: text,
  meetingFrequency: text,
  companySecretaryActsAsSecretary: yesNoNotSureOrEmptySchema,
  professionalReviewStatus: text,
  meetingHistory: z.array(committeeMeetingRecordSchema),
  notes: text,
});
export type CommitteeRecord = z.infer<typeof committeeRecordSchema>;

export const boardCommitteesAndGovernanceBodiesSchema = z.object({
  committees: z.array(committeeRecordSchema),
  notes: text,
});
export type BoardCommitteesAndGovernanceBodies = z.infer<
  typeof boardCommitteesAndGovernanceBodiesSchema
>;

/* -------------------------------------------------------------------------- */
/* 5. Remuneration, service contracts, ESOPs & benefits                          */
/* -------------------------------------------------------------------------- */

export const directorRemunerationRecordSchema = z.object({
  id: idSchema,
  directorId: text,
  financialYear: text,
  salary: decimalStringSchema,
  commission: decimalStringSchema,
  performanceBonus: decimalStringSchema,
  sittingFees: decimalStringSchema,
  perquisites: decimalStringSchema,
  retirementBenefits: decimalStringSchema,
  esopShareBasedCompensation: decimalStringSchema,
  otherRemuneration: decimalStringSchema,
  totalRemuneration: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type DirectorRemunerationRecord = z.infer<typeof directorRemunerationRecordSchema>;

export const executiveAppointmentTermSchema = z.object({
  id: idSchema,
  directorId: text,
  appointmentAgreementExists: yesNoNotSureOrEmptySchema,
  fixedSalary: decimalStringSchema,
  variablePay: decimalStringSchema,
  commission: decimalStringSchema,
  performanceLinkedIncentive: decimalStringSchema,
  perquisites: decimalStringSchema,
  retirementBenefits: decimalStringSchema,
  noticePeriod: text,
  severanceTerminationAmount: decimalStringSchema,
  term: text,
  nrcApproval: yesNoNotSureOrEmptySchema,
  boardApproval: yesNoNotSureOrEmptySchema,
  shareholderApproval: yesNoNotSureOrEmptySchema,
  specialResolutionStatus: yesNoNotSureOrEmptySchema,
  creditorApprovalWhereRelevant: yesNoNotSureOrEmptySchema,
  scheduleVRelianceStatus: text,
  professionalConfirmation: text,
  notes: text,
});
export type ExecutiveAppointmentTerm = z.infer<typeof executiveAppointmentTermSchema>;

export const kmpSmpRemunerationRecordSchema = z.object({
  id: idSchema,
  personId: text,
  financialYear: text,
  fixedCompensation: decimalStringSchema,
  variableCompensation: decimalStringSchema,
  bonus: decimalStringSchema,
  commission: decimalStringSchema,
  esopShareBasedBenefits: decimalStringSchema,
  otherBenefits: decimalStringSchema,
  total: decimalStringSchema,
  sourceStatus: z.enum(['', ...SOURCE_STATUS_VALUES]),
  notes: text,
});
export type KmpSmpRemunerationRecord = z.infer<typeof kmpSmpRemunerationRecordSchema>;

export const incentiveArrangementRecordSchema = z.object({
  id: idSchema,
  participantPersonId: text,
  arrangementType: text,
  basisOrFormula: text,
  amount: decimalStringSchema,
  approval: text,
  vestingPaymentConditions: text,
  terminationTreatment: text,
  notes: text,
});
export type IncentiveArrangementRecord = z.infer<typeof incentiveArrangementRecordSchema>;

export const serviceContractBenefitRecordSchema = z.object({
  id: idSchema,
  personId: text,
  employmentAppointmentLetterExists: yesNoNotSureOrEmptySchema,
  additionalServiceAgreement: yesNoNotSureOrEmptySchema,
  retirementBenefitOutsideOrdinaryTerms: yesNoNotSureOrEmptySchema,
  terminationBenefit: yesNoNotSureOrEmptySchema,
  nonCompete: yesNoNotSureOrEmptySchema,
  nonSolicit: yesNoNotSureOrEmptySchema,
  changeOfControlBenefit: yesNoNotSureOrEmptySchema,
  ipoTriggeredPayment: yesNoNotSureOrEmptySchema,
  otherSpecialArrangement: text,
  notes: text,
});
export type ServiceContractBenefitRecord = z.infer<typeof serviceContractBenefitRecordSchema>;

export const esopGovernanceSchema = z.object({
  esopSchemeExists: yesNoNotSureOrEmptySchema,
  schemeName: text,
  approvalDate: text,
  nrcAdministration: yesNoNotSureOrEmptySchema,
  directorsParticipating: yesNoNotSureOrEmptySchema,
  kmpSmpParticipating: yesNoNotSureOrEmptySchema,
  ipoTreatmentStatus: text,
  professionalConfirmation: text,
  notes: text,
});
export type EsopGovernance = z.infer<typeof esopGovernanceSchema>;

export const remunerationServiceContractsEsopsAndBenefitsSchema = z.object({
  directorRemuneration: z.array(directorRemunerationRecordSchema),
  executiveAppointmentTerms: z.array(executiveAppointmentTermSchema),
  kmpSmpRemuneration: z.array(kmpSmpRemunerationRecordSchema),
  incentiveArrangements: z.array(incentiveArrangementRecordSchema),
  serviceContractsAndBenefits: z.array(serviceContractBenefitRecordSchema),
  esopGovernance: esopGovernanceSchema,
  notes: text,
});
export type RemunerationServiceContractsEsopsAndBenefits = z.infer<
  typeof remunerationServiceContractsEsopsAndBenefitsSchema
>;

/* -------------------------------------------------------------------------- */
/* 6. Interests, conflicts & management relationships                            */
/* -------------------------------------------------------------------------- */

export const interestInIssuerRecordSchema = z.object({
  id: idSchema,
  personId: text,
  personType: z.enum(['', 'director', 'kmp', 'smp']),
  sharesOrOptions: decimalStringSchema,
  dividendInterest: yesNoNotSureOrEmptySchema,
  remunerationInterest: yesNoNotSureOrEmptySchema,
  employmentInterest: yesNoNotSureOrEmptySchema,
  promoterStatus: yesNoNotSureOrEmptySchema,
  sellingShareholderStatus: yesNoNotSureOrEmptySchema,
  loanDepositRelationship: yesNoNotSureOrEmptySchema,
  guaranteeRelationship: yesNoNotSureOrEmptySchema,
  otherFinancialInterest: text,
  notes: text,
});
export type InterestInIssuerRecord = z.infer<typeof interestInIssuerRecordSchema>;

export const directorOfferDocumentInterestSchema = z.object({
  id: idSchema,
  directorId: text,
  interestInPromotionFormation: yesNoNotSureOrEmptySchema,
  interestInPropertyAcquiredPrecedingTwoYears: yesNoNotSureOrEmptySchema,
  interestInPropertyProposedToBeAcquired: yesNoNotSureOrEmptySchema,
  interestThroughFirmEntity: yesNoNotSureOrEmptySchema,
  paymentReceivedForPromotionFormationServices: yesNoNotSureOrEmptySchema,
  natureOfInterest: text,
  amount: decimalStringSchema,
  explanation: text,
  notes: text,
});
export type DirectorOfferDocumentInterest = z.infer<typeof directorOfferDocumentInterestSchema>;

export const outsideInterestRecordSchema = z.object({
  id: idSchema,
  personId: text,
  personType: z.enum(['', 'director', 'kmp', 'smp']),
  relatedEntity: text,
  role: text,
  ownershipPercentage: decimalStringSchema,
  natureOfBusiness: text,
  competesWithIssuer: yesNoNotSureOrEmptySchema,
  customer: yesNoNotSureOrEmptySchema,
  supplier: yesNoNotSureOrEmptySchema,
  lender: yesNoNotSureOrEmptySchema,
  landlord: yesNoNotSureOrEmptySchema,
  serviceProvider: yesNoNotSureOrEmptySchema,
  materialFinancialRelationship: yesNoNotSureOrEmptySchema,
  relatedPartyStatus: yesNoNotSureOrEmptySchema,
  currentStatus: text,
  explanation: text,
  notes: text,
});
export type OutsideInterestRecord = z.infer<typeof outsideInterestRecordSchema>;

export const appointmentArrangementRecordSchema = z.object({
  id: idSchema,
  personId: text,
  personType: z.enum(['', 'director', 'kmp', 'smp']),
  selectedPursuantToArrangement: yesNoNotSureOrEmptySchema,
  personOrEntity: text,
  relationship: text,
  natureOfArrangement: text,
  arrangementDate: text,
  agreementReference: text,
  continuingRights: text,
  nominationRights: text,
  professionalReview: text,
  notes: text,
});
export type AppointmentArrangementRecord = z.infer<typeof appointmentArrangementRecordSchema>;

export const financialArrangementRecordSchema = z.object({
  id: idSchema,
  personId: text,
  personType: z.enum(['', 'director', 'kmp', 'smp']),
  arrangementType: text,
  amount: decimalStringSchema,
  outstandingAmount: decimalStringSchema,
  relationship: text,
  linkedRptRecordReference: text,
  notes: text,
});
export type FinancialArrangementRecord = z.infer<typeof financialArrangementRecordSchema>;

export const interestsConflictsAndManagementRelationshipsSchema = z.object({
  interestsInIssuer: z.array(interestInIssuerRecordSchema),
  directorOfferDocumentInterests: z.array(directorOfferDocumentInterestSchema),
  outsideInterests: z.array(outsideInterestRecordSchema),
  appointmentArrangements: z.array(appointmentArrangementRecordSchema),
  financialArrangements: z.array(financialArrangementRecordSchema),
  notes: text,
});
export type InterestsConflictsAndManagementRelationships = z.infer<
  typeof interestsConflictsAndManagementRelationshipsSchema
>;

/* -------------------------------------------------------------------------- */
/* 7. Changes, continuity & succession                                         */
/* -------------------------------------------------------------------------- */

export const boardChangeRecordSchema = z.object({
  id: idSchema,
  directorId: text,
  previousDesignation: text,
  newDesignation: text,
  event: z.enum(['', ...BOARD_CHANGE_EVENT_VALUES]),
  effectiveDate: text,
  reason: text,
  boardApproval: yesNoNotSureOrEmptySchema,
  shareholderApproval: yesNoNotSureOrEmptySchema,
  filingReference: text,
  replacementAppointed: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type BoardChangeRecord = z.infer<typeof boardChangeRecordSchema>;

export const kmpSmpChangeRecordSchema = z.object({
  id: idSchema,
  personId: text,
  previousDesignation: text,
  newDesignation: text,
  event: z.enum(['', ...BOARD_CHANGE_EVENT_VALUES]),
  effectiveDate: text,
  reason: text,
  previousIncumbent: text,
  vacancyPeriod: text,
  interimHolder: text,
  replacementRecruitmentStatus: text,
  boardApproval: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type KmpSmpChangeRecord = z.infer<typeof kmpSmpChangeRecordSchema>;

export const successionReadinessSchema = z.object({
  formalSuccessionPlan: yesNoNotSureOrEmptySchema,
  criticalRolesIdentified: yesNoNotSureOrEmptySchema,
  emergencySuccessionProcess: yesNoNotSureOrEmptySchema,
  mdCeoSuccessionCoverage: yesNoNotSureOrEmptySchema,
  cfoSuccessionCoverage: yesNoNotSureOrEmptySchema,
  companySecretaryComplianceCoverage: yesNoNotSureOrEmptySchema,
  nrcSuccessionReview: yesNoNotSureOrEmptySchema,
  lastReviewDate: text,
  professionalReview: text,
  notes: text,
});
export type SuccessionReadiness = z.infer<typeof successionReadinessSchema>;

export const keyPersonDependencyRecordSchema = z.object({
  id: idSchema,
  personId: text,
  role: text,
  natureOfDependency: text,
  businessAreasAffected: text,
  replacementDepth: text,
  mitigation: text,
  relatedRiskFactorReference: text,
  notes: text,
});
export type KeyPersonDependencyRecord = z.infer<typeof keyPersonDependencyRecordSchema>;

export const changesContinuityAndSuccessionSchema = z.object({
  boardChanges: z.array(boardChangeRecordSchema),
  kmpSmpChanges: z.array(kmpSmpChangeRecordSchema),
  successionReadiness: successionReadinessSchema,
  keyPersonDependencies: z.array(keyPersonDependencyRecordSchema),
  notes: text,
});
export type ChangesContinuityAndSuccession = z.infer<typeof changesContinuityAndSuccessionSchema>;

/* -------------------------------------------------------------------------- */
/* 8. Governance policies, RPT oversight & confirmations                       */
/* -------------------------------------------------------------------------- */

export const governancePolicyRecordSchema = z.object({
  id: idSchema,
  policyType: z.enum(['', ...GOVERNANCE_POLICY_TYPE_VALUES]),
  policyName: text,
  applicableStatus: z.enum(['', ...COMMITTEE_APPLICABILITY_VALUES]),
  adoptedStatus: z.enum(['', ...POLICY_ADOPTED_STATUS_VALUES]),
  approvalDate: text,
  approvingBoardOrCommittee: text,
  effectiveDate: text,
  lastReviewed: text,
  websitePublicationRequirementStatus: text,
  policyOwner: text,
  professionalConfirmation: text,
  notes: text,
});
export type GovernancePolicyRecord = z.infer<typeof governancePolicyRecordSchema>;

export const rptGovernanceSchema = z.object({
  regulation23ApplicabilityStatus: z.enum(['', ...COMMITTEE_APPLICABILITY_VALUES]),
  auditCommitteeProcess: text,
  omnibusApprovalFramework: yesNoNotSureOrEmptySchema,
  shareholderApprovalProcess: text,
  relatedPartyAbstentionControlProcess: text,
  materialRptThresholdStatus: text,
  rptRegisterMaintained: yesNoNotSureOrEmptySchema,
  periodicReviewProcess: text,
  rptPolicyAdopted: yesNoNotSureOrEmptySchema,
  outstandingApprovals: text,
  professionalConfirmation: text,
  notes: text,
});
export type RptGovernance = z.infer<typeof rptGovernanceSchema>;

export const boardProcessReadinessSchema = z.object({
  boardMeetingCalendar: yesNoNotSureOrEmptySchema,
  meetingFrequencyReview: yesNoNotSureOrEmptySchema,
  directorAttendanceRecords: yesNoNotSureOrEmptySchema,
  committeeAttendanceRecords: yesNoNotSureOrEmptySchema,
  annualInterestDisclosures: yesNoNotSureOrEmptySchema,
  independentDirectorDeclarations: yesNoNotSureOrEmptySchema,
  directorEvaluationProcess: yesNoNotSureOrEmptySchema,
  boardEvaluation: yesNoNotSureOrEmptySchema,
  committeeEvaluation: yesNoNotSureOrEmptySchema,
  chairpersonEvaluation: yesNoNotSureOrEmptySchema,
  independentDirectorMeetingProcess: yesNoNotSureOrEmptySchema,
  familiarisationProgramme: yesNoNotSureOrEmptySchema,
  doInsurance: yesNoNotSureOrEmptySchema,
  secretarialComplianceProcess: yesNoNotSureOrEmptySchema,
  investorGrievanceEscalationProcess: yesNoNotSureOrEmptySchema,
  notes: text,
});
export type BoardProcessReadiness = z.infer<typeof boardProcessReadinessSchema>;

export const managementGovernanceConfirmationsSchema = z.object({
  currentBoardCompletelyDisclosed: z.boolean(),
  proposedAppointmentsAndCessationsDisclosed: z.boolean(),
  directorBiographiesAccurate: z.boolean(),
  otherDirectorshipsComplete: z.boolean(),
  eligibilityAndDebarmentDeclarationsComplete: z.boolean(),
  independentDirectorRelationshipsDisclosed: z.boolean(),
  allKmpAndSmpIdentified: z.boolean(),
  organisationStructureComplete: z.boolean(),
  committeesCompletelyDisclosed: z.boolean(),
  remunerationAndBenefitsComplete: z.boolean(),
  serviceContractsAndSpecialCompensationDisclosed: z.boolean(),
  managementShareholdingAndOptionsDisclosed: z.boolean(),
  familyRelationshipsDisclosed: z.boolean(),
  appointmentArrangementsDisclosed: z.boolean(),
  conflictsAndInterestsDisclosed: z.boolean(),
  threeYearManagementChangesComplete: z.boolean(),
  governancePoliciesReflectCurrentStatus: z.boolean(),
  proposedAppointmentsNotRepresentedAsCompleted: z.boolean(),
  professionalLegalSecretarialConfirmationRemainsRequired: z.boolean(),
  rptGovernanceDisclosuresComplete: z.boolean(),
  boardProcessReadinessCaptured: z.boolean(),
  governanceApplicabilityProfileReviewed: z.boolean(),
});
export type ManagementGovernanceConfirmations = z.infer<
  typeof managementGovernanceConfirmationsSchema
>;

export const governancePoliciesRptOversightAndConfirmationsSchema = z.object({
  governancePolicies: z.array(governancePolicyRecordSchema),
  rptGovernance: rptGovernanceSchema,
  boardProcessReadiness: boardProcessReadinessSchema,
  confirmations: managementGovernanceConfirmationsSchema,
  notes: text,
});
export type GovernancePoliciesRptOversightAndConfirmations = z.infer<
  typeof governancePoliciesRptOversightAndConfirmationsSchema
>;

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

export const managementGovernancePayloadSchema = z.object({
  schemaVersion: z.literal(MANAGEMENT_GOVERNANCE_SCHEMA_VERSION),
  boardStructureAndIpoGovernanceReadiness: boardStructureAndIpoGovernanceReadinessSchema,
  directorsProfilesAppointmentsAndEligibility: directorsProfilesAppointmentsAndEligibilitySchema,
  kmpSeniorManagementAndOrganisationStructure: kmpSeniorManagementAndOrganisationStructureSchema,
  boardCommitteesAndGovernanceBodies: boardCommitteesAndGovernanceBodiesSchema,
  remunerationServiceContractsEsopsAndBenefits: remunerationServiceContractsEsopsAndBenefitsSchema,
  interestsConflictsAndManagementRelationships: interestsConflictsAndManagementRelationshipsSchema,
  changesContinuityAndSuccession: changesContinuityAndSuccessionSchema,
  governancePoliciesRptOversightAndConfirmations: governancePoliciesRptOversightAndConfirmationsSchema,
});

export type ManagementGovernancePayload = z.infer<typeof managementGovernancePayloadSchema>;

export type ManagementGovernanceSectionId =
  | 'board-structure-and-ipo-governance-readiness'
  | 'directors-profiles-appointments-and-eligibility'
  | 'kmp-senior-management-and-organisation-structure'
  | 'board-committees-and-governance-bodies'
  | 'remuneration-service-contracts-esops-and-benefits'
  | 'interests-conflicts-and-management-relationships'
  | 'changes-continuity-and-succession'
  | 'governance-policies-rpt-oversight-and-confirmations';

export const MANAGEMENT_GOVERNANCE_SECTION_IDS: ManagementGovernanceSectionId[] = [
  'board-structure-and-ipo-governance-readiness',
  'directors-profiles-appointments-and-eligibility',
  'kmp-senior-management-and-organisation-structure',
  'board-committees-and-governance-bodies',
  'remuneration-service-contracts-esops-and-benefits',
  'interests-conflicts-and-management-relationships',
  'changes-continuity-and-succession',
  'governance-policies-rpt-oversight-and-confirmations',
];

export const sectionIdSchema = z.enum([
  'board-structure-and-ipo-governance-readiness',
  'directors-profiles-appointments-and-eligibility',
  'kmp-senior-management-and-organisation-structure',
  'board-committees-and-governance-bodies',
  'remuneration-service-contracts-esops-and-benefits',
  'interests-conflicts-and-management-relationships',
  'changes-continuity-and-succession',
  'governance-policies-rpt-oversight-and-confirmations',
]);
