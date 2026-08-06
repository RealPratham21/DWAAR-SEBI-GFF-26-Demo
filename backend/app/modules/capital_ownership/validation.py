"""Draft-tolerant section validation for Capital & Ownership.

Stricter than the frontend zod schema only where values are actually present: enums must be
valid, decimal strings must parse and be non-negative where negative values make no business
sense, repeatable-record ids must be unique, and cross-record references (shareholder ids,
promoter ids, equity class ids) must point at records that exist. Deleting a record that is
still referenced elsewhere in the payload is rejected with a field error naming the dependents.

Missing optional fields are always allowed — this module never requires a field to be filled,
only that *filled* values are structurally valid.
"""

from __future__ import annotations

from typing import Any

from app.modules.capital_ownership import decimal_math as dm
from app.modules.capital_ownership.constants import (
    ACQUISITION_MODE_VALUES,
    BENEFICIAL_INTEREST_NATURE_VALUES,
    CAPITAL_AMOUNT_UNIT_VALUES,
    CAPITAL_EVENT_TYPE_VALUES,
    CONSIDERATION_TYPE_VALUES,
    CONTRIBUTION_ACQUISITION_MODE_VALUES,
    CONTROL_ARRANGEMENT_TYPE_VALUES,
    DEMAT_STATUS_VALUES,
    DEPOSITORY_CONNECTIVITY_VALUES,
    ENCUMBRANCE_TYPE_VALUES,
    EQUITY_CLASS_TYPE_VALUES,
    HOLDER_TYPE_VALUES,
    IDENTIFIER_TYPE_VALUES,
    INSTRUMENT_HOLDER_CATEGORY_VALUES,
    LOCK_IN_PERIOD_VALUES,
    OUTSTANDING_INSTRUMENT_TYPE_VALUES,
    PREFERENCE_CLASS_TYPE_VALUES,
    PROMOTER_GROUP_BASIS_VALUES,
    PROMOTER_GROUP_RELATIONSHIP_VALUES,
    PROMOTER_STATUS_BASIS_VALUES,
    PROMOTER_TYPE_VALUES,
    RESIDENTIAL_STATUS_VALUES,
    RESOLUTION_TYPE_VALUES,
    SECURITY_TYPE_VALUES,
    SHAREHOLDER_CATEGORY_VALUES,
    TRANSACTION_TYPE_VALUES,
    YES_NO_NOT_SURE,
)


class ValidationError(Exception):
    def __init__(self, field_errors: dict[str, str]) -> None:
        self.field_errors = field_errors
        super().__init__("validation failed")


# --------------------------------------------------------------------------- #
# Generic helpers                                                             #
# --------------------------------------------------------------------------- #


def _require_enum(errors: dict[str, str], field: str, value: Any, allowed: frozenset[str]) -> None:
    if value is None:
        errors[field] = "Invalid value."
        return
    text = str(value)
    if text not in allowed:
        errors[field] = "Select a valid option."


def _ynns(errors: dict[str, str], field: str, value: Any) -> None:
    _require_enum(errors, field, value if value is not None else "", YES_NO_NOT_SURE)


def _optional_decimal(
    errors: dict[str, str],
    field: str,
    value: Any,
    *,
    allow_negative: bool = False,
) -> None:
    if value is None or value == "":
        return
    if not dm.is_filled(value):
        errors[field] = "Enter a valid number."
        return
    if not allow_negative and dm.is_negative(value):
        errors[field] = "Value cannot be negative."


def _optional_bool(errors: dict[str, str], field: str, value: Any) -> None:
    if value is None:
        return
    if not isinstance(value, bool):
        errors[field] = "Must be true or false."


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


def _ids_of(items: list[Any] | None) -> set[str]:
    return {str(item.get("id")) for item in (items or []) if isinstance(item, dict) and item.get("id")}


def _optional_ref(
    errors: dict[str, str],
    field: str,
    value: Any,
    valid_ids: set[str],
) -> None:
    ref = str(value or "").strip()
    if not ref:
        return
    if ref not in valid_ids:
        errors[field] = "References a record that does not exist."


def _removed_ids(old_items: list[Any] | None, new_items: list[Any] | None) -> set[str]:
    return _ids_of(old_items) - _ids_of(new_items)


def _reject_if_referenced(
    errors: dict[str, str],
    field: str,
    removed_ids: set[str],
    dependents: list[tuple[list[Any] | None, str]],
    *,
    label: str,
) -> None:
    """`dependents` is a list of (collection, ref_field_name) pairs to scan for references."""
    if not removed_ids:
        return
    referenced: set[str] = set()
    for collection, ref_field in dependents:
        for item in collection or []:
            if not isinstance(item, dict):
                continue
            ref = str(item.get(ref_field) or "").strip()
            if ref in removed_ids:
                referenced.add(ref)
    if referenced:
        errors[field] = (
            f"Cannot remove {label} still referenced elsewhere in the payload "
            f"(ids: {', '.join(sorted(referenced))})."
        )


# --------------------------------------------------------------------------- #
# 1. Current capital structure                                                #
# --------------------------------------------------------------------------- #

_EQUITY_DECIMAL_FIELDS = (
    "faceValuePerShare",
    "votingRightsPerShare",
    "authorisedShares",
    "issuedShares",
    "subscribedShares",
    "paidUpShares",
    "partlyPaidShares",
    "amountPaidUpPerPartlyPaidShare",
    "sharePremiumBalance",
    "callsUnpaidAmount",
    "sharesForfeited",
    "sharesInDematerialisedForm",
)

_PREFERENCE_DECIMAL_FIELDS = (
    "faceValuePerShare",
    "authorisedShares",
    "issuedShares",
    "paidUpShares",
    "dividendRatePercentage",
    "potentialEquitySharesOnConversion",
    "redemptionAmount",
)


def validate_current_capital_structure_draft(
    data: dict[str, Any], full_payload: dict[str, Any]
) -> None:
    errors: dict[str, str] = {}

    unit = data.get("amountDisplayUnit") or "rupees"
    if unit not in CAPITAL_AMOUNT_UNIT_VALUES:
        errors["amountDisplayUnit"] = "Select rupees, lakh or crore."

    _ynns(errors, "hasPreferenceShares", data.get("hasPreferenceShares", ""))
    for field in (
        "shareCapitalMatchesMcaRecords",
        "allSharesFullyPaidUp",
        "partlyPaidSharesOutstanding",
        "hasCallsInArrears",
        "hasForfeitedShares",
        "hasCapitalReduction",
        "sharesWithDifferentialVotingRightsExist",
        "capitalAlterationCurrentlyPending",
        "authorisedCapitalSufficientForProposedIssue",
    ):
        _ynns(errors, field, data.get(field, ""))

    _require_enum(
        errors,
        "depositoryConnectivity",
        data.get("depositoryConnectivity", ""),
        DEPOSITORY_CONNECTIVITY_VALUES,
    )
    _require_enum(
        errors, "dematStatusOverall", data.get("dematStatusOverall", ""), DEMAT_STATUS_VALUES
    )

    for field in (
        "authorisedEquityShareCapital",
        "authorisedPreferenceShareCapital",
        "totalAuthorisedShareCapitalAsPerMoa",
        "issuedEquityShareCapital",
        "subscribedEquityShareCapital",
        "paidUpEquityShareCapital",
        "paidUpPreferenceShareCapital",
        "paidUpCapitalAsPerLatestAuditedFinancials",
        "authorisedCapitalIncreaseRequiredAmount",
    ):
        _optional_decimal(errors, field, data.get(field))

    equity_classes = data.get("equityClasses")
    _check_unique_ids(errors, "equityClasses", equity_classes or [])
    for index, item in enumerate(equity_classes or []):
        if not isinstance(item, dict):
            continue
        prefix = f"equityClasses[{index}]"
        _require_enum(errors, f"{prefix}.classType", item.get("classType", ""), EQUITY_CLASS_TYPE_VALUES)
        _require_enum(errors, f"{prefix}.dematStatus", item.get("dematStatus", ""), DEMAT_STATUS_VALUES)
        for field in _EQUITY_DECIMAL_FIELDS:
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    preference_classes = data.get("preferenceClasses")
    _check_unique_ids(errors, "preferenceClasses", preference_classes or [])
    for index, item in enumerate(preference_classes or []):
        if not isinstance(item, dict):
            continue
        prefix = f"preferenceClasses[{index}]"
        _require_enum(
            errors, f"{prefix}.classType", item.get("classType", ""), PREFERENCE_CLASS_TYPE_VALUES
        )
        for field in ("isCumulative", "isParticipating", "isConvertible", "isRedeemable", "carriesVotingRights"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        for field in _PREFERENCE_DECIMAL_FIELDS:
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    # Deleting an equity class still referenced by a shareholder is rejected.
    old_classes = (full_payload.get("currentCapitalStructure") or {}).get("equityClasses") or []
    removed_class_ids = _removed_ids(old_classes, equity_classes)
    shareholders = (full_payload.get("shareholdersAndBeneficialOwnership") or {}).get(
        "shareholders"
    ) or []
    _reject_if_referenced(
        errors,
        "equityClasses",
        removed_class_ids,
        [(shareholders, "equityClassId")],
        label="an equity class",
    )

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 2. Share capital history                                                    #
# --------------------------------------------------------------------------- #

_CAPITAL_EVENT_DECIMAL_FIELDS = (
    "numberOfShares",
    "faceValuePerShare",
    "issuePricePerShare",
    "premiumPerShare",
    "totalConsiderationAmount",
    "splitOrConsolidationRatioFrom",
    "splitOrConsolidationRatioTo",
    "preEventFaceValuePerShare",
    "postEventFaceValuePerShare",
    "numberOfAllottees",
    "promoterSharesInEvent",
)


def validate_share_capital_history_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "historyCoversPeriodSinceIncorporation",
        "allHistoricalAllotmentsDocumented",
        "historyReconciledWithMcaFilings",
        "historyReconciledWithRegisterOfMembers",
        "bonusIssueInLastTwelveMonths",
        "bonusIssueOutOfRevaluationReserves",
        "sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths",
        "sharesIssuedAtDifferentPricesInLastTwelveMonths",
        "anyPendingAllotments",
    ):
        _ynns(errors, field, data.get(field, ""))

    _optional_decimal(errors, "shareApplicationMoneyPendingAllotment", data.get("shareApplicationMoneyPendingAllotment"))

    events = data.get("capitalEvents")
    _check_unique_ids(errors, "capitalEvents", events or [])
    for index, event in enumerate(events or []):
        if not isinstance(event, dict):
            continue
        prefix = f"capitalEvents[{index}]"
        _require_enum(errors, f"{prefix}.eventType", event.get("eventType", ""), CAPITAL_EVENT_TYPE_VALUES)
        _require_enum(
            errors, f"{prefix}.securityType", event.get("securityType", ""), SECURITY_TYPE_VALUES
        )
        _require_enum(
            errors,
            f"{prefix}.considerationType",
            event.get("considerationType", ""),
            CONSIDERATION_TYPE_VALUES,
        )
        _require_enum(
            errors, f"{prefix}.resolutionType", event.get("resolutionType", ""), RESOLUTION_TYPE_VALUES
        )
        for field in ("includesPromoterAllotment", "isRelatedPartyAllotment", "rocFilingCompleted", "valuationReportObtained"):
            _ynns(errors, f"{prefix}.{field}", event.get(field, ""))
        for field in _CAPITAL_EVENT_DECIMAL_FIELDS:
            _optional_decimal(errors, f"{prefix}.{field}", event.get(field))

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 3. Shareholders & beneficial ownership                                      #
# --------------------------------------------------------------------------- #


def validate_shareholders_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "registerOfMembersMaintained",
        "registerOfMembersUpToDate",
        "shareholdingReconciledWithRegisterOfMembers",
        "significantBeneficialOwnerDeterminationCompleted",
        "nomineeShareholdersExist",
        "foreignShareholdingExists",
        "foreignDirectInvestmentComplianceConfirmed",
        "formFcGprFilingsCompleted",
        "sectoralCapComplianceConfirmed",
        "anyShareholderAgreementsWithInvestors",
    ):
        _ynns(errors, field, data.get(field, ""))

    _optional_decimal(errors, "totalNumberOfShareholders", data.get("totalNumberOfShareholders"))

    equity_class_ids = _ids_of(
        (full_payload.get("currentCapitalStructure") or {}).get("equityClasses")
    )

    shareholders = data.get("shareholders")
    _check_unique_ids(errors, "shareholders", shareholders or [])
    for index, item in enumerate(shareholders or []):
        if not isinstance(item, dict):
            continue
        prefix = f"shareholders[{index}]"
        _require_enum(errors, f"{prefix}.holderType", item.get("holderType", ""), HOLDER_TYPE_VALUES)
        _require_enum(
            errors, f"{prefix}.category", item.get("category", ""), SHAREHOLDER_CATEGORY_VALUES
        )
        _require_enum(
            errors,
            f"{prefix}.residentialStatus",
            item.get("residentialStatus", ""),
            RESIDENTIAL_STATUS_VALUES,
        )
        _require_enum(
            errors, f"{prefix}.identifierType", item.get("identifierType", ""), IDENTIFIER_TYPE_VALUES
        )
        _require_enum(
            errors,
            f"{prefix}.modeOfAcquisition",
            item.get("modeOfAcquisition", ""),
            ACQUISITION_MODE_VALUES,
        )
        for field in (
            "votingRightsDifferFromShareholding",
            "isPartOfPromoterGroup",
            "beneficialOwnerIsDifferent",
            "isSellingShareholderInOffer",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        for field in (
            "equitySharesHeld",
            "preferenceSharesHeld",
            "sharesInDematerialisedForm",
            "sharesInPhysicalForm",
            "averageCostOfAcquisitionPerShare",
            "votingRightsPercentageIfDifferent",
            "sharesEncumbered",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))
        _optional_ref(errors, f"{prefix}.equityClassId", item.get("equityClassId"), equity_class_ids)

    beneficial_owners = data.get("beneficialOwners")
    _check_unique_ids(errors, "beneficialOwners", beneficial_owners or [])
    shareholder_ids_in_section = _ids_of(shareholders)
    for index, item in enumerate(beneficial_owners or []):
        if not isinstance(item, dict):
            continue
        prefix = f"beneficialOwners[{index}]"
        _require_enum(
            errors, f"{prefix}.identifierType", item.get("identifierType", ""), IDENTIFIER_TYPE_VALUES
        )
        _require_enum(
            errors,
            f"{prefix}.residentialStatus",
            item.get("residentialStatus", ""),
            RESIDENTIAL_STATUS_VALUES,
        )
        _require_enum(
            errors,
            f"{prefix}.natureOfInterest",
            item.get("natureOfInterest", ""),
            BENEFICIAL_INTEREST_NATURE_VALUES,
        )
        for field in (
            "isSignificantBeneficialOwner",
            "declarationInFormBen1Received",
            "formBen2Filed",
            "registerInFormBen3Maintained",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        for field in ("directHoldingPercentage", "indirectHoldingPercentage"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))
        _optional_ref(
            errors,
            f"{prefix}.linkedShareholderId",
            item.get("linkedShareholderId"),
            shareholder_ids_in_section,
        )

    # Deleting a shareholder still referenced elsewhere is rejected.
    old_shareholders = (full_payload.get("shareholdersAndBeneficialOwnership") or {}).get(
        "shareholders"
    ) or []
    removed_shareholder_ids = _removed_ids(old_shareholders, shareholders)
    dependents = [
        ((full_payload.get("promotersAndControl") or {}).get("promoters"), "linkedShareholderId"),
        (
            (full_payload.get("promotersAndControl") or {}).get("promoterGroupMembers"),
            "linkedShareholderId",
        ),
        (
            (full_payload.get("preAndPostIssueOwnership") or {}).get("shareholderOverlays"),
            "shareholderId",
        ),
        (
            (full_payload.get("promoterContributionLockInAndEncumbrances") or {}).get(
                "contributionLots"
            ),
            "shareholderId",
        ),
        (
            (full_payload.get("promoterContributionLockInAndEncumbrances") or {}).get(
                "encumbrances"
            ),
            "shareholderId",
        ),
    ]
    _reject_if_referenced(
        errors, "shareholders", removed_shareholder_ids, dependents, label="a shareholder"
    )

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 4. Promoters & control                                                      #
# --------------------------------------------------------------------------- #


def validate_promoters_and_control_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    _ynns(errors, "companyHasIdentifiedPromoter", data.get("companyHasIdentifiedPromoter", ""))
    for field in (
        "promoterIdentificationComplete",
        "promoterGroupIdentificationComplete",
        "anyPersonExercisingControlWithoutShareholding",
        "changeInControlInLastThreeYears",
        "anyPromoterIsBodyCorporate",
        "promoterBodyCorporateOwnershipDisclosed",
        "anyPromoterClassifiedAsWilfulDefaulter",
        "professionalConfirmationOnPromoterIdentification",
    ):
        _ynns(errors, field, data.get(field, ""))

    shareholder_ids = _ids_of(
        (full_payload.get("shareholdersAndBeneficialOwnership") or {}).get("shareholders")
    )

    promoters = data.get("promoters")
    _check_unique_ids(errors, "promoters", promoters or [])
    for index, item in enumerate(promoters or []):
        if not isinstance(item, dict):
            continue
        prefix = f"promoters[{index}]"
        _require_enum(errors, f"{prefix}.promoterType", item.get("promoterType", ""), PROMOTER_TYPE_VALUES)
        _require_enum(
            errors, f"{prefix}.identifierType", item.get("identifierType", ""), IDENTIFIER_TYPE_VALUES
        )
        _require_enum(
            errors,
            f"{prefix}.residentialStatus",
            item.get("residentialStatus", ""),
            RESIDENTIAL_STATUS_VALUES,
        )
        _require_enum(
            errors,
            f"{prefix}.basisOfPromoterStatus",
            item.get("basisOfPromoterStatus", ""),
            PROMOTER_STATUS_BASIS_VALUES,
        )
        for field in ("isAlsoDirector", "isPartOfPromoterSellingInOffer"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        _optional_decimal(errors, f"{prefix}.equitySharesHeld", item.get("equitySharesHeld"))
        _optional_ref(
            errors, f"{prefix}.linkedShareholderId", item.get("linkedShareholderId"), shareholder_ids
        )

    promoter_ids_in_section = _ids_of(promoters)

    group_members = data.get("promoterGroupMembers")
    _check_unique_ids(errors, "promoterGroupMembers", group_members or [])
    for index, item in enumerate(group_members or []):
        if not isinstance(item, dict):
            continue
        prefix = f"promoterGroupMembers[{index}]"
        _require_enum(errors, f"{prefix}.memberType", item.get("memberType", ""), PROMOTER_TYPE_VALUES)
        _require_enum(
            errors,
            f"{prefix}.relationshipToPromoter",
            item.get("relationshipToPromoter", ""),
            PROMOTER_GROUP_RELATIONSHIP_VALUES,
        )
        _require_enum(
            errors, f"{prefix}.inclusionBasis", item.get("inclusionBasis", ""), PROMOTER_GROUP_BASIS_VALUES
        )
        _require_enum(
            errors, f"{prefix}.identifierType", item.get("identifierType", ""), IDENTIFIER_TYPE_VALUES
        )
        _ynns(errors, f"{prefix}.isShareholder", item.get("isShareholder", ""))
        _optional_decimal(errors, f"{prefix}.equitySharesHeld", item.get("equitySharesHeld"))
        _optional_ref(
            errors, f"{prefix}.relatedPromoterId", item.get("relatedPromoterId"), promoter_ids_in_section
        )
        _optional_ref(
            errors, f"{prefix}.linkedShareholderId", item.get("linkedShareholderId"), shareholder_ids
        )

    arrangements = data.get("controlArrangements")
    _check_unique_ids(errors, "controlArrangements", arrangements or [])
    for index, item in enumerate(arrangements or []):
        if not isinstance(item, dict):
            continue
        prefix = f"controlArrangements[{index}]"
        _require_enum(
            errors,
            f"{prefix}.arrangementType",
            item.get("arrangementType", ""),
            CONTROL_ARRANGEMENT_TYPE_VALUES,
        )
        for field in (
            "conferControlOverIssuer",
            "survivesPostListing",
            "terminationOnListingAgreed",
            "amendmentRequiredBeforeFiling",
            "disclosedInOfferDocument",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))

    # Deleting a promoter still referenced by a contribution lot is rejected.
    old_promoters = (full_payload.get("promotersAndControl") or {}).get("promoters") or []
    removed_promoter_ids = _removed_ids(old_promoters, promoters)
    _reject_if_referenced(
        errors,
        "promoters",
        removed_promoter_ids,
        [
            (
                (full_payload.get("promoterContributionLockInAndEncumbrances") or {}).get(
                    "contributionLots"
                ),
                "promoterId",
            ),
        ],
        label="a promoter",
    )

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 5. Pre & post issue ownership                                               #
# --------------------------------------------------------------------------- #


def validate_pre_post_issue_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "preIssueCapitalConfirmedWithLeadManager",
        "sellingShareholderConsentsObtained",
        "sellingShareholderEligibilityConfirmed",
        "offerForSaleSharesHeldForRequiredPeriod",
        "anyExpectedPreIssueTransfers",
    ):
        _ynns(errors, field, data.get(field, ""))

    for field in (
        "freshIssueSharesOverride",
        "expectedPreIpoPlacementShares",
        "expectedConversionSharesBeforeIssue",
        "expectedEsopAllotmentSharesBeforeIssue",
    ):
        _optional_decimal(errors, field, data.get(field))

    shareholder_ids = _ids_of(
        (full_payload.get("shareholdersAndBeneficialOwnership") or {}).get("shareholders")
    )

    overlays = data.get("shareholderOverlays")
    _check_unique_ids(errors, "shareholderOverlays", overlays or [])
    for index, item in enumerate(overlays or []):
        if not isinstance(item, dict):
            continue
        prefix = f"shareholderOverlays[{index}]"
        _optional_ref(errors, f"{prefix}.shareholderId", item.get("shareholderId"), shareholder_ids)
        for field in ("sharesOfferedForSale", "otherExpectedPreIssueTransfer"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 6. Promoter contribution, lock-in & encumbrances                            #
# --------------------------------------------------------------------------- #


def validate_promoter_contribution_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "minimumPromoterContributionApplicable",
        "exemptionFromMinimumContributionClaimed",
        "contributionBroughtInBeforeIssueOpening",
        "sharesIneligibleForContributionExist",
        "entirePreIssueCapitalLockInUnderstood",
        "anyEncumbranceOnPromoterShares",
        "encumbranceReleaseBeforeLockInConfirmed",
        "lockInSharesToBeHeldInDematerialisedForm",
        "lockInComplianceProfessionallyConfirmed",
    ):
        _ynns(errors, field, data.get(field, ""))

    for field in (
        "targetMinimumContributionPercentage",
        "proposedMinimumContributionShares",
        "preIssueCapitalExemptFromLockInShares",
    ):
        _optional_decimal(errors, field, data.get(field))

    promoter_ids = _ids_of((full_payload.get("promotersAndControl") or {}).get("promoters"))
    shareholder_ids = _ids_of(
        (full_payload.get("shareholdersAndBeneficialOwnership") or {}).get("shareholders")
    )

    lots = data.get("contributionLots")
    _check_unique_ids(errors, "contributionLots", lots or [])
    for index, item in enumerate(lots or []):
        if not isinstance(item, dict):
            continue
        prefix = f"contributionLots[{index}]"
        _require_enum(
            errors,
            f"{prefix}.modeOfAcquisition",
            item.get("modeOfAcquisition", ""),
            CONTRIBUTION_ACQUISITION_MODE_VALUES,
        )
        _require_enum(
            errors, f"{prefix}.considerationType", item.get("considerationType", ""), CONSIDERATION_TYPE_VALUES
        )
        _require_enum(
            errors, f"{prefix}.proposedLockInPeriod", item.get("proposedLockInPeriod", ""), LOCK_IN_PERIOD_VALUES
        )
        for field in ("fullyPaidUp", "dematerialised", "eligibleForMinimumPromoterContribution", "isEncumbered"):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        for field in ("numberOfShares", "faceValuePerShare", "acquisitionPricePerShare"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))
        _optional_ref(errors, f"{prefix}.promoterId", item.get("promoterId"), promoter_ids)
        _optional_ref(errors, f"{prefix}.shareholderId", item.get("shareholderId"), shareholder_ids)

    encumbrances = data.get("encumbrances")
    _check_unique_ids(errors, "encumbrances", encumbrances or [])
    for index, item in enumerate(encumbrances or []):
        if not isinstance(item, dict):
            continue
        prefix = f"encumbrances[{index}]"
        _require_enum(
            errors, f"{prefix}.holderCategory", item.get("holderCategory", ""), SHAREHOLDER_CATEGORY_VALUES
        )
        _require_enum(
            errors, f"{prefix}.encumbranceType", item.get("encumbranceType", ""), ENCUMBRANCE_TYPE_VALUES
        )
        for field in (
            "willBeReleasedBeforeFiling",
            "affectsPromoterContributionShares",
            "disclosedToStockExchangeOrDepository",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        _optional_decimal(errors, f"{prefix}.numberOfSharesEncumbered", item.get("numberOfSharesEncumbered"))
        _optional_ref(errors, f"{prefix}.shareholderId", item.get("shareholderId"), shareholder_ids)

    if errors:
        raise ValidationError(errors)


# --------------------------------------------------------------------------- #
# 7. Outstanding securities, transactions & confirmations                     #
# --------------------------------------------------------------------------- #


def validate_outstanding_securities_draft(data: dict[str, Any], full_payload: dict[str, Any]) -> None:
    errors: dict[str, str] = {}

    for field in (
        "anyOutstandingConvertibleInstruments",
        "allConvertiblesToBeSettledBeforeFiling",
        "anyTransactionsInLastEighteenMonths",
        "weightedAverageCostDisclosureRequired",
        "allSharesDematerialisedBeforeFiling",
        "anyPendingShareTransfers",
        "anyDisputesOverTitleToShares",
    ):
        _ynns(errors, field, data.get(field, ""))

    instruments = data.get("outstandingInstruments")
    _check_unique_ids(errors, "outstandingInstruments", instruments or [])
    for index, item in enumerate(instruments or []):
        if not isinstance(item, dict):
            continue
        prefix = f"outstandingInstruments[{index}]"
        _require_enum(
            errors,
            f"{prefix}.instrumentType",
            item.get("instrumentType", ""),
            OUTSTANDING_INSTRUMENT_TYPE_VALUES,
        )
        _require_enum(
            errors,
            f"{prefix}.holderCategory",
            item.get("holderCategory", ""),
            INSTRUMENT_HOLDER_CATEGORY_VALUES,
        )
        for field in (
            "willConvertOrLapseBeforeFiling",
            "shareholderApprovalObtained",
            "compliantWithShareBasedBenefitRegulations",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        for field in (
            "numberOfInstrumentsOutstanding",
            "potentialEquitySharesOnConversion",
            "conversionOrExercisePricePerShare",
            "vestedInstrumentsOutstanding",
            "unvestedInstrumentsOutstanding",
            "numberOfHolders",
        ):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    transactions = data.get("recentTransactions")
    _check_unique_ids(errors, "recentTransactions", transactions or [])
    for index, item in enumerate(transactions or []):
        if not isinstance(item, dict):
            continue
        prefix = f"recentTransactions[{index}]"
        _require_enum(
            errors, f"{prefix}.transactionType", item.get("transactionType", ""), TRANSACTION_TYPE_VALUES
        )
        _require_enum(
            errors,
            f"{prefix}.transferorCategory",
            item.get("transferorCategory", ""),
            SHAREHOLDER_CATEGORY_VALUES,
        )
        _require_enum(
            errors,
            f"{prefix}.transfereeCategory",
            item.get("transfereeCategory", ""),
            SHAREHOLDER_CATEGORY_VALUES,
        )
        _require_enum(
            errors, f"{prefix}.considerationType", item.get("considerationType", ""), CONSIDERATION_TYPE_VALUES
        )
        for field in (
            "involvesPromoterOrPromoterGroup",
            "isRelatedPartyTransaction",
            "formSh4OrTransferDeedAvailable",
            "disclosedInOfferDocument",
        ):
            _ynns(errors, f"{prefix}.{field}", item.get(field, ""))
        for field in ("numberOfShares", "pricePerShare", "totalConsideration"):
            _optional_decimal(errors, f"{prefix}.{field}", item.get(field))

    confirmations = data.get("confirmations")
    if confirmations is not None:
        if not isinstance(confirmations, dict):
            errors["confirmations"] = "Must be an object of true/false values."
        else:
            for key, value in confirmations.items():
                _optional_bool(errors, f"confirmations.{key}", value)

    if errors:
        raise ValidationError(errors)


VALIDATORS = {
    "current-capital-structure": validate_current_capital_structure_draft,
    "share-capital-history": validate_share_capital_history_draft,
    "shareholders-beneficial-ownership": validate_shareholders_draft,
    "promoters-and-control": validate_promoters_and_control_draft,
    "pre-post-issue-ownership": validate_pre_post_issue_draft,
    "promoter-contribution-lock-in": validate_promoter_contribution_draft,
    "outstanding-securities-confirmations": validate_outstanding_securities_draft,
}
