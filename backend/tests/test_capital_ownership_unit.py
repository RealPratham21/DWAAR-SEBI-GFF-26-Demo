"""Unit tests for Capital & Ownership decimal math, compute, progress, assessment and validation."""

from decimal import Decimal

from app.modules.capital_ownership import decimal_math as dm
from app.modules.capital_ownership.assessment import assess_capital_ownership
from app.modules.capital_ownership.compute import (
    compute_capital_ownership_model,
    compute_current_capital_totals,
    compute_pre_post_issue,
    ipo_setup_reference_from_payload,
)
from app.modules.capital_ownership.defaults import (
    clone_empty_payload,
    create_empty_equity_share_class,
    create_empty_shareholder,
)
from app.modules.capital_ownership.progress import calculate_progress
from app.modules.capital_ownership.validation import (
    ValidationError,
    validate_current_capital_structure_draft,
    validate_shareholders_draft,
)

# --------------------------------------------------------------------------- #
# Decimal math                                                                #
# --------------------------------------------------------------------------- #


def test_decimal_add_sub_mul_are_exact_strings() -> None:
    assert dm.add("100000000000000000.10", "0.20") == "100000000000000000.3"
    assert dm.sub("10", "3") == "7"
    assert dm.mul("2.5", "4") == "10"


def test_decimal_blank_inputs_are_treated_as_empty() -> None:
    assert dm.add("", "") == ""
    assert dm.sum_decimals(["", "5", None]) == "5"
    assert dm.is_filled("") is False
    assert dm.is_filled("0") is True


def test_decimal_never_uses_float_rounding_artifacts() -> None:
    # A classic float trap: 0.1 + 0.2 != 0.3 in binary floating point.
    result = dm.add("0.1", "0.2")
    assert result == "0.3"
    assert Decimal(result) == Decimal("0.3")


def test_pct_and_negative_guard() -> None:
    assert dm.pct("25", "100", 2) == "25"
    assert dm.is_negative("-1") is True
    assert dm.is_negative("0") is False


# --------------------------------------------------------------------------- #
# Compute: capital totals                                                     #
# --------------------------------------------------------------------------- #


def test_current_capital_totals_sum_equity_classes() -> None:
    structure = clone_empty_payload()["currentCapitalStructure"]
    structure["equityClasses"] = [
        {**create_empty_equity_share_class(), "issuedShares": "1000000", "faceValuePerShare": "10", "paidUpShares": "1000000"},
        {**create_empty_equity_share_class(), "issuedShares": "500000", "faceValuePerShare": "10", "paidUpShares": "500000"},
    ]
    totals = compute_current_capital_totals(structure)
    assert totals["issuedEquityShares"] == "1500000"
    assert totals["paidUpEquityCapitalFromClasses"] == "15000000"


# --------------------------------------------------------------------------- #
# Compute: IPO Setup reference — numbers become strings                       #
# --------------------------------------------------------------------------- #


def test_ipo_setup_reference_converts_numbers_to_strings() -> None:
    ipo_payload = {
        "ipoDirection": {"proposedOfferType": "fresh-and-ofs"},
        "offerStructure": {
            "faceValuePerEquityShare": 10,
            "existingIssuedEquityShares": 1_000_000,
            "proposedFreshIssueShares": 200000,
            "proposedOfsShares": 100000,
        },
    }
    reference = ipo_setup_reference_from_payload(ipo_payload)
    assert reference["available"] is True
    assert reference["faceValuePerEquityShare"] == "10"
    assert reference["existingIssuedEquityShares"] == "1000000"
    assert reference["proposedFreshIssueShares"] == "200000"
    assert reference["proposedOfsShares"] == "100000"
    assert isinstance(reference["faceValuePerEquityShare"], str)


def test_ipo_setup_reference_unavailable_when_no_payload() -> None:
    reference = ipo_setup_reference_from_payload(None)
    assert reference["available"] is False
    assert reference["proposedFreshIssueShares"] == ""


# --------------------------------------------------------------------------- #
# Compute: OFS never increases capital; fresh issue does                      #
# --------------------------------------------------------------------------- #


def test_ofs_never_increases_post_issue_shares() -> None:
    shareholder = {
        **create_empty_shareholder(),
        "id": "sh-1",
        "category": "promoter",
        "equitySharesHeld": "1000000",
    }
    ipo_reference = ipo_setup_reference_from_payload(
        {
            "ipoDirection": {"proposedOfferType": "offer-for-sale"},
            "offerStructure": {
                "proposedOfsShares": 200000,
                "proposedFreshIssueShares": 0,
            },
        }
    )
    overlays = [
        {"id": "ov-1", "shareholderId": "sh-1", "sharesOfferedForSale": "200000", "otherExpectedPreIssueTransfer": ""}
    ]
    pre_post = compute_pre_post_issue(
        [shareholder],
        ipo_reference,
        overlays,
        pre_issue_total_equity_shares="1000000",
        additional_pre_issue_shares="0",
        fresh_issue_shares_override="",
    )
    assert pre_post["postIssueShares"] == "1000000"


def test_fresh_issue_increases_post_issue_shares() -> None:
    shareholder = {
        **create_empty_shareholder(),
        "id": "sh-1",
        "category": "promoter",
        "equitySharesHeld": "1000000",
    }
    ipo_reference = ipo_setup_reference_from_payload(
        {
            "ipoDirection": {"proposedOfferType": "fresh-issue"},
            "offerStructure": {
                "proposedFreshIssueShares": 200000,
                "proposedOfsShares": 0,
            },
        }
    )
    pre_post = compute_pre_post_issue(
        [shareholder],
        ipo_reference,
        [],
        pre_issue_total_equity_shares="1000000",
        additional_pre_issue_shares="0",
        fresh_issue_shares_override="",
    )
    assert pre_post["postIssueShares"] == "1200000"


def test_seller_ofs_exceeding_holding_is_flagged_not_clamped() -> None:
    shareholder = {
        **create_empty_shareholder(),
        "id": "sh-1",
        "category": "promoter",
        "equitySharesHeld": "100000",
    }
    ipo_reference = ipo_setup_reference_from_payload(
        {
            "ipoDirection": {"proposedOfferType": "offer-for-sale"},
            "offerStructure": {"proposedOfsShares": 150000, "proposedFreshIssueShares": 0},
        }
    )
    overlays = [
        {"id": "ov-1", "shareholderId": "sh-1", "sharesOfferedForSale": "150000", "otherExpectedPreIssueTransfer": ""}
    ]
    pre_post = compute_pre_post_issue(
        [shareholder],
        ipo_reference,
        overlays,
        pre_issue_total_equity_shares="100000",
        additional_pre_issue_shares="0",
        fresh_issue_shares_override="",
    )
    row = pre_post["rows"][0]
    assert row["offerExceedsHolding"] is True
    assert any(issue["code"] == "ofs_exceeds_holding" for issue in pre_post["issues"])


# --------------------------------------------------------------------------- #
# Progress                                                                    #
# --------------------------------------------------------------------------- #


def test_empty_payload_progress_is_not_started() -> None:
    payload = clone_empty_payload()
    progress = calculate_progress(payload)
    assert progress["overallStatus"] == "not_started"
    assert progress["sectionsComplete"] == 0
    for status in progress["sections"].values():
        assert status == "not_started"


def test_unanswered_ternary_is_not_treated_as_no() -> None:
    payload = clone_empty_payload()
    payload["currentCapitalStructure"]["shareCapitalMatchesMcaRecords"] = ""
    progress = calculate_progress(payload)
    # An unanswered question keeps the section from being "complete" but never fails outright.
    assert progress["sections"]["current-capital-structure"] in ("not_started", "in_progress")


# --------------------------------------------------------------------------- #
# Assessment                                                                  #
# --------------------------------------------------------------------------- #


def test_assessment_on_empty_payload_is_insufficient_information() -> None:
    payload = clone_empty_payload()
    ipo_reference = ipo_setup_reference_from_payload(None)
    assessment = assess_capital_ownership(payload, ipo_reference)
    assert assessment["result"] == "insufficient_information"
    assert not any(item["state"] == "potential_inconsistency" for item in assessment["criteria"])


def test_assessment_not_sure_maps_to_pending_professional_confirmation() -> None:
    payload = clone_empty_payload()
    payload["currentCapitalStructure"]["shareCapitalMatchesMcaRecords"] = "not_sure"
    ipo_reference = ipo_setup_reference_from_payload(None)
    assessment = assess_capital_ownership(payload, ipo_reference)
    mca_criterion = next(item for item in assessment["criteria"] if item["id"] == "mca-records-match")
    assert mca_criterion["state"] == "pending_professional_confirmation"


def test_assessment_pending_linked_workstream_when_ipo_not_available() -> None:
    payload = clone_empty_payload()
    ipo_reference = ipo_setup_reference_from_payload(None)
    assessment = assess_capital_ownership(payload, ipo_reference)
    linkage = next(item for item in assessment["criteria"] if item["id"] == "ipo-setup-linkage")
    assert linkage["state"] == "pending_linked_workstream"


def test_compute_capital_ownership_model_end_to_end() -> None:
    payload = clone_empty_payload()
    payload["currentCapitalStructure"]["equityClasses"] = [
        {**create_empty_equity_share_class(), "issuedShares": "1000000", "faceValuePerShare": "10", "paidUpShares": "1000000"}
    ]
    ipo_reference = ipo_setup_reference_from_payload(None)
    model = compute_capital_ownership_model(payload, ipo_reference)
    assert model["totals"]["currentEquityShares"] == "1000000"
    assert "reconciliation" in model


# --------------------------------------------------------------------------- #
# Validation: unique ids, enums, cross-record references                     #
# --------------------------------------------------------------------------- #


def test_duplicate_equity_class_ids_are_rejected() -> None:
    payload = clone_empty_payload()
    data = payload["currentCapitalStructure"]
    data["equityClasses"] = [
        {**create_empty_equity_share_class(), "id": "dup"},
        {**create_empty_equity_share_class(), "id": "dup"},
    ]
    try:
        validate_current_capital_structure_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert any("equityClasses" in key for key in exc.field_errors)


def test_invalid_enum_value_is_rejected() -> None:
    payload = clone_empty_payload()
    data = payload["currentCapitalStructure"]
    data["hasPreferenceShares"] = "maybe"
    try:
        validate_current_capital_structure_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert "hasPreferenceShares" in exc.field_errors


def test_negative_decimal_is_rejected() -> None:
    payload = clone_empty_payload()
    data = payload["currentCapitalStructure"]
    data["authorisedEquityShareCapital"] = "-100"
    try:
        validate_current_capital_structure_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert "authorisedEquityShareCapital" in exc.field_errors


def test_shareholder_equity_class_ref_must_exist() -> None:
    payload = clone_empty_payload()
    data = payload["shareholdersAndBeneficialOwnership"]
    data["shareholders"] = [
        {**create_empty_shareholder(), "id": "sh-1", "equityClassId": "does-not-exist"}
    ]
    try:
        validate_shareholders_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert any("equityClassId" in key for key in exc.field_errors)


def test_deleting_referenced_shareholder_is_rejected() -> None:
    payload = clone_empty_payload()
    payload["shareholdersAndBeneficialOwnership"]["shareholders"] = [
        {**create_empty_shareholder(), "id": "sh-1"}
    ]
    payload["promotersAndControl"]["promoters"] = [
        {
            "id": "p-1",
            "name": "Promoter One",
            "promoterType": "",
            "linkedShareholderId": "sh-1",
            "identifierType": "",
            "identifierValue": "",
            "directorIdentificationNumber": "",
            "nationality": "",
            "residentialStatus": "",
            "dateOfBecomingPromoter": "",
            "basisOfPromoterStatus": "",
            "basisExplanation": "",
            "equitySharesHeld": "",
            "isAlsoDirector": "",
            "designation": "",
            "relationshipWithOtherPromoters": "",
            "isPartOfPromoterSellingInOffer": "",
            "notes": "",
        }
    ]
    # Now try to save the shareholders section with sh-1 removed.
    new_shareholders_data = {**payload["shareholdersAndBeneficialOwnership"], "shareholders": []}
    try:
        validate_shareholders_draft(new_shareholders_data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert "shareholders" in exc.field_errors
        assert "sh-1" in exc.field_errors["shareholders"]
