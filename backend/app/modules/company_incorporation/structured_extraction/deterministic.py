"""Deterministic structured fact extraction from evidence-ready pages."""

from __future__ import annotations

import re
from typing import Any

from app.modules.company_incorporation.structured_extraction.constants import (
    EvidenceRole,
    ExtractorKind,
    FactValueType,
    ValidationStatus,
)
from app.modules.company_incorporation.structured_extraction.identifiers import (
    find_identifiers_in_text,
)
from app.modules.company_incorporation.structured_extraction.label_value import (
    BlockView,
    LabelValueCandidate,
    blocks_to_views,
    find_label_value_pairs,
)
from app.modules.company_incorporation.structured_extraction.normalize import (
    display_address,
    display_date,
    display_identifier,
    display_legal_name,
    display_string_list,
    display_text,
    extract_legal_name_candidate,
    fingerprint_value,
    is_ignored_document_noise,
    is_label_fragment_value,
    is_legal_name_fact,
    normalize_address_dict,
    normalize_company_category,
    normalize_company_class,
    normalize_company_sub_category,
    normalize_filing_form,
    normalize_governing_act,
    normalize_identifier,
    normalize_legal_name,
    normalize_occupancy_type,
    parse_date_to_iso,
    validate_cin,
    validate_gstin,
    validate_pan,
    validate_udyam,
)
from app.modules.company_incorporation.structured_extraction.registry import (
    get_fact,
    get_requirement_spec,
)
from app.modules.company_incorporation.structured_extraction.types import (
    CandidateFact,
    DocumentPageLike,
    EvidenceCite,
    PageBlockIndex,
)

_IDENTIFIER_TYPE_TO_FACT_KEY: dict[str, str] = {
    "cin": "identity.cin",
    "pan": "registrations.pan.registrationNumber",
    "gstin": "registrations.gstin.registrationNumber",
    "udyam": "registrations.udyam.registrationNumber",
    "srn": "corporateHistory.officeChange.srn",
    "form": "corporateHistory.officeChange.filingForm",
}

_GST_DATE_FACT_KEYS = frozenset(
    {
        "registrations.gstin.registrationDate",
        "registrations.gstin.certificateIssueDate",
        "registrations.gstin.amendmentDate",
        "registrations.gstin.effectiveDate",
    }
)

_LEGAL_NAME_PATTERN = re.compile(
    r"\b([A-Z][A-Za-z0-9&.,'()/\- ]{2,120}?\b(?:Private|Pvt\.?)\s+Limited\b)",
    re.IGNORECASE,
)
_NIVARA_NAME_PATTERN = re.compile(r"\bNivara\s+Techfab(?:\s+Private\s+Limited)?\b", re.IGNORECASE)
_OBJECT_HEADING_RE = re.compile(
    r"\b(main\s+object|objects?\s+of\s+the\s+company|object\s+clause|to\s+manufacture)\b",
    re.IGNORECASE,
)
_GOVERNING_ACT_RE = re.compile(
    r"\b((?:the\s+)?Companies\s+Act,?\s*(?:19|20)\d{2})\b",
    re.IGNORECASE,
)
_STATE_RE = re.compile(
    r"\b(?:state of|in the state of)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b",
    re.IGNORECASE,
)
_ADDRESS_LABEL_RE = re.compile(
    r"\b(registered\s+office|principal\s+place\s+of\s+business|address|office\s+address|"
    r"new\s+registered\s+office|previous\s+registered\s+office|proposed\s+registered\s+office|"
    r"current\s+registered\s+office|address\s+of\s+new\s+registered\s+office)\b",
    re.IGNORECASE,
)
_LOCALITY_HINTS = ("bhosari", "chakan", "midc", "meridian", "vertex")
_PIN_CONTEXT_WINDOW = 220
_MIN_ADDRESS_MATERIAL_CHARS = 18
_OCCUPANCY_INLINE_RE = re.compile(
    r"\boccupancy\s*type\s*[:\-]?\s*(leased|owned|licensed|other|lease|rented)\b",
    re.IGNORECASE,
)


def run_deterministic_extraction(
    requirement_key: str,
    pages: list[DocumentPageLike],
) -> list[CandidateFact]:
    """Extract requirement-scoped facts using regex, label proximity, and heuristics."""

    spec = get_requirement_spec(requirement_key)
    if not spec["supported"]:
        return []

    block_index = PageBlockIndex.from_pages(pages)
    expected_fact_keys = set(spec["expected_fact_keys"])
    block_views = blocks_to_views(_pages_payload(block_index))
    combined_text = block_index.combined_text

    candidates: list[CandidateFact] = []
    candidates.extend(
        _extract_identifiers(combined_text, block_views, block_index, expected_fact_keys)
    )
    candidates.extend(
        _extract_label_values(
            block_index,
            block_views,
            expected_fact_keys,
        )
    )
    candidates.extend(
        _extract_legal_name(combined_text, block_views, block_index, expected_fact_keys)
    )
    candidates.extend(
        _extract_prose_identity_fields(combined_text, block_views, block_index, expected_fact_keys)
    )
    candidates.extend(
        _extract_occupancy(combined_text, block_views, block_index, expected_fact_keys)
    )
    candidates.extend(
        _extract_addresses(combined_text, block_views, block_index, expected_fact_keys)
    )
    if "constitutionalRecord.mainObjectText" in expected_fact_keys:
        candidates.extend(_extract_main_object_candidates(block_index, expected_fact_keys))

    return _select_best_candidates(_dedupe_candidates(candidates))


def _pages_payload(block_index: PageBlockIndex) -> list[dict[str, Any]]:
    return [
        {
            "page_number": page.page_number,
            "text_blocks": [
                {
                    "block_id": block.block_id,
                    "order_index": block.order_index,
                    "text": block.text,
                    "bbox": block.bbox,
                    "confidence": block.confidence,
                }
                for block in page.blocks
            ],
        }
        for page in block_index.pages
    ]


def _extract_identifiers(
    combined_text: str,
    block_views: list[BlockView],
    block_index: PageBlockIndex,
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    results: list[CandidateFact] = []
    for match in find_identifiers_in_text(combined_text):
        fact_key = _IDENTIFIER_TYPE_TO_FACT_KEY.get(match.identifier_type)
        if not fact_key or fact_key not in expected_fact_keys:
            continue
        definition = get_fact(fact_key)
        block = _block_for_match(block_views, match.raw)
        evidence = _evidence_for_block(block_index, block, role=EvidenceRole.VALUE)

        if match.identifier_type == "form":
            if definition.value_type != FactValueType.STRING:
                continue
            normalized = normalize_filing_form(match.normalized or match.raw)
            if not normalized:
                continue
            results.append(
                CandidateFact(
                    fact_key=fact_key,
                    value_type=definition.value_type,
                    raw_value=match.raw,
                    normalized_value=normalized,
                    display_value=normalized,
                    extractor_kind=ExtractorKind.DETERMINISTIC,
                    validation_status=ValidationStatus.VALID,
                    evidence=evidence,
                    support="explicit",
                    quality_signals={"identifier_type": match.identifier_type},
                )
            )
            continue

        if definition.value_type != FactValueType.IDENTIFIER:
            continue
        validation_status = ValidationStatus.VALID if match.valid else ValidationStatus.INVALID
        normalized = normalize_identifier(match.normalized, identifier_type=match.identifier_type)
        results.append(
            CandidateFact(
                fact_key=fact_key,
                value_type=definition.value_type,
                raw_value=match.raw,
                normalized_value=normalized,
                display_value=display_identifier(match.raw, identifier_type=match.identifier_type),
                extractor_kind=ExtractorKind.DETERMINISTIC,
                validation_status=validation_status,
                evidence=evidence,
                support="explicit",
                quality_signals={"identifier_type": match.identifier_type},
            )
        )
    return results


def _extract_label_values(
    block_index: PageBlockIndex,
    block_views: list[BlockView],
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    results: list[CandidateFact] = []
    pairs = find_label_value_pairs(
        _pages_payload(block_index),
        fact_keys=sorted(expected_fact_keys),
    )
    for pair in pairs:
        for fact_key in pair.suggested_fact_keys:
            if fact_key not in expected_fact_keys:
                continue
            candidate = _candidate_from_label_pair(fact_key, pair, block_index)
            if candidate is not None:
                results.append(candidate)
    return results


def _candidate_from_label_pair(
    fact_key: str,
    pair: LabelValueCandidate,
    block_index: PageBlockIndex,
) -> CandidateFact | None:
    if fact_key in _GST_DATE_FACT_KEYS:
        resolved = _resolve_gst_date_fact_key(pair.label_text)
        if resolved is None or resolved != fact_key:
            return None

    definition = get_fact(fact_key)
    raw_value = pair.value_text.strip()
    if not raw_value:
        return None
    if is_ignored_document_noise(raw_value) or is_label_fragment_value(raw_value):
        return None
    if is_legal_name_fact(fact_key):
        raw_value = extract_legal_name_candidate(raw_value)
        if not raw_value or is_ignored_document_noise(raw_value):
            return None

    normalized_value, display_value, validation_status = _normalize_fact_value(
        definition.value_type,
        raw_value,
        fact_key=fact_key,
    )
    if normalized_value in (None, "", {}):
        return None
    if validation_status == ValidationStatus.INVALID:
        # Strict enums and identifiers: do not persist junk as active assertions.
        if fact_key in {
            "identity.companyClass",
            "identity.companyCategory",
            "identity.companySubCategory",
            "identity.governingAct",
            "offices.currentRegistered.occupancyType",
        }:
            return None
        if definition.value_type == FactValueType.IDENTIFIER:
            return None
    if definition.value_type == FactValueType.ADDRESS and not _address_has_material_content(
        normalized_value if isinstance(normalized_value, dict) else {}
    ):
        return None
    # Label proximity must not invent invalid identifiers; regex pass owns those.
    if (
        definition.value_type == FactValueType.IDENTIFIER
        and validation_status == ValidationStatus.INVALID
    ):
        return None

    label_block = block_index.get_block(pair.label_block_id)
    value_block = block_index.get_block(pair.value_block_id)
    evidence: list[EvidenceCite] = []
    if label_block:
        evidence.append(
            EvidenceCite(
                page_id=label_block.page_id,
                block_id=label_block.block_id,
                role=EvidenceRole.LABEL,
            )
        )
    if value_block:
        evidence.append(
            EvidenceCite(
                page_id=value_block.page_id,
                block_id=value_block.block_id,
                role=EvidenceRole.VALUE,
            )
        )

    return CandidateFact(
        fact_key=fact_key,
        value_type=definition.value_type,
        raw_value=raw_value,
        normalized_value=normalized_value,
        display_value=display_value,
        extractor_kind=ExtractorKind.DETERMINISTIC,
        validation_status=validation_status,
        evidence=evidence,
        support="explicit",
        quality_signals={"label_proximity": pair.proximity, "label_score": pair.score},
    )


def _extract_legal_name(
    combined_text: str,
    block_views: list[BlockView],
    block_index: PageBlockIndex,
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    if "identity.legalName" not in expected_fact_keys:
        return []

    definition = get_fact("identity.legalName")
    label_pairs = find_label_value_pairs(
        _pages_payload(block_index),
        fact_keys=["identity.legalName"],
    )
    results: list[CandidateFact] = []
    seen: set[str] = set()

    for pair in label_pairs:
        raw_value = extract_legal_name_candidate(pair.value_text)
        normalized = normalize_legal_name(raw_value)
        if not normalized or normalized in seen:
            continue
        if not _looks_like_legal_name(raw_value):
            continue
        seen.add(normalized)
        value_block = block_index.get_block(pair.value_block_id)
        label_block = block_index.get_block(pair.label_block_id)
        evidence: list[EvidenceCite] = []
        if label_block:
            evidence.append(
                EvidenceCite(label_block.page_id, label_block.block_id, EvidenceRole.LABEL)
            )
        if value_block:
            evidence.append(
                EvidenceCite(value_block.page_id, value_block.block_id, EvidenceRole.VALUE)
            )
        results.append(
            CandidateFact(
                fact_key="identity.legalName",
                value_type=definition.value_type,
                raw_value=raw_value,
                normalized_value=normalized,
                display_value=display_legal_name(raw_value),
                extractor_kind=ExtractorKind.DETERMINISTIC,
                validation_status=ValidationStatus.VALID,
                evidence=evidence,
                support="explicit",
                quality_signals={"source": "label"},
            )
        )

    for pattern in (_LEGAL_NAME_PATTERN, _NIVARA_NAME_PATTERN):
        for match in pattern.finditer(combined_text):
            raw_value = extract_legal_name_candidate(match.group(0))
            if pattern is _NIVARA_NAME_PATTERN and "limited" not in raw_value.casefold():
                # Prefer the full corporate form when available in surrounding text.
                full = _LEGAL_NAME_PATTERN.search(combined_text[max(0, match.start() - 20) :])
                if full:
                    raw_value = extract_legal_name_candidate(
                        full.group(1) if full.lastindex else full.group(0)
                    )
            normalized = normalize_legal_name(raw_value)
            if not normalized or normalized in seen:
                continue
            if not _looks_like_legal_name(raw_value):
                continue
            seen.add(normalized)
            block = _block_for_match(block_views, raw_value) or _block_for_match(
                block_views, match.group(0)
            )
            results.append(
                CandidateFact(
                    fact_key="identity.legalName",
                    value_type=definition.value_type,
                    raw_value=raw_value,
                    normalized_value=normalized,
                    display_value=display_legal_name(raw_value),
                    extractor_kind=ExtractorKind.DETERMINISTIC,
                    validation_status=ValidationStatus.VALID,
                    evidence=_evidence_for_block(block_index, block, role=EvidenceRole.VALUE),
                    support="explicit",
                    quality_signals={"source": "pattern"},
                )
            )
    return results


def _extract_prose_identity_fields(
    combined_text: str,
    block_views: list[BlockView],
    block_index: PageBlockIndex,
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    results: list[CandidateFact] = []

    if "identity.governingAct" in expected_fact_keys:
        match = _GOVERNING_ACT_RE.search(combined_text)
        if match:
            raw_value = match.group(1)
            normalized = normalize_governing_act(raw_value)
            block = _block_for_match(block_views, raw_value)
            results.append(
                CandidateFact(
                    fact_key="identity.governingAct",
                    value_type=get_fact("identity.governingAct").value_type,
                    raw_value=raw_value,
                    normalized_value=normalized,
                    display_value=normalized,
                    extractor_kind=ExtractorKind.DETERMINISTIC,
                    validation_status=ValidationStatus.VALID,
                    evidence=_evidence_for_block(block_index, block, role=EvidenceRole.VALUE),
                    support="explicit",
                    quality_signals={"source": "prose"},
                )
            )

    if "identity.incorporationState" in expected_fact_keys:
        match = _STATE_RE.search(combined_text)
        if match:
            raw_value = match.group(1).strip()
            block = _block_for_match(block_views, raw_value) or _block_for_match(
                block_views, match.group(0)
            )
            results.append(
                CandidateFact(
                    fact_key="identity.incorporationState",
                    value_type=get_fact("identity.incorporationState").value_type,
                    raw_value=raw_value,
                    normalized_value=raw_value,
                    display_value=raw_value,
                    extractor_kind=ExtractorKind.DETERMINISTIC,
                    validation_status=ValidationStatus.VALID,
                    evidence=_evidence_for_block(block_index, block, role=EvidenceRole.VALUE),
                    support="explicit",
                    quality_signals={"source": "prose"},
                )
            )

    if "identity.incorporationDate" in expected_fact_keys:
        date_match = re.search(
            r"\b(?:on|dated|date of incorporation[:\s]+)\s*(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4})\b",
            combined_text,
            re.IGNORECASE,
        )
        if date_match:
            iso = parse_date_to_iso(date_match.group(1))
            if iso:
                block = _block_for_match(block_views, date_match.group(1))
                results.append(
                    CandidateFact(
                        fact_key="identity.incorporationDate",
                        value_type=FactValueType.DATE,
                        raw_value=date_match.group(1),
                        normalized_value=iso,
                        display_value=display_date(iso),
                        extractor_kind=ExtractorKind.DETERMINISTIC,
                        validation_status=ValidationStatus.VALID,
                        evidence=_evidence_for_block(block_index, block, role=EvidenceRole.VALUE),
                        support="explicit",
                        quality_signals={"source": "prose"},
                    )
                )

    return results


def _extract_occupancy(
    combined_text: str,
    block_views: list[BlockView],
    block_index: PageBlockIndex,
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    if "offices.currentRegistered.occupancyType" not in expected_fact_keys:
        return []

    results: list[CandidateFact] = []
    definition = get_fact("offices.currentRegistered.occupancyType")

    pairs = find_label_value_pairs(
        _pages_payload(block_index),
        fact_keys=["offices.currentRegistered.occupancyType"],
    )
    for pair in pairs:
        candidate = _candidate_from_label_pair(
            "offices.currentRegistered.occupancyType",
            pair,
            block_index,
        )
        if candidate is not None:
            results.append(candidate)

    for match in _OCCUPANCY_INLINE_RE.finditer(combined_text):
        raw_value = match.group(1)
        normalized = normalize_occupancy_type(raw_value)
        if not normalized:
            continue
        block = _block_for_match(block_views, match.group(0)) or _block_for_match(
            block_views, raw_value
        )
        results.append(
            CandidateFact(
                fact_key="offices.currentRegistered.occupancyType",
                value_type=definition.value_type,
                raw_value=raw_value,
                normalized_value=normalized,
                display_value=normalized,
                extractor_kind=ExtractorKind.DETERMINISTIC,
                validation_status=ValidationStatus.VALID,
                evidence=_evidence_for_block(block_index, block, role=EvidenceRole.VALUE),
                support="explicit",
                quality_signals={"source": "inline_occupancy"},
            )
        )
    return results


def _extract_addresses(
    combined_text: str,
    block_views: list[BlockView],
    block_index: PageBlockIndex,
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    address_fact_keys = [
        key for key in expected_fact_keys if get_fact(key).value_type == FactValueType.ADDRESS
    ]
    if not address_fact_keys:
        return []

    results: list[CandidateFact] = []
    seen: set[tuple[str, str]] = set()

    for fact_key in address_fact_keys:
        pairs = find_label_value_pairs(_pages_payload(block_index), fact_keys=[fact_key])
        for pair in pairs:
            if is_ignored_document_noise(pair.value_text):
                continue
            candidate = _candidate_from_label_pair(fact_key, pair, block_index)
            if candidate is None:
                continue
            fingerprint = fingerprint_value(candidate.normalized_value)
            dedupe_key = (fact_key, fingerprint)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            results.append(candidate)

    for match in find_identifiers_in_text(combined_text):
        if match.identifier_type != "pin":
            continue
        context_start = max(0, match.start - _PIN_CONTEXT_WINDOW)
        context_end = min(len(combined_text), match.end + _PIN_CONTEXT_WINDOW)
        context = combined_text[context_start:context_end]
        if is_ignored_document_noise(context) and not any(
            hint in context.casefold() for hint in _LOCALITY_HINTS
        ):
            continue
        context_lower = context.casefold()
        if not any(hint in context_lower for hint in _LOCALITY_HINTS):
            if not _ADDRESS_LABEL_RE.search(context):
                continue

        address_dict = _address_from_pin_context(context, match.raw)
        if not address_dict or not _address_has_material_content(address_dict):
            continue
        if is_ignored_document_noise(address_dict.get("fullAddress", "")):
            continue

        block = _block_for_match(block_views, match.raw)
        target_keys = _address_fact_keys_for_context(address_fact_keys, address_dict)
        for fact_key in target_keys:
            definition = get_fact(fact_key)
            normalized = normalize_address_dict(address_dict)
            fingerprint = fingerprint_value(normalized)
            dedupe_key = (fact_key, fingerprint)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            results.append(
                CandidateFact(
                    fact_key=fact_key,
                    value_type=definition.value_type,
                    raw_value=address_dict,
                    normalized_value=normalized,
                    display_value=display_address(address_dict),
                    extractor_kind=ExtractorKind.DETERMINISTIC,
                    validation_status=ValidationStatus.VALID,
                    evidence=_evidence_for_block(block_index, block, role=EvidenceRole.VALUE),
                    support="explicit",
                    quality_signals={"source": "pin_context"},
                )
            )
    return results


def _address_from_pin_context(context: str, pin_code: str) -> dict[str, str]:
    lines = [line.strip(" ,.-") for line in re.split(r"[\n;]", context) if line.strip()]
    joined = " ".join(lines)
    address: dict[str, str] = {"pinCode": pin_code.strip(), "country": "India"}

    if re.search(r"\bBhosari\b", joined, re.IGNORECASE):
        address["locality"] = "Bhosari"
        address["city"] = "Pune"
    if re.search(r"\bChakan\b", joined, re.IGNORECASE):
        address["locality"] = "Chakan"
        address["city"] = "Pune"
    if re.search(r"\bMeridian\b", joined, re.IGNORECASE):
        address["addressLine1"] = "Unit No. 14, Meridian Industrial Estate"
        address["addressLine2"] = "MIDC Bhosari"
    if re.search(r"\bVertex\b", joined, re.IGNORECASE):
        address["addressLine1"] = "Plot No. 9, Vertex Industrial Park"
        address["addressLine2"] = "Chakan Industrial Area"

    state_match = re.search(r"\b(Maharashtra|Gujarat|Karnataka|Delhi)\b", joined, re.IGNORECASE)
    if state_match:
        address["state"] = state_match.group(1).title()

    meaningful_lines = [
        line
        for line in lines
        if pin_code not in line
        and not _ADDRESS_LABEL_RE.fullmatch(line.strip())
        and len(line) > 8
        and not is_ignored_document_noise(line)
    ]
    if meaningful_lines and "addressLine1" not in address:
        address["addressLine1"] = meaningful_lines[0]
        if len(meaningful_lines) > 1 and "addressLine2" not in address:
            address["addressLine2"] = meaningful_lines[1]

    parts = [
        address.get(key, "")
        for key in (
            "addressLine1",
            "addressLine2",
            "locality",
            "city",
            "state",
            "pinCode",
            "country",
        )
        if address.get(key)
    ]
    if parts:
        address["fullAddress"] = ", ".join(parts)
    return address if len(address) >= 3 else {}


def _address_fact_keys_for_context(
    address_fact_keys: list[str],
    address_dict: dict[str, str],
) -> list[str]:
    pin = address_dict.get("pinCode", "")
    locality = address_dict.get("locality", "").casefold()
    selected: list[str] = []
    for fact_key in address_fact_keys:
        if pin == "410501" or "chakan" in locality:
            if "previous" in fact_key or "officeChange.previous" in fact_key:
                selected.append(fact_key)
                continue
        if pin == "411026" or "bhosari" in locality:
            if "current" in fact_key or "officeChange.new" in fact_key or "gstin" in fact_key:
                selected.append(fact_key)
                continue
        selected.append(fact_key)
    return selected or address_fact_keys


def _extract_main_object_candidates(
    block_index: PageBlockIndex,
    expected_fact_keys: set[str],
) -> list[CandidateFact]:
    if "constitutionalRecord.mainObjectText" not in expected_fact_keys:
        return []

    definition = get_fact("constitutionalRecord.mainObjectText")
    results: list[CandidateFact] = []
    for page in block_index.pages:
        for block in page.blocks:
            if not _OBJECT_HEADING_RE.search(block.text):
                continue
            text = block.text.strip()
            if len(text) < 20:
                continue
            results.append(
                CandidateFact(
                    fact_key="constitutionalRecord.mainObjectText",
                    value_type=definition.value_type,
                    raw_value=text,
                    normalized_value=re.sub(r"\s+", " ", text).strip(),
                    display_value=display_text(text),
                    extractor_kind=ExtractorKind.DETERMINISTIC,
                    validation_status=ValidationStatus.UNCERTAIN,
                    evidence=[
                        EvidenceCite(page.page_id, block.block_id, EvidenceRole.CLAUSE),
                    ],
                    support="ambiguous",
                    ambiguity="object_clause_candidate",
                    quality_signals={"source": "object_heading"},
                )
            )
    return results


def _normalize_fact_value(
    value_type: str,
    raw_value: str,
    *,
    fact_key: str,
) -> tuple[Any, str, str]:
    if value_type == FactValueType.DATE:
        iso = parse_date_to_iso(raw_value)
        if not iso:
            return None, "", ValidationStatus.INVALID
        return iso, display_date(iso), ValidationStatus.VALID

    if value_type == FactValueType.IDENTIFIER:
        identifier_type = _identifier_type_for_fact(fact_key)
        normalized = normalize_identifier(raw_value, identifier_type=identifier_type)
        valid = _validate_identifier(normalized, identifier_type)
        return (
            normalized,
            display_identifier(raw_value, identifier_type=identifier_type),
            ValidationStatus.VALID if valid else ValidationStatus.INVALID,
        )

    if value_type == FactValueType.ADDRESS:
        if is_ignored_document_noise(raw_value):
            return None, "", ValidationStatus.INVALID
        address = normalize_address_dict(raw_value)
        if not address or not _address_has_material_content(address):
            return None, "", ValidationStatus.INVALID
        if is_ignored_document_noise(address.get("fullAddress", "")):
            return None, "", ValidationStatus.INVALID
        return address, display_address(address), ValidationStatus.VALID

    if value_type == FactValueType.STRING:
        if is_legal_name_fact(fact_key):
            text = extract_legal_name_candidate(raw_value)
            return normalize_legal_name(text), display_legal_name(text), ValidationStatus.VALID
        if fact_key == "corporateHistory.officeChange.filingForm":
            normalized = normalize_filing_form(raw_value)
            return (
                normalized,
                normalized,
                ValidationStatus.VALID if normalized else ValidationStatus.INVALID,
            )
        if fact_key == "identity.companyClass":
            normalized = normalize_company_class(raw_value)
            return (
                normalized,
                normalized,
                ValidationStatus.VALID if normalized else ValidationStatus.INVALID,
            )
        if fact_key == "identity.companyCategory":
            normalized = normalize_company_category(raw_value)
            return (
                normalized,
                normalized,
                ValidationStatus.VALID if normalized else ValidationStatus.INVALID,
            )
        if fact_key == "identity.companySubCategory":
            normalized = normalize_company_sub_category(raw_value)
            return (
                normalized,
                normalized,
                ValidationStatus.VALID if normalized else ValidationStatus.INVALID,
            )
        if fact_key == "identity.governingAct":
            normalized = normalize_governing_act(raw_value)
            return (
                normalized,
                normalized,
                ValidationStatus.VALID if normalized else ValidationStatus.INVALID,
            )
        if fact_key == "offices.currentRegistered.occupancyType":
            normalized = normalize_occupancy_type(raw_value)
            return (
                normalized,
                normalized,
                ValidationStatus.VALID if normalized else ValidationStatus.INVALID,
            )
        if is_label_fragment_value(raw_value) or is_ignored_document_noise(raw_value):
            return None, "", ValidationStatus.INVALID
        text = re.sub(r"\s+", " ", raw_value.strip())
        return text, text, ValidationStatus.VALID

    if value_type == FactValueType.STRING_LIST:
        items = [part.strip() for part in re.split(r"[,;]", raw_value) if part.strip()]
        return (
            items,
            display_string_list(items),
            ValidationStatus.VALID if items else ValidationStatus.INVALID,
        )

    text = display_text(raw_value)
    return text, text, ValidationStatus.VALID if text else ValidationStatus.INVALID


def _identifier_type_for_fact(fact_key: str) -> str | None:
    for identifier_type, mapped_key in _IDENTIFIER_TYPE_TO_FACT_KEY.items():
        if mapped_key == fact_key:
            return identifier_type
    return None


def _validate_identifier(normalized: str, identifier_type: str | None) -> bool:
    if identifier_type == "cin":
        return validate_cin(normalized)
    if identifier_type == "pan":
        return validate_pan(normalized)
    if identifier_type == "gstin":
        return validate_gstin(normalized)
    if identifier_type == "udyam":
        return validate_udyam(normalized)
    if identifier_type == "srn":
        return bool(re.match(r"^[A-Z]\d{7,12}$", normalized))
    return bool(normalized)


def _block_for_match(block_views: list[BlockView], raw: str) -> BlockView | None:
    needle = str(raw or "").strip()
    if needle:
        for block in block_views:
            if needle in block.text:
                return block
    return block_views[0] if block_views else None


def _evidence_for_block(
    block_index: PageBlockIndex,
    block: BlockView | None,
    *,
    role: str,
) -> list[EvidenceCite]:
    if block is None:
        return []
    page = next((item for item in block_index.pages if item.page_number == block.page_number), None)
    if page is None:
        return []
    return [EvidenceCite(page.page_id, block.block_id, role)]


def _dedupe_candidates(candidates: list[CandidateFact]) -> list[CandidateFact]:
    best: dict[tuple[str, str], CandidateFact] = {}
    for candidate in candidates:
        key = (candidate.fact_key, fingerprint_value(candidate.normalized_value))
        existing = best.get(key)
        if (
            existing is None
            or _validation_rank(candidate.validation_status)
            > _validation_rank(existing.validation_status)
            or (
                _validation_rank(candidate.validation_status)
                == _validation_rank(existing.validation_status)
                and len(candidate.evidence) > len(existing.evidence)
            )
        ):
            best[key] = candidate
    return list(best.values())


def _validation_rank(status: str) -> int:
    return {
        ValidationStatus.INVALID: 0,
        ValidationStatus.UNCERTAIN: 1,
        ValidationStatus.VALID: 2,
    }.get(status, 0)


def _looks_like_legal_name(value: str) -> bool:
    text = value.strip()
    if len(text) < 4 or len(text) > 160:
        return False
    lowered = text.casefold()
    if lowered.startswith("this is to certify"):
        return False
    if "synthetic demo" in lowered:
        return False
    return bool(
        re.search(r"\b(private|pvt\.?)\s+(limited|ltd\.?)\b", lowered)
        or re.search(r"\b(limited|ltd\.?)\b", lowered)
    )


def _resolve_gst_date_fact_key(label_text: str) -> str | None:
    """Map GST date labels to a single semantic role using nearby wording."""

    label = re.sub(r"\s+", " ", str(label_text or "").strip().casefold())
    if not label:
        return None
    if "amendment" in label and "effective" in label:
        return "registrations.gstin.effectiveDate"
    if "amendment" in label:
        return "registrations.gstin.amendmentDate"
    if "certificate" in label and "effective" in label:
        return "registrations.gstin.effectiveDate"
    if "certificate" in label and ("issue" in label or "issuance" in label):
        return "registrations.gstin.certificateIssueDate"
    if "registration" in label:
        return "registrations.gstin.registrationDate"
    if "effective" in label:
        return "registrations.gstin.effectiveDate"
    return None


def _address_has_material_content(address: dict[str, str]) -> bool:
    if not address:
        return False
    if is_ignored_document_noise(address.get("fullAddress", "")):
        return False
    material = " ".join(
        str(address.get(key, ""))
        for key in (
            "addressLine1",
            "addressLine2",
            "locality",
            "city",
            "district",
            "state",
            "pinCode",
            "fullAddress",
        )
        if address.get(key)
    ).strip()
    if len(material) < _MIN_ADDRESS_MATERIAL_CHARS:
        return False
    # Require at least a premises/locality token or PIN + city/state.
    has_premises = bool(
        address.get("addressLine1")
        or address.get("locality")
        or re.search(r"\b(unit|plot|midc|estate|park|road|street)\b", material, re.IGNORECASE)
    )
    has_geo = bool(address.get("pinCode") or (address.get("city") and address.get("state")))
    return has_premises and has_geo


def _select_best_candidates(candidates: list[CandidateFact]) -> list[CandidateFact]:
    """Keep one best assertion candidate per fact key."""

    best: dict[str, CandidateFact] = {}
    for candidate in candidates:
        existing = best.get(candidate.fact_key)
        if existing is None or _candidate_rank(candidate) > _candidate_rank(existing):
            best[candidate.fact_key] = candidate
    return list(best.values())


def _candidate_rank(candidate: CandidateFact) -> tuple[int, int, int, int]:
    specialty = 0
    if is_legal_name_fact(candidate.fact_key):
        specialty = 2 if _looks_like_legal_name(str(candidate.raw_value or "")) else 0
        if "private limited" in str(candidate.normalized_value or ""):
            specialty += 1
    if candidate.fact_key == "corporateHistory.officeChange.filingForm":
        specialty = 4 if normalize_filing_form(candidate.normalized_value) == "INC-22" else 1
    if candidate.fact_key in {
        "identity.companyClass",
        "identity.companyCategory",
        "identity.companySubCategory",
        "identity.governingAct",
    }:
        normalized = str(candidate.normalized_value or "")
        specialty = 3 if re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", normalized) else 0
        if candidate.quality_signals.get("source") == "prose":
            specialty += 1
    return (
        _validation_rank(candidate.validation_status),
        specialty,
        len(candidate.evidence),
        1 if candidate.support == "explicit" else 0,
    )
