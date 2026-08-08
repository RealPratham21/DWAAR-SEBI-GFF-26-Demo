"""Tests for Cohere DRHP response parsing."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.modules.drhp.cohere.provider import _extract_response_text


def test_extract_response_text_skips_thinking_blocks() -> None:
    response = SimpleNamespace(
        finish_reason="COMPLETE",
        message=SimpleNamespace(
            content=[
                SimpleNamespace(type="thinking", thinking="internal reasoning"),
                SimpleNamespace(type="text", text='{"hello":"world"}'),
            ]
        ),
    )
    assert _extract_response_text(response) == '{"hello":"world"}'


def test_extract_response_text_raises_when_only_thinking() -> None:
    response = SimpleNamespace(
        finish_reason="MAX_TOKENS",
        message=SimpleNamespace(
            content=[SimpleNamespace(type="thinking", thinking="only reasoning")]
        ),
    )
    with pytest.raises(ValueError, match="finish_reason=MAX_TOKENS"):
        _extract_response_text(response)
