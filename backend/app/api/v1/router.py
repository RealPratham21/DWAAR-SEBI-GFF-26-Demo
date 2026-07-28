from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.health.router import health_router
from app.modules.onboarding.sme.router import router as sme_onboarding_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router, prefix="/health", tags=["health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(sme_onboarding_router, prefix="/onboarding", tags=["onboarding"])
