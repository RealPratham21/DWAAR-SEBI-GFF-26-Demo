"""DRHP HTTP routes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.drhp import service as drhp_service
from app.modules.drhp.schemas import (
    ChapterListResponse,
    ChapterReadinessResponse,
    SourceSnapshotResponse,
)

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
