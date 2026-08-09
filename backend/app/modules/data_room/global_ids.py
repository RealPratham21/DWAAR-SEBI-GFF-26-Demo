"""Opaque global document IDs for Data Room (G6)."""

from __future__ import annotations

import uuid

from app.modules.data_room.constants import ORIGIN_COMPANY_INCORPORATION, ORIGIN_DATA_ROOM

CI_PREFIX = "gci:"
DR_PREFIX = "gdr:"


def encode_ci_document_id(document_id: uuid.UUID | str) -> str:
    return f"{CI_PREFIX}{document_id}"


def encode_dr_document_id(document_id: uuid.UUID | str) -> str:
    return f"{DR_PREFIX}{document_id}"


def parse_global_document_id(global_id: str) -> tuple[str, uuid.UUID]:
    if global_id.startswith(CI_PREFIX):
        return ORIGIN_COMPANY_INCORPORATION, uuid.UUID(global_id[len(CI_PREFIX) :])
    if global_id.startswith(DR_PREFIX):
        return ORIGIN_DATA_ROOM, uuid.UUID(global_id[len(DR_PREFIX) :])
    raise ValueError(f"Unknown global document id: {global_id}")
