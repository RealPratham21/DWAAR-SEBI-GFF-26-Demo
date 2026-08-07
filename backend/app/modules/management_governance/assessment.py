"""Governance Assessment — ports frontend assessment.ts."""

from __future__ import annotations

from typing import Any

from app.modules.management_governance.compute import compute_management_governance_model
from app.modules.management_governance.constants import (
    GOVERNANCE_ASSESSMENT_GROUP_LABELS,
    GOVERNANCE_ASSESSMENT_GROUPS,
    GOVERNANCE_CRITERION_STATE_LABELS,
    MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS,
)
from app.modules.management_governance.directors import compute_directorship_counts
from app.modules.management_governance.progress import calculate_management_governance_progress

_STATE_PRIORITY = [
    "potential_concern",
    "missing_information",
    "pending_appointment",
    "pending_board_approval",
    "pending_shareholder_approval",
    "pending_linked_workstream",
    "pending_professional_confirmation",
    "appears_ready",
    "not_applicable",
]


def _worst_state(states: list[str]) -> str:
    for state in _STATE_PRIORITY:
        if state in states:
            return state
    return "missing_information"


def _derive_result(criteria: list[dict[str, Any]]) -> dict[str, str]:
    has_concern = any(c["state"] == "potential_concern" for c in criteria)
    has_pending_appointment = any(c["state"] == "pending_appointment" for c in criteria)
    has_professional = any(
        c["state"]
        in (
            "pending_professional_confirmation",
            "pending_board_approval",
            "pending_shareholder_approval",
        )
        for c in criteria
    )
    missing_count = sum(1 for c in criteria if c["state"] == "missing_information")

    if has_concern:
        return {
            "result": "potential_concerns_identified",
            "resultLabel": "Potential concerns identified",
            "summary": (
                "One or more governance checks show a potential concern that needs review "
                "before filing readiness can improve."
            ),
        }
    if has_pending_appointment:
        return {
            "result": "pending_appointments",
            "resultLabel": "Pending appointments",
            "summary": "Some Board or management appointments are still proposed or pending.",
        }
    if has_professional:
        return {
            "result": "professional_confirmation_required",
            "resultLabel": "Professional confirmation required",
            "summary": (
                "Some items still need board, shareholder or professional confirmation."
            ),
        }
    if missing_count > len(criteria) / 2:
        return {
            "result": "insufficient_information",
            "resultLabel": "Disclosure readiness in progress",
            "summary": (
                "Much of the management and governance record is still blank or unanswered."
            ),
        }
    return {
        "result": "readiness_in_progress",
        "resultLabel": "Readiness in progress",
        "summary": (
            "Entered information is largely captured; remaining gaps are noted below."
        ),
    }


def build_governance_assessment(
    payload: dict[str, Any],
    model: dict[str, Any],
    progress: dict[str, Any],
    linked_references: dict[str, Any],
) -> dict[str, Any]:
    criteria: list[dict[str, Any]] = []
    applicability = model.get("applicability") or {}
    board_counts = model.get("boardCounts") or {}
    directors_section = payload.get("directorsProfilesAppointmentsAndEligibility") or {}
    directors = [
        d for d in (directors_section.get("directors") or []) if isinstance(d, dict)
    ]

    criteria.append(
        {
            "id": "minimum-board-size",
            "group": "board_composition",
            "label": "Minimum Board size",
            "state": (
                "appears_ready"
                if board_counts.get("current", 0) >= applicability.get("minimumBoardSize", 0)
                else (
                    "potential_concern"
                    if board_counts.get("current", 0) > 0
                    else "missing_information"
                )
            ),
            "reason": (
                f"Current directors: {board_counts.get('current', 0)}; applicable minimum: "
                f"{applicability.get('minimumBoardSize', 0)} "
                f"({applicability.get('listingSegment', 'unknown')} segment)."
            ),
        }
    )

    criteria.append(
        {
            "id": "woman-director-readiness",
            "group": "board_composition",
            "label": "Woman director readiness",
            "state": (
                "not_applicable"
                if not applicability.get("requiresWomanDirector")
                else (
                    "appears_ready"
                    if board_counts.get("women", 0) >= 1
                    else "pending_appointment"
                )
            ),
            "reason": (
                f"{board_counts.get('women', 0)} woman director(s) among current Board."
                if board_counts.get("women", 0) >= 1
                else "No woman director recorded among current Board members."
            ),
        }
    )

    criteria.append(
        {
            "id": "independent-director-readiness",
            "group": "board_composition",
            "label": "Independent director readiness",
            "state": (
                "not_applicable"
                if not applicability.get("requiresIndependentDirectors")
                else (
                    "appears_ready"
                    if board_counts.get("independent", 0)
                    >= applicability.get("minimumIndependentDirectors", 0)
                    else (
                        "pending_appointment"
                        if board_counts.get("independent", 0) > 0
                        else "missing_information"
                    )
                )
            ),
            "reason": (
                f"{board_counts.get('independent', 0)} independent director(s); applicable "
                f"minimum {applicability.get('minimumIndependentDirectors', 0)}."
                if applicability.get("requiresIndependentDirectors")
                else "Independent director count not assumed mandatory for SME listing segment."
            ),
        }
    )

    criteria.append(
        {
            "id": "resident-director-readiness",
            "group": "board_composition",
            "label": "Resident director readiness",
            "state": (
                "not_applicable"
                if not applicability.get("requiresResidentDirector")
                else (
                    "appears_ready"
                    if board_counts.get("resident", 0) >= 1
                    else "missing_information"
                )
            ),
            "reason": (
                f"{board_counts.get('resident', 0)} resident director(s) recorded."
                if board_counts.get("resident", 0) >= 1
                else "Resident director not identified from country of residence."
            ),
        }
    )

    criteria.append(
        {
            "id": "board-vacancies",
            "group": "board_composition",
            "label": "Board vacancies",
            "state": (
                "appears_ready"
                if model.get("vacantSeats", 0) == 0 and board_counts.get("current", 0) > 0
                else (
                    "potential_concern"
                    if model.get("vacantSeats", 0) > 0
                    else "missing_information"
                )
            ),
            "reason": (
                f"{model.get('vacantSeats', 0)} vacant seat(s) recorded."
                if model.get("vacantSeats", 0) > 0
                else "No vacant seats recorded."
            ),
        }
    )

    criteria.append(
        {
            "id": "proposed-vs-current-distinction",
            "group": "board_composition",
            "label": "Current versus proposed appointments distinguished",
            "state": (
                "appears_ready"
                if (
                    any(
                        str(d.get("appointmentStatus") or "").startswith("proposed")
                        for d in directors
                    )
                    and any(d.get("appointmentStatus") == "current" for d in directors)
                )
                or len(directors) > 0
                else "missing_information"
            ),
            "reason": "Directors carry explicit current/proposed appointment status.",
        }
    )

    for director in directors:
        if not str(director.get("din") or "").strip():
            criteria.append(
                {
                    "id": f"din-{director.get('id')}",
                    "group": "director_eligibility",
                    "label": f"DIN — {director.get('fullLegalName') or director.get('id')}",
                    "state": "missing_information",
                    "reason": "Director Identification Number not recorded.",
                }
            )

        directorship_counts = compute_directorship_counts(director)
        eligibility = director.get("eligibility") or {}
        if (
            directorship_counts["totalCurrent"] >= 7
            or eligibility.get("directorshipLimitConcern") == "yes"
        ):
            criteria.append(
                {
                    "id": f"directorship-limit-{director.get('id')}",
                    "group": "director_eligibility",
                    "label": (
                        f"Directorship count — {director.get('fullLegalName') or director.get('id')}"
                    ),
                    "state": "potential_concern",
                    "reason": (
                        f"{directorship_counts['totalCurrent']} current directorship(s) recorded; "
                        "threshold review suggested."
                    ),
                }
            )

        if eligibility.get("sebiDebarment") == "yes" or eligibility.get(
            "stockExchangeDebarment"
        ) == "yes":
            criteria.append(
                {
                    "id": f"debarment-{director.get('id')}",
                    "group": "director_eligibility",
                    "label": (
                        f"Debarment declaration — "
                        f"{director.get('fullLegalName') or director.get('id')}"
                    ),
                    "state": "potential_concern",
                    "reason": (
                        "A debarment or restraint declaration is marked yes — "
                        "explanation required."
                    ),
                }
            )

        if (
            str(director.get("appointmentStatus") or "").startswith("proposed")
            and not str(director.get("boardApprovalDate") or "").strip()
        ):
            criteria.append(
                {
                    "id": f"pending-board-{director.get('id')}",
                    "group": "director_eligibility",
                    "label": (
                        f"Board approval — {director.get('fullLegalName') or director.get('id')}"
                    ),
                    "state": "pending_board_approval",
                    "reason": "Proposed appointment without board approval date recorded.",
                }
            )

    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    readiness = kmp_section.get("kmpRoleReadiness") or {}
    for role_key, role_label in (
        ("cfo", "CFO"),
        ("companySecretary", "Company Secretary"),
        ("complianceOfficer", "Compliance Officer"),
    ):
        status = readiness.get(role_key) or ""
        if status == "completed":
            state = "appears_ready"
        elif status == "professional_confirmation_required":
            state = "pending_professional_confirmation"
        elif status == "not_applicable":
            state = "not_applicable"
        elif status == "in_progress":
            state = "pending_appointment"
        else:
            state = "missing_information"
        criteria.append(
            {
                "id": f"kmp-{role_key}",
                "group": "management_coverage",
                "label": f"{role_label} coverage",
                "state": state,
                "reason": (
                    f"Readiness status: {status.replace('_', ' ')}."
                    if status
                    else "Readiness status not recorded."
                ),
            }
        )

    continuity = model.get("continuity") or {}
    if continuity.get("criticalRoleVacancies", 0) > 0:
        criteria.append(
            {
                "id": "critical-vacancies",
                "group": "management_coverage",
                "label": "Critical role vacancies",
                "state": "potential_concern",
                "reason": (
                    f"{continuity.get('criticalRoleVacancies', 0)} critical role "
                    "vacancy/vacancies recorded."
                ),
            }
        )

    for item in model.get("committeeReadiness") or []:
        if not isinstance(item, dict) or not item.get("required"):
            continue
        status = item.get("status")
        if status == "ready":
            state = "appears_ready"
        elif status == "pending":
            state = "pending_appointment"
        elif status == "not_applicable":
            state = "not_applicable"
        else:
            state = "missing_information"
        criteria.append(
            {
                "id": f"committee-{item.get('committeeType')}",
                "group": "board_committees",
                "label": str(item.get("committeeType") or "").replace("-", " "),
                "state": state,
                "reason": item.get("message") or "",
            }
        )

    capital_ownership = linked_references.get("capitalOwnership") or {}
    if not capital_ownership.get("available"):
        criteria.append(
            {
                "id": "capital-ownership-link",
                "group": "remuneration_and_interests",
                "label": "Capital & Ownership shareholding link",
                "state": "pending_linked_workstream",
                "reason": (
                    "Director/KMP shareholding cross-check awaits Capital & Ownership (M2 wiring)."
                ),
            }
        )

    financials_kpis = linked_references.get("financialsKpis") or {}
    if not financials_kpis.get("available"):
        criteria.append(
            {
                "id": "financials-kpis-link",
                "group": "remuneration_and_interests",
                "label": "Financials & KPIs RPT references",
                "state": "pending_linked_workstream",
                "reason": "RPT amount references await Financials & KPIs (M2 wiring).",
            }
        )

    if continuity.get("repeatCfoChanges", 0) > 0 or continuity.get(
        "repeatCompanySecretaryChanges", 0
    ) > 0:
        criteria.append(
            {
                "id": "repeat-kmp-changes",
                "group": "management_continuity",
                "label": "Repeat CFO / Company Secretary changes",
                "state": "potential_concern",
                "reason": (
                    "Multiple CFO or Company Secretary changes in the last three years — "
                    "explanation suggested."
                ),
            }
        )

    policies_section = payload.get("governancePoliciesRptOversightAndConfirmations") or {}
    confirmations = policies_section.get("confirmations") or {}
    unanswered_confirmations = sum(
        1 for key, _ in MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS if not confirmations.get(key)
    )

    for key, label in MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS:
        confirmed = bool(confirmations.get(key))
        criteria.append(
            {
                "id": f"confirmation-{key}",
                "group": "governance_processes",
                "label": label,
                "state": "appears_ready" if confirmed else "missing_information",
                "reason": "Confirmed." if confirmed else "Not confirmed yet.",
            }
        )

    board_section = payload.get("boardStructureAndIpoGovernanceReadiness") or {}
    ipo_committee = board_section.get("ipoCommittee") or {}
    constituted = ipo_committee.get("constituted") or ""
    criteria.append(
        {
            "id": "ipo-committee",
            "group": "ipo_specific_governance",
            "label": "IPO Committee constituted",
            "state": (
                "appears_ready"
                if constituted == "yes"
                else (
                    "pending_professional_confirmation"
                    if constituted == "not_sure"
                    else "missing_information"
                )
            ),
            "reason": (
                "IPO Committee marked as constituted."
                if constituted == "yes"
                else "IPO Committee constitution not confirmed."
            ),
        }
    )

    price_band = board_section.get("independentDirectorPriceBandProcess") or {}
    criteria.append(
        {
            "id": "price-band-process",
            "group": "ipo_specific_governance",
            "label": "Independent-director price-band process",
            "state": (
                "not_applicable"
                if price_band.get("requiredApplicabilityStatus") == "not-applicable"
                else (
                    "appears_ready"
                    if price_band.get("committeeConstituted") == "yes"
                    else (
                        "pending_professional_confirmation"
                        if price_band.get("requiredApplicabilityStatus")
                        == "professional-confirmation-required"
                        else "missing_information"
                    )
                )
            ),
            "reason": "Price-band committee process captured for IPO readiness review.",
        }
    )

    groups: list[dict[str, Any]] = []
    for group in GOVERNANCE_ASSESSMENT_GROUPS:
        group_criteria = [c for c in criteria if c["group"] == group]
        groups.append(
            {
                "group": group,
                "label": GOVERNANCE_ASSESSMENT_GROUP_LABELS[group],
                "headlineState": _worst_state([c["state"] for c in group_criteria]),
                "criteria": group_criteria,
            }
        )

    counts = {
        "appearsReady": sum(1 for c in criteria if c["state"] == "appears_ready"),
        "potentialConcern": sum(1 for c in criteria if c["state"] == "potential_concern"),
        "missingInformation": sum(1 for c in criteria if c["state"] == "missing_information"),
        "pendingAppointment": sum(1 for c in criteria if c["state"] == "pending_appointment"),
        "pendingBoardApproval": sum(
            1 for c in criteria if c["state"] == "pending_board_approval"
        ),
        "pendingShareholderApproval": sum(
            1 for c in criteria if c["state"] == "pending_shareholder_approval"
        ),
        "pendingLinkedWorkstream": sum(
            1 for c in criteria if c["state"] == "pending_linked_workstream"
        ),
        "pendingProfessionalConfirmation": sum(
            1 for c in criteria if c["state"] == "pending_professional_confirmation"
        ),
        "notApplicable": sum(1 for c in criteria if c["state"] == "not_applicable"),
    }

    result_info = _derive_result(criteria)

    return {
        **result_info,
        "criteria": criteria,
        "groups": groups,
        "counts": counts,
        "metrics": {
            "boardSize": model.get("boardSize", 0),
            "sectionsComplete": progress.get("sectionsComplete", 0),
            "unansweredConfirmations": unanswered_confirmations,
            "pendingAppointments": model.get("pendingAppointments", 0),
            "potentialConcerns": counts["potentialConcern"],
        },
    }


def assess_management_governance(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    progress = calculate_management_governance_progress(payload)
    model = compute_management_governance_model(payload, linked)
    return build_governance_assessment(payload, model, progress, linked)


# Exported for tests / documentation parity with frontend labels.
GOVERNANCE_CRITERION_STATE_LABELS_EXPORT = GOVERNANCE_CRITERION_STATE_LABELS
