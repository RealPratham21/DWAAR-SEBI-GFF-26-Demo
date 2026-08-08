"""Canonical data ownership rules for DRHP generation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OwnershipRule:
    fact_domain: str
    authoritative_workstream: str
    description: str
    reconciliation_workstreams: tuple[str, ...] = ()


# Authoritative ownership by fact domain.
OWNERSHIP_RULES: tuple[OwnershipRule, ...] = (
    OwnershipRule(
        "issuer_legal_identity",
        "company-incorporation",
        "Issuer legal identity, incorporation history, registered office, constitutional facts.",
        ("business-operations",),
    ),
    OwnershipRule(
        "offer_route_configuration",
        "ipo-setup-eligibility",
        "Offer route, platform, offer configuration, eligibility declarations, proposed issue method.",
        ("intermediaries-filing",),
    ),
    OwnershipRule(
        "share_capital_arithmetic",
        "capital-ownership",
        "Share counts, capital structure, shareholders, promoters, pre/post issue ownership, lock-in.",
        ("ipo-setup-eligibility",),
    ),
    OwnershipRule(
        "operating_model",
        "business-operations",
        "Operating model, products/services, customers, suppliers, facilities, workforce, technology.",
        ("financials-kpis", "industry-market"),
    ),
    OwnershipRule(
        "objects_of_issue",
        "objects-of-issue",
        "Use-of-proceeds objects, allocations, deployment schedules, means of finance.",
        ("borrowings-assets-contracts", "financials-kpis"),
    ),
    OwnershipRule(
        "financial_statements",
        "financials-kpis",
        "Financial periods, statements, ratios, KPIs, restatements, MD&A inputs.",
        ("business-operations", "group-entities-related-parties"),
    ),
    OwnershipRule(
        "management_profiles",
        "management-governance",
        "Director/KMP/SMP profiles, committees, remuneration, governance relationships.",
        ("capital-ownership",),
    ),
    OwnershipRule(
        "industry_market_data",
        "industry-market",
        "Industry scope, market data, sources, competitors, trends, outlook.",
        ("business-operations",),
    ),
    OwnershipRule(
        "group_rpt",
        "group-entities-related-parties",
        "Subsidiaries, group companies, RPT register, balances, common pursuits.",
        ("financials-kpis", "capital-ownership"),
    ),
    OwnershipRule(
        "borrowings_assets_contracts",
        "borrowings-assets-contracts",
        "Borrowings, security, charges, properties, assets, material commercial contracts.",
        ("objects-of-issue", "litigation-approvals-compliance"),
    ),
    OwnershipRule(
        "legal_matters",
        "litigation-approvals-compliance",
        "Legal matters, approvals, compliance exceptions, material creditors.",
        ("borrowings-assets-contracts",),
    ),
    OwnershipRule(
        "filing_intermediaries",
        "intermediaries-filing",
        "Intermediary appointments, filing process, certificates, inspection register, filing stage.",
        ("ipo-setup-eligibility",),
    ),
    OwnershipRule(
        "promoter_classification",
        "capital-ownership",
        "Promoter identities and classification.",
        ("management-governance",),
    ),
    OwnershipRule(
        "promoter_biography",
        "management-governance",
        "Promoter/director biographical profiles.",
        ("capital-ownership",),
    ),
    OwnershipRule(
        "material_inspection_register",
        "intermediaries-filing",
        "Final Material Contracts/Documents for Inspection selection.",
        ("borrowings-assets-contracts",),
    ),
)

OWNERSHIP_BY_DOMAIN: dict[str, OwnershipRule] = {rule.fact_domain: rule for rule in OWNERSHIP_RULES}


@dataclass
class SourceConflict:
    fact_domain: str
    field_path: str
    authoritative_workstream: str
    authoritative_value: Any
    conflicting_workstream: str
    conflicting_value: Any
    severity: str  # warning | blocker
    message: str


def compare_values(left: Any, right: Any) -> bool:
    """Return True when values are equivalent for reconciliation."""
    if left is None and right is None:
        return True
    if left is None or right is None:
        return False
    return str(left).strip() == str(right).strip()


def detect_share_count_conflict(
    *,
    capital_value: Any,
    ipo_value: Any,
    field_path: str,
) -> SourceConflict | None:
    if compare_values(capital_value, ipo_value):
        return None
    if not capital_value and not ipo_value:
        return None
    return SourceConflict(
        fact_domain="share_capital_arithmetic",
        field_path=field_path,
        authoritative_workstream="capital-ownership",
        authoritative_value=capital_value,
        conflicting_workstream="ipo-setup-eligibility",
        conflicting_value=ipo_value,
        severity="blocker" if capital_value and ipo_value else "warning",
        message=(
            "Capital & Ownership is authoritative for share arithmetic; "
            "IPO Setup contains a conflicting value."
        ),
    )
