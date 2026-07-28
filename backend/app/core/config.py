from functools import lru_cache

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

    @property
    def frontend_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
