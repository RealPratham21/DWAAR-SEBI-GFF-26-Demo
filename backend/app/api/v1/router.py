from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.business_operations.router import router as business_operations_router
from app.modules.financials_kpis.router import router as financials_kpis_router
from app.modules.industry_market.router import router as industry_market_router
from app.modules.management_governance.router import router as management_governance_router
from app.modules.objects_issue.router import router as objects_issue_router
from app.modules.capital_ownership.router import router as capital_ownership_router
from app.modules.company_incorporation.document_processing.router import (
    router as company_incorporation_document_processing_router,
)
from app.modules.company_incorporation.documents.router import (
    router as company_incorporation_documents_router,
)
from app.modules.company_incorporation.router import router as company_incorporation_router
from app.modules.company_incorporation.structured_extraction.router import (
    router as company_incorporation_structured_extraction_router,
)
from app.modules.dashboard.router import router as dashboard_router
from app.modules.dev.router import router as dev_router
from app.modules.drhp.router import router as drhp_router
from app.modules.health.router import health_router
from app.modules.ipo_setup_eligibility.router import router as ipo_setup_eligibility_router
from app.modules.notifications.router import router as notifications_router
from app.modules.onboarding.sme.router import router as sme_onboarding_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router, prefix="/health", tags=["health"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(dev_router, tags=["dev"])
api_v1_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_v1_router.include_router(
    company_incorporation_router,
    tags=["company-incorporation"],
)
api_v1_router.include_router(
    company_incorporation_documents_router,
    tags=["company-incorporation-documents"],
)
api_v1_router.include_router(
    company_incorporation_document_processing_router,
    tags=["company-incorporation-document-processing"],
)
api_v1_router.include_router(
    company_incorporation_structured_extraction_router,
    tags=["company-incorporation-structured-extraction"],
)
api_v1_router.include_router(ipo_setup_eligibility_router, tags=["ipo-setup-eligibility"])
api_v1_router.include_router(capital_ownership_router, tags=["capital-ownership"])
api_v1_router.include_router(business_operations_router, tags=["business-operations"])
api_v1_router.include_router(objects_issue_router, tags=["objects-issue"])
api_v1_router.include_router(financials_kpis_router, tags=["financials-kpis"])
api_v1_router.include_router(management_governance_router, tags=["management-governance"])
api_v1_router.include_router(industry_market_router, tags=["industry-market"])
api_v1_router.include_router(drhp_router, tags=["drhp"])
api_v1_router.include_router(notifications_router, tags=["notifications"])
api_v1_router.include_router(sme_onboarding_router, prefix="/onboarding", tags=["onboarding"])
