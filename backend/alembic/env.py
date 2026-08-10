from logging.config import fileConfig

from alembic import context
from app.core.config import get_settings
from app.db.base import Base
from app.models import (  # noqa: F401
    BusinessOperationsWorkspace,
    CapitalOwnershipWorkspace,
    CompanyIncorporationWorkspace,
    Document,
    DocumentVersion,
    IpoSetupEligibilityWorkspace,
    OnboardingApplication,
    RefreshSession,
    User,
    UserNotification,
)
from sqlalchemy import pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import create_engine

    print("Alembic: opening database connection...", flush=True)
    connectable = create_engine(
        settings.database_url,
        poolclass=pool.NullPool,
        connect_args={"connect_timeout": 15},
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

    print("Alembic: migrations complete.", flush=True)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
