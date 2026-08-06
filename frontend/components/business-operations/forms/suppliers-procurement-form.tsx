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
  createEmptyKeyInput,
  createEmptyMaterialSupplier,
  createEmptySupplierConcentrationPeriod,
} from '@/lib/business-operations/defaults';
import {
  EM_DASH,
  formatMoneyCompact,
  formatPercent,
} from '@/lib/business-operations/format';
import {
  DISCLOSURE_CONSENT_OPTIONS,
  DOMESTIC_OR_IMPORTED_OPTIONS,
  FIGURE_SOURCE_OPTIONS,
  INPUT_CATEGORY_LABELS,
  INPUT_CATEGORY_OPTIONS,
  LOGISTICS_MODEL_OPTIONS,
  PROCUREMENT_MODEL_OPTIONS,
  PRODUCTION_MODEL_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  KeyInput,
  MaterialSupplier,
  SupplierConcentrationPeriod,
  SuppliersProcurementInventoryAndLogistics,
} from '@/lib/business-operations/types';

const SECTION_ID = 'suppliers-procurement-inventory-logistics' as const;

function inputCategoryLabel(category: string): string {
  if (!category) return 'Category not set';
  return INPUT_CATEGORY_LABELS[category as keyof typeof INPUT_CATEGORY_LABELS] ?? category;
}

export function SuppliersProcurementForm() {
  const { payload, updateSection, model } = useBusinessOperations();
  const value = payload.suppliersProcurementInventoryAndLogistics;

  const currentConcentration =
    model.supplierConcentration.find((row) => row.isCurrentPeriod) ??
    model.supplierConcentration[0] ??
    null;

  const set = <K extends keyof SuppliersProcurementInventoryAndLogistics>(
    key: K,
    next: SuppliersProcurementInventoryAndLogistics[K],
  ) => {
    updateSection(
      'suppliersProcurementInventoryAndLogistics',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setKeyInput = <K extends keyof KeyInput>(
    index: number,
    key: K,
    next: KeyInput[K],
  ) => {
    set(
      'keyInputs',
      replaceAt(value.keyInputs, index, {
        ...value.keyInputs[index],
        [key]: next,
      }),
    );
  };

  const setConcentration = <K extends keyof SupplierConcentrationPeriod>(
    index: number,
    key: K,
    next: SupplierConcentrationPeriod[K],
  ) => {
    set(
      'supplierConcentrationPeriods',
      replaceAt(value.supplierConcentrationPeriods, index, {
        ...value.supplierConcentrationPeriods[index],
        [key]: next,
      }),
    );
  };

  const setMaterialSupplier = <K extends keyof MaterialSupplier>(
    index: number,
    key: K,
    next: MaterialSupplier[K],
  ) => {
    set(
      'materialSuppliers',
      replaceAt(value.materialSuppliers, index, {
        ...value.materialSuppliers[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Suppliers, Procurement, Inventory & Logistics"
      description="Key inputs, supplier concentration, procurement, inventory and logistics arrangements."
    >
      <RepeatableList
        title="Key inputs"
        description="Materials, components and other inputs that are material to operations."
        addLabel="Add key input"
        count={value.keyInputs.length}
        emptyMessage="No key input recorded yet."
        onAdd={() => set('keyInputs', [...value.keyInputs, createEmptyKeyInput()])}
      >
        {value.keyInputs.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.inputName || `Key input ${index + 1}`}
            subtitle={inputCategoryLabel(item.category)}
            requiresConfirmation={hasRecordData([
              item.inputName,
              item.category,
              item.productsServicesSupported,
              item.typicalLeadTime,
              item.storageRequirement,
              item.notes,
            ])}
            confirmMessage="Remove this key input? Entered values will be lost."
            onRemove={() => set('keyInputs', removeAt(value.keyInputs, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`key-input-${index}-name`}
                label="Input name"
                value={item.inputName}
                onChange={(next) => setKeyInput(index, 'inputName', next)}
              />
              <SelectField
                id={`key-input-${index}-category`}
                label="Category"
                value={item.category}
                onChange={(next) =>
                  setKeyInput(index, 'category', next as KeyInput['category'])
                }
                options={INPUT_CATEGORY_OPTIONS}
                emptyLabel="Not answered"
              />
              <TextInputField
                id={`key-input-${index}-products`}
                label="Products / services supported"
                value={item.productsServicesSupported}
                onChange={(next) => setKeyInput(index, 'productsServicesSupported', next)}
              />
              <SelectField
                id={`key-input-${index}-domestic-imported`}
                label="Domestic or imported"
                value={item.domesticOrImported}
                onChange={(next) =>
                  setKeyInput(
                    index,
                    'domesticOrImported',
                    next as KeyInput['domesticOrImported'],
                  )
                }
                options={DOMESTIC_OR_IMPORTED_OPTIONS}
                emptyLabel="Not answered"
              />
              <TernaryField
                id={`key-input-${index}-critical`}
                label="Critical input"
                value={item.criticalInput}
                onChange={(next) => setKeyInput(index, 'criticalInput', next)}
              />
              <TernaryField
                id={`key-input-${index}-commodity`}
                label="Commodity-linked price"
                value={item.commodityLinkedPrice}
                onChange={(next) => setKeyInput(index, 'commodityLinkedPrice', next)}
              />
              <TernaryField
                id={`key-input-${index}-substitute`}
                label="Substitute available"
                value={item.substituteAvailable}
                onChange={(next) => setKeyInput(index, 'substituteAvailable', next)}
              />
              <TextInputField
                id={`key-input-${index}-lead-time`}
                label="Typical lead time"
                value={item.typicalLeadTime}
                onChange={(next) => setKeyInput(index, 'typicalLeadTime', next)}
                placeholder="e.g. 6–8 weeks"
              />
              <TextInputField
                id={`key-input-${index}-storage`}
                label="Storage requirement"
                value={item.storageRequirement}
                onChange={(next) => setKeyInput(index, 'storageRequirement', next)}
              />
              <TernaryField
                id={`key-input-${index}-volatility`}
                label="Price volatility"
                value={item.priceVolatility}
                onChange={(next) => setKeyInput(index, 'priceVolatility', next)}
              />
              <TernaryField
                id={`key-input-${index}-restriction`}
                label="Regulatory or import restriction"
                value={item.regulatoryOrImportRestriction}
                onChange={(next) => setKeyInput(index, 'regulatoryOrImportRestriction', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`key-input-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setKeyInput(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Supplier concentration periods"
        description="Largest, top-3 / top-5 / top-10 purchase contributions for each reporting period."
        addLabel="Add concentration period"
        count={value.supplierConcentrationPeriods.length}
        emptyMessage="No supplier concentration period recorded yet."
        onAdd={() =>
          set('supplierConcentrationPeriods', [
            ...value.supplierConcentrationPeriods,
            createEmptySupplierConcentrationPeriod(),
          ])
        }
      >
        {value.supplierConcentrationPeriods.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.periodLabel || `Concentration period ${index + 1}`}
            subtitle={item.isCurrentPeriod ? 'Current period' : undefined}
            requiresConfirmation={hasRecordData([
              item.periodLabel,
              item.largestSupplierPurchaseValue,
              item.largestSupplierPercentage,
              item.top3Percentage,
              item.totalPurchases,
            ])}
            confirmMessage="Remove this concentration period? Entered values will be lost."
            onRemove={() =>
              set(
                'supplierConcentrationPeriods',
                removeAt(value.supplierConcentrationPeriods, index),
              )
            }
          >
            <FieldGrid>
              <TextInputField
                id={`supplier-concentration-${index}-period`}
                label="Period label"
                value={item.periodLabel}
                onChange={(next) => setConcentration(index, 'periodLabel', next)}
                placeholder="e.g. FY 2024-25"
              />
              <CheckboxField
                id={`supplier-concentration-${index}-current`}
                label="Mark as current period"
                checked={item.isCurrentPeriod}
                onChange={(next) => setConcentration(index, 'isCurrentPeriod', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-total-suppliers`}
                label="Total suppliers"
                value={item.totalSuppliers}
                onChange={(next) => setConcentration(index, 'totalSuppliers', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-largest-value`}
                label="Largest supplier purchase value (₹)"
                value={item.largestSupplierPurchaseValue}
                onChange={(next) =>
                  setConcentration(index, 'largestSupplierPurchaseValue', next)
                }
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-largest-pct`}
                label="Largest supplier %"
                value={item.largestSupplierPercentage}
                onChange={(next) => setConcentration(index, 'largestSupplierPercentage', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-top3-value`}
                label="Top 3 purchase value (₹)"
                value={item.top3PurchaseValue}
                onChange={(next) => setConcentration(index, 'top3PurchaseValue', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-top3-pct`}
                label="Top 3 %"
                value={item.top3Percentage}
                onChange={(next) => setConcentration(index, 'top3Percentage', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-top5-value`}
                label="Top 5 purchase value (₹)"
                value={item.top5PurchaseValue}
                onChange={(next) => setConcentration(index, 'top5PurchaseValue', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-top5-pct`}
                label="Top 5 %"
                value={item.top5Percentage}
                onChange={(next) => setConcentration(index, 'top5Percentage', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-top10-value`}
                label="Top 10 purchase value (₹)"
                value={item.top10PurchaseValue}
                onChange={(next) => setConcentration(index, 'top10PurchaseValue', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-top10-pct`}
                label="Top 10 %"
                value={item.top10Percentage}
                onChange={(next) => setConcentration(index, 'top10Percentage', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-total-purchases`}
                label="Total purchases (₹)"
                value={item.totalPurchases}
                onChange={(next) => setConcentration(index, 'totalPurchases', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-imported-pct`}
                label="Imported purchase %"
                value={item.importedPurchasePercentage}
                onChange={(next) => setConcentration(index, 'importedPurchasePercentage', next)}
              />
              <DecimalInputField
                id={`supplier-concentration-${index}-related-party-pct`}
                label="Related-party supplier %"
                value={item.relatedPartySupplierPercentage}
                onChange={(next) =>
                  setConcentration(index, 'relatedPartySupplierPercentage', next)
                }
              />
              <SelectField
                id={`supplier-concentration-${index}-source`}
                label="Source"
                value={item.source}
                onChange={(next) =>
                  setConcentration(index, 'source', next as SupplierConcentrationPeriod['source'])
                }
                options={FIGURE_SOURCE_OPTIONS}
                emptyLabel="Not answered"
              />
            </FieldGrid>
            <TextAreaField
              id={`supplier-concentration-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setConcentration(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Material suppliers"
        description="Named or confidential labels for material counterparties, with consent status."
        addLabel="Add material supplier"
        count={value.materialSuppliers.length}
        emptyMessage="No material supplier recorded yet."
        onAdd={() =>
          set('materialSuppliers', [...value.materialSuppliers, createEmptyMaterialSupplier()])
        }
      >
        {value.materialSuppliers.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.supplierNameOrConfidentialLabel || `Material supplier ${index + 1}`}
            subtitle={item.inputSupplied || item.country || undefined}
            requiresConfirmation={hasRecordData([
              item.supplierNameOrConfidentialLabel,
              item.inputSupplied,
              item.country,
              item.contractExpiry,
              item.creditTerms,
              item.notes,
            ])}
            confirmMessage="Remove this material supplier? Entered values will be lost."
            onRemove={() => set('materialSuppliers', removeAt(value.materialSuppliers, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`material-supplier-${index}-name`}
                label="Supplier name or confidential label"
                value={item.supplierNameOrConfidentialLabel}
                onChange={(next) =>
                  setMaterialSupplier(index, 'supplierNameOrConfidentialLabel', next)
                }
              />
              <TextInputField
                id={`material-supplier-${index}-input`}
                label="Input supplied"
                value={item.inputSupplied}
                onChange={(next) => setMaterialSupplier(index, 'inputSupplied', next)}
              />
              <TextInputField
                id={`material-supplier-${index}-since`}
                label="Relationship since"
                value={item.relationshipSince}
                onChange={(next) => setMaterialSupplier(index, 'relationshipSince', next)}
                placeholder="e.g. 2019"
              />
              <TextInputField
                id={`material-supplier-${index}-country`}
                label="Country"
                value={item.country}
                onChange={(next) => setMaterialSupplier(index, 'country', next)}
              />
              <TernaryField
                id={`material-supplier-${index}-lta`}
                label="Long-term agreement"
                value={item.longTermAgreement}
                onChange={(next) => setMaterialSupplier(index, 'longTermAgreement', next)}
              />
              <TernaryField
                id={`material-supplier-${index}-exclusivity`}
                label="Exclusivity"
                value={item.exclusivity}
                onChange={(next) => setMaterialSupplier(index, 'exclusivity', next)}
              />
              <TernaryField
                id={`material-supplier-${index}-single-source`}
                label="Single-source dependency"
                value={item.singleSourceDependency}
                onChange={(next) => setMaterialSupplier(index, 'singleSourceDependency', next)}
              />
              <DateField
                id={`material-supplier-${index}-expiry`}
                label="Contract expiry"
                value={item.contractExpiry}
                onChange={(next) => setMaterialSupplier(index, 'contractExpiry', next)}
              />
              <TernaryField
                id={`material-supplier-${index}-alternative`}
                label="Alternative supplier available"
                value={item.alternativeSupplierAvailable}
                onChange={(next) =>
                  setMaterialSupplier(index, 'alternativeSupplierAvailable', next)
                }
              />
              <TextInputField
                id={`material-supplier-${index}-credit`}
                label="Credit terms"
                value={item.creditTerms}
                onChange={(next) => setMaterialSupplier(index, 'creditTerms', next)}
              />
              <SelectField
                id={`material-supplier-${index}-consent`}
                label="Disclosure consent status"
                value={item.disclosureConsentStatus}
                onChange={(next) =>
                  setMaterialSupplier(
                    index,
                    'disclosureConsentStatus',
                    next as MaterialSupplier['disclosureConsentStatus'],
                  )
                }
                options={DISCLOSURE_CONSENT_OPTIONS}
                emptyLabel="Not answered"
              />
            </FieldGrid>
            <TextAreaField
              id={`material-supplier-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setMaterialSupplier(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection
        title="Procurement"
        description="How purchases are organised, priced, qualified and replaced."
      >
        <FieldGrid>
          <SelectField
            id="procurement-model"
            label="Procurement model"
            value={value.procurementModel}
            onChange={(next) =>
              set(
                'procurementModel',
                next as SuppliersProcurementInventoryAndLogistics['procurementModel'],
              )
            }
            options={PROCUREMENT_MODEL_OPTIONS}
            emptyLabel="Not answered"
          />
          <TextInputField
            id="procurement-po-contract"
            label="Purchase order or contract model"
            value={value.purchaseOrderOrContractModel}
            onChange={(next) => set('purchaseOrderOrContractModel', next)}
          />
          <TextInputField
            id="procurement-pricing"
            label="Pricing method"
            value={value.pricingMethod}
            onChange={(next) => set('pricingMethod', next)}
          />
          <TextInputField
            id="procurement-lead-time"
            label="Typical procurement lead time"
            value={value.typicalProcurementLeadTime}
            onChange={(next) => set('typicalProcurementLeadTime', next)}
          />
          <TernaryField
            id="procurement-related-party"
            label="Related-party supplier dependence"
            value={value.relatedPartySupplierDependence}
            onChange={(next) => set('relatedPartySupplierDependence', next)}
          />
        </FieldGrid>
        <TextAreaField
          id="procurement-qualification"
          label="Supplier qualification process"
          rows={2}
          value={value.supplierQualificationProcess}
          onChange={(next) => set('supplierQualificationProcess', next)}
        />
        <TextAreaField
          id="procurement-quality-inspection"
          label="Quality inspection process"
          rows={2}
          value={value.qualityInspectionProcess}
          onChange={(next) => set('qualityInspectionProcess', next)}
        />
        <TextAreaField
          id="procurement-replacement"
          label="Replacement process"
          rows={2}
          value={value.replacementProcess}
          onChange={(next) => set('replacementProcess', next)}
        />
      </SubSection>

      <SubSection
        title="Inventory & production"
        description="Holding periods, safety stock, write-offs and production model."
      >
        <FieldGrid>
          <SelectField
            id="production-model"
            label="Production model"
            value={value.productionModel}
            onChange={(next) =>
              set(
                'productionModel',
                next as SuppliersProcurementInventoryAndLogistics['productionModel'],
              )
            }
            options={PRODUCTION_MODEL_OPTIONS}
            emptyLabel="Not answered"
          />
          <TextInputField
            id="inventory-raw-holding"
            label="Inventory holding period — raw materials"
            value={value.inventoryHoldingPeriodRawMaterials}
            onChange={(next) => set('inventoryHoldingPeriodRawMaterials', next)}
          />
          <TextInputField
            id="inventory-fg-holding"
            label="Inventory holding period — finished goods"
            value={value.inventoryHoldingPeriodFinishedGoods}
            onChange={(next) => set('inventoryHoldingPeriodFinishedGoods', next)}
          />
          <TextInputField
            id="inventory-safety-stock"
            label="Safety stock approach"
            value={value.safetyStockApproach}
            onChange={(next) => set('safetyStockApproach', next)}
          />
          <TernaryField
            id="inventory-obsolescence"
            label="Obsolescence or perishability exposure"
            value={value.obsolescenceOrPerishabilityExposure}
            onChange={(next) => set('obsolescenceOrPerishabilityExposure', next)}
          />
          <TernaryField
            id="inventory-write-offs"
            label="Material write-offs"
            value={value.materialWriteOffs}
            onChange={(next) => set('materialWriteOffs', next)}
          />
        </FieldGrid>
        <TextAreaField
          id="inventory-write-off-details"
          label="Material write-off details"
          rows={2}
          value={value.materialWriteOffDetails}
          onChange={(next) => set('materialWriteOffDetails', next)}
        />
        <TextAreaField
          id="inventory-warehousing"
          label="Warehousing arrangement"
          rows={2}
          value={value.warehousingArrangement}
          onChange={(next) => set('warehousingArrangement', next)}
        />
      </SubSection>

      <SubSection
        title="Logistics"
        description="Transport modes, ports, delivery responsibilities and backup arrangements."
      >
        <FieldGrid>
          <SelectField
            id="logistics-model"
            label="Logistics model"
            value={value.logisticsModel}
            onChange={(next) =>
              set(
                'logisticsModel',
                next as SuppliersProcurementInventoryAndLogistics['logisticsModel'],
              )
            }
            options={LOGISTICS_MODEL_OPTIONS}
            emptyLabel="Not answered"
          />
          <TextInputField
            id="logistics-transport-modes"
            label="Transport modes"
            value={value.transportModes}
            onChange={(next) => set('transportModes', next)}
          />
          <TextInputField
            id="logistics-ports"
            label="Ports used"
            value={value.portsUsed}
            onChange={(next) => set('portsUsed', next)}
          />
          <TernaryField
            id="logistics-material-dependency"
            label="Material logistics dependency"
            value={value.materialLogisticsDependency}
            onChange={(next) => set('materialLogisticsDependency', next)}
          />
        </FieldGrid>
        <TextAreaField
          id="logistics-delivery"
          label="Delivery responsibilities"
          rows={2}
          value={value.deliveryResponsibilities}
          onChange={(next) => set('deliveryResponsibilities', next)}
        />
        <TextAreaField
          id="logistics-backup"
          label="Logistics backup arrangements"
          rows={2}
          value={value.logisticsBackupArrangements}
          onChange={(next) => set('logisticsBackupArrangements', next)}
        />
      </SubSection>

      <TextAreaField
        id="suppliers-section-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat label="Key inputs" value={String(value.keyInputs.length)} />
        <ComputedStat
          label="Concentration periods"
          value={String(model.supplierConcentration.length)}
        />
        <ComputedStat
          label="Material suppliers"
          value={String(model.counts.materialSuppliers)}
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
          label="Current period total purchases"
          value={
            currentConcentration ? formatMoneyCompact(currentConcentration.total) : EM_DASH
          }
        />
      </StatGrid>

      <BusinessOperationsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
