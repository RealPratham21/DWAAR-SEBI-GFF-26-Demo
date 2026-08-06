import uuid
from typing import Any

from app.core.exceptions import AppException
from app.models.business_operations_workspace import BusinessOperationsWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.enums import OnboardingStatus
from app.models.onboarding_application import OnboardingApplication
from app.models.user import User
from app.modules.auth.constants import NextAction, redirect_for_next_action
from app.modules.auth.service import build_user_response, get_user_onboarding_state
from app.modules.business_operations.progress import (
    calculate_progress as calculate_business_operations_progress,
)
from app.modules.business_operations.schemas import DashboardBusinessOperationsProgress
from app.modules.objects_issue.progress import calculate_progress as calculate_objects_issue_progress
from app.modules.objects_issue.schemas import DashboardObjectsIssueProgress
from app.modules.company_incorporation.progress import calculate_progress
from app.modules.dashboard.constants import DashboardErrorCode
from app.modules.dashboard.schemas import (
    BootstrapAlternateContactResponse,
    BootstrapBusinessResponse,
    BootstrapCompanyResponse,
    BootstrapIpoIntentResponse,
    BootstrapOnboardingResponse,
    BootstrapOwnershipResponse,
    BootstrapRegistrationsResponse,
    BootstrapRepresentativeResponse,
    BootstrapUserResponse,
    BootstrapWorkspaceResponse,
    DashboardBootstrapResponse,
    DashboardCompanyIncorporationProgress,
    GstRegistrationResponse,
    RegisteredOfficeResponse,
)
from sqlalchemy import select
from sqlalchemy.orm import Session


def _section(draft_data: dict[str, Any], key: str) -> dict[str, Any]:
    value = draft_data.get(key)
    if isinstance(value, dict):
        return value
    return {}


def _parse_int(value: str) -> int:
    return int(value)


def _parse_float(value: str) -> float:
    return float(value)


def _alternate_contact(role: dict[str, Any]) -> BootstrapAlternateContactResponse | None:
    contact = role.get("alternateContact")
    if not isinstance(contact, dict):
        return None
    full_name = str(contact.get("fullName", "")).strip()
    designation = str(contact.get("designation", "")).strip()
    email = str(contact.get("email", "")).strip()
    mobile = str(contact.get("mobile", "")).strip()
    if not any([full_name, designation, email, mobile]):
        return None
    return BootstrapAlternateContactResponse(
        full_name=full_name,
        designation=designation,
        email=email,
        mobile=mobile,
    )


def get_submitted_sme_application(db: Session, user_id: uuid.UUID) -> OnboardingApplication:
    application, next_action = get_user_onboarding_state(db, user_id)
    if (
        application is None
        or next_action != NextAction.OPEN_DASHBOARD
        or application.status != OnboardingStatus.SUBMITTED
    ):
        raise AppException(
            status_code=403,
            code=DashboardErrorCode.ONBOARDING_NOT_SUBMITTED,
            message="Complete SME onboarding before opening the workspace.",
            details={
                "nextAction": next_action.value,
                "redirectTo": redirect_for_next_action(next_action),
            },
        )
    return application


def get_dashboard_company_incorporation_progress(
    db: Session,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    workspace = db.scalar(
        select(CompanyIncorporationWorkspace).where(
            CompanyIncorporationWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return {
            "overallStatus": "not_started",
            "sectionsComplete": 0,
            "totalSections": 6,
        }
    progress = calculate_progress(workspace.payload)
    return {
        "overallStatus": progress["overallStatus"],
        "sectionsComplete": progress["sectionsComplete"],
        "totalSections": progress["totalSections"],
    }


def get_dashboard_business_operations_progress(
    db: Session,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    workspace = db.scalar(
        select(BusinessOperationsWorkspace).where(
            BusinessOperationsWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return {
            "overallStatus": "not_started",
            "sectionsComplete": 0,
            "totalSections": 8,
        }
    progress = calculate_business_operations_progress(workspace.payload)
    return {
        "overallStatus": progress["overallStatus"],
        "sectionsComplete": progress["sectionsComplete"],
        "totalSections": progress["totalSections"],
    }


def get_dashboard_objects_issue_progress(
    db: Session,
    user_id: uuid.UUID,
) -> dict[str, Any]:
    workspace = db.scalar(
        select(ObjectsIssueWorkspace).where(
            ObjectsIssueWorkspace.user_id == user_id,
        ),
    )
    if workspace is None:
        return {
            "overallStatus": "not_started",
            "sectionsComplete": 0,
            "totalSections": 7,
        }
    progress = calculate_objects_issue_progress(workspace.payload)
    return {
        "overallStatus": progress["overallStatus"],
        "sectionsComplete": progress["sectionsComplete"],
        "totalSections": progress["totalSections"],
    }


def build_dashboard_bootstrap(db: Session, user: User) -> DashboardBootstrapResponse:
    application = get_submitted_sme_application(db, user.id)
    draft_data = dict(application.draft_data or {})

    role = _section(draft_data, "roleAuthority")
    company = _section(draft_data, "companyIdentity")
    business = _section(draft_data, "businessClassification")
    ownership = _section(draft_data, "ownershipSnapshot")
    ipo = _section(draft_data, "ipoIntent")
    office = _section(company, "registeredOffice")

    gst_registrations: list[GstRegistrationResponse] = []
    for entry in business.get("gstRegistrations") or []:
        if not isinstance(entry, dict):
            continue
        gst_registrations.append(
            GstRegistrationResponse(
                id=str(entry.get("id", "")),
                gstin=str(entry.get("gstin", "")),
                state=str(entry.get("state", "")),
                principal_place_of_business=str(entry.get("principalPlaceOfBusiness", "")),
            )
        )

    user_response = build_user_response(user)
    legal_name = str(company.get("legalName", ""))

    if application.submitted_at is None:
        msg = "Submitted onboarding is missing a submission timestamp."
        raise AppException(
            status_code=500,
            code="ONBOARDING_INVALID_STATE",
            message=msg,
        )

    company_incorporation_progress = get_dashboard_company_incorporation_progress(db, user.id)
    business_operations_progress = get_dashboard_business_operations_progress(db, user.id)
    objects_issue_progress = get_dashboard_objects_issue_progress(db, user.id)

    return DashboardBootstrapResponse(
        user=BootstrapUserResponse(
            id=str(user_response.id),
            full_name=user_response.full_name,
            email=user_response.email,
            phone=user_response.phone,
        ),
        representative=BootstrapRepresentativeResponse(
            designation=str(role.get("designation", "")),
            relationship=str(role.get("relationship", "")),
            relationship_other=str(role.get("relationshipOther", "")),
            authorised_signatory=str(role.get("authorisedSignatory", "")),
            basis_of_authority=str(role.get("basisOfAuthority", "")),
            basis_of_authority_other=str(role.get("basisOfAuthorityOther", "")),
            primary_onboarding_contact=str(role.get("primaryOnboardingContact", "")),
            add_alternate_contact=bool(role.get("addAlternateContact", False)),
            alternate_contact=_alternate_contact(role),
        ),
        company=BootstrapCompanyResponse(
            legal_name=legal_name,
            cin=str(company.get("cin", "")),
            incorporation_date=str(company.get("incorporationDate", "")),
            company_class=str(company.get("companyClass", "")),
            registered_state=str(company.get("registeredState", "")),
            registrar_of_companies=str(company.get("registrarOfCompanies", "")),
            company_email=str(company.get("companyEmail", "")),
            company_website=str(company.get("companyWebsite", "")),
            registered_office=RegisteredOfficeResponse(
                address_line1=str(office.get("addressLine1", "")),
                address_line2=str(office.get("addressLine2", "")),
                locality=str(office.get("locality", "")),
                city=str(office.get("city", "")),
                district=str(office.get("district", "")),
                state=str(office.get("state", "")),
                pin_code=str(office.get("pinCode", "")),
                country=str(office.get("country", "")),
            ),
        ),
        business=BootstrapBusinessResponse(
            primary_industry=str(business.get("primaryIndustry", "")),
            primary_industry_other=str(business.get("primaryIndustryOther", "")),
            business_sector=str(business.get("businessSector", "")),
            operations_description=str(business.get("operationsDescription", "")),
            employee_count_range=str(business.get("employeeCountRange", "")),
        ),
        registrations=BootstrapRegistrationsResponse(
            pan=str(business.get("pan", "")),
            gst_registration_required=str(business.get("gstRegistrationRequired", "")),
            gst_registrations=gst_registrations,
            udyam_registration=str(business.get("udyamRegistration", "")),
            import_export_code=str(business.get("importExportCode", "")),
        ),
        ownership=BootstrapOwnershipResponse(
            promoter_count=_parse_int(str(ownership.get("promoterCount", "0"))),
            director_count=_parse_int(str(ownership.get("directorCount", "0"))),
            promoter_holding_percent=_parse_float(
                str(ownership.get("promoterHoldingPercent", "0")),
            ),
            non_promoter_holding_percent=_parse_float(
                str(ownership.get("nonPromoterHoldingPercent", "0")),
            ),
            institutional_shareholders_present=str(
                ownership.get("institutionalShareholdersPresent", ""),
            ),
            foreign_shareholders_present=str(ownership.get("foreignShareholdersPresent", "")),
            promoter_group_entities_present=str(ownership.get("promoterGroupEntitiesPresent", "")),
        ),
        ipo_intent=BootstrapIpoIntentResponse(
            proposed_issue_type=str(ipo.get("proposedIssueType", "")),
            issue_size_crore=str(ipo.get("issueSizeCrore", "")),
            issue_size_not_decided=bool(ipo.get("issueSizeNotDecided", False)),
            target_timeline=str(ipo.get("targetTimeline", "")),
            intended_exchange=str(ipo.get("intendedExchange", "")),
            primary_purposes=[str(item) for item in (ipo.get("primaryPurposes") or [])],
            primary_purpose_other=str(ipo.get("primaryPurposeOther", "")),
            merchant_banker_appointed=str(ipo.get("merchantBankerAppointed", "")),
            merchant_banker_name=str(ipo.get("merchantBankerName", "")),
            preparation_stage=str(ipo.get("preparationStage", "")),
        ),
        onboarding=BootstrapOnboardingResponse(
            id=str(application.id),
            status=application.status,
            submitted_at=application.submitted_at,
            schema_version=application.schema_version,
        ),
        workspace=BootstrapWorkspaceResponse(
            route="/projects/demo",
            display_name=legal_name,
        ),
        company_incorporation=DashboardCompanyIncorporationProgress.model_validate(
            company_incorporation_progress,
        ),
        business_operations=DashboardBusinessOperationsProgress.model_validate(
            business_operations_progress,
        ),
        objects_of_issue=DashboardObjectsIssueProgress.model_validate(
            objects_issue_progress,
        ),
    )
