"""Tests for Nivara bootstrap section ordering."""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from nivara_bootstrap_lib import (  # noqa: E402
    WORKSTREAM_SECTION_ORDER_OVERRIDES,
    _resolve_section_order,
)


def test_management_governance_saves_directors_before_board_structure() -> None:
    section_ids = WORKSTREAM_SECTION_ORDER_OVERRIDES["management-governance"]
    ordered = _resolve_section_order("management-governance", section_ids)
    assert ordered.index("directors-profiles-appointments-and-eligibility") < ordered.index(
        "board-structure-and-ipo-governance-readiness"
    )


def test_industry_market_saves_sources_before_dependent_sections() -> None:
    section_ids = WORKSTREAM_SECTION_ORDER_OVERRIDES["industry-market"]
    ordered = _resolve_section_order("industry-market", section_ids)
    assert ordered.index("research-sources-and-industry-report-governance") < ordered.index(
        "macroeconomic-and-industry-context"
    )


def test_borrowings_saves_properties_before_security_charges() -> None:
    section_ids = WORKSTREAM_SECTION_ORDER_OVERRIDES["borrowings-assets-contracts"]
    ordered = _resolve_section_order("borrowings-assets-contracts", section_ids)
    assert ordered.index("immovable-properties-and-occupancy-rights") < ordered.index(
        "security-charges-guarantees-and-borrowing-powers"
    )


def test_intermediaries_saves_document_versions_before_filings() -> None:
    section_ids = WORKSTREAM_SECTION_ORDER_OVERRIDES["intermediaries-filing"]
    ordered = _resolve_section_order("intermediaries-filing", section_ids)
    assert ordered.index(
        "final-offer-document-advertisements-material-documents-and-filing-readiness"
    ) < ordered.index("filing-and-regulatory-milestone-tracker")
