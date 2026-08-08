"""Adapt persisted DRHP generation state into global issues (G4)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.drhp_document import DrhpChapterVersion, DrhpDocument, DrhpDocumentVersion
from app.models.user import User
from app.modules.drhp.constants import CHAPTER_TITLES
from app.modules.issues_gaps.constants import GENERATION_WARNING_MESSAGES
from app.modules.issues_gaps.fingerprints import build_fingerprint
from app.modules.issues_gaps.labels import drhp_chapter_url
from app.modules.issues_gaps.schemas import RawGlobalIssue
from app.modules.issues_gaps.severity import severity_from_generation_status


def _humanize_warning(code: str, chapter_title: str) -> tuple[str, str]:
    base = code.split(":", 1)[0]
    if base == "unsupported_number":
        return (
            "Untraceable numeric value in generated chapter",
            GENERATION_WARNING_MESSAGES["unsupported_number"],
        )
    if base == "prohibited_claim":
        return (
            "Wording requires professional review",
            GENERATION_WARNING_MESSAGES["prohibited_claim"],
        )
    if base == "unknown_source_ref":
        return (
            "Generated content references unknown source",
            GENERATION_WARNING_MESSAGES["unknown_source_ref"],
        )
    if base == "unauthorized_placeholder":
        return (
            f"Unresolved placeholder in {chapter_title}",
            f"An unresolved placeholder appears in {chapter_title} although the source "
            "requirement does not permit one.",
        )
    if base in GENERATION_WARNING_MESSAGES:
        return ("Generation validation warning", GENERATION_WARNING_MESSAGES[base])
    return ("Generated chapter requires review", f"Review generated content for {chapter_title}.")


def detect_drhp_generation_issues(db: Session, user: User) -> list[RawGlobalIssue]:
    issues: list[RawGlobalIssue] = []
    now = datetime.now(tz=UTC)

    document = db.scalar(select(DrhpDocument).where(DrhpDocument.user_id == user.id))
    if document is None:
        return issues

    doc_version = db.scalar(
        select(DrhpDocumentVersion)
        .where(DrhpDocumentVersion.document_id == document.id)
        .order_by(DrhpDocumentVersion.version_number.desc())
    )
    if doc_version is None:
        return issues

    chapter_rows = db.scalars(
        select(DrhpChapterVersion).where(
            DrhpChapterVersion.document_version_id == doc_version.id,
        )
    ).all()

    seen_warnings: set[tuple[str, str]] = set()
    for row in chapter_rows:
        chapter_title = CHAPTER_TITLES.get(row.chapter_key, row.chapter_key)
        status = str(row.status or "")
        if status in {"failed", "blocked"}:
            issues.append(
                RawGlobalIssue(
                    fingerprint=build_fingerprint(
                        source_kind="drhp_generation",
                        workstream_key="drhp",
                        section_key=row.chapter_key,
                        record_id=str(doc_version.id),
                        issue_code=f"status:{status}",
                    ),
                    title=f"Chapter generation {status}: {chapter_title}",
                    description=row.error_message or f"{chapter_title} did not complete generation.",
                    category="generation_warning",
                    severity=severity_from_generation_status(status),
                    source_kind="drhp_generation",
                    workstream_key="drhp",
                    workstream_label="DRHP",
                    section_key=row.chapter_key,
                    section_label=chapter_title,
                    record_id=str(doc_version.id),
                    record_label=f"Version {doc_version.version_number}",
                    why_it_matters="Incomplete chapter generation leaves gaps in the draft DRHP.",
                    suggested_action="Review source readiness and regenerate the affected chapter.",
                    affected_drhp_chapters=[row.chapter_key],
                    open_source_url=drhp_chapter_url(row.chapter_key),
                    open_drhp_url=drhp_chapter_url(row.chapter_key),
                    metadata={
                        "provenance": [
                            {
                                "sourceKind": "drhp_generation",
                                "chapterKey": row.chapter_key,
                                "documentVersionId": str(doc_version.id),
                                "status": status,
                            }
                        ]
                    },
                    detected_at=now,
                )
            )

        for warning in list(row.generation_warnings or []) + list(row.validation_warnings or []):
            warning_key = str(warning)
            dedupe_key = (row.chapter_key, warning_key.split(":", 1)[0])
            if dedupe_key in seen_warnings:
                continue
            seen_warnings.add(dedupe_key)

            title, description = _humanize_warning(warning_key, chapter_title)
            issues.append(
                RawGlobalIssue(
                    fingerprint=build_fingerprint(
                        source_kind="drhp_generation",
                        workstream_key="drhp",
                        section_key=row.chapter_key,
                        record_id=str(doc_version.id),
                        issue_code=warning_key.split(":", 1)[0],
                    ),
                    title=title,
                    description=description,
                    category="generation_warning",
                    severity="medium",
                    source_kind="drhp_generation",
                    workstream_key="drhp",
                    workstream_label="DRHP",
                    section_key=row.chapter_key,
                    section_label=chapter_title,
                    record_id=str(doc_version.id),
                    record_label=f"Version {doc_version.version_number}",
                    why_it_matters="Generation warnings may indicate draft content that requires review before filing.",
                    suggested_action="Review the generated chapter and underlying source data.",
                    affected_drhp_chapters=[row.chapter_key],
                    open_source_url=drhp_chapter_url(row.chapter_key),
                    open_drhp_url=drhp_chapter_url(row.chapter_key),
                    metadata={
                        "provenance": [
                            {
                                "sourceKind": "drhp_generation",
                                "chapterKey": row.chapter_key,
                                "warningCode": warning_key,
                            }
                        ]
                    },
                    detected_at=now,
                )
            )

    return issues
