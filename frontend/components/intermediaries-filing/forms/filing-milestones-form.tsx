'use client';

import {
  asEnumValue,
  DocumentVersionSelect,
  FilingSelect,
  FieldGrid,
  IntermediarySelect,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/intermediaries-filing/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/intermediaries-filing/repeatable-card';
import { IntermediariesFilingSectionActions } from '@/components/intermediaries-filing/section-actions';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import {
  createEmptyExchangeQueryRecord,
  createEmptyFilingRecord,
  createEmptyResubmissionRecord,
} from '@/lib/intermediaries-filing/defaults';
import { formatFilingLabel } from '@/lib/intermediaries-filing/filings';
import {
  EXCHANGE_QUERY_STATUS_OPTIONS,
  FILING_AUTHORITY_OPTIONS,
  FILING_STAGE_OPTIONS,
  FILING_STATUS_OPTIONS,
  OFFER_DOCUMENT_FORM_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import {
  countFilingReferences,
  formatFilingDependencyMessage,
} from '@/lib/intermediaries-filing/references';
import type {
  ExchangeQueryStatus,
  FilingAndRegulatoryMilestoneTracker,
  FilingAuthority,
  FilingRecord,
  FilingStage,
  FilingStatus,
  OfferDocumentForm,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'filing-and-regulatory-milestone-tracker' as const;

function filingHasData(filing: FilingRecord): boolean {
  return Boolean(filing.documentType || filing.filingDate.trim());
}

export function FilingMilestonesForm() {
  const { payload, updateSection } = useIntermediariesFiling();
  const value = payload.filingAndRegulatoryMilestoneTracker;

  const set = (next: FilingAndRegulatoryMilestoneTracker) => {
    updateSection('filingAndRegulatoryMilestoneTracker', next, SECTION_ID);
  };

  const setFilings = (filings: FilingRecord[]) => set({ ...value, filings });
  const setFiling = (index: number, next: FilingRecord) => {
    setFilings(replaceAt(value.filings, index, next));
  };

  const removeFiling = (index: number) => {
    const filing = value.filings[index];
    const deps = countFilingReferences(payload, filing.filingId);
    if (deps.length > 0) {
      window.alert(formatFilingDependencyMessage(payload, filing.filingId, deps));
      return;
    }
    if (filingHasData(filing) && !window.confirm('Remove this filing? Entered values will be lost.')) {
      return;
    }
    setFilings(removeAt(value.filings, index));
  };

  const setExchangeDraft = (patch: Partial<FilingAndRegulatoryMilestoneTracker['exchangeDraftFiling']>) => {
    set({ ...value, exchangeDraftFiling: { ...value.exchangeDraftFiling, ...patch } });
  };

  const setQueries = (exchangeQueries: FilingAndRegulatoryMilestoneTracker['exchangeQueries']) =>
    set({ ...value, exchangeQueries });

  const setQuery = (
    index: number,
    next: FilingAndRegulatoryMilestoneTracker['exchangeQueries'][number],
  ) => setQueries(replaceAt(value.exchangeQueries, index, next));

  const setResubmissions = (resubmissions: FilingAndRegulatoryMilestoneTracker['resubmissions']) =>
    set({ ...value, resubmissions });

  const setResubmission = (
    index: number,
    next: FilingAndRegulatoryMilestoneTracker['resubmissions'][number],
  ) => setResubmissions(replaceAt(value.resubmissions, index, next));

  const setInPrinciple = (patch: Partial<FilingAndRegulatoryMilestoneTracker['inPrincipleApproval']>) => {
    set({ ...value, inPrincipleApproval: { ...value.inPrincipleApproval, ...patch } });
  };

  const setSebiSme = (patch: Partial<FilingAndRegulatoryMilestoneTracker['sebiSmeFiling']>) => {
    set({ ...value, sebiSmeFiling: { ...value.sebiSmeFiling, ...patch } });
  };

  const setRoc = (patch: Partial<FilingAndRegulatoryMilestoneTracker['rocFiling']>) => {
    set({ ...value, rocFiling: { ...value.rocFiling, ...patch } });
  };

  return (
    <SectionCard
      title="Filing & Regulatory Milestone Tracker"
      description="Canonical filing records, exchange queries, resubmissions and regulatory milestones."
    >
      <RepeatableList
        title="Filings register"
        addLabel="Add filing"
        onAdd={() => setFilings([...value.filings, createEmptyFilingRecord()])}
        emptyMessage="No filings recorded yet."
        count={value.filings.length}
      >
        {value.filings.map((filing, index) => (
          <RepeatableCard
            key={filing.filingId}
            title={formatFilingLabel(filing, filing.filingId)}
            onRemove={() => removeFiling(index)}
            removeLabel="Remove filing"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`filing-document-type-${index}`}
                label="Document type"
                value={filing.documentType}
                onChange={(next) =>
                  setFiling(index, {
                    ...filing,
                    documentType: asEnumValue<OfferDocumentForm>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...OFFER_DOCUMENT_FORM_OPTIONS]}
              />
              <SelectField
                id={`filing-stage-${index}`}
                label="Filing stage"
                value={filing.filingStage}
                onChange={(next) =>
                  setFiling(index, { ...filing, filingStage: asEnumValue<FilingStage>(next) })
                }
                options={[{ value: '', label: 'Select…' }, ...FILING_STAGE_OPTIONS]}
              />
              <SelectField
                id={`filing-status-${index}`}
                label="Status"
                value={filing.status}
                onChange={(next) =>
                  setFiling(index, { ...filing, status: asEnumValue<FilingStatus>(next) })
                }
                options={[{ value: '', label: 'Select…' }, ...FILING_STATUS_OPTIONS]}
              />
              <SelectField
                id={`filing-authority-${index}`}
                label="Authority"
                value={filing.authority}
                onChange={(next) =>
                  setFiling(index, { ...filing, authority: asEnumValue<FilingAuthority>(next) })
                }
                options={[{ value: '', label: 'Select…' }, ...FILING_AUTHORITY_OPTIONS]}
              />
              <TextInputField
                id={`filing-date-${index}`}
                label="Filing date"
                type="date"
                value={filing.filingDate}
                onChange={(next) => setFiling(index, { ...filing, filingDate: next })}
              />
              <DocumentVersionSelect
                id={`linked-document-version-${index}`}
                label="Linked document version"
                value={filing.linkedDocumentVersionId}
                onChange={(next) =>
                  setFiling(index, { ...filing, linkedDocumentVersionId: next })
                }
                payload={payload}
              />
              <IntermediarySelect
                id={`responsible-lead-manager-${index}`}
                label="Responsible Lead Manager"
                value={filing.responsibleLeadManagerIntermediaryId}
                onChange={(next) =>
                  setFiling(index, { ...filing, responsibleLeadManagerIntermediaryId: next })
                }
                payload={payload}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Exchange draft filing">
        <FieldGrid columns={3}>
          <TextInputField
            id="exchange-draft-exchange"
            label="Exchange"
            value={value.exchangeDraftFiling.exchange}
            onChange={(next) => setExchangeDraft({ exchange: next })}
          />
          <TextInputField
            id="exchange-draft-date"
            label="Draft filing date"
            type="date"
            value={value.exchangeDraftFiling.draftFilingDate}
            onChange={(next) => setExchangeDraft({ draftFilingDate: next })}
          />
          <TernaryField
            id="checklist-submitted"
            label="Filing checklist submitted"
            value={value.exchangeDraftFiling.filingChecklistSubmitted}
            onChange={(next) => setExchangeDraft({ filingChecklistSubmitted: next })}
          />
          <TernaryField
            id="fees-paid"
            label="Fees paid"
            value={value.exchangeDraftFiling.feesPaid}
            onChange={(next) => setExchangeDraft({ feesPaid: next })}
          />
          <TernaryField
            id="application-accepted"
            label="Application accepted"
            value={value.exchangeDraftFiling.applicationAccepted}
            onChange={(next) => setExchangeDraft({ applicationAccepted: next })}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Exchange queries"
        addLabel="Add query"
        onAdd={() => setQueries([...value.exchangeQueries, createEmptyExchangeQueryRecord()])}
        emptyMessage="No exchange queries recorded."
        count={value.exchangeQueries.length}
      >
        {value.exchangeQueries.map((query, index) => (
          <RepeatableCard
            key={query.queryId}
            title={`Query ${query.queryReferenceNumber || index + 1}`}
            onRemove={() => setQueries(removeAt(value.exchangeQueries, index))}
            removeLabel="Remove query"
          >
            <FieldGrid columns={3}>
              <FilingSelect
                id={`query-filing-${index}`}
                label="Linked filing"
                value={query.filingId}
                onChange={(next) => setQuery(index, { ...query, filingId: next })}
                payload={payload}
              />
              <TextInputField
                id={`query-date-${index}`}
                label="Query date"
                type="date"
                value={query.queryDate}
                onChange={(next) => setQuery(index, { ...query, queryDate: next })}
              />
              <SelectField
                id={`query-status-${index}`}
                label="Status"
                value={query.status}
                onChange={(next) =>
                  setQuery(index, {
                    ...query,
                    status: asEnumValue<ExchangeQueryStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...EXCHANGE_QUERY_STATUS_OPTIONS]}
              />
              <TextAreaField
                id={`query-question-${index}`}
                label="Question / request"
                value={query.questionRequest}
                onChange={(next) => setQuery(index, { ...query, questionRequest: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Resubmissions"
        addLabel="Add resubmission"
        onAdd={() => setResubmissions([...value.resubmissions, createEmptyResubmissionRecord()])}
        emptyMessage="No resubmissions recorded."
        count={value.resubmissions.length}
      >
        {value.resubmissions.map((record, index) => (
          <RepeatableCard
            key={record.resubmissionId}
            title={`Resubmission ${index + 1}`}
            onRemove={() => setResubmissions(removeAt(value.resubmissions, index))}
            removeLabel="Remove resubmission"
          >
            <FieldGrid columns={3}>
              <FilingSelect
                id={`resubmission-linked-filing-${index}`}
                label="Linked filing"
                value={record.linkedFilingId}
                onChange={(next) => setResubmission(index, { ...record, linkedFilingId: next })}
                payload={payload}
              />
              <TextInputField
                id={`resubmission-date-${index}`}
                label="Resubmission date"
                type="date"
                value={record.resubmissionDate}
                onChange={(next) => setResubmission(index, { ...record, resubmissionDate: next })}
              />
              <TextAreaField
                id={`required-changes-${index}`}
                label="Required changes"
                value={record.requiredChanges}
                onChange={(next) => setResubmission(index, { ...record, requiredChanges: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="In-principle approval">
        <FieldGrid columns={3}>
          <TernaryField
            id="in-principle-applied"
            label="Applied"
            value={value.inPrincipleApproval.applied}
            onChange={(next) => setInPrinciple({ applied: next })}
          />
          <TernaryField
            id="in-principle-received"
            label="Approval received"
            value={value.inPrincipleApproval.approvalReceived}
            onChange={(next) => setInPrinciple({ approvalReceived: next })}
          />
          <TextInputField
            id="in-principle-reference"
            label="Approval reference"
            value={value.inPrincipleApproval.approvalReference}
            onChange={(next) => setInPrinciple({ approvalReference: next })}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="SEBI SME filing">
        <FieldGrid columns={3}>
          <TernaryField
            id="sebi-applicability"
            label="Filing applicability"
            value={value.sebiSmeFiling.filingApplicability}
            onChange={(next) => setSebiSme({ filingApplicability: next })}
          />
          <TextInputField
            id="sebi-filing-date"
            label="Filing date"
            type="date"
            value={value.sebiSmeFiling.filingDate}
            onChange={(next) => setSebiSme({ filingDate: next })}
          />
          <FilingSelect
            id="sebi-linked-filing"
            label="Linked filing"
            value={value.sebiSmeFiling.linkedFilingId}
            onChange={(next) => setSebiSme({ linkedFilingId: next })}
            payload={payload}
          />
          <SelectField
            id="sebi-professional-confirmation"
            label="Professional confirmation"
            value={value.sebiSmeFiling.professionalConfirmation}
            onChange={(next) =>
              setSebiSme({
                professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="RoC filing">
        <FieldGrid columns={3}>
          <SelectField
            id="roc-document-type"
            label="Document type"
            value={value.rocFiling.documentType}
            onChange={(next) =>
              setRoc({ documentType: asEnumValue<OfferDocumentForm>(next) })
            }
            options={[{ value: '', label: 'Select…' }, ...OFFER_DOCUMENT_FORM_OPTIONS]}
          />
          <TextInputField
            id="roc-filing-date"
            label="Filing date"
            type="date"
            value={value.rocFiling.filingDate}
            onChange={(next) => setRoc({ filingDate: next })}
          />
          <TernaryField
            id="roc-filing-complete"
            label="Filing complete"
            value={value.rocFiling.filingComplete}
            onChange={(next) => setRoc({ filingComplete: next })}
          />
        </FieldGrid>
      </SubSection>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
