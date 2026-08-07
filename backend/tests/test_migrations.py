import pytest
from sqlalchemy import inspect, text

pytestmark = pytest.mark.postgres


def test_alembic_migration_reaches_head(engine, database_url: str) -> None:
    with engine.connect() as connection:
        version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()

    assert version == "017_borrowings_assets"

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert "users" in tables
    assert "refresh_sessions" in tables
    assert "onboarding_applications" in tables
    assert "company_incorporation_workspaces" in tables
    assert "user_notifications" in tables
    assert "documents" in tables
    assert "document_versions" in tables
    assert "document_processing_runs" in tables
    assert "document_pages" in tables
    assert "structured_extraction_runs" in tables
    assert "fact_assertions" in tables
    assert "fact_issues" in tables
    assert "ipo_setup_eligibility_workspaces" in tables
    assert "capital_ownership_workspaces" in tables
    assert "business_operations_workspaces" in tables
    assert "objects_issue_workspaces" in tables
    assert "financials_kpis_workspaces" in tables
    assert "management_governance_workspaces" in tables
    assert "industry_market_workspaces" in tables
    assert "group_entities_related_parties_workspaces" in tables
