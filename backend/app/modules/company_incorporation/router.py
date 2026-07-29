from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.company_incorporation.schemas import (
    CompanyIncorporationWorkspaceResponse,
    ConstitutionalDocumentsSaveRequest,
    CoreRegistrationsSaveRequest,
    CorporateHistorySaveRequest,
    InitializeWorkspaceResponse,
    IssuerConfirmationsSaveRequest,
    LegalIdentitySaveRequest,
    OfficesSaveRequest,
    SectionSaveResponse,
)
from app.modules.company_incorporation.service import (
    get_workspace,
    initialize_or_get_workspace,
    save_constitutional_documents,
    save_core_registrations,
    save_corporate_history,
    save_issuer_confirmations,
    save_legal_identity,
    save_offices_contact,
)

router = APIRouter(prefix="/workstreams/company-incorporation", tags=["company-incorporation"])


@router.post("/workspace", response_model=InitializeWorkspaceResponse)
def post_initialize_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InitializeWorkspaceResponse:
    response = initialize_or_get_workspace(db, current_user)
    db.commit()
    return response


@router.get("/workspace", response_model=CompanyIncorporationWorkspaceResponse)
def get_current_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyIncorporationWorkspaceResponse:
    response = get_workspace(db, current_user)
    db.commit()
    return response


@router.patch("/sections/legal-identity", response_model=SectionSaveResponse)
def patch_legal_identity(
    body: LegalIdentitySaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_legal_identity(
        db,
        current_user,
        expected_version=body.version,
        identity=body.data,
    )
    db.commit()
    return response


@router.patch("/sections/corporate-history", response_model=SectionSaveResponse)
def patch_corporate_history(
    body: CorporateHistorySaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_corporate_history(
        db,
        current_user,
        expected_version=body.version,
        corporate_events=body.data.get("corporateEvents", []),
    )
    db.commit()
    return response


@router.patch("/sections/offices-contact", response_model=SectionSaveResponse)
def patch_offices_contact(
    body: OfficesSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_offices_contact(
        db,
        current_user,
        expected_version=body.version,
        offices=body.data.get("offices", []),
    )
    db.commit()
    return response


@router.patch("/sections/constitutional-documents", response_model=SectionSaveResponse)
def patch_constitutional_documents(
    body: ConstitutionalDocumentsSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_constitutional_documents(
        db,
        current_user,
        expected_version=body.version,
        constitutional_record=body.data.get("constitutionalRecord", {}),
        constitutional_amendments=body.data.get("constitutionalAmendments", []),
    )
    db.commit()
    return response


@router.patch("/sections/core-registrations", response_model=SectionSaveResponse)
def patch_core_registrations(
    body: CoreRegistrationsSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_core_registrations(
        db,
        current_user,
        expected_version=body.version,
        registrations=body.data.get("registrations", []),
    )
    db.commit()
    return response


@router.patch("/sections/issuer-confirmations", response_model=SectionSaveResponse)
def patch_issuer_confirmations(
    body: IssuerConfirmationsSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionSaveResponse:
    response = save_issuer_confirmations(
        db,
        current_user,
        expected_version=body.version,
        confirmations=body.data,
    )
    db.commit()
    return response
