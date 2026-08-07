"""Empty-record factories for Litigation, Approvals & Compliance (LAC1)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.litigation_approvals_compliance.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_legal_dd_snapshot() -> dict[str, Any]:
    return {
        "legalDdAsOfDate": "",
        "latestLegalSearchUpdateDate": "",
        "latestFinancialInformationDate": "",
        "targetDrhpFilingDate": "",
        "litigationExists": "",
        "criminalMattersExist": "",
        "taxDisputesExist": "",
        "regulatoryStatutoryActionsExist": "",
        "civilArbitrationMattersExist": "",
        "sebiExchangeActionsExist": "",
        "materialApprovalsPending": "",
        "expiredApprovalsExist": "",
        "knownComplianceExceptionsExist": "",
        "materialCreditorDuesExist": "",
        "materialDevelopmentsSinceLatestFinancialsExist": "",
    }


def create_empty_legal_party_review_record() -> dict[str, Any]:
    return {
        "legalPartyReviewId": _new_id(),
        "partyCategory": "",
        "linkedWorkstream": "",
        "linkedPartyId": "",
        "displayName": "",
        "unresolvedManualReference": "",
        "currentHistorical": "",
        "legalSearchCompleted": "",
        "searchAsOfDate": "",
        "managementConfirmationObtained": "",
        "externalCounselReviewStatus": "",
        "identifiedMatterCount": "",
        "notes": "",
    }


def create_empty_litigation_materiality_policy() -> dict[str, Any]:
    return {
        "policyExists": "",
        "adopted": "",
        "boardApprovalDate": "",
        "boardResolutionReference": "",
        "effectiveDate": "",
        "policyVersion": "",
        "lastReviewed": "",
        "partiesToWhichPolicyApplies": "",
        "legalCounselReview": "",
        "brlmProfessionalReview": "",
        "notes": "",
    }


def create_empty_quantitative_materiality_criterion() -> dict[str, Any]:
    return {
        "materialityCriterionId": _new_id(),
        "metric": "",
        "percentageThreshold": "",
        "absoluteThreshold": "",
        "relevantFinancialPeriod": "",
        "standaloneConsolidatedBasis": "",
        "formulaMethodology": "",
        "linkedFinancialsReference": "",
        "sourceFinancialValue": "",
        "notes": "",
    }


def create_empty_qualitative_materiality_criterion() -> dict[str, Any]:
    return {
        "qualitativeCriterionId": _new_id(),
        "criterionType": "",
        "description": "",
        "enabled": "",
        "boardPolicyBasis": "",
        "notes": "",
    }


def create_empty_legal_universe_materiality_policy_and_party_mapping() -> dict[str, Any]:
    return {
        "legalDdSnapshot": create_empty_legal_dd_snapshot(),
        "legalPartyReviews": [],
        "litigationMaterialityPolicy": create_empty_litigation_materiality_policy(),
        "quantitativeMaterialityCriteria": [],
        "qualitativeMaterialityCriteria": [],
    }


def create_empty_matter_party_link() -> dict[str, Any]:
    return {
        "matterPartyLinkId": _new_id(),
        "legalPartyReviewId": "",
        "role": "",
    }


def create_empty_matter_identity() -> dict[str, Any]:
    return {
        "matterTitle": "",
        "internalShortName": "",
        "caseReferenceNumber": "",
        "category": "",
        "direction": "",
    }


def create_empty_matter_forum() -> dict[str, Any]:
    return {
        "authorityForumName": "",
        "forumCategory": "",
        "location": "",
        "jurisdiction": "",
        "bench": "",
        "presidingAuthority": "",
    }


def create_empty_matter_dates_and_stage() -> dict[str, Any]:
    return {
        "causeEventDate": "",
        "filingInitiationDate": "",
        "noticeDate": "",
        "admissionDate": "",
        "lastHearingActionDate": "",
        "nextHearingActionDate": "",
        "currentStage": "",
        "currentSubsisting": "",
        "interimOrderExists": "",
        "stayExists": "",
        "injunctionExists": "",
        "attachmentFreezingOrderExists": "",
        "bailStatus": "",
        "appealAvailable": "",
        "appealFiled": "",
        "appealLimitationDeadline": "",
        "notes": "",
    }


def create_empty_matter_subject_matter() -> dict[str, Any]:
    return {
        "shortFactualBackground": "",
        "allegationClaim": "",
        "relevantPartyPosition": "",
        "reliefSoughtAgainstRelevantParty": "",
        "reliefSoughtByRelevantParty": "",
        "keyLegalProvisions": "",
        "businessActivityAffected": "",
        "linkedBusinessRecordId": "",
        "linkedBacFacilityId": "",
        "linkedBacPropertyId": "",
        "linkedBacAssetId": "",
        "linkedBacContractId": "",
        "linkedApprovalId": "",
        "financialPeriodAffected": "",
    }


def create_empty_matter_amounts() -> dict[str, Any]:
    return {
        "principalClaim": "",
        "taxDemand": "",
        "interest": "",
        "penalty": "",
        "fine": "",
        "damages": "",
        "compensation": "",
        "otherExposure": "",
        "totalQuantifiedAmount": "",
        "amountUnquantifiable": "",
        "currency": "",
        "amountUnit": "",
        "amountDisputed": "",
        "amountPaidDepositedUnderProtest": "",
        "provisionRecognised": "",
        "contingentLiabilityRecognised": "",
        "linkedFinancialsReference": "",
    }


def create_empty_matter_status_outcome() -> dict[str, Any]:
    return {
        "outcomeStatus": "",
        "latestOrderDate": "",
        "latestOrderSummary": "",
        "nextAction": "",
        "responsibleCounsel": "",
        "internalOwner": "",
        "counselOpinionStatus": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_matter_materiality() -> dict[str, Any]:
    return {
        "mandatoryCategoryConsideration": "",
        "quantitativePolicyRelevance": "",
        "qualitativePolicyRelevance": "",
        "managementMaterialityPosition": "",
        "boardMaterialityDetermination": "",
        "professionalReview": "",
        "readinessState": "",
        "notes": "",
    }


def create_empty_matter_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "matterId": _new_id(id_),
        "identity": create_empty_matter_identity(),
        "matterPartyLinks": [],
        "externalParties": [],
        "forum": create_empty_matter_forum(),
        "datesAndStage": create_empty_matter_dates_and_stage(),
        "subjectMatter": create_empty_matter_subject_matter(),
        "amounts": create_empty_matter_amounts(),
        "statusOutcome": create_empty_matter_status_outcome(),
        "materiality": create_empty_matter_materiality(),
    }


def create_empty_litigation_and_proceedings_master() -> dict[str, Any]:
    return {
        "matters": [],
    }


def create_empty_criminal_screening_record() -> dict[str, Any]:
    return {
        "legalPartyReviewId": "",
        "criminalSearchCompleted": "",
        "complaintsIdentified": "",
        "firsIdentified": "",
        "chargeSheetsIdentified": "",
        "summonsIdentified": "",
        "prosecutionsIdentified": "",
        "economicOffenceMattersIdentified": "",
        "convictionsIdentified": "",
        "acquittalsIdentified": "",
        "appealsIdentified": "",
        "investigationsIdentified": "",
        "linkedMatterIds": [],
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_regulatory_action_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "regulatoryActionId": _new_id(id_),
        "matterId": "",
        "authority": "",
        "affectedPartyLegalReviewId": "",
        "actionType": "",
        "initiationDate": "",
        "lawRegulation": "",
        "allegedContravention": "",
        "monetaryAmount": "",
        "responseSubmitted": "",
        "responseDate": "",
        "hearingStatus": "",
        "orderPassed": "",
        "appealFiled": "",
        "currentStatus": "",
        "remediation": "",
        "repeatIssue": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_sebi_exchange_screening_record() -> dict[str, Any]:
    return {
        "legalPartyReviewId": "",
        "sebiActionExists": "",
        "stockExchangeActionExists": "",
        "actionDate": "",
        "lastFiveYearRelevance": "",
        "outstandingAction": "",
        "showCauseNotice": "",
        "monetaryPenalty": "",
        "debarment": "",
        "securitiesMarketRestraint": "",
        "settlement": "",
        "consentOrder": "",
        "adjudication": "",
        "appeal": "",
        "currentStatus": "",
        "linkedMatterId": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_tax_proceeding_detail() -> dict[str, Any]:
    return {
        "matterId": "",
        "taxType": "",
        "assessmentYearFinancialYear": "",
        "authority": "",
        "noticeOrderType": "",
        "demand": "",
        "interest": "",
        "penalty": "",
        "amountPaid": "",
        "preDeposit": "",
        "balanceDisputed": "",
        "appealLevel": "",
        "stayGranted": "",
        "linkedFinancialsContingentLiabilityReference": "",
        "notes": "",
    }


def create_empty_criminal_regulatory_tax_and_enforcement_readiness() -> dict[str, Any]:
    return {
        "criminalScreenings": [],
        "regulatoryActions": [],
        "sebiExchangeScreenings": [],
        "taxProceedingDetails": [],
    }


def create_empty_approval_identity() -> dict[str, Any]:
    return {
        "approvalLicenceName": "",
        "category": "",
    }


def create_empty_approval_holder() -> dict[str, Any]:
    return {
        "holderType": "",
        "linkedEntityBusinessFacilityId": "",
        "displayName": "",
    }


def create_empty_approval_authority() -> dict[str, Any]:
    return {
        "issuingAuthority": "",
        "ministryDepartment": "",
        "centralStateLocal": "",
        "jurisdiction": "",
        "officeLocation": "",
    }


def create_empty_approval_details() -> dict[str, Any]:
    return {
        "licenceRegistrationNumber": "",
        "applicationNumber": "",
        "issueDate": "",
        "effectiveDate": "",
        "expiryDate": "",
        "perpetualNoExpiry": "",
        "renewalFrequency": "",
        "scope": "",
        "activityAuthorised": "",
        "locationSiteCovered": "",
        "capacityCovered": "",
        "productsCovered": "",
        "conditionsSummary": "",
        "restrictions": "",
        "transferable": "",
        "changeOfControlNotificationRequired": "",
        "changeOfNameAmendmentRequired": "",
        "publicCompanyConversionAmendmentRequired": "",
        "currentDocumentVersion": "",
        "notes": "",
    }


def create_empty_approval_application_metadata() -> dict[str, Any]:
    return {
        "applicationDate": "",
        "acknowledgementReference": "",
        "currentStage": "",
        "expectedTimeline": "",
        "authorityQueryReceived": "",
        "responsePending": "",
        "inspectionRequired": "",
        "feePaid": "",
        "followUpDate": "",
        "notes": "",
    }


def create_empty_approval_renewal_metadata() -> dict[str, Any]:
    return {
        "renewalDueDate": "",
        "renewalApplicationDate": "",
        "submittedBeforeExpiry": "",
        "continuationPendingRenewal": "",
        "renewalAcknowledgement": "",
        "currentRenewalStage": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_approval_record() -> dict[str, Any]:
    return {
        "approvalId": _new_id(),
        "identity": create_empty_approval_identity(),
        "holder": create_empty_approval_holder(),
        "authority": create_empty_approval_authority(),
        "details": create_empty_approval_details(),
        "status": "",
        "applicationMetadata": create_empty_approval_application_metadata(),
        "renewalMetadata": create_empty_approval_renewal_metadata(),
    }


def create_empty_approval_condition_record() -> dict[str, Any]:
    return {
        "conditionId": _new_id(),
        "approvalId": "",
        "condition": "",
        "category": "",
        "frequency": "",
        "dueDate": "",
        "lastCompletedDate": "",
        "complianceStatus": "",
        "evidenceReference": "",
        "responsibleOwner": "",
        "remediation": "",
        "targetCompletionDate": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_facility_approval_review_record() -> dict[str, Any]:
    return {
        "facilityApprovalReviewId": _new_id(),
        "linkedBusinessFacilityId": "",
        "requiredApprovalCategoriesIdentified": [],
        "linkedApprovalIds": [],
        "allApprovalsObtained": "",
        "applicationsPending": "",
        "requiredButNotApplied": "",
        "renewalsPending": "",
        "conditionsOutstanding": "",
        "siteOperationalBeforeRequiredApproval": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_project_approval_requirement_record() -> dict[str, Any]:
    return {
        "projectApprovalRequirementId": _new_id(),
        "linkedObjectsRecordId": "",
        "approvalCategory": "",
        "linkedApprovalId": "",
        "requiredBefore": "",
        "applicationTiming": "",
        "currentStatus": "",
        "expectedCompletion": "",
        "criticalPathImpact": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_compliance_domain_review_record() -> dict[str, Any]:
    return {
        "domainReviewId": _new_id(),
        "domain": "",
        "applicable": "",
        "responsibleFunction": "",
        "externalAdviser": "",
        "complianceCalendarExists": "",
        "lastInternalReview": "",
        "lastProfessionalReview": "",
        "knownExceptions": "",
        "notes": "",
    }


def create_empty_compliance_issue_record() -> dict[str, Any]:
    return {
        "complianceIssueId": _new_id(),
        "domain": "",
        "affectedEntitySitePerson": "",
        "linkedDwaarId": "",
        "obligation": "",
        "lawRuleReference": "",
        "dueDate": "",
        "actualCompletionDate": "",
        "issueType": "",
        "identifiedBy": "",
        "affectedPeriod": "",
        "continuing": "",
        "corrected": "",
        "correctionDate": "",
        "additionalFee": "",
        "penalty": "",
        "showCauseNoticeExists": "",
        "officerInDefault": "",
        "compoundingAdjudication": "",
        "linkedMatterId": "",
        "rootCause": "",
        "remediation": "",
        "preventiveAction": "",
        "owner": "",
        "targetResolution": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_statutory_due_record() -> dict[str, Any]:
    return {
        "statutoryDueId": _new_id(),
        "entity": "",
        "dueType": "",
        "financialPeriod": "",
        "amountDue": "",
        "dueDate": "",
        "amountPaid": "",
        "paymentDate": "",
        "delayDays": "",
        "interest": "",
        "penalty": "",
        "disputed": "",
        "linkedTaxMatterId": "",
        "linkedFinancialsReference": "",
        "auditorCaroObservation": "",
        "remediated": "",
        "notes": "",
    }


def create_empty_material_creditor_policy() -> dict[str, Any]:
    return {
        "policyExists": "",
        "adopted": "",
        "boardDate": "",
        "resolutionReference": "",
        "thresholdType": "",
        "percentage": "",
        "absoluteAmount": "",
        "relevantFinancialDate": "",
        "calculationBasis": "",
        "linkedFinancialsReference": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_material_creditor_record() -> dict[str, Any]:
    return {
        "creditorId": _new_id(),
        "creditorName": "",
        "linkedBusinessSupplierId": "",
        "linkedGroupEntityId": "",
        "relatedPartyStatus": "",
        "msmeStatus": "",
        "natureOfSupplyService": "",
        "amountOutstanding": "",
        "currency": "",
        "amountUnit": "",
        "ageing": "",
        "dueDate": "",
        "disputed": "",
        "reasonOutstanding": "",
        "paymentArrangement": "",
        "legalNotice": "",
        "linkedMatterId": "",
        "notes": "",
    }


def create_empty_creditor_aggregate_inputs() -> dict[str, Any]:
    return {
        "numberOfMsmeCreditors": "",
        "msmeOutstandingAmount": "",
        "numberOfMaterialCreditors": "",
        "materialCreditorAmount": "",
        "numberOfOtherCreditors": "",
        "otherCreditorAmount": "",
        "totalTradePayableReference": "",
        "linkedFinancialsTradePayables": "",
        "reconciliationDifference": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_historical_penalty_record() -> dict[str, Any]:
    return {
        "penaltyId": _new_id(),
        "affectedParty": "",
        "authority": "",
        "lawRegulation": "",
        "eventDate": "",
        "contravention": "",
        "penaltyFineType": "",
        "amount": "",
        "paid": "",
        "paymentDate": "",
        "appeal": "",
        "finalStatus": "",
        "continuingRestriction": "",
        "repeatOccurrence": "",
        "linkedMatterId": "",
        "notes": "",
    }


def create_empty_material_development_record() -> dict[str, Any]:
    return {
        "developmentId": _new_id(),
        "eventDate": "",
        "discoveryDate": "",
        "category": "",
        "description": "",
        "linkedWorkstream": "",
        "linkedRecordId": "",
        "materialityAssessment": "",
        "financialImpact": "",
        "operationalImpact": "",
        "assetImpact": "",
        "liabilityImpact": "",
        "reputationalImpact": "",
        "ipoImpact": "",
        "potentialRiskFactorRequirement": "",
        "offerDocumentSectionsAffected": "",
        "boardConsidered": "",
        "counselReview": "",
        "brlmProfessionalReview": "",
        "disclosureStatus": "",
        "notes": "",
    }


def create_empty_lac_group_entities_reconciliation() -> dict[str, Any]:
    return {
        "relevantGroupEntitiesInLegalDdUniverse": "",
        "legalDeclarationDisagreements": "",
        "groupEntityMattersRepresented": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_lac_management_governance_reconciliation() -> dict[str, Any]:
    return {
        "promoterDirectorKmpDeclarationsReconciled": "",
        "debarmentDeclarationsReconciled": "",
        "criminalRegulatoryDeclarationsReconciled": "",
        "eligibilityDeclarationsReconciled": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_lac_financials_reconciliation() -> dict[str, Any]:
    return {
        "litigationAggregateAmount": "",
        "financialsContingentLiabilities": "",
        "litigationDifference": "",
        "taxAggregateAmount": "",
        "financialsTaxDisputes": "",
        "taxDifference": "",
        "provisionsAmount": "",
        "financialsProvisions": "",
        "provisionsDifference": "",
        "creditorTotalsAmount": "",
        "financialsTradePayables": "",
        "creditorDifference": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_lac_bac_reconciliation() -> dict[str, Any]:
    return {
        "defaultsReconciled": "",
        "recallNoticesReconciled": "",
        "guaranteeInvocationsReconciled": "",
        "lenderDisputesReconciled": "",
        "propertyDisputesReconciled": "",
        "contractDisputesReconciled": "",
        "pendingNocsReconciled": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_lac_business_operations_reconciliation() -> dict[str, Any]:
    return {
        "facilitiesMapped": "",
        "operationsMapped": "",
        "licenceApprovalReferencesMapped": "",
        "environmentalLabourInformationMapped": "",
        "operationalIncidentsMapped": "",
        "facilitiesUnderConstructionMapped": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_lac_objects_of_issue_reconciliation() -> dict[str, Any]:
    return {
        "newFacilitiesMapped": "",
        "expansionsMapped": "",
        "acquisitionsMapped": "",
        "newProjectsGeographiesMapped": "",
        "approvalPlanReconciled": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_lac_ipo_setup_reconciliation() -> dict[str, Any]:
    return {
        "debarmentDeclarationsReconciled": "",
        "ibcWindingUpDeclarationsReconciled": "",
        "seriousProceedingsDeclarationsReconciled": "",
        "defaultsDeclarationsReconciled": "",
        "regulatoryActionDeclarationsReconciled": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_remediation_action_record() -> dict[str, Any]:
    return {
        "remediationActionId": _new_id(),
        "linkedRecordType": "",
        "linkedRecordId": "",
        "actionRequired": "",
        "owner": "",
        "priority": "",
        "targetDate": "",
        "dependency": "",
        "status": "",
        "completionDate": "",
        "professionalSignOffRequired": "",
        "notes": "",
    }


def create_empty_lac_confirmations() -> dict[str, Any]:
    return {
        "allCriminalProceedingsInvolvingRelevantPartiesDisclosed": "",
        "firComplaintProsecutionMattersConsidered": "",
        "allMaterialCivilArbitrationProceedingsDisclosed": "",
        "currentBoardApprovedLitigationMaterialityPolicyCaptured": "",
        "allStatutoryRegulatoryProceedingsDisclosed": "",
        "showCauseNoticesConsidered": "",
        "inspectionsInvestigationsEnquiriesConsidered": "",
        "sebiAndStockExchangeActionsDisclosed": "",
        "taxProceedingsComplete": "",
        "directTaxTotalsReconciled": "",
        "indirectTaxTotalsReconciled": "",
        "historicalPenaltiesMaterialRegulatoryActionsDisclosed": "",
        "materialSubsidiariesGroupCompaniesIncludedInLegalDd": "",
        "allMaterialBusinessApprovalsDisclosed": "",
        "approvalExpiriesAccurate": "",
        "pendingRenewalApplicationsDisclosed": "",
        "requiredButNotAppliedApprovalsDisclosed": "",
        "approvalConditionNonCompliancesDisclosed": "",
        "materialStatutorySecretarialExceptionsDisclosed": "",
        "statutoryDuesDelaysDefaultsDisclosed": "",
        "materialCreditorsCaptured": "",
        "msmeDuesCaptured": "",
        "materialDevelopmentsSinceLatestFinancialsDisclosed": "",
        "postPreparationLegalDevelopmentsWillContinueToBeUpdated": "",
        "contingentLiabilitiesProvisionsReconciledWithFinancials": "",
        "borrowingDefaultLegalMattersReconciledWithBac": "",
        "managementLegalDeclarationsReconciled": "",
        "groupEntityLegalDeclarationsReconciled": "",
        "unresolvedInconsistenciesFlagged": "",
        "professionalLegalBrlmSecretarialAccountingConfirmationRequired": "",
    }


def create_empty_litigation_approvals_compliance_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "legalUniverseMaterialityPolicyAndPartyMapping": (
            create_empty_legal_universe_materiality_policy_and_party_mapping()
        ),
        "litigationAndProceedingsMaster": create_empty_litigation_and_proceedings_master(),
        "criminalRegulatoryTaxAndEnforcementReadiness": (
            create_empty_criminal_regulatory_tax_and_enforcement_readiness()
        ),
        "governmentRegulatoryAndBusinessApprovalsMaster": {
            "approvals": [],
        },
        "approvalConditionsFacilityComplianceAndRenewalReadiness": {
            "approvalConditions": [],
            "facilityApprovalReviews": [],
            "projectApprovalRequirements": [],
        },
        "corporateStatutoryAndOperationalComplianceExceptions": {
            "complianceDomainReviews": [],
            "complianceIssues": [],
            "statutoryDues": [],
        },
        "materialCreditorsPenaltiesAndMaterialDevelopments": {
            "materialCreditorPolicy": create_empty_material_creditor_policy(),
            "materialCreditors": [],
            "creditorAggregateInputs": create_empty_creditor_aggregate_inputs(),
            "historicalPenalties": [],
            "materialDevelopments": [],
        },
        "reconciliationRemediationAndIssuerConfirmations": {
            "groupEntitiesReconciliation": create_empty_lac_group_entities_reconciliation(),
            "managementGovernanceReconciliation": (
                create_empty_lac_management_governance_reconciliation()
            ),
            "financialsReconciliation": create_empty_lac_financials_reconciliation(),
            "bacReconciliation": create_empty_lac_bac_reconciliation(),
            "businessOperationsReconciliation": (
                create_empty_lac_business_operations_reconciliation()
            ),
            "objectsOfIssueReconciliation": create_empty_lac_objects_of_issue_reconciliation(),
            "ipoSetupReconciliation": create_empty_lac_ipo_setup_reconciliation(),
            "remediationActions": [],
            "confirmations": create_empty_lac_confirmations(),
        },
    }


def empty_payload() -> dict[str, Any]:
    return create_empty_litigation_approvals_compliance_payload()


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
