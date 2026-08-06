"""Unit tests for Business & Operations compute, progress, assessment and validation."""

from app.modules.business_operations import decimal_math as dm
from app.modules.business_operations.assessment import assess_business_operations
from app.modules.business_operations.compute import compute_business_operations_model
from app.modules.business_operations.defaults import (
    clone_empty_payload,
    create_empty_business_unit,
    create_empty_capacity_record,
    create_empty_competitive_strength,
    create_empty_facility,
    create_empty_revenue_mix_row,
    create_empty_strategy_item,
)
from app.modules.business_operations.progress import calculate_progress
from app.modules.business_operations.validation import (
    ValidationError,
    validate_business_profile_draft,
    validate_facilities_capacity_draft,
    validate_products_revenue_draft,
)

# --------------------------------------------------------------------------- #
# Progress                                                                    #
# --------------------------------------------------------------------------- #


def test_empty_payload_progress_is_not_started() -> None:
    payload = clone_empty_payload()
    progress = calculate_progress(payload)
    assert progress["overallStatus"] == "not_started"
    assert progress["sectionsComplete"] == 0
    assert progress["totalSections"] == 8
    for status in progress["sections"].values():
        assert status == "not_started"


def test_unanswered_ternary_is_not_treated_as_no() -> None:
    payload = clone_empty_payload()
    payload["businessProfileAndOperatingModel"]["domesticOperations"] = ""
    progress = calculate_progress(payload)
    assert progress["sections"]["business-profile-operating-model"] in (
        "not_started",
        "in_progress",
    )


# --------------------------------------------------------------------------- #
# Compute: revenue mix reconciliation                                        #
# --------------------------------------------------------------------------- #


def test_revenue_mix_percentages_reconcile_when_summing_to_100() -> None:
    payload = clone_empty_payload()
    payload["productsServicesAndRevenueMix"]["revenueMixRows"] = [
        {
            **create_empty_revenue_mix_row(),
            "financialYear": "FY24",
            "revenue": "600000",
            "percentageOfRevenueFromOperations": "60",
        },
        {
            **create_empty_revenue_mix_row(),
            "financialYear": "FY24",
            "revenue": "400000",
            "percentageOfRevenueFromOperations": "40",
        },
    ]
    model = compute_business_operations_model(payload)
    assert model["revenuePercentagesReconcile"] is True
    check = next(c for c in model["reconciliation"] if c["id"] == "revenue-mix-reconcile")
    assert check["status"] == "reconciled"


def test_revenue_mix_percentages_flagged_when_not_reconciling() -> None:
    payload = clone_empty_payload()
    payload["productsServicesAndRevenueMix"]["revenueMixRows"] = [
        {
            **create_empty_revenue_mix_row(),
            "financialYear": "FY24",
            "revenue": "600000",
            "percentageOfRevenueFromOperations": "60",
        },
        {
            **create_empty_revenue_mix_row(),
            "financialYear": "FY24",
            "revenue": "300000",
            "percentageOfRevenueFromOperations": "30",
        },
    ]
    model = compute_business_operations_model(payload)
    assert model["revenuePercentagesReconcile"] is False
    check = next(c for c in model["reconciliation"] if c["id"] == "revenue-mix-reconcile")
    assert check["status"] == "variance"


# --------------------------------------------------------------------------- #
# Compute: capacity utilisation                                              #
# --------------------------------------------------------------------------- #


def test_capacity_utilisation_computed_from_output_over_available() -> None:
    payload = clone_empty_payload()
    facility_id = "fac-1"
    payload["facilitiesCapacityAndOperationalProcess"]["facilities"] = [
        {**create_empty_facility(), "id": facility_id, "name": "Plant 1"}
    ]
    payload["facilitiesCapacityAndOperationalProcess"]["capacityRecords"] = [
        {
            **create_empty_capacity_record(),
            "facilityId": facility_id,
            "isCurrentPeriod": True,
            "installedCapacity": "1000",
            "availableCapacity": "800",
            "actualOutput": "600",
        }
    ]
    model = compute_business_operations_model(payload)
    row = model["capacityUtilisation"][0]
    assert row["utilisationPercentage"] == "75"
    assert row["exceeds100"] is False


def test_capacity_utilisation_above_100_is_flagged_without_explanation() -> None:
    payload = clone_empty_payload()
    facility_id = "fac-1"
    payload["facilitiesCapacityAndOperationalProcess"]["facilities"] = [
        {**create_empty_facility(), "id": facility_id, "name": "Plant 1"}
    ]
    payload["facilitiesCapacityAndOperationalProcess"]["capacityRecords"] = [
        {
            **create_empty_capacity_record(),
            "facilityId": facility_id,
            "isCurrentPeriod": True,
            "installedCapacity": "1000",
            "availableCapacity": "800",
            "actualOutput": "1200",
        }
    ]
    model = compute_business_operations_model(payload)
    row = model["capacityUtilisation"][0]
    assert row["utilisationPercentage"] == "100"
    assert row["exceeds100"] is True
    check = next(c for c in model["reconciliation"] if c["id"] == "capacity-utilisation")
    assert check["status"] == "variance"


# --------------------------------------------------------------------------- #
# Assessment                                                                  #
# --------------------------------------------------------------------------- #


def test_assessment_on_empty_payload_is_insufficient_information() -> None:
    payload = clone_empty_payload()
    assessment = assess_business_operations(payload, None)
    assert assessment["result"] == "insufficient_information"
    assert not any(item["state"] == "potential_inconsistency" for item in assessment["criteria"])


def test_assessment_strength_without_source_is_pending_supporting_source() -> None:
    payload = clone_empty_payload()
    payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]["competitiveStrengths"] = [
        {**create_empty_competitive_strength(), "title": "Strong brand", "supportingSource": ""}
    ]
    assessment = assess_business_operations(payload, None)
    criterion = next(
        item for item in assessment["criteria"] if item["id"] == "strength-supporting-source-pending"
    )
    assert criterion["state"] == "pending_supporting_source"


def test_assessment_strategy_with_unsupported_projections_is_reconciliation_variance() -> None:
    payload = clone_empty_payload()
    payload["competitiveStrengthsStrategyDependenciesAndConfirmations"]["strategies"] = [
        {**create_empty_strategy_item(), "title": "Expand capacity", "containsUnsupportedProjections": "yes"}
    ]
    model = compute_business_operations_model(payload)
    check = next(c for c in model["reconciliation"] if c["id"] == "strategy-projections")
    assert check["status"] == "variance"


def test_assessment_counts_include_all_seven_states() -> None:
    payload = clone_empty_payload()
    assessment = assess_business_operations(payload, None)
    expected_states = {
        "substantiated",
        "potential_inconsistency",
        "missing_information",
        "pending_linked_workstream",
        "pending_supporting_source",
        "pending_professional_confirmation",
        "not_applicable",
    }
    assert set(assessment["counts"].keys()) == expected_states
    for group in assessment["groups"]:
        assert set(group["counts"].keys()) == expected_states


# --------------------------------------------------------------------------- #
# Validation: unique ids, enums, cross-record references                     #
# --------------------------------------------------------------------------- #


def test_duplicate_business_unit_ids_are_rejected() -> None:
    payload = clone_empty_payload()
    data = payload["businessProfileAndOperatingModel"]
    data["businessUnits"] = [
        {"id": "dup", "unitName": "A", "status": ""},
        {"id": "dup", "unitName": "B", "status": ""},
    ]
    try:
        validate_business_profile_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert any("businessUnits" in key for key in exc.field_errors)


def test_invalid_enum_value_is_rejected() -> None:
    payload = clone_empty_payload()
    data = payload["businessProfileAndOperatingModel"]
    data["customerModel"] = "not-a-real-value"
    try:
        validate_business_profile_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert "customerModel" in exc.field_errors


def test_negative_decimal_is_rejected() -> None:
    payload = clone_empty_payload()
    data = payload["businessProfileAndOperatingModel"]
    data["businessUnits"] = [
        {**create_empty_business_unit(), "revenueContributionPercentage": "-5"}
    ]
    try:
        validate_business_profile_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert any("revenueContributionPercentage" in key for key in exc.field_errors)


def test_product_or_segment_ref_must_exist() -> None:
    payload = clone_empty_payload()
    data = payload["productsServicesAndRevenueMix"]
    data["revenueMixRows"] = [
        {**create_empty_revenue_mix_row(), "id": "row-1", "productOrSegmentId": "does-not-exist"}
    ]
    try:
        validate_products_revenue_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert any("productOrSegmentId" in key for key in exc.field_errors)


def test_facility_ref_must_exist_in_capacity_records() -> None:
    payload = clone_empty_payload()
    data = payload["facilitiesCapacityAndOperationalProcess"]
    data["capacityRecords"] = [
        {**create_empty_capacity_record(), "id": "cap-1", "facilityId": "does-not-exist"}
    ]
    try:
        validate_facilities_capacity_draft(data, payload)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert any("facilityId" in key for key in exc.field_errors)


def test_decimal_math_reexported_from_capital_ownership() -> None:
    assert dm.add("0.1", "0.2") == "0.3"
    assert dm.is_negative("-1") is True
