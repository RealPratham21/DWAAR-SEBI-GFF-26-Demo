'use client';

import { useMemo } from 'react';
import {
  CheckboxField,
  ComputedStat,
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/business-operations/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/business-operations/repeatable-card';
import { BusinessOperationsSectionActions } from '@/components/business-operations/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useBusinessOperations } from '@/lib/business-operations/context';
import {
  createEmptyCapacityRecord,
  createEmptyFacility,
  createEmptyOperatingProcessStep,
  createEmptyPlannedCapacity,
} from '@/lib/business-operations/defaults';
import { EM_DASH, formatPercent } from '@/lib/business-operations/format';
import {
  CAPACITY_METRIC_UNIT_LABELS,
  CAPACITY_METRIC_UNIT_OPTIONS,
  FACILITY_STATUS_LABELS,
  FACILITY_STATUS_OPTIONS,
  FACILITY_TENURE_OPTIONS,
  FACILITY_TYPE_LABELS,
  FACILITY_TYPE_OPTIONS,
  PLANNED_CAPACITY_STATUS_OPTIONS,
  PROCESS_EXECUTION_OPTIONS,
  SOURCE_STATUS_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  CapacityRecord,
  FacilitiesCapacityAndOperationalProcess,
  Facility,
  OperatingProcessStep,
  PlannedCapacity,
} from '@/lib/business-operations/types';

const SECTION_ID = 'facilities-capacity-operational-process' as const;

function facilityTypeLabel(value: string): string {
  if (!value) return 'Type not set';
  return FACILITY_TYPE_LABELS[value as keyof typeof FACILITY_TYPE_LABELS] ?? value;
}

function facilityStatusLabel(value: string): string {
  if (!value) return 'Status not set';
  return FACILITY_STATUS_LABELS[value as keyof typeof FACILITY_STATUS_LABELS] ?? value;
}

function metricUnitLabel(value: string): string {
  if (!value) return 'Unit not set';
  return CAPACITY_METRIC_UNIT_LABELS[value as keyof typeof CAPACITY_METRIC_UNIT_LABELS] ?? value;
}

function compareStepNumber(a: string, b: string): number {
  const aTrim = a.trim();
  const bTrim = b.trim();
  const aNum = Number(aTrim);
  const bNum = Number(bTrim);
  const aValid = aTrim !== '' && !Number.isNaN(aNum);
  const bValid = bTrim !== '' && !Number.isNaN(bNum);
  if (aValid && bValid && aNum !== bNum) return aNum - bNum;
  if (aValid && !bValid) return -1;
  if (!aValid && bValid) return 1;
  return aTrim.localeCompare(bTrim);
}

export function FacilitiesCapacityForm() {
  const { payload, updateSection, model } = useBusinessOperations();
  const value = payload.facilitiesCapacityAndOperationalProcess;
  const classifications = payload.businessProfileAndOperatingModel.businessClassifications;
  const isManufacturingPriority =
    classifications.includes('manufacturing') ||
    classifications.includes('contract-manufacturing');
  const isSoftwareEmphasis = classifications.includes('software-or-technology-platform');

  const facilityOptions = useMemo(
    () =>
      value.facilities.map((item, index) => ({
        value: item.id,
        label: item.name || `Facility ${index + 1}`,
      })),
    [value.facilities],
  );

  const utilisationById = useMemo(() => {
    const map = new Map(model.capacityUtilisation.map((row) => [row.id, row]));
    return map;
  }, [model.capacityUtilisation]);

  const orderedProcessSteps = useMemo(
    () =>
      value.operatingProcessSteps
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const byStep = compareStepNumber(a.item.stepNumber, b.item.stepNumber);
          return byStep !== 0 ? byStep : a.index - b.index;
        }),
    [value.operatingProcessSteps],
  );

  const set = <K extends keyof FacilitiesCapacityAndOperationalProcess>(
    key: K,
    next: FacilitiesCapacityAndOperationalProcess[K],
  ) => {
    updateSection('facilitiesCapacityAndOperationalProcess', { ...value, [key]: next }, SECTION_ID);
  };

  const setFacility = <K extends keyof Facility>(index: number, key: K, next: Facility[K]) => {
    set('facilities', replaceAt(value.facilities, index, { ...value.facilities[index], [key]: next }));
  };

  const setCapacity = <K extends keyof CapacityRecord>(
    index: number,
    key: K,
    next: CapacityRecord[K],
  ) => {
    set(
      'capacityRecords',
      replaceAt(value.capacityRecords, index, { ...value.capacityRecords[index], [key]: next }),
    );
  };

  const setPlanned = <K extends keyof PlannedCapacity>(
    index: number,
    key: K,
    next: PlannedCapacity[K],
  ) => {
    set(
      'plannedCapacityItems',
      replaceAt(value.plannedCapacityItems, index, {
        ...value.plannedCapacityItems[index],
        [key]: next,
      }),
    );
  };

  const setProcessStep = <K extends keyof OperatingProcessStep>(
    index: number,
    key: K,
    next: OperatingProcessStep[K],
  ) => {
    set(
      'operatingProcessSteps',
      replaceAt(value.operatingProcessSteps, index, {
        ...value.operatingProcessSteps[index],
        [key]: next,
      }),
    );
  };

  const linkFacility = (
    facilityId: string,
  ): { facilityId: string; facilityName: string } => {
    const facility = value.facilities.find((row) => row.id === facilityId);
    return {
      facilityId,
      facilityName: facility?.name ?? '',
    };
  };

  return (
    <SectionCard
      title="Facilities, Capacity & Operational Process"
      description="Facilities, capacity utilisation, planned capacity, process flow and utilities."
    >
      <div className="space-y-6">
        {isManufacturingPriority ? (
          <p
            role="status"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Manufacturing classification is selected — capacity records and facility coverage are a
            priority for this profile. Existing entries are kept even if classifications change.
          </p>
        ) : null}
        {isSoftwareEmphasis ? (
          <p
            role="status"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Software / technology platform classification is selected — prefer capacity metrics such
            as active users, seats or transactions, and ensure hosting-related dependencies are
            covered in Technology. Stored capacity and facility values are never cleared by this
            note.
          </p>
        ) : null}

        <RepeatableList
          title="Facilities"
          description="All operating locations: plants, offices, warehouses, data centres and other sites."
          addLabel="Add facility"
          count={value.facilities.length}
          emptyMessage="No facility recorded yet."
          onAdd={() => set('facilities', [...value.facilities, createEmptyFacility()])}
        >
          {value.facilities.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.name || `Facility ${index + 1}`}
              subtitle={`${facilityTypeLabel(item.facilityType)} · ${facilityStatusLabel(item.status)}`}
              requiresConfirmation={hasRecordData([
                item.name,
                item.facilityType,
                item.address,
                item.stateOrCountry,
              ])}
              confirmMessage="Remove this facility? Capacity, planned capacity and process steps linked to it keep their text name but lose the id link."
              onRemove={() => set('facilities', removeAt(value.facilities, index))}
            >
              <FieldGrid>
                <TextInputField
                  id={`facility-${index}-name`}
                  label="Name"
                  required
                  value={item.name}
                  onChange={(next) => setFacility(index, 'name', next)}
                />
                <SelectField
                  id={`facility-${index}-type`}
                  label="Facility type"
                  value={item.facilityType}
                  onChange={(next) =>
                    setFacility(index, 'facilityType', next as Facility['facilityType'])
                  }
                  options={FACILITY_TYPE_OPTIONS}
                />
                <TextInputField
                  id={`facility-${index}-state`}
                  label="State or country"
                  value={item.stateOrCountry}
                  onChange={(next) => setFacility(index, 'stateOrCountry', next)}
                />
                <SelectField
                  id={`facility-${index}-tenure`}
                  label="Tenure"
                  value={item.tenure}
                  onChange={(next) => setFacility(index, 'tenure', next as Facility['tenure'])}
                  options={FACILITY_TENURE_OPTIONS}
                />
                <DateField
                  id={`facility-${index}-operational-since`}
                  label="Operational since"
                  value={item.operationalSince}
                  onChange={(next) => setFacility(index, 'operationalSince', next)}
                />
                <SelectField
                  id={`facility-${index}-status`}
                  label="Status"
                  value={item.status}
                  onChange={(next) => setFacility(index, 'status', next as Facility['status'])}
                  options={FACILITY_STATUS_OPTIONS}
                />
                <TextInputField
                  id={`facility-${index}-area`}
                  label="Area"
                  value={item.area}
                  onChange={(next) => setFacility(index, 'area', next)}
                  helper="Free-text area with unit (for example 50,000 sq ft)."
                />
                <DecimalInputField
                  id={`facility-${index}-shifts`}
                  label="Number of shifts"
                  value={item.numberOfShifts}
                  onChange={(next) => setFacility(index, 'numberOfShifts', next)}
                />
                <DecimalInputField
                  id={`facility-${index}-workforce`}
                  label="Workforce count"
                  value={item.workforceCount}
                  onChange={(next) => setFacility(index, 'workforceCount', next)}
                />
                <DateField
                  id={`facility-${index}-lease-expiry`}
                  label="Lease expiry"
                  value={item.leaseExpiry}
                  onChange={(next) => setFacility(index, 'leaseExpiry', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`facility-${index}-address`}
                label="Address"
                value={item.address}
                onChange={(next) => setFacility(index, 'address', next)}
              />
              <TextAreaField
                id={`facility-${index}-functions`}
                label="Main functions"
                value={item.mainFunctions}
                onChange={(next) => setFacility(index, 'mainFunctions', next)}
              />
              <TextAreaField
                id={`facility-${index}-products`}
                label="Products / services supported"
                value={item.productsServicesSupported}
                onChange={(next) => setFacility(index, 'productsServicesSupported', next)}
              />
              <TextAreaField
                id={`facility-${index}-licences`}
                label="Material licences required"
                value={item.materialLicencesRequired}
                onChange={(next) => setFacility(index, 'materialLicencesRequired', next)}
              />
              <TextAreaField
                id={`facility-${index}-notes`}
                label="Notes"
                value={item.notes}
                onChange={(next) => setFacility(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>

        <RepeatableList
          title="Capacity records"
          description="Installed, available and actual output by period. Utilisation is computed and never stored."
          addLabel="Add capacity record"
          count={value.capacityRecords.length}
          emptyMessage="No capacity record yet."
          onAdd={() => set('capacityRecords', [...value.capacityRecords, createEmptyCapacityRecord()])}
        >
          {value.capacityRecords.map((item, index) => {
            const utilisation = utilisationById.get(item.id);
            return (
              <RepeatableCard
                key={item.id}
                title={
                  item.facilityName ||
                  facilityOptions.find((option) => option.value === item.facilityId)?.label ||
                  `Capacity record ${index + 1}`
                }
                subtitle={`${item.periodLabel || 'Period not set'} · ${metricUnitLabel(item.metricOrCapacityUnit)}`}
                requiresConfirmation={hasRecordData([
                  item.facilityName,
                  item.periodLabel,
                  item.installedCapacity,
                  item.actualOutput,
                ])}
                onRemove={() => set('capacityRecords', removeAt(value.capacityRecords, index))}
              >
                <FieldGrid>
                  <SelectField
                    id={`capacity-${index}-facility`}
                    label="Facility"
                    value={item.facilityId}
                    onChange={(next) => {
                      const linked = linkFacility(next);
                      set(
                        'capacityRecords',
                        replaceAt(value.capacityRecords, index, {
                          ...item,
                          ...linked,
                        }),
                      );
                    }}
                    options={facilityOptions}
                    emptyLabel="Not linked"
                    helper="Optional link to a facility above. Name is copied for display."
                  />
                  <TextInputField
                    id={`capacity-${index}-facility-name`}
                    label="Facility name"
                    value={item.facilityName}
                    onChange={(next) => setCapacity(index, 'facilityName', next)}
                    helper="Free-text fallback when no facility is linked."
                  />
                  <TextInputField
                    id={`capacity-${index}-period`}
                    label="Period label"
                    value={item.periodLabel}
                    onChange={(next) => setCapacity(index, 'periodLabel', next)}
                    helper="For example FY 2024-25 or Q1 FY26."
                  />
                  <CheckboxField
                    id={`capacity-${index}-current`}
                    label="Current period"
                    checked={item.isCurrentPeriod}
                    onChange={(next) => setCapacity(index, 'isCurrentPeriod', next)}
                  />
                  <SelectField
                    id={`capacity-${index}-metric`}
                    label="Capacity metric / unit"
                    value={item.metricOrCapacityUnit}
                    onChange={(next) =>
                      setCapacity(
                        index,
                        'metricOrCapacityUnit',
                        next as CapacityRecord['metricOrCapacityUnit'],
                      )
                    }
                    options={CAPACITY_METRIC_UNIT_OPTIONS}
                  />
                  <TextInputField
                    id={`capacity-${index}-metric-description`}
                    label="Metric description"
                    value={item.metricDescription}
                    onChange={(next) => setCapacity(index, 'metricDescription', next)}
                  />
                  <DecimalInputField
                    id={`capacity-${index}-installed`}
                    label="Installed capacity"
                    value={item.installedCapacity}
                    onChange={(next) => setCapacity(index, 'installedCapacity', next)}
                  />
                  <DecimalInputField
                    id={`capacity-${index}-available`}
                    label="Available capacity"
                    value={item.availableCapacity}
                    onChange={(next) => setCapacity(index, 'availableCapacity', next)}
                    helper="Used as the utilisation denominator when provided; otherwise installed capacity."
                  />
                  <DecimalInputField
                    id={`capacity-${index}-actual`}
                    label="Actual output"
                    value={item.actualOutput}
                    onChange={(next) => setCapacity(index, 'actualOutput', next)}
                  />
                  <DecimalInputField
                    id={`capacity-${index}-shifts`}
                    label="Number of shifts"
                    value={item.numberOfShifts}
                    onChange={(next) => setCapacity(index, 'numberOfShifts', next)}
                  />
                  <DecimalInputField
                    id={`capacity-${index}-bottleneck`}
                    label="Bottleneck capacity"
                    value={item.bottleneckCapacity}
                    onChange={(next) => setCapacity(index, 'bottleneckCapacity', next)}
                  />
                  <SelectField
                    id={`capacity-${index}-source`}
                    label="Source status"
                    value={item.sourceStatus}
                    onChange={(next) =>
                      setCapacity(index, 'sourceStatus', next as CapacityRecord['sourceStatus'])
                    }
                    options={SOURCE_STATUS_OPTIONS}
                  />
                </FieldGrid>
                <StatGrid title="Computed utilisation (not persisted)">
                  <ComputedStat
                    label="Utilisation"
                    value={formatPercent(utilisation?.utilisationPercentage)}
                  />
                  <ComputedStat
                    label="Raw utilisation"
                    value={formatPercent(utilisation?.rawUtilisationPercentage)}
                  />
                  <ComputedStat
                    label="Exceeds 100%"
                    value={utilisation?.exceeds100 ? 'Yes' : utilisation ? 'No' : EM_DASH}
                  />
                </StatGrid>
                {utilisation?.exceeds100 ? (
                  <TextAreaField
                    id={`capacity-${index}-over-100`}
                    label="Explanation for utilisation above 100%"
                    required
                    value={item.utilisationAbove100Explanation}
                    onChange={(next) => setCapacity(index, 'utilisationAbove100Explanation', next)}
                    helper="Required when computed utilisation exceeds 100%."
                  />
                ) : (
                  <TextAreaField
                    id={`capacity-${index}-over-100`}
                    label="Explanation for utilisation above 100%"
                    value={item.utilisationAbove100Explanation}
                    onChange={(next) => setCapacity(index, 'utilisationAbove100Explanation', next)}
                    helper="Optional unless utilisation exceeds 100%."
                  />
                )}
                <TextAreaField
                  id={`capacity-${index}-notes`}
                  label="Notes"
                  value={item.notes}
                  onChange={(next) => setCapacity(index, 'notes', next)}
                />
              </RepeatableCard>
            );
          })}
        </RepeatableList>

        <RepeatableList
          title="Planned capacity"
          description="Capacity additions under planning, approval or implementation."
          addLabel="Add planned capacity"
          count={value.plannedCapacityItems.length}
          emptyMessage="No planned capacity item yet."
          onAdd={() =>
            set('plannedCapacityItems', [
              ...value.plannedCapacityItems,
              createEmptyPlannedCapacity(),
            ])
          }
        >
          {value.plannedCapacityItems.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.description || `Planned capacity ${index + 1}`}
              subtitle={item.expectedCommissioningPeriod || 'Commissioning period not set'}
              requiresConfirmation={hasRecordData([
                item.description,
                item.capacityBeingAdded,
                item.expectedCommissioningPeriod,
              ])}
              onRemove={() =>
                set('plannedCapacityItems', removeAt(value.plannedCapacityItems, index))
              }
            >
              <FieldGrid>
                <TextInputField
                  id={`planned-${index}-description`}
                  label="Description"
                  value={item.description}
                  onChange={(next) => setPlanned(index, 'description', next)}
                />
                <SelectField
                  id={`planned-${index}-facility`}
                  label="Facility"
                  value={item.facilityId}
                  onChange={(next) => {
                    const linked = linkFacility(next);
                    set(
                      'plannedCapacityItems',
                      replaceAt(value.plannedCapacityItems, index, {
                        ...item,
                        ...linked,
                      }),
                    );
                  }}
                  options={facilityOptions}
                  emptyLabel="Not linked"
                />
                <TextInputField
                  id={`planned-${index}-facility-name`}
                  label="Facility name"
                  value={item.facilityName}
                  onChange={(next) => setPlanned(index, 'facilityName', next)}
                />
                <TextInputField
                  id={`planned-${index}-capacity-added`}
                  label="Capacity being added"
                  value={item.capacityBeingAdded}
                  onChange={(next) => setPlanned(index, 'capacityBeingAdded', next)}
                />
                <TextInputField
                  id={`planned-${index}-commissioning`}
                  label="Expected commissioning period"
                  value={item.expectedCommissioningPeriod}
                  onChange={(next) => setPlanned(index, 'expectedCommissioningPeriod', next)}
                />
                <SelectField
                  id={`planned-${index}-status`}
                  label="Status"
                  value={item.status}
                  onChange={(next) =>
                    setPlanned(index, 'status', next as PlannedCapacity['status'])
                  }
                  options={PLANNED_CAPACITY_STATUS_OPTIONS}
                />
                <TextInputField
                  id={`planned-${index}-approval`}
                  label="Approval status"
                  value={item.approvalStatus}
                  onChange={(next) => setPlanned(index, 'approvalStatus', next)}
                />
                <TextInputField
                  id={`planned-${index}-funding`}
                  label="Funding source"
                  value={item.fundingSource}
                  onChange={(next) => setPlanned(index, 'fundingSource', next)}
                />
                <TextInputField
                  id={`planned-${index}-objects`}
                  label="Related objects of the issue reference"
                  value={item.relatedObjectsOfTheIssueReference}
                  onChange={(next) => setPlanned(index, 'relatedObjectsOfTheIssueReference', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`planned-${index}-dependencies`}
                label="Key dependencies"
                value={item.keyDependencies}
                onChange={(next) => setPlanned(index, 'keyDependencies', next)}
              />
              <TextAreaField
                id={`planned-${index}-notes`}
                label="Notes"
                value={item.notes}
                onChange={(next) => setPlanned(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>

        <RepeatableList
          title="Operating process steps"
          description="Ordered process flow. Steps are shown by step number; you can edit the number freely."
          addLabel="Add process step"
          count={value.operatingProcessSteps.length}
          emptyMessage="No process step recorded yet."
          onAdd={() =>
            set('operatingProcessSteps', [
              ...value.operatingProcessSteps,
              createEmptyOperatingProcessStep(),
            ])
          }
        >
          {orderedProcessSteps.map(({ item, index }) => (
            <RepeatableCard
              key={item.id}
              title={item.processName || `Process step ${item.stepNumber || index + 1}`}
              subtitle={
                item.stepNumber.trim()
                  ? `Step ${item.stepNumber}`
                  : 'Step number not set'
              }
              requiresConfirmation={hasRecordData([
                item.processName,
                item.description,
                item.input,
                item.output,
              ])}
              onRemove={() =>
                set('operatingProcessSteps', removeAt(value.operatingProcessSteps, index))
              }
            >
              <FieldGrid>
                <DecimalInputField
                  id={`process-${index}-number`}
                  label="Step number"
                  value={item.stepNumber}
                  onChange={(next) => setProcessStep(index, 'stepNumber', next)}
                  helper="Used only for display order. Changing it reorders the list."
                />
                <TextInputField
                  id={`process-${index}-name`}
                  label="Process name"
                  value={item.processName}
                  onChange={(next) => setProcessStep(index, 'processName', next)}
                />
                <SelectField
                  id={`process-${index}-facility`}
                  label="Facility"
                  value={item.facilityId}
                  onChange={(next) => {
                    const linked = linkFacility(next);
                    set(
                      'operatingProcessSteps',
                      replaceAt(value.operatingProcessSteps, index, {
                        ...item,
                        ...linked,
                      }),
                    );
                  }}
                  options={facilityOptions}
                  emptyLabel="Not linked"
                />
                <TextInputField
                  id={`process-${index}-facility-name`}
                  label="Facility name"
                  value={item.facilityName}
                  onChange={(next) => setProcessStep(index, 'facilityName', next)}
                />
                <SelectField
                  id={`process-${index}-execution`}
                  label="Execution model"
                  value={item.executionModel}
                  onChange={(next) =>
                    setProcessStep(
                      index,
                      'executionModel',
                      next as OperatingProcessStep['executionModel'],
                    )
                  }
                  options={PROCESS_EXECUTION_OPTIONS}
                />
                <TernaryField
                  id={`process-${index}-quality`}
                  label="Quality checkpoint"
                  value={item.qualityCheckpoint}
                  onChange={(next) => setProcessStep(index, 'qualityCheckpoint', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`process-${index}-description`}
                label="Description"
                value={item.description}
                onChange={(next) => setProcessStep(index, 'description', next)}
              />
              <FieldGrid>
                <TextAreaField
                  id={`process-${index}-input`}
                  label="Input"
                  value={item.input}
                  onChange={(next) => setProcessStep(index, 'input', next)}
                />
                <TextAreaField
                  id={`process-${index}-output`}
                  label="Output"
                  value={item.output}
                  onChange={(next) => setProcessStep(index, 'output', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`process-${index}-technology`}
                label="Technology or machinery"
                value={item.technologyOrMachinery}
                onChange={(next) => setProcessStep(index, 'technologyOrMachinery', next)}
              />
              <TextAreaField
                id={`process-${index}-notes`}
                label="Notes"
                value={item.notes}
                onChange={(next) => setProcessStep(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>

        <SubSection
          title="Utilities & infrastructure dependencies"
          description="Electricity, water, fuel, connectivity, waste and backup arrangements."
        >
          <FieldGrid>
            <TernaryField
              id="electricity-dependency"
              label="Electricity dependency"
              value={value.electricityDependency}
              onChange={(next) => set('electricityDependency', next)}
            />
            <TernaryField
              id="captive-power"
              label="Captive power available"
              value={value.captivePowerAvailable}
              onChange={(next) => set('captivePowerAvailable', next)}
            />
            <TernaryField
              id="water-dependency"
              label="Water dependency"
              value={value.waterDependency}
              onChange={(next) => set('waterDependency', next)}
            />
            <TernaryField
              id="fuel-dependency"
              label="Fuel dependency"
              value={value.fuelDependency}
              onChange={(next) => set('fuelDependency', next)}
            />
            <TernaryField
              id="internet-dependency"
              label="Internet or data infrastructure dependency"
              value={value.internetOrDataInfrastructureDependency}
              onChange={(next) => set('internetOrDataInfrastructureDependency', next)}
            />
            <TernaryField
              id="utility-interruptions"
              label="Utility interruptions experienced"
              value={value.utilityInterruptionsExperienced}
              onChange={(next) => set('utilityInterruptionsExperienced', next)}
            />
            <TernaryField
              id="utility-constraints"
              label="Utility capacity constraints"
              value={value.utilityCapacityConstraints}
              onChange={(next) => set('utilityCapacityConstraints', next)}
            />
          </FieldGrid>
          <TextAreaField
            id="waste-management"
            label="Waste management arrangements"
            value={value.wasteManagementArrangements}
            onChange={(next) => set('wasteManagementArrangements', next)}
          />
          <TextAreaField
            id="utility-backup"
            label="Utility backup arrangements"
            value={value.utilityBackupArrangements}
            onChange={(next) => set('utilityBackupArrangements', next)}
          />
          <TextAreaField
            id="utility-interruptions-details"
            label="Utility interruptions details"
            value={value.utilityInterruptionsDetails}
            onChange={(next) => set('utilityInterruptionsDetails', next)}
          />
          <TextAreaField
            id="utility-constraint-details"
            label="Utility capacity constraint details"
            value={value.utilityCapacityConstraintDetails}
            onChange={(next) => set('utilityCapacityConstraintDetails', next)}
          />
        </SubSection>

        <TextAreaField
          id="facilities-section-notes"
          label="Section notes"
          value={value.notes}
          onChange={(next) => set('notes', next)}
        />

        <BusinessOperationsSectionActions sectionId={SECTION_ID} />
      </div>
    </SectionCard>
  );
}
