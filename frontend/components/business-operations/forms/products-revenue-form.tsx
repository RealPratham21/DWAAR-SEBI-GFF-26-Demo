'use client';

import {
  ComputedStat,
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  SubSection,
  TableScroll,
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
  createEmptyOfferingChange,
  createEmptyProductService,
  createEmptyRevenueMixRow,
} from '@/lib/business-operations/defaults';
import {
  EM_DASH,
  formatMoneyCompact,
  formatPercent,
} from '@/lib/business-operations/format';
import {
  DOMESTIC_EXPORT_CLASSIFICATION_OPTIONS,
  FIGURE_SOURCE_OPTIONS,
  LIFECYCLE_STAGE_OPTIONS,
  OFFERING_CHANGE_TYPE_OPTIONS,
  OFFERING_COMMERCIAL_STATUS_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  SOURCING_MODEL_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  OfferingChange,
  ProductService,
  ProductsServicesAndRevenueMix,
  RevenueMixRow,
} from '@/lib/business-operations/types';

const SECTION_ID = 'products-services-revenue-mix' as const;

const FREE_SEGMENT_VALUE = '__free_label__';

export function ProductsRevenueForm() {
  const { payload, updateSection, model } = useBusinessOperations();
  const value = payload.productsServicesAndRevenueMix;

  const set = <K extends keyof ProductsServicesAndRevenueMix>(
    key: K,
    next: ProductsServicesAndRevenueMix[K],
  ) => {
    updateSection('productsServicesAndRevenueMix', { ...value, [key]: next }, SECTION_ID);
  };

  const setProduct = <K extends keyof ProductService>(
    index: number,
    key: K,
    next: ProductService[K],
  ) => {
    set(
      'productsServices',
      replaceAt(value.productsServices, index, {
        ...value.productsServices[index],
        [key]: next,
      }),
    );
  };

  const setMixRow = <K extends keyof RevenueMixRow>(
    index: number,
    key: K,
    next: RevenueMixRow[K],
  ) => {
    set(
      'revenueMixRows',
      replaceAt(value.revenueMixRows, index, { ...value.revenueMixRows[index], [key]: next }),
    );
  };

  const setOfferingChange = <K extends keyof OfferingChange>(
    index: number,
    key: K,
    next: OfferingChange[K],
  ) => {
    set(
      'offeringChanges',
      replaceAt(value.offeringChanges, index, {
        ...value.offeringChanges[index],
        [key]: next,
      }),
    );
  };

  const productLinkOptions = [
    { value: FREE_SEGMENT_VALUE, label: 'Free-text segment (no product link)' },
    ...value.productsServices.map((product, index) => ({
      value: product.id,
      label: product.name.trim() || `Product ${index + 1} (unnamed)`,
    })),
  ];

  const largest = model.largestSegment;
  const concentration = model.productConcentration;

  return (
    <SectionCard
      title="Products, Services & Revenue Mix"
      description="Product and service register, three-year revenue mix, launches and discontinuations."
    >
      <RepeatableList
        title="Products and services"
        description="One row per material product, service, solution or trading category."
        addLabel="Add product / service"
        count={value.productsServices.length}
        emptyMessage="No product or service recorded yet."
        onAdd={() =>
          set('productsServices', [...value.productsServices, createEmptyProductService()])
        }
      >
        {value.productsServices.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.name || `Product / service ${index + 1}`}
            subtitle={item.businessSegment || item.productType || undefined}
            requiresConfirmation={hasRecordData([
              item.name,
              item.description,
              item.brandName,
              item.typicalOrderOrContractSize,
            ])}
            confirmMessage="Remove this product or service? Linked revenue-mix rows keep their ids until you edit them."
            onRemove={() => set('productsServices', removeAt(value.productsServices, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`pr-product-${index}-name`}
                label="Name"
                required
                value={item.name}
                onChange={(next) => setProduct(index, 'name', next)}
              />
              <SelectField
                id={`pr-product-${index}-type`}
                label="Product type"
                required
                value={item.productType}
                onChange={(next) =>
                  setProduct(index, 'productType', next as ProductService['productType'])
                }
                options={PRODUCT_TYPE_OPTIONS}
              />
              <TextInputField
                id={`pr-product-${index}-segment`}
                label="Business segment"
                value={item.businessSegment}
                onChange={(next) => setProduct(index, 'businessSegment', next)}
              />
              <TextInputField
                id={`pr-product-${index}-brand`}
                label="Brand name"
                value={item.brandName}
                onChange={(next) => setProduct(index, 'brandName', next)}
              />
              <DateField
                id={`pr-product-${index}-launch`}
                label="Launch date"
                value={item.launchDate}
                onChange={(next) => setProduct(index, 'launchDate', next)}
              />
              <SelectField
                id={`pr-product-${index}-lifecycle`}
                label="Lifecycle stage"
                value={item.lifecycleStage}
                onChange={(next) =>
                  setProduct(index, 'lifecycleStage', next as ProductService['lifecycleStage'])
                }
                options={LIFECYCLE_STAGE_OPTIONS}
              />
              <SelectField
                id={`pr-product-${index}-sourcing`}
                label="Sourcing model"
                value={item.sourcingModel}
                onChange={(next) =>
                  setProduct(index, 'sourcingModel', next as ProductService['sourcingModel'])
                }
                options={SOURCING_MODEL_OPTIONS}
              />
              <SelectField
                id={`pr-product-${index}-domestic-export`}
                label="Domestic / export classification"
                value={item.domesticExportClassification}
                onChange={(next) =>
                  setProduct(
                    index,
                    'domesticExportClassification',
                    next as ProductService['domesticExportClassification'],
                  )
                }
                options={DOMESTIC_EXPORT_CLASSIFICATION_OPTIONS}
              />
              <TextInputField
                id={`pr-product-${index}-pricing`}
                label="Pricing model"
                value={item.pricingModel}
                onChange={(next) => setProduct(index, 'pricingModel', next)}
              />
              <DecimalInputField
                id={`pr-product-${index}-order-size`}
                label="Typical order / contract size (₹)"
                value={item.typicalOrderOrContractSize}
                onChange={(next) => setProduct(index, 'typicalOrderOrContractSize', next)}
              />
              <TextInputField
                id={`pr-product-${index}-customer-type`}
                label="Customer / end-user type"
                value={item.customerOrEndUserType}
                onChange={(next) => setProduct(index, 'customerOrEndUserType', next)}
              />
              <TextInputField
                id={`pr-product-${index}-industry`}
                label="Industry served"
                value={item.industryServed}
                onChange={(next) => setProduct(index, 'industryServed', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`pr-product-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setProduct(index, 'description', next)}
            />
            <TextAreaField
              id={`pr-product-${index}-features`}
              label="Main features"
              rows={2}
              value={item.mainFeatures}
              onChange={(next) => setProduct(index, 'mainFeatures', next)}
            />
            <TextAreaField
              id={`pr-product-${index}-problem`}
              label="Customer problem addressed"
              rows={2}
              value={item.customerProblemAddressed}
              onChange={(next) => setProduct(index, 'customerProblemAddressed', next)}
            />
            <TextAreaField
              id={`pr-product-${index}-revenue-recognition`}
              label="Revenue recognition model"
              rows={2}
              value={item.revenueRecognitionModel}
              onChange={(next) => setProduct(index, 'revenueRecognitionModel', next)}
            />
            <TextAreaField
              id={`pr-product-${index}-licences`}
              label="Required licences or certifications"
              rows={2}
              value={item.requiredLicencesOrCertifications}
              onChange={(next) => setProduct(index, 'requiredLicencesOrCertifications', next)}
            />
            <TextAreaField
              id={`pr-product-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setProduct(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Revenue mix"
        description="Link each row to a product above, or enter a free-text segment label. Percentages should reconcile to about 100% by financial year."
        addLabel="Add revenue-mix row"
        count={value.revenueMixRows.length}
        emptyMessage="No revenue-mix row recorded yet."
        onAdd={() => set('revenueMixRows', [...value.revenueMixRows, createEmptyRevenueMixRow()])}
      >
        {value.revenueMixRows.map((item, index) => {
          const linkedProduct = value.productsServices.find(
            (product) => product.id === item.productOrSegmentId,
          );
          const linkSelectValue = linkedProduct ? linkedProduct.id : FREE_SEGMENT_VALUE;

          return (
            <RepeatableCard
              key={item.id}
              title={
                item.productOrSegmentLabel ||
                linkedProduct?.name ||
                `Revenue-mix row ${index + 1}`
              }
              subtitle={item.financialYear || undefined}
              requiresConfirmation={hasRecordData([
                item.productOrSegmentLabel,
                item.revenue,
                item.percentageOfRevenueFromOperations,
                item.financialYear,
              ])}
              confirmMessage="Remove this revenue-mix row? Entered figures will be lost."
              onRemove={() => set('revenueMixRows', removeAt(value.revenueMixRows, index))}
            >
              <FieldGrid>
                <SelectField
                  id={`pr-mix-${index}-product-link`}
                  label="Linked product / service"
                  value={linkSelectValue}
                  onChange={(next) => {
                    if (next === FREE_SEGMENT_VALUE) {
                      set(
                        'revenueMixRows',
                        replaceAt(value.revenueMixRows, index, {
                          ...item,
                          productOrSegmentId: '',
                        }),
                      );
                      return;
                    }
                    const product = value.productsServices.find((entry) => entry.id === next);
                    set(
                      'revenueMixRows',
                      replaceAt(value.revenueMixRows, index, {
                        ...item,
                        productOrSegmentId: next,
                        productOrSegmentLabel:
                          item.productOrSegmentLabel.trim() || product?.name || '',
                      }),
                    );
                  }}
                  options={productLinkOptions}
                  includeEmpty={false}
                  helper="Choose a registered product, or keep free-text segment labelling."
                />
                <TextInputField
                  id={`pr-mix-${index}-label`}
                  label="Product / segment label"
                  required
                  value={item.productOrSegmentLabel}
                  onChange={(next) => setMixRow(index, 'productOrSegmentLabel', next)}
                  helper="Displayed in mix tables even when a product id is linked."
                />
                <TextInputField
                  id={`pr-mix-${index}-year`}
                  label="Financial year"
                  required
                  value={item.financialYear}
                  onChange={(next) => setMixRow(index, 'financialYear', next)}
                  placeholder="FY 2024-25"
                />
                <DecimalInputField
                  id={`pr-mix-${index}-revenue`}
                  label="Revenue (₹)"
                  value={item.revenue}
                  onChange={(next) => setMixRow(index, 'revenue', next)}
                />
                <DecimalInputField
                  id={`pr-mix-${index}-percentage`}
                  label="% of revenue from operations"
                  value={item.percentageOfRevenueFromOperations}
                  onChange={(next) => setMixRow(index, 'percentageOfRevenueFromOperations', next)}
                />
                <SelectField
                  id={`pr-mix-${index}-source`}
                  label="Figure source"
                  value={item.source}
                  onChange={(next) => setMixRow(index, 'source', next as RevenueMixRow['source'])}
                  options={FIGURE_SOURCE_OPTIONS}
                />
              </FieldGrid>
              <TextAreaField
                id={`pr-mix-${index}-notes`}
                label="Notes"
                rows={2}
                value={item.notes}
                onChange={(next) => setMixRow(index, 'notes', next)}
              />
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      {model.revenueMixByYear.length > 0 ? (
        <SubSection
          title="Revenue mix by year"
          description="Derived totals. Percentages should land within about ±2 of 100% per year."
        >
          <TableScroll>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Financial year
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Rows
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Total revenue
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Total %
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Variance from 100%
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Reconciles
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {model.revenueMixByYear.map((row) => (
                  <tr key={row.financialYear}>
                    <td className="px-3 py-2">{row.financialYear}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.rowCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoneyCompact(row.totalRevenue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatPercent(row.totalPercentage)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatPercent(row.varianceFrom100)}
                    </td>
                    <td className="px-3 py-2">
                      {row.percentagesReconcile ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </SubSection>
      ) : null}

      <RepeatableList
        title="Offering changes"
        description="Launches, discontinuations and other material changes to the offering set."
        addLabel="Add offering change"
        count={value.offeringChanges.length}
        emptyMessage="No offering change recorded yet."
        onAdd={() =>
          set('offeringChanges', [...value.offeringChanges, createEmptyOfferingChange()])
        }
      >
        {value.offeringChanges.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.offeringName || `Offering change ${index + 1}`}
            subtitle={item.changeType || undefined}
            requiresConfirmation={hasRecordData([
              item.offeringName,
              item.changeDate,
              item.reason,
            ])}
            confirmMessage="Remove this offering change? Entered values will be lost."
            onRemove={() => set('offeringChanges', removeAt(value.offeringChanges, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`pr-change-${index}-name`}
                label="Offering name"
                required
                value={item.offeringName}
                onChange={(next) => setOfferingChange(index, 'offeringName', next)}
              />
              <SelectField
                id={`pr-change-${index}-type`}
                label="Change type"
                required
                value={item.changeType}
                onChange={(next) =>
                  setOfferingChange(index, 'changeType', next as OfferingChange['changeType'])
                }
                options={OFFERING_CHANGE_TYPE_OPTIONS}
              />
              <DateField
                id={`pr-change-${index}-date`}
                label="Change date"
                value={item.changeDate}
                onChange={(next) => setOfferingChange(index, 'changeDate', next)}
              />
              <SelectField
                id={`pr-change-${index}-status`}
                label="Current commercial status"
                value={item.currentCommercialStatus}
                onChange={(next) =>
                  setOfferingChange(
                    index,
                    'currentCommercialStatus',
                    next as OfferingChange['currentCommercialStatus'],
                  )
                }
                options={OFFERING_COMMERCIAL_STATUS_OPTIONS}
              />
            </FieldGrid>
            <TextAreaField
              id={`pr-change-${index}-reason`}
              label="Reason"
              rows={2}
              value={item.reason}
              onChange={(next) => setOfferingChange(index, 'reason', next)}
            />
            <TextAreaField
              id={`pr-change-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setOfferingChange(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="pr-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Revenue mix reconciles"
          value={
            model.revenueMixByYear.length === 0
              ? EM_DASH
              : model.revenuePercentagesReconcile
                ? 'Yes'
                : 'No'
          }
        />
        <ComputedStat
          label="Largest segment"
          value={
            largest
              ? `${largest.label}${largest.financialYear ? ` (${largest.financialYear})` : ''}`
              : EM_DASH
          }
        />
        <ComputedStat
          label="Largest segment %"
          value={largest ? formatPercent(largest.percentage) : EM_DASH}
        />
        <ComputedStat
          label="Largest segment revenue"
          value={largest ? formatMoneyCompact(largest.revenue) : EM_DASH}
        />
        <ComputedStat
          label="Product concentration %"
          value={
            concentration.largestProductPercentage
              ? formatPercent(concentration.largestProductPercentage)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Products / segments with revenue"
          value={
            concentration.productCountWithRevenue > 0
              ? String(concentration.productCountWithRevenue)
              : EM_DASH
          }
        />
        <ComputedStat label="Products registered" value={String(model.counts.products)} />
        <ComputedStat
          label="Offering changes"
          value={String(value.offeringChanges.length)}
        />
      </StatGrid>

      <BusinessOperationsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
