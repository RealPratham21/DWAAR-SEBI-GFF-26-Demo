"""Structured JSON contracts for Dwaar Copilot Lite."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from pydantic import Field, field_validator

from app.modules.drhp.schemas import ApiModel

CopilotSpanStyle = Literal["plain", "bold", "muted"]


class CopilotTextSpan(ApiModel):
    text: str
    style: CopilotSpanStyle = "plain"


class CopilotGroundedIn(ApiModel):
    chapter_key: str = ""
    chapter_title: str = ""
    block_id: str = ""


class CopilotAnswer(ApiModel):
    blocks: list[dict[str, Any]] = Field(default_factory=list)


class CopilotStructuredResponse(ApiModel):
    answer: CopilotAnswer
    grounded_in: CopilotGroundedIn = Field(default_factory=CopilotGroundedIn)


class CopilotChatMessage(ApiModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class CopilotChatRequest(ApiModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[CopilotChatMessage] = Field(default_factory=list, max_length=12)
    document_version_id: UUID | None = None
    chapter_key: str | None = None
    block_id: str | None = None
    route: str = "/projects/demo/drhp"


class CopilotChatResponse(ApiModel):
    answer: CopilotAnswer
    grounded_in: CopilotGroundedIn
    model: str = ""


def copilot_response_json_schema() -> dict[str, Any]:
    """JSON schema for Cohere structured output.

    Cohere rejects object types without at least one required field, so we only
    ask for answer.blocks here. grounded_in is always attached server-side.
    """
    return {
        "type": "object",
        "properties": {
            "answer": {
                "type": "object",
                "properties": {
                    "blocks": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {
                                    "type": "string",
                                    "enum": ["heading", "paragraph", "bullets", "callout"],
                                },
                                "level": {"type": "integer"},
                                "text": {"type": "string"},
                                "spans": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "text": {"type": "string"},
                                            "style": {
                                                "type": "string",
                                                "enum": ["plain", "bold", "muted"],
                                            },
                                        },
                                        "required": ["text"],
                                    },
                                },
                                "items": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "variant": {
                                    "type": "string",
                                    "enum": ["note", "warning"],
                                },
                            },
                            "required": ["type"],
                        },
                    },
                },
                "required": ["blocks"],
            },
        },
        "required": ["answer"],
    }


def normalize_block(raw: dict[str, Any]) -> dict[str, Any]:
    block_type = str(raw.get("type") or "paragraph")
    if block_type == "heading":
        return {
            "type": "heading",
            "level": int(raw.get("level") or 2),
            "text": str(raw.get("text") or "").strip(),
        }
    if block_type == "paragraph":
        spans = raw.get("spans") or []
        normalized_spans: list[dict[str, str]] = []
        if isinstance(spans, list):
            for span in spans:
                if not isinstance(span, dict):
                    continue
                text = str(span.get("text") or "")
                if not text:
                    continue
                style = span.get("style") or "plain"
                if style not in {"plain", "bold", "muted"}:
                    style = "plain"
                normalized_spans.append({"text": text, "style": style})
        if not normalized_spans and raw.get("text"):
            normalized_spans = [{"text": str(raw["text"]), "style": "plain"}]
        return {"type": "paragraph", "spans": normalized_spans}
    if block_type == "bullets":
        items = raw.get("items") or []
        return {
            "type": "bullets",
            "items": [str(item).strip() for item in items if str(item).strip()],
        }
    if block_type == "callout":
        variant = raw.get("variant") or "note"
        if variant not in {"note", "warning"}:
            variant = "note"
        return {"type": "callout", "variant": variant, "text": str(raw.get("text") or "").strip()}
    return {"type": "paragraph", "spans": [{"text": str(raw), "style": "plain"}]}


class CopilotStructuredResponseValidated(CopilotStructuredResponse):
    @field_validator("answer", mode="before")
    @classmethod
    def normalize_answer(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        blocks = value.get("blocks") or []
        if not isinstance(blocks, list):
            return value
        cleaned = [normalize_block(item) for item in blocks if isinstance(item, dict)]
        return {"blocks": [item for item in cleaned if item.get("text") or item.get("spans") or item.get("items")]}
