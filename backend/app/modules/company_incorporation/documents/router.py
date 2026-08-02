import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.company_incorporation.documents.pipeline_summary import (
    get_document_pipeline_summary,
)
from app.modules.company_incorporation.documents.pipeline_summary_schemas import (
    DocumentPipelineSummaryResponse,
)
from app.modules.company_incorporation.documents.schemas import (
    ArchiveDocumentResponse,
    DiscardUploadResponse,
    DocumentsListResponse,
    DownloadUrlResponse,
    FinalizeUploadResponse,
    InitiateUploadRequest,
    InitiateUploadResponse,
    VersionHistoryResponse,
)
from app.modules.company_incorporation.documents.service import (
    archive_document,
    create_download_url,
    discard_upload,
    finalize_upload,
    initiate_upload,
    list_documents,
    list_version_history,
)

router = APIRouter(
    prefix="/workstreams/company-incorporation/documents",
    tags=["company-incorporation-documents"],
)


@router.get("", response_model=DocumentsListResponse)
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentsListResponse:
    response = list_documents(db, current_user)
    db.commit()
    return response


@router.get("/pipeline-summary", response_model=DocumentPipelineSummaryResponse)
def get_pipeline_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentPipelineSummaryResponse:
    return get_document_pipeline_summary(db, current_user)


@router.post("/uploads/initiate", response_model=InitiateUploadResponse)
def post_initiate_upload(
    body: InitiateUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InitiateUploadResponse:
    response = initiate_upload(db, current_user, body)
    db.commit()
    return response


@router.post("/versions/{version_id}/finalize", response_model=FinalizeUploadResponse)
def post_finalize_upload(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinalizeUploadResponse:
    response = finalize_upload(db, current_user, version_id)
    db.commit()
    return response


@router.post("/versions/{version_id}/download-url", response_model=DownloadUrlResponse)
def post_download_url(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DownloadUrlResponse:
    return create_download_url(db, current_user, version_id)


@router.get("/{document_id}/versions", response_model=VersionHistoryResponse)
def get_version_history(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VersionHistoryResponse:
    return list_version_history(db, current_user, document_id)


@router.post("/{document_id}/archive", response_model=ArchiveDocumentResponse)
def post_archive_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArchiveDocumentResponse:
    response = archive_document(db, current_user, document_id)
    db.commit()
    return response


@router.delete("/versions/{version_id}", response_model=DiscardUploadResponse)
def delete_discard_upload(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DiscardUploadResponse:
    response = discard_upload(db, current_user, version_id)
    db.commit()
    return response
