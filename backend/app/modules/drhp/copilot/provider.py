"""Cohere + fake providers for Dwaar Copilot Lite."""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Protocol

from app.core.config import Settings, get_settings
from app.modules.drhp.cohere.config import build_cohere_provider
from app.modules.drhp.cohere.provider import _extract_response_text
from app.modules.drhp.copilot.prompts import build_chat_messages
from app.modules.drhp.copilot.schemas import (
    CopilotAnswer,
    CopilotChatMessage,
    CopilotGroundedIn,
    CopilotStructuredResponse,
    CopilotStructuredResponseValidated,
    copilot_response_json_schema,
    normalize_block,
)

logger = logging.getLogger(__name__)


class CopilotProvider(Protocol):
    def chat(
        self,
        *,
        message: str,
        context: dict[str, Any],
        history: list[CopilotChatMessage],
        grounded_in: CopilotGroundedIn,
    ) -> tuple[CopilotStructuredResponse, str]: ...


class FakeCopilotProvider:
    """Deterministic structured responses for tests and environments without Cohere keys."""

    def chat(
        self,
        *,
        message: str,
        context: dict[str, Any],
        history: list[CopilotChatMessage],
        grounded_in: CopilotGroundedIn,
    ) -> tuple[CopilotStructuredResponse, str]:
        selection = context.get("selection") or {}
        issuer = context.get("issuerName") or "the issuer"
        blocks: list[dict[str, Any]] = [
            normalize_block({"type": "heading", "level": 2, "text": "Copilot preview"}),
            normalize_block(
                {
                    "type": "paragraph",
                    "spans": [
                        {"text": "You asked about ", "style": "plain"},
                        {"text": message.strip()[:120], "style": "bold"},
                        {"text": f" for {issuer}.", "style": "plain"},
                    ],
                },
            ),
        ]
        if selection:
            preview = str(selection.get("textPreview") or "")[:240]
            bullet_items = [
                f"Selected block: {selection.get('blockId', grounded_in.block_id)}",
                f"Support: {selection.get('supportState', 'unknown')}",
            ]
            if preview:
                bullet_items.append(f"Excerpt: {preview}…")
            blocks.append(normalize_block({"type": "bullets", "items": bullet_items}))
            refs = selection.get("sourceRefs") or []
            if refs:
                ref = refs[0]
                blocks.append(
                    normalize_block(
                        {
                            "type": "paragraph",
                            "spans": [
                                {"text": "Primary source: ", "style": "plain"},
                                {
                                    "text": str(
                                        ref.get("fieldPath") or ref.get("fieldLabel") or "workstream",
                                    ),
                                    "style": "bold",
                                },
                            ],
                        },
                    ),
                )
        else:
            blocks.append(
                normalize_block(
                    {
                        "type": "callout",
                        "variant": "note",
                        "text": "Select a paragraph in the DRHP preview to ask block-specific questions.",
                    },
                ),
            )
        blocks.append(
            normalize_block(
                {
                    "type": "callout",
                    "variant": "note",
                    "text": "Preparation guidance only — not legal or filing advice.",
                },
            ),
        )
        response = CopilotStructuredResponse(
            answer=CopilotAnswer(blocks=blocks),
            grounded_in=grounded_in,
        )
        return response, "fake-copilot"


def _normalize_cohere_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Accept camelCase payloads from Cohere before Pydantic validation."""
    normalized = dict(data)
    if "groundedIn" in normalized and "grounded_in" not in normalized:
        normalized["grounded_in"] = normalized.pop("groundedIn")
    grounded = normalized.get("grounded_in")
    if isinstance(grounded, dict):
        grounded = dict(grounded)
        for snake, camel in (
            ("chapter_key", "chapterKey"),
            ("chapter_title", "chapterTitle"),
            ("block_id", "blockId"),
        ):
            if camel in grounded and snake not in grounded:
                grounded[snake] = grounded[camel]
        normalized["grounded_in"] = grounded
    return normalized


class CohereCopilotProvider:
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
        self._active_key = ""

    def _get_client(self):
        if self._client is None:
            import cohere

            key = self.provider.key_pool.acquire_key()
            if not key or key == "__unset__":
                raise RuntimeError("No Cohere API key configured for Copilot.")
            self._client = cohere.ClientV2(api_key=key)
            self._active_key = key
        return self._client

    def _parse_structured_response(
        self,
        raw: str,
        grounded_in: CopilotGroundedIn,
    ) -> CopilotStructuredResponseValidated:
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("Copilot response was not a JSON object.")
        parsed = CopilotStructuredResponseValidated.model_validate(_normalize_cohere_payload(data))
        if not parsed.answer.blocks:
            raise ValueError("Copilot response contained no renderable blocks.")
        return parsed.model_copy(update={"grounded_in": grounded_in})

    def chat(
        self,
        *,
        message: str,
        context: dict[str, Any],
        history: list[CopilotChatMessage],
        grounded_in: CopilotGroundedIn,
    ) -> tuple[CopilotStructuredResponse, str]:
        schema = copilot_response_json_schema()
        messages = build_chat_messages(message=message, context=context, history=history)
        client = self._get_client()
        last_error: Exception | None = None
        thinking_budget = max(512, int(self.settings.cohere_drhp_thinking_token_budget))
        max_tokens = max(2048, min(int(self.settings.cohere_drhp_max_tokens), 4096))
        logger.info(
            "Copilot Cohere call model=%s message=%r chapter=%s block=%s history_len=%d",
            self.model,
            message[:300],
            grounded_in.chapter_key,
            grounded_in.block_id,
            len(history),
        )
        logger.debug(
            "Copilot Cohere request messages=%s",
            json.dumps(messages, ensure_ascii=False, default=str)[:16000],
        )
        for attempt in range(self.max_retries + 1):
            try:
                response = client.chat(
                    model=self.model,
                    messages=messages,
                    response_format={"type": "json_object", "schema": schema},
                    temperature=min(0.3, float(self.settings.cohere_temperature) or 0.2),
                    max_tokens=max_tokens,
                    thinking={"type": "enabled", "token_budget": thinking_budget},
                )
                raw = _extract_response_text(response)
                logger.info(
                    "Copilot Cohere response finish_reason=%s raw_len=%d attempt=%d",
                    getattr(response, "finish_reason", None),
                    len(raw),
                    attempt + 1,
                )
                logger.debug("Copilot Cohere raw response=%s", raw[:16000])
                parsed = self._parse_structured_response(raw, grounded_in)
                logger.debug(
                    "Copilot Cohere parsed blocks=%s",
                    json.dumps(parsed.answer.blocks, ensure_ascii=False, default=str)[:16000],
                )
                if hasattr(self.provider, "key_pool") and self._active_key:
                    self.provider.key_pool.release_key(self._active_key)
                return parsed, self.model
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                status = getattr(getattr(exc, "response", None), "status_code", None)
                rate_limited = status == 429
                if hasattr(self.provider, "key_pool") and self._active_key:
                    self.provider.key_pool.release_key(self._active_key, rate_limited=rate_limited)
                    self._client = None
                    self._active_key = ""
                if attempt >= self.max_retries:
                    break
                if "did not contain JSON text content" in str(exc):
                    thinking_budget = max(512, thinking_budget // 2)
                    logger.warning(
                        "Copilot Cohere returned no JSON text attempt=%d; retrying with thinking_token_budget=%d",
                        attempt + 1,
                        thinking_budget,
                    )
                time.sleep(min(2**attempt, 4))
        logger.error("Copilot Cohere chat failed after retries: %s", last_error)
        raise RuntimeError("Copilot chat failed") from last_error


class ResilientCopilotProvider:
    """Use live Cohere when configured; fall back to deterministic responses on failure."""

    def __init__(
        self,
        primary: CohereCopilotProvider,
        fallback: FakeCopilotProvider,
    ) -> None:
        self.primary = primary
        self.fallback = fallback

    def chat(
        self,
        *,
        message: str,
        context: dict[str, Any],
        history: list[CopilotChatMessage],
        grounded_in: CopilotGroundedIn,
    ) -> tuple[CopilotStructuredResponse, str]:
        try:
            return self.primary.chat(
                message=message,
                context=context,
                history=history,
                grounded_in=grounded_in,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Copilot falling back to offline provider after Cohere failure: %s",
                exc,
            )
            response, model = self.fallback.chat(
                message=message,
                context=context,
                history=history,
                grounded_in=grounded_in,
            )
            blocks = list(response.answer.blocks)
            blocks.insert(
                0,
                normalize_block(
                    {
                        "type": "callout",
                        "variant": "warning",
                        "text": (
                            "Live Copilot is temporarily unavailable. "
                            "Showing a contextual offline summary instead."
                        ),
                    },
                ),
            )
            return (
                CopilotStructuredResponse(
                    answer=CopilotAnswer(blocks=blocks),
                    grounded_in=response.grounded_in,
                ),
                model,
            )


def build_copilot_provider(settings: Settings | None = None) -> CopilotProvider:
    settings = settings or get_settings()
    if settings.drhp_use_fake_cohere:
        return FakeCopilotProvider()
    if not (settings.cohere_api_key.strip() or settings.cohere_api_keys.strip()):
        return FakeCopilotProvider()
    return ResilientCopilotProvider(CohereCopilotProvider(settings), FakeCopilotProvider())
