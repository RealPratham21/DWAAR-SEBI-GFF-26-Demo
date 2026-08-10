"""Canonical field extraction from persisted workstream payloads (G2R).

All DRHP builders must use these helpers — do not hard-code stale field names.
"""

from __future__ import annotations

from typing import Any

from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.workstreams import WorkstreamSnapshot

PL_LINE_LABELS: dict[str, str] = {
    "revenueFromOperations": "Revenue from operations",
    "costOfMaterialsConsumed": "Cost of materials consumed",
    "employeeBenefitExpenses": "Employee benefit expenses",
    "otherOperatingExpenses": "Other operating expenses",
    "financeCosts": "Finance costs",
    "depreciation": "Depreciation and amortisation expense",
    "currentTax": "Tax expense",
    "profitBeforeTax": "Profit before tax",
    "profitAfterTax": "Profit after tax",
    "ebitda": "EBITDA",
    "otherIncome": "Other income",
}

WORKSTREAM_TITLES: dict[str, str] = {
    "company-incorporation": "Company Incorporation",
    "ipo-setup-eligibility": "IPO Setup & Eligibility",
    "capital-ownership": "Capital & Ownership",
    "business-operations": "Business & Operations",
    "objects-of-issue": "Objects of the Issue",
    "financials-kpis": "Financials & KPIs",
    "management-governance": "Management & Governance",
    "industry-market": "Industry & Market",
    "group-entities-related-parties": "Group Entities & Related Parties",
    "borrowings-assets-contracts": "Borrowings, Assets & Contracts",
    "litigation-approvals-compliance": "Litigation, Approvals & Compliance",
    "intermediaries-filing": "Intermediaries & Filing",
}

SECTION_TITLES: dict[str, str] = {
    "legal-identity": "Legal Identity",
    "offices-contact": "Offices & Contact",
    "current-capital-structure": "Current Capital Structure",
    "shareholders-beneficial-ownership": "Shareholders & Beneficial Ownership",
    "business-profile-operating-model": "Business Profile & Operating Model",
    "products-services-revenue-mix": "Products, Services & Revenue Mix",
    "customers-sales-distribution-geography": "Customers, Sales & Distribution",
    "directors-profiles-appointments-and-eligibility": "Directors — Profiles & Appointments",
    "restated-statement-of-profit-and-loss": "Restated Statement of Profit and Loss",
    "ratios-capitalisation-and-issue-price-metrics": "Ratios & Issue Price Metrics",
    "litigation-and-proceedings-master": "Litigation & Proceedings",
    "group-structure-and-entity-master": "Group Structure & Entity Master",
    "objects-register-and-allocation": "Objects Register & Allocation",
    "market-size-segmentation-and-growth": "Market Size, Segmentation & Growth",
    "issue-team-and-intermediary-master": "Issue Team & Intermediaries",
}


def _payload(slug: str, snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    row = snapshots.get(slug)
    return row.payload if row else {}


def _clean(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Yes" if value else "No"
    return str(value).strip()


def _first(*values: Any) -> str:
    for value in values:
        text = _clean(value)
        if text:
            return text
    return ""


def _section(payload: dict[str, Any], *keys: str) -> dict[str, Any]:
    for key in keys:
        section = payload.get(key)
        if isinstance(section, dict):
            return section
    return {}


def format_office_address(office: dict[str, Any]) -> str:
    parts = [
        office.get("addressLine1"),
        office.get("addressLine2"),
        office.get("locality"),
        office.get("city"),
        office.get("district"),
        office.get("state"),
        office.get("pinCode"),
        office.get("country"),
    ]
    return ", ".join(_clean(p) for p in parts if _clean(p))


def is_registered_office(office: dict[str, Any]) -> bool:
    office_type = _clean(office.get("officeType")).lower()
    return office_type in {"registered", "registered-office"} or "registered" in office_type


def extract_registered_office(snapshots: dict[str, WorkstreamSnapshot]) -> str:
    ci = _payload("company-incorporation", snapshots)
    offices = ci.get("offices")
    if isinstance(offices, dict):
        for key in ("registeredOfficeAddress", "registeredOffice", "fullAddress"):
            if _clean(offices.get(key)):
                return _clean(offices.get(key))
    if isinstance(offices, list):
        for office in offices:
            if isinstance(office, dict) and is_registered_office(office):
                formatted = format_office_address(office)
                if formatted:
                    return formatted
    ge = _payload("group-entities-related-parties", snapshots)
    entities = (_section(ge, "groupStructureAndEntityMaster").get("entities") or [])
    for entity in entities:
        if not isinstance(entity, dict):
            continue
        badges = entity.get("classificationBadges") or []
        if "parent" in badges or "issuer" in badges:
            reg = entity.get("registration") or {}
            if _clean(reg.get("registeredOffice")):
                return _clean(reg.get("registeredOffice"))
    return ""


def extract_identity(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, str]:
    ci = _payload("company-incorporation", snapshots)
    identity = _section(ci, "identity")
    return {
        "legalName": _first(identity.get("legalName")),
        "shortName": _first(identity.get("shortName"), identity.get("displayName")),
        "cin": _first(identity.get("cin")),
        "incorporationDate": _first(identity.get("incorporationDate")),
        "website": _first(identity.get("website")),
        "email": _first(identity.get("email")),
        "telephone": _first(identity.get("telephone")),
        "registeredOffice": extract_registered_office(snapshots),
    }


def extract_ipo_offer(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, str]:
    ipo = _payload("ipo-setup-eligibility", snapshots)
    if_ws = _payload("intermediaries-filing", snapshots)
    direction = _section(ipo, "ipoDirection")
    offer = _section(ipo, "offerStructure")
    filing = _section(if_ws, "issueConfigurationAndFilingSnapshot")
    linked = filing.get("ipoSetupLinkedSnapshot") if isinstance(filing.get("ipoSetupLinkedSnapshot"), dict) else {}
    capital_linked = filing.get("capitalLinkedSnapshot") if isinstance(filing.get("capitalLinkedSnapshot"), dict) else {}
    filing_snap = filing.get("filingSnapshot") if isinstance(filing.get("filingSnapshot"), dict) else {}

    fresh = _first(
        offer.get("proposedFreshIssueShares"),
        offer.get("freshIssueShares"),
        linked.get("freshIssueShares"),
        capital_linked.get("freshIssueShares"),
    )
    ofs = _first(offer.get("proposedOfsShares"), offer.get("offerForSaleShares"), linked.get("ofsShares"))
    face = _first(
        offer.get("faceValuePerEquityShare"),
        offer.get("faceValuePerShare"),
        linked.get("faceValue"),
    )
    issue_price = _first(
        offer.get("proposedIssuePrice"),
        linked.get("proposedFinalIssuePrice"),
        (filing.get("pricing") or {}).get("fixedIssuePrice") if isinstance(filing.get("pricing"), dict) else "",
    )
    return {
        "targetPlatform": _first(direction.get("targetSmePlatform"), linked.get("targetSmePlatform")),
        "targetExchange": _first(filing_snap.get("selectedDesignatedStockExchange")),
        "issueMethod": _first(
            direction.get("proposedPricingMethod"),
            direction.get("issueMethod"),
            linked.get("issueMethod"),
        ),
        "faceValue": face,
        "freshIssueShares": fresh,
        "ofsShares": ofs or "Nil",
        "proposedIssuePrice": issue_price,
        "lotSize": _first(offer.get("minimumApplicationLotSize")),
        "offerType": _first(direction.get("proposedOfferType"), linked.get("totalOffer")),
    }


def extract_lead_manager(snapshots: dict[str, WorkstreamSnapshot]) -> str:
    return extract_intermediary_by_role(
        snapshots,
        "lead_manager",
        "book_running_lead_manager",
        "book-running-lead-manager",
    ) or _legacy_lead_manager(snapshots)


def _legacy_lead_manager(snapshots: dict[str, WorkstreamSnapshot]) -> str:
    if_ws = _payload("intermediaries-filing", snapshots)
    legacy = _section(if_ws, "intermediaryAppointmentsAndRoles")
    lead_managers = legacy.get("leadManagers") or []
    if lead_managers and isinstance(lead_managers[0], dict):
        return _first(lead_managers[0].get("name"), lead_managers[0].get("legalName"))
    return ""


def extract_registrar(snapshots: dict[str, WorkstreamSnapshot]) -> str:
    return extract_intermediary_by_role(snapshots, "registrar", "registrar_to_issue")


def extract_intermediary_by_role(snapshots: dict[str, WorkstreamSnapshot], *roles: str) -> str:
    if_ws = _payload("intermediaries-filing", snapshots)
    team = _section(if_ws, "issueTeamAndIntermediaryMaster")
    role_set = {r.lower().replace("-", "_") for r in roles}
    for item in team.get("intermediaries") or []:
        if not isinstance(item, dict):
            continue
        item_roles = [str(r).lower().replace("-", "_") for r in (item.get("roles") or [])]
        if any(r in role_set for r in item_roles):
            return _first(item.get("legalName"), item.get("displayName"))
    return ""


def extract_legal_counsel(snapshots: dict[str, WorkstreamSnapshot]) -> str:
    return extract_intermediary_by_role(
        snapshots,
        "legal_counsel",
        "issuer_legal_counsel",
        "legal_counsel_to_the_issue",
        "legal_adviser",
        "domestic_legal_counsel",
    )


def extract_capital_structure(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    capital = _payload("capital-ownership", snapshots)
    structure = _section(capital, "currentCapitalStructure")
    equity_classes = structure.get("equityClasses") or []
    primary_class = equity_classes[0] if equity_classes and isinstance(equity_classes[0], dict) else {}
    return {
        "asOnDate": _clean(structure.get("asOnDate")),
        "authorisedEquityShareCapital": _first(
            structure.get("authorisedEquityShareCapital"),
            structure.get("authorisedShareCapital"),
        ),
        "issuedEquityShareCapital": _first(
            structure.get("issuedEquityShareCapital"),
            structure.get("issuedShareCapital"),
        ),
        "paidUpEquityShareCapital": _first(
            structure.get("paidUpEquityShareCapital"),
            structure.get("paidUpShareCapital"),
        ),
        "faceValuePerShare": _first(
            primary_class.get("faceValuePerShare"),
            structure.get("faceValuePerShare"),
        ),
        "authorisedShares": _first(primary_class.get("authorisedShares")),
        "issuedShares": _first(primary_class.get("issuedShares")),
        "paidUpShares": _first(primary_class.get("paidUpShares")),
    }


def extract_shareholders(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    capital = _payload("capital-ownership", snapshots)
    section = _section(
        capital,
        "shareholdersAndBeneficialOwnership",
        "shareholdersBeneficialOwnership",
    )
    shareholders = section.get("shareholders") or []
    cap = extract_capital_structure(snapshots)
    total_shares = _clean(cap.get("issuedShares") or cap.get("paidUpShares"))
    try:
        total = float(total_shares.replace(",", "")) if total_shares else 0.0
    except ValueError:
        total = 0.0

    rows: list[dict[str, str]] = []
    for sh in shareholders:
        if not isinstance(sh, dict):
            continue
        name = _first(sh.get("name"), sh.get("shareholderName"))
        shares = _first(sh.get("equitySharesHeld"), sh.get("sharesHeld"))
        pct = _clean(sh.get("shareholdingPct"))
        if not pct and shares and total:
            try:
                pct = f"{(float(str(shares).replace(',', '')) / total) * 100:.2f}"
            except ValueError:
                pct = ""
        rows.append(
            {
                "name": name,
                "category": _clean(sh.get("category")),
                "shares": shares,
                "pct": pct,
            }
        )
    return rows


def extract_promoters(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    capital = _payload("capital-ownership", snapshots)
    section = _section(capital, "promotersAndControl")
    promoters = section.get("promoters") or []
    rows: list[dict[str, str]] = []
    for p in promoters:
        if not isinstance(p, dict):
            continue
        rows.append(
            {
                "name": _first(p.get("promoterName"), p.get("name"), p.get("fullLegalName")),
                "category": _clean(p.get("promoterCategory")),
                "shares": _first(p.get("equitySharesHeld"), p.get("sharesHeld")),
            }
        )
    return rows


def extract_reporting_periods(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    fin = _payload("financials-kpis", snapshots)
    scope = _section(fin, "reportingScopePeriodsAndAuditorReadiness")
    periods = scope.get("reportingPeriods") or scope.get("financialPeriods") or []
    result: list[dict[str, str]] = []
    for period in periods:
        if not isinstance(period, dict):
            continue
        result.append(
            {
                "id": _clean(period.get("id")),
                "label": _first(period.get("label"), period.get("financialYearEnding")),
            }
        )
    return result


def pivot_pl_table(snapshots: dict[str, WorkstreamSnapshot]) -> tuple[list[str], list[list[str]]]:
    fin = _payload("financials-kpis", snapshots)
    pl = _section(fin, "restatedStatementOfProfitAndLoss")
    line_values = pl.get("plLineValues") or pl.get("lines") or []
    periods = extract_reporting_periods(snapshots)
    period_ids = [p["id"] for p in periods if p["id"]]
    period_labels = [p["label"] for p in periods if p["id"]]
    if not period_ids and line_values:
        period_ids = sorted({str(lv.get("periodId")) for lv in line_values if lv.get("periodId")})
        period_labels = period_ids

    by_line: dict[str, dict[str, str]] = {}
    line_order: list[str] = []
    for lv in line_values:
        if not isinstance(lv, dict):
            continue
        line_key = _clean(lv.get("lineKey") or lv.get("label"))
        if not line_key:
            continue
        if line_key not in by_line:
            by_line[line_key] = {}
            line_order.append(line_key)
        period_id = _clean(lv.get("periodId"))
        amount = _clean(lv.get("amount"))
        if period_id:
            by_line[line_key][period_id] = amount
        elif isinstance(lv.get("values"), list):
            for idx, val in enumerate(lv["values"]):
                if idx < len(period_ids):
                    by_line[line_key][period_ids[idx]] = _clean(
                        val.get("amount") if isinstance(val, dict) else val
                    )

    headers = ["Particulars", *period_labels]
    rows: list[list[str]] = []
    for line_key in line_order:
        human = PL_LINE_LABELS.get(line_key)
        if not human:
            human = "".join((" " + c if c.isupper() else c) for c in line_key).strip().title()
        row = [human]
        for pid in period_ids:
            row.append(by_line[line_key].get(pid) or PLACEHOLDER_TOKEN)
        rows.append(row)
    return headers, rows


def extract_balance_sheet_summary(snapshots: dict[str, WorkstreamSnapshot]) -> tuple[list[str], list[list[str]]]:
    fin = _payload("financials-kpis", snapshots)
    bs = _section(fin, "assetsLiabilitiesEquityAndCashFlows")
    values = bs.get("balanceSheetLineValues") or []
    periods = extract_reporting_periods(snapshots)
    period_ids = [p["id"] for p in periods if p["id"]]
    period_labels = [p["label"] for p in periods if p["id"]]
    scope = _section(fin, "reportingScopePeriodsAndAuditorReadiness")
    amount_unit = _clean(scope.get("amountUnit") or "lakh")
    line_keys = ["totalAssets", "totalEquity", "totalLiabilities", "totalEquityAndLiabilities"]
    labels = {
        "totalAssets": "Total assets",
        "totalEquity": "Total equity",
        "totalLiabilities": "Total liabilities",
        "totalEquityAndLiabilities": "Total equity and liabilities",
    }
    by_line: dict[str, dict[str, str]] = {k: {} for k in line_keys}
    for item in values:
        if not isinstance(item, dict):
            continue
        lk = _clean(item.get("lineKey"))
        if lk in by_line:
            by_line[lk][_clean(item.get("periodId"))] = _clean(item.get("amount"))
    headers = ["Particulars", *period_labels]

    def _format_lakh_amount(raw: str) -> str:
        if not raw or raw == PLACEHOLDER_TOKEN:
            return PLACEHOLDER_TOKEN
        numeric = raw.replace(",", "")
        try:
            value = int(numeric) if "." not in numeric else float(numeric)
        except ValueError:
            return raw
        from app.modules.drhp.export.formatters import format_indian_decimal, format_indian_integer

        grouped = format_indian_integer(int(value)) if isinstance(value, int) else format_indian_decimal(float(value))
        return f"₹{grouped} {amount_unit}"

    rows = [
        [
            labels[k],
            *[_format_lakh_amount(by_line[k].get(pid, PLACEHOLDER_TOKEN)) for pid in period_ids],
        ]
        for k in line_keys
        if any(by_line[k].values())
    ]
    return headers, rows


def extract_rpt_transactions(
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    entity_registry: dict[str, Any] | None = None,
) -> list[dict[str, str]]:
    ge = _payload("group-entities-related-parties", snapshots)
    section = _section(ge, "relatedPartyTransactionsBalancesAndCommitments")
    transactions = section.get("transactions") or []
    entity_names: dict[str, str] = {}
    if entity_registry:
        for entity in entity_registry.get("entities") or []:
            if isinstance(entity, dict) and entity.get("id"):
                entity_names[str(entity["id"])] = _first(entity.get("legalName"), entity.get("displayName"))

    ge_ws = snapshots.get("group-entities-related-parties")
    if ge_ws:
        master = ge_ws.payload.get("groupStructureAndEntityMaster") or {}
        for entity in master.get("entities") or []:
            if not isinstance(entity, dict):
                continue
            entity_id = _clean(entity.get("id"))
            identity = entity.get("identity") if isinstance(entity.get("identity"), dict) else {}
            if entity_id:
                entity_names[entity_id] = _first(identity.get("legalName"), entity.get("entityName"))

    rows: list[dict[str, str]] = []
    for txn in transactions:
        if not isinstance(txn, dict):
            continue
        linked_entity = _clean(txn.get("linkedEntityId"))
        party = _first(
            txn.get("relatedPartyName"),
            txn.get("partyName"),
            entity_names.get(linked_entity),
        )
        nature = _first(
            txn.get("transactionNature"),
            txn.get("nature"),
            txn.get("description"),
            txn.get("transactionType"),
        )
        if nature and "-" in nature:
            nature = nature.replace("-", " ").title()
        amount_raw = _first(txn.get("transactionAmount"), txn.get("transactionValue"), txn.get("amount"))
        unit = _clean(txn.get("amountUnit") or txn.get("currencyUnit") or "INR")
        if amount_raw:
            if unit.casefold() == "lakh":
                from app.modules.drhp.export.formatters import format_indian_decimal, format_indian_integer

                numeric = amount_raw.replace(",", "")
                try:
                    value = float(numeric) if "." in numeric else int(numeric)
                    grouped = (
                        format_indian_integer(value)
                        if isinstance(value, int)
                        else format_indian_decimal(value)
                    )
                    amount = f"₹{grouped} lakh"
                except ValueError:
                    amount = amount_raw
            elif unit.upper() == "INR" and amount_raw.isdigit() and len(amount_raw) > 6:
                from app.modules.drhp.export.formatters import format_inr_amount

                amount = format_inr_amount(int(amount_raw))
            else:
                amount = amount_raw
        else:
            amount = PLACEHOLDER_TOKEN
        rows.append({"party": party or PLACEHOLDER_TOKEN, "nature": nature or PLACEHOLDER_TOKEN, "amount": amount})
    return rows


def extract_basis_metrics(snapshots: dict[str, WorkstreamSnapshot]) -> list[list[str]]:
    fin = _payload("financials-kpis", snapshots)
    ipo = extract_ipo_offer(snapshots)
    ratios = _section(fin, "ratiosCapitalisationAndIssuePriceMetrics")
    sme = ratios.get("smeEligibilityByPeriod") or []
    latest = sme[-1] if sme and isinstance(sme[-1], dict) else {}
    per_share = (fin.get("restatedStatementOfProfitAndLoss") or {}).get("perShareByPeriod") or []
    eps = ""
    if per_share and isinstance(per_share[-1], dict):
        eps = _clean(per_share[-1].get("basicEps"))
    rows = [
        ["Face value per Equity Share (₹)", ipo.get("faceValue") or PLACEHOLDER_TOKEN],
        ["Issue Price (₹)", ipo.get("proposedIssuePrice") or PLACEHOLDER_TOKEN],
        ["Basic EPS (₹)", eps or PLACEHOLDER_TOKEN],
        ["Return on Net Worth (%)", _clean(ratios.get("returnOnNetWorth")) or PLACEHOLDER_TOKEN],
        ["NAV per share (₹)", _clean(ratios.get("navPerShare")) or PLACEHOLDER_TOKEN],
        ["Net Worth (₹ lakh)", _clean(latest.get("netWorth")) or PLACEHOLDER_TOKEN],
        ["Operating Profit (₹ lakh)", _clean(latest.get("operatingProfit")) or PLACEHOLDER_TOKEN],
    ]
    return [row for row in rows if row[1] != PLACEHOLDER_TOKEN or row[0].startswith("Issue Price")]


def extract_business_profile(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    bo = _payload("business-operations", snapshots)
    return _section(bo, "businessProfileAndOperatingModel", "businessProfileOperatingModel")


def extract_products(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    bo = _payload("business-operations", snapshots)
    section = _section(bo, "productsServicesAndRevenueMix", "productsServicesRevenueMix")
    products = section.get("productsServices") or section.get("products") or []
    rows: list[dict[str, str]] = []
    for p in products:
        if not isinstance(p, dict):
            continue
        rows.append(
            {
                "name": _clean(p.get("name")),
                "description": _clean(p.get("description")),
                "segment": _clean(p.get("businessSegment")),
            }
        )
    return rows


def extract_customers_section(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    bo = _payload("business-operations", snapshots)
    return _section(
        bo,
        "customersSalesDistributionAndGeography",
        "customersSalesDistributionGeography",
    )


def extract_customer_display_name(customer: dict[str, Any]) -> str:
    return _first(
        customer.get("customerNameOrConfidentialLabel"),
        customer.get("customerName"),
        customer.get("name"),
    )


def extract_approvals(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    lac = _payload("litigation-approvals-compliance", snapshots)
    section = _section(lac, "governmentRegulatoryAndBusinessApprovalsMaster")
    approvals = section.get("approvals") or []
    rows: list[dict[str, str]] = []
    for a in approvals:
        if not isinstance(a, dict):
            continue
        identity = a.get("identity") if isinstance(a.get("identity"), dict) else {}
        authority = a.get("authority") if isinstance(a.get("authority"), dict) else {}
        details = a.get("details") if isinstance(a.get("details"), dict) else {}
        renewal = a.get("renewalMetadata") if isinstance(a.get("renewalMetadata"), dict) else {}
        expiry = _first(details.get("expiryDate"), renewal.get("renewalDueDate"))
        from app.modules.drhp.generation.publication_format import derive_approval_status

        status = derive_approval_status(
            stored_status=_first(a.get("status"), renewal.get("currentRenewalStage")),
            expiry=expiry,
            renewal=renewal,
        )
        rows.append(
            {
                "name": _first(identity.get("approvalLicenceName"), a.get("approvalName"), a.get("licenceName")),
                "authority": _first(authority.get("issuingAuthority"), a.get("issuingAuthority")),
                "status": status,
                "expiry": expiry,
                "number": _clean(details.get("licenceRegistrationNumber")),
            }
        )
    return rows


def extract_mda_facts(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    fin = _payload("financials-kpis", snapshots)
    mda = fin.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}
    if not isinstance(mda, dict):
        return {"hasContent": False}
    performance = mda.get("performanceFactors") or []
    variances = mda.get("varianceAnalyses") or []
    liquidity = mda.get("liquidityCapitalResources") if isinstance(mda.get("liquidityCapitalResources"), dict) else {}
    trends = mda.get("trendsUncertainties") or []
    parts: list[str] = []
    for factor in performance[:4]:
        if isinstance(factor, dict):
            title = _clean(factor.get("title"))
            explanation = _clean(factor.get("explanation"))
            if title and explanation:
                parts.append(f"{title}: {explanation}")
            elif explanation:
                parts.append(explanation)
    for variance in variances[:3]:
        if isinstance(variance, dict):
            line = _clean(variance.get("lineItem"))
            explanation = _clean(variance.get("explanation"))
            prev_v = _clean(variance.get("previousValue"))
            curr_v = _clean(variance.get("currentValue"))
            if line and explanation:
                if prev_v and curr_v:
                    parts.append(f"{line} moved from {prev_v} to {curr_v} lakh: {explanation}")
                else:
                    parts.append(f"{line}: {explanation}")
    liq = _clean(liquidity.get("principalLiquiditySources"))
    if liq:
        parts.append(f"Liquidity sources: {liq}.")
    for trend in trends[:2]:
        if isinstance(trend, dict):
            title = _clean(trend.get("title"))
            desc = _clean(trend.get("description"))
            if title and desc:
                parts.append(f"{title}: {desc}")
    narrative = _scrub_export_references(" ".join(parts), snapshots)
    return {
        "hasContent": bool(narrative),
        "narrative": narrative,
        "performanceFactors": performance,
        "varianceAnalyses": variances,
        "liquidity": liquidity,
        "trends": trends,
    }


def _revenue_is_domestic_only(snapshots: dict[str, WorkstreamSnapshot]) -> bool:
    profile = extract_business_profile(snapshots)
    if str(profile.get("exportOperations") or "").lower() not in {"no", "false", ""}:
        return False
    customers = extract_customers_section(snapshots)
    geo = customers.get("geographicRevenueRows") or []
    if not geo:
        return str(profile.get("exportOperations") or "").lower() == "no"
    for row in geo:
        if not isinstance(row, dict):
            continue
        pct = _clean(row.get("percentageOfRevenue"))
        region = _clean(row.get("regionOrCountry") or row.get("geographicScope"))
        if pct and region.lower() not in {"india", ""} and pct not in {"0", "0%"}:
            return False
    return True


def _scrub_export_references(text: str, snapshots: dict[str, WorkstreamSnapshot]) -> str:
    if not text or not _revenue_is_domestic_only(snapshots):
        return text
    cleaned = text
    for old, new in (
        ("incremental export orders", "incremental customer orders"),
        ("export shipments", "domestic customer shipments"),
        ("export orders", "customer orders"),
        ("export offtake", "customer offtake"),
    ):
        cleaned = cleaned.replace(old, new)
    return cleaned


def extract_directors(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    mg = _payload("management-governance", snapshots)
    section = _section(mg, "directorsProfilesAppointmentsAndEligibility")
    directors = section.get("directors") or []
    rows: list[dict[str, str]] = []
    for d in directors:
        if not isinstance(d, dict):
            continue
        designation = _clean(d.get("designation")).replace("-", " ").title()
        rows.append(
            {
                "name": _clean(d.get("fullLegalName")),
                "designation": designation,
                "din": _clean(d.get("din")),
                "bio": _clean(d.get("briefProfessionalBiography")),
            }
        )
    return rows


def extract_litigation_matters(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    lac = _payload("litigation-approvals-compliance", snapshots)
    section = _section(lac, "litigationAndProceedingsMaster")
    matters = section.get("matters") or []
    rows: list[dict[str, str]] = []
    for m in matters:
        if not isinstance(m, dict):
            continue
        identity = m.get("identity") if isinstance(m.get("identity"), dict) else m
        stage = m.get("datesAndStage") if isinstance(m.get("datesAndStage"), dict) else {}
        subject = m.get("subjectMatter") if isinstance(m.get("subjectMatter"), dict) else {}
        rows.append(
            {
                "title": _first(identity.get("matterTitle"), m.get("matterTitle")),
                "status": _first(stage.get("currentStage"), stage.get("currentSubsisting"), m.get("status")),
                "amount": _first(
                    subject.get("reliefSoughtAgainstRelevantParty"),
                    m.get("amountDisputed"),
                )
                or "NA",
                "forum": _first((m.get("forum") or {}).get("authorityForumName") if isinstance(m.get("forum"), dict) else ""),
            }
        )
    return rows


def extract_group_entities(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    ge = _payload("group-entities-related-parties", snapshots)
    section = _section(ge, "groupStructureAndEntityMaster")
    entities = section.get("entities") or []
    rows: list[dict[str, str]] = []
    for e in entities:
        if not isinstance(e, dict):
            continue
        identity = e.get("identity") if isinstance(e.get("identity"), dict) else e
        reg = e.get("registration") if isinstance(e.get("registration"), dict) else {}
        badges = e.get("classificationBadges") or []
        rows.append(
            {
                "name": _first(identity.get("legalName"), e.get("entityName")),
                "relationship": ", ".join(str(b) for b in badges) if badges else _clean(e.get("relationshipType")),
                "cin": _clean(reg.get("cin")),
                "office": _clean(reg.get("registeredOffice")),
            }
        )
    return rows


def extract_objects(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    oi = _payload("objects-of-issue", snapshots)
    section = _section(oi, "objectsRegisterAndAllocation")
    objects = section.get("objects") or []
    rows: list[dict[str, str]] = []
    for obj in objects:
        if not isinstance(obj, dict):
            continue
        rows.append(
            {
                "name": _first(obj.get("objectName"), obj.get("name")),
                "category": _clean(obj.get("objectCategory")),
                "description": _clean(obj.get("description")),
                "estimatedCost": _clean(obj.get("estimatedCost")),
                "fromProceeds": _clean(obj.get("amountFromNetProceeds")),
            }
        )
    return rows


def extract_market_series(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, Any]]:
    im = _payload("industry-market", snapshots)
    section = _section(im, "marketSizeSegmentationAndGrowth")
    return section.get("marketSeries") or []


def extract_corporate_events(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, str]]:
    ci = _payload("company-incorporation", snapshots)
    events = ci.get("corporateEvents") or ci.get("corporateHistory") or []
    rows: list[dict[str, str]] = []
    for ev in events:
        if not isinstance(ev, dict):
            continue
        rows.append(
            {
                "date": _clean(ev.get("effectiveDate")),
                "type": _clean(ev.get("eventType")).replace("-", " ").title(),
                "description": _clean(ev.get("description")),
            }
        )
    return rows


def humanize_designation(value: str) -> str:
    return _clean(value).replace("-", " ").replace("_", " ").title()
