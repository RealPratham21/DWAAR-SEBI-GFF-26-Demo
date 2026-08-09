"""Export font registration with independent style fallbacks and explicit logging."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

EXPORT_BODY_FONT = "ExportBody"
EXPORT_BOLD_FONT = "ExportBody-Bold"
EXPORT_ITALIC_FONT = "ExportBody-Italic"

# Times fallbacks when a TTF style cannot be registered.
TIMES_BODY = "Times-Roman"
TIMES_BOLD = "Times-Bold"
TIMES_ITALIC = "Times-Italic"

# Candidate families in preference order — each tuple is (regular, bold, italic_candidates).
_FONT_FAMILIES: tuple[tuple[str, tuple[str, ...], tuple[str, ...], tuple[str, ...]], ...] = (
    (
        "DejaVuSerif",
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
            "/usr/share/fonts/TTF/DejaVuSerif.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
            "/usr/share/fonts/TTF/DejaVuSerif-Bold.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Oblique.ttf",
            "/usr/share/fonts/TTF/DejaVuSerif-Italic.ttf",
            "/usr/share/fonts/TTF/DejaVuSerif-Oblique.ttf",
        ),
    ),
    (
        "DejaVuSans",
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/TTF/DejaVuSans.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Italic.ttf",
            "/usr/share/fonts/TTF/DejaVuSans-Oblique.ttf",
            "/usr/share/fonts/TTF/DejaVuSans-Italic.ttf",
        ),
    ),
)


@dataclass(frozen=True)
class ExportFontRegistration:
    body: str
    bold: str
    italic: str
    body_path: str | None = None
    bold_path: str | None = None
    italic_path: str | None = None
    fallbacks: list[str] = field(default_factory=list)

    @property
    def uses_unicode_ttf(self) -> bool:
        return self.body.startswith("ExportBody")


def _first_existing(paths: tuple[str, ...]) -> str | None:
    for path in paths:
        if os.path.isfile(path):
            return path
    return None


def _register_ttf(name: str, path: str) -> None:
    pdfmetrics.registerFont(TTFont(name, path))


def register_export_fonts() -> ExportFontRegistration:
    """Register body/bold/italic independently; never discard an entire family for one missing style."""
    fallbacks: list[str] = []
    body_path = bold_path = italic_path = None
    body_name = TIMES_BODY
    bold_name = TIMES_BOLD
    italic_name = TIMES_ITALIC

    for _family_label, regular_paths, bold_paths, italic_paths in _FONT_FAMILIES:
        regular = _first_existing(regular_paths)
        if regular is None:
            continue
        try:
            _register_ttf(EXPORT_BODY_FONT, regular)
            body_path = regular
            body_name = EXPORT_BODY_FONT
        except Exception as exc:  # noqa: BLE001
            fallbacks.append(f"body:{regular}:{exc}")
            continue

        bold_file = _first_existing(bold_paths)
        if bold_file:
            try:
                _register_ttf(EXPORT_BOLD_FONT, bold_file)
                bold_path = bold_file
                bold_name = EXPORT_BOLD_FONT
            except Exception as exc:  # noqa: BLE001
                fallbacks.append(f"bold:{bold_file}:{exc}")
                bold_name = body_name
        else:
            fallbacks.append("bold:missing — using body font")
            bold_name = body_name

        italic_file = _first_existing(italic_paths)
        if italic_file:
            try:
                _register_ttf(EXPORT_ITALIC_FONT, italic_file)
                italic_path = italic_file
                italic_name = EXPORT_ITALIC_FONT
            except Exception as exc:  # noqa: BLE001
                fallbacks.append(f"italic:{italic_file}:{exc}")
                italic_name = body_name
        else:
            fallbacks.append("italic:missing — using body font")
            italic_name = body_name

        break

    if body_name == TIMES_BODY:
        fallbacks.append("family: no Unicode TTF registered — using Times-Roman")

    registration = ExportFontRegistration(
        body=body_name,
        bold=bold_name,
        italic=italic_name,
        body_path=body_path,
        bold_path=bold_path,
        italic_path=italic_path,
        fallbacks=fallbacks,
    )
    logger.info(
        "DRHP export fonts: body=%s (%s) bold=%s (%s) italic=%s (%s) fallbacks=%s",
        registration.body,
        registration.body_path or "builtin",
        registration.bold,
        registration.bold_path or "fallback",
        registration.italic,
        registration.italic_path or "fallback",
        registration.fallbacks or "none",
    )
    return registration
