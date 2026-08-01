#!/usr/bin/env python3
"""Validate Nivara Techfab fixture ground truth, manifests, and generated artifacts."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

import fitz

from fixture_lib import (
    FIXTURE_ROOT,
    MAX_UPLOAD_BYTES,
    WATERMARK_TEXT,
    build_template_context,
    category_output_dir,
    enrich_ground_truth,
    format_full_address,
    format_office_expected,
    load_document_manifests,
    load_json,
    load_requirement_keys,
    office_block_from_ground_truth,
    output_paths,
    resolve_expected_value,
    sha256_file,
    validate_identifier_formats,
)


REQUIRED_MANIFEST_FIELDS = {
    "fixtureDocumentId",
    "outputFilename",
    "requirementKey",
    "outputCategory",
    "documentTitle",
    "expectedExtractedFacts",
}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def page_count_matches(expected: Any, actual: int) -> bool:
    if isinstance(expected, int):
        return actual == expected
    if isinstance(expected, dict):
        return expected.get("min", 0) <= actual <= expected.get("max", actual)
    return True


def extract_pdf_text(path: Path) -> str:
    doc = fitz.open(path)
    try:
        return "\n".join(page.get_text("text") for page in doc)
    finally:
        doc.close()


def extract_pdf_page_text(path: Path, page_number: int) -> str:
    doc = fitz.open(path)
    try:
        index = page_number - 1
        if index < 0 or index >= doc.page_count:
            return ""
        return doc.load_page(index).get_text("text")
    finally:
        doc.close()


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().lower()


def text_contains_value(haystack: str, needle: str) -> bool:
    if not needle:
        return True
    return normalize_text(needle) in normalize_text(haystack)


def meaningful_native_text(text: str) -> bool:
    cleaned = re.sub(r"\s+", "", text)
    return len(cleaned) >= 40


def display_value_for_fact(ground_truth: dict[str, Any], fact_key: str, raw: Any) -> str:
    labels = ground_truth.get("displayLabels", {})
    display_map = {
        "identity.companyClass": labels.get("companyClass"),
        "identity.companyCategory": labels.get("companyCategory"),
        "identity.companySubCategory": labels.get("companySubCategory"),
        "identity.governingAct": labels.get("governingAct"),
        "offices.current.occupancyType": labels.get("occupancyType"),
        "registrations.gstin.status": labels.get("gstStatus"),
    }
    if fact_key in display_map and display_map[fact_key]:
        return str(display_map[fact_key])
    if isinstance(raw, list):
        return ", ".join(str(item) for item in raw)
    return format_office_expected(raw)


def expected_value_strings(ground_truth: dict[str, Any], fact: dict[str, Any]) -> list[str]:
    values: list[str] = []
    fact_key = fact.get("factKey", "")
    if "expectedValue" in fact:
        values.append(display_value_for_fact(ground_truth, fact_key, fact["expectedValue"]))
    if "expectedValueRef" in fact:
        resolved = resolve_expected_value(ground_truth, fact["expectedValueRef"])
        values.append(display_value_for_fact(ground_truth, fact_key, resolved))
    return [value for value in values if value]


def validate_ground_truth(errors: list[str]) -> dict[str, Any]:
    path = FIXTURE_ROOT / "ground-truth.json"
    if not path.exists():
        fail(errors, "Missing ground-truth.json")
        return {}
    ground_truth = load_json(path)
    required_roots = {
        "fixtureId",
        "informationTab",
        "documentReferences",
        "canonicalCurrentFacts",
        "historicalFacts",
        "displayLabels",
    }
    for key in required_roots:
        if key not in ground_truth:
            fail(errors, f"ground-truth.json missing root key: {key}")

    for message in validate_identifier_formats(ground_truth):
        fail(errors, message)

    identity = ground_truth["informationTab"]["identity"]
    canonical = ground_truth["canonicalCurrentFacts"]
    if identity["legalName"] != canonical["identity.legalName"]:
        fail(errors, "Canonical legal name mismatch with informationTab.identity.legalName")

    return ground_truth


def validate_manifests(errors: list[str], ground_truth: dict[str, Any]) -> list[dict[str, Any]]:
    requirement_keys = load_requirement_keys()
    manifests = load_document_manifests()
    if len(manifests) != 13:
        fail(errors, f"Expected 13 document manifests, found {len(manifests)}")

    seen_ids: set[str] = set()
    seen_filenames: set[str] = set()
    for manifest in manifests:
        missing = REQUIRED_MANIFEST_FIELDS - set(manifest)
        if missing:
            fail(errors, f"{manifest.get('fixtureDocumentId', '?')}: missing fields {sorted(missing)}")

        doc_id = manifest["fixtureDocumentId"]
        filename = manifest["outputFilename"]
        if doc_id in seen_ids:
            fail(errors, f"Duplicate fixtureDocumentId: {doc_id}")
        if filename in seen_filenames:
            fail(errors, f"Duplicate outputFilename: {filename}")
        seen_ids.add(doc_id)
        seen_filenames.add(filename)

        if manifest["requirementKey"] not in requirement_keys:
            fail(errors, f"{doc_id}: unknown requirement key {manifest['requirementKey']}")

        if manifest.get("templateName"):
            template_path = FIXTURE_ROOT / "templates" / manifest["templateName"]
            if not template_path.exists():
                fail(errors, f"{doc_id}: missing template {manifest['templateName']}")
            try:
                build_template_context(ground_truth, manifest)
            except Exception as exc:  # noqa: BLE001 - report template merge failures
                fail(errors, f"{doc_id}: template context failed: {exc}")

    gst_current = next(m for m in manifests if m["fixtureDocumentId"] == "09-gst-registration-current")
    gst_old = next(m for m in manifests if m["fixtureDocumentId"] == "11-gst-registration-old-address")
    if gst_current["templateName"] != gst_old["templateName"]:
        fail(errors, "GST current and historical manifests must share the same template")

    return manifests


def validate_generated_artifacts(
    errors: list[str],
    ground_truth: dict[str, Any],
    manifests: list[dict[str, Any]],
) -> None:
    paths = output_paths()
    enriched = enrich_ground_truth(ground_truth)
    current_office = enriched["canonicalFacts"]["registeredOffice"]["formattedSingleLine"]
    original_office = enriched["historicalFacts"]["registeredOffices"]["original"]["formattedSingleLine"]

    for manifest in manifests:
        if manifest["outputCategory"] == "quality-stress" and not manifest.get("sourceCleanFilename"):
            continue
        if manifest.get("sourceCleanFilename") and not manifest.get("templateName"):
            output_path = category_output_dir(manifest["outputCategory"]) / manifest["outputFilename"]
        elif manifest.get("templateName"):
            output_path = category_output_dir(manifest["outputCategory"]) / manifest["outputFilename"]
        else:
            continue

        doc_id = manifest["fixtureDocumentId"]
        if not output_path.exists():
            fail(errors, f"{doc_id}: missing generated file {output_path.relative_to(FIXTURE_ROOT)}")
            continue

        size = output_path.stat().st_size
        if size > MAX_UPLOAD_BYTES:
            fail(errors, f"{doc_id}: file exceeds 20 MB upload limit ({size} bytes)")

        if output_path.suffix.lower() == ".pdf":
            doc = fitz.open(output_path)
            try:
                page_count = doc.page_count
            finally:
                doc.close()
            if not page_count_matches(manifest.get("expectedPageCount"), page_count):
                fail(
                    errors,
                    f"{doc_id}: expected page count {manifest.get('expectedPageCount')}, got {page_count}",
                )

            full_text = extract_pdf_text(output_path)
            if manifest.get("expectedNativeText") is True:
                if not meaningful_native_text(full_text):
                    fail(errors, f"{doc_id}: expected searchable native text but text layer is weak")
                for fact in manifest.get("expectedExtractedFacts", []):
                    for expected in expected_value_strings(ground_truth, fact):
                        page_text = extract_pdf_page_text(output_path, fact.get("evidencePage", 1))
                        searchable = f"{page_text}\n{full_text}"
                        if not text_contains_value(page_text, expected) and not text_contains_value(searchable, expected):
                            fail(
                                errors,
                                f"{doc_id}: expected value '{expected}' for {fact.get('factKey')} not found in PDF",
                            )

            if manifest.get("expectedNativeText") is False and doc_id == "12-coi-scanned-variant":
                if meaningful_native_text(full_text):
                    fail(errors, f"{doc_id}: scanned COI should not have meaningful native text")
            elif WATERMARK_TEXT not in full_text and manifest.get("expectedNativeText") is not False:
                fail(errors, f"{doc_id}: synthetic watermark not found in PDF text")

        if output_path.suffix.lower() in {".jpg", ".jpeg"}:
            from PIL import Image

            image = Image.open(output_path)
            if image.width < 200 or image.height < 200:
                fail(errors, f"{doc_id}: PAN photo dimensions too small")
            if size == 0:
                fail(errors, f"{doc_id}: empty JPEG output")

    current_gst = paths["clean"] / "09-nivara-gst-registration-current.pdf"
    old_gst = paths["conflicts"] / "11-nivara-gst-registration-old-address.pdf"
    if current_gst.exists() and old_gst.exists():
        current_text = extract_pdf_text(current_gst)
        old_text = extract_pdf_text(old_gst)
        if not text_contains_value(current_text, current_office):
            fail(errors, "Current GST PDF must contain current Bhosari address")
        if not text_contains_value(old_text, original_office):
            fail(errors, "Historical GST PDF must contain original Chakan address")
        if text_contains_value(old_text, current_office):
            fail(errors, "Historical GST PDF must not contain current Bhosari address")

    inc22 = paths["clean"] / "05-nivara-inc22-registered-office.pdf"
    ack = paths["clean"] / "06-nivara-inc22-acknowledgement.pdf"
    if inc22.exists() and ack.exists():
        srn = ground_truth["documentReferences"]["officeChange"]["srn"]
        filing_date = ground_truth["documentReferences"]["officeChange"]["filingDate"]
        inc22_text = extract_pdf_text(inc22)
        ack_text = extract_pdf_text(ack)
        if srn not in inc22_text or srn not in ack_text:
            fail(errors, "INC-22 and acknowledgement must share the same SRN")
        if filing_date not in inc22_text or filing_date not in ack_text:
            fail(errors, "INC-22 and acknowledgement must share the same filing date")


def validate_fixture_manifest(errors: list[str], manifests: list[dict[str, Any]]) -> None:
    manifest_path = FIXTURE_ROOT / "fixture-manifest.json"
    if not manifest_path.exists():
        fail(errors, "Missing fixture-manifest.json — run generation scripts first")
        return

    payload = load_json(manifest_path)
    artifacts = payload.get("artifacts", [])
    if not artifacts:
        fail(errors, "fixture-manifest.json contains no artifacts")
        return

    manifest_by_id = {m["fixtureDocumentId"]: m for m in manifests}
    for artifact in artifacts:
        doc_id = artifact.get("fixtureDocumentId")
        if doc_id not in manifest_by_id:
            fail(errors, f"fixture-manifest artifact unknown document id: {doc_id}")
            continue

        rel_path = FIXTURE_ROOT / artifact["relativePath"]
        if not rel_path.exists():
            fail(errors, f"{doc_id}: fixture-manifest relativePath missing on disk: {artifact['relativePath']}")
            continue

        checksum = sha256_file(rel_path)
        if artifact.get("sha256") != checksum:
            fail(errors, f"{doc_id}: SHA-256 mismatch (manifest {artifact.get('sha256')}, file {checksum})")

        for fact in artifact.get("expectedExtractedFacts", []):
            page = fact.get("evidencePage", 1)
            expected_pages = artifact.get("actualPageCount") or artifact.get("expectedPageCount")
            if isinstance(expected_pages, int) and page > expected_pages:
                fail(errors, f"{doc_id}: evidence page {page} exceeds page count {expected_pages}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Nivara Techfab fixtures")
    args = parser.parse_args()

    errors: list[str] = []
    ground_truth = validate_ground_truth(errors)
    manifests = validate_manifests(errors, ground_truth) if ground_truth else []
    if ground_truth:
        validate_generated_artifacts(errors, ground_truth, manifests)
        validate_fixture_manifest(errors, manifests)

    if errors:
        print("Fixture validation failed:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print("Fixture validation passed.")
    print(f"  Ground truth: {FIXTURE_ROOT / 'ground-truth.json'}")
    print(f"  Document manifests: {len(manifests)}")
    print(f"  Generated artifacts validated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
