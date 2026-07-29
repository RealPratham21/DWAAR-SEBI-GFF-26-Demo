"""Map submitted SME onboarding draft data into a one-time workspace prefill."""

import uuid
from copy import deepcopy
from typing import Any

from app.modules.company_incorporation.defaults import empty_payload

_REGISTRATION_EMPTY_FIELDS = {
    "issuingAuthority": "",
    "legalNameOnRegistration": "",
    "addressOnRegistration": "",
    "issueDate": "",
    "effectiveDate": "",
    "expiryDate": "",
    "currentStatus": "",
    "previousRegistrationNumber": "",
    "updatedAfterNameChange": "",
    "updatedAfterOfficeChange": "",
}


def _section(draft_data: dict[str, Any], key: str) -> dict[str, Any]:
    value = draft_data.get(key)
    if isinstance(value, dict):
        return value
    return {}


def _registration_key(registration_type: str, registration_number: str) -> tuple[str, str]:
    return registration_type, registration_number.strip().upper()


def _append_registration(
    registrations: list[dict[str, Any]],
    seen: set[tuple[str, str]],
    *,
    registration_type: str,
    registration_number: str,
) -> None:
    number = registration_number.strip().upper()
    if not number:
        return
    key = _registration_key(registration_type, number)
    if key in seen:
        return
    seen.add(key)
    registrations.append(
        {
            "id": str(uuid.uuid4()),
            "registrationType": registration_type,
            "registrationNumber": number,
            **_REGISTRATION_EMPTY_FIELDS,
        },
    )


def build_prefilled_payload(draft_data: dict[str, Any]) -> dict[str, Any]:
    payload = empty_payload()
    company = _section(draft_data, "companyIdentity")
    business = _section(draft_data, "businessClassification")
    office = _section(company, "registeredOffice")

    identity = payload["identity"]
    identity["legalName"] = str(company.get("legalName", "")).strip()
    identity["cin"] = str(company.get("cin", "")).strip().upper()
    identity["incorporationDate"] = str(company.get("incorporationDate", "")).strip()
    identity["incorporationState"] = str(company.get("registeredState", "")).strip()
    identity["registrarOfCompanies"] = str(company.get("registrarOfCompanies", "")).strip()
    identity["companyClass"] = str(company.get("companyClass", "")).strip()
    identity["email"] = str(company.get("companyEmail", "")).strip()
    website = str(company.get("companyWebsite", "")).strip()
    if website:
        identity["website"] = website

    address_line1 = str(office.get("addressLine1", "")).strip()
    if address_line1:
        payload["offices"].append(
            {
                "id": str(uuid.uuid4()),
                "officeType": "registered-office",
                "addressLine1": address_line1,
                "addressLine2": str(office.get("addressLine2", "")).strip(),
                "locality": str(office.get("locality", "")).strip(),
                "city": str(office.get("city", "")).strip(),
                "district": str(office.get("district", "")).strip(),
                "state": str(office.get("state", "")).strip(),
                "pinCode": str(office.get("pinCode", "")).strip(),
                "country": str(office.get("country", "")).strip() or "India",
                "effectiveFrom": "",
                "effectiveUntil": "",
                "occupancyType": "",
            },
        )

    registrations: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    _append_registration(
        registrations,
        seen,
        registration_type="pan",
        registration_number=str(business.get("pan", "")),
    )

    if str(business.get("gstRegistrationRequired", "")).strip().lower() == "yes":
        for entry in business.get("gstRegistrations") or []:
            if not isinstance(entry, dict):
                continue
            _append_registration(
                registrations,
                seen,
                registration_type="gstin",
                registration_number=str(entry.get("gstin", "")),
            )

    _append_registration(
        registrations,
        seen,
        registration_type="udyam",
        registration_number=str(business.get("udyamRegistration", "")),
    )
    _append_registration(
        registrations,
        seen,
        registration_type="iec",
        registration_number=str(business.get("importExportCode", "")),
    )
    payload["registrations"] = registrations
    return payload


def merge_payload(base: dict[str, Any], updates: dict[str, Any]) -> dict[str, Any]:
    merged = deepcopy(base)
    for key, value in updates.items():
        merged[key] = value
    return merged
