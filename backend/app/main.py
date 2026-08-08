import logging
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import ConfigurationError, get_settings
from app.core.exceptions import AppException, ErrorBody, ErrorResponse
from app.core.logging import configure_logging
from app.core.startup import validate_runtime_configuration, wait_for_database
from app.modules.health.router import liveness_router

logger = logging.getLogger(__name__)


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level, debug=settings.debug and not settings.is_production)
    try:
        validate_runtime_configuration(settings)
        wait_for_database(settings)
    except ConfigurationError as exc:
        logger.error("Startup configuration failed: %s", exc)
        raise SystemExit(1) from exc
    logger.info(
        "Starting %s (%s) role=%s",
        settings.app_name,
        settings.app_env,
        settings.service_role,
    )
    from app.modules.drhp.generation.runner import resume_incomplete_generations

    resume_incomplete_generations()
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_application() -> FastAPI:
    settings = get_settings()
    docs_url = "/docs" if settings.api_docs_enabled else None
    redoc_url = "/redoc" if settings.api_docs_enabled else None
    openapi_url = "/openapi.json" if settings.api_docs_enabled else None

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug and not settings.is_production,
        lifespan=lifespan,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
    )

    if settings.trusted_hosts_list:
        application.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.trusted_hosts_list,
        )

    application.add_middleware(RequestIdMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Request-ID",
            "X-Requested-With",
        ],
        expose_headers=["X-Request-ID"],
    )

    @application.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
        payload = ErrorResponse(
            error=ErrorBody(
                code=exc.code,
                message=exc.message,
                details=exc.details,
            )
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=payload.model_dump(),
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception("Unhandled error request_id=%s", request_id)
        message = "An unexpected error occurred."
        if settings.debug and not settings.is_production:
            message = str(exc)
        payload = ErrorResponse(
            error=ErrorBody(
                code="INTERNAL_SERVER_ERROR",
                message=message,
                details={"requestId": request_id} if request_id else None,
            )
        )
        return JSONResponse(status_code=500, content=payload.model_dump())

    application.include_router(liveness_router, prefix="/health", tags=["health"])
    application.include_router(
        api_v1_router,
        prefix=settings.api_v1_prefix,
    )

    return application


app = create_application()
