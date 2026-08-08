"""Build derived global facts from live workstream snapshots (G5)."""

from __future__ import annotations

from typing import Any

from app.modules.borrowings_assets_contracts.facilities import format_facility_label, get_facilities
from app.modules.capital_ownership.compute import compute_capital_ownership_model, ipo_setup_reference_from_payload
from app.modules.drhp.constants import PLACEHOLDER_TOKEN, SourceRefType
from app.modules.drhp.generation.source_extractors import (
    PL_LINE_LABELS,
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
    extract_objects,
    extract_products,
    extract_promoters,
    extract_registrar,
    extract_reporting_periods,
    extract_shareholders,
    pivot_pl_table,
)
from app.modules.drhp.generation.source_refs import make_source_ref
from app.modules.drhp.workstreams import WorkstreamSnapshot
from app.modules.facts_evidence.fingerprints import build_fact_fingerprint
from app.modules.facts_evidence.formatting import format_display_value
from app.modules.facts_evidence.labels import section_label, workstream_label, workstream_url
from app.modules.facts_evidence.schemas import RawGlobalFact
from app.modules.facts_evidence.support import map_support_state, map_support_type


def _clean(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _is_populated(value: Any) -> bool:
    text = _clean(value)
    return bool(text) and text not in {PLACEHOLDER_TOKEN, "—", "-", "NA", "Nil", "nil"}


def _emit(
    facts: list[RawGlobalFact],
    *,
    snapshots: dict[str, WorkstreamSnapshot],
    workstream_key: str,
    section_key: str,
    field_path: str,
    label: str,
    value: Any,
    semantic_type: str = "text",
    source_type: str = SourceRefType.STRUCTURED_USER_INPUT,
    record_id: str = "",
    record_label: str = "",
    reporting_period: str = "",
    unit: str = "",
    currency: str = "",
    as_of_date: str = "",
    calculated_from: list[dict[str, Any]] | None = None,
    calculation_expression: str = "",
    professional_confirmation: bool = False,
    metadata: dict[str, Any] | None = None,
) -> None:
    if not _is_populated(value):
        return
    snap = snapshots.get(workstream_key)
    version = snap.version if snap else None
    source_ref = make_source_ref(
        workstream=workstream_key,
        section=section_key,
        field_path=field_path,
        label=label,
        value=value,
        record_id=record_id,
        version=version,
        source_type=source_type,
    )
    support_type = map_support_type(source_type)
    support_state = map_support_state(
        support_type=support_type,
        has_evidence=False,
        is_placeholder=_clean(value) == PLACEHOLDER_TOKEN,
        professional_confirmation=professional_confirmation,
        has_conflict=False,
    )
    fingerprint = build_fact_fingerprint(
        workstream_key=workstream_key,
        section_key=section_key,
        record_id=record_id,
        field_path=field_path,
        reporting_period=reporting_period,
    )
    facts.append(
        RawGlobalFact(
            fingerprint=fingerprint,
            label=label,
            display_value=format_display_value(
                value,
                semantic_type=semantic_type,
                unit=unit,
                currency=currency,
            ),
            raw_value=value,
            semantic_type=semantic_type,
            data_type=semantic_type,
            canonical_workstream_key=workstream_key,
            section_key=section_key,
            field_path=field_path,
            support_type=support_type,
            support_state=support_state,
            source_ref=source_ref.model_dump(by_alias=True, mode="json"),
            calculated_from=calculated_from or [],
            calculation_expression=calculation_expression,
            professional_confirmation_required=professional_confirmation,
            workstream_label=workstream_label(workstream_key),
            section_label=section_label(section_key),
            record_id=record_id,
            record_label=record_label,
            unit=unit,
            currency=currency,
            as_of_date=as_of_date,
            reporting_period=reporting_period,
            open_source_url=workstream_url(workstream_key, section=section_key, record_id=record_id or None),
            metadata=metadata or {},
        )
    )


def build_workstream_facts(snapshots: dict[str, WorkstreamSnapshot]) -> list[RawGlobalFact]:
    facts: list[RawGlobalFact] = []

    identity = extract_identity(snapshots)
    for key, label in (
        ("legalName", "Legal company name"),
        ("cin", "CIN"),
        ("incorporationDate", "Incorporation date"),
        ("registeredOffice", "Registered office"),
        ("website", "Website"),
        ("email", "Email"),
        ("telephone", "Telephone"),
    ):
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="company-incorporation",
            section_key="legal-identity" if key != "registeredOffice" else "offices-contact",
            field_path=f"identity.{key}" if key != "registeredOffice" else "offices.registeredOffice",
            label=label,
            value=identity.get(key),
            semantic_type="text",
        )

    ipo = extract_ipo_offer(snapshots)
    for key, label, sem in (
        ("targetPlatform", "Target SME platform", "text"),
        ("targetExchange", "Designated stock exchange", "text"),
        ("issueMethod", "Issue method", "text"),
        ("faceValue", "Face value per equity share", "currency"),
        ("freshIssueShares", "Fresh Issue shares", "shares"),
        ("ofsShares", "Offer for sale shares", "shares"),
        ("proposedIssuePrice", "Issue price", "currency"),
        ("lotSize", "Minimum application lot size", "shares"),
        ("offerType", "Offer type", "text"),
    ):
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="ipo-setup-eligibility",
            section_key="offer-structure" if key not in {"targetPlatform", "targetExchange", "issueMethod", "offerType"} else "ipo-direction",
            field_path=f"offerStructure.{key}" if key not in {"targetPlatform", "targetExchange", "issueMethod", "offerType"} else f"ipoDirection.{key}",
            label=label,
            value=ipo.get(key),
            semantic_type=sem,
        )

    cap = extract_capital_structure(snapshots)
    for key, label, sem in (
        ("authorisedEquityShareCapital", "Authorised equity share capital", "money_lakh"),
        ("issuedEquityShareCapital", "Issued equity share capital", "money_lakh"),
        ("paidUpEquityShareCapital", "Paid-up equity share capital", "money_lakh"),
        ("faceValuePerShare", "Face value per share", "currency"),
        ("issuedShares", "Issued equity shares", "shares"),
        ("paidUpShares", "Paid-up equity shares", "shares"),
    ):
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="capital-ownership",
            section_key="current-capital-structure",
            field_path=f"currentCapitalStructure.{key}",
            label=label,
            value=cap.get(key),
            semantic_type=sem,
            as_of_date=_clean(cap.get("asOnDate")),
        )

    for idx, sh in enumerate(extract_shareholders(snapshots)):
        rid = sh.get("name") or f"shareholder-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="capital-ownership",
            section_key="shareholders-beneficial-ownership",
            field_path="shareholders.shareholdingPct",
            label=f"Shareholding — {sh.get('name')}",
            value=f"{sh.get('shares')} shares ({sh.get('pct')}%)",
            semantic_type="text",
            record_id=rid,
            record_label=sh.get("name") or "",
        )

    for idx, p in enumerate(extract_promoters(snapshots)):
        rid = p.get("name") or f"promoter-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="capital-ownership",
            section_key="promoters-and-control",
            field_path="promoters.sharesHeld",
            label=f"Promoter shareholding — {p.get('name')}",
            value=f"{p.get('shares')} shares",
            semantic_type="shares",
            record_id=rid,
            record_label=p.get("name") or "",
        )

    cap_snap = snapshots.get("capital-ownership")
    ipo_snap = snapshots.get("ipo-setup-eligibility")
    if cap_snap:
        ipo_ref = ipo_setup_reference_from_payload(ipo_snap.payload if ipo_snap else None)
        model = compute_capital_ownership_model(cap_snap.payload, ipo_ref)
        pre_post = model.get("prePost") or {}
        post_shares = pre_post.get("postIssueShares")
        pre_shares = pre_post.get("preIssueShares") or cap.get("issuedShares")
        fresh = pre_post.get("freshIssueShares") or ipo.get("freshIssueShares")
        if _is_populated(post_shares):
            calc_inputs = []
            if _is_populated(pre_shares):
                calc_inputs.append(
                    make_source_ref(
                        workstream="capital-ownership",
                        section="pre-and-post-issue-ownership",
                        field_path="preIssueShares",
                        label="Pre-issue equity shares",
                        value=pre_shares,
                        version=cap_snap.version,
                    ).model_dump(by_alias=True, mode="json")
                )
            if _is_populated(fresh):
                calc_inputs.append(
                    make_source_ref(
                        workstream="capital-ownership",
                        section="pre-and-post-issue-ownership",
                        field_path="freshIssueShares",
                        label="Fresh Issue shares",
                        value=fresh,
                        version=cap_snap.version,
                    ).model_dump(by_alias=True, mode="json")
                )
            expr = ""
            if _is_populated(pre_shares) and _is_populated(fresh):
                expr = f"{pre_shares} + {fresh}"
            _emit(
                facts,
                snapshots=snapshots,
                workstream_key="capital-ownership",
                section_key="pre-and-post-issue-ownership",
                field_path="postIssueShares",
                label="Post-issue equity shares",
                value=post_shares,
                semantic_type="shares",
                source_type=SourceRefType.DETERMINISTIC_CALCULATION,
                calculated_from=calc_inputs,
                calculation_expression=expr,
            )

    business = extract_business_profile(snapshots)
    _emit(
        facts,
        snapshots=snapshots,
        workstream_key="business-operations",
        section_key="business-profile-operating-model",
        field_path="briefBusinessOverview",
        label="Business overview",
        value=business.get("briefBusinessOverview"),
        semantic_type="text",
    )
    for idx, product in enumerate(extract_products(snapshots)):
        rid = product.get("name") or f"product-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="business-operations",
            section_key="products-services-revenue-mix",
            field_path="productsServices.name",
            label=f"Product / service — {product.get('name')}",
            value=product.get("description") or product.get("name"),
            semantic_type="text",
            record_id=rid,
            record_label=product.get("name") or "",
        )

    customers = extract_customers_section(snapshots)
    _emit(
        facts,
        snapshots=snapshots,
        workstream_key="business-operations",
        section_key="customers-sales-distribution-geography",
        field_path="topCustomerConcentrationPct",
        label="Top customer concentration",
        value=customers.get("topCustomerConcentrationPct") or customers.get("largestCustomerRevenueSharePct"),
        semantic_type="percent",
    )

    for idx, obj in enumerate(extract_objects(snapshots)):
        rid = obj.get("name") or f"object-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="objects-of-issue",
            section_key="objects-register-and-allocation",
            field_path="objects.estimatedCost",
            label=f"Object of the issue — {obj.get('name')}",
            value=obj.get("fromProceeds") or obj.get("estimatedCost"),
            semantic_type="money_lakh",
            record_id=rid,
            record_label=obj.get("name") or "",
        )

    _, pl_rows = pivot_pl_table(snapshots)
    periods = extract_reporting_periods(snapshots)
    period_labels = [p["label"] for p in periods if p.get("label")]
    for row in pl_rows:
        if not row or len(row) < 2:
            continue
        line_label = row[0]
        line_key = next((k for k, v in PL_LINE_LABELS.items() if v == line_label), line_label)
        for col_idx, amount in enumerate(row[1:], start=0):
            period = period_labels[col_idx] if col_idx < len(period_labels) else f"period-{col_idx}"
            sem = "money_lakh" if line_key != "basicEps" else "currency"
            _emit(
                facts,
                snapshots=snapshots,
                workstream_key="financials-kpis",
                section_key="restated-statement-of-profit-and-loss",
                field_path=f"plLineValues.{line_key}",
                label=f"{line_label} — {period}",
                value=amount,
                semantic_type=sem,
                reporting_period=period,
            )

    for row in extract_basis_metrics(snapshots):
        if len(row) < 2:
            continue
        sem = "percent" if "%" in row[0] else "currency"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="financials-kpis",
            section_key="ratios-capitalisation-and-issue-price-metrics",
            field_path=f"ratios.{row[0]}",
            label=row[0],
            value=row[1],
            semantic_type=sem,
        )

    for idx, director in enumerate(extract_directors(snapshots)):
        rid = director.get("din") or director.get("name") or f"director-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="management-governance",
            section_key="directors-profiles-appointments-and-eligibility",
            field_path="directors.designation",
            label=f"{director.get('name')} — designation",
            value=director.get("designation"),
            semantic_type="text",
            record_id=rid,
            record_label=director.get("name") or "",
        )
        if _is_populated(director.get("din")):
            _emit(
                facts,
                snapshots=snapshots,
                workstream_key="management-governance",
                section_key="directors-profiles-appointments-and-eligibility",
                field_path="directors.din",
                label=f"{director.get('name')} — DIN",
                value=director.get("din"),
                semantic_type="text",
                record_id=rid,
                record_label=director.get("name") or "",
            )

    for idx, series in enumerate(extract_market_series(snapshots)):
        if not isinstance(series, dict):
            continue
        rid = _clean(series.get("id")) or f"market-{idx}"
        record_label = _clean(series.get("marketName") or series.get("segmentName") or series.get("label") or rid)
        period_values = series.get("periodValues") or []
        if isinstance(period_values, list) and period_values:
            for pv in period_values:
                if not isinstance(pv, dict):
                    continue
                period = _clean(pv.get("period")) or f"period-{idx}"
                value = pv.get("value")
                if not _is_populated(value):
                    continue
                unit = _clean(series.get("unit"))
                sem = "money_crore" if unit == "crore" else "money_lakh"
                _emit(
                    facts,
                    snapshots=snapshots,
                    workstream_key="industry-market",
                    section_key="market-size-segmentation-and-growth",
                    field_path="marketSeries.periodValues.value",
                    label=f"Market size — {record_label} ({period})",
                    value=value,
                    semantic_type=sem,
                    record_id=rid,
                    record_label=record_label,
                    reporting_period=period,
                    currency=_clean(series.get("currency")) or None,
                )
            continue
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="industry-market",
            section_key="market-size-segmentation-and-growth",
            field_path="marketSeries.marketSize",
            label=f"Market size — {record_label}",
            value=series.get("marketSize") or series.get("value"),
            semantic_type="money_lakh",
            record_id=rid,
            record_label=record_label,
        )

    for idx, entity in enumerate(extract_group_entities(snapshots)):
        rid = entity.get("cin") or entity.get("name") or f"entity-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="group-entities-related-parties",
            section_key="group-structure-and-entity-master",
            field_path="entities.legalName",
            label=f"Group entity — {entity.get('name')}",
            value=entity.get("relationship"),
            semantic_type="text",
            record_id=rid,
            record_label=entity.get("name") or "",
        )

    bac = snapshots.get("borrowings-assets-contracts")
    if bac:
        for facility in get_facilities(bac.payload):
            rid = _clean(facility.get("id")) or format_facility_label(facility)
            label = format_facility_label(facility, rid)
            sanction = facility.get("sanctionAndUtilisation") if isinstance(facility.get("sanctionAndUtilisation"), dict) else {}
            outstanding = sanction.get("principalOutstanding") or (facility.get("outstanding") or {}).get("principalOutstanding")
            _emit(
                facts,
                snapshots=snapshots,
                workstream_key="borrowings-assets-contracts",
                section_key="financial-indebtedness-and-facility-master",
                field_path="facilities.sanctionAndUtilisation.principalOutstanding",
                label=f"Outstanding borrowing — {label}",
                value=outstanding,
                semantic_type="money_rupees",
                record_id=rid,
                record_label=label,
                currency=_clean(sanction.get("currency")) or "INR",
            )
            interest = facility.get("interest") if isinstance(facility.get("interest"), dict) else {}
            terms = facility.get("terms") if isinstance(facility.get("terms"), dict) else {}
            rate = interest.get("enteredEffectiveRate") or terms.get("interestRate")
            if _is_populated(rate):
                _emit(
                    facts,
                    snapshots=snapshots,
                    workstream_key="borrowings-assets-contracts",
                    section_key="financial-indebtedness-and-facility-master",
                    field_path="facilities.interest.enteredEffectiveRate",
                    label=f"Interest rate — {label}",
                    value=rate,
                    semantic_type="percent",
                    record_id=rid,
                    record_label=label,
                )
            maturity = (facility.get("tenorAndRepayment") or {}).get("maturityDate") if isinstance(facility.get("tenorAndRepayment"), dict) else None
            if _is_populated(maturity):
                _emit(
                    facts,
                    snapshots=snapshots,
                    workstream_key="borrowings-assets-contracts",
                    section_key="financial-indebtedness-and-facility-master",
                    field_path="facilities.tenorAndRepayment.maturityDate",
                    label=f"Maturity date — {label}",
                    value=maturity,
                    semantic_type="text",
                    record_id=rid,
                    record_label=label,
                )

    for idx, matter in enumerate(extract_litigation_matters(snapshots)):
        rid = matter.get("title") or f"matter-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="litigation-approvals-compliance",
            section_key="litigation-and-proceedings-master",
            field_path="matters.status",
            label=f"Litigation — {matter.get('title')}",
            value=matter.get("status"),
            semantic_type="text",
            record_id=rid,
            record_label=matter.get("title") or "",
        )
        if _is_populated(matter.get("amount")):
            _emit(
                facts,
                snapshots=snapshots,
                workstream_key="litigation-approvals-compliance",
                section_key="litigation-and-proceedings-master",
                field_path="matters.amountDisputed",
                label=f"Claim amount — {matter.get('title')}",
                value=matter.get("amount"),
                semantic_type="money_lakh",
                record_id=rid,
                record_label=matter.get("title") or "",
            )

    lead = extract_lead_manager(snapshots)
    _emit(
        facts,
        snapshots=snapshots,
        workstream_key="intermediaries-filing",
        section_key="issue-team-and-intermediary-master",
        field_path="intermediaries.leadManager",
        label="Book Running Lead Manager",
        value=lead,
        semantic_type="text",
        professional_confirmation=not _is_populated(lead),
    )
    registrar = extract_registrar(snapshots)
    _emit(
        facts,
        snapshots=snapshots,
        workstream_key="intermediaries-filing",
        section_key="issue-team-and-intermediary-master",
        field_path="intermediaries.registrar",
        label="Registrar to the Issue",
        value=registrar,
        semantic_type="text",
        professional_confirmation=not _is_populated(registrar),
    )

    for idx, event in enumerate(extract_corporate_events(snapshots)):
        rid = f"event-{idx}"
        _emit(
            facts,
            snapshots=snapshots,
            workstream_key="company-incorporation",
            section_key="corporate-events",
            field_path="corporateEvents.description",
            label=f"Corporate event — {event.get('type')}",
            value=event.get("description") or event.get("type"),
            semantic_type="text",
            record_id=rid,
            record_label=event.get("type") or "",
            as_of_date=event.get("date") or "",
        )

    return facts
