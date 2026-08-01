#!/usr/bin/env python3
"""Live Docker validation for Increment 2B structured extraction (Nivara fixtures)."""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import sys
import time
from pathlib import Path

import httpx

API = os.environ.get("INGEST_API_BASE", "http://localhost:8000/api/v1")
FIXTURE_ROOT = Path(
    os.environ.get(
        "INGEST_FIXTURE_ROOT",
        str(Path(__file__).resolve().parents[2] / "fixtures" / "nivara-techfab" / "generated"),
    )
)
GROUND_TRUTH = Path(
    os.environ.get(
        "INGEST_GROUND_TRUTH",
        str(Path(__file__).resolve().parents[2] / "fixtures" / "nivara-techfab" / "ground-truth.json"),
    )
)

DOCUMENTS = [
    {
        "label": "Clean COI",
        "path": FIXTURE_ROOT / "clean" / "01-nivara-certificate-of-incorporation.pdf",
        "requirement_key": "original-certificate-of-incorporation",
        "expect_facts": ["identity.legalName", "identity.cin"],
        "expect_matched_facts": ["identity.cin", "identity.legalName"],
    },
    {
        "label": "Scanned COI",
        "path": FIXTURE_ROOT / "quality-stress" / "12-nivara-certificate-of-incorporation-scanned.pdf",
        "requirement_key": "original-certificate-of-incorporation",
        "expect_facts": ["identity.cin"],
        "allow_replace": True,
    },
    {
        "label": "INC-22",
        "path": FIXTURE_ROOT / "clean" / "05-nivara-inc22-registered-office.pdf",
        "requirement_key": "current-registered-office-filing",
        "expect_facts": ["corporateHistory.officeChange.srn"],
    },
    {
        "label": "Current GST",
        "path": FIXTURE_ROOT / "clean" / "09-nivara-gst-registration-current.pdf",
        "requirement_key": "gst-registration-certificates",
        "expect_facts": ["registrations.gstin.registrationNumber"],
        "expect_no_historical_issue": True,
    },
    {
        "label": "Historical GST",
        "path": FIXTURE_ROOT / "conflicts" / "11-nivara-gst-registration-old-address.pdf",
        "requirement_key": "gst-registration-certificates",
        "expect_facts": ["registrations.gstin.registrationNumber"],
        "expect_historical_issue": True,
        "allow_replace": True,
    },
    {
        "label": "PAN mobile photo",
        "path": FIXTURE_ROOT / "quality-stress" / "13-nivara-pan-mobile-photo.jpg",
        "requirement_key": "pan-certificate",
        "expect_facts": ["registrations.pan.registrationNumber"],
    },
]


def bootstrap(client: httpx.Client) -> dict[str, str]:
    email = f"nivara.structured.{int(time.time())}@example.com"
    password = "StructuredPass123!"
    register = client.post(
        f"{API}/auth/register",
        json={
            "fullName": "Nivara Structured Tester",
            "email": email,
            "phone": "+919876543210",
            "password": password,
        },
    )
    register.raise_for_status()
    login = client.post(
        f"{API}/auth/login",
        json={"email": email, "password": password},
    )
    login.raise_for_status()
    token = login.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    # SME onboarding skip/submit if required by existing helpers - init workspace
    init = client.post(f"{API}/workstreams/company-incorporation/workspace", headers=headers)
    if init.status_code >= 400:
        # Complete minimal onboarding path used by ingest_nivara_fixtures
        from ingest_nivara_fixtures import bootstrap as full_bootstrap

        return full_bootstrap(client)
    return headers


def seed_information(client: httpx.Client, headers: dict[str, str]) -> None:
    truth = json.loads(GROUND_TRUTH.read_text(encoding="utf-8"))["informationTab"]
    workspace = client.get(f"{API}/workstreams/company-incorporation/workspace", headers=headers)
    workspace.raise_for_status()
    version = workspace.json()["version"]

    sections = [
        ("legal-identity", truth["identity"]),
        ("corporate-history", {"corporateEvents": truth["corporateEvents"]}),
        ("offices-contact", {"offices": truth["offices"]}),
        ("constitutional-documents", {
            "constitutionalRecord": truth["constitutionalRecord"],
            "constitutionalAmendments": truth.get("constitutionalAmendments", []),
        }),
        ("core-registrations", {"registrations": truth["registrations"]}),
    ]
    for section_id, data in sections:
        current = client.get(f"{API}/workstreams/company-incorporation/workspace", headers=headers)
        current.raise_for_status()
        version = current.json()["version"]
        response = client.patch(
            f"{API}/workstreams/company-incorporation/sections/{section_id}",
            headers=headers,
            json={"version": version, "data": data},
        )
        if response.status_code >= 400:
            print(f"Warn: failed seeding {section_id}: {response.status_code} {response.text[:200]}")
        else:
            print(f"Seeded Information section {section_id}")


def upload(client: httpx.Client, headers: dict[str, str], doc: dict, document_id: str | None) -> str:
    path: Path = doc["path"]
    content_type = mimetypes.guess_type(path.name)[0] or "application/pdf"
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        content_type = "image/jpeg"
    data = path.read_bytes()
    body = {
        "requirementKey": doc["requirement_key"],
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
    initiate.raise_for_status()
    init = initiate.json()
    put = httpx.put(init["uploadUrl"], content=data, headers=init["requiredHeaders"], timeout=60)
    put.raise_for_status()
    finalize = client.post(
        f"{API}/workstreams/company-incorporation/documents/versions/{init['versionId']}/finalize",
        headers=headers,
    )
    finalize.raise_for_status()
    return init["versionId"]


def wait_structured(client: httpx.Client, headers: dict[str, str], version_id: str, timeout: int = 240) -> dict:
    deadline = time.time() + timeout
    last = {}
    while time.time() < deadline:
        # page processing first
        proc = client.get(
            f"{API}/workstreams/company-incorporation/documents/versions/{version_id}/processing",
            headers=headers,
        )
        proc.raise_for_status()
        if proc.json().get("documentStatus") not in {"processed", "processing_failed"}:
            time.sleep(2)
            continue
        status = client.get(
            f"{API}/workstreams/company-incorporation/structured-extraction/versions/{version_id}/status",
            headers=headers,
        )
        status.raise_for_status()
        last = status.json()
        if last.get("latestRunStatus") in {
            "completed",
            "completed_with_warnings",
            "failed",
            "cancelled",
        } or last.get("usable"):
            return last
        time.sleep(2)
    return last


def evaluate(client: httpx.Client, headers: dict[str, str], doc: dict, version_id: str) -> dict:
    status = wait_structured(client, headers, version_id)
    facts = client.get(
        f"{API}/workstreams/company-incorporation/structured-extraction/facts",
        headers=headers,
        params={"documentVersionId": version_id},
    )
    facts.raise_for_status()
    groups = {item["factKey"]: item for item in facts.json().get("groups", [])}
    issues = client.get(
        f"{API}/workstreams/company-incorporation/structured-extraction/issues",
        headers=headers,
        params={"status": "open"},
    )
    issues.raise_for_status()
    open_issues = issues.json().get("issues", [])

    checks = []
    ok = True
    if not status.get("usable") and status.get("latestRunStatus") not in {
        "completed",
        "completed_with_warnings",
    }:
        ok = False
        checks.append(f"structured status={status.get('latestRunStatus')} usable={status.get('usable')}")
    for fact_key in doc.get("expect_facts", []):
        if fact_key not in groups:
            ok = False
            checks.append(f"missing fact {fact_key}")
    if doc.get("expect_historical_issue"):
        historical = [
            issue
            for issue in open_issues
            if issue.get("issueType") in {"possible_historical_value", "outdated_registration"}
        ]
        if not historical:
            ok = False
            checks.append("expected historical/outdated issue")
        else:
            checks.append(f"historical_issue={historical[0].get('id')}")
    for fact_key in doc.get("expect_matched_facts", []):
        group = groups.get(fact_key)
        if not group:
            continue
        statuses = {
            assertion.get("comparisonStatus")
            for assertion in group.get("assertions", [])
        }
        if "matched" not in statuses and "no_information" not in statuses:
            # Accept if any assertion matches Information for the core identifiers.
            if not any(status == "matched" for status in statuses):
                ok = False
                checks.append(f"{fact_key} not matched ({sorted(statuses)})")
    if ok:
        checks.append("PASS")
    return {
        "label": doc["label"],
        "ok": ok,
        "version_id": version_id,
        "structured_status": status.get("latestRunStatus"),
        "usable": status.get("usable"),
        "assertion_count": status.get("assertionCount"),
        "fact_keys": sorted(groups),
        "open_issue_types": sorted({issue.get("issueType") for issue in open_issues}),
        "checks": checks,
    }


def main() -> int:
    missing = [str(doc["path"]) for doc in DOCUMENTS if not doc["path"].exists()]
    if missing:
        print("Missing fixtures:")
        for path in missing:
            print(f"  - {path}")
        return 1
    if not GROUND_TRUTH.exists():
        print(f"Missing ground truth: {GROUND_TRUTH}")
        return 1

    results = []
    with httpx.Client(timeout=60.0) as client:
        # Prefer full bootstrap from page-ingest script for onboarding completeness.
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from ingest_nivara_fixtures import bootstrap as full_bootstrap

        headers = full_bootstrap(client)
        seed_information(client, headers)
        print("Bootstrapped and seeded Information tab.\n")

        for doc in DOCUMENTS:
            document_id = None
            if doc.get("allow_replace"):
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
            version_id = upload(client, headers, doc, document_id)
            print(f"Queued {doc['label']} -> {version_id}")
            result = evaluate(client, headers, doc, version_id)
            results.append(result)
            mark = "OK" if result["ok"] else "FAIL"
            print(
                f"[{mark}] {result['label']}: status={result['structured_status']} "
                f"usable={result['usable']} assertions={result['assertion_count']} "
                f"issues={result['open_issue_types']}"
            )
            print(f"     checks={result['checks']}\n")

        # Resolve historical issue if present
        issues = client.get(
            f"{API}/workstreams/company-incorporation/structured-extraction/issues",
            headers=headers,
            params={"status": "open"},
        ).json().get("issues", [])
        historical = [
            issue
            for issue in issues
            if issue.get("issueType") in {"possible_historical_value", "outdated_registration"}
        ]
        resolution = None
        if historical:
            issue_id = historical[0]["id"]
            resolve = client.post(
                f"{API}/workstreams/company-incorporation/structured-extraction/issues/{issue_id}/resolve",
                headers=headers,
                json={
                    "decision": "mark_document_historical",
                    "rationale": "Chakan GST address predates the INC-22 office change; keep Bhosari Information.",
                },
            )
            resolution = {
                "status_code": resolve.status_code,
                "body": resolve.json() if resolve.status_code < 500 else resolve.text[:300],
            }
            print(f"Resolution result: {resolution}")

    passed = sum(1 for item in results if item["ok"])
    print("=" * 72)
    print(f"Structured ingest summary: {passed}/{len(results)} passed")
    print(json.dumps({"results": results, "resolution": resolution}, indent=2))
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
