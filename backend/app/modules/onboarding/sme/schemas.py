import re
from datetime import date, datetime
from typing import Any, Self

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

from app.modules.auth.validation import normalize_phone_e164
from app.modules.onboarding.sme.india_constants import (
    INDIAN_STATES_AND_UTS,
    REGISTRAR_OF_COMPANIES_OPTIONS,
)
from app.modules.onboarding.sme.step_mappings import DOCUMENT_IDS

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
UDYAM_REGEX = re.compile(r"^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$")
IEC_REGEX = re.compile(r"^([A-Z]{5}[0-9]{4}[A-Z]|[0-9]{10})$")
CIN_REGEX = re.compile(r"^[A-Z0-9]{21}$")
PIN_REGEX = re.compile(r"^[1-9][0-9]{5}$")

RELATIONSHIP_OPTIONS = {
    "promoter", "director", "kmp", "employee", "professional-adviser",
    "authorised-external-representative", "other",
}
AUTHORISED_SIGNATORY_OPTIONS = {"yes", "no", "unsure"}
BASIS_OF_AUTHORITY_OPTIONS = {
    "board-resolution", "power-of-attorney", "employment-position",
    "constitutional-authority", "other",
}
YES_NO_OPTIONS = {"yes", "no"}
YES_NO_UNSURE_OPTIONS = {"yes", "no", "unsure"}
COMPANY_CLASS_OPTIONS = {"public", "private"}
GST_REQUIRED_OPTIONS = {"yes", "no", "unsure"}
EMPLOYEE_COUNT_OPTIONS = {
    "1-10", "11-50", "51-100", "101-250", "251-500", "501-1000", "1000-plus",
}
ISSUE_TYPE_OPTIONS = {"fresh-issue", "offer-for-sale", "combination", "not-decided"}
TIMELINE_OPTIONS = {
    "within-3-months", "3-6-months", "6-12-months", "12-18-months",
    "more-than-18-months", "not-decided",
}
EXCHANGE_OPTIONS = {"nse-emerge", "bse-sme", "not-decided"}
MERCHANT_BANKER_OPTIONS = {"yes", "no", "in-discussion", "not-decided"}
PREPARATION_STAGE_OPTIONS = {
    "exploring", "internal-preparation", "advisers-being-appointed",
    "due-diligence-started", "drafting-started", "filing-preparation", "not-sure",
}
PRIMARY_INDUSTRY_OPTIONS = {
    "agriculture-allied", "automotive", "chemicals", "consumer-products",
    "electronics-electrical", "engineering-capital-goods", "financial-services",
    "food-processing", "healthcare-pharma", "it-software", "infrastructure-construction",
    "logistics-transportation", "manufacturing", "media-entertainment",
    "professional-services", "renewable-energy", "retail-ecommerce", "textiles-apparel", "other",
}
ISSUE_PURPOSE_OPTIONS = {
    "capital-expenditure", "working-capital", "debt-repayment", "acquisition",
    "general-corporate-purposes", "offer-for-sale", "brand-building-marketing",
    "technology-investment", "other", "not-decided",
}


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class AlternateContactModel(ApiModel):
    full_name: str = Field(min_length=1)
    designation: str = Field(min_length=1)
    email: EmailStr
    mobile: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        return normalize_phone_e164(value)


class RoleAuthorityStepData(ApiModel):
    designation: str = Field(min_length=1)
    relationship: str
    relationship_other: str = ""
    authorised_signatory: str
    basis_of_authority: str = ""
    basis_of_authority_other: str = ""
    primary_onboarding_contact: str
    add_alternate_contact: bool = False
    alternate_contact: AlternateContactModel | dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_role_authority(self) -> Self:
        if self.relationship not in RELATIONSHIP_OPTIONS:
            msg = "Relationship with the company is required"
            raise ValueError(msg)
        if self.relationship == "other" and not self.relationship_other.strip():
            raise ValueError("Please describe the relationship")
        if self.authorised_signatory not in AUTHORISED_SIGNATORY_OPTIONS:
            msg = "Authorised signatory is required"
            raise ValueError(msg)
        if self.authorised_signatory in {"yes", "unsure"}:
            if not self.basis_of_authority:
                raise ValueError("Basis of authority is required")
            if self.basis_of_authority not in BASIS_OF_AUTHORITY_OPTIONS:
                raise ValueError("Basis of authority is required")
            if self.basis_of_authority == "other" and not self.basis_of_authority_other.strip():
                raise ValueError("Please describe the basis of authority")
        if self.primary_onboarding_contact not in YES_NO_OPTIONS:
            raise ValueError("Primary onboarding contact is required")
        needs_alternate = self.primary_onboarding_contact == "no" or self.add_alternate_contact
        if needs_alternate:
            AlternateContactModel.model_validate(self.alternate_contact)
        return self


class RegisteredOfficeModel(ApiModel):
    address_line1: str = Field(min_length=1)
    address_line2: str = ""
    locality: str = ""
    city: str = Field(min_length=1)
    district: str = ""
    state: str
    pin_code: str
    country: str = Field(min_length=1)

    @field_validator("state")
    @classmethod
    def validate_state(cls, value: str) -> str:
        if value not in INDIAN_STATES_AND_UTS:
            msg = "State or Union Territory is required"
            raise ValueError(msg)
        return value

    @field_validator("pin_code")
    @classmethod
    def validate_pin(cls, value: str) -> str:
        if not PIN_REGEX.match(value.strip()):
            raise ValueError("PIN code must be a valid 6-digit Indian PIN code")
        return value.strip()


class CompanyIdentityStepData(ApiModel):
    legal_name: str = Field(min_length=1)
    cin: str
    incorporation_date: str
    company_class: str
    registered_state: str
    registrar_of_companies: str
    registered_office: RegisteredOfficeModel
    company_email: EmailStr
    company_website: str = ""

    @field_validator("cin")
    @classmethod
    def validate_cin(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not CIN_REGEX.match(normalized):
            raise ValueError("CIN must be exactly 21 uppercase alphanumeric characters")
        return normalized

    @field_validator("incorporation_date")
    @classmethod
    def validate_incorporation_date(cls, value: str) -> str:
        parsed = date.fromisoformat(value)
        if parsed > date.today():
            raise ValueError("Date of incorporation cannot be in the future")
        return value

    @field_validator("company_class")
    @classmethod
    def validate_company_class(cls, value: str) -> str:
        if value not in COMPANY_CLASS_OPTIONS:
            raise ValueError("Company class is required")
        return value

    @field_validator("registered_state")
    @classmethod
    def validate_registered_state(cls, value: str) -> str:
        if value not in INDIAN_STATES_AND_UTS:
            raise ValueError("Registered state or Union Territory is required")
        return value

    @field_validator("registrar_of_companies")
    @classmethod
    def validate_roc(cls, value: str) -> str:
        if value not in REGISTRAR_OF_COMPANIES_OPTIONS:
            raise ValueError("Registrar of Companies is required")
        return value

    @field_validator("company_website")
    @classmethod
    def validate_website(cls, value: str) -> str:
        if value and not value.startswith(("http://", "https://")):
            raise ValueError("Enter a valid website URL")
        return value


class GstRegistrationEntryModel(ApiModel):
    id: str
    gstin: str
    state: str
    principal_place_of_business: str = ""

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not GSTIN_REGEX.match(normalized):
            raise ValueError("Enter a valid GSTIN in the 15-character format")
        return normalized

    @field_validator("state")
    @classmethod
    def validate_state(cls, value: str) -> str:
        if value not in INDIAN_STATES_AND_UTS:
            raise ValueError("State or Union Territory is required")
        return value


class BusinessClassificationStepData(ApiModel):
    primary_industry: str
    primary_industry_other: str = ""
    business_sector: str = Field(min_length=1)
    operations_description: str = Field(min_length=30, max_length=1000)
    pan: str
    gst_registration_required: str
    gst_registrations: list[GstRegistrationEntryModel] = Field(default_factory=list)
    udyam_registration: str = ""
    import_export_code: str = ""
    employee_count_range: str

    @field_validator("primary_industry")
    @classmethod
    def validate_primary_industry(cls, value: str) -> str:
        if value not in PRIMARY_INDUSTRY_OPTIONS:
            raise ValueError("Primary industry is required")
        return value

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not PAN_REGEX.match(normalized):
            raise ValueError("Enter a valid PAN in the AAAAA9999A format")
        return normalized

    @field_validator("gst_registration_required")
    @classmethod
    def validate_gst_required(cls, value: str) -> str:
        if value not in GST_REQUIRED_OPTIONS:
            raise ValueError("GST registration requirement is required")
        return value

    @field_validator("employee_count_range")
    @classmethod
    def validate_employee_count(cls, value: str) -> str:
        if value not in EMPLOYEE_COUNT_OPTIONS:
            raise ValueError("Employee count range is required")
        return value

    @model_validator(mode="after")
    def validate_business(self) -> Self:
        if self.primary_industry == "other" and not self.primary_industry_other.strip():
            raise ValueError("Please describe the primary industry")
        if self.gst_registration_required == "yes" and not self.gst_registrations:
            raise ValueError("Add at least one GSTIN when GST registration is required")
        if self.udyam_registration.strip():
            normalized = self.udyam_registration.strip().upper()
            if not UDYAM_REGEX.match(normalized):
                raise ValueError(
                    "Enter a valid Udyam registration number in the UDYAM-XX-00-0000000 format",
                )
        if self.import_export_code.strip():
            normalized = self.import_export_code.strip().upper()
            if not IEC_REGEX.match(normalized):
                raise ValueError("Enter a valid IEC in PAN format or as a 10-digit numeric code")
        return self


class OwnershipSnapshotStepData(ApiModel):
    promoter_count: str
    director_count: str
    promoter_holding_percent: str
    non_promoter_holding_percent: str
    institutional_shareholders_present: str
    foreign_shareholders_present: str
    promoter_group_entities_present: str

    @model_validator(mode="after")
    def validate_ownership(self) -> Self:
        ownership_checks = (
            (
                "Institutional shareholders",
                self.institutional_shareholders_present,
                YES_NO_UNSURE_OPTIONS,
            ),
            (
                "Foreign shareholders",
                self.foreign_shareholders_present,
                YES_NO_UNSURE_OPTIONS,
            ),
            (
                "Promoter group entities",
                self.promoter_group_entities_present,
                YES_NO_UNSURE_OPTIONS,
            ),
        )
        for label, value, options in ownership_checks:
            if value not in options:
                raise ValueError(f"{label} is required")
        if not self.promoter_count.isdigit():
            raise ValueError("Promoter count must be a whole number")
        if not self.director_count.isdigit() or int(self.director_count) < 1:
            raise ValueError("At least one director is required")
        try:
            promoter_pct = float(self.promoter_holding_percent)
            non_promoter_pct = float(self.non_promoter_holding_percent)
        except ValueError as exc:
            raise ValueError("Enter a valid percentage") from exc
        if not 0 <= promoter_pct <= 100 or not 0 <= non_promoter_pct <= 100:
            raise ValueError("Must be between 0 and 100")
        if abs(promoter_pct + non_promoter_pct - 100) > 0.01:
            raise ValueError("Promoter and non-promoter holding must total 100%")
        return self


class IpoIntentStepData(ApiModel):
    proposed_issue_type: str
    issue_size_crore: str = ""
    issue_size_not_decided: bool = False
    target_timeline: str
    intended_exchange: str
    primary_purposes: list[str] = Field(min_length=1)
    primary_purpose_other: str = ""
    merchant_banker_appointed: str
    merchant_banker_name: str = ""
    preparation_stage: str

    @model_validator(mode="after")
    def validate_ipo_intent(self) -> Self:
        if self.proposed_issue_type not in ISSUE_TYPE_OPTIONS:
            raise ValueError("Proposed issue type is required")
        if self.target_timeline not in TIMELINE_OPTIONS:
            raise ValueError("Target timeline is required")
        if self.intended_exchange not in EXCHANGE_OPTIONS:
            raise ValueError("Intended SME exchange is required")
        if self.merchant_banker_appointed not in MERCHANT_BANKER_OPTIONS:
            raise ValueError("Merchant banker appointment status is required")
        if self.preparation_stage not in PREPARATION_STAGE_OPTIONS:
            raise ValueError("Current preparation stage is required")
        if "other" in self.primary_purposes and not self.primary_purpose_other.strip():
            raise ValueError("Please describe the other purpose")
        if not self.issue_size_not_decided:
            try:
                amount = float(self.issue_size_crore)
            except ValueError as exc:
                raise ValueError(
                    "Enter a positive issue size in crore or select Not Decided",
                ) from exc
            if amount <= 0:
                raise ValueError("Enter a positive issue size in crore or select Not Decided")
        if self.merchant_banker_appointed == "yes" and not self.merchant_banker_name.strip():
            raise ValueError("Merchant banker name is required")
        invalid_purposes = set(self.primary_purposes) - ISSUE_PURPOSE_OPTIONS
        if invalid_purposes:
            raise ValueError("Select at least one purpose")
        return self


class DocumentSelectionMeta(ApiModel):
    file_name: str = Field(min_length=1)
    file_size: int = Field(ge=0)
    mime_type: str = Field(min_length=1)


class InitialDocumentsStepData(ApiModel):
    selections: dict[str, DocumentSelectionMeta | None]
    skipped_for_now: bool = False

    @model_validator(mode="after")
    def validate_documents(self) -> Self:
        for document_id in DOCUMENT_IDS:
            self.selections.setdefault(document_id, None)
        for document_id, selection in self.selections.items():
            if document_id not in DOCUMENT_IDS:
                continue
            if selection is None:
                continue
            if isinstance(selection, dict):
                DocumentSelectionMeta.model_validate(selection)
        return self


class SubmissionConfirmationsData(ApiModel):
    confirm_accuracy: bool
    confirm_authorised: bool
    confirm_verification: bool
    agree_terms: bool

    @model_validator(mode="after")
    def validate_confirmations(self) -> Self:
        for field_name, value in (
            ("confirmAccuracy", self.confirm_accuracy),
            ("confirmAuthorised", self.confirm_authorised),
            ("confirmVerification", self.confirm_verification),
            ("agreeTerms", self.agree_terms),
        ):
            if not value:
                raise ValueError(f"{field_name} confirmation is required")
        return self


STEP_MODELS: dict[str, type[ApiModel]] = {
    "role_authority": RoleAuthorityStepData,
    "company_identity": CompanyIdentityStepData,
    "business_classification": BusinessClassificationStepData,
    "ownership_snapshot": OwnershipSnapshotStepData,
    "ipo_intent": IpoIntentStepData,
    "initial_documents": InitialDocumentsStepData,
    "review_submit": SubmissionConfirmationsData,
}


class OnboardingApplicationResponse(ApiModel):
    id: str
    status: str
    current_step: str
    completed_steps: list[str]
    draft_data: dict[str, Any]
    schema_version: int
    version: int
    submitted_at: datetime | None = None


class OnboardingSummaryOnlyResponse(ApiModel):
    id: str
    status: str
    current_step: str
    completed_steps: list[str]


class SubmitOnboardingRequest(ApiModel):
    submission_confirmations: SubmissionConfirmationsData


class SubmitOnboardingResponse(ApiModel):
    id: str
    status: str
    next_action: str = "open_dashboard"
    redirect_to: str = "/projects/demo"
