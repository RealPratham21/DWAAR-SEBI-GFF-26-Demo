"""Global Issues & Gaps service layer (G4)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.global_issue_acknowledgement import GlobalIssueAcknowledgement
from app.models.user import User
from app.modules.issues_gaps.aggregator import aggregate_global_issues
from app.modules.issues_gaps.constants import (
    DRHP_RELATED_CATEGORIES,
    EVIDENCE_GAP_CATEGORIES,
    INCONSISTENCY_CATEGORIES,
)
from app.modules.issues_gaps.labels import chapter_labels
from app.modules.issues_gaps.schemas import (
    AcknowledgementPatchResponse,
    GlobalIssueListResponse,
    GlobalIssueResponse,
    GlobalIssueSummaryResponse,
    RawGlobalIssue,
    SourceRefResponse,
    EvidenceRefResponse,
)


class IssuesGapsErrorCode:
    ISSUE_NOT_FOUND = "issues_gaps_issue_not_found"


def _load_acknowledgements(db: Session, user_id: uuid.UUID) -> dict[str, GlobalIssueAcknowledgement]:
    rows = db.scalars(
        select(GlobalIssueAcknowledgement).where(GlobalIssueAcknowledgement.user_id == user_id)
    ).all()
    return {row.fingerprint: row for row in rows}


def _to_response(
    issue: RawGlobalIssue,
    ack: GlobalIssueAcknowledgement | None,
    *,
    lifecycle_override: str | None = None,
) -> GlobalIssueResponse:
    acknowledged = bool(ack and ack.acknowledged)
    if lifecycle_override:
        lifecycle = lifecycle_override
    elif acknowledged:
        lifecycle = "acknowledged"
    else:
        lifecycle = "open"

    source_refs = [
        SourceRefResponse.model_validate(ref)
        for ref in issue.source_refs
        if isinstance(ref, dict)
    ]
    evidence_refs = []
    for ref in issue.evidence_refs:
        if not isinstance(ref, dict):
            continue
        evidence_refs.append(
            EvidenceRefResponse(
                document_id=ref.get("documentId") or ref.get("document_id"),
                document_version_id=ref.get("documentVersionId") or ref.get("document_version_id"),
                original_filename=ref.get("originalFilename") or ref.get("original_filename"),
                page_numbers=list(ref.get("pageNumbers") or ref.get("page_numbers") or []),
                requirement_key=ref.get("requirementKey") or ref.get("requirement_key"),
                requirement_label=ref.get("requirementLabel") or ref.get("requirement_label"),
            )
        )

    return GlobalIssueResponse(
        id=issue.fingerprint,
        fingerprint=issue.fingerprint,
        title=issue.title,
        description=issue.description,
        category=issue.category,
        severity=issue.severity,
        lifecycle_state=lifecycle,
        source_kind=issue.source_kind,
        source_kinds=issue.source_kinds or [issue.source_kind],
        workstream_key=issue.workstream_key,
        workstream_label=issue.workstream_label,
        section_key=issue.section_key,
        section_label=issue.section_label,
        record_id=issue.record_id,
        record_label=issue.record_label,
        source_refs=source_refs,
        evidence_refs=evidence_refs,
        why_it_matters=issue.why_it_matters,
        suggested_action=issue.suggested_action,
        affected_drhp_chapters=issue.affected_drhp_chapters,
        affected_drhp_chapter_labels=chapter_labels(issue.affected_drhp_chapters),
        open_source_url=issue.open_source_url,
        open_drhp_url=issue.open_drhp_url,
        detected_at=issue.detected_at,
        last_seen_at=datetime.now(tz=UTC),
        professional_review_required=issue.professional_review_required,
        acknowledged=acknowledged,
        acknowledgement_note=ack.note if ack else None,
        acknowledged_at=ack.acknowledged_at if ack else None,
        metadata=issue.metadata,
    )


def _matches_filters(
    issue: GlobalIssueResponse,
    *,
    severity: str | None,
    category: str | None,
    workstream: str | None,
    lifecycle_state: str | None,
    search: str | None,
    drhp_chapter: str | None,
) -> bool:
    if severity and issue.severity != severity:
        return False
    if category and issue.category != category:
        return False
    if workstream and issue.workstream_key != workstream:
        return False
    if lifecycle_state and issue.lifecycle_state != lifecycle_state:
        return False
    if drhp_chapter and drhp_chapter not in issue.affected_drhp_chapters:
        return False
    if search:
        needle = search.strip().lower()
        haystack = " ".join(
            [
                issue.title,
                issue.description,
                issue.workstream_label,
                issue.section_label,
                issue.record_label,
                issue.category,
            ]
        ).lower()
        if needle not in haystack:
            return False
    return True


def list_issues(
    db: Session,
    user: User,
    *,
    severity: str | None = None,
    category: str | None = None,
    workstream: str | None = None,
    lifecycle_state: str | None = None,
    search: str | None = None,
    drhp_chapter: str | None = None,
    include_cleared: bool = False,
) -> GlobalIssueListResponse:
    raw_issues = aggregate_global_issues(db, user)
    acks = _load_acknowledgements(db, user.id)
    active_fps = {issue.fingerprint for issue in raw_issues}

    responses: list[GlobalIssueResponse] = []
    for raw in raw_issues:
        responses.append(_to_response(raw, acks.get(raw.fingerprint)))

    if include_cleared:
        for fp, ack in acks.items():
            if fp in active_fps:
                continue
            responses.append(
                GlobalIssueResponse(
                    id=fp,
                    fingerprint=fp,
                    title="Recently resolved issue",
                    description="The underlying source no longer reports this issue.",
                    category="other_review_required",
                    severity="low",
                    lifecycle_state="cleared",
                    source_kind="historical",
                    source_kinds=["historical"],
                    acknowledged=ack.acknowledged,
                    acknowledgement_note=ack.note,
                    acknowledged_at=ack.acknowledged_at,
                    metadata={"provenance": [{"sourceKind": "historical", "fingerprint": fp}]},
                    last_seen_at=datetime.now(tz=UTC),
                )
            )

    filtered = [
        issue
        for issue in responses
        if _matches_filters(
            issue,
            severity=severity,
            category=category,
            workstream=workstream,
            lifecycle_state=lifecycle_state,
            search=search,
            drhp_chapter=drhp_chapter,
        )
    ]

    severity_rank = {"blocking": 0, "high": 1, "medium": 2, "low": 3}
    filtered.sort(key=lambda row: (severity_rank.get(row.severity, 9), row.title))

    return GlobalIssueListResponse(total=len(filtered), issues=filtered)


def get_issue(db: Session, user: User, issue_id: str) -> GlobalIssueResponse:
    raw_issues = aggregate_global_issues(db, user)
    acks = _load_acknowledgements(db, user.id)
    for raw in raw_issues:
        if raw.fingerprint == issue_id:
            return _to_response(raw, acks.get(raw.fingerprint))

    ack = acks.get(issue_id)
    if ack is not None:
        return GlobalIssueResponse(
            id=issue_id,
            fingerprint=issue_id,
            title="Recently resolved issue",
            description="The underlying source no longer reports this issue.",
            category="other_review_required",
            severity="low",
            lifecycle_state="cleared",
            source_kind="historical",
            acknowledged=ack.acknowledged,
            acknowledgement_note=ack.note,
            acknowledged_at=ack.acknowledged_at,
            metadata={"provenance": [{"sourceKind": "historical", "fingerprint": issue_id}]},
            last_seen_at=datetime.now(tz=UTC),
        )

    raise AppException(
        status_code=404,
        code=IssuesGapsErrorCode.ISSUE_NOT_FOUND,
        message="Issue not found.",
    )


def build_summary(db: Session, user: User) -> GlobalIssueSummaryResponse:
    listing = list_issues(db, user)
    open_issues = [issue for issue in listing.issues if issue.lifecycle_state != "cleared"]

    by_workstream: dict[str, int] = {}
    by_category: dict[str, int] = {}
    for issue in open_issues:
        if issue.workstream_key:
            by_workstream[issue.workstream_key] = by_workstream.get(issue.workstream_key, 0) + 1
        by_category[issue.category] = by_category.get(issue.category, 0) + 1

    return GlobalIssueSummaryResponse(
        total_open=len(open_issues),
        blocking=sum(1 for i in open_issues if i.severity == "blocking"),
        high=sum(1 for i in open_issues if i.severity == "high"),
        medium=sum(1 for i in open_issues if i.severity == "medium"),
        low=sum(1 for i in open_issues if i.severity == "low"),
        professional_review=sum(1 for i in open_issues if i.professional_review_required),
        evidence_gaps=sum(1 for i in open_issues if i.category in EVIDENCE_GAP_CATEGORIES),
        inconsistencies=sum(1 for i in open_issues if i.category in INCONSISTENCY_CATEGORIES),
        drhp_related=sum(1 for i in open_issues if i.category in DRHP_RELATED_CATEGORIES),
        acknowledged=sum(1 for i in open_issues if i.lifecycle_state == "acknowledged"),
        by_workstream=by_workstream,
        by_category=by_category,
    )


def patch_acknowledgement(
    db: Session,
    user: User,
    issue_id: str,
    *,
    acknowledged: bool,
    note: str | None,
) -> AcknowledgementPatchResponse:
    # Ensure issue exists for this user context
    get_issue(db, user, issue_id)

    row = db.scalar(
        select(GlobalIssueAcknowledgement).where(
            GlobalIssueAcknowledgement.user_id == user.id,
            GlobalIssueAcknowledgement.fingerprint == issue_id,
        )
    )
    now = datetime.now(tz=UTC)
    if row is None:
        row = GlobalIssueAcknowledgement(
            user_id=user.id,
            fingerprint=issue_id,
            acknowledged=acknowledged,
            note=note,
            acknowledged_at=now if acknowledged else None,
        )
        db.add(row)
    else:
        row.acknowledged = acknowledged
        row.note = note
        row.acknowledged_at = now if acknowledged else None
        db.add(row)

    db.flush()
    return AcknowledgementPatchResponse(
        issue_id=issue_id,
        fingerprint=issue_id,
        acknowledged=row.acknowledged,
        note=row.note,
        acknowledged_at=row.acknowledged_at,
    )
