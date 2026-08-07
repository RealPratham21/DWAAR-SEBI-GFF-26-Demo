"""Section completion for Borrowings, Assets & Contracts."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.borrowings_assets_contracts import decimal_utils as dm
from app.modules.borrowings_assets_contracts.constants import (
    BAC_CONFIRMATION_FIELDS,
    SECTION_IDS,
)


def _filled(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    return True


def _status_from(answered: int, total: int, extra_complete: bool = True) -> str:
    if answered == 0:
        return "not_started"
    if answered < total or not extra_complete:
        return "in_progress"
    return "complete"


def evaluate_facility_master_status(payload: dict[str, Any]) -> str:
    section = payload.get("financialIndebtednessAndFacilityMaster") or {}
    snapshot = section.get("borrowingSnapshot") or {}
    facilities = [f for f in (section.get("facilities") or []) if isinstance(f, dict)]
    core = [
        _filled(snapshot.get("positionAsOfDate")),
        _filled(snapshot.get("reportingCurrency")),
        _filled(snapshot.get("currentBorrowingsExist")),
        len(facilities) > 0,
    ]
    answered = sum(1 for item in core if item)
    facilities_complete = all(
        _filled((facility.get("lender") or {}).get("lenderName"))
        and _filled(facility.get("facilityType"))
        and (
            _filled((facility.get("sanctionAndUtilisation") or {}).get("currentSanctionedLimit"))
            or dm.is_filled(
                str((facility.get("sanctionAndUtilisation") or {}).get("principalOutstanding") or "")
            )
        )
        for facility in facilities
    )
    return _status_from(answered, len(core), facilities_complete)


def evaluate_security_charges_status(payload: dict[str, Any]) -> str:
    section = payload.get("securityChargesGuaranteesAndBorrowingPowers") or {}
    has_data = bool(
        section.get("securities")
        or section.get("charges")
        or section.get("guarantees")
        or _filled((section.get("borrowingPowers") or {}).get("boardBorrowingResolutionExists"))
    )
    if not has_data:
        return "not_started"

    securities = [s for s in (section.get("securities") or []) if isinstance(s, dict)]
    charges = [c for c in (section.get("charges") or []) if isinstance(c, dict)]
    securities_complete = all(
        _filled(security.get("linkedFacilityId")) and _filled(security.get("securityType"))
        for security in securities
    )
    charges_complete = all(
        _filled(charge.get("linkedFacilityId")) and _filled(charge.get("status")) for charge in charges
    )
    return "complete" if securities_complete and charges_complete else "in_progress"


def evaluate_covenants_consents_status(payload: dict[str, Any]) -> str:
    section = payload.get("covenantsDefaultsWaiversAndLenderConsents") or {}
    has_data = bool(
        section.get("covenants") or section.get("lenderConsents") or section.get("defaultEvents")
    )
    if not has_data:
        return "not_started"

    covenants = [c for c in (section.get("covenants") or []) if isinstance(c, dict)]
    consents = [c for c in (section.get("lenderConsents") or []) if isinstance(c, dict)]
    covenants_complete = all(
        _filled(covenant.get("linkedFacilityId")) and _filled(covenant.get("covenantType"))
        for covenant in covenants
    )
    consents_complete = all(
        _filled(consent.get("linkedFacilityId")) and _filled(consent.get("ipoConsentRequirement"))
        for consent in consents
    )
    return "complete" if covenants_complete and consents_complete else "in_progress"


def evaluate_properties_status(payload: dict[str, Any]) -> str:
    section = payload.get("immovablePropertiesAndOccupancyRights") or {}
    properties = [p for p in (section.get("properties") or []) if isinstance(p, dict)]
    if not properties:
        return "not_started"
    complete = all(
        _filled((property_.get("identity") or {}).get("propertyName"))
        or _filled((property_.get("identity") or {}).get("address"))
        for property_ in properties
    )
    return "complete" if complete else "in_progress"


def evaluate_assets_status(payload: dict[str, Any]) -> str:
    section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    has_data = bool(
        section.get("assets")
        or section.get("insuranceLinkages")
        or section.get("ipContractualDependencies")
    )
    if not has_data:
        return "not_started"
    assets = [a for a in (section.get("assets") or []) if isinstance(a, dict)]
    complete = all(_filled(asset.get("description")) or _filled(asset.get("assetClass")) for asset in assets)
    return "complete" if complete else "in_progress"


def evaluate_contracts_status(payload: dict[str, Any]) -> str:
    contracts = [
        c
        for c in (
            (payload.get("materialBusinessStrategicAndOtherContracts") or {}).get("contracts") or []
        )
        if isinstance(c, dict)
    ]
    if not contracts:
        return "not_started"
    complete = all(
        _filled((contract.get("basicTerms") or {}).get("agreementTitle"))
        or _filled((contract.get("parties") or {}).get("counterparty"))
        for contract in contracts
    )
    return "complete" if complete else "in_progress"


def evaluate_materiality_inspection_status(payload: dict[str, Any]) -> str:
    section = payload.get("contractMaterialityExpiryAndInspectionReadiness") or {}
    has_data = bool(
        section.get("materialityRecords")
        or section.get("nonOrdinaryCourseReviews")
        or section.get("breachDisputeReadiness")
        or section.get("inspectionCandidates")
    )
    if not has_data:
        return "not_started"
    records = [r for r in (section.get("materialityRecords") or []) if isinstance(r, dict)]
    complete = all(
        _filled(record.get("linkedContractId")) and _filled(record.get("materialityStatus"))
        for record in records
    )
    return "complete" if complete else "in_progress"


def evaluate_reconciliation_confirmations_status(payload: dict[str, Any]) -> str:
    confirmations = (payload.get("reconciliationChangesAndIssuerConfirmations") or {}).get(
        "confirmations"
    ) or {}
    answered = sum(
        1 for key, _ in BAC_CONFIRMATION_FIELDS if confirmations.get(key) not in (None, "")
    )
    if answered == 0:
        return "not_started"
    if answered < len(BAC_CONFIRMATION_FIELDS):
        return "in_progress"
    return "complete"


SECTION_EVALUATORS: dict[str, Callable[[dict[str, Any]], str]] = {
    "financial-indebtedness-and-facility-master": evaluate_facility_master_status,
    "security-charges-guarantees-and-borrowing-powers": evaluate_security_charges_status,
    "covenants-defaults-waivers-and-lender-consents": evaluate_covenants_consents_status,
    "immovable-properties-and-occupancy-rights": evaluate_properties_status,
    "material-assets-encumbrance-and-insurance-linkage": evaluate_assets_status,
    "material-business-strategic-and-other-contracts": evaluate_contracts_status,
    "contract-materiality-expiry-and-inspection-readiness": evaluate_materiality_inspection_status,
    "reconciliation-changes-and-issuer-confirmations": evaluate_reconciliation_confirmations_status,
}


def calculate_borrowings_assets_contracts_progress(payload: dict[str, Any]) -> dict[str, Any]:
    sections = {section_id: SECTION_EVALUATORS[section_id](payload) for section_id in SECTION_IDS}
    sections_complete = sum(1 for status in sections.values() if status == "complete")
    total_sections = len(sections)
    if sections_complete == 0:
        overall_status = "not_started"
    elif sections_complete == total_sections:
        overall_status = "complete"
    else:
        overall_status = "in_progress"
    return {
        "sections": sections,
        "sectionsComplete": sections_complete,
        "totalSections": total_sections,
        "overallStatus": overall_status,
    }
