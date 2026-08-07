'use client';

import {
  DecimalInputField,
  FieldGrid,
  SectionCard,
  SelectField,
  SourcePicker,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/industry-market/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/industry-market/repeatable-card';
import { IndustryMarketSectionActions } from '@/components/industry-market/section-actions';
import { useIndustryMarket } from '@/lib/industry-market/context';
import {
  createEmptyEntryBarrierRecord,
  createEmptyIndustryCapacityRecord,
  createEmptySupplyFactorRecord,
  createEmptyValueChainStageRecord,
} from '@/lib/industry-market/defaults';
import { BARRIER_STRENGTH_OPTIONS, BARRIER_TYPE_OPTIONS } from '@/lib/industry-market/options';
import type {
  BarrierStrength,
  BarrierType,
  ValueChainSupplyStructureAndEntryBarriers,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'value-chain-supply-structure-and-entry-barriers' as const;

export function ValueChainForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.valueChainSupplyStructureAndEntryBarriers;

  const set = <K extends keyof ValueChainSupplyStructureAndEntryBarriers>(
    key: K,
    next: ValueChainSupplyStructureAndEntryBarriers[K],
  ) => {
    updateSection('valueChainSupplyStructureAndEntryBarriers', { ...value, [key]: next }, SECTION_ID);
  };

  const setSupply = <K extends keyof ValueChainSupplyStructureAndEntryBarriers['supplySideStructure']>(
    key: K,
    next: ValueChainSupplyStructureAndEntryBarriers['supplySideStructure'][K],
  ) => {
    set('supplySideStructure', { ...value.supplySideStructure, [key]: next });
  };

  return (
    <SectionCard
      title="Value Chain, Supply Structure & Entry Barriers"
      description="Value-chain stages, supply-side structure, industry capacity and entry barriers."
    >
      <RepeatableList
        title="Value chain stages"
        addLabel="Add stage"
        onAdd={() =>
          set('valueChainStages', [...value.valueChainStages, createEmptyValueChainStageRecord()])
        }
        emptyMessage="No value-chain stages recorded."
        count={value.valueChainStages.length}
      >
        {value.valueChainStages.map((stage, index) => (
          <RepeatableCard
            key={stage.id}
            title={stage.name || `Stage ${index + 1}`}
            onRemove={() => set('valueChainStages', removeAt(value.valueChainStages, index))}
          >
            <FieldGrid columns={3}>
              <DecimalInputField
                id={`vc-${stage.id}-order`}
                label="Sequence order"
                value={stage.sequenceOrder}
                onChange={(next) =>
                  set(
                    'valueChainStages',
                    replaceAt(value.valueChainStages, index, { ...stage, sequenceOrder: next }),
                  )
                }
              />
              <TextInputField
                id={`vc-${stage.id}-name`}
                label="Stage name"
                value={stage.name}
                onChange={(next) =>
                  set(
                    'valueChainStages',
                    replaceAt(value.valueChainStages, index, { ...stage, name: next }),
                  )
                }
              />
              <TernaryField
                id={`vc-${stage.id}-participates`}
                label="Issuer participates"
                value={stage.issuerParticipates}
                onChange={(next) =>
                  set(
                    'valueChainStages',
                    replaceAt(value.valueChainStages, index, { ...stage, issuerParticipates: next }),
                  )
                }
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`vc-${stage.id}-description`}
                label="Description"
                value={stage.description}
                onChange={(next) =>
                  set(
                    'valueChainStages',
                    replaceAt(value.valueChainStages, index, { ...stage, description: next }),
                  )
                }
              />
              <TextAreaField
                id={`vc-${stage.id}-economics`}
                label="Typical economics / margin"
                value={stage.typicalEconomicsMargin}
                onChange={(next) =>
                  set(
                    'valueChainStages',
                    replaceAt(value.valueChainStages, index, {
                      ...stage,
                      typicalEconomicsMargin: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`vc-${stage.id}-source`}
              label="Source"
              payload={payload}
              value={stage.sourceId}
              onChange={(next) =>
                set(
                  'valueChainStages',
                  replaceAt(value.valueChainStages, index, { ...stage, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Supply-side structure">
        <FieldGrid>
          <TextAreaField
            id="im-supply-raw-materials"
            label="Major raw materials / inputs"
            value={value.supplySideStructure.majorRawMaterialsInputs}
            onChange={(next) => setSupply('majorRawMaterialsInputs', next)}
          />
          <TextAreaField
            id="im-supply-import-dependence"
            label="Domestic / import dependence"
            value={value.supplySideStructure.domesticImportDependence}
            onChange={(next) => setSupply('domesticImportDependence', next)}
          />
          <TextAreaField
            id="im-supply-concentration"
            label="Supply concentration"
            value={value.supplySideStructure.supplyConcentration}
            onChange={(next) => setSupply('supplyConcentration', next)}
          />
          <TextAreaField
            id="im-supply-capacity"
            label="Capacity constraints"
            value={value.supplySideStructure.capacityConstraints}
            onChange={(next) => setSupply('capacityConstraints', next)}
          />
        </FieldGrid>

        <RepeatableList
          title="Supply factors"
          addLabel="Add supply factor"
          onAdd={() =>
            setSupply('supplyFactors', [
              ...value.supplySideStructure.supplyFactors,
              createEmptySupplyFactorRecord(),
            ])
          }
          emptyMessage="No supply factors recorded."
          count={value.supplySideStructure.supplyFactors.length}
        >
          {value.supplySideStructure.supplyFactors.map((factor, index) => (
            <RepeatableCard
              key={factor.id}
              title={factor.factor || `Supply factor ${index + 1}`}
              onRemove={() =>
                setSupply('supplyFactors', removeAt(value.supplySideStructure.supplyFactors, index))
              }
            >
              <FieldGrid columns={3}>
                <TextInputField
                  id={`sf-${factor.id}-factor`}
                  label="Factor"
                  value={factor.factor}
                  onChange={(next) =>
                    setSupply(
                      'supplyFactors',
                      replaceAt(value.supplySideStructure.supplyFactors, index, {
                        ...factor,
                        factor: next,
                      }),
                    )
                  }
                />
                <DecimalInputField
                  id={`sf-${factor.id}-quant`}
                  label="Quantification"
                  value={factor.quantification}
                  onChange={(next) =>
                    setSupply(
                      'supplyFactors',
                      replaceAt(value.supplySideStructure.supplyFactors, index, {
                        ...factor,
                        quantification: next,
                      }),
                    )
                  }
                />
                <TextInputField
                  id={`sf-${factor.id}-geography`}
                  label="Geography"
                  value={factor.geography}
                  onChange={(next) =>
                    setSupply(
                      'supplyFactors',
                      replaceAt(value.supplySideStructure.supplyFactors, index, {
                        ...factor,
                        geography: next,
                      }),
                    )
                  }
                />
              </FieldGrid>
              <SourcePicker
                id={`sf-${factor.id}-source`}
                label="Source"
                payload={payload}
                value={factor.sourceId}
                onChange={(next) =>
                  setSupply(
                    'supplyFactors',
                    replaceAt(value.supplySideStructure.supplyFactors, index, {
                      ...factor,
                      sourceId: next,
                    }),
                  )
                }
              />
            </RepeatableCard>
          ))}
        </RepeatableList>
      </SubSection>

      <RepeatableList
        title="Industry capacity records"
        addLabel="Add capacity record"
        onAdd={() =>
          set('industryCapacityRecords', [
            ...value.industryCapacityRecords,
            createEmptyIndustryCapacityRecord(),
          ])
        }
        emptyMessage="No industry capacity records."
        count={value.industryCapacityRecords.length}
      >
        {value.industryCapacityRecords.map((capacity, index) => (
          <RepeatableCard
            key={capacity.id}
            title={capacity.period || `Capacity ${index + 1}`}
            onRemove={() =>
              set('industryCapacityRecords', removeAt(value.industryCapacityRecords, index))
            }
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`cap-${capacity.id}-period`}
                label="Period"
                value={capacity.period}
                onChange={(next) =>
                  set(
                    'industryCapacityRecords',
                    replaceAt(value.industryCapacityRecords, index, { ...capacity, period: next }),
                  )
                }
              />
              <DecimalInputField
                id={`cap-${capacity.id}-installed`}
                label="Installed industry capacity"
                value={capacity.installedIndustryCapacity}
                onChange={(next) =>
                  set(
                    'industryCapacityRecords',
                    replaceAt(value.industryCapacityRecords, index, {
                      ...capacity,
                      installedIndustryCapacity: next,
                    }),
                  )
                }
              />
              <DecimalInputField
                id={`cap-${capacity.id}-utilisation`}
                label="Capacity utilisation"
                value={capacity.capacityUtilisation}
                onChange={(next) =>
                  set(
                    'industryCapacityRecords',
                    replaceAt(value.industryCapacityRecords, index, {
                      ...capacity,
                      capacityUtilisation: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`cap-${capacity.id}-source`}
              label="Source"
              payload={payload}
              value={capacity.sourceId}
              onChange={(next) =>
                set(
                  'industryCapacityRecords',
                  replaceAt(value.industryCapacityRecords, index, { ...capacity, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Entry barriers"
        addLabel="Add entry barrier"
        onAdd={() => set('entryBarriers', [...value.entryBarriers, createEmptyEntryBarrierRecord()])}
        emptyMessage="No entry barriers recorded."
        count={value.entryBarriers.length}
      >
        {value.entryBarriers.map((barrier, index) => (
          <RepeatableCard
            key={barrier.id}
            title={barrier.barrierType || `Barrier ${index + 1}`}
            onRemove={() => set('entryBarriers', removeAt(value.entryBarriers, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`eb-${barrier.id}-type`}
                label="Barrier type"
                value={barrier.barrierType}
                onChange={(next) =>
                  set(
                    'entryBarriers',
                    replaceAt(value.entryBarriers, index, {
                      ...barrier,
                      barrierType: next as BarrierType | '',
                    }),
                  )
                }
                options={BARRIER_TYPE_OPTIONS}
              />
              <SelectField
                id={`eb-${barrier.id}-strength`}
                label="Strength"
                value={barrier.strength}
                onChange={(next) =>
                  set(
                    'entryBarriers',
                    replaceAt(value.entryBarriers, index, {
                      ...barrier,
                      strength: next as BarrierStrength | '',
                    }),
                  )
                }
                options={BARRIER_STRENGTH_OPTIONS}
              />
            </FieldGrid>
            <TextAreaField
              id={`eb-${barrier.id}-description`}
              label="Description"
              value={barrier.description}
              onChange={(next) =>
                set(
                  'entryBarriers',
                  replaceAt(value.entryBarriers, index, { ...barrier, description: next }),
                )
              }
            />
            <SourcePicker
              id={`eb-${barrier.id}-source`}
              label="Source"
              payload={payload}
              value={barrier.sourceId}
              onChange={(next) =>
                set(
                  'entryBarriers',
                  replaceAt(value.entryBarriers, index, { ...barrier, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="im-vc-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
