"""Build grounded risk candidates for Risk Factors chapter."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.generation.source_extractors import (
    extract_approvals,
    extract_customers_section,
    extract_litigation_matters,
    extract_objects,
)
from app.modules.drhp.generation.source_refs import make_source_ref
from app.modules.drhp.sources.models import SourceRef
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _append(
    candidates: list[dict[str, Any]],
    refs: list[SourceRef],
    *,
    risk_id: str,
    category: str,
    heading: str,
    ref: SourceRef,
    priority: int,
    facts: list[str] | None = None,
) -> None:
    refs.append(ref)
    candidates.append(
        {
            "riskCandidateId": risk_id,
            "category": category,
            "headingSeed": heading,
            "sourceRefIds": [ref.ref_id],
            "priorityScore": priority,
            "supportingFacts": facts or [str(ref.value_preview or ref.field_label)],
            "impactDimension": category,
        }
    )


def build_risk_candidate_registry(
    snapshots: dict[str, WorkstreamSnapshot],
) -> tuple[list[dict[str, Any]], list[SourceRef]]:
    candidates: list[dict[str, Any]] = []
    refs: list[SourceRef] = []

    bo = snapshots.get("business-operations")
    if bo:
        payload = bo.payload
        section = payload.get("customersSalesDistributionAndGeography") or payload.get(
            "customersSalesDistributionGeography"
        )
        if isinstance(section, dict):
            periods = section.get("customerConcentrationPeriods") or []
            if periods:
                period = periods[0]
                share = period.get("largestCustomerPercentage") or period.get("top3Percentage")
                if share:
                    ref = make_source_ref(
                        workstream="business-operations",
                        section="customers-sales-distribution-geography",
                        field_path="customerConcentrationPeriods[0].largestCustomerPercentage",
                        label="Top customer concentration",
                        value=share,
                        record_id=str(period.get("id") or ""),
                        version=bo.version,
                    )
                    _append(
                        candidates,
                        refs,
                        risk_id="risk:customer-concentration",
                        category="business_concentration",
                        heading="Customer concentration",
                        ref=ref,
                        priority=80,
                        facts=[f"Largest customer: {share}% of revenue"],
                    )
            customers = section.get("materialCustomers") or section.get("customers") or []
            if customers and not any(c.get("riskCandidateId") == "risk:customer-concentration" for c in candidates):
                top = customers[0]
                share = top.get("revenueContributionPercentage") or top.get("revenueContributionPct")
                if share:
                    ref = make_source_ref(
                        workstream="business-operations",
                        section="customers-sales-distribution-geography",
                        field_path="materialCustomers[0].revenueContributionPercentage",
                        label="Top customer concentration",
                        value=share,
                        record_id=str(top.get("id") or ""),
                        version=bo.version,
                    )
                    _append(
                        candidates,
                        refs,
                        risk_id="risk:customer-concentration",
                        category="business_concentration",
                        heading="Customer concentration",
                        ref=ref,
                        priority=80,
                    )

        sp = payload.get("suppliersProcurementInventoryAndLogistics") or {}
        if isinstance(sp, dict):
            suppliers = sp.get("keySuppliers") or sp.get("materialSuppliers") or []
            if suppliers and isinstance(suppliers[0], dict):
                supplier = suppliers[0]
                name = supplier.get("supplierNameOrConfidentialLabel") or supplier.get("supplierName") or "a key supplier"
                ref = make_source_ref(
                    workstream="business-operations",
                    section="suppliers-procurement",
                    field_path="keySuppliers[0]",
                    label="Supplier dependence",
                    value=name,
                    record_id=str(supplier.get("id") or ""),
                    version=bo.version,
                )
                _append(
                    candidates,
                    refs,
                    risk_id="risk:supplier-dependence",
                    category="operating_dependency",
                    heading="Supplier and input dependence",
                    ref=ref,
                    priority=70,
                    facts=[f"Key supplier: {name}"],
                )

    fin = snapshots.get("financials-kpis")
    if fin:
        ratios = fin.payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
        debt_equity = ratios.get("debtEquityRatio") or ratios.get("totalDebtToEquity") or ratios.get(
            "totalDebtEquityRatio"
        )
        if debt_equity:
            ref = make_source_ref(
                workstream="financials-kpis",
                section="ratios-capitalisation-issue-price",
                field_path="ratiosCapitalisationAndIssuePriceMetrics.debtEquityRatio",
                label="Debt-equity ratio",
                value=debt_equity,
                version=fin.version,
            )
            _append(
                candidates,
                refs,
                risk_id="risk:leverage",
                category="financial_leverage",
                heading="Leverage and indebtedness",
                ref=ref,
                priority=75,
            )
        mda = fin.payload.get("mdaTrendsMaterialDevelopmentsAndConfirmations") or {}
        if isinstance(mda, dict):
            for trend in (mda.get("trendsUncertainties") or [])[:2]:
                if not isinstance(trend, dict):
                    continue
                title = trend.get("title") or "Financial trend uncertainty"
                ref = make_source_ref(
                    workstream="financials-kpis",
                    section="mda-trends",
                    field_path=f"trendsUncertainties[{trend.get('id', '0')}]",
                    label="MD&A trend",
                    value=title,
                    record_id=str(trend.get("id") or ""),
                    version=fin.version,
                )
                _append(
                    candidates,
                    refs,
                    risk_id=f"risk:trend:{trend.get('id', '0')}",
                    category="financial_trend",
                    heading=str(title)[:120],
                    ref=ref,
                    priority=65,
                    facts=[str(trend.get("description") or title)],
                )

    bac = snapshots.get("borrowings-assets-contracts")
    if bac:
        borrowings = (bac.payload.get("borrowingsFacilitiesAndSecurityMaster") or {}).get("facilities") or []
        for facility in borrowings[:2]:
            if not isinstance(facility, dict):
                continue
            lender = facility.get("lenderName") or facility.get("facilityName") or "lender"
            ref = make_source_ref(
                workstream="borrowings-assets-contracts",
                section="borrowings",
                field_path=f"borrowingsFacilitiesAndSecurityMaster.facilities[{facility.get('id', '0')}]",
                label="Borrowing facility",
                value=lender,
                record_id=str(facility.get("id") or ""),
                version=bac.version,
            )
            _append(
                candidates,
                refs,
                risk_id=f"risk:borrowing:{facility.get('id', '0')}",
                category="borrowings_covenant",
                heading="Borrowings and covenant risk",
                ref=ref,
                priority=72,
                facts=[f"Borrowing from {lender}"],
            )
            break
        contracts = (bac.payload.get("materialBusinessStrategicAndOtherContracts") or {}).get("contracts") or []
        if contracts and isinstance(contracts[0], dict):
            contract = contracts[0]
            basic = contract.get("basicTerms") or {}
            title = (
                contract.get("contractTitle")
                or (basic.get("agreementTitle") if isinstance(basic, dict) else None)
                or "Material contract"
            )
            ref = make_source_ref(
                workstream="borrowings-assets-contracts",
                section="material-contracts",
                field_path="materialBusinessStrategicAndOtherContracts.contracts[0]",
                label="Material contract dependency",
                value=title,
                record_id=str(contract.get("contractId") or contract.get("id") or ""),
                version=bac.version,
            )
            _append(
                candidates,
                refs,
                risk_id="risk:contract-dependency",
                category="contract_dependency",
                heading="Dependence on material contracts",
                ref=ref,
                priority=68,
            )

    lac = snapshots.get("litigation-approvals-compliance")
    if lac:
        matters = (
            (lac.payload.get("litigationAndProceedingsMaster") or {}).get("matters")
            or lac.payload.get("litigationProceedingsMaster", {}).get("matters")
            or []
        )
        for matter in matters[:3]:
            if not isinstance(matter, dict):
                continue
            identity = matter.get("identity") if isinstance(matter.get("identity"), dict) else matter
            stage = matter.get("datesAndStage") if isinstance(matter.get("datesAndStage"), dict) else {}
            subsisting = str(stage.get("currentSubsisting") or "").lower()
            current_stage = str(stage.get("currentStage") or matter.get("status") or "").lower()
            if subsisting not in {"yes", "true", "1"} and current_stage in {"closed", "disposed", "settled"}:
                continue
            title = identity.get("matterTitle") or matter.get("matterTitle") or "Legal proceeding"
            ref = make_source_ref(
                workstream="litigation-approvals-compliance",
                section="litigation-proceedings",
                field_path=f"litigationAndProceedingsMaster.matters[{matter.get('matterId', '0')}]",
                label="Legal proceeding",
                value=title,
                record_id=str(matter.get("matterId") or matter.get("id") or ""),
                version=lac.version,
            )
            _append(
                candidates,
                refs,
                risk_id=f"risk:legal:{matter.get('matterId', matter.get('id', '0'))}",
                category="legal_regulatory",
                heading=str(title)[:120],
                ref=ref,
                priority=90,
            )

        for approval in extract_approvals(snapshots)[:2]:
            if approval.get("expiry"):
                ref = make_source_ref(
                    workstream="litigation-approvals-compliance",
                    section="approvals",
                    field_path="governmentRegulatoryAndBusinessApprovalsMaster.approvals",
                    label="Approval expiry",
                    value=approval["name"],
                    version=lac.version,
                )
                _append(
                    candidates,
                    refs,
                    risk_id=f"risk:approval-expiry:{approval.get('number') or approval['name'][:20]}",
                    category="regulatory_approval",
                    heading="Regulatory approval renewal and expiry",
                    ref=ref,
                    priority=78,
                    facts=[f"{approval['name']} expires/renews: {approval.get('expiry')}"],
                )
                break

    objects = extract_objects(snapshots)
    if objects:
        obj = objects[0]
        ref = make_source_ref(
            workstream="objects-of-issue",
            section="objects-register",
            field_path="objectsRegisterAndAllocation.objects[0]",
            label="Object execution",
            value=obj.get("name") or "Object of the Issue",
            version=snapshots["objects-of-issue"].version if snapshots.get("objects-of-issue") else 1,
        )
        _append(
            candidates,
            refs,
            risk_id="risk:object-execution",
            category="execution_risk",
            heading="Execution risk relating to Objects of the Issue",
            ref=ref,
            priority=60,
            facts=[obj.get("description") or obj.get("name") or ""],
        )

    im = snapshots.get("industry-market")
    if im:
        section = im.payload.get("industryStructureAndCompetition") or {}
        if isinstance(section, dict):
            risks = section.get("industrySpecificRisks") or section.get("keyIndustryRisks") or []
            for risk in risks[:2]:
                if isinstance(risk, dict):
                    title = risk.get("title") or risk.get("riskTitle") or "Industry risk"
                    ref = make_source_ref(
                        workstream="industry-market",
                        section="industry-structure",
                        field_path="industryStructureAndCompetition",
                        label="Industry risk",
                        value=title,
                        version=im.version,
                    )
                    _append(
                        candidates,
                        refs,
                        risk_id=f"risk:industry:{title[:20]}",
                        category="industry_risk",
                        heading=str(title)[:120],
                        ref=ref,
                        priority=55,
                    )
                elif isinstance(risk, str) and risk.strip():
                    ref = make_source_ref(
                        workstream="industry-market",
                        section="industry-structure",
                        field_path="industryStructureAndCompetition",
                        label="Industry risk",
                        value=risk.strip(),
                        version=im.version,
                    )
                    _append(
                        candidates,
                        refs,
                        risk_id="risk:industry",
                        category="industry_risk",
                        heading="Industry-specific risks",
                        ref=ref,
                        priority=55,
                    )
                    break

    mg = snapshots.get("management-governance")
    if mg:
        governance = mg.payload.get("boardCommitteesAndGovernanceStructure") or {}
        if isinstance(governance, dict) and governance.get("governanceWeaknessesOrConcerns"):
            ref = make_source_ref(
                workstream="management-governance",
                section="governance",
                field_path="boardCommitteesAndGovernanceStructure",
                label="Governance",
                value="Governance structure",
                version=mg.version,
            )
            _append(
                candidates,
                refs,
                risk_id="risk:governance",
                category="governance",
                heading="Governance and internal control risks",
                ref=ref,
                priority=50,
            )

    customers = extract_customers_section(snapshots)
    if not any(c.get("category") == "business_concentration" for c in candidates) and customers:
        conc = customers.get("customerConcentrationPeriods") or []
        if conc and isinstance(conc[0], dict):
            top3 = conc[0].get("top3Percentage")
            if top3:
                ref = make_source_ref(
                    workstream="business-operations",
                    section="customers-sales-distribution-geography",
                    field_path="customerConcentrationPeriods[0].top3Percentage",
                    label="Top 3 customer concentration",
                    value=top3,
                    version=bo.version if bo else 1,
                )
                _append(
                    candidates,
                    refs,
                    risk_id="risk:top3-concentration",
                    category="business_concentration",
                    heading="Customer concentration among top accounts",
                    ref=ref,
                    priority=75,
                )

    # Deduplicate by riskCandidateId
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for candidate in candidates:
        rid = str(candidate.get("riskCandidateId"))
        if rid in seen:
            continue
        seen.add(rid)
        unique.append(candidate)

    unique.sort(key=lambda item: item.get("priorityScore", 0), reverse=True)
    return unique, refs
