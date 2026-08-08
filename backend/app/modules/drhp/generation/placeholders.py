"""Document-wide placeholder registry for DRHP generation."""

from __future__ import annotations

from app.modules.drhp.constants import PLACEHOLDER_TOKEN
from app.modules.drhp.sources.models import ChapterSourceBundle, PlaceholderRef


def collect_placeholders_from_bundle(bundle: ChapterSourceBundle) -> list[PlaceholderRef]:
    """Return placeholders declared by a chapter source bundle."""
    return list(bundle.allowed_placeholders)


def build_document_placeholder_registry(
    bundles: dict[str, ChapterSourceBundle],
) -> list[PlaceholderRef]:
    """Aggregate chapter placeholders into a document-wide registry."""
    seen: set[str] = set()
    registry: list[PlaceholderRef] = []
    for bundle in bundles.values():
        for placeholder in bundle.allowed_placeholders:
            if placeholder.placeholder_id in seen:
                continue
            seen.add(placeholder.placeholder_id)
            registry.append(placeholder)
    return registry


def is_allowed_placeholder_token(value: str) -> bool:
    """True when value uses the canonical unresolved-information token."""
    return PLACEHOLDER_TOKEN in value
