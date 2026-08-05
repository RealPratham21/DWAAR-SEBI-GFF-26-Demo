"""G1 DRHP readiness and source-selection unit tests (no database required)."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from uuid import uuid4

from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStatus,
    ReviewStatus,
    SourceTemporality,
)
from app.modules.drhp.constants import (
    ALL_CHAPTER_KEYS,
    ConnectionStatus,
    CoverageStatus,
    GenerationStatus,
)
from app.modules.drhp.hashing import build_chapter_source_material, compute_source_hash
from app.modules.drhp.readiness import evaluate_chapter_readiness
from app.modules.drhp.registry import get_chapter_definition, iter_chapter_definitions
from app.modules.drhp.source_selection import AssertionView, IssueView, select_source_for_requirement

FIXTURE_PATH = (
    Path(__file__).resolve().parents[2]
    / "fixtures"
    / "nivara-techfab"
    / "ground-truth.json"
)


def _nivara_payload() -> dict:
    data = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    return copy.deepcopy(data["informationTab"])


def _empty_identity_payload() -> dict:
    payload = _nivara_payload()
    payload["identity"] = {
        **payload["identity"],
        "legalName": "",
        "cin": "",
        "incorporationDate": "",
    }
    return payload


def test_registry_covers_all_fifteen_frontend_chapters() -> None:
    definitions = iter_chapter_definitions()
    assert len(definitions) == 15
    assert [item.key for item in definitions] == list(ALL_CHAPTER_KEYS)
    supported = [item for item in definitions if item.supported]
    assert {item.key for item in supported} == {
        "cover-page-front-matter",
        "company-history-incorporation",
    }


def test_cover_ready_with_gaps_when_identity_complete() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    result = evaluate_chapter_readiness(
        definition,
        payload=_nivara_payload(),
        assertions=[],
        open_issues=[],
        workspace_id=uuid4(),
    )
    assert result.connection_status == ConnectionStatus.CONNECTED
    assert result.generation_status == GenerationStatus.READY_WITH_GAPS
    assert result.can_generate is True
    assert result.gap_count >= 4
    gap_keys = {row.key for row in result.requirements if row.coverage_status == CoverageStatus.GAP}
    assert "cover.issueDetails" in gap_keys
    assert "cover.promoters" in gap_keys
    assert "cover.exchangeDetails" in gap_keys
    assert "cover.intermediaries" in gap_keys
    legal = next(row for row in result.requirements if row.key == "cover.legalName")
    assert legal.coverage_status == CoverageStatus.SATISFIED
    assert legal.selected.source_type == "information"
    assert legal.selected.value == "Nivara Techfab Private Limited"


def test_cover_blocked_when_required_identity_missing() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    result = evaluate_chapter_readiness(
        definition,
        payload=_empty_identity_payload(),
        assertions=[],
        open_issues=[],
        workspace_id=uuid4(),
    )
    assert result.generation_status == GenerationStatus.BLOCKED
    assert result.can_generate is False
    assert result.connection_status in {
        ConnectionStatus.NOT_CONNECTED,
        ConnectionStatus.PARTIALLY_CONNECTED,
    }
    missing_keys = {
        row.key for row in result.requirements if row.coverage_status == CoverageStatus.MISSING
    }
    assert "cover.legalName" in missing_keys
    assert "cover.cin" in missing_keys


def test_company_history_nivara_ready_with_gaps_and_unknown_applicability() -> None:
    definition = get_chapter_definition("company-history-incorporation")
    assert definition is not None
    result = evaluate_chapter_readiness(
        definition,
        payload=_nivara_payload(),
        assertions=[],
        open_issues=[],
        workspace_id=uuid4(),
    )
    assert result.generation_status == GenerationStatus.READY_WITH_GAPS
    assert result.can_generate is True
    assert result.connection_status == ConnectionStatus.CONNECTED
    assert result.unknown_applicability_count >= 4

    by_key = {row.key: row for row in result.requirements}
    assert by_key["history.legalIdentity"].coverage_status == CoverageStatus.SATISFIED
    assert by_key["history.originalIncorporationEvent"].coverage_status == CoverageStatus.SATISFIED
    assert by_key["history.registeredOfficeHistory"].coverage_status == CoverageStatus.SATISFIED
    assert by_key["history.mainObjects"].coverage_status == CoverageStatus.SATISFIED
    assert by_key["history.taxRegistrations"].coverage_status == CoverageStatus.SATISFIED

    assert by_key["history.previousNames"].coverage_status == CoverageStatus.UNKNOWN_APPLICABILITY
    assert (
        by_key["history.legalFormConversions"].coverage_status
        == CoverageStatus.UNKNOWN_APPLICABILITY
    )
    assert (
        by_key["history.mergersAcquisitions"].coverage_status
        == CoverageStatus.UNKNOWN_APPLICABILITY
    )
    assert (
        by_key["history.completeMoaAmendmentHistory"].coverage_status
        == CoverageStatus.UNKNOWN_APPLICABILITY
    )
    assert (
        by_key["history.holdingsSubsidiariesJv"].coverage_status
        == CoverageStatus.UNKNOWN_APPLICABILITY
    )

    # Empty MoA amendments must not become "No".
    assert by_key["history.moaAmendmentsPresent"].coverage_status == (
        CoverageStatus.UNKNOWN_APPLICABILITY
    )


def test_unsupported_chapter_is_not_connected() -> None:
    definition = get_chapter_definition("risk-factors")
    assert definition is not None
    result = evaluate_chapter_readiness(
        definition,
        payload=_nivara_payload(),
        assertions=[],
        open_issues=[],
        workspace_id=uuid4(),
    )
    assert result.supported is False
    assert result.connection_status == ConnectionStatus.NOT_CONNECTED
    assert result.generation_status == GenerationStatus.BLOCKED
    assert result.can_generate is False


def test_blocking_open_issue_blocks_requirement_and_generation() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    issue = IssueView(
        id=uuid4(),
        fact_key="identity.legalName",
        issue_type="conflicting_value",
        severity="blocking",
        blocking=True,
        status="open",
        title="Legal name conflict",
    )
    result = evaluate_chapter_readiness(
        definition,
        payload=_nivara_payload(),
        assertions=[],
        open_issues=[issue],
        workspace_id=uuid4(),
    )
    legal = next(row for row in result.requirements if row.key == "cover.legalName")
    assert legal.coverage_status == CoverageStatus.BLOCKED
    assert result.generation_status == GenerationStatus.BLOCKED
    assert result.can_generate is False


def test_warning_issue_does_not_block_chapter() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    issue = IssueView(
        id=uuid4(),
        fact_key="identity.legalName",
        issue_type="low_extraction_quality",
        severity="warning",
        blocking=False,
        status="open",
        title="Low quality extraction",
    )
    result = evaluate_chapter_readiness(
        definition,
        payload=_nivara_payload(),
        assertions=[],
        open_issues=[issue],
        workspace_id=uuid4(),
    )
    legal = next(row for row in result.requirements if row.key == "cover.legalName")
    assert legal.coverage_status == CoverageStatus.WARNING
    assert result.generation_status == GenerationStatus.READY_WITH_GAPS
    assert result.can_generate is True


def test_historical_assertion_supports_history_not_current_office() -> None:
    definition = get_chapter_definition("company-history-incorporation")
    assert definition is not None
    assertion = AssertionView(
        id=uuid4(),
        fact_key="registrations.gstin.addressOnRegistration",
        review_status=ReviewStatus.HISTORICAL,
        comparison_status=ComparisonStatus.POSSIBLE_HISTORICAL,
        source_temporality=SourceTemporality.HISTORICAL,
        display_value="Chakan Industrial Area, 410501",
        normalized_value={"pinCode": "410501"},
        document_version_id=uuid4(),
        document_id=uuid4(),
        page_numbers=[1],
        evidence_ids=[uuid4()],
        quote_snapshots=["Chakan Industrial Area"],
    )
    office_req = next(
        req for req in definition.requirements if req.key == "history.registeredOfficeHistory"
    )
    historical_req = next(
        req for req in definition.requirements if req.key == "history.historicalOfficeEvidence"
    )

    _, office_coverage, office_selected = select_source_for_requirement(
        office_req,
        payload=_nivara_payload(),
        assertions=[assertion],
        open_issues=[],
    )
    assert office_coverage == CoverageStatus.SATISFIED
    assert office_selected.source_type == "information"
    assert "Bhosari" in str(office_selected.value)
    assert "410501" not in str(office_selected.value.get("current"))
    # Historical assertion attached as historical evidence only.
    assert any(ref.role == "historical" for ref in office_selected.evidence_refs)

    _, hist_coverage, hist_selected = select_source_for_requirement(
        historical_req,
        payload=_nivara_payload(),
        assertions=[assertion],
        open_issues=[],
    )
    assert hist_coverage == CoverageStatus.SATISFIED
    assert any(ref.role == "historical" for ref in hist_selected.evidence_refs)


def test_conflicting_assertion_not_selected_as_generation_value() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    requirement = next(req for req in definition.requirements if req.key == "cover.legalName")
    assertion = AssertionView(
        id=uuid4(),
        fact_key="identity.legalName",
        review_status=ReviewStatus.PENDING,
        comparison_status=ComparisonStatus.CONFLICTING,
        source_temporality=SourceTemporality.CURRENT,
        display_value="Wrong Name Pvt Ltd",
        normalized_value="Wrong Name Pvt Ltd",
        document_version_id=uuid4(),
    )
    _, coverage, selected = select_source_for_requirement(
        requirement,
        payload=_nivara_payload(),
        assertions=[assertion],
        open_issues=[],
    )
    assert coverage == CoverageStatus.SATISFIED
    assert selected.value == "Nivara Techfab Private Limited"
    assert selected.source_type == "information"
    assert any(ref.role == "conflicting" for ref in selected.evidence_refs)
    assert assertion.id not in selected.assertion_ids


def test_approved_assertion_does_not_overwrite_information() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    requirement = next(req for req in definition.requirements if req.key == "cover.cin")
    assertion = AssertionView(
        id=uuid4(),
        fact_key="identity.cin",
        review_status=ReviewStatus.APPROVED,
        comparison_status=ComparisonStatus.CONFLICTING,
        source_temporality=SourceTemporality.CURRENT,
        display_value="U99999MH2099PTC999999",
        normalized_value="U99999MH2099PTC999999",
        document_version_id=uuid4(),
    )
    _, _, selected = select_source_for_requirement(
        requirement,
        payload=_nivara_payload(),
        assertions=[assertion],
        open_issues=[],
    )
    assert selected.value == "U29309MH2019PTC328517"
    assert selected.source_type == "information"


def test_source_hash_changes_when_information_changes() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    payload = _nivara_payload()
    material_a = build_chapter_source_material(
        definition,
        payload=payload,
        assertions=[],
        open_issues=[],
    )
    hash_a = compute_source_hash(material_a)

    payload_b = copy.deepcopy(payload)
    payload_b["identity"]["legalName"] = "Changed Name Private Limited"
    material_b = build_chapter_source_material(
        definition,
        payload=payload_b,
        assertions=[],
        open_issues=[],
    )
    hash_b = compute_source_hash(material_b)
    assert hash_a != hash_b


def test_unrelated_payload_change_does_not_change_cover_hash() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    payload = _nivara_payload()
    hash_a = compute_source_hash(
        build_chapter_source_material(
            definition,
            payload=payload,
            assertions=[],
            open_issues=[],
        )
    )
    payload_b = copy.deepcopy(payload)
    payload_b["confirmations"] = {
        **payload_b.get("confirmations", {}),
        "allFormerNamesDisclosed": True,
    }
    hash_b = compute_source_hash(
        build_chapter_source_material(
            definition,
            payload=payload_b,
            assertions=[],
            open_issues=[],
        )
    )
    assert hash_a == hash_b


def test_evidence_refs_use_quote_snapshots_not_page_text_field() -> None:
    definition = get_chapter_definition("cover-page-front-matter")
    assert definition is not None
    requirement = next(req for req in definition.requirements if req.key == "cover.legalName")
    assertion = AssertionView(
        id=uuid4(),
        fact_key="identity.legalName",
        review_status=ReviewStatus.APPROVED,
        comparison_status=ComparisonStatus.MATCHED,
        source_temporality=SourceTemporality.CURRENT,
        display_value="Nivara Techfab Private Limited",
        normalized_value="Nivara Techfab Private Limited",
        document_version_id=uuid4(),
        quote_snapshots=["Nivara Techfab Private Limited"],
        evidence_ids=[uuid4()],
        page_numbers=[1],
    )
    _, _, selected = select_source_for_requirement(
        requirement,
        payload=_nivara_payload(),
        assertions=[assertion],
        open_issues=[],
    )
    material = build_chapter_source_material(
        definition,
        payload=_nivara_payload(),
        assertions=[assertion],
        open_issues=[],
    )
    dumped = json.dumps(material)
    assert "quoteSnapshots" in dumped
    assert "fullPageText" not in dumped
    assert "pageText" not in dumped
    assert selected.evidence_refs[0].quote_snapshots == ["Nivara Techfab Private Limited"]
