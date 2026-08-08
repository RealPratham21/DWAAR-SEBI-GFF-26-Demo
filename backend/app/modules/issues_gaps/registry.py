"""Workstream assessment loaders for G4 detectors."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.borrowings_assets_contracts.service import get_assessment as get_bac_assessment
from app.modules.business_operations.service import get_assessment as get_business_assessment
from app.modules.capital_ownership.service import get_assessment as get_capital_assessment
from app.modules.financials_kpis.service import get_assessment as get_financials_assessment
from app.modules.group_entities_related_parties.service import (
    get_assessment as get_group_assessment,
)
from app.modules.industry_market.service import get_assessment as get_industry_assessment
from app.modules.intermediaries_filing.service import get_filing_readiness
from app.modules.ipo_setup_eligibility.service import get_assessment as get_ipo_assessment
from app.modules.litigation_approvals_compliance.service import get_assessment as get_lac_assessment
from app.modules.management_governance.service import get_assessment as get_governance_assessment
from app.modules.objects_issue.service import get_assessment as get_objects_assessment


AssessmentLoader = Callable[[Session, User], Any]

WORKSTREAM_ASSESSMENT_LOADERS: list[tuple[str, AssessmentLoader]] = [
    ("ipo-setup-eligibility", get_ipo_assessment),
    ("capital-ownership", get_capital_assessment),
    ("business-operations", get_business_assessment),
    ("objects-of-issue", get_objects_assessment),
    ("financials-kpis", get_financials_assessment),
    ("management-governance", get_governance_assessment),
    ("industry-market", get_industry_assessment),
    ("group-entities-related-parties", get_group_assessment),
    ("borrowings-assets-contracts", get_bac_assessment),
    ("litigation-approvals-compliance", get_lac_assessment),
    ("intermediaries-filing", get_filing_readiness),
]
