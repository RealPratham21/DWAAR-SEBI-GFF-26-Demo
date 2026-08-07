"""Empty-record factories for Borrowings, Assets & Contracts (BAC1)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.borrowings_assets_contracts.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_borrowing_snapshot() -> dict[str, Any]:
    return {
        "positionAsOfDate": "",
        "reportingCurrency": "",
        "displayUnit": "",
        "currentBorrowingsExist": "",
        "securedBorrowingsExist": "",
        "unsecuredBorrowingsExist": "",
        "workingCapitalFacilitiesExist": "",
        "nonFundBasedFacilitiesExist": "",
        "relatedPartyBorrowingsExist": "",
        "foreignCurrencyBorrowingsExist": "",
        "leaseLiabilitiesExist": "",
        "debtSecuritiesNcdsExist": "",
        "materialSubsidiaryFacilitiesRelevant": "",
    }


def create_empty_facility_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "borrower": {
            "borrowerType": "",
            "linkedGroupEntityId": "",
            "displayName": "",
        },
        "lender": {
            "lenderName": "",
            "lenderType": "",
            "branch": "",
            "contactReference": "",
            "relatedPartyStatus": "",
            "linkedGroupEntityId": "",
            "linkedRelatedPartyReference": "",
        },
        "facilityType": "",
        "fundBasedNonFundBased": "",
        "securedUnsecured": "",
        "sanctionAndUtilisation": {
            "sanctionLetterDate": "",
            "originalSanctionAmount": "",
            "currentSanctionedLimit": "",
            "currency": "",
            "amountUnit": "",
            "firstDisbursementDate": "",
            "totalAmountDisbursed": "",
            "amountRepaid": "",
            "principalOutstanding": "",
            "accruedInterest": "",
            "totalOutstanding": "",
            "undrawnAmount": "",
            "currentNonCurrentClassification": "",
            "lastBalanceConfirmationDate": "",
            "sourceStatus": "",
            "notes": "",
        },
        "interest": {
            "rateType": "",
            "benchmark": "",
            "benchmarkRate": "",
            "spread": "",
            "enteredEffectiveRate": "",
            "resetFrequency": "",
            "nextResetDate": "",
            "penalInterest": "",
            "defaultInterest": "",
            "interestPaymentFrequency": "",
        },
        "tenorAndRepayment": {
            "facilityStartDate": "",
            "maturityDate": "",
            "tenor": "",
            "moratorium": "",
            "repaymentType": "",
            "repaymentFrequency": "",
            "numberOfInstalments": "",
            "nextRepaymentDate": "",
            "finalRepaymentDate": "",
            "balloonPayment": "",
            "repaymentScheduleAvailable": "",
            "notes": "",
        },
        "purpose": {
            "purposes": [],
            "exactSanctionPurposeWording": "",
            "managementPurposeDescription": "",
        },
        "prepayment": {
            "prepaymentAllowed": "",
            "lenderConsentRequired": "",
            "lockIn": "",
            "noticePeriod": "",
            "prepaymentPremiumPenalty": "",
            "percentageOrFormula": "",
            "sourceOfFundsRestriction": "",
            "ipoProceedsTreatment": "",
            "otherConditions": "",
            "professionalReviewStatus": "",
        },
    }


def create_empty_security_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedFacilityId": "",
        "securityProvider": "",
        "linkedEntityId": "",
        "linkedPersonId": "",
        "securityType": "",
        "securedObject": "",
        "linkedPropertyId": "",
        "linkedAssetId": "",
        "assetDescription": "",
        "chargeRanking": "",
        "sharedWithAnotherLender": "",
        "otherLenders": "",
        "interCreditorAgreement": "",
        "chargeHolder": "",
        "amountSecured": "",
        "maximumSecuredAmount": "",
        "notes": "",
    }


def create_empty_charge_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedSecurityId": "",
        "linkedFacilityId": "",
        "chargeIdentifier": "",
        "creationDate": "",
        "modificationDate": "",
        "satisfactionDate": "",
        "status": "",
        "rocFilingTypeReference": "",
        "srn": "",
        "certificateReceived": "",
        "amountSecured": "",
        "chargeHolder": "",
        "assetDescription": "",
        "modificationPending": "",
        "satisfactionPending": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_guarantee_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "guaranteeType": "",
        "guarantor": "",
        "linkedPromoterDirectorEntityId": "",
        "borrower": "",
        "beneficiaryLender": "",
        "linkedFacilityId": "",
        "guaranteeDate": "",
        "guaranteeAmountCap": "",
        "continuingGuarantee": "",
        "expiry": "",
        "releaseConditions": "",
        "ipoListingReleaseProposed": "",
        "lenderConsentRequired": "",
        "invocationStatus": "",
        "counterGuarantee": "",
        "securitySupportingGuarantee": "",
        "currentStatus": "",
        "relatedPartyStatus": "",
        "purpose": "",
        "boardApproval": "",
        "shareholderApproval": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_borrowing_powers() -> dict[str, Any]:
    return {
        "boardBorrowingResolutionExists": "",
        "resolutionDateReference": "",
        "approvedBorrowingLimit": "",
        "shareholderBorrowingApprovalExists": "",
        "shareholderResolutionDateReference": "",
        "shareholderApprovedLimit": "",
        "articlesPermitBorrowing": "",
        "lenderImposedBorrowingCap": "",
        "authorityState": "",
        "notes": "",
    }


def create_empty_financial_covenant_details() -> dict[str, Any]:
    return {
        "covenantName": "",
        "category": "",
        "formula": "",
        "thresholdOperator": "",
        "thresholdValue": "",
        "testingFrequency": "",
        "latestTestedPeriod": "",
        "actualValue": "",
        "complianceStatus": "",
        "complianceCertificateSubmitted": "",
        "curePeriod": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_restrictive_covenant_details() -> dict[str, Any]:
    return {
        "trigger": "",
        "consentRequired": "",
        "priorIntimationRequired": "",
        "threshold": "",
        "exceptions": "",
        "currentStatus": "",
        "notes": "",
    }


def create_empty_covenant_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedFacilityId": "",
        "covenantType": "",
        "financialDetails": create_empty_financial_covenant_details(),
        "restrictiveDetails": create_empty_restrictive_covenant_details(),
    }


def create_empty_lender_consent_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedFacilityId": "",
        "lenderName": "",
        "ipoConsentRequirement": "",
        "requirementBasis": "",
        "consentRequested": "",
        "requestDate": "",
        "consentReceived": "",
        "consentDate": "",
        "conditionsAttached": "",
        "conditions": "",
        "conditionsSatisfied": "",
        "expiry": "",
        "followUpRequired": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_default_event_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedFacilityId": "",
        "eventType": "",
        "eventDate": "",
        "amount": "",
        "daysDelayed": "",
        "continuingStatus": "",
        "cureDate": "",
        "penalInterest": "",
        "waiverObtained": "",
        "waiverDate": "",
        "conditions": "",
        "auditorInformed": "",
        "financialStatementsDisclosureStatus": "",
        "notes": "",
    }


def create_empty_restructuring_event_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedFacilityId": "",
        "eventType": "",
        "eventDate": "",
        "reason": "",
        "amount": "",
        "concessionHaircut": "",
        "currentStatus": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_cross_default_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedFacilityId": "",
        "clauseExists": "",
        "linkedFacilityIds": [],
        "threshold": "",
        "trigger": "",
        "crossAcceleration": "",
        "currentlyTriggered": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_property_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "identity": {
            "propertyName": "",
            "address": "",
            "city": "",
            "state": "",
            "country": "",
            "surveyKhasraPlotNumber": "",
            "landArea": "",
            "builtUpArea": "",
            "areaUnit": "",
            "propertyType": "",
            "businessPurpose": "",
            "linkedBusinessOperationsFacilityId": "",
        },
        "occupancyBasis": "",
        "ownedDetails": {
            "legalOwner": "",
            "titleInIssuerName": "",
            "acquisitionDate": "",
            "seller": "",
            "relatedPartyStatus": "",
            "acquisitionConsideration": "",
            "titleDeedType": "",
            "titleDeedDate": "",
            "registrationDetails": "",
            "mutationStatus": "",
            "propertyTaxStatus": "",
            "possessionStatus": "",
            "encumbered": "",
            "linkedSecurityIds": [],
            "titleSearchStatus": "",
            "titleDefectStatus": "",
            "thirdPartyClaimStatus": "",
            "professionalTitleReviewStatus": "",
        },
        "leasedDetails": {
            "lessorLicensor": "",
            "linkedRelatedPartyEntityId": "",
            "relatedPartyStatus": "",
            "agreementType": "",
            "agreementDate": "",
            "commencement": "",
            "expiry": "",
            "lockIn": "",
            "monthlyAnnualRent": "",
            "securityDeposit": "",
            "escalation": "",
            "renewalOption": "",
            "renewalTerms": "",
            "noticePeriod": "",
            "terminationRights": "",
            "subLettingRights": "",
            "assignmentRights": "",
            "changeOfControlRestriction": "",
            "registrationRequirementStatus": "",
            "stampDutyStatus": "",
            "lessorTitleVerified": "",
            "renewalStatus": "",
            "notes": "",
        },
    }


def create_empty_property_issue_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedPropertyId": "",
        "issueType": "",
        "explanation": "",
        "readinessState": "",
        "remediation": "",
        "responsibleOwner": "",
        "targetResolutionDate": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_material_asset_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "description": "",
        "assetClass": "",
        "identificationSerialRegistrationNumber": "",
        "location": "",
        "linkedPropertyId": "",
        "linkedBusinessFacilityId": "",
        "legalOwner": "",
        "ownershipBasis": "",
        "acquisitionDate": "",
        "acquisitionCost": "",
        "latestBookValue": "",
        "operationalStatus": "",
        "materialToOperations": "",
        "imported": "",
        "vendor": "",
        "warrantyStatus": "",
        "amcStatus": "",
        "encumbered": "",
        "linkedSecurityIds": [],
        "linkedFacilityId": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_asset_financials_reconciliation(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedAssetId": "",
        "materialAssetRegisterValue": "",
        "linkedFinancialsAmount": "",
        "difference": "",
        "reconciliationStatus": "",
        "professionalReconciliationPending": "",
        "notes": "",
    }


def create_empty_insurance_linkage_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedPropertyId": "",
        "linkedAssetId": "",
        "linkedBusinessOperationsPolicyId": "",
        "insurer": "",
        "policyType": "",
        "coverageAmount": "",
        "assetPropertyCovered": "",
        "startDate": "",
        "expiryDate": "",
        "deductible": "",
        "lenderLossPayeeClause": "",
        "policyAssignedNotedToLender": "",
        "coverageStatus": "",
        "renewalStatus": "",
        "underInsuranceConcern": "",
        "notes": "",
    }


def create_empty_ip_contractual_dependency_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedBusinessOperationsIpRecordId": "",
        "ownedLicensed": "",
        "licensor": "",
        "relatedParty": "",
        "exclusiveNonExclusive": "",
        "transferable": "",
        "term": "",
        "termination": "",
        "changeOfControl": "",
        "encumbered": "",
        "securityGranted": "",
        "linkedContractId": "",
        "notes": "",
    }


def create_empty_contract_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "category": "",
        "parties": {
            "counterparty": "",
            "linkedGroupEntityId": "",
            "relatedPartyStatus": "",
            "role": "",
            "jurisdiction": "",
        },
        "basicTerms": {
            "agreementTitle": "",
            "executionDate": "",
            "effectiveDate": "",
            "expiry": "",
            "contractTerm": "",
            "autoRenewal": "",
            "renewalMechanism": "",
            "amendmentHistory": "",
            "status": "",
            "governingLaw": "",
            "disputeResolutionMechanism": "",
            "arbitrationSeatJurisdiction": "",
            "notes": "",
        },
        "commercialImportance": {
            "contractValue": "",
            "minimumCommitment": "",
            "annualRevenueCostAttributable": "",
            "percentageOfIssuerRevenueCost": "",
            "takeOrPay": "",
            "minimumPurchase": "",
            "minimumVolume": "",
            "exclusivity": "",
            "territory": "",
            "performanceMilestones": "",
            "sla": "",
            "pricingMechanism": "",
            "escalationMechanism": "",
        },
        "rightsAndObligations": {
            "materialIssuerObligations": "",
            "materialCounterpartyObligations": "",
            "conditionsPrecedent": "",
            "performanceGuarantee": "",
            "warranties": "",
            "indemnities": "",
            "limitationOfLiability": "",
            "liquidatedDamages": "",
            "penalties": "",
            "securityDeposit": "",
            "bankGuaranteePbg": "",
            "retention": "",
            "insuranceRequirement": "",
            "auditRights": "",
            "confidentiality": "",
            "ipOwnership": "",
            "dataRights": "",
            "nonCompete": "",
            "nonSolicit": "",
            "exclusivityClause": "",
            "mostFavouredCustomer": "",
            "changeInLaw": "",
            "forceMajeure": "",
            "rightsObligationsNotes": "",
        },
        "termination": {
            "terminationForConvenience": "",
            "terminationForBreach": "",
            "insolvencyTermination": "",
            "changeOfControlTermination": "",
            "ipoListingTrigger": "",
            "promoterChangeTrigger": "",
            "noticePeriod": "",
            "curePeriod": "",
            "terminationPayment": "",
            "survivalObligations": "",
        },
        "assignmentChangeOfControl": {
            "assignmentRestricted": "",
            "counterpartyConsentRequired": "",
            "changeOfControlConsentRequired": "",
            "ipoTreatedAsChangeOfControl": "",
            "promoterDilutionRestriction": "",
            "consentRequested": "",
            "consentReceived": "",
            "consentDate": "",
            "professionalReview": "",
        },
    }


def create_empty_contract_materiality_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedContractId": "",
        "ordinaryCourse": "",
        "materialOperationally": "",
        "materialFinancially": "",
        "materialDueToDependency": "",
        "materialDueToUnusualRightsObligations": "",
        "relatedPartyAgreement": "",
        "nonOrdinaryCourseAgreement": "",
        "enteredWithinPrecedingTwoYears": "",
        "stillSubsisting": "",
        "potentiallyRelevantToDrhp": "",
        "materialityStatus": "",
        "professionalMaterialityReview": "",
        "notes": "",
    }


def create_empty_non_ordinary_course_review_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedContractId": "",
        "reasonOutsideOrdinaryCourse": "",
        "executionDate": "",
        "stillSubsisting": "",
        "materialityBasis": "",
        "proposedDrhpLocation": "",
        "inspectionCandidate": "",
        "professionalConfirmation": "",
        "notes": "",
    }


def create_empty_breach_dispute_readiness_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedContractId": "",
        "currentBreach": "",
        "historicalMaterialBreach": "",
        "counterpartyAllegedIssuerBreach": "",
        "issuerAllegedCounterpartyBreach": "",
        "noticeReceived": "",
        "curePeriodActive": "",
        "terminationThreatened": "",
        "damagesClaimed": "",
        "disputeLitigationExists": "",
        "linkedFutureLitigationRecordId": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_inspection_candidate_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedContractId": "",
        "externalDocumentReference": "",
        "candidateType": "",
        "sourceWorkstream": "",
        "documentDate": "",
        "currentVersion": "",
        "executedFinal": "",
        "inspectionCandidate": "",
        "confidentialityConcern": "",
        "redactionProfessionalReview": "",
        "availabilityStatus": "",
        "notes": "",
    }


def create_empty_financials_reconciliation() -> dict[str, Any]:
    return {
        "bacFacilityTotal": "",
        "financialsValue": "",
        "difference": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_objects_of_issue_repayment_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedObjectsOfIssueRecordId": "",
        "linkedFacilityId": "",
        "lender": "",
        "proposedRepayment": "",
        "relevantOutstandingAmount": "",
        "accruedInterest": "",
        "prepaymentPenalty": "",
        "lenderConsentNocRequirement": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_group_entities_reconciliation() -> dict[str, Any]:
    return {
        "interCompanyLoansReconciled": "",
        "relatedPartyBorrowingsReconciled": "",
        "corporateGuaranteesReconciled": "",
        "securityCollateralReconciled": "",
        "groupDependenciesReconciled": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_capital_ownership_reconciliation() -> dict[str, Any]:
    return {
        "promotersReconciled": "",
        "promoterShareholdingReconciled": "",
        "pledgedEncumberedSharesReconciled": "",
        "guaranteeProvidersReconciled": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_business_operations_reconciliation() -> dict[str, Any]:
    return {
        "facilitiesMapped": "",
        "officesMapped": "",
        "plantsMapped": "",
        "warehousesMapped": "",
        "materialMachineryMapped": "",
        "ipMapped": "",
        "insuranceMapped": "",
        "reconciliationStatus": "",
        "notes": "",
    }


def create_empty_bac_change_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "eventType": "",
        "effectiveDate": "",
        "relatedRecordType": "",
        "relatedRecordId": "",
        "previousState": "",
        "newState": "",
        "reason": "",
        "approval": "",
        "sourceReference": "",
        "professionalReview": "",
        "notes": "",
    }


def create_empty_bac_confirmations() -> dict[str, Any]:
    return {
        "allMaterialBorrowingsDisclosed": "",
        "fundNonFundFacilitiesIncluded": "",
        "securedUnsecuredFacilitiesIncluded": "",
        "relatedPartyBorrowingsIncluded": "",
        "sanctionOutstandingAmountsCurrent": "",
        "repaymentTermsComplete": "",
        "prepaymentRestrictionsDisclosed": "",
        "allSecuritiesCollateralDisclosed": "",
        "personalGuaranteesDisclosed": "",
        "corporateGuaranteesDisclosed": "",
        "registrableChargesConsidered": "",
        "chargeModificationsSatisfactionsDisclosed": "",
        "financialCovenantsDisclosed": "",
        "restrictiveCovenantsDisclosed": "",
        "defaultsDelaysDisclosed": "",
        "waiversCuresDisclosed": "",
        "crossDefaultsDisclosed": "",
        "ipoChangeOfControlLenderConsentRequirementsReviewed": "",
        "lenderConsentsAccuratelyShown": "",
        "debtProposedForIpoRepaymentReconcilesWithObjects": "",
        "materialOwnedPropertiesDisclosed": "",
        "materialLeasedLicensedPremisesDisclosed": "",
        "relatedPartyPropertyArrangementsDisclosed": "",
        "titleLeaseIssuesDisclosed": "",
        "materialAssetEncumbrancesDisclosed": "",
        "criticalInsuranceLinkageCaptured": "",
        "materialContractsDisclosed": "",
        "nonOrdinaryCourseMaterialAgreementsConsidered": "",
        "expiryRenewalRisksDisclosed": "",
        "changeOfControlIpoClausesConsidered": "",
        "contractBreachesDisputesIdentified": "",
        "linkedWorkstreamDifferencesFlagged": "",
        "professionalConfirmationRequired": "",
    }


def create_empty_borrowings_assets_contracts_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "financialIndebtednessAndFacilityMaster": {
            "borrowingSnapshot": create_empty_borrowing_snapshot(),
            "facilities": [],
        },
        "securityChargesGuaranteesAndBorrowingPowers": {
            "securities": [],
            "charges": [],
            "guarantees": [],
            "borrowingPowers": create_empty_borrowing_powers(),
        },
        "covenantsDefaultsWaiversAndLenderConsents": {
            "covenants": [],
            "lenderConsents": [],
            "defaultEvents": [],
            "restructuringEvents": [],
            "crossDefaults": [],
        },
        "immovablePropertiesAndOccupancyRights": {
            "properties": [],
            "propertyIssues": [],
        },
        "materialAssetsEncumbranceAndInsuranceLinkage": {
            "assets": [],
            "assetFinancialsReconciliations": [],
            "insuranceLinkages": [],
            "ipContractualDependencies": [],
        },
        "materialBusinessStrategicAndOtherContracts": {
            "contracts": [],
        },
        "contractMaterialityExpiryAndInspectionReadiness": {
            "materialityRecords": [],
            "nonOrdinaryCourseReviews": [],
            "breachDisputeReadiness": [],
            "inspectionCandidates": [],
        },
        "reconciliationChangesAndIssuerConfirmations": {
            "financialsReconciliation": create_empty_financials_reconciliation(),
            "objectsOfIssueRepayments": [],
            "groupEntitiesReconciliation": create_empty_group_entities_reconciliation(),
            "capitalOwnershipReconciliation": create_empty_capital_ownership_reconciliation(),
            "businessOperationsReconciliation": create_empty_business_operations_reconciliation(),
            "changes": [],
            "confirmations": create_empty_bac_confirmations(),
        },
    }


def empty_payload() -> dict[str, Any]:
    return create_empty_borrowings_assets_contracts_payload()


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
