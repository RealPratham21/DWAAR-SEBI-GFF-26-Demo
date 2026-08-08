"""Renderer-neutral DRHP Document AST schemas."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.modules.drhp.constants import AST_SCHEMA_VERSION


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


BlockKind = Literal[
    "heading",
    "paragraph",
    "bullet_list",
    "numbered_list",
    "table",
    "key_value_table",
    "legal_notice",
    "cross_reference",
    "image_reference",
    "placeholder",
    "page_break",
]

SupportState = Literal[
    "evidence_backed",
    "structured_input_backed",
    "calculation_backed",
    "professional_confirmation_pending",
    "placeholder",
    "mixed_support",
]


class CrossReferenceBlock(ApiModel):
    target_chapter_key: str
    target_section_key: str = ""
    display_text: str


class DrhpBlockAST(ApiModel):
    block_id: str
    kind: BlockKind
    order: int
    content: dict[str, Any] = Field(default_factory=dict)
    source_ref_ids: list[str] = Field(default_factory=list)
    evidence_ref_ids: list[str] = Field(default_factory=list)
    support_state: SupportState = "structured_input_backed"


class DrhpSectionAST(ApiModel):
    section_key: str
    heading: str
    order: int
    blocks: list[DrhpBlockAST] = Field(default_factory=list)


class DrhpChapterAST(ApiModel):
    chapter_key: str
    title: str
    order: int
    sections: list[DrhpSectionAST] = Field(default_factory=list)


class DrhpDocumentAST(ApiModel):
    schema_version: str = AST_SCHEMA_VERSION
    metadata: dict[str, Any] = Field(default_factory=dict)
    chapters: list[DrhpChapterAST] = Field(default_factory=list)


class DocumentContinuityContract(ApiModel):
    """Shared style contract for future AI generation — no prompts yet."""

    tone: str = "formal_offer_document"
    factual_not_promotional: bool = True
    consistent_issuer_reference: bool = True
    consistent_defined_terms: bool = True
    consistent_financial_periods: bool = True
    consistent_units_and_currency: bool = True
    no_unsupported_superlatives: bool = True
    no_invented_regulatory_conclusions: bool = True
    no_invented_numbers: bool = True
    no_raw_page_number_references: bool = True
    claims_require_source_ref: bool = True
    preserve_professional_review_language: bool = True
    placeholders_via_registry_only: bool = True


class CohereStructuredChapterOutput(ApiModel):
    """Schema future Cohere structured output must satisfy."""

    chapter_key: str
    sections: list[DrhpSectionAST] = Field(default_factory=list)
    source_ref_ids_used: list[str] = Field(default_factory=list)
    cross_references: list[CrossReferenceBlock] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    placeholders: list[str] = Field(default_factory=list)
