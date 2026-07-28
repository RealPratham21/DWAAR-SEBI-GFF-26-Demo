import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel

from app.modules.auth.validation import (
    normalize_email,
    normalize_full_name,
    normalize_phone_e164,
    validate_password,
)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class RegisterRequest(ApiModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=20)
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        normalized = normalize_full_name(value)
        if not normalized:
            msg = "Full name is required"
            raise ValueError(msg)
        return normalized

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone_e164(value)

    @field_validator("password")
    @classmethod
    def validate_password_field(cls, value: str) -> str:
        validate_password(value)
        return value


class LoginRequest(ApiModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(ApiModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: str
    email_verified: bool
    is_active: bool


class OnboardingSummaryResponse(ApiModel):
    id: uuid.UUID
    status: str
    current_step: str
    completed_steps: list[Any]


class AuthTokenResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RegisterResponse(AuthTokenResponse):
    user: UserResponse
    next_action: str
    redirect_to: str


class LoginResponse(AuthTokenResponse):
    user: UserResponse
    onboarding: OnboardingSummaryResponse | None = None
    next_action: str
    redirect_to: str


class RefreshResponse(AuthTokenResponse):
    pass


class LogoutResponse(ApiModel):
    success: bool = True


class MeResponse(ApiModel):
    user: UserResponse
    onboarding: OnboardingSummaryResponse | None = None
    next_action: str
    redirect_to: str
