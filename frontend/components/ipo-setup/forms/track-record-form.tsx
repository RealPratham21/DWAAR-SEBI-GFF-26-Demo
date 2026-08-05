'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  NumberInputField,
  SelectField,
  TextInputField,
} from '@/components/ipo-setup/form-helpers';
import { IpoSectionSaveActions } from '@/components/ipo-setup/section-save-actions';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import {
  displayToRupees,
  rupeesToDisplay,
} from '@/lib/ipo-setup/format';
import {
  auditedStatusOptions,
  financialSourceTypeOptions,
  trackRecordBasisOptions,
  yesNoNotSureOptions,
} from '@/lib/ipo-setup/options';
import type {
  FinancialYearRow,
  TrackRecordAndFinancialEligibility,
} from '@/lib/schemas/ipo-setup';

export function TrackRecordForm() {
  const { payload, updateSection } = useIpoSetup();
  const value = payload.trackRecordAndFinancialEligibility;
  const unit = payload.offerStructure.amountDisplayUnit;

  const set = <K extends keyof TrackRecordAndFinancialEligibility>(
    key: K,
    next: TrackRecordAndFinancialEligibility[K],
  ) => {
    updateSection(
      'trackRecordAndFinancialEligibility',
      { ...value, [key]: next },
      'track-record-financial',
    );
  };

  const updateYear = (id: string, patch: Partial<FinancialYearRow>) => {
    set(
      'financialYears',
      value.financialYears.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const needsEntity =
    value.operatingTrackRecordBasis !== '' &&
    value.operatingTrackRecordBasis !== 'issuer-company' &&
    value.operatingTrackRecordBasis !== 'not-yet-established';

  return (
    <SectionCard
      title="Track Record & Financial Eligibility"
      description="Enter the operating track-record basis and a three-year financial grid. Management estimates stay visibly pending confirmation."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="operatingTrackRecordBasis"
          label="Operating track-record basis"
          required
          value={value.operatingTrackRecordBasis}
          onChange={(next) =>
            set(
              'operatingTrackRecordBasis',
              next as TrackRecordAndFinancialEligibility['operatingTrackRecordBasis'],
            )
          }
          options={trackRecordBasisOptions}
        />
        {needsEntity ? (
          <>
            <TextInputField
              id="trackRecordEntityName"
              label="Track-record entity name"
              value={value.trackRecordEntityName}
              onChange={(next) => set('trackRecordEntityName', next)}
            />
            <TextInputField
              id="natureOfEntity"
              label="Nature of entity"
              value={value.natureOfEntity}
              onChange={(next) => set('natureOfEntity', next)}
            />
            <SelectField
              id="sameLineOfBusiness"
              label="Same line of business"
              value={value.sameLineOfBusiness}
              onChange={(next) =>
                set(
                  'sameLineOfBusiness',
                  next as TrackRecordAndFinancialEligibility['sameLineOfBusiness'],
                )
              }
              options={yesNoNotSureOptions}
            />
            <TextInputField
              id="businessCommencementDate"
              label="Business commencement date"
              type="date"
              value={value.businessCommencementDate}
              onChange={(next) => set('businessCommencementDate', next)}
            />
            <TextInputField
              id="conversionOrSuccessionDate"
              label="Conversion / succession date"
              type="date"
              value={value.conversionOrSuccessionDate}
              onChange={(next) => set('conversionOrSuccessionDate', next)}
            />
            <TextInputField
              id="relationshipToIssuer"
              label="Relationship to issuer"
              value={value.relationshipToIssuer}
              onChange={(next) => set('relationshipToIssuer', next)}
            />
          </>
        ) : null}
        <SelectField
          id="threeCompleteFinancialYearsAvailable"
          label="Three complete financial years available"
          value={value.threeCompleteFinancialYearsAvailable}
          onChange={(next) =>
            set(
              'threeCompleteFinancialYearsAvailable',
              next as TrackRecordAndFinancialEligibility['threeCompleteFinancialYearsAvailable'],
            )
          }
          options={yesNoNotSureOptions}
        />
        <SelectField
          id="auditedRecordsAvailable"
          label="Audited records available"
          value={value.auditedRecordsAvailable}
          onChange={(next) =>
            set(
              'auditedRecordsAvailable',
              next as TrackRecordAndFinancialEligibility['auditedRecordsAvailable'],
            )
          }
          options={yesNoNotSureOptions}
        />
      </div>

      <TextInputField
        id="continuityExplanation"
        label="Continuity explanation"
        value={value.continuityExplanation}
        onChange={(next) => set('continuityExplanation', next)}
        helper="Explain continuity where the track-record basis is not solely the issuer."
      />

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Three-financial-year grid</h4>
        {value.financialYears.map((row, index) => (
          <div key={row.id} className="space-y-3 rounded-md border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Year {index + 1}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInputField
                id={`${row.id}-ending`}
                label="Financial year ending"
                value={row.financialYearEnding}
                onChange={(next) => updateYear(row.id, { financialYearEnding: next })}
                placeholder="e.g. 31 Mar 2025"
              />
              <NumberInputField
                id={`${row.id}-op`}
                label={`Operating profit from operations (₹ ${unit})`}
                value={rupeesToDisplay(row.operatingProfitFromOperations, unit)}
                onChange={(raw) =>
                  updateYear(row.id, {
                    operatingProfitFromOperations: displayToRupees(raw, unit),
                  })
                }
              />
              <NumberInputField
                id={`${row.id}-nw`}
                label={`Net worth (₹ ${unit})`}
                value={rupeesToDisplay(row.netWorth, unit)}
                onChange={(raw) => updateYear(row.id, { netWorth: displayToRupees(raw, unit) })}
              />
              <NumberInputField
                id={`${row.id}-fcfe`}
                label={`Free cash flow to equity (₹ ${unit})`}
                value={rupeesToDisplay(row.freeCashFlowToEquity, unit)}
                onChange={(raw) =>
                  updateYear(row.id, { freeCashFlowToEquity: displayToRupees(raw, unit) })
                }
              />
              <SelectField
                id={`${row.id}-audited`}
                label="Audited status"
                value={row.auditedStatus}
                onChange={(next) =>
                  updateYear(row.id, {
                    auditedStatus: next as FinancialYearRow['auditedStatus'],
                  })
                }
                options={auditedStatusOptions}
              />
              <SelectField
                id={`${row.id}-source`}
                label="Source type"
                value={row.sourceType}
                onChange={(next) =>
                  updateYear(row.id, { sourceType: next as FinancialYearRow['sourceType'] })
                }
                options={financialSourceTypeOptions}
              />
            </div>
            {row.sourceType === 'management-estimate' ? (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                Management estimate — pending documentary / professional confirmation.
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInputField
          id="latestAuditedFinancialYear"
          label="Latest audited financial year"
          value={value.latestAuditedFinancialYear}
          onChange={(next) => set('latestAuditedFinancialYear', next)}
        />
        <SelectField
          id="latestFinancialStatementsAvailable"
          label="Latest financial statements available"
          value={value.latestFinancialStatementsAvailable}
          onChange={(next) =>
            set(
              'latestFinancialStatementsAvailable',
              next as TrackRecordAndFinancialEligibility['latestFinancialStatementsAvailable'],
            )
          }
          options={yesNoNotSureOptions}
        />
        <SelectField
          id="stubPeriodFinancialsAvailable"
          label="Stub-period financials available"
          value={value.stubPeriodFinancialsAvailable}
          onChange={(next) =>
            set(
              'stubPeriodFinancialsAvailable',
              next as TrackRecordAndFinancialEligibility['stubPeriodFinancialsAvailable'],
            )
          }
          options={yesNoNotSureOptions}
        />
        <SelectField
          id="auditorHasConfirmedEligibilityFigures"
          label="Auditor has confirmed eligibility figures"
          value={value.auditorHasConfirmedEligibilityFigures}
          onChange={(next) =>
            set(
              'auditorHasConfirmedEligibilityFigures',
              next as TrackRecordAndFinancialEligibility['auditorHasConfirmedEligibilityFigures'],
            )
          }
          options={yesNoNotSureOptions}
        />
        <SelectField
          id="modifiedAuditOpinionRelevantToEligibility"
          label="Modified audit opinion relevant to eligibility"
          value={value.modifiedAuditOpinionRelevantToEligibility}
          onChange={(next) =>
            set(
              'modifiedAuditOpinionRelevantToEligibility',
              next as TrackRecordAndFinancialEligibility['modifiedAuditOpinionRelevantToEligibility'],
            )
          }
          options={yesNoNotSureOptions}
        />
      </div>
      {value.modifiedAuditOpinionRelevantToEligibility === 'yes' ? (
        <TextInputField
          id="modifiedAuditOpinionExplanation"
          label="Explanation"
          value={value.modifiedAuditOpinionExplanation}
          onChange={(next) => set('modifiedAuditOpinionExplanation', next)}
        />
      ) : null}

      <IpoSectionSaveActions sectionId="track-record-financial" />
    </SectionCard>
  );
}
