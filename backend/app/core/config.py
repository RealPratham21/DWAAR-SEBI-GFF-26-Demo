from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="Dwaar API", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    frontend_origins: str = Field(
        default="http://localhost:3000",
        alias="FRONTEND_ORIGINS",
    )
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    app_version: str = "0.1.0"
    database_url: str = Field(
        default="postgresql+psycopg://dwaar:dwaar_local@localhost:5432/dwaar",
        alias="DATABASE_URL",
    )
    jwt_secret: str = Field(
        default="change-me-in-production-use-a-long-random-secret",
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=15,
        alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    refresh_token_remember_me_expire_days: int = Field(
        default=30,
        alias="REFRESH_TOKEN_REMEMBER_ME_EXPIRE_DAYS",
    )
    refresh_cookie_name: str = Field(default="dwaar_refresh", alias="REFRESH_COOKIE_NAME")
    refresh_cookie_path: str = Field(default="/api/v1/auth", alias="REFRESH_COOKIE_PATH")
    refresh_cookie_secure: bool = Field(default=False, alias="REFRESH_COOKIE_SECURE")
    refresh_cookie_samesite: Literal["lax", "strict", "none"] = Field(
        default="lax",
        alias="REFRESH_COOKIE_SAMESITE",
    )
    refresh_cookie_domain: str | None = Field(default=None, alias="REFRESH_COOKIE_DOMAIN")
    s3_endpoint: str = Field(
        default="http://minio:9000",
        alias="S3_ENDPOINT",
    )
    s3_public_endpoint: str = Field(
        default="http://localhost:9000",
        alias="S3_PUBLIC_ENDPOINT",
    )
    s3_access_key: str = Field(default="dwaar_minio", alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field(default="dwaar_minio_secret", alias="S3_SECRET_KEY")
    s3_bucket: str = Field(default="dwaar-documents", alias="S3_BUCKET")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")
    s3_secure: bool = Field(default=False, alias="S3_SECURE")
    s3_presigned_expiry_seconds: int = Field(default=900, alias="S3_PRESIGNED_EXPIRY_SECONDS")

    @property
    def frontend_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
