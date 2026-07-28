from enum import StrEnum


class AuthErrorCode(StrEnum):
    EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"
    INVALID_ACCESS_TOKEN = "INVALID_ACCESS_TOKEN"
    INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN"


class NextAction(StrEnum):
    START_SME_ONBOARDING = "start_sme_onboarding"
    RESUME_SME_ONBOARDING = "resume_sme_onboarding"
    OPEN_DASHBOARD = "open_dashboard"


REDIRECT_BY_NEXT_ACTION: dict[NextAction, str] = {
    NextAction.START_SME_ONBOARDING: "/onboarding/sme",
    NextAction.RESUME_SME_ONBOARDING: "/onboarding/sme",
    NextAction.OPEN_DASHBOARD: "/projects/demo",
}


def redirect_for_next_action(next_action: NextAction) -> str:
    return REDIRECT_BY_NEXT_ACTION[next_action]
