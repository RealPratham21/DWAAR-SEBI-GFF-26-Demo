"""Tests for Dwaar Copilot Lite."""

from __future__ import annotations

import json

import pytest
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.copilot.provider import (
    FakeCopilotProvider,
    ResilientCopilotProvider,
    _normalize_cohere_payload,
)
from app.modules.drhp.copilot.schemas import (
    CopilotChatRequest,
    CopilotGroundedIn,
    CopilotStructuredResponseValidated,
    copilot_response_json_schema,
    normalize_block,
)
from app.modules.drhp.copilot.context import find_block_in_ast
from app.modules.drhp.copilot.postprocess import finalize_copilot_blocks
from app.modules.drhp.copilot.service import copilot_chat


def test_find_block_in_ast() -> None:
    payload = {
        "sections": [
            {
                "sectionKey": "risk",
                "blocks": [
                    {"blockId": "blk-1", "kind": "paragraph", "content": {"text": "Risk text"}},
                ],
            },
        ],
    }
    section, block = find_block_in_ast(payload, "blk-1")
    assert section is not None
    assert block is not None
    assert block["content"]["text"] == "Risk text"


def test_normalize_block_paragraph_spans() -> None:
    block = normalize_block(
        {
            "type": "paragraph",
            "spans": [
                {"text": "Hello ", "style": "plain"},
                {"text": "world", "style": "bold"},
            ],
        },
    )
    assert block["type"] == "paragraph"
    assert len(block["spans"]) == 2


def test_fake_copilot_provider_returns_structured_answer() -> None:
    provider = FakeCopilotProvider()
    grounded = CopilotGroundedIn(
        chapter_key="risk-factors",
        chapter_title="Risk Factors",
        block_id="blk-1",
    )
    response, model = provider.chat(
        message="What supports this disclosure?",
        context={
            "issuerName": "Nivara Techfab Private Limited",
            "selection": {
                "blockId": "blk-1",
                "supportState": "structured_input_backed",
                "textPreview": "Industrial dispute claim",
                "sourceRefs": [{"fieldPath": "litigation.matters[0].title"}],
            },
        },
        history=[],
        grounded_in=grounded,
    )
    assert model == "fake-copilot"
    assert response.answer.blocks
    assert response.grounded_in.block_id == "blk-1"


def test_validated_response_normalizes_blocks() -> None:
    parsed = CopilotStructuredResponseValidated.model_validate(
        {
            "answer": {
                "blocks": [
                    {"type": "heading", "text": "Summary"},
                    {
                        "type": "paragraph",
                        "spans": [{"text": "Supported by ", "style": "plain"}, {"text": "PAN", "style": "bold"}],
                    },
                    {"type": "bullets", "items": ["One", "Two"]},
                    {"type": "callout", "variant": "note", "text": "Not legal advice."},
                ],
            },
            "groundedIn": {"chapterKey": "risk-factors", "blockId": "blk-1"},
        },
    )
    assert len(parsed.answer.blocks) == 4


def test_copilot_chat_service_uses_fake_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    grounded = CopilotGroundedIn(chapter_key="risk-factors", chapter_title="Risk Factors")
    monkeypatch.setattr(
        "app.modules.drhp.copilot.service.build_copilot_context",
        lambda *args, **kwargs: (
            {"issuerName": "Nivara Techfab Private Limited", "selection": None},
            grounded,
        ),
    )
    monkeypatch.setattr(
        "app.modules.drhp.copilot.service.build_copilot_provider",
        lambda: FakeCopilotProvider(),
    )
    user = User(full_name="Test", email="copilot@test.com", phone_e164="+919999999999", password_hash="x")
    response = copilot_chat(
        db=None,  # type: ignore[arg-type]
        user=user,
        request=CopilotChatRequest(message="What should we verify?", chapter_key="risk-factors"),
    )
    assert response.model == "fake-copilot"
    assert response.answer.blocks
    assert response.grounded_in.chapter_key == "risk-factors"


@pytest.mark.postgres
async def test_copilot_chat_api_returns_structured_json(
    auth_client: AsyncClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DRHP_USE_FAKE_COHERE", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()

    register = await auth_client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Copilot User",
            "email": "copilot-api@example.com",
            "phone": "9876543210",
            "password": "Password1",
            "rememberMe": False,
        },
    )
    assert register.status_code == 201
    token = register.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await auth_client.post(
        "/api/v1/drhp/copilot/chat",
        headers=headers,
        json={
            "message": "What is this chapter about?",
            "chapterKey": "risk-factors",
            "route": "/projects/demo/drhp",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "fake-copilot"
    assert body["answer"]["blocks"]
    assert body["answer"]["blocks"][0]["type"] in {"heading", "paragraph", "bullets", "callout"}


def test_copilot_response_json_schema_is_cohere_compatible() -> None:
    schema = copilot_response_json_schema()
    assert "grounded_in" not in schema.get("properties", {})
    assert schema["required"] == ["answer"]
    assert schema["properties"]["answer"]["required"] == ["blocks"]


def test_validated_response_accepts_answer_only_payload() -> None:
    parsed = CopilotStructuredResponseValidated.model_validate(
        {
            "answer": {
                "blocks": [
                    {"type": "heading", "text": "Summary"},
                    {"type": "callout", "variant": "note", "text": "Not legal advice."},
                ],
            },
        },
    )
    assert len(parsed.answer.blocks) == 2


def test_normalize_cohere_payload_accepts_camel_case() -> None:
    normalized = _normalize_cohere_payload(
        {
            "answer": {"blocks": [{"type": "heading", "text": "Hi"}]},
            "groundedIn": {"chapterKey": "risk-factors", "blockId": "blk-1"},
        },
    )
    assert normalized["grounded_in"]["chapter_key"] == "risk-factors"
    assert normalized["grounded_in"]["block_id"] == "blk-1"


def test_resilient_copilot_provider_falls_back_on_primary_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FailingProvider:
        def chat(self, **kwargs):  # noqa: ANN003
            raise RuntimeError("Cohere unavailable")

    grounded = CopilotGroundedIn(chapter_key="risk-factors")
    provider = ResilientCopilotProvider(FailingProvider(), FakeCopilotProvider())  # type: ignore[arg-type]
    response, model = provider.chat(
        message="Help",
        context={"issuerName": "Nivara Techfab Private Limited"},
        history=[],
        grounded_in=grounded,
    )
    assert model == "fake-copilot"
    assert response.answer.blocks
    assert response.answer.blocks[0]["type"] == "callout"


def test_finalize_copilot_blocks_replaces_garbled_sources_and_orphan_headings() -> None:
    context = {
        "selection": {
            "supportState": "structured_input_backed",
            "sourceRefs": [
                {
                    "workstreamKey": "objects-of-issue",
                    "fieldLabel": "Capex item — Term loan prepayment",
                    "valuePreview": "₹1,80,00,000",
                },
                {
                    "workstreamKey": "capital-ownership",
                    "fieldPath": "borrowings.termLoans[0].lender",
                    "valuePreview": "HDFC Bank Limited",
                },
            ],
        },
    }
    blocks = finalize_copilot_blocks(
        [
            {"type": "heading", "text": "Source of the Information"},
            {
                "type": "paragraph",
                "spans": [
                    {
                        "text": "blk-0c49994a-c87e-45fc-8536-7e05b6db2c19Objects of the issuemanagement-governancecapital-ownership",
                        "style": "plain",
                    },
                ],
            },
            {"type": "heading", "text": "Completeness Assessment"},
        ],
        context=context,
        message="Where did this come from?",
    )
    joined = json.dumps(blocks)
    assert "blk-0c49994a" not in joined
    assert "Source traceability" in joined
    assert "Completeness assessment" in joined
    assert "Objects of the Issue" in joined
    assert any(block.get("type") == "bullets" for block in blocks)
