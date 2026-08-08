"""Cohere DRHP generation provider with fake implementation for tests."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Protocol

from app.core.config import Settings, get_settings
from app.modules.drhp.ast.schemas import CohereStructuredChapterOutput, DrhpSectionAST
from app.modules.drhp.cohere.config import CohereKeyPool, GenerationConcurrencyConfig, build_cohere_provider
from app.modules.drhp.constants import PROMPT_VERSION
from app.modules.drhp.cohere.prompts import build_chapter_prompt

logger = logging.getLogger(__name__)

_TRANSIENT_STATUS = {408, 409, 429, 500, 502, 503, 504}


def _extract_response_text(response: Any) -> str:
    """Extract JSON text from Cohere v2 chat responses (including thinking models)."""
    message = getattr(response, "message", None)
    if message is not None:
        content = getattr(message, "content", None)
        if isinstance(content, list):
            for item in content:
                payload = item.model_dump() if hasattr(item, "model_dump") else item
                if isinstance(payload, dict):
                    if payload.get("type") == "text" and payload.get("text"):
                        return str(payload["text"])
                    continue
                text = getattr(item, "text", None)
                if text:
                    return str(text)
        if isinstance(content, str) and content.strip():
            return content
    text = getattr(response, "text", None)
    if text:
        return str(text)

    content_types: list[str] = []
    if message is not None and isinstance(getattr(message, "content", None), list):
        for item in message.content:
            payload = item.model_dump() if hasattr(item, "model_dump") else item
            if isinstance(payload, dict) and payload.get("type"):
                content_types.append(str(payload["type"]))
            else:
                content_types.append(type(item).__name__)
    finish_reason = getattr(response, "finish_reason", None)
    raise ValueError(
        "Cohere response did not contain JSON text content "
        f"(finish_reason={finish_reason}, content_types={content_types})."
    )


class DrhpGenerationProvider(Protocol):
    def generate_chapter_narrative(
        self,
        *,
        chapter_key: str,
        bundle: dict[str, Any],
        validation_failures: list[str] | None = None,
    ) -> CohereStructuredChapterOutput: ...


@dataclass
class GenerationCallResult:
    output: CohereStructuredChapterOutput
    input_tokens: int | None = None
    output_tokens: int | None = None
    latency_ms: int = 0
    model: str = ""


class FakeDrhpGenerationProvider:
    """Structured fact-based narrative for CI and local development — no generic filler."""

    def generate_chapter_narrative(
        self,
        *,
        chapter_key: str,
        bundle: dict[str, Any],
        validation_failures: list[str] | None = None,
    ) -> CohereStructuredChapterOutput:
        from app.modules.drhp.generation.structured_narrative import (
            InsufficientSourceError,
            build_structured_chapter_narrative,
        )
        from app.modules.drhp.sources.models import ChapterSourceBundle

        try:
            typed_bundle = ChapterSourceBundle.model_validate(bundle)
        except Exception:  # noqa: BLE001
            typed_bundle = ChapterSourceBundle.model_construct(**{k: bundle.get(k) for k in bundle})

        # Snapshots are not in bundle dict — structured builder uses bundle facts/tables.
        # Re-hydrate minimal snapshot dict from bundle global context when needed.
        from app.modules.drhp.workstreams import WorkstreamSnapshot

        snapshots: dict[str, WorkstreamSnapshot] = getattr(self, "_snapshots", {}) or {}
        return build_structured_chapter_narrative(
            chapter_key=chapter_key,
            bundle=typed_bundle,
            snapshots=snapshots,
            validation_failures=validation_failures,
        )

    def set_snapshots(self, snapshots: dict[str, Any]) -> None:
        self._snapshots = snapshots


class CohereDrhpGenerationProvider:
    """Live Cohere structured-output provider for DRHP narrative generation."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.provider = build_cohere_provider(self.settings)
        self.model = (
            self.settings.cohere_drhp_model.strip()
            or self.settings.cohere_model.strip()
            or "command-a-plus-05-2026"
        )
        self.max_retries = max(1, int(self.settings.cohere_max_retries))
        self._client = None

    def _get_client(self):
        if self._client is None:
            import cohere

            key = self.provider.key_pool.acquire_key()
            if not key or key == "__unset__":
                raise RuntimeError("No Cohere API key configured for DRHP generation.")
            self._client = cohere.ClientV2(api_key=key)
            self._active_key = key
        return self._client

    def generate_chapter_narrative(
        self,
        *,
        chapter_key: str,
        bundle: dict[str, Any],
        validation_failures: list[str] | None = None,
    ) -> CohereStructuredChapterOutput:
        prompt = build_chapter_prompt(
            chapter_key=chapter_key,
            bundle=bundle,
            validation_failures=validation_failures,
        )
        schema = CohereStructuredChapterOutput.model_json_schema()
        client = self._get_client()
        last_error: Exception | None = None
        thinking_budget = max(512, int(self.settings.cohere_drhp_thinking_token_budget))
        max_tokens = max(2048, int(self.settings.cohere_drhp_max_tokens))
        for attempt in range(self.max_retries + 1):
            started = time.monotonic()
            try:
                response = client.chat(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object", "schema": schema},
                    temperature=self.settings.cohere_temperature,
                    max_tokens=max_tokens,
                    thinking={"type": "enabled", "token_budget": thinking_budget},
                )
                raw = _extract_response_text(response)
                data = json.loads(raw)
                output = CohereStructuredChapterOutput.model_validate(data)
                if hasattr(self.provider, "key_pool") and hasattr(self, "_active_key"):
                    self.provider.key_pool.release_key(self._active_key)
                logger.info(
                    "DRHP Cohere generation complete chapter=%s latency_ms=%d finish_reason=%s",
                    chapter_key,
                    int((time.monotonic() - started) * 1000),
                    getattr(response, "finish_reason", None),
                )
                return output
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                status = getattr(getattr(exc, "response", None), "status_code", None)
                rate_limited = status == 429
                if hasattr(self.provider, "key_pool") and hasattr(self, "_active_key"):
                    self.provider.key_pool.release_key(self._active_key, rate_limited=rate_limited)
                if attempt >= self.max_retries:
                    break
                if "did not contain JSON text content" in str(exc):
                    thinking_budget = max(512, thinking_budget // 2)
                    logger.warning(
                        "DRHP Cohere returned no JSON text chapter=%s attempt=%d; "
                        "retrying with thinking_token_budget=%d",
                        chapter_key,
                        attempt + 1,
                        thinking_budget,
                    )
                time.sleep(min(2**attempt, 8))
        raise RuntimeError(f"Cohere generation failed for {chapter_key}") from last_error


def build_drhp_generation_provider(settings: Settings | None = None) -> DrhpGenerationProvider:
    settings = settings or get_settings()
    if settings.drhp_use_fake_cohere:
        return FakeDrhpGenerationProvider()
    if not (settings.cohere_api_key.strip() or settings.cohere_api_keys.strip()):
        msg = (
            "COHERE_API_KEY (or COHERE_API_KEYS) is required for DRHP generation. "
            "Set DRHP_USE_FAKE_COHERE=true only in automated tests."
        )
        raise RuntimeError(msg)
    return CohereDrhpGenerationProvider(settings)
