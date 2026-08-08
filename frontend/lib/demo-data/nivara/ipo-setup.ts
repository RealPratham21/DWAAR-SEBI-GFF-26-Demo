import { createEmptyFinancialYearRow, createEmptyIpoSetupPayload } from '@/lib/ipo-setup/defaults';
import type { IpoSetupPayload } from '@/lib/schemas/ipo-setup';
import {
  NIVARA_CAPITAL,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IPO,
  NIVARA_ISSUER,
} from './constants';

const ELIGIBILITY_DECLARATION_FIELDS = [
  'admittedIbcAgainstIssuer',
  'admittedIbcAgainstPromotingCompany',
  'admittedWindingUpPetition',
  'issuerDebarredFromCapitalMarkets',
  'promoterDirectorSellingShareholderDebarred',
  'promoterDirectorAssociatedWithDebarredCompany',
  'wilfulDefaulterOrFraudulentBorrower',
  'fugitiveEconomicOffender',
  'materialRegulatoryOrDisciplinaryAction',
  'seriousCriminalProceedingsInvolvingDirector',
  'materialFinancialDefaultDuringRelevantPeriod',
  'materialUnresolvedEligibilityLitigation',
  'proceedsIncludeRelatedPartyLoanRepayment',
] as const;

export function createNivaraIpoSetupPayload(): IpoSetupPayload {
  const payload = createEmptyIpoSetupPayload();

  payload.ipoDirection = {
    ...payload.ipoDirection,
    preparationStage: 'preparing-internally',
    targetSmePlatform: NIVARA_IPO.targetSmePlatform,
    eligibilityProfile: 'standard-sme-ipo',
    proposedOfferType: NIVARA_IPO.offerType,
    proposedPricingMethod: NIVARA_IPO.issueMethod,
    targetFilingQuarter: NIVARA_IPO.targetFilingQuarter,
    targetFilingFinancialYear: NIVARA_IPO.targetFilingFinancialYear,
    referencedCompanyClass: 'private',
    publicCompanyConversionStatus: 'not-started',
  };

  payload.offerStructure = {
    ...payload.offerStructure,
    faceValuePerEquityShare: Number(NIVARA_CAPITAL.faceValuePerShare),
    existingIssuedEquityShares: Number(NIVARA_CAPITAL.preIssueEquityShares),
    existingPaidUpEquityShareCapital: Number(NIVARA_CAPITAL.paidUpEquityCapital),
    proposedIssuePriceStatus: 'indicative',
    proposedIssuePrice: Number(NIVARA_CAPITAL.proposedIssuePrice),
    proposedFreshIssueShares: Number(NIVARA_CAPITAL.freshIssueShares),
    proposedFreshIssueAmount: Number(NIVARA_CAPITAL.freshIssueShares) * Number(NIVARA_CAPITAL.proposedIssuePrice),
    preIpoPlacementBeingConsidered: 'no',
    employeeReservationPlanned: 'no',
    existingShareholderReservationPlanned: 'no',
  };

  payload.trackRecordAndFinancialEligibility = {
    ...payload.trackRecordAndFinancialEligibility,
    operatingTrackRecordBasis: 'issuer-company',
    trackRecordEntityName: NIVARA_ISSUER.legalName,
    sameLineOfBusiness: 'yes',
    businessCommencementDate: NIVARA_ISSUER.incorporationDate,
    threeCompleteFinancialYearsAvailable: 'yes',
    auditedRecordsAvailable: 'yes',
    financialYears: [
      {
        ...createEmptyFinancialYearRow('nivara-ipo-fy2022'),
        financialYearEnding: '2022',
        operatingProfitFromOperations: 45000000,
        netWorth: 120000000,
        freeCashFlowToEquity: 8000000,
        auditedStatus: 'audited',
        sourceType: 'audited-financial-statements',
      },
      {
        ...createEmptyFinancialYearRow('nivara-ipo-fy2023'),
        financialYearEnding: '2023',
        operatingProfitFromOperations: 58000000,
        netWorth: 155000000,
        freeCashFlowToEquity: 12000000,
        auditedStatus: 'audited',
        sourceType: 'audited-financial-statements',
      },
      {
        ...createEmptyFinancialYearRow('nivara-ipo-fy2024'),
        financialYearEnding: '2024',
        operatingProfitFromOperations: 72000000,
        netWorth: 198000000,
        freeCashFlowToEquity: 15000000,
        auditedStatus: 'audited',
        sourceType: 'audited-financial-statements',
      },
    ],
    latestAuditedFinancialYear: NIVARA_FINANCIAL_PERIODS.fy2024End.slice(0, 4),
    latestFinancialStatementsAvailable: 'yes',
    auditorHasConfirmedEligibilityFigures: 'no',
    modifiedAuditOpinionRelevantToEligibility: 'no',
  };

  for (const field of ELIGIBILITY_DECLARATION_FIELDS) {
    payload.eligibilityDeclarations[field] = 'no';
  }

  payload.processReadiness = {
    ...payload.processReadiness,
    boardApprovalStatus: 'passed',
    boardResolutionDate: '2025-06-15',
    boardResolutionReference: 'BR/IPO/2025/01',
    shareholderApprovalStatus: 'passed',
    shareholderResolutionDate: '2025-07-10',
    shareholderResolutionReference: 'EGM/IPO/2025/01',
    existingSharesFullyDematerialised: 'yes',
    isinAllotted: 'yes',
    nsdlConnectivityStatus: 'completed',
    cdslConnectivityStatus: 'completed',
    rtaArrangementsInitiated: 'yes',
    leadManagerAppointmentStatus: 'appointed',
    registrarAppointmentStatus: 'appointed',
    marketMakerAppointmentStatus: 'not-applicable',
    underwriterAppointmentStatus: 'appointed',
    legalAdviserAppointmentStatus: 'appointed',
    statutoryAuditorCoordinationStatus: 'discussions-ongoing',
    inPrincipleApplicationStatus: 'clarifications-pending',
    inPrincipleApplicationDate: '2025-08-01',
    inPrincipleApplicationReference: 'NSE-SME/IPO/2025/NIV001',
    clarificationsReceived: 'no',
    inPrincipleApprovalReceived: 'no',
  };

  payload.issuerConfirmations = {
    offerInputsAreLatestInternalProposal: true,
    financialFiguresTraceableToSelectedSource: true,
    knownEligibilityConcernsDisclosed: true,
    missingAnswersMustNotBeInterpretedAsNegative: true,
    proposedOfsIncludesAllIntendedSellingShareholders: true,
    assessmentIsPreliminary: true,
    professionalAndExchangeConfirmationRemainRequired: true,
  };

  return payload;
}
