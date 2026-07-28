from fastapi import APIRouter

from app.core.config import get_settings
from app.modules.health.schemas import HealthResponse, LivenessResponse

liveness_router = APIRouter()
health_router = APIRouter()


@liveness_router.get("/live", response_model=LivenessResponse)
def liveness() -> LivenessResponse:
    return LivenessResponse(status="alive")


@health_router.get("", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
    )
