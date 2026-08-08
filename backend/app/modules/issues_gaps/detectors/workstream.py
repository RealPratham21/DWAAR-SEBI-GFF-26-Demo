"""Adapt workstream assessment criteria into global issues (G4)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Iterator

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.mapping.impact import get_affected_chapters_for_workstream
from app.modules.issues_gaps.categories import category_from_assessment_state
from app.modules.issues_gaps.constants import GREEN_ASSESSMENT_STATES
from app.modules.issues_gaps.fingerprints import build_fingerprint, build_merge_group
from app.modules.issues_gaps.labels import section_label, workstream_label, workstream_url
from app.modules.issues_gaps.registry import WORKSTREAM_ASSESSMENT_LOADERS
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.issues_gaps.severity import severity_from_assessment_state


def _iter_criteria(assessment: dict[str, Any]) -> Iterator[dict[str, Any]]:
    for row in assessment.get("criteria") or []:
        if isinstance(row, dict):
            yield row
    for group in assessment.get("groups") or []:
        if not isinstance(group, dict):
            continue
        for row in group.get("criteria") or []:
            if isinstance(row, dict):
                yield row
    for rows in (assessment.get("grouped_criteria") or {}).values():
        for row in rows or []:
            if isinstance(row, dict):
                yield row


def _criterion_state(criterion: dict[str, Any]) -> str:
    return str(criterion.get("state") or criterion.get("result") or "").strip()


def _criterion_code(criterion: dict[str, Any]) -> str:
    return str(criterion.get("id") or criterion.get("key") or criterion.get("label") or "unknown")


def _criterion_reason(criterion: dict[str, Any]) -> str:
    return str(
        criterion.get("reason")
        or criterion.get("explanation")
        or criterion.get("label")
        or "Review required."
    )


def _suggested_action(state: str, label: str, workstream_slug: str) -> str:
    normalized = state.strip().lower()
    if normalized == "missing_information":
        return f"Complete the missing information for {label}."
    if normalized in {"potential_inconsistency", "potential_concern"}:
        return f"Review {label} in {workstream_label(workstream_slug)} and reconcile any differences."
    if normalized in {
        "pending_professional_confirmation",
        "professional_confirmation_required",
        "professional_assessment_required",
    }:
        return "Obtain professional confirmation before relying on this information for filing."
    if normalized == "pending_linked_workstream":
        return f"Complete the linked workstream inputs referenced by {label}."
    if normalized in {"pending_supporting_document", "pending_supporting_source"}:
        return f"Provide supporting documentary evidence for {label}."
    return f"Review {label} in {workstream_label(workstream_slug)}."


def detect_workstream_assessment_issues(db: Session, user: User) -> list[RawGlobalIssue]:
    issues: list[RawGlobalIssue] = []
    now = datetime.now(tz=UTC)

    for slug, loader in WORKSTREAM_ASSESSMENT_LOADERS:
        try:
            assessment = loader(db, user)
        except Exception:
            continue
        if assessment is None:
            continue
        payload = assessment.model_dump(by_alias=True) if hasattr(assessment, "model_dump") else assessment
        if not isinstance(payload, dict):
            continue

        for criterion in _iter_criteria(payload):
            state = _criterion_state(criterion)
            if not state or state in GREEN_ASSESSMENT_STATES:
                continue

            issue_code = _criterion_code(criterion)
            group = str(criterion.get("group") or "")
            label = str(criterion.get("label") or issue_code)
            section = str(criterion.get("related_section") or criterion.get("relatedSection") or group)
            deep_link = str(criterion.get("deep_link") or criterion.get("deepLink") or "")
            open_url = deep_link or workstream_url(slug, section=section or None)

            professional = state.lower() in {
                "pending_professional_confirmation",
                "professional_confirmation_required",
                "professional_assessment_required",
            }

            merge_group = None
            if "freshIssueShares" in issue_code or "fresh issue" in label.lower():
                merge_group = build_merge_group("conflict", "share_capital_arithmetic", "freshIssueShares")

            issues.append(
                RawGlobalIssue(
                    fingerprint=build_fingerprint(
                        source_kind="workstream_assessment",
                        workstream_key=slug,
                        section_key=section,
                        record_id=issue_code,
                        issue_code=state,
                    ),
                    title=label,
                    description=_criterion_reason(criterion),
                    category=category_from_assessment_state(state),
                    severity=severity_from_assessment_state(state),
                    source_kind="workstream_assessment",
                    workstream_key=slug,
                    workstream_label=workstream_label(slug),
                    section_key=section,
                    section_label=section_label(section) if section else workstream_label(slug),
                    record_id=issue_code,
                    record_label=label,
                    why_it_matters=(
                        "Incomplete or inconsistent workstream information can weaken DRHP disclosure "
                        "readiness and may require reconciliation before filing."
                    ),
                    suggested_action=_suggested_action(state, label, slug),
                    affected_drhp_chapters=list(get_affected_chapters_for_workstream(slug)),
                    open_source_url=open_url,
                    professional_review_required=professional,
                    metadata={
                        "provenance": [
                            {
                                "sourceKind": "workstream_assessment",
                                "workstreamKey": slug,
                                "criterionState": state,
                                "criterionCode": issue_code,
                            }
                        ],
                        "originalState": state,
                    },
                    merge_group=merge_group,
                    detected_at=now,
                )
            )

    return issues
