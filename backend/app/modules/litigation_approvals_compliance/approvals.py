"""Approval Master helpers — single canonical approval namespace."""

from __future__ import annotations

from typing import Any


def get_approvals(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("governmentRegulatoryAndBusinessApprovalsMaster") or {}
    return [a for a in (section.get("approvals") or []) if isinstance(a, dict)]


def approval_ids(payload: dict[str, Any]) -> set[str]:
    return {str(a.get("approvalId")) for a in get_approvals(payload) if a.get("approvalId")}


def get_approval_by_id(payload: dict[str, Any], approval_id: str) -> dict[str, Any] | None:
    if not approval_id:
        return None
    for approval in get_approvals(payload):
        if approval.get("approvalId") == approval_id:
            return approval
    return None


def format_approval_label(approval: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not approval:
        if fallback_id:
            return f"Unknown approval ({fallback_id[:8]})"
        return "Unknown approval"

    identity = approval.get("identity") or {}
    holder = approval.get("holder") or {}
    authority = approval.get("authority") or {}
    name = str(identity.get("approvalLicenceName") or "").strip()
    holder_name = str(holder.get("displayName") or "").strip()
    category = str(identity.get("category") or "").replace("-", " ")
    issuing = str(authority.get("issuingAuthority") or "").strip()

    parts = [part for part in (name, holder_name, category, issuing) if part]
    if parts:
        return " — ".join(parts)
    return str(approval.get("approvalId") or fallback_id)[:8]


def is_perpetual_approval(approval: dict[str, Any] | None) -> bool:
    if not approval:
        return False
    details = approval.get("details") or {}
    return details.get("perpetualNoExpiry") == "yes"


def is_renewable_approval(approval: dict[str, Any] | None) -> bool:
    if not approval:
        return False
    if is_perpetual_approval(approval):
        return False
    details = approval.get("details") or {}
    renewal = approval.get("renewalMetadata") or {}
    return bool(
        str(details.get("renewalFrequency") or "").strip()
        or str(renewal.get("renewalDueDate") or "").strip()
        or approval.get("status")
        in {"renewal-pending", "expired-renewal-applied", "expired-renewal-not-applied"}
    )
