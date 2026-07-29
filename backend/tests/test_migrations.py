import pytest
from sqlalchemy import inspect, text

pytestmark = pytest.mark.postgres


def test_alembic_migration_reaches_head(engine, database_url: str) -> None:
    with engine.connect() as connection:
        version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()

    assert version == "002_ci_workspaces"

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    assert "users" in tables
    assert "refresh_sessions" in tables
    assert "onboarding_applications" in tables
    assert "company_incorporation_workspaces" in tables
