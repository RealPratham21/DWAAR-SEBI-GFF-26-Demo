"""Default empty Company & Incorporation workspace payload."""

from copy import deepcopy
from typing import Any

SCHEMA_VERSION = 1

EMPTY_COMPANY_INCORPORATION_PAYLOAD: dict[str, Any] = {
    "identity": {
        "legalName": "",
        "shortName": "",
        "cin": "",
        "registrationNumber": "",
        "incorporationDate": "",
        "incorporationCity": "",
        "incorporationState": "",
        "registrarOfCompanies": "",
        "companyClass": "",
        "companyCategory": "",
        "companySubCategory": "",
        "specialCompanyType": "none",
        "companyStatus": "",
        "listedStatus": "",
        "commencementDate": "",
        "governingAct": "",
        "website": "",
        "email": "",
        "telephone": "",
        "issuerContactPersonId": "",
    },
    "corporateEvents": [],
    "offices": [],
    "constitutionalRecord": {
        "moaVersionDate": "",
        "aoaVersionDate": "",
        "moaCertifiedCopyStatus": "",
        "aoaCertifiedCopyStatus": "",
        "mainObjectClauseNumbers": [],
        "mainObjectText": "",
        "latestMoaAmendmentDate": "",
        "latestAoaAmendmentDate": "",
        "operationsAlignmentStatus": "",
        "legalReviewStatus": "",
    },
    "constitutionalAmendments": [],
    "registrations": [],
    "confirmations": {
        "allFormerNamesDisclosed": False,
        "allCompanyClassChangesDisclosed": False,
        "allRegisteredOfficeChangesDisclosed": False,
        "currentMoaWillBeProvided": False,
        "currentAoaWillBeProvided": False,
        "mainObjectsReflectCurrentBusiness": False,
        "registrationsUseCurrentLegalName": False,
        "noMaterialCorporateEventOmitted": False,
        "authorisedRepresentativeDeclaration": False,
    },
}


def empty_payload() -> dict[str, Any]:
    return deepcopy(EMPTY_COMPANY_INCORPORATION_PAYLOAD)
