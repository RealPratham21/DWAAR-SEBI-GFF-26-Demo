"""Constants and error codes for Financials & KPIs — mirrors frontend schema exactly."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "reporting-scope-periods-and-auditor-readiness",
    "restated-statement-of-profit-and-loss",
    "assets-liabilities-equity-and-cash-flows",
    "restatement-adjustments-policies-and-auditor-matters",
    "other-financial-information",
    "ratios-capitalisation-and-issue-price-metrics",
    "kpi-selection-governance-and-peer-comparison",
    "mda-trends-material-developments-and-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "reporting-scope-periods-and-auditor-readiness": "reportingScopePeriodsAndAuditorReadiness",
    "restated-statement-of-profit-and-loss": "restatedStatementOfProfitAndLoss",
    "assets-liabilities-equity-and-cash-flows": "assetsLiabilitiesEquityAndCashFlows",
    "restatement-adjustments-policies-and-auditor-matters": (
        "restatementAdjustmentsPoliciesAndAuditorMatters"
    ),
    "other-financial-information": "otherFinancialInformation",
    "ratios-capitalisation-and-issue-price-metrics": "ratiosCapitalisationAndIssuePriceMetrics",
    "kpi-selection-governance-and-peer-comparison": "kpiSelectionGovernanceAndPeerComparison",
    "mda-trends-material-developments-and-confirmations": (
        "mdaTrendsMaterialDevelopmentsAndConfirmations"
    ),
}

SECTION_LABELS: dict[str, str] = {
    "reporting-scope-periods-and-auditor-readiness": (
        "Reporting Scope, Periods & Auditor Readiness"
    ),
    "restated-statement-of-profit-and-loss": "Restated Statement of Profit & Loss",
    "assets-liabilities-equity-and-cash-flows": "Assets, Liabilities, Equity & Cash Flows",
    "restatement-adjustments-policies-and-auditor-matters": (
        "Restatement Adjustments, Policies & Auditor Matters"
    ),
    "other-financial-information": "Other Financial Information",
    "ratios-capitalisation-and-issue-price-metrics": (
        "Ratios, Capitalisation & Issue-Price Metrics"
    ),
    "kpi-selection-governance-and-peer-comparison": (
        "KPI Selection, Governance & Peer Comparison"
    ),
    "mda-trends-material-developments-and-confirmations": (
        "MD&A, Trends, Material Developments & Confirmations"
    ),
}


class FinancialsKpisErrorCode:
    WORKSPACE_NOT_FOUND = "FINANCIALS_KPIS_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "FINANCIALS_KPIS_VERSION_CONFLICT"
    VALIDATION_FAILED = "FINANCIALS_KPIS_VALIDATION_FAILED"
    UNKNOWN_SECTION = "FINANCIALS_KPIS_UNKNOWN_SECTION"


YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

INCOME_OR_EXPENSE = frozenset({"", "income", "expense"})
CASH_OR_NON_CASH = frozenset({"", "cash", "non-cash"})
RECURRING_OR_NON_RECURRING = frozenset({"", "recurring", "non-recurring"})
DEBIT_CREDIT_DIRECTION = frozenset({"", "debit", "credit"})
RETROSPECTIVE_PROSPECTIVE = frozenset({"", "retrospective", "prospective", "not-applicable"})
INDIAN_OR_GLOBAL = frozenset({"", "indian", "global"})
TEMPORARY_OR_CONTINUING = frozenset({"", "temporary", "continuing"})
ONE_OFF_OR_RECURRING = frozenset({"", "one-off", "recurring"})
ADJUSTING_NON_ADJUSTING = frozenset({"", "adjusting", "non-adjusting"})

FINANCIALS_KPIS_CONFIRMATION_FIELDS = (
    ("reportingScopeAndEntitiesComplete", "Reporting scope and entities are complete"),
    ("periodsAreCorrect", "Financial periods are correct"),
    ("valuesMatchIdentifiedSources", "Values match identified sources"),
    (
        "shareCapitalReconcilesWithCapitalOwnership",
        "Share capital reconciles with Capital & Ownership",
    ),
    (
        "revenueSegmentsReconcileWithBusinessOperations",
        "Revenue / segments reconcile with Business & Operations",
    ),
    (
        "workingCapitalReconcilesWithObjectsOfIssue",
        "Working capital reconciles with Objects of the Issue",
    ),
    (
        "borrowingTotalsReconcileWithAvailableRecords",
        "Borrowing totals reconcile with available records",
    ),
    ("restatementAdjustmentsComplete", "Restatement adjustments are complete"),
    ("auditorRemarksDisclosed", "Auditor remarks are disclosed"),
    ("exceptionalItemsDisclosed", "Exceptional items are disclosed"),
    ("relatedPartyTransactionsComplete", "Related-party transactions are complete"),
    ("contingenciesAndCommitmentsComplete", "Contingencies and commitments are complete"),
    ("subsequentDevelopmentsDisclosed", "Subsequent developments are disclosed"),
    (
        "investorSharedHistoricalMetricsConsidered",
        "Investor-shared historical metrics were considered",
    ),
    ("boardUsedMetricsConsidered", "Board-used metrics were considered"),
    ("kpiFormulasComplete", "KPI formulas are complete"),
    (
        "historicalKpiDisclosuresExcludeProjections",
        "Historical KPI disclosures exclude projections",
    ),
    (
        "peerInformationWillUseTraceableSources",
        "Peer information will use traceable sources",
    ),
    (
        "auditCommitteeApprovalRemainsRequired",
        "Audit Committee approval remains required",
    ),
    (
        "professionalCertificationRemainsRequired",
        "Professional certification remains required",
    ),
    (
        "noRegulatoryOrAuditorConclusionRepresented",
        "No regulatory or auditor conclusion is being represented",
    ),
)

SOURCE_STATUS = frozenset(
    {
        "",
        "audited_financial_statements",
        "restated_financial_information",
        "auditor_certificate",
        "management_accounts",
        "management_estimate",
        "pending_confirmation",
        "not_available",
    }
)

PROFESSIONAL_CONFIRMATION_STATUS = frozenset(
    {"", "confirmed", "pending", "not_required", "not_sure"}
)

ACCOUNTING_FRAMEWORK = frozenset(
    {
        "",
        "indian-gaap",
        "ind-as",
        "sector-specific",
        "transition-in-progress",
        "professional-confirmation-required",
    }
)

FINANCIAL_PRESENTATION = frozenset({"", "standalone", "consolidated", "both"})

DISPLAY_UNIT = frozenset({"", "rupees", "thousand", "lakh", "crore", "million"})

REPORTING_ENTITY_TYPE = frozenset(
    {
        "",
        "issuer",
        "subsidiary",
        "associate",
        "joint-venture",
        "foreign-entity",
        "predecessor",
        "promoting-company",
        "other",
    }
)

CONSOLIDATION_METHOD = frozenset(
    {
        "",
        "full-consolidation",
        "equity-method",
        "proportionate",
        "not-consolidated",
        "other",
    }
)

PERIOD_BASIS = frozenset({"", "standalone", "consolidated"})

FULL_YEAR_OR_INTERIM = frozenset({"", "full-year", "interim"})

AUDITED_STATUS = frozenset({"", "audited", "unaudited", "reviewed", "pending", "not-applicable"})

RESTATED_STATUS = frozenset(
    {"", "restated", "not-restated", "restatement-in-progress", "pending"}
)

FINALISATION_STATUS = frozenset(
    {"", "finalised", "draft", "pending-auditor", "pending-board"}
)

RESTATEMENT_EXERCISE_STATUS = frozenset(
    {
        "",
        "not-started",
        "data-collection",
        "under-preparation",
        "under-auditor-review",
        "completed",
        "pending-professional-appointment",
    }
)

PL_LINE_KEY = frozenset(
    {
        "",
        "revenueFromOperations",
        "saleOfProducts",
        "saleOfServices",
        "otherOperatingRevenue",
        "otherIncome",
        "financeIncome",
        "governmentGrants",
        "foreignExchangeIncome",
        "gainOnDisposal",
        "totalIncome",
        "costOfMaterialsConsumed",
        "purchasesOfStockInTrade",
        "changesInInventory",
        "manufacturingDirectOperatingExpenses",
        "employeeBenefitExpenses",
        "contractLabour",
        "sellingAndDistributionExpenses",
        "technologyHostingExpenses",
        "rentAndLeaseExpense",
        "otherOperatingExpenses",
        "financeCosts",
        "depreciation",
        "amortisation",
        "impairment",
        "otherExpenses",
        "totalExpenses",
        "profitBeforeExceptionalItemsAndTax",
        "exceptionalItems",
        "profitBeforeTax",
        "currentTax",
        "deferredTax",
        "earlierYearTaxAdjustment",
        "profitAfterTax",
        "otherComprehensiveIncome",
        "totalComprehensiveIncome",
        "profitAttributableToOwners",
        "profitAttributableToNci",
    }
)

BS_LINE_KEY = frozenset(
    {
        "",
        "propertyPlantAndEquipment",
        "capitalWorkInProgress",
        "rightOfUseAssets",
        "investmentProperty",
        "goodwill",
        "otherIntangibleAssets",
        "intangiblesUnderDevelopment",
        "investmentsNonCurrent",
        "loansNonCurrent",
        "otherFinancialAssetsNonCurrent",
        "deferredTaxAssets",
        "nonCurrentTaxAssets",
        "otherNonCurrentAssets",
        "totalNonCurrentAssets",
        "inventories",
        "tradeReceivables",
        "cashAndCashEquivalents",
        "otherBankBalances",
        "currentInvestments",
        "loansCurrent",
        "otherFinancialAssetsCurrent",
        "currentTaxAssets",
        "otherCurrentAssets",
        "assetsHeldForSale",
        "totalCurrentAssets",
        "totalAssets",
        "equityShareCapital",
        "preferenceShareCapital",
        "securitiesPremium",
        "retainedEarnings",
        "capitalReserve",
        "generalReserve",
        "otherReserves",
        "ociReserve",
        "totalOtherEquity",
        "nonControllingInterests",
        "totalEquity",
        "nonCurrentBorrowings",
        "leaseLiabilitiesNonCurrent",
        "otherFinancialLiabilitiesNonCurrent",
        "longTermProvisions",
        "deferredTaxLiabilities",
        "otherNonCurrentLiabilities",
        "totalNonCurrentLiabilities",
        "currentBorrowings",
        "currentMaturitiesLongTermDebt",
        "leaseLiabilitiesCurrent",
        "tradePayablesMsme",
        "otherTradePayables",
        "otherFinancialLiabilitiesCurrent",
        "employeeLiabilities",
        "currentTaxLiabilities",
        "shortTermProvisions",
        "otherCurrentLiabilities",
        "liabilitiesHeldForSale",
        "totalCurrentLiabilities",
        "totalLiabilities",
        "totalEquityAndLiabilities",
    }
)

CF_LINE_KEY = frozenset(
    {
        "",
        "cashFlowFromOperatingActivities",
        "cashFlowFromInvestingActivities",
        "cashFlowFromFinancingActivities",
        "netIncreaseDecreaseInCash",
        "openingCashAndCashEquivalents",
        "exchangeRateImpact",
        "closingCashAndCashEquivalents",
        "profitBeforeTax",
        "nonCashAdjustments",
        "workingCapitalMovements",
        "taxPaid",
        "capex",
        "investmentPurchasesSales",
        "borrowingProceeds",
        "borrowingRepayments",
        "interestPaid",
        "dividendsPaid",
        "shareIssueProceeds",
    }
)

EQUITY_LINE_KEY = frozenset(
    {
        "",
        "openingShareCapital",
        "sharesIssuedCancelledAdjusted",
        "closingShareCapital",
        "openingOtherEquity",
        "profitForPeriod",
        "oci",
        "dividends",
        "shareBasedPayments",
        "otherCapitalTransactions",
        "restatementAdjustments",
        "closingOtherEquity",
    }
)

FINANCIAL_STATEMENT = frozenset(
    {"", "profit-and-loss", "assets-and-liabilities", "cash-flow", "changes-in-equity", "other"}
)

RESTATEMENT_ADJUSTMENT_CATEGORY = frozenset(
    {
        "",
        "prior-period-error",
        "accounting-policy-change",
        "accounting-estimate-change",
        "auditor-qualification",
        "reclassification",
        "regrouping",
        "consolidation-adjustment",
        "merger-acquisition",
        "related-party-adjustment",
        "tax-adjustment",
        "share-based-payment-adjustment",
        "capital-adjustment",
        "exceptional-non-recurring",
        "other",
    }
)

ACCOUNTING_POLICY_CATEGORY = frozenset(
    {
        "",
        "revenue-recognition",
        "inventory",
        "ppe-and-depreciation",
        "intangibles",
        "impairment",
        "borrowing-costs",
        "leases",
        "employee-benefits",
        "foreign-currency",
        "financial-instruments",
        "taxation",
        "provisions-and-contingencies",
        "government-grants",
        "business-combinations",
        "consolidation",
        "related-parties",
        "share-based-payments",
        "other",
    }
)

AUDIT_OPINION = frozenset({"", "unmodified", "qualified", "adverse", "disclaimer", "pending"})

KPI_CATEGORY = frozenset({"", "gaap-financial", "non-gaap-financial", "operational"})

KPI_PROPOSED_TREATMENT = frozenset({"", "include-as-kpi", "disclose-elsewhere", "exclude"})

DRHP_LOCATION = frozenset({"", "basis-for-issue-price", "our-business", "both"})

SME_ELIGIBILITY_STATES = (
    "appears_satisfied",
    "potential_concern",
    "missing_information",
    "pending_auditor_confirmation",
    "professional_confirmation_required",
)

SME_OPERATING_PROFIT_THRESHOLD = "1500000000"
SME_NET_WORTH_MINIMUM = "0"
RECONCILIATION_TOLERANCE = "1"
