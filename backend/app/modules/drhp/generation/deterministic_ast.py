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


def _display_text(value: Any, *, allow_placeholder: bool = True) -> str:
    """Render a scalar or nested object as publication display text — never str(dict)."""
    if value is None:
        return PLACEHOLDER_TOKEN if allow_placeholder else ""
    if isinstance(value, str):
        return _val(value, allow_placeholder=allow_placeholder)
    if isinstance(value, dict):
        party_keys = (
            "counterparty",
            "counterpartyName",
            "partyName",
            "relatedPartyName",
            "entityName",
            "companyName",
            "name",
            "label",
            "title",
        )
        for key in party_keys:
            nested = value.get(key)
            if nested and str(nested).strip():
                return str(nested).strip()
        if value.get("line1") or value.get("city"):
            from app.modules.drhp.generation.source_extractors import format_office_address

            address = format_office_address(value)
            if address:
                return address
        return PLACEHOLDER_TOKEN if allow_placeholder else ""
    if isinstance(value, list):
        parts = [_display_text(item, allow_placeholder=False) for item in value]
        parts = [part for part in parts if part and part != PLACEHOLDER_TOKEN]
        if parts:
            return ", ".join(parts)
        return PLACEHOLDER_TOKEN if allow_placeholder else ""
    return _val(str(value), allow_placeholder=allow_placeholder)


def _contract_title(contract: dict[str, Any]) -> str:
    basic = contract.get("basicTerms") or {}
    if not isinstance(basic, dict):
        basic = {}
    return _val(
        contract.get("contractTitle")
        or contract.get("name")
        or basic.get("agreementTitle")
        or basic.get("title")
    )


def _contract_parties(contract: dict[str, Any]) -> str:
    parties = contract.get("parties")
    if isinstance(parties, dict):
        return _val(parties.get("counterparty") or parties.get("counterpartyName"))
    return _display_text(contract.get("counterpartyName") or parties)


def _contract_date(contract: dict[str, Any]) -> str:
    basic = contract.get("basicTerms") or {}
    if not isinstance(basic, dict):
        basic = {}
    return _val(
        contract.get("contractDate")
        or contract.get("effectiveDate")
        or basic.get("effectiveDate")
        or basic.get("executionDate")
    )


def _contract_expiry(contract: dict[str, Any]) -> str:
    basic = contract.get("basicTerms") or {}
    if not isinstance(basic, dict):
        basic = {}
    return _val(contract.get("expiry") or basic.get("expiry") or basic.get("contractTerm"))


def _contract_purpose(contract: dict[str, Any]) -> str:
    basic = contract.get("basicTerms") or {}
    if isinstance(basic, dict) and basic.get("notes"):
        return _val(basic.get("notes"))[:80]
    return _val(contract.get("category"))[:80]


def _contract_materiality(contract: dict[str, Any]) -> str:
    commercial = contract.get("commercialImportance") or {}
    if isinstance(commercial, dict):
        pct = commercial.get("percentageOfIssuerRevenueCost")
        annual = commercial.get("annualRevenueCostAttributable")
        if pct:
            return f"{pct}% of revenue/cost"
        if annual:
            return f"₹ {annual} lakh attributable"
    basic = contract.get("basicTerms") or {}
    if isinstance(basic, dict):
        return _val(basic.get("materialityBasis") or basic.get("commercialImportance"))
    return _val(contract.get("materialityBasis") or contract.get("description"))[:80]


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
    chapter = builder(bundle, snapshots)
    from app.modules.drhp.generation.ast_sanitizer import sanitize_chapter_ast
    from app.modules.drhp.generation.fact_locking import allowed_display_values, build_global_locked_facts

    locked = build_global_locked_facts(snapshots)
    return sanitize_chapter_ast(
        chapter,
        global_context=bundle.global_context,
        allowed_displays=allowed_display_values(locked),
    )


def _build_cover(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    from app.modules.drhp.generation.publication_format import format_share_count, humanize_enum

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
        ["Equity Shares offered (Fresh Issue)", format_share_count(ipo.get("freshIssueShares")) or _val(ipo.get("freshIssueShares"))],
        ["Offer for Sale", format_share_count(ipo.get("ofsShares")) if ipo.get("ofsShares") not in {None, "", "Nil", "0"} else _val(ipo.get("ofsShares"))],
        ["Face Value per Equity Share (₹)", _val(ipo.get("faceValue"))],
        ["Issue Price / Price Band (₹)", _val(ipo.get("proposedIssuePrice"), allow_placeholder=True)],
        ["Issue Method", humanize_enum(ipo.get("issueMethod")) or _val(ipo.get("issueMethod"))],
        ["Target SME Platform / Exchange", humanize_enum(ipo.get("targetExchange") or ipo.get("targetPlatform")) or _val(ipo.get("targetExchange") or ipo.get("targetPlatform"))],
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
    from app.modules.drhp.generation.publication_format import format_share_count, humanize_enum
    from app.modules.drhp.generation.source_extractors import extract_legal_counsel

    identity = extract_identity(snapshots)
    ipo = extract_ipo_offer(snapshots)
    refs = [r.ref_id for r in bundle.source_refs[:12]]
    if_ws = snapshots.get("intermediaries-filing")
    filing = {}
    if if_ws:
        filing = (if_ws.payload.get("issueConfigurationAndFilingSnapshot") or {})
    filing_snap = filing.get("filingSnapshot") if isinstance(filing.get("filingSnapshot"), dict) else {}

    rows = [
        ["Name of the Issuer", _val(identity.get("legalName"))],
        ["CIN", _val(identity.get("cin"))],
        ["Registered Office", _val(identity.get("registeredOffice"))],
        ["Corporate Office", _val(identity.get("registeredOffice"))],
        ["Telephone / E-mail", f"{_val(identity.get('telephone'), allow_placeholder=True)} / {_val(identity.get('email'), allow_placeholder=True)}"],
        ["Website", _val(identity.get("website"), allow_placeholder=True)],
        ["Type of Offer", humanize_enum(ipo.get("offerType")) or "Fresh Issue"],
        ["Fresh Issue (Equity Shares)", format_share_count(ipo.get("freshIssueShares")) or _val(ipo.get("freshIssueShares"))],
        ["Face Value (₹)", _val(ipo.get("faceValue"))],
        ["Issue Price (₹)", _val(ipo.get("proposedIssuePrice"), allow_placeholder=True)],
        ["Issue Method", humanize_enum(ipo.get("issueMethod")) or _val(ipo.get("issueMethod"))],
        ["Designated Stock Exchange", humanize_enum(ipo.get("targetExchange") or ipo.get("targetPlatform")) or _val(ipo.get("targetExchange"))],
        ["Book Running Lead Manager", _val(extract_lead_manager(snapshots))],
        ["Registrar to the Issue", _val(extract_registrar(snapshots))],
        ["Legal Counsel to the Issue", _val(extract_legal_counsel(snapshots), allow_placeholder=True)],
        ["DRHP filing status", _val(filing_snap.get("drhpFilingStatus") or filing_snap.get("filingStage"), allow_placeholder=True) if filing_snap else PLACEHOLDER_TOKEN],
    ]
    rows = [[a, b] for a, b in rows if b != PLACEHOLDER_TOKEN or a in {"Issue Price (₹)", "Legal Counsel to the Issue", "DRHP filing status"}]

    return DrhpChapterAST(
        chapter_key="general-information-issue",
        title=CHAPTER_TITLES["general-information-issue"],
        order=2,
        sections=[
            DrhpSectionAST(
                section_key="general-information",
                heading="General Information & The Issue",
                order=1,
                blocks=[
                    _block(
                        kind="paragraph",
                        content={"text": "Set out below are general particulars of the Issuer and the proposed public issue."},
                        source_ref_ids=refs[:1],
                    ),
                    _table_from_rows(headers=["Particulars", "Details"], rows=rows, caption="General information", source_ref_ids=refs, order=2),
                ],
            )
        ],
    )


def _build_capital(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> DrhpChapterAST:
    from app.modules.drhp.generation.fact_locking import format_locked_display

    refs = [r.ref_id for r in bundle.source_refs]
    cap = extract_capital_structure(snapshots)
    shareholders = extract_shareholders(snapshots)
    promoters = extract_promoters(snapshots)
    ipo = extract_ipo_offer(snapshots)

    def _share(raw: str | None) -> str:
        return format_locked_display(raw, semantic_type="share_count") if raw else PLACEHOLDER_TOKEN

    def _currency(raw: str | None) -> str:
        return format_locked_display(raw, semantic_type="currency_inr") if raw else PLACEHOLDER_TOKEN

    capital_currency_rows = [
        ["Authorised Equity Share Capital (₹)", _currency(cap.get("authorisedEquityShareCapital"))],
        ["Issued Equity Share Capital (₹)", _currency(cap.get("issuedEquityShareCapital"))],
        ["Paid-up Equity Share Capital (₹)", _currency(cap.get("paidUpEquityShareCapital"))],
        ["Face Value per Equity Share (₹)", _currency(cap.get("faceValuePerShare") or ipo.get("faceValue"))],
        ["As on", _val(cap.get("asOnDate"))],
    ]
    capital_share_rows = [
        ["Authorised Equity Shares (No.)", _share(cap.get("authorisedShares"))],
        ["Issued & Subscribed Equity Shares (No.)", _share(cap.get("issuedShares"))],
        ["Paid-up Equity Shares (No.)", _share(cap.get("paidUpShares"))],
    ]

    offer_rows = [
        ["Pre-issue Equity Shares", _share(cap.get("issuedShares"))],
        ["Fresh Issue Shares", _share(ipo.get("freshIssueShares"))],
        ["Offer for Sale Shares", _share(ipo.get("ofsShares"))],
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
            rows=capital_currency_rows,
            caption="Share capital of our Company (amounts in ₹)",
            source_ref_ids=refs,
            order=2,
        ),
        _table_from_rows(
            headers=["Particulars", "Number of shares"],
            rows=capital_share_rows,
            caption="Share capital of our Company (number of shares)",
            source_ref_ids=refs,
            order=3,
        ),
        _table_from_rows(
            headers=["Particulars", "Shares"],
            rows=offer_rows,
            caption="Present issue and share capital",
            source_ref_ids=refs,
            order=4,
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
                order=5,
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
                order=6,
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
    from app.modules.drhp.generation.publication_format import format_share_count, humanize_enum

    ipo = extract_ipo_offer(snapshots)
    refs = [r.ref_id for r in bundle.source_refs]
    if_ws = snapshots.get("intermediaries-filing")
    programme = {}
    if if_ws:
        programme = if_ws.payload.get("issueProgrammeAllotmentListingAndPostIssueExecution") or {}
    rows = [
        ["Securities offered", "Equity Shares of face value ₹ " + _val(ipo.get("faceValue")) + " each"],
        ["Fresh Issue", (format_share_count(ipo.get("freshIssueShares")) or _val(ipo.get("freshIssueShares"))) + " Equity Shares"],
        ["Offer for Sale", _val(ipo.get("ofsShares"))],
        ["Issue Price / Price Band (₹)", _val(ipo.get("proposedIssuePrice"), allow_placeholder=True)],
        ["Issue Method", humanize_enum(ipo.get("issueMethod")) or _val(ipo.get("issueMethod"))],
        ["Minimum Application Lot", _val(ipo.get("lotSize"), allow_placeholder=True)],
        ["Designated Stock Exchange", humanize_enum(ipo.get("targetExchange") or ipo.get("targetPlatform")) or _val(ipo.get("targetExchange"))],
        ["Book Running Lead Manager", _val(extract_lead_manager(snapshots))],
        ["Registrar to the Issue", _val(extract_registrar(snapshots))],
        ["Basis of allotment", _val(programme.get("allotmentBasis") or programme.get("basisOfAllotment"), allow_placeholder=True)],
        ["Listing", _val(programme.get("proposedListingSegment") or programme.get("listingSegment"), allow_placeholder=True)],
    ]
    rows = [r for r in rows if r[1] != PLACEHOLDER_TOKEN or r[0] in {"Issue Price / Price Band (₹)", "Minimum Application Lot", "Basis of allotment", "Listing"}]
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
                    _block(kind="paragraph", content={"text": "The principal terms and structure of the proposed public issue are summarised below."}, source_ref_ids=refs[:1]),
                    _table_from_rows(headers=["Term", "Particulars"], rows=rows, caption="Terms of the Issue", source_ref_ids=refs, order=2),
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
                    _display_text(item.get("parties") or item.get("partyNames")),
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
                    _contract_title(c),
                    _contract_parties(c),
                    _contract_date(c),
                    _contract_expiry(c),
                    _contract_materiality(c),
                    _contract_purpose(c),
                ]
            )

    blocks: list[DrhpBlockAST] = []
    if contract_rows:
        blocks.append(
            _table_from_rows(
                headers=["Contract", "Parties", "Execution date", "Term / expiry", "Materiality", "Purpose"],
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
    from app.modules.drhp.generation.publication_format import humanize_enum

    refs = [r.ref_id for r in bundle.source_refs]
    ci = snapshots.get("company-incorporation")
    constitutional = ""
    if ci:
        record = ci.payload.get("constitutionalRecord") or {}
        if isinstance(record, dict):
            constitutional = str(record.get("articlesOfAssociationStatus") or record.get("memorandumStatus") or "").strip()

    checklist_rows = [
        ["DRHP draft status", "Promoter-prepared draft for review and filing"],
        ["Board approval for DRHP", "Pending final board resolution and signatures"],
        ["Intermediary confirmations", "Professional confirmations pending where applicable"],
        ["Final filing with SEBI / ROC", "Pending upon completion of review and sign-offs"],
    ]
    if constitutional:
        checklist_rows.insert(1, ["Constitutional documents", humanize_enum(constitutional)])

    blocks: list[DrhpBlockAST] = [
        _block(
            kind="paragraph",
            content={
                "text": (
                    "This section summarises draft-finalisation and pending execution items. "
                    "Final board resolutions, signing arrangements and intermediary confirmations "
                    "will be completed prior to filing, as applicable."
                )
            },
            source_ref_ids=refs[:1],
        ),
        _table_from_rows(
            headers=["Item", "Status"],
            rows=checklist_rows,
            caption="Declarations and pending finalisation items",
            source_ref_ids=refs,
            order=2,
        ),
    ]
    if constitutional:
        blocks.append(
            _block(
                kind="paragraph",
                content={"text": f"Articles of Association / constitutional matters: {humanize_enum(constitutional)}."},
                source_ref_ids=refs[:1],
                order=3,
            )
        )

    return DrhpChapterAST(
        chapter_key="declarations-aoa-miscellaneous",
        title=CHAPTER_TITLES["declarations-aoa-miscellaneous"],
        order=18,
        sections=[
            DrhpSectionAST(
                section_key="declarations",
                heading="Declarations, Articles of Association and Miscellaneous",
                order=1,
                blocks=blocks,
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
    from app.modules.drhp.generation.source_extractors import extract_rpt_transactions

    refs = [r.ref_id for r in bundle.source_refs]
    entities = extract_group_entities(snapshots)
    entity_registry = bundle.global_context.get("entityRegistry") or {}
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
    rpt_rows_data = extract_rpt_transactions(snapshots, entity_registry=entity_registry)
    if rpt_rows_data:
        rpt_rows = [[r["party"], r["nature"], r["amount"]] for r in rpt_rows_data]
        blocks.append(
            _table_from_rows(
                headers=["Related party", "Nature", "Amount"],
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
    from app.modules.drhp.generation.fact_locking import format_locked_display

    refs = [r.ref_id for r in bundle.source_refs]
    objects = extract_objects(snapshots)
    if not objects:
        return []

    def _cost(raw: str | None) -> str:
        return format_locked_display(raw, semantic_type="currency_inr") if raw else PLACEHOLDER_TOKEN

    rows = [[o["name"], o["category"], _cost(o["estimatedCost"]), _cost(o["fromProceeds"])] for o in objects]
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
