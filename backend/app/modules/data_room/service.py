"""Global Data Room service layer (G6)."""

from __future__ import annotations

from app.core.exceptions import AppException
from app.models.user import User
from app.modules.data_room.aggregator import aggregate_data_room
from app.modules.data_room.constants import (
    DOC_STATUS_LABELS,
    ORIGIN_COMPANY_INCORPORATION,
    ORIGIN_DATA_ROOM,
    PROCESSING_CAPABILITY_LABELS,
    PROCESSING_DOCUMENT_EXTRACTION,
    REQUIREMENT_NOT_APPLICABLE,
    REQUIREMENT_NOT_PROVIDED,
    REQUIREMENT_PROVIDED,
    REQUIREMENT_REVIEW_APPLICABILITY,
    REQUIREMENT_STATUS_LABELS,
)
from app.modules.data_room.drhp_bridge import drhp_usage_summaries
from app.modules.data_room.generic_service import (
    DataRoomErrorCode,
    create_download_url,
    finalize_upload,
    initiate_new_version,
    initiate_upload,
)
from app.modules.data_room.global_ids import encode_dr_document_id, parse_global_document_id
from app.models.data_room_stored_document import DataRoomStoredDocument
from app.modules.data_room.labels import facts_evidence_url, section_label, workstream_label, workstream_url
from app.modules.data_room.requirements_registry import REQUIREMENT_REGISTRY
from app.modules.data_room.schemas import (
    DataRoomDocumentListResponse,
    DataRoomDocumentResponse,
    DataRoomRequirementListResponse,
    DataRoomRequirementResponse,
    DataRoomSummaryResponse,
    DocumentVersionSummaryResponse,
    DownloadUrlResponse,
    FinalizeUploadResponse,
    InitiateUploadRequest,
    InitiateUploadResponse,
    InitiateVersionUploadRequest,
    InspectionSummary,
    RawDataRoomDocument,
    RawDataRoomRequirement,
    RelatedIssueSummary,
)
from sqlalchemy.orm import Session


class DataRoomServiceErrorCode:
    DOCUMENT_NOT_FOUND = DataRoomErrorCode.DOCUMENT_NOT_FOUND
    REQUIREMENT_NOT_FOUND = DataRoomErrorCode.REQUIREMENT_NOT_FOUND


def _matches_search(*, haystack: str, needle: str) -> bool:
    return needle.lower() in haystack.lower()


def _document_search_blob(document: RawDataRoomDocument) -> str:
    requirement = REQUIREMENT_REGISTRY.get(document.requirement_key or "")
    requirement_title = requirement.title if requirement else ""
    return " ".join(
        [
            document.title,
            document.filename,
            document.category,
            document.workstream_key,
            workstream_label(document.workstream_key),
            requirement_title,
        ]
    )


def _requirement_search_blob(requirement: RawDataRoomRequirement) -> str:
    return " ".join(
        [
            requirement.title,
            requirement.category,
            requirement.purpose,
            requirement.workstream_key,
            workstream_label(requirement.workstream_key),
        ]
    )


def _to_version_summaries(document: RawDataRoomDocument) -> list[DocumentVersionSummaryResponse]:
    versions: list[DocumentVersionSummaryResponse] = []
    for item in document.version_history:
        versions.append(
            DocumentVersionSummaryResponse(
                version_number=int(item.get("versionNumber") or 0),
                original_filename=str(item.get("originalFilename") or ""),
                content_type=str(item.get("contentType") or ""),
                size_bytes=int(item.get("sizeBytes") or 0),
                status=str(item.get("status") or ""),
                uploaded_at=item.get("uploadedAt"),
                is_current=bool(item.get("isCurrent")),
                note=str(item.get("note") or ""),
            )
        )
    return versions


def _to_document_response(
    document: RawDataRoomDocument,
    *,
    issue_links: list[RelatedIssueSummary] | None = None,
) -> DataRoomDocumentResponse:
    related_raw = document.metadata.get("relatedIssues") or []
    related = issue_links or [
        RelatedIssueSummary(
            issue_id=str(item.get("issueId") or ""),
            title=str(item.get("title") or ""),
            severity=str(item.get("severity") or ""),
            open_url=str(item.get("openUrl") or ""),
        )
        for item in related_raw
        if isinstance(item, dict)
    ]
    inspection_raw = document.metadata.get("inspection")
    inspection = InspectionSummary.model_validate(inspection_raw) if inspection_raw else None
    has_fact_lineage = document.fact_count > 0 or document.evidence_count > 0
    open_facts = facts_evidence_url(workstream=document.workstream_key) if has_fact_lineage else ""

    return DataRoomDocumentResponse(
        global_document_id=document.global_document_id,
        origin_type=document.origin_type,
        title=document.title,
        filename=document.filename,
        category=document.category,
        mime_type=document.mime_type,
        file_size=document.file_size,
        workstream_key=document.workstream_key,
        workstream_label=workstream_label(document.workstream_key),
        section_key=document.section_key,
        section_label=section_label(document.section_key),
        requirement_key=document.requirement_key,
        current_version=document.current_version,
        status=document.status,
        status_label=DOC_STATUS_LABELS.get(document.status, document.status.replace("_", " ").title()),
        processing_capability=document.processing_capability,
        processing_capability_label=PROCESSING_CAPABILITY_LABELS.get(
            document.processing_capability,
            document.processing_capability,
        ),
        uploaded_at=document.uploaded_at,
        updated_at=document.updated_at,
        fact_count=document.fact_count,
        evidence_count=document.evidence_count,
        issue_count=document.issue_count,
        drhp_usage_count=document.drhp_usage_count,
        open_url=document.open_url,
        open_workstream_url=workstream_url(document.workstream_key, section_key=document.section_key or None),
        open_facts_url=open_facts,
        versions=_to_version_summaries(document),
        related_issues=related,
        drhp_usage=drhp_usage_summaries(document),
        inspection=inspection,
        metadata=document.metadata,
    )


def _to_requirement_response(requirement: RawDataRoomRequirement) -> DataRoomRequirementResponse:
    return DataRoomRequirementResponse(
        requirement_key=requirement.requirement_key,
        workstream_key=requirement.workstream_key,
        workstream_label=workstream_label(requirement.workstream_key),
        category=requirement.category,
        title=requirement.title,
        purpose=requirement.purpose,
        expected_stage=requirement.expected_stage,
        applicability=requirement.applicability_state,
        status=requirement.status,
        status_label=REQUIREMENT_STATUS_LABELS.get(requirement.status, requirement.status),
        matched_document_ids=requirement.matched_document_ids,
        linked_issue_ids=requirement.linked_issue_ids,
        professional_confirmation_required=requirement.professional_confirmation_required,
        evidence_pipeline_capability=requirement.evidence_pipeline_capability,
        open_workstream_url=requirement.open_workstream_url,
        open_upload=requirement.status
        in {REQUIREMENT_NOT_PROVIDED, REQUIREMENT_REVIEW_APPLICABILITY},
    )


def build_summary(db: Session, user: User) -> DataRoomSummaryResponse:
    ctx = aggregate_data_room(db, user)
    applicable = [
        req
        for req in ctx.requirements
        if req.applicability_state != REQUIREMENT_NOT_APPLICABLE
    ]
    provided = [
        req
        for req in applicable
        if req.status in {REQUIREMENT_PROVIDED, "partially_provided"}
    ]
    missing = [req for req in applicable if req.status == REQUIREMENT_NOT_PROVIDED]
    review = [req for req in ctx.requirements if req.status == REQUIREMENT_REVIEW_APPLICABILITY]

    return DataRoomSummaryResponse(
        total_documents=len(ctx.documents),
        current_versions=len(ctx.documents),
        document_backed_documents=sum(
            1 for doc in ctx.documents if doc.processing_capability == PROCESSING_DOCUMENT_EXTRACTION
        ),
        stored_only_documents=sum(
            1 for doc in ctx.documents if doc.processing_capability != PROCESSING_DOCUMENT_EXTRACTION
        ),
        applicable_requirements=len(applicable),
        provided_requirements=len(provided),
        missing_requirements=len(missing),
        review_applicability_requirements=len(review),
        documents_used_in_drhp=sum(1 for doc in ctx.documents if doc.drhp_usage_count > 0),
        documents_with_issues=sum(1 for doc in ctx.documents if doc.issue_count > 0),
    )


def list_documents(
    db: Session,
    user: User,
    *,
    search: str | None = None,
    workstream: str | None = None,
    status: str | None = None,
    capability: str | None = None,
    used_in_drhp: bool | None = None,
    page: int = 1,
    page_size: int = 50,
) -> DataRoomDocumentListResponse:
    ctx = aggregate_data_room(db, user)
    documents = ctx.documents

    if workstream:
        documents = [doc for doc in documents if doc.workstream_key == workstream]
    if status:
        documents = [doc for doc in documents if doc.status == status]
    if capability:
        documents = [doc for doc in documents if doc.processing_capability == capability]
    if used_in_drhp is True:
        documents = [doc for doc in documents if doc.drhp_usage_count > 0]
    elif used_in_drhp is False:
        documents = [doc for doc in documents if doc.drhp_usage_count == 0]
    if search:
        documents = [doc for doc in documents if _matches_search(haystack=_document_search_blob(doc), needle=search)]

    total = len(documents)
    start = (page - 1) * page_size
    page_items = documents[start : start + page_size]
    return DataRoomDocumentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        documents=[_to_document_response(doc) for doc in page_items],
    )


def get_document(db: Session, user: User, global_document_id: str) -> DataRoomDocumentResponse:
    ctx = aggregate_data_room(db, user)
    for document in ctx.documents:
        if document.global_document_id == global_document_id:
            return _to_document_response(document)
    raise AppException(404, DataRoomServiceErrorCode.DOCUMENT_NOT_FOUND, "Document not found.")


def list_requirements(
    db: Session,
    user: User,
    *,
    search: str | None = None,
    workstream: str | None = None,
    status: str | None = None,
) -> DataRoomRequirementListResponse:
    ctx = aggregate_data_room(db, user)
    requirements = ctx.requirements

    if workstream:
        requirements = [req for req in requirements if req.workstream_key == workstream]
    if status:
        requirements = [req for req in requirements if req.status == status]
    if search:
        requirements = [
            req
            for req in requirements
            if _matches_search(haystack=_requirement_search_blob(req), needle=search)
        ]

    return DataRoomRequirementListResponse(
        total=len(requirements),
        requirements=[_to_requirement_response(req) for req in requirements],
    )


def get_requirement(db: Session, user: User, requirement_key: str) -> DataRoomRequirementResponse:
    ctx = aggregate_data_room(db, user)
    for requirement in ctx.requirements:
        if requirement.requirement_key == requirement_key:
            return _to_requirement_response(requirement)
    raise AppException(404, DataRoomServiceErrorCode.REQUIREMENT_NOT_FOUND, "Requirement not found.")


def post_initiate_upload(
    db: Session,
    user: User,
    body: InitiateUploadRequest,
) -> InitiateUploadResponse:
    document, version, upload_url = initiate_upload(
        db,
        user,
        workstream_key=body.workstream_key,
        requirement_key=body.requirement_key,
        title=body.title,
        category=body.category,
        filename=body.filename,
        content_type=body.content_type,
        size_bytes=body.size_bytes,
        checksum_sha256=body.checksum_sha256,
        note=body.note,
    )
    return InitiateUploadResponse(
        global_document_id=encode_dr_document_id(document.id),
        document_id=str(document.id),
        version_id=str(version.id),
        upload_url=upload_url,
        storage_key=version.storage_key,
    )


def post_initiate_version_upload(
    db: Session,
    user: User,
    global_document_id: str,
    body: InitiateVersionUploadRequest,
) -> InitiateUploadResponse:
    origin, doc_id = parse_global_document_id(global_document_id)
    if origin != ORIGIN_DATA_ROOM:
        raise AppException(
            422,
            DataRoomErrorCode.INVALID_FILE_TYPE,
            "Version uploads for Company & Incorporation documents use the C&I pipeline.",
        )
    version, upload_url = initiate_new_version(
        db,
        user,
        doc_id,
        filename=body.filename,
        content_type=body.content_type,
        size_bytes=body.size_bytes,
        checksum_sha256=body.checksum_sha256,
        note=body.note,
    )
    return InitiateUploadResponse(
        global_document_id=global_document_id,
        document_id=str(version.document_id),
        version_id=str(version.id),
        upload_url=upload_url,
        storage_key=version.storage_key,
    )


def post_finalize_upload(db: Session, user: User, version_id: str) -> FinalizeUploadResponse:
    import uuid

    version = finalize_upload(db, user, uuid.UUID(version_id))
    document = db.get(DataRoomStoredDocument, version.document_id)
    if document is None:
        raise AppException(404, DataRoomErrorCode.DOCUMENT_NOT_FOUND, "Document not found.")
    return FinalizeUploadResponse(
        global_document_id=encode_dr_document_id(document.id),
        status=document.status,
        current_version=version.version_number,
    )


def get_download_url(db: Session, user: User, global_document_id: str) -> DownloadUrlResponse:
    url = create_download_url(db, user, global_document_id)
    return DownloadUrlResponse(download_url=url, expires_in_seconds=900)
