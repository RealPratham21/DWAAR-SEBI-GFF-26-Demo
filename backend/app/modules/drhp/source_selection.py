"""Deterministic source selection for DRHP readiness and snapshots."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStatus,
    ReviewStatus,
    SourceTemporality,
)
from app.modules.drhp.constants import (
    ApplicabilityStatus,
    CoverageStatus,
    RequirementClassification,
    SelectedSourceType,
)
from app.modules.drhp.registry import ChapterRequirement


@dataclass(slots=True)
class AssertionView:
    id: UUID
    fact_key: str
    review_status: str
    comparison_status: str
    source_temporality: str
    display_value: str
    normalized_value: Any
    document_version_id: UUID
    document_id: UUID | None = None
    requirement_key: str | None = None
    requirement_label: str | None = None
    original_filename: str | None = None
    page_numbers: list[int] = field(default_factory=list)
    evidence_ids: list[UUID] = field(default_factory=list)
    quote_snapshots: list[str] = field(default_factory=list)


@dataclass(slots=True)
class IssueView:
    id: UUID
    fact_key: str
    issue_type: str
    severity: str
    blocking: bool
    status: str
    title: str


@dataclass(slots=True)
class EvidenceRef:
    assertion_id: UUID
    evidence_ids: list[UUID]
    document_id: UUID | None
    document_version_id: UUID
    requirement_key: str | None
    requirement_label: str | None
    original_filename: str | None
    page_numbers: list[int]
    quote_snapshots: list[str]
    role: str  # supporting | candidate | historical | conflicting
    review_status: str
    comparison_status: str
    source_temporality: str
    display_value: str


@dataclass(slots=True)
class SelectedSource:
    source_type: str
    value: Any
    information_paths: tuple[str, ...]
    assertion_ids: list[UUID] = field(default_factory=list)
    evidence_refs: list[EvidenceRef] = field(default_factory=list)
    issue_ids: list[UUID] = field(default_factory=list)
    generation_permitted: bool = False
    notes: str = ""


def _is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, (list, dict, tuple, set)):
        return len(value) == 0
    return False


def resolve_requirement_value(
    requirement: ChapterRequirement,
    payload: dict[str, Any],
) -> Any:
    if requirement.resolve_value is not None:
        return requirement.resolve_value(payload)
    return None


def requirement_is_present(
    requirement: ChapterRequirement,
    payload: dict[str, Any],
) -> bool:
    if requirement.is_present is not None:
        return bool(requirement.is_present(payload))
    value = resolve_requirement_value(requirement, payload)
    return not _is_blank(value)


def _assertions_for_requirement(
    requirement: ChapterRequirement,
    assertions: list[AssertionView],
) -> list[AssertionView]:
    if not requirement.fact_keys:
        return []
    wanted = set(requirement.fact_keys)
    return [assertion for assertion in assertions if assertion.fact_key in wanted]


def _issues_for_requirement(
    requirement: ChapterRequirement,
    issues: list[IssueView],
) -> list[IssueView]:
    if not requirement.fact_keys:
        return []
    wanted = set(requirement.fact_keys)
    return [issue for issue in issues if issue.fact_key in wanted]


def _to_evidence_ref(assertion: AssertionView, *, role: str) -> EvidenceRef:
    return EvidenceRef(
        assertion_id=assertion.id,
        evidence_ids=list(assertion.evidence_ids),
        document_id=assertion.document_id,
        document_version_id=assertion.document_version_id,
        requirement_key=assertion.requirement_key,
        requirement_label=assertion.requirement_label,
        original_filename=assertion.original_filename,
        page_numbers=list(assertion.page_numbers),
        quote_snapshots=list(assertion.quote_snapshots),
        role=role,
        review_status=assertion.review_status,
        comparison_status=assertion.comparison_status,
        source_temporality=assertion.source_temporality,
        display_value=assertion.display_value,
    )


def select_source_for_requirement(
    requirement: ChapterRequirement,
    *,
    payload: dict[str, Any],
    assertions: list[AssertionView],
    open_issues: list[IssueView],
) -> tuple[str, str, SelectedSource]:
    """Return (applicability, coverage_status, selected_source)."""

    if requirement.classification == RequirementClassification.FUTURE_GAP:
        return (
            ApplicabilityStatus.UNKNOWN,
            CoverageStatus.GAP,
            SelectedSource(
                source_type=SelectedSourceType.NONE,
                value=None,
                information_paths=requirement.information_paths,
                notes=requirement.notes or "Future workstream input not connected.",
            ),
        )

    if requirement.force_unknown:
        return (
            ApplicabilityStatus.UNKNOWN,
            CoverageStatus.UNKNOWN_APPLICABILITY,
            SelectedSource(
                source_type=SelectedSourceType.NONE,
                value=None,
                information_paths=requirement.information_paths,
                notes=requirement.notes
                or "Applicability unknown — completeness cannot be proven from current schema.",
            ),
        )

    related_assertions = _assertions_for_requirement(requirement, assertions)
    related_issues = _issues_for_requirement(requirement, open_issues)
    blocking_issues = [issue for issue in related_issues if issue.blocking]
    warning_issues = [
        issue for issue in related_issues if issue.severity == "warning" and not issue.blocking
    ]

    present = requirement_is_present(requirement, payload)
    value = resolve_requirement_value(requirement, payload) if present else None

    # Unknown-applicability topics: empty ≠ "No".
    if (
        requirement.classification == RequirementClassification.UNKNOWN_APPLICABILITY
        or requirement.empty_means_unknown
    ) and not present:
        return (
            ApplicabilityStatus.UNKNOWN,
            CoverageStatus.UNKNOWN_APPLICABILITY,
            SelectedSource(
                source_type=SelectedSourceType.NONE,
                value=None,
                information_paths=requirement.information_paths,
                issue_ids=[issue.id for issue in related_issues],
                notes=requirement.notes
                or "Applicability unknown — empty rows are not a negative declaration.",
            ),
        )

    if requirement.classification == RequirementClassification.CONDITIONAL and not present:
        # Conditional-when-present with empty_means_unknown already handled above.
        return (
            ApplicabilityStatus.UNKNOWN,
            CoverageStatus.UNKNOWN_APPLICABILITY,
            SelectedSource(
                source_type=SelectedSourceType.NONE,
                value=None,
                information_paths=requirement.information_paths,
                notes="Conditional requirement has no proving rows; applicability unknown.",
            ),
        )

    evidence_refs: list[EvidenceRef] = []
    supporting_ids: list[UUID] = []
    candidate_refs: list[EvidenceRef] = []

    for assertion in related_assertions:
        if assertion.review_status == ReviewStatus.REJECTED:
            continue

        is_historical_assertion = (
            assertion.source_temporality == SourceTemporality.HISTORICAL
            or assertion.review_status == ReviewStatus.HISTORICAL
            or assertion.comparison_status == ComparisonStatus.POSSIBLE_HISTORICAL
        )

        if requirement.historical:
            if is_historical_assertion or assertion.comparison_status in {
                ComparisonStatus.MATCHED,
                ComparisonStatus.POSSIBLE_MATCH,
            }:
                if assertion.comparison_status != ComparisonStatus.CONFLICTING:
                    evidence_refs.append(_to_evidence_ref(assertion, role="historical"))
                    supporting_ids.append(assertion.id)
            continue

        # Current disclosure requirements: historical assertions never become the value.
        if is_historical_assertion:
            evidence_refs.append(_to_evidence_ref(assertion, role="historical"))
            continue

        if assertion.comparison_status == ComparisonStatus.CONFLICTING:
            if assertion.review_status == ReviewStatus.APPROVED:
                # Approved conflict is supporting evidence only — Information remains selected.
                evidence_refs.append(_to_evidence_ref(assertion, role="supporting"))
                supporting_ids.append(assertion.id)
            else:
                evidence_refs.append(_to_evidence_ref(assertion, role="conflicting"))
            continue

        if assertion.comparison_status in {
            ComparisonStatus.MATCHED,
            ComparisonStatus.POSSIBLE_MATCH,
        } or assertion.review_status == ReviewStatus.APPROVED:
            evidence_refs.append(_to_evidence_ref(assertion, role="supporting"))
            supporting_ids.append(assertion.id)
            continue

        # Unconfirmed document values — candidates only, never replace Information.
        if assertion.review_status == ReviewStatus.PENDING:
            candidate_refs.append(_to_evidence_ref(assertion, role="candidate"))

    evidence_refs.extend(candidate_refs)

    if blocking_issues and present:
        return (
            ApplicabilityStatus.APPLICABLE,
            CoverageStatus.BLOCKED,
            SelectedSource(
                source_type=SelectedSourceType.INFORMATION,
                value=value,
                information_paths=requirement.information_paths,
                assertion_ids=supporting_ids,
                evidence_refs=evidence_refs,
                issue_ids=[issue.id for issue in blocking_issues],
                generation_permitted=False,
                notes="Open blocking issue affects this requirement.",
            ),
        )

    if blocking_issues and not present:
        return (
            ApplicabilityStatus.APPLICABLE,
            CoverageStatus.BLOCKED,
            SelectedSource(
                source_type=SelectedSourceType.NONE,
                value=None,
                information_paths=requirement.information_paths,
                evidence_refs=evidence_refs,
                issue_ids=[issue.id for issue in blocking_issues],
                generation_permitted=False,
                notes="Open blocking issue and missing Information value.",
            ),
        )

    if present:
        coverage = CoverageStatus.WARNING if warning_issues else CoverageStatus.SATISFIED
        return (
            ApplicabilityStatus.APPLICABLE,
            coverage,
            SelectedSource(
                source_type=SelectedSourceType.INFORMATION,
                value=value,
                information_paths=requirement.information_paths,
                assertion_ids=supporting_ids,
                evidence_refs=evidence_refs,
                issue_ids=[issue.id for issue in warning_issues],
                generation_permitted=True,
                notes=(
                    "Information value preferred; matched/approved assertions attached as support."
                    if supporting_ids
                    else "Information value selected."
                ),
            ),
        )

    # Missing Information — candidates do not fill the gap for generation.
    if candidate_refs:
        return (
            ApplicabilityStatus.APPLICABLE,
            CoverageStatus.MISSING,
            SelectedSource(
                source_type=SelectedSourceType.CANDIDATE_ASSERTION,
                value=None,
                information_paths=requirement.information_paths,
                evidence_refs=evidence_refs,
                issue_ids=[issue.id for issue in related_issues],
                generation_permitted=False,
                notes="Unconfirmed document values retained as candidates only.",
            ),
        )

    return (
        ApplicabilityStatus.APPLICABLE,
        CoverageStatus.MISSING,
        SelectedSource(
            source_type=SelectedSourceType.NONE,
            value=None,
            information_paths=requirement.information_paths,
            evidence_refs=evidence_refs,
            issue_ids=[issue.id for issue in related_issues],
            generation_permitted=False,
            notes="Required Information value is missing.",
        ),
    )
