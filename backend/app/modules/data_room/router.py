"""Global Data Room API routes (G6)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.data_room.schemas import (
    DataRoomDocumentListResponse,
    DataRoomDocumentResponse,
    DataRoomRequirementListResponse,
    DataRoomRequirementResponse,
    DataRoomSummaryResponse,
    DownloadUrlResponse,
    FinalizeUploadRequest,
    FinalizeUploadResponse,
    InitiateUploadRequest,
    InitiateUploadResponse,
    InitiateVersionUploadRequest,
)
from app.modules.data_room.service import (
    build_summary,
    get_document,
    get_download_url,
    get_requirement,
    list_documents,
    list_requirements,
    post_finalize_upload,
    post_initiate_upload,
    post_initiate_version_upload,
)

router = APIRouter(prefix="/data-room", tags=["data-room"])


@router.get("/summary", response_model=DataRoomSummaryResponse)
def get_data_room_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataRoomSummaryResponse:
    return build_summary(db, current_user)


@router.get("/requirements", response_model=DataRoomRequirementListResponse)
def get_data_room_requirements(
    search: str | None = Query(default=None),
    workstream: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataRoomRequirementListResponse:
    return list_requirements(
        db,
        current_user,
        search=search,
        workstream=workstream,
        status=status,
    )


@router.get("/requirements/{requirement_key}", response_model=DataRoomRequirementResponse)
def get_data_room_requirement(
    requirement_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataRoomRequirementResponse:
    return get_requirement(db, current_user, requirement_key)


@router.get("/documents", response_model=DataRoomDocumentListResponse)
def get_data_room_documents(
    search: str | None = Query(default=None),
    workstream: str | None = Query(default=None),
    status: str | None = Query(default=None),
    capability: str | None = Query(default=None),
    used_in_drhp: bool | None = Query(default=None, alias="usedInDrhp"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200, alias="pageSize"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataRoomDocumentListResponse:
    return list_documents(
        db,
        current_user,
        search=search,
        workstream=workstream,
        status=status,
        capability=capability,
        used_in_drhp=used_in_drhp,
        page=page,
        page_size=page_size,
    )


@router.get("/documents/{global_document_id}", response_model=DataRoomDocumentResponse)
def get_data_room_document(
    global_document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataRoomDocumentResponse:
    return get_document(db, current_user, global_document_id)


@router.post("/documents", response_model=InitiateUploadResponse)
def post_data_room_document_upload(
    body: InitiateUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InitiateUploadResponse:
    response = post_initiate_upload(db, current_user, body)
    db.commit()
    return response


@router.post("/documents/{global_document_id}/versions", response_model=InitiateUploadResponse)
def post_data_room_document_version(
    global_document_id: str,
    body: InitiateVersionUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InitiateUploadResponse:
    response = post_initiate_version_upload(db, current_user, global_document_id, body)
    db.commit()
    return response


@router.post("/documents/versions/{version_id}/finalize", response_model=FinalizeUploadResponse)
def post_data_room_finalize_upload(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinalizeUploadResponse:
    response = post_finalize_upload(db, current_user, str(version_id))
    db.commit()
    return response


@router.get("/documents/{global_document_id}/download", response_model=DownloadUrlResponse)
def get_data_room_document_download(
    global_document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DownloadUrlResponse:
    return get_download_url(db, current_user, global_document_id)
