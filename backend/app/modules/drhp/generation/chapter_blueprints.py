"""DRHP chapter content blueprints and generation units (G2R)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

OutputMode = Literal[
    "deterministic_table",
    "deterministic_text",
    "narrative",
    "risk_candidate",
    "definition",
    "cross_reference",
]


@dataclass(frozen=True)
class GenerationUnit:
    unit_key: str
    heading: str
    order: int
    source_groups: tuple[str, ...]
    output_mode: OutputMode
    required: bool = True


@dataclass(frozen=True)
class ChapterBlueprint:
    chapter_key: str
    title: str
    units: tuple[GenerationUnit, ...] = field(default_factory=tuple)


CHAPTER_BLUEPRINTS: dict[str, ChapterBlueprint] = {
    "cover-page-front-matter": ChapterBlueprint(
        chapter_key="cover-page-front-matter",
        title="Cover Page & Front Matter",
        units=(
            GenerationUnit("statutory-legend", "Statutory legend", 1, ("company-incorporation.identity",), "deterministic_text"),
            GenerationUnit("issuer-heading", "Issuer heading", 2, ("company-incorporation.identity",), "deterministic_text"),
            GenerationUnit("issuer-particulars", "Issuer particulars", 3, ("company-incorporation", "ipo-setup-eligibility", "intermediaries-filing"), "deterministic_table"),
            GenerationUnit("offer-particulars", "Offer particulars", 4, ("ipo-setup-eligibility", "intermediaries-filing"), "deterministic_table"),
        ),
    ),
    "capital-structure-ownership": ChapterBlueprint(
        chapter_key="capital-structure-ownership",
        title="Capital Structure & Ownership",
        units=(
            GenerationUnit("capital-summary", "Share capital summary", 1, ("capital-ownership.currentCapitalStructure",), "deterministic_table"),
            GenerationUnit("shareholding", "Shareholding pattern", 2, ("capital-ownership.shareholders",), "deterministic_table"),
            GenerationUnit("promoters", "Promoter shareholding", 3, ("capital-ownership.promoters",), "deterministic_table"),
            GenerationUnit("pre-post-offer", "Pre and post issue capital", 4, ("capital-ownership.prePostIssue",), "deterministic_table"),
        ),
    ),
    "business-operations": ChapterBlueprint(
        chapter_key="business-operations",
        title="Business & Operations",
        units=(
            GenerationUnit("overview", "Business overview", 1, ("business-operations.profile",), "narrative"),
            GenerationUnit("products", "Products and services", 2, ("business-operations.products",), "deterministic_table"),
            GenerationUnit("customers", "Customers and concentration", 3, ("business-operations.customers",), "narrative"),
            GenerationUnit("facilities", "Facilities and capacity", 4, ("business-operations.facilities",), "narrative"),
            GenerationUnit("strengths", "Competitive strengths and strategy", 5, ("business-operations.strategy",), "narrative"),
        ),
    ),
    "financial-information-mda": ChapterBlueprint(
        chapter_key="financial-information-mda",
        title="Financial Information & MD&A",
        units=(
            GenerationUnit("pl", "Restated P&L", 1, ("financials-kpis.pl",), "deterministic_table"),
            GenerationUnit("balance-sheet", "Balance sheet summary", 2, ("financials-kpis.balanceSheet",), "deterministic_table"),
            GenerationUnit("mda", "MD&A", 3, ("financials-kpis.mda",), "narrative"),
        ),
    ),
    "risk-factors": ChapterBlueprint(
        chapter_key="risk-factors",
        title="Risk Factors",
        units=tuple(
            GenerationUnit(f"risk-{i}", f"Risk factor {i}", i, ("risk-registry",), "risk_candidate")
            for i in range(1, 9)
        ),
    ),
}


def get_chapter_blueprint(chapter_key: str) -> ChapterBlueprint | None:
    return CHAPTER_BLUEPRINTS.get(chapter_key)
