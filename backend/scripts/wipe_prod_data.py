#!/usr/bin/env python3
"""Wipe all application data from production PostgreSQL and the Railway bucket.

Hardcoded prod credentials live in scripts/wipe_prod_targets.py (gitignored).

Usage (from backend/):

  uv run python scripts/wipe_prod_data.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import urlparse

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from app.core.database_url import normalize_database_url
from app.storage.s3 import ObjectStorageError

SCRIPTS_DIR = Path(__file__).resolve().parent
TARGETS_FILE = SCRIPTS_DIR / "wipe_prod_targets.py"
ALEMBIC_VERSION_TABLE = "alembic_version"
DELETE_BATCH_SIZE = 1000


def _load_targets():
    if not TARGETS_FILE.is_file():
        print(
            f"Missing {TARGETS_FILE.name} — create it with your Railway DATABASE_URL and S3_* values.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    sys.path.insert(0, str(SCRIPTS_DIR))
    try:
        import wipe_prod_targets as targets  # noqa: PLC0415
    finally:
        if str(SCRIPTS_DIR) in sys.path:
            sys.path.remove(str(SCRIPTS_DIR))

    return targets


def _database_host(database_url: str) -> str:
    parsed = urlparse(normalize_database_url(database_url))
    host = parsed.hostname or "(unknown host)"
    port = parsed.port
    return f"{host}:{port}" if port else host


def _build_s3_client(targets) -> object:
    config = Config(signature_version="s3v4")
    if targets.S3_ADDRESSING_STYLE in {"path", "virtual"}:
        config = Config(
            signature_version="s3v4",
            s3={"addressing_style": targets.S3_ADDRESSING_STYLE},
        )
    return boto3.client(
        "s3",
        endpoint_url=targets.S3_ENDPOINT,
        aws_access_key_id=targets.S3_ACCESS_KEY,
        aws_secret_access_key=targets.S3_SECRET_KEY,
        region_name=targets.S3_REGION,
        use_ssl=bool(targets.S3_SECURE),
        config=config,
    )


def _list_public_tables(engine) -> list[str]:
    query = text(
        """
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> :alembic_table
        ORDER BY tablename
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query, {"alembic_table": ALEMBIC_VERSION_TABLE}).fetchall()
    return [str(row[0]) for row in rows]


def _truncate_tables(engine, tables: list[str]) -> None:
    if not tables:
        print("database: no application tables found")
        return

    table_list = ", ".join(f'"{table}"' for table in tables)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"))
    print(f"database: truncated {len(tables)} tables")


def _list_object_keys(client, *, bucket: str) -> list[str]:
    keys: list[str] = []
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for item in page.get("Contents", []):
            key = item.get("Key")
            if isinstance(key, str) and key:
                keys.append(key)
    return keys


def _delete_object_keys(client, *, bucket: str, keys: list[str]) -> None:
    if not keys:
        print("bucket: no objects found")
        return

    deleted = 0
    for start in range(0, len(keys), DELETE_BATCH_SIZE):
        batch = keys[start : start + DELETE_BATCH_SIZE]
        response = client.delete_objects(
            Bucket=bucket,
            Delete={"Objects": [{"Key": key} for key in batch], "Quiet": True},
        )
        errors = response.get("Errors") or []
        if errors:
            raise ObjectStorageError(f"Failed to delete {len(errors)} object(s) from storage.")
        deleted += len(batch)
        print(f"bucket: deleted {deleted}/{len(keys)}")

    print("bucket: delete complete")


def main() -> int:
    targets = _load_targets()
    engine = create_engine(normalize_database_url(targets.DATABASE_URL), pool_pre_ping=True)
    s3 = _build_s3_client(targets)

    print("Dwaar production data wipe")
    print(f"  targets_file={TARGETS_FILE.name}")
    print(f"  database_host={_database_host(targets.DATABASE_URL)}")
    print(f"  bucket={targets.S3_BUCKET}")

    if "railway.internal" in targets.DATABASE_URL:
        print(
            "database: DATABASE_URL uses postgres.railway.internal — that hostname "
            "only works inside Railway. From your laptop, use the public Postgres URL "
            "(Railway → Postgres → Connect → Public network / TCP proxy).",
            file=sys.stderr,
        )
        return 1

    try:
        print("\nPostgreSQL")
        tables = _list_public_tables(engine)
        _truncate_tables(engine, tables)

        print("\nObject storage")
        try:
            s3.head_bucket(Bucket=targets.S3_BUCKET)
        except ClientError as exc:
            print(f"bucket: unavailable ({type(exc).__name__})", file=sys.stderr)
            return 1

        keys = _list_object_keys(s3, bucket=targets.S3_BUCKET)
        _delete_object_keys(s3, bucket=targets.S3_BUCKET, keys=keys)
    except OperationalError as exc:
        print(f"database: connection failed — check DATABASE_URL in wipe_prod_targets.py ({exc})", file=sys.stderr)
        return 1
    except ObjectStorageError as exc:
        print(f"Storage error: {exc}", file=sys.stderr)
        return 1
    finally:
        engine.dispose()

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
