"""Build ChapterContentPlan per DRHP chapter (P2.2)."""

from __future__ import annotations

from typing import Any

from app.modules.drhp.constants import ALL_CHAPTER_KEYS
from app.modules.drhp.generation.content_plan import ChapterContentPlan, DisclosureItem, SupportState
from app.modules.drhp.generation.source_extractors import (
    extract_approvals,
    extract_business_profile,
    extract_directors,
    extract_group_entities,
    extract_identity,
    extract_litigation_matters,
    extract_mda_facts,
    extract_objects,
    extract_products,
    pivot_pl_table,
)
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _item(
    *,
    id: str,
    title: str,
    section_key: str,
    workstream: str,
    content_type: str = "table",
    support_state: SupportState = "supported",
    field_paths: list[str] | None = None,
    allow_cohere: bool = False,
    order: int = 1,
    required: bool = True,
) -> DisclosureItem:
    return DisclosureItem(
        id=id,
        title=title,
        section_key=section_key,
        workstream=workstream,
        field_paths=field_paths or [],
        content_type=content_type,  # type: ignore[arg-type]
        support_state=support_state,
        allow_cohere=allow_cohere,
        order=order,
        required=required,
    )


def _plan_definitions(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    return ChapterContentPlan(
        chapter_key=chapter_key,
        items=[
            _item(
                id="definitions-table",
                title="Definitions and Abbreviations",
                section_key="definitions",
                workstream="*",
                content_type="table",
                allow_cohere=False,
            )
        ],
        mapped_field_paths=["termRegistry"],
    )


def _plan_risk(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    from app.modules.drhp.generation.risk_candidates import build_risk_candidate_registry

    candidates, _ = build_risk_candidate_registry(snapshots)
    items = [
        _item(
            id=f"risk-{c.get('riskCandidateId', idx)}",
            title=str(c.get("headingSeed") or "Risk factor"),
            section_key=f"risk-{c.get('riskCandidateId', idx)}",
            workstream="*",
            content_type="narrative",
            allow_cohere=True,
            order=idx,
        )
        for idx, c in enumerate(candidates[:12], start=1)
    ]
    if not items:
        items = [
            _item(
                id="risk-fallback",
                title="Risk Factors",
                section_key="risk-fallback",
                workstream="*",
                content_type="narrative",
                support_state="missing",
                allow_cohere=False,
            )
        ]
    return ChapterContentPlan(chapter_key=chapter_key, items=items, mapped_field_paths=["riskCandidates"])


def _plan_business(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    profile = extract_business_profile(snapshots)
    products = extract_products(snapshots)
    items: list[DisclosureItem] = []
    order = 1
    if profile.get("briefBusinessOverview"):
        items.append(
            _item(
                id="business-overview",
                title="Business Overview",
                section_key="business-overview",
                workstream="business-operations",
                content_type="narrative",
                field_paths=["businessProfileAndOperatingModel.briefBusinessOverview"],
                allow_cohere=True,
                order=order,
            )
        )
        order += 1
    if profile.get("primaryBusinessActivity") or profile.get("customerModel"):
        items.append(
            _item(
                id="operating-model",
                title="Operating Model",
                section_key="operating-model",
                workstream="business-operations",
                content_type="narrative",
                field_paths=["businessProfileAndOperatingModel.primaryBusinessActivity"],
                allow_cohere=True,
                order=order,
            )
        )
        order += 1
    if products:
        items.append(
            _item(
                id="products-services",
                title="Products, Services and Revenue Mix",
                section_key="products-services",
                workstream="business-operations",
                content_type="table",
                field_paths=["productsServicesAndRevenueMix.productsServices"],
                order=order,
            )
        )
        order += 1
    for block_id, title, key, paths in (
        ("customers", "Customers and Sales", "customers", ["customersSalesDistributionAndGeography.materialCustomers"]),
        ("geography", "Geographic Distribution", "geography", ["customersSalesDistributionAndGeography.geographicRevenueRows"]),
        ("suppliers", "Suppliers and Procurement", "suppliers", ["suppliersProcurementInventoryAndLogistics.keySuppliers"]),
        ("facilities", "Facilities and Capacity", "facilities", ["facilitiesCapacityAndOperationalProcess.facilities"]),
        ("technology-quality", "Technology and Quality", "technology-quality", ["technologyQualityResearchAndIntellectualProperty"]),
        ("competitive-strengths", "Competitive Strengths", "competitive-strengths", ["competitiveStrengthsStrategyDependenciesAndConfirmations"]),
        ("strategy", "Strategy", "strategy", ["competitiveStrengthsStrategyDependenciesAndConfirmations.businessStrategyNarrative"]),
        ("workforce", "Workforce", "workforce", ["workforceHumanResourcesAndIndustrialRelations"]),
    ):
        items.append(
            _item(
                id=block_id,
                title=title,
                section_key=key,
                workstream="business-operations",
                content_type="table" if block_id not in {"strategy", "technology-quality"} else "narrative",
                field_paths=paths,
                allow_cohere=block_id in {"strategy", "technology-quality"},
                order=order,
            )
        )
        order += 1
    return ChapterContentPlan(
        chapter_key=chapter_key,
        items=items,
        mapped_field_paths=[p for i in items for p in i.field_paths],
    )


def _plan_financial(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    _, pl_rows = pivot_pl_table(snapshots)
    mda = extract_mda_facts(snapshots)
    items: list[DisclosureItem] = [
        _item(
            id="restated-pl",
            title="Restated Statement of Profit and Loss",
            section_key="financial-structured-disclosures",
            workstream="financials-kpis",
            content_type="table",
            field_paths=["restatedStatementOfProfitAndLoss"],
            order=1,
            allow_cohere=False,
        ),
        _item(
            id="balance-sheet",
            title="Balance Sheet",
            section_key="financial-structured-disclosures",
            workstream="financials-kpis",
            content_type="table",
            field_paths=["restatedBalanceSheet"],
            order=1,
            allow_cohere=False,
        ),
        _item(
            id="cash-flow",
            title="Cash Flow Statement",
            section_key="financial-structured-disclosures",
            workstream="financials-kpis",
            content_type="table",
            field_paths=["restatedCashFlowStatement"],
            order=1,
            allow_cohere=False,
        ),
    ]
    if mda.get("hasContent"):
        items.append(
            _item(
                id="mda",
                title="Management's Discussion and Analysis",
                section_key="mda",
                workstream="financials-kpis",
                content_type="narrative",
                field_paths=[
                    "mdaTrendsMaterialDevelopmentsAndConfirmations.performanceFactors",
                    "mdaTrendsMaterialDevelopmentsAndConfirmations.varianceAnalyses",
                ],
                allow_cohere=True,
                order=2,
            )
        )
    elif pl_rows:
        items.append(
            _item(
                id="mda-fallback",
                title="Management's Discussion and Analysis",
                section_key="mda",
                workstream="financials-kpis",
                content_type="narrative",
                field_paths=["restatedStatementOfProfitAndLoss"],
                allow_cohere=True,
                order=2,
            )
        )
    return ChapterContentPlan(
        chapter_key=chapter_key,
        items=items,
        mapped_field_paths=[p for i in items for p in i.field_paths],
    )


def _plan_legal(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    matters = extract_litigation_matters(snapshots)
    approvals = extract_approvals(snapshots)
    items: list[DisclosureItem] = []
    order = 1
    if matters:
        items.append(
            _item(
                id="litigation",
                title="Outstanding Litigation and Proceedings",
                section_key="litigation",
                workstream="litigation-approvals-compliance",
                content_type="table",
                field_paths=["litigationAndProceedingsMaster.matters"],
                order=order,
            )
        )
        order += 1
    if approvals:
        items.append(
            _item(
                id="approvals",
                title="Government and Regulatory Approvals",
                section_key="approvals",
                workstream="litigation-approvals-compliance",
                content_type="table",
                field_paths=["governmentRegulatoryAndBusinessApprovalsMaster.approvals"],
                order=order,
            )
        )
    if not items:
        items.append(
            _item(
                id="legal-empty",
                title="Legal and Regulatory Disclosures",
                section_key="legal-overview",
                workstream="litigation-approvals-compliance",
                content_type="narrative",
                support_state="missing",
                allow_cohere=False,
            )
        )
    return ChapterContentPlan(chapter_key=chapter_key, items=items)


def _plan_hybrid_default(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    return ChapterContentPlan(
        chapter_key=chapter_key,
        items=[
            _item(
                id=f"{chapter_key}-structured",
                title=f"{chapter_key} structured disclosures",
                section_key=f"{chapter_key}-structured-disclosures",
                workstream="*",
                content_type="table",
                order=1,
            ),
            _item(
                id=f"{chapter_key}-narrative",
                title=f"{chapter_key} narrative",
                section_key=f"{chapter_key}-narrative",
                workstream="*",
                content_type="narrative",
                allow_cohere=True,
                order=2,
                required=False,
            ),
        ],
    )


def _plan_deterministic(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    return ChapterContentPlan(
        chapter_key=chapter_key,
        items=[
            _item(
                id=f"{chapter_key}-deterministic",
                title=chapter_key,
                section_key=chapter_key,
                workstream="*",
                content_type="table",
                allow_cohere=False,
            )
        ],
    )


def _plan_summary(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    identity = extract_identity(snapshots)
    items = [
        _item(
            id="executive-summary",
            title="Executive Summary",
            section_key="executive-summary",
            workstream="*",
            content_type="narrative",
            allow_cohere=True,
            field_paths=["company-incorporation.legalIdentity"],
        )
    ]
    if not identity.get("legalName"):
        items[0].support_state = "missing"
    return ChapterContentPlan(chapter_key=chapter_key, items=items)


def _plan_group(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    entities = extract_group_entities(snapshots)
    items: list[DisclosureItem] = []
    if entities:
        items.append(
            _item(
                id="group-structure",
                title="Group Structure",
                section_key="group-structure",
                workstream="group-entities-related-parties",
                content_type="table",
                field_paths=["groupStructureAndEntityMaster.entities"],
            )
        )
        items.append(
            _item(
                id="rpt",
                title="Related Party Transactions",
                section_key="rpt",
                workstream="group-entities-related-parties",
                content_type="table",
                field_paths=["relatedPartyTransactionsRegister.transactions"],
                order=2,
            )
        )
        items.append(
            _item(
                id="rpt-narrative",
                title="RPT Commentary",
                section_key="rpt",
                workstream="group-entities-related-parties",
                content_type="narrative",
                allow_cohere=True,
                order=2,
                required=False,
            )
        )
    return ChapterContentPlan(chapter_key=chapter_key, items=items or [_item(id="group-empty", title="Group", section_key="group-structure", workstream="group-entities-related-parties", support_state="missing")])


def _plan_objects(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    objects = extract_objects(snapshots)
    items = [
        _item(
            id="objects-table",
            title="Objects Register",
            section_key="objects-register",
            workstream="objects-of-issue",
            content_type="table",
            field_paths=["objectsRegisterAndAllocation.objects"],
        )
    ]
    if objects:
        items.append(
            _item(
                id="objects-narrative",
                title="Objects Narrative",
                section_key="objects-narrative",
                workstream="objects-of-issue",
                content_type="narrative",
                allow_cohere=True,
                order=2,
                required=False,
            )
        )
    return ChapterContentPlan(chapter_key=chapter_key, items=items)


def _plan_management(chapter_key: str, snapshots: dict[str, WorkstreamSnapshot], *, bundle: Any = None) -> ChapterContentPlan:
    directors = extract_directors(snapshots)
    items = [
        _item(
            id="directors-table",
            title="Board of Directors",
            section_key="directors",
            workstream="management-governance",
            content_type="table",
            field_paths=["directorsProfilesAppointmentsAndEligibility.directors"],
        )
    ]
    if directors:
        items.append(
            _item(
                id="management-narrative",
                title="Management Narrative",
                section_key="management-narrative",
                workstream="management-governance",
                content_type="narrative",
                allow_cohere=True,
                order=2,
                required=False,
            )
        )
    return ChapterContentPlan(chapter_key=chapter_key, items=items)


PLAN_BUILDERS = {
    "definitions-abbreviations": _plan_definitions,
    "risk-factors": _plan_risk,
    "summary-of-drhp": _plan_summary,
    "business-operations": _plan_business,
    "financial-information-mda": _plan_financial,
    "legal-regulatory-approvals": _plan_legal,
    "group-companies-rpt": _plan_group,
    "objects-of-the-issue": _plan_objects,
    "management-governance": _plan_management,
    "cover-page-front-matter": _plan_deterministic,
    "general-information-issue": _plan_deterministic,
    "capital-structure-ownership": _plan_deterministic,
    "terms-structure-procedure": _plan_deterministic,
    "material-contracts-inspection": _plan_deterministic,
    "declarations-aoa-miscellaneous": _plan_deterministic,
    "basis-for-issue-price": _plan_hybrid_default,
    "industry-overview": _plan_hybrid_default,
    "company-history-promoters-structure": _plan_hybrid_default,
}

for key in ALL_CHAPTER_KEYS:
    PLAN_BUILDERS.setdefault(key, _plan_hybrid_default)
