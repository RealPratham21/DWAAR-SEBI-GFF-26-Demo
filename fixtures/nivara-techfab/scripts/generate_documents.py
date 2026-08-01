#!/usr/bin/env python3
"""Generate clean and conflict PDFs from ground truth and document manifests."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from fixture_lib import (
    FIXTURE_ROOT,
    WATERMARK_TEXT,
    build_template_context,
    category_output_dir,
    load_document_manifests,
    load_json,
    output_paths,
    sha256_file,
    validate_identifier_formats,
    write_json,
)


def render_html(env: Environment, manifest: dict, context: dict) -> str:
    template_name = manifest["templateName"]
    template = env.get_template(template_name)
    return template.render(**context)


def render_pdf(html_content: str, output_path: Path, manifest: dict, ground_truth: dict) -> None:
    import contextlib
    import io

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with contextlib.redirect_stderr(io.StringIO()):
        try:
            from weasyprint import HTML

            html = HTML(string=html_content, base_url=str(output_paths()["templates"]))
            html.write_pdf(output_path)
            return
        except (OSError, ImportError):
            pass

    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError(
            "WeasyPrint native libraries are unavailable. Install them (Docker recommended) "
            "or add the local fallback: pip install '.[local]' && playwright install chromium"
        ) from exc

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            page = browser.new_page()
            page.set_content(html_content, wait_until="networkidle")
            page.pdf(
                path=str(output_path),
                format="A4",
                print_background=True,
                margin={"top": "18mm", "right": "16mm", "bottom": "22mm", "left": "16mm"},
            )
        finally:
            browser.close()


def generate_fixture_manifest(artifacts: list[dict]) -> dict:
    return {
        "fixtureId": "nivara-techfab-v1",
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "watermarkText": WATERMARK_TEXT,
        "artifacts": artifacts,
    }


def build_artifact_record(manifest: dict, output_path: Path, page_count: int | None) -> dict:
    mime = "application/pdf"
    if output_path.suffix.lower() in {".jpg", ".jpeg"}:
        mime = "image/jpeg"
    elif output_path.suffix.lower() == ".png":
        mime = "image/png"

    record = {
        "fixtureDocumentId": manifest["fixtureDocumentId"],
        "filename": manifest["outputFilename"],
        "requirementKey": manifest["requirementKey"],
        "variantType": manifest["outputCategory"],
        "mimeType": mime,
        "expectedPageCount": manifest.get("expectedPageCount"),
        "actualPageCount": page_count,
        "expectedNativeText": manifest.get("expectedNativeText"),
        "expectedExtractedFacts": manifest.get("expectedExtractedFacts", []),
        "expectedConflicts": manifest.get("expectedConflicts", []),
        "expectedWarnings": manifest.get("expectedWarnings", []),
        "mainJuryDemoPack": manifest.get("mainJuryDemoPack", False),
        "sha256": sha256_file(output_path) if output_path.exists() else None,
        "relativePath": str(output_path.relative_to(FIXTURE_ROOT)).replace("\\", "/"),
    }
    return record


def count_pdf_pages(path: Path) -> int:
    import fitz

    doc = fitz.open(path)
    try:
        return doc.page_count
    finally:
        doc.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Nivara Techfab fixture PDFs")
    parser.add_argument("--skip-manifest-write", action="store_true")
    args = parser.parse_args()

    ground_truth_path = FIXTURE_ROOT / "ground-truth.json"
    ground_truth = load_json(ground_truth_path)
    id_errors = validate_identifier_formats(ground_truth)
    if id_errors:
        for error in id_errors:
            print(f"ground-truth error: {error}", file=sys.stderr)
        return 1

    paths = output_paths()
    for directory in paths.values():
        if directory.name in {"clean", "conflicts", "quality-stress", "html-preview"}:
            directory.mkdir(parents=True, exist_ok=True)

    env = Environment(
        loader=FileSystemLoader(str(paths["templates"])),
        autoescape=select_autoescape(["html", "xml"]),
    )

    manifests = load_document_manifests()
    pdf_manifests = [m for m in manifests if m.get("templateName")]
    artifacts: list[dict] = []
    summary: list[str] = []

    for manifest in pdf_manifests:
        context = build_template_context(ground_truth, manifest)
        html_content = render_html(env, manifest, context)

        preview_path = paths["html_preview"] / manifest["outputFilename"].replace(".pdf", ".html")
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        preview_path.write_text(html_content, encoding="utf-8")

        output_path = category_output_dir(manifest["outputCategory"]) / manifest["outputFilename"]
        render_pdf(html_content, output_path, manifest, ground_truth)
        pages = count_pdf_pages(output_path)
        artifacts.append(build_artifact_record(manifest, output_path, pages))
        summary.append(f"Generated {output_path.name} ({pages} pages) -> {manifest['outputCategory']}")

    if not args.skip_manifest_write:
        existing = FIXTURE_ROOT / "fixture-manifest.json"
        prior = load_json(existing) if existing.exists() else {"artifacts": []}
        non_pdf = [a for a in prior.get("artifacts", []) if a.get("mimeType") != "application/pdf" or "quality-stress" in a.get("relativePath", "")]
        merged = generate_fixture_manifest(artifacts + [a for a in non_pdf if a not in artifacts])
        write_json(existing, merged)

    print("Generation summary:")
    for line in summary:
        print(f"  - {line}")
    print(f"  HTML previews: {paths['html_preview']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
