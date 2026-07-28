import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import AppException, ErrorBody, ErrorResponse
from app.core.logging import configure_logging
from app.modules.health.router import liveness_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    logger.info("Starting %s (%s)", settings.app_name, settings.app_env)
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_application() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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

    application.include_router(liveness_router, prefix="/health", tags=["health"])
    application.include_router(
        api_v1_router,
        prefix=settings.api_v1_prefix,
    )

    return application


app = create_application()
