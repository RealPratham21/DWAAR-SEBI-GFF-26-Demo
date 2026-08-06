"""Empty canonical Capital & Ownership payload (schemaVersion 1) — mirrors frontend C1 exactly."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.capital_ownership.constants import SCHEMA_VERSION


def _new_id() -> str:
    return str(uuid4())


def create_empty_equity_share_class() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "className": "",
        "classType": "",
        "faceValuePerShare": "",
        "votingRightsPerShare": "",
        "authorisedShares": "",
        "issuedShares": "",
        "subscribedShares": "",
        "paidUpShares": "",
        "partlyPaidShares": "",
        "amountPaidUpPerPartlyPaidShare": "",
        "sharePremiumBalance": "",
        "callsUnpaidAmount": "",
        "sharesForfeited": "",
        "isin": "",
        "dematStatus": "",
        "sharesInDematerialisedForm": "",
        "rightsAndRestrictions": "",
        "notes": "",
    }


def create_empty_preference_share_class() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "className": "",
        "classType": "",
        "faceValuePerShare": "",
        "authorisedShares": "",
        "issuedShares": "",
        "paidUpShares": "",
        "dividendRatePercentage": "",
        "isCumulative": "",
        "isParticipating": "",
        "isConvertible": "",
        "conversionTerms": "",
        "potentialEquitySharesOnConversion": "",
        "isRedeemable": "",
        "redemptionDate": "",
        "redemptionAmount": "",
        "carriesVotingRights": "",
        "votingRightsDescription": "",
        "isin": "",
        "notes": "",
    }


def create_empty_capital_event() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "eventDate": "",
        "eventType": "",
        "securityType": "",
        "description": "",
        "numberOfShares": "",
        "faceValuePerShare": "",
        "issuePricePerShare": "",
        "premiumPerShare": "",
        "totalConsiderationAmount": "",
        "considerationType": "",
        "considerationDetails": "",
        "splitOrConsolidationRatioFrom": "",
        "splitOrConsolidationRatioTo": "",
        "preEventFaceValuePerShare": "",
        "postEventFaceValuePerShare": "",
        "numberOfAllottees": "",
        "alloteesDescription": "",
        "includesPromoterAllotment": "",
        "promoterSharesInEvent": "",
        "isRelatedPartyAllotment": "",
        "resolutionType": "",
        "resolutionDate": "",
        "resolutionReference": "",
        "formFiledWithRoc": "",
        "filingSrn": "",
        "filingDate": "",
        "rocFilingCompleted": "",
        "valuationReportObtained": "",
        "valuerName": "",
        "valuationDate": "",
        "lockInImplication": "",
        "supportingDocumentReference": "",
        "notes": "",
    }


def create_empty_shareholder() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "name": "",
        "holderType": "",
        "category": "",
        "residentialStatus": "",
        "nationality": "",
        "identifierType": "",
        "identifierValue": "",
        "directorIdentificationNumber": "",
        "equityClassId": "",
        "equitySharesHeld": "",
        "preferenceSharesHeld": "",
        "sharesInDematerialisedForm": "",
        "sharesInPhysicalForm": "",
        "folioOrDpClientId": "",
        "dateOfEarliestAcquisition": "",
        "dateOfLatestAcquisition": "",
        "modeOfAcquisition": "",
        "averageCostOfAcquisitionPerShare": "",
        "votingRightsDifferFromShareholding": "",
        "votingRightsPercentageIfDifferent": "",
        "sharesEncumbered": "",
        "isPartOfPromoterGroup": "",
        "beneficialOwnerIsDifferent": "",
        "beneficialOwnerName": "",
        "isSellingShareholderInOffer": "",
        "notes": "",
    }


def create_empty_beneficial_owner() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "name": "",
        "linkedShareholderId": "",
        "identifierType": "",
        "identifierValue": "",
        "nationality": "",
        "residentialStatus": "",
        "isSignificantBeneficialOwner": "",
        "natureOfInterest": "",
        "directHoldingPercentage": "",
        "indirectHoldingPercentage": "",
        "chainOfOwnershipDescription": "",
        "dateOfBecomingBeneficialOwner": "",
        "declarationInFormBen1Received": "",
        "formBen2Filed": "",
        "formBen2SrnOrReference": "",
        "registerInFormBen3Maintained": "",
        "notes": "",
    }


def create_empty_promoter() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "name": "",
        "promoterType": "",
        "linkedShareholderId": "",
        "identifierType": "",
        "identifierValue": "",
        "directorIdentificationNumber": "",
        "nationality": "",
        "residentialStatus": "",
        "dateOfBecomingPromoter": "",
        "basisOfPromoterStatus": "",
        "basisExplanation": "",
        "equitySharesHeld": "",
        "isAlsoDirector": "",
        "designation": "",
        "relationshipWithOtherPromoters": "",
        "isPartOfPromoterSellingInOffer": "",
        "notes": "",
    }


def create_empty_promoter_group_member() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "name": "",
        "relatedPromoterId": "",
        "linkedShareholderId": "",
        "memberType": "",
        "relationshipToPromoter": "",
        "inclusionBasis": "",
        "inclusionBasisExplanation": "",
        "identifierType": "",
        "identifierValue": "",
        "isShareholder": "",
        "equitySharesHeld": "",
        "notes": "",
    }


def create_empty_control_arrangement() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "arrangementType": "",
        "arrangementName": "",
        "partiesInvolved": "",
        "effectiveDate": "",
        "expiryDate": "",
        "keyRightsSummary": "",
        "conferControlOverIssuer": "",
        "survivesPostListing": "",
        "terminationOnListingAgreed": "",
        "amendmentRequiredBeforeFiling": "",
        "disclosedInOfferDocument": "",
        "documentReference": "",
        "notes": "",
    }


def create_empty_shareholder_offer_overlay(shareholder_id: str = "") -> dict[str, Any]:
    return {
        "id": _new_id(),
        "shareholderId": shareholder_id,
        "sharesOfferedForSale": "",
        "otherExpectedPreIssueTransfer": "",
        "notes": "",
    }


def create_empty_promoter_contribution_lot() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "promoterId": "",
        "shareholderId": "",
        "holderName": "",
        "numberOfShares": "",
        "faceValuePerShare": "",
        "dateOfAcquisition": "",
        "dateOfAllotmentOrTransfer": "",
        "modeOfAcquisition": "",
        "acquisitionPricePerShare": "",
        "considerationType": "",
        "fullyPaidUp": "",
        "dematerialised": "",
        "eligibleForMinimumPromoterContribution": "",
        "ineligibilityReason": "",
        "proposedLockInPeriod": "",
        "lockInStartDateBasis": "",
        "isEncumbered": "",
        "isin": "",
        "notes": "",
    }


def create_empty_encumbrance() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "shareholderId": "",
        "holderName": "",
        "holderCategory": "",
        "encumbranceType": "",
        "numberOfSharesEncumbered": "",
        "inFavourOf": "",
        "purpose": "",
        "createdDate": "",
        "expectedReleaseDate": "",
        "willBeReleasedBeforeFiling": "",
        "releasePlan": "",
        "affectsPromoterContributionShares": "",
        "disclosedToStockExchangeOrDepository": "",
        "documentReference": "",
        "notes": "",
    }


def create_empty_outstanding_instrument() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "instrumentType": "",
        "schemeOrInstrumentName": "",
        "dateOfGrantOrIssue": "",
        "numberOfInstrumentsOutstanding": "",
        "potentialEquitySharesOnConversion": "",
        "conversionOrExercisePricePerShare": "",
        "conversionRatio": "",
        "conversionOrExercisePeriod": "",
        "vestedInstrumentsOutstanding": "",
        "unvestedInstrumentsOutstanding": "",
        "holderCategory": "",
        "numberOfHolders": "",
        "willConvertOrLapseBeforeFiling": "",
        "expectedConversionOrLapseDate": "",
        "shareholderApprovalObtained": "",
        "compliantWithShareBasedBenefitRegulations": "",
        "documentReference": "",
        "notes": "",
    }


def create_empty_recent_transaction() -> dict[str, Any]:
    return {
        "id": _new_id(),
        "transactionDate": "",
        "transactionType": "",
        "transferorName": "",
        "transferorCategory": "",
        "transfereeName": "",
        "transfereeCategory": "",
        "numberOfShares": "",
        "pricePerShare": "",
        "totalConsideration": "",
        "considerationType": "",
        "involvesPromoterOrPromoterGroup": "",
        "isRelatedPartyTransaction": "",
        "valuationBasis": "",
        "formSh4OrTransferDeedAvailable": "",
        "disclosedInOfferDocument": "",
        "notes": "",
    }


def create_empty_capital_ownership_confirmations() -> dict[str, Any]:
    return {
        "capitalStructureFiguresMatchStatutoryRegisters": False,
        "shareCapitalHistoryIsComplete": False,
        "shareholdingDetailsAreCurrentAsOnStatedDate": False,
        "promoterAndPromoterGroupIdentificationIsComplete": False,
        "allOutstandingConvertibleInstrumentsDisclosed": False,
        "allEncumbrancesOnPromoterSharesDisclosed": False,
        "noUndisclosedShareholderAgreementsOrControlArrangements": False,
        "offerForSaleSharesAreWithinExistingHoldings": False,
        "missingAnswersMustNotBeInterpretedAsNegative": False,
        "computedFiguresAreIndicativeOnly": False,
        "professionalAndRegistrarConfirmationRemainRequired": False,
    }


def create_empty_current_capital_structure() -> dict[str, Any]:
    return {
        "amountDisplayUnit": "rupees",
        "asOnDate": "",
        "equityClasses": [create_empty_equity_share_class()],
        "hasPreferenceShares": "",
        "preferenceClasses": [],
        "authorisedEquityShareCapital": "",
        "authorisedPreferenceShareCapital": "",
        "totalAuthorisedShareCapitalAsPerMoa": "",
        "issuedEquityShareCapital": "",
        "subscribedEquityShareCapital": "",
        "paidUpEquityShareCapital": "",
        "paidUpPreferenceShareCapital": "",
        "paidUpCapitalAsPerLatestAuditedFinancials": "",
        "latestAuditedFinancialYearEnd": "",
        "shareCapitalMatchesMcaRecords": "",
        "discrepancyWithMcaRecordsExplanation": "",
        "allSharesFullyPaidUp": "",
        "partlyPaidSharesOutstanding": "",
        "partlyPaidSharesDetails": "",
        "hasCallsInArrears": "",
        "callsInArrearsExplanation": "",
        "hasForfeitedShares": "",
        "forfeitedSharesExplanation": "",
        "hasCapitalReduction": "",
        "capitalReductionExplanation": "",
        "sharesWithDifferentialVotingRightsExist": "",
        "differentialVotingRightsDetails": "",
        "capitalAlterationCurrentlyPending": "",
        "capitalAlterationPendingExplanation": "",
        "equityIsin": "",
        "depositoryConnectivity": "",
        "registrarAndTransferAgentName": "",
        "dematStatusOverall": "",
        "lastCapitalChangeDate": "",
        "authorisedCapitalSufficientForProposedIssue": "",
        "authorisedCapitalIncreaseRequiredAmount": "",
        "notes": "",
    }


def create_empty_share_capital_history() -> dict[str, Any]:
    return {
        "historyCoversPeriodSinceIncorporation": "",
        "historyStartDate": "",
        "capitalEvents": [],
        "allHistoricalAllotmentsDocumented": "",
        "gapsInHistoryExplanation": "",
        "historyReconciledWithMcaFilings": "",
        "historyReconciledWithRegisterOfMembers": "",
        "reconciliationDifferenceExplanation": "",
        "bonusIssueInLastTwelveMonths": "",
        "bonusIssueOutOfRevaluationReserves": "",
        "sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths": "",
        "sharesIssuedAtDifferentPricesInLastTwelveMonths": "",
        "differentialPricingExplanation": "",
        "anyPendingAllotments": "",
        "pendingAllotmentDetails": "",
        "shareApplicationMoneyPendingAllotment": "",
        "notes": "",
    }


def create_empty_shareholders_and_beneficial_ownership() -> dict[str, Any]:
    return {
        "shareholdingAsOnDate": "",
        "shareholders": [],
        "beneficialOwners": [],
        "totalNumberOfShareholders": "",
        "registerOfMembersMaintained": "",
        "registerOfMembersUpToDate": "",
        "shareholdingReconciledWithRegisterOfMembers": "",
        "significantBeneficialOwnerDeterminationCompleted": "",
        "significantBeneficialOwnerNotApplicableReason": "",
        "nomineeShareholdersExist": "",
        "nomineeShareholderDetails": "",
        "foreignShareholdingExists": "",
        "foreignDirectInvestmentComplianceConfirmed": "",
        "formFcGprFilingsCompleted": "",
        "sectoralCapComplianceConfirmed": "",
        "foreignInvestmentNotes": "",
        "anyShareholderAgreementsWithInvestors": "",
        "investorAgreementSummary": "",
        "notes": "",
    }


def create_empty_promoters_and_control() -> dict[str, Any]:
    return {
        "companyHasIdentifiedPromoter": "",
        "noPromoterExplanation": "",
        "promoters": [],
        "promoterGroupMembers": [],
        "controlArrangements": [],
        "promoterIdentificationComplete": "",
        "promoterGroupIdentificationComplete": "",
        "anyPersonExercisingControlWithoutShareholding": "",
        "controlWithoutShareholdingDetails": "",
        "changeInControlInLastThreeYears": "",
        "changeInControlDetails": "",
        "anyPromoterIsBodyCorporate": "",
        "promoterBodyCorporateOwnershipDisclosed": "",
        "anyPromoterClassifiedAsWilfulDefaulter": "",
        "promoterDisqualificationDetails": "",
        "professionalConfirmationOnPromoterIdentification": "",
        "notes": "",
    }


def create_empty_pre_and_post_issue_ownership() -> dict[str, Any]:
    return {
        "shareholderOverlays": [],
        "freshIssueSharesOverride": "",
        "freshIssueOverrideReason": "",
        "expectedPreIpoPlacementShares": "",
        "expectedConversionSharesBeforeIssue": "",
        "expectedEsopAllotmentSharesBeforeIssue": "",
        "preIssueCapitalConfirmedWithLeadManager": "",
        "sellingShareholderConsentsObtained": "",
        "sellingShareholderEligibilityConfirmed": "",
        "offerForSaleSharesHeldForRequiredPeriod": "",
        "anyExpectedPreIssueTransfers": "",
        "expectedPreIssueTransferDetails": "",
        "notes": "",
    }


def create_empty_promoter_contribution_lock_in_and_encumbrances() -> dict[str, Any]:
    return {
        "minimumPromoterContributionApplicable": "",
        "exemptionFromMinimumContributionClaimed": "",
        "exemptionBasis": "",
        "targetMinimumContributionPercentage": "",
        "proposedMinimumContributionShares": "",
        "contributionLots": [],
        "encumbrances": [],
        "contributionBroughtInBeforeIssueOpening": "",
        "sharesIneligibleForContributionExist": "",
        "ineligibleSharesDetails": "",
        "entirePreIssueCapitalLockInUnderstood": "",
        "preIssueCapitalExemptFromLockInShares": "",
        "preIssueCapitalExemptFromLockInBasis": "",
        "anyEncumbranceOnPromoterShares": "",
        "encumbranceReleaseBeforeLockInConfirmed": "",
        "lockInSharesToBeHeldInDematerialisedForm": "",
        "lockInComplianceProfessionallyConfirmed": "",
        "notes": "",
    }


def create_empty_outstanding_securities_transactions_and_confirmations() -> dict[str, Any]:
    return {
        "anyOutstandingConvertibleInstruments": "",
        "outstandingInstruments": [],
        "allConvertiblesToBeSettledBeforeFiling": "",
        "outstandingInstrumentNotes": "",
        "anyTransactionsInLastEighteenMonths": "",
        "recentTransactions": [],
        "weightedAverageCostDisclosureRequired": "",
        "transactionNotes": "",
        "allSharesDematerialisedBeforeFiling": "",
        "anyPendingShareTransfers": "",
        "pendingShareTransferDetails": "",
        "anyDisputesOverTitleToShares": "",
        "titleDisputeDetails": "",
        "confirmations": create_empty_capital_ownership_confirmations(),
        "notes": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "currentCapitalStructure": create_empty_current_capital_structure(),
        "shareCapitalHistory": create_empty_share_capital_history(),
        "shareholdersAndBeneficialOwnership": create_empty_shareholders_and_beneficial_ownership(),
        "promotersAndControl": create_empty_promoters_and_control(),
        "preAndPostIssueOwnership": create_empty_pre_and_post_issue_ownership(),
        "promoterContributionLockInAndEncumbrances": (
            create_empty_promoter_contribution_lock_in_and_encumbrances()
        ),
        "outstandingSecuritiesTransactionsAndConfirmations": (
            create_empty_outstanding_securities_transactions_and_confirmations()
        ),
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
