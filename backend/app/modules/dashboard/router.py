from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.dashboard.schemas import DashboardBootstrapResponse
from app.modules.dashboard.summary_schemas import DashboardSummaryResponse
from app.modules.dashboard.service import build_dashboard_bootstrap
from app.modules.dashboard.summary_service import build_dashboard_summary
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/bootstrap", response_model=DashboardBootstrapResponse)
def get_dashboard_bootstrap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardBootstrapResponse:
    return build_dashboard_bootstrap(db, current_user)


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    return build_dashboard_summary(db, current_user)
