"""Cohere-backed semantic structured fact extraction provider."""

from __future__ import annotations

import json
import os
import time
from typing import Any

from app.core.config import get_settings
from app.modules.company_incorporation.structured_extraction.constants import (
    StructuredExtractionErrorCode,
)
from app.modules.company_incorporation.structured_extraction.provider_base import (
    SemanticExtractionRequest,
    SemanticExtractionResult,
    semantic_response_json_schema,
)

_TRANSIENT_STATUS_CODES = {408, 409, 429, 500, 502, 503, 504}


class StructuredExtractionProviderError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class CohereStructuredFactExtractionProvider:
    """Call Cohere Chat API V2 with JSON schema structured output."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
        max_retries: int | None = None,
        temperature: float | None = None,
        settings: Any | None = None,
    ) -> None:
        settings = settings or get_settings()
        self.api_key = (
            api_key or getattr(settings, "cohere_api_key", None) or os.getenv("COHERE_API_KEY")
        )
        self.model = (
            model
            or getattr(settings, "cohere_model", None)
            or os.getenv("COHERE_MODEL", "command-a-plus-05-2026")
        )
        timeout_raw = timeout_seconds
        if timeout_raw is None:
            timeout_raw = getattr(settings, "cohere_timeout_seconds", None) or os.getenv(
                "COHERE_TIMEOUT_SECONDS", "60"
            )
        self.timeout_seconds = float(timeout_raw)
        retries_raw = max_retries
        if retries_raw is None:
            retries_raw = getattr(settings, "cohere_max_retries", None) or os.getenv(
                "COHERE_MAX_RETRIES", "2"
            )
        self.max_retries = int(retries_raw)
        temp_raw = temperature
        if temp_raw is None:
            temp_raw = getattr(settings, "cohere_temperature", None) or os.getenv(
                "COHERE_TEMPERATURE", "0"
            )
        self.temperature = float(temp_raw)
        self._client = None

    def extract(self, request: SemanticExtractionRequest) -> SemanticExtractionResult:
        if not self.api_key:
            raise StructuredExtractionProviderError(
                StructuredExtractionErrorCode.MISSING_API_KEY,
                "COHERE_API_KEY is required for semantic structured extraction.",
            )
        client = self._get_client()
        payload = request.model_dump(by_alias=True, mode="json")
        prompt = _build_prompt(payload)
        schema = semantic_response_json_schema()
        last_error: Exception | None = None

        for attempt in range(self.max_retries + 1):
            try:
                response = client.chat(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=self.temperature,
                    response_format={
                        "type": "json_object",
                        "schema": schema,
                    },
                    request_options={"timeout_in_seconds": self.timeout_seconds},
                )
                raw_text = _extract_response_text(response)
                parsed = json.loads(raw_text)
                return SemanticExtractionResult.model_validate(parsed)
            except ImportError as exc:
                raise StructuredExtractionProviderError(
                    StructuredExtractionErrorCode.PROVIDER_UNAVAILABLE,
                    "cohere package is not installed; install cohere to use semantic extraction.",
                ) from exc
            except StructuredExtractionProviderError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt >= self.max_retries or not _is_transient_error(exc):
                    break
                time.sleep(min(2**attempt, 4))

        message = "Cohere semantic extraction failed."
        if last_error is not None:
            message = f"{message} {type(last_error).__name__}: {last_error}"
        raise StructuredExtractionProviderError(
            StructuredExtractionErrorCode.PROVIDER_ERROR,
            message,
        )

    def _get_client(self) -> Any:
        if self._client is not None:
            return self._client
        try:
            import cohere
        except ImportError as exc:
            raise StructuredExtractionProviderError(
                StructuredExtractionErrorCode.PROVIDER_UNAVAILABLE,
                "cohere package is not installed.",
            ) from exc
        self._client = cohere.ClientV2(api_key=self.api_key, timeout=self.timeout_seconds)
        return self._client


def _build_prompt(payload: dict[str, Any]) -> str:
    compact = json.dumps(payload, ensure_ascii=True, separators=(",", ":"))
    return (
        "Extract structured facts from the supplied evidence-ready document pages. "
        "Return JSON only. Use factKey values from expectedFacts. "
        "Evidence block IDs must come from the supplied pages and must support each value. "
        "If a fact is absent, include it in missingExpectedFacts with reason not_found. "
        "Do not compare against external records.\n\n"
        f"INPUT={compact}"
    )


def _extract_response_text(response: Any) -> str:
    message = getattr(response, "message", None)
    if message is not None:
        content = getattr(message, "content", None)
        if isinstance(content, list):
            for item in content:
                text = getattr(item, "text", None)
                if text:
                    return str(text)
        text = getattr(message, "content", None)
        if isinstance(text, str):
            return text
    text = getattr(response, "text", None)
    if text:
        return str(text)
    raise StructuredExtractionProviderError(
        StructuredExtractionErrorCode.VALIDATION_FAILED,
        "Cohere response did not contain JSON text content.",
    )


def _is_transient_error(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    if status_code in _TRANSIENT_STATUS_CODES:
        return True
    message = str(exc).casefold()
    transient_tokens = ("timeout", "rate limit", "temporarily unavailable", "connection")
    return any(token in message for token in transient_tokens)
