"""Shared utilities for Nivara Techfab synthetic document fixtures."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

FIXTURE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = FIXTURE_ROOT.parents[1]
BACKEND_ROOT = REPO_ROOT / "backend"

CIN_RE = re.compile(r"^[A-Z0-9]{21}$")
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
UDYAM_RE = re.compile(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$")
PIN_RE = re.compile(r"^[1-9][0-9]{5}$")
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

WATERMARK_TEXT = "SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_PDF_MIMES = {"application/pdf"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png"}

QUALITY_SEED = 20260731


def ensure_backend_import_path() -> None:
    backend_path = str(BACKEND_ROOT)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def get_by_path(data: dict[str, Any], path: str) -> Any:
    current: Any = data
    for part in path.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list):
            try:
                index = int(part)
            except ValueError:
                return None
            if 0 <= index < len(current):
                current = current[index]
            else:
                return None
        else:
            return None
    return current


def set_by_path(data: dict[str, Any], path: str, value: Any) -> None:
    parts = path.split(".")
    current = data
    for part in parts[:-1]:
        if part not in current or not isinstance(current[part], dict):
            current[part] = {}
        current = current[part]
    current[parts[-1]] = value


def deep_merge(base: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    merged = deepcopy(base)
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge(merged[key], value)
        else:
            merged[key] = deepcopy(value)
    return merged


def format_full_address(office: dict[str, Any]) -> str:
    parts = [
        office.get("addressLine1", ""),
        office.get("addressLine2", ""),
        office.get("locality", ""),
        office.get("city", ""),
        office.get("state", ""),
        office.get("pinCode", ""),
        office.get("country", "India"),
    ]
    return ", ".join(part for part in parts if part)


def office_block_from_ground_truth(ground_truth: dict[str, Any], key: str) -> dict[str, Any]:
    info = ground_truth["informationTab"]
    office_type = "registered-office" if key == "current" else "previous-registered-office"
    for office in info["offices"]:
        if office["officeType"] == office_type:
            block = deepcopy(office)
            block["fullAddress"] = format_full_address(office)
            block["formattedSingleLine"] = block["fullAddress"]
            return block
    raise KeyError(f"Office block not found: {key}")


def registrations_lookup(ground_truth: dict[str, Any]) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for item in ground_truth["informationTab"]["registrations"]:
        reg_type = item["registrationType"]
        mapped = {
            "number": item["registrationNumber"],
            "registrationNumber": item["registrationNumber"],
            "gstin": item["registrationNumber"] if reg_type == "gstin" else None,
            "issueDate": item.get("issueDate", ""),
            "registrationDate": item.get("issueDate", ""),
            "effectiveDate": item.get("effectiveDate", ""),
            "status": item.get("currentStatus", ""),
            "legalNameOnRegistration": item.get("legalNameOnRegistration", ""),
            "addressOnRegistration": item.get("addressOnRegistration", ""),
            "enterpriseType": "Small" if reg_type == "udyam" else "",
        }
        if reg_type == "gstin":
            lookup["gst"] = mapped
            lookup["gstin"] = mapped
        else:
            lookup[reg_type] = mapped
    return lookup


def enrich_ground_truth(ground_truth: dict[str, Any]) -> dict[str, Any]:
    gt = deepcopy(ground_truth)
    current_office = office_block_from_ground_truth(gt, "current")
    original_office = office_block_from_ground_truth(gt, "original")

    gt["canonicalFacts"] = {"registeredOffice": current_office}
    historical = deepcopy(gt.get("historicalFacts", {}))
    historical["registeredOffices"] = {"original": original_office}
    gt["historicalFacts"] = historical

    office_change: dict[str, Any] | None = None
    for event in gt["informationTab"]["corporateEvents"]:
        if event["eventType"] == "registered-office-change":
            office_change = event
            break
    gt["corporateEvents"] = {"registeredOfficeChange": office_change or {}}

    refs = gt.get("documentReferences", {})
    gt["documentDates"] = {
        "officeAddressProof": refs.get("officeProof", {}),
        "certificateOfIncorporation": {"issueDate": refs.get("issueDates", {}).get("certificateOfIncorporation", "")},
    }

    info_tab = deepcopy(gt["informationTab"])
    info_tab["registrationsMap"] = registrations_lookup(gt)
    gt["informationTab"] = info_tab
    return gt


def build_template_context(ground_truth: dict[str, Any], manifest: dict[str, Any]) -> dict[str, Any]:
    gt = enrich_ground_truth(ground_truth)
    doc = deepcopy(manifest.get("documentSpecific", {}))
    overrides = manifest.get("overrides", {})

    principal_key = overrides.get("principalAddressKey", "current")
    if principal_key == "original":
        principal_address = gt["historicalFacts"]["registeredOffices"]["original"]
    else:
        principal_address = gt["canonicalFacts"]["registeredOffice"]

    regs = gt["informationTab"]["registrationsMap"]
    if manifest.get("templateName") == "gst-registration.html":
        gst = regs["gst"]
        if manifest.get("outputCategory") == "conflict":
            doc.setdefault("certificateEffectiveDate", doc.get("effectiveDate", gst["registrationDate"]))
            doc.setdefault("asOfDate", doc.get("certificateDate", gst["registrationDate"]))
        else:
            doc.setdefault("certificateEffectiveDate", gst.get("effectiveDate") or gst["registrationDate"])
            doc.setdefault("asOfDate", gst.get("effectiveDate") or gst["registrationDate"])

    if manifest.get("templateName") == "pan-registration.html":
        doc.setdefault("issuingAuthority", doc.get("issuingAuthorityLabel", "Generic tax registration authority"))

    return {
        "fixtureId": ground_truth["fixtureId"],
        "watermark": WATERMARK_TEXT,
        "gt": gt,
        "manifest": manifest,
        "doc": doc,
        "labels": ground_truth.get("displayLabels", {}),
        "principalAddress": principal_address,
        "override": overrides,
    }


def load_document_manifests() -> list[dict[str, Any]]:
    manifests_dir = FIXTURE_ROOT / "document-manifests"
    manifests: list[dict[str, Any]] = []
    for path in sorted(manifests_dir.glob("*.json")):
        manifests.append(load_json(path))
    return manifests


def resolve_expected_value(ground_truth: dict[str, Any], ref: str) -> Any:
    if ref.startswith("canonicalCurrentFacts."):
        path = ref.removeprefix("canonicalCurrentFacts.")
        if path == "offices.current":
            return office_block_from_ground_truth(ground_truth, "current")
        if path == "offices.original":
            return office_block_from_ground_truth(ground_truth, "original")
        flat = ground_truth.get("canonicalCurrentFacts", {})
        if path in flat:
            return flat[path]
        if path.startswith("offices.current."):
            return office_block_from_ground_truth(ground_truth, "current").get(path.removeprefix("offices.current."))
        if path.startswith("offices.original."):
            return office_block_from_ground_truth(ground_truth, "original").get(path.removeprefix("offices.original."))
        if path.startswith("constitutionalRecord."):
            return ground_truth["informationTab"]["constitutionalRecord"].get(path.removeprefix("constitutionalRecord."))
        if path.startswith("identity."):
            return ground_truth["informationTab"]["identity"].get(path.removeprefix("identity."))
        if path.startswith("registrations."):
            reg_path = path.removeprefix("registrations.")
            reg_key, _, field = reg_path.partition(".")
            lookup = registrations_lookup(ground_truth)
            alias = "gst" if reg_key == "gstin" else reg_key
            if alias in lookup:
                mapped = lookup[alias]
                field_map = {
                    "number": "number",
                    "issueDate": "issueDate",
                    "registrationDate": "registrationDate",
                    "effectiveDate": "effectiveDate",
                    "status": "status",
                }
                return mapped.get(field_map.get(field, field))
        return get_by_path(flat, path)

    if ref.startswith("historicalFacts."):
        path = ref.removeprefix("historicalFacts.")
        if path == "offices.original":
            return office_block_from_ground_truth(ground_truth, "original")
        historical = enrich_ground_truth(ground_truth)["historicalFacts"]
        value = get_by_path(historical, path)
        if value is not None:
            return value
        return get_by_path(ground_truth.get("historicalFacts", {}), path)

    if ref.startswith("documentReferences."):
        return get_by_path(ground_truth, ref)

    return get_by_path(ground_truth, ref)


def format_office_expected(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        if "formattedSingleLine" in value:
            return value["formattedSingleLine"]
        return format_full_address(value)
    return str(value)


def load_requirement_keys() -> set[str]:
    ensure_backend_import_path()
    from app.modules.company_incorporation.documents.requirements_config import (
        REQUIREMENT_DEFINITIONS,
    )

    return set(REQUIREMENT_DEFINITIONS.keys())


def validate_identifier_formats(ground_truth: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    identity = ground_truth["informationTab"]["identity"]
    regs = {item["registrationType"]: item for item in ground_truth["informationTab"]["registrations"]}

    cin = identity["cin"]
    if not CIN_RE.match(cin):
        errors.append(f"CIN invalid: {cin}")

    pan = regs["pan"]["registrationNumber"]
    if not PAN_RE.match(pan):
        errors.append(f"PAN invalid: {pan}")

    gstin = regs["gstin"]["registrationNumber"]
    if not GSTIN_RE.match(gstin):
        errors.append(f"GSTIN invalid: {gstin}")
    elif gstin[2:12] != pan:
        errors.append("GSTIN must embed PAN at positions 3-12")
    elif not gstin.startswith("27"):
        errors.append("GSTIN must use Maharashtra state code 27")

    udyam = regs["udyam"]["registrationNumber"]
    if not UDYAM_RE.match(udyam):
        errors.append(f"Udyam invalid: {udyam}")

    for office in ground_truth["informationTab"]["offices"]:
        if not PIN_RE.match(office["pinCode"]):
            errors.append(f"PIN invalid for office {office['id']}: {office['pinCode']}")

    refs = ground_truth["documentReferences"]["officeChange"]
    office_event = next(
        event
        for event in ground_truth["informationTab"]["corporateEvents"]
        if event["eventType"] == "registered-office-change"
    )
    if refs["srn"] != office_event["srn"]:
        errors.append("Office-change SRN mismatch between references and corporate event")

    original = office_block_from_ground_truth(ground_truth, "original")
    current = office_block_from_ground_truth(ground_truth, "current")
    if original["effectiveUntil"] != "2023-08-13":
        errors.append("Original office effectiveUntil must be 2023-08-13")
    if current["effectiveFrom"] != "2023-08-14":
        errors.append("Current office effectiveFrom must be 2023-08-14")

    historical_addr = ground_truth["historicalFacts"]["registrations"]["gstin"]["historicalPrincipalAddress"]
    if historical_addr != original["formattedSingleLine"]:
        errors.append("Historical GST address must match original registered office")

    current_gst = regs["gstin"]["addressOnRegistration"]
    if current["formattedSingleLine"] not in current_gst:
        errors.append("Current GST registration address must match current registered office")

    return errors


def output_paths() -> dict[str, Path]:
    generated = FIXTURE_ROOT / "generated"
    return {
        "clean": generated / "clean",
        "conflicts": generated / "conflicts",
        "quality_stress": generated / "quality-stress",
        "html_preview": generated / "html-preview",
        "manifests": FIXTURE_ROOT / "document-manifests",
        "templates": FIXTURE_ROOT / "templates",
    }


def category_output_dir(category: str) -> Path:
    paths = output_paths()
    mapping = {
        "clean": paths["clean"],
        "conflict": paths["conflicts"],
        "conflicts": paths["conflicts"],
        "quality-stress": paths["quality_stress"],
    }
    return mapping[category]
