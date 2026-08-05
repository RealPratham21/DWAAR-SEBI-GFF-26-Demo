"""Nivara onboarding payloads for the gated test seed endpoint."""

from __future__ import annotations

from app.models.enums import OnboardingCurrentStep

NIVARA_ONBOARDING_STEPS: list[tuple[str, dict]] = [
    (
        OnboardingCurrentStep.ROLE_AUTHORITY,
        {
            "designation": "Managing Director",
            "relationship": "director",
            "relationshipOther": "",
            "authorisedSignatory": "yes",
            "basisOfAuthority": "board-resolution",
            "basisOfAuthorityOther": "",
            "primaryOnboardingContact": "yes",
            "addAlternateContact": False,
            "alternateContact": {
                "fullName": "",
                "designation": "",
                "email": "",
                "mobile": "",
            },
        },
    ),
    (
        OnboardingCurrentStep.COMPANY_IDENTITY,
        {
            "legalName": "Nivara Techfab Private Limited",
            "cin": "U29309MH2019PTC328517",
            "incorporationDate": "2019-06-12",
            "companyClass": "private",
            "registeredState": "Maharashtra",
            "registrarOfCompanies": "Registrar of Companies, Pune",
            "registeredOffice": {
                "addressLine1": "Unit No. 14, Meridian Industrial Estate",
                "addressLine2": "MIDC Bhosari",
                "locality": "Bhosari",
                "city": "Pune",
                "district": "Pune",
                "state": "Maharashtra",
                "pinCode": "411026",
                "country": "India",
            },
            "companyEmail": "compliance@nivara-demo.example",
            "companyWebsite": "https://nivara-demo.example",
        },
    ),
    (
        OnboardingCurrentStep.BUSINESS_CLASSIFICATION,
        {
            "primaryIndustry": "manufacturing",
            "primaryIndustryOther": "",
            "businessSector": "Precision components",
            "operationsDescription": (
                "Manufacturing precision metal components and electromechanical assemblies."
            ),
            "pan": "AABCN1234Q",
            "gstRegistrationRequired": "no",
            "gstRegistrations": [],
            "udyamRegistration": "UDYAM-MH-19-0048721",
            "importExportCode": "",
            "employeeCountRange": "51-100",
        },
    ),
    (
        OnboardingCurrentStep.OWNERSHIP_SNAPSHOT,
        {
            "promoterCount": "2",
            "directorCount": "3",
            "promoterHoldingPercent": "75",
            "nonPromoterHoldingPercent": "25",
            "institutionalShareholdersPresent": "no",
            "foreignShareholdersPresent": "no",
            "promoterGroupEntitiesPresent": "no",
        },
    ),
    (
        OnboardingCurrentStep.IPO_INTENT,
        {
            "proposedIssueType": "fresh-issue",
            "issueSizeCrore": "50",
            "issueSizeNotDecided": False,
            "targetTimeline": "6-12-months",
            "intendedExchange": "nse-emerge",
            "primaryPurposes": ["capital-expenditure"],
            "primaryPurposeOther": "",
            "merchantBankerAppointed": "no",
            "merchantBankerName": "",
            "preparationStage": "internal-preparation",
        },
    ),
    (
        OnboardingCurrentStep.INITIAL_DOCUMENTS,
        {
            "selections": {
                "certificate-of-incorporation": {
                    "fileName": "coi.pdf",
                    "fileSize": 1024,
                    "mimeType": "application/pdf",
                },
                "current-moa": None,
                "current-aoa": None,
                "pan": None,
                "latest-audited-financials": None,
                "representative-authorisation": None,
            },
            "skippedForNow": True,
        },
    ),
]
