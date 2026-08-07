"""Empty-record factories for Management & Governance — mirrors frontend M1 exactly."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.management_governance.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_director_eligibility() -> dict[str, Any]:
    return {
        "dinActive": "",
        "section164DisqualificationConcern": "",
        "section164_2Concern": "",
        "sebiDebarment": "",
        "stockExchangeDebarment": "",
        "securitiesMarketRestraint": "",
        "relevantConviction": "",
        "insolvencyBankruptcyConcern": "",
        "directorshipLimitConcern": "",
        "requiredConsentDeclarationAvailable": "",
        "professionalEligibilityReviewPending": "",
        "adverseExplanation": "",
    }


def create_empty_independent_director_details() -> dict[str, Any]:
    return {
        "independenceDeclarationReceived": "",
        "section149CriteriaStatus": "",
        "promoterRelationship": "",
        "relationshipWithDirectorsPromoters": "",
        "pecuniaryRelationshipConcern": "",
        "employmentAdvisoryRelationshipConcern": "",
        "relativeRelationshipConcern": "",
        "databankStatus": "",
        "proficiencyTestRequirementStatus": "",
        "termNumber": "",
        "firstTermCommencement": "",
        "secondTermApprovalStatus": "",
        "coolingOffConcern": "",
        "professionalConfirmation": "",
    }


def create_empty_previous_employment_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "employerEntity": "",
        "position": "",
        "fromDate": "",
        "toDate": "",
        "roleDescription": "",
        "relevantExperience": "",
        "notes": "",
    }


def create_empty_other_directorship_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityName": "",
        "cinOrRegistrationNumber": "",
        "entityListingStatus": "",
        "position": "",
        "appointmentDate": "",
        "independentOrExecutiveStatus": "",
        "currentOrCeased": "",
        "cessationDate": "",
        "committeeMemberships": "",
        "notes": "",
    }


def create_empty_director_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "fullLegalName": "",
        "previousName": "",
        "din": "",
        "dateOfBirth": "",
        "gender": "",
        "nationality": "",
        "countryOfResidence": "",
        "occupation": "",
        "designation": "",
        "executiveNonExecutive": "",
        "independentStatus": "",
        "promoterStatus": "",
        "nomineeStatus": "",
        "nominationSource": "",
        "functionalResponsibility": "",
        "dateFirstAppointed": "",
        "dateOfCurrentAppointment": "",
        "currentTermStart": "",
        "currentTermEnd": "",
        "liableToRetireByRotation": "",
        "appointmentStatus": "",
        "boardApprovalDate": "",
        "shareholderApprovalDate": "",
        "resolutionReference": "",
        "dir12FilingStatusReference": "",
        "educationalQualifications": "",
        "professionalQualifications": "",
        "professionalMemberships": "",
        "totalExperience": "",
        "relevantIndustryExperience": "",
        "areasOfExpertise": "",
        "currentResponsibilities": "",
        "briefProfessionalBiography": "",
        "previousEmployment": [],
        "otherDirectorships": [],
        "eligibility": create_empty_director_eligibility(),
        "independentDirectorDetails": create_empty_independent_director_details(),
        "notes": "",
    }


def create_empty_board_snapshot() -> dict[str, Any]:
    return {
        "asOfDate": "",
        "companyStatus": "",
        "currentBoardSize": "",
        "vacantBoardSeats": "",
        "proposedBoardSizeForListing": "",
        "notes": "",
    }


def create_empty_board_leadership() -> dict[str, Any]:
    return {
        "chairmanDirectorId": "",
        "chairmanClassification": "",
        "managingDirectorDirectorId": "",
        "ceoDirectorId": "",
        "managerDirectorId": "",
        "wholeTimeDirectorIds": [],
        "chairmanAndMdRolesCombined": "",
        "combinedRolesBasisApproval": "",
        "leadIndependentDirectorId": "",
        "notes": "",
    }


def create_empty_governance_readiness() -> dict[str, Any]:
    return {
        "publicCompanyConversion": "",
        "boardReconstitution": "",
        "independentDirectorAppointments": "",
        "womanDirectorAppointment": "",
        "residentDirectorRequirement": "",
        "boardVacancies": "",
        "ipoSpecificBoardApprovals": "",
        "professionalGovernanceReview": "",
        "notes": "",
    }


def create_empty_ipo_committee() -> dict[str, Any]:
    return {
        "constituted": "",
        "constitutionDate": "",
        "boardResolutionReference": "",
        "delegatedPowers": "",
        "chairpersonDirectorId": "",
        "memberDirectorIds": [],
        "currentStatus": "",
        "notes": "",
    }


def create_empty_independent_director_price_band_process() -> dict[str, Any]:
    return {
        "requiredApplicabilityStatus": "",
        "committeeConstituted": "",
        "independentDirectorsInvolved": "",
        "recommendationStatus": "",
        "recommendationDate": "",
        "resolutionReference": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_board_structure_and_ipo_governance_readiness() -> dict[str, Any]:
    return {
        "boardSnapshot": create_empty_board_snapshot(),
        "leadership": create_empty_board_leadership(),
        "governanceReadiness": create_empty_governance_readiness(),
        "ipoCommittee": create_empty_ipo_committee(),
        "independentDirectorPriceBandProcess": create_empty_independent_director_price_band_process(),
        "notes": "",
    }


def create_empty_directors_profiles_appointments_and_eligibility() -> dict[str, Any]:
    return {
        "directors": [],
        "notes": "",
    }


def create_empty_org_structure_node(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "role": "",
        "functionOrBusinessUnit": "",
        "reportsToPersonId": "",
        "boardReportingRelationship": "",
        "directReports": [],
        "status": "",
        "notes": "",
    }


def create_empty_kmp_smp_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "fullName": "",
        "classification": "",
        "designation": "",
        "functionalRole": "",
        "department": "",
        "joiningDate": "",
        "currentRoleAppointmentDate": "",
        "employmentType": "",
        "currentStatus": "",
        "reportsToPersonId": "",
        "keyResponsibilities": "",
        "dateOfBirth": "",
        "educationalQualifications": "",
        "professionalQualifications": "",
        "professionalMemberships": "",
        "totalExperience": "",
        "relevantExperience": "",
        "previousEmployment": "",
        "briefBiography": "",
        "linkedDirectorId": "",
        "notes": "",
    }


def create_empty_kmp_role_readiness() -> dict[str, Any]:
    return {
        "mdCeoManagerWtd": "",
        "cfo": "",
        "companySecretary": "",
        "complianceOfficer": "",
        "otherBoardDesignatedKmp": "",
        "notes": "",
    }


def create_empty_vacancy_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "role": "",
        "vacancyDate": "",
        "reason": "",
        "interimResponsibility": "",
        "recruitmentStatus": "",
        "expectedFillDate": "",
        "boardActionStatus": "",
        "notes": "",
    }


def create_empty_family_relationship_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personOneId": "",
        "personOneType": "",
        "personTwoId": "",
        "personTwoType": "",
        "relationshipType": "",
        "notes": "",
    }


def create_empty_kmp_senior_management_and_organisation_structure() -> dict[str, Any]:
    return {
        "organisationStructure": [],
        "kmpSmpRecords": [],
        "kmpRoleReadiness": create_empty_kmp_role_readiness(),
        "vacancies": [],
        "familyRelationships": [],
        "notes": "",
    }


def create_empty_committee_member(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "directorId": "",
        "role": "",
        "appointmentDate": "",
        "cessationDate": "",
        "independentStatus": "",
        "executiveNonExecutive": "",
        "financialLiteracyExpertise": "",
        "notes": "",
    }


def create_empty_committee_meeting_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "meetingDate": "",
        "financialYear": "",
        "membersEntitled": "",
        "membersPresent": "",
        "quorumMet": "",
        "keyMatterCategory": "",
        "minutesApproved": "",
        "minutesReference": "",
        "notes": "",
    }


def create_empty_committee_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "committeeType": "",
        "name": "",
        "applicability": "",
        "constitutionDate": "",
        "boardResolutionReference": "",
        "activeStatus": "",
        "chairpersonDirectorId": "",
        "members": [],
        "termsOfReferenceAdopted": "",
        "termsOfReferenceDate": "",
        "quorumRule": "",
        "meetingFrequency": "",
        "companySecretaryActsAsSecretary": "",
        "professionalReviewStatus": "",
        "meetingHistory": [],
        "notes": "",
    }


def create_empty_board_committees_and_governance_bodies() -> dict[str, Any]:
    return {
        "committees": [],
        "notes": "",
    }


def create_empty_director_remuneration_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "directorId": "",
        "financialYear": "",
        "salary": "",
        "commission": "",
        "performanceBonus": "",
        "sittingFees": "",
        "perquisites": "",
        "retirementBenefits": "",
        "esopShareBasedCompensation": "",
        "otherRemuneration": "",
        "totalRemuneration": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_executive_appointment_term(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "directorId": "",
        "appointmentAgreementExists": "",
        "fixedSalary": "",
        "variablePay": "",
        "commission": "",
        "performanceLinkedIncentive": "",
        "perquisites": "",
        "retirementBenefits": "",
        "noticePeriod": "",
        "severanceTerminationAmount": "",
        "term": "",
        "nrcApproval": "",
        "boardApproval": "",
        "shareholderApproval": "",
        "specialResolutionStatus": "",
        "creditorApprovalWhereRelevant": "",
        "scheduleVRelianceStatus": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_kmp_smp_remuneration_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "financialYear": "",
        "fixedCompensation": "",
        "variableCompensation": "",
        "bonus": "",
        "commission": "",
        "esopShareBasedBenefits": "",
        "otherBenefits": "",
        "total": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_incentive_arrangement_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "participantPersonId": "",
        "arrangementType": "",
        "basisOrFormula": "",
        "amount": "",
        "approval": "",
        "vestingPaymentConditions": "",
        "terminationTreatment": "",
        "notes": "",
    }


def create_empty_service_contract_benefit_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "employmentAppointmentLetterExists": "",
        "additionalServiceAgreement": "",
        "retirementBenefitOutsideOrdinaryTerms": "",
        "terminationBenefit": "",
        "nonCompete": "",
        "nonSolicit": "",
        "changeOfControlBenefit": "",
        "ipoTriggeredPayment": "",
        "otherSpecialArrangement": "",
        "notes": "",
    }


def create_empty_esop_governance() -> dict[str, Any]:
    return {
        "esopSchemeExists": "",
        "schemeName": "",
        "approvalDate": "",
        "nrcAdministration": "",
        "directorsParticipating": "",
        "kmpSmpParticipating": "",
        "ipoTreatmentStatus": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_remuneration_service_contracts_esops_and_benefits() -> dict[str, Any]:
    return {
        "directorRemuneration": [],
        "executiveAppointmentTerms": [],
        "kmpSmpRemuneration": [],
        "incentiveArrangements": [],
        "serviceContractsAndBenefits": [],
        "esopGovernance": create_empty_esop_governance(),
        "notes": "",
    }


def create_empty_interest_in_issuer_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "personType": "",
        "sharesOrOptions": "",
        "dividendInterest": "",
        "remunerationInterest": "",
        "employmentInterest": "",
        "promoterStatus": "",
        "sellingShareholderStatus": "",
        "loanDepositRelationship": "",
        "guaranteeRelationship": "",
        "otherFinancialInterest": "",
        "notes": "",
    }


def create_empty_director_offer_document_interest(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "directorId": "",
        "interestInPromotionFormation": "",
        "interestInPropertyAcquiredPrecedingTwoYears": "",
        "interestInPropertyProposedToBeAcquired": "",
        "interestThroughFirmEntity": "",
        "paymentReceivedForPromotionFormationServices": "",
        "natureOfInterest": "",
        "amount": "",
        "explanation": "",
        "notes": "",
    }


def create_empty_outside_interest_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "personType": "",
        "relatedEntity": "",
        "role": "",
        "ownershipPercentage": "",
        "natureOfBusiness": "",
        "competesWithIssuer": "",
        "customer": "",
        "supplier": "",
        "lender": "",
        "landlord": "",
        "serviceProvider": "",
        "materialFinancialRelationship": "",
        "relatedPartyStatus": "",
        "currentStatus": "",
        "explanation": "",
        "notes": "",
    }


def create_empty_appointment_arrangement_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "personType": "",
        "selectedPursuantToArrangement": "",
        "personOrEntity": "",
        "relationship": "",
        "natureOfArrangement": "",
        "arrangementDate": "",
        "agreementReference": "",
        "continuingRights": "",
        "nominationRights": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_financial_arrangement_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "personType": "",
        "arrangementType": "",
        "amount": "",
        "outstandingAmount": "",
        "relationship": "",
        "linkedRptRecordReference": "",
        "notes": "",
    }


def create_empty_interests_conflicts_and_management_relationships() -> dict[str, Any]:
    return {
        "interestsInIssuer": [],
        "directorOfferDocumentInterests": [],
        "outsideInterests": [],
        "appointmentArrangements": [],
        "financialArrangements": [],
        "notes": "",
    }


def create_empty_board_change_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "directorId": "",
        "previousDesignation": "",
        "newDesignation": "",
        "event": "",
        "effectiveDate": "",
        "reason": "",
        "boardApproval": "",
        "shareholderApproval": "",
        "filingReference": "",
        "replacementAppointed": "",
        "notes": "",
    }


def create_empty_kmp_smp_change_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "previousDesignation": "",
        "newDesignation": "",
        "event": "",
        "effectiveDate": "",
        "reason": "",
        "previousIncumbent": "",
        "vacancyPeriod": "",
        "interimHolder": "",
        "replacementRecruitmentStatus": "",
        "boardApproval": "",
        "notes": "",
    }


def create_empty_succession_readiness() -> dict[str, Any]:
    return {
        "formalSuccessionPlan": "",
        "criticalRolesIdentified": "",
        "emergencySuccessionProcess": "",
        "mdCeoSuccessionCoverage": "",
        "cfoSuccessionCoverage": "",
        "companySecretaryComplianceCoverage": "",
        "nrcSuccessionReview": "",
        "lastReviewDate": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_key_person_dependency_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "personId": "",
        "role": "",
        "natureOfDependency": "",
        "businessAreasAffected": "",
        "replacementDepth": "",
        "mitigation": "",
        "relatedRiskFactorReference": "",
        "notes": "",
    }


def create_empty_changes_continuity_and_succession() -> dict[str, Any]:
    return {
        "boardChanges": [],
        "kmpSmpChanges": [],
        "successionReadiness": create_empty_succession_readiness(),
        "keyPersonDependencies": [],
        "notes": "",
    }


def create_empty_governance_policy_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "policyType": "",
        "policyName": "",
        "applicableStatus": "",
        "adoptedStatus": "",
        "approvalDate": "",
        "approvingBoardOrCommittee": "",
        "effectiveDate": "",
        "lastReviewed": "",
        "websitePublicationRequirementStatus": "",
        "policyOwner": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_rpt_governance() -> dict[str, Any]:
    return {
        "regulation23ApplicabilityStatus": "",
        "auditCommitteeProcess": "",
        "omnibusApprovalFramework": "",
        "shareholderApprovalProcess": "",
        "relatedPartyAbstentionControlProcess": "",
        "materialRptThresholdStatus": "",
        "rptRegisterMaintained": "",
        "periodicReviewProcess": "",
        "rptPolicyAdopted": "",
        "outstandingApprovals": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_board_process_readiness() -> dict[str, Any]:
    return {
        "boardMeetingCalendar": "",
        "meetingFrequencyReview": "",
        "directorAttendanceRecords": "",
        "committeeAttendanceRecords": "",
        "annualInterestDisclosures": "",
        "independentDirectorDeclarations": "",
        "directorEvaluationProcess": "",
        "boardEvaluation": "",
        "committeeEvaluation": "",
        "chairpersonEvaluation": "",
        "independentDirectorMeetingProcess": "",
        "familiarisationProgramme": "",
        "doInsurance": "",
        "secretarialComplianceProcess": "",
        "investorGrievanceEscalationProcess": "",
        "notes": "",
    }


def create_empty_management_governance_confirmations() -> dict[str, Any]:
    return {
        "currentBoardCompletelyDisclosed": False,
        "proposedAppointmentsAndCessationsDisclosed": False,
        "directorBiographiesAccurate": False,
        "otherDirectorshipsComplete": False,
        "eligibilityAndDebarmentDeclarationsComplete": False,
        "independentDirectorRelationshipsDisclosed": False,
        "allKmpAndSmpIdentified": False,
        "organisationStructureComplete": False,
        "committeesCompletelyDisclosed": False,
        "remunerationAndBenefitsComplete": False,
        "serviceContractsAndSpecialCompensationDisclosed": False,
        "managementShareholdingAndOptionsDisclosed": False,
        "familyRelationshipsDisclosed": False,
        "appointmentArrangementsDisclosed": False,
        "conflictsAndInterestsDisclosed": False,
        "threeYearManagementChangesComplete": False,
        "governancePoliciesReflectCurrentStatus": False,
        "proposedAppointmentsNotRepresentedAsCompleted": False,
        "professionalLegalSecretarialConfirmationRemainsRequired": False,
        "rptGovernanceDisclosuresComplete": False,
        "boardProcessReadinessCaptured": False,
        "governanceApplicabilityProfileReviewed": False,
    }


def create_empty_governance_policies_rpt_oversight_and_confirmations() -> dict[str, Any]:
    return {
        "governancePolicies": [],
        "rptGovernance": create_empty_rpt_governance(),
        "boardProcessReadiness": create_empty_board_process_readiness(),
        "confirmations": create_empty_management_governance_confirmations(),
        "notes": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "boardStructureAndIpoGovernanceReadiness": create_empty_board_structure_and_ipo_governance_readiness(),
        "directorsProfilesAppointmentsAndEligibility": create_empty_directors_profiles_appointments_and_eligibility(),
        "kmpSeniorManagementAndOrganisationStructure": create_empty_kmp_senior_management_and_organisation_structure(),
        "boardCommitteesAndGovernanceBodies": create_empty_board_committees_and_governance_bodies(),
        "remunerationServiceContractsEsopsAndBenefits": create_empty_remuneration_service_contracts_esops_and_benefits(),
        "interestsConflictsAndManagementRelationships": create_empty_interests_conflicts_and_management_relationships(),
        "changesContinuityAndSuccession": create_empty_changes_continuity_and_succession(),
        "governancePoliciesRptOversightAndConfirmations": create_empty_governance_policies_rpt_oversight_and_confirmations(),
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
