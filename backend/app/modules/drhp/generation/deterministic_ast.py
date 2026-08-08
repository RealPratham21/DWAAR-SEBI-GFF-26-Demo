"""Deterministic DRHP chapter AST builders (G2R)."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpChapterAST, DrhpSectionAST
from app.modules.drhp.constants import AST_SCHEMA_VERSION, CHAPTER_TITLES, BlockSupportState, PLACEHOLDER_TOKEN
from app.modules.drhp.generation.source_extractors import (
    extract_basis_metrics,
    extract_capital_structure,
    extract_corporate_events,
    extract_directors,
    extract_group_entities,
    extract_identity,
    extract_ipo_offer,
    extract_lead_manager,
    extract_litigation_matters,
    extract_objects,
    extract_promoters,
    extract_registrar,
    extract_shareholders,
    format_office_address,
    pivot_pl_table,
    extract_balance_sheet_summary,
    extract_market_series,
)
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _val(value: str | None, *, allow_placeholder: bool = True) -> str:
    text = str(value or "").strip()
    if text:
        return text
    return PLACEHOLDER_TOKEN if allow_placeholder else ""


def _block(
    *,
    kind: str,
    content: dict[str, Any],
    source_ref_ids: list[str],
    support_state: str = BlockSupportState.STRUCTURED_INPUT_BACKED,
    order: int = 1,
) -> DrhpBlockAST:
    return DrhpBlockAST(
        block_id=f"blk-{uuid4()}",
        kind=kind,  # type: ignore[arg-type]
        order=order,
        content=content,
        source_ref_ids=source_ref_ids,
        support_state=support_state,  # type: ignore[arg-type]
    )


def _table_from_rows(
    *,
    headers: list[str],
    rows: list[list[str]],
    caption: str = "",
    source_ref_ids: list[str] | None = None,
    order: int = 1,
) -> DrhpBlockAST:
    return _block(
        kind="table",
        content={"headers": headers, "rows": rows, "caption": caption},
        source_ref_ids=source_ref_ids or [],
        support_state=BlockSupportState.CALCULATION_BACKED,
        order=order,
    )


def build_deterministic_chapter_ast(
    chapter_key: str,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> DrhpChapterAST:
    builders = {
        "cover-page-front-matter": _build_cover,
        "general-information-issue": _build_general_information,
        "capital-structure-ownership": _build_capital,
        "terms-structure-procedure": _build_terms,
        "material-contracts-inspection": _build_material_contracts,
        "declarations-aoa-miscellaneous": _build_declarations,
    }
    builder = builders.get(chapter_key)
    if builder is None:
        return DrhpChapterAST(
            chapter_key=chapter_key,
            title=CHAPTER_TITLES[chapter_key],
            order=0,
            sections=[],
        )
    return builder(bundle, snapshots)


def _build_cover(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    identity = extract_identity(snapshots)
    ipo = extract_ipo_offer(snapshots)
    refs = [r.ref_id for r in bundle.source_refs[:12]]
    issuer = _val(identity.get("legalName"))

    legend = (
        "Please read Section 32 of the Companies Act, 2013. "
        "This Draft Red Herring Prospectus will be updated upon filing with the Registrar of Companies "
        "and the Securities and Exchange Board of India."
    )

    issuer_rows = [
        ["Name of the Issuer", issuer],
        ["Corporate Identity Number (CIN)", _val(identity.get("cin"))],
        ["Registered Office", _val(identity.get("registeredOffice"))],
        ["Corporate Office", _val(identity.get("registeredOffice"))],
        ["Telephone", _val(identity.get("telephone"))],
        ["E-mail", _val(identity.get("email"))],
        ["Website", _val(identity.get("website"))],
    ]

    offer_rows = [
        ["Type of Offer", "Fresh Issue" if ipo.get("freshIssueShares") else _val(ipo.get("offerType"))],
        ["Equity Shares offered (Fresh Issue)", _val(ipo.get("freshIssueShares"))],
        ["Offer for Sale", _val(ipo.get("ofsShares"))],
        ["Face Value per Equity Share (₹)", _val(ipo.get("faceValue"))],
        ["Issue Price / Price Band (₹)", _val(ipo.get("proposedIssuePrice"), allow_placeholder=True)],
        ["Issue Method", _val(ipo.get("issueMethod"))],
        ["Target SME Platform / Exchange", _val(ipo.get("targetExchange") or ipo.get("targetPlatform"))],
    ]

    intermediary_rows = [
        ["Book Running Lead Manager", _val(extract_lead_manager(snapshots))],
        ["Registrar to the Issue", _val(extract_registrar(snapshots))],
    ]

    blocks: list[DrhpBlockAST] = [
        _block(
            kind="legal_notice",
            content={"text": legend},
            source_ref_ids=refs[:1],
            order=1,
        ),
        _block(
            kind="heading",
            content={"text": f"DRAFT RED HERRING PROSPECTUS", "level": 1},
            source_ref_ids=refs[:1],
            order=2,
        ),
        _block(
            kind="heading",
            content={"text": issuer, "level": 2},
            source_ref_ids=refs[:1],
            order=3,
        ),
        _block(
            kind="paragraph",
            content={
                "text": (
                    f"{issuer} is proposing a public issue of equity shares. "
                    f"This document is a draft red herring prospectus and does not constitute an offer to the public "
                    f"until filed with SEBI and the designated stock exchange."
                )
            },
            source_ref_ids=refs[:1],
            order=4,
        ),
        _table_from_rows(
            headers=["Particulars", "Details"],
            rows=issuer_rows,
            caption="Particulars of the Issuer",
            source_ref_ids=refs,
            order=5,
        ),
        _table_from_rows(
            headers=["Particulars", "Details"],
            rows=offer_rows,
            caption="Particulars of the Issue",
            source_ref_ids=refs,
            order=6,
        ),
        _table_from_rows(
            headers=["Intermediary", "Name"],
            rows=intermediary_rows,
            caption="Issue Intermediaries",
            source_ref_ids=refs,
            order=7,
        ),
    ]

    return DrhpChapterAST(
        chapter_key="cover-page-front-matter",
        title=CHAPTER_TITLES["cover-page-front-matter"],
        order=1,
        sections=[
            DrhpSectionAST(section_key="cover", heading="Cover Page", order=1, blocks=blocks),
        ],
    )


def _build_general_information(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    cover = _build_cover(bundle, snapshots)
    cover.chapter_key = "general-information-issue"
    cover.title = CHAPTER_TITLES["general-information-issue"]
    cover.sections[0].section_key = "general-information"
    cover.sections[0].heading = "General Information & The Issue"
    return cover


def _build_capital(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    refs = [r.ref_id for r in bundle.source_refs]
    cap = extract_capital_structure(snapshots)
    shareholders = extract_shareholders(snapshots)
    promoters = extract_promoters(snapshots)
    ipo = extract_ipo_offer(snapshots)

    capital_rows = [
        ["Authorised Equity Share Capital (₹)", _val(cap.get("authorisedEquityShareCapital"))],
        ["Issued Equity Share Capital (₹)", _val(cap.get("issuedEquityShareCapital"))],
        ["Paid-up Equity Share Capital (₹)", _val(cap.get("paidUpEquityShareCapital"))],
        ["Authorised Equity Shares (No.)", _val(cap.get("authorisedShares"))],
        ["Issued & Subscribed Equity Shares (No.)", _val(cap.get("issuedShares"))],
        ["Paid-up Equity Shares (No.)", _val(cap.get("paidUpShares"))],
        ["Face Value per Equity Share (₹)", _val(cap.get("faceValuePerShare") or ipo.get("faceValue"))],
        ["As on", _val(cap.get("asOnDate"))],
    ]

    offer_rows = [
        ["Pre-issue Equity Shares", _val(cap.get("issuedShares"))],
        ["Fresh Issue Shares", _val(ipo.get("freshIssueShares"))],
        ["Offer for Sale Shares", _val(ipo.get("ofsShares"))],
    ]

    blocks: list[DrhpBlockAST] = [
        _block(
            kind="paragraph",
            content={
                "text": (
                    "The authorised, issued, subscribed and paid-up share capital of our Company "
                    "as on the date of this Draft Red Herring Prospectus is set out below."
                )
            },
            source_ref_ids=refs[:1],
            order=1,
        ),
        _table_from_rows(
            headers=["Particulars", "Amount / Details"],
            rows=capital_rows,
            caption="Share capital of our Company",
            source_ref_ids=refs,
            order=2,
        ),
        _table_from_rows(
            headers=["Particulars", "Shares"],
            rows=offer_rows,
            caption="Present issue and share capital",
            source_ref_ids=refs,
            order=3,
        ),
    ]

    if shareholders:
        sh_rows = [[s["name"], s["category"], s["shares"], s["pct"]] for s in shareholders[:20]]
        blocks.append(
            _table_from_rows(
                headers=["Shareholder", "Category", "Equity shares held", "% of pre-issue capital"],
                rows=sh_rows,
                caption="Shareholding pattern prior to the Offer",
                source_ref_ids=refs,
                order=4,
            )
        )

    if promoters:
        p_rows = [[p["name"], p["category"], p["shares"]] for p in promoters[:15]]
        blocks.append(
            _table_from_rows(
                headers=["Promoter", "Category", "Equity shares held"],
                rows=p_rows,
                caption="Promoter shareholding",
                source_ref_ids=refs,
                order=5,
            )
        )

    capital_ws = snapshots.get("capital-ownership")
    if capital_ws:
        history = (capital_ws.payload.get("shareCapitalHistory") or {}).get("capitalEvents") or []
        if history:
            h_rows = [
                [
                    str(e.get("eventDate") or PLACEHOLDER_TOKEN),
                    str(e.get("eventType") or "").replace("-", " ").title(),
                    str(e.get("numberOfShares") or PLACEHOLDER_TOKEN),
                    str(e.get("description") or "")[:80],
                ]
                for e in history[:12]
                if isinstance(e, dict)
            ]
            if h_rows:
                blocks.append(
                    _table_from_rows(
                        headers=["Date", "Event", "Shares", "Description"],
                        rows=h_rows,
                        caption="History of equity share capital",
                        source_ref_ids=refs,
                        order=6,
                    )
                )

    return DrhpChapterAST(
        chapter_key="capital-structure-ownership",
        title=CHAPTER_TITLES["capital-structure-ownership"],
        order=6,
        sections=[DrhpSectionAST(section_key="capital-structure", heading="Capital Structure", order=1, blocks=blocks)],
    )


def _build_terms(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    ipo = extract_ipo_offer(snapshots)
    refs = [r.ref_id for r in bundle.source_refs]
    rows = [
        ["Securities offered", "Equity Shares of face value ₹ " + _val(ipo.get("faceValue")) + " each"],
        ["Fresh Issue", _val(ipo.get("freshIssueShares")) + " Equity Shares"],
        ["Offer for Sale", _val(ipo.get("ofsShares"))],
        ["Issue Method", _val(ipo.get("issueMethod"))],
        ["Minimum Application Lot", _val(ipo.get("lotSize"))],
        ["Designated Stock Exchange", _val(ipo.get("targetExchange") or ipo.get("targetPlatform"))],
        ["Book Running Lead Manager", _val(extract_lead_manager(snapshots))],
        ["Registrar to the Issue", _val(extract_registrar(snapshots))],
    ]
    return DrhpChapterAST(
        chapter_key="terms-structure-procedure",
        title=CHAPTER_TITLES["terms-structure-procedure"],
        order=16,
        sections=[
            DrhpSectionAST(
                section_key="terms",
                heading="Terms, Structure and Procedure of the Issue",
                order=1,
                blocks=[
                    _table_from_rows(headers=["Term", "Particulars"], rows=rows, caption="Terms of the Issue", source_ref_ids=refs),
                ],
            )
        ],
    )


def _build_material_contracts(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    refs = [r.ref_id for r in bundle.source_refs]
    if_ws = snapshots.get("intermediaries-filing")
    bac = snapshots.get("borrowings-assets-contracts")
    doc_rows: list[list[str]] = []
    contract_rows: list[list[str]] = []

    if if_ws:
        readiness = if_ws.payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
        for item in readiness.get("inspectionItems") or []:
            if not isinstance(item, dict):
                continue
            doc_rows.append(
                [
                    _val(item.get("documentTitle") or item.get("contractName")),
                    _val(item.get("parties") or item.get("partyNames")),
                    _val(item.get("documentDate") or item.get("date")),
                    _val(item.get("inspectionAvailability") or item.get("availability")),
                ]
            )

    if bac:
        for c in (bac.payload.get("materialBusinessStrategicAndOtherContracts") or {}).get("contracts") or []:
            if not isinstance(c, dict):
                continue
            contract_rows.append(
                [
                    _val(c.get("contractTitle") or c.get("name")),
                    _val(c.get("counterpartyName") or c.get("parties")),
                    _val(c.get("contractDate") or c.get("effectiveDate")),
                    _val(c.get("materialityBasis") or c.get("description"))[:80],
                ]
            )

    blocks: list[DrhpBlockAST] = []
    if contract_rows:
        blocks.append(
            _table_from_rows(
                headers=["Contract", "Parties", "Date", "Materiality / description"],
                rows=contract_rows,
                caption="Material contracts",
                source_ref_ids=refs,
            )
        )
    if doc_rows:
        blocks.append(
            _table_from_rows(
                headers=["Document", "Parties", "Date", "Inspection availability"],
                rows=doc_rows,
                caption="Material documents for inspection",
                source_ref_ids=refs,
                order=2,
            )
        )
    if not blocks:
        blocks.append(
            _block(
                kind="paragraph",
                content={"text": "Material contracts and documents for inspection will be annexed prior to filing."},
                source_ref_ids=refs[:1],
            )
        )

    return DrhpChapterAST(
        chapter_key="material-contracts-inspection",
        title=CHAPTER_TITLES["material-contracts-inspection"],
        order=17,
        sections=[
            DrhpSectionAST(
                section_key="inspection",
                heading="Material Contracts and Documents for Inspection",
                order=1,
                blocks=blocks,
            )
        ],
    )


def _build_declarations(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    refs = [r.ref_id for r in bundle.source_refs]
    return DrhpChapterAST(
        chapter_key="declarations-aoa-miscellaneous",
        title=CHAPTER_TITLES["declarations-aoa-miscellaneous"],
        order=18,
        sections=[
            DrhpSectionAST(
                section_key="declarations",
                heading="Declarations",
                order=1,
                blocks=[
                    _block(
                        kind="paragraph",
                        content={
                            "text": (
                                "The Board of Directors of our Company hereby declares that all statements made in "
                                "this Draft Red Herring Prospectus are true and correct in material respects and "
                                "that no material fact has been omitted. Professional and intermediary confirmations "
                                "shall be obtained prior to filing, as applicable."
                            )
                        },
                        source_ref_ids=refs[:1],
                    ),
                    _block(
                        kind="placeholder",
                        content={"text": PLACEHOLDER_TOKEN, "reason": "Signing persons and final board resolutions"},
                        source_ref_ids=[],
                        support_state=BlockSupportState.PLACEHOLDER,
                        order=2,
                    ),
                ],
            )
        ],
    )


def build_deterministic_tables_for_hybrid(
    chapter_key: str,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> list[DrhpBlockAST]:
    table_builders = {
        "financial-information-mda": _financial_tables,
        "basis-for-issue-price": _basis_tables,
        "industry-overview": _industry_tables,
        "legal-regulatory-approvals": _legal_tables,
        "group-companies-rpt": _group_tables,
        "management-governance": _management_tables,
        "objects-of-the-issue": _objects_tables,
        "business-operations": _business_tables,
        "company-history-promoters-structure": _history_tables,
    }
    fn = table_builders.get(chapter_key)
    if fn is None:
        return []
    return fn(bundle, snapshots)


def _financial_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    blocks: list[DrhpBlockAST] = []
    headers, rows = pivot_pl_table(snapshots)
    if rows:
        blocks.append(
            _table_from_rows(
                headers=headers,
                rows=rows,
                caption="Restated Statement of Profit and Loss (₹ lakh, unless stated otherwise)",
                source_ref_ids=refs,
            )
        )
    bs_headers, bs_rows = extract_balance_sheet_summary(snapshots)
    if bs_rows:
        blocks.append(
            _table_from_rows(
                headers=bs_headers,
                rows=bs_rows,
                caption="Summary balance sheet information (₹ lakh)",
                source_ref_ids=refs,
                order=2,
            )
        )
    return blocks


def _basis_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    rows = extract_basis_metrics(snapshots)
    if not rows:
        return []
    return [
        _table_from_rows(
            headers=["Metric", "Value"],
            rows=rows,
            caption="Basis for Issue Price — financial metrics",
            source_ref_ids=refs,
        )
    ]


def _industry_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    blocks: list[DrhpBlockAST] = []
    for idx, series in enumerate(extract_market_series(snapshots)[:3], start=1):
        if not isinstance(series, dict):
            continue
        rows = []
        for pv in series.get("periodValues") or []:
            if isinstance(pv, dict):
                rows.append([str(pv.get("period")), str(pv.get("value")), str(pv.get("actualEstimateForecast"))])
        forecast = series.get("forecastMetadata") or {}
        if rows:
            blocks.append(
                _table_from_rows(
                    headers=["Period", f"Market size ({series.get('unit', '')})", "Basis"],
                    rows=rows,
                    caption=str(series.get("marketName") or "Market size")[:100],
                    source_ref_ids=refs,
                    order=idx,
                )
            )
        if isinstance(forecast, dict) and forecast.get("reportedCagr"):
            blocks.append(
                _block(
                    kind="paragraph",
                    content={"text": f"Reported CAGR: {forecast['reportedCagr']}% ({forecast.get('keyAssumptions') or ''})"},
                    source_ref_ids=refs[:1],
                    order=idx + 10,
                )
            )
    return blocks


def _legal_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    matters = extract_litigation_matters(snapshots)
    if not matters:
        return []
    rows = [[m["title"], m["forum"], m["status"], m["amount"]] for m in matters]
    return [
        _table_from_rows(
            headers=["Matter", "Forum", "Stage", "Amount / relief"],
            rows=rows,
            caption="Outstanding litigation and regulatory proceedings",
            source_ref_ids=refs,
        )
    ]


def _group_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    entities = extract_group_entities(snapshots)
    blocks: list[DrhpBlockAST] = []
    if entities:
        rows = [[e["name"], e["relationship"], e["cin"], e["office"]] for e in entities]
        blocks.append(
            _table_from_rows(
                headers=["Entity", "Relationship", "CIN", "Registered office"],
                rows=rows,
                caption="Group structure",
                source_ref_ids=refs,
            )
        )
    ge = snapshots.get("group-entities-related-parties")
    if ge:
        rpts = (ge.payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}).get("transactions") or []
        rpt_rows = []
        for t in rpts[:15]:
            if isinstance(t, dict):
                rpt_rows.append(
                    [
                        str(t.get("relatedPartyName") or t.get("partyName") or PLACEHOLDER_TOKEN),
                        str(t.get("transactionNature") or t.get("nature") or PLACEHOLDER_TOKEN),
                        str(t.get("transactionAmount") or t.get("amount") or PLACEHOLDER_TOKEN),
                    ]
                )
        if rpt_rows:
            blocks.append(
                _table_from_rows(
                    headers=["Related party", "Nature", "Amount (₹)"],
                    rows=rpt_rows,
                    caption="Related party transactions",
                    source_ref_ids=refs,
                    order=2,
                )
            )
    return blocks


def _management_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    directors = extract_directors(snapshots)
    if not directors:
        return []
    rows = [[d["name"], d["designation"], d["din"]] for d in directors]
    return [
        _table_from_rows(
            headers=["Name", "Designation", "DIN"],
            rows=rows,
            caption="Board of Directors",
            source_ref_ids=refs,
        )
    ]


def _objects_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    objects = extract_objects(snapshots)
    if not objects:
        return []
    rows = [[o["name"], o["category"], o["estimatedCost"], o["fromProceeds"]] for o in objects]
    return [
        _table_from_rows(
            headers=["Object", "Category", "Estimated cost (₹)", "From net proceeds (₹)"],
            rows=rows,
            caption="Objects of the Issue and proposed allocation",
            source_ref_ids=refs,
        )
    ]


def _business_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    from app.modules.drhp.generation.source_extractors import extract_products

    refs = [r.ref_id for r in bundle.source_refs]
    products = extract_products(snapshots)
    if not products:
        return []
    rows = [[p["name"], p["segment"], p["description"][:100] if p["description"] else "—"] for p in products[:12]]
    return [
        _table_from_rows(
            headers=["Product / Service", "Segment", "Description"],
            rows=rows,
            caption="Principal products and services",
            source_ref_ids=refs,
        )
    ]


def _history_tables(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpBlockAST]:
    refs = [r.ref_id for r in bundle.source_refs]
    events = extract_corporate_events(snapshots)
    if not events:
        return []
    rows = [[e["date"], e["type"], e["description"]] for e in events]
    return [
        _table_from_rows(
            headers=["Date", "Event", "Description"],
            rows=rows,
            caption="Corporate history and major events",
            source_ref_ids=refs,
        )
    ]
