'use client';

import {
  DataNatureBadge,
  DateField,
  FieldGrid,
  SectionCard,
  SelectField,
  SourceBadge,
  StaleSourceIndicator,
  SubSection,
  TernaryField,
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
import { createEmptySourceRecord } from '@/lib/industry-market/defaults';
import {
  COMMISSIONED_REPORT_PURPOSE_OPTIONS,
  DATA_NATURE_OPTIONS,
  SOURCE_READINESS_STATUS_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from '@/lib/industry-market/options';
import { countSourceReferences } from '@/lib/industry-market/references';
import type {
  DataNature,
  ResearchSourcesAndIndustryReportGovernance,
  SourceReadinessStatus,
  SourceRecord,
  SourceType,
} from '@/lib/schemas/industry-market';

const SECTION_ID = 'research-sources-and-industry-report-governance' as const;

function isCommissionedReport(source: SourceRecord): boolean {
  return source.sourceType === 'commissioned-industry-report';
}

export function ResearchSourcesForm() {
  const { payload, updateSection } = useIndustryMarket();
  const value = payload.researchSourcesAndIndustryReportGovernance;

  const set = <K extends keyof ResearchSourcesAndIndustryReportGovernance>(
    key: K,
    next: ResearchSourcesAndIndustryReportGovernance[K],
  ) => {
    updateSection('researchSourcesAndIndustryReportGovernance', { ...value, [key]: next }, SECTION_ID);
  };

  const setSources = (next: SourceRecord[]) => set('sources', next);

  const setSource = <K extends keyof SourceRecord>(index: number, key: K, next: SourceRecord[K]) => {
    setSources(replaceAt(value.sources, index, { ...value.sources[index], [key]: next }));
  };

  const setCommissioned = <K extends keyof SourceRecord['commissionedReportDetails']>(
    index: number,
    key: K,
    next: SourceRecord['commissionedReportDetails'][K],
  ) => {
    const source = value.sources[index];
    setSource(index, 'commissionedReportDetails', {
      ...source.commissionedReportDetails,
      [key]: next,
    });
  };

  const setMethodology = <K extends keyof SourceRecord['methodology']>(
    index: number,
    key: K,
    next: SourceRecord['methodology'][K],
  ) => {
    const source = value.sources[index];
    setSource(index, 'methodology', { ...source.methodology, [key]: next });
  };

  const removeSource = (index: number) => {
    const source = value.sources[index];
    const refs = countSourceReferences(payload, source.id);
    if (refs.total > 0) {
      window.alert(
        `This source is referenced in ${refs.total} place(s):\n${refs.locations.join('\n')}`,
      );
      return;
    }
    if (
      hasRecordData([source.title, source.publisherAuthor]) &&
      !window.confirm('Remove this source? Entered values will be lost.')
    ) {
      return;
    }
    setSources(removeAt(value.sources, index));
  };

  return (
    <SectionCard
      title="Research Sources & Industry Report Governance"
      description="Master source registry with commissioned-report governance, methodology and readiness status."
    >
      <RepeatableList
        title="Source registry"
        description="Each source carries a stable ID referenced across market data, competition and outlook sections."
        addLabel="Add source"
        onAdd={() => setSources([...value.sources, createEmptySourceRecord()])}
        emptyMessage="No research sources recorded yet."
        count={value.sources.length}
      >
        {value.sources.map((source, index) => (
          <RepeatableCard
            key={source.id}
            title={source.title || `Source ${index + 1}`}
            subtitle={source.publisherAuthor || undefined}
            onRemove={() => removeSource(index)}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`src-${source.id}-type`}
                label="Source type"
                value={source.sourceType}
                onChange={(next) => setSource(index, 'sourceType', next as SourceType | '')}
                options={SOURCE_TYPE_OPTIONS}
              />
              <TextInputField
                id={`src-${source.id}-title`}
                label="Title"
                value={source.title}
                onChange={(next) => setSource(index, 'title', next)}
              />
              <TextInputField
                id={`src-${source.id}-publisher`}
                label="Publisher / author"
                value={source.publisherAuthor}
                onChange={(next) => setSource(index, 'publisherAuthor', next)}
              />
              <DateField
                id={`src-${source.id}-pub-date`}
                label="Publication date"
                value={source.publicationDate}
                onChange={(next) => setSource(index, 'publicationDate', next)}
              />
              <DateField
                id={`src-${source.id}-cutoff`}
                label="Data cut-off date"
                value={source.dataCutOffDate}
                onChange={(next) => setSource(index, 'dataCutOffDate', next)}
              />
              <DateField
                id={`src-${source.id}-accessed`}
                label="Date accessed"
                value={source.dateAccessed}
                onChange={(next) => setSource(index, 'dateAccessed', next)}
              />
              <SelectField
                id={`src-${source.id}-data-nature`}
                label="Data nature"
                value={source.dataNature}
                onChange={(next) => setSource(index, 'dataNature', next as DataNature | '')}
                options={DATA_NATURE_OPTIONS}
              />
              <SelectField
                id={`src-${source.id}-readiness`}
                label="Source readiness status"
                value={source.sourceReadinessStatus}
                onChange={(next) =>
                  setSource(index, 'sourceReadinessStatus', next as SourceReadinessStatus | '')
                }
                options={SOURCE_READINESS_STATUS_OPTIONS}
              />
              <TextInputField
                id={`src-${source.id}-currency`}
                label="Currency"
                value={source.currency}
                onChange={(next) => setSource(index, 'currency', next)}
              />
            </FieldGrid>

            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={source} />
              {source.dataNature ? <DataNatureBadge dataNature={source.dataNature} /> : null}
              {source.sourceReadinessStatus ? (
                <StaleSourceIndicator status={source.sourceReadinessStatus} />
              ) : null}
            </div>

            <FieldGrid>
              <TextInputField
                id={`src-${source.id}-url`}
                label="URL / reference"
                value={source.urlReference}
                onChange={(next) => setSource(index, 'urlReference', next)}
              />
              <TextInputField
                id={`src-${source.id}-page`}
                label="Page / section reference"
                value={source.pageSectionReference}
                onChange={(next) => setSource(index, 'pageSectionReference', next)}
              />
            </FieldGrid>

            {isCommissionedReport(source) ? (
              <SubSection
                title="Commissioned report details"
                description="Required when source type is commissioned industry report."
              >
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`src-${source.id}-provider`}
                    label="Research provider"
                    value={source.commissionedReportDetails.researchProvider}
                    onChange={(next) => setCommissioned(index, 'researchProvider', next)}
                  />
                  <SelectField
                    id={`src-${source.id}-purpose`}
                    label="Purpose"
                    value={source.commissionedReportDetails.purpose}
                    onChange={(next) => setCommissioned(index, 'purpose', next as '' | 'specifically-for-ipo' | 'existing-research-subscription' | 'other')}
                    options={COMMISSIONED_REPORT_PURPOSE_OPTIONS}
                  />
                  <TextInputField
                    id={`src-${source.id}-who-paid`}
                    label="Who paid"
                    value={source.commissionedReportDetails.whoPaid}
                    onChange={(next) => setCommissioned(index, 'whoPaid', next)}
                  />
                  <DateField
                    id={`src-${source.id}-engagement`}
                    label="Engagement date"
                    value={source.commissionedReportDetails.engagementDate}
                    onChange={(next) => setCommissioned(index, 'engagementDate', next)}
                  />
                  <DateField
                    id={`src-${source.id}-report-date`}
                    label="Report date"
                    value={source.commissionedReportDetails.reportDate}
                    onChange={(next) => setCommissioned(index, 'reportDate', next)}
                  />
                  <TernaryField
                    id={`src-${source.id}-independence`}
                    label="Independence confirmed"
                    value={source.commissionedReportDetails.independenceConfirmed}
                    onChange={(next) => setCommissioned(index, 'independenceConfirmed', next)}
                  />
                  <TernaryField
                    id={`src-${source.id}-commissioned-issuer`}
                    label="Commissioned by issuer"
                    value={source.commissionedReportDetails.commissionedByIssuer}
                    onChange={(next) => setCommissioned(index, 'commissionedByIssuer', next)}
                  />
                  <TernaryField
                    id={`src-${source.id}-material-doc`}
                    label="Included as material document"
                    value={source.commissionedReportDetails.includedProposedAsMaterialDocument}
                    onChange={(next) =>
                      setCommissioned(index, 'includedProposedAsMaterialDocument', next)
                    }
                  />
                </FieldGrid>
                <TextAreaField
                  id={`src-${source.id}-relationship`}
                  label="Relationship with issuer / promoters / directors / KMP / BRLM"
                  value={source.commissionedReportDetails.relationshipWithIssuerPromotersDirectorsKmpBrlm}
                  onChange={(next) =>
                    setCommissioned(index, 'relationshipWithIssuerPromotersDirectorsKmpBrlm', next)
                  }
                />
                <FieldGrid>
                  <TextInputField
                    id={`src-${source.id}-consent`}
                    label="Consent / no-objection status"
                    value={source.commissionedReportDetails.consentNoObjectionStatus}
                    onChange={(next) => setCommissioned(index, 'consentNoObjectionStatus', next)}
                  />
                  <TextInputField
                    id={`src-${source.id}-public-availability`}
                    label="Public availability status"
                    value={source.commissionedReportDetails.publicAvailabilityStatus}
                    onChange={(next) => setCommissioned(index, 'publicAvailabilityStatus', next)}
                  />
                </FieldGrid>
              </SubSection>
            ) : null}

            <SubSection title="Methodology">
              <FieldGrid columns={3}>
                <TernaryField
                  id={`src-${source.id}-primary-research`}
                  label="Primary research used"
                  value={source.methodology.primaryResearchUsed}
                  onChange={(next) => setMethodology(index, 'primaryResearchUsed', next)}
                />
                <TernaryField
                  id={`src-${source.id}-secondary-research`}
                  label="Secondary research used"
                  value={source.methodology.secondaryResearchUsed}
                  onChange={(next) => setMethodology(index, 'secondaryResearchUsed', next)}
                />
                <TextInputField
                  id={`src-${source.id}-sample-size`}
                  label="Sample size"
                  value={source.methodology.sampleSize}
                  onChange={(next) => setMethodology(index, 'sampleSize', next)}
                />
              </FieldGrid>
              <FieldGrid>
                <TextAreaField
                  id={`src-${source.id}-calc-method`}
                  label="Calculation methodology"
                  value={source.methodology.calculationMethodology}
                  onChange={(next) => setMethodology(index, 'calculationMethodology', next)}
                />
                <TextAreaField
                  id={`src-${source.id}-limitations`}
                  label="Limitations"
                  value={source.methodology.limitations}
                  onChange={(next) => setMethodology(index, 'limitations', next)}
                />
              </FieldGrid>
            </SubSection>

            <TextAreaField
              id={`src-${source.id}-notes`}
              label="Notes"
              value={source.notes}
              onChange={(next) => setSource(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="im-sources-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <IndustryMarketSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
