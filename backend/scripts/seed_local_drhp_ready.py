#!/usr/bin/env python3
"""Create Nivara account + fill all DRHP Preparation workstreams locally.

Credentials: backend/scripts/seed_local_drhp_targets.py (gitignored; copy from
seed_local_drhp_targets.example.py). Uses host port 5433 — Docker Compose maps
5433 -> db:5432 so host scripts do not clash with a native Postgres on 5432.

Prerequisites:
  docker compose up -d db migrate   # DB healthy + migrations applied

Usage (from backend/):

  uv run python scripts/seed_local_drhp_ready.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from nivara_bootstrap_lib import run_full_drhp_seed

if __name__ == "__main__":
    raise SystemExit(run_full_drhp_seed("seed_local_drhp_targets"))
