from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.company_incorporation.documents.router import (
    router as company_incorporation_documents_router,
)
from app.modules.company_incorporation.router import router as company_incorporation_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.health.router import health_router
from app.modules.notifications.router import router as notifications_router
from app.modules.onboarding.sme.router import router as sme_onboarding_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router, prefix="/health", tags=["health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_v1_router.include_router(
    company_incorporation_router,
    tags=["company-incorporation"],
)
api_v1_router.include_router(
    company_incorporation_documents_router,
    tags=["company-incorporation-documents"],
)
api_v1_router.include_router(notifications_router, tags=["notifications"])
api_v1_router.include_router(sme_onboarding_router, prefix="/onboarding", tags=["onboarding"])
