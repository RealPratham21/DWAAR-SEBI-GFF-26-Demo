"""Draft-tolerant section validation for Borrowings, Assets & Contracts."""

from __future__ import annotations

from typing import Any, Callable

from app.modules.borrowings_assets_contracts import decimal_utils as dm
from app.modules.borrowings_assets_contracts.constants import (
    ASSET_CLASS,
    ASSET_OWNERSHIP_BASIS,
    BAC_CHANGE_EVENT_TYPE,
    BAC_CONFIRMATION_FIELDS,
    BORROWER_TYPE,
    BORROWING_AUTHORITY_STATE,
    CHARGE_RANKING,
    CHARGE_STATUS,
    CONTRACT_CATEGORY,
    CONTRACT_STATUS,
    COVENANT_COMPLIANCE_STATUS,
    COVENANT_TYPE,
    COUNTERPARTY_ROLE,
    CURRENT_NON_CURRENT,
    DEFAULT_EVENT_TYPE,
    EVENT_CONTINUING_STATUS,
    FACILITY_PURPOSE,
    FACILITY_TYPE,
    FINANCIAL_COVENANT_CATEGORY,
    FUND_NON_FUND,
    GUARANTEE_TYPE,
    INSPECTION_CANDIDATE_TYPE,
    INSURANCE_COVERAGE_STATUS,
    INTEREST_BENCHMARK,
    IPO_CONSENT_REQUIREMENT,
    LENDER_TYPE,
    MATERIALITY_STATUS,
    OCCUPANCY_BASIS,
    PROFESSIONAL_CONFIRMATION_STATUS,
    PROPERTY_ISSUE_TYPE,
    PROPERTY_TYPE,
    RATE_TYPE,
    READINESS_STATE,
    RECONCILIATION_STATUS,
    RELATED_RECORD_TYPE,
    REPAYMENT_TYPE,
    RESTRICTIVE_COVENANT_TRIGGER,
    RESTRUCTURING_EVENT_TYPE,
    SECURED_CLASSIFICATION,
    SECURED_OBJECT,
    SECURITY_TYPE,
    YES_NO_NOT_SURE,
)
from app.modules.borrowings_assets_contracts.facilities import facility_ids, get_facilities
from app.modules.borrowings_assets_contracts.masters import asset_ids, contract_ids, property_ids
from app.modules.borrowings_assets_contracts.references import (
    count_asset_references,
    count_contract_references,
    count_facility_references,
    count_property_references,
    format_asset_dependency_message,
    format_contract_dependency_message,
    format_facility_dependency_message,
    format_property_dependency_message,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


def _require_enum(
    errors: dict[str, str],
    field: str,
    value: Any,
    allowed: frozenset[str],
) -> None:
    text = "" if value is None else str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None or str(value).strip() == "":
        return
    if dm.is_invalid(value):
        errors[field] = "Enter a valid decimal value."


def _check_unique_ids(errors: dict[str, str], field: str, items: list[Any]) -> None:
    if not isinstance(items, list):
        errors[field] = "Must be a list."
        return
    seen: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors[f"{field}[{index}]"] = "Invalid record."
            continue
        item_id = str(item.get("id") or "").strip()
        if not item_id:
            errors[f"{field}[{index}].id"] = "Record id is required."
            continue
        if item_id in seen:
            errors[f"{field}[{index}].id"] = "Duplicate id within this collection."
        seen.add(item_id)


def _optional_facility_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a facility that does not exist in the Facility Master."


def _optional_property_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a property that does not exist in the Property Master."


def _optional_asset_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References an asset that does not exist in the Asset Master."


def _optional_contract_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a contract that does not exist in the Contract Master."


def _validate_facility_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_facilities: list[Any] | None,
) -> None:
    old_ids = facility_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_facilities or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["financialIndebtednessAndFacilityMaster"] = {
        **(full_payload.get("financialIndebtednessAndFacilityMaster") or {}),
        "facilities": new_facilities or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_facility_references(merged, removed_id)
        if deps:
            errors["facilities"] = format_facility_dependency_message(merged, removed_id, deps)


def _validate_property_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_properties: list[Any] | None,
) -> None:
    old_ids = property_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_properties or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["immovablePropertiesAndOccupancyRights"] = {
        **(full_payload.get("immovablePropertiesAndOccupancyRights") or {}),
        "properties": new_properties or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_property_references(merged, removed_id)
        if deps:
            errors["properties"] = format_property_dependency_message(merged, removed_id, deps)


def _validate_asset_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_assets: list[Any] | None,
) -> None:
    old_ids = asset_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_assets or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["materialAssetsEncumbranceAndInsuranceLinkage"] = {
        **(full_payload.get("materialAssetsEncumbranceAndInsuranceLinkage") or {}),
        "assets": new_assets or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_asset_references(merged, removed_id)
        if deps:
            errors["assets"] = format_asset_dependency_message(merged, removed_id, deps)


def _validate_contract_deletions(
    errors: dict[str, str],
    full_payload: dict[str, Any],
    new_contracts: list[Any] | None,
) -> None:
    old_ids = contract_ids(full_payload)
    new_ids = {
        str(item.get("id"))
        for item in (new_contracts or [])
        if isinstance(item, dict) and item.get("id")
    }
    merged = dict(full_payload)
    merged["materialBusinessStrategicAndOtherContracts"] = {
        **(full_payload.get("materialBusinessStrategicAndOtherContracts") or {}),
        "contracts": new_contracts or [],
    }
    for removed_id in old_ids - new_ids:
        deps = count_contract_references(merged, removed_id)
        if deps:
            errors["contracts"] = format_contract_dependency_message(merged, removed_id, deps)


def validate_facility_master(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    snapshot = section.get("borrowingSnapshot") or {}
    for field in (
        "currentBorrowingsExist",
        "securedBorrowingsExist",
        "unsecuredBorrowingsExist",
        "workingCapitalFacilitiesExist",
        "nonFundBasedFacilitiesExist",
        "relatedPartyBorrowingsExist",
        "foreignCurrencyBorrowingsExist",
        "leaseLiabilitiesExist",
        "debtSecuritiesNcdsExist",
        "materialSubsidiaryFacilitiesRelevant",
    ):
        _ynns(errors, f"borrowingSnapshot.{field}", snapshot.get(field))

    facilities = section.get("facilities") or []
    _check_unique_ids(errors, "facilities", facilities)
    _validate_facility_deletions(errors, full_payload, facilities)

    for index, facility in enumerate(facilities):
        if not isinstance(facility, dict):
            continue
        prefix = f"facilities[{index}]"
        borrower = facility.get("borrower") or {}
        lender = facility.get("lender") or {}
        _require_enum(errors, f"{prefix}.borrower.borrowerType", borrower.get("borrowerType"), BORROWER_TYPE)
        _require_enum(errors, f"{prefix}.lender.lenderType", lender.get("lenderType"), LENDER_TYPE)
        _ynns(errors, f"{prefix}.lender.relatedPartyStatus", lender.get("relatedPartyStatus"))
        _require_enum(errors, f"{prefix}.facilityType", facility.get("facilityType"), FACILITY_TYPE)
        _require_enum(errors, f"{prefix}.fundBasedNonFundBased", facility.get("fundBasedNonFundBased"), FUND_NON_FUND)
        _require_enum(errors, f"{prefix}.securedUnsecured", facility.get("securedUnsecured"), SECURED_CLASSIFICATION)
        sanction = facility.get("sanctionAndUtilisation") or {}
        _require_enum(
            errors,
            f"{prefix}.sanctionAndUtilisation.currentNonCurrentClassification",
            sanction.get("currentNonCurrentClassification"),
            CURRENT_NON_CURRENT,
        )
        for dec_field in (
            "originalSanctionAmount",
            "currentSanctionedLimit",
            "totalAmountDisbursed",
            "amountRepaid",
            "principalOutstanding",
            "accruedInterest",
            "totalOutstanding",
            "undrawnAmount",
        ):
            _optional_decimal(errors, f"{prefix}.sanctionAndUtilisation.{dec_field}", sanction.get(dec_field))
        interest = facility.get("interest") or {}
        _require_enum(errors, f"{prefix}.interest.rateType", interest.get("rateType"), RATE_TYPE)
        _require_enum(errors, f"{prefix}.interest.benchmark", interest.get("benchmark"), INTEREST_BENCHMARK)
        tenor = facility.get("tenorAndRepayment") or {}
        _require_enum(errors, f"{prefix}.tenorAndRepayment.repaymentType", tenor.get("repaymentType"), REPAYMENT_TYPE)
        _ynns(errors, f"{prefix}.tenorAndRepayment.repaymentScheduleAvailable", tenor.get("repaymentScheduleAvailable"))
        purpose = facility.get("purpose") or {}
        for purpose_index, purpose_value in enumerate(purpose.get("purposes") or []):
            if purpose_value not in FACILITY_PURPOSE:
                errors[f"{prefix}.purpose.purposes[{purpose_index}]"] = "Select a valid purpose."
        prepayment = facility.get("prepayment") or {}
        for field in ("prepaymentAllowed", "lenderConsentRequired"):
            _ynns(errors, f"{prefix}.prepayment.{field}", prepayment.get(field))
        _require_enum(
            errors,
            f"{prefix}.prepayment.professionalReviewStatus",
            prepayment.get("professionalReviewStatus"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    if errors:
        raise ValidationError(errors)


def validate_security_charges(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_facility_ids = facility_ids(full_payload)
    valid_property_ids = property_ids(full_payload)
    valid_asset_ids = asset_ids(full_payload)

    for collection in ("securities", "charges", "guarantees"):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, security in enumerate(section.get("securities") or []):
        if not isinstance(security, dict):
            continue
        prefix = f"securities[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", security.get("linkedFacilityId"), valid_facility_ids)
        _optional_property_ref(errors, f"{prefix}.linkedPropertyId", security.get("linkedPropertyId"), valid_property_ids)
        _optional_asset_ref(errors, f"{prefix}.linkedAssetId", security.get("linkedAssetId"), valid_asset_ids)
        _require_enum(errors, f"{prefix}.securityType", security.get("securityType"), SECURITY_TYPE)
        _require_enum(errors, f"{prefix}.securedObject", security.get("securedObject"), SECURED_OBJECT)
        _require_enum(errors, f"{prefix}.chargeRanking", security.get("chargeRanking"), CHARGE_RANKING)
        _ynns(errors, f"{prefix}.sharedWithAnotherLender", security.get("sharedWithAnotherLender"))
        _optional_decimal(errors, f"{prefix}.amountSecured", security.get("amountSecured"))
        _optional_decimal(errors, f"{prefix}.maximumSecuredAmount", security.get("maximumSecuredAmount"))

    for index, charge in enumerate(section.get("charges") or []):
        if not isinstance(charge, dict):
            continue
        prefix = f"charges[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", charge.get("linkedFacilityId"), valid_facility_ids)
        _require_enum(errors, f"{prefix}.status", charge.get("status"), CHARGE_STATUS)
        _optional_decimal(errors, f"{prefix}.amountSecured", charge.get("amountSecured"))
        _require_enum(
            errors,
            f"{prefix}.professionalReviewStatus",
            charge.get("professionalReviewStatus"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    for index, guarantee in enumerate(section.get("guarantees") or []):
        if not isinstance(guarantee, dict):
            continue
        prefix = f"guarantees[{index}]"
        _require_enum(errors, f"{prefix}.guaranteeType", guarantee.get("guaranteeType"), GUARANTEE_TYPE)
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", guarantee.get("linkedFacilityId"), valid_facility_ids)
        _optional_decimal(errors, f"{prefix}.guaranteeAmountCap", guarantee.get("guaranteeAmountCap"))
        _ynns(errors, f"{prefix}.relatedPartyStatus", guarantee.get("relatedPartyStatus"))
        _require_enum(
            errors,
            f"{prefix}.professionalConfirmation",
            guarantee.get("professionalConfirmation"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    powers = section.get("borrowingPowers") or {}
    for field in (
        "boardBorrowingResolutionExists",
        "shareholderBorrowingApprovalExists",
        "articlesPermitBorrowing",
    ):
        _ynns(errors, f"borrowingPowers.{field}", powers.get(field))
    _require_enum(errors, "borrowingPowers.authorityState", powers.get("authorityState"), BORROWING_AUTHORITY_STATE)
    _optional_decimal(errors, "borrowingPowers.approvedBorrowingLimit", powers.get("approvedBorrowingLimit"))
    _optional_decimal(errors, "borrowingPowers.shareholderApprovedLimit", powers.get("shareholderApprovedLimit"))
    _optional_decimal(errors, "borrowingPowers.lenderImposedBorrowingCap", powers.get("lenderImposedBorrowingCap"))

    if errors:
        raise ValidationError(errors)


def validate_covenants_consents(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_facility_ids = facility_ids(full_payload)

    for collection in (
        "covenants",
        "lenderConsents",
        "defaultEvents",
        "restructuringEvents",
        "crossDefaults",
    ):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, covenant in enumerate(section.get("covenants") or []):
        if not isinstance(covenant, dict):
            continue
        prefix = f"covenants[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", covenant.get("linkedFacilityId"), valid_facility_ids)
        _require_enum(errors, f"{prefix}.covenantType", covenant.get("covenantType"), COVENANT_TYPE)
        financial = covenant.get("financialDetails") or {}
        _require_enum(errors, f"{prefix}.financialDetails.category", financial.get("category"), FINANCIAL_COVENANT_CATEGORY)
        _require_enum(
            errors,
            f"{prefix}.financialDetails.complianceStatus",
            financial.get("complianceStatus"),
            COVENANT_COMPLIANCE_STATUS,
        )
        _optional_decimal(errors, f"{prefix}.financialDetails.thresholdValue", financial.get("thresholdValue"))
        _optional_decimal(errors, f"{prefix}.financialDetails.actualValue", financial.get("actualValue"))
        restrictive = covenant.get("restrictiveDetails") or {}
        _require_enum(
            errors,
            f"{prefix}.restrictiveDetails.trigger",
            restrictive.get("trigger"),
            RESTRICTIVE_COVENANT_TRIGGER,
        )

    for index, consent in enumerate(section.get("lenderConsents") or []):
        if not isinstance(consent, dict):
            continue
        prefix = f"lenderConsents[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", consent.get("linkedFacilityId"), valid_facility_ids)
        _require_enum(
            errors,
            f"{prefix}.ipoConsentRequirement",
            consent.get("ipoConsentRequirement"),
            IPO_CONSENT_REQUIREMENT,
        )
        for field in ("consentRequested", "consentReceived", "conditionsAttached", "conditionsSatisfied"):
            _ynns(errors, f"{prefix}.{field}", consent.get(field))

    for index, event in enumerate(section.get("defaultEvents") or []):
        if not isinstance(event, dict):
            continue
        prefix = f"defaultEvents[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", event.get("linkedFacilityId"), valid_facility_ids)
        _require_enum(errors, f"{prefix}.eventType", event.get("eventType"), DEFAULT_EVENT_TYPE)
        _require_enum(
            errors,
            f"{prefix}.continuingStatus",
            event.get("continuingStatus"),
            EVENT_CONTINUING_STATUS,
        )
        _optional_decimal(errors, f"{prefix}.amount", event.get("amount"))

    for index, event in enumerate(section.get("restructuringEvents") or []):
        if not isinstance(event, dict):
            continue
        prefix = f"restructuringEvents[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", event.get("linkedFacilityId"), valid_facility_ids)
        _require_enum(errors, f"{prefix}.eventType", event.get("eventType"), RESTRUCTURING_EVENT_TYPE)

    for index, cross_default in enumerate(section.get("crossDefaults") or []):
        if not isinstance(cross_default, dict):
            continue
        prefix = f"crossDefaults[{index}]"
        _optional_facility_ref(
            errors,
            f"{prefix}.linkedFacilityId",
            cross_default.get("linkedFacilityId"),
            valid_facility_ids,
        )
        for linked_index, linked_id in enumerate(cross_default.get("linkedFacilityIds") or []):
            _optional_facility_ref(
                errors,
                f"{prefix}.linkedFacilityIds[{linked_index}]",
                linked_id,
                valid_facility_ids,
            )

    if errors:
        raise ValidationError(errors)


def validate_properties(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_property_ids = property_ids(full_payload)

    properties = section.get("properties") or []
    _check_unique_ids(errors, "properties", properties)
    _validate_property_deletions(errors, full_payload, properties)
    _check_unique_ids(errors, "propertyIssues", section.get("propertyIssues") or [])

    for index, property_record in enumerate(properties):
        if not isinstance(property_record, dict):
            continue
        prefix = f"properties[{index}]"
        identity = property_record.get("identity") or {}
        _require_enum(errors, f"{prefix}.identity.propertyType", identity.get("propertyType"), PROPERTY_TYPE)
        _require_enum(errors, f"{prefix}.occupancyBasis", property_record.get("occupancyBasis"), OCCUPANCY_BASIS)
        owned = property_record.get("ownedDetails") or {}
        _ynns(errors, f"{prefix}.ownedDetails.titleInIssuerName", owned.get("titleInIssuerName"))
        _ynns(errors, f"{prefix}.ownedDetails.encumbered", owned.get("encumbered"))
        leased = property_record.get("leasedDetails") or {}
        _ynns(errors, f"{prefix}.leasedDetails.relatedPartyStatus", leased.get("relatedPartyStatus"))
        _optional_decimal(errors, f"{prefix}.leasedDetails.monthlyAnnualRent", leased.get("monthlyAnnualRent"))

    for index, issue in enumerate(section.get("propertyIssues") or []):
        if not isinstance(issue, dict):
            continue
        prefix = f"propertyIssues[{index}]"
        _optional_property_ref(errors, f"{prefix}.linkedPropertyId", issue.get("linkedPropertyId"), valid_property_ids)
        _require_enum(errors, f"{prefix}.issueType", issue.get("issueType"), PROPERTY_ISSUE_TYPE)
        _require_enum(errors, f"{prefix}.readinessState", issue.get("readinessState"), READINESS_STATE)

    if errors:
        raise ValidationError(errors)


def validate_assets(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_facility_ids = facility_ids(full_payload)
    valid_property_ids = property_ids(full_payload)
    valid_asset_ids = asset_ids(full_payload)
    valid_contract_ids = contract_ids(full_payload)

    assets = section.get("assets") or []
    _check_unique_ids(errors, "assets", assets)
    _validate_asset_deletions(errors, full_payload, assets)
    for collection in ("assetFinancialsReconciliations", "insuranceLinkages", "ipContractualDependencies"):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, asset in enumerate(assets):
        if not isinstance(asset, dict):
            continue
        prefix = f"assets[{index}]"
        _require_enum(errors, f"{prefix}.assetClass", asset.get("assetClass"), ASSET_CLASS)
        _require_enum(errors, f"{prefix}.ownershipBasis", asset.get("ownershipBasis"), ASSET_OWNERSHIP_BASIS)
        _optional_property_ref(errors, f"{prefix}.linkedPropertyId", asset.get("linkedPropertyId"), valid_property_ids)
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", asset.get("linkedFacilityId"), valid_facility_ids)
        _ynns(errors, f"{prefix}.encumbered", asset.get("encumbered"))
        _optional_decimal(errors, f"{prefix}.acquisitionCost", asset.get("acquisitionCost"))
        _optional_decimal(errors, f"{prefix}.latestBookValue", asset.get("latestBookValue"))

    for index, reconciliation in enumerate(section.get("assetFinancialsReconciliations") or []):
        if not isinstance(reconciliation, dict):
            continue
        prefix = f"assetFinancialsReconciliations[{index}]"
        _optional_asset_ref(errors, f"{prefix}.linkedAssetId", reconciliation.get("linkedAssetId"), valid_asset_ids)
        _require_enum(
            errors,
            f"{prefix}.reconciliationStatus",
            reconciliation.get("reconciliationStatus"),
            RECONCILIATION_STATUS,
        )

    for index, insurance in enumerate(section.get("insuranceLinkages") or []):
        if not isinstance(insurance, dict):
            continue
        prefix = f"insuranceLinkages[{index}]"
        _optional_property_ref(errors, f"{prefix}.linkedPropertyId", insurance.get("linkedPropertyId"), valid_property_ids)
        _optional_asset_ref(errors, f"{prefix}.linkedAssetId", insurance.get("linkedAssetId"), valid_asset_ids)
        _require_enum(errors, f"{prefix}.coverageStatus", insurance.get("coverageStatus"), INSURANCE_COVERAGE_STATUS)

    for index, dependency in enumerate(section.get("ipContractualDependencies") or []):
        if not isinstance(dependency, dict):
            continue
        prefix = f"ipContractualDependencies[{index}]"
        _optional_contract_ref(
            errors,
            f"{prefix}.linkedContractId",
            dependency.get("linkedContractId"),
            valid_contract_ids,
        )

    if errors:
        raise ValidationError(errors)


def validate_contracts(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    contracts = section.get("contracts") or []
    _check_unique_ids(errors, "contracts", contracts)
    _validate_contract_deletions(errors, full_payload, contracts)

    for index, contract in enumerate(contracts):
        if not isinstance(contract, dict):
            continue
        prefix = f"contracts[{index}]"
        _require_enum(errors, f"{prefix}.category", contract.get("category"), CONTRACT_CATEGORY)
        parties = contract.get("parties") or {}
        _require_enum(errors, f"{prefix}.parties.role", parties.get("role"), COUNTERPARTY_ROLE)
        _ynns(errors, f"{prefix}.parties.relatedPartyStatus", parties.get("relatedPartyStatus"))
        basic_terms = contract.get("basicTerms") or {}
        _require_enum(errors, f"{prefix}.basicTerms.status", basic_terms.get("status"), CONTRACT_STATUS)
        commercial = contract.get("commercialImportance") or {}
        for dec_field in ("contractValue", "minimumCommitment", "annualRevenueCostAttributable"):
            _optional_decimal(errors, f"{prefix}.commercialImportance.{dec_field}", commercial.get(dec_field))
        assignment = contract.get("assignmentChangeOfControl") or {}
        _require_enum(
            errors,
            f"{prefix}.assignmentChangeOfControl.professionalReview",
            assignment.get("professionalReview"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    if errors:
        raise ValidationError(errors)


def validate_materiality_inspection(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_contract_ids = contract_ids(full_payload)

    for collection in (
        "materialityRecords",
        "nonOrdinaryCourseReviews",
        "breachDisputeReadiness",
        "inspectionCandidates",
    ):
        _check_unique_ids(errors, collection, section.get(collection) or [])

    for index, record in enumerate(section.get("materialityRecords") or []):
        if not isinstance(record, dict):
            continue
        prefix = f"materialityRecords[{index}]"
        _optional_contract_ref(errors, f"{prefix}.linkedContractId", record.get("linkedContractId"), valid_contract_ids)
        _require_enum(errors, f"{prefix}.materialityStatus", record.get("materialityStatus"), MATERIALITY_STATUS)

    for collection in ("nonOrdinaryCourseReviews", "breachDisputeReadiness", "inspectionCandidates"):
        for index, record in enumerate(section.get(collection) or []):
            if not isinstance(record, dict):
                continue
            prefix = f"{collection}[{index}]"
            _optional_contract_ref(
                errors,
                f"{prefix}.linkedContractId",
                record.get("linkedContractId"),
                valid_contract_ids,
            )
            if collection == "inspectionCandidates":
                _require_enum(
                    errors,
                    f"{prefix}.candidateType",
                    record.get("candidateType"),
                    INSPECTION_CANDIDATE_TYPE,
                )

    if errors:
        raise ValidationError(errors)


def validate_reconciliation_confirmations(section: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}
    valid_facility_ids = facility_ids(full_payload)

    financials = section.get("financialsReconciliation") or {}
    _require_enum(
        errors,
        "financialsReconciliation.reconciliationStatus",
        financials.get("reconciliationStatus"),
        RECONCILIATION_STATUS,
    )
    for dec_field in ("bacFacilityTotal", "financialsValue", "difference"):
        _optional_decimal(errors, f"financialsReconciliation.{dec_field}", financials.get(dec_field))

    _check_unique_ids(errors, "objectsOfIssueRepayments", section.get("objectsOfIssueRepayments") or [])
    for index, item in enumerate(section.get("objectsOfIssueRepayments") or []):
        if not isinstance(item, dict):
            continue
        prefix = f"objectsOfIssueRepayments[{index}]"
        _optional_facility_ref(errors, f"{prefix}.linkedFacilityId", item.get("linkedFacilityId"), valid_facility_ids)
        _require_enum(
            errors,
            f"{prefix}.lenderConsentNocRequirement",
            item.get("lenderConsentNocRequirement"),
            IPO_CONSENT_REQUIREMENT,
        )
        _require_enum(
            errors,
            f"{prefix}.reconciliationStatus",
            item.get("reconciliationStatus"),
            RECONCILIATION_STATUS,
        )

    for rec_field in (
        "groupEntitiesReconciliation",
        "capitalOwnershipReconciliation",
        "businessOperationsReconciliation",
    ):
        rec = section.get(rec_field) or {}
        _require_enum(errors, f"{rec_field}.reconciliationStatus", rec.get("reconciliationStatus"), RECONCILIATION_STATUS)

    _check_unique_ids(errors, "changes", section.get("changes") or [])
    for index, change in enumerate(section.get("changes") or []):
        if not isinstance(change, dict):
            continue
        prefix = f"changes[{index}]"
        _require_enum(errors, f"{prefix}.eventType", change.get("eventType"), BAC_CHANGE_EVENT_TYPE)
        _require_enum(errors, f"{prefix}.relatedRecordType", change.get("relatedRecordType"), RELATED_RECORD_TYPE)
        _require_enum(
            errors,
            f"{prefix}.professionalReview",
            change.get("professionalReview"),
            PROFESSIONAL_CONFIRMATION_STATUS,
        )

    confirmations = section.get("confirmations") or {}
    for key, _ in BAC_CONFIRMATION_FIELDS:
        _ynns(errors, f"confirmations.{key}", confirmations.get(key))

    if errors:
        raise ValidationError(errors)


VALIDATORS: dict[str, Callable[[dict[str, Any], dict[str, Any]], None]] = {
    "financial-indebtedness-and-facility-master": validate_facility_master,
    "security-charges-guarantees-and-borrowing-powers": validate_security_charges,
    "covenants-defaults-waivers-and-lender-consents": validate_covenants_consents,
    "immovable-properties-and-occupancy-rights": validate_properties,
    "material-assets-encumbrance-and-insurance-linkage": validate_assets,
    "material-business-strategic-and-other-contracts": validate_contracts,
    "contract-materiality-expiry-and-inspection-readiness": validate_materiality_inspection,
    "reconciliation-changes-and-issuer-confirmations": validate_reconciliation_confirmations,
}
