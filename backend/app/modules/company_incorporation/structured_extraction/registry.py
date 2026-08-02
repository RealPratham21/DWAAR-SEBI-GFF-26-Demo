"""Canonical fact registry and requirement extraction specifications."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any, TypedDict

from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStrategy,
    FactValueType,
)

InformationPath = str | Callable[[dict[str, Any]], Any]

_ADDRESS_COMPONENT_KEYS: tuple[str, ...] = (
    "addressLine1",
    "addressLine2",
    "locality",
    "city",
    "district",
    "state",
    "pinCode",
    "country",
)


class RequirementSpec(TypedDict):
    supported: bool
    expected_fact_keys: list[str]
    semantic_required: bool


@dataclass(frozen=True, slots=True)
class FactDefinition:
    fact_key: str
    value_type: str
    display_label: str
    requirement_keys: tuple[str, ...]
    deterministic_supported: bool
    semantic_supported: bool
    label_aliases: tuple[str, ...]
    information_path: InformationPath
    can_be_historical: bool
    absence_creates_issue: bool
    may_block_disclosure: bool
    comparison_strategy: str


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _identity_field(field: str) -> InformationPath:
    return f"identity.{field}"


def _constitutional_field(field: str) -> InformationPath:
    return f"constitutionalRecord.{field}"


def _find_corporate_event(payload: dict[str, Any], event_type: str) -> dict[str, Any] | None:
    for event in payload.get("corporateEvents") or []:
        if not isinstance(event, dict):
            continue
        if _clean(event.get("eventType")) == event_type:
            return event
    return None


def _find_registration(payload: dict[str, Any], registration_type: str) -> dict[str, Any] | None:
    for registration in payload.get("registrations") or []:
        if not isinstance(registration, dict):
            continue
        if _clean(registration.get("registrationType")) == registration_type:
            return registration
    return None


def _current_registered_office(payload: dict[str, Any]) -> dict[str, Any] | None:
    matches = [
        office
        for office in payload.get("offices") or []
        if isinstance(office, dict)
        and _clean(office.get("officeType")) == "registered-office"
        and not _clean(office.get("effectiveUntil"))
    ]
    if not matches:
        return None
    if len(matches) == 1:
        return matches[0]
    return max(matches, key=lambda office: _clean(office.get("effectiveFrom")))


def _previous_registered_office(payload: dict[str, Any]) -> dict[str, Any] | None:
    explicit_previous = [
        office
        for office in payload.get("offices") or []
        if isinstance(office, dict)
        and _clean(office.get("officeType")) == "previous-registered-office"
    ]
    if explicit_previous:
        return explicit_previous[0]

    historical_registered = [
        office
        for office in payload.get("offices") or []
        if isinstance(office, dict)
        and _clean(office.get("officeType")) == "registered-office"
        and _clean(office.get("effectiveUntil"))
    ]
    if not historical_registered:
        return None
    return max(historical_registered, key=lambda office: _clean(office.get("effectiveUntil")))


def _office_address_dict(office: dict[str, Any] | None) -> dict[str, str] | None:
    if not office:
        return None
    address = {
        key: _clean(office.get(key)) for key in _ADDRESS_COMPONENT_KEYS if _clean(office.get(key))
    }
    return address or None


def _office_change_event(payload: dict[str, Any]) -> dict[str, Any] | None:
    return _find_corporate_event(payload, "registered-office-change")


def _resolve_dot_path(payload: dict[str, Any], path: str) -> Any:
    if not path:
        return None

    if path.startswith("identity."):
        field = path.split(".", 1)[1]
        identity = payload.get("identity") or {}
        return identity.get(field) if isinstance(identity, dict) else None

    if path.startswith("constitutionalRecord."):
        field = path.split(".", 1)[1]
        record = payload.get("constitutionalRecord") or {}
        return record.get(field) if isinstance(record, dict) else None

    if path == "corporateHistory.originalIncorporation.effectiveDate":
        event = _find_corporate_event(payload, "original-incorporation")
        return event.get("effectiveDate") if event else None

    if path.startswith("corporateHistory.officeChange."):
        field = path.rsplit(".", 1)[-1]
        event = _office_change_event(payload)
        if not event:
            return None
        if field == "previousAddress":
            previous_office = _previous_registered_office(payload)
            address = _office_address_dict(previous_office)
            if address:
                return address
            previous_value = _clean(event.get("previousValue"))
            return {"fullAddress": previous_value} if previous_value else None
        if field == "newAddress":
            current_office = _current_registered_office(payload)
            address = _office_address_dict(current_office)
            if address:
                return address
            new_value = _clean(event.get("newValue"))
            return {"fullAddress": new_value} if new_value else None
        field_map = {
            "boardResolutionDate": "boardResolutionDate",
            "effectiveDate": "effectiveDate",
            "filingDate": "filingDate",
            "filingForm": "filingForm",
            "srn": "srn",
        }
        mapped = field_map.get(field)
        return event.get(mapped) if mapped else None

    if path == "offices.currentRegistered.address":
        return _office_address_dict(_current_registered_office(payload))

    if path == "offices.currentRegistered.effectiveFrom":
        office = _current_registered_office(payload)
        return office.get("effectiveFrom") if office else None

    if path == "offices.currentRegistered.occupancyType":
        office = _current_registered_office(payload)
        return office.get("occupancyType") if office else None

    if path == "offices.previousRegistered.address":
        return _office_address_dict(_previous_registered_office(payload))

    if path == "offices.previousRegistered.effectiveUntil":
        office = _previous_registered_office(payload)
        return office.get("effectiveUntil") if office else None

    if path.startswith("registrations.pan."):
        registration = _find_registration(payload, "pan")
        if not registration:
            return None
        field = path.rsplit(".", 1)[-1]
        if field == "registrationNumber":
            return registration.get("registrationNumber")
        if field == "legalNameOnRegistration":
            return registration.get("legalNameOnRegistration")
        if field == "issueDate":
            return registration.get("issueDate")
        return None

    if path.startswith("registrations.gstin."):
        registration = _find_registration(payload, "gstin")
        if not registration:
            return None
        field = path.rsplit(".", 1)[-1]
        field_map = {
            "registrationNumber": "registrationNumber",
            "legalNameOnRegistration": "legalNameOnRegistration",
            "addressOnRegistration": "addressOnRegistration",
            "registrationDate": "issueDate",
            "effectiveDate": "effectiveDate",
            "currentStatus": "currentStatus",
            # amendmentDate / certificateIssueDate intentionally unmapped → no_information
        }
        mapped = field_map.get(field)
        return registration.get(mapped) if mapped else None

    if path.startswith("registrations.udyam."):
        registration = _find_registration(payload, "udyam")
        if not registration:
            return None
        field = path.rsplit(".", 1)[-1]
        field_map = {
            "registrationNumber": "registrationNumber",
            "legalNameOnRegistration": "legalNameOnRegistration",
            "registrationDate": "issueDate",
            "addressOnRegistration": "addressOnRegistration",
            "enterpriseType": "enterpriseType",
        }
        mapped = field_map.get(field)
        return registration.get(mapped) if mapped else None

    return None


def _fact(
    *,
    fact_key: str,
    value_type: str,
    display_label: str,
    requirement_keys: tuple[str, ...],
    label_aliases: tuple[str, ...],
    information_path: InformationPath,
    comparison_strategy: str,
    deterministic_supported: bool = True,
    semantic_supported: bool = False,
    can_be_historical: bool = False,
    absence_creates_issue: bool = True,
    may_block_disclosure: bool = False,
) -> FactDefinition:
    return FactDefinition(
        fact_key=fact_key,
        value_type=value_type,
        display_label=display_label,
        requirement_keys=requirement_keys,
        deterministic_supported=deterministic_supported,
        semantic_supported=semantic_supported,
        label_aliases=label_aliases,
        information_path=information_path,
        can_be_historical=can_be_historical,
        absence_creates_issue=absence_creates_issue,
        may_block_disclosure=may_block_disclosure,
        comparison_strategy=comparison_strategy,
    )


FACT_REGISTRY: dict[str, FactDefinition] = {
    "identity.legalName": _fact(
        fact_key="identity.legalName",
        value_type=FactValueType.STRING,
        display_label="Legal name",
        requirement_keys=(
            "original-certificate-of-incorporation",
            "current-certified-moa",
            "current-certified-aoa",
            "current-registered-office-filing",
            "filing-acknowledgement-or-srn",
            "registered-office-address-proof",
            "pan-certificate",
            "gst-registration-certificates",
            "udyam-registration-certificate",
        ),
        label_aliases=(
            "legal name",
            "name of the company",
            "company name",
            "name of company",
            "name of enterprise",
        ),
        information_path=_identity_field("legalName"),
        comparison_strategy=ComparisonStrategy.LEGAL_NAME,
        semantic_supported=True,
        may_block_disclosure=True,
    ),
    "identity.cin": _fact(
        fact_key="identity.cin",
        value_type=FactValueType.IDENTIFIER,
        display_label="CIN",
        requirement_keys=(
            "original-certificate-of-incorporation",
            "current-certified-aoa",
            "current-registered-office-filing",
            "filing-acknowledgement-or-srn",
        ),
        label_aliases=(
            "cin",
            "corporate identity number",
            "corporate identification number",
            "company identification number",
        ),
        information_path=_identity_field("cin"),
        comparison_strategy=ComparisonStrategy.EXACT_IDENTIFIER,
        may_block_disclosure=True,
    ),
    "identity.incorporationDate": _fact(
        fact_key="identity.incorporationDate",
        value_type=FactValueType.DATE,
        display_label="Incorporation date",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("date of incorporation", "incorporation date"),
        information_path=_identity_field("incorporationDate"),
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
    ),
    "identity.incorporationState": _fact(
        fact_key="identity.incorporationState",
        value_type=FactValueType.STRING,
        display_label="Incorporation state",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("state of incorporation", "incorporation state"),
        information_path=_identity_field("incorporationState"),
        comparison_strategy=ComparisonStrategy.TEXT,
    ),
    "identity.registrarOfCompanies": _fact(
        fact_key="identity.registrarOfCompanies",
        value_type=FactValueType.TEXT,
        display_label="Registrar of Companies",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("registrar of companies", "roc"),
        information_path=_identity_field("registrarOfCompanies"),
        comparison_strategy=ComparisonStrategy.TEXT,
        semantic_supported=True,
    ),
    "identity.companyClass": _fact(
        fact_key="identity.companyClass",
        value_type=FactValueType.STRING,
        display_label="Company class",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("class of company", "company class"),
        information_path=_identity_field("companyClass"),
        comparison_strategy=ComparisonStrategy.TEXT,
    ),
    "identity.companyCategory": _fact(
        fact_key="identity.companyCategory",
        value_type=FactValueType.STRING,
        display_label="Company category",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("category of company", "company category", "category"),
        information_path=_identity_field("companyCategory"),
        comparison_strategy=ComparisonStrategy.TEXT,
    ),
    "identity.companySubCategory": _fact(
        fact_key="identity.companySubCategory",
        value_type=FactValueType.STRING,
        display_label="Company sub-category",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("sub category", "sub-category", "sub-category of company"),
        information_path=_identity_field("companySubCategory"),
        comparison_strategy=ComparisonStrategy.TEXT,
        absence_creates_issue=False,
    ),
    "identity.governingAct": _fact(
        fact_key="identity.governingAct",
        value_type=FactValueType.STRING,
        display_label="Governing Act",
        requirement_keys=(
            "original-certificate-of-incorporation",
            "current-certified-moa",
        ),
        label_aliases=("governing act", "companies act"),
        information_path=_identity_field("governingAct"),
        comparison_strategy=ComparisonStrategy.TEXT,
    ),
    "corporateHistory.originalIncorporation.effectiveDate": _fact(
        fact_key="corporateHistory.originalIncorporation.effectiveDate",
        value_type=FactValueType.DATE,
        display_label="Original incorporation effective date",
        requirement_keys=("original-certificate-of-incorporation",),
        label_aliases=("date of incorporation", "effective date of incorporation"),
        information_path="corporateHistory.originalIncorporation.effectiveDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
    "corporateHistory.officeChange.boardResolutionDate": _fact(
        fact_key="corporateHistory.officeChange.boardResolutionDate",
        value_type=FactValueType.DATE,
        display_label="Board resolution date",
        requirement_keys=("board-resolution-office-change",),
        label_aliases=("board resolution date", "date of board resolution"),
        information_path="corporateHistory.officeChange.boardResolutionDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
    ),
    "corporateHistory.officeChange.previousAddress": _fact(
        fact_key="corporateHistory.officeChange.previousAddress",
        value_type=FactValueType.ADDRESS,
        display_label="Previous registered office",
        requirement_keys=(
            "board-resolution-office-change",
            "current-registered-office-filing",
        ),
        label_aliases=(
            "previous registered office",
            "old registered office",
            "former registered office",
        ),
        information_path="corporateHistory.officeChange.previousAddress",
        comparison_strategy=ComparisonStrategy.ADDRESS,
        semantic_supported=True,
        can_be_historical=True,
    ),
    "corporateHistory.officeChange.newAddress": _fact(
        fact_key="corporateHistory.officeChange.newAddress",
        value_type=FactValueType.ADDRESS,
        display_label="New registered office",
        requirement_keys=(
            "board-resolution-office-change",
            "current-registered-office-filing",
        ),
        label_aliases=(
            "new registered office",
            "present registered office",
            "current registered office",
        ),
        information_path="corporateHistory.officeChange.newAddress",
        comparison_strategy=ComparisonStrategy.ADDRESS,
        semantic_supported=True,
        may_block_disclosure=True,
    ),
    "corporateHistory.officeChange.effectiveDate": _fact(
        fact_key="corporateHistory.officeChange.effectiveDate",
        value_type=FactValueType.DATE,
        display_label="Office change effective date",
        requirement_keys=(
            "board-resolution-office-change",
            "current-registered-office-filing",
        ),
        label_aliases=("effective date",),
        information_path="corporateHistory.officeChange.effectiveDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
    ),
    "corporateHistory.officeChange.filingDate": _fact(
        fact_key="corporateHistory.officeChange.filingDate",
        value_type=FactValueType.DATE,
        display_label="Office change filing date",
        requirement_keys=(
            "current-registered-office-filing",
            "filing-acknowledgement-or-srn",
        ),
        label_aliases=("filing date", "date of filing", "submission date"),
        information_path="corporateHistory.officeChange.filingDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
    ),
    "corporateHistory.officeChange.filingForm": _fact(
        fact_key="corporateHistory.officeChange.filingForm",
        value_type=FactValueType.STRING,
        display_label="Office change filing form",
        requirement_keys=(
            "board-resolution-office-change",
            "current-registered-office-filing",
            "filing-acknowledgement-or-srn",
        ),
        label_aliases=(
            "filing form",
            "form name",
            "form no",
            "form number",
            "e-form",
            "eform",
        ),
        information_path="corporateHistory.officeChange.filingForm",
        comparison_strategy=ComparisonStrategy.TEXT,
        can_be_historical=True,
    ),
    "corporateHistory.officeChange.srn": _fact(
        fact_key="corporateHistory.officeChange.srn",
        value_type=FactValueType.IDENTIFIER,
        display_label="SRN",
        requirement_keys=(
            "current-registered-office-filing",
            "filing-acknowledgement-or-srn",
        ),
        label_aliases=("srn", "service request number"),
        information_path="corporateHistory.officeChange.srn",
        comparison_strategy=ComparisonStrategy.EXACT_IDENTIFIER,
        can_be_historical=True,
    ),
    "offices.currentRegistered.address": _fact(
        fact_key="offices.currentRegistered.address",
        value_type=FactValueType.ADDRESS,
        display_label="Current registered office address",
        requirement_keys=(
            "current-registered-office-filing",
            "registered-office-address-proof",
        ),
        label_aliases=(
            "registered office address",
            "address of registered office",
            "registered office",
        ),
        information_path="offices.currentRegistered.address",
        comparison_strategy=ComparisonStrategy.ADDRESS,
        semantic_supported=True,
        may_block_disclosure=True,
    ),
    "offices.currentRegistered.effectiveFrom": _fact(
        fact_key="offices.currentRegistered.effectiveFrom",
        value_type=FactValueType.DATE,
        display_label="Current registered office effective from",
        requirement_keys=("registered-office-address-proof",),
        label_aliases=("effective from", "effective date"),
        information_path="offices.currentRegistered.effectiveFrom",
        comparison_strategy=ComparisonStrategy.DATE,
        absence_creates_issue=False,
    ),
    "offices.currentRegistered.occupancyType": _fact(
        fact_key="offices.currentRegistered.occupancyType",
        value_type=FactValueType.STRING,
        display_label="Occupancy type",
        requirement_keys=(
            "current-registered-office-filing",
            "registered-office-address-proof",
        ),
        label_aliases=(
            "occupancy type",
            "nature of occupancy",
            "type of occupancy",
            "occupancy",
        ),
        information_path="offices.currentRegistered.occupancyType",
        comparison_strategy=ComparisonStrategy.TEXT,
        absence_creates_issue=False,
    ),
    "offices.previousRegistered.address": _fact(
        fact_key="offices.previousRegistered.address",
        value_type=FactValueType.ADDRESS,
        display_label="Previous registered office address",
        requirement_keys=("current-registered-office-filing",),
        label_aliases=("previous registered office",),
        information_path="offices.previousRegistered.address",
        comparison_strategy=ComparisonStrategy.ADDRESS,
        semantic_supported=True,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
    "offices.previousRegistered.effectiveUntil": _fact(
        fact_key="offices.previousRegistered.effectiveUntil",
        value_type=FactValueType.DATE,
        display_label="Previous registered office effective until",
        requirement_keys=tuple(),
        label_aliases=("effective until", "effective upto"),
        information_path="offices.previousRegistered.effectiveUntil",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
    "constitutionalRecord.moaVersionDate": _fact(
        fact_key="constitutionalRecord.moaVersionDate",
        value_type=FactValueType.DATE,
        display_label="MoA version date",
        requirement_keys=("current-certified-moa",),
        label_aliases=("moa version date", "memorandum version date", "date of moa"),
        information_path=_constitutional_field("moaVersionDate"),
        comparison_strategy=ComparisonStrategy.DATE,
    ),
    "constitutionalRecord.mainObjectClauseNumbers": _fact(
        fact_key="constitutionalRecord.mainObjectClauseNumbers",
        value_type=FactValueType.STRING_LIST,
        display_label="Main object clause numbers",
        requirement_keys=("current-certified-moa",),
        label_aliases=("main object clause", "clause number", "clause numbers"),
        information_path=_constitutional_field("mainObjectClauseNumbers"),
        comparison_strategy=ComparisonStrategy.STRING_LIST,
        semantic_supported=True,
    ),
    "constitutionalRecord.mainObjectText": _fact(
        fact_key="constitutionalRecord.mainObjectText",
        value_type=FactValueType.TEXT,
        display_label="Main object text",
        requirement_keys=("current-certified-moa",),
        label_aliases=("main object", "objects of the company", "main objects"),
        information_path=_constitutional_field("mainObjectText"),
        comparison_strategy=ComparisonStrategy.TEXT,
        semantic_supported=True,
        may_block_disclosure=True,
    ),
    "constitutionalRecord.aoaVersionDate": _fact(
        fact_key="constitutionalRecord.aoaVersionDate",
        value_type=FactValueType.DATE,
        display_label="AoA version date",
        requirement_keys=("current-certified-aoa",),
        label_aliases=("aoa version date", "articles version date", "date of aoa"),
        information_path=_constitutional_field("aoaVersionDate"),
        comparison_strategy=ComparisonStrategy.DATE,
    ),
    "registrations.pan.registrationNumber": _fact(
        fact_key="registrations.pan.registrationNumber",
        value_type=FactValueType.IDENTIFIER,
        display_label="PAN",
        requirement_keys=("pan-certificate",),
        label_aliases=("pan", "permanent account number"),
        information_path="registrations.pan.registrationNumber",
        comparison_strategy=ComparisonStrategy.EXACT_IDENTIFIER,
        may_block_disclosure=True,
    ),
    "registrations.pan.legalNameOnRegistration": _fact(
        fact_key="registrations.pan.legalNameOnRegistration",
        value_type=FactValueType.STRING,
        display_label="Legal name on PAN",
        requirement_keys=("pan-certificate",),
        label_aliases=("name", "name of assessee", "legal name"),
        information_path="registrations.pan.legalNameOnRegistration",
        comparison_strategy=ComparisonStrategy.LEGAL_NAME,
        semantic_supported=True,
    ),
    "registrations.pan.issueDate": _fact(
        fact_key="registrations.pan.issueDate",
        value_type=FactValueType.DATE,
        display_label="PAN issue date",
        requirement_keys=("pan-certificate",),
        label_aliases=("issue date", "date of issue"),
        information_path="registrations.pan.issueDate",
        comparison_strategy=ComparisonStrategy.DATE,
    ),
    "registrations.gstin.registrationNumber": _fact(
        fact_key="registrations.gstin.registrationNumber",
        value_type=FactValueType.IDENTIFIER,
        display_label="GSTIN",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=("gstin", "gst identification number"),
        information_path="registrations.gstin.registrationNumber",
        comparison_strategy=ComparisonStrategy.EXACT_IDENTIFIER,
        may_block_disclosure=True,
    ),
    "registrations.gstin.legalNameOnRegistration": _fact(
        fact_key="registrations.gstin.legalNameOnRegistration",
        value_type=FactValueType.STRING,
        display_label="Legal name on GST registration",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=("legal name", "trade name", "name of business"),
        information_path="registrations.gstin.legalNameOnRegistration",
        comparison_strategy=ComparisonStrategy.LEGAL_NAME,
        semantic_supported=True,
    ),
    "registrations.gstin.addressOnRegistration": _fact(
        fact_key="registrations.gstin.addressOnRegistration",
        value_type=FactValueType.ADDRESS,
        display_label="GST principal place of business",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=(
            "principal place of business",
            "registered address",
            "address",
        ),
        information_path="registrations.gstin.addressOnRegistration",
        comparison_strategy=ComparisonStrategy.ADDRESS,
        semantic_supported=True,
        can_be_historical=True,
        may_block_disclosure=True,
    ),
    "registrations.gstin.registrationDate": _fact(
        fact_key="registrations.gstin.registrationDate",
        value_type=FactValueType.DATE,
        display_label="GST registration date",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=(
            "date of registration",
            "registration date",
            "effective date of registration",
            "date of registration of the business",
        ),
        information_path="registrations.gstin.registrationDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
    ),
    "registrations.gstin.certificateIssueDate": _fact(
        fact_key="registrations.gstin.certificateIssueDate",
        value_type=FactValueType.DATE,
        display_label="GST certificate issue date",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=(
            "certificate issue date",
            "date of issue of certificate",
            "certificate issuance date",
        ),
        information_path="registrations.gstin.certificateIssueDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
    "registrations.gstin.amendmentDate": _fact(
        fact_key="registrations.gstin.amendmentDate",
        value_type=FactValueType.DATE,
        display_label="GST amendment date",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=(
            "date of amendment",
            "amendment date",
            "date of amendment of registration",
        ),
        information_path="registrations.gstin.amendmentDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
    "registrations.gstin.effectiveDate": _fact(
        fact_key="registrations.gstin.effectiveDate",
        value_type=FactValueType.DATE,
        display_label="GST effective date of amendment",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=(
            "certificate effective date",
            "effective date of amendment",
            "effective date of the amendment",
            "amended certificate effective date",
        ),
        information_path="registrations.gstin.effectiveDate",
        comparison_strategy=ComparisonStrategy.DATE,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
    "registrations.gstin.currentStatus": _fact(
        fact_key="registrations.gstin.currentStatus",
        value_type=FactValueType.STRING,
        display_label="GST registration status",
        requirement_keys=("gst-registration-certificates",),
        label_aliases=("status", "registration status"),
        information_path="registrations.gstin.currentStatus",
        comparison_strategy=ComparisonStrategy.TEXT,
        absence_creates_issue=False,
    ),
    "registrations.udyam.registrationNumber": _fact(
        fact_key="registrations.udyam.registrationNumber",
        value_type=FactValueType.IDENTIFIER,
        display_label="Udyam registration number",
        requirement_keys=("udyam-registration-certificate",),
        label_aliases=("udyam registration number", "udyam"),
        information_path="registrations.udyam.registrationNumber",
        comparison_strategy=ComparisonStrategy.EXACT_IDENTIFIER,
    ),
    "registrations.udyam.legalNameOnRegistration": _fact(
        fact_key="registrations.udyam.legalNameOnRegistration",
        value_type=FactValueType.STRING,
        display_label="Legal name on Udyam registration",
        requirement_keys=("udyam-registration-certificate",),
        label_aliases=("name of enterprise", "legal name"),
        information_path="registrations.udyam.legalNameOnRegistration",
        comparison_strategy=ComparisonStrategy.LEGAL_NAME,
        semantic_supported=True,
    ),
    "registrations.udyam.registrationDate": _fact(
        fact_key="registrations.udyam.registrationDate",
        value_type=FactValueType.DATE,
        display_label="Udyam registration date",
        requirement_keys=("udyam-registration-certificate",),
        label_aliases=("registration date", "date of registration"),
        information_path="registrations.udyam.registrationDate",
        comparison_strategy=ComparisonStrategy.DATE,
    ),
    "registrations.udyam.enterpriseType": _fact(
        fact_key="registrations.udyam.enterpriseType",
        value_type=FactValueType.STRING,
        display_label="Udyam enterprise type",
        requirement_keys=("udyam-registration-certificate",),
        label_aliases=("enterprise type", "type of enterprise", "category of enterprise"),
        information_path="registrations.udyam.enterpriseType",
        comparison_strategy=ComparisonStrategy.TEXT,
        absence_creates_issue=False,
    ),
    "registrations.udyam.addressOnRegistration": _fact(
        fact_key="registrations.udyam.addressOnRegistration",
        value_type=FactValueType.ADDRESS,
        display_label="Udyam registered address",
        requirement_keys=("udyam-registration-certificate",),
        label_aliases=("official address", "registered address", "address"),
        information_path="registrations.udyam.addressOnRegistration",
        comparison_strategy=ComparisonStrategy.ADDRESS,
        semantic_supported=True,
        can_be_historical=True,
        absence_creates_issue=False,
    ),
}


REQUIREMENT_SPECS: dict[str, RequirementSpec] = {
    "original-certificate-of-incorporation": {
        "supported": True,
        "expected_fact_keys": [
            "identity.legalName",
            "identity.cin",
            "identity.incorporationDate",
            "identity.incorporationState",
            "identity.registrarOfCompanies",
            "identity.companyClass",
            "identity.companyCategory",
            "identity.governingAct",
        ],
        "semantic_required": False,
    },
    "current-certified-moa": {
        "supported": True,
        "expected_fact_keys": [
            "identity.legalName",
            "identity.governingAct",
            "constitutionalRecord.moaVersionDate",
            "constitutionalRecord.mainObjectClauseNumbers",
            "constitutionalRecord.mainObjectText",
        ],
        "semantic_required": True,
    },
    "current-certified-aoa": {
        "supported": True,
        "expected_fact_keys": [
            "identity.legalName",
            "identity.cin",
            "constitutionalRecord.aoaVersionDate",
        ],
        "semantic_required": False,
    },
    "board-resolution-office-change": {
        "supported": True,
        "expected_fact_keys": [
            "corporateHistory.officeChange.boardResolutionDate",
            "corporateHistory.officeChange.previousAddress",
            "corporateHistory.officeChange.newAddress",
            "corporateHistory.officeChange.effectiveDate",
            "corporateHistory.officeChange.filingForm",
        ],
        "semantic_required": True,
    },
    "current-registered-office-filing": {
        "supported": True,
        "expected_fact_keys": [
            "identity.legalName",
            "identity.cin",
            "corporateHistory.officeChange.srn",
            "corporateHistory.officeChange.filingForm",
            "corporateHistory.officeChange.filingDate",
            "corporateHistory.officeChange.effectiveDate",
            "corporateHistory.officeChange.previousAddress",
            "corporateHistory.officeChange.newAddress",
            "offices.currentRegistered.occupancyType",
        ],
        "semantic_required": True,
    },
    "filing-acknowledgement-or-srn": {
        "supported": True,
        "expected_fact_keys": [
            "identity.legalName",
            "identity.cin",
            "corporateHistory.officeChange.filingForm",
            "corporateHistory.officeChange.srn",
            "corporateHistory.officeChange.filingDate",
        ],
        "semantic_required": False,
    },
    "registered-office-address-proof": {
        "supported": True,
        "expected_fact_keys": [
            "identity.legalName",
            "offices.currentRegistered.address",
            "offices.currentRegistered.occupancyType",
        ],
        "semantic_required": True,
    },
    "pan-certificate": {
        "supported": True,
        "expected_fact_keys": [
            "registrations.pan.registrationNumber",
            "registrations.pan.legalNameOnRegistration",
            "registrations.pan.issueDate",
        ],
        "semantic_required": False,
    },
    "gst-registration-certificates": {
        "supported": True,
        "expected_fact_keys": [
            "registrations.gstin.registrationNumber",
            "registrations.gstin.legalNameOnRegistration",
            "registrations.gstin.addressOnRegistration",
            "registrations.gstin.registrationDate",
            "registrations.gstin.certificateIssueDate",
            "registrations.gstin.amendmentDate",
            "registrations.gstin.effectiveDate",
            "registrations.gstin.currentStatus",
        ],
        "semantic_required": True,
    },
    "udyam-registration-certificate": {
        "supported": True,
        "expected_fact_keys": [
            "registrations.udyam.registrationNumber",
            "registrations.udyam.legalNameOnRegistration",
            "registrations.udyam.registrationDate",
            "registrations.udyam.enterpriseType",
            "registrations.udyam.addressOnRegistration",
        ],
        "semantic_required": True,
    },
}


_UNSUPPORTED_REQUIREMENT_SPEC: RequirementSpec = {
    "supported": False,
    "expected_fact_keys": [],
    "semantic_required": False,
}


def get_fact(fact_key: str) -> FactDefinition:
    try:
        return FACT_REGISTRY[fact_key]
    except KeyError as exc:
        raise KeyError(f"Unknown fact key: {fact_key}") from exc


def get_requirement_spec(requirement_key: str) -> RequirementSpec:
    return REQUIREMENT_SPECS.get(requirement_key, _UNSUPPORTED_REQUIREMENT_SPEC)


def list_fact_keys() -> list[str]:
    return sorted(FACT_REGISTRY.keys())


def get_information_value(payload: Mapping[str, Any], fact_key: str) -> Any:
    definition = get_fact(fact_key)
    return resolve_information_path(payload, definition.information_path)


def resolve_information_path(payload: Mapping[str, Any], information_path: InformationPath) -> Any:
    data = dict(payload)
    if callable(information_path):
        return information_path(data)
    if isinstance(information_path, str):
        return _resolve_dot_path(data, information_path)
    return None


def information_path_exists(fact_key: str) -> bool:
    return fact_key in FACT_REGISTRY


def validate_information_paths() -> list[str]:
    """Return fact keys whose information paths cannot be resolved against an empty payload."""

    from app.modules.company_incorporation.defaults import empty_payload

    payload = empty_payload()
    errors: list[str] = []
    for fact_key, definition in FACT_REGISTRY.items():
        try:
            resolve_information_path(payload, definition.information_path)
        except Exception as exc:  # pragma: no cover - validation helper
            errors.append(f"{fact_key}: {exc}")
    return errors


def facts_for_requirement(requirement_key: str) -> list[FactDefinition]:
    spec = get_requirement_spec(requirement_key)
    if not spec["supported"]:
        return []
    return [get_fact(fact_key) for fact_key in spec["expected_fact_keys"]]
