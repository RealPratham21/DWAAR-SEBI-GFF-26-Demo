"""Fake semantic provider for tests using Nivara fixture values."""

from __future__ import annotations

import re
from typing import Any

from app.modules.company_incorporation.structured_extraction.constants import (
    EvidenceRole,
    ExtractorKind,
    ValidationStatus,
)
from app.modules.company_incorporation.structured_extraction.normalize import (
    display_address,
    display_date,
    display_identifier,
    display_legal_name,
    display_text,
    normalize_address_dict,
    normalize_identifier,
    normalize_legal_name,
    parse_date_to_iso,
)
from app.modules.company_incorporation.structured_extraction.provider_base import (
    SemanticDocumentAssessment,
    SemanticExtractedFact,
    SemanticExtractionRequest,
    SemanticExtractionResult,
    SemanticMissingExpectedFact,
)
from app.modules.company_incorporation.structured_extraction.registry import get_fact
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    EvidenceCite,
)

_NIVARA_FACT_PATTERNS: tuple[tuple[str, re.Pattern[str], Any], ...] = (
    (
        "identity.cin",
        re.compile(r"U29309MH2019PTC328517"),
        "U29309MH2019PTC328517",
    ),
    (
        "registrations.pan.registrationNumber",
        re.compile(r"AABCN1234Q"),
        "AABCN1234Q",
    ),
    (
        "registrations.gstin.registrationNumber",
        re.compile(r"27AABCN1234Q1Z9"),
        "27AABCN1234Q1Z9",
    ),
    (
        "registrations.udyam.registrationNumber",
        re.compile(r"UDYAM[\s\-]?MH[\s\-]?19[\s\-]?0048721", re.IGNORECASE),
        "UDYAM-MH-19-0048721",
    ),
    (
        "corporateHistory.officeChange.srn",
        re.compile(r"R12345678"),
        "R12345678",
    ),
    (
        "identity.legalName",
        re.compile(r"Nivara\s+Techfab\s+Private\s+Limited", re.IGNORECASE),
        "Nivara Techfab Private Limited",
    ),
    (
        "identity.incorporationDate",
        re.compile(r"2019[\-/]06[\-/]12|12[\-/]06[\-/]2019|12\s+Jun(?:e)?\s+2019", re.IGNORECASE),
        "2019-06-12",
    ),
    (
        "corporateHistory.officeChange.filingForm",
        re.compile(r"INC[\s\-]?22", re.IGNORECASE),
        "INC-22",
    ),
)

_ADDRESS_PATTERNS: tuple[tuple[str, re.Pattern[str], dict[str, str]], ...] = (
    (
        "offices.currentRegistered.address",
        re.compile(r"411026|Bhosari|MIDC\s+Bhosari", re.IGNORECASE),
        {
            "addressLine1": "Unit No. 14, Meridian Industrial Estate",
            "addressLine2": "MIDC Bhosari",
            "locality": "Bhosari",
            "city": "Pune",
            "state": "Maharashtra",
            "pinCode": "411026",
            "country": "India",
        },
    ),
    (
        "corporateHistory.officeChange.previousAddress",
        re.compile(r"410501|Chakan", re.IGNORECASE),
        {
            "addressLine1": "Plot No. 9, Vertex Industrial Park",
            "addressLine2": "Chakan Industrial Area",
            "city": "Pune",
            "state": "Maharashtra",
            "pinCode": "410501",
            "country": "India",
        },
    ),
    (
        "corporateHistory.officeChange.newAddress",
        re.compile(r"411026|Bhosari|MIDC\s+Bhosari", re.IGNORECASE),
        {
            "addressLine1": "Unit No. 14, Meridian Industrial Estate",
            "addressLine2": "MIDC Bhosari",
            "locality": "Bhosari",
            "city": "Pune",
            "state": "Maharashtra",
            "pinCode": "411026",
            "country": "India",
        },
    ),
    (
        "registrations.gstin.addressOnRegistration",
        re.compile(r"411026|Bhosari|MIDC\s+Bhosari", re.IGNORECASE),
        {
            "addressLine1": "Unit No. 14, Meridian Industrial Estate",
            "addressLine2": "MIDC Bhosari",
            "locality": "Bhosari",
            "city": "Pune",
            "state": "Maharashtra",
            "pinCode": "411026",
            "country": "India",
        },
    ),
)

_MAIN_OBJECT_PATTERN = re.compile(
    r"manufacture.{0,120}precision\s+metal\s+components",
    re.IGNORECASE | re.DOTALL,
)


class FakeStructuredFactExtractionProvider:
    """Semantic provider that only returns facts supported by page text."""

    def extract(self, request: SemanticExtractionRequest) -> SemanticExtractionResult:
        expected_keys = {fact.fact_key for fact in request.expected_facts}
        found_keys: set[str] = set()
        facts: list[SemanticExtractedFact] = []

        for page in request.pages:
            page_text = "\n".join(block.text for block in page.blocks)
            for fact_key, pattern, canonical in _NIVARA_FACT_PATTERNS:
                if fact_key not in expected_keys or fact_key in found_keys:
                    continue
                match = pattern.search(page_text)
                if not match:
                    continue
                block_ids = _matching_block_ids(page.blocks, match.group(0))
                if not block_ids:
                    continue
                definition = get_fact(fact_key)
                facts.append(
                    SemanticExtractedFact(
                        factKey=fact_key,
                        valueType=definition.value_type,
                        value=_canonical_value(definition.value_type, canonical, fact_key),
                        support="explicit",
                        evidenceBlockIds=block_ids,
                    )
                )
                found_keys.add(fact_key)

            for fact_key, pattern, address in _ADDRESS_PATTERNS:
                if fact_key not in expected_keys or fact_key in found_keys:
                    continue
                if not pattern.search(page_text):
                    continue
                block_ids = _blocks_matching_address(page.blocks, address)
                if not block_ids:
                    continue
                definition = get_fact(fact_key)
                value = normalize_address_dict(address)
                facts.append(
                    SemanticExtractedFact(
                        factKey=fact_key,
                        valueType=definition.value_type,
                        value=value,
                        support="explicit",
                        evidenceBlockIds=block_ids,
                    )
                )
                found_keys.add(fact_key)

            if "constitutionalRecord.mainObjectText" in expected_keys:
                match = _MAIN_OBJECT_PATTERN.search(page_text)
                if match:
                    block_ids = _matching_block_ids(page.blocks, "manufacture")
                    if block_ids:
                        definition = get_fact("constitutionalRecord.mainObjectText")
                        text = display_text(match.group(0))
                        facts.append(
                            SemanticExtractedFact(
                                factKey="constitutionalRecord.mainObjectText",
                                valueType=definition.value_type,
                                value=text,
                                support="explicit",
                                evidenceBlockIds=block_ids,
                            )
                        )
                        found_keys.add("constitutionalRecord.mainObjectText")

        missing = [
            SemanticMissingExpectedFact(factKey=fact.fact_key, reason="not_found")
            for fact in request.expected_facts
            if fact.fact_key not in found_keys
        ]
        return SemanticExtractionResult(
            documentAssessment=SemanticDocumentAssessment(
                matchesExpectedDocumentType=True,
                warnings=[],
            ),
            facts=facts,
            missingExpectedFacts=missing,
            warnings=[],
        )


def semantic_result_to_candidates(
    result: SemanticExtractionResult,
    block_index_pages: dict[str, str],
) -> list[CandidateFact]:
    """Convert provider response to CandidateFact objects with evidence cites."""

    candidates: list[CandidateFact] = []
    for fact in result.facts:
        normalized, display = _normalize_semantic_value(fact.value_type, fact.value, fact.fact_key)
        evidence = [
            EvidenceCite(
                page_id=block_index_pages[block_id], block_id=block_id, role=EvidenceRole.VALUE
            )
            for block_id in fact.evidence_block_ids
            if block_id in block_index_pages
        ]
        candidates.append(
            CandidateFact(
                fact_key=fact.fact_key,
                value_type=fact.value_type,
                raw_value=fact.value,
                normalized_value=normalized,
                display_value=display,
                extractor_kind=ExtractorKind.SEMANTIC,
                validation_status=ValidationStatus.VALID,
                evidence=evidence,
                support=fact.support,
                ambiguity=fact.ambiguity,
            )
        )
    return candidates


def _blocks_matching_address(blocks: Any, address: dict[str, str]) -> list[str]:
    needles = [
        address.get("pinCode", ""),
        address.get("locality", ""),
        address.get("addressLine2", ""),
    ]
    matches: list[str] = []
    for block in blocks:
        text = block.text.casefold()
        if any(needle and needle.casefold() in text for needle in needles):
            matches.append(block.block_id)
    return matches


def _matching_block_ids(blocks: Any, needle: str) -> list[str]:
    matches: list[str] = []
    for block in blocks:
        if needle.casefold() in block.text.casefold():
            matches.append(block.block_id)
    return matches


def _canonical_value(value_type: str, canonical: Any, fact_key: str) -> Any:
    if value_type == "date":
        return parse_date_to_iso(canonical) or canonical
    if value_type == "identifier":
        identifier_type = "udyam" if "udyam" in fact_key else None
        return normalize_identifier(canonical, identifier_type=identifier_type)
    if value_type == "address":
        return normalize_address_dict(canonical)
    if fact_key.endswith("legalName"):
        return display_legal_name(canonical)
    return canonical


def _normalize_semantic_value(value_type: str, value: Any, fact_key: str) -> tuple[Any, str]:
    if value_type == "date":
        iso = parse_date_to_iso(value) or str(value)
        return iso, display_date(iso)
    if value_type == "identifier":
        identifier_type = "udyam" if "udyam" in fact_key else None
        normalized = normalize_identifier(value, identifier_type=identifier_type)
        return normalized, display_identifier(value, identifier_type=identifier_type)
    if value_type == "address":
        normalized = normalize_address_dict(value)
        return normalized, display_address(normalized)
    if fact_key.endswith("legalName"):
        return normalize_legal_name(value), display_legal_name(value)
    text = display_text(value)
    return text, text


def build_block_page_map(request: SemanticExtractionRequest) -> dict[str, str]:
    return {block.block_id: page.page_id for page in request.pages for block in page.blocks}
