"""Link G4 global issues to facts (G5)."""

from __future__ import annotations

from app.modules.issues_gaps.aggregator import aggregate_global_issues
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.facts_evidence.schemas import RawGlobalFact, RelatedIssueResponse
from sqlalchemy.orm import Session

from app.models.user import User


def _issue_matches_fact(issue: RawGlobalIssue, fact: RawGlobalFact) -> bool:
    if issue.workstream_key and issue.workstream_key == fact.canonical_workstream_key:
        if issue.section_key and issue.section_key == fact.section_key:
            return True
        if issue.record_id and issue.record_id == fact.record_id:
            return True
        if fact.field_path and issue.metadata.get("fieldPath") == fact.field_path:
            return True
    meta = issue.metadata or {}
    if meta.get("factKey") and meta.get("factKey") == fact.metadata.get("factKey"):
        return True
    if "freshIssueShares" in (meta.get("fieldPath") or "") and "freshIssue" in fact.field_path:
        return True
    return False


def build_issue_links(db: Session, user: User, facts: list[RawGlobalFact]) -> dict[str, list[RelatedIssueResponse]]:
    issues = aggregate_global_issues(db, user)
    links: dict[str, list[RelatedIssueResponse]] = {}
    for fact in facts:
        matched: list[RelatedIssueResponse] = []
        for issue in issues:
            if not _issue_matches_fact(issue, fact):
                continue
            matched.append(
                RelatedIssueResponse(
                    issue_id=issue.fingerprint,
                    fingerprint=issue.fingerprint,
                    title=issue.title,
                    severity=issue.severity,
                    lifecycle_state="open",
                    open_url=f"/projects/demo/issues-gaps?issue={issue.fingerprint}",
                )
            )
        if matched:
            links[fact.fingerprint] = matched
    return links
