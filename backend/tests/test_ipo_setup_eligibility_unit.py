"""Unit tests for IPO Setup Decimal calculations, progress and assessment."""

from decimal import Decimal

from app.modules.ipo_setup_eligibility.assessment import assess_ipo_eligibility
from app.modules.ipo_setup_eligibility.defaults import clone_empty_payload
from app.modules.ipo_setup_eligibility.offer_compute import compute_offer_structure
from app.modules.ipo_setup_eligibility.progress import calculate_progress
from app.modules.ipo_setup_eligibility.validation import (
    ValidationError,
    validate_declarations_draft,
)


def test_ofs_does_not_increase_paid_up_capital() -> None:
    offer = clone_empty_payload()["offerStructure"]
    offer.update(
        {
            "faceValuePerEquityShare": 10,
            "existingIssuedEquityShares": 1_000_000,
            "existingPaidUpEquityShareCapital": 10_000_000,
            "proposedOfsShares": 250_000,
            "proposedOfsAmount": 25_000_000,
        }
    )
    computed = compute_offer_structure(offer, "offer-for-sale")
    decimals = computed["_decimals"]
    assert decimals["proposedPostIssueShares"] == Decimal("1000000")
    assert decimals["proposedPostIssuePaidUpCapital"] == Decimal("10000000")
    assert decimals["paidUpCapitalIncreaseFromOffer"] == Decimal("0")
    assert decimals["ofsPercentageOfOffer"] == Decimal("100")


def test_fresh_issue_increases_paid_up_with_decimal() -> None:
    offer = clone_empty_payload()["offerStructure"]
    offer.update(
        {
            "faceValuePerEquityShare": "10",
            "existingIssuedEquityShares": "1000000",
            "existingPaidUpEquityShareCapital": "10000000",
            "proposedFreshIssueShares": "200000",
            "proposedFreshIssueAmount": "20000000",
        }
    )
    computed = compute_offer_structure(offer, "fresh-issue")
    decimals = computed["_decimals"]
    assert decimals["proposedPostIssueShares"] == Decimal("1200000")
    assert decimals["proposedPostIssuePaidUpCapital"] == Decimal("12000000")
    assert decimals["paidUpCapitalIncreaseFromOffer"] == Decimal("2000000")


def test_empty_declarations_are_not_no() -> None:
    payload = clone_empty_payload()
    progress = calculate_progress(payload)
    assert progress["sections"]["eligibility-declarations"] == "not_started"
    assessment = assess_ipo_eligibility(payload)
    assert assessment["metrics"]["unresolvedAdverseDeclarations"] == 0
    assert assessment["result"] == "insufficient_information"
    assert not any(item["result"] == "eligible" for item in assessment["criteria"])


def test_yes_declaration_requires_details() -> None:
    data = clone_empty_payload()["eligibilityDeclarations"]
    data["admittedIbcAgainstIssuer"] = "yes"
    data["admittedIbcAgainstIssuerDetails"] = []
    try:
        validate_declarations_draft(data)
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert "admittedIbcAgainstIssuerDetails" in exc.field_errors


def test_adverse_yes_is_potential_concern() -> None:
    payload = clone_empty_payload()
    for key, details_key in (
        ("admittedIbcAgainstIssuer", "admittedIbcAgainstIssuerDetails"),
    ):
        payload["eligibilityDeclarations"][key] = "yes"
        payload["eligibilityDeclarations"][details_key] = [
            {
                "id": "d1",
                "personOrEntityInvolved": "Issuer",
                "authorityOrForum": "NCLT",
                "date": "2024-01-01",
                "currentStatus": "Pending",
                "explanation": "Test",
            }
        ]
    for key, _ in (
        ("admittedIbcAgainstPromotingCompany", None),
        ("admittedWindingUpPetition", None),
        ("issuerDebarredFromCapitalMarkets", None),
        ("promoterDirectorSellingShareholderDebarred", None),
        ("promoterDirectorAssociatedWithDebarredCompany", None),
        ("wilfulDefaulterOrFraudulentBorrower", None),
        ("fugitiveEconomicOffender", None),
        ("materialRegulatoryOrDisciplinaryAction", None),
        ("seriousCriminalProceedingsInvolvingDirector", None),
        ("materialFinancialDefaultDuringRelevantPeriod", None),
        ("materialUnresolvedEligibilityLitigation", None),
        ("proceedsIncludeRelatedPartyLoanRepayment", None),
    ):
        payload["eligibilityDeclarations"][key] = "no"

    assessment = assess_ipo_eligibility(payload)
    adverse = next(item for item in assessment["criteria"] if item["key"] == "adverse-declarations")
    assert adverse["result"] == "potential_concern"
    assert assessment["result"] == "eligibility_concerns_identified"


def test_three_financial_years_and_progress() -> None:
    payload = clone_empty_payload()
    payload["trackRecordAndFinancialEligibility"]["operatingTrackRecordBasis"] = "issuer-company"
    payload["trackRecordAndFinancialEligibility"]["threeCompleteFinancialYearsAvailable"] = "yes"
    payload["trackRecordAndFinancialEligibility"]["auditedRecordsAvailable"] = "yes"
    for index, year in enumerate(["2023", "2024", "2025"]):
        row = payload["trackRecordAndFinancialEligibility"]["financialYears"][index]
        row["financialYearEnding"] = year
        row["operatingProfitFromOperations"] = 15_000_000 if index < 2 else 500_000
        row["netWorth"] = 50_000_000
        row["freeCashFlowToEquity"] = 1_000_000 if index != 1 else -1
        row["auditedStatus"] = "audited"
        row["sourceType"] = "audited-financial-statements"

    progress = calculate_progress(payload)
    assert progress["sections"]["track-record-financial"] == "complete"
    assessment = assess_ipo_eligibility(payload)
    assert assessment["metrics"]["yearsMeetingOperatingProfitThreshold"] == 2
    assert assessment["metrics"]["yearsWithPositiveFcfe"] == 2
    assert assessment["metrics"]["positiveNetWorthAvailable"] is True
