"""Provider abstraction and semantic extraction request/response models."""

from __future__ import annotations

from typing import Any, Literal, Protocol

from pydantic import BaseModel, Field


class SemanticExtractionBlock(BaseModel):
    block_id: str = Field(alias="blockId")
    order_index: int = Field(alias="orderIndex")
    text: str
    bbox: dict[str, float] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class SemanticExtractionPage(BaseModel):
    page_id: str = Field(alias="pageId")
    page_number: int = Field(alias="pageNumber")
    extraction_method: str = Field(alias="extractionMethod")
    blocks: list[SemanticExtractionBlock] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class SemanticExpectedFact(BaseModel):
    fact_key: str = Field(alias="factKey")
    value_type: str = Field(alias="valueType")
    display_label: str = Field(alias="displayLabel", default="")
    label_aliases: list[str] = Field(default_factory=list, alias="labelAliases")

    model_config = {"populate_by_name": True}


class SemanticDeterministicCandidate(BaseModel):
    fact_key: str = Field(alias="factKey")
    value_type: str = Field(alias="valueType")
    normalized_value: Any = Field(alias="normalizedValue")
    display_value: str = Field(alias="displayValue", default="")
    validation_status: str = Field(alias="validationStatus", default="valid")
    evidence_block_ids: list[str] = Field(default_factory=list, alias="evidenceBlockIds")

    model_config = {"populate_by_name": True}


class SemanticExtractionRequest(BaseModel):
    requirement_key: str = Field(alias="requirementKey")
    expected_facts: list[SemanticExpectedFact] = Field(default_factory=list, alias="expectedFacts")
    deterministic_candidates: list[SemanticDeterministicCandidate] = Field(
        default_factory=list,
        alias="deterministicCandidates",
    )
    pages: list[SemanticExtractionPage] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class SemanticDocumentAssessment(BaseModel):
    matches_expected_document_type: bool = Field(alias="matchesExpectedDocumentType")
    warnings: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


SupportValue = Literal["explicit", "ambiguous", "not_found"]


class SemanticExtractedFact(BaseModel):
    fact_key: str = Field(alias="factKey")
    value_type: str = Field(alias="valueType")
    value: Any
    support: SupportValue
    evidence_block_ids: list[str] = Field(default_factory=list, alias="evidenceBlockIds")
    ambiguity: str | None = None

    model_config = {"populate_by_name": True}


class SemanticMissingExpectedFact(BaseModel):
    fact_key: str = Field(alias="factKey")
    reason: str

    model_config = {"populate_by_name": True}


class SemanticExtractionResult(BaseModel):
    document_assessment: SemanticDocumentAssessment = Field(alias="documentAssessment")
    facts: list[SemanticExtractedFact] = Field(default_factory=list)
    missing_expected_facts: list[SemanticMissingExpectedFact] = Field(
        default_factory=list,
        alias="missingExpectedFacts",
    )
    warnings: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class StructuredFactExtractionProvider(Protocol):
    def extract(self, request: SemanticExtractionRequest) -> SemanticExtractionResult: ...


def semantic_response_json_schema() -> dict[str, Any]:
    """JSON Schema compatible with Cohere structured output."""

    return SemanticExtractionResult.model_json_schema()
