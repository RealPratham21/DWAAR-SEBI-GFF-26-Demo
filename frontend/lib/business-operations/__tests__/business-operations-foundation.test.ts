import { describe, expect, it } from 'vitest';

import {
  assessBusinessOperations,
  BUSINESS_ASSESSMENT_GROUPS,
  BUSINESS_OPERATIONS_SCHEMA_VERSION,
  BUSINESS_OPERATIONS_SECTION_IDS,
  businessOperationsPayloadSchema,
  calculateBusinessOperationsProgress,
  computeBusinessOperationsModel,
  createEmptyBusinessOperationsPayload,
  createEmptyCapacityRecord,
  createEmptyFacility,
  createEmptyOperatingProcessStep,
  createEmptyProductService,
  createEmptyRevenueMixRow,
  createEmptyStrategyItem,
  createEmptyCompetitiveStrength,
  type BusinessOperationsPayload,
} from '@/lib/business-operations';

describe('business operations foundation', () => {
  it('freezes schema version and eight sections', () => {
    expect(BUSINESS_OPERATIONS_SCHEMA_VERSION).toBe(1);
    expect(BUSINESS_OPERATIONS_SECTION_IDS).toHaveLength(8);
    const empty = createEmptyBusinessOperationsPayload();
    expect(empty.schemaVersion).toBe(1);
    expect(businessOperationsPayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('defaults all eight canonical section keys', () => {
    const empty = createEmptyBusinessOperationsPayload();
    expect(empty.businessProfileAndOperatingModel).toBeDefined();
    expect(empty.productsServicesAndRevenueMix).toBeDefined();
    expect(empty.customersSalesDistributionAndGeography).toBeDefined();
    expect(empty.suppliersProcurementInventoryAndLogistics).toBeDefined();
    expect(empty.facilitiesCapacityAndOperationalProcess).toBeDefined();
    expect(empty.technologyQualityResearchAndIntellectualProperty).toBeDefined();
    expect(empty.workforceCollaborationsInsuranceAndContinuity).toBeDefined();
    expect(empty.competitiveStrengthsStrategyDependenciesAndConfirmations).toBeDefined();
  });

  it('assigns stable ids to repeatable product, facility and capacity records', () => {
    const product = createEmptyProductService();
    const facility = createEmptyFacility();
    const capacity = createEmptyCapacityRecord();
    const step = createEmptyOperatingProcessStep();
    expect(product.id.length).toBeGreaterThan(8);
    expect(facility.id.length).toBeGreaterThan(8);
    expect(capacity.id.length).toBeGreaterThan(8);
    expect(step.id.length).toBeGreaterThan(8);
    expect(capacity.utilisationAbove100Explanation).toBe('');
  });

  it('reconciles three-year revenue mix approximately to 100%', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const productA = createEmptyProductService('prod-a');
    productA.name = 'Widgets';
    productA.productType = 'product';
    productA.businessSegment = 'Core';
    const productB = createEmptyProductService('prod-b');
    productB.name = 'Services';
    productB.productType = 'service';
    productB.businessSegment = 'Services';

    const rowA = createEmptyRevenueMixRow('mix-a');
    rowA.productOrSegmentId = productA.id;
    rowA.productOrSegmentLabel = productA.name;
    rowA.financialYear = 'FY2024';
    rowA.revenue = '60000000';
    rowA.percentageOfRevenueFromOperations = '60';
    rowA.source = 'audited-financials';

    const rowB = createEmptyRevenueMixRow('mix-b');
    rowB.productOrSegmentId = productB.id;
    rowB.productOrSegmentLabel = productB.name;
    rowB.financialYear = 'FY2024';
    rowB.revenue = '40000000';
    rowB.percentageOfRevenueFromOperations = '40';
    rowB.source = 'management-records';

    const payload: BusinessOperationsPayload = {
      ...empty,
      productsServicesAndRevenueMix: {
        ...empty.productsServicesAndRevenueMix,
        productsServices: [productA, productB],
        revenueMixRows: [rowA, rowB],
      },
    };

    const model = computeBusinessOperationsModel(payload);
    expect(model.revenueMixByYear).toHaveLength(1);
    expect(model.revenueMixByYear[0]?.totalPercentage).toBe('100');
    expect(model.revenueMixByYear[0]?.percentagesReconcile).toBe(true);
    expect(model.revenuePercentagesReconcile).toBe(true);
    expect(model.largestSegment?.label).toBe('Widgets');
    expect(model.productConcentration.largestProductPercentage).toBe('60');
  });

  it('flags revenue mix that does not reconcile', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const row = createEmptyRevenueMixRow();
    row.financialYear = 'FY2024';
    row.percentageOfRevenueFromOperations = '85';
    row.revenue = '8500000';
    row.source = 'estimate';
    row.productOrSegmentLabel = 'Only segment';

    const model = computeBusinessOperationsModel({
      ...empty,
      productsServicesAndRevenueMix: {
        ...empty.productsServicesAndRevenueMix,
        revenueMixRows: [row],
      },
    });
    expect(model.revenueMixByYear[0]?.percentagesReconcile).toBe(false);
    expect(model.revenuePercentagesReconcile).toBe(false);
  });

  it('computes capacity utilisation including non-manufacturing metrics and over-100%', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const plant = createEmptyFacility('fac-1');
    plant.name = 'Plant A';
    plant.facilityType = 'manufacturing-plant';

    const manufacturing = createEmptyCapacityRecord('cap-1');
    manufacturing.facilityId = plant.id;
    manufacturing.facilityName = plant.name;
    manufacturing.periodLabel = 'FY2024';
    manufacturing.metricOrCapacityUnit = 'tonnes';
    manufacturing.installedCapacity = '100';
    manufacturing.availableCapacity = '100';
    manufacturing.actualOutput = '80';

    const seats = createEmptyCapacityRecord('cap-2');
    seats.facilityId = plant.id;
    seats.facilityName = plant.name;
    seats.periodLabel = 'Current';
    seats.isCurrentPeriod = true;
    seats.metricOrCapacityUnit = 'seats';
    seats.installedCapacity = '50';
    seats.availableCapacity = '50';
    seats.actualOutput = '45';

    const over = createEmptyCapacityRecord('cap-3');
    over.facilityId = plant.id;
    over.facilityName = plant.name;
    over.periodLabel = 'FY2023';
    over.metricOrCapacityUnit = 'units';
    over.installedCapacity = '100';
    over.availableCapacity = '100';
    over.actualOutput = '120';

    const model = computeBusinessOperationsModel({
      ...empty,
      facilitiesCapacityAndOperationalProcess: {
        ...empty.facilitiesCapacityAndOperationalProcess,
        facilities: [plant],
        capacityRecords: [manufacturing, seats, over],
      },
    });

    expect(model.capacityUtilisation).toHaveLength(3);
    expect(model.capacityUtilisation.find((r) => r.id === 'cap-1')?.utilisationPercentage).toBe(
      '80',
    );
    expect(model.capacityUtilisation.find((r) => r.id === 'cap-2')?.metricOrCapacityUnit).toBe(
      'seats',
    );
    const overRow = model.capacityUtilisation.find((r) => r.id === 'cap-3');
    expect(overRow?.exceeds100).toBe(true);
    expect(overRow?.rawUtilisationPercentage).toBe('120');
  });

  it('summarises customer and supplier concentration by period', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const payload: BusinessOperationsPayload = {
      ...empty,
      customersSalesDistributionAndGeography: {
        ...empty.customersSalesDistributionAndGeography,
        customerConcentrationPeriods: [
          {
            id: 'cc-1',
            periodLabel: 'FY2024',
            isCurrentPeriod: false,
            largestCustomerRevenue: '100',
            largestCustomerPercentage: '25',
            top3Revenue: '200',
            top3Percentage: '50',
            top5Revenue: '280',
            top5Percentage: '70',
            top10Revenue: '340',
            top10Percentage: '85',
            totalRevenueFromOperations: '400',
            source: 'audited-financials',
            notes: '',
          },
        ],
      },
      suppliersProcurementInventoryAndLogistics: {
        ...empty.suppliersProcurementInventoryAndLogistics,
        supplierConcentrationPeriods: [
          {
            id: 'sc-1',
            periodLabel: 'FY2024',
            isCurrentPeriod: true,
            totalSuppliers: '40',
            largestSupplierPurchaseValue: '50',
            largestSupplierPercentage: '20',
            top3PurchaseValue: '120',
            top3Percentage: '48',
            top5PurchaseValue: '160',
            top5Percentage: '64',
            top10PurchaseValue: '200',
            top10Percentage: '80',
            totalPurchases: '250',
            importedPurchasePercentage: '30',
            relatedPartySupplierPercentage: '5',
            source: 'management-records',
            notes: '',
          },
        ],
      },
    };

    const model = computeBusinessOperationsModel(payload);
    expect(model.customerConcentration[0]?.largestPercentage).toBe('25');
    expect(model.supplierConcentration[0]?.top10Percentage).toBe('80');
  });

  it('tracks geographic revenue rows', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const model = computeBusinessOperationsModel({
      ...empty,
      customersSalesDistributionAndGeography: {
        ...empty.customersSalesDistributionAndGeography,
        geographicRevenueRows: [
          {
            id: 'geo-1',
            periodLabel: 'FY2024',
            geographicScope: 'india',
            regionOrCountry: 'India',
            revenue: '70',
            percentageOfRevenue: '70',
            source: 'audited-financials',
            notes: '',
          },
          {
            id: 'geo-2',
            periodLabel: 'FY2024',
            geographicScope: 'export',
            regionOrCountry: 'Export',
            revenue: '30',
            percentageOfRevenue: '30',
            source: 'audited-financials',
            notes: '',
          },
        ],
      },
    });
    expect(model.geographicMix).toHaveLength(2);
    expect(model.geographicMix.map((r) => r.geographicScope)).toEqual(['india', 'export']);
  });

  it('preserves process-flow step ordering via stepNumber', () => {
    const steps = [
      { ...createEmptyOperatingProcessStep('p1'), stepNumber: '1', processName: 'Receive' },
      { ...createEmptyOperatingProcessStep('p2'), stepNumber: '2', processName: 'Process' },
      { ...createEmptyOperatingProcessStep('p3'), stepNumber: '3', processName: 'Dispatch' },
    ];
    expect(steps.map((s) => s.stepNumber)).toEqual(['1', '2', '3']);
  });

  it('marks sections not_started when empty and in_progress when partial', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const progress = calculateBusinessOperationsProgress(empty);
    expect(progress.sections['business-profile-operating-model']).toBe('not_started');
    expect(progress.sectionsComplete).toBe(0);
    expect(progress.totalSections).toBe(8);

    const partial: BusinessOperationsPayload = {
      ...empty,
      businessProfileAndOperatingModel: {
        ...empty.businessProfileAndOperatingModel,
        primaryBusinessActivity: 'Widget manufacturing',
      },
    };
    expect(
      calculateBusinessOperationsProgress(partial).sections['business-profile-operating-model'],
    ).toBe('in_progress');
  });

  it('adapts assessment context for manufacturing vs software classifications without dropping stored values', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const manufacturing: BusinessOperationsPayload = {
      ...empty,
      businessProfileAndOperatingModel: {
        ...empty.businessProfileAndOperatingModel,
        businessClassifications: ['manufacturing'],
        primaryBusinessActivity: 'Steel fabrication',
        revenueModels: ['product-sales'],
      },
      facilitiesCapacityAndOperationalProcess: {
        ...empty.facilitiesCapacityAndOperationalProcess,
        facilities: [{ ...createEmptyFacility('f1'), name: 'Plant', facilityType: 'manufacturing-plant' }],
      },
    };
    const mAssessment = assessBusinessOperations(manufacturing);
    expect(mAssessment.criteria.some((c) => c.id.includes('facilit') || c.group === 'facilities_and_capacity')).toBe(
      true,
    );

    const software: BusinessOperationsPayload = {
      ...empty,
      businessProfileAndOperatingModel: {
        ...empty.businessProfileAndOperatingModel,
        businessClassifications: ['software-or-technology-platform'],
        primaryBusinessActivity: 'SaaS platform',
        revenueModels: ['subscription'],
      },
      // Stored manufacturing facility retained when classification changes
      facilitiesCapacityAndOperationalProcess: manufacturing.facilitiesCapacityAndOperationalProcess,
    };
    const sAssessment = assessBusinessOperations(software);
    expect(sAssessment.model.counts.facilities).toBe(1);
    expect(sAssessment.result).not.toMatch(/investment/i);
  });

  it('assessment never invents a strong/weak or investment-quality score', () => {
    const assessment = assessBusinessOperations(createEmptyBusinessOperationsPayload());
    expect(assessment.resultLabel.toLowerCase()).not.toMatch(/strong|weak|investment/);
    expect(assessment.summary.toLowerCase()).not.toMatch(/investment-quality|strong business|weak business/);
  });

  it('requires supporting source for competitive strength claims', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const strength = createEmptyCompetitiveStrength('s1');
    strength.title = 'Market leader in widgets';
    strength.explanation = 'Largest share';

    const assessment = assessBusinessOperations({
      ...empty,
      competitiveStrengthsStrategyDependenciesAndConfirmations: {
        ...empty.competitiveStrengthsStrategyDependenciesAndConfirmations,
        competitiveStrengths: [strength],
      },
    });

    const pending = assessment.criteria.find((c) => c.id === 'strength-supporting-source-pending');
    expect(pending?.state).toBe('pending_supporting_source');

    const reconcile = assessment.model.reconciliation.find((c) => c.id === 'strength-sources');
    expect(reconcile?.status).toBe('variance');
  });

  it('flags strategies marked as containing unsupported projections', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const strategy = createEmptyStrategyItem('st1');
    strategy.title = 'Growth plan';
    strategy.description = 'Expand capacity';
    strategy.containsUnsupportedProjections = 'yes';

    const model = computeBusinessOperationsModel({
      ...empty,
      competitiveStrengthsStrategyDependenciesAndConfirmations: {
        ...empty.competitiveStrengthsStrategyDependenciesAndConfirmations,
        strategies: [strategy],
      },
    });
    const check = model.reconciliation.find((c) => c.id === 'strategy-projections');
    expect(check?.status).toBe('variance');
  });

  it('groups assessment criteria into the eight disclosure categories', () => {
    const assessment = assessBusinessOperations(createEmptyBusinessOperationsPayload());
    const groups = new Set(assessment.criteria.map((c) => c.group));
    for (const group of BUSINESS_ASSESSMENT_GROUPS) {
      expect(assessment.groups.some((g) => g.group === group)).toBe(true);
    }
    expect(groups.size).toBeGreaterThanOrEqual(5);
  });

  it('counts quality certifications and IP in the derived model', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const model = computeBusinessOperationsModel({
      ...empty,
      technologyQualityResearchAndIntellectualProperty: {
        ...empty.technologyQualityResearchAndIntellectualProperty,
        certifications: [
          {
            id: 'cert-1',
            standard: 'ISO 9001',
            certificateNumber: 'C-1',
            issuingBody: 'BIS',
            scope: 'Quality',
            issueDate: '2024-01-01',
            expiryDate: '2027-01-01',
            renewalStatus: 'current',
            notes: '',
          },
        ],
        intellectualPropertyRecords: [
          {
            id: 'ip-1',
            ipType: 'patent',
            nameOrDescription: 'Process patent',
            ownerOrApplicant: 'Issuer',
            registrationOrApplicationNumber: 'IN123',
            jurisdiction: 'India',
            status: 'registered',
            filingDate: '2020-01-01',
            registrationDate: '2022-01-01',
            expiryDate: '2040-01-01',
            relatedProducts: '',
            ownershipModel: 'owned',
            licenceTerms: '',
            materialityStatus: 'material',
            disputeOrOpposition: '',
            disputeOrOppositionDetails: '',
            notes: '',
          },
        ],
      },
    });
    expect(model.counts.certifications).toBe(1);
    expect(model.counts.ipRecords).toBe(1);
  });

  it('derives latest workforce totals from period rows', () => {
    const empty = createEmptyBusinessOperationsPayload();
    const model = computeBusinessOperationsModel({
      ...empty,
      workforceCollaborationsInsuranceAndContinuity: {
        ...empty.workforceCollaborationsInsuranceAndContinuity,
        workforcePeriods: [
          {
            id: 'w-1',
            asOfDate: '2024-03-31',
            periodLabel: 'FY2024',
            isCurrentPeriod: true,
            permanentEmployees: '100',
            contractWorkers: '20',
            factoryOrOperationalWorkers: '60',
            technicalOrRdEmployees: '10',
            salesEmployees: '15',
            administrationEmployees: '15',
            womenEmployees: '30',
            personsWithDisabilities: '2',
            unionisedEmployees: '40',
            attritionPercentage: '8',
            geographicDistribution: 'Maharashtra',
            notes: '',
          },
        ],
        insurancePolicies: [
          {
            id: 'ins-1',
            policyType: 'property',
            insurer: 'Test Insurer',
            coverage: 'Plant',
            sumInsured: '10000000',
            policyPeriod: '2024-25',
            deductible: '100000',
            keyExclusions: '',
            claimsHistory: '',
            renewalStatus: 'current',
            notes: '',
          },
        ],
      },
    });
    expect(model.workforceLatest?.totalHeadcount).toBe('120');
    expect(model.workforceLatest?.permanentEmployees).toBe('100');
  });
});
