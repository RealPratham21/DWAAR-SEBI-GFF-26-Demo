"""API schemas for Reports & Export (G7)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field

from app.modules.drhp.schemas import ApiModel


class WorkstreamTotalsResponse(ApiModel):
    complete: int = 0
    in_progress: int = Field(default=0, alias="inProgress")
    not_started: int = Field(default=0, alias="notStarted")
    total: int = 12


class WorkstreamProgressItem(ApiModel):
    workstream_key: str = Field(alias="workstreamKey")
    workstream_label: str = Field(alias="workstreamLabel")
    overall_status: str = Field(alias="overallStatus")
    sections_complete: int = Field(alias="sectionsComplete")
    total_sections: int = Field(alias="totalSections")


class DrhpExportCardResponse(ApiModel):
    available: bool = False
    version_number: int | None = Field(default=None, alias="versionNumber")
    version_id: str | None = Field(default=None, alias="versionId")
    status: str | None = None
    status_label: str = Field(default="Not generated", alias="statusLabel")
    generated_at: datetime | None = Field(default=None, alias="generatedAt")
    stale: bool = False
    affected_chapter_count: int = Field(default=0, alias="affectedChapterCount")
    open_drhp_url: str = Field(default="/projects/demo/drhp", alias="openDrhpUrl")


class ReportCardResponse(ApiModel):
    card_id: str = Field(alias="cardId")
    title: str
    description: str
    format_label: str = Field(alias="formatLabel")
    status_label: str = Field(alias="statusLabel")
    detail_label: str = Field(default="", alias="detailLabel")
    available: bool = True
    disabled_reason: str = Field(default="", alias="disabledReason")
    download_kind: str = Field(default="", alias="downloadKind")
    progress_ratio: float | None = Field(default=None, alias="progressRatio")
    progress_caption: str = Field(default="", alias="progressCaption")


class ReportsExportSummaryResponse(ApiModel):
    issuer: str
    generated_at: datetime = Field(alias="generatedAt")
    workstreams: WorkstreamTotalsResponse
    workstream_items: list[WorkstreamProgressItem] = Field(default_factory=list, alias="workstreamItems")
    drhp_docx: DrhpExportCardResponse = Field(alias="drhpDocx")
    drhp_pdf: DrhpExportCardResponse = Field(alias="drhpPdf")
    issues_summary: dict[str, Any] = Field(alias="issuesSummary")
    facts_evidence_summary: dict[str, Any] = Field(alias="factsEvidenceSummary")
    data_room_summary: dict[str, Any] = Field(alias="dataRoomSummary")
    cards: list[ReportCardResponse] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list, alias="nextActions")
