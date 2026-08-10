"""Chapter content density enrichment from existing workstream data (P2.3)."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.modules.drhp.ast.schemas import DrhpBlockAST, DrhpSectionAST
from app.modules.drhp.constants import PLACEHOLDER_TOKEN, BlockSupportState
from app.modules.drhp.generation.publication_format import (
    format_currency_inr,
    format_share_count,
    humanize_designation,
    humanize_enum,
    prose_join,
)
from app.modules.drhp.generation.source_extractors import (
    extract_approvals,
    extract_basis_metrics,
    extract_business_profile,
    extract_capital_structure,
    extract_corporate_events,
    extract_customers_section,
    extract_directors,
    extract_group_entities,
    extract_identity,
    extract_ipo_offer,
    extract_lead_manager,
    extract_litigation_matters,
    extract_market_series,
    extract_mda_facts,
    extract_objects,
    extract_promoters,
    extract_registrar,
    extract_shareholders,
    pivot_pl_table,
)
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _refs(bundle: ChapterSourceBundle, limit: int = 8) -> list[str]:
    return [r.ref_id for r in bundle.source_refs[:limit]]


def _block(kind: str, content: dict[str, Any], refs: list[str], order: int = 1) -> DrhpBlockAST:
    return DrhpBlockAST(
        block_id=f"blk-{uuid4()}",
        kind=kind,  # type: ignore[arg-type]
        order=order,
        content=content,
        source_ref_ids=refs,
        support_state=BlockSupportState.STRUCTURED_INPUT_BACKED,
    )


def _para(text: str, refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("paragraph", {"text": text}, refs, order)


def _table(headers: list[str], rows: list[list[str]], caption: str, refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("table", {"headers": headers, "rows": rows, "caption": caption}, refs, order)


def _bullets(items: list[str], refs: list[str], order: int = 1) -> DrhpBlockAST:
    return _block("bullet_list", {"items": items}, refs, order)


def _payload(slug: str, snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    ws = snapshots.get(slug)
    return ws.payload if ws else {}


def enrich_chapter_sections(
    chapter_key: str,
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    risk_candidates: list[dict[str, Any]] | None = None,
) -> list[DrhpSectionAST]:
    builders = {
        "objects-of-the-issue": _objects_sections,
        "basis-for-issue-price": _basis_sections,
        "industry-overview": _industry_sections,
        "company-history-promoters-structure": _history_sections,
        "management-governance": _management_sections,
        "summary-of-drhp": _summary_sections,
        "legal-regulatory-approvals": _legal_sections,
        "group-companies-rpt": _group_sections,
        "risk-factors": lambda b, s: _risk_sections(b, s, risk_candidates or []),
    }
    builder = builders.get(chapter_key)
    if builder is None:
        return []
    return builder(bundle, snapshots)


def _objects_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    objects = extract_objects(snapshots)
    oi = _payload("objects-of-issue", snapshots)
    proceeds = oi.get("proceedsAndFundingSummary") or {}
    capex = oi.get("capitalExpenditureFacilitiesAndExpansion") or {}
    wc = oi.get("workingCapitalAndBorrowingRepayment") or {}
    mof = oi.get("meansOfFinanceAndDeploymentSchedule") or {}
    sections: list[DrhpSectionAST] = []
    order = 1

    intro = ""
    if proceeds.get("freshIssueGrossProceeds"):
        intro = (
            f"The Fresh Issue is intended to raise gross proceeds of "
            f"{format_currency_inr(proceeds['freshIssueGrossProceeds'])} for deployment towards the Objects set out below."
        )
    sections.append(
        DrhpSectionAST(
            section_key="objects-overview",
            heading="Objects of the Issue",
            order=order,
            blocks=[
                _para(intro or "The net proceeds of the Fresh Issue are proposed to be utilised towards the following Objects.", refs),
            ],
        )
    )
    order += 1

    if objects:
        rows = [
            [
                o["name"],
                humanize_enum(o["category"]),
                format_currency_inr(o["estimatedCost"]) or PLACEHOLDER_TOKEN,
                format_currency_inr(o["fromProceeds"]) or PLACEHOLDER_TOKEN,
            ]
            for o in objects
        ]
        sections.append(
            DrhpSectionAST(
                section_key="objects-allocation",
                heading="Objects and Proposed Allocation",
                order=order,
                blocks=[_table(["Object", "Category", "Estimated cost (₹)", "From net proceeds (₹)"], rows, "Objects register", refs)],
            )
        )
        order += 1

        detail_blocks: list[DrhpBlockAST] = []
        for idx, obj in enumerate(objects, start=1):
            oi_obj = next((x for x in (oi.get("objectsRegisterAndAllocation") or {}).get("objects") or [] if isinstance(x, dict) and (x.get("objectName") == obj["name"] or x.get("id") == obj.get("id"))), {})
            period = oi_obj.get("expectedUtilisationPeriod") if isinstance(oi_obj, dict) else ""
            text = prose_join([
                f"{obj['name']}: {obj.get('description', '')}",
                f"Estimated cost: {format_currency_inr(obj.get('estimatedCost'))}." if obj.get("estimatedCost") else "",
                f"Expected deployment: {period}." if period else "",
            ])
            if text:
                detail_blocks.append(_para(text, refs, idx))
        if detail_blocks:
            sections.append(
                DrhpSectionAST(section_key="object-details", heading="Details of Objects", order=order, blocks=detail_blocks)
            )
            order += 1

    capex_items = capex.get("capexItems") or []
    if capex_items:
        capex_rows = []
        for item in capex_items[:6]:
            if isinstance(item, dict):
                capex_rows.append([
                    str(item.get("description") or item.get("itemType") or "—"),
                    str(item.get("location") or "—"),
                    format_currency_inr(item.get("estimatedCost")) or "—",
                    str(item.get("expectedCommissioningDate") or "—"),
                ])
        sections.append(
            DrhpSectionAST(
                section_key="capex-facilities",
                heading="Capital Expenditure and Facility Expansion",
                order=order,
                blocks=[
                    _para("Capital expenditure proposed from issue proceeds relates to the following facility expansion items.", refs),
                    _table(["Description", "Location", "Estimated cost (₹)", "Expected commissioning"], capex_rows, "Capex items", refs, 2),
                ],
            )
        )
        order += 1

    wc_amount = wc.get("workingCapitalRequirementAmount")
    repayments = wc.get("borrowingRepaymentItems") or []
    if wc_amount or repayments:
        blocks: list[DrhpBlockAST] = []
        if wc_amount:
            blocks.append(_para(f"Working capital requirement proposed from issue proceeds: {format_currency_inr(wc_amount)}.", refs))
        if repayments:
            rep_rows = []
            for r in repayments:
                if isinstance(r, dict):
                    rep_rows.append([
                        str(r.get("lenderName") or "—"),
                        humanize_enum(r.get("loanType")),
                        format_currency_inr(r.get("outstandingAmount")) or "—",
                        format_currency_inr(r.get("amountProposedForRepayment")) or "—",
                        str(r.get("repaymentRationale") or "")[:100],
                    ])
            blocks.append(_table(["Lender", "Facility", "Outstanding (₹)", "Repayment from proceeds (₹)", "Purpose"], rep_rows, "Borrowing repayment", refs, 2))
        sections.append(
            DrhpSectionAST(section_key="wc-borrowings", heading="Working Capital and Borrowing Repayment", order=order, blocks=blocks)
        )
        order += 1

    mof_rows = mof.get("meansOfFinanceRows") or []
    deploy_rows = mof.get("deploymentScheduleRows") or []
    if mof_rows or deploy_rows:
        blocks = []
        if mof_rows:
            blocks.append(_table(["Source", "Amount (₹)"], [[humanize_enum(r.get("source")), format_currency_inr(r.get("amount")) or "—"] for r in mof_rows if isinstance(r, dict)], "Means of finance", refs))
        if deploy_rows:
            blocks.append(_table(["Period", "Amount to be deployed (₹)", "Notes"], [[r.get("periodLabel"), format_currency_inr(r.get("amountToBeDeployed")) or "—", str(r.get("notes") or "")[:80]] for r in deploy_rows if isinstance(r, dict)], "Schedule of deployment", refs, 2))
        sections.append(
            DrhpSectionAST(section_key="means-deployment", heading="Means of Finance and Deployment Schedule", order=order, blocks=blocks)
        )

    return sections


def _basis_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    ipo = extract_ipo_offer(snapshots)
    fin = _payload("financials-kpis", snapshots)
    ratios = fin.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
    kpi_section = fin.get("kpiSelectionGovernanceAndPeerComparison") or {}
    kpis = kpi_section.get("kpiRegister") or kpi_section.get("selectedKpis") or kpi_section.get("kpis") or []
    sections: list[DrhpSectionAST] = []
    order = 1

    metric_rows = extract_basis_metrics(snapshots)
    if metric_rows:
        sections.append(
            DrhpSectionAST(
                section_key="key-metrics",
                heading="Key Quantitative Metrics",
                order=order,
                blocks=[
                    _para("The following metrics are derived from the restated financial information and offer particulars disclosed in this document.", refs),
                    _table(["Metric", "Value"], metric_rows, "Basis for Issue Price — key metrics", refs, 2),
                ],
            )
        )
        order += 1

    _, pl_rows = pivot_pl_table(snapshots)
    if pl_rows:
        trend_rows = [[r[0], r[-2] if len(r) > 2 else "", r[-1] if len(r) > 1 else ""] for r in pl_rows[:8]]
        sections.append(
            DrhpSectionAST(
                section_key="financial-trend",
                heading="Financial Performance Trend",
                order=order,
                blocks=[_table(["Particulars", "Prior period (₹ lakh)", "Current period (₹ lakh)"], trend_rows, "Restated P&L trend (₹ lakh)", refs)],
            )
        )
        order += 1

    if kpis:
        kpi_rows = []
        for k in kpis[:10]:
            if isinstance(k, dict):
                kpi_rows.append([
                    str(k.get("name") or k.get("kpiName") or "—"),
                    str(k.get("plainEnglishDefinition") or k.get("value") or k.get("latestValue") or "—")[:100],
                    str(k.get("unit") or ""),
                ])
        if kpi_rows:
            sections.append(
                DrhpSectionAST(
                    section_key="kpis",
                    heading="Key Performance Indicators",
                    order=order,
                    blocks=[_table(["KPI", "Definition / value", "Unit"], kpi_rows, "Selected KPIs", refs)],
                )
            )
            order += 1

    rationale_bits = []
    if ipo.get("faceValue"):
        rationale_bits.append(f"Face value of ₹ {ipo['faceValue']} per Equity Share.")
    if ipo.get("proposedIssuePrice"):
        rationale_bits.append(f"Proposed issue price of ₹ {ipo['proposedIssuePrice']} per Equity Share.")
    pe = ratios.get("priceEarningsRatio") or ratios.get("peRatio")
    if pe:
        rationale_bits.append(f"Price to earnings ratio based on disclosed restated EPS: {pe}.")
    sections.append(
        DrhpSectionAST(
            section_key="pricing-rationale",
            heading="Factors Considered in Relation to Issue Price",
            order=order,
            blocks=[
                _para(
                    prose_join(rationale_bits)
                    or "The Issue Price will be determined by our Company in consultation with the Book Running Lead Manager, having regard to qualitative and quantitative factors disclosed in this document.",
                    refs,
                ),
                _para(
                    "This section sets out issuer-provided metrics and factors; it does not constitute a valuation conclusion or regulatory eligibility determination.",
                    refs,
                    2,
                ),
            ],
        )
    )
    return sections


def _industry_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    im = _payload("industry-market", snapshots)
    scope = im.get("industryScopeAndCompanyMarketMapping") or {}
    macro = im.get("macroeconomicAndIndustryContext") or {}
    demand = im.get("demandDriversEndMarketsTrendsAndPolicy") or {}
    value_chain = im.get("valueChainSupplyStructureAndEntryBarriers") or {}
    competition = im.get("competitionMarketShareAndIssuerPositioning") or {}
    outlook = im.get("outlookIndustryRisksAndConfirmations") or {}
    sections: list[DrhpSectionAST] = []
    order = 1

    classification = scope.get("industryClassification") if isinstance(scope.get("industryClassification"), dict) else {}
    market_def = scope.get("marketDefinition") if isinstance(scope.get("marketDefinition"), dict) else {}
    if classification or market_def:
        intro = prose_join([
            classification.get("industryDescription"),
            market_def.get("marketDescription"),
            market_def.get("relevanceToIssuerExplanation"),
        ])
        sections.append(
            DrhpSectionAST(section_key="industry-scope", heading="Industry Definition and Scope", order=order, blocks=[_para(intro, refs)])
        )
        order += 1

    evolution = macro.get("industryEvolution") if isinstance(macro.get("industryEvolution"), dict) else {}
    macro_rows = []
    for ind in macro.get("macroeconomicIndicators") or []:
        if isinstance(ind, dict):
            macro_rows.append([ind.get("indicatorName"), ind.get("period"), f"{ind.get('value')} {ind.get('unit', '')}".strip()])
    blocks: list[DrhpBlockAST] = []
    if evolution:
        blocks.append(_para(prose_join([evolution.get("industryOriginDevelopment"), evolution.get("structuralEvolution"), evolution.get("digitalisation")]), refs))
    if macro_rows:
        blocks.append(_table(["Indicator", "Period", "Value"], macro_rows, "Macroeconomic / sector indicators", refs, 2))
    if blocks:
        sections.append(DrhpSectionAST(section_key="macro-context", heading="Macroeconomic and Industry Context", order=order, blocks=blocks))
        order += 1

    for series in extract_market_series(snapshots)[:2]:
        if not isinstance(series, dict):
            continue
        name = series.get("marketName") or "Market size"
        period_rows = [[pv.get("period"), pv.get("value"), pv.get("actualEstimateForecast")] for pv in (series.get("periodValues") or []) if isinstance(pv, dict)]
        forecast = series.get("forecastMetadata") or {}
        s_blocks = [_para(str(series.get("marketDefinition") or ""), refs)] if series.get("marketDefinition") else []
        if period_rows:
            s_blocks.append(_table(["Period", f"Market size ({series.get('unit', '')})", "Basis"], period_rows, str(name)[:80], refs, len(s_blocks) + 1))
        if isinstance(forecast, dict) and forecast.get("reportedCagr"):
            s_blocks.append(_para(f"Reported CAGR: {forecast['reportedCagr']}% ({forecast.get('keyAssumptions') or ''})", refs, len(s_blocks) + 1))
        if s_blocks:
            sections.append(DrhpSectionAST(section_key=f"market-{order}", heading=str(name)[:80], order=order, blocks=s_blocks))
            order += 1

    drivers = demand.get("demandDrivers") or demand.get("keyDemandDrivers") or []
    if drivers:
        driver_items = []
        for d in drivers[:8]:
            if isinstance(d, dict):
                title = d.get("title") or d.get("driver") or ""
                desc = d.get("description") or ""
                driver_items.append(f"{title}: {desc}" if title and desc else str(title or desc))
            else:
                driver_items.append(str(d))
        sections.append(DrhpSectionAST(section_key="demand-drivers", heading="Demand Drivers and End-Market Trends", order=order, blocks=[_bullets(driver_items, refs)]))
        order += 1

    stages = value_chain.get("valueChainStages") or []
    barriers = value_chain.get("entryBarriers") or []
    if stages or barriers:
        blocks: list[DrhpBlockAST] = []
        if stages:
            stage_rows = [[s.get("name"), s.get("description", "")[:100]] for s in stages[:6] if isinstance(s, dict)]
            if stage_rows:
                blocks.append(_table(["Stage", "Description"], stage_rows, "Industry value chain", refs))
        if barriers:
            b_items = [f"{b.get('barrierType', b.get('title', ''))}: {b.get('description', '')}"[:120] for b in barriers[:6] if isinstance(b, dict)]
            if b_items:
                blocks.append(_bullets(b_items, refs, len(blocks) + 1))
        if blocks:
            sections.append(DrhpSectionAST(section_key="value-chain", heading="Value Chain and Entry Barriers", order=order, blocks=blocks))
            order += 1

    competitors = competition.get("competitors") or []
    claims = competition.get("claims") or []
    share_rows = competition.get("marketShareRecords") or []
    comp_blocks: list[DrhpBlockAST] = []
    if competitors:
        comp_blocks.append(_table(["Competitor", "Segment", "Geography"], [[c.get("companyName"), c.get("industrySubIndustry"), c.get("relevantGeography")] for c in competitors[:6] if isinstance(c, dict)], "Competitive landscape", refs))
    if share_rows and isinstance(share_rows[0], dict):
        s0 = share_rows[0]
        comp_blocks.append(_para(f"Issuer market share (disclosed basis): {s0.get('reportedMarketShare', '—')}% of {s0.get('marketDefinition', 'defined market')} in {s0.get('period', 'disclosed period')}.", refs, 2))
    if claims and isinstance(claims[0], dict):
        comp_blocks.append(_para(f"Issuer positioning: {claims[0].get('exactProposedWording', '')}.", refs, 3))
    if comp_blocks:
        sections.append(DrhpSectionAST(section_key="competition", heading="Competitive Landscape and Issuer Positioning", order=order, blocks=comp_blocks))
        order += 1

    outlook_records = outlook.get("outlookRecords") or []
    risks = outlook.get("industrySpecificRisks") or outlook.get("industryRisks") or []
    if outlook_records or risks:
        blocks = []
        for rec in outlook_records[:2]:
            if isinstance(rec, dict):
                blocks.append(_para(
                    f"{rec.get('market', 'Market')} outlook ({rec.get('outlookPeriod', '')}): "
                    f"expected CAGR {rec.get('expectedCagr', '—')}% with structural changes including {rec.get('structuralChanges', 'disclosed trends')}.",
                    refs,
                    len(blocks) + 1,
                ))
        if risks:
            blocks.append(_bullets([str(r.get("title") or r.get("riskTitle") or r) if isinstance(r, dict) else str(r) for r in risks[:6]], refs, len(blocks) + 1))
        sections.append(DrhpSectionAST(section_key="outlook", heading="Industry Outlook and Risks", order=order, blocks=blocks))

    return sections


def _history_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    identity = extract_identity(snapshots)
    events = extract_corporate_events(snapshots)
    promoters = extract_promoters(snapshots)
    shareholders = extract_shareholders(snapshots)
    entities = extract_group_entities(snapshots)
    sections: list[DrhpSectionAST] = []
    order = 1

    hist = prose_join([
        f"{identity.get('legalName')} was incorporated on {identity.get('incorporationDate')} under the Companies Act, 2013 with CIN {identity.get('cin')}."
        if identity.get("legalName") and identity.get("incorporationDate") else "",
        f"The registered office is situated at {identity.get('registeredOffice')}." if identity.get("registeredOffice") else "",
    ])
    if hist:
        sections.append(DrhpSectionAST(section_key="incorporation", heading="Incorporation and Corporate Identity", order=order, blocks=[_para(hist, refs)]))
        order += 1

    if events:
        sections.append(
            DrhpSectionAST(
                section_key="milestones",
                heading="Corporate History and Milestones",
                order=order,
                blocks=[_table(["Date", "Event", "Description"], [[e["date"], e["type"], e["description"]] for e in events], "Corporate events", refs)],
            )
        )
        order += 1

    promo_rows = [[p["name"], p["category"], format_share_count(p["shares"]) or p["shares"]] for p in promoters if p.get("name")]
    if promo_rows:
        sections.append(
            DrhpSectionAST(
                section_key="promoters",
                heading="Promoters",
                order=order,
                blocks=[
                    _para("Set out below are details of our Promoters as on the date of this Draft Red Herring Prospectus.", refs),
                    _table(["Name", "Category", "Equity shares held"], promo_rows, "Promoter details", refs, 2),
                ],
            )
        )
        order += 1

    sh_rows = [[s["name"], s["category"], format_share_count(s["shares"]) or s["shares"], s.get("pct", "")] for s in shareholders[:12]]
    if sh_rows:
        sections.append(
            DrhpSectionAST(
                section_key="promoter-shareholding",
                heading="Promoter and Pre-Issue Shareholding",
                order=order,
                blocks=[_table(["Shareholder", "Category", "Shares", "% pre-issue"], sh_rows, "Shareholding pattern", refs)],
            )
        )
        order += 1

    if entities:
        sections.append(
            DrhpSectionAST(
                section_key="group-structure",
                heading="Group and Subsidiary Structure",
                order=order,
                blocks=[_table(["Entity", "Relationship", "CIN", "Registered office"], [[e["name"], e["relationship"], e["cin"], e["office"]] for e in entities], "Group entities", refs)],
            )
        )
    return sections


def _management_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    mg = _payload("management-governance", snapshots)
    directors = extract_directors(snapshots)
    kmp_section = mg.get("kmpSeniorManagementAndOrganisationStructure") or {}
    committees = mg.get("boardCommitteesAndGovernanceBodies") or {}
    readiness = mg.get("boardStructureAndIpoGovernanceReadiness") or {}
    sections: list[DrhpSectionAST] = []
    order = 1

    if directors:
        sections.append(
            DrhpSectionAST(
                section_key="board",
                heading="Board of Directors",
                order=order,
                blocks=[_table(["Name", "Designation", "DIN"], [[d["name"], humanize_designation(d["designation"]), d["din"]] for d in directors], "Board composition", refs)],
            )
        )
        order += 1

    profiles = [d for d in directors if d.get("bio")]
    if profiles:
        sections.append(
            DrhpSectionAST(
                section_key="director-profiles",
                heading="Director Profiles",
                order=order,
                blocks=[_para(f"{d['name']} ({humanize_designation(d['designation'])}, DIN {d['din']}): {d['bio']}", refs, i) for i, d in enumerate(profiles[:6], start=1)],
            )
        )
        order += 1

    kmp_list = kmp_section.get("kmpSmpRecords") or kmp_section.get("kmpAndSeniorManagement") or kmp_section.get("kmp") or []
    if kmp_list:
        kmp_rows = []
        for k in kmp_list[:8]:
            if isinstance(k, dict):
                kmp_rows.append([str(k.get("fullName") or k.get("fullLegalName") or k.get("name") or "—"), humanize_designation(k.get("designation")), str(k.get("keyResponsibilities") or k.get("functionalRole") or "")[:80]])
        if kmp_rows:
            sections.append(
                DrhpSectionAST(section_key="kmp", heading="Key Managerial Personnel and Senior Management", order=order, blocks=[_table(["Name", "Designation", "Responsibility"], kmp_rows, "KMP / senior management", refs)])
            )
            order += 1

    committee_list = committees.get("committees") or []
    if committee_list:
        com_rows = []
        for c in committee_list[:8]:
            if isinstance(c, dict):
                com_rows.append([str(c.get("committeeName") or c.get("name") or "—"), str(c.get("compositionSummary") or c.get("chairpersonName") or "—"), humanize_enum(c.get("status"))])
        if com_rows:
            sections.append(
                DrhpSectionAST(section_key="committees", heading="Board Committees", order=order, blocks=[_table(["Committee", "Composition / Chair", "Status"], com_rows, "Board committees", refs)])
            )
            order += 1

    gov = readiness.get("governanceReadiness") if isinstance(readiness.get("governanceReadiness"), dict) else {}
    if gov:
        items = [f"{humanize_enum(k)}: {humanize_enum(v)}" for k, v in gov.items() if v and k != "notes"][:8]
        if items:
            sections.append(
                DrhpSectionAST(section_key="governance-readiness", heading="Governance and IPO Readiness", order=order, blocks=[_bullets(items, refs)])
            )
    return sections


def _summary_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    identity = extract_identity(snapshots)
    ipo = extract_ipo_offer(snapshots)
    profile = extract_business_profile(snapshots)
    objects = extract_objects(snapshots)
    directors = extract_directors(snapshots)
    promoters = extract_promoters(snapshots)
    from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry

    risks, _ = build_risk_candidate_registry(snapshots)
    entities = extract_group_entities(snapshots)
    matters = extract_litigation_matters(snapshots)
    approvals = extract_approvals(snapshots)

    bullets: list[str] = []
    if identity.get("legalName"):
        bullets.append(f"Issuer: {identity['legalName']} — {profile.get('briefBusinessOverview', profile.get('primaryBusinessActivity', ''))[:200]}")
    if ipo.get("freshIssueShares"):
        bullets.append(
            f"Offer: Fresh Issue of {format_share_count(ipo['freshIssueShares'])} Equity Shares of face value ₹ {ipo.get('faceValue', '10')} each "
            f"via {humanize_enum(ipo.get('issueMethod'))} on {humanize_enum(ipo.get('targetExchange') or ipo.get('targetPlatform'))}."
        )
    if promoters:
        bullets.append(f"Promoters: {', '.join(p['name'] for p in promoters[:4])}.")
    if directors:
        dir_bits = ", ".join(f"{d['name']} ({humanize_designation(d['designation'])})" for d in directors[:4])
        bullets.append(f"Board: {dir_bits}.")
    if objects:
        bullets.append(f"Objects: {', '.join(o['name'] for o in objects[:3])}.")
    mda = extract_mda_facts(snapshots)
    if mda.get("narrative"):
        bullets.append(f"Financial trends: {mda['narrative'][:220]}.")
    if risks:
        bullets.append(f"Key risks include: {', '.join(str(r.get('headingSeed', '')) for r in risks[:4])}.")
    if entities:
        bullets.append(f"Group: {len(entities)} related entity/entities disclosed.")
    if matters:
        bullets.append(f"Litigation: {matters[0]['title'][:100]} (and other matters as disclosed).")
    if approvals:
        bullets.append(f"Material approvals include: {approvals[0]['name'][:80]}.")

    kv_rows = [
        ["Issuer", identity.get("legalName") or PLACEHOLDER_TOKEN],
        ["CIN", identity.get("cin") or PLACEHOLDER_TOKEN],
        ["Fresh Issue (shares)", format_share_count(ipo.get("freshIssueShares")) or PLACEHOLDER_TOKEN],
        ["Face value (₹)", ipo.get("faceValue") or PLACEHOLDER_TOKEN],
        ["Issue method", humanize_enum(ipo.get("issueMethod")) or PLACEHOLDER_TOKEN],
        ["Designated exchange", humanize_enum(ipo.get("targetExchange") or ipo.get("targetPlatform")) or PLACEHOLDER_TOKEN],
    ]

    return [
        DrhpSectionAST(
            section_key="executive-summary",
            heading="Summary of the Draft Red Herring Prospectus",
            order=1,
            blocks=[
                _para(
                    f"This summary highlights key disclosures relating to {identity.get('legalName') or 'our Company'} "
                    f"and the proposed public issue. Investors should read the full Draft Red Herring Prospectus before making any investment decision.",
                    refs,
                ),
                _table(["Particular", "Details"], kv_rows, "Offer particulars — summary", refs, 2),
                _bullets(bullets[:10], refs, 3),
            ],
        )
    ]


def _legal_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    refs = _refs(bundle)
    matters = extract_litigation_matters(snapshots)
    approvals = extract_approvals(snapshots)
    sections: list[DrhpSectionAST] = []
    order = 1

    if matters:
        sections.append(
            DrhpSectionAST(
                section_key="litigation",
                heading="Outstanding Litigation and Proceedings",
                order=order,
                blocks=[
                    _para("The following litigation and regulatory proceedings have been disclosed by the issuer based on information currently available.", refs),
                    _table(["Matter", "Forum", "Stage", "Amount / relief"], [[m["title"], m["forum"], m["status"], m["amount"]] for m in matters], "Litigation register", refs, 2),
                ],
            )
        )
        order += 1

    if approvals:
        sections.append(
            DrhpSectionAST(
                section_key="approvals",
                heading="Government and Regulatory Approvals",
                order=order,
                blocks=[
                    _para("Material operating approvals and licences disclosed by the issuer are summarised below.", refs),
                    _table(["Approval / Licence", "Authority", "Status", "Expiry / renewal"], [[a["name"], a["authority"], a["status"], a.get("expiry") or "—"] for a in approvals], "Material approvals", refs, 2),
                ],
            )
        )
    return sections


def _group_sections(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[DrhpSectionAST]:
    from app.modules.drhp.generation.source_extractors import extract_rpt_transactions

    refs = _refs(bundle)
    entities = extract_group_entities(snapshots)
    entity_registry = bundle.global_context.get("entityRegistry") or {}
    rpts = extract_rpt_transactions(snapshots, entity_registry=entity_registry)
    ge = _payload("group-entities-related-parties", snapshots)
    rpt_reg = ge.get("relatedPartyTransactionsRegister") or {}
    sections: list[DrhpSectionAST] = []
    order = 1

    if entities:
        sections.append(
            DrhpSectionAST(
                section_key="group-structure",
                heading="Group Structure",
                order=order,
                blocks=[
                    _para("Our Company’s relationship with group entities is summarised below.", refs),
                    _table(["Entity", "Relationship", "CIN", "Registered office"], [[e["name"], e["relationship"], e["cin"], e["office"]] for e in entities], "Group entities", refs, 2),
                ],
            )
        )
        order += 1

    if rpts:
        sections.append(
            DrhpSectionAST(
                section_key="rpt",
                heading="Related Party Transactions",
                order=order,
                blocks=[
                    _para("Related party transactions during the disclosed periods are set out below.", refs),
                    _table(["Related party", "Nature", "Amount"], [[r["party"], r["nature"], r["amount"]] for r in rpts], "RPT register", refs, 2),
                ],
            )
        )
        order += 1

    policies = rpt_reg.get("policies") or rpt_reg.get("rptPolicySummary") or ""
    if policies:
        sections.append(
            DrhpSectionAST(section_key="rpt-policy", heading="Related Party Framework", order=order, blocks=[_para(str(policies)[:500], refs)])
        )
    return sections


def _risk_sections(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
    candidates: list[dict[str, Any]],
) -> list[DrhpSectionAST]:
    from app.modules.drhp.generation.structured_narrative import _risk_body_for_candidate

    refs = _refs(bundle)
    sections: list[DrhpSectionAST] = []
    for idx, candidate in enumerate(candidates[:10], start=1):
        heading = candidate.get("headingSeed") or "Risk factor"
        body = _risk_body_for_candidate(candidate, snapshots)
        facts = candidate.get("supportingFacts") or []
        if facts and body:
            body = f"{body} {facts[0]}"
        elif facts:
            body = facts[0]
        if not body:
            body = f"Developments relating to {heading.lower()} may adversely affect our business, results of operations and cash flows."
        sections.append(
            DrhpSectionAST(
                section_key=f"risk-{candidate.get('riskCandidateId', idx)}",
                heading=heading[:120],
                order=idx,
                blocks=[_para(body, candidate.get("sourceRefIds") or refs[:1])],
            )
        )
    return sections
