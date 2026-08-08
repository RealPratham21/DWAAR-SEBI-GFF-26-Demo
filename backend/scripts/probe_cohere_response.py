"""One-off probe for Cohere v2 response shape (run inside backend container)."""

from __future__ import annotations

import json
import os

import cohere


def dump_response(label: str, response) -> None:
    print(f"\n=== {label} ===")
    print("finish_reason:", response.finish_reason)
    for index, item in enumerate(response.message.content):
        payload = item.model_dump() if hasattr(item, "model_dump") else item
        print(index, type(item).__name__, json.dumps(payload, default=str)[:500])


def main() -> None:
    api_key = os.environ.get("COHERE_API_KEY", "")
    model = os.environ.get("COHERE_MODEL", "command-a-plus-05-2026")
    print("cohere", cohere.__version__)
    print("model", model)
    client = cohere.ClientV2(api_key=api_key)
    schema = {
        "type": "object",
        "properties": {"hello": {"type": "string"}},
        "required": ["hello"],
    }
    prompt = 'Return JSON with hello set to "world".'

    dump_response(
        "default (thinking on)",
        client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object", "schema": schema},
            max_tokens=500,
        ),
    )
    dump_response(
        "thinking budget 1500",
        client.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object", "schema": schema},
            thinking={"type": "enabled", "token_budget": 1500},
            max_tokens=4096,
        ),
    )
    big_prompt = prompt + "\n" + ("context line " * 2000)
    dump_response(
        "large prompt default thinking",
        client.chat(
            model=model,
            messages=[{"role": "user", "content": big_prompt}],
            response_format={"type": "json_object", "schema": schema},
            max_tokens=4096,
        ),
    )


if __name__ == "__main__":
    main()
