from datetime import datetime

from app.modules.company_incorporation.schemas import DashboardCompanyIncorporationProgress
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class BootstrapUserResponse(ApiModel):
    id: str
    full_name: str
    email: str
    phone: str


class BootstrapAlternateContactResponse(ApiModel):
    full_name: str
    designation: str
    email: str
    mobile: str


class BootstrapRepresentativeResponse(ApiModel):
    designation: str
    relationship: str
    relationship_other: str
    authorised_signatory: str
    basis_of_authority: str
    basis_of_authority_other: str
    primary_onboarding_contact: str
    add_alternate_contact: bool
    alternate_contact: BootstrapAlternateContactResponse | None = None


class RegisteredOfficeResponse(ApiModel):
    address_line1: str
    address_line2: str
    locality: str
    city: str
    district: str
    state: str
    pin_code: str
    country: str


class BootstrapCompanyResponse(ApiModel):
    legal_name: str
    cin: str
    incorporation_date: str
    company_class: str
    registered_state: str
    registrar_of_companies: str
    company_email: str
    company_website: str
    registered_office: RegisteredOfficeResponse


class BootstrapBusinessResponse(ApiModel):
    primary_industry: str
    primary_industry_other: str
    business_sector: str
    operations_description: str
    employee_count_range: str


class GstRegistrationResponse(ApiModel):
    id: str
    gstin: str
    state: str
    principal_place_of_business: str


class BootstrapRegistrationsResponse(ApiModel):
    pan: str
    gst_registration_required: str
    gst_registrations: list[GstRegistrationResponse]
    udyam_registration: str
    import_export_code: str


class BootstrapOwnershipResponse(ApiModel):
    promoter_count: int
    director_count: int
    promoter_holding_percent: float
    non_promoter_holding_percent: float
    institutional_shareholders_present: str
    foreign_shareholders_present: str
    promoter_group_entities_present: str


class BootstrapIpoIntentResponse(ApiModel):
    proposed_issue_type: str
    issue_size_crore: str
    issue_size_not_decided: bool
    target_timeline: str
    intended_exchange: str
    primary_purposes: list[str]
    primary_purpose_other: str
    merchant_banker_appointed: str
    merchant_banker_name: str
    preparation_stage: str


class BootstrapOnboardingResponse(ApiModel):
    id: str
    status: str
    submitted_at: datetime
    schema_version: int


class BootstrapWorkspaceResponse(ApiModel):
    route: str
    display_name: str


class DashboardBootstrapResponse(ApiModel):
    user: BootstrapUserResponse
    representative: BootstrapRepresentativeResponse
    company: BootstrapCompanyResponse
    business: BootstrapBusinessResponse
    registrations: BootstrapRegistrationsResponse
    ownership: BootstrapOwnershipResponse
    ipo_intent: BootstrapIpoIntentResponse
    onboarding: BootstrapOnboardingResponse
    workspace: BootstrapWorkspaceResponse
    company_incorporation: DashboardCompanyIncorporationProgress
