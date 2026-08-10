"""Canonical locked facts for DRHP generation — publication-ready display values."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.export.formatters import format_drhp_value, format_inr_amount
from app.modules.drhp.generation.registries import build_entity_registry, build_person_registry
from app.modules.drhp.generation.source_extractors import (
    extract_capital_structure,
    extract_ipo_offer,
    extract_objects,
)
from app.modules.drhp.sources.models import ChapterSourceBundle
from app.modules.drhp.workstreams import WorkstreamSnapshot


def locked_fact(
    *,
    fact_key: str,
    raw_value: Any,
    semantic_type: str,
    display_value: str,
    source_ref: str = "",
    label: str = "",
    unit: str = "",
    period: str = "",
) -> dict[str, Any]:
    return {
        "factKey": fact_key,
        "rawValue": str(raw_value) if raw_value is not None else "",
        "semanticType": semantic_type,
        "displayValue": display_value,
        "sourceRef": source_ref,
        "label": label,
        "unit": unit,
        "period": period,
    }


def format_locked_display(
    raw_value: Any,
    *,
    semantic_type: str,
    unit: str | None = None,
) -> str:
    if raw_value is None or str(raw_value).strip() == "":
        return ""
    if semantic_type == "currency_inr_lakh":
        numeric = str(raw_value).replace(",", "")
        grouped = format_drhp_value(numeric, semantic_type="currency_lakh", unit="lakh")
        return f"₹{grouped} lakh"
    if semantic_type == "currency_inr_lakh_symbol":
        numeric = str(raw_value).replace(",", "")
        grouped = format_drhp_value(numeric, semantic_type="currency_lakh", unit="lakh")
        return f"₹{grouped} lakh"
    return format_drhp_value(raw_value, semantic_type=semantic_type, unit=unit)


def build_metric_terminology_registry(snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, str]:
    """Authoritative financial metric labels — prevents FCFF/FCFE substitution."""
    terms: dict[str, str] = {
        "PAT": "PAT",
        "EBITDA": "EBITDA",
        "Net Worth": "Net Worth",
        "Operating Profit": "Operating Profit",
        "RPT": "Related Party Transaction",
        "KMP": "Key Managerial Personnel",
    }
    ipo = snapshots.get("ipo-setup-eligibility")
    if ipo:
        track = ipo.payload.get("trackRecordAndFinancialEligibility") or {}
        years = track.get("financialYears") or []
        if years and isinstance(years[0], dict) and years[0].get("freeCashFlowToEquity") is not None:
            terms["FCFE"] = "FCFE"
            terms["Free Cash Flow to Equity"] = "FCFE"
    fin = snapshots.get("financials-kpis")
    if fin:
        mda = fin.payload.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}
        if isinstance(mda, dict):
            narrative = " ".join(
                str(mda.get(key) or "")
                for key in ("revenueTrendNarrative", "profitabilityTrendNarrative", "materialDevelopmentsNarrative")
            ).casefold()
            if "fcfe" in narrative:
                terms["FCFE"] = "FCFE"
            if "fcff" in narrative:
                terms["FCFF"] = "FCFF"
    return terms


def build_global_locked_facts(snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, Any]]:
    facts: list[dict[str, Any]] = []
    cap = extract_capital_structure(snapshots)
    share_fields = (
        ("authorisedShares", "Authorised equity shares"),
        ("issuedShares", "Issued & subscribed equity shares"),
        ("paidUpShares", "Paid-up equity shares"),
    )
    for key, label in share_fields:
        raw = cap.get(key)
        if raw:
            facts.append(
                locked_fact(
                    fact_key=f"capital.{key}",
                    raw_value=raw,
                    semantic_type="share_count",
                    display_value=format_locked_display(raw, semantic_type="share_count"),
                    label=label,
                )
            )
    currency_fields = (
        ("authorisedEquityShareCapital", "Authorised equity share capital"),
        ("issuedEquityShareCapital", "Issued equity share capital"),
        ("paidUpEquityShareCapital", "Paid-up equity share capital"),
    )
    for key, label in currency_fields:
        raw = cap.get(key)
        if raw:
            facts.append(
                locked_fact(
                    fact_key=f"capital.{key}",
                    raw_value=raw,
                    semantic_type="currency_inr",
                    display_value=format_locked_display(raw, semantic_type="currency_inr"),
                    label=label,
                )
            )

    ipo = extract_ipo_offer(snapshots)
    if ipo.get("freshIssueShares"):
        facts.append(
            locked_fact(
                fact_key="ipo.freshIssueShares",
                raw_value=ipo["freshIssueShares"],
                semantic_type="share_count",
                display_value=format_locked_display(ipo["freshIssueShares"], semantic_type="share_count"),
                label="Fresh issue shares",
            )
        )
    if ipo.get("faceValue"):
        facts.append(
            locked_fact(
                fact_key="ipo.faceValue",
                raw_value=ipo["faceValue"],
                semantic_type="currency_inr",
                display_value=format_inr_amount(int(str(ipo["faceValue"]).replace(",", ""))),
                label="Face value per equity share",
            )
        )

    for idx, obj in enumerate(extract_objects(snapshots)):
        for field, label in (("estimatedCost", "Estimated cost"), ("fromProceeds", "From net proceeds")):
            raw = obj.get(field)
            if raw:
                facts.append(
                    locked_fact(
                        fact_key=f"objects.{idx}.{field}",
                        raw_value=raw,
                        semantic_type="currency_inr",
                        display_value=format_locked_display(raw, semantic_type="currency_inr"),
                        label=f"{obj.get('name') or 'Object'} — {label}",
                    )
                )

    fin = snapshots.get("financials-kpis")
    if fin:
        pl = fin.payload.get("restatedStatementOfProfitAndLoss") or {}
        unit = "lakh"
        scope = fin.payload.get("reportingScopePeriodsAndAuditorReadiness") or {}
        unit = str(scope.get("amountUnit") or "lakh")
        for lv in pl.get("plLineValues") or []:
            if not isinstance(lv, dict):
                continue
            line_key = str(lv.get("lineKey") or "")
            amount = lv.get("amount")
            period_id = str(lv.get("periodId") or "")
            if not line_key or amount in (None, ""):
                continue
            facts.append(
                locked_fact(
                    fact_key=f"financial.pl.{line_key}.{period_id}",
                    raw_value=amount,
                    semantic_type="currency_inr_lakh",
                    display_value=format_locked_display(amount, semantic_type="currency_inr_lakh"),
                    label=line_key,
                    unit=unit,
                    period=period_id,
                )
            )

    return facts


def build_chapter_locked_facts(
    chapter_key: str,
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    bundle: ChapterSourceBundle | None = None,
) -> list[dict[str, Any]]:
    global_facts = build_global_locked_facts(snapshots)
    chapter_map: dict[str, list[str]] = {
        "capital-structure-ownership": [f["factKey"] for f in global_facts if f["factKey"].startswith("capital.")],
        "objects-of-the-issue": [f["factKey"] for f in global_facts if f["factKey"].startswith("objects.")],
        "financial-information-mda": [f["factKey"] for f in global_facts if f["factKey"].startswith("financial.")],
        "summary-of-drhp": [f["factKey"] for f in global_facts],
        "cover-page-front-matter": [f["factKey"] for f in global_facts if f["factKey"].startswith(("capital.", "ipo."))],
        "general-information-issue": [f["factKey"] for f in global_facts if f["factKey"].startswith("ipo.")],
    }
    allowed_keys = chapter_map.get(chapter_key)
    if allowed_keys is None:
        return global_facts if chapter_key in {"basis-for-issue-price", "group-companies-rpt"} else []
    return [fact for fact in global_facts if fact["factKey"] in allowed_keys]


def enrich_bundle_context(
    bundle: ChapterSourceBundle,
    snapshots: dict[str, WorkstreamSnapshot],
) -> ChapterSourceBundle:
    person_registry, _ = build_person_registry(snapshots)
    entity_registry, _ = build_entity_registry(snapshots)
    locked_facts = build_chapter_locked_facts(bundle.chapter_key, snapshots, bundle=bundle)
    context = dict(bundle.global_context)
    context["personRegistry"] = person_registry
    context["entityRegistry"] = entity_registry
    context["metricTerminology"] = build_metric_terminology_registry(snapshots)
    return bundle.model_copy(
        update={
            "global_context": context,
            "deterministic_facts": [
                *bundle.deterministic_facts,
                *[{"key": f["factKey"], "value": f["displayValue"], "locked": True} for f in locked_facts],
            ],
        }
    )


def bundle_locked_facts_payload(bundle: ChapterSourceBundle, snapshots: dict[str, WorkstreamSnapshot]) -> list[dict[str, Any]]:
    return build_chapter_locked_facts(bundle.chapter_key, snapshots, bundle=bundle)


def allowed_display_values(locked_facts: list[dict[str, Any]]) -> set[str]:
    allowed: set[str] = set()
    for fact in locked_facts:
        display = str(fact.get("displayValue") or "").strip()
        if display:
            allowed.add(display)
            allowed.add(display.replace("₹", "").strip())
            raw = str(fact.get("rawValue") or "").replace(",", "")
            if raw:
                allowed.add(raw)
    return allowed


def build_person_name_index(person_registry: dict[str, Any]) -> dict[str, str]:
    """Map lowercase alias → canonical display name."""
    index: dict[str, str] = {}
    for person in person_registry.get("persons") or []:
        if not isinstance(person, dict):
            continue
        name = str(person.get("fullName") or person.get("fullLegalName") or "").strip()
        person_id = str(person.get("id") or "").strip()
        if not name:
            continue
        index[name.casefold()] = name
        if person_id:
            index[f"person:{person_id}"] = name
    return index


def build_entity_name_index(entity_registry: dict[str, Any]) -> dict[str, str]:
    index: dict[str, str] = {}
    for entity in entity_registry.get("entities") or []:
        if not isinstance(entity, dict):
            continue
        entity_id = str(entity.get("id") or "").strip()
        name = str(entity.get("legalName") or entity.get("displayName") or "").strip()
        if entity_id and name:
            index[f"entity:{entity_id}"] = name
            index[name.casefold()] = name
    return index
