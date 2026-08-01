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

    @property
    def frontend_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
