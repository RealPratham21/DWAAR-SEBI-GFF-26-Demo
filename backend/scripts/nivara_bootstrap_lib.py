"""Shared helpers for temporary Nivara bootstrap scripts."""

from __future__ import annotations

import importlib
import json
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import clear_settings_cache, get_settings
from app.core.database_url import normalize_database_url
from app.core.exceptions import AppException
from app.models.user import User
from app.modules.dev.service import seed_nivara_ready_user

SCRIPTS_DIR = Path(__file__).resolve().parent
PAYLOADS_FILE = SCRIPTS_DIR / "nivara_workstream_payloads.json"

# Some workstreams validate cross-section references. Save dependent sections first.
WORKSTREAM_SECTION_ORDER_OVERRIDES: dict[str, tuple[str, ...]] = {
    "management-governance": (
        "directors-profiles-appointments-and-eligibility",
        "kmp-senior-management-and-organisation-structure",
        "board-structure-and-ipo-governance-readiness",
        "board-committees-and-governance-bodies",
        "remuneration-service-contracts-esops-and-benefits",
        "interests-conflicts-and-management-relationships",
        "changes-continuity-and-succession",
        "governance-policies-rpt-oversight-and-confirmations",
    ),
    "industry-market": (
        "industry-scope-and-company-market-mapping",
        "research-sources-and-industry-report-governance",
        "macroeconomic-and-industry-context",
        "market-size-segmentation-and-growth",
        "demand-drivers-end-markets-trends-and-policy",
        "value-chain-supply-structure-and-entry-barriers",
        "competition-market-share-and-issuer-positioning",
        "outlook-industry-risks-and-confirmations",
    ),
    "borrowings-assets-contracts": (
        "financial-indebtedness-and-facility-master",
        "immovable-properties-and-occupancy-rights",
        "security-charges-guarantees-and-borrowing-powers",
        "covenants-defaults-waivers-and-lender-consents",
        "material-business-strategic-and-other-contracts",
        "material-assets-encumbrance-and-insurance-linkage",
        "contract-materiality-expiry-and-inspection-readiness",
        "reconciliation-changes-and-issuer-confirmations",
    ),
    "intermediaries-filing": (
        "issue-team-and-intermediary-master",
        "final-offer-document-advertisements-material-documents-and-filing-readiness",
        "issue-configuration-and-filing-snapshot",
        "filing-and-regulatory-milestone-tracker",
        "due-diligence-certificates-consents-and-signoffs",
        "depositories-banking-asba-upi-and-issue-infrastructure",
        "underwriting-market-making-and-distribution-arrangements",
        "issue-programme-allotment-listing-and-post-issue-execution",
    ),
}


@dataclass(frozen=True)
class SeedTargets:
    database_url: str
    jwt_secret: str
    email: str
    password: str
    full_name: str


def load_targets_module(module_name: str) -> Any:
    path = SCRIPTS_DIR / f"{module_name}.py"
    if not path.is_file():
        print(f"Missing {path.name} — create it with DATABASE_URL and login credentials.", file=sys.stderr)
        raise SystemExit(1)

    sys.path.insert(0, str(SCRIPTS_DIR))
    try:
        return importlib.import_module(module_name)
    finally:
        if str(SCRIPTS_DIR) in sys.path:
            sys.path.remove(str(SCRIPTS_DIR))


def parse_seed_targets(raw: Any) -> SeedTargets:
    database_url = str(getattr(raw, "DATABASE_URL", "")).strip()
    jwt_secret = str(getattr(raw, "JWT_SECRET", "")).strip() or (
        "bootstrap-script-jwt-secret-minimum-32-characters"
    )
    email = str(getattr(raw, "EMAIL", "")).strip().lower()
    password = str(getattr(raw, "PASSWORD", "")).strip()
    full_name = str(getattr(raw, "FULL_NAME", "")).strip() or "Nivara Demo User"

    if not database_url:
        print("DATABASE_URL is required in targets file.", file=sys.stderr)
        raise SystemExit(1)
    if not email or not password:
        print("EMAIL and PASSWORD are required in targets file.", file=sys.stderr)
        raise SystemExit(1)

    return SeedTargets(
        database_url=database_url,
        jwt_secret=jwt_secret,
        email=email,
        password=password,
        full_name=full_name,
    )


def database_host(database_url: str) -> str:
    parsed = urlparse(normalize_database_url(database_url))
    host = parsed.hostname or "(unknown host)"
    port = parsed.port
    return f"{host}:{port}" if port else host


def configure_runtime(targets: SeedTargets) -> None:
    os.environ["DATABASE_URL"] = normalize_database_url(targets.database_url)
    os.environ["JWT_SECRET"] = targets.jwt_secret
    clear_settings_cache()


def open_session(targets: SeedTargets) -> tuple[Session, Any]:
    configure_runtime(targets)
    engine = create_engine(normalize_database_url(targets.database_url), pool_pre_ping=True)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return session_factory(), engine


def load_workstream_payloads() -> dict[str, Any]:
    if not PAYLOADS_FILE.is_file():
        print(
            f"Missing {PAYLOADS_FILE.name}. Run: cd frontend && npx tsx scripts/export-nivara-payloads.ts",
            file=sys.stderr,
        )
        raise SystemExit(1)
    return json.loads(PAYLOADS_FILE.read_text(encoding="utf-8"))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def create_nivara_account(db: Session, targets: SeedTargets) -> dict[str, Any]:
    settings = get_settings()
    try:
        return seed_nivara_ready_user(
            db,
            settings=settings,
            email=targets.email,
            password=targets.password,
            full_name=targets.full_name,
        )
    except AppException as exc:
        if exc.code == "EMAIL_ALREADY_REGISTERED":
            existing = get_user_by_email(db, targets.email)
            if existing is None:
                raise
            print(f"Account already exists for {targets.email} — reusing existing user.")
            return {
                "email": targets.email,
                "password": targets.password,
                "fullName": existing.full_name,
                "userId": str(existing.id),
            }
        raise


def _resolve_section_order(label: str, section_ids: tuple[str, ...]) -> tuple[str, ...]:
    override = WORKSTREAM_SECTION_ORDER_OVERRIDES.get(label)
    if override is None:
        return section_ids
    missing = [section_id for section_id in section_ids if section_id not in override]
    extra = [section_id for section_id in override if section_id not in section_ids]
    if missing or extra:
        raise RuntimeError(
            f"{label}: section order override out of sync with constants "
            f"(missing={missing}, extra={extra})",
        )
    return override


def _save_standard_sections_fixed(
    db: Session,
    user: User,
    *,
    label: str,
    module: Any,
    section_ids: tuple[str, ...],
    payload_keys: dict[str, str],
    full_payload: dict[str, Any],
) -> None:
    ordered_section_ids = _resolve_section_order(label, section_ids)
    module.initialize_or_get_workspace(db, user)
    db.flush()

    for section_id in ordered_section_ids:
        workspace = module.get_workspace_for_user(db, user.id)
        if workspace is None:
            raise RuntimeError(f"{label}: workspace missing before saving {section_id}")

        section_data = full_payload[payload_keys[section_id]]
        module.save_section(
            db,
            user,
            section_id=section_id,
            expected_version=workspace.version,
            data=section_data,
        )
        db.flush()
        print(f"  {label}: saved {section_id}")


def fill_company_incorporation(db: Session, user: User, payload: dict[str, Any]) -> None:
    from app.modules.company_incorporation.service import (
        initialize_or_get_workspace,
        save_constitutional_documents,
        save_core_registrations,
        save_corporate_history,
        save_issuer_confirmations,
        save_legal_identity,
        save_offices_contact,
    )

    initialize_or_get_workspace(db, user)
    db.flush()

    steps: list[tuple[str, Callable[..., Any], dict[str, Any]]] = [
        (
            "legal-identity",
            save_legal_identity,
            {"identity": payload["identity"]},
        ),
        (
            "corporate-history",
            save_corporate_history,
            {"corporate_events": payload["corporateEvents"]},
        ),
        (
            "offices-contact",
            save_offices_contact,
            {"offices": payload["offices"]},
        ),
        (
            "constitutional-documents",
            save_constitutional_documents,
            {
                "constitutional_record": payload["constitutionalRecord"],
                "constitutional_amendments": payload.get("constitutionalAmendments", []),
            },
        ),
        (
            "core-registrations",
            save_core_registrations,
            {"registrations": payload["registrations"]},
        ),
        (
            "issuer-confirmations",
            save_issuer_confirmations,
            {"confirmations": payload["confirmations"]},
        ),
    ]

    from app.modules.company_incorporation.service import get_workspace_for_user

    for section_id, save_fn, kwargs in steps:
        workspace = get_workspace_for_user(db, user.id)
        if workspace is None:
            raise RuntimeError("Company Incorporation workspace missing.")
        if section_id == "legal-identity":
            save_fn(db, user, expected_version=workspace.version, identity=kwargs["identity"])
        elif section_id == "corporate-history":
            save_fn(
                db,
                user,
                expected_version=workspace.version,
                corporate_events=kwargs["corporate_events"],
            )
        elif section_id == "offices-contact":
            save_fn(db, user, expected_version=workspace.version, offices=kwargs["offices"])
        elif section_id == "constitutional-documents":
            save_fn(
                db,
                user,
                expected_version=workspace.version,
                constitutional_record=kwargs["constitutional_record"],
                constitutional_amendments=kwargs["constitutional_amendments"],
            )
        elif section_id == "core-registrations":
            save_fn(
                db,
                user,
                expected_version=workspace.version,
                registrations=kwargs["registrations"],
            )
        else:
            save_fn(
                db,
                user,
                expected_version=workspace.version,
                confirmations=kwargs["confirmations"],
            )
        db.flush()
        print(f"  company-incorporation: saved {section_id}")


def fill_all_drhp_workstreams(db: Session, user: User, payloads: dict[str, Any]) -> None:
    from app.modules.borrowings_assets_contracts import constants as bac_constants
    from app.modules.borrowings_assets_contracts import service as bac_service
    from app.modules.business_operations import constants as bo_constants
    from app.modules.business_operations import service as bo_service
    from app.modules.capital_ownership import constants as co_constants
    from app.modules.capital_ownership import service as co_service
    from app.modules.financials_kpis import constants as fk_constants
    from app.modules.financials_kpis import service as fk_service
    from app.modules.group_entities_related_parties import constants as ge_constants
    from app.modules.group_entities_related_parties import service as ge_service
    from app.modules.industry_market import constants as im_constants
    from app.modules.industry_market import service as im_service
    from app.modules.intermediaries_filing import constants as if_constants
    from app.modules.intermediaries_filing import service as if_service
    from app.modules.ipo_setup_eligibility import constants as ipo_constants
    from app.modules.ipo_setup_eligibility import service as ipo_service
    from app.modules.litigation_approvals_compliance import constants as lac_constants
    from app.modules.litigation_approvals_compliance import service as lac_service
    from app.modules.management_governance import constants as mg_constants
    from app.modules.management_governance import service as mg_service
    from app.modules.objects_issue import constants as oi_constants
    from app.modules.objects_issue import service as oi_service

    fill_company_incorporation(db, user, payloads["company-incorporation"])

    workstreams: list[tuple[str, Any, tuple[str, ...], dict[str, str], str]] = [
        (
            "ipo-setup-eligibility",
            ipo_service,
            ipo_constants.SECTION_IDS,
            ipo_constants.SECTION_PAYLOAD_KEYS,
            "ipo-setup-eligibility",
        ),
        (
            "capital-ownership",
            co_service,
            co_constants.SECTION_IDS,
            co_constants.SECTION_PAYLOAD_KEYS,
            "capital-ownership",
        ),
        (
            "business-operations",
            bo_service,
            bo_constants.SECTION_IDS,
            bo_constants.SECTION_PAYLOAD_KEYS,
            "business-operations",
        ),
        (
            "objects-of-issue",
            oi_service,
            oi_constants.SECTION_IDS,
            oi_constants.SECTION_PAYLOAD_KEYS,
            "objects-of-issue",
        ),
        (
            "financials-kpis",
            fk_service,
            fk_constants.SECTION_IDS,
            fk_constants.SECTION_PAYLOAD_KEYS,
            "financials-kpis",
        ),
        (
            "management-governance",
            mg_service,
            mg_constants.SECTION_IDS,
            mg_constants.SECTION_PAYLOAD_KEYS,
            "management-governance",
        ),
        (
            "industry-market",
            im_service,
            im_constants.SECTION_IDS,
            im_constants.SECTION_PAYLOAD_KEYS,
            "industry-market",
        ),
        (
            "group-entities-related-parties",
            ge_service,
            ge_constants.SECTION_IDS,
            ge_constants.SECTION_PAYLOAD_KEYS,
            "group-entities-related-parties",
        ),
        (
            "borrowings-assets-contracts",
            bac_service,
            bac_constants.SECTION_IDS,
            bac_constants.SECTION_PAYLOAD_KEYS,
            "borrowings-assets-contracts",
        ),
        (
            "litigation-approvals-compliance",
            lac_service,
            lac_constants.SECTION_IDS,
            lac_constants.SECTION_PAYLOAD_KEYS,
            "litigation-approvals-compliance",
        ),
        (
            "intermediaries-filing",
            if_service,
            if_constants.SECTION_IDS,
            if_constants.SECTION_PAYLOAD_KEYS,
            "intermediaries-filing",
        ),
    ]

    for label, module, section_ids, payload_keys, payload_key in workstreams:
        _save_standard_sections_fixed(
            db,
            user,
            label=label,
            module=module,
            section_ids=section_ids,
            payload_keys=payload_keys,
            full_payload=payloads[payload_key],
        )


def print_login_summary(targets: SeedTargets, *, filled_workstreams: bool) -> None:
    print("\nReady to log in")
    print(f"  email={targets.email}")
    print(f"  password={targets.password}")
    if filled_workstreams:
        print("  status=all DRHP Preparation workstreams seeded")
    else:
        print("  status=onboarding complete, workspaces initialized")


def run_account_seed(targets_module: str) -> int:
    targets = parse_seed_targets(load_targets_module(targets_module))
    db, engine = open_session(targets)

    print("Nivara account bootstrap")
    print(f"  database_host={database_host(targets.database_url)}")
    print(f"  email={targets.email}")

    try:
        result = create_nivara_account(db, targets)
        db.commit()
        print_login_summary(targets, filled_workstreams=False)
        print(f"  user_id={result.get('userId')}")
        return 0
    except AppException as exc:
        db.rollback()
        print(f"Failed: {exc.message}", file=sys.stderr)
        if exc.details:
            print(f"  details={exc.details}", file=sys.stderr)
        return 1
    finally:
        db.close()
        engine.dispose()


def run_full_drhp_seed(targets_module: str) -> int:
    targets = parse_seed_targets(load_targets_module(targets_module))
    payloads = load_workstream_payloads()
    db, engine = open_session(targets)

    print("Nivara full DRHP bootstrap")
    print(f"  database_host={database_host(targets.database_url)}")
    print(f"  email={targets.email}")

    try:
        result = create_nivara_account(db, targets)
        user = get_user_by_email(db, targets.email)
        if user is None:
            raise RuntimeError("Seed user not found after account creation.")

        print("\nSeeding workstreams")
        fill_all_drhp_workstreams(db, user, payloads)
        db.commit()
        print_login_summary(targets, filled_workstreams=True)
        print(f"  user_id={result.get('userId')}")
        return 0
    except AppException as exc:
        db.rollback()
        print(f"Failed: {exc.message}", file=sys.stderr)
        if exc.details:
            print(f"  details={exc.details}", file=sys.stderr)
        return 1
    except Exception as exc:
        db.rollback()
        print(f"Failed: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()
        engine.dispose()
