"""Constants and error codes for Business & Operations — mirrors frontend schema exactly."""

SCHEMA_VERSION = 1

SECTION_IDS = (
    "business-profile-operating-model",
    "products-services-revenue-mix",
    "customers-sales-distribution-geography",
    "suppliers-procurement-inventory-logistics",
    "facilities-capacity-operational-process",
    "technology-quality-rd-ip",
    "workforce-collaborations-insurance-continuity",
    "competitive-strengths-strategy-confirmations",
)

SECTION_PAYLOAD_KEYS: dict[str, str] = {
    "business-profile-operating-model": "businessProfileAndOperatingModel",
    "products-services-revenue-mix": "productsServicesAndRevenueMix",
    "customers-sales-distribution-geography": "customersSalesDistributionAndGeography",
    "suppliers-procurement-inventory-logistics": "suppliersProcurementInventoryAndLogistics",
    "facilities-capacity-operational-process": "facilitiesCapacityAndOperationalProcess",
    "technology-quality-rd-ip": "technologyQualityResearchAndIntellectualProperty",
    "workforce-collaborations-insurance-continuity": (
        "workforceCollaborationsInsuranceAndContinuity"
    ),
    "competitive-strengths-strategy-confirmations": (
        "competitiveStrengthsStrategyDependenciesAndConfirmations"
    ),
}

SECTION_LABELS: dict[str, str] = {
    "business-profile-operating-model": "Business Profile & Operating Model",
    "products-services-revenue-mix": "Products, Services & Revenue Mix",
    "customers-sales-distribution-geography": "Customers, Sales, Distribution & Geography",
    "suppliers-procurement-inventory-logistics": (
        "Suppliers, Procurement, Inventory & Logistics"
    ),
    "facilities-capacity-operational-process": "Facilities, Capacity & Operational Process",
    "technology-quality-rd-ip": "Technology, Quality, R&D & Intellectual Property",
    "workforce-collaborations-insurance-continuity": (
        "Workforce, Collaborations, Insurance & Continuity"
    ),
    "competitive-strengths-strategy-confirmations": (
        "Competitive Strengths, Strategy, Dependencies & Confirmations"
    ),
}


class BusinessOperationsErrorCode:
    WORKSPACE_NOT_FOUND = "BUSINESS_OPERATIONS_WORKSPACE_NOT_FOUND"
    WORKSPACE_VERSION_CONFLICT = "BUSINESS_OPERATIONS_VERSION_CONFLICT"
    VALIDATION_FAILED = "BUSINESS_OPERATIONS_VALIDATION_FAILED"
    UNKNOWN_SECTION = "BUSINESS_OPERATIONS_UNKNOWN_SECTION"


# Frontend uses `not_sure` (UNDERSCORE), never `not-sure`.
YES_NO_NOT_SURE = frozenset({"", "yes", "no", "not_sure"})

# Confirmation field keys — mirrors `createEmptyBusinessOperationsConfirmations` in
# `frontend/lib/business-operations/defaults.ts` exactly (camelCase).
BUSINESS_OPERATIONS_CONFIRMATION_FIELDS = (
    "allMaterialActivitiesDisclosed",
    "productsAndServicesAreComplete",
    "revenueMixReconciles",
    "customerConcentrationIsComplete",
    "supplierConcentrationIsComplete",
    "allFacilitiesAreIncluded",
    "capacityUnitsAndFiguresAreConsistent",
    "outsourcedOperationsAreDisclosed",
    "technologyAndIpDependenciesAreDisclosed",
    "qualityIncidentsAndRecallsAreDisclosed",
    "insuranceAndContinuityInformationIsComplete",
    "strengthClaimsHaveSupportingSources",
    "strategiesContainNoUnsupportedProjections",
    "professionalReviewRemainsRequired",
)

# --------------------------------------------------------------------------- #
# Enums — mirrors `frontend/lib/schemas/business-operations.ts` exactly.      #
# --------------------------------------------------------------------------- #

# Multi-select arrays: array items must be one of these values (no empty-string member).
BUSINESS_CLASSIFICATION_VALUES = frozenset(
    {
        "manufacturing",
        "trading-or-distribution",
        "services",
        "software-or-technology-platform",
        "engineering-epc-project",
        "contract-manufacturing",
        "retail-or-consumer",
        "mixed",
        "other",
    }
)

REVENUE_MODEL_VALUES = frozenset(
    {
        "product-sales",
        "service-fees",
        "subscription",
        "commission",
        "project-billing",
        "licensing",
        "job-work",
        "rental",
        "other",
    }
)

CUSTOMER_MODEL_VALUES = frozenset({"", "b2b", "b2c", "b2g", "mixed"})

ORDER_MODEL_VALUES = frozenset(
    {
        "",
        "purchase-orders",
        "long-term-contracts",
        "framework-agreements",
        "subscription-contracts",
        "spot-sales",
        "tender-based",
        "mixed",
    }
)

BUSINESS_UNIT_STATUS_VALUES = frozenset(
    {"", "active", "inactive", "planned", "discontinued", "other"}
)

PRODUCT_TYPE_VALUES = frozenset(
    {"", "product", "service", "solution", "platform", "project", "trading-category"}
)

LIFECYCLE_STAGE_VALUES = frozenset(
    {"", "introduction", "growth", "maturity", "decline", "discontinued", "other"}
)

SOURCING_MODEL_VALUES = frozenset(
    {"", "in-house", "outsourced", "third-party-sourced", "mixed"}
)

DOMESTIC_EXPORT_CLASSIFICATION_VALUES = frozenset({"", "domestic", "export", "both"})

FIGURE_SOURCE_VALUES = frozenset(
    {
        "",
        "audited-financials",
        "auditor-certificate",
        "management-records",
        "estimate",
        "not-available",
    }
)

OFFERING_COMMERCIAL_STATUS_VALUES = frozenset(
    {"", "active", "launched", "discontinued", "planned", "other"}
)

OFFERING_CHANGE_TYPE_VALUES = frozenset({"", "launch", "discontinuation", "other"})

DISCLOSURE_CONSENT_VALUES = frozenset(
    {
        "",
        "consented",
        "not-consented",
        "pending",
        "confidential-label-used",
        "not-applicable",
        "unknown",
    }
)

SALES_CHANNEL_TYPE_VALUES = frozenset(
    {
        "",
        "direct-sales",
        "distributors",
        "dealers",
        "online-marketplace",
        "own-website-or-app",
        "retail-stores",
        "agents-or-brokers",
        "tender",
        "franchise",
        "other",
    }
)

GEOGRAPHIC_SCOPE_VALUES = frozenset({"", "india", "export", "region", "country"})

ORDER_BOOK_SECURITY_VALUES = frozenset({"", "secured", "unsecured", "mixed", "unknown"})

INPUT_CATEGORY_VALUES = frozenset(
    {
        "",
        "raw-material",
        "component",
        "packaging",
        "consumable",
        "utility",
        "service-input",
        "software-or-data",
        "other",
    }
)

DOMESTIC_OR_IMPORTED_VALUES = frozenset({"", "domestic", "imported", "both", "unknown"})

PROCUREMENT_MODEL_VALUES = frozenset({"", "centralised", "decentralised", "mixed"})

PRODUCTION_MODEL_VALUES = frozenset(
    {"", "make-to-order", "make-to-stock", "mixed", "not-applicable"}
)

LOGISTICS_MODEL_VALUES = frozenset({"", "in-house", "third-party", "mixed"})

FACILITY_TYPE_VALUES = frozenset(
    {
        "",
        "manufacturing-plant",
        "office",
        "warehouse",
        "service-centre",
        "retail-location",
        "data-centre",
        "laboratory",
        "project-site",
        "third-party-facility",
        "other",
    }
)

FACILITY_TENURE_VALUES = frozenset({"", "owned", "leased", "licensed", "third-party"})

FACILITY_STATUS_VALUES = frozenset(
    {"", "operational", "under-construction", "planned", "mothballed", "closed", "other"}
)

CAPACITY_METRIC_UNIT_VALUES = frozenset(
    {
        "",
        "units",
        "tonnes",
        "metres",
        "litres",
        "hours",
        "transactions",
        "seats",
        "projects",
        "stores",
        "active-users",
        "service-hours",
        "other",
    }
)

PLANNED_CAPACITY_STATUS_VALUES = frozenset(
    {
        "",
        "planned",
        "approved",
        "under-implementation",
        "commissioned",
        "deferred",
        "cancelled",
        "other",
    }
)

PROCESS_EXECUTION_VALUES = frozenset({"", "in-house", "outsourced", "mixed"})

TECHNOLOGY_OWNERSHIP_VALUES = frozenset({"", "proprietary", "third-party", "mixed", "licensed"})

AUTOMATION_LEVEL_VALUES = frozenset(
    {
        "",
        "manual",
        "semi-automated",
        "highly-automated",
        "fully-automated",
        "not-applicable",
        "unknown",
    }
)

HOSTING_MODEL_VALUES = frozenset(
    {
        "",
        "on-premise",
        "private-cloud",
        "public-cloud",
        "hybrid",
        "saas",
        "not-applicable",
        "unknown",
    }
)

EQUIPMENT_TENURE_VALUES = frozenset({"", "owned", "leased", "other"})

EQUIPMENT_ORIGIN_VALUES = frozenset({"", "imported", "domestic", "mixed", "unknown"})

EQUIPMENT_STATUS_VALUES = frozenset(
    {"", "operational", "under-installation", "idle", "disposed", "other"}
)

CERTIFICATION_RENEWAL_STATUS_VALUES = frozenset(
    {
        "",
        "current",
        "renewal-in-progress",
        "expired",
        "not-renewed",
        "not-applicable",
        "unknown",
    }
)

RD_DELIVERY_MODEL_VALUES = frozenset(
    {"", "internal", "outsourced", "mixed", "not-applicable"}
)

IP_TYPE_VALUES = frozenset(
    {
        "",
        "patent",
        "trademark",
        "copyright",
        "design",
        "trade-secret",
        "domain-name",
        "other",
    }
)

IP_STATUS_VALUES = frozenset(
    {
        "",
        "registered",
        "applied",
        "pending",
        "expired",
        "abandoned",
        "licensed-in",
        "other",
    }
)

IP_OWNERSHIP_MODEL_VALUES = frozenset({"", "owned", "licensed", "jointly-owned", "other"})

MATERIALITY_STATUS_VALUES = frozenset({"", "material", "not-material", "not_sure"})

COLLABORATION_NATURE_VALUES = frozenset(
    {
        "",
        "technical-collaboration",
        "joint-venture",
        "licensing",
        "distribution",
        "research",
        "franchise",
        "other",
    }
)

INSURANCE_POLICY_TYPE_VALUES = frozenset(
    {
        "",
        "property",
        "plant-and-machinery",
        "stock",
        "business-interruption",
        "public-liability",
        "product-liability",
        "directors-and-officers",
        "cyber",
        "key-person",
        "marine-or-transit",
        "other",
    }
)

STRATEGY_CATEGORY_VALUES = frozenset(
    {
        "",
        "growth",
        "diversification",
        "geographic-expansion",
        "product-development",
        "capacity-expansion",
        "digital-transformation",
        "cost-optimisation",
        "other",
    }
)

STRATEGY_TIME_HORIZON_VALUES = frozenset(
    {"", "near-term", "medium-term", "long-term", "ongoing", "other"}
)

STRATEGY_STATUS_VALUES = frozenset(
    {
        "",
        "proposed",
        "approved",
        "in-progress",
        "completed",
        "deferred",
        "abandoned",
        "other",
    }
)

DEPENDENCY_TYPE_VALUES = frozenset(
    {
        "",
        "customer",
        "supplier",
        "technology",
        "regulatory",
        "key-person",
        "facility",
        "logistics",
        "financing",
        "contract-manufacturing",
        "outsourced-service-delivery",
        "franchise",
        "cloud-or-platform",
        "distributor",
        "other",
    }
)

PROFESSIONAL_REVIEW_STATUS_VALUES = frozenset(
    {"", "not-started", "in-progress", "completed", "not-required", "not_sure"}
)

SOURCE_STATUS_VALUES = frozenset({"", "available", "pending", "not-available", "not_sure"})

# --------------------------------------------------------------------------- #
# Presentation labels used only by overview summaries (never persisted).      #
# --------------------------------------------------------------------------- #

BUSINESS_CLASSIFICATION_LABELS: dict[str, str] = {
    "manufacturing": "Manufacturing",
    "trading-or-distribution": "Trading or distribution",
    "services": "Services",
    "software-or-technology-platform": "Software or technology platform",
    "engineering-epc-project": "Engineering / EPC / project business",
    "contract-manufacturing": "Contract manufacturing",
    "retail-or-consumer": "Retail or consumer business",
    "mixed": "Mixed",
    "other": "Other",
}

CUSTOMER_MODEL_LABELS: dict[str, str] = {
    "b2b": "B2B",
    "b2c": "B2C",
    "b2g": "B2G",
    "mixed": "Mixed",
}

REVENUE_MODEL_LABELS: dict[str, str] = {
    "product-sales": "Product sales",
    "service-fees": "Service fees",
    "subscription": "Subscription",
    "commission": "Commission",
    "project-billing": "Project billing",
    "licensing": "Licensing",
    "job-work": "Job work",
    "rental": "Rental",
    "other": "Other",
}
