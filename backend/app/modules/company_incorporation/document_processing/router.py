import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.company_incorporation.document_processing.schemas import (
    DocumentPagesResponse,
    ProcessingHistoryResponse,
    ProcessingStatusResponse,
    RetryProcessingResponse,
)
from app.modules.company_incorporation.document_processing.service import (
    get_page_results,
    get_processing_history,
    get_processing_status,
    retry_processing,
)

router = APIRouter(
    prefix="/workstreams/company-incorporation/documents",
    tags=["company-incorporation-document-processing"],
)


@router.get(
    "/versions/{version_id}/processing",
    response_model=ProcessingStatusResponse,
)
def get_version_processing_status(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProcessingStatusResponse:
    return get_processing_status(db, current_user, version_id)


@router.get(
    "/versions/{version_id}/processing/history",
    response_model=ProcessingHistoryResponse,
)
def get_version_processing_history(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProcessingHistoryResponse:
    return get_processing_history(db, current_user, version_id)


@router.get(
    "/versions/{version_id}/processing/pages",
    response_model=DocumentPagesResponse,
)
def get_version_processing_pages(
    version_id: uuid.UUID,
    include_content: bool = Query(default=False),
    offset: int = Query(default=0, ge=0),
    limit: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentPagesResponse:
    return get_page_results(
        db,
        current_user,
        version_id,
        include_content=include_content,
        offset=offset,
        limit=limit,
    )


@router.post(
    "/versions/{version_id}/processing/retry",
    response_model=RetryProcessingResponse,
)
def post_version_processing_retry(
    version_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetryProcessingResponse:
    response = retry_processing(db, current_user, version_id)
    db.commit()
    return response
