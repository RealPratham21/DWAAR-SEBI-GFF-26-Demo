"""Property, Asset and Contract Master helpers."""

from __future__ import annotations

from typing import Any


def get_properties(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("immovablePropertiesAndOccupancyRights") or {}
    return [item for item in (section.get("properties") or []) if isinstance(item, dict)]


def get_property_by_id(payload: dict[str, Any], property_id: str) -> dict[str, Any] | None:
    if not property_id:
        return None
    return next((item for item in get_properties(payload) if item.get("id") == property_id), None)


def property_ids(payload: dict[str, Any]) -> set[str]:
    return {str(item.get("id")) for item in get_properties(payload) if item.get("id")}


def format_property_label(property_record: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not property_record:
        if fallback_id:
            return f"Unknown property ({fallback_id[:8]})"
        return "Unknown property"

    identity = property_record.get("identity") or {}
    name = str(identity.get("propertyName") or "").strip()
    city = str(identity.get("city") or "").strip()
    state = str(identity.get("state") or "").strip()
    address = ", ".join(part for part in (city, state) if part)
    property_type = str(identity.get("propertyType") or "").replace("-", " ")
    return name or address or property_type or str(property_record.get("id") or fallback_id)[:8]


def get_assets(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}
    return [item for item in (section.get("assets") or []) if isinstance(item, dict)]


def get_asset_by_id(payload: dict[str, Any], asset_id: str) -> dict[str, Any] | None:
    if not asset_id:
        return None
    return next((item for item in get_assets(payload) if item.get("id") == asset_id), None)


def asset_ids(payload: dict[str, Any]) -> set[str]:
    return {str(item.get("id")) for item in get_assets(payload) if item.get("id")}


def format_asset_label(asset: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not asset:
        if fallback_id:
            return f"Unknown asset ({fallback_id[:8]})"
        return "Unknown asset"

    description = str(asset.get("description") or "").strip()
    asset_class = str(asset.get("assetClass") or "").replace("-", " ")
    serial = str(asset.get("identificationSerialRegistrationNumber") or "").strip()
    return description or serial or asset_class or str(asset.get("id") or fallback_id)[:8]


def get_contracts(payload: dict[str, Any]) -> list[dict[str, Any]]:
    section = payload.get("materialBusinessStrategicAndOtherContracts") or {}
    return [item for item in (section.get("contracts") or []) if isinstance(item, dict)]


def get_contract_by_id(payload: dict[str, Any], contract_id: str) -> dict[str, Any] | None:
    if not contract_id:
        return None
    return next((item for item in get_contracts(payload) if item.get("id") == contract_id), None)


def contract_ids(payload: dict[str, Any]) -> set[str]:
    return {str(item.get("id")) for item in get_contracts(payload) if item.get("id")}


def format_contract_label(contract: dict[str, Any] | None, fallback_id: str = "") -> str:
    if not contract:
        if fallback_id:
            return f"Unknown contract ({fallback_id[:8]})"
        return "Unknown contract"

    basic_terms = contract.get("basicTerms") or {}
    parties = contract.get("parties") or {}
    title = str(basic_terms.get("agreementTitle") or "").strip()
    counterparty = str(parties.get("counterparty") or "").strip()
    category = str(contract.get("category") or "").replace("-", " ")
    return title or counterparty or category or str(contract.get("id") or fallback_id)[:8]
