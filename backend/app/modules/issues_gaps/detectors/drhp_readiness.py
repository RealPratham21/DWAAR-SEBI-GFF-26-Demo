"""Adapt DRHP G1 readiness into global issues (G4)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.generation.readiness_bridge import should_use_g1_legacy
from app.modules.drhp.registry import get_chapter_definition
from app.modules.drhp.service import get_chapter_readiness, list_chapters
from app.modules.issues_gaps.categories import category_from_drhp_requirement
from app.modules.issues_gaps.fingerprints import build_fingerprint
from app.modules.issues_gaps.labels import drhp_chapter_url, workstream_label, workstream_url
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.issues_gaps.severity import severity_from_drhp_requirement


def _requirement_action(label: str, link_href: str | None) -> str:
    if link_href:
        return f"Complete or confirm the source information for {label}."
    return f"Review DRHP readiness requirement: {label}."


def _iter_actionable_requirements(readiness) -> list:
    rows = []
    for bucket in (
        readiness.blocking_requirements,
        readiness.gap_requirements,
        readiness.missing_requirements,
        readiness.unknown_applicability_requirements,
    ):
        rows.extend(bucket or [])
    return rows


def detect_drhp_readiness_issues(db: Session, user: User) -> list[RawGlobalIssue]:
    issues: list[RawGlobalIssue] = []
    now = datetime.now(tz=UTC)

    chapter_list = list_chapters(db, user)
    for item in chapter_list.chapters:
        if item.blocking_count == 0 and item.gap_count == 0 and item.unknown_applicability_count == 0:
            continue

        definition = get_chapter_definition(item.key)
        if definition is None:
            continue

        if should_use_g1_legacy(definition):
            readiness = get_chapter_readiness(db, user, item.key)
            for req in _iter_actionable_requirements(readiness):
                if req.coverage_status in {"satisfied", "not_applicable"}:
                    continue
                if req.applicability == "not_applicable":
                    continue

                link = req.workstream_link
                ws_key = link.slug if link else "company-incorporation"
                section = link.section_id if link else ""
                open_url = link.href if link else workstream_url(ws_key, section=section or None)

                severity = severity_from_drhp_requirement(
                    blocks_generation=req.blocks_generation,
                    classification=req.classification,
                    placeholder_allowed=req.placeholder_allowed,
                    applicability=req.applicability,
                )
                category = category_from_drhp_requirement(
                    classification=req.classification,
                    placeholder_allowed=req.placeholder_allowed,
                )

                title = req.label
                if req.placeholder_allowed and req.classification in {"allowed_placeholder", "placeholder"}:
                    title = f"Allowed DRHP-stage placeholder: {req.label}"
                    description = (
                        "An allowed draft-stage placeholder is present. This is a draft gap, not a filing blocker."
                    )
                elif req.applicability == "unknown":
                    title = f"Applicability review required: {req.label}"
                    description = "Applicability of this requirement is not yet confirmed."
                else:
                    description = req.notes or f"DRHP readiness gap for {req.label}."

                evidence_refs = [
                    ref.model_dump(by_alias=True) if hasattr(ref, "model_dump") else dict(ref)
                    for ref in (req.evidence_refs or [])
                ]

                issues.append(
                    RawGlobalIssue(
                        fingerprint=build_fingerprint(
                            source_kind="drhp_readiness",
                            workstream_key=ws_key,
                            section_key=section or item.key,
                            record_id=req.key,
                            issue_code=req.coverage_status,
                        ),
                        title=title,
                        description=description,
                        category=category,
                        severity=severity,
                        source_kind="drhp_readiness",
                        workstream_key=ws_key,
                        workstream_label=workstream_label(ws_key),
                        section_key=section or item.key,
                        section_label=item.title,
                        record_id=req.key,
                        record_label=req.label,
                        evidence_refs=evidence_refs,
                        why_it_matters=(
                            f"This requirement affects the {item.title} chapter and may weaken disclosure readiness."
                        ),
                        suggested_action=_requirement_action(req.label, open_url),
                        affected_drhp_chapters=[item.key],
                        open_source_url=open_url,
                        open_drhp_url=drhp_chapter_url(item.key),
                        professional_review_required=req.classification
                        in {"professional_confirmation", "review_required"},
                        metadata={
                            "provenance": [
                                {
                                    "sourceKind": "drhp_readiness",
                                    "chapterKey": item.key,
                                    "requirementKey": req.key,
                                    "classification": req.classification,
                                    "coverageStatus": req.coverage_status,
                                }
                            ]
                        },
                        detected_at=now,
                    )
                )
        else:
            if item.blocking_count > 0:
                issues.append(
                    RawGlobalIssue(
                        fingerprint=build_fingerprint(
                            source_kind="drhp_readiness",
                            workstream_key="drhp",
                            section_key=item.key,
                            record_id="blocking",
                            issue_code="chapter_blocking",
                        ),
                        title=f"Blocking DRHP readiness gaps in {item.title}",
                        description=(
                            f"{item.blocking_count} blocking requirement(s) prevent reliable generation "
                            f"for {item.title}."
                        ),
                        category="drhp_readiness",
                        severity="blocking",
                        source_kind="drhp_readiness",
                        workstream_key="drhp",
                        workstream_label="DRHP",
                        section_key=item.key,
                        section_label=item.title,
                        record_id=item.key,
                        record_label=item.title,
                        why_it_matters="Blocking readiness gaps must be addressed before filing-quality disclosure.",
                        suggested_action=f"Review readiness requirements for {item.title}.",
                        affected_drhp_chapters=[item.key],
                        open_source_url=drhp_chapter_url(item.key),
                        open_drhp_url=drhp_chapter_url(item.key),
                        metadata={"provenance": [{"sourceKind": "drhp_readiness", "chapterKey": item.key}]},
                        detected_at=now,
                    )
                )
            elif item.gap_count > 0:
                issues.append(
                    RawGlobalIssue(
                        fingerprint=build_fingerprint(
                            source_kind="drhp_readiness",
                            workstream_key="drhp",
                            section_key=item.key,
                            record_id="gaps",
                            issue_code="chapter_gaps",
                        ),
                        title=f"DRHP readiness gaps in {item.title}",
                        description=(
                            f"{item.gap_count} requirement(s) remain unsatisfied for {item.title}."
                        ),
                        category="drhp_readiness",
                        severity="medium",
                        source_kind="drhp_readiness",
                        workstream_key="drhp",
                        workstream_label="DRHP",
                        section_key=item.key,
                        section_label=item.title,
                        record_id=item.key,
                        record_label=item.title,
                        why_it_matters="Unresolved readiness gaps may weaken chapter disclosure quality.",
                        suggested_action=f"Review source workstreams linked to {item.title}.",
                        affected_drhp_chapters=[item.key],
                        open_source_url=drhp_chapter_url(item.key),
                        open_drhp_url=drhp_chapter_url(item.key),
                        metadata={"provenance": [{"sourceKind": "drhp_readiness", "chapterKey": item.key}]},
                        detected_at=now,
                    )
                )

    return issues
