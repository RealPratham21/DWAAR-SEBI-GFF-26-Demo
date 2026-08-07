"""Governance applicability profile — ports frontend applicability.ts."""

from __future__ import annotations

from typing import Any

from app.modules.management_governance.constants import GOVERNANCE_APPLICABILITY_RULES_VERSION

ListingSegment = str
GovernanceRegime = str


def _resolve_listing_segment(linked_refs: dict[str, Any]) -> ListingSegment:
    ipo_setup = linked_refs.get("ipoSetup") or {}
    if not ipo_setup.get("available"):
        return "unknown"
    target = str(ipo_setup.get("targetListingSegment") or "").lower()
    if "sme" in target:
        return "sme"
    if "main" in target:
        return "main-board"
    return "unknown"


def build_governance_applicability_profile(
    linked_refs: dict[str, Any],
) -> dict[str, Any]:
    listing_segment = _resolve_listing_segment(linked_refs)
    notes: list[str] = []

    if listing_segment == "unknown":
        notes.append(
            "IPO Setup target segment is not available — applying conservative "
            "Companies Act baseline until linked.",
        )

    is_sme = listing_segment == "sme"
    is_main_board = listing_segment == "main-board"

    regimes: list[GovernanceRegime] = ["companies-act", "icdr-ipo"]
    if is_sme:
        regimes.append("sme-listing")
    if is_main_board:
        regimes.append("main-board-lodr")

    minimum_board_size = 3 if is_sme else 6 if is_main_board else 3
    requires_independent_directors = is_main_board
    minimum_independent_directors = 3 if is_main_board else 1 if is_sme else 0
    requires_woman_director = True
    requires_resident_director = True
    requires_audit_committee = is_main_board
    requires_nomination_remuneration_committee = is_main_board
    requires_stakeholders_relationship_committee = is_main_board
    requires_risk_management_committee = is_main_board
    requires_csr_committee = not is_sme
    requires_regulation23_rpt_framework = is_main_board

    committee_requirements = [
        {
            "committeeType": "audit-committee",
            "required": requires_audit_committee,
            "reason": (
                "Main Board LODR requires an Audit Committee."
                if is_main_board
                else (
                    "Not universally mandatory for SME listing — confirm applicability."
                    if is_sme
                    else "Confirm listing segment to determine Audit Committee requirement."
                )
            ),
        },
        {
            "committeeType": "nomination-remuneration-committee",
            "required": requires_nomination_remuneration_committee,
            "reason": (
                "Main Board LODR requires Nomination & Remuneration Committee."
                if is_main_board
                else "May not apply to SME issuers — review SME listing requirements."
            ),
        },
        {
            "committeeType": "stakeholders-relationship-committee",
            "required": requires_stakeholders_relationship_committee,
            "reason": (
                "Main Board LODR requires Stakeholders Relationship Committee."
                if is_main_board
                else "SME issuers may have reduced committee requirements."
            ),
        },
        {
            "committeeType": "risk-management-committee",
            "required": requires_risk_management_committee,
            "reason": (
                "Main Board issuers typically require Risk Management Committee."
                if is_main_board
                else "Not assumed mandatory for SME issuers."
            ),
        },
        {
            "committeeType": "csr-committee",
            "required": requires_csr_committee,
            "reason": (
                "CSR Committee applies when CSR provisions are triggered under Companies Act."
            ),
        },
        {
            "committeeType": "ipo-committee",
            "required": False,
            "reason": "IPO Committee is IPO-process specific — capture if constituted.",
        },
        {
            "committeeType": "independent-directors-price-band-committee",
            "required": False,
            "reason": (
                "Price-band process committee applies when IPO pricing process requires it."
            ),
        },
    ]

    company = linked_refs.get("company") or {}
    if not company.get("available"):
        notes.append(
            "Company & Incorporation link pending — private/public status not confirmed.",
        )

    return {
        "rulesVersion": GOVERNANCE_APPLICABILITY_RULES_VERSION,
        "listingSegment": listing_segment,
        "regimes": regimes,
        "minimumBoardSize": minimum_board_size,
        "requiresIndependentDirectors": requires_independent_directors,
        "minimumIndependentDirectors": minimum_independent_directors,
        "requiresWomanDirector": requires_woman_director,
        "requiresResidentDirector": requires_resident_director,
        "requiresAuditCommittee": requires_audit_committee,
        "requiresNominationRemunerationCommittee": requires_nomination_remuneration_committee,
        "requiresStakeholdersRelationshipCommittee": requires_stakeholders_relationship_committee,
        "requiresRiskManagementCommittee": requires_risk_management_committee,
        "requiresCsrCommittee": requires_csr_committee,
        "requiresRegulation23RptFramework": requires_regulation23_rpt_framework,
        "committeeRequirements": committee_requirements,
        "notes": notes,
    }
