#!/usr/bin/env python3
"""Generate OCR quality-stress variants from clean fixture PDFs."""

from __future__ import annotations

import argparse
import io
import sys
from datetime import datetime, timezone

import cv2
import fitz
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from fixture_lib import (
    FIXTURE_ROOT,
    QUALITY_SEED,
    category_output_dir,
    load_document_manifests,
    load_json,
    output_paths,
    sha256_file,
    write_json,
)


def deterministic_rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def pdf_page_to_image(pdf_path, page_index: int = 0, dpi: int = 185) -> Image.Image:
    doc = fitz.open(pdf_path)
    try:
        page = doc.load_page(page_index)
        matrix = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    finally:
        doc.close()


def apply_scan_effects(image: Image.Image, seed: int, dpi: int) -> Image.Image:
    rng = deterministic_rng(seed)
    arr = np.array(image)

    angle = float(rng.uniform(-1.4, -0.6))
    h, w = arr.shape[:2]
    center = (w / 2, h / 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(arr, matrix, (w, h), borderMode=cv2.BORDER_REPLICATE)

    blurred = cv2.GaussianBlur(rotated, (3, 3), 0.6)
    noise = rng.normal(0, 4.5, blurred.shape).astype(np.int16)
    noisy = np.clip(blurred.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    pil = Image.fromarray(noisy)
    pil = ImageEnhance.Contrast(pil).enhance(1.05)
    pil = pil.filter(ImageFilter.GaussianBlur(radius=0.35))

    buffer = io.BytesIO()
    pil.save(buffer, format="JPEG", quality=72, optimize=True)
    buffer.seek(0)
    recompressed = Image.open(buffer).convert("RGB")
    return recompressed


def image_to_image_only_pdf(image: Image.Image, output_path) -> None:
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=80)
    jpeg_bytes = buffer.getvalue()

    doc = fitz.open()
    try:
        img = fitz.open(stream=jpeg_bytes, filetype="jpeg")
        rect = img[0].rect
        page = doc.new_page(width=rect.width, height=rect.height)
        page.insert_image(page.rect, stream=jpeg_bytes)
        doc.save(output_path)
    finally:
        doc.close()


def apply_mobile_photo_effects(image: Image.Image, seed: int, jpeg_quality: int) -> Image.Image:
    rng = deterministic_rng(seed + 17)
    w, h = image.size
    margin = int(min(w, h) * 0.04)
    padded = ImageOps.expand(image, border=margin, fill=(235, 232, 228))

    src = np.float32([
        [margin, margin],
        [w + margin - 1, margin + int(h * 0.02)],
        [w + margin - 1, h + margin - 1],
        [margin + int(w * 0.03), h + margin - 1],
    ])
    dst = np.float32([
        [0, 0],
        [w + 2 * margin, 0],
        [w + 2 * margin, h + 2 * margin],
        [0, h + 2 * margin],
    ])
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(np.array(padded), matrix, (w + 2 * margin, h + 2 * margin), borderMode=cv2.BORDER_REPLICATE)

    angle = float(rng.uniform(-2.5, 2.5))
    pil = Image.fromarray(warped)
    pil = pil.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=(235, 232, 228))

    gradient = np.linspace(0.88, 1.08, pil.height, dtype=np.float32).reshape(pil.height, 1)
    arr = np.array(pil).astype(np.float32)
    arr[:, :, 0] *= gradient
    arr[:, :, 1] *= gradient
    arr[:, :, 2] *= gradient
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    pil = Image.fromarray(arr)

    pil = pil.filter(ImageFilter.GaussianBlur(radius=0.45))
    pil = ImageEnhance.Brightness(pil).enhance(0.96)

    shadow = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    shadow_arr = np.array(shadow)
    shadow_arr[int(pil.height * 0.02) :, int(pil.width * 0.02) :] = [0, 0, 0, 28]
    pil = Image.alpha_composite(pil.convert("RGBA"), shadow).convert("RGB")

    buffer = io.BytesIO()
    pil.save(buffer, format="JPEG", quality=jpeg_quality, optimize=True)
    buffer.seek(0)
    return Image.open(buffer).convert("RGB")


def update_fixture_manifest(new_records: list[dict]) -> None:
    manifest_path = FIXTURE_ROOT / "fixture-manifest.json"
    payload = load_json(manifest_path) if manifest_path.exists() else {"artifacts": []}
    existing = {a["fixtureDocumentId"]: a for a in payload.get("artifacts", [])}
    for record in new_records:
        existing[record["fixtureDocumentId"]] = record
    payload["generatedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    payload["artifacts"] = list(existing.values())
    write_json(manifest_path, payload)


def build_record(manifest: dict, output_path, page_count: int | None) -> dict:
    mime = "image/jpeg" if output_path.suffix.lower() in {".jpg", ".jpeg"} else "application/pdf"
    return {
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
        "sha256": sha256_file(output_path),
        "relativePath": str(output_path.relative_to(FIXTURE_ROOT)).replace("\\", "/"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate quality-stress fixture variants")
    args = parser.parse_args()

    paths = output_paths()
    paths["quality_stress"].mkdir(parents=True, exist_ok=True)

    manifests = {
        m["fixtureDocumentId"]: m
        for m in load_document_manifests()
        if m.get("outputCategory") == "quality-stress"
    }

    records: list[dict] = []

    coi_manifest = manifests["12-coi-scanned-variant"]
    source_pdf = paths["clean"] / coi_manifest["sourceCleanFilename"]
    if not source_pdf.exists():
        print(f"Missing source PDF: {source_pdf}. Run generate_documents.py first.", file=sys.stderr)
        return 1

    dpi = coi_manifest["documentSpecific"].get("dpi", 185)
    seed = coi_manifest["documentSpecific"].get("seed", QUALITY_SEED)
    image = pdf_page_to_image(source_pdf, dpi=dpi)
    scanned = apply_scan_effects(image, seed=seed, dpi=dpi)
    coi_out = category_output_dir("quality-stress") / coi_manifest["outputFilename"]
    image_to_image_only_pdf(scanned, coi_out)
    records.append(build_record(coi_manifest, coi_out, 1))
    print(f"Generated scanned COI variant: {coi_out.name}")

    pan_manifest = manifests["13-pan-mobile-photo-variant"]
    pan_source = paths["clean"] / pan_manifest["sourceCleanFilename"]
    if not pan_source.exists():
        print(f"Missing source PDF: {pan_source}. Run generate_documents.py first.", file=sys.stderr)
        return 1

    pan_image = pdf_page_to_image(pan_source, dpi=200)
    jpeg_quality = pan_manifest["documentSpecific"].get("jpegQuality", 78)
    mobile = apply_mobile_photo_effects(pan_image, seed=seed, jpeg_quality=jpeg_quality)
    pan_out = category_output_dir("quality-stress") / pan_manifest["outputFilename"]
    mobile.save(pan_out, format="JPEG", quality=jpeg_quality, optimize=True)
    records.append(build_record(pan_manifest, pan_out, 1))
    print(f"Generated mobile-photo PAN variant: {pan_out.name}")

    update_fixture_manifest(records)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
