from fastapi import Depends, Header
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.exceptions import AppException
from app.db.session import get_db
from app.models.user import User
from app.modules.auth.constants import AuthErrorCode
from app.modules.auth.tokens import decode_access_token, validate_access_payload


async def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    if authorization is None or not authorization.startswith("Bearer "):
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_ACCESS_TOKEN,
            message="Access token is invalid or expired.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_ACCESS_TOKEN,
            message="Access token is invalid or expired.",
        )

    try:
        payload = decode_access_token(token, settings)
        user_id = validate_access_payload(payload)
    except (InvalidTokenError, ValueError):
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_ACCESS_TOKEN,
            message="Access token is invalid or expired.",
        ) from None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise AppException(
            status_code=401,
            code=AuthErrorCode.INVALID_ACCESS_TOKEN,
            message="Access token is invalid or expired.",
        )

    return user
