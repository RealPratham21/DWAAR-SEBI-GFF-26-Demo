"""Development/test-only endpoints. Disabled unless ENABLE_DEV_SEED=true."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.modules.dev.service import assert_dev_seed_allowed, seed_nivara_ready_user

router = APIRouter(prefix="/dev", tags=["dev"])


class SeedNivaraRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    full_name: str | None = Field(default=None, alias="fullName", min_length=1, max_length=100)


class SeedNivaraResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    email: str
    password: str
    full_name: str = Field(alias="fullName")
    user_id: str = Field(alias="userId")
    onboarding_id: str = Field(alias="onboardingId")
    workspace_id: str = Field(alias="workspaceId")
    next_action: str = Field(alias="nextAction")
    login_hint: str = Field(alias="loginHint")
    company: str


@router.post("/seed-nivara", response_model=SeedNivaraResponse)
def seed_nivara(
    payload: SeedNivaraRequest | None = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    x_dev_seed_secret: str | None = Header(default=None, alias="X-Dev-Seed-Secret"),
) -> SeedNivaraResponse:
    assert_dev_seed_allowed(settings, provided_secret=x_dev_seed_secret)
    body = payload or SeedNivaraRequest()
    result = seed_nivara_ready_user(
        db,
        settings=settings,
        email=str(body.email) if body.email else None,
        password=body.password,
        full_name=body.full_name,
    )
    return SeedNivaraResponse.model_validate(result)
