from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class NotificationResponse(ApiModel):
    id: str
    notification_type: str
    title: str
    message: str
    workstream_slug: str | None = None
    section_id: str | None = None
    target_route: str | None = None
    read_at: datetime | None = None
    created_at: datetime


class NotificationsListResponse(ApiModel):
    notifications: list[NotificationResponse]
    unread_count: int


class SaveAcknowledgementResponse(ApiModel):
    message: str
    saved_at: datetime


class MarkAllReadResponse(ApiModel):
    updated_count: int
