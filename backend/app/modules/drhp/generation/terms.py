"""Document-wide Term Registry."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.workstreams import WorkstreamSnapshot


def build_term_registry(
    context: dict[str, Any],
    snapshots: dict[str, WorkstreamSnapshot],
) -> dict[str, Any]:
    terms: list[dict[str, Any]] = []

    if context.get("issuerLegalName"):
        terms.append(
            {
                "term": context["issuerLegalName"],
                "abbreviation": "",
                "category": "issuer",
                "definition": "The company preparing this Draft Red Herring Prospectus.",
            }
        )
    if context.get("equityShareTerm"):
        terms.append(
            {
                "term": context["equityShareTerm"],
                "abbreviation": "",
                "category": "offer",
                "definition": "Equity shares of the issuer having the face value stated in the offer document.",
            }
        )

    for abbr, label in (
        ("CIN", "Corporate Identification Number"),
        ("DRHP", "Draft Red Herring Prospectus"),
        ("RPT", "Related Party Transaction"),
        ("KMP", "Key Managerial Personnel"),
        ("MD&A", "Management Discussion and Analysis"),
    ):
        terms.append({"term": label, "abbreviation": abbr, "category": "regulatory", "definition": ""})

    if_ws = snapshots.get("intermediaries-filing")
    if if_ws:
        intermediaries = (if_ws.payload.get("issueTeamAndIntermediaryMaster") or {}).get("intermediaries") or []
        for item in intermediaries:
            if not isinstance(item, dict):
                continue
            name = item.get("legalName") or item.get("displayName")
            if name:
                terms.append(
                    {
                        "term": str(name),
                        "abbreviation": "",
                        "category": "intermediary",
                        "definition": "Issue intermediary appointed for the offer.",
                    }
                )

    return {"terms": terms, "termCount": len(terms)}
