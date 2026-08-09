"""Reports & Export API routes (G7)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.reports_exports.context import build_reports_context
from app.modules.reports_exports.exports import (
    export_data_room_xlsx,
    export_facts_evidence_xlsx,
    export_issues_csv,
    export_issues_xlsx,
    export_preparation_workbook,
)
from app.modules.reports_exports.readiness_pdf import render_readiness_pdf
from app.modules.reports_exports.schemas import ReportsExportSummaryResponse
from app.modules.reports_exports.service import build_summary

router = APIRouter(prefix="/reports-exports", tags=["reports-exports"])


def _file_response(payload: bytes, filename: str, mime_type: str) -> Response:
    return Response(
        content=payload,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/summary", response_model=ReportsExportSummaryResponse)
def get_reports_exports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportsExportSummaryResponse:
    return build_summary(db, current_user)


@router.get("/readiness-report/pdf")
def download_readiness_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ctx = build_reports_context(db, current_user)
    payload, filename = render_readiness_pdf(ctx)
    return _file_response(payload, filename, "application/pdf")


@router.get("/issues/xlsx")
def download_issues_xlsx(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ctx = build_reports_context(db, current_user)
    payload, filename = export_issues_xlsx(ctx)
    return _file_response(
        payload,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/issues/csv")
def download_issues_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ctx = build_reports_context(db, current_user)
    payload, filename = export_issues_csv(ctx)
    return _file_response(payload, filename, "text/csv")


@router.get("/facts-evidence/xlsx")
def download_facts_evidence_xlsx(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ctx = build_reports_context(db, current_user)
    payload, filename = export_facts_evidence_xlsx(db, current_user, ctx)
    return _file_response(
        payload,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/data-room/xlsx")
def download_data_room_xlsx(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ctx = build_reports_context(db, current_user)
    payload, filename = export_data_room_xlsx(ctx)
    return _file_response(
        payload,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/preparation-workbook/xlsx")
def download_preparation_workbook_xlsx(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ctx = build_reports_context(db, current_user)
    payload, filename = export_preparation_workbook(db, current_user, ctx)
    return _file_response(
        payload,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
