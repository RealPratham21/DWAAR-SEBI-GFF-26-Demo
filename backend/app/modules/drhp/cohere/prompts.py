"""Versioned DRHP generation prompt templates."""

from __future__ import annotations

import json
from typing import Any

from app.modules.drhp.ast.schemas import DocumentContinuityContract
from app.modules.drhp.constants import CHAPTER_TITLES, PROMPT_VERSION
from app.modules.drhp.generation.chapter_blueprints import get_chapter_blueprint

# Per-chapter guidance for live Cohere — avoids single "Overview" paragraphs.
CHAPTER_PROMPT_GUIDANCE: dict[str, list[str]] = {
    "business-operations": [
        "Produce multiple sections: Business Overview, Operating Model, Products/Services narrative, Customers & Sales, Facilities, Technology/Quality, Competitive Strengths, Strategy.",
        "Each section must contain at least two substantive paragraphs grounded in narrativeFacts and structuredTables.",
        "Do not repeat deterministic tables verbatim — narrate around them.",
    ],
    "financial-information-mda": [
        "MD&A only — financial tables are rendered deterministically. Cover revenue trends, margins, working capital, cash flow, indebtedness, period-on-period changes.",
        "Do not alter any financial numbers; reference periods from globalContext.financialReportingPeriods.",
    ],
    "industry-overview": [
        "Sections: Industry definition, Macroeconomic context, Market size & growth, Segmentation, Drivers, Competition, Issuer positioning, Outlook.",
        "Use marketSeries data from structuredTables; cite source refs for every statistic.",
    ],
    "objects-of-the-issue": [
        "Narrate object-wise deployment, means of finance, and monitoring — tables are pre-rendered.",
    ],
    "risk-factors": [
        "One section per riskCandidate with: heading, factual context, quantified data where in source refs, consequence, cross-reference.",
        "Never use generic one-liner risks.",
    ],
    "summary-of-drhp": [
        "Executive summary with issuer overview, offer, objects, financial highlights, key risks — use chapterDigests and source refs.",
        "No generic chapter-title bullets.",
    ],
    "definitions-abbreviations": [
        "Definitions table from termRegistry; every definition must be non-empty.",
    ],
    "company-history-promoters-structure": [
        "Incorporation narrative, corporate events, promoter profiles, group structure — never serialize raw JSON objects into prose.",
    ],
    "management-governance": [
        "Board narrative plus director/KMP profiles, committees, remuneration — extend beyond the directors table.",
    ],
    "legal-regulatory-approvals": [
        "Framework paragraph plus narration of material matters and approvals from structuredTables.",
    ],
    "group-companies-rpt": [
        "Group structure narrative and RPT commentary grounded in entity/RPT tables.",
    ],
    "basis-for-issue-price": [
        "Qualitative pricing factors narrative; metrics table is pre-rendered — do not invent valuation conclusions.",
    ],
}


def _compact_tables(tables: list[dict[str, Any]], *, max_rows: int = 12) -> list[dict[str, Any]]:
    compact: list[dict[str, Any]] = []
    for table in tables:
        rows = table.get("rows") or []
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            sample = [{k: v for k, v in row.items() if v not in (None, "", [])} for row in rows[:max_rows]]
        else:
            sample = rows[:max_rows]
        compact.append(
            {
                "tableKey": table.get("tableKey"),
                "rowCount": len(rows) if isinstance(rows, list) else 0,
                "sampleRows": sample,
            }
        )
    return compact


def build_chapter_prompt(
    *,
    chapter_key: str,
    bundle: dict[str, Any],
    validation_failures: list[str] | None = None,
) -> str:
    contract = DocumentContinuityContract()
    context = bundle.get("globalContext") or {}
    allowed_refs = [
        {
            "refId": item.get("refId") or item.get("ref_id"),
            "label": item.get("fieldLabel") or item.get("field_label"),
            "valuePreview": item.get("valuePreview") or item.get("value_preview"),
        }
        for item in (bundle.get("sourceRefs") or [])[:120]
    ]
    narrative_facts = bundle.get("narrativeFacts") or []
    deterministic_facts = bundle.get("deterministicFacts") or []
    tables = bundle.get("structuredTables") or []
    placeholders = bundle.get("allowedPlaceholders") or []
    warnings = list(bundle.get("warnings") or [])
    if validation_failures:
        warnings.extend(validation_failures)

    blueprint = get_chapter_blueprint(chapter_key)
    generation_units = [
        {"unitKey": u.unit_key, "heading": u.heading, "outputMode": u.output_mode}
        for u in (blueprint.units if blueprint else [])
    ]

    payload = {
        "promptVersion": PROMPT_VERSION,
        "chapterKey": chapter_key,
        "chapterTitle": CHAPTER_TITLES.get(chapter_key, chapter_key),
        "continuityContract": contract.model_dump(by_alias=True),
        "globalContext": {
            "issuerLegalName": context.get("issuerLegalName"),
            "issuerShortName": context.get("issuerShortName"),
            "cin": context.get("cin"),
            "faceValue": context.get("faceValue"),
            "issueMethod": context.get("issueMethod"),
            "targetExchange": context.get("targetExchange"),
            "financialReportingPeriods": context.get("financialReportingPeriods"),
            "reportingCurrency": context.get("reportingCurrency"),
            "monetaryDisplayUnit": context.get("monetaryDisplayUnit"),
            "placeholderToken": context.get("placeholderPolicy", {}).get("displayToken"),
        },
        "generationUnits": generation_units,
        "chapterGuidance": CHAPTER_PROMPT_GUIDANCE.get(chapter_key, []),
        "narrativeFacts": narrative_facts[:60],
        "deterministicFacts": deterministic_facts[:30],
        "structuredTables": _compact_tables(tables),
        "allowedSourceRefs": allowed_refs,
        "allowedPlaceholders": placeholders,
        "warnings": warnings,
        "riskCandidates": bundle.get("riskCandidates") or [],
        "chapterDigests": bundle.get("chapterDigests") or [],
        "lockedFacts": (bundle.get("lockedFacts") or [])[:80],
        "personRegistry": {
            "persons": (bundle.get("personRegistry") or (bundle.get("globalContext") or {}).get("personRegistry") or {}).get(
                "persons", []
            )[:40]
        },
        "entityRegistry": {
            "entities": (bundle.get("entityRegistry") or (bundle.get("globalContext") or {}).get("entityRegistry") or {}).get(
                "entities", []
            )[:40]
        },
        "metricTerminology": bundle.get("metricTerminology") or {},
        "canonicalDirectors": bundle.get("canonicalDirectors") or [],
        "termRegistry": bundle.get("termRegistry") or {},
        "instructions": [
            "Draft formal Indian DRHP prose suitable for inclusion in a Draft Red Herring Prospectus.",
            "Return JSON matching CohereStructuredChapterOutput: multiple sections with distinct sectionKey, heading, and blocks.",
            "Every factual statement must cite one or more allowedSourceRefs refId values in sourceRefIds on each block metadata — never print refId, sourceRef, or evidenceRef tokens in visible prose.",
            "Use lockedFacts displayValue strings verbatim for all monetary amounts, share counts, percentages, and dates — do not convert units or rescale magnitudes.",
            "Use personRegistry and entityRegistry canonical names when referring to people or entities — never invent or substitute names.",
            "Preserve metricTerminology labels exactly (e.g. FCFE vs FCFF) — do not substitute related financial terms.",
            "Do not state legal, regulatory, eligibility, or compliance conclusions unless explicitly supported; use issuer-representation language where appropriate.",
            "Do not invent numbers, dates, names, regulatory conclusions, or compliance statements.",
            "Do not output Markdown or HTML.",
            "Never write: 'this section describes disclosures relevant to', 'see the relevant workstream', or similar filler.",
            "Use cross references by chapter key only — never page numbers.",
            f"Use {context.get('placeholderPolicy', {}).get('displayToken', '[●]')} only when listed in allowedPlaceholders.",
            "Deterministic tables are rendered separately — add narrative sections that interpret and connect the disclosed data.",
        ],
    }
    return json.dumps(payload, indent=2, default=str)
