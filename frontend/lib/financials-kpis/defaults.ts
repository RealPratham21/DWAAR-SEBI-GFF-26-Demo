/**
 * Empty-record factories for Financials & KPIs (Increment F1).
 */

import type {
  AccountingPolicy,
  AssetsLiabilitiesEquityAndCashFlows,
  AuditCommitteeGovernance,
  AuditReportMatter,
  AuditorChangeRecord,
  AuditorReadiness,
  BalanceSheetLineValue,
  CashFlowLineValue,
  ChangesInEquityLineValue,
  ContingentLiability,
  DividendPolicy,
  DividendRecord,
  ExceptionalItem,
  FinancialPeriod,
  FinancialsKpisConfirmations,
  FinancialsKpisPayload,
  FormulaRecord,
  IndebtednessSummary,
  KpiRegisterEntry,
  KpiSelectionGovernanceAndPeerComparison,
  LiquidityCapitalResources,
  ManagementCertification,
  MdaTrendsMaterialDevelopmentsAndConfirmations,
  OngoingDisclosureReadiness,
  OtherFinancialInformation,
  PeerComparison,
  PerformanceFactor,
  PerShareByPeriod,
  PlLineValue,
  ProfessionalCertification,
  RelatedPartyTransaction,
  ReportingBasis,
  ReportingEntity,
  ReportingScopePeriodsAndAuditorReadiness,
  RestatementAdjustment,
  RestatementAdjustmentsPoliciesAndAuditorMatters,
  RestatedStatementOfProfitAndLoss,
  RatiosCapitalisationAndIssuePriceMetrics,
  SegmentRecord,
  SelectedDataCandidate,
  SmeEligibilityByPeriod,
  SubsequentEvent,
  TaxByPeriod,
  TrendUncertainty,
  VarianceAnalysis,
  WorkingCapitalSummary,
} from '@/lib/schemas/financials-kpis';
import { FINANCIALS_KPIS_SCHEMA_VERSION } from '@/lib/schemas/financials-kpis';

function newId(id?: string): string {
  return id ?? crypto.randomUUID();
}

export function createEmptyReportingBasis(): ReportingBasis {
  return {
    financialYearEnd: '',
    accountingFramework: '',
    financialPresentation: '',
    currency: '',
    displayUnit: '',
    roundingConvention: '',
    ociApplies: '',
    cashFlowAvailable: '',
    changesInEquityAvailable: '',
    comparativePeriodConsistency: '',
    subsidiariesDeclared: '',
    associatesDeclared: '',
    jointVenturesDeclared: '',
    foreignEntitiesDeclared: '',
    recentlyAcquiredDisposedDeclared: '',
    predecessorEntityDeclared: '',
    promotingCompanyTrackRecordDeclared: '',
    notes: '',
  };
}

export function createEmptyReportingEntity(id?: string): ReportingEntity {
  return {
    id: newId(id),
    name: '',
    entityType: '',
    country: '',
    ownershipPct: '',
    consolidationMethod: '',
    includedFromPeriodId: '',
    excludedFromPeriodId: '',
    exclusionReason: '',
    financialStatementsAvailable: '',
    auditedStatus: '',
    linkedGroupEntityId: '',
    notes: '',
  };
}

export function createEmptyFinancialPeriod(id?: string): FinancialPeriod {
  return {
    id: newId(id),
    label: '',
    startDate: '',
    endDate: '',
    months: '',
    fullYearOrInterim: '',
    comparablePeriodId: '',
    basis: '',
    auditedStatus: '',
    restatedStatus: '',
    boardApprovalStatus: '',
    auditReportDate: '',
    restatementReportDate: '',
    sourceStatus: '',
    finalisationStatus: '',
    notes: '',
  };
}

export function createEmptyAuditorReadiness(): AuditorReadiness {
  return {
    currentStatutoryAuditor: '',
    firmRegistrationNumber: '',
    signingPartner: '',
    peerReviewStatus: '',
    peerReviewCertificateValidity: '',
    appointmentPeriod: '',
    restatementAuditor: '',
    restatementEngagementStatus: '',
    restatementExerciseStatus: '',
    expectedCompletionDate: '',
    restatedInformationBoardApproved: '',
    approvalDateReference: '',
    latestFilingReadyPeriodId: '',
    financialInformationSufficientlyCurrent: '',
    professionalConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptyAuditorChangeRecord(id?: string): AuditorChangeRecord {
  return {
    id: newId(id),
    previousAuditor: '',
    appointmentResignationDate: '',
    reason: '',
    disagreementWithManagement: '',
    professionalClearanceStatus: '',
    disclosureReference: '',
    notes: '',
  };
}

export function createEmptyReportingScopePeriodsAndAuditorReadiness(): ReportingScopePeriodsAndAuditorReadiness {
  return {
    reportingBasis: createEmptyReportingBasis(),
    reportingEntities: [],
    financialPeriods: [],
    auditorReadiness: createEmptyAuditorReadiness(),
    auditorChangeRecords: [],
    notes: '',
  };
}

export function createEmptyPlLineValue(id?: string): PlLineValue {
  return {
    id: newId(id),
    periodId: '',
    lineKey: '',
    amount: '',
    sourceStatus: '',
    note: '',
    adjustmentPresent: '',
    managementExplanation: '',
    professionalConfirmationStatus: '',
  };
}

export function createEmptyExceptionalItem(id?: string): ExceptionalItem {
  return {
    id: newId(id),
    periodId: '',
    title: '',
    description: '',
    amount: '',
    incomeOrExpense: '',
    cashOrNonCash: '',
    recurringOrNonRecurring: '',
    includedInEbitda: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyPerShareByPeriod(id?: string): PerShareByPeriod {
  return {
    id: newId(id),
    periodId: '',
    weightedAvgBasicShares: '',
    weightedAvgDilutedShares: '',
    basicEps: '',
    dilutedEps: '',
    faceValue: '',
    retrospectiveCapitalAdjustmentApplied: '',
    bonusSplitConsolidationAdjustmentStatus: '',
    notes: '',
  };
}

export function createEmptyRestatedStatementOfProfitAndLoss(): RestatedStatementOfProfitAndLoss {
  return {
    plLineValues: [],
    exceptionalItems: [],
    perShareByPeriod: [],
    notes: '',
  };
}

export function createEmptyBalanceSheetLineValue(id?: string): BalanceSheetLineValue {
  return {
    id: newId(id),
    periodId: '',
    lineKey: '',
    amount: '',
    sourceStatus: '',
    note: '',
  };
}

export function createEmptyCashFlowLineValue(id?: string): CashFlowLineValue {
  return {
    id: newId(id),
    periodId: '',
    lineKey: '',
    amount: '',
    sourceStatus: '',
    note: '',
  };
}

export function createEmptyChangesInEquityLineValue(id?: string): ChangesInEquityLineValue {
  return {
    id: newId(id),
    periodId: '',
    lineKey: '',
    amount: '',
    sourceStatus: '',
    note: '',
  };
}

export function createEmptyAssetsLiabilitiesEquityAndCashFlows(): AssetsLiabilitiesEquityAndCashFlows {
  return {
    balanceSheetLineValues: [],
    cashFlowLineValues: [],
    changesInEquityLineValues: [],
    notes: '',
  };
}

export function createEmptyRestatementAdjustment(id?: string): RestatementAdjustment {
  return {
    id: newId(id),
    periodId: '',
    financialStatement: '',
    originalLineItem: '',
    originalAuditedAmount: '',
    adjustmentAmount: '',
    restatedAmount: '',
    debitCreditDirection: '',
    category: '',
    detailedRationale: '',
    accountingStandardReference: '',
    taxEffect: '',
    cashOrNonCash: '',
    recurringOrNonRecurring: '',
    epsImpact: '',
    netWorthImpact: '',
    auditorReviewStatus: '',
    professionalConclusionStatus: '',
    reference: '',
    notes: '',
  };
}

export function createEmptyAccountingPolicy(id?: string): AccountingPolicy {
  return {
    id: newId(id),
    policyCategory: '',
    existingTreatment: '',
    changeDuringPeriod: '',
    effectiveDate: '',
    reason: '',
    financialImpact: '',
    retrospectiveProspectiveTreatment: '',
    auditorConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptyAuditReportMatter(id?: string): AuditReportMatter {
  return {
    id: newId(id),
    periodId: '',
    auditOpinion: '',
    qualificationReservation: '',
    emphasisOfMatter: '',
    keyAuditMatter: '',
    goingConcernUncertainty: '',
    internalFinancialControlQualification: '',
    caroRemark: '',
    fraudReported: '',
    statutoryDuesDefaultDelay: '',
    accountingSystemOrAuditTrailConcern: '',
    managementResponse: '',
    adjustedInRestatedInformation: '',
    ifNotAdjustedReason: '',
    resolutionStatus: '',
    reference: '',
    notes: '',
  };
}

export function createEmptyRestatementAdjustmentsPoliciesAndAuditorMatters(): RestatementAdjustmentsPoliciesAndAuditorMatters {
  return {
    restatementAdjustments: [],
    accountingPolicies: [],
    auditReportMatters: [],
    notes: '',
  };
}

export function createEmptySegmentRecord(id?: string): SegmentRecord {
  return {
    id: newId(id),
    periodId: '',
    linkedBusinessSegmentId: '',
    segmentName: '',
    productsServices: '',
    externalRevenue: '',
    interSegmentRevenue: '',
    totalSegmentRevenue: '',
    segmentResult: '',
    segmentAssets: '',
    segmentLiabilities: '',
    capitalExpenditure: '',
    depreciation: '',
    reconciliationToCompanyTotals: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyRelatedPartyTransaction(id?: string): RelatedPartyTransaction {
  return {
    id: newId(id),
    relatedPartyEntity: '',
    relationship: '',
    transactionType: '',
    periodId: '',
    transactionAmount: '',
    outstandingBalance: '',
    relevantPercentage: '',
    armsLengthStatus: '',
    approvalStatus: '',
    restatedFinancialNoteReference: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyContingentLiability(id?: string): ContingentLiability {
  return {
    id: newId(id),
    category: '',
    description: '',
    authorityCounterparty: '',
    periodId: '',
    amountClaimed: '',
    amountProvided: '',
    contingentAmount: '',
    probabilityStatus: '',
    forum: '',
    currentStage: '',
    expectedFinancialEffect: '',
    linkedLitigationReference: '',
    noteReference: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyWorkingCapitalSummary(id?: string): WorkingCapitalSummary {
  return {
    id: newId(id),
    periodId: '',
    currentAssets: '',
    currentLiabilities: '',
    netWorkingCapital: '',
    inventory: '',
    receivables: '',
    payables: '',
    inventoryDays: '',
    receivableDays: '',
    payableDays: '',
    cashConversionCycle: '',
    workingCapitalBorrowings: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyIndebtednessSummary(): IndebtednessSummary {
  return {
    longTermDebt: '',
    shortTermDebt: '',
    currentMaturities: '',
    leaseLiabilities: '',
    totalDebt: '',
    securedDebt: '',
    unsecuredDebt: '',
    relatedPartyDebt: '',
    cashAndCashEquivalents: '',
    netDebt: '',
    undrawnFacilities: '',
    defaultsDelays: '',
    debtProposedForIpoRepayment: '',
    sourceStatus: '',
    notes: '',
  };
}

export function createEmptyTaxByPeriod(id?: string): TaxByPeriod {
  return {
    id: newId(id),
    periodId: '',
    currentTax: '',
    deferredTax: '',
    effectiveTaxRate: '',
    taxLossesCarriedForward: '',
    unabsorbedDepreciation: '',
    deferredTaxAssetsRecognised: '',
    deferredTaxAssetsNotRecognised: '',
    materialIncentivesExemptions: '',
    taxDisputes: '',
    auditorConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptyDividendRecord(id?: string): DividendRecord {
  return {
    id: newId(id),
    periodId: '',
    dividendDeclared: '',
    dividendPaid: '',
    dividendPerShare: '',
    totalDividendAmount: '',
    payoutRatio: '',
    sourceOfDividend: '',
    boardApproval: '',
    shareholderApproval: '',
    unpaidDividend: '',
    lendingRestriction: '',
    notes: '',
  };
}

export function createEmptyDividendPolicy(): DividendPolicy {
  return {
    policyExists: '',
    approvalDate: '',
    factorsConsidered: '',
    futureDividendDiscretionary: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyOtherFinancialInformation(): OtherFinancialInformation {
  return {
    segmentRecords: [],
    relatedPartyTransactions: [],
    contingentLiabilities: [],
    workingCapitalSummaries: [],
    indebtednessSummary: createEmptyIndebtednessSummary(),
    taxByPeriod: [],
    dividendRecords: [],
    dividendPolicy: createEmptyDividendPolicy(),
    notes: '',
  };
}

export function createEmptyFormulaRecord(id?: string): FormulaRecord {
  return {
    id: newId(id),
    metricKey: '',
    displayName: '',
    definition: '',
    formula: '',
    components: '',
    excludedItems: '',
    reconciliationToFinancialStatement: '',
    comparableAcrossPeriods: '',
    methodologyChanged: '',
    changeExplanation: '',
    sourceStatus: '',
    professionalConfirmationStatus: '',
    notes: '',
  };
}

export function createEmptySmeEligibilityByPeriod(id?: string): SmeEligibilityByPeriod {
  return {
    id: newId(id),
    periodId: '',
    operatingProfit: '',
    operatingProfitFormula: '',
    netWorth: '',
    fcfe: '',
    fcfeFormula: '',
    sourceStatus: '',
    auditorCertificateStatus: '',
    notes: '',
  };
}

export function createEmptyRatiosCapitalisationAndIssuePriceMetrics(): RatiosCapitalisationAndIssuePriceMetrics {
  return {
    formulaRecords: [],
    smeEligibilityByPeriod: [],
    notes: '',
  };
}

export function createEmptySelectedDataCandidate(id?: string): SelectedDataCandidate {
  return {
    id: newId(id),
    metricName: '',
    category: '',
    definition: '',
    unit: '',
    valuesByPeriod: [],
    sourceType: '',
    sharedWithInvestorsPriorThreeYears: '',
    sharingDateContext: '',
    relatedCapitalTransaction: '',
    presentedToBoardAuditCommittee: '',
    historicallyUsedByManagement: '',
    usedInIssuePriceDeliberations: '',
    usedByPeers: '',
    verifiable: '',
    certifiable: '',
    containsProjections: '',
    confidentialBusinessSensitive: '',
    relevantToCurrentBusiness: '',
    proposedTreatment: '',
    exclusionRationale: '',
    managementNotes: '',
  };
}

export function createEmptyKpiRegisterEntry(id?: string): KpiRegisterEntry {
  return {
    id: newId(id),
    linkedSelectedDataId: '',
    name: '',
    category: '',
    drhpLocation: '',
    plainEnglishDefinition: '',
    formula: '',
    numerator: '',
    denominator: '',
    components: '',
    unit: '',
    currency: '',
    frequency: '',
    valuesByPeriod: [],
    source: '',
    dataOwner: '',
    whyManagementTracksIt: '',
    performanceRelevance: '',
    valuationRelevance: '',
    limitations: '',
    methodologyChanges: '',
    comparableAcrossPeriods: '',
    restatementRecalculationRequired: '',
    professionalCertificationStatus: '',
    notes: '',
  };
}

export function createEmptyPeerComparison(id?: string): PeerComparison {
  return {
    id: newId(id),
    companyName: '',
    exchange: '',
    country: '',
    industry: '',
    businessModel: '',
    selectionRationale: '',
    comparableSizeExplanation: '',
    differencesFromIssuer: '',
    indianOrGlobal: '',
    reportingFramework: '',
    financialYear: '',
    sourcePublicationDate: '',
    currency: '',
    conversionRateSource: '',
    revenueTotalIncome: '',
    eps: '',
    pe: '',
    ronw: '',
    nav: '',
    kpiValues: '',
    notes: '',
  };
}

export function createEmptyManagementCertification(): ManagementCertification {
  return {
    status: '',
    signatoryRole: '',
    signatoryName: '',
    certificationDate: '',
    accuracyConfirmed: '',
    historicalUseConfirmed: '',
    projectionsExcluded: '',
    managementNotePrepared: '',
    reference: '',
    notes: '',
  };
}

export function createEmptyAuditCommitteeGovernance(): AuditCommitteeGovernance {
  return {
    auditCommitteeConstituted: '',
    selectedDataPresented: '',
    kpiDisclosuresPresented: '',
    exclusionRationalesPresented: '',
    peerDataPresented: '',
    definitionsFormulasReviewed: '',
    approvalStatus: '',
    meetingDate: '',
    resolutionReference: '',
    minutesAvailable: '',
    changesRequested: '',
    changesImplemented: '',
    finalApprovalDate: '',
    notes: '',
  };
}

export function createEmptyProfessionalCertification(): ProfessionalCertification {
  return {
    certifyingProfessional: '',
    professionalType: '',
    firm: '',
    peerReviewStatus: '',
    peerReviewValidity: '',
    engagementDate: '',
    certificationStatus: '',
    certificateDate: '',
    udinReference: '',
    qualificationsLimitations: '',
    materialDocumentInspectionStatus: '',
    notes: '',
  };
}

export function createEmptyOngoingDisclosureReadiness(): OngoingDisclosureReadiness {
  return {
    reportingFrequency: '',
    responsibleFunction: '',
    auditCommitteeProcess: '',
    boardProcess: '',
    professionalCertificationProcess: '',
    kpiNoLongerRelevantHandling: '',
    exclusionRationaleProcess: '',
    reportingOwner: '',
    notes: '',
  };
}

export function createEmptyKpiSelectionGovernanceAndPeerComparison(): KpiSelectionGovernanceAndPeerComparison {
  return {
    selectedDataCandidates: [],
    kpiRegister: [],
    peerComparisons: [],
    suitablePeersFoundCount: '',
    searchPerformed: '',
    fewerThanThreePeersReason: '',
    professionalReviewStatus: '',
    managementCertification: createEmptyManagementCertification(),
    auditCommitteeGovernance: createEmptyAuditCommitteeGovernance(),
    professionalCertification: createEmptyProfessionalCertification(),
    ongoingDisclosureReadiness: createEmptyOngoingDisclosureReadiness(),
    notes: '',
  };
}

export function createEmptyPerformanceFactor(id?: string): PerformanceFactor {
  return {
    id: newId(id),
    title: '',
    category: '',
    affectedFinancialLineItems: '',
    periodsAffected: '',
    quantifiedImpact: '',
    explanation: '',
    temporaryOrContinuing: '',
    managementResponse: '',
    linkedRiskFactor: '',
    supportingSource: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyVarianceAnalysis(id?: string): VarianceAnalysis {
  return {
    id: newId(id),
    lineItem: '',
    previousPeriodId: '',
    currentPeriodId: '',
    previousValue: '',
    currentValue: '',
    explanation: '',
    primaryDriver: '',
    oneOffOrRecurring: '',
    supportingSource: '',
    managementConfirmation: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptyLiquidityCapitalResources(): LiquidityCapitalResources {
  return {
    principalLiquiditySources: '',
    cashAvailable: '',
    workingCapitalFacilities: '',
    undrawnLimits: '',
    operatingCashFlowAdequacy: '',
    debtRepaymentsDue: '',
    capitalCommitments: '',
    expectedCapex: '',
    restrictedCash: '',
    dividendRestrictions: '',
    covenantConcerns: '',
    goingConcernConcerns: '',
    managementResponse: '',
    notes: '',
  };
}

export function createEmptyTrendUncertainty(id?: string): TrendUncertainty {
  return {
    id: newId(id),
    title: '',
    category: '',
    description: '',
    periodObserved: '',
    financialAreasAffected: '',
    quantifiedHistoricalImpact: '',
    expectedNatureOfImpact: '',
    supportingSource: '',
    relatedRiskFactor: '',
    professionalReviewStatus: '',
    notes: '',
  };
}

export function createEmptySubsequentEvent(id?: string): SubsequentEvent {
  return {
    id: newId(id),
    eventDate: '',
    eventType: '',
    description: '',
    financialImpact: '',
    amountKnown: '',
    adjustingNonAdjusting: '',
    includedInFinancialInformation: '',
    updatedInterimInformationRequired: '',
    auditorNotified: '',
    boardNotified: '',
    drhpChaptersAffected: '',
    professionalConclusion: '',
    notes: '',
  };
}

export function createEmptyFinancialsKpisConfirmations(): FinancialsKpisConfirmations {
  return {
    reportingScopeAndEntitiesComplete: false,
    periodsAreCorrect: false,
    valuesMatchIdentifiedSources: false,
    shareCapitalReconcilesWithCapitalOwnership: false,
    revenueSegmentsReconcileWithBusinessOperations: false,
    workingCapitalReconcilesWithObjectsOfIssue: false,
    borrowingTotalsReconcileWithAvailableRecords: false,
    restatementAdjustmentsComplete: false,
    auditorRemarksDisclosed: false,
    exceptionalItemsDisclosed: false,
    relatedPartyTransactionsComplete: false,
    contingenciesAndCommitmentsComplete: false,
    subsequentDevelopmentsDisclosed: false,
    investorSharedHistoricalMetricsConsidered: false,
    boardUsedMetricsConsidered: false,
    kpiFormulasComplete: false,
    historicalKpiDisclosuresExcludeProjections: false,
    peerInformationWillUseTraceableSources: false,
    auditCommitteeApprovalRemainsRequired: false,
    professionalCertificationRemainsRequired: false,
    noRegulatoryOrAuditorConclusionRepresented: false,
  };
}

export function createEmptyMdaTrendsMaterialDevelopmentsAndConfirmations(): MdaTrendsMaterialDevelopmentsAndConfirmations {
  return {
    performanceFactors: [],
    varianceAnalyses: [],
    liquidityCapitalResources: createEmptyLiquidityCapitalResources(),
    trendsUncertainties: [],
    subsequentEvents: [],
    confirmations: createEmptyFinancialsKpisConfirmations(),
    notes: '',
  };
}

export function createEmptyFinancialsKpisPayload(): FinancialsKpisPayload {
  return {
    schemaVersion: FINANCIALS_KPIS_SCHEMA_VERSION,
    reportingScopePeriodsAndAuditorReadiness: createEmptyReportingScopePeriodsAndAuditorReadiness(),
    restatedStatementOfProfitAndLoss: createEmptyRestatedStatementOfProfitAndLoss(),
    assetsLiabilitiesEquityAndCashFlows: createEmptyAssetsLiabilitiesEquityAndCashFlows(),
    restatementAdjustmentsPoliciesAndAuditorMatters:
      createEmptyRestatementAdjustmentsPoliciesAndAuditorMatters(),
    otherFinancialInformation: createEmptyOtherFinancialInformation(),
    ratiosCapitalisationAndIssuePriceMetrics: createEmptyRatiosCapitalisationAndIssuePriceMetrics(),
    kpiSelectionGovernanceAndPeerComparison: createEmptyKpiSelectionGovernanceAndPeerComparison(),
    mdaTrendsMaterialDevelopmentsAndConfirmations:
      createEmptyMdaTrendsMaterialDevelopmentsAndConfirmations(),
  };
}
