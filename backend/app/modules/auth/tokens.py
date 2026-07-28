import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from jwt.exceptions import InvalidTokenError

from app.core.config import Settings


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(*, user_id: uuid.UUID, settings: Settings) -> tuple[str, int]:
    expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    now = datetime.now(tz=UTC)
    expires_at = now + expires_delta
    payload = {
        "sub": str(user_id),
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, int(expires_delta.total_seconds())


def decode_access_token(token: str, settings: Settings) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )


def validate_access_payload(payload: dict) -> uuid.UUID:
    if payload.get("type") != "access":
        msg = "Invalid access token type"
        raise InvalidTokenError(msg)
    subject = payload.get("sub")
    if not subject:
        msg = "Missing access token subject"
        raise InvalidTokenError(msg)
    return uuid.UUID(str(subject))
