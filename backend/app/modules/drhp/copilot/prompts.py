"""Prompt assembly for Dwaar Copilot Lite."""

from __future__ import annotations

import json
from typing import Any

from app.modules.drhp.copilot.schemas import CopilotChatMessage

EXAMPLE_RESPONSE = {
    "answer": {
        "blocks": [
            {"type": "heading", "level": 2, "text": "Summary"},
            {
                "type": "paragraph",
                "spans": [
                    {"text": "This paragraph explains ", "style": "plain"},
                    {"text": "the selected disclosure", "style": "bold"},
                    {"text": " in plain language.", "style": "plain"},
                ],
            },
            {
                "type": "bullets",
                "items": [
                    "Objects register — Objects of the Issue (preview: Term loan prepayment)",
                    "Use human-readable labels; never paste raw block IDs or slugs.",
                ],
            },
            {
                "type": "callout",
                "variant": "note",
                "text": "Say clearly if anything is missing from the provided context.",
            },
        ],
    },
}

SYSTEM_PROMPT = f"""You are Dwaar Copilot — an assistant inside the Dwaar IPO preparation platform.

Your job:
- Help users understand their issuer workspace, DRHP draft content, evidence traceability, and preparation next steps.
- When a DRHP block is selected, ground answers in that block's text and source references from context.selection.sourceRefs.
- Be concise, professional, and specific. Avoid generic SEBI lectures.

Rules:
- Return ONLY valid JSON with a top-level "answer" object containing "blocks".
- Use 3–6 blocks. Allowed types: heading, paragraph, bullets, callout.
- paragraph blocks MUST use "spans" (not a top-level text field). Each span needs readable prose with spaces.
- Use bullets for lists of sources, checks, or gaps — one readable item per bullet.
- NEVER concatenate raw blockId values, internal slugs, or field paths without labels and spacing.
- For source questions, summarize using fieldLabel / workstreamKey from context.selection.sourceRefs.
- Use bold sparingly for field names, statuses, and key figures.
- Do NOT invent company facts, numbers, or regulatory conclusions not present in context.
- If information is missing, say so in a callout block.
- Do not provide legal, filing, or merchant banker sign-off advice — preparation guidance only.

Example shape (content is illustrative only):
{json.dumps(EXAMPLE_RESPONSE, indent=2)}
"""


def build_user_prompt(*, message: str, context: dict[str, Any]) -> str:
    return (
        "Answer the user's question using ONLY the JSON context below.\n\n"
        f"USER QUESTION:\n{message.strip()}\n\n"
        f"CONTEXT JSON:\n{json.dumps(context, ensure_ascii=False, default=str)}"
    )


def build_chat_messages(
    *,
    message: str,
    context: dict[str, Any],
    history: list[CopilotChatMessage],
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history[-8:]:
        messages.append({"role": item.role, "content": item.content[:2000]})
    messages.append({"role": "user", "content": build_user_prompt(message=message, context=context)})
    return messages
