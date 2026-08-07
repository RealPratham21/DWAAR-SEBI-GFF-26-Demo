'use client';

import {
  ComputedStat,
  FieldGrid,
  FundNonFundBadge,
  SecuredClassificationBadge,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextInputField,
} from '@/components/borrowings-assets-contracts/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/borrowings-assets-contracts/repeatable-card';
import { BorrowingsAssetsContractsSectionActions } from '@/components/borrowings-assets-contracts/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import { createEmptyFacilityRecord } from '@/lib/borrowings-assets-contracts/defaults';
import { formatFacilityLabel } from '@/lib/borrowings-assets-contracts/facilities';
import {
  BORROWER_TYPE_OPTIONS,
  CURRENT_NON_CURRENT_OPTIONS,
  FACILITY_PURPOSE_OPTIONS,
  FACILITY_TYPE_OPTIONS,
  FUND_NON_FUND_OPTIONS,
  INTEREST_BENCHMARK_OPTIONS,
  LENDER_TYPE_OPTIONS,
  RATE_TYPE_OPTIONS,
  REPAYMENT_TYPE_OPTIONS,
  SECURED_CLASSIFICATION_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import {
  countFacilityReferences,
  formatFacilityDependencyMessage,
} from '@/lib/borrowings-assets-contracts/references';
import type {
  BorrowerType,
  CurrentNonCurrent,
  FacilityPurpose,
  FacilityRecord,
  FacilityType,
  FinancialIndebtednessAndFacilityMaster,
  FundNonFund,
  InterestBenchmark,
  LenderType,
  RateType,
  RepaymentType,
  SecuredClassification,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'financial-indebtedness-and-facility-master' as const;

function facilityHasData(facility: FacilityRecord): boolean {
  return Boolean(
    facility.lender.lenderName.trim() ||
      facility.borrower.displayName.trim() ||
      facility.facilityType ||
      facility.sanctionAndUtilisation.principalOutstanding.trim(),
  );
}

export function FacilityMasterForm() {
  const { payload, model, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.financialIndebtednessAndFacilityMaster;
  const primaryTotals = model.currencyTotals[0];

  const set = <K extends keyof FinancialIndebtednessAndFacilityMaster>(
    key: K,
    next: FinancialIndebtednessAndFacilityMaster[K],
  ) => {
    updateSection('financialIndebtednessAndFacilityMaster', { ...value, [key]: next }, SECTION_ID);
  };

  const setSnapshot = <K extends keyof FinancialIndebtednessAndFacilityMaster['borrowingSnapshot']>(
    key: K,
    next: FinancialIndebtednessAndFacilityMaster['borrowingSnapshot'][K],
  ) => {
    set('borrowingSnapshot', { ...value.borrowingSnapshot, [key]: next });
  };

  const setFacilities = (next: FacilityRecord[]) => set('facilities', next);

  const setFacility = (index: number, next: FacilityRecord) => {
    setFacilities(replaceAt(value.facilities, index, next));
  };

  const removeFacility = (index: number) => {
    const facility = value.facilities[index];
    const deps = countFacilityReferences(payload, facility.id);
    if (deps.length > 0) {
      window.alert(formatFacilityDependencyMessage(payload, facility.id, deps));
      return;
    }
    if (facilityHasData(facility) && !window.confirm('Remove this facility? Entered values will be lost.')) {
      return;
    }
    setFacilities(removeAt(value.facilities, index));
  };

  const snapshotTernaries = [
    ['currentBorrowingsExist', 'Current borrowings exist'],
    ['securedBorrowingsExist', 'Secured borrowings exist'],
    ['unsecuredBorrowingsExist', 'Unsecured borrowings exist'],
    ['workingCapitalFacilitiesExist', 'Working capital facilities exist'],
    ['nonFundBasedFacilitiesExist', 'Non-fund based facilities exist'],
    ['relatedPartyBorrowingsExist', 'Related-party borrowings exist'],
    ['foreignCurrencyBorrowingsExist', 'Foreign currency borrowings exist'],
    ['leaseLiabilitiesExist', 'Lease liabilities exist'],
    ['debtSecuritiesNcdsExist', 'Debt securities / NCDs exist'],
    ['materialSubsidiaryFacilitiesRelevant', 'Material subsidiary facilities relevant'],
  ] as const;

  return (
    <SectionCard
      title="Financial Indebtedness & Facility Master"
      description="Borrowing snapshot and canonical Facility Master register — each facility exists once and is referenced across security, covenants and reconciliation."
    >
      <SubSection
        title="Borrowing snapshot"
        description="High-level indebtedness indicators as of the position date."
      >
        <FieldGrid>
          <TextInputField
            id="bac-position-as-of"
            label="Position as of date"
            type="date"
            value={value.borrowingSnapshot.positionAsOfDate}
            onChange={(next) => setSnapshot('positionAsOfDate', next)}
          />
          <TextInputField
            id="bac-reporting-currency"
            label="Reporting currency"
            value={value.borrowingSnapshot.reportingCurrency}
            onChange={(next) => setSnapshot('reportingCurrency', next)}
          />
          <TextInputField
            id="bac-display-unit"
            label="Display unit"
            value={value.borrowingSnapshot.displayUnit}
            onChange={(next) => setSnapshot('displayUnit', next)}
            helper="e.g. lakhs, crore"
          />
        </FieldGrid>
        <FieldGrid columns={3}>
          {snapshotTernaries.map(([key, label]) => (
            <TernaryField
              key={key}
              id={`bac-snapshot-${key}`}
              label={label}
              value={value.borrowingSnapshot[key]}
              onChange={(next) => setSnapshot(key, next)}
            />
          ))}
        </FieldGrid>
      </SubSection>

      {primaryTotals ? (
        <SubSection title="Computed facility totals" description="Derived from Facility Master — not persisted.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ComputedStat label="Facilities" value={String(primaryTotals.facilityCount)} />
            <ComputedStat label="Total sanctioned" value={primaryTotals.totalSanctioned || '—'} />
            <ComputedStat label="Total outstanding" value={primaryTotals.totalOutstanding || '—'} />
            <ComputedStat label="Secured debt" value={primaryTotals.securedDebt || '—'} />
            <ComputedStat label="Unsecured debt" value={primaryTotals.unsecuredDebt || '—'} />
            <ComputedStat label="Undrawn" value={primaryTotals.totalUndrawn || '—'} />
            <ComputedStat label="Fund-based exposure" value={primaryTotals.fundBasedExposure || '—'} />
            <ComputedStat label="Non-fund exposure" value={primaryTotals.nonFundBasedExposure || '—'} />
          </div>
        </SubSection>
      ) : null}

      <RepeatableList
        title="Facility Master"
        description="Canonical facility register — stable IDs referenced across security, covenants, assets and reconciliation."
        addLabel="Add facility"
        onAdd={() => setFacilities([...value.facilities, createEmptyFacilityRecord()])}
        emptyMessage="No facilities recorded yet."
        count={value.facilities.length}
      >
        {value.facilities.map((facility, index) => (
          <RepeatableCard
            key={facility.id}
            title={formatFacilityLabel(facility, facility.id) || `Facility ${index + 1}`}
            subtitle={
              [facility.securedUnsecured, facility.fundBasedNonFundBased]
                .filter(Boolean)
                .join(' · ')
                .replaceAll('-', ' ') || undefined
            }
            onRemove={() => removeFacility(index)}
          >
            <div className="flex flex-wrap gap-2">
              <SecuredClassificationBadge
                classification={facility.securedUnsecured as SecuredClassification | ''}
              />
              <FundNonFundBadge value={facility.fundBasedNonFundBased} />
            </div>
            <FieldGrid columns={3}>
              <SelectField
                id={`fac-${facility.id}-borrower-type`}
                label="Borrower type"
                value={facility.borrower.borrowerType}
                onChange={(next) =>
                  setFacility(index, {
                    ...facility,
                    borrower: { ...facility.borrower, borrowerType: next as BorrowerType | '' },
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...BORROWER_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`fac-${facility.id}-borrower-name`}
                label="Borrower display name"
                value={facility.borrower.displayName}
                onChange={(next) =>
                  setFacility(index, {
                    ...facility,
                    borrower: { ...facility.borrower, displayName: next },
                  })
                }
              />
              <TextInputField
                id={`fac-${facility.id}-lender`}
                label="Lender name"
                value={facility.lender.lenderName}
                onChange={(next) =>
                  setFacility(index, {
                    ...facility,
                    lender: { ...facility.lender, lenderName: next },
                  })
                }
              />
              <SelectField
                id={`fac-${facility.id}-lender-type`}
                label="Lender type"
                value={facility.lender.lenderType}
                onChange={(next) =>
                  setFacility(index, {
                    ...facility,
                    lender: { ...facility.lender, lenderType: next as LenderType | '' },
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...LENDER_TYPE_OPTIONS]}
              />
              <SelectField
                id={`fac-${facility.id}-facility-type`}
                label="Facility type"
                value={facility.facilityType}
                onChange={(next) =>
                  setFacility(index, { ...facility, facilityType: next as FacilityType | '' })
                }
                options={[{ value: '', label: 'Select…' }, ...FACILITY_TYPE_OPTIONS]}
              />
              <SelectField
                id={`fac-${facility.id}-fund-non-fund`}
                label="Fund / non-fund"
                value={facility.fundBasedNonFundBased}
                onChange={(next) =>
                  setFacility(index, { ...facility, fundBasedNonFundBased: next as FundNonFund | '' })
                }
                options={[{ value: '', label: 'Select…' }, ...FUND_NON_FUND_OPTIONS]}
              />
              <SelectField
                id={`fac-${facility.id}-secured`}
                label="Secured / unsecured"
                value={facility.securedUnsecured}
                onChange={(next) =>
                  setFacility(index, {
                    ...facility,
                    securedUnsecured: next as SecuredClassification | '',
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...SECURED_CLASSIFICATION_OPTIONS]}
              />
            </FieldGrid>

            <SubSection title="Sanction & utilisation">
              <FieldGrid columns={3}>
                <DecimalInputField
                  id={`fac-${facility.id}-sanction`}
                  label="Current sanctioned limit"
                  value={facility.sanctionAndUtilisation.currentSanctionedLimit}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      sanctionAndUtilisation: {
                        ...facility.sanctionAndUtilisation,
                        currentSanctionedLimit: next,
                      },
                    })
                  }
                />
                <DecimalInputField
                  id={`fac-${facility.id}-outstanding`}
                  label="Principal outstanding"
                  value={facility.sanctionAndUtilisation.principalOutstanding}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      sanctionAndUtilisation: {
                        ...facility.sanctionAndUtilisation,
                        principalOutstanding: next,
                      },
                    })
                  }
                />
                <DecimalInputField
                  id={`fac-${facility.id}-total-outstanding`}
                  label="Total outstanding"
                  value={facility.sanctionAndUtilisation.totalOutstanding}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      sanctionAndUtilisation: {
                        ...facility.sanctionAndUtilisation,
                        totalOutstanding: next,
                      },
                    })
                  }
                />
                <SelectField
                  id={`fac-${facility.id}-current-non-current`}
                  label="Current / non-current"
                  value={facility.sanctionAndUtilisation.currentNonCurrentClassification}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      sanctionAndUtilisation: {
                        ...facility.sanctionAndUtilisation,
                        currentNonCurrentClassification: next as CurrentNonCurrent | '',
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...CURRENT_NON_CURRENT_OPTIONS]}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Interest">
              <FieldGrid columns={3}>
                <SelectField
                  id={`fac-${facility.id}-rate-type`}
                  label="Rate type"
                  value={facility.interest.rateType}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      interest: { ...facility.interest, rateType: next as RateType | '' },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...RATE_TYPE_OPTIONS]}
                />
                {facility.interest.rateType === 'floating' ? (
                  <>
                    <SelectField
                      id={`fac-${facility.id}-benchmark`}
                      label="Benchmark"
                      value={facility.interest.benchmark}
                      onChange={(next) =>
                        setFacility(index, {
                          ...facility,
                          interest: { ...facility.interest, benchmark: next as InterestBenchmark | '' },
                        })
                      }
                      options={[{ value: '', label: 'Select…' }, ...INTEREST_BENCHMARK_OPTIONS]}
                    />
                    <DecimalInputField
                      id={`fac-${facility.id}-spread`}
                      label="Spread (%)"
                      value={facility.interest.spread}
                      onChange={(next) =>
                        setFacility(index, {
                          ...facility,
                          interest: { ...facility.interest, spread: next },
                        })
                      }
                    />
                    <TextInputField
                      id={`fac-${facility.id}-reset-frequency`}
                      label="Reset frequency"
                      value={facility.interest.resetFrequency}
                      onChange={(next) =>
                        setFacility(index, {
                          ...facility,
                          interest: { ...facility.interest, resetFrequency: next },
                        })
                      }
                    />
                  </>
                ) : facility.interest.rateType === 'fixed' ? (
                  <DecimalInputField
                    id={`fac-${facility.id}-effective-rate`}
                    label="Effective rate (%)"
                    value={facility.interest.enteredEffectiveRate}
                    onChange={(next) =>
                      setFacility(index, {
                        ...facility,
                        interest: { ...facility.interest, enteredEffectiveRate: next },
                      })
                    }
                  />
                ) : null}
              </FieldGrid>
            </SubSection>

            <SubSection title="Tenor & repayment">
              <FieldGrid columns={3}>
                <TextInputField
                  id={`fac-${facility.id}-maturity`}
                  label="Maturity date"
                  type="date"
                  value={facility.tenorAndRepayment.maturityDate}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      tenorAndRepayment: { ...facility.tenorAndRepayment, maturityDate: next },
                    })
                  }
                />
                <SelectField
                  id={`fac-${facility.id}-repayment-type`}
                  label="Repayment type"
                  value={facility.tenorAndRepayment.repaymentType}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      tenorAndRepayment: {
                        ...facility.tenorAndRepayment,
                        repaymentType: next as RepaymentType | '',
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...REPAYMENT_TYPE_OPTIONS]}
                />
                <TernaryField
                  id={`fac-${facility.id}-schedule-available`}
                  label="Repayment schedule available"
                  value={facility.tenorAndRepayment.repaymentScheduleAvailable}
                  onChange={(next) =>
                    setFacility(index, {
                      ...facility,
                      tenorAndRepayment: {
                        ...facility.tenorAndRepayment,
                        repaymentScheduleAvailable: next,
                      },
                    })
                  }
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Purpose">
              <SelectField
                id={`fac-${facility.id}-purpose`}
                label="Primary purpose"
                value={facility.purpose.purposes[0] ?? ''}
                onChange={(next) =>
                  setFacility(index, {
                    ...facility,
                    purpose: {
                      ...facility.purpose,
                      purposes: next ? [next as FacilityPurpose] : [],
                    },
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...FACILITY_PURPOSE_OPTIONS]}
              />
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
