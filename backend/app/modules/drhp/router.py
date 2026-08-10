"""DRHP HTTP routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.drhp import service as drhp_service
from app.modules.drhp.generation.runner import schedule_document_generation
from app.modules.drhp.schemas import (
    ChapterListResponse,
    ChapterReadinessResponse,
    ChapterSourceBundleResponse,
    DocumentGenerationStatusResponse,
    DrhpDocumentSummaryResponse,
    GenerateDrhpRequest,
    GenerateDrhpResponse,
    GeneratedChapterResponse,
    GenerationSnapshotDetailResponse,
    GenerationSnapshotSummaryResponse,
    SnapshotStalenessResponse,
    SourceSnapshotResponse,
)
from app.modules.drhp.copilot.schemas import CopilotChatRequest, CopilotChatResponse
from app.modules.drhp.copilot.service import copilot_chat

router = APIRouter(prefix="/drhp", tags=["drhp"])


@router.get("/chapters", response_model=ChapterListResponse)
def list_chapters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChapterListResponse:
    return drhp_service.list_chapters(db, current_user)


@router.get("/chapters/{chapter_key}/readiness", response_model=ChapterReadinessResponse)
def get_chapter_readiness(
    chapter_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChapterReadinessResponse:
    return drhp_service.get_chapter_readiness(db, current_user, chapter_key)


@router.post(
    "/chapters/{chapter_key}/source-snapshots",
    response_model=SourceSnapshotResponse,
)
def create_source_snapshot(
    chapter_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SourceSnapshotResponse:
    response = drhp_service.create_source_snapshot(db, current_user, chapter_key)
    db.commit()
    return response


@router.get("/source-snapshots/{snapshot_id}", response_model=SourceSnapshotResponse)
def get_source_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SourceSnapshotResponse:
    return drhp_service.get_source_snapshot(db, current_user, snapshot_id)


@router.post("/generation-snapshots", response_model=GenerationSnapshotSummaryResponse)
def create_generation_snapshot(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerationSnapshotSummaryResponse:
    response = drhp_service.create_generation_snapshot_for_user(db, current_user)
    db.commit()
    return response


@router.get(
    "/generation-snapshots/{snapshot_id}",
    response_model=GenerationSnapshotDetailResponse,
)
def get_generation_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerationSnapshotDetailResponse:
    return drhp_service.get_generation_snapshot_detail(db, current_user, snapshot_id)


@router.get(
    "/generation-snapshots/{snapshot_id}/chapter-sources/{chapter_key}",
    response_model=ChapterSourceBundleResponse,
)
def get_chapter_source_bundle(
    snapshot_id: UUID,
    chapter_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChapterSourceBundleResponse:
    return drhp_service.get_chapter_source_bundle_for_snapshot(
        db,
        current_user,
        snapshot_id,
        chapter_key,
    )


@router.get(
    "/generation-snapshots/{snapshot_id}/staleness",
    response_model=SnapshotStalenessResponse,
)
def get_generation_snapshot_staleness(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SnapshotStalenessResponse:
    return drhp_service.get_snapshot_staleness(db, current_user, snapshot_id)


@router.post("/generate", response_model=GenerateDrhpResponse)
def start_drhp_generation(
    body: GenerateDrhpRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GenerateDrhpResponse:
    request = body or GenerateDrhpRequest()
    response = drhp_service.start_drhp_generation(
        db,
        current_user,
        snapshot_id=request.snapshot_id,
        create_snapshot=request.create_snapshot,
    )
    db.commit()
    schedule_document_generation(response.document_version_id)
    return response


@router.get("/documents/latest", response_model=DrhpDocumentSummaryResponse | None)
def get_latest_document(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DrhpDocumentSummaryResponse | None:
    return drhp_service.get_latest_drhp_document(db, current_user)


@router.get(
    "/documents/{document_version_id}/status",
    response_model=DocumentGenerationStatusResponse,
)
def get_document_generation_status(
    document_version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentGenerationStatusResponse:
    return drhp_service.get_document_generation_status(db, current_user, document_version_id)


@router.get(
    "/documents/{document_version_id}/chapters/{chapter_key}",
    response_model=GeneratedChapterResponse,
)
def get_generated_chapter(
    document_version_id: UUID,
    chapter_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeneratedChapterResponse:
    return drhp_service.get_generated_chapter(db, current_user, document_version_id, chapter_key)


@router.post("/copilot/chat", response_model=CopilotChatResponse)
def post_copilot_chat(
    body: CopilotChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CopilotChatResponse:
    return copilot_chat(db, current_user, body)


@router.get("/documents/{document_version_id}/export/pdf")
def export_drhp_pdf(
    document_version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    from app.modules.drhp.export.service import render_document_export

    payload, filename, mime_type = render_document_export(
        db,
        current_user,
        document_version_id,
        "pdf",
    )
    return Response(
        content=payload,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/documents/{document_version_id}/export/docx")
def export_drhp_docx(
    document_version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    from app.modules.drhp.export.service import render_document_export

    payload, filename, mime_type = render_document_export(
        db,
        current_user,
        document_version_id,
        "docx",
    )
    return Response(
        content=payload,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/documents/{document_version_id}/audit")
def audit_document_generation(
    document_version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Development diagnostic — generation fidelity audit (G2R)."""
    from app.core.config import get_settings
    from app.modules.drhp.generation.generation_audit import audit_document_generation as run_audit

    settings = get_settings()
    if settings.app_env not in {"development", "local", "dev"} and not settings.debug:
        from app.core.exceptions import AppException

        raise AppException(status_code=404, code="NOT_FOUND", message="Not found.")
    doc = drhp_service.get_document_generation_status(db, current_user, document_version_id)
    if doc is None:
        from app.core.exceptions import AppException

        raise AppException(status_code=404, code="NOT_FOUND", message="Document not found.")
    return run_audit(db, document_version_id)
