"""Example targets for seed_local_drhp_ready.py — copy to seed_local_drhp_targets.py (gitignored)."""

# Docker Compose publishes Postgres on host port 5433 (see compose.yaml).
DATABASE_URL = "postgresql+psycopg://dwaar:dwaar_local@127.0.0.1:5433/dwaar?sslmode=disable"
JWT_SECRET = "change-me-in-production-use-a-long-random-secret"

EMAIL = "nivara.demo@example.com"
PASSWORD = "Password1"
FULL_NAME = "Nivara Demo User"
