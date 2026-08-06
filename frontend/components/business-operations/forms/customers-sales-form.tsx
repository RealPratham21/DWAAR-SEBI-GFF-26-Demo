'use client';

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
  removeAt,
  RepeatableCard,
  RepeatableList,
  replaceAt,
} from '@/components/business-operations/repeatable-card';
import { BusinessOperationsSectionActions } from '@/components/business-operations/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useBusinessOperations } from '@/lib/business-operations/context';
import {
  createEmptyCustomerConcentrationPeriod,
  createEmptyGeographicRevenue,
  createEmptyMaterialCustomer,
  createEmptySalesChannel,
} from '@/lib/business-operations/defaults';
import {
  EM_DASH,
  formatMoneyCompact,
  formatPercent,
} from '@/lib/business-operations/format';
import {
  DISCLOSURE_CONSENT_OPTIONS,
  FIGURE_SOURCE_OPTIONS,
  GEOGRAPHIC_SCOPE_LABELS,
  GEOGRAPHIC_SCOPE_OPTIONS,
  ORDER_BOOK_SECURITY_OPTIONS,
  SALES_CHANNEL_TYPE_LABELS,
  SALES_CHANNEL_TYPE_OPTIONS,
  SOURCE_STATUS_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  CustomerConcentrationPeriod,
  CustomersSalesDistributionAndGeography,
  GeographicRevenue,
  MaterialCustomer,
  SalesChannel,
} from '@/lib/business-operations/types';

const SECTION_ID = 'customers-sales-distribution-geography' as const;

function salesChannelLabel(channelType: string): string {
  if (!channelType) return 'Channel type not set';
  return (
    SALES_CHANNEL_TYPE_LABELS[channelType as keyof typeof SALES_CHANNEL_TYPE_LABELS] ??
    channelType
  );
}

function geographicScopeLabel(scope: string): string {
  if (!scope) return 'Scope not set';
  return GEOGRAPHIC_SCOPE_LABELS[scope as keyof typeof GEOGRAPHIC_SCOPE_LABELS] ?? scope;
}

export function CustomersSalesForm() {
  const { payload, updateSection, model } = useBusinessOperations();
  const value = payload.customersSalesDistributionAndGeography;

  const currentConcentration =
    model.customerConcentration.find((row) => row.isCurrentPeriod) ??
    model.customerConcentration[0] ??
    null;

  const set = <K extends keyof CustomersSalesDistributionAndGeography>(
    key: K,
    next: CustomersSalesDistributionAndGeography[K],
  ) => {
    updateSection(
      'customersSalesDistributionAndGeography',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setConcentration = <K extends keyof CustomerConcentrationPeriod>(
    index: number,
    key: K,
    next: CustomerConcentrationPeriod[K],
  ) => {
    set(
      'customerConcentrationPeriods',
      replaceAt(value.customerConcentrationPeriods, index, {
        ...value.customerConcentrationPeriods[index],
        [key]: next,
      }),
    );
  };

  const setMaterialCustomer = <K extends keyof MaterialCustomer>(
    index: number,
    key: K,
    next: MaterialCustomer[K],
  ) => {
    set(
      'materialCustomers',
      replaceAt(value.materialCustomers, index, {
        ...value.materialCustomers[index],
        [key]: next,
      }),
    );
  };

  const setSalesChannel = <K extends keyof SalesChannel>(
    index: number,
    key: K,
    next: SalesChannel[K],
  ) => {
    set(
      'salesChannels',
      replaceAt(value.salesChannels, index, {
        ...value.salesChannels[index],
        [key]: next,
      }),
    );
  };

  const setGeographicRevenue = <K extends keyof GeographicRevenue>(
    index: number,
    key: K,
    next: GeographicRevenue[K],
  ) => {
    set(
      'geographicRevenueRows',
      replaceAt(value.geographicRevenueRows, index, {
        ...value.geographicRevenueRows[index],
        [key]: next,
      }),
    );
  };

  const orderBookApplicable =
    value.orderBookAvailable === 'yes' || value.orderBookAvailable === 'not_sure';
  const orderBookNotApplicable = value.orderBookAvailable === 'no';

  return (
    <SectionCard
      title="Customers, Sales, Distribution & Geography"
      description="Customer profile, concentration, sales channels, geographic mix and order book."
    >
      <SubSection
        title="Customer profile"
        description="Active base, categories, relationship depth and commercial dependence."
      >
        <FieldGrid>
          <DecimalInputField
            id="customers-active-count"
            label="Approximate active customer count"
            value={value.approximateActiveCustomerCount}
            onChange={(next) => set('approximateActiveCustomerCount', next)}
          />
          <DecimalInputField
            id="customers-repeat-percentage"
            label="Repeat customer percentage"
            value={value.repeatCustomerPercentage}
            onChange={(next) => set('repeatCustomerPercentage', next)}
            helper="Share of revenue or customers that are repeat, as available."
          />
          <TextInputField
            id="customers-relationship-duration"
            label="Average relationship duration"
            value={value.averageRelationshipDuration}
            onChange={(next) => set('averageRelationshipDuration', next)}
            placeholder="e.g. 4–5 years"
          />
          <TextInputField
            id="customers-credit-terms"
            label="Credit terms"
            value={value.creditTerms}
            onChange={(next) => set('creditTerms', next)}
            placeholder="e.g. Net 30 / LC / advance"
          />
        </FieldGrid>
        <FieldGrid>
          <TextAreaField
            id="customers-categories"
            label="Customer categories"
            rows={2}
            value={value.customerCategories}
            onChange={(next) => set('customerCategories', next)}
            helper="e.g. OEMs, distributors, government, retail."
          />
          <TextAreaField
            id="customers-industries-served"
            label="Industries served"
            rows={2}
            value={value.industriesServed}
            onChange={(next) => set('industriesServed', next)}
          />
        </FieldGrid>
        <FieldGrid>
          <TernaryField
            id="customers-government-tender"
            label="Government / tender dependence"
            value={value.governmentTenderDependence}
            onChange={(next) => set('governmentTenderDependence', next)}
          />
          <TernaryField
            id="customers-large-enterprise"
            label="Large enterprise dependence"
            value={value.largeEnterpriseDependence}
            onChange={(next) => set('largeEnterpriseDependence', next)}
          />
          <TernaryField
            id="customers-long-term-contracts"
            label="Long-term contracts available"
            value={value.longTermContractsAvailable}
            onChange={(next) => set('longTermContractsAvailable', next)}
          />
          <TernaryField
            id="customers-purchase-order"
            label="Purchase-order dependence"
            value={value.purchaseOrderDependence}
            onChange={(next) => set('purchaseOrderDependence', next)}
          />
        </FieldGrid>
        <TextAreaField
          id="customers-returns-policy"
          label="Returns or cancellation policy"
          rows={2}
          value={value.returnsOrCancellationPolicy}
          onChange={(next) => set('returnsOrCancellationPolicy', next)}
        />
      </SubSection>

      <RepeatableList
        title="Customer concentration periods"
        description="Largest, top-3 / top-5 / top-10 contributions for each reporting period."
        addLabel="Add concentration period"
        count={value.customerConcentrationPeriods.length}
        emptyMessage="No customer concentration period recorded yet."
        onAdd={() =>
          set('customerConcentrationPeriods', [
            ...value.customerConcentrationPeriods,
            createEmptyCustomerConcentrationPeriod(),
          ])
        }
      >
        {value.customerConcentrationPeriods.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.periodLabel || `Concentration period ${index + 1}`}
            subtitle={item.isCurrentPeriod ? 'Current period' : undefined}
            requiresConfirmation={hasRecordData([
              item.periodLabel,
              item.largestCustomerRevenue,
              item.largestCustomerPercentage,
              item.top3Percentage,
              item.totalRevenueFromOperations,
            ])}
            confirmMessage="Remove this concentration period? Entered values will be lost."
            onRemove={() =>
              set(
                'customerConcentrationPeriods',
                removeAt(value.customerConcentrationPeriods, index),
              )
            }
          >
            <FieldGrid>
              <TextInputField
                id={`customer-concentration-${index}-period`}
                label="Period label"
                value={item.periodLabel}
                onChange={(next) => setConcentration(index, 'periodLabel', next)}
                placeholder="e.g. FY 2024-25"
              />
              <CheckboxField
                id={`customer-concentration-${index}-current`}
                label="Mark as current period"
                checked={item.isCurrentPeriod}
                onChange={(next) => setConcentration(index, 'isCurrentPeriod', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-largest-revenue`}
                label="Largest customer revenue (₹)"
                value={item.largestCustomerRevenue}
                onChange={(next) => setConcentration(index, 'largestCustomerRevenue', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-largest-pct`}
                label="Largest customer %"
                value={item.largestCustomerPercentage}
                onChange={(next) => setConcentration(index, 'largestCustomerPercentage', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-top3-revenue`}
                label="Top 3 revenue (₹)"
                value={item.top3Revenue}
                onChange={(next) => setConcentration(index, 'top3Revenue', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-top3-pct`}
                label="Top 3 %"
                value={item.top3Percentage}
                onChange={(next) => setConcentration(index, 'top3Percentage', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-top5-revenue`}
                label="Top 5 revenue (₹)"
                value={item.top5Revenue}
                onChange={(next) => setConcentration(index, 'top5Revenue', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-top5-pct`}
                label="Top 5 %"
                value={item.top5Percentage}
                onChange={(next) => setConcentration(index, 'top5Percentage', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-top10-revenue`}
                label="Top 10 revenue (₹)"
                value={item.top10Revenue}
                onChange={(next) => setConcentration(index, 'top10Revenue', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-top10-pct`}
                label="Top 10 %"
                value={item.top10Percentage}
                onChange={(next) => setConcentration(index, 'top10Percentage', next)}
              />
              <DecimalInputField
                id={`customer-concentration-${index}-total-revenue`}
                label="Total revenue from operations (₹)"
                value={item.totalRevenueFromOperations}
                onChange={(next) => setConcentration(index, 'totalRevenueFromOperations', next)}
              />
              <SelectField
                id={`customer-concentration-${index}-source`}
                label="Source"
                value={item.source}
                onChange={(next) =>
                  setConcentration(index, 'source', next as CustomerConcentrationPeriod['source'])
                }
                options={FIGURE_SOURCE_OPTIONS}
                emptyLabel="Not answered"
              />
            </FieldGrid>
            <TextAreaField
              id={`customer-concentration-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setConcentration(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Material customers"
        description="Named or confidential labels for material counterparties, with consent status."
        addLabel="Add material customer"
        count={value.materialCustomers.length}
        emptyMessage="No material customer recorded yet."
        onAdd={() =>
          set('materialCustomers', [...value.materialCustomers, createEmptyMaterialCustomer()])
        }
      >
        {value.materialCustomers.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.customerNameOrConfidentialLabel || `Material customer ${index + 1}`}
            subtitle={item.industry || item.country || undefined}
            requiresConfirmation={hasRecordData([
              item.customerNameOrConfidentialLabel,
              item.industry,
              item.country,
              item.revenueContributionPercentage,
              item.contractType,
              item.notes,
            ])}
            confirmMessage="Remove this material customer? Entered values will be lost."
            onRemove={() => set('materialCustomers', removeAt(value.materialCustomers, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`material-customer-${index}-name`}
                label="Customer name or confidential label"
                value={item.customerNameOrConfidentialLabel}
                onChange={(next) =>
                  setMaterialCustomer(index, 'customerNameOrConfidentialLabel', next)
                }
              />
              <TextInputField
                id={`material-customer-${index}-industry`}
                label="Industry"
                value={item.industry}
                onChange={(next) => setMaterialCustomer(index, 'industry', next)}
              />
              <TextInputField
                id={`material-customer-${index}-country`}
                label="Country"
                value={item.country}
                onChange={(next) => setMaterialCustomer(index, 'country', next)}
              />
              <TextInputField
                id={`material-customer-${index}-since`}
                label="Relationship since"
                value={item.relationshipSince}
                onChange={(next) => setMaterialCustomer(index, 'relationshipSince', next)}
                placeholder="e.g. 2018"
              />
              <DecimalInputField
                id={`material-customer-${index}-contribution`}
                label="Revenue contribution %"
                value={item.revenueContributionPercentage}
                onChange={(next) =>
                  setMaterialCustomer(index, 'revenueContributionPercentage', next)
                }
              />
              <TextInputField
                id={`material-customer-${index}-contract-type`}
                label="Contract type"
                value={item.contractType}
                onChange={(next) => setMaterialCustomer(index, 'contractType', next)}
              />
              <DateField
                id={`material-customer-${index}-expiry`}
                label="Contract expiry"
                value={item.contractExpiry}
                onChange={(next) => setMaterialCustomer(index, 'contractExpiry', next)}
              />
              <SelectField
                id={`material-customer-${index}-consent`}
                label="Disclosure consent status"
                value={item.disclosureConsentStatus}
                onChange={(next) =>
                  setMaterialCustomer(
                    index,
                    'disclosureConsentStatus',
                    next as MaterialCustomer['disclosureConsentStatus'],
                  )
                }
                options={DISCLOSURE_CONSENT_OPTIONS}
                emptyLabel="Not answered"
              />
            </FieldGrid>
            <TextAreaField
              id={`material-customer-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setMaterialCustomer(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Sales channels"
        description="Direct, distributor, online and other routes to market."
        addLabel="Add sales channel"
        count={value.salesChannels.length}
        emptyMessage="No sales channel recorded yet."
        onAdd={() => set('salesChannels', [...value.salesChannels, createEmptySalesChannel()])}
      >
        {value.salesChannels.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={salesChannelLabel(item.channelType)}
            subtitle={item.geography || undefined}
            requiresConfirmation={hasRecordData([
              item.channelType,
              item.geography,
              item.revenueContributionPercentage,
              item.commissionOrMarginStructure,
              item.creditTerms,
              item.notes,
            ])}
            confirmMessage="Remove this sales channel? Entered values will be lost."
            onRemove={() => set('salesChannels', removeAt(value.salesChannels, index))}
          >
            <FieldGrid>
              <SelectField
                id={`sales-channel-${index}-type`}
                label="Channel type"
                value={item.channelType}
                onChange={(next) =>
                  setSalesChannel(index, 'channelType', next as SalesChannel['channelType'])
                }
                options={SALES_CHANNEL_TYPE_OPTIONS}
                emptyLabel="Not answered"
              />
              <TextInputField
                id={`sales-channel-${index}-geography`}
                label="Geography"
                value={item.geography}
                onChange={(next) => setSalesChannel(index, 'geography', next)}
              />
              <DecimalInputField
                id={`sales-channel-${index}-contribution`}
                label="Revenue contribution %"
                value={item.revenueContributionPercentage}
                onChange={(next) => setSalesChannel(index, 'revenueContributionPercentage', next)}
              />
              <TextInputField
                id={`sales-channel-${index}-commission`}
                label="Commission or margin structure"
                value={item.commissionOrMarginStructure}
                onChange={(next) => setSalesChannel(index, 'commissionOrMarginStructure', next)}
              />
              <TernaryField
                id={`sales-channel-${index}-exclusivity`}
                label="Exclusivity"
                value={item.exclusivity}
                onChange={(next) => setSalesChannel(index, 'exclusivity', next)}
              />
              <TextInputField
                id={`sales-channel-${index}-credit`}
                label="Credit terms"
                value={item.creditTerms}
                onChange={(next) => setSalesChannel(index, 'creditTerms', next)}
              />
              <TernaryField
                id={`sales-channel-${index}-dependency`}
                label="Key dependency"
                value={item.keyDependency}
                onChange={(next) => setSalesChannel(index, 'keyDependency', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`sales-channel-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setSalesChannel(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Geographic revenue"
        description="Domestic, export, region and country revenue mix by period."
        addLabel="Add geographic revenue row"
        count={value.geographicRevenueRows.length}
        emptyMessage="No geographic revenue row recorded yet."
        onAdd={() =>
          set('geographicRevenueRows', [
            ...value.geographicRevenueRows,
            createEmptyGeographicRevenue(),
          ])
        }
      >
        {value.geographicRevenueRows.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={
              item.regionOrCountry ||
              geographicScopeLabel(item.geographicScope) ||
              `Geographic row ${index + 1}`
            }
            subtitle={[item.periodLabel, geographicScopeLabel(item.geographicScope)]
              .filter(Boolean)
              .join(' · ')}
            requiresConfirmation={hasRecordData([
              item.periodLabel,
              item.geographicScope,
              item.regionOrCountry,
              item.revenue,
              item.percentageOfRevenue,
              item.notes,
            ])}
            confirmMessage="Remove this geographic revenue row? Entered values will be lost."
            onRemove={() =>
              set('geographicRevenueRows', removeAt(value.geographicRevenueRows, index))
            }
          >
            <FieldGrid>
              <TextInputField
                id={`geo-revenue-${index}-period`}
                label="Period label"
                value={item.periodLabel}
                onChange={(next) => setGeographicRevenue(index, 'periodLabel', next)}
                placeholder="e.g. FY 2024-25"
              />
              <SelectField
                id={`geo-revenue-${index}-scope`}
                label="Geographic scope"
                value={item.geographicScope}
                onChange={(next) =>
                  setGeographicRevenue(
                    index,
                    'geographicScope',
                    next as GeographicRevenue['geographicScope'],
                  )
                }
                options={GEOGRAPHIC_SCOPE_OPTIONS}
                emptyLabel="Not answered"
              />
              <TextInputField
                id={`geo-revenue-${index}-region`}
                label="Region or country"
                value={item.regionOrCountry}
                onChange={(next) => setGeographicRevenue(index, 'regionOrCountry', next)}
              />
              <DecimalInputField
                id={`geo-revenue-${index}-revenue`}
                label="Revenue (₹)"
                value={item.revenue}
                onChange={(next) => setGeographicRevenue(index, 'revenue', next)}
              />
              <DecimalInputField
                id={`geo-revenue-${index}-pct`}
                label="% of revenue"
                value={item.percentageOfRevenue}
                onChange={(next) => setGeographicRevenue(index, 'percentageOfRevenue', next)}
              />
              <SelectField
                id={`geo-revenue-${index}-source`}
                label="Source"
                value={item.source}
                onChange={(next) =>
                  setGeographicRevenue(index, 'source', next as GeographicRevenue['source'])
                }
                options={FIGURE_SOURCE_OPTIONS}
                emptyLabel="Not answered"
              />
            </FieldGrid>
            <TextAreaField
              id={`geo-revenue-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setGeographicRevenue(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection
        title="Order book"
        description={
          orderBookNotApplicable
            ? 'Marked as not applicable. Fields are retained for reference and are not cleared.'
            : orderBookApplicable
              ? 'Record value, security classification, concentration and recognition status.'
              : 'Indicate whether an order book is available, then complete the fields below.'
        }
      >
        <FieldGrid>
          <TernaryField
            id="order-book-available"
            label="Order book available"
            value={value.orderBookAvailable}
            onChange={(next) => set('orderBookAvailable', next)}
          />
        </FieldGrid>

        {orderBookNotApplicable ? (
          <p
            role="status"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Order book marked as not applicable. Existing values are kept and can still be edited
            if needed.
          </p>
        ) : null}

        <div
          className={
            orderBookApplicable
              ? 'space-y-4 rounded-md border border-accent/40 bg-accent/5 p-4'
              : 'space-y-4'
          }
        >
          {orderBookApplicable ? (
            <p className="text-xs font-medium text-foreground">
              Order book details (complete while availability is Yes or Not sure)
            </p>
          ) : null}
          <FieldGrid>
            <DecimalInputField
              id="order-book-value"
              label="Order book value (₹)"
              value={value.orderBookValue}
              onChange={(next) => set('orderBookValue', next)}
            />
            <DateField
              id="order-book-as-of"
              label="As of date"
              value={value.orderBookAsOfDate}
              onChange={(next) => set('orderBookAsOfDate', next)}
            />
            <TextInputField
              id="order-book-execution-period"
              label="Execution period"
              value={value.orderBookExecutionPeriod}
              onChange={(next) => set('orderBookExecutionPeriod', next)}
              placeholder="e.g. next 12 months"
            />
            <SelectField
              id="order-book-security"
              label="Security classification"
              value={value.orderBookSecurityClassification}
              onChange={(next) =>
                set(
                  'orderBookSecurityClassification',
                  next as CustomersSalesDistributionAndGeography['orderBookSecurityClassification'],
                )
              }
              options={ORDER_BOOK_SECURITY_OPTIONS}
              emptyLabel="Not answered"
            />
            <DecimalInputField
              id="order-book-recognised"
              label="Revenue already recognised (₹)"
              value={value.orderBookRevenueAlreadyRecognised}
              onChange={(next) => set('orderBookRevenueAlreadyRecognised', next)}
            />
            <SelectField
              id="order-book-source-status"
              label="Source status"
              value={value.orderBookSourceStatus}
              onChange={(next) =>
                set(
                  'orderBookSourceStatus',
                  next as CustomersSalesDistributionAndGeography['orderBookSourceStatus'],
                )
              }
              options={SOURCE_STATUS_OPTIONS}
              emptyLabel="Not answered"
            />
            <TernaryField
              id="order-book-excludes-quotations"
              label="Excludes quotations and non-binding proposals"
              value={value.orderBookExcludesQuotationsAndNonBindingProposals}
              onChange={(next) =>
                set('orderBookExcludesQuotationsAndNonBindingProposals', next)
              }
            />
          </FieldGrid>
          <TextAreaField
            id="order-book-cancellation"
            label="Cancellation conditions"
            rows={2}
            value={value.orderBookCancellationConditions}
            onChange={(next) => set('orderBookCancellationConditions', next)}
          />
          <TextAreaField
            id="order-book-concentration"
            label="Order book customer concentration"
            rows={2}
            value={value.orderBookCustomerConcentration}
            onChange={(next) => set('orderBookCustomerConcentration', next)}
          />
        </div>
      </SubSection>

      <TextAreaField
        id="customers-section-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Concentration periods"
          value={String(model.customerConcentration.length)}
        />
        <ComputedStat
          label="Material customers"
          value={String(model.counts.materialCustomers)}
        />
        <ComputedStat
          label="Sales channels"
          value={String(value.salesChannels.length)}
        />
        <ComputedStat
          label="Geographic rows"
          value={String(model.geographicMix.length)}
        />
        <ComputedStat
          label="Current period largest %"
          value={
            currentConcentration
              ? formatPercent(currentConcentration.largestPercentage)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Current period top 3 %"
          value={
            currentConcentration ? formatPercent(currentConcentration.top3Percentage) : EM_DASH
          }
        />
        <ComputedStat
          label="Current period top 5 %"
          value={
            currentConcentration ? formatPercent(currentConcentration.top5Percentage) : EM_DASH
          }
        />
        <ComputedStat
          label="Current period top 10 %"
          value={
            currentConcentration ? formatPercent(currentConcentration.top10Percentage) : EM_DASH
          }
        />
        <ComputedStat
          label="Current period total revenue"
          value={
            currentConcentration ? formatMoneyCompact(currentConcentration.total) : EM_DASH
          }
        />
      </StatGrid>

      <BusinessOperationsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
