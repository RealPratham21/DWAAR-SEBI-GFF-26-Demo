"""Stable JSON payload paths for future DRHP adapters (IF2)."""

from __future__ import annotations

from app.modules.intermediaries_filing.constants import SECTION_PAYLOAD_KEYS

SCHEMA_VERSION_PATH = "schemaVersion"

ISSUE_TEAM_SECTION = SECTION_PAYLOAD_KEYS["issue-team-and-intermediary-master"]
ISSUE_CONFIGURATION_SECTION = SECTION_PAYLOAD_KEYS["issue-configuration-and-filing-snapshot"]
FILING_TRACKER_SECTION = SECTION_PAYLOAD_KEYS["filing-and-regulatory-milestone-tracker"]
DUE_DILIGENCE_SECTION = SECTION_PAYLOAD_KEYS["due-diligence-certificates-consents-and-signoffs"]
INFRASTRUCTURE_SECTION = SECTION_PAYLOAD_KEYS["depositories-banking-asba-upi-and-issue-infrastructure"]
UNDERWRITING_SECTION = SECTION_PAYLOAD_KEYS["underwriting-market-making-and-distribution-arrangements"]
ISSUE_PROGRAMME_SECTION = SECTION_PAYLOAD_KEYS["issue-programme-allotment-listing-and-post-issue-execution"]
FINAL_DOCUMENT_SECTION = SECTION_PAYLOAD_KEYS[
    "final-offer-document-advertisements-material-documents-and-filing-readiness"
]

DRHP_PAYLOAD_PATHS: dict[str, str] = {
    "schema_version": SCHEMA_VERSION_PATH,
    "issue_team_snapshot": f"{ISSUE_TEAM_SECTION}.issueTeamSnapshot",
    "intermediary_master": f"{ISSUE_TEAM_SECTION}.intermediaries",
    "inter_se_responsibilities": f"{ISSUE_TEAM_SECTION}.interSeResponsibilities",
    "inter_se_agreement": f"{ISSUE_TEAM_SECTION}.interSeAgreement",
    "ipo_setup_linked_snapshot": f"{ISSUE_CONFIGURATION_SECTION}.ipoSetupLinkedSnapshot",
    "capital_linked_snapshot": f"{ISSUE_CONFIGURATION_SECTION}.capitalLinkedSnapshot",
    "filing_snapshot": f"{ISSUE_CONFIGURATION_SECTION}.filingSnapshot",
    "filing_snapshot_reconciliation": f"{ISSUE_CONFIGURATION_SECTION}.filingSnapshotReconciliation",
    "pricing": f"{ISSUE_CONFIGURATION_SECTION}.pricing",
    "investor_allocations": f"{ISSUE_CONFIGURATION_SECTION}.investorAllocations",
    "lot_application_details": f"{ISSUE_CONFIGURATION_SECTION}.lotApplicationDetails",
    "filing_records": f"{FILING_TRACKER_SECTION}.filings",
    "exchange_draft_filing": f"{FILING_TRACKER_SECTION}.exchangeDraftFiling",
    "exchange_queries": f"{FILING_TRACKER_SECTION}.exchangeQueries",
    "resubmissions": f"{FILING_TRACKER_SECTION}.resubmissions",
    "in_principle_approval": f"{FILING_TRACKER_SECTION}.inPrincipleApproval",
    "sebi_sme_filing": f"{FILING_TRACKER_SECTION}.sebiSmeFiling",
    "roc_filing": f"{FILING_TRACKER_SECTION}.rocFiling",
    "due_diligence_areas": f"{DUE_DILIGENCE_SECTION}.dueDiligenceAreas",
    "certificates": f"{DUE_DILIGENCE_SECTION}.certificates",
    "consents": f"{DUE_DILIGENCE_SECTION}.consents",
    "chapter_signoffs": f"{DUE_DILIGENCE_SECTION}.chapterSignoffs",
    "depository_readiness": f"{INFRASTRUCTURE_SECTION}.depositoryReadiness",
    "depository_agreements": f"{INFRASTRUCTURE_SECTION}.depositoryAgreements",
    "issue_bank_roles": f"{INFRASTRUCTURE_SECTION}.issueBankRoles",
    "sponsor_bank_upi_readiness": f"{INFRASTRUCTURE_SECTION}.sponsorBankUpiReadiness",
    "asba_configuration": f"{INFRASTRUCTURE_SECTION}.asbaConfiguration",
    "underwriting_summary": f"{UNDERWRITING_SECTION}.underwritingSummary",
    "underwriting_commitments": f"{UNDERWRITING_SECTION}.underwritingCommitments",
    "nominated_investors": f"{UNDERWRITING_SECTION}.nominatedInvestors",
    "market_maker_configuration": f"{UNDERWRITING_SECTION}.marketMakerConfiguration",
    "market_maker_reservation": f"{UNDERWRITING_SECTION}.marketMakerReservation",
    "market_making_arrangement": f"{UNDERWRITING_SECTION}.marketMakingArrangement",
    "issue_calendar": f"{ISSUE_PROGRAMME_SECTION}.issueCalendar",
    "issue_opening_readiness": f"{ISSUE_PROGRAMME_SECTION}.issueOpeningReadiness",
    "subscription_rows": f"{ISSUE_PROGRAMME_SECTION}.subscriptionRows",
    "basis_of_allotment": f"{ISSUE_PROGRAMME_SECTION}.basisOfAllotment",
    "allotment_summaries": f"{ISSUE_PROGRAMME_SECTION}.allotmentSummaries",
    "funds_unblocking": f"{ISSUE_PROGRAMME_SECTION}.fundsUnblocking",
    "demat_credit": f"{ISSUE_PROGRAMME_SECTION}.dematCredit",
    "listing": f"{ISSUE_PROGRAMME_SECTION}.listing",
    "post_issue_actions": f"{ISSUE_PROGRAMME_SECTION}.postIssueActions",
    "offer_document_versions": f"{FINAL_DOCUMENT_SECTION}.offerDocumentVersions",
    "placeholders": f"{FINAL_DOCUMENT_SECTION}.placeholders",
    "inspection_items": f"{FINAL_DOCUMENT_SECTION}.inspectionItems",
    "issue_agreements": f"{FINAL_DOCUMENT_SECTION}.issueAgreements",
    "public_communications": f"{FINAL_DOCUMENT_SECTION}.publicCommunications",
    "audiovisual_presentation": f"{FINAL_DOCUMENT_SECTION}.audiovisualPresentation",
    "merchant_banker_dd_repository_readiness": f"{FINAL_DOCUMENT_SECTION}.merchantBankerDdRepositoryReadiness",
    "final_confirmations": f"{FINAL_DOCUMENT_SECTION}.finalConfirmations",
}
