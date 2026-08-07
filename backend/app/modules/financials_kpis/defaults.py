"""Empty canonical Financials & KPIs payload (schemaVersion 1) — mirrors frontend F1 exactly."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from app.modules.financials_kpis.constants import SCHEMA_VERSION


def _new_id(id_: str | None = None) -> str:
    return id_ or str(uuid4())


def create_empty_reporting_basis() -> dict[str, Any]:
    return {
        "financialYearEnd": "",
        "accountingFramework": "",
        "financialPresentation": "",
        "currency": "",
        "displayUnit": "",
        "roundingConvention": "",
        "ociApplies": "",
        "cashFlowAvailable": "",
        "changesInEquityAvailable": "",
        "comparativePeriodConsistency": "",
        "subsidiariesDeclared": "",
        "associatesDeclared": "",
        "jointVenturesDeclared": "",
        "foreignEntitiesDeclared": "",
        "recentlyAcquiredDisposedDeclared": "",
        "predecessorEntityDeclared": "",
        "promotingCompanyTrackRecordDeclared": "",
        "notes": "",
    }


def create_empty_reporting_entity(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "name": "",
        "entityType": "",
        "country": "",
        "ownershipPct": "",
        "consolidationMethod": "",
        "includedFromPeriodId": "",
        "excludedFromPeriodId": "",
        "exclusionReason": "",
        "financialStatementsAvailable": "",
        "auditedStatus": "",
        "linkedGroupEntityId": "",
        "notes": "",
    }


def create_empty_financial_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "label": "",
        "startDate": "",
        "endDate": "",
        "months": "",
        "fullYearOrInterim": "",
        "comparablePeriodId": "",
        "basis": "",
        "auditedStatus": "",
        "restatedStatus": "",
        "boardApprovalStatus": "",
        "auditReportDate": "",
        "restatementReportDate": "",
        "sourceStatus": "",
        "finalisationStatus": "",
        "notes": "",
    }


def create_empty_auditor_readiness() -> dict[str, Any]:
    return {
        "currentStatutoryAuditor": "",
        "firmRegistrationNumber": "",
        "signingPartner": "",
        "peerReviewStatus": "",
        "peerReviewCertificateValidity": "",
        "appointmentPeriod": "",
        "restatementAuditor": "",
        "restatementEngagementStatus": "",
        "restatementExerciseStatus": "",
        "expectedCompletionDate": "",
        "restatedInformationBoardApproved": "",
        "approvalDateReference": "",
        "latestFilingReadyPeriodId": "",
        "financialInformationSufficientlyCurrent": "",
        "professionalConfirmationStatus": "",
        "notes": "",
    }


def create_empty_auditor_change_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "previousAuditor": "",
        "appointmentResignationDate": "",
        "reason": "",
        "disagreementWithManagement": "",
        "professionalClearanceStatus": "",
        "disclosureReference": "",
        "notes": "",
    }


def create_empty_reporting_scope_periods_and_auditor_readiness() -> dict[str, Any]:
    return {
        "reportingBasis": create_empty_reporting_basis(),
        "reportingEntities": [],
        "financialPeriods": [],
        "auditorReadiness": create_empty_auditor_readiness(),
        "auditorChangeRecords": [],
        "notes": "",
    }


def create_empty_pl_line_value(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "lineKey": "",
        "amount": "",
        "sourceStatus": "",
        "note": "",
        "adjustmentPresent": "",
        "managementExplanation": "",
        "professionalConfirmationStatus": "",
    }


def create_empty_exceptional_item(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "title": "",
        "description": "",
        "amount": "",
        "incomeOrExpense": "",
        "cashOrNonCash": "",
        "recurringOrNonRecurring": "",
        "includedInEbitda": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_per_share_by_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "weightedAvgBasicShares": "",
        "weightedAvgDilutedShares": "",
        "basicEps": "",
        "dilutedEps": "",
        "faceValue": "",
        "retrospectiveCapitalAdjustmentApplied": "",
        "bonusSplitConsolidationAdjustmentStatus": "",
        "notes": "",
    }


def create_empty_restated_statement_of_profit_and_loss() -> dict[str, Any]:
    return {
        "plLineValues": [],
        "exceptionalItems": [],
        "perShareByPeriod": [],
        "notes": "",
    }


def create_empty_balance_sheet_line_value(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "lineKey": "",
        "amount": "",
        "sourceStatus": "",
        "note": "",
    }


def create_empty_cash_flow_line_value(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "lineKey": "",
        "amount": "",
        "sourceStatus": "",
        "note": "",
    }


def create_empty_changes_in_equity_line_value(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "lineKey": "",
        "amount": "",
        "sourceStatus": "",
        "note": "",
    }


def create_empty_assets_liabilities_equity_and_cash_flows() -> dict[str, Any]:
    return {
        "balanceSheetLineValues": [],
        "cashFlowLineValues": [],
        "changesInEquityLineValues": [],
        "notes": "",
    }


def create_empty_restatement_adjustment(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "financialStatement": "",
        "originalLineItem": "",
        "originalAuditedAmount": "",
        "adjustmentAmount": "",
        "restatedAmount": "",
        "debitCreditDirection": "",
        "category": "",
        "detailedRationale": "",
        "accountingStandardReference": "",
        "taxEffect": "",
        "cashOrNonCash": "",
        "recurringOrNonRecurring": "",
        "epsImpact": "",
        "netWorthImpact": "",
        "auditorReviewStatus": "",
        "professionalConclusionStatus": "",
        "reference": "",
        "notes": "",
    }


def create_empty_accounting_policy(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "policyCategory": "",
        "existingTreatment": "",
        "changeDuringPeriod": "",
        "effectiveDate": "",
        "reason": "",
        "financialImpact": "",
        "retrospectiveProspectiveTreatment": "",
        "auditorConfirmationStatus": "",
        "notes": "",
    }


def create_empty_audit_report_matter(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "auditOpinion": "",
        "qualificationReservation": "",
        "emphasisOfMatter": "",
        "keyAuditMatter": "",
        "goingConcernUncertainty": "",
        "internalFinancialControlQualification": "",
        "caroRemark": "",
        "fraudReported": "",
        "statutoryDuesDefaultDelay": "",
        "accountingSystemOrAuditTrailConcern": "",
        "managementResponse": "",
        "adjustedInRestatedInformation": "",
        "ifNotAdjustedReason": "",
        "resolutionStatus": "",
        "reference": "",
        "notes": "",
    }


def create_empty_restatement_adjustments_policies_and_auditor_matters() -> dict[str, Any]:
    return {
        "restatementAdjustments": [],
        "accountingPolicies": [],
        "auditReportMatters": [],
        "notes": "",
    }


def create_empty_segment_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "linkedBusinessSegmentId": "",
        "segmentName": "",
        "productsServices": "",
        "externalRevenue": "",
        "interSegmentRevenue": "",
        "totalSegmentRevenue": "",
        "segmentResult": "",
        "segmentAssets": "",
        "segmentLiabilities": "",
        "capitalExpenditure": "",
        "depreciation": "",
        "reconciliationToCompanyTotals": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_related_party_transaction(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "relatedPartyEntity": "",
        "relationship": "",
        "transactionType": "",
        "periodId": "",
        "transactionAmount": "",
        "outstandingBalance": "",
        "relevantPercentage": "",
        "armsLengthStatus": "",
        "approvalStatus": "",
        "restatedFinancialNoteReference": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_contingent_liability(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "category": "",
        "description": "",
        "authorityCounterparty": "",
        "periodId": "",
        "amountClaimed": "",
        "amountProvided": "",
        "contingentAmount": "",
        "probabilityStatus": "",
        "forum": "",
        "currentStage": "",
        "expectedFinancialEffect": "",
        "linkedLitigationReference": "",
        "noteReference": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_working_capital_summary(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "currentAssets": "",
        "currentLiabilities": "",
        "netWorkingCapital": "",
        "inventory": "",
        "receivables": "",
        "payables": "",
        "inventoryDays": "",
        "receivableDays": "",
        "payableDays": "",
        "cashConversionCycle": "",
        "workingCapitalBorrowings": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_indebtedness_summary() -> dict[str, Any]:
    return {
        "longTermDebt": "",
        "shortTermDebt": "",
        "currentMaturities": "",
        "leaseLiabilities": "",
        "totalDebt": "",
        "securedDebt": "",
        "unsecuredDebt": "",
        "relatedPartyDebt": "",
        "cashAndCashEquivalents": "",
        "netDebt": "",
        "undrawnFacilities": "",
        "defaultsDelays": "",
        "debtProposedForIpoRepayment": "",
        "sourceStatus": "",
        "notes": "",
    }


def create_empty_tax_by_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "currentTax": "",
        "deferredTax": "",
        "effectiveTaxRate": "",
        "taxLossesCarriedForward": "",
        "unabsorbedDepreciation": "",
        "deferredTaxAssetsRecognised": "",
        "deferredTaxAssetsNotRecognised": "",
        "materialIncentivesExemptions": "",
        "taxDisputes": "",
        "auditorConfirmationStatus": "",
        "notes": "",
    }


def create_empty_dividend_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "dividendDeclared": "",
        "dividendPaid": "",
        "dividendPerShare": "",
        "totalDividendAmount": "",
        "payoutRatio": "",
        "sourceOfDividend": "",
        "boardApproval": "",
        "shareholderApproval": "",
        "unpaidDividend": "",
        "lendingRestriction": "",
        "notes": "",
    }


def create_empty_dividend_policy() -> dict[str, Any]:
    return {
        "policyExists": "",
        "approvalDate": "",
        "factorsConsidered": "",
        "futureDividendDiscretionary": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_other_financial_information() -> dict[str, Any]:
    return {
        "segmentRecords": [],
        "relatedPartyTransactions": [],
        "contingentLiabilities": [],
        "workingCapitalSummaries": [],
        "indebtednessSummary": create_empty_indebtedness_summary(),
        "taxByPeriod": [],
        "dividendRecords": [],
        "dividendPolicy": create_empty_dividend_policy(),
        "notes": "",
    }


def create_empty_formula_record(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "metricKey": "",
        "displayName": "",
        "definition": "",
        "formula": "",
        "components": "",
        "excludedItems": "",
        "reconciliationToFinancialStatement": "",
        "comparableAcrossPeriods": "",
        "methodologyChanged": "",
        "changeExplanation": "",
        "sourceStatus": "",
        "professionalConfirmationStatus": "",
        "notes": "",
    }


def create_empty_sme_eligibility_by_period(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "periodId": "",
        "operatingProfit": "",
        "operatingProfitFormula": "",
        "netWorth": "",
        "fcfe": "",
        "fcfeFormula": "",
        "sourceStatus": "",
        "auditorCertificateStatus": "",
        "notes": "",
    }


def create_empty_ratios_capitalisation_and_issue_price_metrics() -> dict[str, Any]:
    return {
        "formulaRecords": [],
        "smeEligibilityByPeriod": [],
        "notes": "",
    }


def create_empty_selected_data_candidate(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "metricName": "",
        "category": "",
        "definition": "",
        "unit": "",
        "valuesByPeriod": [],
        "sourceType": "",
        "sharedWithInvestorsPriorThreeYears": "",
        "sharingDateContext": "",
        "relatedCapitalTransaction": "",
        "presentedToBoardAuditCommittee": "",
        "historicallyUsedByManagement": "",
        "usedInIssuePriceDeliberations": "",
        "usedByPeers": "",
        "verifiable": "",
        "certifiable": "",
        "containsProjections": "",
        "confidentialBusinessSensitive": "",
        "relevantToCurrentBusiness": "",
        "proposedTreatment": "",
        "exclusionRationale": "",
        "managementNotes": "",
    }


def create_empty_kpi_register_entry(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "linkedSelectedDataId": "",
        "name": "",
        "category": "",
        "drhpLocation": "",
        "plainEnglishDefinition": "",
        "formula": "",
        "numerator": "",
        "denominator": "",
        "components": "",
        "unit": "",
        "currency": "",
        "frequency": "",
        "valuesByPeriod": [],
        "source": "",
        "dataOwner": "",
        "whyManagementTracksIt": "",
        "performanceRelevance": "",
        "valuationRelevance": "",
        "limitations": "",
        "methodologyChanges": "",
        "comparableAcrossPeriods": "",
        "restatementRecalculationRequired": "",
        "professionalCertificationStatus": "",
        "notes": "",
    }


def create_empty_peer_comparison(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "companyName": "",
        "exchange": "",
        "country": "",
        "industry": "",
        "businessModel": "",
        "selectionRationale": "",
        "comparableSizeExplanation": "",
        "differencesFromIssuer": "",
        "indianOrGlobal": "",
        "reportingFramework": "",
        "financialYear": "",
        "sourcePublicationDate": "",
        "currency": "",
        "conversionRateSource": "",
        "revenueTotalIncome": "",
        "eps": "",
        "pe": "",
        "ronw": "",
        "nav": "",
        "kpiValues": "",
        "notes": "",
    }


def create_empty_management_certification() -> dict[str, Any]:
    return {
        "status": "",
        "signatoryRole": "",
        "signatoryName": "",
        "certificationDate": "",
        "accuracyConfirmed": "",
        "historicalUseConfirmed": "",
        "projectionsExcluded": "",
        "managementNotePrepared": "",
        "reference": "",
        "notes": "",
    }


def create_empty_audit_committee_governance() -> dict[str, Any]:
    return {
        "auditCommitteeConstituted": "",
        "selectedDataPresented": "",
        "kpiDisclosuresPresented": "",
        "exclusionRationalesPresented": "",
        "peerDataPresented": "",
        "definitionsFormulasReviewed": "",
        "approvalStatus": "",
        "meetingDate": "",
        "resolutionReference": "",
        "minutesAvailable": "",
        "changesRequested": "",
        "changesImplemented": "",
        "finalApprovalDate": "",
        "notes": "",
    }


def create_empty_professional_certification() -> dict[str, Any]:
    return {
        "certifyingProfessional": "",
        "professionalType": "",
        "firm": "",
        "peerReviewStatus": "",
        "peerReviewValidity": "",
        "engagementDate": "",
        "certificationStatus": "",
        "certificateDate": "",
        "udinReference": "",
        "qualificationsLimitations": "",
        "materialDocumentInspectionStatus": "",
        "notes": "",
    }


def create_empty_ongoing_disclosure_readiness() -> dict[str, Any]:
    return {
        "reportingFrequency": "",
        "responsibleFunction": "",
        "auditCommitteeProcess": "",
        "boardProcess": "",
        "professionalCertificationProcess": "",
        "kpiNoLongerRelevantHandling": "",
        "exclusionRationaleProcess": "",
        "reportingOwner": "",
        "notes": "",
    }


def create_empty_kpi_selection_governance_and_peer_comparison() -> dict[str, Any]:
    return {
        "selectedDataCandidates": [],
        "kpiRegister": [],
        "peerComparisons": [],
        "suitablePeersFoundCount": "",
        "searchPerformed": "",
        "fewerThanThreePeersReason": "",
        "professionalReviewStatus": "",
        "managementCertification": create_empty_management_certification(),
        "auditCommitteeGovernance": create_empty_audit_committee_governance(),
        "professionalCertification": create_empty_professional_certification(),
        "ongoingDisclosureReadiness": create_empty_ongoing_disclosure_readiness(),
        "notes": "",
    }


def create_empty_performance_factor(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "title": "",
        "category": "",
        "affectedFinancialLineItems": "",
        "periodsAffected": "",
        "quantifiedImpact": "",
        "explanation": "",
        "temporaryOrContinuing": "",
        "managementResponse": "",
        "linkedRiskFactor": "",
        "supportingSource": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_variance_analysis(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "lineItem": "",
        "previousPeriodId": "",
        "currentPeriodId": "",
        "previousValue": "",
        "currentValue": "",
        "explanation": "",
        "primaryDriver": "",
        "oneOffOrRecurring": "",
        "supportingSource": "",
        "managementConfirmation": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_liquidity_capital_resources() -> dict[str, Any]:
    return {
        "principalLiquiditySources": "",
        "cashAvailable": "",
        "workingCapitalFacilities": "",
        "undrawnLimits": "",
        "operatingCashFlowAdequacy": "",
        "debtRepaymentsDue": "",
        "capitalCommitments": "",
        "expectedCapex": "",
        "restrictedCash": "",
        "dividendRestrictions": "",
        "covenantConcerns": "",
        "goingConcernConcerns": "",
        "managementResponse": "",
        "notes": "",
    }


def create_empty_trend_uncertainty(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "title": "",
        "category": "",
        "description": "",
        "periodObserved": "",
        "financialAreasAffected": "",
        "quantifiedHistoricalImpact": "",
        "expectedNatureOfImpact": "",
        "supportingSource": "",
        "relatedRiskFactor": "",
        "professionalReviewStatus": "",
        "notes": "",
    }


def create_empty_subsequent_event(id_: str | None = None) -> dict[str, Any]:
    return {
        "id": _new_id(id_),
        "eventDate": "",
        "eventType": "",
        "description": "",
        "financialImpact": "",
        "amountKnown": "",
        "adjustingNonAdjusting": "",
        "includedInFinancialInformation": "",
        "updatedInterimInformationRequired": "",
        "auditorNotified": "",
        "boardNotified": "",
        "drhpChaptersAffected": "",
        "professionalConclusion": "",
        "notes": "",
    }


def create_empty_financials_kpis_confirmations() -> dict[str, Any]:
    return {
        "reportingScopeAndEntitiesComplete": False,
        "periodsAreCorrect": False,
        "valuesMatchIdentifiedSources": False,
        "shareCapitalReconcilesWithCapitalOwnership": False,
        "revenueSegmentsReconcileWithBusinessOperations": False,
        "workingCapitalReconcilesWithObjectsOfIssue": False,
        "borrowingTotalsReconcileWithAvailableRecords": False,
        "restatementAdjustmentsComplete": False,
        "auditorRemarksDisclosed": False,
        "exceptionalItemsDisclosed": False,
        "relatedPartyTransactionsComplete": False,
        "contingenciesAndCommitmentsComplete": False,
        "subsequentDevelopmentsDisclosed": False,
        "investorSharedHistoricalMetricsConsidered": False,
        "boardUsedMetricsConsidered": False,
        "kpiFormulasComplete": False,
        "historicalKpiDisclosuresExcludeProjections": False,
        "peerInformationWillUseTraceableSources": False,
        "auditCommitteeApprovalRemainsRequired": False,
        "professionalCertificationRemainsRequired": False,
        "noRegulatoryOrAuditorConclusionRepresented": False,
    }


def create_empty_mda_trends_material_developments_and_confirmations() -> dict[str, Any]:
    return {
        "performanceFactors": [],
        "varianceAnalyses": [],
        "liquidityCapitalResources": create_empty_liquidity_capital_resources(),
        "trendsUncertainties": [],
        "subsequentEvents": [],
        "confirmations": create_empty_financials_kpis_confirmations(),
        "notes": "",
    }


def empty_payload() -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "reportingScopePeriodsAndAuditorReadiness": (
            create_empty_reporting_scope_periods_and_auditor_readiness()
        ),
        "restatedStatementOfProfitAndLoss": create_empty_restated_statement_of_profit_and_loss(),
        "assetsLiabilitiesEquityAndCashFlows": create_empty_assets_liabilities_equity_and_cash_flows(),
        "restatementAdjustmentsPoliciesAndAuditorMatters": (
            create_empty_restatement_adjustments_policies_and_auditor_matters()
        ),
        "otherFinancialInformation": create_empty_other_financial_information(),
        "ratiosCapitalisationAndIssuePriceMetrics": (
            create_empty_ratios_capitalisation_and_issue_price_metrics()
        ),
        "kpiSelectionGovernanceAndPeerComparison": (
            create_empty_kpi_selection_governance_and_peer_comparison()
        ),
        "mdaTrendsMaterialDevelopmentsAndConfirmations": (
            create_empty_mda_trends_material_developments_and_confirmations()
        ),
    }


def clone_empty_payload() -> dict[str, Any]:
    return deepcopy(empty_payload())
