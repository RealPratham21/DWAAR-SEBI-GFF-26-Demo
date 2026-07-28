from app.models.enums import OnboardingCurrentStep

STEP_TO_DRAFT_KEY: dict[str, str] = {
    OnboardingCurrentStep.ROLE_AUTHORITY: "roleAuthority",
    OnboardingCurrentStep.COMPANY_IDENTITY: "companyIdentity",
    OnboardingCurrentStep.BUSINESS_CLASSIFICATION: "businessClassification",
    OnboardingCurrentStep.OWNERSHIP_SNAPSHOT: "ownershipSnapshot",
    OnboardingCurrentStep.IPO_INTENT: "ipoIntent",
    OnboardingCurrentStep.INITIAL_DOCUMENTS: "initialDocuments",
    OnboardingCurrentStep.REVIEW_SUBMIT: "submissionConfirmations",
}

DRAFT_KEY_TO_STEP: dict[str, str] = {value: key for key, value in STEP_TO_DRAFT_KEY.items()}

STEP_ROUTE_SUFFIX: dict[str, str] = {
    OnboardingCurrentStep.ROLE_AUTHORITY: "role-authority",
    OnboardingCurrentStep.COMPANY_IDENTITY: "company-identity",
    OnboardingCurrentStep.BUSINESS_CLASSIFICATION: "business-classification",
    OnboardingCurrentStep.OWNERSHIP_SNAPSHOT: "ownership-snapshot",
    OnboardingCurrentStep.IPO_INTENT: "ipo-intent",
    OnboardingCurrentStep.INITIAL_DOCUMENTS: "initial-documents",
}

ROUTE_SUFFIX_TO_STEP: dict[str, str] = {value: key for key, value in STEP_ROUTE_SUFFIX.items()}

STEP_ORDER: list[str] = [
    OnboardingCurrentStep.ROLE_AUTHORITY,
    OnboardingCurrentStep.COMPANY_IDENTITY,
    OnboardingCurrentStep.BUSINESS_CLASSIFICATION,
    OnboardingCurrentStep.OWNERSHIP_SNAPSHOT,
    OnboardingCurrentStep.IPO_INTENT,
    OnboardingCurrentStep.INITIAL_DOCUMENTS,
    OnboardingCurrentStep.REVIEW_SUBMIT,
]

NEXT_STEP_AFTER: dict[str, str] = {
    OnboardingCurrentStep.ROLE_AUTHORITY: OnboardingCurrentStep.COMPANY_IDENTITY,
    OnboardingCurrentStep.COMPANY_IDENTITY: OnboardingCurrentStep.BUSINESS_CLASSIFICATION,
    OnboardingCurrentStep.BUSINESS_CLASSIFICATION: OnboardingCurrentStep.OWNERSHIP_SNAPSHOT,
    OnboardingCurrentStep.OWNERSHIP_SNAPSHOT: OnboardingCurrentStep.IPO_INTENT,
    OnboardingCurrentStep.IPO_INTENT: OnboardingCurrentStep.INITIAL_DOCUMENTS,
    OnboardingCurrentStep.INITIAL_DOCUMENTS: OnboardingCurrentStep.REVIEW_SUBMIT,
    OnboardingCurrentStep.REVIEW_SUBMIT: OnboardingCurrentStep.REVIEW_SUBMIT,
}

REQUIRED_SUBMIT_STEPS: list[str] = [
    OnboardingCurrentStep.ROLE_AUTHORITY,
    OnboardingCurrentStep.COMPANY_IDENTITY,
    OnboardingCurrentStep.BUSINESS_CLASSIFICATION,
    OnboardingCurrentStep.OWNERSHIP_SNAPSHOT,
    OnboardingCurrentStep.IPO_INTENT,
    OnboardingCurrentStep.INITIAL_DOCUMENTS,
]

DOCUMENT_IDS: tuple[str, ...] = (
    "certificate-of-incorporation",
    "current-moa",
    "current-aoa",
    "pan",
    "latest-audited-financials",
    "representative-authorisation",
)
