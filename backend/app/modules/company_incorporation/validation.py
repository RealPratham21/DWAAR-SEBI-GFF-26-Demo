"""Section validation and completion rules for Company & Incorporation."""

import re
from datetime import UTC, datetime
from typing import Any

from app.modules.company_incorporation.defaults import EMPTY_COMPANY_INCORPORATION_PAYLOAD

ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CIN_RE = re.compile(r"^[A-Z0-9]{21}$")
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
TAN_RE = re.compile(r"^[A-Z]{4}[0-9]{5}[A-Z]$")
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
UDYAM_RE = re.compile(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$")
IEC_RE = re.compile(r"^([A-Z]{5}[0-9]{4}[A-Z]|[0-9]{10})$")
PIN_RE = re.compile(r"^[1-9][0-9]{5}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TELEPHONE_RE = re.compile(r"^(\+91[\s-]?)?[0-9]{10}$")

COMPANY_CLASS_VALUES = {"public", "private"}
COMPANY_CATEGORY_VALUES = {
    "company-limited-by-shares",
    "company-limited-by-guarantee",
    "unlimited-company",
}
COMPANY_SUB_CATEGORY_VALUES = {
    "non-government-company",
    "union-government-company",
    "state-government-company",
    "subsidiary-of-foreign-company",
    "other",
}
COMPANY_STATUS_VALUES = {
    "active",
    "dormant",
    "under-process-of-striking-off",
    "struck-off",
    "amalgamated",
    "under-liquidation",
    "liquidated",
    "other",
}
GOVERNING_ACT_VALUES = {
    "companies-act-2013",
    "companies-act-1956",
    "companies-act-1913",
    "other-predecessor-legislation",
}
LISTED_STATUS_VALUES = {"listed", "unlisted", "delisted", "not-applicable"}
SPECIAL_COMPANY_TYPE_VALUES = {
    "none",
    "one-person-company",
    "section-8-company",
    "producer-company",
    "nidhi-company",
    "other",
}
CORPORATE_EVENT_STATUS_VALUES = {
    "planned",
    "resolution-passed",
    "filed",
    "approved",
    "effective",
}
OFFICE_TYPE_VALUES = {
    "registered-office",
    "corporate-office",
    "administrative-office",
    "communication-office",
    "previous-registered-office",
}
OCCUPANCY_TYPE_VALUES = {"owned", "leased", "licensed", "other"}
REGISTRATION_TYPE_VALUES = {"pan", "tan", "gstin", "udyam", "iec", "other"}
CONSTITUTIONAL_DOCUMENT_TYPE_VALUES = {"moa", "aoa"}
CERTIFIED_COPY_STATUS_VALUES = {"not-available", "available", "pending-verification", "verified"}
OPERATIONS_ALIGNMENT_STATUS_VALUES = {"yes", "no", "requires-legal-review"}
LEGAL_REVIEW_STATUS_VALUES = {"not-requested", "pending", "under-review", "reviewed"}
REGISTRATION_STATUS_VALUES = {
    "active",
    "inactive",
    "pending",
    "amendment-pending",
    "cancelled",
    "unknown",
}
UPDATE_TRACKING_STATUS_VALUES = {"yes", "no", "not-applicable", "unknown"}
CORPORATE_EVENT_TYPE_VALUES = {
    "original-incorporation",
    "name-change",
    "private-to-public-conversion",
    "public-to-private-conversion",
    "company-class-change",
    "registered-office-change",
    "registered-office-state-change",
    "roc-jurisdiction-change",
    "moa-amendment",
    "main-object-amendment",
    "aoa-amendment",
    "merger-amalgamation",
    "demerger",
    "acquisition-transfer-undertaking",
    "succession-of-business",
    "other-material-event",
}


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("Validation failed")


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _is_nonempty(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, list):
        return len(value) > 0
    if isinstance(value, dict):
        return any(_is_nonempty(item) for item in value.values())
    return _clean(value) != ""


def _not_future_date(value: str, label: str) -> str | None:
    if not value:
        return None
    if not ISO_DATE_RE.match(value):
        return f"{label} must be in YYYY-MM-DD format"
    parsed = datetime.fromisoformat(value).replace(tzinfo=UTC)
    if parsed > datetime.now(tz=UTC):
        return f"{label} cannot be in the future"
    return None


def _validate_enum(value: str, allowed: set[str], label: str) -> str | None:
    if not value:
        return None
    if value not in allowed:
        return f"{label} is invalid"
    return None


def _validate_registration_number(registration_type: str, number: str) -> str | None:
    if not number:
        return "Registration number is required"
    patterns = {
        "pan": PAN_RE,
        "tan": TAN_RE,
        "gstin": GSTIN_RE,
        "udyam": UDYAM_RE,
        "iec": IEC_RE,
    }
    pattern = patterns.get(registration_type)
    if pattern and not pattern.match(number):
        return f"Registration number format is invalid for {registration_type.upper()}"
    if registration_type == "other" and not number.strip():
        return "Registration number is required"
    return None


def validate_identity_draft(identity: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    cin = _clean(identity.get("cin")).upper()
    if cin and not CIN_RE.match(cin):
        errors["cin"] = "CIN must be exactly 21 uppercase alphanumeric characters"
    email = _clean(identity.get("email"))
    if email and not EMAIL_RE.match(email):
        errors["email"] = "Enter a valid email address"
    telephone = _clean(identity.get("telephone"))
    if telephone and not TELEPHONE_RE.match(telephone):
        errors["telephone"] = (
            "Telephone must be a valid 10-digit Indian number, optionally prefixed with +91"
        )
    website = _clean(identity.get("website"))
    if website and not website.startswith(("http://", "https://")):
        errors["website"] = "Enter a valid website URL"
    for field, label in (
        ("incorporationDate", "Incorporation date"),
        ("commencementDate", "Commencement date"),
    ):
        message = _not_future_date(_clean(identity.get(field)), label)
        if message:
            errors[field] = message
    for field, allowed, label in (
        ("companyClass", COMPANY_CLASS_VALUES, "Company class"),
        ("companyCategory", COMPANY_CATEGORY_VALUES, "Company category"),
        ("companySubCategory", COMPANY_SUB_CATEGORY_VALUES, "Company sub-category"),
        ("companyStatus", COMPANY_STATUS_VALUES, "Company status"),
        ("listedStatus", LISTED_STATUS_VALUES, "Listed status"),
        ("governingAct", GOVERNING_ACT_VALUES, "Governing Act"),
        ("specialCompanyType", SPECIAL_COMPANY_TYPE_VALUES, "Special company type"),
    ):
        message = _validate_enum(_clean(identity.get(field)), allowed, label)
        if message:
            errors[field] = message
    if errors:
        raise ValidationError(errors)


def is_identity_complete(identity: dict[str, Any]) -> bool:
    try:
        validate_identity_draft(identity)
    except ValidationError:
        return False
    required = [
        "legalName",
        "cin",
        "incorporationDate",
        "incorporationCity",
        "incorporationState",
        "registrarOfCompanies",
        "companyClass",
        "companyCategory",
        "companySubCategory",
        "companyStatus",
        "listedStatus",
        "governingAct",
        "email",
        "telephone",
    ]
    return all(_clean(identity.get(field)) for field in required)


def identity_has_meaningful_data(identity: dict[str, Any]) -> bool:
    empty = EMPTY_COMPANY_INCORPORATION_PAYLOAD["identity"]
    for key, value in identity.items():
        if key == "specialCompanyType":
            if _clean(value) not in {"", "none"}:
                return True
            continue
        if _clean(value) != _clean(empty.get(key)):
            return True
    return False


def validate_corporate_event_draft(event: dict[str, Any], index: int) -> dict[str, str]:
    prefix = f"corporateEvents[{index}]"
    errors: dict[str, str] = {}
    if not _clean(event.get("id")):
        errors[f"{prefix}.id"] = "Event id is required"
    event_type = _clean(event.get("eventType"))
    if event_type and event_type not in CORPORATE_EVENT_TYPE_VALUES:
        errors[f"{prefix}.eventType"] = "Event type is invalid"
    event_status = _clean(event.get("eventStatus"))
    if event_status and event_status not in CORPORATE_EVENT_STATUS_VALUES:
        errors[f"{prefix}.eventStatus"] = "Event status is invalid"
    if event_status == "effective" and not _clean(event.get("effectiveDate")):
        errors[f"{prefix}.effectiveDate"] = (
            "Legal effective date is required when status is Effective"
        )
    description = _clean(event.get("description"))
    if description == "" and _is_nonempty(event):
        errors[f"{prefix}.description"] = "Event description is required"
    for field, label in (
        ("effectiveDate", "Legal effective date"),
        ("boardResolutionDate", "Board resolution date"),
        ("shareholderResolutionDate", "Shareholder resolution date"),
        ("filingDate", "Filing date"),
        ("certificateOrOrderDate", "Certificate or order date"),
    ):
        message = _not_future_date(_clean(event.get(field)), label)
        if message:
            errors[f"{prefix}.{field}"] = message
    return errors


def validate_corporate_events_draft(events: list[dict[str, Any]]) -> None:
    errors: dict[str, str] = {}
    for index, event in enumerate(events):
        errors.update(validate_corporate_event_draft(event, index))
    if errors:
        raise ValidationError(errors)


def is_corporate_event_complete(event: dict[str, Any]) -> bool:
    errors = validate_corporate_event_draft(event, 0)
    if errors:
        return False
    required = ["id", "eventType", "eventStatus", "description"]
    if not all(_clean(event.get(field)) for field in required):
        return False
    if event.get("eventStatus") == "effective":
        return bool(_clean(event.get("effectiveDate")))
    return True


def is_corporate_history_complete(events: list[dict[str, Any]]) -> bool:
    if not events:
        return False
    has_original = any(
        _clean(event.get("eventType")) == "original-incorporation" for event in events
    )
    if not has_original:
        return False
    return all(is_corporate_event_complete(event) for event in events)


def validate_office_draft(office: dict[str, Any], index: int) -> dict[str, str]:
    prefix = f"offices[{index}]"
    errors: dict[str, str] = {}
    if not _clean(office.get("id")):
        errors[f"{prefix}.id"] = "Office id is required"
    office_type = _clean(office.get("officeType"))
    if office_type and office_type not in OFFICE_TYPE_VALUES:
        errors[f"{prefix}.officeType"] = "Office type is invalid"
    occupancy = _clean(office.get("occupancyType"))
    if occupancy and occupancy not in OCCUPANCY_TYPE_VALUES:
        errors[f"{prefix}.occupancyType"] = "Occupancy type is invalid"
    pin_code = _clean(office.get("pinCode"))
    if pin_code and not PIN_RE.match(pin_code):
        errors[f"{prefix}.pinCode"] = "PIN code must be a valid 6-digit Indian PIN code"
    effective_from = _clean(office.get("effectiveFrom"))
    effective_until = _clean(office.get("effectiveUntil"))
    if effective_from:
        message = _not_future_date(effective_from, "Effective from date")
        if message:
            errors[f"{prefix}.effectiveFrom"] = message
    if effective_until:
        if not ISO_DATE_RE.match(effective_until):
            errors[f"{prefix}.effectiveUntil"] = "Effective until must be in YYYY-MM-DD format"
        elif effective_from and effective_until < effective_from:
            errors[f"{prefix}.effectiveUntil"] = (
                "Effective until cannot be earlier than effective from"
            )
    return errors


def validate_offices_draft(offices: list[dict[str, Any]]) -> None:
    errors: dict[str, str] = {}
    for index, office in enumerate(offices):
        errors.update(validate_office_draft(office, index))
    current_registered = [
        office
        for office in offices
        if _clean(office.get("officeType")) == "registered-office"
        and not _clean(office.get("effectiveUntil"))
    ]
    if len(current_registered) > 1:
        errors["offices"] = (
            "Only one current registered office is allowed unless earlier records "
            "have an effective-until date"
        )
    if errors:
        raise ValidationError(errors)


def is_office_complete(office: dict[str, Any]) -> bool:
    errors = validate_office_draft(office, 0)
    if errors:
        return False
    required = [
        "id",
        "officeType",
        "addressLine1",
        "city",
        "state",
        "pinCode",
        "country",
        "effectiveFrom",
        "occupancyType",
    ]
    return all(_clean(office.get(field)) for field in required)


def is_offices_complete(offices: list[dict[str, Any]]) -> bool:
    current_registered = [
        office
        for office in offices
        if _clean(office.get("officeType")) == "registered-office"
        and not _clean(office.get("effectiveUntil"))
    ]
    if len(current_registered) != 1:
        return False
    return is_office_complete(current_registered[0])


def validate_constitutional_record_draft(record: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    for field, label in (
        ("moaVersionDate", "MoA version date"),
        ("aoaVersionDate", "AoA version date"),
        ("latestMoaAmendmentDate", "Latest MoA amendment date"),
        ("latestAoaAmendmentDate", "Latest AoA amendment date"),
    ):
        message = _not_future_date(_clean(record.get(field)), label)
        if message:
            errors[field] = message
    for field, allowed, label in (
        ("moaCertifiedCopyStatus", CERTIFIED_COPY_STATUS_VALUES, "MoA certified copy status"),
        ("aoaCertifiedCopyStatus", CERTIFIED_COPY_STATUS_VALUES, "AoA certified copy status"),
        ("operationsAlignmentStatus", OPERATIONS_ALIGNMENT_STATUS_VALUES, "Operations alignment"),
        ("legalReviewStatus", LEGAL_REVIEW_STATUS_VALUES, "Legal review status"),
    ):
        message = _validate_enum(_clean(record.get(field)), allowed, label)
        if message:
            errors[field] = message
    clause_numbers = record.get("mainObjectClauseNumbers") or []
    if not isinstance(clause_numbers, list):
        errors["mainObjectClauseNumbers"] = "Main object clause numbers must be a list"
    if errors:
        raise ValidationError(errors)


def validate_constitutional_amendment_draft(
    amendment: dict[str, Any],
    index: int,
) -> dict[str, str]:
    prefix = f"constitutionalAmendments[{index}]"
    errors: dict[str, str] = {}
    if not _clean(amendment.get("id")):
        errors[f"{prefix}.id"] = "Amendment id is required"
    document_type = _clean(amendment.get("documentType"))
    if document_type and document_type not in CONSTITUTIONAL_DOCUMENT_TYPE_VALUES:
        errors[f"{prefix}.documentType"] = "Document type is invalid"
    for field, label in (
        ("amendmentDate", "Amendment date"),
        ("boardResolutionDate", "Board resolution date"),
        ("shareholderResolutionDate", "Shareholder resolution date"),
        ("effectiveDate", "Effective date"),
    ):
        message = _not_future_date(_clean(amendment.get(field)), label)
        if message:
            errors[f"{prefix}.{field}"] = message
    return errors


def validate_constitutional_documents_draft(
    record: dict[str, Any],
    amendments: list[dict[str, Any]],
) -> None:
    errors: dict[str, str] = {}
    try:
        validate_constitutional_record_draft(record)
    except ValidationError as exc:
        errors.update(exc.field_errors)
    for index, amendment in enumerate(amendments):
        errors.update(validate_constitutional_amendment_draft(amendment, index))
    if errors:
        raise ValidationError(errors)


def is_constitutional_complete(record: dict[str, Any], amendments: list[dict[str, Any]]) -> bool:
    try:
        validate_constitutional_documents_draft(record, amendments)
    except ValidationError:
        return False
    required = (
        "moaVersionDate",
        "aoaVersionDate",
        "moaCertifiedCopyStatus",
        "aoaCertifiedCopyStatus",
    )
    if not all(_clean(record.get(field)) for field in required):
        return False
    for amendment in amendments:
        required_amendment = [
            "id",
            "documentType",
            "amendmentDate",
            "clauseReference",
            "amendedText",
        ]
        if not all(_clean(amendment.get(field)) for field in required_amendment):
            return False
        if validate_constitutional_amendment_draft(amendment, 0):
            return False
    return True


def validate_registration_draft(registration: dict[str, Any], index: int) -> dict[str, str]:
    prefix = f"registrations[{index}]"
    errors: dict[str, str] = {}
    if not _clean(registration.get("id")):
        errors[f"{prefix}.id"] = "Registration id is required"
    registration_type = _clean(registration.get("registrationType"))
    if registration_type and registration_type not in REGISTRATION_TYPE_VALUES:
        errors[f"{prefix}.registrationType"] = "Registration type is invalid"
    number = _clean(registration.get("registrationNumber")).upper()
    if registration_type:
        message = _validate_registration_number(registration_type, number)
        if message:
            errors[f"{prefix}.registrationNumber"] = message
    for field, allowed, label in (
        ("currentStatus", REGISTRATION_STATUS_VALUES, "Current status"),
        ("updatedAfterNameChange", UPDATE_TRACKING_STATUS_VALUES, "Updated after name change"),
        ("updatedAfterOfficeChange", UPDATE_TRACKING_STATUS_VALUES, "Updated after office change"),
    ):
        message = _validate_enum(_clean(registration.get(field)), allowed, label)
        if message:
            errors[f"{prefix}.{field}"] = message
    for field, label in (
        ("issueDate", "Issue date"),
        ("effectiveDate", "Effective date"),
    ):
        message = _not_future_date(_clean(registration.get(field)), label)
        if message:
            errors[f"{prefix}.{field}"] = message
    expiry = _clean(registration.get("expiryDate"))
    if expiry and not ISO_DATE_RE.match(expiry):
        errors[f"{prefix}.expiryDate"] = "Expiry date must be in YYYY-MM-DD format"
    return errors


def validate_registrations_draft(registrations: list[dict[str, Any]]) -> None:
    errors: dict[str, str] = {}
    for index, registration in enumerate(registrations):
        errors.update(validate_registration_draft(registration, index))
    if errors:
        raise ValidationError(errors)


def is_registration_complete(registration: dict[str, Any]) -> bool:
    if validate_registration_draft(registration, 0):
        return False
    return bool(
        _clean(registration.get("registrationType"))
        and _clean(registration.get("registrationNumber"))
    )


def is_registrations_complete(registrations: list[dict[str, Any]]) -> bool:
    pan_records = [
        registration
        for registration in registrations
        if _clean(registration.get("registrationType")) == "pan"
    ]
    if not pan_records or not any(is_registration_complete(item) for item in pan_records):
        return False
    return all(is_registration_complete(item) for item in registrations)


def validate_confirmations_draft(confirmations: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    for key, value in confirmations.items():
        if not isinstance(value, bool):
            errors[key] = "Confirmation must be true or false"
    if errors:
        raise ValidationError(errors)


def is_confirmations_complete(confirmations: dict[str, Any]) -> bool:
    required = EMPTY_COMPANY_INCORPORATION_PAYLOAD["confirmations"].keys()
    return all(confirmations.get(key) is True for key in required)


def constitutional_has_meaningful_data(
    record: dict[str, Any],
    amendments: list[dict[str, Any]],
) -> bool:
    empty_record = EMPTY_COMPANY_INCORPORATION_PAYLOAD["constitutionalRecord"]
    for key, value in record.items():
        if key == "mainObjectClauseNumbers":
            if value:
                return True
            continue
        if _clean(value) != _clean(empty_record.get(key)):
            return True
    return len(amendments) > 0
