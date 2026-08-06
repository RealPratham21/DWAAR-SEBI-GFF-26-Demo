"""General Corporate Purposes (GCP) cap helper — ports `frontend/lib/objects-of-issue/gcp.ts`."""

from __future__ import annotations

from app.modules.objects_issue import decimal_math as dm

GCP_RULE_VERSION = 1

GCP_PERCENT_OF_FRESH_PROCEEDS = "15"

GCP_ABSOLUTE_CAP_RUPEES = "100000000"


def calculate_gcp_cap(fresh_issue_proceeds_rupees: str) -> dict[str, str | int]:
    percent_cap = dm.percentage_of(GCP_PERCENT_OF_FRESH_PROCEEDS, fresh_issue_proceeds_rupees, 2)
    absolute_cap = dm.to_decimal_string(GCP_ABSOLUTE_CAP_RUPEES)
    applicable_cap = absolute_cap if percent_cap == "" else dm.min_decimal(percent_cap, absolute_cap)
    return {
        "percentCap": percent_cap,
        "absoluteCap": absolute_cap,
        "applicableCap": applicable_cap,
        "ruleVersion": GCP_RULE_VERSION,
    }
