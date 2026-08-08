#!/usr/bin/env python3
"""Create a Nivara demo account on production (onboarding complete, ready to log in).

Credentials: backend/scripts/seed_prod_account_targets.py (gitignored)

Usage (from backend/):

  uv run python scripts/seed_prod_account.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from nivara_bootstrap_lib import run_account_seed

if __name__ == "__main__":
    raise SystemExit(run_account_seed("seed_prod_account_targets"))
