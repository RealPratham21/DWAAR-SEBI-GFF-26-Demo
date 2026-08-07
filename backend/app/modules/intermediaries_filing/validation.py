"""Draft-tolerant section validation for Intermediaries & Filing."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.intermediaries_filing.constants import (
    IF_CONFIRMATION_FIELDS,
    INTERMEDIARY_ROLE,
    YES_NO_NOT_SURE,
)
from app.modules.intermediaries_filing.decimal_utils import is_invalid
from app.modules.intermediaries_filing.filings import document_version_ids, filing_ids
from app.modules.intermediaries_filing.intermediaries import intermediary_ids
from app.modules.intermediaries_filing.references import (
    count_document_version_references,
    count_filing_references,
    count_intermediary_references,
    format_document_version_dependency_message,
    format_filing_dependency_message,
    format_intermediary_dependency_message,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    text = "" if value is None else str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None or str(value).strip() == "":
        return
    if is_invalid(value):
        errors[field] = "Enter a valid decimal value."


def _check_unique_ids(
    errors: dict[str, str],
    field: str,
    items: list[Any] | None,
    id_key: str,
) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get(id_key) or "").strip()
        if not item_id:
            errors[f"{field}[{index}].{id_key}"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].{id_key}"] = "Duplicate id within this collection."
        seen.add(item_id)


def _optional_intermediary_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References an intermediary that does not exist in the Intermediary Master."


def _optional_filing_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a filing that does not exist in the Filing Tracker."


def _optional_document_version_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a document version that does not exist."


def _validate_intermediary_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_intermediaries: list[Any] | None,
) -> None:
    old_ids = intermediary_ids(full_payload)
    new_ids = {
        str(item.get("intermediaryId"))
        for item in (new_intermediaries or [])
        if isinstance(item, dict) and item.get("intermediaryId")
    }
    merged = dict(full_payload)
    merged["issueTeamAndIntermediaryMaster"] = {
        **(full_payload.get("issueTeamAndIntermediaryMaster") or {}),
        "intermediaries": new_intermediaries or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_intermediary_references(merged, removed_id)
        if deps:
            errors["intermediaries"] = format_intermediary_dependency_message(merged, removed_id, deps)


def _validate_filing_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_filings: list[Any] | None,
) -> None:
    old_ids = filing_ids(full_payload)
    new_ids = {
        str(item.get("filingId"))
        for item in (new_filings or [])
        if isinstance(item, dict) and item.get("filingId")
    }
    merged = dict(full_payload)
    merged["filingAndRegulatoryMilestoneTracker"] = {
        **(full_payload.get("filingAndRegulatoryMilestoneTracker") or {}),
        "filings": new_filings or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_filing_references(merged, removed_id)
        if deps:
            errors["filings"] = format_filing_dependency_message(merged, removed_id, deps)


def _validate_document_version_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_versions: list[Any] | None,
) -> None:
    old_ids = document_version_ids(full_payload)
    new_ids = {
        str(item.get("documentVersionId"))
        for item in (new_versions or [])
        if isinstance(item, dict) and item.get("documentVersionId")
    }
    merged = dict(full_payload)
    merged["finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness"] = {
        **(full_payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}),
        "offerDocumentVersions": new_versions or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_document_version_references(merged, removed_id)
        if deps:
            errors["offerDocumentVersions"] = format_document_version_dependency_message(
                merged,
                removed_id,
                deps,
            )


def validate_issue_team_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    snapshot = data.get("issueTeamSnapshot") or {}
    for field in (
        "leadManagerAppointed",
        "registrarAppointed",
        "legalCounselAppointed",
        "statutoryPeerReviewAuditorEngaged",
        "marketMakerAppointed",
        "underwritersAppointed",
        "bankersToIssueAppointed",
        "sponsorBankAppointed",
        "monitoringAgencyApplicable",
        "monitoringAgencyAppointed",
        "syndicateMembersApplicable",
        "syndicateMembersAppointed",
        "allRequiredEngagementAgreementsExecuted",
        "applicableRegistrationsReviewed",
    ):
        _ynns(errors, f"issueTeamSnapshot.{field}", snapshot.get(field))

    intermediaries = data.get("intermediaries")
    _check_unique_ids(errors, "intermediaries", intermediaries, "intermediaryId")
    valid_intermediary_ids = {
        str(item.get("intermediaryId"))
        for item in (intermediaries or [])
        if isinstance(item, dict) and item.get("intermediaryId")
    }
    for index, intermediary in enumerate(intermediaries or []):
        if not isinstance(intermediary, dict):
            continue
        prefix = f"intermediaries[{index}]"
        for role in intermediary.get("roles") or []:
            if str(role) not in INTERMEDIARY_ROLE:
                errors[f"{prefix}.roles"] = "Select valid intermediary role(s)."
                break
        _optional_intermediary_ref(
            errors,
            f"{prefix}.appointment.replacementIntermediaryId",
            (intermediary.get("appointment") or {}).get("replacementIntermediaryId"),
            valid_intermediary_ids,
        )

    inter_se = data.get("interSeAgreement") or {}
    _optional_intermediary_ref(
        errors,
        "interSeAgreement.coordinatingLeadManagerIntermediaryId",
        inter_se.get("coordinatingLeadManagerIntermediaryId"),
        valid_intermediary_ids,
    )

    for index, responsibility in enumerate(data.get("interSeResponsibilities") or []):
        if not isinstance(responsibility, dict):
            continue
        _optional_intermediary_ref(
            errors,
            f"interSeResponsibilities[{index}].intermediaryId",
            responsibility.get("intermediaryId"),
            valid_intermediary_ids,
        )

    _validate_intermediary_deletions(errors, full_payload, intermediaries if isinstance(intermediaries, list) else [])
    if errors:
        raise ValidationError(errors)


def validate_issue_configuration_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    del full_payload
    errors: dict[str, str] = {}
    pricing = data.get("pricing") or {}
    for field in ("fixedIssuePrice", "floorPrice", "capPrice", "finalIssuePrice", "minimumApplicationAmount"):
        if field in pricing:
            _optional_decimal(errors, f"pricing.{field}", pricing.get(field))
    lot = data.get("lotApplicationDetails") or {}
    _optional_decimal(errors, "lotApplicationDetails.minimumApplicationAmount", lot.get("minimumApplicationAmount"))
    for index, allocation in enumerate(data.get("investorAllocations") or []):
        if not isinstance(allocation, dict):
            continue
        prefix = f"investorAllocations[{index}]"
        for field in ("shares", "percentage", "amount"):
            _optional_decimal(errors, f"{prefix}.{field}", allocation.get(field))
    if errors:
        raise ValidationError(errors)


def validate_filing_tracker_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    filings = data.get("filings")
    _check_unique_ids(errors, "filings", filings, "filingId")
    valid_filing_ids = {
        str(item.get("filingId"))
        for item in (filings or [])
        if isinstance(item, dict) and item.get("filingId")
    }
    valid_document_ids = document_version_ids(full_payload)

    for index, filing in enumerate(filings or []):
        if not isinstance(filing, dict):
            continue
        prefix = f"filings[{index}]"
        _optional_document_version_ref(
            errors,
            f"{prefix}.linkedDocumentVersionId",
            filing.get("linkedDocumentVersionId"),
            valid_document_ids,
        )
        _optional_filing_ref(errors, f"{prefix}.supersededByFilingId", filing.get("supersededByFilingId"), valid_filing_ids)
        _optional_intermediary_ref(
            errors,
            f"{prefix}.responsibleLeadManagerIntermediaryId",
            filing.get("responsibleLeadManagerIntermediaryId"),
            intermediary_ids(full_payload),
        )

    for index, query in enumerate(data.get("exchangeQueries") or []):
        if not isinstance(query, dict):
            continue
        _optional_filing_ref(errors, f"exchangeQueries[{index}].filingId", query.get("filingId"), valid_filing_ids)

    sebi = data.get("sebiSmeFiling") or {}
    _optional_filing_ref(errors, "sebiSmeFiling.linkedFilingId", sebi.get("linkedFilingId"), valid_filing_ids)

    _validate_filing_deletions(errors, full_payload, filings if isinstance(filings, list) else [])
    if errors:
        raise ValidationError(errors)


def validate_due_diligence_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_intermediary_ids = intermediary_ids(full_payload)
    valid_document_ids = document_version_ids(full_payload)
    for index, certificate in enumerate(data.get("certificates") or []):
        if not isinstance(certificate, dict):
            continue
        prefix = f"certificates[{index}]"
        _optional_intermediary_ref(errors, f"{prefix}.linkedIntermediaryId", certificate.get("linkedIntermediaryId"), valid_intermediary_ids)
        _optional_document_version_ref(
            errors,
            f"{prefix}.linkedOfferDocumentVersionId",
            certificate.get("linkedOfferDocumentVersionId"),
            valid_document_ids,
        )
    for index, consent in enumerate(data.get("consents") or []):
        if not isinstance(consent, dict):
            continue
        prefix = f"consents[{index}]"
        _optional_intermediary_ref(
            errors,
            f"{prefix}.linkedPersonIntermediaryId",
            consent.get("linkedPersonIntermediaryId"),
            valid_intermediary_ids,
        )
        _optional_document_version_ref(
            errors,
            f"{prefix}.linkedOfferDocumentVersionId",
            consent.get("linkedOfferDocumentVersionId"),
            valid_document_ids,
        )
    if errors:
        raise ValidationError(errors)


def validate_infrastructure_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_intermediary_ids = intermediary_ids(full_payload)
    agreements = data.get("depositoryAgreements") or {}
    for side in ("nsdl", "cdsl"):
        agreement = agreements.get(side) or {}
        _optional_intermediary_ref(
            errors,
            f"depositoryAgreements.{side}.registrarIntermediaryId",
            agreement.get("registrarIntermediaryId"),
            valid_intermediary_ids,
        )
    sponsor = data.get("sponsorBankUpiReadiness") or {}
    _optional_intermediary_ref(errors, "sponsorBankUpiReadiness.intermediaryId", sponsor.get("intermediaryId"), valid_intermediary_ids)
    for index, role in enumerate(data.get("issueBankRoles") or []):
        if isinstance(role, dict):
            _optional_intermediary_ref(
                errors,
                f"issueBankRoles[{index}].intermediaryId",
                role.get("intermediaryId"),
                valid_intermediary_ids,
            )
    if errors:
        raise ValidationError(errors)


def validate_underwriting_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    summary = data.get("underwritingSummary") or {}
    for field in (
        "issueShares",
        "issueAmount",
        "totalUnderwritingCommitment",
        "totalUnderwritingPercentage",
        "leadManagerOwnAccountCommitment",
        "ownAccountPercentage",
    ):
        _optional_decimal(errors, f"underwritingSummary.{field}", summary.get(field))
    valid_intermediary_ids = intermediary_ids(full_payload)
    for index, commitment in enumerate(data.get("underwritingCommitments") or []):
        if not isinstance(commitment, dict):
            continue
        prefix = f"underwritingCommitments[{index}]"
        for field in ("sharesUnderwritten", "amountUnderwritten", "percentageOfIssue"):
            _optional_decimal(errors, f"{prefix}.{field}", commitment.get(field))
        _optional_intermediary_ref(errors, f"{prefix}.intermediaryId", commitment.get("intermediaryId"), valid_intermediary_ids)
    market_maker = data.get("marketMakerConfiguration") or {}
    _optional_intermediary_ref(
        errors,
        "marketMakerConfiguration.marketMakerIntermediaryId",
        market_maker.get("marketMakerIntermediaryId"),
        valid_intermediary_ids,
    )
    reservation = data.get("marketMakerReservation") or {}
    for field in ("reservedShares", "reservationAmount", "percentage", "issuePrice"):
        _optional_decimal(errors, f"marketMakerReservation.{field}", reservation.get(field))
    if errors:
        raise ValidationError(errors)


def validate_issue_programme_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    del full_payload
    errors: dict[str, str] = {}
    for index, row in enumerate(data.get("subscriptionRows") or []):
        if not isinstance(row, dict):
            continue
        prefix = f"subscriptionRows[{index}]"
        for field in ("sharesOffered", "sharesBidApplied", "bidApplicationAmount", "validDemand", "subscriptionMultiple"):
            _optional_decimal(errors, f"{prefix}.{field}", row.get(field))
    if errors:
        raise ValidationError(errors)


def validate_final_document_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    versions = data.get("offerDocumentVersions")
    _check_unique_ids(errors, "offerDocumentVersions", versions, "documentVersionId")
    valid_document_ids = {
        str(item.get("documentVersionId"))
        for item in (versions or [])
        if isinstance(item, dict) and item.get("documentVersionId")
    }
    valid_intermediary_ids = intermediary_ids(full_payload)

    for index, version in enumerate(versions or []):
        if not isinstance(version, dict):
            continue
        _optional_document_version_ref(
            errors,
            f"offerDocumentVersions[{index}].supersedesDocumentVersionId",
            version.get("supersedesDocumentVersionId"),
            valid_document_ids,
        )

    for index, placeholder in enumerate(data.get("placeholders") or []):
        if isinstance(placeholder, dict):
            _optional_document_version_ref(
                errors,
                f"placeholders[{index}].documentVersionId",
                placeholder.get("documentVersionId"),
                valid_document_ids,
            )

    repo = data.get("merchantBankerDdRepositoryReadiness") or {}
    _optional_intermediary_ref(
        errors,
        "merchantBankerDdRepositoryReadiness.responsibleLeadManagerIntermediaryId",
        repo.get("responsibleLeadManagerIntermediaryId"),
        valid_intermediary_ids,
    )

    confirmations = data.get("finalConfirmations") or {}
    for key, _ in IF_CONFIRMATION_FIELDS:
        _ynns(errors, f"finalConfirmations.{key}", confirmations.get(key))

    _validate_document_version_deletions(errors, full_payload, versions if isinstance(versions, list) else [])
    if errors:
        raise ValidationError(errors)


def _passthrough(_data: dict[str, Any], _full_payload: dict[str, Any]) -> None:
    return None


VALIDATORS: dict[str, Callable[[dict[str, Any], dict[str, Any]], None]] = {
    "issue-team-and-intermediary-master": validate_issue_team_draft,
    "issue-configuration-and-filing-snapshot": validate_issue_configuration_draft,
    "filing-and-regulatory-milestone-tracker": validate_filing_tracker_draft,
    "due-diligence-certificates-consents-and-signoffs": validate_due_diligence_draft,
    "depositories-banking-asba-upi-and-issue-infrastructure": validate_infrastructure_draft,
    "underwriting-market-making-and-distribution-arrangements": validate_underwriting_draft,
    "issue-programme-allotment-listing-and-post-issue-execution": validate_issue_programme_draft,
    "final-offer-document-advertisements-material-documents-and-filing-readiness": validate_final_document_draft,
}
