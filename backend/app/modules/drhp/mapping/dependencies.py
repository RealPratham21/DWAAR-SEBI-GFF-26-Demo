"""Chapter generation dependency graph."""

from __future__ import annotations

from app.modules.drhp.constants import ALL_CHAPTER_KEYS, GenerationPhase
from app.modules.drhp.mapping.chapters import CHAPTER_MAPPINGS, ChapterMapping


CHAPTER_DEPENDENCIES: dict[str, tuple[str, ...]] = {
    mapping.chapter_key: mapping.dependency_chapters for mapping in CHAPTER_MAPPINGS.values()
}


def get_dependency_chapters(chapter_key: str) -> tuple[str, ...]:
    return CHAPTER_DEPENDENCIES.get(chapter_key, ())


def get_generation_phase(chapter_key: str) -> str:
    mapping = CHAPTER_MAPPINGS.get(chapter_key)
    if mapping is None:
        return GenerationPhase.CORE_SUBSTANTIVE
    return mapping.generation_phase


def validate_dependency_graph() -> list[str]:
    """Return list of cycle errors; empty if acyclic."""
    errors: list[str] = []
    visiting: set[str] = set()
    visited: set[str] = set()

    def dfs(node: str, stack: list[str]) -> None:
        if node in visiting:
            errors.append(f"Cycle detected: {' -> '.join(stack + [node])}")
            return
        if node in visited:
            return
        visiting.add(node)
        for dep in CHAPTER_DEPENDENCIES.get(node, ()):
            if dep not in ALL_CHAPTER_KEYS:
                errors.append(f"Unknown dependency {dep} for chapter {node}")
                continue
            dfs(dep, stack + [node])
        visiting.remove(node)
        visited.add(node)

    for key in ALL_CHAPTER_KEYS:
        dfs(key, [])
    return errors
