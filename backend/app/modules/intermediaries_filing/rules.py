"""Versioned preview rules for Intermediaries & Filing (IF2)."""

from __future__ import annotations

IF_RULES_VERSION = "if1-preview-2026-08-07"
IF_RULES_AS_OF = "2026-08-07"

SME_UNDERWRITING_REQUIRED_PERCENTAGE = "100"
MERCHANT_BANKER_OWN_ACCOUNT_MINIMUM_PERCENTAGE = "15"
MARKET_MAKING_MINIMUM_DAYS = 1095

FILING_STAGE_SEQUENCE: tuple[str, ...] = (
    "preparation",
    "internal_due_diligence",
    "adviser_review",
    "board_approval",
    "exchange_draft_filing",
    "exchange_vetting",
    "revision",
    "in_principle_stage",
    "pre_issue_filing",
    "roc_filing",
    "issue_open",
    "issue_closed",
    "allotment",
    "listing_application",
    "listed",
    "other",
)

STAGE_ORDER = {stage: index for index, stage in enumerate(FILING_STAGE_SEQUENCE)}


def get_filing_stage_index(stage: str) -> int | None:
    if not stage:
        return None
    index = STAGE_ORDER.get(stage)
    return index if index is not None else None


def is_stage_at_least(current_stage: str, minimum_stage: str) -> bool:
    current_index = get_filing_stage_index(current_stage)
    minimum_index = STAGE_ORDER.get(minimum_stage)
    if current_index is None or minimum_index is None:
        return False
    if current_stage == "other":
        return False
    return current_index >= minimum_index


def compare_underwriting_coverage(
    total_underwriting_percentage: str,
) -> str:
    try:
        total = float(total_underwriting_percentage)
        required = float(SME_UNDERWRITING_REQUIRED_PERCENTAGE)
    except ValueError:
        return "unknown"
    if total != total or required != required:  # NaN check
        return "unknown"
    return "meets_threshold" if total >= required else "below_threshold"


def compare_merchant_banker_own_account(own_account_percentage: str) -> str:
    try:
        own = float(own_account_percentage)
        required = float(MERCHANT_BANKER_OWN_ACCOUNT_MINIMUM_PERCENTAGE)
    except ValueError:
        return "unknown"
    if own != own or required != required:
        return "unknown"
    return "meets_threshold" if own >= required else "below_threshold"
