from enum import StrEnum


class OnboardingJourneyType(StrEnum):
    SME = "sme"


class OnboardingStatus(StrEnum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    CANCELLED = "cancelled"


ACTIVE_ONBOARDING_STATUSES = frozenset(
    {OnboardingStatus.DRAFT, OnboardingStatus.IN_PROGRESS},
)


class OnboardingCurrentStep(StrEnum):
    ROLE_AUTHORITY = "role_authority"
    COMPANY_IDENTITY = "company_identity"
    BUSINESS_CLASSIFICATION = "business_classification"
    OWNERSHIP_SNAPSHOT = "ownership_snapshot"
    IPO_INTENT = "ipo_intent"
    INITIAL_DOCUMENTS = "initial_documents"
    REVIEW_SUBMIT = "review_submit"
