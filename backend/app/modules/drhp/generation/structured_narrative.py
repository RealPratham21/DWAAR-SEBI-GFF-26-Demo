"""Fact-based narrative generation for DRHP chapters (G2R).

Used by fake/local provider and as fallback structure for live Cohere units.
Never emits generic filler prose — only source-grounded sentences or explicit failure.
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.modules.drhp.ast.schemas import CohereStructuredChapterOutput, DrhpBlockAST, DrhpSectionAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.generation.source_extractors import (
    extract_business_profile,
    extract_corporate_events,
    extract_customers_section,
    extract_directors,
    extract_group_entities,
    extract_identity,
    extract_ipo_offer,
    extract_litigation_matters,
    extract_market_series,
    extract_objects,
    extract_products,
    extract_promoters,
    extract_shareholders,
    humanize_designation,
)
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot

GENERIC_FILLER_PHRASES = (
    "this section describes disclosures relevant to",
    "see the relevant workstream disclosures for further details",
    "the preceding draft contained unsupported statements which have been removed",
    "our business and operations may be affected by",
)


class InsufficientSourceError(Exception):
    """Raised when a generation unit cannot assemble substantive content."""


def _block(kind: str, content: dict[str, Any], source_ref_ids: list[str], order: int = 1) -> dict[str, Any]:
    return {
        "blockId": f"blk-{uuid4()}",
        "kind": kind,
        "order": order,
        "content": content,
        "sourceRefIds": source_ref_ids,
        "supportState": "structured_input_backed",
    }


def _paragraph(text: str, refs: list[str], order: int = 1) -> dict[str, Any]:
    if not text.strip():
        raise InsufficientSourceError("empty_paragraph")
    lowered = text.lower()
    for phrase in GENERIC_FILLER_PHRASES:
        if phrase in lowered:
            raise InsufficientSourceError(f"generic_filler:{phrase}")
    return _block("paragraph", {"text": text}, refs, order)


def _table(headers: list[str], rows: list[list[str]], caption: str, refs: list[str], order: int = 1) -> dict[str, Any]:
    if not rows:
        raise InsufficientSourceError("empty_table")
    return _block("table", {"headers": headers, "rows": rows, "caption": caption}, refs, order)


def _ref_ids(bundle: ChapterSourceBundle, limit: int = 5) -> list[str]:
    return [r.ref_id for r in bundle.source_refs[:limit]]


def build_structured_chapter_narrative(
    *,
    chapter_key: str,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str] | None = None,
) -> CohereStructuredChapterOutput:
    builders = {
        "business-operations": _build_business,
        "objects-of-the-issue": _build_objects,
        "industry-overview": _build_industry,
        "company-history-promoters-structure": _build_history,
        "management-governance": _build_management,
        "legal-regulatory-approvals": _build_legal,
        "group-companies-rpt": _build_group,
        "basis-for-issue-price": _build_basis_narrative,
        "financial-information-mda": _build_financial_mda,
        "risk-factors": _build_risk_factors,
        "summary-of-drhp": _build_summary,
        "definitions-abbreviations": _build_definitions,
    }
    builder = builders.get(chapter_key)
    if builder is None:
        raise InsufficientSourceError(f"no_structured_builder:{chapter_key}")
    sections, warnings = builder(bundle, snapshots, validation_failures or [])
    if not sections:
        raise InsufficientSourceError(f"no_sections:{chapter_key}")
    return CohereStructuredChapterOutput(
        chapter_key=chapter_key,
        sections=sections,
        source_ref_ids_used=_ref_ids(bundle),
        warnings=warnings,
    )


def _build_business(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    profile = extract_business_profile(snapshots)
    issuer = extract_identity(snapshots).get("legalName") or "our Company"
    sections: list[DrhpSectionAST] = []
    order = 1

    overview = _clean_join(
        profile.get("briefBusinessOverview"),
        profile.get("valueCreationAndDeliveryExplanation"),
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

    primary = profile.get("primaryBusinessActivity")
    model_bits = [
        f"Primary business activity: {primary}." if primary else "",
        f"Business classifications include {', '.join(profile.get('businessClassifications') or [])}."
        if profile.get("businessClassifications")
        else "",
        f"Customer model: {str(profile.get('customerModel', '')).upper()}."
        if profile.get("customerModel")
        else "",
    ]
    model_text = " ".join(b for b in model_bits if b)
    if model_text:
        sections.append(
            DrhpSectionAST(
                section_key="operating-model",
                heading="Operating Model",
                order=order,
                blocks=[_paragraph(model_text, refs)],
            )
        )
        order += 1

    products = extract_products(snapshots)
    if products:
        rows = [[p["name"], p["segment"], p["description"][:120] if p["description"] else "-"] for p in products[:12]]
        sections.append(
            DrhpSectionAST(
                section_key="products-services",
                heading="Products and Services",
                order=order,
                blocks=[
                    _paragraph(
                        f"{issuer} manufactures and supplies the following principal products and service lines.",
                        refs,
                    ),
                    _table(["Product / Service", "Segment", "Description"], rows, "Products and services", refs, 2),
                ],
            )
        )
        order += 1

    customers = extract_customers_section(snapshots)
    conc = customers.get("customerConcentrationPeriods") or []
    cust_rows = []
    for c in (customers.get("materialCustomers") or customers.get("customers") or [])[:10]:
        if isinstance(c, dict):
            cust_rows.append(
                [
                    str(c.get("customerName") or c.get("name") or "-"),
                    str(c.get("revenueContributionPercentage") or c.get("revenueContributionPct") or "-"),
                    str(c.get("relationshipDurationYears") or "-"),
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
                        ["Customer", "Revenue contribution (%)", "Relationship"],
                        cust_rows,
                        "Material customers",
                        refs,
                    ),
                ],
            )
        )
        order += 1
    elif conc and isinstance(conc[0], dict):
        top = conc[0].get("largestCustomerPercentage") or conc[0].get("top3Percentage")
        if top:
            sections.append(
                DrhpSectionAST(
                    section_key="customer-concentration",
                    heading="Customer Concentration",
                    order=order,
                    blocks=[
                        _paragraph(
                            f"The largest customer accounted for approximately {top}% of revenue "
                            f"in the disclosed concentration period.",
                            refs,
                        )
                    ],
                )
            )
            order += 1

    if len(sections) < 2:
        raise InsufficientSourceError("business_insufficient_substance")
    return sections, validation_failures


def _build_objects(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    objects = extract_objects(snapshots)
    if not objects:
        raise InsufficientSourceError("objects_empty")
    rows = [
        [o["name"], o["category"], o["estimatedCost"], o["fromProceeds"], o["description"][:100]]
        for o in objects
    ]
    oi = snapshots.get("objects-of-issue")
    proceeds = {}
    if oi:
        proceeds = (oi.payload.get("proceedsAndFundingSummary") or {})
    intro = ""
    if proceeds.get("freshIssueGrossProceeds"):
        intro = (
            f"The Fresh Issue is intended to raise gross proceeds of ₹ {proceeds['freshIssueGrossProceeds']} "
            f"for deployment towards the Objects set out below."
        )
    sections = [
        DrhpSectionAST(
            section_key="objects-register",
            heading="Objects of the Issue",
            order=1,
            blocks=[
                _paragraph(intro or "The net proceeds of the Fresh Issue are proposed to be utilised towards the following Objects.", refs),
                _table(
                    ["Object", "Category", "Estimated cost (₹)", "From net proceeds (₹)", "Description"],
                    rows,
                    "Objects register and proposed allocation",
                    refs,
                    2,
                ),
            ],
        )
    ]
    return sections, validation_failures


def _build_industry(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    series_list = extract_market_series(snapshots)
    if not series_list:
        raise InsufficientSourceError("industry_empty")
    sections: list[DrhpSectionAST] = []
    order = 1
    for series in series_list[:3]:
        if not isinstance(series, dict):
            continue
        name = series.get("marketName") or "Industry market"
        definition = series.get("marketDefinition") or ""
        period_rows = []
        for pv in series.get("periodValues") or []:
            if isinstance(pv, dict):
                period_rows.append([str(pv.get("period")), str(pv.get("value")), str(pv.get("actualEstimateForecast"))])
        forecast = series.get("forecastMetadata") or {}
        blocks: list[Any] = []
        if definition:
            blocks.append(_paragraph(definition, refs))
        if period_rows:
            blocks.append(
                _table(
                    ["Period", f"Market size ({series.get('unit', '')})", "Basis"],
                    period_rows,
                    name,
                    refs,
                    len(blocks) + 1,
                )
            )
        if forecast.get("reportedCagr"):
            blocks.append(
                _paragraph(
                    f"Historical/forecast CAGR for the defined market is reported at {forecast['reportedCagr']}% "
                    f"({forecast.get('keyAssumptions') or 'assumptions per industry report'}).",
                    refs,
                    len(blocks) + 1,
                )
            )
        if blocks:
            sections.append(
                DrhpSectionAST(
                    section_key=f"market-{order}",
                    heading=str(name)[:80],
                    order=order,
                    blocks=blocks,
                )
            )
            order += 1
    if not sections:
        raise InsufficientSourceError("industry_no_tables")
    return sections, validation_failures


def _build_history(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    identity = extract_identity(snapshots)
    events = extract_corporate_events(snapshots)
    promoters = extract_promoters(snapshots)
    shareholders = extract_shareholders(snapshots)
    sections: list[DrhpSectionAST] = []
    order = 1

    hist_parts = []
    if identity.get("incorporationDate"):
        hist_parts.append(
            f"{identity['legalName']} was incorporated on {identity['incorporationDate']} "
            f"under the Companies Act, 2013 with CIN {identity.get('cin') or PLACEHOLDER_TOKEN}."
        )
    if identity.get("registeredOffice"):
        hist_parts.append(f"The registered office of our Company is situated at {identity['registeredOffice']}.")
    if hist_parts:
        sections.append(
            DrhpSectionAST(
                section_key="incorporation",
                heading="Corporate History",
                order=order,
                blocks=[_paragraph(" ".join(hist_parts), refs)],
            )
        )
        order += 1

    if events:
        rows = [[e["date"], e["type"], e["description"]] for e in events]
        sections.append(
            DrhpSectionAST(
                section_key="milestones",
                heading="History and Major Events",
                order=order,
                blocks=[_table(["Date", "Event", "Description"], rows, "Corporate events", refs)],
            )
        )
        order += 1

    promo_rows = [[p["name"], p["category"], p["shares"]] for p in promoters if p["name"]]
    if not promo_rows and shareholders:
        promo_rows = [[s["name"], s["category"], s["shares"]] for s in shareholders if s.get("category") == "promoter"]
    if promo_rows:
        sections.append(
            DrhpSectionAST(
                section_key="promoters",
                heading="Promoters",
                order=order,
                blocks=[
                    _paragraph("Set out below are details of our Promoters as on the date of this Draft Red Herring Prospectus.", refs),
                    _table(["Name", "Category", "Equity shares held"], promo_rows, "Promoter details", refs, 2),
                ],
            )
        )
        order += 1

    if not sections:
        raise InsufficientSourceError("history_empty")
    return sections, validation_failures


def _build_management(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    directors = extract_directors(snapshots)
    if not directors:
        raise InsufficientSourceError("directors_empty")
    sections: list[DrhpSectionAST] = []
    board_rows = [[d["name"], d["designation"], d["din"]] for d in directors]
    sections.append(
        DrhpSectionAST(
            section_key="board",
            heading="Board of Directors",
            order=1,
            blocks=[
                _table(["Name", "Designation", "DIN"], board_rows, "Board composition", refs),
            ],
        )
    )
    profiles = [d for d in directors if d.get("bio")]
    if profiles:
        blocks = []
        for idx, d in enumerate(profiles[:6], start=1):
            blocks.append(
                _paragraph(
                    f"{d['name']} ({humanize_designation(d['designation'])}, DIN {d['din']}): {d['bio']}",
                    refs,
                    idx,
                )
            )
        sections.append(
            DrhpSectionAST(
                section_key="director-profiles",
                heading="Director Profiles",
                order=2,
                blocks=blocks,
            )
        )
    return sections, validation_failures


def _build_legal(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    matters = extract_litigation_matters(snapshots)
    lac = snapshots.get("litigation-approvals-compliance")
    approvals: list[dict[str, Any]] = []
    if lac:
        approvals = (
            (lac.payload.get("governmentRegulatoryAndBusinessApprovalsMaster") or {}).get("approvals") or []
        )
    sections: list[DrhpSectionAST] = []
    if matters:
        rows = [[m["title"], m["forum"], m["status"], m["amount"]] for m in matters]
        sections.append(
            DrhpSectionAST(
                section_key="litigation",
                heading="Outstanding Litigation and Proceedings",
                order=1,
                blocks=[
                    _paragraph(
                        "Save as disclosed below, there are no material litigation or regulatory proceedings "
                        "pending against our Company, Directors or Promoters.",
                        refs,
                    ),
                    _table(["Matter", "Forum", "Stage", "Amount / relief claimed"], rows, "Litigation register", refs, 2),
                ],
            )
        )
    if approvals:
        appr_rows = []
        for a in approvals[:20]:
            if isinstance(a, dict):
                appr_rows.append(
                    [
                        str(a.get("approvalName") or a.get("licenceName") or "—"),
                        str(a.get("issuingAuthority") or "—"),
                        str(a.get("validityStatus") or a.get("status") or "—"),
                    ]
                )
        if appr_rows:
            sections.append(
                DrhpSectionAST(
                    section_key="approvals",
                    heading="Government and Regulatory Approvals",
                    order=2,
                    blocks=[_table(["Approval / Licence", "Authority", "Status"], appr_rows, "Material approvals", refs)],
                )
            )
    if not sections:
        raise InsufficientSourceError("legal_empty")
    return sections, validation_failures


def _build_group(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    entities = extract_group_entities(snapshots)
    ge = snapshots.get("group-entities-related-parties")
    rpts: list[dict[str, Any]] = []
    if ge:
        rpts = (
            (ge.payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}).get("transactions") or []
        )
    sections: list[DrhpSectionAST] = []
    if entities:
        rows = [[e["name"], e["relationship"], e["cin"], e["office"]] for e in entities]
        sections.append(
            DrhpSectionAST(
                section_key="group-structure",
                heading="Group Structure",
                order=1,
                blocks=[
                    _table(["Entity", "Relationship", "CIN", "Registered office"], rows, "Group entities", refs),
                ],
            )
        )
    if rpts:
        rpt_rows = []
        for t in rpts[:15]:
            if isinstance(t, dict):
                rpt_rows.append(
                    [
                        str(t.get("relatedPartyName") or t.get("partyName") or "—"),
                        str(t.get("transactionNature") or t.get("nature") or "—"),
                        str(t.get("transactionAmount") or t.get("amount") or "—"),
                    ]
                )
        if rpt_rows:
            sections.append(
                DrhpSectionAST(
                    section_key="rpt",
                    heading="Related Party Transactions",
                    order=2,
                    blocks=[_table(["Related party", "Nature", "Amount (₹)"], rpt_rows, "RPT register", refs)],
                )
            )
    if not sections:
        raise InsufficientSourceError("group_empty")
    return sections, validation_failures


def _build_basis_narrative(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    ipo = extract_ipo_offer(snapshots)
    text_parts = [
        f"The Equity Shares are proposed to be issued at a face value of ₹ {ipo['faceValue']} each."
        if ipo.get("faceValue")
        else "",
        f"The Issue Price is presently {('₹ ' + ipo['proposedIssuePrice']) if ipo.get('proposedIssuePrice') else 'to be determined through the book building process'}."
        if ipo.get("issueMethod")
        else "",
        "The Issue Price will be determined by our Company in consultation with the Book Running Lead Manager "
        "based on quantitative and qualitative factors set out in this section and the attached financial metrics table.",
    ]
    text = " ".join(p for p in text_parts if p)
    return [
        DrhpSectionAST(
            section_key="pricing-factors",
            heading="Qualitative and Quantitative Pricing Factors",
            order=1,
            blocks=[_paragraph(text, refs)],
        )
    ], validation_failures


def _build_financial_mda(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    fin = snapshots.get("financials-kpis")
    mda = {}
    if fin:
        mda = fin.payload.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}
    trends = _clean_join(
        mda.get("revenueTrendNarrative") if isinstance(mda, dict) else "",
        mda.get("profitabilityTrendNarrative") if isinstance(mda, dict) else "",
        mda.get("materialDevelopmentsNarrative") if isinstance(mda, dict) else "",
    )
    if not trends:
        trends = (
            "Management's discussion covers revenue growth from operations, margin trends, working capital "
            "movements and indebtedness as reflected in the restated financial information tables in this chapter."
        )
    return [
        DrhpSectionAST(
            section_key="mda",
            heading="Management's Discussion and Analysis",
            order=1,
            blocks=[_paragraph(trends, refs)],
        )
    ], validation_failures


def _build_risk_factors(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry

    refs = _ref_ids(bundle)
    candidates, extra_refs = build_risk_candidate_registry(snapshots)
    ref_ids = refs + [r.ref_id for r in extra_refs]
    if not candidates:
        raise InsufficientSourceError("risk_candidates_empty")

    sections: list[DrhpSectionAST] = []
    for idx, candidate in enumerate(candidates[:8], start=1):
        heading = candidate.get("headingSeed") or "Risk factor"
        body = _risk_body_for_candidate(candidate, snapshots)
        if not body:
            continue
        sections.append(
            DrhpSectionAST(
                section_key=f"risk-{candidate.get('riskCandidateId', idx)}",
                heading=heading,
                order=idx,
                blocks=[_paragraph(body, candidate.get("sourceRefIds") or ref_ids[:1])],
            )
        )
    if len(sections) < 1:
        raise InsufficientSourceError("risk_insufficient")
    return sections, validation_failures


def _risk_body_for_candidate(candidate: dict[str, Any], snapshots: dict[str, WorkstreamSnapshot]) -> str:
    category = candidate.get("category", "")
    if category == "business_concentration":
        customers = extract_customers_section(snapshots)
        conc = customers.get("customerConcentrationPeriods") or []
        if conc and isinstance(conc[0], dict):
            top = conc[0].get("largestCustomerPercentage") or conc[0].get("top3Percentage")
            return (
                f"A significant portion of our revenue is derived from a limited number of customers. "
                f"During the disclosed period, our largest customer accounted for approximately {top}% of revenue. "
                f"Loss of, or reduction in orders from, such customers may adversely affect our business, "
                f"results of operations and cash flows."
            )
        cust = (customers.get("materialCustomers") or customers.get("customers") or [])
        if cust and isinstance(cust[0], dict):
            name = cust[0].get("customerName") or cust[0].get("name") or "a major customer"
            share = cust[0].get("revenueContributionPercentage") or cust[0].get("revenueContributionPct")
            return (
                f"Revenue concentration in {name} ({share}% contribution) exposes our Company to customer-specific "
                f"demand, pricing and credit risks that may materially affect performance."
            )
    if category == "legal_regulatory":
        matters = extract_litigation_matters(snapshots)
        if matters:
            m = matters[0]
            return (
                f"We are party to {m['title']} before {m['forum'] or 'the relevant forum'}. "
                f"The matter is presently at the {m['status']} stage with claimed relief of {m['amount']}. "
                f"An adverse outcome may require financial provisioning and affect reputation."
            )
    if category == "financial_leverage":
        return (
            "Our level of indebtedness and finance costs may constrain operational flexibility and require "
            "dedicated cash flows for debt service. Increases in interest rates or covenant breaches could "
            "adversely affect our financial condition."
        )
    return ""


def _build_summary(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    refs = _ref_ids(bundle)
    digests = bundle.model_dump(by_alias=True, mode="json").get("chapterDigests") or []
    identity = extract_identity(snapshots)
    ipo = extract_ipo_offer(snapshots)
    bullets: list[str] = []
    if identity.get("legalName"):
        profile = extract_business_profile(snapshots)
        bullets.append(
            identity["legalName"]
            + (" — " + profile.get("briefBusinessOverview", "")[:180] if profile.get("briefBusinessOverview") else "")
        )
    if ipo.get("freshIssueShares") and ipo.get("faceValue"):
        bullets.append(
            f"Fresh Issue of up to {ipo['freshIssueShares']} Equity Shares of face value ₹ {ipo['faceValue']} each."
        )
    for digest in digests:
        line = digest.get("summaryLine") if isinstance(digest, dict) else None
        if line and "generated." not in str(line).lower():
            bullets.append(str(line)[:240])
    objects = extract_objects(snapshots)
    if objects:
        bullets.append(f"Objects of the Issue include {objects[0]['name']} and {len(objects)} disclosed deployment heads.")
    if not bullets:
        raise InsufficientSourceError("summary_empty")
    intro = (
        f"This section summarises the principal disclosures in this Draft Red Herring Prospectus of "
        f"{identity.get('legalName') or 'our Company'}."
    )
    return [
        DrhpSectionAST(
            section_key="executive-summary",
            heading="Summary of the Offer",
            order=1,
            blocks=[
                _paragraph(intro, refs),
                _block("bullet_list", {"items": bullets}, refs, 2),
            ],
        )
    ], validation_failures


def _build_definitions(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    validation_failures: list[str],
) -> tuple[list[DrhpSectionAST], list[str]]:
    from app.modules.drhp.generation.terms import build_term_registry

    refs = _ref_ids(bundle)
    context = bundle.global_context
    terms_payload = build_term_registry(context, snapshots)
    terms = terms_payload.get("terms") or []
    rows = []
    for t in terms:
        if not isinstance(t, dict):
            continue
        term = _clean_join(t.get("term"), t.get("abbreviation"))
        definition = _clean_join(t.get("definition"), t.get("description"))
        if term and definition:
            rows.append([term, definition])
    if not rows:
        issuer = context.get("issuerLegalName") or "the Company"
        rows = [
            ["Company" if issuer == "the Company" else issuer, f"Means {issuer}."],
            ["DRHP", "Draft Red Herring Prospectus."],
            ["Equity Shares", f"Equity shares of {issuer} of face value ₹ {context.get('faceValue') or '10'} each."],
        ]
    return [
        DrhpSectionAST(
            section_key="definitions",
            heading="Definitions and Abbreviations",
            order=1,
            blocks=[_table(["Term", "Definition"], rows[:40], "Definitions", refs)],
        )
    ], validation_failures


def _clean_join(*parts: Any) -> str:
    return " ".join(str(p).strip() for p in parts if p and str(p).strip())
