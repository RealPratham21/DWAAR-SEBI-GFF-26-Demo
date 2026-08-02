"""Database URL helpers for Railway / local PostgreSQL."""

from __future__ import annotations


def normalize_database_url(url: str) -> str:
    """Normalise Railway-style URLs to SQLAlchemy + psycopg form."""
    value = url.strip()
    if value.startswith("postgresql+psycopg://"):
        return value
    if value.startswith("postgresql://"):
        return "postgresql+psycopg://" + value.removeprefix("postgresql://")
    if value.startswith("postgres://"):
        return "postgresql+psycopg://" + value.removeprefix("postgres://")
    return value
