import {
  createEmptyCertificateRecord,
  createEmptyFilingRecord,
  createEmptyIntermediariesFilingPayload,
  createEmptyIntermediaryRecord,
  createEmptyIssueBankRoleRecord,
  createEmptyOfferDocumentVersionRecord,
} from '@/lib/intermediaries-filing/defaults';
import { IF_CONFIRMATION_FIELDS } from '@/lib/intermediaries-filing/options';
import type { IntermediariesFilingPayload } from '@/lib/schemas/intermediaries-filing';
import {
  NIVARA_CAPITAL,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IDS,
  NIVARA_IPO,
  NIVARA_ISSUER,
} from '@/lib/demo-data/nivara/constants';

export function createNivaraIntermediariesFilingPayload(): IntermediariesFilingPayload {
  const base = createEmptyIntermediariesFilingPayload();

  const leadManager = {
    ...createEmptyIntermediaryRecord(),
    intermediaryId: NIVARA_IDS.intermediary001,
    legalName: 'Demo Capital Markets Private Limited',
    displayName: 'Demo Capital Markets',
    roles: ['lead_manager', 'book_running_lead_manager'],
    contact: {
      ...createEmptyIntermediaryRecord().contact,
      registeredOffice: 'Mumbai, Maharashtra',
      email: 'ipo-desk@demo-capital.example',
      contactPerson: 'Rajesh Iyer',
      designation: 'Executive Director — Investment Banking',
    },
    registration: {
      ...createEmptyIntermediaryRecord().registration,
      registrationRequired: 'yes',
      sebiRegistrationNumber: 'INM000012345',
      registrationCategory: 'Category I Merchant Banker',
      registrationStatus: 'confirmed',
      exchangeMembership: 'yes',
      exchange: 'NSE',
    },
    appointment: {
      ...createEmptyIntermediaryRecord().appointment,
      appointmentDate: '2024-08-01',
      boardApprovalReference: 'BR/2024-08/IPO-02',
      engagementLetterDate: '2024-08-05',
      scope: 'Lead manager for proposed NSE Emerge SME IPO',
      status: 'active',
      professionalConfirmation: 'pending',
    },
  };

  const registrar = {
    ...createEmptyIntermediaryRecord(),
    intermediaryId: NIVARA_IDS.intermediary002,
    legalName: 'Demo Registry Services Limited',
    displayName: 'Demo Registry Services',
    roles: ['registrar_to_issue'],
    contact: {
      ...createEmptyIntermediaryRecord().contact,
      registeredOffice: 'Mumbai, Maharashtra',
      email: 'rta@demo-registry.example',
      investorGrievanceEmail: 'grievance@demo-registry.example',
    },
    registration: {
      ...createEmptyIntermediaryRecord().registration,
      registrationRequired: 'yes',
      sebiRegistrationNumber: 'INR000006789',
      registrationCategory: 'Registrar to an Issue',
      registrationStatus: 'confirmed',
    },
    appointment: {
      ...createEmptyIntermediaryRecord().appointment,
      appointmentDate: '2024-08-10',
      engagementLetterDate: '2024-08-12',
      scope: 'Registrar to the Issue and share registry services',
      status: 'active',
    },
  };

  const legalCounsel = {
    ...createEmptyIntermediaryRecord(),
    intermediaryId: NIVARA_IDS.intermediary003,
    legalName: 'Demo Legal Partners',
    displayName: 'Demo Legal Partners',
    roles: ['legal_adviser', 'domestic_legal_counsel'],
    contact: {
      ...createEmptyIntermediaryRecord().contact,
      registeredOffice: 'Pune, Maharashtra',
      email: 'capitalmarkets@demo-legal.example',
      contactPerson: 'Adv. Meera Kulkarni',
      designation: 'Partner',
    },
    registration: {
      ...createEmptyIntermediaryRecord().registration,
      registrationRequired: 'no',
    },
    appointment: {
      ...createEmptyIntermediaryRecord().appointment,
      appointmentDate: '2024-08-01',
      engagementLetterDate: '2024-08-03',
      scope: 'Domestic legal counsel for IPO documentation and due diligence',
      status: 'active',
    },
  };

  const dueDiligenceCertificate = {
    ...createEmptyCertificateRecord(),
    certificateId: 'nivara-dd-certificate-001',
    certificateType: 'merchant_banker_due_diligence',
    provider: 'Demo Capital Markets Private Limited',
    linkedIntermediaryId: NIVARA_IDS.intermediary001,
    certificateDate: '2024-10-01',
    regulationFormReference: 'SEBI ICDR — Merchant Banker DD',
    subject: NIVARA_ISSUER.legalName,
    reportingPeriod: `FY ending ${NIVARA_FINANCIAL_PERIODS.fy2024End}`,
    linkedOfferDocumentVersionId: NIVARA_IDS.documentVersion001,
    status: 'draft',
    validityReadinessForCurrentFilingStage: 'pending',
    notes: 'Draft DD certificate for internal DRHP preparation stage.',
  };

  const issueBankRole = {
    ...createEmptyIssueBankRoleRecord(),
    bankRoleId: 'nivara-issue-bank-role-001',
    intermediaryId: NIVARA_IDS.intermediary001,
    role: 'escrow_collection_bank',
    branch: 'Pune — Camp',
    accountSetupStatus: 'configured',
    currentStatus: 'pending',
    notes: 'Escrow account setup initiated for fresh issue proceeds.',
  };

  const ifConfirmations = Object.fromEntries(
    IF_CONFIRMATION_FIELDS.map(({ key }) => [key, 'yes']),
  ) as IntermediariesFilingPayload['finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness']['finalConfirmations'];

  const documentVersion = {
    ...createEmptyOfferDocumentVersionRecord(),
    documentVersionId: NIVARA_IDS.documentVersion001,
    type: 'drhp',
    date: '2024-10-15',
    versionLabel: 'DRHP v0.1 — internal working draft',
    filingStage: 'preparation',
    filedAuthority: '',
    boardApproved: 'no',
    signed: 'no',
    currentAuthoritativeVersion: 'yes',
    openPlaceholderCount: '12',
    openCommentCount: '8',
    chapterSignOffCompletionStatus: 'In progress',
    professionalConfirmation: 'pending',
    notes: 'Internal working draft — no document upload or OCR populated for demo.',
  };

  const filing = {
    ...createEmptyFilingRecord(),
    filingId: NIVARA_IDS.filing001,
    linkedDocumentVersionId: NIVARA_IDS.documentVersion001,
    documentType: 'drhp',
    documentDate: '2024-10-15',
    internalVersion: 'v0.1',
    filingStage: 'preparation',
    status: 'working_draft',
    authority: 'sme_exchange',
    selectedAuthorityExchange: 'NSE Emerge',
    submittedBy: NIVARA_ISSUER.shortName,
    responsibleLeadManagerIntermediaryId: NIVARA_IDS.intermediary001,
    notes: 'Draft filing record at preparation stage — exchange submission not yet made.',
  };

  return {
    ...base,
    issueTeamAndIntermediaryMaster: {
      ...base.issueTeamAndIntermediaryMaster,
      issueTeamSnapshot: {
        ...base.issueTeamAndIntermediaryMaster.issueTeamSnapshot,
        teamAsOfDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        leadManagerAppointed: 'yes',
        registrarAppointed: 'yes',
        legalCounselAppointed: 'yes',
        statutoryPeerReviewAuditorEngaged: 'no',
        marketMakerAppointed: 'no',
        underwritersAppointed: 'no',
        allRequiredEngagementAgreementsExecuted: 'no',
      },
      intermediaries: [leadManager, registrar, legalCounsel],
      interSeAgreement: {
        ...base.issueTeamAndIntermediaryMaster.interSeAgreement,
        interSeAgreementRequired: 'yes',
        interSeAgreementExecuted: 'no',
        coordinatingLeadManagerIntermediaryId: NIVARA_IDS.intermediary001,
        professionalReview: 'pending',
      },
    },
    issueConfigurationAndFilingSnapshot: {
      ...base.issueConfigurationAndFilingSnapshot,
      ipoSetupLinkedSnapshot: {
        ...base.issueConfigurationAndFilingSnapshot.ipoSetupLinkedSnapshot,
        targetSmePlatform: NIVARA_IPO.targetSmePlatform,
        issueMethod: NIVARA_IPO.issueMethod,
        freshIssue: 'yes',
        ofs: 'no',
        totalOffer: 'fresh-issue-only',
        faceValue: NIVARA_CAPITAL.faceValuePerShare,
        proposedFinalIssuePrice: NIVARA_CAPITAL.proposedIssuePrice,
        offerSize: NIVARA_CAPITAL.totalOfferAmountCrore,
        targetFilingDate: `${NIVARA_IPO.targetFilingQuarter} ${NIVARA_IPO.targetFilingFinancialYear}`,
        publicCompanyConversionStatus: 'in-progress',
        issueStage: 'preparation',
      },
      capitalLinkedSnapshot: {
        ...base.issueConfigurationAndFilingSnapshot.capitalLinkedSnapshot,
        preIssueShares: NIVARA_CAPITAL.preIssueEquityShares,
        freshIssueShares: NIVARA_CAPITAL.freshIssueShares,
        ofsShares: '0',
        postIssueShares: NIVARA_CAPITAL.postIssueEquityShares,
        preIssuePaidUpCapital: NIVARA_CAPITAL.paidUpEquityCapital,
        postIssuePaidUpCapital: '60000000',
        promoterContribution: 'Not applicable — fresh issue only',
      },
      filingSnapshot: {
        ...base.issueConfigurationAndFilingSnapshot.filingSnapshot,
        snapshotDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        filingStage: 'issue_open',
        selectedDesignatedStockExchange: 'NSE Emerge',
        currentOfferDocumentForm: 'drhp',
        issueMethodConfirmed: 'yes',
        capitalStructureFrozen: 'no',
        financialsPeriodFrozen: 'no',
      },
      filingSnapshotReconciliation: {
        ...base.issueConfigurationAndFilingSnapshot.filingSnapshotReconciliation,
        freshIssueShares: NIVARA_CAPITAL.freshIssueShares,
        ofsShares: '0',
        totalOfferShares: NIVARA_CAPITAL.freshIssueShares,
        freshIssueAmount: NIVARA_CAPITAL.freshIssueAmountCrore,
        ofsAmount: '0',
        totalOfferAmount: NIVARA_CAPITAL.totalOfferAmountCrore,
        postIssueShares: NIVARA_CAPITAL.postIssueEquityShares,
        postIssueCapital: '60000000',
        filingConfirmationStatus: 'appears-consistent',
        professionalConfirmation: 'pending',
      },
      pricing: {
        ...base.issueConfigurationAndFilingSnapshot.pricing,
        pricingMethod: NIVARA_IPO.issueMethod,
        fixedIssuePrice: NIVARA_CAPITAL.proposedIssuePrice,
        priceDiscoveryPending: 'yes',
        basisForIssuePriceReadiness: 'Pending book-built price discovery',
        professionalConfirmation: 'pending',
      },
    },
    filingAndRegulatoryMilestoneTracker: {
      ...base.filingAndRegulatoryMilestoneTracker,
      filings: [filing],
    },
    dueDiligenceCertificatesConsentsAndSignoffs: {
      ...base.dueDiligenceCertificatesConsentsAndSignoffs,
      certificates: [dueDiligenceCertificate],
    },
    depositoriesBankingAsbaUpiAndIssueInfrastructure: {
      ...base.depositoriesBankingAsbaUpiAndIssueInfrastructure,
      depositoryReadiness: {
        ...base.depositoriesBankingAsbaUpiAndIssueInfrastructure.depositoryReadiness,
        isin: 'INE123A01012',
        isinStatus: 'allotted',
        nsdlConnectivityStatus: 'in-progress',
        cdslConnectivityStatus: 'in-progress',
        registrarConnectivityStatus: 'in-progress',
      },
      issueBankRoles: [issueBankRole],
      sponsorBankUpiReadiness: {
        ...base.depositoriesBankingAsbaUpiAndIssueInfrastructure.sponsorBankUpiReadiness,
        sponsorBankAppointed: 'yes',
        intermediaryId: NIVARA_IDS.intermediary001,
        agreementExecuted: 'no',
        upiSetupComplete: 'no',
      },
      asbaConfiguration: {
        ...base.depositoriesBankingAsbaUpiAndIssueInfrastructure.asbaConfiguration,
        asbaApplicable: 'yes',
        upiMechanismApplicable: 'yes',
        issueMethod: NIVARA_IPO.issueMethod,
      },
    },
    underwritingMarketMakingAndDistributionArrangements: {
      ...base.underwritingMarketMakingAndDistributionArrangements,
      underwritingSummary: {
        ...base.underwritingMarketMakingAndDistributionArrangements.underwritingSummary,
        issueShares: NIVARA_CAPITAL.freshIssueShares,
        issueAmount: NIVARA_CAPITAL.freshIssueAmountCrore,
        totalUnderwritingCommitment: NIVARA_CAPITAL.freshIssueShares,
        totalUnderwritingPercentage: '100',
        fullCoverageState: 'pending',
        leadManagerOwnAccountCommitment: '225000',
        ownAccountPercentage: '15',
        underwritingAgreementExecuted: 'no',
      },
    },
    issueProgrammeAllotmentListingAndPostIssueExecution: {
      ...base.issueProgrammeAllotmentListingAndPostIssueExecution,
      issueCalendar: {
        ...base.issueProgrammeAllotmentListingAndPostIssueExecution.issueCalendar,
        issueOpeningDate: '2025-01-15',
        issueClosingDate: '2025-01-17',
      },
      issueOpeningReadiness: {
        ...base.issueProgrammeAllotmentListingAndPostIssueExecution.issueOpeningReadiness,
        rhpProspectusRocFilingReady: 'yes',
        pricingFinalized: 'yes',
        registrarReady: 'yes',
      },
    },
    finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness: {
      ...base.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness,
      offerDocumentVersions: [documentVersion],
      placeholders: [],
      inspectionItems: [],
      finalConfirmations: ifConfirmations,
    },
  } as IntermediariesFilingPayload;
}
