"""Draft-tolerant section validation — stricter than frontend when values are present."""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation
from typing import Any

from app.modules.ipo_setup_eligibility.constants import (
    AMOUNT_UNITS,
    APPOINTMENT_STATUSES,
    APPROVAL_STATUSES,
    AUDITED_STATUSES,
    CONNECTIVITY_STATUSES,
    DECLARATION_FIELDS,
    ELIGIBILITY_PROFILES,
    FINANCIAL_SOURCE_TYPES,
    IN_PRINCIPLE_STATUSES,
    ISSUE_PRICE_STATUSES,
    ISSUER_CONFIRMATION_KEYS,
    PREPARATION_STAGES,
    PRICING_METHODS,
    PROPOSED_OFFER_TYPES,
    PUBLIC_CONVERSION_STATUSES,
    SHAREHOLDER_APPROVAL_STATUSES,
    TARGET_SME_PLATFORMS,
    TRACK_RECORD_BASES,
    YES_NO_NOT_SURE,
)
from app.modules.ipo_setup_eligibility.offer_compute import offer_type_flags

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
FY_ENDING_RE = re.compile(r"^(\d{4}|FY\s*\d{4}(-\d{2,4})?|\d{4}-\d{2})$", re.IGNORECASE)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    if value is None:
        errors[field] = "Invalid value."
        return
    text = str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _optional_date(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None or value == "":
        return
    if not isinstance(value, str) or not DATE_RE.match(value.strip()):
        errors[field] = "Use a valid date (YYYY-MM-DD)."


def _optional_number(
    errors: dict[str, str],
    field: str,
    value: Any,
    *,
    allow_negative: bool = True,
    integer_like: bool = False,
) -> None:
    if value is None or value == "":
        return
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        errors[field] = "Enter a valid number."
        return
    if not allow_negative and number < 0:
        errors[field] = "Value cannot be negative."
        return
    if integer_like and number != number.to_integral_value():
        errors[field] = "Enter a whole number."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def validate_ipo_direction_draft(data: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    _require_enum(errors, "preparationStage", data.get("preparationStage", ""), PREPARATION_STAGES)
    _require_enum(errors, "targetSmePlatform", data.get("targetSmePlatform", ""), TARGET_SME_PLATFORMS)
    _require_enum(errors, "eligibilityProfile", data.get("eligibilityProfile", ""), ELIGIBILITY_PROFILES)
    _require_enum(errors, "proposedOfferType", data.get("proposedOfferType", ""), PROPOSED_OFFER_TYPES)
    _require_enum(
        errors, "proposedPricingMethod", data.get("proposedPricingMethod", ""), PRICING_METHODS
    )
    _require_enum(
        errors,
        "publicCompanyConversionStatus",
        data.get("publicCompanyConversionStatus", ""),
        PUBLIC_CONVERSION_STATUSES,
    )
    _ynns(
        errors,
        "freshCertificateOfIncorporationAvailable",
        data.get("freshCertificateOfIncorporationAvailable", ""),
    )
    _optional_date(errors, "tentativeFilingDate", data.get("tentativeFilingDate"))
    _optional_date(errors, "proposedConversionDate", data.get("proposedConversionDate"))
    _optional_date(errors, "actualConversionDate", data.get("actualConversionDate"))

    conversion = data.get("publicCompanyConversionStatus") or ""
    if conversion == "in-progress" and not str(data.get("proposedConversionDate") or "").strip():
        # Allow partial save; warn via field error only when other conversion fields set without date
        if any(
            str(data.get(k) or "").strip()
            for k in (
                "actualConversionDate",
                "newLegalNameAfterConversion",
                "conversionSrnOrReference",
                "freshCertificateOfIncorporationAvailable",
            )
        ):
            errors["proposedConversionDate"] = "Proposed conversion date is required when conversion is in progress."
    if conversion == "completed":
        if data.get("freshCertificateOfIncorporationAvailable") == "yes" and not str(
            data.get("actualConversionDate") or ""
        ).strip():
            errors["actualConversionDate"] = "Actual conversion date is required when conversion is completed."

    if errors:
        raise ValidationError(errors)


def validate_offer_structure_draft(data: dict[str, Any], *, offer_type: str) -> None:
    errors: dict[str, str] = {}
    unit = data.get("amountDisplayUnit") or "crore"
    if unit not in AMOUNT_UNITS:
        errors["amountDisplayUnit"] = "Select ₹ lakh or ₹ crore."

    _require_enum(
        errors,
        "proposedIssuePriceStatus",
        data.get("proposedIssuePriceStatus", ""),
        ISSUE_PRICE_STATUSES,
    )
    for field, integer_like in (
        ("faceValuePerEquityShare", False),
        ("existingIssuedEquityShares", True),
        ("existingPaidUpEquityShareCapital", False),
        ("proposedIssuePrice", False),
        ("proposedFreshIssueShares", True),
        ("proposedFreshIssueAmount", False),
        ("proposedPreIpoPlacementAmount", False),
        ("proposedOfsShares", True),
        ("proposedOfsAmount", False),
        ("numberOfSellingShareholders", True),
    ):
        _optional_number(
            errors,
            field,
            data.get(field),
            allow_negative=False,
            integer_like=integer_like,
        )

    for field in (
        "preIpoPlacementBeingConsidered",
        "sellerConsentsObtained",
        "employeeReservationPlanned",
        "existingShareholderReservationPlanned",
    ):
        _ynns(errors, field, data.get(field, ""))

    status = data.get("proposedIssuePriceStatus") or ""
    if status in {"indicative", "finalised-internally"} and data.get("proposedIssuePrice") is None:
        # Partial OK; if price status set to indicative without price while other fields filled, note
        pass

    includes_fresh, includes_ofs = offer_type_flags(offer_type)
    if not includes_fresh:
        # Ignore fresh fields for validation of presence — still validate format if provided
        pass
    if not includes_ofs:
        pass

    if errors:
        raise ValidationError(errors)


def validate_track_record_draft(data: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    _require_enum(
        errors,
        "operatingTrackRecordBasis",
        data.get("operatingTrackRecordBasis", ""),
        TRACK_RECORD_BASES,
    )
    for field in (
        "sameLineOfBusiness",
        "threeCompleteFinancialYearsAvailable",
        "auditedRecordsAvailable",
        "latestFinancialStatementsAvailable",
        "stubPeriodFinancialsAvailable",
        "auditorHasConfirmedEligibilityFigures",
        "modifiedAuditOpinionRelevantToEligibility",
    ):
        _ynns(errors, field, data.get(field, ""))

    _optional_date(errors, "businessCommencementDate", data.get("businessCommencementDate"))
    _optional_date(errors, "conversionOrSuccessionDate", data.get("conversionOrSuccessionDate"))

    years = data.get("financialYears")
    if not isinstance(years, list):
        errors["financialYears"] = "Provide exactly three financial-year rows."
    elif len(years) != 3:
        errors["financialYears"] = "Exactly three financial-year rows are required."
    else:
        for index, row in enumerate(years):
            prefix = f"financialYears[{index}]"
            if not isinstance(row, dict):
                errors[prefix] = "Invalid financial-year row."
                continue
            if not str(row.get("id") or "").strip():
                errors[f"{prefix}.id"] = "Row id is required."
            ending = str(row.get("financialYearEnding") or "").strip()
            if ending and not FY_ENDING_RE.match(ending):
                errors[f"{prefix}.financialYearEnding"] = "Enter a valid financial year ending."
            _require_enum(
                errors,
                f"{prefix}.auditedStatus",
                row.get("auditedStatus", ""),
                AUDITED_STATUSES,
            )
            _require_enum(
                errors,
                f"{prefix}.sourceType",
                row.get("sourceType", ""),
                FINANCIAL_SOURCE_TYPES,
            )
            for amount_field in (
                "operatingProfitFromOperations",
                "netWorth",
                "freeCashFlowToEquity",
            ):
                _optional_number(errors, f"{prefix}.{amount_field}", row.get(amount_field))

    if data.get("modifiedAuditOpinionRelevantToEligibility") == "yes" and not str(
        data.get("modifiedAuditOpinionExplanation") or ""
    ).strip():
        # Allow partial; format only
        pass

    if errors:
        raise ValidationError(errors)


def validate_declarations_draft(data: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    for key, details_key in DECLARATION_FIELDS:
        answer = data.get(key, "")
        _ynns(errors, key, answer if answer is not None else "")
        details = data.get(details_key)
        if details is None:
            details = []
        if not isinstance(details, list):
            errors[details_key] = "Details must be a list."
            continue
        if answer == "yes" and len(details) == 0:
            errors[details_key] = "Provide structured details when the answer is Yes."
        for index, detail in enumerate(details):
            prefix = f"{details_key}[{index}]"
            if not isinstance(detail, dict):
                errors[prefix] = "Invalid detail record."
                continue
            if not str(detail.get("id") or "").strip():
                errors[f"{prefix}.id"] = "Detail id is required."
            _optional_date(errors, f"{prefix}.date", detail.get("date"))
            if answer == "yes":
                for required in (
                    "personOrEntityInvolved",
                    "authorityOrForum",
                    "currentStatus",
                    "explanation",
                ):
                    if not str(detail.get(required) or "").strip():
                        errors[f"{prefix}.{required}"] = "This field is required when the answer is Yes."
    if errors:
        raise ValidationError(errors)


def validate_process_readiness_draft(data: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    _require_enum(errors, "boardApprovalStatus", data.get("boardApprovalStatus", ""), APPROVAL_STATUSES)
    _require_enum(
        errors,
        "shareholderApprovalStatus",
        data.get("shareholderApprovalStatus", ""),
        SHAREHOLDER_APPROVAL_STATUSES,
    )
    for field in (
        "existingSharesFullyDematerialised",
        "isinAllotted",
        "rtaArrangementsInitiated",
        "clarificationsReceived",
        "inPrincipleApprovalReceived",
    ):
        _ynns(errors, field, data.get(field, ""))

    for field in (
        "leadManagerAppointmentStatus",
        "registrarAppointmentStatus",
        "marketMakerAppointmentStatus",
        "underwriterAppointmentStatus",
        "legalAdviserAppointmentStatus",
        "statutoryAuditorCoordinationStatus",
    ):
        _require_enum(errors, field, data.get(field, ""), APPOINTMENT_STATUSES)

    _require_enum(
        errors, "nsdlConnectivityStatus", data.get("nsdlConnectivityStatus", ""), CONNECTIVITY_STATUSES
    )
    _require_enum(
        errors, "cdslConnectivityStatus", data.get("cdslConnectivityStatus", ""), CONNECTIVITY_STATUSES
    )
    _require_enum(
        errors,
        "inPrincipleApplicationStatus",
        data.get("inPrincipleApplicationStatus", ""),
        IN_PRINCIPLE_STATUSES,
    )

    _optional_date(errors, "boardResolutionDate", data.get("boardResolutionDate"))
    _optional_date(errors, "shareholderResolutionDate", data.get("shareholderResolutionDate"))
    _optional_date(errors, "inPrincipleApplicationDate", data.get("inPrincipleApplicationDate"))
    _optional_date(errors, "inPrincipleApprovalDate", data.get("inPrincipleApprovalDate"))

    if data.get("boardApprovalStatus") == "passed" and not str(
        data.get("boardResolutionDate") or ""
    ).strip() and str(data.get("boardResolutionReference") or "").strip():
        errors["boardResolutionDate"] = "Provide the board resolution date when a reference is recorded."

    status = data.get("inPrincipleApplicationStatus") or ""
    if status in {"filed", "clarifications-pending", "approved"}:
        if not str(data.get("inPrincipleApplicationDate") or "").strip() and str(
            data.get("inPrincipleApplicationReference") or ""
        ).strip():
            errors["inPrincipleApplicationDate"] = (
                "Provide the application date when a reference is recorded."
            )

    if errors:
        raise ValidationError(errors)


def validate_issuer_confirmations_draft(data: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    for key in ISSUER_CONFIRMATION_KEYS:
        value = data.get(key)
        if value is None:
            errors[key] = "Confirmation must be true or false."
        elif not isinstance(value, bool):
            errors[key] = "Confirmation must be true or false."
    if errors:
        raise ValidationError(errors)


VALIDATORS = {
    "ipo-direction": lambda data, payload: validate_ipo_direction_draft(data),
    "offer-structure": lambda data, payload: validate_offer_structure_draft(
        data,
        offer_type=str((payload.get("ipoDirection") or {}).get("proposedOfferType") or ""),
    ),
    "track-record-financial": lambda data, payload: validate_track_record_draft(data),
    "eligibility-declarations": lambda data, payload: validate_declarations_draft(data),
    "process-readiness": lambda data, payload: validate_process_readiness_draft(data),
    "issuer-confirmations": lambda data, payload: validate_issuer_confirmations_draft(data),
}
