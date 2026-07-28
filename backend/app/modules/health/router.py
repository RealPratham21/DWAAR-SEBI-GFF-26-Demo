from fastapi import APIRouter, Depends
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.db.health import check_database_connection
from app.db.session import get_db
from app.modules.health.schemas import HealthResponse, LivenessResponse, ReadinessResponse

liveness_router = APIRouter()
health_router = APIRouter()


@liveness_router.get("/live", response_model=LivenessResponse)
def liveness() -> LivenessResponse:
    return LivenessResponse(status="alive")


@liveness_router.get("/ready", response_model=ReadinessResponse)
def readiness(db: Session = Depends(get_db)) -> ReadinessResponse:
    try:
        check_database_connection(db)
    except SQLAlchemyError as exc:
        raise AppException(
            code="service_unavailable",
            message="Database is unavailable",
            status_code=503,
            details={"database": "disconnected"},
        ) from exc

    return ReadinessResponse(status="ready", database="connected")


@health_router.get("", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
    )
