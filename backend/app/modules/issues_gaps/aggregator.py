"""Aggregate all G4 issue detectors."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.issues_gaps.deduplication import deduplicate_issues
from app.modules.issues_gaps.detectors.ci import detect_company_incorporation_issues
from app.modules.issues_gaps.detectors.conflicts import detect_cross_workstream_conflicts
from app.modules.issues_gaps.detectors.drhp_generation import detect_drhp_generation_issues
from app.modules.issues_gaps.detectors.drhp_readiness import detect_drhp_readiness_issues
from app.modules.issues_gaps.detectors.staleness import detect_stale_draft_issue
from app.modules.issues_gaps.detectors.workstream import detect_workstream_assessment_issues
from app.modules.issues_gaps.schemas import RawGlobalIssue


def aggregate_global_issues(db: Session, user: User) -> list[RawGlobalIssue]:
    collected: list[RawGlobalIssue] = []
    collected.extend(detect_workstream_assessment_issues(db, user))
    collected.extend(detect_company_incorporation_issues(db, user))
    collected.extend(detect_cross_workstream_conflicts(db, user))
    collected.extend(detect_drhp_readiness_issues(db, user))
    collected.extend(detect_drhp_generation_issues(db, user))
    collected.extend(detect_stale_draft_issue(db, user))
    return deduplicate_issues(collected)
