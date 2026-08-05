import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.user import User
from app.models.user_notification import UserNotification
from app.modules.notifications.constants import (
    COMPANY_INCORPORATION_SLUG,
    DEFAULT_NOTIFICATION_LIMIT,
    DOCUMENT_ARCHIVE_TITLE,
    DOCUMENT_REPLACE_TITLE,
    DOCUMENT_UPLOAD_TITLE,
    IPO_SETUP_SAVE_MESSAGE,
    IPO_SETUP_SECTION_SAVE_TITLES,
    IPO_SETUP_SLUG,
    MAX_NOTIFICATION_LIMIT,
    SECTION_SAVE_TITLES,
    STRUCTURED_EXTRACTION_FAILED_PREFIX,
    STRUCTURED_ISSUE_TITLE_PREFIX,
    WORKSTREAM_SAVE_MESSAGE,
    NotificationErrorCode,
    NotificationType,
    build_company_incorporation_documents_route,
    build_company_incorporation_facts_route,
    build_company_incorporation_questions_route,
    build_company_incorporation_target_route,
    build_ipo_setup_target_route,
)
from app.modules.notifications.schemas import (
    MarkAllReadResponse,
    NotificationResponse,
    NotificationsListResponse,
)


def _now() -> datetime:
    return datetime.now(tz=UTC)


def _to_response(notification: UserNotification) -> NotificationResponse:
    return NotificationResponse(
        id=str(notification.id),
        notification_type=notification.notification_type,
        title=notification.title,
        message=notification.message,
        workstream_slug=notification.workstream_slug,
        section_id=notification.section_id,
        target_route=notification.target_route,
        read_at=notification.read_at,
        created_at=notification.created_at,
    )


def to_notification_response(notification: UserNotification) -> NotificationResponse:
    return _to_response(notification)


def _unread_count(db: Session, user_id: uuid.UUID) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(UserNotification)
            .where(
                UserNotification.user_id == user_id,
                UserNotification.read_at.is_(None),
            ),
        )
        or 0,
    )


def create_workstream_save_notification(
    db: Session,
    *,
    user: User,
    section_id: str,
    saved_at: datetime,
) -> UserNotification:
    title = SECTION_SAVE_TITLES.get(section_id)
    if title is None:
        msg = f"Unsupported Company & Incorporation section: {section_id}"
        raise ValueError(msg)

    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_SAVE,
        title=title,
        message=WORKSTREAM_SAVE_MESSAGE,
        workstream_slug=COMPANY_INCORPORATION_SLUG,
        section_id=section_id,
        target_route=build_company_incorporation_target_route(section_id),
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def create_ipo_setup_save_notification(
    db: Session,
    *,
    user: User,
    section_id: str,
    saved_at: datetime,
) -> UserNotification:
    title = IPO_SETUP_SECTION_SAVE_TITLES.get(section_id)
    if title is None:
        msg = f"Unsupported IPO Setup section: {section_id}"
        raise ValueError(msg)

    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_SAVE,
        title=title,
        message=IPO_SETUP_SAVE_MESSAGE,
        workstream_slug=IPO_SETUP_SLUG,
        section_id=section_id,
        target_route=build_ipo_setup_target_route(section_id),
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def _create_document_notification(
    db: Session,
    *,
    user: User,
    title: str,
    message: str,
    saved_at: datetime,
) -> UserNotification:
    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_DOCUMENT,
        title=title,
        message=message,
        workstream_slug=COMPANY_INCORPORATION_SLUG,
        section_id="documents",
        target_route=build_company_incorporation_documents_route(),
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def create_document_upload_notification(
    db: Session,
    *,
    user: User,
    requirement_name: str,
    saved_at: datetime,
) -> UserNotification:
    from app.modules.company_incorporation.documents.constants import DOCUMENT_UPLOAD_MESSAGE

    return _create_document_notification(
        db,
        user=user,
        title=f"{DOCUMENT_UPLOAD_TITLE}: {requirement_name}",
        message=DOCUMENT_UPLOAD_MESSAGE,
        saved_at=saved_at,
    )


def create_document_replace_notification(
    db: Session,
    *,
    user: User,
    requirement_name: str,
    saved_at: datetime,
) -> UserNotification:
    from app.modules.company_incorporation.documents.constants import DOCUMENT_REPLACE_MESSAGE

    return _create_document_notification(
        db,
        user=user,
        title=f"{DOCUMENT_REPLACE_TITLE}: {requirement_name}",
        message=DOCUMENT_REPLACE_MESSAGE,
        saved_at=saved_at,
    )


def create_document_archive_notification(
    db: Session,
    *,
    user: User,
    requirement_name: str,
    saved_at: datetime,
) -> UserNotification:
    from app.modules.company_incorporation.documents.constants import DOCUMENT_ARCHIVE_MESSAGE

    return _create_document_notification(
        db,
        user=user,
        title=f"{DOCUMENT_ARCHIVE_TITLE}: {requirement_name}",
        message=DOCUMENT_ARCHIVE_MESSAGE,
        saved_at=saved_at,
    )


def _processing_notification_route(processing_run_id: uuid.UUID) -> str:
    base = build_company_incorporation_documents_route()
    return f"{base}&processingRunId={processing_run_id}"


def _find_processing_notification(
    db: Session,
    *,
    user_id: uuid.UUID,
    processing_run_id: uuid.UUID,
) -> UserNotification | None:
    route = _processing_notification_route(processing_run_id)
    return db.scalar(
        select(UserNotification).where(
            UserNotification.user_id == user_id,
            UserNotification.target_route == route,
        )
    )


def create_document_processing_success_notification(
    db: Session,
    *,
    user: User,
    requirement_name: str,
    processing_run_id: uuid.UUID,
    saved_at: datetime,
) -> UserNotification | None:
    existing = _find_processing_notification(
        db,
        user_id=user.id,
        processing_run_id=processing_run_id,
    )
    if existing is not None:
        return existing

    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_DOCUMENT,
        title=f"{requirement_name} processed",
        message=f"{requirement_name} was processed successfully.",
        workstream_slug=COMPANY_INCORPORATION_SLUG,
        section_id="documents",
        target_route=_processing_notification_route(processing_run_id),
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def create_document_processing_failed_notification(
    db: Session,
    *,
    user: User,
    requirement_name: str,
    processing_run_id: uuid.UUID,
    saved_at: datetime,
) -> UserNotification | None:
    from app.modules.notifications.constants import DOCUMENT_PROCESSING_FAILED_PREFIX

    existing = _find_processing_notification(
        db,
        user_id=user.id,
        processing_run_id=processing_run_id,
    )
    if existing is not None:
        return existing

    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_DOCUMENT,
        title=f"{DOCUMENT_PROCESSING_FAILED_PREFIX} {requirement_name}",
        message=f"{requirement_name} could not be processed. You can retry processing later.",
        workstream_slug=COMPANY_INCORPORATION_SLUG,
        section_id="documents",
        target_route=_processing_notification_route(processing_run_id),
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def create_structured_extraction_failed_notification(
    db: Session,
    *,
    user: User,
    requirement_name: str,
    document_version_id: uuid.UUID,
    saved_at: datetime,
) -> UserNotification | None:
    route = build_company_incorporation_facts_route(document_version_id=str(document_version_id))
    existing = db.scalar(
        select(UserNotification).where(
            UserNotification.user_id == user.id,
            UserNotification.target_route == route,
        )
    )
    if existing is not None:
        return existing
    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_DOCUMENT,
        title=f"{STRUCTURED_EXTRACTION_FAILED_PREFIX} {requirement_name}",
        message=(
            f"Fact extraction for {requirement_name} did not complete successfully. "
            "You can retry structured extraction later."
        ),
        workstream_slug=COMPANY_INCORPORATION_SLUG,
        section_id="facts",
        target_route=route,
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def create_structured_issue_notification(
    db: Session,
    *,
    user: User,
    issue: object,
    saved_at: datetime,
) -> UserNotification | None:
    issue_id = str(issue.id)
    route = build_company_incorporation_questions_route(issue_id=issue_id)
    existing = db.scalar(
        select(UserNotification).where(
            UserNotification.user_id == user.id,
            UserNotification.target_route == route,
        )
    )
    if existing is not None:
        return existing
    title = str(getattr(issue, "title", "Fact issue"))
    notification = UserNotification(
        user_id=user.id,
        notification_type=NotificationType.WORKSTREAM_DOCUMENT,
        title=f"{STRUCTURED_ISSUE_TITLE_PREFIX}: {title}"[:255],
        message=str(getattr(issue, "description", "A document fact needs review.")),
        workstream_slug=COMPANY_INCORPORATION_SLUG,
        section_id="questions",
        target_route=route,
        read_at=None,
        created_at=saved_at,
        updated_at=saved_at,
    )
    db.add(notification)
    db.flush()
    db.refresh(notification)
    return notification


def list_notifications(
    db: Session,
    user: User,
    *,
    limit: int = DEFAULT_NOTIFICATION_LIMIT,
) -> NotificationsListResponse:
    bounded_limit = min(max(limit, 1), MAX_NOTIFICATION_LIMIT)
    notifications = db.scalars(
        select(UserNotification)
        .where(UserNotification.user_id == user.id)
        .order_by(UserNotification.created_at.desc())
        .limit(bounded_limit),
    ).all()
    return NotificationsListResponse(
        notifications=[_to_response(item) for item in notifications],
        unread_count=_unread_count(db, user.id),
    )


def get_owned_notification(
    db: Session,
    user: User,
    notification_id: uuid.UUID,
) -> UserNotification:
    notification = db.scalar(
        select(UserNotification).where(
            UserNotification.id == notification_id,
            UserNotification.user_id == user.id,
        ),
    )
    if notification is None:
        raise AppException(
            status_code=404,
            code=NotificationErrorCode.NOT_FOUND,
            message="Notification not found.",
        )
    return notification


def mark_notification_read(
    db: Session,
    user: User,
    notification_id: uuid.UUID,
) -> NotificationResponse:
    notification = get_owned_notification(db, user, notification_id)
    if notification.read_at is None:
        now = _now()
        notification.read_at = now
        notification.updated_at = now
        db.flush()
        db.refresh(notification)
    return _to_response(notification)


def mark_all_notifications_read(db: Session, user: User) -> MarkAllReadResponse:
    now = _now()
    result = db.execute(
        update(UserNotification)
        .where(
            UserNotification.user_id == user.id,
            UserNotification.read_at.is_(None),
        )
        .values(read_at=now, updated_at=now),
    )
    db.flush()
    return MarkAllReadResponse(updated_count=result.rowcount or 0)
