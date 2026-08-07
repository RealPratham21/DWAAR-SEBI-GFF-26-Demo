"""Facility Master helpers — single canonical facility namespace."""

from __future__ import annotations

from typing import Any


def get_facilities(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("financialIndebtednessAndFacilityMaster") or {}
    return [item for item in (section.get("facilities") or []) if isinstance(item, dict)]


def get_facility_by_id(payload: dict[str, Any], facility_id: str) -> dict[str, Any] | None:
    if not facility_id:
        return None
    return next((facility for facility in get_facilities(payload) if facility.get("id") == facility_id), None)


def facility_ids(payload: dict[str, Any]) -> set[str]:
    return {str(f.get("id")) for f in get_facilities(payload) if f.get("id")}


def format_facility_label(facility: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not facility:
        if fallback_id:
            return f"Unknown facility ({fallback_id[:8]})"
        return "Unknown facility"

    lender = facility.get("lender") or {}
    borrower = facility.get("borrower") or {}
    lender_name = str(lender.get("lenderName") or "").strip()
    borrower_name = (
        str(borrower.get("displayName") or "").strip()
        or str(borrower.get("linkedGroupEntityId") or "").strip()
        or str(borrower.get("borrowerType") or "").replace("-", " ")
    )
    facility_type = str(facility.get("facilityType") or "").replace("-", " ")
    parts = [part for part in (lender_name, borrower_name, facility_type) if part]
    if parts:
        return " — ".join(parts)
    return str(facility.get("id") or fallback_id)[:8]
