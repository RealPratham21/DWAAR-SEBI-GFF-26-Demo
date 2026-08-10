"""Dwaar Copilot Lite chat service."""

from __future__ import annotations

import json
import logging

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.drhp.copilot.context import build_copilot_context
from app.modules.drhp.copilot.postprocess import finalize_copilot_blocks
from app.modules.drhp.copilot.provider import build_copilot_provider
from app.modules.drhp.copilot.schemas import CopilotAnswer, CopilotChatRequest, CopilotChatResponse

logger = logging.getLogger(__name__)


def copilot_chat(db: Session, user: User, request: CopilotChatRequest) -> CopilotChatResponse:
    logger.info(
        "Copilot chat request user_id=%s chapter_key=%s block_id=%s history_len=%d document_version_id=%s message=%r",
        user.id,
        request.chapter_key,
        request.block_id,
        len(request.history),
        request.document_version_id,
        request.message[:500],
    )
    logger.debug(
        "Copilot chat request body=%s",
        json.dumps(request.model_dump(by_alias=True), default=str),
    )

    context, grounded_in = build_copilot_context(
        db,
        user,
        document_version_id=request.document_version_id,
        chapter_key=request.chapter_key,
        block_id=request.block_id,
        route=request.route,
    )
    logger.debug(
        "Copilot assembled context=%s",
        json.dumps(context, ensure_ascii=False, default=str)[:16000],
    )

    provider = build_copilot_provider()
    structured, model = provider.chat(
        message=request.message,
        context=context,
        history=request.history,
        grounded_in=grounded_in,
    )
    blocks = finalize_copilot_blocks(
        structured.answer.blocks,
        context=context,
        message=request.message,
    )

    logger.info(
        "Copilot chat response model=%s block_count=%d grounded_in=%s",
        model,
        len(blocks),
        grounded_in.model_dump(by_alias=True),
    )
    logger.debug(
        "Copilot chat response blocks=%s",
        json.dumps(blocks, ensure_ascii=False, default=str)[:16000],
    )

    return CopilotChatResponse(
        answer=CopilotAnswer(blocks=blocks),
        grounded_in=structured.grounded_in,
        model=model,
    )
