"""Probe DRHP-sized Cohere structured generation."""

from __future__ import annotations

import json
import os
import uuid

import cohere

from app.modules.drhp.ast.schemas import CohereStructuredChapterOutput
from app.modules.drhp.bundles.builders import build_chapter_source_bundle
from app.modules.drhp.cohere.prompts import build_chapter_prompt
from app.modules.drhp.cohere.provider import _extract_response_text
from app.modules.drhp.workstreams import WorkstreamSnapshot
from pathlib import Path


def _snapshots() -> dict[str, WorkstreamSnapshot]:
    payloads = json.loads(
        (Path(__file__).resolve().parents[1] / "scripts" / "nivara_workstream_payloads.json").read_text(
            encoding="utf-8"
        )
    )
    snapshots: dict[str, WorkstreamSnapshot] = {}
    for slug, payload in payloads.items():
        snapshots[slug] = WorkstreamSnapshot(
            slug=slug,
            workspace_id=uuid.uuid4(),
            version=1,
            schema_version=1,
            payload=payload,
            payload_hash="probe",
            last_saved_at=None,
        )
    return snapshots


def main() -> None:
    chapter_keys = ["objects-of-the-issue", "industry-overview", "business-operations"]
    snapshots = _snapshots()
    client = cohere.ClientV2(api_key=os.environ["COHERE_API_KEY"])
    model = os.environ.get("COHERE_MODEL", "command-a-plus-05-2026")
    schema = CohereStructuredChapterOutput.model_json_schema()

    for chapter_key in chapter_keys:
        print("\n====", chapter_key, "====")
        bundle = build_chapter_source_bundle("snap", chapter_key, snapshots)
        prompt = build_chapter_prompt(chapter_key=chapter_key, bundle=bundle.model_dump(by_alias=True, mode="json"))
        print("prompt_chars", len(prompt))
        for label, kwargs in [
            ("no_budget_4096", {"max_tokens": 4096}),
            ("budget_2000_8192", {"thinking": {"type": "enabled", "token_budget": 2000}, "max_tokens": 8192}),
        ]:
            response = client.chat(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object", "schema": schema},
                **kwargs,
            )
            types = [item.model_dump().get("type") for item in response.message.content]
            print(label, "finish", response.finish_reason, "types", types)
            try:
                raw = _extract_response_text(response)
                print(label, "text_len", len(raw))
            except Exception as exc:
                print(label, "extract_failed", exc)


if __name__ == "__main__":
    main()
