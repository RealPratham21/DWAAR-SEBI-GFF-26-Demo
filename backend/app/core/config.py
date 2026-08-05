from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.database_url import normalize_database_url

UNSAFE_JWT_SECRETS = frozenset(
    {
        "",
        "change-me",
        "change-me-in-production",
        "change-me-in-production-use-a-long-random-secret",
        "secret",
        "jwt-secret",
        "password",
    }
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    app_name: str = Field(default="Dwaar API", alias="APP_NAME")
    app_env: str = Field(default="local", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    service_role: Literal["api", "worker"] = Field(default="api", alias="SERVICE_ROLE")
    api_v1_prefix: str = Field(default="/api/v1", alias="API_V1_PREFIX")
    frontend_origins: str = Field(
        default="http://localhost:3000",
        alias="FRONTEND_ORIGINS",
    )
    trusted_hosts: str = Field(default="", alias="TRUSTED_HOSTS")
    enable_api_docs: bool | None = Field(default=None, alias="ENABLE_API_DOCS")
    enable_dev_seed: bool = Field(default=False, alias="ENABLE_DEV_SEED")
    dev_seed_secret: str = Field(default="", alias="DEV_SEED_SECRET")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    app_version: str = "0.1.0"
    database_url: str = Field(
        default="postgresql+psycopg://dwaar:dwaar_local@localhost:5432/dwaar",
        alias="DATABASE_URL",
    )
    db_pool_size: int | None = Field(default=None, alias="DB_POOL_SIZE")
    db_max_overflow: int | None = Field(default=None, alias="DB_MAX_OVERFLOW")
    db_pool_recycle_seconds: int = Field(default=1800, alias="DB_POOL_RECYCLE_SECONDS")
    db_pool_timeout_seconds: int = Field(default=30, alias="DB_POOL_TIMEOUT_SECONDS")
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
    s3_addressing_style: Literal["path", "virtual", "auto"] = Field(
        default="path",
        alias="S3_ADDRESSING_STYLE",
    )

    # Document processing worker
    doc_processing_poll_interval_seconds: float = Field(
        default=2.0,
        alias="DOC_PROCESSING_POLL_INTERVAL_SECONDS",
    )
    doc_processing_max_attempts: int = Field(default=3, alias="DOC_PROCESSING_MAX_ATTEMPTS")
    doc_processing_timeout_seconds: int = Field(
        default=300,
        alias="DOC_PROCESSING_TIMEOUT_SECONDS",
    )
    doc_processing_heartbeat_interval_seconds: float = Field(
        default=15.0,
        alias="DOC_PROCESSING_HEARTBEAT_INTERVAL_SECONDS",
    )
    doc_processing_stale_heartbeat_seconds: int = Field(
        default=90,
        alias="DOC_PROCESSING_STALE_HEARTBEAT_SECONDS",
    )
    doc_processing_max_pages: int = Field(default=50, alias="DOC_PROCESSING_MAX_PAGES")
    doc_processing_ocr_dpi: int = Field(default=280, alias="DOC_PROCESSING_OCR_DPI")
    doc_processing_max_image_pixels: int = Field(
        default=40_000_000,
        alias="DOC_PROCESSING_MAX_IMAGE_PIXELS",
    )
    doc_processing_max_render_pixels: int = Field(
        default=25_000_000,
        alias="DOC_PROCESSING_MAX_RENDER_PIXELS",
    )
    doc_processing_native_min_alnum: int = Field(
        default=40,
        alias="DOC_PROCESSING_NATIVE_MIN_ALNUM",
    )
    doc_processing_native_min_words: int = Field(
        default=8,
        alias="DOC_PROCESSING_NATIVE_MIN_WORDS",
    )
    doc_processing_native_min_printable_ratio: float = Field(
        default=0.75,
        alias="DOC_PROCESSING_NATIVE_MIN_PRINTABLE_RATIO",
    )
    doc_processing_ocr_low_confidence: float = Field(
        default=55.0,
        alias="DOC_PROCESSING_OCR_LOW_CONFIDENCE",
    )
    doc_processing_low_resolution_dpi: int = Field(
        default=120,
        alias="DOC_PROCESSING_LOW_RESOLUTION_DPI",
    )
    doc_processing_processor_version: str = Field(
        default="1.1.0",
        alias="DOC_PROCESSING_PROCESSOR_VERSION",
    )
    doc_processing_output_schema_version: int = Field(
        default=2,
        alias="DOC_PROCESSING_OUTPUT_SCHEMA_VERSION",
    )
    doc_processing_pages_default_limit: int = Field(
        default=20,
        alias="DOC_PROCESSING_PAGES_DEFAULT_LIMIT",
    )
    doc_processing_pages_max_limit: int = Field(
        default=50,
        alias="DOC_PROCESSING_PAGES_MAX_LIMIT",
    )
    doc_processing_allow_full_content_api: bool = Field(
        default=True,
        alias="DOC_PROCESSING_ALLOW_FULL_CONTENT_API",
    )
    doc_processing_heartbeat_path: str = Field(
        default="/tmp/document-worker.heartbeat",
        alias="DOC_PROCESSING_HEARTBEAT_PATH",
    )
    doc_processing_write_heartbeat_file: bool = Field(
        default=True,
        alias="DOC_PROCESSING_WRITE_HEARTBEAT_FILE",
    )

    # Structured fact extraction
    structured_extraction_enabled: bool = Field(
        default=False,
        alias="STRUCTURED_EXTRACTION_ENABLED",
    )
    structured_extraction_provider: str = Field(
        default="cohere",
        alias="STRUCTURED_EXTRACTION_PROVIDER",
    )
    cohere_api_key: str = Field(default="", alias="COHERE_API_KEY")
    cohere_model: str = Field(
        default="command-a-plus-05-2026",
        alias="COHERE_MODEL",
    )
    cohere_timeout_seconds: int = Field(default=60, alias="COHERE_TIMEOUT_SECONDS")
    cohere_max_retries: int = Field(default=2, alias="COHERE_MAX_RETRIES")
    cohere_temperature: float = Field(default=0.0, alias="COHERE_TEMPERATURE")
    structured_extraction_max_attempts: int = Field(
        default=3,
        alias="STRUCTURED_EXTRACTION_MAX_ATTEMPTS",
    )
    structured_extraction_stale_heartbeat_seconds: int = Field(
        default=120,
        alias="STRUCTURED_EXTRACTION_STALE_HEARTBEAT_SECONDS",
    )
    structured_extraction_input_max_chars: int = Field(
        default=120_000,
        alias="STRUCTURED_EXTRACTION_INPUT_MAX_CHARS",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalise_database_url(cls, value: object) -> object:
        if isinstance(value, str):
            return normalize_database_url(value)
        return value

    @field_validator("refresh_cookie_domain", mode="before")
    @classmethod
    def _empty_domain_to_none(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("refresh_cookie_samesite", mode="before")
    @classmethod
    def _normalise_samesite(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @model_validator(mode="after")
    def _apply_environment_defaults(self) -> Settings:
        if self.enable_api_docs is None:
            object.__setattr__(self, "enable_api_docs", not self.is_production)
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() == "production"

    @property
    def frontend_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def trusted_hosts_list(self) -> list[str]:
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]

    @property
    def api_docs_enabled(self) -> bool:
        return bool(self.enable_api_docs)

    @property
    def effective_db_pool_size(self) -> int:
        if self.db_pool_size is not None:
            return self.db_pool_size
        return 2 if self.service_role == "worker" else 5

    @property
    def effective_db_max_overflow(self) -> int:
        if self.db_max_overflow is not None:
            return self.db_max_overflow
        return 1 if self.service_role == "worker" else 5


class ConfigurationError(RuntimeError):
    """Raised when production/role configuration is invalid."""


def _is_localhost_endpoint(url: str) -> bool:
    lowered = url.strip().lower()
    return any(
        token in lowered
        for token in (
            "://localhost",
            "://127.0.0.1",
            "://0.0.0.0",
            "://[::1]",
        )
    )


def _is_http_endpoint(url: str) -> bool:
    return url.strip().lower().startswith("http://")


def validate_settings_for_role(settings: Settings) -> None:
    """Fail fast for unsafe or incomplete configuration for the active service role."""
    errors: list[str] = []

    if not settings.database_url.strip():
        errors.append("DATABASE_URL is required.")

    if settings.is_production:
        if settings.debug:
            errors.append("DEBUG must be false when APP_ENV=production.")
        secret = settings.jwt_secret.strip()
        if secret.lower() in UNSAFE_JWT_SECRETS or len(secret) < 32:
            errors.append("JWT_SECRET is missing, default, or too weak for production.")
        if settings.service_role == "api" and not settings.frontend_origins_list:
            errors.append("FRONTEND_ORIGINS must list at least one production frontend origin.")
        if settings.service_role == "api" and not settings.trusted_hosts_list:
            errors.append("TRUSTED_HOSTS must list at least one production API host.")
        if not settings.s3_access_key.strip() or not settings.s3_secret_key.strip():
            errors.append("S3_ACCESS_KEY and S3_SECRET_KEY are required in production.")
        if not settings.s3_bucket.strip():
            errors.append("S3_BUCKET is required in production.")
        if _is_localhost_endpoint(settings.s3_endpoint) or _is_localhost_endpoint(
            settings.s3_public_endpoint
        ):
            errors.append("S3 endpoints must not use localhost in production.")
        if (
            "minio" in settings.s3_endpoint.lower()
            or "minio" in settings.s3_public_endpoint.lower()
        ):
            errors.append("S3 endpoints must not use the local MinIO hostname in production.")
        if _is_http_endpoint(settings.s3_endpoint) or _is_http_endpoint(
            settings.s3_public_endpoint
        ):
            errors.append("S3 endpoints must use HTTPS in production.")
        if not settings.s3_secure:
            errors.append("S3_SECURE must be true in production.")
        if settings.service_role == "api":
            if not settings.refresh_cookie_secure:
                errors.append("REFRESH_COOKIE_SECURE must be true in production.")
            if settings.refresh_cookie_samesite != "none":
                errors.append(
                    "REFRESH_COOKIE_SAMESITE must be 'none' for cross-site Vercel→Railway auth."
                )
        if settings.refresh_cookie_samesite == "none" and not settings.refresh_cookie_secure:
            errors.append("REFRESH_COOKIE_SECURE must be true when SameSite=None.")

    if settings.service_role == "worker" and settings.structured_extraction_enabled:
        provider = settings.structured_extraction_provider.strip().lower()
        if provider == "cohere" and not settings.cohere_api_key.strip():
            errors.append(
                "COHERE_API_KEY is required when STRUCTURED_EXTRACTION_ENABLED=true "
                "and STRUCTURED_EXTRACTION_PROVIDER=cohere."
            )

    if errors:
        raise ConfigurationError(" ; ".join(errors))


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()
