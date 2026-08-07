'use client';

import {
  CheckboxField,
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
  createEmptyConflictingResearchRecord,
  createEmptyIndustryRiskRecord,
  createEmptyOutlookRecord,
} from '@/lib/industry-market/defaults';
import {
  INDUSTRY_MARKET_CONFIRMATION_FIELDS,
  INDUSTRY_RISK_CATEGORY_OPTIONS,
  OUTLOOK_DATA_NATURE_OPTIONS,
} from '@/lib/industry-market/options';
import type {
  IndustryMarketConfirmations,
  IndustryRiskCategory,
  OutlookDataNature,
  OutlookIndustryRisksAndConfirmations,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'outlook-industry-risks-and-confirmations' as const;

export function OutlookConfirmationsForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.outlookIndustryRisksAndConfirmations;

  const set = <K extends keyof OutlookIndustryRisksAndConfirmations>(
    key: K,
    next: OutlookIndustryRisksAndConfirmations[K],
  ) => {
    updateSection('outlookIndustryRisksAndConfirmations', { ...value, [key]: next }, SECTION_ID);
  };

  const setConfirmation = (key: keyof IndustryMarketConfirmations, checked: boolean) => {
    set('confirmations', { ...value.confirmations, [key]: checked });
  };

  const sourceOptions = payload.researchSourcesAndIndustryReportGovernance.sources.map(
    (source) => ({
      value: source.id,
      label: source.title || source.id,
    }),
  );

  return (
    <SectionCard
      title="Outlook, Industry Risks & Confirmations"
      description="Industry outlook, risks/challenges, conflicting research register and issuer confirmations."
    >
      <RepeatableList
        title="Outlook records"
        addLabel="Add outlook"
        onAdd={() => set('outlookRecords', [...value.outlookRecords, createEmptyOutlookRecord()])}
        emptyMessage="No outlook records."
        count={value.outlookRecords.length}
      >
        {value.outlookRecords.map((outlook, index) => (
          <RepeatableCard
            key={outlook.id}
            title={outlook.market || `Outlook ${index + 1}`}
            onRemove={() => set('outlookRecords', removeAt(value.outlookRecords, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`ol-${outlook.id}-market`}
                label="Market"
                value={outlook.market}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, market: next }),
                  )
                }
              />
              <TextInputField
                id={`ol-${outlook.id}-geography`}
                label="Geography"
                value={outlook.geography}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, geography: next }),
                  )
                }
              />
              <TextInputField
                id={`ol-${outlook.id}-period`}
                label="Outlook period"
                value={outlook.outlookPeriod}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, outlookPeriod: next }),
                  )
                }
              />
              <DecimalInputField
                id={`ol-${outlook.id}-current`}
                label="Current market size"
                value={outlook.currentMarketSize}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, currentMarketSize: next }),
                  )
                }
              />
              <DecimalInputField
                id={`ol-${outlook.id}-expected`}
                label="Expected market size"
                value={outlook.expectedMarketSize}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, expectedMarketSize: next }),
                  )
                }
              />
              <DecimalInputField
                id={`ol-${outlook.id}-cagr`}
                label="Expected CAGR (%)"
                value={outlook.expectedCagr}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, expectedCagr: next }),
                  )
                }
              />
              <SelectField
                id={`ol-${outlook.id}-data-nature`}
                label="Data nature"
                value={outlook.dataNature}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, {
                      ...outlook,
                      dataNature: next as OutlookDataNature | '',
                    }),
                  )
                }
                options={OUTLOOK_DATA_NATURE_OPTIONS}
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`ol-${outlook.id}-demand`}
                label="Demand developments"
                value={outlook.demandDevelopments}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, { ...outlook, demandDevelopments: next }),
                  )
                }
              />
              <TextAreaField
                id={`ol-${outlook.id}-regulatory`}
                label="Regulatory / policy outlook"
                value={outlook.regulatoryPolicyOutlook}
                onChange={(next) =>
                  set(
                    'outlookRecords',
                    replaceAt(value.outlookRecords, index, {
                      ...outlook,
                      regulatoryPolicyOutlook: next,
                    }),
                  )
                }
              />
            </FieldGrid>
            <SourcePicker
              id={`ol-${outlook.id}-source`}
              label="Source"
              payload={payload}
              value={outlook.sourceId}
              onChange={(next) =>
                set(
                  'outlookRecords',
                  replaceAt(value.outlookRecords, index, { ...outlook, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Industry risks"
        addLabel="Add risk"
        onAdd={() => set('industryRisks', [...value.industryRisks, createEmptyIndustryRiskRecord()])}
        emptyMessage="No industry risks recorded."
        count={value.industryRisks.length}
      >
        {value.industryRisks.map((risk, index) => (
          <RepeatableCard
            key={risk.id}
            title={risk.title || `Risk ${index + 1}`}
            onRemove={() => set('industryRisks', removeAt(value.industryRisks, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`risk-${risk.id}-title`}
                label="Title"
                value={risk.title}
                onChange={(next) =>
                  set(
                    'industryRisks',
                    replaceAt(value.industryRisks, index, { ...risk, title: next }),
                  )
                }
              />
              <SelectField
                id={`risk-${risk.id}-category`}
                label="Category"
                value={risk.category}
                onChange={(next) =>
                  set(
                    'industryRisks',
                    replaceAt(value.industryRisks, index, {
                      ...risk,
                      category: next as IndustryRiskCategory | '',
                    }),
                  )
                }
                options={INDUSTRY_RISK_CATEGORY_OPTIONS}
              />
            </FieldGrid>
            <TextAreaField
              id={`risk-${risk.id}-description`}
              label="Description"
              value={risk.description}
              onChange={(next) =>
                set(
                  'industryRisks',
                  replaceAt(value.industryRisks, index, { ...risk, description: next }),
                )
              }
            />
            <SourcePicker
              id={`risk-${risk.id}-source`}
              label="Source"
              payload={payload}
              value={risk.sourceId}
              onChange={(next) =>
                set(
                  'industryRisks',
                  replaceAt(value.industryRisks, index, { ...risk, sourceId: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Conflicting research"
        addLabel="Add conflict"
        onAdd={() =>
          set('conflictingResearch', [
            ...value.conflictingResearch,
            createEmptyConflictingResearchRecord(),
          ])
        }
        emptyMessage="No conflicting research recorded."
        count={value.conflictingResearch.length}
      >
        {value.conflictingResearch.map((conflict, index) => (
          <RepeatableCard
            key={conflict.id}
            title={conflict.topic || `Conflict ${index + 1}`}
            onRemove={() =>
              set('conflictingResearch', removeAt(value.conflictingResearch, index))
            }
          >
            <TextInputField
              id={`cr-${conflict.id}-topic`}
              label="Topic"
              value={conflict.topic}
              onChange={(next) =>
                set(
                  'conflictingResearch',
                  replaceAt(value.conflictingResearch, index, { ...conflict, topic: next }),
                )
              }
            />
            <FieldGrid columns={3}>
              <SelectField
                id={`cr-${conflict.id}-source-a`}
                label="Source A"
                value={conflict.sourceAId}
                onChange={(next) =>
                  set(
                    'conflictingResearch',
                    replaceAt(value.conflictingResearch, index, { ...conflict, sourceAId: next }),
                  )
                }
                options={sourceOptions}
                emptyLabel="Select source A"
              />
              <SelectField
                id={`cr-${conflict.id}-source-b`}
                label="Source B"
                value={conflict.sourceBId}
                onChange={(next) =>
                  set(
                    'conflictingResearch',
                    replaceAt(value.conflictingResearch, index, { ...conflict, sourceBId: next }),
                  )
                }
                options={sourceOptions}
                emptyLabel="Select source B"
              />
              <DecimalInputField
                id={`cr-${conflict.id}-value-a`}
                label="Value from A"
                value={conflict.valueFromA}
                onChange={(next) =>
                  set(
                    'conflictingResearch',
                    replaceAt(value.conflictingResearch, index, { ...conflict, valueFromA: next }),
                  )
                }
              />
              <DecimalInputField
                id={`cr-${conflict.id}-value-b`}
                label="Value from B"
                value={conflict.valueFromB}
                onChange={(next) =>
                  set(
                    'conflictingResearch',
                    replaceAt(value.conflictingResearch, index, { ...conflict, valueFromB: next }),
                  )
                }
              />
            </FieldGrid>
            <FieldGrid columns={3}>
              <TernaryField
                id={`cr-${conflict.id}-reconciled`}
                label="Reconciled"
                value={conflict.reconciled}
                onChange={(next) =>
                  set(
                    'conflictingResearch',
                    replaceAt(value.conflictingResearch, index, { ...conflict, reconciled: next }),
                  )
                }
              />
              <SelectField
                id={`cr-${conflict.id}-preferred`}
                label="Preferred source"
                value={conflict.preferredSourceId}
                onChange={(next) =>
                  set(
                    'conflictingResearch',
                    replaceAt(value.conflictingResearch, index, {
                      ...conflict,
                      preferredSourceId: next,
                    }),
                  )
                }
                options={sourceOptions}
                emptyLabel="Select preferred source"
              />
            </FieldGrid>
            <TextAreaField
              id={`cr-${conflict.id}-basis`}
              label="Basis for preference"
              value={conflict.basisForPreference}
              onChange={(next) =>
                set(
                  'conflictingResearch',
                  replaceAt(value.conflictingResearch, index, {
                    ...conflict,
                    basisForPreference: next,
                  }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Issuer confirmations">
        <div className="grid gap-3 sm:grid-cols-2">
          {INDUSTRY_MARKET_CONFIRMATION_FIELDS.map((field) => (
            <CheckboxField
              key={field.key}
              id={`im-confirm-${field.key}`}
              label={field.label}
              checked={value.confirmations[field.key]}
              onChange={(checked) => setConfirmation(field.key, checked)}
            />
          ))}
        </div>
      </SubSection>

      <TextAreaField
        id="im-outlook-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
