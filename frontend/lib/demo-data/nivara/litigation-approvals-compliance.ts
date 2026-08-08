import {
  createEmptyApprovalConditionRecord,
  createEmptyApprovalRecord,
  createEmptyComplianceIssueRecord,
  createEmptyCriminalScreeningRecord,
  createEmptyLegalPartyReviewRecord,
  createEmptyLitigationApprovalsCompliancePayload,
  createEmptyMaterialDevelopmentRecord,
  createEmptyMatterRecord,
} from '@/lib/litigation-approvals-compliance/defaults';
import { LAC_CONFIRMATION_FIELDS } from '@/lib/litigation-approvals-compliance/options';
import type { LitigationApprovalsCompliancePayload } from '@/lib/schemas/litigation-approvals-compliance';
import {
  NIVARA_BUSINESS,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IDS,
  NIVARA_ISSUER,
} from '@/lib/demo-data/nivara/constants';

export function createNivaraLitigationApprovalsCompliancePayload(): LitigationApprovalsCompliancePayload {
  const base = createEmptyLitigationApprovalsCompliancePayload();

  const issuerPartyReview = {
    ...createEmptyLegalPartyReviewRecord(),
    legalPartyReviewId: 'nivara-legal-party-001',
    partyCategory: 'issuer',
    linkedWorkstream: 'company-incorporation',
    displayName: NIVARA_ISSUER.legalName,
    currentHistorical: 'current',
    legalSearchCompleted: 'yes',
    searchAsOfDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
    managementConfirmationObtained: 'yes',
    identifiedMatterCount: '1',
    notes: 'Issuer entity legal screening completed for IPO readiness.',
  };

  const criminalScreening = {
    ...createEmptyCriminalScreeningRecord(),
    legalPartyReviewId: 'nivara-legal-party-001',
    criminalSearchCompleted: 'yes',
    complaintsIdentified: 'no',
    firsIdentified: 'no',
    prosecutionsIdentified: 'no',
    professionalConfirmation: 'pending',
    notes: 'No criminal proceedings identified for issuer or promoters.',
  };

  const approvalCondition = {
    ...createEmptyApprovalConditionRecord(),
    conditionId: 'nivara-approval-condition-001',
    approvalId: NIVARA_IDS.approval001,
    condition: 'Annual safety audit and renewal fee payment',
    category: 'safety',
    frequency: 'Annual',
    dueDate: '2024-08-31',
    complianceStatus: 'met',
    responsibleOwner: 'Plant Head — Bhosari',
    notes: 'Factory licence renewal condition tracked annually.',
  };

  const complianceIssue = {
    ...createEmptyComplianceIssueRecord(),
    complianceIssueId: 'nivara-compliance-issue-001',
    domain: 'labour-employment',
    affectedEntitySitePerson: NIVARA_ISSUER.legalName,
    obligation: 'Contract labour licence renewal',
    issueType: 'non-renewal',
    identifiedBy: 'internal-review',
    status: 'in-remediation',
    notes: 'Renewal application submitted; approval expected before filing.',
  };

  const lacConfirmations = Object.fromEntries(
    LAC_CONFIRMATION_FIELDS.map(({ key }) => [key, 'yes']),
  ) as LitigationApprovalsCompliancePayload['reconciliationRemediationAndIssuerConfirmations']['confirmations'];

  const labourMatter = {
    ...createEmptyMatterRecord(),
    matterId: NIVARA_IDS.matter001,
    identity: {
      matterTitle: 'Industrial dispute — overtime allowance claim (former shop-floor employee)',
      internalShortName: 'Labour OT claim 2023',
      caseReferenceNumber: 'LIC/PUN/2023/1842',
      category: 'labour-employment',
      direction: 'filed-against-relevant-party',
    },
    forum: {
      authorityForumName: 'Industrial Labour Court, Pune',
      forumCategory: 'labour-authority',
      location: 'Pune',
      jurisdiction: 'Maharashtra',
      bench: '',
      presidingAuthority: 'Presiding Officer, Labour Court',
    },
    datesAndStage: {
      ...createEmptyMatterRecord().datesAndStage,
      causeEventDate: '2023-02-15',
      filingInitiationDate: '2023-06-10',
      currentStage: 'trial',
      currentSubsisting: 'yes',
      interimOrderExists: 'no',
      stayExists: 'no',
      notes: 'Minor employment dispute; claim below materiality threshold.',
    },
    subjectMatter: {
      ...createEmptyMatterRecord().subjectMatter,
      shortFactualBackground:
        'Former employee claims unpaid overtime allowance for a prior financial year.',
      allegationClaim: 'Recovery of alleged unpaid overtime and incidental reliefs',
      relevantPartyPosition: 'Company maintains payments were made per applicable shift policy',
      reliefSoughtAgainstRelevantParty: 'Monetary relief approx. INR 3.5 lakh plus costs',
      businessActivityAffected: 'None — isolated employee claim',
      financialPeriodAffected: NIVARA_FINANCIAL_PERIODS.fy2023End,
    },
    amounts: {
      ...createEmptyMatterRecord().amounts,
      principalClaim: '3.5',
      totalQuantifiedAmount: '3.5',
      currency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
      amountUnit: NIVARA_FINANCIAL_PERIODS.amountUnit,
      amountDisputed: '3.5',
    },
    statusOutcome: {
      ...createEmptyMatterRecord().statusOutcome,
      outcomeStatus: 'pending',
      counselOpinionStatus: 'pending',
      professionalReviewStatus: 'pending',
      notes: 'Management assessment: not material to IPO disclosure.',
    },
    materiality: {
      ...createEmptyMatterRecord().materiality,
      mandatoryCategoryConsideration: 'yes',
      quantitativePolicyRelevance: 'no',
      qualitativePolicyRelevance: 'no',
      managementMaterialityPosition: 'Below policy threshold — routine labour matter',
      readinessState: 'appears-below-entered-threshold',
    },
  };

  const factoryApproval = {
    ...createEmptyApprovalRecord(),
    approvalId: NIVARA_IDS.approval001,
    identity: {
      approvalLicenceName: 'Factory Licence — Bhosari Manufacturing Unit',
      category: 'factory',
    },
    holder: {
      holderType: 'issuer',
      linkedEntityBusinessFacilityId: '',
      displayName: NIVARA_ISSUER.legalName,
    },
    authority: {
      issuingAuthority: 'Directorate of Industrial Safety and Health, Maharashtra',
      ministryDepartment: 'Industries, Energy and Labour Department',
      centralStateLocal: 'state',
      jurisdiction: 'Maharashtra',
      officeLocation: 'Pune',
    },
    details: {
      ...createEmptyApprovalRecord().details,
      licenceRegistrationNumber: 'MH/FAC/BHO/452891',
      issueDate: '2019-09-01',
      effectiveDate: '2019-09-01',
      expiryDate: '2024-08-31',
      perpetualNoExpiry: 'no',
      renewalFrequency: 'Annual',
      scope: 'Manufacturing of precision metal components',
      activityAuthorised: 'Fabrication and machining operations',
      locationSiteCovered: NIVARA_BUSINESS.primaryFacility,
      capacityCovered: 'As per approved layout plan',
      notes: 'Factory licence for primary Bhosari manufacturing unit.',
    },
    status: 'valid',
    renewalMetadata: {
      ...createEmptyApprovalRecord().renewalMetadata,
      renewalDueDate: '2024-08-31',
      renewalApplicationDate: '2024-07-15',
      submittedBeforeExpiry: 'yes',
      continuationPendingRenewal: 'management-believes-yes',
    },
  };

  const ipoMaterialDevelopment = {
    ...createEmptyMaterialDevelopmentRecord(),
    developmentId: 'nivara-material-development-001',
    eventDate: '2024-08-01',
    discoveryDate: '2024-08-05',
    category: 'management',
    description:
      'Board approved appointment of lead manager and commencement of IPO readiness programme for proposed NSE Emerge fresh issue.',
    linkedWorkstream: 'intermediaries-filing',
    linkedRecordId: NIVARA_IDS.filing001,
    materialityAssessment: 'Material for offer document management and proceeding disclosures section',
    ipoImpact: 'Requires updated management and proceeding disclosures in draft offer document',
    potentialRiskFactorRequirement: 'yes',
    offerDocumentSectionsAffected: 'Management, Legal and Other Information — IPO readiness',
    boardConsidered: 'yes',
    counselReview: 'pending',
    brlmProfessionalReview: 'pending',
    disclosureStatus: 'To be incorporated in next DRHP revision',
    notes: 'Development note for IPO filing preparation stage.',
  };

  return {
    ...base,
    legalUniverseMaterialityPolicyAndPartyMapping: {
      ...base.legalUniverseMaterialityPolicyAndPartyMapping,
      legalDdSnapshot: {
        ...base.legalUniverseMaterialityPolicyAndPartyMapping.legalDdSnapshot,
        legalDdAsOfDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        latestFinancialInformationDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        litigationExists: 'yes',
        materialApprovalsPending: 'no',
        materialDevelopmentsSinceLatestFinancialsExist: 'yes',
      },
      legalPartyReviews: [issuerPartyReview],
      litigationMaterialityPolicy: {
        ...base.legalUniverseMaterialityPolicyAndPartyMapping.litigationMaterialityPolicy,
        policyExists: 'yes',
        adopted: 'yes',
        boardApprovalDate: '2024-07-01',
        boardResolutionReference: 'BR/2024-07/LIT-POL-01',
        effectiveDate: '2024-07-01',
        policyVersion: '1.0',
        partiesToWhichPolicyApplies: 'Issuer, promoters, directors and KMPs',
        notes: 'Board-approved litigation materiality policy for IPO disclosure.',
      },
    },
    litigationAndProceedingsMaster: {
      matters: [labourMatter],
    },
    criminalRegulatoryTaxAndEnforcementReadiness: {
      ...base.criminalRegulatoryTaxAndEnforcementReadiness,
      criminalScreenings: [criminalScreening],
    },
    governmentRegulatoryAndBusinessApprovalsMaster: {
      approvals: [factoryApproval],
    },
    approvalConditionsFacilityComplianceAndRenewalReadiness: {
      ...base.approvalConditionsFacilityComplianceAndRenewalReadiness,
      approvalConditions: [approvalCondition],
    },
    corporateStatutoryAndOperationalComplianceExceptions: {
      ...base.corporateStatutoryAndOperationalComplianceExceptions,
      complianceIssues: [complianceIssue],
    },
    materialCreditorsPenaltiesAndMaterialDevelopments: {
      ...base.materialCreditorsPenaltiesAndMaterialDevelopments,
      materialDevelopments: [ipoMaterialDevelopment],
    },
    reconciliationRemediationAndIssuerConfirmations: {
      ...base.reconciliationRemediationAndIssuerConfirmations,
      confirmations: lacConfirmations,
    },
  } as LitigationApprovalsCompliancePayload;
}
