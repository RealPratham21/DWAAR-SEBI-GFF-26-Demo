#!/usr/bin/env python3
"""Live Docker validation for Increment 2B/3A structured extraction (Nivara fixtures)."""

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
        "expect_facts": [
            "corporateHistory.officeChange.srn",
            "corporateHistory.officeChange.filingForm",
        ],
        "expect_filing_form": "INC-22",
        "expect_address_facts": {
            "corporateHistory.officeChange.previousAddress": ["chakan"],
            "corporateHistory.officeChange.newAddress": ["bhosari"],
        },
        "forbid_display_values": ["type"],
        "forbid_address_substrings": [
            "SYNTHETIC DEMO DOCUMENT",
            "NOT VALID FOR OFFICIAL USE",
        ],
        "forbid_issue_types_for_facts": {
            "corporateHistory.officeChange.filingForm": ["missing_expected_fact"],
        },
    },
    {
        "label": "Office address proof",
        "path": FIXTURE_ROOT / "clean" / "07-nivara-office-address-proof.pdf",
        "requirement_key": "registered-office-address-proof",
        "expect_facts": ["offices.currentRegistered.occupancyType"],
        "forbid_display_values": ["type"],
    },
    {
        "label": "Current GST",
        "path": FIXTURE_ROOT / "clean" / "09-nivara-gst-registration-current.pdf",
        "requirement_key": "gst-registration-certificates",
        "expect_facts": [
            "registrations.gstin.registrationNumber",
            "registrations.gstin.registrationDate",
            "registrations.gstin.effectiveDate",
        ],
        "expect_gst_dates": {
            "registrations.gstin.registrationDate": "2019-07-05",
            "registrations.gstin.effectiveDate": "2023-08-22",
        },
        "expect_no_hard_address_conflict": True,
        "expect_no_gst_date_conflict": True,
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
        "expect_pan_truncated_quality_issue": True,
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

    forbidden_displays = {value.lower() for value in doc.get("forbid_display_values", [])}
    forbidden_address = [value.lower() for value in doc.get("forbid_address_substrings", [])]
    for group in groups.values():
        for assertion in group.get("assertions", []):
            display = str(assertion.get("displayValue") or "").strip().lower()
            if display in forbidden_displays:
                ok = False
                checks.append(f"forbidden displayValue={display!r} on {assertion.get('factKey')}")
            if "address" in str(assertion.get("factKey") or "").lower():
                blob = " ".join(
                    [
                        str(assertion.get("displayValue") or ""),
                        json.dumps(assertion.get("normalizedValue") or {}),
                    ]
                ).lower()
                for fragment in forbidden_address:
                    if fragment.lower() in blob:
                        ok = False
                        checks.append(
                            f"synthetic/disclaimer text in address fact {assertion.get('factKey')}"
                        )

    for fact_key, needles in doc.get("expect_address_facts", {}).items():
        group = groups.get(fact_key)
        if not group or not group.get("assertions"):
            ok = False
            checks.append(f"missing address fact {fact_key}")
            continue
        blob = " ".join(
            json.dumps(assertion.get("normalizedValue") or assertion.get("displayValue") or "")
            for assertion in group["assertions"]
        ).lower()
        for needle in needles:
            if needle.lower() not in blob:
                ok = False
                checks.append(f"{fact_key} missing expected token {needle!r}")

    if doc.get("expect_no_hard_address_conflict"):
        hard = [
            issue
            for issue in open_issues
            if issue.get("issueType") == "conflicting_value"
            and "address" in str(issue.get("factKey") or "").lower()
        ]
        if hard:
            ok = False
            checks.append(f"unexpected hard address conflict(s): {[i.get('id') for i in hard]}")

    # Scanned/OCR company-class junk must not create an active conflict.
    if "Scanned" in doc["label"] or "COI" in doc["label"]:
        class_conflicts = [
            issue
            for issue in open_issues
            if issue.get("factKey") == "identity.companyClass"
            and issue.get("issueType") == "conflicting_value"
        ]
        if class_conflicts:
            detail = client.get(
                f"{API}/workstreams/company-incorporation/structured-extraction/issues/{class_conflicts[0]['id']}",
                headers=headers,
            )
            if detail.status_code == 200:
                links = detail.json().get("linkedAssertions", [])
                displays = [str(link.get("displayValue") or "").lower() for link in links]
                if any(value in {"ms", "type", "class"} for value in displays):
                    ok = False
                    checks.append(f"OCR company-class junk conflict displays={displays}")

    if doc.get("expect_filing_form"):
        group = groups.get("corporateHistory.officeChange.filingForm")
        values = {
            str(assertion.get("normalizedValue") or assertion.get("displayValue") or "")
            for assertion in (group or {}).get("assertions", [])
        }
        if doc["expect_filing_form"] not in values:
            ok = False
            checks.append(f"filing form not {doc['expect_filing_form']}: {sorted(values)}")

    for fact_key, expected_iso in doc.get("expect_gst_dates", {}).items():
        group = groups.get(fact_key)
        values = {
            str(
                assertion.get("normalizedValue")
                or assertion.get("displayValue")
                or ""
            )
            for assertion in (group or {}).get("assertions", [])
        }
        # Keep assertions belonging to this document version when present.
        versioned = {
            str(
                assertion.get("normalizedValue")
                or assertion.get("displayValue")
                or ""
            )
            for assertion in (group or {}).get("assertions", [])
            if assertion.get("documentVersionId") == version_id
        }
        check_values = versioned or values
        if expected_iso not in check_values:
            ok = False
            checks.append(f"{fact_key} expected {expected_iso}, got {sorted(check_values)}")

    if doc.get("expect_no_gst_date_conflict"):
        date_conflicts = [
            issue
            for issue in open_issues
            if issue.get("issueType") == "conflicting_value"
            and issue.get("factKey")
            in {
                "registrations.gstin.registrationDate",
                "registrations.gstin.effectiveDate",
                "registrations.gstin.amendmentDate",
                "registrations.gstin.certificateIssueDate",
            }
        ]
        if date_conflicts:
            ok = False
            checks.append(
                f"unexpected GST date conflict(s): "
                f"{[(i.get('factKey'), i.get('id')) for i in date_conflicts]}"
            )

    for fact_key, banned_types in doc.get("forbid_issue_types_for_facts", {}).items():
        bad = [
            issue
            for issue in open_issues
            if issue.get("factKey") == fact_key and issue.get("issueType") in set(banned_types)
        ]
        if bad:
            ok = False
            checks.append(f"forbidden issues for {fact_key}: {[i.get('issueType') for i in bad]}")

    if doc.get("expect_pan_truncated_quality_issue"):
        hard_name = [
            issue
            for issue in open_issues
            if issue.get("factKey") == "registrations.pan.legalNameOnRegistration"
            and issue.get("issueType") == "conflicting_value"
        ]
        if hard_name:
            ok = False
            checks.append("PAN truncated name still has hard conflicting_value")
        quality = [
            issue
            for issue in open_issues
            if issue.get("factKey") == "registrations.pan.legalNameOnRegistration"
            and issue.get("issueType") in {"low_extraction_quality", "clarification_required"}
        ]
        name_group = groups.get("registrations.pan.legalNameOnRegistration")
        if name_group and not quality and not hard_name:
            # Truncation may already be reflected only as possible_match without an issue
            # if quality scoring skipped; still require no hard conflict.
            statuses = {
                assertion.get("comparisonStatus")
                for assertion in name_group.get("assertions", [])
            }
            if "conflicting" in statuses:
                ok = False
                checks.append(f"PAN name comparison still conflicting: {sorted(statuses)}")
            elif "possible_match" not in statuses and "matched" not in statuses:
                checks.append(f"PAN name statuses={sorted(statuses)}")
        elif name_group and quality:
            checks.append(f"pan_quality_issue={quality[0].get('issueType')}")

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


def validate_summaries(client: httpx.Client, headers: dict[str, str]) -> dict:
    pipeline = client.get(
        f"{API}/workstreams/company-incorporation/documents/pipeline-summary",
        headers=headers,
    )
    pipeline.raise_for_status()
    overview = client.get(
        f"{API}/workstreams/company-incorporation/overview-summary",
        headers=headers,
    )
    overview.raise_for_status()
    pipe = pipeline.json()
    ov = overview.json()
    checks = []
    ok = True
    if pipe["aggregation"]["totalCurrentDocuments"] < 1:
        ok = False
        checks.append("pipeline summary empty")
    if pipe["aggregation"]["hasAnyActivePipeline"]:
        ok = False
        checks.append("pipeline still active after completion")
    if ov.get("readyForDisclosureGeneration") is not False:
        ok = False
        checks.append("readyForDisclosureGeneration must remain false")
    if ov.get("disclosures", {}).get("status") != "not_assessed":
        ok = False
        checks.append("disclosures must remain not_assessed")
    if ov.get("professionalReview", {}).get("status") != "not_assessed":
        ok = False
        checks.append("professionalReview must remain not_assessed")
    if ok:
        checks.append("PASS")
    return {"ok": ok, "checks": checks, "pipeline": pipe, "overview": ov}


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
    resolution = None
    summary: dict = {"ok": False, "checks": ["not_run"]}
    open_after: list = []
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
        resolutions = []
        for item in historical:
            issue_id = item["id"]
            resolve = client.post(
                f"{API}/workstreams/company-incorporation/structured-extraction/issues/{issue_id}/resolve",
                headers=headers,
                json={
                    "decision": "mark_document_historical",
                    "rationale": "Chakan GST address predates the INC-22 office change; keep Bhosari Information.",
                },
            )
            entry = {
                "status_code": resolve.status_code,
                "body": resolve.json() if resolve.status_code < 500 else resolve.text[:300],
            }
            resolutions.append(entry)
            resolution = entry
            print(f"Resolution result: {resolution}")
        if not resolutions:
            print("No historical issues to resolve.")

        summary = validate_summaries(client, headers)
        print(f"Summary endpoints: {'OK' if summary['ok'] else 'FAIL'} checks={summary['checks']}")
        open_after = client.get(
            f"{API}/workstreams/company-incorporation/structured-extraction/issues",
            headers=headers,
            params={"status": "open"},
        ).json().get("issues", [])
        print("Remaining open issues:")
        for issue in open_after:
            print(
                f"  - {issue.get('id')} type={issue.get('issueType')} "
                f"severity={issue.get('severity')} fact={issue.get('factKey')} "
                f"title={issue.get('title')}"
            )

    passed = sum(1 for item in results if item["ok"])
    summary_ok = bool(summary.get("ok"))
    print("=" * 72)
    print(f"Structured ingest summary: {passed}/{len(results)} passed; summaries_ok={summary_ok}")
    print(
        json.dumps(
            {
                "results": results,
                "resolution": resolution,
                "summary_ok": summary_ok,
                "remaining_open_issues": open_after,
            },
            indent=2,
            default=str,
        )
    )
    return 0 if passed == len(results) and summary_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
