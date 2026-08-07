"""Cross-record reference integrity for Intermediaries & Filing."""

from __future__ import annotations

from typing import Any

from app.modules.intermediaries_filing.constants import SECTION_LABELS
from app.modules.intermediaries_filing.filings import (
    format_document_version_label,
    format_filing_label,
    get_filing_by_id,
    get_offer_document_version_by_id,
)
from app.modules.intermediaries_filing.intermediaries import format_intermediary_label, get_intermediary_by_id


def _push(
    deps: list[dict[str, str]],
    category: str,
    record_id: str,
    section_id: str,
    label: str,
) -> None:
    deps.append(
        {
            "category": category,
            "recordId": record_id,
            "sectionId": section_id,
            "label": label,
        }
    )


def count_intermediary_references(
    payload: dict[str, Any],
    intermediary_id: str,
) -> list[dict[str, str]]:
    if not intermediary_id:
        return []
    deps: list[dict[str, str]] = []

    section1 = payload.get("issueTeamAndIntermediaryMaster") or {}
    for responsibility in section1.get("interSeResponsibilities") or []:
        if not isinstance(responsibility, dict):
            continue
        if responsibility.get("intermediaryId") == intermediary_id:
            _push(
                deps,
                "inter-se-responsibility",
                str(responsibility.get("responsibilityId") or ""),
                "issue-team-and-intermediary-master",
                "Inter-se responsibility → Intermediary",
            )

    inter_se = section1.get("interSeAgreement") or {}
    if inter_se.get("coordinatingLeadManagerIntermediaryId") == intermediary_id:
        _push(
            deps,
            "inter-se-responsibility",
            str(inter_se.get("coordinatingLeadManagerIntermediaryId") or ""),
            "issue-team-and-intermediary-master",
            "Inter-se agreement coordinating Lead Manager → Intermediary",
        )

    for intermediary in section1.get("intermediaries") or []:
        if not isinstance(intermediary, dict):
            continue
        if intermediary.get("appointment", {}).get("replacementIntermediaryId") == intermediary_id:
            _push(
                deps,
                "inter-se-responsibility",
                str(intermediary.get("intermediaryId") or ""),
                "issue-team-and-intermediary-master",
                "Replacement intermediary reference → Intermediary",
            )

    section3 = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    for filing in section3.get("filings") or []:
        if isinstance(filing, dict) and filing.get("responsibleLeadManagerIntermediaryId") == intermediary_id:
            _push(
                deps,
                "filing-record",
                str(filing.get("filingId") or ""),
                "filing-and-regulatory-milestone-tracker",
                "Filing → responsible Lead Manager",
            )

    for query in section3.get("exchangeQueries") or []:
        if isinstance(query, dict) and query.get("responsibleLeadManagerIntermediaryId") == intermediary_id:
            _push(
                deps,
                "exchange-query",
                str(query.get("queryId") or ""),
                "filing-and-regulatory-milestone-tracker",
                "Exchange query → responsible Lead Manager",
            )

    section4 = payload.get("dueDiligenceCertificatesConsentsAndSignoffs") or {}
    for area in section4.get("dueDiligenceAreas") or []:
        if isinstance(area, dict) and area.get("responsibleProfessionalIntermediaryId") == intermediary_id:
            _push(
                deps,
                "certificate",
                str(area.get("dueDiligenceAreaId") or ""),
                "due-diligence-certificates-consents-and-signoffs",
                "DD area → responsible professional",
            )

    for certificate in section4.get("certificates") or []:
        if isinstance(certificate, dict) and certificate.get("linkedIntermediaryId") == intermediary_id:
            _push(
                deps,
                "certificate",
                str(certificate.get("certificateId") or ""),
                "due-diligence-certificates-consents-and-signoffs",
                "Certificate → Intermediary",
            )

    for consent in section4.get("consents") or []:
        if isinstance(consent, dict) and consent.get("linkedPersonIntermediaryId") == intermediary_id:
            _push(
                deps,
                "consent",
                str(consent.get("consentId") or ""),
                "due-diligence-certificates-consents-and-signoffs",
                "Consent → Intermediary/person",
            )

    for signoff in section4.get("chapterSignoffs") or []:
        if isinstance(signoff, dict) and signoff.get("responsibleAdviserIntermediaryId") == intermediary_id:
            _push(
                deps,
                "chapter-signoff",
                str(signoff.get("signoffId") or ""),
                "due-diligence-certificates-consents-and-signoffs",
                "Chapter sign-off → adviser Intermediary",
            )

    section5 = payload.get("depositoriesBankingAsbaUpiAndIssueInfrastructure") or {}
    agreements = (section5.get("depositoryAgreements") or {})
    for agreement in (agreements.get("nsdl"), agreements.get("cdsl")):
        if isinstance(agreement, dict) and agreement.get("registrarIntermediaryId") == intermediary_id:
            _push(
                deps,
                "issue-bank-role",
                str(agreement.get("registrarIntermediaryId") or ""),
                "depositories-banking-asba-upi-and-issue-infrastructure",
                "Depository agreement → Registrar Intermediary",
            )

    for bank_role in section5.get("issueBankRoles") or []:
        if isinstance(bank_role, dict) and bank_role.get("intermediaryId") == intermediary_id:
            _push(
                deps,
                "issue-bank-role",
                str(bank_role.get("bankRoleId") or ""),
                "depositories-banking-asba-upi-and-issue-infrastructure",
                "Issue bank role → Intermediary",
            )

    sponsor = section5.get("sponsorBankUpiReadiness") or {}
    if sponsor.get("intermediaryId") == intermediary_id:
        _push(
            deps,
            "issue-bank-role",
            str(sponsor.get("intermediaryId") or ""),
            "depositories-banking-asba-upi-and-issue-infrastructure",
            "Sponsor Bank readiness → Intermediary",
        )

    section6 = payload.get("underwritingMarketMakingAndDistributionArrangements") or {}
    for commitment in section6.get("underwritingCommitments") or []:
        if isinstance(commitment, dict) and commitment.get("intermediaryId") == intermediary_id:
            _push(
                deps,
                "underwriting-commitment",
                str(commitment.get("underwritingCommitmentId") or ""),
                "underwriting-market-making-and-distribution-arrangements",
                "Underwriting commitment → Intermediary",
            )

    for investor in section6.get("nominatedInvestors") or []:
        if isinstance(investor, dict) and investor.get("linkedIntermediaryEntityId") == intermediary_id:
            _push(
                deps,
                "nominated-investor",
                str(investor.get("nominatedInvestorId") or ""),
                "underwriting-market-making-and-distribution-arrangements",
                "Nominated investor → linked entity",
            )

    market_maker = section6.get("marketMakerConfiguration") or {}
    if market_maker.get("marketMakerIntermediaryId") == intermediary_id:
        _push(
            deps,
            "underwriting-commitment",
            str(market_maker.get("marketMakerIntermediaryId") or ""),
            "underwriting-market-making-and-distribution-arrangements",
            "Market Maker configuration → Intermediary",
        )

    section7 = payload.get("issueProgrammeAllotmentListingAndPostIssueExecution") or {}
    for action in section7.get("postIssueActions") or []:
        if isinstance(action, dict) and action.get("responsibleIntermediaryId") == intermediary_id:
            _push(
                deps,
                "post-issue-action",
                str(action.get("postIssueActionId") or ""),
                "issue-programme-allotment-listing-and-post-issue-execution",
                "Post-issue action → responsible Intermediary",
            )

    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    repo = section8.get("merchantBankerDdRepositoryReadiness") or {}
    if repo.get("responsibleLeadManagerIntermediaryId") == intermediary_id:
        _push(
            deps,
            "certificate",
            str(repo.get("responsibleLeadManagerIntermediaryId") or ""),
            "final-offer-document-advertisements-material-documents-and-filing-readiness",
            "DD repository readiness → responsible Lead Manager",
        )

    for agreement in section8.get("issueAgreements") or []:
        if not isinstance(agreement, dict):
            continue
        if intermediary_id in (agreement.get("linkedIntermediaryIds") or []):
            _push(
                deps,
                "issue-agreement",
                str(agreement.get("issueAgreementId") or ""),
                "final-offer-document-advertisements-material-documents-and-filing-readiness",
                "Issue agreement → Intermediary",
            )

    return deps


def count_filing_references(payload: dict[str, Any], filing_id: str) -> list[dict[str, str]]:
    if not filing_id:
        return []
    deps: list[dict[str, str]] = []
    section3 = payload.get("filingAndRegulatoryMilestoneTracker") or {}

    for query in section3.get("exchangeQueries") or []:
        if isinstance(query, dict) and query.get("filingId") == filing_id:
            _push(
                deps,
                "exchange-query",
                str(query.get("queryId") or ""),
                "filing-and-regulatory-milestone-tracker",
                "Exchange query → Filing",
            )

    for resubmission in section3.get("resubmissions") or []:
        if not isinstance(resubmission, dict):
            continue
        if resubmission.get("linkedFilingId") == filing_id or resubmission.get("newFilingId") == filing_id:
            _push(
                deps,
                "resubmission",
                str(resubmission.get("resubmissionId") or ""),
                "filing-and-regulatory-milestone-tracker",
                "Resubmission → Filing",
            )

    for filing in section3.get("filings") or []:
        if isinstance(filing, dict) and filing.get("supersededByFilingId") == filing_id:
            _push(
                deps,
                "filing-record",
                str(filing.get("filingId") or ""),
                "filing-and-regulatory-milestone-tracker",
                "Filing superseded-by reference → Filing",
            )

    sebi = section3.get("sebiSmeFiling") or {}
    if sebi.get("linkedFilingId") == filing_id:
        _push(
            deps,
            "filing-record",
            str(sebi.get("linkedFilingId") or ""),
            "filing-and-regulatory-milestone-tracker",
            "SEBI SME filing → linked Filing",
        )

    return deps


def count_document_version_references(
    payload: dict[str, Any],
    document_version_id: str,
) -> list[dict[str, str]]:
    if not document_version_id:
        return []
    deps: list[dict[str, str]] = []

    section3 = payload.get("filingAndRegulatoryMilestoneTracker") or {}
    for filing in section3.get("filings") or []:
        if isinstance(filing, dict) and filing.get("linkedDocumentVersionId") == document_version_id:
            _push(
                deps,
                "filing-record",
                str(filing.get("filingId") or ""),
                "filing-and-regulatory-milestone-tracker",
                "Filing → document version",
            )

    section4 = payload.get("dueDiligenceCertificatesConsentsAndSignoffs") or {}
    for certificate in section4.get("certificates") or []:
        if isinstance(certificate, dict) and certificate.get("linkedOfferDocumentVersionId") == document_version_id:
            _push(
                deps,
                "certificate",
                str(certificate.get("certificateId") or ""),
                "due-diligence-certificates-consents-and-signoffs",
                "Certificate → document version",
            )

    for consent in section4.get("consents") or []:
        if isinstance(consent, dict) and consent.get("linkedOfferDocumentVersionId") == document_version_id:
            _push(
                deps,
                "consent",
                str(consent.get("consentId") or ""),
                "due-diligence-certificates-consents-and-signoffs",
                "Consent → document version",
            )

    section8 = payload.get("finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness") or {}
    for version in section8.get("offerDocumentVersions") or []:
        if isinstance(version, dict) and version.get("supersedesDocumentVersionId") == document_version_id:
            _push(
                deps,
                "placeholder",
                str(version.get("documentVersionId") or ""),
                "final-offer-document-advertisements-material-documents-and-filing-readiness",
                "Document version supersedes reference → document version",
            )

    for placeholder in section8.get("placeholders") or []:
        if isinstance(placeholder, dict) and placeholder.get("documentVersionId") == document_version_id:
            _push(
                deps,
                "placeholder",
                str(placeholder.get("placeholderId") or ""),
                "final-offer-document-advertisements-material-documents-and-filing-readiness",
                "Placeholder → document version",
            )

    for communication in section8.get("publicCommunications") or []:
        if isinstance(communication, dict) and communication.get("linkedDocumentVersionId") == document_version_id:
            _push(
                deps,
                "public-communication",
                str(communication.get("communicationId") or ""),
                "final-offer-document-advertisements-material-documents-and-filing-readiness",
                "Public communication → document version",
            )

    av = section8.get("audiovisualPresentation") or {}
    if av.get("linkedOfferDocumentVersionId") == document_version_id:
        _push(
            deps,
            "public-communication",
            str(av.get("linkedOfferDocumentVersionId") or ""),
            "final-offer-document-advertisements-material-documents-and-filing-readiness",
            "Audiovisual presentation → document version",
        )

    return deps


def format_intermediary_dependency_message(
    payload: dict[str, Any],
    intermediary_id: str,
    deps: list[dict[str, str]],
) -> str:
    if not deps:
        return ""
    intermediary = get_intermediary_by_id(payload, intermediary_id)
    label = format_intermediary_label(intermediary, intermediary_id)
    categories = sorted({dep["label"] for dep in deps})
    sections = sorted({SECTION_LABELS.get(dep["sectionId"], dep["sectionId"]) for dep in deps})
    return (
        f'"{label}" is referenced by {len(deps)} record(s) ({", ".join(categories)}) '
        f"across: {', '.join(sections)}. Remove or reassign dependent records first."
    )


def format_filing_dependency_message(
    payload: dict[str, Any],
    filing_id: str,
    deps: list[dict[str, str]],
) -> str:
    if not deps:
        return ""
    filing = get_filing_by_id(payload, filing_id)
    label = format_filing_label(filing, filing_id)
    categories = sorted({dep["label"] for dep in deps})
    sections = sorted({SECTION_LABELS.get(dep["sectionId"], dep["sectionId"]) for dep in deps})
    return (
        f'"{label}" is referenced by {len(deps)} record(s) ({", ".join(categories)}) '
        f"across: {', '.join(sections)}. Remove or reassign dependent records first."
    )


def format_document_version_dependency_message(
    payload: dict[str, Any],
    document_version_id: str,
    deps: list[dict[str, str]],
) -> str:
    if not deps:
        return ""
    version = get_offer_document_version_by_id(payload, document_version_id)
    label = format_document_version_label(version, document_version_id)
    categories = sorted({dep["label"] for dep in deps})
    sections = sorted({SECTION_LABELS.get(dep["sectionId"], dep["sectionId"]) for dep in deps})
    return (
        f'"{label}" is referenced by {len(deps)} record(s) ({", ".join(categories)}) '
        f"across: {', '.join(sections)}. Remove or reassign dependent records first."
    )
