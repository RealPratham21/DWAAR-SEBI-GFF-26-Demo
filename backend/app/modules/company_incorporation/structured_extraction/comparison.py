"""Compare extracted document facts against Information-tab values."""

from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

from app.modules.company_incorporation.structured_extraction.constants import (
    ComparisonStatus,
    ComparisonStrategy,
    IssueSeverity,
    IssueType,
)
from app.modules.company_incorporation.structured_extraction.normalize import (
    fingerprint_value,
    normalize_address_dict,
    normalize_company_category,
    normalize_company_class,
    normalize_company_sub_category,
    normalize_governing_act,
    normalize_identifier,
    normalize_legal_name,
    parse_date_to_iso,
)
from app.modules.company_incorporation.structured_extraction.registry import (
    get_fact,
    get_information_value,
)
from app.modules.company_incorporation.structured_extraction.types import CandidateFact

_HISTORICAL_PINS = {"410501"}
_CURRENT_PINS = {"411026"}
_HISTORICAL_LOCALITIES = {"chakan"}
_CURRENT_LOCALITIES = {"bhosari"}


def compare_assertion(
    fact_key: str,
    normalized_doc_value: Any,
    payload: Mapping[str, Any],
) -> tuple[str, str | None]:
    """Compare a document-normalized value to the Information tab."""

    definition = get_fact(fact_key)
    information_value = get_information_value(payload, fact_key)
    if information_value in (None, "", {}, []):
        return ComparisonStatus.NO_INFORMATION, None

    strategy = definition.comparison_strategy
    if strategy == ComparisonStrategy.EXACT_IDENTIFIER:
        return _compare_exact_identifier(normalized_doc_value, information_value)
    if strategy == ComparisonStrategy.LEGAL_NAME:
        return _compare_legal_name(normalized_doc_value, information_value)
    if strategy == ComparisonStrategy.DATE:
        return _compare_date(normalized_doc_value, information_value)
    if strategy == ComparisonStrategy.ADDRESS:
        return _compare_address(normalized_doc_value, information_value, fact_key)
    if strategy == ComparisonStrategy.STRING_LIST:
        return _compare_string_list(normalized_doc_value, information_value)
    if fact_key in {
        "identity.companyClass",
        "identity.companyCategory",
        "identity.companySubCategory",
        "identity.governingAct",
    }:
        return _compare_enum_like(fact_key, normalized_doc_value, information_value)
    return _compare_text(normalized_doc_value, information_value)


def build_issues_for_workspace(
    *,
    payload: Mapping[str, Any],
    requirement_key: str,
    merged_candidates: list[CandidateFact],
    missing_fact_keys: list[str],
    disagreements: list[dict[str, Any]],
    low_quality: list[tuple[CandidateFact, float, str]],
) -> list[dict[str, Any]]:
    """Build in-memory issue descriptors from comparison and extraction outcomes."""

    issues: list[dict[str, Any]] = []
    candidates_by_key = {candidate.fact_key: candidate for candidate in merged_candidates}

    for fact_key in missing_fact_keys:
        definition = get_fact(fact_key)
        if not definition.absence_creates_issue:
            continue
        issues.append(
            _issue_descriptor(
                issue_type=IssueType.MISSING_EXPECTED_FACT,
                fact_key=fact_key,
                severity=IssueSeverity.WARNING
                if not definition.may_block_disclosure
                else IssueSeverity.BLOCKING,
                summary=f"Expected fact '{definition.display_label}' was not extracted.",
                requirement_key=requirement_key,
                information_value=get_information_value(payload, fact_key),
            )
        )

    for candidate in merged_candidates:
        if candidate.validation_status == "invalid" and candidate.value_type == "identifier":
            issues.append(
                _issue_descriptor(
                    issue_type=IssueType.INVALID_IDENTIFIER,
                    fact_key=candidate.fact_key,
                    severity=IssueSeverity.BLOCKING,
                    summary=f"Invalid identifier extracted for {candidate.fact_key}.",
                    requirement_key=requirement_key,
                    document_value=candidate.normalized_value,
                    information_value=get_information_value(payload, candidate.fact_key),
                )
            )
            continue

        status, hint = compare_assertion(
            candidate.fact_key,
            candidate.normalized_value,
            payload,
        )
        if status == ComparisonStatus.MATCHED:
            continue
        if status == ComparisonStatus.NO_INFORMATION:
            continue
        if status == ComparisonStatus.POSSIBLE_HISTORICAL:
            issues.append(
                _issue_descriptor(
                    issue_type=IssueType.POSSIBLE_HISTORICAL_VALUE,
                    fact_key=candidate.fact_key,
                    severity=IssueSeverity.INFO,
                    summary=hint or "Document value may reflect a historical record.",
                    requirement_key=requirement_key,
                    document_value=candidate.normalized_value,
                    information_value=get_information_value(payload, candidate.fact_key),
                    comparison_status=status,
                )
            )
            continue
        if status == ComparisonStatus.CONFLICTING:
            severity = (
                IssueSeverity.BLOCKING
                if get_fact(candidate.fact_key).may_block_disclosure
                else IssueSeverity.WARNING
            )
            issues.append(
                _issue_descriptor(
                    issue_type=IssueType.CONFLICTING_VALUE,
                    fact_key=candidate.fact_key,
                    severity=severity,
                    summary=hint or "Document value conflicts with Information tab.",
                    requirement_key=requirement_key,
                    document_value=candidate.normalized_value,
                    information_value=get_information_value(payload, candidate.fact_key),
                    comparison_status=status,
                )
            )
            continue
        if status == ComparisonStatus.EXTRACTOR_DISAGREEMENT:
            issues.append(
                _issue_descriptor(
                    issue_type=IssueType.EXTRACTOR_DISAGREEMENT,
                    fact_key=candidate.fact_key,
                    severity=IssueSeverity.WARNING,
                    summary=hint or "Extractors disagreed on this fact.",
                    requirement_key=requirement_key,
                    document_value=candidate.normalized_value,
                    information_value=get_information_value(payload, candidate.fact_key),
                    comparison_status=status,
                )
            )
            continue
        issues.append(
            _issue_descriptor(
                issue_type=IssueType.CLARIFICATION_REQUIRED,
                fact_key=candidate.fact_key,
                severity=IssueSeverity.WARNING,
                summary=hint or "Manual clarification required.",
                requirement_key=requirement_key,
                document_value=candidate.normalized_value,
                information_value=get_information_value(payload, candidate.fact_key),
                comparison_status=status,
            )
        )

    for disagreement in disagreements:
        fact_key = str(disagreement.get("fact_key") or "")
        if not fact_key or fact_key in candidates_by_key:
            continue
        issues.append(
            _issue_descriptor(
                issue_type=IssueType.EXTRACTOR_DISAGREEMENT,
                fact_key=fact_key,
                severity=IssueSeverity.WARNING,
                summary="Deterministic and semantic extractors disagreed.",
                requirement_key=requirement_key,
                document_value=disagreement.get("semantic_value"),
                information_value=get_information_value(payload, fact_key),
                metadata=disagreement,
            )
        )

    for candidate, score, category in low_quality:
        if category in {"high", "medium"}:
            continue
        issues.append(
            _issue_descriptor(
                issue_type=IssueType.LOW_EXTRACTION_QUALITY,
                fact_key=candidate.fact_key,
                severity=IssueSeverity.INFO,
                summary=f"Low extraction quality ({category}, score={score:.2f}).",
                requirement_key=requirement_key,
                document_value=candidate.normalized_value,
                information_value=get_information_value(payload, candidate.fact_key),
                metadata={"quality_score": score, "quality_category": category},
            )
        )

    return _dedupe_issues(issues)


def _compare_exact_identifier(doc_value: Any, info_value: Any) -> tuple[str, str | None]:
    doc_norm = normalize_identifier(doc_value)
    info_norm = normalize_identifier(info_value)
    if not doc_norm:
        return ComparisonStatus.NO_INFORMATION, None
    if not info_norm:
        return ComparisonStatus.NO_INFORMATION, None
    if doc_norm == info_norm:
        return ComparisonStatus.MATCHED, None
    return ComparisonStatus.CONFLICTING, "Identifier values do not match."


def _compare_legal_name(doc_value: Any, info_value: Any) -> tuple[str, str | None]:
    doc_norm = normalize_legal_name(doc_value)
    info_norm = normalize_legal_name(info_value)
    if not doc_norm or not info_norm:
        return ComparisonStatus.NO_INFORMATION, None
    if doc_norm == info_norm:
        return ComparisonStatus.MATCHED, None
    return ComparisonStatus.CONFLICTING, "Legal names differ materially."


def _compare_date(doc_value: Any, info_value: Any) -> tuple[str, str | None]:
    doc_iso = parse_date_to_iso(doc_value) or str(doc_value or "").strip()
    info_iso = parse_date_to_iso(info_value) or str(info_value or "").strip()
    if not doc_iso or not info_iso:
        return ComparisonStatus.NO_INFORMATION, None
    if doc_iso == info_iso:
        return ComparisonStatus.MATCHED, None
    return ComparisonStatus.CONFLICTING, "Dates do not match."


def _compare_address(
    doc_value: Any,
    info_value: Any,
    fact_key: str,
) -> tuple[str, str | None]:
    doc_addr = normalize_address_dict(doc_value)
    info_addr = normalize_address_dict(info_value)
    if not doc_addr:
        return ComparisonStatus.NO_INFORMATION, None
    if not info_addr:
        return ComparisonStatus.NO_INFORMATION, None

    if fingerprint_value(doc_addr) == fingerprint_value(info_addr):
        return ComparisonStatus.MATCHED, None

    doc_pin = doc_addr.get("pinCode", "")
    info_pin = info_addr.get("pinCode", "")
    doc_locality = doc_addr.get("locality", doc_addr.get("city", ""))
    info_locality = info_addr.get("locality", info_addr.get("city", ""))

    if _is_formatting_only_difference(doc_addr, info_addr):
        return ComparisonStatus.MATCHED, None

    if _looks_historical(doc_addr, info_addr):
        return (
            ComparisonStatus.POSSIBLE_HISTORICAL,
            "Document address matches historical office location (e.g. Chakan/410501).",
        )

    if doc_pin and info_pin and doc_pin != info_pin:
        return (
            ComparisonStatus.CONFLICTING,
            "PIN codes differ between document and Information tab.",
        )

    if doc_locality and info_locality and doc_locality != info_locality:
        if _is_current_premises_conflict(doc_addr, info_addr, fact_key):
            return (
                ComparisonStatus.CONFLICTING,
                "Document appears to describe different current premises.",
            )

    if doc_addr.get("fullAddress") and info_addr.get("fullAddress"):
        if doc_addr["fullAddress"] != info_addr["fullAddress"]:
            return ComparisonStatus.CONFLICTING, "Addresses differ materially."

    return ComparisonStatus.CONFLICTING, "Address comparison requires review."


def _compare_string_list(doc_value: Any, info_value: Any) -> tuple[str, str | None]:
    doc_items = _as_string_list(doc_value)
    info_items = _as_string_list(info_value)
    if not doc_items or not info_items:
        return ComparisonStatus.NO_INFORMATION, None
    if doc_items == info_items:
        return ComparisonStatus.MATCHED, None
    return ComparisonStatus.CONFLICTING, "Clause lists differ."


def _compare_text(doc_value: Any, info_value: Any) -> tuple[str, str | None]:
    doc_text = _normalize_text(doc_value)
    info_text = _normalize_text(info_value)
    if not doc_text or not info_text:
        return ComparisonStatus.NO_INFORMATION, None
    if doc_text == info_text:
        return ComparisonStatus.MATCHED, None
    if doc_text in info_text or info_text in doc_text:
        return ComparisonStatus.MATCHED, None
    return ComparisonStatus.CONFLICTING, "Text values differ; clarification may be required."


def _compare_enum_like(
    fact_key: str,
    doc_value: Any,
    info_value: Any,
) -> tuple[str, str | None]:
    normalisers = {
        "identity.companyClass": normalize_company_class,
        "identity.companyCategory": normalize_company_category,
        "identity.companySubCategory": normalize_company_sub_category,
        "identity.governingAct": normalize_governing_act,
    }
    normaliser = normalisers[fact_key]
    doc_norm = normaliser(doc_value)
    info_norm = normaliser(info_value)
    if not doc_norm or not info_norm:
        return ComparisonStatus.NO_INFORMATION, None
    if doc_norm == info_norm:
        return ComparisonStatus.MATCHED, None
    return ComparisonStatus.CONFLICTING, "Coded values differ."


def _looks_historical(doc_addr: dict[str, str], info_addr: dict[str, str]) -> bool:
    doc_blob = " ".join(str(value) for value in doc_addr.values()).casefold()
    info_blob = " ".join(str(value) for value in info_addr.values()).casefold()
    doc_pin = doc_addr.get("pinCode", "")
    info_pin = info_addr.get("pinCode", "")

    doc_is_historical = doc_pin in _HISTORICAL_PINS or any(
        token in doc_blob for token in _HISTORICAL_LOCALITIES
    )
    info_is_current = info_pin in _CURRENT_PINS or any(
        token in info_blob for token in _CURRENT_LOCALITIES
    )
    return doc_is_historical and info_is_current


def _is_current_premises_conflict(
    doc_addr: dict[str, str],
    info_addr: dict[str, str],
    fact_key: str,
) -> bool:
    if "current" not in fact_key and "officeChange.new" not in fact_key:
        return False
    doc_pin = doc_addr.get("pinCode", "")
    info_pin = info_addr.get("pinCode", "")
    if doc_pin and info_pin and doc_pin != info_pin:
        return True
    doc_city = doc_addr.get("city", "").casefold()
    info_city = info_addr.get("city", "").casefold()
    return bool(doc_city and info_city and doc_city != info_city)


def _is_formatting_only_difference(
    doc_addr: dict[str, str],
    info_addr: dict[str, str],
) -> bool:
    keys = (
        "addressLine1",
        "addressLine2",
        "locality",
        "city",
        "district",
        "state",
        "pinCode",
        "country",
    )
    doc_parts = [_normalize_text(doc_addr.get(key, "")) for key in keys]
    info_parts = [_normalize_text(info_addr.get(key, "")) for key in keys]
    return doc_parts == info_parts


def _as_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [re.sub(r"\s+", " ", str(item).strip()) for item in value if str(item).strip()]
    text = str(value or "").strip()
    if not text:
        return []
    return [part.strip() for part in re.split(r"[,;]", text) if part.strip()]


def _normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def _issue_descriptor(
    *,
    issue_type: str,
    fact_key: str,
    severity: str,
    summary: str,
    requirement_key: str,
    document_value: Any = None,
    information_value: Any = None,
    comparison_status: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    fingerprint_payload = {
        "issue_type": issue_type,
        "fact_key": fact_key,
        "requirement_key": requirement_key,
        "document_value": document_value,
        "information_value": information_value,
        "comparison_status": comparison_status,
    }
    return {
        "issue_type": issue_type,
        "fact_key": fact_key,
        "severity": severity,
        "summary": summary,
        "requirement_key": requirement_key,
        "document_value": document_value,
        "information_value": information_value,
        "comparison_status": comparison_status,
        "issue_fingerprint": fingerprint_value(fingerprint_payload),
        "metadata": metadata or {},
    }


def _dedupe_issues(issues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for issue in issues:
        fingerprint = issue.get("issue_fingerprint")
        if fingerprint in seen:
            continue
        seen.add(str(fingerprint))
        unique.append(issue)
    return unique
