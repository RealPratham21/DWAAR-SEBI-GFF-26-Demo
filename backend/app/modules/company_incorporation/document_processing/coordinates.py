"""Canonical evidence coordinate transforms for schema-v2 page blocks."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


COORDINATE_SPACE_NORMALIZED = "normalized_canonical_page"
SOURCE_PDF_POINTS = "pdf_points"
SOURCE_OCR_IMAGE_PIXELS = "ocr_image_pixels"
SOURCE_IMAGE_PIXELS = "image_pixels"


@dataclass
class BBox:
    x0: float
    y0: float
    x1: float
    y1: float

    def as_dict(self) -> dict[str, float]:
        return {
            "x0": float(self.x0),
            "y0": float(self.y0),
            "x1": float(self.x1),
            "y1": float(self.y1),
        }

    def clamp01(self) -> BBox:
        return BBox(
            x0=min(max(self.x0, 0.0), 1.0),
            y0=min(max(self.y0, 0.0), 1.0),
            x1=min(max(self.x1, 0.0), 1.0),
            y1=min(max(self.y1, 0.0), 1.0),
        )

    def ordered(self) -> BBox:
        return BBox(
            x0=min(self.x0, self.x1),
            y0=min(self.y0, self.y1),
            x1=max(self.x0, self.x1),
            y1=max(self.y0, self.y1),
        )


@dataclass
class ImageTransformMetadata:
    """Transforms applied between source page image and final OCR image."""

    source_width: float
    source_height: float
    source_coordinate_space: str
    render_dpi: float | None = None
    render_scale: float = 1.0
    rendered_width: float | None = None
    rendered_height: float | None = None
    embedded_rotation: float = 0.0
    orientation_rotation_applied: float = 0.0
    deskew_angle: float = 0.0
    osd_rotation: int = 0
    pre_osd_width: float | None = None
    pre_osd_height: float | None = None
    processed_width: float = 0.0
    processed_height: float = 0.0
    exif_orientation_applied: bool = False
    warnings: list[str] = field(default_factory=list)

    def to_coordinate_metadata(self) -> dict[str, Any]:
        return {
            "coordinate_space": COORDINATE_SPACE_NORMALIZED,
            "canonical_orientation": "upright",
            "source_coordinate_space": self.source_coordinate_space,
            "source_width": float(self.source_width),
            "source_height": float(self.source_height),
            "processed_width": float(self.processed_width),
            "processed_height": float(self.processed_height),
            "render_dpi": self.render_dpi,
            "render_scale": float(self.render_scale),
            "rendered_width": self.rendered_width,
            "rendered_height": self.rendered_height,
            "embedded_rotation": float(self.embedded_rotation),
            "orientation_rotation_applied": float(self.orientation_rotation_applied),
            "deskew_angle": float(self.deskew_angle),
            "osd_rotation": int(self.osd_rotation),
            "pre_osd_width": self.pre_osd_width,
            "pre_osd_height": self.pre_osd_height,
            "exif_orientation_applied": self.exif_orientation_applied,
            "transform_matrix": None,
        }


def upright_page_dimensions(width: float, height: float, rotation: float) -> tuple[float, float]:
    rot = int(rotation) % 360
    if rot in {90, 270}:
        return float(height), float(width)
    return float(width), float(height)


def _rotate_point_cw(x: float, y: float, width: float, height: float, degrees: int) -> tuple[float, float]:
    rot = degrees % 360
    if rot == 0:
        return x, y
    if rot == 90:
        return height - y, x
    if rot == 180:
        return width - x, height - y
    if rot == 270:
        return y, width - x
    # Arbitrary angles are not used for PDF embedded rotation.
    return x, y


def pdf_bbox_to_upright(
    bbox: BBox,
    *,
    page_width: float,
    page_height: float,
    rotation: float,
) -> tuple[BBox, float, float]:
    """Map a PDF-points bbox into upright page space (still in points)."""
    rot = int(rotation) % 360
    corners = [
        (bbox.x0, bbox.y0),
        (bbox.x1, bbox.y0),
        (bbox.x1, bbox.y1),
        (bbox.x0, bbox.y1),
    ]
    mapped = [_rotate_point_cw(x, y, page_width, page_height, rot) for x, y in corners]
    xs = [point[0] for point in mapped]
    ys = [point[1] for point in mapped]
    upright_w, upright_h = upright_page_dimensions(page_width, page_height, rot)
    return (
        BBox(min(xs), min(ys), max(xs), max(ys)).ordered(),
        upright_w,
        upright_h,
    )


def normalize_bbox(bbox: BBox, width: float, height: float) -> BBox:
    width = max(float(width), 1e-9)
    height = max(float(height), 1e-9)
    return BBox(
        x0=bbox.x0 / width,
        y0=bbox.y0 / height,
        x1=bbox.x1 / width,
        y1=bbox.y1 / height,
    ).ordered().clamp01()


def _inverse_expand_rotate_point(
    x: float,
    y: float,
    *,
    before_width: float,
    before_height: float,
    rotation_cw: int,
) -> tuple[float, float]:
    """Inverse of Pillow rotate(-rotation_cw, expand=True) for axis-aligned angles."""
    rot = rotation_cw % 360
    if rot == 0:
        return x, y
    if rot == 90:
        # CW 90 expand: before (w,h) -> after (h,w); before(x,y)->after(h-y,x)
        # inverse: after(x',y') -> before(y', h-x')
        return y, before_height - x
    if rot == 180:
        return before_width - x, before_height - y
    if rot == 270:
        # CW 270 = CCW 90: before(x,y)->after(y, w-x); after size (h,w)
        # inverse: after(x',y') -> before(w-y', x')
        return before_width - y, x
    return x, y


def _rotate_point_around_center(
    x: float,
    y: float,
    *,
    width: float,
    height: float,
    angle_degrees: float,
) -> tuple[float, float]:
    if abs(angle_degrees) < 1e-9:
        return x, y
    cx = width / 2.0
    cy = height / 2.0
    radians = math.radians(angle_degrees)
    cos_a = math.cos(radians)
    sin_a = math.sin(radians)
    dx = x - cx
    dy = y - cy
    return cx + dx * cos_a - dy * sin_a, cy + dx * sin_a + dy * cos_a


def ocr_pixel_bbox_to_canonical(
    bbox: BBox,
    *,
    transform: ImageTransformMetadata,
) -> BBox:
    """Map a bbox in final OCR-image pixels into normalized upright page space."""
    rendered_w = float(transform.rendered_width or transform.source_width)
    rendered_h = float(transform.rendered_height or transform.source_height)
    pre_osd_w = float(transform.pre_osd_width or rendered_w)
    pre_osd_h = float(transform.pre_osd_height or rendered_h)

    corners = [
        (bbox.x0, bbox.y0),
        (bbox.x1, bbox.y0),
        (bbox.x1, bbox.y1),
        (bbox.x0, bbox.y1),
    ]
    mapped: list[tuple[float, float]] = []
    for x, y in corners:
        x1, y1 = _inverse_expand_rotate_point(
            x,
            y,
            before_width=pre_osd_w,
            before_height=pre_osd_h,
            rotation_cw=int(transform.osd_rotation),
        )
        # Deskew applied +deskew_angle to the image; invert with -deskew_angle.
        x2, y2 = _rotate_point_around_center(
            x1,
            y1,
            width=pre_osd_w,
            height=pre_osd_h,
            angle_degrees=-float(transform.deskew_angle),
        )
        mapped.append((x2, y2))

    xs = [point[0] for point in mapped]
    ys = [point[1] for point in mapped]
    rendered_bbox = BBox(min(xs), min(ys), max(xs), max(ys)).ordered()
    return normalize_bbox(rendered_bbox, rendered_w, rendered_h)


def native_pdf_bbox_to_canonical(
    bbox: BBox,
    *,
    page_width: float,
    page_height: float,
    rotation: float,
) -> BBox:
    upright, upright_w, upright_h = pdf_bbox_to_upright(
        bbox,
        page_width=page_width,
        page_height=page_height,
        rotation=rotation,
    )
    return normalize_bbox(upright, upright_w, upright_h)


def validate_normalized_bbox(bbox: dict[str, Any]) -> bool:
    try:
        x0 = float(bbox["x0"])
        y0 = float(bbox["y0"])
        x1 = float(bbox["x1"])
        y1 = float(bbox["y1"])
    except (KeyError, TypeError, ValueError):
        return False
    return (
        0.0 <= x0 <= 1.0
        and 0.0 <= y0 <= 1.0
        and 0.0 <= x1 <= 1.0
        and 0.0 <= y1 <= 1.0
        and x0 <= x1
        and y0 <= y1
    )
