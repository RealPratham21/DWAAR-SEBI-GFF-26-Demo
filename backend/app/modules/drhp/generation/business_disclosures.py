"""Deterministic Business & Operations disclosure blocks (P2.2)."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpSectionAST
from app.modules.drhp.constants import BlockSupportState
from app.modules.drhp.generation.publication_format import humanize_enum
from app.modules.drhp.generation.source_extractors import (
    extract_business_profile,
    extract_customers_section,
    extract_identity,
    extract_products,
)
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _block(kind: str, content: dict[str, Any], refs: list[str], order: int = 1) -> DrhpBlockAST:
    return DrhpBlockAST(
        block_id=f"blk-{uuid4()}",
        kind=kind,  # type: ignore[arg-type]
        order=order,
        content=content,
        source_ref_ids=refs,
        support_state=BlockSupportState.STRUCTURED_INPUT_BACKED,
    )


def _paragraph(text: str, refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("paragraph", {"text": text}, refs, order)


def _table(headers: list[str], rows: list[list[str]], caption: str, refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("table", {"headers": headers, "rows": rows, "caption": caption}, refs, order)


def _refs(bundle: ChapterSourceBundle, limit: int = 5) -> list[str]:
    return [r.ref_id for r in bundle.source_refs[:limit]]


def _section(bo: dict[str, Any], *keys: str) -> dict[str, Any]:
    for key in keys:
        val = bo.get(key)
        if isinstance(val, dict):
            return val
    return {}


def _clean(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return str(value).strip()


def _customer_label(customer: dict[str, Any]) -> str:
    return _clean(
        customer.get("customerNameOrConfidentialLabel")
        or customer.get("customerName")
        or customer.get("name")
    )


def build_business_sections(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    bo_ws = snapshots.get("business-operations")
    bo = bo_ws.payload if bo_ws else {}
    profile = extract_business_profile(snapshots)
    issuer = extract_identity(snapshots).get("legalName") or "our Company"
    sections: list[DrhpSectionAST] = []
    order = 1

    overview = " ".join(
        p
        for p in (
            profile.get("briefBusinessOverview"),
            profile.get("valueCreationAndDeliveryExplanation"),
        )
        if p
    )
    if overview:
        sections.append(
            DrhpSectionAST(
                section_key="business-overview",
                heading="Business Overview",
                order=order,
                blocks=[_paragraph(overview, refs)],
            )
        )
        order += 1

    model_bits = []
    if profile.get("primaryBusinessActivity"):
        model_bits.append(f"Primary business activity: {profile['primaryBusinessActivity']}.")
    if profile.get("businessClassifications"):
        model_bits.append(
            f"Business classifications include {', '.join(str(c) for c in profile['businessClassifications'])}."
        )
    if profile.get("customerModel"):
        model_bits.append(f"Customer model: {str(profile['customerModel']).upper()}.")
    if profile.get("positionInValueChain"):
        model_bits.append(f"Position in value chain: {str(profile['positionInValueChain']).replace('-', ' ')}.")
    if model_bits:
        sections.append(
            DrhpSectionAST(
                section_key="operating-model",
                heading="Operating Model",
                order=order,
                blocks=[_paragraph(" ".join(model_bits), refs)],
            )
        )
        order += 1

    products = extract_products(snapshots)
    ps = _section(bo, "productsServicesAndRevenueMix", "productsServicesRevenueMix")
    revenue_rows = ps.get("revenueMixRows") or []
    if products:
        prod_rows = [[p["name"], p["segment"], (p["description"] or "-")[:120]] for p in products[:12]]
        blocks = [
            _paragraph(
                f"{issuer} manufactures and supplies the following principal products and service lines.",
                refs,
            ),
            _table(["Product / Service", "Segment", "Description"], prod_rows, "Products and services", refs, 2),
        ]
        if revenue_rows:
            latest_year = revenue_rows[-1].get("financialYear") if isinstance(revenue_rows[-1], dict) else ""
            mix = [
                r
                for r in revenue_rows
                if isinstance(r, dict) and (not latest_year or r.get("financialYear") == latest_year)
            ][:8]
            if mix:
                mix_rows = [
                    [
                        _clean(r.get("productOrSegmentLabel")),
                        _clean(r.get("revenue")),
                        f"{_clean(r.get('percentageOfRevenueFromOperations'))}%",
                    ]
                    for r in mix
                ]
                blocks.append(
                    _table(
                        ["Segment / Product", f"Revenue ({latest_year or 'period'})", "% of revenue"],
                        mix_rows,
                        "Revenue mix",
                        refs,
                        3,
                    )
                )
        sections.append(
            DrhpSectionAST(
                section_key="products-services",
                heading="Products, Services and Revenue Mix",
                order=order,
                blocks=blocks,
            )
        )
        order += 1

    customers = extract_customers_section(snapshots)
    cust_rows = []
    for c in (customers.get("materialCustomers") or customers.get("customers") or [])[:10]:
        if isinstance(c, dict):
            cust_rows.append(
                [
                    _customer_label(c) or "—",
                    _clean(c.get("industry")),
                    f"{_clean(c.get('revenueContributionPercentage') or c.get('revenueContributionPct'))}%"
                    if _clean(c.get("revenueContributionPercentage") or c.get("revenueContributionPct"))
                    else "—",
                    _clean(c.get("relationshipSince") or c.get("relationshipDurationYears")),
                ]
            )
    if cust_rows:
        sections.append(
            DrhpSectionAST(
                section_key="customers",
                heading="Customers and Sales",
                order=order,
                blocks=[
                    _table(
                        ["Customer", "Industry", "Revenue contribution (%)", "Relationship since"],
                        cust_rows,
                        "Material customers",
                        refs,
                    )
                ],
            )
        )
        order += 1

    geo_rows = []
    for g in (customers.get("geographicRevenueRows") or [])[:8]:
        if isinstance(g, dict):
            geo_rows.append(
                [
                    _clean(g.get("regionOrCountry")),
                    _clean(g.get("revenue")),
                    f"{_clean(g.get('percentageOfRevenue'))}%",
                ]
            )
    if geo_rows:
        sections.append(
            DrhpSectionAST(
                section_key="geography",
                heading="Geographic Distribution",
                order=order,
                blocks=[_table(["Region / Country", "Revenue", "% of revenue"], geo_rows, "Geographic revenue", refs)],
            )
        )
        order += 1

    sp = _section(bo, "suppliersProcurementInventoryAndLogistics")
    supplier_rows = []
    for s in (sp.get("keySuppliers") or sp.get("materialSuppliers") or [])[:8]:
        if isinstance(s, dict):
            supplier_rows.append(
                [
                    _clean(s.get("supplierNameOrConfidentialLabel") or s.get("supplierName")),
                    _clean(s.get("inputsSupplied") or s.get("category")),
                    _clean(s.get("relationshipSince")),
                ]
            )
    if supplier_rows:
        sections.append(
            DrhpSectionAST(
                section_key="suppliers",
                heading="Suppliers and Procurement",
                order=order,
                blocks=[_table(["Supplier", "Inputs / category", "Relationship since"], supplier_rows, "Key suppliers", refs)],
            )
        )
        order += 1

    fc = _section(bo, "facilitiesCapacityAndOperationalProcess")
    facility_rows = []
    for f in (fc.get("facilities") or [])[:6]:
        if isinstance(f, dict):
            facility_rows.append(
                [
                    _clean(f.get("name")),
                    _clean(f.get("facilityType")).replace("-", " "),
                    _clean(f.get("address")),
                    _clean(f.get("area")),
                    _clean(f.get("status")),
                ]
            )
    if facility_rows:
        sections.append(
            DrhpSectionAST(
                section_key="facilities",
                heading="Facilities and Capacity",
                order=order,
                blocks=[
                    _table(
                        ["Facility", "Type", "Location", "Area", "Status"],
                        facility_rows,
                        "Operating facilities",
                        refs,
                    )
                ],
            )
        )
        order += 1

    tq = _section(bo, "technologyQualityResearchAndIntellectualProperty")
    tech_parts = []
    if _clean(tq.get("coreOperatingTechnology")):
        tech_parts.append(_clean(tq.get("coreOperatingTechnology")))
    if _clean(tq.get("technologyOwnership")):
        tech_parts.append(f"Technology ownership: {humanize_enum(tq.get('technologyOwnership'))}.")
    if _clean(tq.get("automationLevel")):
        tech_parts.append(f"Automation level: {humanize_enum(tq.get('automationLevel'))}.")
    tech_text = " ".join(tech_parts)
    if tech_text:
        sections.append(
            DrhpSectionAST(
                section_key="technology-quality",
                heading="Technology and Quality",
                order=order,
                blocks=[_paragraph(tech_text + ".", refs)],
            )
        )
        order += 1

    cs = _section(bo, "competitiveStrengthsStrategyDependenciesAndConfirmations")
    strengths = cs.get("competitiveStrengths") or []
    strength_rows = []
    for s in strengths[:8]:
        if isinstance(s, dict):
            strength_rows.append([_clean(s.get("title") or s.get("strengthTitle")), _clean(s.get("description"))[:160]])
        elif isinstance(s, str) and s.strip():
            strength_rows.append([s.strip(), ""])
    if strength_rows:
        sections.append(
            DrhpSectionAST(
                section_key="competitive-strengths",
                heading="Competitive Strengths",
                order=order,
                blocks=[_table(["Strength", "Description"], strength_rows, "Competitive strengths", refs)],
            )
        )
        order += 1

    strategy = _clean(cs.get("businessStrategyNarrative") or cs.get("growthStrategyNarrative"))
    if strategy:
        sections.append(
            DrhpSectionAST(
                section_key="strategy",
                heading="Strategy",
                order=order,
                blocks=[_paragraph(strategy, refs)],
            )
        )
        order += 1

    wf = _section(bo, "workforceHumanResourcesAndIndustrialRelations")
    workforce_text = _clean(wf.get("workforceOverviewNarrative") or wf.get("totalWorkforceCount"))
    if workforce_text:
        sections.append(
            DrhpSectionAST(
                section_key="workforce",
                heading="Workforce",
                order=order,
                blocks=[_paragraph(f"Workforce: {workforce_text}", refs)],
            )
        )
        order += 1

    return sections
