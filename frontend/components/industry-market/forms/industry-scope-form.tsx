'use client';

import {
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
  TextAreaField,
  TextInputField,
} from '@/components/industry-market/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/industry-market/repeatable-card';
import { IndustryMarketSectionActions } from '@/components/industry-market/section-actions';
import { useIndustryMarket } from '@/lib/industry-market/context';
import {
  createEmptyCompanyMarketMappingRecord,
  createEmptyScopeExclusionRecord,
} from '@/lib/industry-market/defaults';
import {
  CLASSIFICATION_SOURCE_OPTIONS,
  GEOGRAPHY_OPTIONS,
  SCOPE_EXCLUSION_TYPE_OPTIONS,
} from '@/lib/industry-market/options';
import type {
  ClassificationSource,
  CompanyMarketMappingRecord,
  Geography,
  IndustryScopeAndCompanyMarketMapping,
  ScopeExclusionType,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'industry-scope-and-company-market-mapping' as const;

export function IndustryScopeForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.industryScopeAndCompanyMarketMapping;

  const set = <K extends keyof IndustryScopeAndCompanyMarketMapping>(
    key: K,
    next: IndustryScopeAndCompanyMarketMapping[K],
  ) => {
    updateSection('industryScopeAndCompanyMarketMapping', { ...value, [key]: next }, SECTION_ID);
  };

  const setClassification = <K extends keyof IndustryScopeAndCompanyMarketMapping['industryClassification']>(
    key: K,
    next: IndustryScopeAndCompanyMarketMapping['industryClassification'][K],
  ) => {
    set('industryClassification', { ...value.industryClassification, [key]: next });
  };

  const setMarketDefinition = <K extends keyof IndustryScopeAndCompanyMarketMapping['marketDefinition']>(
    key: K,
    next: IndustryScopeAndCompanyMarketMapping['marketDefinition'][K],
  ) => {
    set('marketDefinition', { ...value.marketDefinition, [key]: next });
  };

  const setMapping = <K extends keyof CompanyMarketMappingRecord>(
    index: number,
    key: K,
    next: CompanyMarketMappingRecord[K],
  ) => {
    set(
      'companyMarketMappings',
      replaceAt(value.companyMarketMappings, index, {
        ...value.companyMarketMappings[index],
        [key]: next,
      }),
    );
  };

  const removeMapping = (index: number) => {
    const record = value.companyMarketMappings[index];
    if (
      hasRecordData([record.marketSegment, record.relevantRevenueContribution]) &&
      !window.confirm('Remove this company-to-market mapping? Entered values will be lost.')
    ) {
      return;
    }
    set('companyMarketMappings', removeAt(value.companyMarketMappings, index));
  };

  const setExclusion = <K extends keyof IndustryScopeAndCompanyMarketMapping['scopeExclusions'][number]>(
    index: number,
    key: K,
    next: IndustryScopeAndCompanyMarketMapping['scopeExclusions'][number][K],
  ) => {
    set(
      'scopeExclusions',
      replaceAt(value.scopeExclusions, index, {
        ...value.scopeExclusions[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Industry Scope & Company-to-Market Mapping"
      description="Industry classification, market definition, issuer mapping and scope exclusions."
    >
      <SubSection title="Industry classification">
        <FieldGrid columns={3}>
          <TextInputField
            id="im-primary-industry"
            label="Primary industry"
            value={value.industryClassification.primaryIndustry}
            onChange={(next) => setClassification('primaryIndustry', next)}
          />
          <TextInputField
            id="im-primary-sub-industry"
            label="Primary sub-industry"
            value={value.industryClassification.primarySubIndustry}
            onChange={(next) => setClassification('primarySubIndustry', next)}
          />
          <SelectField
            id="im-classification-source"
            label="Classification source"
            value={value.industryClassification.classificationSource}
            onChange={(next) =>
              setClassification('classificationSource', next as ClassificationSource | '')
            }
            options={CLASSIFICATION_SOURCE_OPTIONS}
          />
          <TextInputField
            id="im-classification-code"
            label="Classification code"
            value={value.industryClassification.classificationCode}
            onChange={(next) => setClassification('classificationCode', next)}
          />
        </FieldGrid>
        <FieldGrid>
          <TextAreaField
            id="im-industry-description"
            label="Industry description"
            value={value.industryClassification.industryDescription}
            onChange={(next) => setClassification('industryDescription', next)}
          />
          <TextAreaField
            id="im-sub-industry-description"
            label="Sub-industry description"
            value={value.industryClassification.subIndustryDescription}
            onChange={(next) => setClassification('subIndustryDescription', next)}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Market definition">
        <FieldGrid columns={3}>
          <TextInputField
            id="im-market-name"
            label="Market name"
            value={value.marketDefinition.marketName}
            onChange={(next) => setMarketDefinition('marketName', next)}
          />
          <SelectField
            id="im-geography"
            label="Geography"
            value={value.marketDefinition.geography}
            onChange={(next) => setMarketDefinition('geography', next as Geography | '')}
            options={GEOGRAPHY_OPTIONS}
          />
          <TextInputField
            id="im-geography-detail"
            label="Geography detail"
            value={value.marketDefinition.geographyDetail}
            onChange={(next) => setMarketDefinition('geographyDetail', next)}
          />
          <TextInputField
            id="im-product-service-category"
            label="Product / service category"
            value={value.marketDefinition.productServiceCategory}
            onChange={(next) => setMarketDefinition('productServiceCategory', next)}
          />
          <TextInputField
            id="im-value-chain-stage"
            label="Relevant value-chain stage"
            value={value.marketDefinition.relevantValueChainStage}
            onChange={(next) => setMarketDefinition('relevantValueChainStage', next)}
          />
          <TextInputField
            id="im-end-user-segment"
            label="End-user / customer segment"
            value={value.marketDefinition.endUserCustomerSegment}
            onChange={(next) => setMarketDefinition('endUserCustomerSegment', next)}
          />
        </FieldGrid>
        <FieldGrid>
          <TextAreaField
            id="im-market-description"
            label="Market description"
            value={value.marketDefinition.marketDescription}
            onChange={(next) => setMarketDefinition('marketDescription', next)}
          />
          <TextAreaField
            id="im-market-boundary"
            label="Market boundary explanation"
            value={value.marketDefinition.marketBoundaryExplanation}
            onChange={(next) => setMarketDefinition('marketBoundaryExplanation', next)}
          />
          <TextAreaField
            id="im-relevance-to-issuer"
            label="Relevance to issuer"
            value={value.marketDefinition.relevanceToIssuerExplanation}
            onChange={(next) => setMarketDefinition('relevanceToIssuerExplanation', next)}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Company-to-market mappings"
        description="Map issuer products, segments and geographies to the defined market."
        addLabel="Add mapping"
        onAdd={() =>
          set('companyMarketMappings', [
            ...value.companyMarketMappings,
            createEmptyCompanyMarketMappingRecord(),
          ])
        }
        emptyMessage="No company-to-market mappings recorded."
        count={value.companyMarketMappings.length}
      >
        {value.companyMarketMappings.map((mapping, index) => (
          <RepeatableCard
            key={mapping.id}
            title={mapping.marketSegment || `Mapping ${index + 1}`}
            onRemove={() => removeMapping(index)}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`mapping-${mapping.id}-segment`}
                label="Market segment"
                value={mapping.marketSegment}
                onChange={(next) => setMapping(index, 'marketSegment', next)}
              />
              <TextInputField
                id={`mapping-${mapping.id}-revenue`}
                label="Relevant revenue contribution"
                value={mapping.relevantRevenueContribution}
                onChange={(next) => setMapping(index, 'relevantRevenueContribution', next)}
              />
              <TextInputField
                id={`mapping-${mapping.id}-geography`}
                label="Relevant geography"
                value={mapping.relevantGeography}
                onChange={(next) => setMapping(index, 'relevantGeography', next)}
              />
              <TextInputField
                id={`mapping-${mapping.id}-participation`}
                label="Direct / indirect participation"
                value={mapping.directIndirectParticipation}
                onChange={(next) => setMapping(index, 'directIndirectParticipation', next)}
              />
              <TextInputField
                id={`mapping-${mapping.id}-nature`}
                label="Nature of participation"
                value={mapping.natureOfParticipation}
                onChange={(next) => setMapping(index, 'natureOfParticipation', next)}
              />
              <TextInputField
                id={`mapping-${mapping.id}-materiality`}
                label="Materiality"
                value={mapping.materiality}
                onChange={(next) => setMapping(index, 'materiality', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`mapping-${mapping.id}-notes`}
              label="Notes"
              value={mapping.notes}
              onChange={(next) => setMapping(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Scope exclusions"
        description="Adjacent, upstream, downstream or geography exclusions affecting market interpretation."
        addLabel="Add exclusion"
        onAdd={() =>
          set('scopeExclusions', [...value.scopeExclusions, createEmptyScopeExclusionRecord()])
        }
        emptyMessage="No scope exclusions recorded."
        count={value.scopeExclusions.length}
      >
        {value.scopeExclusions.map((exclusion, index) => (
          <RepeatableCard
            key={exclusion.id}
            title={exclusion.description || `Exclusion ${index + 1}`}
            onRemove={() => set('scopeExclusions', removeAt(value.scopeExclusions, index))}
          >
            <FieldGrid>
              <SelectField
                id={`excl-${exclusion.id}-type`}
                label="Exclusion type"
                value={exclusion.exclusionType}
                onChange={(next) => setExclusion(index, 'exclusionType', next as ScopeExclusionType | '')}
                options={SCOPE_EXCLUSION_TYPE_OPTIONS}
              />
              <TextInputField
                id={`excl-${exclusion.id}-description`}
                label="Description"
                value={exclusion.description}
                onChange={(next) => setExclusion(index, 'description', next)}
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`excl-${exclusion.id}-reason`}
                label="Reason excluded"
                value={exclusion.reasonExcluded}
                onChange={(next) => setExclusion(index, 'reasonExcluded', next)}
              />
              <TextAreaField
                id={`excl-${exclusion.id}-impact`}
                label="Impact on market-size interpretation"
                value={exclusion.impactOnMarketSizeInterpretation}
                onChange={(next) => setExclusion(index, 'impactOnMarketSizeInterpretation', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="im-scope-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
