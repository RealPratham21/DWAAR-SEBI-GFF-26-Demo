"""Centralized DRHP chapter mapping registry."""

from app.modules.drhp.mapping.chapters import (
    CHAPTER_MAPPINGS,
    ChapterMapping,
    get_chapter_mapping,
    iter_chapter_mappings,
)
from app.modules.drhp.mapping.dependencies import (
    CHAPTER_DEPENDENCIES,
    get_dependency_chapters,
    get_generation_phase,
    validate_dependency_graph,
)
from app.modules.drhp.mapping.impact import get_affected_chapters_for_workstream

__all__ = [
    "CHAPTER_DEPENDENCIES",
    "CHAPTER_MAPPINGS",
    "ChapterMapping",
    "get_affected_chapters_for_workstream",
    "get_chapter_mapping",
    "get_dependency_chapters",
    "get_generation_phase",
    "iter_chapter_mappings",
    "validate_dependency_graph",
]
