'use client';

import {
  CheckboxField,
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
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
import { createEmptyBusinessUnit } from '@/lib/business-operations/defaults';
import {
  BUSINESS_CLASSIFICATION_OPTIONS,
  BUSINESS_UNIT_STATUS_OPTIONS,
  CUSTOMER_MODEL_OPTIONS,
  ORDER_MODEL_OPTIONS,
  REVENUE_MODEL_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  BusinessClassification,
  BusinessProfileAndOperatingModel,
  BusinessUnit,
  CustomerModel,
  OrderModel,
  RevenueModel,
} from '@/lib/business-operations/types';

const SECTION_ID = 'business-profile-operating-model' as const;

function toggleMembership<T extends string>(values: T[], option: T, checked: boolean): T[] {
  if (checked) {
    return values.includes(option) ? values : [...values, option];
  }
  return values.filter((value) => value !== option);
}

export function BusinessProfileForm() {
  const { payload, updateSection } = useBusinessOperations();
  const value = payload.businessProfileAndOperatingModel;

  const set = <K extends keyof BusinessProfileAndOperatingModel>(
    key: K,
    next: BusinessProfileAndOperatingModel[K],
  ) => {
    updateSection('businessProfileAndOperatingModel', { ...value, [key]: next }, SECTION_ID);
  };

  const setUnit = <K extends keyof BusinessUnit>(
    index: number,
    key: K,
    next: BusinessUnit[K],
  ) => {
    set(
      'businessUnits',
      replaceAt(value.businessUnits, index, { ...value.businessUnits[index], [key]: next }),
    );
  };

  const classifications = value.businessClassifications;
  const showsManufacturingNote = classifications.includes('manufacturing');
  const showsSoftwareNote = classifications.includes('software-or-technology-platform');

  return (
    <SectionCard
      title="Business Profile & Operating Model"
      description="Commencement, classifications, customer and revenue models, geography and business units."
    >
      <FieldGrid>
        <DateField
          id="bp-commencement-date"
          label="Business commencement date"
          required
          value={value.businessCommencementDate}
          onChange={(next) => set('businessCommencementDate', next)}
        />
        <SelectField
          id="bp-customer-model"
          label="Customer model"
          required
          value={value.customerModel}
          onChange={(next) => set('customerModel', next as CustomerModel | '')}
          options={CUSTOMER_MODEL_OPTIONS}
        />
        <SelectField
          id="bp-order-model"
          label="Order model"
          value={value.orderModel}
          onChange={(next) => set('orderModel', next as OrderModel | '')}
          options={ORDER_MODEL_OPTIONS}
        />
      </FieldGrid>

      <SubSection
        title="Business classifications"
        description="Select every classification that applies. Stored values are kept even when related notes appear below."
      >
        <div className="grid gap-3 md:grid-cols-2" role="group" aria-label="Business classifications">
          {BUSINESS_CLASSIFICATION_OPTIONS.map((option) => (
            <CheckboxField
              key={option.value}
              id={`bp-classification-${option.value}`}
              label={option.label}
              checked={classifications.includes(option.value as BusinessClassification)}
              onChange={(checked) =>
                set(
                  'businessClassifications',
                  toggleMembership(
                    classifications,
                    option.value as BusinessClassification,
                    checked,
                  ),
                )
              }
            />
          ))}
        </div>
        {classifications.includes('other') ? (
          <TextAreaField
            id="bp-other-classification-details"
            label="Other classification — details"
            required
            rows={2}
            value={value.otherBusinessClassificationDetails}
            onChange={(next) => set('otherBusinessClassificationDetails', next)}
          />
        ) : null}
        {showsManufacturingNote ? (
          <p
            role="note"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Manufacturing is selected — capacity and machinery sections will emphasise manufacturing
            detail. Existing entries elsewhere are not hidden.
          </p>
        ) : null}
        {showsSoftwareNote ? (
          <p
            role="note"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Software or technology platform is selected — technology, hosting and IP fields will
            receive more emphasis. Existing entries elsewhere are not hidden.
          </p>
        ) : null}
      </SubSection>

      <SubSection title="Activity and overview">
        <TextInputField
          id="bp-primary-activity"
          label="Primary business activity"
          required
          value={value.primaryBusinessActivity}
          onChange={(next) => set('primaryBusinessActivity', next)}
        />
        <TextAreaField
          id="bp-secondary-activities"
          label="Secondary business activities"
          rows={2}
          value={value.secondaryBusinessActivities}
          onChange={(next) => set('secondaryBusinessActivities', next)}
        />
        <TextAreaField
          id="bp-brief-overview"
          label="Brief business overview"
          required
          rows={4}
          value={value.briefBusinessOverview}
          onChange={(next) => set('briefBusinessOverview', next)}
        />
        <TextAreaField
          id="bp-value-chain-position"
          label="Position in the value chain"
          rows={2}
          value={value.positionInValueChain}
          onChange={(next) => set('positionInValueChain', next)}
        />
        <TextAreaField
          id="bp-value-creation"
          label="Value creation and delivery — explanation"
          rows={3}
          value={value.valueCreationAndDeliveryExplanation}
          onChange={(next) => set('valueCreationAndDeliveryExplanation', next)}
        />
      </SubSection>

      <SubSection
        title="Revenue models"
        description="How the issuer earns revenue from its principal activities."
      >
        <div className="grid gap-3 md:grid-cols-2" role="group" aria-label="Revenue models">
          {REVENUE_MODEL_OPTIONS.map((option) => (
            <CheckboxField
              key={option.value}
              id={`bp-revenue-model-${option.value}`}
              label={option.label}
              checked={value.revenueModels.includes(option.value as RevenueModel)}
              onChange={(checked) =>
                set(
                  'revenueModels',
                  toggleMembership(value.revenueModels, option.value as RevenueModel, checked),
                )
              }
            />
          ))}
        </div>
        {value.revenueModels.includes('other') ? (
          <TextAreaField
            id="bp-other-revenue-model-details"
            label="Other revenue model — details"
            required
            rows={2}
            value={value.otherRevenueModelDetails}
            onChange={(next) => set('otherRevenueModelDetails', next)}
          />
        ) : null}
      </SubSection>

      <SubSection title="Geography, seasonality and dependencies">
        <FieldGrid>
          <TernaryField
            id="bp-domestic-operations"
            label="Domestic operations"
            required
            value={value.domesticOperations}
            onChange={(next) => set('domesticOperations', next)}
          />
          <TernaryField
            id="bp-export-operations"
            label="Export operations"
            required
            value={value.exportOperations}
            onChange={(next) => set('exportOperations', next)}
          />
          <TernaryField
            id="bp-seasonality"
            label="Seasonality or cyclicality"
            value={value.seasonalityOrCyclicality}
            onChange={(next) => set('seasonalityOrCyclicality', next)}
          />
          <TernaryField
            id="bp-working-capital-intensive"
            label="Working-capital intensive business"
            value={value.workingCapitalIntensiveBusiness}
            onChange={(next) => set('workingCapitalIntensiveBusiness', next)}
          />
          <TernaryField
            id="bp-third-party-dependence"
            label="Material third-party dependence"
            value={value.materialThirdPartyDependence}
            onChange={(next) => set('materialThirdPartyDependence', next)}
          />
          <TernaryField
            id="bp-regulatory-dependence"
            label="Material regulatory dependence"
            value={value.materialRegulatoryDependence}
            onChange={(next) => set('materialRegulatoryDependence', next)}
          />
        </FieldGrid>

        <TextAreaField
          id="bp-regions-served"
          label="Regions / countries served"
          rows={2}
          value={value.regionsCountriesServed}
          onChange={(next) => set('regionsCountriesServed', next)}
        />

        {value.seasonalityOrCyclicality === 'yes' ||
        value.seasonalityOrCyclicality === 'not_sure' ? (
          <TextAreaField
            id="bp-seasonality-details"
            label="Seasonality or cyclicality — details"
            required={value.seasonalityOrCyclicality === 'yes'}
            rows={2}
            value={value.seasonalityDetails}
            onChange={(next) => set('seasonalityDetails', next)}
          />
        ) : null}

        {value.materialThirdPartyDependence === 'yes' ||
        value.materialThirdPartyDependence === 'not_sure' ? (
          <TextAreaField
            id="bp-third-party-dependence-details"
            label="Material third-party dependence — details"
            required={value.materialThirdPartyDependence === 'yes'}
            rows={2}
            value={value.materialThirdPartyDependenceDetails}
            onChange={(next) => set('materialThirdPartyDependenceDetails', next)}
          />
        ) : null}

        {value.materialRegulatoryDependence === 'yes' ||
        value.materialRegulatoryDependence === 'not_sure' ? (
          <TextAreaField
            id="bp-regulatory-dependence-details"
            label="Material regulatory dependence — details"
            required={value.materialRegulatoryDependence === 'yes'}
            rows={2}
            value={value.materialRegulatoryDependenceDetails}
            onChange={(next) => set('materialRegulatoryDependenceDetails', next)}
          />
        ) : null}
      </SubSection>

      <RepeatableList
        title="Business units"
        description="Operating units, segments or divisions that materially contribute to the business."
        addLabel="Add business unit"
        count={value.businessUnits.length}
        emptyMessage="No business unit recorded yet."
        onAdd={() => set('businessUnits', [...value.businessUnits, createEmptyBusinessUnit()])}
      >
        {value.businessUnits.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.unitName || `Business unit ${index + 1}`}
            subtitle={item.geography || undefined}
            requiresConfirmation={hasRecordData([
              item.unitName,
              item.description,
              item.activity,
              item.revenueContributionPercentage,
            ])}
            confirmMessage="Remove this business unit? Entered values will be lost."
            onRemove={() => set('businessUnits', removeAt(value.businessUnits, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`bp-unit-${index}-name`}
                label="Unit name"
                required
                value={item.unitName}
                onChange={(next) => setUnit(index, 'unitName', next)}
              />
              <SelectField
                id={`bp-unit-${index}-status`}
                label="Status"
                value={item.status}
                onChange={(next) => setUnit(index, 'status', next as BusinessUnit['status'])}
                options={BUSINESS_UNIT_STATUS_OPTIONS}
              />
              <DateField
                id={`bp-unit-${index}-commencement`}
                label="Commencement date"
                value={item.commencementDate}
                onChange={(next) => setUnit(index, 'commencementDate', next)}
              />
              <DecimalInputField
                id={`bp-unit-${index}-revenue-pct`}
                label="Revenue contribution (%)"
                value={item.revenueContributionPercentage}
                onChange={(next) => setUnit(index, 'revenueContributionPercentage', next)}
              />
              <TextInputField
                id={`bp-unit-${index}-geography`}
                label="Geography"
                value={item.geography}
                onChange={(next) => setUnit(index, 'geography', next)}
              />
              <TextInputField
                id={`bp-unit-${index}-activity`}
                label="Activity"
                value={item.activity}
                onChange={(next) => setUnit(index, 'activity', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`bp-unit-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setUnit(index, 'description', next)}
            />
            <TextAreaField
              id={`bp-unit-${index}-products`}
              label="Products / services covered"
              rows={2}
              value={item.productsServicesCovered}
              onChange={(next) => setUnit(index, 'productsServicesCovered', next)}
            />
            <TextAreaField
              id={`bp-unit-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setUnit(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="bp-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <BusinessOperationsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
