"""Document-wide Term Registry."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.workstreams import WorkstreamSnapshot

METRIC_DEFINITIONS: dict[str, str] = {
    "PAT": "Profit After Tax for the relevant financial period.",
    "EBITDA": "Earnings Before Interest, Tax, Depreciation and Amortisation for the relevant period.",
    "FCFE": "Free Cash Flow to Equity, being cash flows available to equity shareholders after capital expenditure and debt service.",
    "FCFF": "Free Cash Flow to the Firm before financing costs.",
    "NAV": "Net Asset Value per Equity Share based on restated net worth and issued shares.",
    "EPS": "Earnings per Equity Share (basic) for the relevant period.",
    "RoNW": "Return on Net Worth for the relevant period.",
}


def build_term_registry(
    context: dict[str, Any],
    snapshots: dict[str, WorkstreamSnapshot],
) -> dict[str, Any]:
    from app.modules.drhp.generation.fact_locking import build_metric_terminology_registry
    from app.modules.drhp.generation.source_extractors import extract_ipo_offer, extract_lead_manager, extract_registrar

    terms: list[dict[str, Any]] = []
    issuer = context.get("issuerLegalName") or "the Company"
    ipo = extract_ipo_offer(snapshots)

    core_terms = [
        ("Company" if issuer == "the Company" else issuer, "", f"Means {issuer}." if issuer != "the Company" else "Means the company preparing this Draft Red Herring Prospectus."),
        ("Equity Shares", "", f"Equity shares of {issuer} of face value ₹ {ipo.get('faceValue') or '10'} each, unless the context otherwise requires."),
        ("Offer", "", "The initial public offering of Equity Shares proposed in this Draft Red Herring Prospectus."),
        ("Fresh Issue", "", "The new issue of Equity Shares by the Company as part of the Offer."),
        ("Promoter(s)", "", "Promoter(s) of the Company as identified in the section titled 'Capital Structure and Ownership'."),
        ("Director(s)", "", "Director(s) on the Board of the Company."),
        ("KMP", "Key Managerial Personnel", "Key managerial personnel of the Company as defined under the Companies Act, 2013."),
        ("Group Company", "", "An entity that forms part of the group as disclosed in the section titled 'Group Companies and Related Party Transactions'."),
        ("Subsidiary", "", "A subsidiary company as defined under the Companies Act, 2013 and as disclosed in this document."),
        ("Material Contract", "", "A contract material to the business or operations of the Company as disclosed in the section titled 'Material Contracts and Documents for Inspection'."),
        ("Objects of the Issue", "", "The objects for which the net proceeds of the Fresh Issue are proposed to be utilised."),
        ("MD&A", "Management Discussion and Analysis", "Management's discussion and analysis of financial condition and results of operations."),
        ("RPT", "Related Party Transaction", "A transaction with a related party as defined under applicable accounting standards and SEBI ICDR Regulations."),
        ("Net Worth", "", "Aggregate shareholders' funds as per the restated financial information."),
        ("IPO", "Initial Public Offering", "Initial public offering of equity shares of the Company."),
    ]
    for term, abbr, definition in core_terms:
        terms.append({"term": term, "abbreviation": abbr, "category": "core", "definition": definition})

    for abbr, label, definition in (
        ("CIN", "Corporate Identification Number", "Unique identification number allotted to companies registered in India."),
        ("DRHP", "Draft Red Herring Prospectus", "The draft offer document filed with SEBI in connection with a public issue."),
        ("SEBI", "Securities and Exchange Board of India", "The securities market regulator in India."),
        ("ICDR Regulations", "SEBI (Issue of Capital and Disclosure Requirements) Regulations, 2018", "Regulations governing public issues of securities in India."),
        ("NSE Emerge", "NSE Emerge Platform", "The SME platform of the National Stock Exchange of India Limited, where applicable."),
        ("BRLM", "Book Running Lead Manager", "The book running lead manager appointed for the Offer."),
        ("Registrar to the Issue", "Registrar to the Issue", "The registrar to the issue appointed for the Offer."),
    ):
        terms.append({"term": label, "abbreviation": abbr, "category": "regulatory", "definition": definition})

    brlm = extract_lead_manager(snapshots)
    if brlm:
        terms.append({"term": "Book Running Lead Manager", "abbreviation": "BRLM", "category": "intermediary", "definition": f"{brlm}, appointed as Book Running Lead Manager to the Offer."})
    registrar = extract_registrar(snapshots)
    if registrar:
        terms.append({"term": registrar, "abbreviation": "", "category": "intermediary", "definition": "Registrar to the Issue appointed for the Offer."})

    metric_terms = build_metric_terminology_registry(snapshots)
    for metric, canonical in metric_terms.items():
        abbr = metric if metric.isupper() else ""
        definition = METRIC_DEFINITIONS.get(metric.upper()) or METRIC_DEFINITIONS.get(metric)
        if definition:
            terms.append({"term": canonical, "abbreviation": abbr, "category": "financial_metric", "definition": definition})

    if_ws = snapshots.get("intermediaries-filing")
    if if_ws:
        intermediaries = (if_ws.payload.get("issueTeamAndIntermediaryMaster") or {}).get("intermediaries") or []
        seen: set[str] = set()
        for item in intermediaries:
            if not isinstance(item, dict):
                continue
            name = item.get("legalName") or item.get("displayName")
            if name and str(name) not in seen:
                seen.add(str(name))
                terms.append(
                    {
                        "term": str(name),
                        "abbreviation": "",
                        "category": "intermediary",
                        "definition": "Issue intermediary appointed for the offer.",
                    }
                )

    deduped: list[dict[str, Any]] = []
    seen_terms: set[str] = set()
    for row in terms:
        key = (row.get("term") or "").casefold()
        if not key or not row.get("definition") or key in seen_terms:
            continue
        seen_terms.add(key)
        deduped.append(row)

    return {"terms": deduped, "termCount": len(deduped)}
