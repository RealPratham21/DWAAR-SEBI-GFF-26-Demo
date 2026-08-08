"""Merge duplicate global issues from multiple detectors (G4)."""

from __future__ import annotations

from app.modules.issues_gaps.schemas import RawGlobalIssue


def _merge_issue(existing: RawGlobalIssue, incoming: RawGlobalIssue) -> RawGlobalIssue:
    source_kinds = sorted(set(existing.source_kinds or [existing.source_kind]) | {incoming.source_kind})
    chapters = sorted(set(existing.affected_drhp_chapters) | set(incoming.affected_drhp_chapters))
    metadata = dict(existing.metadata)
    supporting = list(metadata.get("supportingReasons") or [])
    supporting.append(
        {
            "sourceKind": incoming.source_kind,
            "description": incoming.description,
            "severity": incoming.severity,
        }
    )
    metadata["supportingReasons"] = supporting
    metadata.setdefault("provenance", []).extend(
        incoming.metadata.get("provenance") or [{"sourceKind": incoming.source_kind}]
    )

    severity_rank = {"blocking": 4, "high": 3, "medium": 2, "low": 1}
    severity = (
        incoming.severity
        if severity_rank.get(incoming.severity, 0) > severity_rank.get(existing.severity, 0)
        else existing.severity
    )

    return RawGlobalIssue(
        fingerprint=existing.fingerprint,
        title=existing.title,
        description=existing.description,
        category=existing.category,
        severity=severity,
        source_kind=existing.source_kind,
        source_kinds=source_kinds,
        workstream_key=existing.workstream_key or incoming.workstream_key,
        workstream_label=existing.workstream_label or incoming.workstream_label,
        section_key=existing.section_key or incoming.section_key,
        section_label=existing.section_label or incoming.section_label,
        record_id=existing.record_id or incoming.record_id,
        record_label=existing.record_label or incoming.record_label,
        source_refs=existing.source_refs or incoming.source_refs,
        evidence_refs=existing.evidence_refs or incoming.evidence_refs,
        why_it_matters=existing.why_it_matters or incoming.why_it_matters,
        suggested_action=existing.suggested_action or incoming.suggested_action,
        affected_drhp_chapters=chapters,
        open_source_url=existing.open_source_url or incoming.open_source_url,
        open_drhp_url=existing.open_drhp_url or incoming.open_drhp_url,
        professional_review_required=(
            existing.professional_review_required or incoming.professional_review_required
        ),
        metadata=metadata,
        merge_group=existing.merge_group,
        detected_at=existing.detected_at or incoming.detected_at,
    )


def deduplicate_issues(issues: list[RawGlobalIssue]) -> list[RawGlobalIssue]:
    by_fingerprint: dict[str, RawGlobalIssue] = {}
    by_merge_group: dict[str, str] = {}

    for issue in issues:
        if not issue.source_kinds:
            issue.source_kinds = [issue.source_kind]

        if issue.fingerprint in by_fingerprint:
            by_fingerprint[issue.fingerprint] = _merge_issue(by_fingerprint[issue.fingerprint], issue)
            continue

        if issue.merge_group and issue.merge_group in by_merge_group:
            existing_fp = by_merge_group[issue.merge_group]
            by_fingerprint[existing_fp] = _merge_issue(by_fingerprint[existing_fp], issue)
            continue

        by_fingerprint[issue.fingerprint] = issue
        if issue.merge_group:
            by_merge_group[issue.merge_group] = issue.fingerprint

    return list(by_fingerprint.values())
