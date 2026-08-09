"""Link G4 issues to Data Room documents and requirements (G6)."""

from __future__ import annotations

from app.models.user import User
from app.modules.data_room.labels import issues_url
from app.modules.data_room.schemas import RawDataRoomDocument, RelatedIssueSummary
from app.modules.issues_gaps.aggregator import aggregate_global_issues
from app.modules.issues_gaps.schemas import RawGlobalIssue
from sqlalchemy.orm import Session


def _issue_matches_document(issue: RawGlobalIssue, document: RawDataRoomDocument) -> bool:
    meta = issue.metadata or {}
    if meta.get("documentId") == document.origin_document_id:
        return True
    if meta.get("requirementKey") and meta.get("requirementKey") == document.requirement_key:
        return True
    if issue.workstream_key == document.workstream_key and issue.category in {
        "document_readiness",
        "evidence_gap",
    }:
        if document.requirement_key and issue.section_key:
            return issue.section_key in (document.section_key or "")
    return False


def _issue_matches_requirement(issue: RawGlobalIssue, requirement_key: str, workstream_key: str) -> bool:
    meta = issue.metadata or {}
    if meta.get("requirementKey") == requirement_key:
        return True
    if issue.workstream_key == workstream_key and issue.category in {"document_readiness", "evidence_gap"}:
        return True
    return False


def build_document_issue_links(
    db: Session,
    user: User,
    documents: list[RawDataRoomDocument],
) -> dict[str, list[RelatedIssueSummary]]:
    issues = aggregate_global_issues(db, user)
    links: dict[str, list[RelatedIssueSummary]] = {}
    for document in documents:
        matched: list[RelatedIssueSummary] = []
        for issue in issues:
            if not _issue_matches_document(issue, document):
                continue
            matched.append(
                RelatedIssueSummary(
                    issue_id=issue.fingerprint,
                    title=issue.title,
                    severity=issue.severity,
                    open_url=issues_url(issue.fingerprint),
                )
            )
        document.issue_count = len(matched)
        if matched:
            links[document.global_document_id] = matched
            document.metadata["relatedIssues"] = [
                {
                    "issueId": item.issue_id,
                    "title": item.title,
                    "severity": item.severity,
                    "openUrl": item.open_url,
                }
                for item in matched
            ]
    return links


def build_requirement_issue_links(
    db: Session,
    user: User,
    requirements: list,
) -> dict[str, list[str]]:
    issues = aggregate_global_issues(db, user)
    links: dict[str, list[str]] = {}
    for requirement in requirements:
        matched: list[str] = []
        for issue in issues:
            if _issue_matches_requirement(issue, requirement.requirement_key, requirement.workstream_key):
                matched.append(issue.fingerprint)
        if matched:
            links[requirement.requirement_key] = matched
            requirement.linked_issue_ids = matched
    return links
