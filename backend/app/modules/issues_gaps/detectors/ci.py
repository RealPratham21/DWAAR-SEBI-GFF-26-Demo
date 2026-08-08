"""Adapt Company & Incorporation fact issues into global issues (G4)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.company_incorporation.structured_extraction.service import (
    OPEN_ISSUE_STATUSES,
    get_issue_detail,
    list_issues,
)
from app.modules.drhp.mapping.impact import get_affected_chapters_for_workstream
from app.modules.issues_gaps.categories import category_from_ci_issue_type
from app.modules.issues_gaps.fingerprints import build_fingerprint
from app.modules.issues_gaps.labels import ci_issue_url, workstream_label
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.issues_gaps.severity import severity_from_ci_issue


def detect_company_incorporation_issues(db: Session, user: User) -> list[RawGlobalIssue]:
    issues: list[RawGlobalIssue] = []
    now = datetime.now(tz=UTC)

    try:
        listing = list_issues(db, user)
    except Exception:
        return issues

    for summary in listing.issues:
        if summary.status not in OPEN_ISSUE_STATUSES:
            continue

        detail = get_issue_detail(db, user, uuid.UUID(str(summary.id)))
        evidence_refs: list[dict] = []
        for link in detail.linked_assertions:
            if not link.document_id:
                continue
            evidence_refs.append(
                {
                    "documentId": link.document_id,
                    "documentVersionId": link.document_version_id,
                    "originalFilename": link.original_filename,
                    "pageNumbers": list(link.page_numbers or []),
                    "requirementKey": link.requirement_key,
                    "requirementLabel": link.requirement_label,
                }
            )

        issue_id = str(summary.id)
        issues.append(
            RawGlobalIssue(
                fingerprint=build_fingerprint(
                    source_kind="company_incorporation_issue",
                    workstream_key="company-incorporation",
                    section_key=summary.fact_key,
                    record_id=issue_id,
                    issue_code=summary.issue_type,
                ),
                title=summary.title,
                description=detail.description,
                category=category_from_ci_issue_type(summary.issue_type),
                severity=severity_from_ci_issue(severity=summary.severity, blocking=summary.blocking),
                source_kind="company_incorporation_issue",
                workstream_key="company-incorporation",
                workstream_label=workstream_label("company-incorporation"),
                section_key=summary.fact_key,
                section_label=summary.fact_key.replace(".", " → ").replace("_", " "),
                record_id=issue_id,
                record_label=summary.title,
                evidence_refs=evidence_refs,
                why_it_matters=(
                    "Document-backed issuer facts must be consistent before they can support DRHP "
                    "disclosures and regulatory filings."
                ),
                suggested_action=(
                    detail.suggested_actions[0]
                    if detail.suggested_actions
                    else "Review the evidence and resolve the discrepancy in Company & Incorporation."
                ),
                affected_drhp_chapters=list(get_affected_chapters_for_workstream("company-incorporation")),
                open_source_url=ci_issue_url(issue_id),
                professional_review_required=summary.blocking,
                metadata={
                    "provenance": [
                        {
                            "sourceKind": "company_incorporation_issue",
                            "issueId": issue_id,
                            "issueType": summary.issue_type,
                            "factKey": summary.fact_key,
                            "status": summary.status,
                        }
                    ]
                },
                detected_at=now,
            )
        )

    return issues
