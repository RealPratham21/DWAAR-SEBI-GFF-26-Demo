"""Cross-record reference integrity for Borrowings, Assets & Contracts."""

from __future__ import annotations

from typing import Any

from app.modules.borrowings_assets_contracts.constants import SECTION_LABELS
from app.modules.borrowings_assets_contracts.facilities import format_facility_label, get_facility_by_id
from app.modules.borrowings_assets_contracts.masters import (
    format_asset_label,
    format_contract_label,
    format_property_label,
    get_asset_by_id,
    get_contract_by_id,
    get_property_by_id,
)


def _push(
    deps: list[dict[str, Any]],
    category: str,
    record_id: str,
    section_id: str,
    label: str,
) -> None:
    deps.append(
        {
            "category": category,
            "recordId": record_id,
            "sectionId": section_id,
            "label": label,
        }
    )


def count_facility_references(payload: dict[str, Any], facility_id: str) -> list[dict[str, Any]]:
    if not facility_id:
        return []
    deps: list[dict[str, Any]] = []

    security_section = payload.get("securityChargesGuaranteesAndBorrowingPowers") or {}
    for security in security_section.get("securities") or []:
        if not isinstance(security, dict):
            continue
        if security.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "security",
                str(security.get("id") or ""),
                "security-charges-guarantees-and-borrowing-powers",
                "Security → Facility",
            )

    for charge in security_section.get("charges") or []:
        if not isinstance(charge, dict):
            continue
        if charge.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "charge",
                str(charge.get("id") or ""),
                "security-charges-guarantees-and-borrowing-powers",
                "Charge → Facility",
            )

    for guarantee in security_section.get("guarantees") or []:
        if not isinstance(guarantee, dict):
            continue
        if guarantee.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "guarantee",
                str(guarantee.get("id") or ""),
                "security-charges-guarantees-and-borrowing-powers",
                "Guarantee → Facility",
            )

    covenant_section = payload.get("covenantsDefaultsWaiversAndLenderConsents") or {}
    for covenant in covenant_section.get("covenants") or []:
        if not isinstance(covenant, dict):
            continue
        if covenant.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "covenant",
                str(covenant.get("id") or ""),
                "covenants-defaults-waivers-and-lender-consents",
                "Covenant → Facility",
            )

    for consent in covenant_section.get("lenderConsents") or []:
        if not isinstance(consent, dict):
            continue
        if consent.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "consent",
                str(consent.get("id") or ""),
                "covenants-defaults-waivers-and-lender-consents",
                "Lender consent → Facility",
            )

    for event in covenant_section.get("defaultEvents") or []:
        if not isinstance(event, dict):
            continue
        if event.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "default",
                str(event.get("id") or ""),
                "covenants-defaults-waivers-and-lender-consents",
                "Default event → Facility",
            )

    for event in covenant_section.get("restructuringEvents") or []:
        if not isinstance(event, dict):
            continue
        if event.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "restructuring",
                str(event.get("id") or ""),
                "covenants-defaults-waivers-and-lender-consents",
                "Restructuring event → Facility",
            )

    for cross_default in covenant_section.get("crossDefaults") or []:
        if not isinstance(cross_default, dict):
            continue
        linked_ids = cross_default.get("linkedFacilityIds") or []
        if (
            cross_default.get("linkedFacilityId") == facility_id
            or facility_id in linked_ids
        ):
            _push(
                deps,
                "cross-default",
                str(cross_default.get("id") or ""),
                "covenants-defaults-waivers-and-lender-consents",
                "Cross-default → Facility",
            )

    assets_section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    for asset in assets_section.get("assets") or []:
        if not isinstance(asset, dict):
            continue
        if asset.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "security",
                str(asset.get("id") or ""),
                "material-assets-encumbrance-and-insurance-linkage",
                "Asset → Facility",
            )

    reconciliation = payload.get("reconciliationChangesAndIssuerConfirmations") or {}
    for repayment in reconciliation.get("objectsOfIssueRepayments") or []:
        if not isinstance(repayment, dict):
            continue
        if repayment.get("linkedFacilityId") == facility_id:
            _push(
                deps,
                "objects-repayment",
                str(repayment.get("id") or ""),
                "reconciliation-changes-and-issuer-confirmations",
                "Objects repayment → Facility",
            )

    for change in reconciliation.get("changes") or []:
        if not isinstance(change, dict):
            continue
        if change.get("relatedRecordType") == "facility" and change.get("relatedRecordId") == facility_id:
            _push(
                deps,
                "change",
                str(change.get("id") or ""),
                "reconciliation-changes-and-issuer-confirmations",
                "Change register → Facility",
            )

    return deps


def count_property_references(payload: dict[str, Any], property_id: str) -> list[dict[str, Any]]:
    if not property_id:
        return []
    deps: list[dict[str, Any]] = []

    security_section = payload.get("securityChargesGuaranteesAndBorrowingPowers") or {}
    for security in security_section.get("securities") or []:
        if not isinstance(security, dict):
            continue
        if security.get("linkedPropertyId") == property_id:
            _push(
                deps,
                "security",
                str(security.get("id") or ""),
                "security-charges-guarantees-and-borrowing-powers",
                "Security → Property",
            )

    properties_section = payload.get("immovablePropertiesAndOccupancyRights") or {}
    for issue in properties_section.get("propertyIssues") or []:
        if not isinstance(issue, dict):
            continue
        if issue.get("linkedPropertyId") == property_id:
            _push(
                deps,
                "property-issue",
                str(issue.get("id") or ""),
                "immovable-properties-and-occupancy-rights",
                "Property issue → Property",
            )

    assets_section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    for asset in assets_section.get("assets") or []:
        if not isinstance(asset, dict):
            continue
        if asset.get("linkedPropertyId") == property_id:
            _push(
                deps,
                "security",
                str(asset.get("id") or ""),
                "material-assets-encumbrance-and-insurance-linkage",
                "Asset → Property",
            )

    for insurance in assets_section.get("insuranceLinkages") or []:
        if not isinstance(insurance, dict):
            continue
        if insurance.get("linkedPropertyId") == property_id:
            _push(
                deps,
                "insurance-linkage",
                str(insurance.get("id") or ""),
                "material-assets-encumbrance-and-insurance-linkage",
                "Insurance linkage → Property",
            )

    reconciliation = payload.get("reconciliationChangesAndIssuerConfirmations") or {}
    for change in reconciliation.get("changes") or []:
        if not isinstance(change, dict):
            continue
        if change.get("relatedRecordType") == "property" and change.get("relatedRecordId") == property_id:
            _push(
                deps,
                "change",
                str(change.get("id") or ""),
                "reconciliation-changes-and-issuer-confirmations",
                "Change register → Property",
            )

    return deps


def count_asset_references(payload: dict[str, Any], asset_id: str) -> list[dict[str, Any]]:
    if not asset_id:
        return []
    deps: list[dict[str, Any]] = []

    security_section = payload.get("securityChargesGuaranteesAndBorrowingPowers") or {}
    for security in security_section.get("securities") or []:
        if not isinstance(security, dict):
            continue
        if security.get("linkedAssetId") == asset_id:
            _push(
                deps,
                "security",
                str(security.get("id") or ""),
                "security-charges-guarantees-and-borrowing-powers",
                "Security → Asset",
            )

    assets_section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    for reconciliation in assets_section.get("assetFinancialsReconciliations") or []:
        if not isinstance(reconciliation, dict):
            continue
        if reconciliation.get("linkedAssetId") == asset_id:
            _push(
                deps,
                "asset-reconciliation",
                str(reconciliation.get("id") or ""),
                "material-assets-encumbrance-and-insurance-linkage",
                "Financials reconciliation → Asset",
            )

    for insurance in assets_section.get("insuranceLinkages") or []:
        if not isinstance(insurance, dict):
            continue
        if insurance.get("linkedAssetId") == asset_id:
            _push(
                deps,
                "insurance-linkage",
                str(insurance.get("id") or ""),
                "material-assets-encumbrance-and-insurance-linkage",
                "Insurance linkage → Asset",
            )

    changes_section = payload.get("reconciliationChangesAndIssuerConfirmations") or {}
    for change in changes_section.get("changes") or []:
        if not isinstance(change, dict):
            continue
        if change.get("relatedRecordType") == "asset" and change.get("relatedRecordId") == asset_id:
            _push(
                deps,
                "change",
                str(change.get("id") or ""),
                "reconciliation-changes-and-issuer-confirmations",
                "Change register → Asset",
            )

    return deps


def count_contract_references(payload: dict[str, Any], contract_id: str) -> list[dict[str, Any]]:
    if not contract_id:
        return []
    deps: list[dict[str, Any]] = []

    section7 = payload.get("contractMaterialityExpiryAndInspectionReadiness") or {}

    for record in section7.get("materialityRecords") or []:
        if not isinstance(record, dict):
            continue
        if record.get("linkedContractId") == contract_id:
            _push(
                deps,
                "materiality",
                str(record.get("id") or ""),
                "contract-materiality-expiry-and-inspection-readiness",
                "Materiality review → Contract",
            )

    for record in section7.get("nonOrdinaryCourseReviews") or []:
        if not isinstance(record, dict):
            continue
        if record.get("linkedContractId") == contract_id:
            _push(
                deps,
                "non-ordinary-course-review",
                str(record.get("id") or ""),
                "contract-materiality-expiry-and-inspection-readiness",
                "Non-ordinary-course review → Contract",
            )

    for record in section7.get("breachDisputeReadiness") or []:
        if not isinstance(record, dict):
            continue
        if record.get("linkedContractId") == contract_id:
            _push(
                deps,
                "breach-dispute",
                str(record.get("id") or ""),
                "contract-materiality-expiry-and-inspection-readiness",
                "Breach/dispute readiness → Contract",
            )

    for record in section7.get("inspectionCandidates") or []:
        if not isinstance(record, dict):
            continue
        if record.get("linkedContractId") == contract_id:
            _push(
                deps,
                "inspection-candidate",
                str(record.get("id") or ""),
                "contract-materiality-expiry-and-inspection-readiness",
                "Inspection candidate → Contract",
            )

    assets_section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    for dependency in assets_section.get("ipContractualDependencies") or []:
        if not isinstance(dependency, dict):
            continue
        if dependency.get("linkedContractId") == contract_id:
            _push(
                deps,
                "ip-dependency",
                str(dependency.get("id") or ""),
                "material-assets-encumbrance-and-insurance-linkage",
                "IP dependency → Contract",
            )

    reconciliation = payload.get("reconciliationChangesAndIssuerConfirmations") or {}
    for change in reconciliation.get("changes") or []:
        if not isinstance(change, dict):
            continue
        if change.get("relatedRecordType") == "contract" and change.get("relatedRecordId") == contract_id:
            _push(
                deps,
                "change",
                str(change.get("id") or ""),
                "reconciliation-changes-and-issuer-confirmations",
                "Change register → Contract",
            )

    return deps


def _format_dependency_message(
    payload: dict[str, Any],
    record_id: str,
    deps: list[dict[str, Any]],
    label_formatter,
) -> str:
    if not deps:
        return ""
    label = label_formatter(payload, record_id)
    categories = list(dict.fromkeys(str(dep.get("label") or "") for dep in deps))
    sections = list(
        dict.fromkeys(
            SECTION_LABELS.get(str(dep.get("sectionId") or ""), str(dep.get("sectionId") or ""))
            for dep in deps
        )
    )
    return (
        f'"{label}" is referenced by {len(deps)} record(s) ({", ".join(categories)}) '
        f'across: {", ".join(sections)}. Remove or reassign dependent records first.'
    )


def format_facility_dependency_message(
    payload: dict[str, Any],
    facility_id: str,
    deps: list[dict[str, Any]],
) -> str:
    def _label(p: dict[str, Any], fid: str) -> str:
        return format_facility_label(get_facility_by_id(p, fid), fid)

    return _format_dependency_message(payload, facility_id, deps, _label)


def format_property_dependency_message(
    payload: dict[str, Any],
    property_id: str,
    deps: list[dict[str, Any]],
) -> str:
    def _label(p: dict[str, Any], pid: str) -> str:
        return format_property_label(get_property_by_id(p, pid), pid)

    return _format_dependency_message(payload, property_id, deps, _label)


def format_asset_dependency_message(
    payload: dict[str, Any],
    asset_id: str,
    deps: list[dict[str, Any]],
) -> str:
    def _label(p: dict[str, Any], aid: str) -> str:
        return format_asset_label(get_asset_by_id(p, aid), aid)

    return _format_dependency_message(payload, asset_id, deps, _label)


def format_contract_dependency_message(
    payload: dict[str, Any],
    contract_id: str,
    deps: list[dict[str, Any]],
) -> str:
    def _label(p: dict[str, Any], cid: str) -> str:
        return format_contract_label(get_contract_by_id(p, cid), cid)

    return _format_dependency_message(payload, contract_id, deps, _label)
