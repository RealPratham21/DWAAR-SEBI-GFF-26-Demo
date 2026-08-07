"""Constants and error codes for Industry & Market — mirrors frontend schema exactly."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "industry-scope-and-company-market-mapping",
    "research-sources-and-industry-report-governance",
    "macroeconomic-and-industry-context",
    "market-size-segmentation-and-growth",
    "demand-drivers-end-markets-trends-and-policy",
    "value-chain-supply-structure-and-entry-barriers",
    "competition-market-share-and-issuer-positioning",
    "outlook-industry-risks-and-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "industry-scope-and-company-market-mapping": "industryScopeAndCompanyMarketMapping",
    "research-sources-and-industry-report-governance": (
        "researchSourcesAndIndustryReportGovernance"
    ),
    "macroeconomic-and-industry-context": "macroeconomicAndIndustryContext",
    "market-size-segmentation-and-growth": "marketSizeSegmentationAndGrowth",
    "demand-drivers-end-markets-trends-and-policy": "demandDriversEndMarketsTrendsAndPolicy",
    "value-chain-supply-structure-and-entry-barriers": (
        "valueChainSupplyStructureAndEntryBarriers"
    ),
    "competition-market-share-and-issuer-positioning": (
        "competitionMarketShareAndIssuerPositioning"
    ),
    "outlook-industry-risks-and-confirmations": "outlookIndustryRisksAndConfirmations",
}

SECTION_LABELS: dict[str, str] = {
    "industry-scope-and-company-market-mapping": "Industry Scope & Company-to-Market Mapping",
    "research-sources-and-industry-report-governance": (
        "Research Sources & Industry Report Governance"
    ),
    "macroeconomic-and-industry-context": "Macroeconomic & Industry Context",
    "market-size-segmentation-and-growth": "Market Size, Segmentation & Growth",
    "demand-drivers-end-markets-trends-and-policy": (
        "Demand Drivers, End Markets, Trends & Policy"
    ),
    "value-chain-supply-structure-and-entry-barriers": (
        "Value Chain, Supply Structure & Entry Barriers"
    ),
    "competition-market-share-and-issuer-positioning": (
        "Competition, Market Share & Issuer Positioning"
    ),
    "outlook-industry-risks-and-confirmations": "Outlook, Industry Risks & Confirmations",
}


class IndustryMarketErrorCode:
    WORKSPACE_NOT_FOUND = "INDUSTRY_MARKET_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "INDUSTRY_MARKET_VERSION_CONFLICT"
    VALIDATION_FAILED = "INDUSTRY_MARKET_VALIDATION_FAILED"
    UNKNOWN_SECTION = "INDUSTRY_MARKET_UNKNOWN_SECTION"


INDUSTRY_MARKET_SLUG = "industry-market"

YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

CLASSIFICATION_SOURCE = frozenset(
    {
        "",
        "nic",
        "government-classification",
        "exchange-sector-classification",
        "research-provider-taxonomy",
        "internal-classification",
        "other",
    }
)

GEOGRAPHY = frozenset(
    {
        "",
        "india",
        "specific-state",
        "specific-region",
        "global",
        "india-export-markets",
        "other",
    }
)

SOURCE_TYPE = frozenset(
    {
        "",
        "commissioned-industry-report",
        "government-publication",
        "regulatory-publication",
        "industry-association",
        "multilateral-institution",
        "academic-publication",
        "company-filing",
        "exchange-filing",
        "paid-database",
        "public-research-report",
        "news-publication",
        "internal-company-information",
        "other",
    }
)

DATA_NATURE = frozenset(
    {
        "",
        "actual",
        "estimated",
        "forecast-projected",
        "survey-based",
        "modelled",
        "derived",
        "management-estimate",
    }
)

SOURCE_READINESS_STATUS = frozenset(
    {
        "",
        "current",
        "potentially_stale",
        "superseded",
        "methodology_unclear",
        "pending_verification",
        "professional_confirmation_required",
    }
)

MARKET_METRIC = frozenset(
    {
        "",
        "revenue-value",
        "volume",
        "installed-base",
        "units-sold",
        "production",
        "consumption",
        "capacity",
        "transactions",
        "users",
        "aum-assets",
        "stores-outlets",
        "beds",
        "other",
    }
)

ACTUAL_ESTIMATE_FORECAST = frozenset({"", "actual", "estimate", "forecast"})

SEGMENTATION_DIMENSION = frozenset(
    {
        "",
        "product",
        "service",
        "customer-end-user",
        "geography",
        "price-tier",
        "channel",
        "technology",
        "organised-unorganised",
        "application",
        "industry-vertical",
        "other",
    }
)

DEMAND_DRIVER_CATEGORY = frozenset(
    {
        "",
        "economic",
        "demographic",
        "consumer-behaviour",
        "technology",
        "regulatory",
        "government-spending",
        "infrastructure",
        "digitisation",
        "export",
        "import-substitution",
        "environmental",
        "financing-credit",
        "other",
    }
)

POLICY_NATURE = frozenset(
    {
        "",
        "incentive",
        "subsidy",
        "mandate",
        "tariff",
        "import-restriction",
        "export-support",
        "procurement-scheme",
        "tax-support",
        "other",
    }
)

BARRIER_TYPE = frozenset(
    {
        "",
        "capital-intensity",
        "technology-ip",
        "brand",
        "distribution",
        "regulatory-approvals",
        "customer-relationships",
        "vendor-qualification",
        "scale",
        "network-effect",
        "data",
        "switching-costs",
        "skilled-labour",
        "raw-material-access",
        "working-capital",
        "other",
    }
)

BARRIER_STRENGTH = frozenset(
    {"", "low", "moderate", "high", "source-does-not-quantify"}
)

CLAIM_TYPE = frozenset(
    {
        "",
        "largest",
        "leading",
        "fastest-growing",
        "top-x",
        "only",
        "market-share-claim",
        "scale-claim",
        "growth-claim",
        "other",
    }
)

CLAIM_STATUS = frozenset(
    {
        "",
        "substantiated",
        "potentially_substantiated",
        "insufficient_source",
        "stale_source",
        "contradictory_sources",
        "professional_confirmation_required",
        "do_not_use",
    }
)

COMPETITOR_METRIC_TYPE = frozenset(
    {
        "",
        "revenue-in-relevant-market",
        "volume",
        "capacity",
        "installed-base",
        "stores",
        "customers",
        "orders",
        "production",
        "assets-aum",
        "beds",
        "locations",
        "other",
    }
)

SCOPE_EXCLUSION_TYPE = frozenset(
    {
        "",
        "adjacent-market-excluded",
        "upstream-market-excluded",
        "downstream-market-excluded",
        "geography-excluded",
        "product-category-excluded",
        "other",
    }
)

MACRO_INDICATOR_CATEGORY = frozenset(
    {
        "",
        "gdp",
        "gdp-growth",
        "private-consumption",
        "industrial-production",
        "inflation",
        "interest-rates",
        "urbanisation",
        "population-demographics",
        "disposable-income",
        "infrastructure-spending",
        "credit-growth",
        "digital-adoption",
        "export-growth",
        "other",
    }
)

FORECAST_SCENARIO = frozenset({"", "base", "upside", "downside", "not-specified"})

NOMINAL_REAL = frozenset({"", "nominal", "real"})

COMMISSIONED_REPORT_PURPOSE = frozenset(
    {"", "specifically-for-ipo", "existing-research-subscription", "other"}
)

NUMERATOR_SOURCE = frozenset(
    {
        "",
        "business-operations",
        "financials-kpis",
        "industry-report",
        "certified-company-data",
        "other",
    }
)

MARKET_SHARE_METRIC_BASIS = frozenset(
    {
        "",
        "revenue",
        "volume",
        "units",
        "capacity",
        "orders",
        "customers",
        "installed-base",
        "other",
    }
)

TREND_TIMELINE_STATUS = frozenset({"", "historical", "current", "emerging"})

CYCLICAL_DEFENSIVE = frozenset({"", "cyclical", "defensive", "mixed", "not-sure"})

OUTLOOK_DATA_NATURE = frozenset(
    {
        "",
        "historical-fact",
        "current-estimate",
        "third-party-forecast",
        "issuer-expectation",
    }
)

INDUSTRY_RISK_CATEGORY = frozenset(
    {
        "",
        "competition",
        "demand-cyclicality",
        "raw-material-volatility",
        "imports",
        "technology-disruption",
        "regulation",
        "policy-dependence",
        "customer-concentration",
        "fragmentation",
        "capacity-oversupply",
        "infrastructure",
        "skilled-labour",
        "currency",
        "macroeconomic",
        "other",
    }
)

INDUSTRY_CRITERION_STATES = (
    "substantiated",
    "potential_inconsistency",
    "missing_information",
    "missing_source",
    "stale_source",
    "methodology_concern",
    "conflicting_sources",
    "pending_industry_report",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "not_applicable",
)

INDUSTRY_ASSESSMENT_GROUPS = (
    "scope_and_relevance",
    "source_readiness",
    "market_sizing_and_segmentation",
    "cross_workstream_consistency",
    "demand_trend_substantiation",
    "value_chain_and_supply_structure",
    "competitive_landscape",
    "market_share_integrity",
    "claim_substantiation",
    "outlook_and_conflicting_research",
)

INDUSTRY_ASSESSMENT_RESULT_STATES = (
    "insufficient_information",
    "readiness_in_progress",
    "inconsistencies_identified",
    "source_gaps_identified",
    "professional_confirmation_required",
    "pending_linked_workstream",
)

INDUSTRY_CRITERION_STATE_LABELS: dict[str, str] = {
    "substantiated": "Substantiated",
    "potential_inconsistency": "Potential inconsistency",
    "missing_information": "Missing information",
    "missing_source": "Missing source",
    "stale_source": "Stale source",
    "methodology_concern": "Methodology concern",
    "conflicting_sources": "Conflicting sources",
    "pending_industry_report": "Pending industry report",
    "pending_linked_workstream": "Pending linked workstream",
    "pending_professional_confirmation": "Pending professional confirmation",
    "not_applicable": "Not applicable",
}

INDUSTRY_ASSESSMENT_GROUP_LABELS: dict[str, str] = {
    "scope_and_relevance": "Scope and relevance",
    "source_readiness": "Source readiness",
    "market_sizing_and_segmentation": "Market sizing and segmentation",
    "cross_workstream_consistency": "Cross-workstream consistency",
    "demand_trend_substantiation": "Demand and trend substantiation",
    "value_chain_and_supply_structure": "Value chain and supply structure",
    "competitive_landscape": "Competitive landscape",
    "market_share_integrity": "Market-share integrity",
    "claim_substantiation": "Claim substantiation",
    "outlook_and_conflicting_research": "Outlook and conflicting research",
}

INDUSTRY_MARKET_CONFIRMATION_FIELDS = (
    ("industryScopeReflectsActualIssuerBusiness", "Industry scope reflects actual issuer business"),
    (
        "marketDefinitionNotIntentionallyOverstated",
        "Market definition is not intentionally overstated",
    ),
    ("materialIndustryClaimsHaveSources", "Material industry claims have sources"),
    (
        "sourcePublicationAccessDatesRecorded",
        "Source publication and access dates are recorded",
    ),
    (
        "historicalDataAndForecastsDistinguished",
        "Historical data and forecasts are distinguished",
    ),
    ("commissionedReportStatusDisclosed", "Commissioned-report status is disclosed"),
    (
        "researchProviderRelationshipDisclosed",
        "Research-provider relationship is disclosed",
    ),
    ("methodologyLimitationsCaptured", "Methodology limitations are captured"),
    (
        "industrySegmentsNotConfusedWithAccountingSegments",
        "Industry segments are not confused with accounting segments",
    ),
    ("competitorListIsReasonable", "Competitor list is reasonable"),
    (
        "marketShareNumeratorDenominatorDefinitionsMatch",
        "Market-share numerator and denominator definitions match",
    ),
    ("comparatorUniversesDefined", "Comparator universes are defined"),
    ("leadingLargestTopClaimsSourced", "Leading / largest / top claims are sourced"),
    ("conflictingMarketDataIdentified", "Conflicting market data has been identified"),
    ("staleDataFlagged", "Stale data has been flagged"),
    (
        "policySchemeStatusCurrent",
        "Policy / scheme status is current to the best of issuer knowledge",
    ),
    (
        "companyOperationalDataReconcilesWithLinkedWorkstreams",
        "Company operational data reconciles with linked workstreams",
    ),
    (
        "professionalMerchantBankerReviewRemainsRequired",
        "Professional / merchant-banker review remains required",
    ),
)

SOURCE_FRESHNESS_RULES_VERSION = 1
SOURCE_FRESHNESS_RULES_AS_OF = "2026-08-07"
