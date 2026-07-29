from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


SectionStatus = Literal["not_started", "in_progress", "complete"]
OverallStatus = Literal["not_started", "in_progress", "complete"]


class WorkspaceProgressResponse(ApiModel):
    sections: dict[str, SectionStatus]
    sections_complete: int
    total_sections: int
    overall_status: OverallStatus


class CompanyIncorporationWorkspaceResponse(ApiModel):
    id: str
    version: int
    schema_version: int
    initialized_from_onboarding: bool
    initialized_at: datetime | None = None
    last_saved_at: datetime | None = None
    payload: dict[str, Any]
    progress: WorkspaceProgressResponse


class InitializeWorkspaceResponse(CompanyIncorporationWorkspaceResponse):
    created: bool


class SectionSaveRequest(ApiModel):
    version: int = Field(ge=1)
    data: dict[str, Any]


class LegalIdentitySaveRequest(SectionSaveRequest):
    data: dict[str, Any]


class CorporateHistorySaveRequest(SectionSaveRequest):
    data: dict[str, Any]


class OfficesSaveRequest(SectionSaveRequest):
    data: dict[str, Any]


class ConstitutionalDocumentsSaveRequest(SectionSaveRequest):
    data: dict[str, Any]


class CoreRegistrationsSaveRequest(SectionSaveRequest):
    data: dict[str, Any]


class IssuerConfirmationsSaveRequest(SectionSaveRequest):
    data: dict[str, Any]


class SectionSaveResponse(ApiModel):
    version: int
    last_saved_at: datetime
    saved_section: dict[str, Any]
    progress: WorkspaceProgressResponse
    payload: dict[str, Any]


class DashboardCompanyIncorporationProgress(ApiModel):
    overall_status: OverallStatus
    sections_complete: int
    total_sections: int
