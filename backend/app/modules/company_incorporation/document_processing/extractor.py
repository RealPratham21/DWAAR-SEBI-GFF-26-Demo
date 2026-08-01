"""Per-page PDF and image extraction orchestration (schema-v2)."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import fitz
from PIL import Image, ImageOps

from app.core.config import Settings, get_settings
from app.modules.company_incorporation.document_processing.blocks import (
    make_block,
    order_native_line_blocks,
)
from app.modules.company_incorporation.document_processing.constants import (
    ExtractionMethod,
    ProcessingErrorCode,
    ProcessingWarning,
)
from app.modules.company_incorporation.document_processing.coordinates import (
    SOURCE_IMAGE_PIXELS,
    SOURCE_OCR_IMAGE_PIXELS,
    SOURCE_PDF_POINTS,
    BBox,
    native_pdf_bbox_to_canonical,
    upright_page_dimensions,
)
from app.modules.company_incorporation.document_processing.heuristic import assess_native_text
from app.modules.company_incorporation.document_processing.ocr import (
    ocr_words_to_schema_blocks,
    run_ocr,
)


class DocumentProcessingError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class PageExtractionResult:
    page_number: int
    extraction_method: str
    text: str
    text_blocks: list[dict[str, Any]] = field(default_factory=list)
    page_width: float | None = None
    page_height: float | None = None
    detected_rotation: float = 0.0
    native_text_length: int = 0
    average_ocr_confidence: float | None = None
    warnings: list[str] = field(default_factory=list)
    coordinate_metadata: dict[str, Any] = field(default_factory=dict)


def _native_schema_blocks(
    page: fitz.Page,
    *,
    page_width: float,
    page_height: float,
    rotation: float,
) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = []
    for block in page.get_text("dict").get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            line_text = "".join(span.get("text", "") for span in spans).strip()
            if not line_text:
                continue
            x0, y0, x1, y1 = line.get("bbox", (0, 0, 0, 0))
            source = BBox(float(x0), float(y0), float(x1), float(y1)).ordered()
            canonical = native_pdf_bbox_to_canonical(
                source,
                page_width=page_width,
                page_height=page_height,
                rotation=rotation,
            )
            blocks.append(
                make_block(
                    block_type="line",
                    text=line_text,
                    bbox=canonical,
                    source_bbox=source,
                    source_coordinate_space=SOURCE_PDF_POINTS,
                    confidence=None,
                )
            )
    return order_native_line_blocks(blocks)


def _native_coordinate_metadata(
    *,
    page_width: float,
    page_height: float,
    rotation: float,
) -> dict[str, Any]:
    upright_w, upright_h = upright_page_dimensions(page_width, page_height, rotation)
    return {
        "coordinate_space": "normalized_canonical_page",
        "canonical_orientation": "upright",
        "source_coordinate_space": SOURCE_PDF_POINTS,
        "source_width": float(page_width),
        "source_height": float(page_height),
        "processed_width": float(upright_w),
        "processed_height": float(upright_h),
        "render_dpi": None,
        "render_scale": 1.0,
        "rendered_width": float(upright_w),
        "rendered_height": float(upright_h),
        "embedded_rotation": float(rotation),
        "orientation_rotation_applied": 0.0,
        "deskew_angle": 0.0,
        "osd_rotation": 0,
        "exif_orientation_applied": False,
        "transform_matrix": None,
    }


def _image_coverage(page: fitz.Page) -> tuple[int, float]:
    images = page.get_images(full=True)
    if not images:
        return 0, 0.0
    page_area = max(page.rect.width * page.rect.height, 1.0)
    covered = 0.0
    for image in page.get_image_info(xrefs=True):
        bbox = image.get("bbox")
        if not bbox:
            continue
        x0, y0, x1, y1 = bbox
        covered += max(0.0, (x1 - x0) * (y1 - y0))
    return len(images), min(1.0, covered / page_area)


def _render_page_image(
    page: fitz.Page,
    *,
    dpi: int,
    max_pixels: int,
) -> tuple[Image.Image, float, float, float]:
    """Render an upright page image and return (image, scale, width_px, height_px)."""
    scale = dpi / 72.0
    width = page.rect.width * scale
    height = page.rect.height * scale
    if width * height > max_pixels:
        scale = (max_pixels / max(page.rect.width * page.rect.height, 1.0)) ** 0.5
    matrix = fitz.Matrix(scale, scale)
    # PyMuPDF applies page.rotation when generating pixmaps.
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    return image, float(scale), float(pix.width), float(pix.height)


def extract_pdf_pages(path: Path, *, settings: Settings | None = None) -> list[PageExtractionResult]:
    cfg = settings or get_settings()
    try:
        document = fitz.open(path)
    except Exception as exc:  # noqa: BLE001 - corrupted PDFs are expected
        raise DocumentProcessingError(
            ProcessingErrorCode.CORRUPTED_FILE,
            "The PDF could not be opened.",
        ) from exc

    try:
        if document.is_encrypted and not document.authenticate(""):
            raise DocumentProcessingError(
                ProcessingErrorCode.ENCRYPTED_PDF,
                "Encrypted PDFs are not supported.",
            )

        page_count = document.page_count
        if page_count <= 0:
            raise DocumentProcessingError(
                ProcessingErrorCode.CORRUPTED_FILE,
                "The PDF contains no pages.",
            )

        results: list[PageExtractionResult] = []
        pages_to_process = min(page_count, cfg.doc_processing_max_pages)
        for index in range(pages_to_process):
            page = document.load_page(index)
            page_number = index + 1
            warnings: list[str] = []
            native_text = page.get_text("text") or ""
            page_width = float(page.rect.width)
            page_height = float(page.rect.height)
            rotation = float(page.rotation or 0)
            blocks = _native_schema_blocks(
                page,
                page_width=page_width,
                page_height=page_height,
                rotation=rotation,
            )
            image_count, coverage = _image_coverage(page)
            assessment = assess_native_text(
                native_text,
                image_count=image_count,
                image_coverage_ratio=coverage,
                settings=cfg,
            )

            if assessment.is_sufficient:
                upright_w, upright_h = upright_page_dimensions(page_width, page_height, rotation)
                results.append(
                    PageExtractionResult(
                        page_number=page_number,
                        extraction_method=ExtractionMethod.NATIVE_TEXT,
                        text=native_text.strip(),
                        text_blocks=blocks,
                        page_width=upright_w,
                        page_height=upright_h,
                        detected_rotation=rotation,
                        native_text_length=len(native_text),
                        average_ocr_confidence=None,
                        warnings=warnings,
                        coordinate_metadata=_native_coordinate_metadata(
                            page_width=page_width,
                            page_height=page_height,
                            rotation=rotation,
                        ),
                    )
                )
                continue

            warnings.append(ProcessingWarning.NATIVE_TEXT_UNUSABLE)
            try:
                rendered, scale, rendered_w, rendered_h = _render_page_image(
                    page,
                    dpi=cfg.doc_processing_ocr_dpi,
                    max_pixels=cfg.doc_processing_max_render_pixels,
                )
                upright_w, upright_h = upright_page_dimensions(page_width, page_height, rotation)
                ocr = run_ocr(
                    rendered,
                    settings=cfg,
                    source_coordinate_space=SOURCE_OCR_IMAGE_PIXELS,
                    source_width=upright_w,
                    source_height=upright_h,
                    render_dpi=float(cfg.doc_processing_ocr_dpi),
                    render_scale=scale,
                    embedded_rotation=rotation,
                    apply_exif=False,
                )
                # Rendered image is already upright; use rendered pixel dims for mapping.
                ocr.transform.rendered_width = rendered_w
                ocr.transform.rendered_height = rendered_h
                ocr.transform.source_width = upright_w
                ocr.transform.source_height = upright_h
                method = (
                    ExtractionMethod.NATIVE_TEXT_WITH_OCR_FALLBACK
                    if assessment.character_count > 0
                    else ExtractionMethod.OCR
                )
                metadata = ocr.transform.to_coordinate_metadata()
                metadata["source_coordinate_space"] = SOURCE_PDF_POINTS
                metadata["ocr_source_coordinate_space"] = SOURCE_OCR_IMAGE_PIXELS
                results.append(
                    PageExtractionResult(
                        page_number=page_number,
                        extraction_method=method,
                        text=ocr.text,
                        text_blocks=ocr_words_to_schema_blocks(ocr),
                        page_width=upright_w,
                        page_height=upright_h,
                        detected_rotation=rotation + ocr.transform.orientation_rotation_applied,
                        native_text_length=len(native_text),
                        average_ocr_confidence=ocr.average_confidence,
                        warnings=sorted(set(warnings + ocr.warnings)),
                        coordinate_metadata=metadata,
                    )
                )
            except Exception:  # noqa: BLE001
                warnings.append(ProcessingWarning.CORRUPTED_PAGE)
                upright_w, upright_h = upright_page_dimensions(page_width, page_height, rotation)
                results.append(
                    PageExtractionResult(
                        page_number=page_number,
                        extraction_method=ExtractionMethod.OCR,
                        text="",
                        text_blocks=[],
                        page_width=upright_w,
                        page_height=upright_h,
                        detected_rotation=rotation,
                        native_text_length=len(native_text),
                        average_ocr_confidence=None,
                        warnings=sorted(set(warnings)),
                        coordinate_metadata=_native_coordinate_metadata(
                            page_width=page_width,
                            page_height=page_height,
                            rotation=rotation,
                        ),
                    )
                )

        if page_count > cfg.doc_processing_max_pages:
            results[-1].warnings = sorted(
                set(results[-1].warnings + [ProcessingWarning.PAGE_LIMIT_EXCEEDED])
            )
        return results
    finally:
        document.close()


def extract_image_page(path: Path, *, settings: Settings | None = None) -> list[PageExtractionResult]:
    cfg = settings or get_settings()
    Image.MAX_IMAGE_PIXELS = cfg.doc_processing_max_image_pixels
    try:
        with Image.open(path) as image:
            image.load()
            oriented = ImageOps.exif_transpose(image)
            width, height = oriented.size
            ocr = run_ocr(
                oriented,
                settings=cfg,
                source_coordinate_space=SOURCE_IMAGE_PIXELS,
                source_width=float(width),
                source_height=float(height),
                render_dpi=None,
                render_scale=1.0,
                embedded_rotation=0.0,
                apply_exif=False,
            )
            ocr.transform.exif_orientation_applied = oriented is not image
            ocr.transform.rendered_width = float(width)
            ocr.transform.rendered_height = float(height)
    except Exception as exc:  # noqa: BLE001
        raise DocumentProcessingError(
            ProcessingErrorCode.CORRUPTED_FILE,
            "The image could not be decoded.",
        ) from exc

    metadata = ocr.transform.to_coordinate_metadata()
    return [
        PageExtractionResult(
            page_number=1,
            extraction_method=ExtractionMethod.OCR,
            text=ocr.text,
            text_blocks=ocr_words_to_schema_blocks(ocr),
            page_width=float(width),
            page_height=float(height),
            detected_rotation=ocr.transform.orientation_rotation_applied
            + ocr.transform.deskew_angle,
            native_text_length=0,
            average_ocr_confidence=ocr.average_confidence,
            warnings=ocr.warnings,
            coordinate_metadata=metadata,
        )
    ]


def extract_document(
    path: Path,
    *,
    content_type: str,
    settings: Settings | None = None,
) -> list[PageExtractionResult]:
    normalized = content_type.lower().split(";")[0].strip()
    if normalized == "application/pdf":
        return extract_pdf_pages(path, settings=settings)
    if normalized in {"image/png", "image/jpeg"}:
        return extract_image_page(path, settings=settings)
    raise DocumentProcessingError(
        ProcessingErrorCode.UNSUPPORTED_FILE_TYPE,
        "Only PDF, PNG, and JPEG files can be processed.",
    )
