"""Stable JSON payload paths for future DRHP adapters (LAC2).

These paths reference the canonical persisted workspace document in
``litigation_approvals_compliance_workspaces.payload``. Derived fields such as
Overview, Assessment, progress and aggregates are intentionally excluded.
"""

from __future__ import annotations

from app.modules.litigation_approvals_compliance.constants import SECTION_PAYLOAD_KEYS

SCHEMA_VERSION_PATH = "schemaVersion"

# Top-level section keys (camelCase) — mirror SECTION_PAYLOAD_KEYS values.
LEGAL_UNIVERSE_SECTION = SECTION_PAYLOAD_KEYS[
    "legal-universe-materiality-policy-and-party-mapping"
]
LITIGATION_MASTER_SECTION = SECTION_PAYLOAD_KEYS["litigation-and-proceedings-master"]
CRIMINAL_REGULATORY_TAX_SECTION = SECTION_PAYLOAD_KEYS[
    "criminal-regulatory-tax-and-enforcement-readiness"
]
APPROVALS_MASTER_SECTION = SECTION_PAYLOAD_KEYS[
    "government-regulatory-and-business-approvals-master"
]
APPROVAL_CONDITIONS_SECTION = SECTION_PAYLOAD_KEYS[
    "approval-conditions-facility-compliance-and-renewal-readiness"
]
COMPLIANCE_EXCEPTIONS_SECTION = SECTION_PAYLOAD_KEYS[
    "corporate-statutory-and-operational-compliance-exceptions"
]
CREDITORS_DEVELOPMENTS_SECTION = SECTION_PAYLOAD_KEYS[
    "material-creditors-penalties-and-material-developments"
]
RECONCILIATION_SECTION = SECTION_PAYLOAD_KEYS[
    "reconciliation-remediation-and-issuer-confirmations"
]

DRHP_PAYLOAD_PATHS: dict[str, str] = {
    "schema_version": SCHEMA_VERSION_PATH,
    # Legal universe & materiality policy
    "legal_dd_snapshot": f"{LEGAL_UNIVERSE_SECTION}.legalDdSnapshot",
    "legal_party_reviews": f"{LEGAL_UNIVERSE_SECTION}.legalPartyReviews",
    "litigation_materiality_policy": f"{LEGAL_UNIVERSE_SECTION}.litigationMaterialityPolicy",
    "quantitative_materiality_criteria": (
        f"{LEGAL_UNIVERSE_SECTION}.litigationMaterialityPolicy.quantitativeCriteria"
    ),
    "qualitative_materiality_criteria": (
        f"{LEGAL_UNIVERSE_SECTION}.litigationMaterialityPolicy.qualitativeCriteria"
    ),
    # Canonical Matter Master
    "matter_master": f"{LITIGATION_MASTER_SECTION}.matters",
    "matter_identity": "litigationAndProceedingsMaster.matters[].identity",
    "matter_affected_parties": "litigationAndProceedingsMaster.matters[].affectedParties",
    "matter_forum": "litigationAndProceedingsMaster.matters[].forum",
    "matter_stage": "litigationAndProceedingsMaster.matters[].datesAndStage",
    "matter_amounts": "litigationAndProceedingsMaster.matters[].amounts",
    "matter_status_outcome": "litigationAndProceedingsMaster.matters[].statusOutcome",
    "matter_materiality": "litigationAndProceedingsMaster.matters[].materiality",
    # Criminal / regulatory / tax readiness metadata
    "criminal_screening": f"{CRIMINAL_REGULATORY_TAX_SECTION}.criminalScreening",
    "regulatory_actions": f"{CRIMINAL_REGULATORY_TAX_SECTION}.regulatoryActions",
    "sebi_exchange_screening": f"{CRIMINAL_REGULATORY_TAX_SECTION}.sebiExchangeScreening",
    "tax_proceeding_details": f"{CRIMINAL_REGULATORY_TAX_SECTION}.taxProceedingDetails",
    # Canonical Approval Master
    "approval_master": f"{APPROVALS_MASTER_SECTION}.approvals",
    "approval_applications": "governmentRegulatoryAndBusinessApprovalsMaster.approvals[].application",
    "approval_renewals": "governmentRegulatoryAndBusinessApprovalsMaster.approvals[].renewal",
    # Approval conditions, facilities, projects
    "approval_conditions": f"{APPROVAL_CONDITIONS_SECTION}.approvalConditions",
    "facility_approval_matrix": f"{APPROVAL_CONDITIONS_SECTION}.facilityApprovalReviews",
    "project_approval_requirements": (
        f"{APPROVAL_CONDITIONS_SECTION}.projectApprovalRequirements"
    ),
    # Compliance
    "compliance_domain_reviews": f"{COMPLIANCE_EXCEPTIONS_SECTION}.complianceDomainReviews",
    "compliance_issues": f"{COMPLIANCE_EXCEPTIONS_SECTION}.complianceIssues",
    # Creditors, penalties, developments
    "material_creditor_policy": (
        f"{CREDITORS_DEVELOPMENTS_SECTION}.materialCreditorPolicy"
    ),
    "material_creditors": f"{CREDITORS_DEVELOPMENTS_SECTION}.materialCreditors",
    "statutory_dues": f"{COMPLIANCE_EXCEPTIONS_SECTION}.statutoryDues",
    "historical_penalties": f"{CREDITORS_DEVELOPMENTS_SECTION}.historicalPenalties",
    "material_developments": f"{CREDITORS_DEVELOPMENTS_SECTION}.materialDevelopments",
    # Reconciliation & remediation
    "remediation_actions": f"{RECONCILIATION_SECTION}.remediationActions",
    "financials_reconciliation": f"{RECONCILIATION_SECTION}.financialsReconciliation",
    "group_entities_reconciliation": f"{RECONCILIATION_SECTION}.groupEntitiesReconciliation",
    "management_governance_reconciliation": (
        f"{RECONCILIATION_SECTION}.managementGovernanceReconciliation"
    ),
    "bac_reconciliation": f"{RECONCILIATION_SECTION}.bacReconciliation",
    "business_operations_reconciliation": (
        f"{RECONCILIATION_SECTION}.businessOperationsReconciliation"
    ),
    "objects_reconciliation": f"{RECONCILIATION_SECTION}.objectsOfIssueReconciliation",
    "ipo_setup_reconciliation": f"{RECONCILIATION_SECTION}.ipoSetupReconciliation",
    "issuer_confirmations": f"{RECONCILIATION_SECTION}.confirmations",
}
