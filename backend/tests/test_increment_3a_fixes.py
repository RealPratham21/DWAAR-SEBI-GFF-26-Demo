"""Increment 3A false-positive extraction/comparison fixes and summary endpoints."""

from __future__ import annotations

import uuid
from types import SimpleNamespace

from app.modules.company_incorporation.structured_extraction.comparison import (
    compare_assertion,
)
from app.modules.company_incorporation.structured_extraction.constants import ComparisonStatus
from app.modules.company_incorporation.structured_extraction.deterministic import (
    run_deterministic_extraction,
)
from app.modules.company_incorporation.structured_extraction.normalize import (
    is_ignored_document_noise,
    normalize_company_class,
    normalize_occupancy_type,
)
from app.modules.notifications.constants import (
    build_company_incorporation_facts_route,
    build_company_incorporation_questions_route,
)


def _page(*, text: str, blocks: list[dict]) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        page_number=1,
        extraction_method="native_text",
        average_ocr_confidence=None,
        text=text,
        text_blocks=blocks,
    )


def _block(order: int, text: str, *, x0: float, y0: float, x1: float, y1: float) -> dict:
    return {
        "block_id": str(uuid.uuid4()),
        "order_index": order,
        "type": "line",
        "text": text,
        "bbox": {"x0": x0, "y0": y0, "x1": x1, "y1": y1},
        "confidence": None,
    }


def test_occupancy_label_bleed_rejected_and_leased_extracted() -> None:
    page = _page(
        text="Occupancy Type\nLeased\nOccupancy Type",
        blocks=[
            _block(0, "Occupancy Type", x0=0.1, y0=0.2, x1=0.3, y1=0.22),
            _block(1, "Leased", x0=0.1, y0=0.23, x1=0.2, y1=0.25),
            _block(2, "Occupancy Type", x0=0.5, y0=0.4, x1=0.7, y1=0.42),
        ],
    )
    candidates = run_deterministic_extraction(
        "current-registered-office-filing",
        [page],
    )
    occupancy = [item for item in candidates if item.fact_key.endswith("occupancyType")]
    assert occupancy
    assert all(item.normalized_value == "leased" for item in occupancy)
    assert all(item.display_value != "type" for item in occupancy)


def test_occupancy_type_alone_does_not_create_value() -> None:
    page = _page(
        text="Occupancy Type",
        blocks=[_block(0, "Occupancy Type", x0=0.1, y0=0.2, x1=0.3, y1=0.22)],
    )
    candidates = run_deterministic_extraction("current-registered-office-filing", [page])
    assert not [item for item in candidates if item.fact_key.endswith("occupancyType")]


def test_synthetic_disclaimer_never_address() -> None:
    assert is_ignored_document_noise("SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE")
    page = _page(
        text=(
            "New registered office\n"
            "Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, Pune, Maharashtra 411026\n"
            "SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE\n"
            "Previous registered office\n"
            "Plot No. 9, Vertex Industrial Park, Chakan Industrial Area, Pune, Maharashtra 410501\n"
        ),
        blocks=[
            _block(0, "New registered office", x0=0.1, y0=0.2, x1=0.4, y1=0.22),
            _block(
                1,
                "Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, Pune, Maharashtra 411026",
                x0=0.1,
                y0=0.23,
                x1=0.8,
                y1=0.25,
            ),
            _block(
                2,
                "SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE",
                x0=0.1,
                y0=0.28,
                x1=0.9,
                y1=0.30,
            ),
            _block(3, "Previous registered office", x0=0.1, y0=0.34, x1=0.45, y1=0.36),
            _block(
                4,
                "Plot No. 9, Vertex Industrial Park, Chakan Industrial Area, Pune, Maharashtra 410501",
                x0=0.1,
                y0=0.37,
                x1=0.85,
                y1=0.39,
            ),
        ],
    )
    candidates = run_deterministic_extraction("current-registered-office-filing", [page])
    addresses = {
        item.fact_key: item
        for item in candidates
        if "Address" in item.fact_key or "address" in item.fact_key
    }
    for item in addresses.values():
        blob = str(item.display_value) + str(item.normalized_value)
        assert "SYNTHETIC" not in blob.upper()
    if "corporateHistory.officeChange.newAddress" in addresses:
        assert "411026" in str(
            addresses["corporateHistory.officeChange.newAddress"].normalized_value
        )
    if "corporateHistory.officeChange.previousAddress" in addresses:
        assert "410501" in str(
            addresses["corporateHistory.officeChange.previousAddress"].normalized_value
        )


def test_invalid_company_class_ocr_rejected() -> None:
    assert normalize_company_class("ms") == ""
    assert normalize_company_class("Private") == "private"
    page = _page(
        text="COMPANY CLASS\nms",
        blocks=[
            _block(0, "COMPANY CLASS", x0=0.5, y0=0.2, x1=0.7, y1=0.22),
            _block(1, "ms", x0=0.5, y0=0.23, x1=0.55, y1=0.25),
        ],
    )
    candidates = run_deterministic_extraction("original-certificate-of-incorporation", [page])
    assert not [item for item in candidates if item.fact_key == "identity.companyClass"]


def test_partial_address_match_not_hard_conflict() -> None:
    info_payload = {
        "registrations": [
            {
                "registrationType": "gstin",
                "addressOnRegistration": (
                    "Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, "
                    "Bhosari, Pune, Maharashtra, 411026, India"
                ),
            }
        ]
    }
    status, _hint = compare_assertion(
        "registrations.gstin.addressOnRegistration",
        {
            "fullAddress": (
                "Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, Bhosari, Pune, Maharashtra"
            ),
            "locality": "bhosari",
            "city": "pune",
            "state": "maharashtra",
        },
        info_payload,
    )
    assert status in {ComparisonStatus.MATCHED, ComparisonStatus.POSSIBLE_MATCH}
    assert status != ComparisonStatus.CONFLICTING


def test_material_address_conflict_and_historical() -> None:
    info_payload = {
        "offices": [
            {
                "officeType": "registered-office",
                "addressLine1": "Unit No. 14, Meridian Industrial Estate",
                "addressLine2": "MIDC Bhosari",
                "city": "Pune",
                "state": "Maharashtra",
                "pinCode": "411026",
                "country": "India",
                "effectiveUntil": "",
            }
        ]
    }
    conflict, _ = compare_assertion(
        "offices.currentRegistered.address",
        {
            "addressLine1": "Somewhere Else Industrial Park",
            "locality": "Hadapsar",
            "city": "Pune",
            "state": "Maharashtra",
            "pinCode": "411028",
            "fullAddress": "Somewhere Else Industrial Park, Hadapsar, Pune, Maharashtra, 411028",
        },
        info_payload,
    )
    assert conflict == ComparisonStatus.CONFLICTING

    historical, _ = compare_assertion(
        "registrations.gstin.addressOnRegistration",
        {
            "fullAddress": "Plot No. 9, Vertex Industrial Park, Chakan, Pune, Maharashtra, 410501",
            "locality": "chakan",
            "city": "pune",
            "state": "maharashtra",
            "pinCode": "410501",
        },
        {
            "registrations": [
                {
                    "registrationType": "gstin",
                    "addressOnRegistration": (
                        "Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, "
                        "Pune, Maharashtra, 411026, India"
                    ),
                }
            ]
        },
    )
    assert historical == ComparisonStatus.POSSIBLE_HISTORICAL


def test_notification_routes_use_frontend_tab_ids() -> None:
    assert "tab=questions&issueId=abc" in build_company_incorporation_questions_route(
        issue_id="abc"
    )
    assert "tab=facts&assertionId=xyz" in build_company_incorporation_facts_route(
        assertion_id="xyz"
    )
    assert "tab=facts&documentVersionId=vid" in build_company_incorporation_facts_route(
        document_version_id="vid"
    )
    assert "facts-evidence" not in build_company_incorporation_facts_route(
        document_version_id="vid"
    )
    assert "questions-conflicts" not in build_company_incorporation_questions_route(issue_id="abc")


def test_occupancy_normalizer() -> None:
    assert normalize_occupancy_type("type") == ""
    assert normalize_occupancy_type("Leased") == "leased"
    assert normalize_occupancy_type("owned") == "owned"
