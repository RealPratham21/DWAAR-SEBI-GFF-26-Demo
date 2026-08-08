"""Global DRHP canonical context builder."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _payload(slug: str, snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    row = snapshots.get(slug)
    return row.payload if row else {}


def build_canonical_context(
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    person_registry: dict[str, Any],
    entity_registry: dict[str, Any],
) -> dict[str, Any]:
    ci = _payload("company-incorporation", snapshots)
    ipo = _payload("ipo-setup-eligibility", snapshots)
    capital = _payload("capital-ownership", snapshots)
    financials = _payload("financials-kpis", snapshots)
    if_ws = _payload("intermediaries-filing", snapshots)

    identity = ci.get("identity") if isinstance(ci.get("identity"), dict) else {}
    ipo_direction = ipo.get("ipoDirection") if isinstance(ipo.get("ipoDirection"), dict) else {}
    offer_structure = ipo.get("offerStructure") if isinstance(ipo.get("offerStructure"), dict) else {}
    reporting = (
        financials.get("reportingScopePeriodsAndAuditorReadiness")
        if isinstance(financials.get("reportingScopePeriodsAndAuditorReadiness"), dict)
        else {}
    )
    filing_snapshot = (
        if_ws.get("issueConfigurationAndFilingSnapshot", {}).get("filingSnapshot")
        if isinstance(if_ws.get("issueConfigurationAndFilingSnapshot"), dict)
        else {}
    )
    if not isinstance(filing_snapshot, dict):
        filing_snapshot = {}

    legal_name = _clean(identity.get("legalName"))
    short_name = _clean(identity.get("displayName") or identity.get("shortName") or legal_name)

    return {
        "issuerLegalName": legal_name,
        "issuerShortName": short_name,
        "formerNames": [
            _clean(event.get("previousValue"))
            for event in ci.get("corporateEvents") or []
            if isinstance(event, dict) and _clean(event.get("eventType")) == "name-change"
        ],
        "cin": _clean(identity.get("cin")),
        "issuerReferences": {
            "ourCompany": "our Company",
            "we": "we",
            "us": "us",
            "our": "our",
        },
        "equityShareTerm": "Equity Share",
        "offerTerm": "Offer",
        "freshIssueTerm": "Fresh Issue",
        "ofsTerm": "Offer for Sale",
        "faceValue": _clean(
            offer_structure.get("faceValuePerEquityShare")
            or offer_structure.get("faceValuePerShare")
            or (capital.get("currentCapitalStructure") or {}).get("faceValuePerShare")
            if isinstance(capital.get("currentCapitalStructure"), dict)
            else ""
        ),
        "targetPlatform": _clean(ipo_direction.get("targetSmePlatform")),
        "targetExchange": _clean(filing_snapshot.get("selectedDesignatedStockExchange")),
        "issueMethod": _clean(
            ipo_direction.get("proposedPricingMethod")
            or ipo_direction.get("issueMethod")
            or offer_structure.get("issueMethod")
        ),
        "documentStage": _clean(filing_snapshot.get("filingStage") or "preparation"),
        "financialReportingPeriods": reporting.get("reportingPeriods") or [],
        "reportingCurrency": _clean(reporting.get("reportingCurrency") or "INR"),
        "monetaryDisplayUnit": _clean(reporting.get("amountUnit") or "lakh"),
        "percentageFormat": "one_decimal",
        "personRegistryId": "person-registry",
        "entityRegistryId": "entity-registry",
        "personCount": len(person_registry.get("persons") or []),
        "entityCount": len(entity_registry.get("entities") or []),
        "placeholderPolicy": {
            "displayToken": PLACEHOLDER_TOKEN,
            "allowedAtDrhpStage": True,
        },
        "terminologyRules": [
            "Use issuerReferences consistently across all chapters.",
            "Financial periods must match reportingScopePeriodsAndAuditorReadiness.",
            "Monetary values use reportingCurrency and monetaryDisplayUnit.",
        ],
    }
