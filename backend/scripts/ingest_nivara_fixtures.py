#!/usr/bin/env python3
"""Live end-to-end ingest of Nivara fixture artifacts through API + worker."""

from __future__ import annotations

import hashlib
import json
import mimetypes
import sys
import time
import uuid
from pathlib import Path

import httpx

import os

API = os.environ.get("INGEST_API_BASE", "http://localhost:8000/api/v1")
FIXTURE_ROOT = Path(
    os.environ.get(
        "INGEST_FIXTURE_ROOT",
        str(Path(__file__).resolve().parents[2] / "fixtures" / "nivara-techfab" / "generated"),
    )
)

DOCUMENTS = [
    {
        "label": "Clean COI",
        "path": FIXTURE_ROOT / "clean" / "01-nivara-certificate-of-incorporation.pdf",
        "requirement_key": "original-certificate-of-incorporation",
        "expect_method": "native_text",
        "must_contain": ["Nivara Techfab Private Limited", "U29309MH2019PTC328517"],
    },
    {
        "label": "Scanned COI",
        "path": FIXTURE_ROOT / "quality-stress" / "12-nivara-certificate-of-incorporation-scanned.pdf",
        "requirement_key": "original-certificate-of-incorporation",
        "expect_method": "ocr",
        "must_contain": ["Nivara", "U29309MH2019PTC328517"],
        "allow_replace": True,
    },
    {
        "label": "INC-22",
        "path": FIXTURE_ROOT / "clean" / "05-nivara-inc22-registered-office.pdf",
        "requirement_key": "current-registered-office-filing",
        "expect_method": "native_text",
        "must_contain": ["R12345678", "Chakan", "Bhosari"],
        "expect_pages": 2,
    },
    {
        "label": "Current GST",
        "path": FIXTURE_ROOT / "clean" / "09-nivara-gst-registration-current.pdf",
        "requirement_key": "gst-registration-certificates",
        "expect_method": "native_text",
        "must_contain": ["27AABCN1234Q1Z9", "Bhosari"],
        "must_not_contain": ["Chakan"],
    },
    {
        "label": "Old GST (conflict pack)",
        "path": FIXTURE_ROOT / "conflicts" / "11-nivara-gst-registration-old-address.pdf",
        "requirement_key": "gst-registration-certificates",
        "expect_method": "native_text",
        "must_contain": ["27AABCN1234Q1Z9", "Chakan"],
        "must_not_contain": ["Bhosari"],
    },
    {
        "label": "PAN mobile photo",
        "path": FIXTURE_ROOT / "quality-stress" / "13-nivara-pan-mobile-photo.jpg",
        "requirement_key": "pan-certificate",
        "expect_method": "ocr",
        "must_contain": ["AABCN1234Q", "Nivara"],
        "expect_pages": 1,
    },
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def onboarding_steps() -> list[tuple[str, dict]]:
    return [
        (
            "role-authority",
            {
                "designation": "Managing Director",
                "relationship": "director",
                "relationshipOther": "",
                "authorisedSignatory": "yes",
                "basisOfAuthority": "board-resolution",
                "basisOfAuthorityOther": "",
                "primaryOnboardingContact": "yes",
                "addAlternateContact": False,
                "alternateContact": {
                    "fullName": "",
                    "designation": "",
                    "email": "",
                    "mobile": "",
                },
            },
        ),
        (
            "company-identity",
            {
                "legalName": "Nivara Techfab Private Limited",
                "cin": "U29309MH2019PTC328517",
                "incorporationDate": "2019-06-12",
                "companyClass": "private",
                "registeredState": "Maharashtra",
                "registrarOfCompanies": "Registrar of Companies, Pune",
                "registeredOffice": {
                    "addressLine1": "Unit No. 14, Meridian Industrial Estate",
                    "addressLine2": "MIDC Bhosari",
                    "locality": "Bhosari",
                    "city": "Pune",
                    "district": "Pune",
                    "state": "Maharashtra",
                    "pinCode": "411026",
                    "country": "India",
                },
                "companyEmail": "compliance@nivara-demo.example",
                "companyWebsite": "https://nivara-demo.example",
            },
        ),
        (
            "business-classification",
            {
                "primaryIndustry": "manufacturing",
                "primaryIndustryOther": "",
                "businessSector": "Precision components",
                "operationsDescription": (
                    "Manufacturing precision metal components and electromechanical assemblies."
                ),
                "pan": "AABCN1234Q",
                "gstRegistrationRequired": "no",
                "gstRegistrations": [],
                "udyamRegistration": "UDYAM-MH-19-0048721",
                "importExportCode": "",
                "employeeCountRange": "51-100",
            },
        ),
        (
            "ownership-snapshot",
            {
                "promoterCount": "2",
                "directorCount": "3",
                "promoterHoldingPercent": "75",
                "nonPromoterHoldingPercent": "25",
                "institutionalShareholdersPresent": "no",
                "foreignShareholdersPresent": "no",
                "promoterGroupEntitiesPresent": "no",
            },
        ),
        (
            "ipo-intent",
            {
                "proposedIssueType": "fresh-issue",
                "issueSizeCrore": "50",
                "issueSizeNotDecided": False,
                "targetTimeline": "6-12-months",
                "intendedExchange": "nse-emerge",
                "primaryPurposes": ["capital-expenditure"],
                "primaryPurposeOther": "",
                "merchantBankerAppointed": "no",
                "merchantBankerName": "",
                "preparationStage": "internal-preparation",
            },
        ),
        (
            "initial-documents",
            {
                "selections": {
                    "certificate-of-incorporation": {
                        "fileName": "coi.pdf",
                        "fileSize": 1024,
                        "mimeType": "application/pdf",
                    },
                    "current-moa": None,
                    "current-aoa": None,
                    "pan": None,
                    "latest-audited-financials": None,
                    "representative-authorisation": None,
                },
                "skippedForNow": True,
            },
        ),
    ]


def bootstrap(client: httpx.Client) -> dict[str, str]:
    email = f"ingest.{uuid.uuid4().hex[:10]}@example.com"
    register = client.post(
        f"{API}/auth/register",
        json={
            "fullName": "Fixture Ingest User",
            "email": email,
            "phone": "9876501234",
            "password": "Password1",
            "rememberMe": False,
        },
    )
    register.raise_for_status()
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(f"{API}/onboarding/sme", headers=headers)
    created.raise_for_status()
    onboarding_id = created.json()["id"]

    for route, payload in onboarding_steps():
        response = client.patch(
            f"{API}/onboarding/sme/{onboarding_id}/{route}",
            headers=headers,
            json=payload,
        )
        if response.status_code >= 400:
            print(f"Onboarding step failed: {route} -> {response.status_code} {response.text}")
            response.raise_for_status()

    submit = client.post(
        f"{API}/onboarding/sme/{onboarding_id}/submit",
        headers=headers,
        json={
            "submissionConfirmations": {
                "confirmAccuracy": True,
                "confirmAuthorised": True,
                "confirmVerification": True,
                "agreeTerms": True,
            }
        },
    )
    submit.raise_for_status()

    workspace = client.post(
        f"{API}/workstreams/company-incorporation/workspace",
        headers=headers,
    )
    workspace.raise_for_status()
    return headers


def upload_document(
    client: httpx.Client,
    headers: dict[str, str],
    *,
    path: Path,
    requirement_key: str,
    document_id: str | None = None,
) -> str:
    content_type = mimetypes.guess_type(path.name)[0] or "application/pdf"
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        content_type = "image/jpeg"
    data = path.read_bytes()
    body = {
        "requirementKey": requirement_key,
        "filename": path.name,
        "contentType": content_type,
        "sizeBytes": len(data),
        "checksumSha256": hashlib.sha256(data).hexdigest(),
    }
    if document_id:
        body["documentId"] = document_id

    initiate = client.post(
        f"{API}/workstreams/company-incorporation/documents/uploads/initiate",
        headers=headers,
        json=body,
    )
    if initiate.status_code >= 400:
        print(f"Initiate failed for {path.name}: {initiate.status_code} {initiate.text}")
        initiate.raise_for_status()
    init = initiate.json()
    upload_url = init["uploadUrl"]
    required_headers = init["requiredHeaders"]
    version_id = init["versionId"]

    put = httpx.put(upload_url, content=data, headers=required_headers, timeout=60.0)
    if put.status_code >= 400:
        print(f"MinIO PUT failed for {path.name}: {put.status_code} {put.text}")
        put.raise_for_status()

    finalize = client.post(
        f"{API}/workstreams/company-incorporation/documents/versions/{version_id}/finalize",
        headers=headers,
    )
    if finalize.status_code >= 400:
        print(f"Finalize failed for {path.name}: {finalize.status_code} {finalize.text}")
        finalize.raise_for_status()
    return version_id


def wait_for_processing(
    client: httpx.Client,
    headers: dict[str, str],
    version_id: str,
    *,
    timeout_seconds: int = 180,
) -> dict:
    deadline = time.time() + timeout_seconds
    last = {}
    while time.time() < deadline:
        response = client.get(
            f"{API}/workstreams/company-incorporation/documents/versions/{version_id}/processing",
            headers=headers,
        )
        response.raise_for_status()
        last = response.json()
        status = last.get("documentStatus")
        if status in {"processed", "processing_failed"}:
            return last
        time.sleep(2)
    return last


def _blocks_ok(pages: list[dict]) -> list[str]:
    problems: list[str] = []
    for page in pages:
        blocks = page.get("textBlocks") or []
        seen: set[str] = set()
        for index, block in enumerate(blocks):
            block_id = block.get("blockId") or block.get("block_id")
            if not block_id:
                problems.append(f"page {page.get('pageNumber')} missing blockId")
                continue
            if block_id in seen:
                problems.append(f"duplicate blockId {block_id}")
            seen.add(block_id)
            order_index = block.get("orderIndex", block.get("order_index"))
            if order_index != index:
                problems.append(
                    f"page {page.get('pageNumber')} orderIndex={order_index} expected={index}"
                )
            bbox = block.get("bbox") or {}
            for key in ("x0", "y0", "x1", "y1"):
                value = bbox.get(key)
                if value is None or not (0.0 <= float(value) <= 1.0):
                    problems.append(f"bbox {key} out of range on page {page.get('pageNumber')}")
                    break
            if not block.get("sourceBbox") and not block.get("source_bbox"):
                problems.append(f"missing sourceBbox on page {page.get('pageNumber')}")
            meta = page.get("coordinateMetadata") or {}
            if meta.get("coordinateSpace") != "normalized_canonical_page":
                problems.append(
                    f"bad coordinateSpace on page {page.get('pageNumber')}: {meta.get('coordinateSpace')}"
                )
    return problems


def evaluate(client: httpx.Client, headers: dict[str, str], doc: dict, version_id: str) -> dict:
    status = wait_for_processing(client, headers, version_id)
    meta_resp = client.get(
        f"{API}/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
    )
    meta_resp.raise_for_status()
    meta_body = meta_resp.json()
    pages_resp = client.get(
        f"{API}/workstreams/company-incorporation/documents/versions/{version_id}/processing/pages",
        headers=headers,
        params={"include_content": "true", "limit": 50},
    )
    pages_resp.raise_for_status()
    body = pages_resp.json()
    pages = body.get("pages", [])
    combined = "\n".join(page.get("text") or "" for page in pages)
    methods = [page.get("extractionMethod") for page in pages]
    warnings = sorted(
        {
            warning
            for page in pages
            for warning in (page.get("warnings") or [])
        }
        | set(status.get("warnings") or [])
    )
    confidences = [
        page.get("averageOcrConfidence")
        for page in pages
        if page.get("averageOcrConfidence") is not None
    ]

    checks: list[str] = []
    ok = True
    if status.get("documentStatus") != "processed":
        ok = False
        checks.append(f"status={status.get('documentStatus')} run={status.get('latestRunStatus')}")
    if not status.get("evidenceReady"):
        ok = False
        checks.append(
            f"evidenceReady=false schema={status.get('outputSchemaVersion')} "
            f"processor={status.get('processorVersion')}"
        )
    if body.get("outputSchemaVersion") != 2:
        ok = False
        checks.append(f"pages.outputSchemaVersion={body.get('outputSchemaVersion')}")
    if not body.get("evidenceReady"):
        ok = False
        checks.append("pages.evidenceReady=false")
    # Default metadata response must omit text/blocks.
    for page in meta_body.get("pages", []):
        if page.get("text") is not None or page.get("textBlocks") is not None:
            ok = False
            checks.append("metadata default leaked content")
            break
    if doc.get("expect_pages") and body.get("pageCount") != doc["expect_pages"]:
        ok = False
        checks.append(f"pages={body.get('pageCount')} expected={doc['expect_pages']}")
    expected_method = doc["expect_method"]
    if expected_method == "ocr":
        if not any(method in {"ocr", "native_text_with_ocr_fallback"} for method in methods):
            ok = False
            checks.append(f"methods={methods} expected OCR")
    elif expected_method not in methods:
        ok = False
        checks.append(f"methods={methods} expected {expected_method}")
    for needle in doc.get("must_contain", []):
        if needle.lower() not in combined.lower() and needle.upper().replace(" ", "") not in combined.upper().replace(" ", ""):
            ok = False
            checks.append(f"missing '{needle}'")
    for needle in doc.get("must_not_contain", []):
        if needle in combined:
            ok = False
            checks.append(f"unexpected '{needle}'")
    for problem in _blocks_ok(pages):
        ok = False
        checks.append(problem)
    if ok:
        checks.append("PASS")

    return {
        "label": doc["label"],
        "ok": ok,
        "version_id": version_id,
        "document_status": status.get("documentStatus"),
        "run_status": status.get("latestRunStatus"),
        "evidence_ready": status.get("evidenceReady"),
        "output_schema_version": status.get("outputSchemaVersion"),
        "processor_version": status.get("processorVersion"),
        "page_count": body.get("pageCount", len(pages)),
        "methods": methods,
        "confidences": confidences,
        "warnings": warnings,
        "checks": checks,
        "text_preview": combined[:280].replace("\n", " | "),
    }


def main() -> int:
    missing = [str(doc["path"]) for doc in DOCUMENTS if not doc["path"].exists()]
    if missing:
        print("Missing fixture files:")
        for path in missing:
            print(f"  - {path}")
        return 1

    results = []
    with httpx.Client(timeout=60.0) as client:
        headers = bootstrap(client)
        print(f"Bootstrapped workspace. Ingesting {len(DOCUMENTS)} fixtures...\n")

        # Track document ids for replaceable requirements
        document_ids: dict[str, str] = {}

        for doc in DOCUMENTS:
            document_id = None
            if doc.get("allow_replace"):
                # First upload for scanned COI replaces clean COI under same requirement
                # Find existing document id from list endpoint
                listing = client.get(
                    f"{API}/workstreams/company-incorporation/documents",
                    headers=headers,
                )
                listing.raise_for_status()
                for group in listing.json().get("groups", []):
                    for requirement in group.get("requirements", []):
                        if requirement["key"] == doc["requirement_key"] and requirement.get("documents"):
                            document_id = requirement["documents"][0]["id"]
                            break

            version_id = upload_document(
                client,
                headers,
                path=doc["path"],
                requirement_key=doc["requirement_key"],
                document_id=document_id,
            )
            print(f"Queued {doc['label']} ({doc['path'].name}) -> {version_id}")
            result = evaluate(client, headers, doc, version_id)
            results.append(result)
            mark = "OK" if result["ok"] else "FAIL"
            print(
                f"[{mark}] {result['label']}: status={result['document_status']} "
                f"pages={result['page_count']} methods={result['methods']} "
                f"confidence={result['confidences']} warnings={result['warnings']}"
            )
            print(f"     checks={result['checks']}")
            print(f"     preview={result['text_preview'][:180]}...\n")

    passed = sum(1 for item in results if item["ok"])
    print("=" * 72)
    print(f"Ingest summary: {passed}/{len(results)} passed")
    print(json.dumps(results, indent=2))
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
