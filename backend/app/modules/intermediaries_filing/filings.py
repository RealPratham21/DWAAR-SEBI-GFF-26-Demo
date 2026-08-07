"""Filing and offer-document version helpers."""

from __future__ import annotations

from typing import Any


def get_filings(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    return [item for item in (section.get("filings") or []) if isinstance(item, dict)]


def filing_ids(payload: dict[str, Any]) -> set[str]:
    return {str(item.get("filingId")) for item in get_filings(payload) if item.get("filingId")}


def get_filing_by_id(payload: dict[str, Any], filing_id: str) -> dict[str, Any] | None:
    if not filing_id:
        return None
    for filing in get_filings(payload):
        if filing.get("filingId") == filing_id:
            return filing
    return None


def get_offer_document_versions(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = (
        payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    )
    return [item for item in (section.get("offerDocumentVersions") or []) if isinstance(item, dict)]


def document_version_ids(payload: dict[str, Any]) -> set[str]:
    return {
        str(item.get("documentVersionId"))
        for item in get_offer_document_versions(payload)
        if item.get("documentVersionId")
    }


def get_offer_document_version_by_id(
    payload: dict[str, Any],
    document_version_id: str,
) -> dict[str, Any] | None:
    if not document_version_id:
        return None
    for version in get_offer_document_versions(payload):
        if version.get("documentVersionId") == document_version_id:
            return version
    return None


def get_authoritative_version(payload: dict[str, Any]) -> dict[str, Any] | None:
    authoritative = [
        version
        for version in get_offer_document_versions(payload)
        if version.get("currentAuthoritativeVersion") == "yes"
    ]
    if len(authoritative) == 1:
        return authoritative[0]
    return None


def get_authoritative_version_conflict_count(payload: dict[str, Any]) -> int:
    return sum(
        1
        for version in get_offer_document_versions(payload)
        if version.get("currentAuthoritativeVersion") == "yes"
    )


def format_filing_label(filing: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not filing:
        if fallback_id:
            return f"Unknown filing ({fallback_id[:8]})"
        return "Unknown filing"

    parts = [
        str(filing.get("documentType") or "").replace("_", " ").strip(),
        str(filing.get("filingDate") or "").strip(),
        str(filing.get("referenceApplicationNumber") or "").strip(),
        str(filing.get("status") or "").replace("_", " ").strip(),
    ]
    parts = [part for part in parts if part]
    if parts:
        return " — ".join(parts)
    return str(filing.get("filingId") or fallback_id)[:8]


def format_document_version_label(
    version: dict[str, Any] | None,
    fallback_id: str = "",
) -> str:
    if not version:
        if fallback_id:
            return f"Unknown version ({fallback_id[:8]})"
        return "Unknown version"

    parts = [
        str(version.get("type") or "").replace("_", " ").strip(),
        str(version.get("versionLabel") or "").strip(),
        str(version.get("date") or "").strip(),
    ]
    parts = [part for part in parts if part]
    if parts:
        return " — ".join(parts)
    return str(version.get("documentVersionId") or fallback_id)[:8]
