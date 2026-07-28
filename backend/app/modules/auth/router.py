from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.exceptions import AppException
from app.db.session import get_db
from app.models.user import User
from app.modules.auth.constants import AuthErrorCode
from app.modules.auth.cookies import clear_refresh_cookie, set_refresh_cookie
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    MeResponse,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.modules.auth.service import (
    get_client_ip,
    get_me_response,
    login_user,
    logout_user,
    refresh_access_token,
    register_user,
)

router = APIRouter()


def _commit_or_raise_duplicate_email(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise AppException(
            status_code=409,
            code=AuthErrorCode.EMAIL_ALREADY_REGISTERED,
            message="An account with this email already exists.",
        ) from exc


@router.post("/register", response_model=RegisterResponse)
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RegisterResponse:
    body, refresh_token = register_user(
        db,
        payload,
        settings=settings,
        user_agent=request.headers.get("user-agent"),
        ip_address=get_client_ip(request),
    )
    _commit_or_raise_duplicate_email(db)
    set_refresh_cookie(
        response,
        refresh_token=refresh_token,
        remember_me=payload.remember_me,
        settings=settings,
    )
    return body


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    body, refresh_token = login_user(
        db,
        payload,
        settings=settings,
        user_agent=request.headers.get("user-agent"),
        ip_address=get_client_ip(request),
    )
    db.commit()
    set_refresh_cookie(
        response,
        refresh_token=refresh_token,
        remember_me=payload.remember_me,
        settings=settings,
    )
    return body


@router.post("/refresh", response_model=RefreshResponse)
def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RefreshResponse:
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    body, new_refresh_token, remember_me = refresh_access_token(
        db,
        refresh_token=refresh_token,
        settings=settings,
        user_agent=request.headers.get("user-agent"),
        ip_address=get_client_ip(request),
    )
    db.commit()
    set_refresh_cookie(
        response,
        refresh_token=new_refresh_token,
        remember_me=remember_me,
        settings=settings,
    )
    return body


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> LogoutResponse:
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    logout_user(db, refresh_token=refresh_token)
    db.commit()
    clear_refresh_cookie(response, settings=settings)
    return LogoutResponse()


@router.get("/me", response_model=MeResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeResponse:
    return get_me_response(db, current_user)
