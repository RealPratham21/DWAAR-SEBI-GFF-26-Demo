from datetime import UTC, datetime, timedelta

from fastapi import Response

from app.core.config import Settings


def refresh_cookie_max_age(*, remember_me: bool, settings: Settings) -> int:
    days = (
        settings.refresh_token_remember_me_expire_days
        if remember_me
        else settings.refresh_token_expire_days
    )
    return days * 24 * 60 * 60


def refresh_expires_at(*, remember_me: bool, settings: Settings) -> datetime:
    days = (
        settings.refresh_token_remember_me_expire_days
        if remember_me
        else settings.refresh_token_expire_days
    )
    return datetime.now(tz=UTC) + timedelta(days=days)


def set_refresh_cookie(
    response: Response,
    *,
    refresh_token: str,
    remember_me: bool,
    settings: Settings,
) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        max_age=refresh_cookie_max_age(remember_me=remember_me, settings=settings),
        path=settings.refresh_cookie_path,
        domain=settings.refresh_cookie_domain,
    )


def clear_refresh_cookie(response: Response, *, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        domain=settings.refresh_cookie_domain,
    )
