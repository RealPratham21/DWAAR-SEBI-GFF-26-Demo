"""Deterministic next-action prioritization for dashboard (G8)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.modules.data_room.constants import REQUIREMENT_NOT_APPLICABLE, REQUIREMENT_NOT_PROVIDED
from app.modules.drhp.constants import DocumentVersionStatus


@dataclass(slots=True)
class DashboardNextAction:
    id: str
    priority: int
    title: str
    description: str
    source_type: str
    workstream_key: str | None
    issue_id: str | None
    action_label: str
    href: str


SEVERITY_RANK = {"blocking": 0, "high": 1, "medium": 2, "low": 3}


def _workstream_href(workstream_key: str) -> str:
    if workstream_key == "company-incorporation":
        return "/projects/demo/workstreams/company-incorporation?tab=information"
    return f"/projects/demo/workstreams/{workstream_key}?tab=information"


def build_dashboard_next_actions(
    *,
    issues: list[Any],
    workstreams: list[dict[str, Any]],
    requirements: list[Any],
    drhp_exists: bool,
    drhp_stale: bool,
    drhp_status: str | None,
    drhp_affected_chapters: int,
    professional_review_count: int,
    max_items: int = 5,
) -> list[DashboardNextAction]:
    actions: list[DashboardNextAction] = []
    used_issue_ids: set[str] = set()
    used_workstreams: set[str] = set()

    open_issues = [issue for issue in issues if getattr(issue, "lifecycle_state", "open") != "cleared"]

    def add(action: DashboardNextAction) -> None:
        if len(actions) >= max_items:
            return
        if action.issue_id and action.issue_id in used_issue_ids:
            return
        if action.source_type == "workstream" and action.workstream_key in used_workstreams:
            return
        actions.append(action)
        if action.issue_id:
            used_issue_ids.add(action.issue_id)
        if action.source_type == "workstream" and action.workstream_key:
            used_workstreams.add(action.workstream_key)

    sorted_issues = sorted(
        open_issues,
        key=lambda issue: (
            SEVERITY_RANK.get(getattr(issue, "severity", "low"), 9),
            0 if getattr(issue, "professional_review_required", False) else 1,
        ),
    )

    for issue in sorted_issues:
        if getattr(issue, "severity", "") != "blocking":
            continue
        add(
            DashboardNextAction(
                id=f"issue-{issue.fingerprint}",
                priority=1,
                title=issue.title,
                description=issue.why_it_matters or issue.description,
                source_type="issue",
                workstream_key=issue.workstream_key or None,
                issue_id=issue.fingerprint,
                action_label="Open issue",
                href=issue.open_source_url or f"/projects/demo/issues-gaps?issue={issue.fingerprint}",
            )
        )

    for issue in sorted_issues:
        if getattr(issue, "severity", "") != "high":
            continue
        add(
            DashboardNextAction(
                id=f"issue-{issue.fingerprint}",
                priority=2,
                title=issue.title,
                description=issue.suggested_action or issue.description,
                source_type="issue",
                workstream_key=issue.workstream_key or None,
                issue_id=issue.fingerprint,
                action_label="Review",
                href=issue.open_source_url or f"/projects/demo/issues-gaps?issue={issue.fingerprint}",
            )
        )

    incomplete = [
        ws
        for ws in workstreams
        if ws.get("overallStatus") != "complete" and ws.get("overallStatus") != "not_started"
    ]
    incomplete.sort(key=lambda ws: (ws.get("sectionsComplete", 0) / max(ws.get("totalSections") or 1, 1)))
    for ws in incomplete[:1]:
        key = ws["workstreamKey"]
        if any(getattr(i, "workstream_key", "") == key for i in sorted_issues[:3]):
            continue
        add(
            DashboardNextAction(
                id=f"workstream-{key}",
                priority=3,
                title=f"Continue {ws['workstreamLabel']}",
                description=(
                    f"{ws.get('sectionsComplete', 0)} of {ws.get('totalSections', 0)} "
                    "Information sections complete."
                ),
                source_type="workstream",
                workstream_key=key,
                issue_id=None,
                action_label="Open workstream",
                href=_workstream_href(key),
            )
        )

    missing_by_ws: dict[str, list[Any]] = {}
    for req in requirements:
        if getattr(req, "applicability_state", "") == REQUIREMENT_NOT_APPLICABLE:
            continue
        if getattr(req, "status", "") != REQUIREMENT_NOT_PROVIDED:
            continue
        missing_by_ws.setdefault(req.workstream_key, []).append(req)

    for ws_key, reqs in sorted(missing_by_ws.items(), key=lambda item: -len(item[1])):
        if ws_key in used_workstreams:
            continue
        req = reqs[0]
        add(
            DashboardNextAction(
                id=f"document-{req.requirement_key}",
                priority=4,
                title=f"Upload {req.title}",
                description=req.purpose or "Supporting document is still expected.",
                source_type="data_room",
                workstream_key=ws_key,
                issue_id=None,
                action_label="Upload",
                href=f"/projects/demo/data-room?workstream={ws_key}&status=not_provided",
            )
        )
        break

    if professional_review_count > 0:
        add(
            DashboardNextAction(
                id="professional-review",
                priority=5,
                title="Review professional-confirmation items",
                description=f"{professional_review_count} items need confirmation before filing.",
                source_type="professional",
                workstream_key=None,
                issue_id=None,
                action_label="Review",
                href="/projects/demo/issues-gaps?category=professional_confirmation",
            )
        )

    if drhp_stale and drhp_exists:
        add(
            DashboardNextAction(
                id="drhp-stale",
                priority=6,
                title="Regenerate DRHP draft",
                description=(
                    f"Source information changed since the last draft."
                    + (f" {drhp_affected_chapters} chapters may be affected." if drhp_affected_chapters else "")
                ),
                source_type="drhp",
                workstream_key=None,
                issue_id=None,
                action_label="Open DRHP",
                href="/projects/demo/drhp",
            )
        )

    if drhp_status == DocumentVersionStatus.GENERATED_WITH_WARNINGS:
        add(
            DashboardNextAction(
                id="drhp-warnings",
                priority=7,
                title="Review DRHP generation warnings",
                description="Latest draft was generated with warnings that may need attention.",
                source_type="drhp",
                workstream_key=None,
                issue_id=None,
                action_label="View draft",
                href="/projects/demo/drhp",
            )
        )

    for issue in sorted_issues:
        if getattr(issue, "severity", "") != "medium":
            continue
        if not getattr(issue, "professional_review_required", False):
            continue
        add(
            DashboardNextAction(
                id=f"issue-{issue.fingerprint}",
                priority=8,
                title=issue.title,
                description=issue.suggested_action or "Professional review recommended.",
                source_type="issue",
                workstream_key=issue.workstream_key or None,
                issue_id=issue.fingerprint,
                action_label="Review",
                href=issue.open_source_url or f"/projects/demo/issues-gaps?issue={issue.fingerprint}",
            )
        )

    if not drhp_exists:
        add(
            DashboardNextAction(
                id="drhp-generate",
                priority=9,
                title="Generate Draft DRHP",
                description="Create the first draft once core workstream information is in place.",
                source_type="drhp",
                workstream_key=None,
                issue_id=None,
                action_label="Generate",
                href="/projects/demo/drhp",
            )
        )

    return sorted(actions, key=lambda item: item.priority)[:max_items]
