"""Process a claimed structured-extraction run end-to-end."""

from __future__ import annotations

import hashlib
import json
import logging
import time
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.document_processing_run import DocumentProcessingRun
from app.models.document_version import DocumentVersion
from app.models.fact_assertion import FactAssertion
from app.models.fact_evidence_reference import FactEvidenceReference
from app.models.fact_issue import FactIssue, FactIssueAssertion
from app.models.structured_extraction_run import StructuredExtractionRun
from app.models.user import User
from app.modules.company_incorporation.document_processing.service import (
    load_complete_pages_for_run,
    run_is_evidence_ready,
)
from app.modules.company_incorporation.documents.constants import DocumentVersionStatus
from app.modules.company_incorporation.structured_extraction.comparison import (
    build_issues_for_workspace,
    compare_assertion,
)
from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStatus,
    DeterministicStatus,
    IssueAssertionRole,
    IssueStatus,
    ReviewStatus,
    SemanticStatus,
    SourceTemporality,
    StructuredExtractionErrorCode,
    StructuredRunStatus,
)
from app.modules.company_incorporation.structured_extraction.deterministic import (
    run_deterministic_extraction,
)
from app.modules.company_incorporation.structured_extraction.merge import merge_candidates
from app.modules.company_incorporation.structured_extraction.normalize import fingerprint_value
from app.modules.company_incorporation.structured_extraction.provider_base import (
    SemanticDeterministicCandidate,
    SemanticExpectedFact,
    SemanticExtractionBlock,
    SemanticExtractionPage,
    SemanticExtractionRequest,
)
from app.modules.company_incorporation.structured_extraction.provider_cohere import (
    CohereStructuredFactExtractionProvider,
    StructuredExtractionProviderError,
)
from app.modules.company_incorporation.structured_extraction.provider_fake import (
    FakeStructuredFactExtractionProvider,
    build_block_page_map,
    semantic_result_to_candidates,
)
from app.modules.company_incorporation.structured_extraction.quality import score_candidate
from app.modules.company_incorporation.structured_extraction.queue import (
    touch_structured_heartbeat,
)
from app.modules.company_incorporation.structured_extraction.registry import (
    get_fact,
    get_requirement_spec,
)
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    PageBlockIndex,
)
from app.modules.notifications.service import (
    create_structured_extraction_failed_notification,
    create_structured_issue_notification,
)

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _safe_error(message: str, *, limit: int = 500) -> str:
    return " ".join(str(message).split())[:limit]


def _can_promote(
    *,
    run: StructuredExtractionRun,
    version: DocumentVersion | None,
    document: Document | None,
) -> bool:
    if run.status != StructuredRunStatus.RUNNING:
        return False
    if version is None or version.status == DocumentVersionStatus.SUPERSEDED:
        return False
    if document is not None and document.archived_at is not None:
        return False
    return True


def _get_provider(settings: Settings):
    provider_name = (settings.structured_extraction_provider or "cohere").lower()
    if provider_name == "fake":
        return FakeStructuredFactExtractionProvider()
    if provider_name == "cohere":
        return CohereStructuredFactExtractionProvider(settings=settings)
    raise StructuredExtractionProviderError(f"Unsupported provider: {provider_name}")


def process_structured_run(
    db: Session,
    run_id: uuid.UUID,
    *,
    settings: Settings | None = None,
) -> None:
    cfg = settings or get_settings()
    run = db.get(StructuredExtractionRun, run_id)
    if run is None or run.status != StructuredRunStatus.RUNNING:
        return

    version = db.get(DocumentVersion, run.document_version_id)
    document = db.get(Document, version.document_id) if version else None
    processing = db.get(DocumentProcessingRun, run.document_processing_run_id)
    workspace = db.get(CompanyIncorporationWorkspace, run.workspace_id)
    user = db.get(User, version.uploaded_by_user_id) if version else None

    try:
        if not _can_promote(run=run, version=version, document=document):
            _cancel_run(db, run, "Structured extraction aborted: version inactive.")
            return
        if processing is None or version is None or document is None or workspace is None:
            _fail_run(
                db,
                run,
                code=StructuredExtractionErrorCode.INTERNAL_ERROR,
                message="Missing related records for structured extraction.",
            )
            return

        pages = load_complete_pages_for_run(db, processing.id)
        if not run_is_evidence_ready(processing, pages):
            _fail_run(
                db,
                run,
                code=StructuredExtractionErrorCode.NOT_EVIDENCE_READY,
                message="Page-processing run is not evidence-ready.",
            )
            return

        requirement_key = document.requirement_key
        spec = get_requirement_spec(requirement_key)
        if not spec["supported"]:
            _fail_run(
                db,
                run,
                code=StructuredExtractionErrorCode.UNSUPPORTED_REQUIREMENT,
                message="Requirement does not support structured extraction.",
            )
            return

        block_index = PageBlockIndex.from_pages(pages)
        touch_structured_heartbeat(db, run.id)
        db.commit()

        # Deterministic stage
        run.deterministic_status = DeterministicStatus.RUNNING
        db.flush()
        deterministic = run_deterministic_extraction(requirement_key, pages)
        run.deterministic_status = DeterministicStatus.COMPLETED
        touch_structured_heartbeat(db, run.id)
        db.commit()

        run = db.get(StructuredExtractionRun, run_id)
        version = db.get(DocumentVersion, run.document_version_id) if run else None
        document = db.get(Document, version.document_id) if version else None
        if run is None or not _can_promote(run=run, version=version, document=document):
            if run is not None:
                _cancel_run(db, run, "Structured extraction aborted before provider call.")
            return

        semantic_candidates: list[CandidateFact] = []
        missing_fact_keys: list[str] = []
        semantic_warnings: list[str] = []
        provider_latency_ms: int | None = None
        provider_usage: dict[str, Any] = {}

        if run.semantic_status in {SemanticStatus.PENDING, SemanticStatus.RUNNING}:
            if not cfg.structured_extraction_enabled:
                run.semantic_status = SemanticStatus.SKIPPED_DISABLED
            elif not cfg.cohere_api_key and (cfg.structured_extraction_provider or "") == "cohere":
                run.semantic_status = SemanticStatus.FAILED
                semantic_warnings.append("Cohere API key missing; deterministic results retained.")
            else:
                run.semantic_status = SemanticStatus.RUNNING
                db.flush()
                request = _build_semantic_request(
                    requirement_key=requirement_key,
                    expected_fact_keys=spec["expected_fact_keys"],
                    deterministic=deterministic,
                    block_index=block_index,
                )
                try:
                    provider = _get_provider(cfg)
                    started = time.perf_counter()
                    result = provider.extract(request)
                    provider_latency_ms = int((time.perf_counter() - started) * 1000)
                    page_map = build_block_page_map(request)
                    # Prefer block_index mapping
                    page_map = {
                        block.block_id: block.page_id
                        for page in block_index.pages
                        for block in page.blocks
                    }
                    semantic_candidates = semantic_result_to_candidates(result, page_map)
                    missing_fact_keys = [item.fact_key for item in result.missing_expected_facts]
                    semantic_warnings.extend(result.warnings or [])
                    if not result.document_assessment.matches_expected_document_type:
                        semantic_warnings.append("document_content_mismatch")
                    run.semantic_status = SemanticStatus.COMPLETED
                    provider_usage = {"latency_ms": provider_latency_ms, "fact_count": len(result.facts)}
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Semantic extraction failed for run %s: %s", run_id, type(exc).__name__)
                    run.semantic_status = SemanticStatus.FAILED
                    semantic_warnings.append("semantic_provider_failed")
                    run.error_code = StructuredExtractionErrorCode.PROVIDER_ERROR
                    run.error_message = _safe_error(str(exc))

        touch_structured_heartbeat(db, run.id)
        db.commit()

        run = db.get(StructuredExtractionRun, run_id)
        version = db.get(DocumentVersion, run.document_version_id) if run else None
        document = db.get(Document, version.document_id) if version else None
        if run is None or not _can_promote(run=run, version=version, document=document):
            if run is not None:
                _cancel_run(db, run, "Structured extraction aborted before persistence.")
            return

        merged, audit_events = merge_candidates(deterministic, semantic_candidates, block_index)
        scored: list[tuple[CandidateFact, float, str, dict[str, Any]]] = []
        for candidate in merged:
            score, category, signals = score_candidate(candidate, block_index)
            candidate.quality_signals = {**candidate.quality_signals, **signals}
            scored.append((candidate, score, category, signals))

        payload = dict(workspace.payload or {}) if workspace else {}
        low_quality = [
            (candidate, score, category)
            for candidate, score, category, _signals in scored
            if category in {"low", "review_required"}
        ]
        disagreements = [
            event for event in audit_events if event.get("event") == "extractor_disagreement"
        ]
        issue_descriptors = build_issues_for_workspace(
            payload=payload,
            requirement_key=requirement_key,
            merged_candidates=merged,
            missing_fact_keys=missing_fact_keys,
            disagreements=disagreements,
            low_quality=low_quality,
        )
        if "document_content_mismatch" in semantic_warnings:
            issue_descriptors.append(
                {
                    "issue_type": "document_content_mismatch",
                    "fact_key": requirement_key,
                    "severity": "warning",
                    "summary": "Uploaded document may not match the selected requirement",
                    "requirement_key": requirement_key,
                    "document_value": None,
                    "information_value": None,
                    "issue_fingerprint": hashlib.sha256(
                        f"document_content_mismatch:{requirement_key}:{run.document_version_id}".encode()
                    ).hexdigest(),
                    "metadata": {},
                }
            )

        assertion_rows: list[FactAssertion] = []
        for candidate, score, category, signals in scored:
            comparison_status, _hint = compare_assertion(
                candidate.fact_key,
                candidate.normalized_value,
                payload,
            )
            temporality = SourceTemporality.CURRENT
            if comparison_status == ComparisonStatus.POSSIBLE_HISTORICAL:
                temporality = SourceTemporality.HISTORICAL
            assertion = FactAssertion(
                workspace_id=run.workspace_id,
                structured_extraction_run_id=run.id,
                document_version_id=run.document_version_id,
                document_processing_run_id=run.document_processing_run_id,
                requirement_key=requirement_key,
                fact_key=candidate.fact_key,
                value_type=candidate.value_type,
                raw_value=candidate.raw_value,
                normalized_value=candidate.normalized_value,
                display_value=candidate.display_value,
                extractor_kind=candidate.extractor_kind,
                validation_status=candidate.validation_status,
                comparison_status=comparison_status,
                review_status=ReviewStatus.PENDING,
                quality_score=score,
                quality_category=category,
                assertion_fingerprint=_assertion_fingerprint(candidate),
                source_temporality=temporality,
                quality_signals=signals,
            )
            db.add(assertion)
            db.flush()
            assertion_rows.append(assertion)
            _persist_evidence(db, assertion, candidate, block_index, pages)

        created_issues: list[FactIssue] = []
        for descriptor in issue_descriptors:
            existing = db.scalar(
                select(FactIssue).where(
                    FactIssue.workspace_id == run.workspace_id,
                    FactIssue.issue_fingerprint == descriptor["issue_fingerprint"],
                    FactIssue.status.in_(
                        {
                            IssueStatus.OPEN,
                            IssueStatus.AWAITING_CLARIFICATION,
                            IssueStatus.ESCALATED,
                        }
                    ),
                )
            )
            if existing is not None:
                continue
            summary = str(descriptor.get("summary") or "Fact issue requiring review")
            suggested = ["keep_information", "mark_document_historical", "request_clarification"]
            if descriptor["issue_type"] == "conflicting_value":
                suggested = [
                    "keep_information",
                    "accept_document",
                    "reject_document_value",
                    "request_clarification",
                ]
            elif descriptor["issue_type"] in {
                "possible_historical_value",
                "outdated_registration",
            }:
                suggested = [
                    "keep_information",
                    "mark_document_historical",
                    "request_clarification",
                ]
            issue = FactIssue(
                workspace_id=run.workspace_id,
                fact_key=descriptor["fact_key"],
                issue_type=descriptor["issue_type"],
                title=summary[:255],
                description=summary,
                severity=descriptor["severity"],
                blocking=descriptor["severity"] == "blocking",
                status=IssueStatus.OPEN,
                information_value_snapshot=descriptor.get("information_value"),
                information_normalized_snapshot=descriptor.get("information_value"),
                issue_fingerprint=descriptor["issue_fingerprint"],
                suggested_actions=suggested,
            )
            db.add(issue)
            db.flush()
            created_issues.append(issue)
            for assertion in assertion_rows:
                if assertion.fact_key != descriptor["fact_key"]:
                    continue
                if assertion.comparison_status == ComparisonStatus.POSSIBLE_HISTORICAL:
                    role = IssueAssertionRole.HISTORICAL
                elif assertion.comparison_status == ComparisonStatus.CONFLICTING:
                    role = IssueAssertionRole.CONFLICTING
                else:
                    role = IssueAssertionRole.SUPPORTING
                db.add(
                    FactIssueAssertion(
                        issue_id=issue.id,
                        fact_assertion_id=assertion.id,
                        role=role,
                    )
                )

        now = _now()
        warnings = sorted(set((run.warnings or []) + semantic_warnings))
        run.warnings = warnings
        run.provider_latency_ms = provider_latency_ms
        run.provider_usage = provider_usage
        run.audit_metadata = {
            **(run.audit_metadata or {}),
            "requirement_key": requirement_key,
            "deterministic_count": len(deterministic),
            "semantic_count": len(semantic_candidates),
            "merged_count": len(merged),
            "issue_count": len(created_issues),
            "audit_events": audit_events[:50],
        }
        if run.semantic_status == SemanticStatus.FAILED and assertion_rows:
            run.status = StructuredRunStatus.COMPLETED_WITH_WARNINGS
        elif not assertion_rows and run.semantic_status == SemanticStatus.FAILED:
            run.status = StructuredRunStatus.FAILED
        else:
            run.status = StructuredRunStatus.COMPLETED
        run.completed_at = now
        run.updated_at = now
        run.heartbeat_at = now
        if run.status != StructuredRunStatus.FAILED:
            run.error_code = None if run.status == StructuredRunStatus.COMPLETED else run.error_code
            if run.status == StructuredRunStatus.COMPLETED:
                run.error_message = None
        db.flush()

        if user is not None:
            if run.status == StructuredRunStatus.FAILED:
                create_structured_extraction_failed_notification(
                    db,
                    user=user,
                    requirement_name=requirement_key,
                    structured_run_id=run.id,
                    saved_at=now,
                )
            for issue in created_issues:
                if issue.severity in {"warning", "blocking"}:
                    create_structured_issue_notification(
                        db,
                        user=user,
                        issue=issue,
                        saved_at=now,
                    )
        db.commit()
        logger.info(
            "Structured extraction run %s finished status=%s assertions=%s issues=%s",
            run.id,
            run.status,
            len(assertion_rows),
            len(created_issues),
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Structured extraction failed for %s", run_id)
        db.rollback()
        run = db.get(StructuredExtractionRun, run_id)
        if run is None or run.status == StructuredRunStatus.CANCELLED:
            return
        _fail_run(
            db,
            run,
            code=StructuredExtractionErrorCode.INTERNAL_ERROR,
            message="Structured extraction failed unexpectedly.",
            detail=str(exc),
        )


def _build_semantic_request(
    *,
    requirement_key: str,
    expected_fact_keys: list[str],
    deterministic: list[CandidateFact],
    block_index: PageBlockIndex,
) -> SemanticExtractionRequest:
    expected = []
    for fact_key in expected_fact_keys:
        definition = get_fact(fact_key)
        expected.append(
            SemanticExpectedFact(
                factKey=fact_key,
                valueType=definition.value_type,
                displayLabel=definition.display_label,
                labelAliases=list(definition.label_aliases),
            )
        )
    det_payload = [
        SemanticDeterministicCandidate(
            factKey=item.fact_key,
            valueType=item.value_type,
            normalizedValue=item.normalized_value,
            displayValue=item.display_value,
            validationStatus=item.validation_status,
            evidenceBlockIds=[cite.block_id for cite in item.evidence],
        )
        for item in deterministic
    ]
    pages = [
        SemanticExtractionPage(
            pageId=page.page_id,
            pageNumber=page.page_number,
            extractionMethod=page.extraction_method,
            blocks=[
                SemanticExtractionBlock(
                    blockId=block.block_id,
                    orderIndex=block.order_index,
                    text=block.text,
                    bbox=block.bbox,
                )
                for block in page.blocks
            ],
        )
        for page in block_index.pages
    ]
    return SemanticExtractionRequest(
        requirementKey=requirement_key,
        expectedFacts=expected,
        deterministicCandidates=det_payload,
        pages=pages,
    )


def _assertion_fingerprint(candidate: CandidateFact) -> str:
    payload = {
        "fact_key": candidate.fact_key,
        "normalized": fingerprint_value(candidate.normalized_value),
        "blocks": sorted(cite.block_id for cite in candidate.evidence),
        "kind": candidate.extractor_kind,
    }
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()


def _persist_evidence(
    db: Session,
    assertion: FactAssertion,
    candidate: CandidateFact,
    block_index: PageBlockIndex,
    pages: list[DocumentPage],
) -> None:
    pages_by_id = {str(page.id): page for page in pages}
    seen: set[tuple[str, str]] = set()
    for cite in candidate.evidence:
        key = (cite.block_id, cite.role)
        if key in seen:
            continue
        seen.add(key)
        block = block_index.get_block(cite.block_id)
        page = pages_by_id.get(cite.page_id)
        if block is None or page is None:
            continue
        # Validate block exists in persisted page JSON
        persisted_ids = {
            str(item.get("block_id") or item.get("blockId") or "")
            for item in (page.text_blocks or [])
            if isinstance(item, dict)
        }
        if cite.block_id not in persisted_ids:
            continue
        db.add(
            FactEvidenceReference(
                fact_assertion_id=assertion.id,
                document_page_id=page.id,
                block_id=cite.block_id,
                evidence_role=cite.role,
                quote_snapshot=block.text,
                bbox_snapshot=dict(block.bbox),
                page_number=page.page_number,
                extraction_method=page.extraction_method,
                ocr_confidence=block.confidence
                if block.confidence is not None
                else page.average_ocr_confidence,
                block_order_index=block.order_index,
            )
        )


def _cancel_run(db: Session, run: StructuredExtractionRun, reason: str) -> None:
    if run.status == StructuredRunStatus.CANCELLED:
        db.commit()
        return
    now = _now()
    run.status = StructuredRunStatus.CANCELLED
    run.error_code = StructuredExtractionErrorCode.CANCELLED
    run.error_message = reason
    run.completed_at = now
    run.updated_at = now
    db.commit()


def _fail_run(
    db: Session,
    run: StructuredExtractionRun,
    *,
    code: str,
    message: str,
    detail: str | None = None,
) -> None:
    if detail:
        logger.error("Structured run %s failed: %s", run.id, detail)
    now = _now()
    run.status = StructuredRunStatus.FAILED
    run.error_code = code
    run.error_message = _safe_error(message)
    run.completed_at = now
    run.updated_at = now
    db.commit()
