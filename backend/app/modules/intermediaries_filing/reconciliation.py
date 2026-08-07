"""Cross-workstream filing reconciliation preview (IF2)."""

from __future__ import annotations

from typing import Any

from app.modules.intermediaries_filing.constants import RECONCILIATION_TOLERANCE
from app.modules.intermediaries_filing.decimal_utils import (
    add_decimals,
    is_filled_decimal,
    parse_decimal,
    subtract_decimals,
)


def _values_mismatch(a: str, b: str) -> bool:
    parsed_a = parse_decimal(a)
    parsed_b = parse_decimal(b)
    if parsed_a is not None and parsed_b is not None:
        return abs(parsed_a - parsed_b) > RECONCILIATION_TOLERANCE
    trimmed_a = str(a or "").strip()
    trimmed_b = str(b or "").strip()
    if not trimmed_a or not trimmed_b:
        return False
    return trimmed_a.lower() != trimmed_b.lower()


def _mismatch(
    workstream: str,
    field: str,
    if_value: str,
    linked_value: str,
    message: str,
) -> dict[str, Any]:
    return {
        "workstream": workstream,
        "field": field,
        "ifValue": if_value,
        "linkedValue": linked_value,
        "status": "potential-inconsistency",
        "message": message,
    }


def _build_ipo_setup_mismatches(payload: dict[str, Any], linked: dict[str, Any]) -> list[dict[str, Any]]:
    ipo = linked.get("ipoSetup") or {}
    if not ipo.get("available"):
        return []
    config = payload.get("issueConfigurationAndFilingSnapshot") or {}
    snapshot = config.get("ipoSetupLinkedSnapshot") or {}
    items: list[dict[str, Any]] = []
    pairs = [
        ("targetSmePlatform", snapshot.get("targetSmePlatform", ""), ipo.get("targetSmePlatform") or ""),
        ("issueMethod", snapshot.get("issueMethod", ""), ipo.get("issueMethod") or ""),
        ("freshIssue", snapshot.get("freshIssue", ""), ipo.get("freshIssue") or ""),
        ("ofs", snapshot.get("ofs", ""), ipo.get("ofs") or ""),
        ("totalOffer", snapshot.get("totalOffer", ""), ipo.get("totalOffer") or ""),
        ("faceValue", snapshot.get("faceValue", ""), ipo.get("faceValue") or ""),
        (
            "proposedFinalIssuePrice",
            snapshot.get("proposedFinalIssuePrice", ""),
            ipo.get("proposedFinalIssuePrice") or "",
        ),
    ]
    for field, if_value, linked_value in pairs:
        if _values_mismatch(str(if_value), str(linked_value)):
            items.append(
                _mismatch(
                    "ipoSetup",
                    field,
                    str(if_value),
                    str(linked_value),
                    f"{field}: filing snapshot {if_value or '—'} vs IPO Setup {linked_value or '—'}.",
                )
            )
    return items


def _build_capital_mismatches(payload: dict[str, Any], linked: dict[str, Any]) -> list[dict[str, Any]]:
    capital = linked.get("capitalOwnership") or {}
    if not capital.get("available"):
        return []
    config = payload.get("issueConfigurationAndFilingSnapshot") or {}
    snapshot = config.get("capitalLinkedSnapshot") or {}
    reconciliation = config.get("filingSnapshotReconciliation") or {}
    items: list[dict[str, Any]] = []
    pairs = [
        ("freshIssueShares", reconciliation.get("freshIssueShares", ""), capital.get("freshIssueShares") or ""),
        ("ofsShares", reconciliation.get("ofsShares", ""), capital.get("ofsShares") or ""),
        ("postIssueShares", reconciliation.get("postIssueShares", ""), capital.get("postIssueShares") or ""),
        ("preIssueShares", snapshot.get("preIssueShares", ""), capital.get("preIssueShares") or ""),
    ]
    for field, if_value, linked_value in pairs:
        if _values_mismatch(str(if_value), str(linked_value)):
            items.append(
                _mismatch(
                    "capitalOwnership",
                    field,
                    str(if_value),
                    str(linked_value),
                    f"{field}: filing reconciliation {if_value or '—'} vs Capital {linked_value or '—'}.",
                )
            )
    return items


def _build_objects_mismatches(payload: dict[str, Any], linked: dict[str, Any]) -> list[dict[str, Any]]:
    objects = linked.get("objectsOfIssue") or {}
    if not objects.get("available"):
        return []
    reconciliation = (
        (payload.get("issueConfigurationAndFilingSnapshot") or {}).get("filingSnapshotReconciliation") or {}
    )
    fresh_issue_amount = str(reconciliation.get("freshIssueAmount") or "")
    objects_total = str(objects.get("totalObjectsAmount") or "")
    items: list[dict[str, Any]] = []
    if is_filled_decimal(fresh_issue_amount) and is_filled_decimal(objects_total):
        difference = subtract_decimals(objects_total, fresh_issue_amount)
        diff_val = parse_decimal(difference)
        if diff_val is not None and abs(diff_val) > RECONCILIATION_TOLERANCE:
            items.append(
                _mismatch(
                    "objectsOfIssue",
                    "freshIssueAmount",
                    fresh_issue_amount,
                    objects_total,
                    (
                        f"Fresh issue amount {fresh_issue_amount or '—'} vs Objects deployment total "
                        f"{objects_total or '—'}."
                    ),
                )
            )
    return items


def _build_financials_mismatches(payload: dict[str, Any], linked: dict[str, Any]) -> list[dict[str, Any]]:
    financials = linked.get("financialsKpis") or {}
    if not financials.get("available"):
        return []
    items: list[dict[str, Any]] = []
    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    confirmations = section8.get("finalConfirmations") or {}
    if confirmations.get("financialsReconcile") == "no":
        items.append(
            {
                "workstream": "financialsKpis",
                "field": "financialsReconcile",
                "ifValue": confirmations.get("financialsReconcile", ""),
                "linkedValue": financials.get("latestFinancialPeriod") or "",
                "status": "potential-inconsistency",
                "message": "Issuer confirmation indicates Financials may not reconcile for the filing cut-off.",
            }
        )
    if financials.get("restatedFinancialsReady") is False:
        items.append(
            {
                "workstream": "financialsKpis",
                "field": "restatedFinancialsReady",
                "ifValue": "",
                "linkedValue": "not ready",
                "status": "missing-information",
                "message": "Linked Financials indicate restated financial readiness is not complete.",
            }
        )
    return items


def _build_lac_mismatches(payload: dict[str, Any], linked: dict[str, Any]) -> list[dict[str, Any]]:
    lac = linked.get("litigationApprovalsCompliance") or {}
    if not lac.get("available"):
        return []
    items: list[dict[str, Any]] = []
    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    confirmations = section8.get("finalConfirmations") or {}
    if confirmations.get("lacUpdatedThroughFilingCutOff") == "no":
        items.append(
            {
                "workstream": "litigationApprovalsCompliance",
                "field": "lacUpdatedThroughFilingCutOff",
                "ifValue": confirmations.get("lacUpdatedThroughFilingCutOff", ""),
                "linkedValue": str(lac.get("openMatterCount") or ""),
                "status": "potential-inconsistency",
                "message": "Issuer confirmation indicates LAC may not be updated through filing cut-off.",
            }
        )
    open_count = lac.get("openMatterCount") or 0
    if open_count > 0:
        items.append(
            {
                "workstream": "litigationApprovalsCompliance",
                "field": "openMatterCount",
                "ifValue": "",
                "linkedValue": str(open_count),
                "status": "pending-professional-confirmation",
                "message": f"{open_count} open LAC matter(s) require filing-cut-off review.",
            }
        )
    return items


def _build_bac_mismatches(payload: dict[str, Any], linked: dict[str, Any]) -> list[dict[str, Any]]:
    bac = linked.get("borrowingsAssetsContracts") or {}
    if not bac.get("available"):
        return []
    items: list[dict[str, Any]] = []
    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    confirmations = section8.get("finalConfirmations") or {}
    inspection_items = section8.get("inspectionItems") or []
    if confirmations.get("bacMattersReconcile") == "no":
        items.append(
            {
                "workstream": "borrowingsAssetsContracts",
                "field": "bacMattersReconcile",
                "ifValue": confirmations.get("bacMattersReconcile", ""),
                "linkedValue": str(bac.get("materialContractCount") or ""),
                "status": "potential-inconsistency",
                "message": "Issuer confirmation indicates BAC matters may not reconcile for filing.",
            }
        )
    pending_inspection = sum(
        1
        for item in inspection_items
        if isinstance(item, dict)
        and item.get("sourceWorkstream") == "bac"
        and item.get("inclusionStatus") == "pending_review"
    )
    candidates = bac.get("inspectionCandidateCount") or 0
    if candidates > 0 and pending_inspection > 0:
        items.append(
            {
                "workstream": "borrowingsAssetsContracts",
                "field": "inspectionCandidates",
                "ifValue": str(pending_inspection),
                "linkedValue": str(candidates),
                "status": "missing-information",
                "message": f"{pending_inspection} BAC-linked inspection item(s) still pending review.",
            }
        )
    return items


def _summarize(
    linked_available: bool,
    mismatches: list[dict[str, Any]],
    detail_available: str,
    detail_unavailable: str,
) -> dict[str, Any]:
    if not linked_available:
        return {
            "status": "Pending linked workstream",
            "detail": detail_unavailable,
            "mismatchCount": 0,
            "mismatches": [],
        }
    if not mismatches:
        status = "Reconciled"
    elif any(item.get("status") == "potential-inconsistency" for item in mismatches):
        status = "Potential inconsistency"
    elif any(item.get("status") == "missing-information" for item in mismatches):
        status = "Missing information"
    else:
        status = "Pending professional confirmation"
    return {
        "status": status,
        "detail": detail_available,
        "mismatchCount": len(mismatches),
        "mismatches": mismatches,
    }


def build_reconciliation_preview(
    payload: dict[str, Any],
    linked_refs: dict[str, Any],
) -> dict[str, Any]:
    ipo_mismatches = _build_ipo_setup_mismatches(payload, linked_refs)
    capital_mismatches = _build_capital_mismatches(payload, linked_refs)
    objects_mismatches = _build_objects_mismatches(payload, linked_refs)
    financials_mismatches = _build_financials_mismatches(payload, linked_refs)
    lac_mismatches = _build_lac_mismatches(payload, linked_refs)
    bac_mismatches = _build_bac_mismatches(payload, linked_refs)
    items = [
        *ipo_mismatches,
        *capital_mismatches,
        *objects_mismatches,
        *financials_mismatches,
        *lac_mismatches,
        *bac_mismatches,
    ]
    reconciliation_status = (
        (payload.get("issueConfigurationAndFilingSnapshot") or {})
        .get("filingSnapshotReconciliation", {})
        .get("filingConfirmationStatus", "")
    )
    status_label = reconciliation_status.replace("-", " ").title() if reconciliation_status else "Missing information"
    return {
        "ipoSetup": _summarize(
            (linked_refs.get("ipoSetup") or {}).get("available", False),
            ipo_mismatches,
            f"IPO Setup cross-check; filing confirmation: {status_label}.",
            "IPO Setup linked data not yet available.",
        ),
        "capitalOwnership": _summarize(
            (linked_refs.get("capitalOwnership") or {}).get("available", False),
            capital_mismatches,
            "Capital & Ownership share-count cross-check against filing reconciliation.",
            "Capital & Ownership linked data not yet available.",
        ),
        "objectsOfIssue": _summarize(
            (linked_refs.get("objectsOfIssue") or {}).get("available", False),
            objects_mismatches,
            "Objects of the Issue deployment amount cross-check.",
            "Objects of the Issue linked data not yet available.",
        ),
        "financialsKpis": _summarize(
            (linked_refs.get("financialsKpis") or {}).get("available", False),
            financials_mismatches,
            (
                f"Financials period {(linked_refs.get('financialsKpis') or {}).get('latestFinancialPeriod') or '—'} "
                "readiness cross-check."
            ),
            "Financials & KPIs linked data not yet available.",
        ),
        "litigationApprovalsCompliance": _summarize(
            (linked_refs.get("litigationApprovalsCompliance") or {}).get("available", False),
            lac_mismatches,
            "LAC filing-cut-off and open matter cross-check.",
            "Litigation, Approvals & Compliance linked data not yet available.",
        ),
        "borrowingsAssetsContracts": _summarize(
            (linked_refs.get("borrowingsAssetsContracts") or {}).get("available", False),
            bac_mismatches,
            "BAC material contracts and inspection candidate cross-check.",
            "Borrowings, Assets & Contracts linked data not yet available.",
        ),
        "items": items,
        "totalMismatchCount": len(items),
    }


def compute_total_offer_reconciliation_difference(payload: dict[str, Any]) -> str:
    reconciliation = (
        (payload.get("issueConfigurationAndFilingSnapshot") or {}).get("filingSnapshotReconciliation") or {}
    )
    return subtract_decimals(
        str(reconciliation.get("totalOfferAmount") or ""),
        add_decimals(
            str(reconciliation.get("freshIssueAmount") or ""),
            str(reconciliation.get("ofsAmount") or ""),
        ),
    )
