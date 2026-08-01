"""Tesseract OCR helpers with reproducible preprocessing metadata."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageOps

from app.core.config import Settings, get_settings
from app.modules.company_incorporation.document_processing.constants import ProcessingWarning
from app.modules.company_incorporation.document_processing.coordinates import (
    SOURCE_IMAGE_PIXELS,
    SOURCE_OCR_IMAGE_PIXELS,
    BBox,
    ImageTransformMetadata,
    ocr_pixel_bbox_to_canonical,
)


@dataclass
class PreprocessResult:
    image: Image.Image
    transform: ImageTransformMetadata
    warnings: list[str] = field(default_factory=list)


@dataclass
class OcrWord:
    text: str
    confidence: float
    source_bbox: BBox
    page_num: int
    block_num: int
    par_num: int
    line_num: int
    word_num: int


@dataclass
class OcrResult:
    text: str
    words: list[OcrWord]
    average_confidence: float | None
    transform: ImageTransformMetadata
    warnings: list[str]


def _pil_to_cv(image: Image.Image) -> np.ndarray:
    rgb = np.array(image.convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def _estimate_skew_angle(gray: np.ndarray) -> float:
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=80,
        minLineLength=max(40, gray.shape[1] // 10),
        maxLineGap=20,
    )
    if lines is None:
        return 0.0
    angles: list[float] = []
    for line in lines[:80]:
        coords = np.asarray(line).reshape(-1)
        if coords.size < 4:
            continue
        x1, y1, x2, y2 = (int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3]))
        if x2 == x1:
            continue
        angle = float(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
        if abs(angle) < 15:
            angles.append(angle)
    if not angles:
        return 0.0
    return float(np.median(angles))


def preprocess_for_ocr(
    image: Image.Image,
    *,
    settings: Settings | None = None,
    source_coordinate_space: str = SOURCE_IMAGE_PIXELS,
    source_width: float | None = None,
    source_height: float | None = None,
    render_dpi: float | None = None,
    render_scale: float = 1.0,
    embedded_rotation: float = 0.0,
    apply_exif: bool = True,
) -> PreprocessResult:
    cfg = settings or get_settings()
    warnings: list[str] = []
    Image.MAX_IMAGE_PIXELS = cfg.doc_processing_max_image_pixels

    working = image
    exif_applied = False
    if apply_exif:
        corrected = ImageOps.exif_transpose(image)
        if corrected is not image:
            warnings.append(ProcessingWarning.PAGE_ROTATION_CORRECTED)
            exif_applied = True
            working = corrected

    width, height = working.size
    src_w = float(source_width if source_width is not None else width)
    src_h = float(source_height if source_height is not None else height)

    approx_dpi = render_dpi if render_dpi is not None else max(width, height) / 8.5
    if approx_dpi < cfg.doc_processing_low_resolution_dpi:
        warnings.append(ProcessingWarning.LOW_RESOLUTION)

    cv_image = _pil_to_cv(working)
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
    gray = cv2.fastNlMeansDenoising(gray, None, h=8, templateWindowSize=7, searchWindowSize=21)

    skew = _estimate_skew_angle(gray)
    deskew_angle = 0.0
    if abs(skew) >= 0.8:
        warnings.append(ProcessingWarning.SIGNIFICANT_SKEW)
        matrix = cv2.getRotationMatrix2D((gray.shape[1] / 2, gray.shape[0] / 2), skew, 1.0)
        gray = cv2.warpAffine(
            gray,
            matrix,
            (gray.shape[1], gray.shape[0]),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE,
        )
        # Image was rotated by +skew; store the applied deskew angle for inverse mapping.
        deskew_angle = float(skew)

    contrast = float(gray.std())
    if contrast < 35:
        gray = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            8,
        )

    processed = Image.fromarray(gray)
    transform = ImageTransformMetadata(
        source_width=src_w,
        source_height=src_h,
        source_coordinate_space=source_coordinate_space,
        render_dpi=float(render_dpi) if render_dpi is not None else None,
        render_scale=float(render_scale),
        rendered_width=float(width),
        rendered_height=float(height),
        embedded_rotation=float(embedded_rotation),
        orientation_rotation_applied=0.0,
        deskew_angle=deskew_angle,
        osd_rotation=0,
        pre_osd_width=float(processed.size[0]),
        pre_osd_height=float(processed.size[1]),
        processed_width=float(processed.size[0]),
        processed_height=float(processed.size[1]),
        exif_orientation_applied=exif_applied,
        warnings=list(warnings),
    )
    return PreprocessResult(image=processed, transform=transform, warnings=warnings)


def run_ocr(
    image: Image.Image,
    *,
    settings: Settings | None = None,
    source_coordinate_space: str = SOURCE_OCR_IMAGE_PIXELS,
    source_width: float | None = None,
    source_height: float | None = None,
    render_dpi: float | None = None,
    render_scale: float = 1.0,
    embedded_rotation: float = 0.0,
    apply_exif: bool = True,
) -> OcrResult:
    cfg = settings or get_settings()
    preprocessed = preprocess_for_ocr(
        image,
        settings=cfg,
        source_coordinate_space=source_coordinate_space,
        source_width=source_width,
        source_height=source_height,
        render_dpi=render_dpi,
        render_scale=render_scale,
        embedded_rotation=embedded_rotation,
        apply_exif=apply_exif,
    )
    processed = preprocessed.image
    transform = preprocessed.transform
    warnings = list(preprocessed.warnings)

    try:
        osd = pytesseract.image_to_osd(processed, output_type=pytesseract.Output.DICT)
        rotate = int(osd.get("rotate", 0) or 0)
        if rotate in {90, 180, 270}:
            transform.pre_osd_width = float(processed.size[0])
            transform.pre_osd_height = float(processed.size[1])
            processed = processed.rotate(-rotate, expand=True)
            transform.osd_rotation = rotate
            transform.orientation_rotation_applied = float(rotate)
            transform.processed_width = float(processed.size[0])
            transform.processed_height = float(processed.size[1])
            warnings.append(ProcessingWarning.PAGE_ROTATION_CORRECTED)
    except pytesseract.TesseractError:
        pass

    transform.processed_width = float(processed.size[0])
    transform.processed_height = float(processed.size[1])
    if transform.pre_osd_width is None:
        transform.pre_osd_width = transform.processed_width
    if transform.pre_osd_height is None:
        transform.pre_osd_height = transform.processed_height

    data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
    words: list[OcrWord] = []
    confidences: list[float] = []
    tokens: list[str] = []

    n = len(data.get("text", []))
    for index in range(n):
        word = (data["text"][index] or "").strip()
        conf = float(data["conf"][index])
        if not word or conf < 0:
            continue
        tokens.append(word)
        confidences.append(conf)
        words.append(
            OcrWord(
                text=word,
                confidence=conf,
                source_bbox=BBox(
                    x0=float(data["left"][index]),
                    y0=float(data["top"][index]),
                    x1=float(data["left"][index] + data["width"][index]),
                    y1=float(data["top"][index] + data["height"][index]),
                ),
                page_num=int(data.get("page_num", [1])[index]),
                block_num=int(data.get("block_num", [0])[index]),
                par_num=int(data.get("par_num", [0])[index]),
                line_num=int(data.get("line_num", [0])[index]),
                word_num=int(data.get("word_num", [0])[index]),
            )
        )

    text = pytesseract.image_to_string(processed).strip()
    if not text and tokens:
        text = " ".join(tokens)

    average_confidence = float(sum(confidences) / len(confidences)) if confidences else None
    if average_confidence is not None and average_confidence < cfg.doc_processing_ocr_low_confidence:
        warnings.append(ProcessingWarning.LOW_OCR_CONFIDENCE)

    if not text.strip():
        warnings.append(ProcessingWarning.MOSTLY_BLANK_PAGE)

    aspect = max(image.size) / max(1, min(image.size))
    if aspect > 1.6 and average_confidence is not None and average_confidence < 70:
        warnings.append(ProcessingWarning.PERSPECTIVE_DISTORTION)

    transform.warnings = sorted(set(warnings))
    return OcrResult(
        text=text,
        words=words,
        average_confidence=average_confidence,
        transform=transform,
        warnings=sorted(set(warnings)),
    )


def ocr_words_to_schema_blocks(result: OcrResult) -> list[dict[str, Any]]:
    from app.modules.company_incorporation.document_processing.blocks import (
        make_block,
        order_ocr_word_blocks,
    )

    blocks: list[dict[str, Any]] = []
    for word in result.words:
        canonical = ocr_pixel_bbox_to_canonical(word.source_bbox, transform=result.transform)
        blocks.append(
            make_block(
                block_type="word",
                text=word.text,
                bbox=canonical,
                source_bbox=word.source_bbox,
                source_coordinate_space=SOURCE_OCR_IMAGE_PIXELS,
                confidence=word.confidence,
                extra={
                    "page_num": word.page_num,
                    "block_num": word.block_num,
                    "par_num": word.par_num,
                    "line_num": word.line_num,
                    "word_num": word.word_num,
                },
            )
        )
    return order_ocr_word_blocks(blocks)
