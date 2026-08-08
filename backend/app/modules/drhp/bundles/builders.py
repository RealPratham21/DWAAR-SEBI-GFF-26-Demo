"""Build normalized Chapter Source Bundles for all 18 DRHP chapters."""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.modules.drhp.constants import (
    CHAPTER_TITLES,
    ConnectionStatus,
    GenerationPhase,
    GenerationStatus,
    SourceRefType,
)
from app.modules.drhp.generation.context import build_canonical_context
from app.modules.drhp.generation.registries import build_entity_registry, build_person_registry
from app.modules.drhp.mapping.chapters import get_chapter_mapping
from app.modules.drhp.mapping.dependencies import get_dependency_chapters, get_generation_phase
from app.modules.drhp.ownership import detect_share_count_conflict
from app.modules.drhp.sources.models import (
    BundleReadiness,
    ChapterSourceBundle,
    SourceConflictRef,
    SourceRef,
)
from app.modules.drhp.workstreams import WorkstreamSnapshot


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _ws(slug: str, snapshots: dict[str, WorkstreamSnapshot]) -> dict[str, Any]:
    row = snapshots.get(slug)
    return row.payload if row else {}


def _ref(
    *,
    workstream: str,
    section: str,
    field_path: str,
    label: str,
    value: Any,
    record_id: str = "",
    version: int | None = None,
    source_type: str = SourceRefType.STRUCTURED_USER_INPUT,
) -> SourceRef:
    from app.modules.drhp.generation.source_refs import make_source_ref

    return make_source_ref(
        workstream=workstream,
        section=section,
        field_path=field_path,
        label=label,
        value=value,
        record_id=record_id,
        version=version,
        source_type=source_type,
    )


def _readiness_from_counts(
    *,
    missing: int,
    blockers: int,
    placeholders: int,
    warnings: int,
    generated_deps: int,
    connected: bool = True,
) -> BundleReadiness:
    if generated_deps > 0:
        return BundleReadiness(
            connection_status=ConnectionStatus.CONNECTED if connected else ConnectionStatus.NOT_CONNECTED,
            generation_status=GenerationStatus.DEPENDS_ON_GENERATED,
            can_generate=False,
            missing_count=missing,
            blocker_count=blockers,
            placeholder_count=placeholders,
            warning_count=warnings,
            generated_dependency_count=generated_deps,
        )
    if blockers > 0:
        status = GenerationStatus.BLOCKED
        can_generate = False
    elif missing > 0:
        status = GenerationStatus.READY_WITH_GAPS
        can_generate = True
    elif placeholders > 0:
        status = GenerationStatus.READY_WITH_PLACEHOLDERS
        can_generate = True
    else:
        status = GenerationStatus.READY_TO_GENERATE
        can_generate = True
    return BundleReadiness(
        connection_status=ConnectionStatus.CONNECTED if connected else ConnectionStatus.PARTIALLY_CONNECTED,
        generation_status=status,
        can_generate=can_generate,
        missing_count=missing,
        blocker_count=blockers,
        placeholder_count=placeholders,
        warning_count=warnings,
    )


def _base_bundle(
    snapshot_id: str,
    chapter_key: str,
    snapshots: dict[str, WorkstreamSnapshot],
    *,
    deterministic_facts: list[dict[str, Any]] | None = None,
    narrative_facts: list[dict[str, Any]] | None = None,
    structured_tables: list[dict[str, Any]] | None = None,
    entities: list[dict[str, Any]] | None = None,
    calculations: list[dict[str, Any]] | None = None,
    risk_candidates: list[dict[str, Any]] | None = None,
    source_refs: list[SourceRef] | None = None,
    conflicts: list[SourceConflictRef] | None = None,
    unresolved: list[str] | None = None,
    warnings: list[str] | None = None,
    readiness: BundleReadiness | None = None,
) -> ChapterSourceBundle:
    person_registry, person_refs = build_person_registry(snapshots)
    entity_registry, entity_refs = build_entity_registry(snapshots)
    context = build_canonical_context(
        snapshots,
        person_registry=person_registry,
        entity_registry=entity_registry,
    )
    all_refs = list(source_refs or []) + person_refs + entity_refs
    mapping = get_chapter_mapping(chapter_key)
    deps = list(get_dependency_chapters(chapter_key))
    phase = get_generation_phase(chapter_key)

    missing = len(unresolved or [])
    blockers = sum(1 for item in (unresolved or []) if "blocker" in item.lower())
    if readiness is None:
        readiness = _readiness_from_counts(
            missing=missing,
            blockers=blockers,
            placeholders=0,
            warnings=len(warnings or []),
            generated_deps=len(deps) if phase in (
                GenerationPhase.WHOLE_DOCUMENT_SYNTHESIS,
                GenerationPhase.DERIVED_ANALYTICAL,
            ) and chapter_key in ("summary-of-drhp", "definitions-abbreviations", "risk-factors")
            else 0,
        )

    return ChapterSourceBundle(
        snapshot_id=snapshot_id,
        chapter_key=chapter_key,
        chapter_title=CHAPTER_TITLES[chapter_key],
        global_context=context,
        deterministic_facts=deterministic_facts or [],
        narrative_facts=narrative_facts or [],
        structured_tables=structured_tables or [],
        entities=entities or entity_registry.get("entities") or [],
        calculations=calculations or [],
        risk_candidates=risk_candidates or [],
        source_refs=all_refs,
        evidence_refs=[],
        allowed_placeholders=[],
        unresolved_required_inputs=unresolved or [],
        warnings=warnings or [],
        conflicts=conflicts or [],
        readiness=readiness,
        dependency_chapters=deps,
        generation_phase=phase,
    )


def build_cover_page_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    from app.modules.drhp.generation.source_extractors import (
        extract_identity,
        extract_ipo_offer,
        extract_lead_manager,
        extract_registered_office,
    )

    ci = snapshots.get("company-incorporation")
    ipo = snapshots.get("ipo-setup-eligibility")
    if_ws = snapshots.get("intermediaries-filing")
    refs: list[SourceRef] = []
    facts: list[dict[str, Any]] = []
    unresolved: list[str] = []

    identity = extract_identity(snapshots)
    if ci:
        refs.append(
            _ref(
                workstream="company-incorporation",
                section="legal-identity",
                field_path="identity.legalName",
                label="Legal name",
                value=identity.get("legalName"),
                version=ci.version,
            )
        )
        if identity.get("cin"):
            refs.append(
                _ref(
                    workstream="company-incorporation",
                    section="legal-identity",
                    field_path="identity.cin",
                    label="CIN",
                    value=identity.get("cin"),
                    version=ci.version,
                )
            )
        ro = extract_registered_office(snapshots)
        if ro:
            refs.append(
                _ref(
                    workstream="company-incorporation",
                    section="offices-contact",
                    field_path="offices.registered-office",
                    label="Registered office",
                    value=ro,
                    version=ci.version,
                )
            )
        else:
            unresolved.append("gap:registered_office")
        if not identity.get("cin"):
            unresolved.append("blocker:missing_cin")
    else:
        unresolved.append("blocker:missing_company_incorporation")

    offer = extract_ipo_offer(snapshots)
    if ipo:
        facts.extend(
            [
                {"key": "targetPlatform", "value": offer.get("targetPlatform")},
                {"key": "issueMethod", "value": offer.get("issueMethod")},
                {"key": "faceValue", "value": offer.get("faceValue")},
                {"key": "freshIssueShares", "value": offer.get("freshIssueShares")},
            ]
        )
    else:
        unresolved.append("gap:ipo_setup_missing")

    lead = extract_lead_manager(snapshots)
    if lead and if_ws:
        refs.append(
            _ref(
                workstream="intermediaries-filing",
                section="issue-team-and-intermediary-master",
                field_path="intermediaries.leadManager",
                label="Book Running Lead Manager",
                value=lead,
                version=if_ws.version,
            )
        )
    elif not if_ws:
        unresolved.append("gap:intermediaries_missing")

    facts.append({"key": "issuerLegalName", "value": identity.get("legalName")})

    return _base_bundle(snapshot_id, "cover-page-front-matter", snapshots, deterministic_facts=facts, source_refs=refs, unresolved=unresolved)


def build_definitions_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    return _base_bundle(
        snapshot_id,
        "definitions-abbreviations",
        snapshots,
        deterministic_facts=[{"key": "termRegistrySource", "value": "document_wide"}],
        narrative_facts=[{"note": "Depends on generated chapter outputs and global Term Registry."}],
        readiness=_readiness_from_counts(missing=0, blockers=0, placeholders=0, warnings=0, generated_deps=1),
    )


def build_summary_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    return _base_bundle(
        snapshot_id,
        "summary-of-drhp",
        snapshots,
        narrative_facts=[{"note": "Synthesized only after substantive chapters are generated."}],
        readiness=_readiness_from_counts(missing=0, blockers=0, placeholders=0, warnings=0, generated_deps=1),
    )


def build_risk_factors_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    candidates: list[dict[str, Any]] = []
    bo = _ws("business-operations", snapshots)
    for section_key, path, label in (
        ("customers-sales-distribution-geography", "customersSalesDistributionGeography", "customer_concentration"),
        ("suppliers-procurement-inventory-logistics", "suppliersProcurementInventoryLogistics", "supplier_concentration"),
    ):
        section = bo.get(path) if bo else None
        if isinstance(section, dict) and (section.get("customers") or section.get("suppliers")):
            candidates.append({"category": label, "sourceWorkstream": "business-operations", "sectionKey": section_key})

    fin = _ws("financials-kpis", snapshots)
    if fin:
        candidates.append({"category": "financial_metrics", "sourceWorkstream": "financials-kpis"})

    bac = _ws("borrowings-assets-contracts", snapshots)
    facilities = (bac.get("financialIndebtednessAndFacilityMaster") or {}).get("facilities") or []
    if facilities:
        candidates.append({"category": "borrowing_concentration", "sourceWorkstream": "borrowings-assets-contracts"})

    lac = _ws("litigation-approvals-compliance", snapshots)
    matters = (lac.get("litigationAndProceedingsMaster") or {}).get("matters") or []
    if matters:
        candidates.append({"category": "legal_proceedings", "sourceWorkstream": "litigation-approvals-compliance"})

    return _base_bundle(
        snapshot_id,
        "risk-factors",
        snapshots,
        risk_candidates=candidates,
        readiness=_readiness_from_counts(
            missing=0,
            blockers=0,
            placeholders=0,
            warnings=0,
            generated_deps=0,
        ),
    )


def build_general_information_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    return build_cover_page_bundle(snapshot_id, snapshots).model_copy(
        update={"chapter_key": "general-information-issue", "chapter_title": CHAPTER_TITLES["general-information-issue"]}
    )


def build_capital_structure_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    capital = snapshots.get("capital-ownership")
    ipo = snapshots.get("ipo-setup-eligibility")
    refs: list[SourceRef] = []
    tables: list[dict[str, Any]] = []
    conflicts: list[SourceConflictRef] = []
    unresolved: list[str] = []

    if not capital:
        unresolved.append("blocker:missing_capital_ownership")
    else:
        payload = capital.payload
        structure = payload.get("currentCapitalStructure") or {}
        tables.append({"tableKey": "capital_structure", "rows": [structure]})
        refs.append(
            _ref(
                workstream="capital-ownership",
                section="current-capital-structure",
                field_path="currentCapitalStructure",
                label="Capital structure",
                value=structure,
                version=capital.version,
            )
        )
        shareholders = (payload.get("shareholdersAndBeneficialOwnership") or payload.get("shareholdersBeneficialOwnership") or {}).get("shareholders") or []
        tables.append({"tableKey": "shareholders", "rows": shareholders})

    if capital and ipo:
        cap_fresh = ((capital.payload.get("prePostIssueOwnership") or {}).get("freshIssueShares"))
        ipo_fresh = ((ipo.payload.get("offerStructure") or {}).get("freshIssueShares"))
        conflict = detect_share_count_conflict(
            capital_value=cap_fresh,
            ipo_value=ipo_fresh,
            field_path="freshIssueShares",
        )
        if conflict:
            conflicts.append(
                SourceConflictRef(
                    conflict_id=f"conflict:{uuid4()}",
                    fact_domain=conflict.fact_domain,
                    field_path=conflict.field_path,
                    authoritative_workstream=conflict.authoritative_workstream,
                    authoritative_value=conflict.authoritative_value,
                    conflicting_workstream=conflict.conflicting_workstream,
                    conflicting_value=conflict.conflicting_value,
                    severity=conflict.severity,
                    message=conflict.message,
                )
            )

    return _base_bundle(
        snapshot_id,
        "capital-structure-ownership",
        snapshots,
        structured_tables=tables,
        source_refs=refs,
        conflicts=conflicts,
        unresolved=unresolved,
    )


def build_objects_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    oi = snapshots.get("objects-of-issue")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not oi:
        unresolved.append("blocker:missing_objects_of_issue")
    else:
        register = (oi.payload.get("objectsRegisterAndAllocation") or {}).get("objects") or []
        tables.append({"tableKey": "objects_register", "rows": register})
    return _base_bundle(snapshot_id, "objects-of-the-issue", snapshots, structured_tables=tables, unresolved=unresolved)


def build_basis_for_issue_price_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    fin = snapshots.get("financials-kpis")
    tables: list[dict[str, Any]] = []
    unresolved: list[str] = []
    if not fin:
        unresolved.append("blocker:missing_financials")
    else:
        metrics = fin.payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
        tables.append({"tableKey": "issue_price_metrics", "rows": [metrics]})
    return _base_bundle(snapshot_id, "basis-for-issue-price", snapshots, structured_tables=tables, unresolved=unresolved)


def build_industry_overview_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    im = snapshots.get("industry-market")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not im:
        unresolved.append("blocker:missing_industry_market")
    else:
        market = im.payload.get("marketSizeSegmentationAndGrowth") or {}
        tables.append({"tableKey": "market_size", "rows": [market]})
    return _base_bundle(snapshot_id, "industry-overview", snapshots, structured_tables=tables, unresolved=unresolved)


def build_business_operations_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    bo = snapshots.get("business-operations")
    unresolved: list[str] = []
    facts: list[dict[str, Any]] = []
    if not bo:
        unresolved.append("blocker:missing_business_operations")
    else:
        payload = bo.payload
        profile = payload.get("businessProfileAndOperatingModel") or payload.get("businessProfileOperatingModel") or {}
        facts.append({"key": "businessProfile", "value": profile})
    return _base_bundle(snapshot_id, "business-operations", snapshots, deterministic_facts=facts, unresolved=unresolved)


def build_history_promoters_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    ci = snapshots.get("company-incorporation")
    capital = snapshots.get("capital-ownership")
    ge = snapshots.get("group-entities-related-parties")
    unresolved: list[str] = []
    facts: list[dict[str, Any]] = []
    if not ci:
        unresolved.append("blocker:missing_company_history")
    else:
        facts.append({"key": "corporateEvents", "value": ci.payload.get("corporateEvents") or []})
    if capital:
        facts.append({"key": "promoters", "value": (capital.payload.get("promotersAndControl") or {}).get("promoters") or []})
    if ge:
        facts.append({"key": "entities", "value": (ge.payload.get("groupStructureAndEntityMaster") or {}).get("entities") or []})
    return _base_bundle(snapshot_id, "company-history-promoters-structure", snapshots, deterministic_facts=facts, unresolved=unresolved)


def build_management_governance_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    mg = snapshots.get("management-governance")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not mg:
        unresolved.append("blocker:missing_management_governance")
    else:
        directors = (mg.payload.get("directorsProfilesAppointmentsAndEligibility") or {}).get("directors") or []
        tables.append({"tableKey": "directors", "rows": directors})
    return _base_bundle(snapshot_id, "management-governance", snapshots, structured_tables=tables, unresolved=unresolved)


def build_financial_information_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    fin = snapshots.get("financials-kpis")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not fin:
        unresolved.append("blocker:missing_financials")
    else:
        pl = fin.payload.get("restatedStatementOfProfitAndLoss") or {}
        tables.append({"tableKey": "statement_of_pl", "rows": [pl]})
        ratios = fin.payload.get("ratiosCapitalisationAndIssuePriceMetrics") or {}
        tables.append({"tableKey": "ratios", "rows": [ratios]})
    return _base_bundle(snapshot_id, "financial-information-mda", snapshots, structured_tables=tables, unresolved=unresolved)


def build_legal_regulatory_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    lac = snapshots.get("litigation-approvals-compliance")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not lac:
        unresolved.append("blocker:missing_litigation_approvals")
    else:
        matters = (lac.payload.get("litigationAndProceedingsMaster") or {}).get("matters") or []
        approvals = (lac.payload.get("governmentRegulatoryAndBusinessApprovalsMaster") or {}).get("approvals") or []
        tables.extend(
            [
                {"tableKey": "litigation", "rows": matters},
                {"tableKey": "approvals", "rows": approvals},
            ]
        )
    return _base_bundle(snapshot_id, "legal-regulatory-approvals", snapshots, structured_tables=tables, unresolved=unresolved)


def build_group_rpt_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    ge = snapshots.get("group-entities-related-parties")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not ge:
        unresolved.append("blocker:missing_group_entities")
    else:
        entities = (ge.payload.get("groupStructureAndEntityMaster") or {}).get("entities") or []
        rpts = (ge.payload.get("relatedPartyTransactionsBalancesAndCommitments") or {}).get("transactions") or []
        tables.extend(
            [
                {"tableKey": "group_entities", "rows": entities},
                {"tableKey": "rpt_transactions", "rows": rpts},
            ]
        )
    return _base_bundle(snapshot_id, "group-companies-rpt", snapshots, structured_tables=tables, unresolved=unresolved)


def build_terms_procedure_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    ipo = snapshots.get("ipo-setup-eligibility")
    if_ws = snapshots.get("intermediaries-filing")
    unresolved: list[str] = []
    facts: list[dict[str, Any]] = []
    if not ipo:
        unresolved.append("gap:ipo_setup_missing")
    else:
        facts.append({"key": "offerStructure", "value": ipo.payload.get("offerStructure") or {}})
    if not if_ws:
        unresolved.append("gap:intermediaries_missing")
    else:
        facts.append({"key": "underwriting", "value": if_ws.payload.get("underwritingMarketMakingAndDistributionArrangements") or {}})
    return _base_bundle(snapshot_id, "terms-structure-procedure", snapshots, deterministic_facts=facts, unresolved=unresolved)


def build_material_contracts_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    if_ws = snapshots.get("intermediaries-filing")
    bac = snapshots.get("borrowings-assets-contracts")
    unresolved: list[str] = []
    tables: list[dict[str, Any]] = []
    if not if_ws:
        unresolved.append("blocker:missing_intermediaries_filing")
    else:
        inspection = (if_ws.payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}).get("inspectionItems") or []
        tables.append({"tableKey": "inspection_register", "rows": inspection, "authoritative": True})
    if bac:
        contracts = (bac.payload.get("materialBusinessStrategicAndOtherContracts") or {}).get("contracts") or []
        tables.append({"tableKey": "material_contracts_candidates", "rows": contracts, "authoritative": False})
    return _base_bundle(snapshot_id, "material-contracts-inspection", snapshots, structured_tables=tables, unresolved=unresolved)


def build_declarations_bundle(snapshot_id: str, snapshots: dict[str, WorkstreamSnapshot]) -> ChapterSourceBundle:
    if_ws = snapshots.get("intermediaries-filing")
    ci = snapshots.get("company-incorporation")
    mg = snapshots.get("management-governance")
    unresolved: list[str] = []
    facts: list[dict[str, Any]] = []
    if if_ws:
        certs = (if_ws.payload.get("dueDiligenceCertificatesConsentsAndSignoffs") or {}).get("certificates") or []
        facts.append({"key": "certificates", "value": certs})
    if ci:
        facts.append({"key": "constitutionalRecord", "value": ci.payload.get("constitutionalRecord") or {}})
    if mg:
        facts.append({"key": "governancePolicies", "value": mg.payload.get("governancePoliciesRptOversightAndConfirmations") or {}})
    if not if_ws:
        unresolved.append("gap:intermediaries_missing")
    return _base_bundle(
        snapshot_id,
        "declarations-aoa-miscellaneous",
        snapshots,
        deterministic_facts=facts,
        unresolved=unresolved,
        readiness=_readiness_from_counts(missing=len(unresolved), blockers=0, placeholders=0, warnings=0, generated_deps=1),
    )


BUNDLE_BUILDERS: dict[str, Any] = {
    "cover-page-front-matter": build_cover_page_bundle,
    "definitions-abbreviations": build_definitions_bundle,
    "summary-of-drhp": build_summary_bundle,
    "risk-factors": build_risk_factors_bundle,
    "general-information-issue": build_general_information_bundle,
    "capital-structure-ownership": build_capital_structure_bundle,
    "objects-of-the-issue": build_objects_bundle,
    "basis-for-issue-price": build_basis_for_issue_price_bundle,
    "industry-overview": build_industry_overview_bundle,
    "business-operations": build_business_operations_bundle,
    "company-history-promoters-structure": build_history_promoters_bundle,
    "management-governance": build_management_governance_bundle,
    "financial-information-mda": build_financial_information_bundle,
    "legal-regulatory-approvals": build_legal_regulatory_bundle,
    "group-companies-rpt": build_group_rpt_bundle,
    "terms-structure-procedure": build_terms_procedure_bundle,
    "material-contracts-inspection": build_material_contracts_bundle,
    "declarations-aoa-miscellaneous": build_declarations_bundle,
}


def build_chapter_source_bundle(
    snapshot_id: str,
    chapter_key: str,
    snapshots: dict[str, WorkstreamSnapshot],
) -> ChapterSourceBundle:
    builder = BUNDLE_BUILDERS.get(chapter_key)
    if builder is None:
        msg = f"No source bundle builder for chapter: {chapter_key}"
        raise ValueError(msg)
    return builder(snapshot_id, snapshots)


def build_all_chapter_bundles(
    snapshot_id: str,
    snapshots: dict[str, WorkstreamSnapshot],
) -> dict[str, ChapterSourceBundle]:
    return {key: build_chapter_source_bundle(snapshot_id, key, snapshots) for key in BUNDLE_BUILDERS}
