"""Detect cross-workstream ownership conflicts (G4)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.generation.snapshot_service import _detect_global_conflicts
from app.modules.drhp.mapping.impact import get_affected_chapters_for_workstream
from app.modules.drhp.workstreams import load_all_workstreams
from app.modules.issues_gaps.constants import WORKSTREAM_LABELS
from app.modules.issues_gaps.fingerprints import build_fingerprint, build_merge_group
from app.modules.issues_gaps.labels import workstream_label, workstream_url
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.issues_gaps.severity import severity_from_conflict


def detect_cross_workstream_conflicts(db: Session, user: User) -> list[RawGlobalIssue]:
    issues: list[RawGlobalIssue] = []
    now = datetime.now(tz=UTC)
    snapshots = load_all_workstreams(db, user.id)
    if not snapshots:
        return issues

    for row in _detect_global_conflicts(snapshots):
        auth_ws = str(row.get("authoritative_workstream") or row.get("authoritativeWorkstream") or "")
        conflict_ws = str(row.get("conflicting_workstream") or row.get("conflictingWorkstream") or "")
        field_path = str(row.get("field_path") or row.get("fieldPath") or "")
        fact_domain = str(row.get("fact_domain") or row.get("factDomain") or "share_capital_arithmetic")
        severity_raw = str(row.get("severity") or "warning")
        auth_value = row.get("authoritative_value") or row.get("authoritativeValue")
        conflict_value = row.get("conflicting_value") or row.get("conflictingValue")

        auth_label = workstream_label(auth_ws)
        conflict_label = workstream_label(conflict_ws)
        title = f"{field_path.replace('freshIssueShares', 'Fresh Issue share count')} differs across workstreams"
        if "freshIssueShares" in field_path:
            title = "Fresh Issue share count differs across workstreams"

        description = (
            f"{auth_label} (authoritative) shows {auth_value!s}; "
            f"{conflict_label} shows {conflict_value!s}. "
            "Review required — this is not a final compliance determination."
        )

        affected = sorted(
            set(get_affected_chapters_for_workstream(auth_ws))
            | set(get_affected_chapters_for_workstream(conflict_ws))
        )

        merge_group = build_merge_group("conflict", fact_domain, field_path)
        issues.append(
            RawGlobalIssue(
                fingerprint=build_fingerprint(
                    source_kind="cross_workstream_conflict",
                    workstream_key=auth_ws,
                    section_key=field_path,
                    record_id=conflict_ws,
                    issue_code=fact_domain,
                ),
                title=title,
                description=description,
                category="inconsistent_information",
                severity=severity_from_conflict(severity_raw),
                source_kind="cross_workstream_conflict",
                workstream_key=auth_ws,
                workstream_label=auth_label,
                section_key=field_path,
                section_label=field_path.replace("freshIssueShares", "Fresh Issue shares"),
                record_id=conflict_ws,
                record_label=conflict_label,
                why_it_matters=(
                    "Cross-workstream inconsistencies in share arithmetic can affect Cover Page, "
                    "Capital Structure and Terms of Issue disclosures."
                ),
                suggested_action=(
                    f"Review the Fresh Issue share count in {conflict_label} against {auth_label}."
                ),
                affected_drhp_chapters=affected,
                open_source_url=workstream_url(auth_ws),
                professional_review_required=False,
                metadata={
                    "provenance": [
                        {
                            "sourceKind": "cross_workstream_conflict",
                            "factDomain": fact_domain,
                            "fieldPath": field_path,
                            "authoritativeWorkstream": auth_ws,
                            "conflictingWorkstream": conflict_ws,
                            "authoritativeValue": auth_value,
                            "conflictingValue": conflict_value,
                            "canonicalSourceLabel": auth_label,
                            "conflictingSourceLabel": conflict_label,
                        }
                    ],
                    "canonicalSource": auth_ws,
                    "conflictingSource": conflict_ws,
                    "authoritativeValue": auth_value,
                    "conflictingValue": conflict_value,
                },
                merge_group=merge_group,
                detected_at=now,
            )
        )

    return issues
