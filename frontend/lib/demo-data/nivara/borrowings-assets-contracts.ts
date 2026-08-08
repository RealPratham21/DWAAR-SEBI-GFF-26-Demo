import {
  createEmptyBorrowingsAssetsContractsPayload,
  createEmptyChargeRecord,
  createEmptyContractMaterialityRecord,
  createEmptyContractRecord,
  createEmptyCovenantRecord,
  createEmptyFacilityRecord,
  createEmptyLenderConsentRecord,
  createEmptyMaterialAssetRecord,
  createEmptyPropertyRecord,
  createEmptySecurityRecord,
} from '@/lib/borrowings-assets-contracts/defaults';
import { BAC_CONFIRMATION_FIELDS } from '@/lib/borrowings-assets-contracts/options';
import type { BorrowingsAssetsContractsPayload } from '@/lib/schemas/borrowings-assets-contracts';
import {
  NIVARA_BORROWINGS,
  NIVARA_BUSINESS,
  NIVARA_FINANCIAL_PERIODS,
  NIVARA_IDS,
  NIVARA_ISSUER,
} from '@/lib/demo-data/nivara/constants';

const NIVARA_SECURITY_ID = 'nivara-security-001';

export function createNivaraBorrowingsAssetsContractsPayload(): BorrowingsAssetsContractsPayload {
  const base = createEmptyBorrowingsAssetsContractsPayload();

  const facility = {
    ...createEmptyFacilityRecord(),
    id: NIVARA_IDS.facility001,
    borrower: {
      borrowerType: 'issuer',
      linkedGroupEntityId: '',
      displayName: NIVARA_ISSUER.legalName,
    },
    lender: {
      lenderName: NIVARA_BORROWINGS.termLoanLender,
      lenderType: 'scheduled-bank',
      branch: 'Pune — Shivaji Nagar',
      contactReference: 'RM-HTFC-4521',
      relatedPartyStatus: 'no',
      linkedGroupEntityId: '',
      linkedRelatedPartyReference: '',
    },
    facilityType: 'term-loan',
    fundBasedNonFundBased: 'fund-based',
    securedUnsecured: 'secured',
    sanctionAndUtilisation: {
      ...createEmptyFacilityRecord().sanctionAndUtilisation,
      sanctionLetterDate: '2022-08-15',
      originalSanctionAmount: NIVARA_BORROWINGS.termLoanSanctioned,
      currentSanctionedLimit: NIVARA_BORROWINGS.termLoanSanctioned,
      currency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
      amountUnit: 'rupees',
      firstDisbursementDate: '2022-09-01',
      totalAmountDisbursed: '950000000',
      amountRepaid: '100000000',
      principalOutstanding: NIVARA_BORROWINGS.termLoanOutstanding,
      currentNonCurrentClassification: 'non-current',
      lastBalanceConfirmationDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
      sourceStatus: 'audited-financial-statements',
      notes: NIVARA_BORROWINGS.facilityLabel,
    },
    interest: {
      ...createEmptyFacilityRecord().interest,
      rateType: 'floating',
      benchmark: 'repo-linked',
      spread: '2.15',
      enteredEffectiveRate: '9.85',
      interestPaymentFrequency: 'Monthly',
    },
    tenorAndRepayment: {
      ...createEmptyFacilityRecord().tenorAndRepayment,
      facilityStartDate: '2022-09-01',
      maturityDate: '2029-08-31',
      tenor: '84 months',
      repaymentType: 'emi',
      repaymentFrequency: 'Monthly',
      nextRepaymentDate: '2024-09-05',
      repaymentScheduleAvailable: 'yes',
    },
    purpose: {
      purposes: ['capital-expenditure', 'machinery'],
      exactSanctionPurposeWording: 'Capex Phase II — CNC lines and plant infrastructure',
      managementPurposeDescription: 'Expansion of precision machining capacity at Bhosari facility',
    },
    prepayment: {
      ...createEmptyFacilityRecord().prepayment,
      prepaymentAllowed: 'yes',
      lenderConsentRequired: 'no',
      ipoProceedsTreatment: 'Partial prepayment from fresh issue proceeds under discussion',
      professionalReviewStatus: 'pending',
    },
  };

  const property = {
    ...createEmptyPropertyRecord(),
    id: NIVARA_IDS.property001,
    identity: {
      propertyName: 'Meridian Industrial Estate — Unit 14',
      address: `${NIVARA_ISSUER.registeredOfficeLine1}, ${NIVARA_ISSUER.registeredOfficeLine2}`,
      city: NIVARA_ISSUER.registeredOfficeCity,
      state: NIVARA_ISSUER.registeredOfficeState,
      country: 'India',
      surveyKhasraPlotNumber: '',
      landArea: '',
      builtUpArea: '12500',
      areaUnit: 'sq ft',
      propertyType: 'factory',
      businessPurpose: 'Precision component manufacturing',
      linkedBusinessOperationsFacilityId: '',
    },
    occupancyBasis: 'leased',
    ownedDetails: createEmptyPropertyRecord().ownedDetails,
    leasedDetails: {
      ...createEmptyPropertyRecord().leasedDetails,
      lessorLicensor: 'Meridian Industrial Estate Pvt Ltd',
      relatedPartyStatus: 'no',
      agreementType: 'Leave and licence',
      agreementDate: '2019-07-01',
      commencement: '2019-08-01',
      expiry: '2029-07-31',
      monthlyAnnualRent: '4.5',
      securityDeposit: '25',
      renewalOption: 'yes',
      registrationRequirementStatus: 'not-applicable',
      notes: `Primary manufacturing facility at Bhosari — ${NIVARA_BUSINESS.primaryFacility}.`,
    },
  };

  const security = {
    ...createEmptySecurityRecord(),
    id: NIVARA_SECURITY_ID,
    linkedFacilityId: NIVARA_IDS.facility001,
    securityProvider: NIVARA_ISSUER.legalName,
    linkedEntityId: '',
    linkedPersonId: '',
    securityType: 'hypothecation',
    securedObject: 'movable-fixed-assets',
    linkedPropertyId: NIVARA_IDS.property001,
    linkedAssetId: '',
    assetDescription: 'Plant and machinery, equipment and movable assets at Bhosari unit',
    chargeRanking: 'pari-passu',
    chargeHolder: NIVARA_BORROWINGS.termLoanLender,
    amountSecured: NIVARA_BORROWINGS.termLoanSanctioned,
    maximumSecuredAmount: NIVARA_BORROWINGS.termLoanSanctioned,
    notes: 'First pari passu charge on movable assets securing term loan facility.',
  };

  const charge = {
    ...createEmptyChargeRecord(),
    id: NIVARA_IDS.charge001,
    linkedSecurityId: NIVARA_SECURITY_ID,
    linkedFacilityId: NIVARA_IDS.facility001,
    chargeIdentifier: 'CH-2022-HTFC-8841',
    creationDate: '2022-09-15',
    status: 'registered',
    rocFilingTypeReference: 'CHG-1',
    srn: 'S12345678',
    certificateReceived: 'yes',
    amountSecured: NIVARA_BORROWINGS.termLoanSanctioned,
    chargeHolder: NIVARA_BORROWINGS.termLoanLender,
    assetDescription: 'Hypothecation of plant and machinery at Bhosari manufacturing unit',
    professionalReviewStatus: 'pending',
  };

  const covenant = {
    ...createEmptyCovenantRecord(),
    id: 'nivara-covenant-001',
    linkedFacilityId: NIVARA_IDS.facility001,
    covenantType: 'financial',
    financialDetails: {
      ...createEmptyCovenantRecord().financialDetails,
      covenantName: 'Debt Service Coverage Ratio',
      category: 'dscr',
      thresholdOperator: '>=',
      thresholdValue: '1.25',
      testingFrequency: 'Quarterly',
      complianceStatus: 'satisfied',
    },
  };

  const lenderConsent = {
    ...createEmptyLenderConsentRecord(),
    id: 'nivara-lender-consent-001',
    linkedFacilityId: NIVARA_IDS.facility001,
    lenderName: NIVARA_BORROWINGS.termLoanLender,
    ipoConsentRequirement: 'required',
    requirementBasis: 'Change-of-control clause in sanction letter',
    consentRequested: 'yes',
    requestDate: '2024-08-15',
    consentReceived: 'no',
    followUpRequired: 'yes',
    notes: 'IPO consent request submitted; lender response awaited.',
  };

  const materialAsset = {
    ...createEmptyMaterialAssetRecord(),
    id: 'nivara-material-asset-001',
    description: 'CNC machining centre line — Bhosari unit',
    assetClass: 'plant-machinery',
    location: NIVARA_BUSINESS.primaryFacility,
    linkedPropertyId: NIVARA_IDS.property001,
    legalOwner: NIVARA_ISSUER.legalName,
    ownershipBasis: 'owned',
    operationalStatus: 'operational',
    materialToOperations: 'yes',
    encumbered: 'yes',
    linkedFacilityId: NIVARA_IDS.facility001,
    sourceStatus: 'fixed-asset-register',
    notes: 'Primary production asset securing term loan facility.',
  };

  const contractMateriality = {
    ...createEmptyContractMaterialityRecord(),
    id: 'nivara-contract-materiality-001',
    linkedContractId: NIVARA_IDS.contract001,
    materialOperationally: 'yes',
    materialFinancially: 'yes',
    stillSubsisting: 'yes',
    potentiallyRelevantToDrhp: 'yes',
    materialityStatus: 'material',
    notes: 'Key customer supply agreement — above revenue materiality threshold.',
  };

  const bacConfirmations = Object.fromEntries(
    BAC_CONFIRMATION_FIELDS.map(({ key }) => [key, 'yes']),
  ) as BorrowingsAssetsContractsPayload['reconciliationChangesAndIssuerConfirmations']['confirmations'];

  const contract = {
    ...createEmptyContractRecord(),
    id: NIVARA_IDS.contract001,
    category: 'key-customer',
    parties: {
      counterparty: 'AutoDrive Components India Private Limited',
      linkedGroupEntityId: '',
      relatedPartyStatus: 'no',
      role: 'customer',
      jurisdiction: 'India',
    },
    basicTerms: {
      ...createEmptyContractRecord().basicTerms,
      agreementTitle: 'Annual Supply Agreement — Precision Machined Components',
      executionDate: '2023-04-01',
      effectiveDate: '2023-04-01',
      expiry: '2026-03-31',
      contractTerm: '3 years',
      autoRenewal: 'yes',
      status: 'current',
      governingLaw: 'Laws of India',
      disputeResolutionMechanism: 'Arbitration',
      arbitrationSeatJurisdiction: 'Pune, Maharashtra',
      notes: 'Key OEM customer supply contract for automotive precision components.',
    },
    commercialImportance: {
      ...createEmptyContractRecord().commercialImportance,
      annualRevenueCostAttributable: '320',
      percentageOfIssuerRevenueCost: '28',
      exclusivity: 'no',
      territory: 'India',
    },
  };

  return {
    ...base,
    financialIndebtednessAndFacilityMaster: {
      ...base.financialIndebtednessAndFacilityMaster,
      borrowingSnapshot: {
        ...base.financialIndebtednessAndFacilityMaster.borrowingSnapshot,
        positionAsOfDate: NIVARA_FINANCIAL_PERIODS.fy2024End,
        reportingCurrency: NIVARA_FINANCIAL_PERIODS.reportingCurrency,
        displayUnit: NIVARA_FINANCIAL_PERIODS.amountUnit,
        currentBorrowingsExist: 'yes',
        securedBorrowingsExist: 'yes',
        unsecuredBorrowingsExist: 'no',
        workingCapitalFacilitiesExist: 'yes',
      },
      facilities: [facility],
    },
    securityChargesGuaranteesAndBorrowingPowers: {
      ...base.securityChargesGuaranteesAndBorrowingPowers,
      securities: [security],
      charges: [charge],
    },
    immovablePropertiesAndOccupancyRights: {
      ...base.immovablePropertiesAndOccupancyRights,
      properties: [property],
    },
    covenantsDefaultsWaiversAndLenderConsents: {
      ...base.covenantsDefaultsWaiversAndLenderConsents,
      covenants: [covenant],
      lenderConsents: [lenderConsent],
    },
    materialAssetsEncumbranceAndInsuranceLinkage: {
      ...base.materialAssetsEncumbranceAndInsuranceLinkage,
      assets: [materialAsset],
    },
    materialBusinessStrategicAndOtherContracts: {
      contracts: [contract],
    },
    contractMaterialityExpiryAndInspectionReadiness: {
      ...base.contractMaterialityExpiryAndInspectionReadiness,
      materialityRecords: [contractMateriality],
    },
    reconciliationChangesAndIssuerConfirmations: {
      ...base.reconciliationChangesAndIssuerConfirmations,
      confirmations: bacConfirmations,
    },
  } as BorrowingsAssetsContractsPayload;
}
