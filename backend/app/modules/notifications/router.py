import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.notifications.constants import DEFAULT_NOTIFICATION_LIMIT, MAX_NOTIFICATION_LIMIT
from app.modules.notifications.schemas import (
    MarkAllReadResponse,
    NotificationResponse,
    NotificationsListResponse,
)
from app.modules.notifications.service import (
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsListResponse)
def get_notifications(
    limit: int = Query(default=DEFAULT_NOTIFICATION_LIMIT, ge=1, le=MAX_NOTIFICATION_LIMIT),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationsListResponse:
    response = list_notifications(db, current_user, limit=limit)
    db.commit()
    return response


@router.patch("/read-all", response_model=MarkAllReadResponse)
def patch_notifications_read_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MarkAllReadResponse:
    response = mark_all_notifications_read(db, current_user)
    db.commit()
    return response


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def patch_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    response = mark_notification_read(db, current_user, notification_id)
    db.commit()
    return response
