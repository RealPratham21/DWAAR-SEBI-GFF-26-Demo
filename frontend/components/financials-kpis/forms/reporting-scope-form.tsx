'use client';

import {
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/financials-kpis/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/financials-kpis/repeatable-card';
import { FinancialsKpisSectionActions } from '@/components/financials-kpis/section-actions';
import { SectionCard } from '@/components/financials-kpis/form-helpers';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import {
  createEmptyAuditorChangeRecord,
  createEmptyFinancialPeriod,
  createEmptyReportingEntity,
} from '@/lib/financials-kpis/defaults';
import {
  ACCOUNTING_FRAMEWORK_OPTIONS,
  AUDITED_STATUS_OPTIONS,
  CONSOLIDATION_METHOD_OPTIONS,
  DISPLAY_UNIT_OPTIONS,
  FINALISATION_STATUS_OPTIONS,
  FINANCIAL_PRESENTATION_OPTIONS,
  FULL_YEAR_OR_INTERIM_OPTIONS,
  PERIOD_BASIS_OPTIONS,
  RESTATED_STATUS_OPTIONS,
  RESTATEMENT_EXERCISE_STATUS_OPTIONS,
  REPORTING_ENTITY_TYPE_OPTIONS,
  SOURCE_STATUS_OPTIONS,
} from '@/lib/financials-kpis/options';
import { validatePeriodDeletion } from '@/lib/financials-kpis/periods';
import type {
  AccountingFramework,
  AuditedStatus,
  AuditorChangeRecord,
  ConsolidationMethod,
  DisplayUnit,
  FinalisationStatus,
  FinancialPeriod,
  FinancialPresentation,
  FullYearOrInterim,
  PeriodBasis,
  ReportingEntity,
  ReportingEntityType,
  ReportingScopePeriodsAndAuditorReadiness,
  RestatedStatus,
  RestatementExerciseStatus,
  SourceStatus,
} from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'reporting-scope-periods-and-auditor-readiness' as const;

export function ReportingScopeForm() {
  const { payload, updateSection } = useFinancialsKpis();
  const value = payload.reportingScopePeriodsAndAuditorReadiness;

  const set = <K extends keyof ReportingScopePeriodsAndAuditorReadiness>(
    key: K,
    next: ReportingScopePeriodsAndAuditorReadiness[K],
  ) => {
    updateSection('reportingScopePeriodsAndAuditorReadiness', { ...value, [key]: next }, SECTION_ID);
  };

  const setBasis = <K extends keyof ReportingScopePeriodsAndAuditorReadiness['reportingBasis']>(
    key: K,
    next: ReportingScopePeriodsAndAuditorReadiness['reportingBasis'][K],
  ) => {
    set('reportingBasis', { ...value.reportingBasis, [key]: next });
  };

  const setAuditor = <K extends keyof ReportingScopePeriodsAndAuditorReadiness['auditorReadiness']>(
    key: K,
    next: ReportingScopePeriodsAndAuditorReadiness['auditorReadiness'][K],
  ) => {
    set('auditorReadiness', { ...value.auditorReadiness, [key]: next });
  };

  const setEntity = <K extends keyof ReportingEntity>(
    index: number,
    key: K,
    next: ReportingEntity[K],
  ) => {
    set(
      'reportingEntities',
      replaceAt(value.reportingEntities, index, {
        ...value.reportingEntities[index],
        [key]: next,
      }),
    );
  };

  const setPeriod = <K extends keyof FinancialPeriod>(
    index: number,
    key: K,
    next: FinancialPeriod[K],
  ) => {
    set(
      'financialPeriods',
      replaceAt(value.financialPeriods, index, {
        ...value.financialPeriods[index],
        [key]: next,
      }),
    );
  };

  const setAuditorChange = <K extends keyof AuditorChangeRecord>(
    index: number,
    key: K,
    next: AuditorChangeRecord[K],
  ) => {
    set(
      'auditorChangeRecords',
      replaceAt(value.auditorChangeRecords, index, {
        ...value.auditorChangeRecords[index],
        [key]: next,
      }),
    );
  };

  const removePeriod = (index: number) => {
    const period = value.financialPeriods[index];
    const validation = validatePeriodDeletion(payload, period.id);
    if (!validation.canDelete) {
      window.alert(validation.message);
      return;
    }
    set('financialPeriods', removeAt(value.financialPeriods, index));
  };

  return (
    <SectionCard
      title="Reporting Scope, Periods & Auditor Readiness"
      description="Reporting basis, entity scope, the shared financial-period registry and auditor readiness."
    >
      <SubSection title="Reporting basis" description="Framework, presentation and display conventions.">
        <FieldGrid columns={3}>
          <TextInputField
            id="rs-fye"
            label="Financial year end"
            value={value.reportingBasis.financialYearEnd}
            onChange={(next) => setBasis('financialYearEnd', next)}
          />
          <SelectField
            id="rs-framework"
            label="Accounting framework"
            value={value.reportingBasis.accountingFramework}
            onChange={(next) => setBasis('accountingFramework', next as AccountingFramework | '')}
            options={ACCOUNTING_FRAMEWORK_OPTIONS}
          />
          <SelectField
            id="rs-presentation"
            label="Financial presentation"
            value={value.reportingBasis.financialPresentation}
            onChange={(next) => setBasis('financialPresentation', next as FinancialPresentation | '')}
            options={FINANCIAL_PRESENTATION_OPTIONS}
          />
          <TextInputField
            id="rs-currency"
            label="Currency"
            value={value.reportingBasis.currency}
            onChange={(next) => setBasis('currency', next)}
            placeholder="INR"
          />
          <SelectField
            id="rs-display-unit"
            label="Display unit"
            value={value.reportingBasis.displayUnit}
            onChange={(next) => setBasis('displayUnit', next as DisplayUnit | '')}
            options={DISPLAY_UNIT_OPTIONS}
          />
          <TextInputField
            id="rs-rounding"
            label="Rounding convention"
            value={value.reportingBasis.roundingConvention}
            onChange={(next) => setBasis('roundingConvention', next)}
          />
          <TernaryField
            id="rs-oci"
            label="OCI applies"
            value={value.reportingBasis.ociApplies}
            onChange={(next) => setBasis('ociApplies', next)}
          />
          <TernaryField
            id="rs-cf"
            label="Cash flow statement available"
            value={value.reportingBasis.cashFlowAvailable}
            onChange={(next) => setBasis('cashFlowAvailable', next)}
          />
          <TernaryField
            id="rs-equity"
            label="Changes in equity available"
            value={value.reportingBasis.changesInEquityAvailable}
            onChange={(next) => setBasis('changesInEquityAvailable', next)}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Reporting entities"
        description="Entities in scope for the restated financial information."
        addLabel="Add entity"
        onAdd={() =>
          set('reportingEntities', [...value.reportingEntities, createEmptyReportingEntity()])
        }
        emptyMessage="No reporting entities added yet."
        count={value.reportingEntities.length}
      >
        {value.reportingEntities.map((entity, index) => (
          <RepeatableCard
            key={entity.id}
            title={entity.name || `Entity ${index + 1}`}
            onRemove={() => set('reportingEntities', removeAt(value.reportingEntities, index))}
            requiresConfirmation={hasRecordData([entity.name, entity.entityType, entity.country])}
          >
            <FieldGrid>
              <TextInputField
                id={`entity-name-${entity.id}`}
                label="Entity name"
                value={entity.name}
                onChange={(next) => setEntity(index, 'name', next)}
              />
              <SelectField
                id={`entity-type-${entity.id}`}
                label="Entity type"
                value={entity.entityType}
                onChange={(next) => setEntity(index, 'entityType', next as ReportingEntityType | '')}
                options={REPORTING_ENTITY_TYPE_OPTIONS}
              />
              <TextInputField
                id={`entity-country-${entity.id}`}
                label="Country"
                value={entity.country}
                onChange={(next) => setEntity(index, 'country', next)}
              />
              <DecimalInputField
                id={`entity-ownership-${entity.id}`}
                label="Ownership (%)"
                value={entity.ownershipPct}
                onChange={(next) => setEntity(index, 'ownershipPct', next)}
              />
              <SelectField
                id={`entity-consolidation-${entity.id}`}
                label="Consolidation method"
                value={entity.consolidationMethod}
                onChange={(next) =>
                  setEntity(index, 'consolidationMethod', next as ConsolidationMethod | '')
                }
                options={CONSOLIDATION_METHOD_OPTIONS}
              />
              <TernaryField
                id={`entity-fs-${entity.id}`}
                label="Financial statements available"
                value={entity.financialStatementsAvailable}
                onChange={(next) => setEntity(index, 'financialStatementsAvailable', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Financial periods"
        description="Define at least three full-year periods plus interim. All financial grids use this registry."
        addLabel="Add period"
        onAdd={() =>
          set('financialPeriods', [...value.financialPeriods, createEmptyFinancialPeriod()])
        }
        emptyMessage="No financial periods defined yet."
        count={value.financialPeriods.length}
      >
        {value.financialPeriods.map((period, index) => (
          <RepeatableCard
            key={period.id}
            title={period.label || `Period ${index + 1}`}
            subtitle={period.fullYearOrInterim === 'interim' ? 'Interim' : 'Full year'}
            onRemove={() => removePeriod(index)}
            requiresConfirmation={hasRecordData([period.label, period.startDate, period.endDate])}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`period-label-${period.id}`}
                label="Period label"
                value={period.label}
                onChange={(next) => setPeriod(index, 'label', next)}
              />
              <DateField
                id={`period-start-${period.id}`}
                label="Start date"
                value={period.startDate}
                onChange={(next) => setPeriod(index, 'startDate', next)}
              />
              <DateField
                id={`period-end-${period.id}`}
                label="End date"
                value={period.endDate}
                onChange={(next) => setPeriod(index, 'endDate', next)}
              />
              <DecimalInputField
                id={`period-months-${period.id}`}
                label="Months"
                value={period.months}
                onChange={(next) => setPeriod(index, 'months', next)}
              />
              <SelectField
                id={`period-fy-interim-${period.id}`}
                label="Full year or interim"
                value={period.fullYearOrInterim}
                onChange={(next) => setPeriod(index, 'fullYearOrInterim', next as FullYearOrInterim | '')}
                options={FULL_YEAR_OR_INTERIM_OPTIONS}
              />
              <SelectField
                id={`period-basis-${period.id}`}
                label="Basis"
                value={period.basis}
                onChange={(next) => setPeriod(index, 'basis', next as PeriodBasis | '')}
                options={PERIOD_BASIS_OPTIONS}
              />
              <SelectField
                id={`period-audited-${period.id}`}
                label="Audited status"
                value={period.auditedStatus}
                onChange={(next) => setPeriod(index, 'auditedStatus', next as AuditedStatus | '')}
                options={AUDITED_STATUS_OPTIONS}
              />
              <SelectField
                id={`period-restated-${period.id}`}
                label="Restated status"
                value={period.restatedStatus}
                onChange={(next) => setPeriod(index, 'restatedStatus', next as RestatedStatus | '')}
                options={RESTATED_STATUS_OPTIONS}
              />
              <SelectField
                id={`period-source-${period.id}`}
                label="Source status"
                value={period.sourceStatus}
                onChange={(next) => setPeriod(index, 'sourceStatus', next as SourceStatus | '')}
                options={SOURCE_STATUS_OPTIONS}
              />
              <SelectField
                id={`period-finalisation-${period.id}`}
                label="Finalisation status"
                value={period.finalisationStatus}
                onChange={(next) =>
                  setPeriod(index, 'finalisationStatus', next as FinalisationStatus | '')
                }
                options={FINALISATION_STATUS_OPTIONS}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Auditor readiness">
        <FieldGrid columns={3}>
          <TextInputField
            id="ar-current-auditor"
            label="Current statutory auditor"
            value={value.auditorReadiness.currentStatutoryAuditor}
            onChange={(next) => setAuditor('currentStatutoryAuditor', next)}
          />
          <TextInputField
            id="ar-frn"
            label="Firm registration number"
            value={value.auditorReadiness.firmRegistrationNumber}
            onChange={(next) => setAuditor('firmRegistrationNumber', next)}
          />
          <TextInputField
            id="ar-partner"
            label="Signing partner"
            value={value.auditorReadiness.signingPartner}
            onChange={(next) => setAuditor('signingPartner', next)}
          />
          <SelectField
            id="ar-restatement-status"
            label="Restatement exercise status"
            value={value.auditorReadiness.restatementExerciseStatus}
            onChange={(next) =>
              setAuditor('restatementExerciseStatus', next as RestatementExerciseStatus | '')
            }
            options={RESTATEMENT_EXERCISE_STATUS_OPTIONS}
          />
          <DateField
            id="ar-expected-completion"
            label="Expected completion date"
            value={value.auditorReadiness.expectedCompletionDate}
            onChange={(next) => setAuditor('expectedCompletionDate', next)}
          />
          <TernaryField
            id="ar-board-approved"
            label="Restated information board approved"
            value={value.auditorReadiness.restatedInformationBoardApproved}
            onChange={(next) => setAuditor('restatedInformationBoardApproved', next)}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Auditor changes"
        addLabel="Add auditor change"
        onAdd={() =>
          set('auditorChangeRecords', [
            ...value.auditorChangeRecords,
            createEmptyAuditorChangeRecord(),
          ])
        }
        emptyMessage="No auditor change records."
        count={value.auditorChangeRecords.length}
      >
        {value.auditorChangeRecords.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={record.previousAuditor || `Auditor change ${index + 1}`}
            onRemove={() =>
              set('auditorChangeRecords', removeAt(value.auditorChangeRecords, index))
            }
            requiresConfirmation={hasRecordData([record.previousAuditor, record.reason])}
          >
            <FieldGrid>
              <TextInputField
                id={`ac-prev-${record.id}`}
                label="Previous auditor"
                value={record.previousAuditor}
                onChange={(next) => setAuditorChange(index, 'previousAuditor', next)}
              />
              <DateField
                id={`ac-date-${record.id}`}
                label="Appointment / resignation date"
                value={record.appointmentResignationDate}
                onChange={(next) => setAuditorChange(index, 'appointmentResignationDate', next)}
              />
              <TextAreaField
                id={`ac-reason-${record.id}`}
                label="Reason"
                value={record.reason}
                onChange={(next) => setAuditorChange(index, 'reason', next)}
              />
              <TernaryField
                id={`ac-disagreement-${record.id}`}
                label="Disagreement with management"
                value={record.disagreementWithManagement}
                onChange={(next) => setAuditorChange(index, 'disagreementWithManagement', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="rs-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
