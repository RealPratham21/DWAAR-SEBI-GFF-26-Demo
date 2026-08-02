"""Unit tests for structured extraction registry, identifiers, merge, comparison."""

from __future__ import annotations

import uuid
from types import SimpleNamespace

from app.modules.company_incorporation.structured_extraction.comparison import (
    compare_assertion,
)
from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStatus,
    ExtractorKind,
    ValidationStatus,
)
from app.modules.company_incorporation.structured_extraction.deterministic import (
    run_deterministic_extraction,
)
from app.modules.company_incorporation.structured_extraction.identifiers import (
    find_identifiers_in_text,
)
from app.modules.company_incorporation.structured_extraction.merge import merge_candidates
from app.modules.company_incorporation.structured_extraction.normalize import (
    normalize_legal_name,
    validate_gstin,
    validate_pan,
)
from app.modules.company_incorporation.structured_extraction.registry import (
    FACT_REGISTRY,
    get_requirement_spec,
    list_fact_keys,
    validate_information_paths,
)
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    EvidenceCite,
    PageBlockIndex,
)


def test_fact_keys_unique_and_paths_valid() -> None:
    keys = list_fact_keys()
    assert len(keys) == len(set(keys))
    assert len(keys) >= 30
    assert validate_information_paths() == []


def test_requirement_specs_reference_valid_facts() -> None:
    for requirement in (
        "original-certificate-of-incorporation",
        "gst-registration-certificates",
        "pan-certificate",
        "current-registered-office-filing",
        "current-certified-moa",
    ):
        spec = get_requirement_spec(requirement)
        assert spec["supported"] is True
        for fact_key in spec["expected_fact_keys"]:
            assert fact_key in FACT_REGISTRY


def test_identifiers_and_gstin_pan_link() -> None:
    text = "CIN U29309MH2019PTC328517 PAN AABCN1234Q GSTIN 27AABCN1234Q1Z9 SRN R12345678"
    matches = find_identifiers_in_text(text)
    types = {item.identifier_type for item in matches}
    assert "cin" in types
    assert "pan" in types
    assert "gstin" in types
    assert "srn" in types
    assert validate_pan("AABCN1234Q")
    assert validate_gstin("27AABCN1234Q1Z9", expected_pan="AABCN1234Q")
    assert normalize_legal_name("Nivara Techfab Pvt. Ltd.") == normalize_legal_name(
        "Nivara Techfab Private Limited"
    )


def test_deterministic_coi_extraction() -> None:
    page = SimpleNamespace(
        id=uuid.uuid4(),
        page_number=1,
        extraction_method="native_text",
        average_ocr_confidence=None,
        text=(
            "CERTIFICATE OF INCORPORATION\n"
            "This is to certify that Nivara Techfab Private Limited is incorporated under the "
            "Companies Act, 2013 on 2019-06-12 in the state of Maharashtra.\n"
            "CORPORATE IDENTITY NUMBER (CIN)\n"
            "COMPANY CLASS\n"
            "U29309MH2019PTC328517\n"
            "Private\n"
            "CATEGORY\n"
            "Company limited by shares\n"
            "SYNTHETIC DEMO DOCUMENT — NOT\n"
            "REGISTRAR OF COMPANIES\n"
            "Registrar of Companies, Pune\n"
        ),
        text_blocks=[
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 0,
                "type": "line",
                "text": "This is to certify that Nivara Techfab Private Limited is incorporated under the",
                "bbox": {"x0": 0.1, "y0": 0.16, "x1": 0.8, "y1": 0.18},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 1,
                "type": "line",
                "text": "CORPORATE IDENTITY NUMBER (CIN)",
                "bbox": {"x0": 0.1, "y0": 0.214, "x1": 0.37, "y1": 0.228},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 2,
                "type": "line",
                "text": "COMPANY CLASS",
                "bbox": {"x0": 0.51, "y0": 0.214, "x1": 0.63, "y1": 0.228},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 3,
                "type": "line",
                "text": "U29309MH2019PTC328517",
                "bbox": {"x0": 0.1, "y0": 0.230, "x1": 0.38, "y1": 0.244},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 4,
                "type": "line",
                "text": "Private",
                "bbox": {"x0": 0.51, "y0": 0.230, "x1": 0.58, "y1": 0.244},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 5,
                "type": "line",
                "text": "CATEGORY",
                "bbox": {"x0": 0.1, "y0": 0.255, "x1": 0.18, "y1": 0.268},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 6,
                "type": "line",
                "text": "Company limited by shares",
                "bbox": {"x0": 0.1, "y0": 0.271, "x1": 0.38, "y1": 0.285},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 7,
                "type": "line",
                "text": "SYNTHETIC DEMO DOCUMENT — NOT",
                "bbox": {"x0": 0.09, "y0": 0.291, "x1": 0.88, "y1": 0.305},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 8,
                "type": "line",
                "text": "REGISTRAR OF COMPANIES",
                "bbox": {"x0": 0.1, "y0": 0.310, "x1": 0.30, "y1": 0.324},
                "confidence": None,
            },
            {
                "block_id": str(uuid.uuid4()),
                "order_index": 9,
                "type": "line",
                "text": "Registrar of Companies, Pune",
                "bbox": {"x0": 0.1, "y0": 0.326, "x1": 0.40, "y1": 0.340},
                "confidence": None,
            },
        ],
    )
    candidates = run_deterministic_extraction(
        "original-certificate-of-incorporation",
        [page],
    )
    by_key = {item.fact_key: item for item in candidates}
    assert by_key["identity.cin"].normalized_value == "U29309MH2019PTC328517"
    assert by_key["identity.cin"].validation_status == "valid"
    assert by_key["identity.cin"].evidence
    assert "nivara techfab private limited" in by_key["identity.legalName"].normalized_value
    assert by_key["identity.companyClass"].normalized_value == "private"
    assert by_key["identity.companyCategory"].normalized_value == "company-limited-by-shares"
    assert by_key["identity.governingAct"].normalized_value == "companies-act-2013"
    assert by_key["identity.registrarOfCompanies"].display_value.startswith(
        "Registrar of Companies"
    )


def test_merge_agreement_and_disagreement() -> None:
    page_id = str(uuid.uuid4())
    block_a = str(uuid.uuid4())
    block_b = str(uuid.uuid4())
    page = SimpleNamespace(
        id=uuid.UUID(page_id),
        page_number=1,
        extraction_method="native_text",
        average_ocr_confidence=None,
        text="U29309MH2019PTC328517 OTHER U29309MH2019PTC000001",
        text_blocks=[
            {
                "block_id": block_a,
                "order_index": 0,
                "text": "U29309MH2019PTC328517",
                "bbox": {"x0": 0.1, "y0": 0.1, "x1": 0.5, "y1": 0.2},
            },
            {
                "block_id": block_b,
                "order_index": 1,
                "text": "U29309MH2019PTC000001",
                "bbox": {"x0": 0.1, "y0": 0.3, "x1": 0.5, "y1": 0.4},
            },
        ],
    )
    index = PageBlockIndex.from_pages([page])
    det = CandidateFact(
        fact_key="identity.cin",
        value_type="identifier",
        raw_value="U29309MH2019PTC328517",
        normalized_value="U29309MH2019PTC328517",
        display_value="U29309MH2019PTC328517",
        extractor_kind=ExtractorKind.DETERMINISTIC,
        validation_status=ValidationStatus.VALID,
        evidence=[EvidenceCite(page_id=page_id, block_id=block_a, role="value")],
    )
    sem_agree = CandidateFact(
        fact_key="identity.cin",
        value_type="identifier",
        raw_value="U29309MH2019PTC328517",
        normalized_value="U29309MH2019PTC328517",
        display_value="U29309MH2019PTC328517",
        extractor_kind=ExtractorKind.SEMANTIC,
        validation_status=ValidationStatus.VALID,
        evidence=[EvidenceCite(page_id=page_id, block_id=block_a, role="value")],
        support="explicit",
    )
    merged, _audit = merge_candidates([det], [sem_agree], index)
    assert len(merged) == 1
    assert merged[0].extractor_kind == ExtractorKind.HYBRID

    sem_disagree = CandidateFact(
        fact_key="identity.cin",
        value_type="identifier",
        raw_value="U29309MH2019PTC000001",
        normalized_value="U29309MH2019PTC000001",
        display_value="U29309MH2019PTC000001",
        extractor_kind=ExtractorKind.SEMANTIC,
        validation_status=ValidationStatus.VALID,
        evidence=[EvidenceCite(page_id=page_id, block_id=block_b, role="value")],
        support="explicit",
    )
    merged2, audit = merge_candidates([det], [sem_disagree], index)
    assert merged2[0].normalized_value == "U29309MH2019PTC328517"
    assert any(item.get("event") == "extractor_disagreement" for item in audit)


def test_historical_address_comparison() -> None:
    payload = {
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
            },
            {
                "officeType": "registered-office",
                "addressLine1": "Plot No. 9, Vertex Industrial Park",
                "addressLine2": "Chakan Industrial Area",
                "city": "Pune",
                "state": "Maharashtra",
                "pinCode": "410501",
                "country": "India",
                "effectiveUntil": "2023-08-13",
            },
        ],
        "registrations": [
            {
                "registrationType": "gstin",
                "addressOnRegistration": (
                    "Unit No. 14, Meridian Industrial Estate, MIDC Bhosari, "
                    "Pune, Maharashtra, 411026, India"
                ),
            }
        ],
    }
    status, _hint = compare_assertion(
        "registrations.gstin.addressOnRegistration",
        {
            "addressLine1": "Plot No. 9, Vertex Industrial Park",
            "addressLine2": "Chakan Industrial Area",
            "city": "Pune",
            "state": "Maharashtra",
            "pinCode": "410501",
            "country": "India",
            "fullAddress": (
                "Plot No. 9, Vertex Industrial Park, Chakan Industrial Area, "
                "Pune, Maharashtra, 410501, India"
            ),
        },
        payload,
    )
    assert status == ComparisonStatus.POSSIBLE_HISTORICAL
