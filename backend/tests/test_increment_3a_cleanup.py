"""Focused Increment 3A cleanup tests: GST dates, INC-22 form, PAN truncation."""

from __future__ import annotations

import uuid
from types import SimpleNamespace

from app.modules.company_incorporation.structured_extraction.comparison import (
    build_issues_for_workspace,
    compare_assertion,
)
from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStatus,
    EvidenceRole,
    ExtractorKind,
    FactValueType,
    IssueType,
    ValidationStatus,
)
from app.modules.company_incorporation.structured_extraction.deterministic import (
    run_deterministic_extraction,
)
from app.modules.company_incorporation.structured_extraction.merge import merge_candidates
from app.modules.company_incorporation.structured_extraction.normalize import (
    is_likely_truncated_legal_name,
    normalize_filing_form,
    normalize_legal_name,
)
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    EvidenceCite,
    PageBlockIndex,
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


def _page(lines: list[str], *, method: str = "native_text") -> SimpleNamespace:
    blocks = []
    y0 = 0.08
    for index, line in enumerate(lines):
        blocks.append(_block(index, line, x0=0.1, y0=y0, x1=0.85, y1=y0 + 0.025))
        y0 += 0.04
    return SimpleNamespace(
        id=uuid.uuid4(),
        page_number=1,
        extraction_method=method,
        average_ocr_confidence=0.55 if method == "ocr" else None,
        text="\n".join(lines),
        text_blocks=blocks,
    )


def test_gst_registration_and_effective_dates_are_distinct() -> None:
    page = _page(
        [
            "GST REGISTRATION CERTIFICATE",
            "GSTIN 27AABCN1234Q1Z9",
            "Registration Date",
            "05 July 2019",
            "Certificate Effective Date",
            "22 August 2023",
        ]
    )
    candidates = run_deterministic_extraction("gst-registration-certificates", [page])
    by_key = {item.fact_key: item for item in candidates}
    assert by_key["registrations.gstin.registrationDate"].normalized_value == "2019-07-05"
    assert by_key["registrations.gstin.effectiveDate"].normalized_value == "2023-08-22"
    assert by_key["registrations.gstin.registrationDate"].evidence
    assert by_key["registrations.gstin.effectiveDate"].evidence

    payload = {
        "registrations": [
            {
                "registrationType": "gstin",
                "issueDate": "2019-07-05",
                "effectiveDate": "2023-08-22",
            }
        ]
    }
    reg_status, _ = compare_assertion(
        "registrations.gstin.registrationDate",
        "2019-07-05",
        payload,
    )
    eff_status, _ = compare_assertion(
        "registrations.gstin.effectiveDate",
        "2023-08-22",
        payload,
    )
    assert reg_status == ComparisonStatus.MATCHED
    assert eff_status == ComparisonStatus.MATCHED

    no_info, _ = compare_assertion(
        "registrations.gstin.effectiveDate",
        "2023-08-22",
        {
            "registrations": [
                {
                    "registrationType": "gstin",
                    "issueDate": "2019-07-05",
                }
            ]
        },
    )
    assert no_info == ComparisonStatus.NO_INFORMATION

    amendment_no_info, _ = compare_assertion(
        "registrations.gstin.amendmentDate",
        "2023-08-14",
        payload,
    )
    assert amendment_no_info == ComparisonStatus.NO_INFORMATION

    historical_effective, _ = compare_assertion(
        "registrations.gstin.effectiveDate",
        "2019-07-05",
        payload,
    )
    assert historical_effective == ComparisonStatus.POSSIBLE_HISTORICAL

    issues = build_issues_for_workspace(
        payload=payload,
        requirement_key="gst-registration-certificates",
        merged_candidates=[
            by_key["registrations.gstin.registrationDate"],
            by_key["registrations.gstin.effectiveDate"],
        ],
        missing_fact_keys=[],
        disagreements=[],
        low_quality=[],
    )
    assert not [
        issue
        for issue in issues
        if issue["issue_type"] == IssueType.CONFLICTING_VALUE
        and issue["fact_key"]
        in {
            "registrations.gstin.registrationDate",
            "registrations.gstin.effectiveDate",
        }
    ]


def test_inc22_filing_form_variants_and_rejection() -> None:
    for label_line in (
        "INC-22",
        "INC 22",
        "Form INC-22",
        "Form No. INC-22",
        "e-Form INC-22",
    ):
        page = _page([label_line, "SRN R12345678"])
        candidates = run_deterministic_extraction("current-registered-office-filing", [page])
        forms = [
            item
            for item in candidates
            if item.fact_key == "corporateHistory.officeChange.filingForm"
        ]
        assert forms, f"expected filing form for {label_line!r}"
        assert forms[0].normalized_value == "INC-22"
        assert normalize_filing_form(label_line) == "INC-22"

    junk = run_deterministic_extraction(
        "current-registered-office-filing",
        [_page(["Reference X-99-YY", "Unrelated hyphenated-code ABC-DEF"])],
    )
    assert not [
        item for item in junk if item.fact_key == "corporateHistory.officeChange.filingForm"
    ]


def test_inc22_form_hybrid_merge_and_no_missing_issue() -> None:
    page = _page(["FORM INC-22 — NOTICE OF SITUATION", "SRN R12345678"])
    det = run_deterministic_extraction("current-registered-office-filing", [page])
    form_det = next(
        item for item in det if item.fact_key == "corporateHistory.officeChange.filingForm"
    )
    page_id = str(page.id)
    block_id = form_det.evidence[0].block_id
    sem = CandidateFact(
        fact_key="corporateHistory.officeChange.filingForm",
        value_type=FactValueType.STRING,
        raw_value="INC-22",
        normalized_value="INC-22",
        display_value="INC-22",
        extractor_kind=ExtractorKind.SEMANTIC,
        validation_status=ValidationStatus.VALID,
        evidence=[EvidenceCite(page_id=page_id, block_id=block_id, role=EvidenceRole.VALUE)],
        support="explicit",
    )
    index = PageBlockIndex.from_pages([page])
    merged, audit = merge_candidates([form_det], [sem], index)
    assert len(merged) == 1
    assert merged[0].extractor_kind == ExtractorKind.HYBRID
    assert merged[0].normalized_value == "INC-22"
    assert not any(event.get("event") == "extractor_disagreement" for event in audit)

    issues = build_issues_for_workspace(
        payload={},
        requirement_key="current-registered-office-filing",
        merged_candidates=merged,
        missing_fact_keys=[],
        disagreements=[],
        low_quality=[],
    )
    assert not [
        issue
        for issue in issues
        if issue["fact_key"] == "corporateHistory.officeChange.filingForm"
        and issue["issue_type"] == IssueType.MISSING_EXPECTED_FACT
    ]


def test_pan_truncated_name_quality_not_hard_conflict() -> None:
    info = "Nivara Techfab Private Limited"
    assert is_likely_truncated_legal_name("Nivara", info)
    assert is_likely_truncated_legal_name("Nivara Techfab", info)
    assert is_likely_truncated_legal_name("Nivara Techfab Pvt", info)
    assert not is_likely_truncated_legal_name("Nivara Industrial Systems Private Limited", info)
    assert not is_likely_truncated_legal_name("Navira Techfab Private Limited", info)
    assert normalize_legal_name("Nivara Techfab Pvt. Ltd.") == normalize_legal_name(info)

    status, hint = compare_assertion(
        "registrations.pan.legalNameOnRegistration",
        "Nivara",
        {
            "registrations": [
                {
                    "registrationType": "pan",
                    "legalNameOnRegistration": info,
                    "registrationNumber": "AABCN1234Q",
                }
            ]
        },
    )
    assert status == ComparisonStatus.POSSIBLE_MATCH
    assert "truncat" in (hint or "").casefold()

    conflict, _ = compare_assertion(
        "registrations.pan.legalNameOnRegistration",
        "Nivara Industrial Systems Private Limited",
        {
            "registrations": [
                {
                    "registrationType": "pan",
                    "legalNameOnRegistration": info,
                }
            ]
        },
    )
    assert conflict == ComparisonStatus.CONFLICTING

    candidate = CandidateFact(
        fact_key="registrations.pan.legalNameOnRegistration",
        value_type=FactValueType.STRING,
        raw_value="Nivara",
        normalized_value=normalize_legal_name("Nivara"),
        display_value="Nivara",
        extractor_kind=ExtractorKind.DETERMINISTIC,
        validation_status=ValidationStatus.VALID,
        evidence=[],
        support="explicit",
        quality_signals={"extraction_method": "ocr"},
    )
    pan_id = CandidateFact(
        fact_key="registrations.pan.registrationNumber",
        value_type=FactValueType.IDENTIFIER,
        raw_value="AABCN1234Q",
        normalized_value="AABCN1234Q",
        display_value="AABCN1234Q",
        extractor_kind=ExtractorKind.DETERMINISTIC,
        validation_status=ValidationStatus.VALID,
        evidence=[],
        support="explicit",
    )
    issues = build_issues_for_workspace(
        payload={
            "registrations": [
                {
                    "registrationType": "pan",
                    "legalNameOnRegistration": info,
                    "registrationNumber": "AABCN1234Q",
                }
            ]
        },
        requirement_key="pan-certificate",
        merged_candidates=[candidate, pan_id],
        missing_fact_keys=[],
        disagreements=[],
        low_quality=[],
    )
    name_issues = [issue for issue in issues if issue["fact_key"] == candidate.fact_key]
    assert name_issues
    assert name_issues[0]["issue_type"] == IssueType.LOW_EXTRACTION_QUALITY
    assert name_issues[0]["severity"] == "warning"
    assert not [
        issue
        for issue in issues
        if issue["fact_key"] == candidate.fact_key
        and issue["issue_type"] == IssueType.CONFLICTING_VALUE
    ]
    assert not [
        issue for issue in issues if issue["fact_key"] == "registrations.pan.registrationNumber"
    ]
