"""Empty-record factories for Group Entities & Related Parties — mirrors frontend GR1."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.group_entities_related_parties.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_group_snapshot() -> dict[str, Any]:
    return {
        "structureAsOfDate": "",
        "holdingParentCompanyExists": "",
        "ultimateHoldingCompanyExists": "",
        "subsidiariesExist": "",
        "stepDownSubsidiariesExist": "",
        "associatesExist": "",
        "jointVenturesExist": "",
        "foreignGroupEntitiesExist": "",
        "promoterGroupEntitiesExist": "",
        "otherCommonControlEntitiesExist": "",
        "historicalEntitiesRelevant": "",
    }


def create_empty_entity_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityType": "",
        "identity": {
            "legalName": "",
            "formerName": "",
            "displayName": "",
        },
        "registration": {
            "cin": "",
            "llpin": "",
            "registrationNumber": "",
            "otherIdentifier": "",
            "countryOfIncorporation": "",
            "state": "",
            "incorporationDate": "",
            "registeredOffice": "",
            "corporateOffice": "",
            "website": "",
            "financialYearEnd": "",
        },
        "status": "",
        "listing": {
            "listedStatus": "",
            "exchange": "",
            "securityTypeListed": "",
            "listingDate": "",
            "delistedStatus": "",
            "delistingDate": "",
        },
        "businessProfile": {
            "principalBusiness": "",
            "otherBusinesses": "",
            "industry": "",
            "productsServices": "",
            "geographies": "",
            "operationalStatus": "",
            "relationshipRelevantFrom": "",
            "relationshipRelevantUntil": "",
            "notes": "",
        },
        "classificationBadges": [],
        "currentlyActive": True,
    }


def create_empty_ownership_relationship_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "parentPartyEntityId": "",
        "investeeEntityId": "",
        "relationshipType": "",
        "equityOwnershipPercent": "",
        "votingRightsPercent": "",
        "economicInterestPercent": "",
        "fullyDilutedInterestPercent": "",
        "effectiveIndirectInterestPercent": "",
        "effectiveFrom": "",
        "effectiveUntil": "",
        "currentHistorical": "",
        "sourceReference": "",
        "professionalConfirmationStatus": "",
        "rightToAppointRemoveBoard": "",
        "boardNominationRights": "",
        "vetoRights": "",
        "affirmativeVotingRights": "",
        "managementControlRights": "",
        "jointControlArrangement": "",
        "participationInBusinessDecisions": "",
        "notes": "",
    }


def create_empty_contractual_arrangement_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "partyEntityIds": [],
        "agreementType": "",
        "agreementDate": "",
        "rightsDescription": "",
        "effectiveDate": "",
        "expiryDate": "",
        "currentStatus": "",
        "reference": "",
        "notes": "",
    }


def create_empty_common_person_relationship_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "relationshipType": "",
        "linkedPersonId": "",
        "linkedPersonRole": "",
        "linkedPersonName": "",
        "linkedWorkstreamSource": "",
        "entityIds": [],
        "notes": "",
    }


def create_empty_entity_classification_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "classificationType": "",
        "currentHistorical": "",
        "relevantPeriods": "",
        "basis": "",
        "ownershipPercent": "",
        "votingPercent": "",
        "controlSignificantInfluenceBasis": "",
        "managementConclusion": "",
        "readinessState": "",
        "professionalConfirmationStatus": "",
        "notes": "",
    }


def create_empty_icdr_group_company_determination() -> dict[str, Any]:
    return {
        "entityId": "",
        "isCompany": "",
        "isPromoter": "",
        "isCurrentSubsidiary": "",
        "rptsDuringRelevantPeriods": "",
        "includedInAccountingStandardRptDisclosures": "",
        "boardConsidersMaterial": "",
        "classificationState": "",
        "identificationBasis": "",
        "relevantReportingPeriods": "",
        "dateFirstIdentified": "",
        "boardConfirmationStatus": "",
        "boardReference": "",
        "notes": "",
    }


def create_empty_group_company_materiality_policy() -> dict[str, Any]:
    return {
        "policyExists": "",
        "adopted": "",
        "adoptionDate": "",
        "boardResolutionReference": "",
        "effectiveDate": "",
        "lastReviewed": "",
        "policyVersion": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_materiality_criterion_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "metricType": "",
        "thresholdType": "",
        "thresholdValue": "",
        "measurementPeriod": "",
        "standaloneConsolidatedBasis": "",
        "calculationMethodology": "",
        "notes": "",
    }


def create_empty_material_subsidiary_purpose_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "purpose": "",
        "ruleBasis": "",
        "calculationBasis": "",
        "relevantPeriod": "",
        "result": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_framework_classification() -> dict[str, Any]:
    return {
        "framework": "",
        "related": "",
        "basisRationale": "",
        "relationshipStartDate": "",
        "relationshipEndDate": "",
        "relevantFinancialPeriods": "",
        "currentHistorical": "",
        "professionalConfirmationStatus": "",
    }


def create_empty_related_party_relationship_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "partyType": "",
        "linkedEntityId": "",
        "linkedPersonId": "",
        "linkedPersonRole": "",
        "linkedPersonName": "",
        "linkedWorkstreamSource": "",
        "relationshipCategory": "",
        "frameworkClassifications": [],
        "relationshipSourceType": "",
        "reference": "",
        "notes": "",
    }


def create_empty_rpt_transaction_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "relatedPartyRelationshipId": "",
        "linkedEntityId": "",
        "linkedPersonId": "",
        "financialPeriod": "",
        "transactionDateFrom": "",
        "transactionDateTo": "",
        "transactionType": "",
        "description": "",
        "agreementReference": "",
        "agreementDate": "",
        "transactionValue": "",
        "currency": "",
        "amountUnit": "",
        "pricingBasis": "",
        "transferPricingMethodology": "",
        "comparableUncontrolledBasis": "",
        "armsLengthStatus": "",
        "ordinaryCourseOfBusiness": "",
        "recurringNonRecurring": "",
        "cashNonCash": "",
        "auditCommitteeApproval": "",
        "omnibusApproval": "",
        "boardApproval": "",
        "shareholderApproval": "",
        "priorSubsequentApproval": "",
        "approvalDate": "",
        "resolutionReference": "",
        "interestedPartyAbstentionStatus": "",
        "ratificationRequired": "",
        "ratificationStatus": "",
        "professionalConfirmationStatus": "",
        "notes": "",
    }


def create_empty_rpt_balance_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "relatedPartyRelationshipId": "",
        "linkedEntityId": "",
        "linkedPersonId": "",
        "relatedTransactionId": "",
        "reportingDate": "",
        "reportingPeriod": "",
        "balanceType": "",
        "openingBalance": "",
        "transactionsDuringPeriod": "",
        "settlements": "",
        "closingBalance": "",
        "securedUnsecured": "",
        "interestBearing": "",
        "interestRate": "",
        "repaymentTerms": "",
        "dueDate": "",
        "doubtfulAmountProvision": "",
        "writtenOffAmount": "",
        "writtenBackAmount": "",
        "sourceReference": "",
        "notes": "",
    }


def create_empty_common_pursuit_screening() -> dict[str, Any]:
    return {
        "entityId": "",
        "sameLineOfBusiness": "",
        "constitutionalObjectsPermitSameBusiness": "",
        "overlappingProductsServices": "",
        "sameCustomerSegment": "",
        "sameGeography": "",
        "sameSuppliers": "",
        "sameTenderBiddingOpportunities": "",
        "sameDistributionChannels": "",
        "sameTechnologyIp": "",
        "sameBrand": "",
        "sharedEmployeesResources": "",
        "sharedPromotersManagement": "",
    }


def create_empty_common_pursuit_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "natureOfOverlap": "",
        "productsServicesInvolved": "",
        "geography": "",
        "customers": "",
        "extentOfActualCompetition": "",
        "potentialCompetition": "",
        "existingRevenueFromOverlappingBusiness": "",
        "businessOpportunitiesPotentiallyShared": "",
        "historicalConflict": "",
        "conflictManagementMechanism": "",
        "businessAllocationArrangement": "",
        "nonCompeteAgreement": "",
        "exclusivityAgreement": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_inter_company_dependency_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "dependencyType": "",
        "description": "",
        "annualTransactionValue": "",
        "percentageOfIssuerRevenuePurchasesCost": "",
        "contractExists": "",
        "contractExpiry": "",
        "pricingBasis": "",
        "alternativesAvailable": "",
        "terminationImpact": "",
        "linkedBusinessOperationsRecordId": "",
        "notes": "",
    }


def create_empty_other_business_interest_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "interestType": "",
        "nature": "",
        "value": "",
        "relevantAgreement": "",
        "currentStatus": "",
        "notes": "",
    }


def create_empty_entity_financial_period_summary() -> dict[str, Any]:
    return {
        "period": "",
        "equityShareCapital": "",
        "reservesOtherEquity": "",
        "netWorth": "",
        "revenueTurnover": "",
        "totalIncome": "",
        "profitLossAfterTax": "",
        "eps": "",
        "totalBorrowings": "",
        "sourceStatus": "",
        "auditedStatus": "",
        "auditorQualificationPresent": "",
    }


def create_empty_entity_financial_readiness_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "financialInformationAvailable": "",
        "latestAuditedFinancialYear": "",
        "threePriorFinancialYearsAvailable": "",
        "auditor": "",
        "auditStatus": "",
        "source": "",
        "financialInformationWebsiteUrl": "",
        "websitePublicationStatus": "",
        "informationVerified": "",
        "entityConfirmationReceived": "",
        "professionalReviewStatus": "",
        "financialPeriodSummaries": [],
        "negativeNetWorth": "",
        "lossMaking": "",
        "auditorQualification": "",
        "goingConcernConcern": "",
        "materialDefault": "",
        "significantRptDependence": "",
        "materialIndebtednessToIssuer": "",
        "materialIndebtednessFromIssuer": "",
        "listed": "",
        "publicIssueMadeHistorically": "",
        "rightsIssuePrecedingThreeYears": "",
        "listingRefusedHistorically": "",
        "securitiesLawViolation": "",
        "sebiExchangeProceeding": "",
        "wilfulDefaulterConcern": "",
        "fraudulentBorrowerConcern": "",
        "ibcProceeding": "",
        "windingUpPetition": "",
        "liquidation": "",
        "defunct": "",
        "strikeOffApplication": "",
        "struckOff": "",
        "materialRocDefault": "",
        "regulatoryExplanation": "",
        "materialLitigationExists": "",
        "litigationMatterCount": "",
        "litigationAggregateAmount": "",
        "couldMateriallyAffectIssuer": "",
        "linkedLitigationRecordId": "",
        "litigationInformationComplete": "",
        "litigationProfessionalConfirmation": "",
        "informationRequested": "",
        "requestDate": "",
        "informationReceived": "",
        "informationStatus": "",
        "confirmationConsentStatus": "",
        "followUpRequired": "",
        "publicInformationAvailable": "",
        "exemptionReliefPotentiallyRequired": "",
        "exemptionApplicationStatusReference": "",
        "disclosureLimitation": "",
        "riskFactorImplication": "",
        "notes": "",
    }


def create_empty_relationship_change_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "entityId": "",
        "linkedPersonId": "",
        "eventDate": "",
        "eventType": "",
        "previousRelationship": "",
        "newRelationship": "",
        "reason": "",
        "transactionInvolved": "",
        "accountingTreatment": "",
        "relevantReportingPeriods": "",
        "boardAcknowledgement": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_group_company_classification_review() -> dict[str, Any]:
    return {
        "allRptEntitiesReviewed": "",
        "subsidiariesHandledSeparately": "",
        "promotersHandledSeparately": "",
        "boardMaterialEntitiesConsidered": "",
        "materialityPolicyApplied": "",
        "boardFinalListApproved": "",
        "reviewDate": "",
        "merchantBankerProfessionalConfirmation": "",
        "notes": "",
    }


def create_empty_rpt_readiness() -> dict[str, Any]:
    return {
        "completeRptScheduleAvailable": "",
        "reconciledWithRestatedFinancialInformation": "",
        "outstandingBalancesReconciled": "",
        "commitmentsIncluded": "",
        "guaranteesSecurityIncluded": "",
        "nonCashTransactionsIncluded": "",
        "kmpCompensationIncluded": "",
        "historicalRelatedPartiesIncluded": "",
        "approvalsMapped": "",
        "pendingAuditCommitteeAction": "",
        "pendingBoardAction": "",
        "pendingShareholderAction": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_group_entities_confirmations() -> dict[str, Any]:
    return {
        "allSubsidiariesDisclosed": "",
        "stepDownSubsidiariesDisclosed": "",
        "associatesJvsDisclosed": "",
        "ultimateParentControlStructureAccurate": "",
        "promoterGroupRelationshipsComplete": "",
        "accountingStandardRelatedPartiesIdentified": "",
        "companiesActRelatedPartiesConsidered": "",
        "historicalRelatedPartiesIncluded": "",
        "icdrGroupCompaniesIdentified": "",
        "subsidiariesPromotersNotDuplicatedAsGroupCompanies": "",
        "currentMaterialityPolicyCaptured": "",
        "rptRegisterComplete": "",
        "outstandingBalancesComplete": "",
        "commitmentsComplete": "",
        "guaranteesCollateralComplete": "",
        "loansAdvancesComplete": "",
        "commonPursuitsDisclosed": "",
        "groupCompanyDependenciesDisclosed": "",
        "competingGroupBusinessesDisclosed": "",
        "groupCompanyFinancialInformationCurrent": "",
        "negativeNetWorthAuditorConcernsDisclosed": "",
        "ibcWindingUpStrikeOffDisclosed": "",
        "informationUnavailableFromGroupCompaniesIdentified": "",
        "conflictingClassificationsFlagged": "",
        "linkedWorkstreamValuesReconciled": "",
        "professionalConfirmationRequired": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "groupStructureAndEntityMaster": {
            "groupSnapshot": create_empty_group_snapshot(),
            "entities": [],
        },
        "ownershipControlAndRelationshipMapping": {
            "ownershipRelationships": [],
            "contractualArrangements": [],
            "commonPersonRelationships": [],
            "notes": "",
        },
        "groupCompanyAndMaterialityClassification": {
            "entityClassifications": [],
            "icdrGroupCompanyDeterminations": [],
            "materialityPolicy": create_empty_group_company_materiality_policy(),
            "materialityCriteria": [],
            "materialSubsidiaryPurposeRecords": [],
        },
        "relatedPartyUniverseAndClassification": {
            "relatedPartyRelationships": [],
        },
        "relatedPartyTransactionsBalancesAndCommitments": {
            "transactions": [],
            "balances": [],
        },
        "commonPursuitsDependenciesAndConflicts": {
            "commonPursuitScreenings": [],
            "commonPursuitRecords": [],
            "interCompanyDependencies": [],
            "otherBusinessInterests": [],
        },
        "groupEntityFinancialRegulatoryAndLitigationReadiness": {
            "entityFinancialReadiness": [],
        },
        "changesRptReadinessAndConfirmations": {
            "relationshipChanges": [],
            "groupCompanyClassificationReview": create_empty_group_company_classification_review(),
            "rptReadiness": create_empty_rpt_readiness(),
            "confirmations": create_empty_group_entities_confirmations(),
        },
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
