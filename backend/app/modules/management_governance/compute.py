"""Derived Management & Governance computations — ports frontend compute.ts."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.modules.management_governance.applicability import build_governance_applicability_profile
from app.modules.management_governance.directors import count_by_category, get_directors


def _parse_date(value: str) -> datetime | None:
    if not value.strip():
        return None
    try:
        if "T" in value:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            parsed = datetime.strptime(value[:10], "%Y-%m-%d").replace(tzinfo=UTC)
        return parsed
    except ValueError:
        return None


def _is_within_last_three_years(date_str: str) -> bool:
    date = _parse_date(date_str)
    if date is None:
        return False
    three_years_ago = datetime.now(tz=UTC).replace(
        year=datetime.now(tz=UTC).year - 3,
    )
    return date >= three_years_ago


def _is_addition_event(event: str) -> bool:
    return event in ("appointment", "reappointment", "re-designation")


def _is_cessation_event(event: str) -> bool:
    return event in (
        "resignation",
        "cessation",
        "retirement",
        "death",
        "removal",
        "nominee-withdrawal",
    )


def compute_continuity_metrics(payload: dict[str, Any]) -> dict[str, int]:
    changes = payload.get("changesContinuityAndSuccession") or {}
    board_changes = changes.get("boardChanges") or []
    kmp_changes = changes.get("kmpSmpChanges") or []
    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    vacancies = kmp_section.get("vacancies") or []

    board_additions = len(
        [
            c
            for c in board_changes
            if isinstance(c, dict)
            and _is_within_last_three_years(str(c.get("effectiveDate") or ""))
            and _is_addition_event(str(c.get("event") or ""))
        ]
    )
    board_cessations = len(
        [
            c
            for c in board_changes
            if isinstance(c, dict)
            and _is_within_last_three_years(str(c.get("effectiveDate") or ""))
            and _is_cessation_event(str(c.get("event") or ""))
        ]
    )
    kmp_additions = len(
        [
            c
            for c in kmp_changes
            if isinstance(c, dict)
            and _is_within_last_three_years(str(c.get("effectiveDate") or ""))
            and _is_addition_event(str(c.get("event") or ""))
        ]
    )
    kmp_cessations = len(
        [
            c
            for c in kmp_changes
            if isinstance(c, dict)
            and _is_within_last_three_years(str(c.get("effectiveDate") or ""))
            and _is_cessation_event(str(c.get("event") or ""))
        ]
    )

    cfo_changes = len(
        [
            c
            for c in kmp_changes
            if isinstance(c, dict)
            and _is_within_last_three_years(str(c.get("effectiveDate") or ""))
            and (
                "cfo" in str(c.get("newDesignation") or "").lower()
                or "cfo" in str(c.get("previousDesignation") or "").lower()
            )
        ]
    )
    cs_changes = len(
        [
            c
            for c in kmp_changes
            if isinstance(c, dict)
            and _is_within_last_three_years(str(c.get("effectiveDate") or ""))
            and (
                "company secretary" in str(c.get("newDesignation") or "").lower()
                or "company secretary" in str(c.get("previousDesignation") or "").lower()
            )
        ]
    )

    critical_vacancies = len(
        [
            v
            for v in vacancies
            if isinstance(v, dict)
            and any(
                term in str(v.get("role") or "").lower()
                for term in ("cfo", "company secretary", "md", "ceo", "compliance")
            )
        ]
    )

    return {
        "boardAdditionsLastThreeYears": board_additions,
        "boardCessationsLastThreeYears": board_cessations,
        "kmpSmpAdditionsLastThreeYears": kmp_additions,
        "kmpSmpCessationsLastThreeYears": kmp_cessations,
        "currentVacancies": len([v for v in vacancies if isinstance(v, dict)]),
        "criticalRoleVacancies": critical_vacancies,
        "repeatCfoChanges": cfo_changes - 1 if cfo_changes > 1 else 0,
        "repeatCompanySecretaryChanges": cs_changes - 1 if cs_changes > 1 else 0,
    }


def compute_committee_readiness(
    payload: dict[str, Any],
    applicability: dict[str, Any],
) -> list[dict[str, Any]]:
    committees_section = payload.get("boardCommitteesAndGovernanceBodies") or {}
    committees = [
        c for c in (committees_section.get("committees") or []) if isinstance(c, dict)
    ]
    items: list[dict[str, Any]] = []

    for req in applicability.get("committeeRequirements") or []:
        if not isinstance(req, dict):
            continue
        committee_type = req.get("committeeType") or ""
        matching = [c for c in committees if c.get("committeeType") == committee_type]
        active = any(c.get("activeStatus") == "yes" for c in matching)
        constituted = len(matching) > 0
        member_count = sum(len(c.get("members") or []) for c in matching)
        has_chair = any(
            str(c.get("chairpersonDirectorId") or "").strip()
            or any(
                isinstance(m, dict) and m.get("role") == "chair"
                for m in (c.get("members") or [])
            )
            for c in matching
        )

        if not req.get("required"):
            status = "not_applicable"
        elif active and has_chair and member_count > 0:
            status = "ready"
        elif constituted:
            status = "pending"
        else:
            status = "missing_information"

        items.append(
            {
                "committeeType": committee_type,
                "required": bool(req.get("required")),
                "constituted": constituted,
                "active": active,
                "memberCount": member_count,
                "hasChair": has_chair,
                "status": status,
                "message": req.get("reason") or "",
            }
        )

    return items


def compute_management_governance_model(
    payload: dict[str, Any],
    linked_references: dict[str, Any] | None = None,
) -> dict[str, Any]:
    linked = linked_references or {}
    applicability = build_governance_applicability_profile(linked)
    board_counts = count_by_category(payload)
    directors = get_directors(payload)
    kmp_section = payload.get("kmpSeniorManagementAndOrganisationStructure") or {}
    kmp_records = [k for k in (kmp_section.get("kmpSmpRecords") or []) if isinstance(k, dict)]

    board_section = payload.get("boardStructureAndIpoGovernanceReadiness") or {}
    board_snapshot = board_section.get("boardSnapshot") or {}

    board_size = board_counts["current"] or _safe_int(board_snapshot.get("currentBoardSize"))
    proposed_board_size = _safe_int(board_snapshot.get("proposedBoardSizeForListing")) or (
        board_counts["proposed"] + board_counts["current"]
    )
    vacant_seats = _safe_int(board_snapshot.get("vacantBoardSeats"))

    pending_appointments = len(
        [
            d
            for d in directors
            if str(d.get("appointmentStatus") or "").startswith("proposed")
        ]
    )

    kmp_count = len(
        [
            k
            for k in kmp_records
            if k.get("classification") in ("kmp", "both")
        ]
    )
    smp_count = len(
        [
            k
            for k in kmp_records
            if k.get("classification") in ("senior-management", "both")
        ]
    )

    committee_readiness = compute_committee_readiness(payload, applicability)
    committees_required_count = len([c for c in committee_readiness if c.get("required")])
    committees_ready_count = len(
        [c for c in committee_readiness if c.get("required") and c.get("status") == "ready"]
    )

    policies_section = payload.get("governancePoliciesRptOversightAndConfirmations") or {}
    policies = [
        p
        for p in (policies_section.get("governancePolicies") or [])
        if isinstance(p, dict)
    ]
    policies_adopted_count = len(
        [p for p in policies if p.get("adoptedStatus") == "adopted"]
    )
    policies_required_count = len(
        [
            p
            for p in policies
            if p.get("applicableStatus") in ("required", "potentially-applicable")
        ]
    )

    leadership = board_section.get("leadership") or {}
    chairman = next(
        (d for d in directors if d.get("id") == leadership.get("chairmanDirectorId")),
        None,
    )
    md = next(
        (d for d in directors if d.get("id") == leadership.get("managingDirectorDirectorId")),
        None,
    )

    potential_directorship_limit_flags = len(
        [
            director
            for director in directors
            if len(
                [
                    d
                    for d in (director.get("otherDirectorships") or [])
                    if isinstance(d, dict) and d.get("currentOrCeased") == "current"
                ]
            )
            >= 7
            or (director.get("eligibility") or {}).get("directorshipLimitConcern") == "yes"
        ]
    )

    return {
        "applicability": applicability,
        "boardCounts": board_counts,
        "boardSize": board_size,
        "proposedBoardSize": proposed_board_size,
        "vacantSeats": vacant_seats,
        "pendingAppointments": pending_appointments,
        "kmpCount": kmp_count,
        "smpCount": smp_count,
        "committeeReadiness": committee_readiness,
        "committeesReadyCount": committees_ready_count,
        "committeesRequiredCount": committees_required_count,
        "policiesAdoptedCount": policies_adopted_count,
        "policiesRequiredCount": policies_required_count,
        "continuity": compute_continuity_metrics(payload),
        "chairmanName": (chairman or {}).get("fullLegalName") or "",
        "managingDirectorName": (md or {}).get("fullLegalName") or "",
        "potentialDirectorshipLimitFlags": potential_directorship_limit_flags,
    }


def _safe_int(value: Any) -> int:
    try:
        text = str(value or "").strip()
        if not text:
            return 0
        return int(float(text))
    except (TypeError, ValueError):
        return 0
