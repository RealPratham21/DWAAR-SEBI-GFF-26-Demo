"""Tests for Reports & Export (G7)."""

from __future__ import annotations

import pytest

from app.modules.reports_exports.filenames import issuer_prefix, sanitize_filename_part


def test_sanitize_filename_part() -> None:
    assert sanitize_filename_part("Nivara Techfab Private Limited") == "Nivara_Techfab_Private_Limited"
    assert "&" not in issuer_prefix("A & B Ltd")


def test_service_does_not_contain_fake_placeholders() -> None:
    from pathlib import Path

    service_path = Path(__file__).resolve().parents[1] / "app" / "modules" / "reports_exports" / "service.py"
    text = service_path.read_text(encoding="utf-8")
    for token in ("100% Ready", "42% Ready", "8.5 MB", "12.3 MB", "Estimated Size"):
        assert token not in text


@pytest.mark.postgres
async def test_reports_exports_summary_api(auth_client, db_session) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g7-export@example.com")
    response = await auth_client.get("/api/v1/reports-exports/summary", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["issuer"]
    assert body["workstreams"]["total"] == 12
    assert len(body["cards"]) >= 7
    labels = " ".join(card["statusLabel"] for card in body["cards"])
    assert "100% Ready" not in labels
    assert "42% Ready" not in labels


@pytest.mark.postgres
async def test_readiness_report_pdf(auth_client, db_session) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g7-pdf@example.com")
    response = await auth_client.get("/api/v1/reports-exports/readiness-report/pdf", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert len(response.content) > 500
    assert b"Disclaimer" in response.content


@pytest.mark.postgres
async def test_register_exports(auth_client, db_session) -> None:
    from tests.test_drhp_g1_api import _seed_nivara_workspace

    headers = await _seed_nivara_workspace(auth_client, db_session, "g7-xlsx@example.com")
    for path in (
        "/api/v1/reports-exports/issues/xlsx",
        "/api/v1/reports-exports/facts-evidence/xlsx",
        "/api/v1/reports-exports/data-room/xlsx",
        "/api/v1/reports-exports/preparation-workbook/xlsx",
    ):
        response = await auth_client.get(path, headers=headers)
        assert response.status_code == 200, path
        assert "spreadsheetml" in response.headers["content-type"]
        assert len(response.content) > 1000
