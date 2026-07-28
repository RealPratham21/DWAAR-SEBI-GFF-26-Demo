from fastapi import APIRouter

from app.modules.health.router import health_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router, prefix="/health", tags=["health"])
