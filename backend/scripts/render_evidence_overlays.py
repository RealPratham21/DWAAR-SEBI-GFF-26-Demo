#!/usr/bin/env python3
"""Render canonical upright pages with persisted schema-v2 block overlays.

Development verification only. Writes annotated images under:
  backend/.evidence-overlays/ (gitignored)
"""

from __future__ import annotations

import argparse
import sys
import uuid
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont, ImageOps
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

# Allow running as `python scripts/render_evidence_overlays.py` from backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402
from app.models.document_page import DocumentPage  # noqa: E402
from app.models.document_processing_run import DocumentProcessingRun  # noqa: E402
from app.models.document_version import DocumentVersion  # noqa: E402
from app.storage import get_object_storage  # noqa: E402


OUTPUT_DIR = BACKEND_ROOT / ".evidence-overlays"


def _font(size: int = 14) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size=size)
    except OSError:
        return ImageFont.load_default()


def _render_canonical_page(
    *,
    local_path: Path,
    content_type: str,
    page_number: int,
    metadata: dict,
) -> Image.Image:
    normalized = content_type.lower().split(";")[0].strip()
    if normalized == "application/pdf":
        doc = fitz.open(local_path)
        try:
            page = doc.load_page(page_number - 1)
            dpi = metadata.get("render_dpi") or 150
            scale = float(dpi) / 72.0
            if metadata.get("extraction_hint") == "native":
                # Match upright page dimensions without OCR-scale dependency.
                pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            else:
                render_scale = float(metadata.get("render_scale") or scale)
                pix = page.get_pixmap(matrix=fitz.Matrix(render_scale, render_scale), alpha=False)
            return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        finally:
            doc.close()

    with Image.open(local_path) as image:
        image.load()
        return ImageOps.exif_transpose(image).convert("RGB")


def _draw_blocks(image: Image.Image, blocks: list[dict], *, title: str) -> Image.Image:
    canvas = image.copy()
    draw = ImageDraw.Draw(canvas)
    font = _font(12)
    draw.text((8, 8), title, fill=(220, 30, 30), font=_font(16))
    width, height = canvas.size
    for block in blocks:
        bbox = block.get("bbox") or {}
        try:
            x0 = float(bbox["x0"]) * width
            y0 = float(bbox["y0"]) * height
            x1 = float(bbox["x1"]) * width
            y1 = float(bbox["y1"]) * height
        except (KeyError, TypeError, ValueError):
            continue
        draw.rectangle((x0, y0, x1, y1), outline=(30, 120, 220), width=2)
        block_id = str(block.get("block_id") or "")[:8]
        label = f"{block.get('order_index', '?')}:{block_id}"
        draw.text((x0 + 2, max(0, y0 - 14)), label, fill=(20, 90, 180), font=font)
    return canvas


def render_page_overlay(
    db: Session,
    *,
    page_id: uuid.UUID,
    output_dir: Path = OUTPUT_DIR,
) -> Path:
    page = db.get(DocumentPage, page_id)
    if page is None:
        raise SystemExit(f"Page not found: {page_id}")
    run = db.get(DocumentProcessingRun, page.processing_run_id)
    version = db.get(DocumentVersion, page.document_version_id)
    if run is None or version is None:
        raise SystemExit("Missing run or version for page")

    output_dir.mkdir(parents=True, exist_ok=True)
    storage = get_object_storage()
    tmp = output_dir / f"source-{version.id}{Path(version.original_filename).suffix}"
    storage.download_object(storage_key=version.storage_key, destination=tmp)

    metadata = dict(page.coordinate_metadata or {})
    if page.extraction_method == "native_text":
        metadata["extraction_hint"] = "native"
    image = _render_canonical_page(
        local_path=tmp,
        content_type=version.content_type,
        page_number=page.page_number,
        metadata=metadata,
    )
    annotated = _draw_blocks(
        image,
        list(page.text_blocks or []),
        title=f"run={str(run.id)[:8]} page={page.page_number} schema={run.output_schema_version}",
    )
    out = output_dir / f"{version.original_filename}-p{page.page_number}-{str(page.id)[:8]}.png"
    annotated.save(out)
    return out


def render_latest_for_filename(
    db: Session,
    *,
    filename_substr: str,
    output_dir: Path = OUTPUT_DIR,
) -> list[Path]:
    versions = db.scalars(
        select(DocumentVersion)
        .where(DocumentVersion.original_filename.ilike(f"%{filename_substr}%"))
        .order_by(DocumentVersion.created_at.desc())
    ).all()
    if not versions:
        raise SystemExit(f"No versions matching {filename_substr!r}")
    version = versions[0]
    run = db.scalar(
        select(DocumentProcessingRun)
        .where(
            DocumentProcessingRun.document_version_id == version.id,
            DocumentProcessingRun.status == "completed",
        )
        .order_by(DocumentProcessingRun.attempt_number.desc())
        .limit(1)
    )
    if run is None:
        raise SystemExit(f"No completed run for {version.original_filename}")
    pages = db.scalars(
        select(DocumentPage)
        .where(DocumentPage.processing_run_id == run.id)
        .order_by(DocumentPage.page_number.asc())
    ).all()
    return [render_page_overlay(db, page_id=page.id, output_dir=output_dir) for page in pages]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--page-id", type=uuid.UUID, default=None)
    parser.add_argument(
        "--fixture",
        action="append",
        default=[],
        help="Substring of original filename (repeatable)",
    )
    parser.add_argument(
        "--defaults",
        action="store_true",
        help="Render overlays for COI clean/scanned, INC-22, PAN photo",
    )
    args = parser.parse_args()

    settings = get_settings()
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    fixtures = list(args.fixture)
    if args.defaults:
        fixtures.extend(
            [
                "01-nivara-certificate-of-incorporation",
                "12-nivara-certificate-of-incorporation-scanned",
                "05-nivara-inc22-registered-office",
                "13-nivara-pan-mobile-photo",
            ]
        )

    with SessionLocal() as db:
        outputs: list[Path] = []
        if args.page_id:
            outputs.append(render_page_overlay(db, page_id=args.page_id))
        for fixture in fixtures:
            outputs.extend(render_latest_for_filename(db, filename_substr=fixture))
        if not outputs:
            parser.error("Provide --page-id, --fixture, or --defaults")
        for path in outputs:
            print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
