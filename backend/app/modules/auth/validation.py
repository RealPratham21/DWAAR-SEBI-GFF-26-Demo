import re

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128

_PASSWORD_UPPERCASE = re.compile(r"[A-Z]")
_PASSWORD_LOWERCASE = re.compile(r"[a-z]")
_PASSWORD_DIGIT = re.compile(r"[0-9]")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_full_name(full_name: str) -> str:
    return full_name.strip()


def normalize_phone_e164(phone: str) -> str:
    digits = re.sub(r"\D", "", phone.strip())
    if len(digits) == 10 and digits[0] in "6789":
        return f"+91{digits}"
    if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return f"+{digits}"
    msg = "Enter a valid 10-digit Indian mobile number"
    raise ValueError(msg)


def validate_password(password: str) -> None:
    if len(password) < PASSWORD_MIN_LENGTH:
        msg = "Password must be at least 8 characters"
        raise ValueError(msg)
    if len(password) > PASSWORD_MAX_LENGTH:
        msg = "Password must be at most 128 characters"
        raise ValueError(msg)
    if not _PASSWORD_UPPERCASE.search(password):
        msg = "Password must contain at least one uppercase letter"
        raise ValueError(msg)
    if not _PASSWORD_LOWERCASE.search(password):
        msg = "Password must contain at least one lowercase letter"
        raise ValueError(msg)
    if not _PASSWORD_DIGIT.search(password):
        msg = "Password must contain at least one number"
        raise ValueError(msg)
