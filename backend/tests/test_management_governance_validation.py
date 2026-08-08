"""Unit tests for Management & Governance draft validation."""

from __future__ import annotations

import json
from pathlib import Path

from app.modules.management_governance.validation import validate_kmp_draft

PAYLOADS_FILE = Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json"


def test_kmp_draft_allows_director_refs_in_organisation_structure() -> None:
    payloads = json.loads(PAYLOADS_FILE.read_text(encoding="utf-8"))
    mg_payload = payloads["management-governance"]
    directors_section = mg_payload["directorsProfilesAppointmentsAndEligibility"]
    kmp_section = mg_payload["kmpSeniorManagementAndOrganisationStructure"]

    # Simulate incremental bootstrap: directors saved first, KMP section validated next.
    full_payload = {
        "directorsProfilesAppointmentsAndEligibility": directors_section,
        "kmpSeniorManagementAndOrganisationStructure": {},
    }

    validate_kmp_draft(kmp_section, full_payload)


def test_governance_policies_draft_accepts_nivara_rpt_applicability() -> None:
    payloads = json.loads(PAYLOADS_FILE.read_text(encoding="utf-8"))
    from app.modules.management_governance.validation import validate_governance_policies_draft

    section = payloads["management-governance"]["governancePoliciesRptOversightAndConfirmations"]
    validate_governance_policies_draft(section, payloads["management-governance"])
