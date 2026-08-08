"""Load all 12 DRHP workstream workspaces for a user."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.borrowings_assets_contracts_workspace import BorrowingsAssetsContractsWorkspace
from app.models.business_operations_workspace import BusinessOperationsWorkspace
from app.models.capital_ownership_workspace import CapitalOwnershipWorkspace
from app.models.company_incorporation_workspace import CompanyIncorporationWorkspace
from app.models.financials_kpis_workspace import FinancialsKpisWorkspace
from app.models.group_entities_related_parties_workspace import GroupEntitiesRelatedPartiesWorkspace
from app.models.industry_market_workspace import IndustryMarketWorkspace
from app.models.intermediaries_filing_workspace import IntermediariesFilingWorkspace
from app.models.ipo_setup_eligibility_workspace import IpoSetupEligibilityWorkspace
from app.models.litigation_approvals_compliance_workspace import LitigationApprovalsComplianceWorkspace
from app.models.management_governance_workspace import ManagementGovernanceWorkspace
from app.models.objects_issue_workspace import ObjectsIssueWorkspace
from app.modules.drhp.constants import WORKSTREAM_SLUGS
from app.modules.drhp.hashing import canonical_json, compute_source_hash


@dataclass(frozen=True)
class WorkstreamSnapshot:
    slug: str
    workspace_id: uuid.UUID
    version: int
    schema_version: int
    payload: dict[str, Any]
    payload_hash: str
    last_saved_at: str | None


WORKSPACE_MODELS: dict[str, type] = {
    "company-incorporation": CompanyIncorporationWorkspace,
    "ipo-setup-eligibility": IpoSetupEligibilityWorkspace,
    "capital-ownership": CapitalOwnershipWorkspace,
    "business-operations": BusinessOperationsWorkspace,
    "objects-of-issue": ObjectsIssueWorkspace,
    "financials-kpis": FinancialsKpisWorkspace,
    "management-governance": ManagementGovernanceWorkspace,
    "industry-market": IndustryMarketWorkspace,
    "group-entities-related-parties": GroupEntitiesRelatedPartiesWorkspace,
    "borrowings-assets-contracts": BorrowingsAssetsContractsWorkspace,
    "litigation-approvals-compliance": LitigationApprovalsComplianceWorkspace,
    "intermediaries-filing": IntermediariesFilingWorkspace,
}


def load_all_workstreams(db: Session, user_id: uuid.UUID) -> dict[str, WorkstreamSnapshot]:
    snapshots: dict[str, WorkstreamSnapshot] = {}
    for slug in WORKSTREAM_SLUGS:
        model = WORKSPACE_MODELS[slug]
        workspace = db.scalar(select(model).where(model.user_id == user_id))
        if workspace is None:
            continue
        payload = workspace.payload if isinstance(workspace.payload, dict) else {}
        snapshots[slug] = WorkstreamSnapshot(
            slug=slug,
            workspace_id=workspace.id,
            version=workspace.version,
            schema_version=workspace.schema_version,
            payload=payload,
            payload_hash=compute_source_hash({"slug": slug, "payload": payload}),
            last_saved_at=workspace.last_saved_at.isoformat() if workspace.last_saved_at else None,
        )
    return snapshots


def missing_workstream_slugs(snapshots: dict[str, WorkstreamSnapshot]) -> list[str]:
    return [slug for slug in WORKSTREAM_SLUGS if slug not in snapshots]
