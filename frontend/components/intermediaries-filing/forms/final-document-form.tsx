'use client';

import {
  asEnumValue,
  DocumentVersionSelect,
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
  createEmptyInspectionItemRecord,
  createEmptyIssueAgreementRecord,
  createEmptyOfferDocumentVersionRecord,
  createEmptyPlaceholderRecord,
  createEmptyPublicCommunicationRecord,
} from '@/lib/intermediaries-filing/defaults';
import { formatDocumentVersionLabel } from '@/lib/intermediaries-filing/filings';
import {
  IF_CONFIRMATION_FIELDS,
  ISSUE_AGREEMENT_STATUS_OPTIONS,
  ISSUE_AGREEMENT_TYPE_OPTIONS,
  OFFER_DOCUMENT_FORM_OPTIONS,
  PLACEHOLDER_STATUS_OPTIONS,
  PLACEHOLDER_TYPE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  PUBLIC_COMMUNICATION_TYPE_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import {
  countDocumentVersionReferences,
  formatDocumentVersionDependencyMessage,
} from '@/lib/intermediaries-filing/references';
import type {
  FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness,
  IssueAgreementStatus,
  IssueAgreementType,
  OfferDocumentForm,
  OfferDocumentVersionRecord,
  PlaceholderStatus,
  PlaceholderType,
  ProfessionalConfirmationStatus,
  PublicCommunicationType,
  YesNoNotSureOrEmpty,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID =
  'final-offer-document-advertisements-material-documents-and-filing-readiness' as const;

function versionHasData(version: OfferDocumentVersionRecord): boolean {
  return Boolean(version.type || version.versionLabel.trim() || version.date.trim());
}

export function FinalDocumentForm() {
  const { payload, model, updateSection } = useIntermediariesFiling();
  const value =
    payload.finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness;

  const set = (next: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness) => {
    updateSection(
      'finalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness',
      next,
      SECTION_ID,
    );
  };

  const setVersions = (
    offerDocumentVersions: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['offerDocumentVersions'],
  ) => set({ ...value, offerDocumentVersions });

  const setVersion = (
    index: number,
    next: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['offerDocumentVersions'][number],
  ) => setVersions(replaceAt(value.offerDocumentVersions, index, next));

  const removeVersion = (index: number) => {
    const version = value.offerDocumentVersions[index];
    const deps = countDocumentVersionReferences(payload, version.documentVersionId);
    if (deps.length > 0) {
      window.alert(
        formatDocumentVersionDependencyMessage(payload, version.documentVersionId, deps),
      );
      return;
    }
    if (
      versionHasData(version) &&
      !window.confirm('Remove this document version? Entered values will be lost.')
    ) {
      return;
    }
    setVersions(removeAt(value.offerDocumentVersions, index));
  };

  const setPlaceholders = (
    placeholders: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['placeholders'],
  ) => set({ ...value, placeholders });

  const setPlaceholder = (
    index: number,
    next: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['placeholders'][number],
  ) => setPlaceholders(replaceAt(value.placeholders, index, next));

  const setInspectionItems = (
    inspectionItems: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['inspectionItems'],
  ) => set({ ...value, inspectionItems });

  const setInspectionItem = (
    index: number,
    next: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['inspectionItems'][number],
  ) => setInspectionItems(replaceAt(value.inspectionItems, index, next));

  const setAgreements = (
    issueAgreements: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['issueAgreements'],
  ) => set({ ...value, issueAgreements });

  const setAgreement = (
    index: number,
    next: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['issueAgreements'][number],
  ) => setAgreements(replaceAt(value.issueAgreements, index, next));

  const setCommunications = (
    publicCommunications: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['publicCommunications'],
  ) => set({ ...value, publicCommunications });

  const setCommunication = (
    index: number,
    next: FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['publicCommunications'][number],
  ) => setCommunications(replaceAt(value.publicCommunications, index, next));

  const setAv = (
    patch: Partial<
      FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['audiovisualPresentation']
    >,
  ) => set({ ...value, audiovisualPresentation: { ...value.audiovisualPresentation, ...patch } });

  const setRepository = (
    patch: Partial<
      FinalOfferDocumentAdvertisementsMaterialDocumentsAndFilingReadiness['merchantBankerDdRepositoryReadiness']
    >,
  ) =>
    set({
      ...value,
      merchantBankerDdRepositoryReadiness: {
        ...value.merchantBankerDdRepositoryReadiness,
        ...patch,
      },
    });

  const setConfirmation = (key: keyof typeof value.finalConfirmations, next: YesNoNotSureOrEmpty) => {
    set({
      ...value,
      finalConfirmations: { ...value.finalConfirmations, [key]: next },
    });
  };

  return (
    <SectionCard
      title="Final Offer Document, Advertisements & Filing Readiness"
      description="Offer-document versions, placeholders, inspection register, agreements, communications and confirmations."
    >
      <RepeatableList
        title="Offer document versions"
        addLabel="Add document version"
        onAdd={() =>
          setVersions([...value.offerDocumentVersions, createEmptyOfferDocumentVersionRecord()])
        }
        emptyMessage="No offer document versions recorded."
        count={value.offerDocumentVersions.length}
      >
        {value.offerDocumentVersions.map((version, index) => (
          <RepeatableCard
            key={version.documentVersionId}
            title={formatDocumentVersionLabel(version, version.documentVersionId)}
            onRemove={() => removeVersion(index)}
            removeLabel="Remove version"
            requiresConfirmation={false}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`version-type-${index}`}
                label="Type"
                value={version.type}
                onChange={(next) =>
                  setVersion(index, {
                    ...version,
                    type: asEnumValue<OfferDocumentForm>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...OFFER_DOCUMENT_FORM_OPTIONS]}
              />
              <TextInputField
                id={`version-label-${index}`}
                label="Version label"
                value={version.versionLabel}
                onChange={(next) => setVersion(index, { ...version, versionLabel: next })}
              />
              <TextInputField
                id={`version-date-${index}`}
                label="Date"
                type="date"
                value={version.date}
                onChange={(next) => setVersion(index, { ...version, date: next })}
              />
              <TernaryField
                id={`authoritative-version-${index}`}
                label="Current authoritative version"
                value={version.currentAuthoritativeVersion}
                onChange={(next) =>
                  setVersion(index, { ...version, currentAuthoritativeVersion: next })
                }
              />
              <DocumentVersionSelect
                id={`supersedes-${index}`}
                label="Supersedes document version"
                value={version.supersedesDocumentVersionId}
                onChange={(next) =>
                  setVersion(index, { ...version, supersedesDocumentVersionId: next })
                }
                payload={payload}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Placeholders"
        description={`Open placeholders (derived): ${model.finalDocumentAggregates.openPlaceholderCount}`}
        addLabel="Add placeholder"
        onAdd={() => setPlaceholders([...value.placeholders, createEmptyPlaceholderRecord()])}
        emptyMessage="No placeholders recorded."
        count={value.placeholders.length}
      >
        {value.placeholders.map((placeholder, index) => (
          <RepeatableCard
            key={placeholder.placeholderId}
            title={placeholder.description || `Placeholder ${index + 1}`}
            onRemove={() => setPlaceholders(removeAt(value.placeholders, index))}
            removeLabel="Remove placeholder"
          >
            <FieldGrid columns={3}>
              <DocumentVersionSelect
                id={`placeholder-document-${index}`}
                label="Document version"
                value={placeholder.documentVersionId}
                onChange={(next) =>
                  setPlaceholder(index, { ...placeholder, documentVersionId: next })
                }
                payload={payload}
              />
              <SelectField
                id={`placeholder-type-${index}`}
                label="Placeholder type"
                value={placeholder.placeholderType}
                onChange={(next) =>
                  setPlaceholder(index, {
                    ...placeholder,
                    placeholderType: asEnumValue<PlaceholderType>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...PLACEHOLDER_TYPE_OPTIONS]}
              />
              <SelectField
                id={`placeholder-status-${index}`}
                label="Status"
                value={placeholder.status}
                onChange={(next) =>
                  setPlaceholder(index, {
                    ...placeholder,
                    status: asEnumValue<PlaceholderStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...PLACEHOLDER_STATUS_OPTIONS]}
              />
              <TextInputField
                id={`placeholder-chapter-${index}`}
                label="Chapter / section"
                value={placeholder.chapterSection}
                onChange={(next) =>
                  setPlaceholder(index, { ...placeholder, chapterSection: next })
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Inspection items"
        addLabel="Add inspection item"
        onAdd={() =>
          setInspectionItems([...value.inspectionItems, createEmptyInspectionItemRecord()])
        }
        emptyMessage="No inspection items recorded."
        count={value.inspectionItems.length}
      >
        {value.inspectionItems.map((item, index) => (
          <RepeatableCard
            key={item.inspectionItemId}
            title={item.title || `Inspection item ${index + 1}`}
            onRemove={() => setInspectionItems(removeAt(value.inspectionItems, index))}
            removeLabel="Remove item"
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`inspection-title-${index}`}
                label="Title"
                value={item.title}
                onChange={(next) => setInspectionItem(index, { ...item, title: next })}
              />
              <TextInputField
                id={`inspection-source-${index}`}
                label="Source workstream"
                value={item.sourceWorkstream}
                onChange={(next) => setInspectionItem(index, { ...item, sourceWorkstream: next })}
              />
              <TernaryField
                id={`inspection-available-${index}`}
                label="Available"
                value={item.available}
                onChange={(next) => setInspectionItem(index, { ...item, available: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Issue agreements"
        addLabel="Add agreement"
        onAdd={() => setAgreements([...value.issueAgreements, createEmptyIssueAgreementRecord()])}
        emptyMessage="No issue agreements recorded."
        count={value.issueAgreements.length}
      >
        {value.issueAgreements.map((agreement, index) => (
          <RepeatableCard
            key={agreement.issueAgreementId}
            title={agreement.type.replaceAll('_', ' ') || `Agreement ${index + 1}`}
            onRemove={() => setAgreements(removeAt(value.issueAgreements, index))}
            removeLabel="Remove agreement"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`agreement-type-${index}`}
                label="Type"
                value={agreement.type}
                onChange={(next) =>
                  setAgreement(index, {
                    ...agreement,
                    type: asEnumValue<IssueAgreementType>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...ISSUE_AGREEMENT_TYPE_OPTIONS]}
              />
              <SelectField
                id={`agreement-status-${index}`}
                label="Status"
                value={agreement.status}
                onChange={(next) =>
                  setAgreement(index, {
                    ...agreement,
                    status: asEnumValue<IssueAgreementStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...ISSUE_AGREEMENT_STATUS_OPTIONS]}
              />
              <TextInputField
                id={`agreement-date-${index}`}
                label="Agreement date"
                type="date"
                value={agreement.agreementDate}
                onChange={(next) => setAgreement(index, { ...agreement, agreementDate: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Public communications & advertisements"
        addLabel="Add communication"
        onAdd={() =>
          setCommunications([...value.publicCommunications, createEmptyPublicCommunicationRecord()])
        }
        emptyMessage="No public communications recorded."
        count={value.publicCommunications.length}
      >
        {value.publicCommunications.map((communication, index) => (
          <RepeatableCard
            key={communication.communicationId}
            title={communication.type.replaceAll('_', ' ') || `Communication ${index + 1}`}
            onRemove={() => setCommunications(removeAt(value.publicCommunications, index))}
            removeLabel="Remove communication"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`communication-type-${index}`}
                label="Type"
                value={communication.type}
                onChange={(next) =>
                  setCommunication(index, {
                    ...communication,
                    type: asEnumValue<PublicCommunicationType>(next),
                  })
                }
                options={[
                  { value: '', label: 'Select…' },
                  ...PUBLIC_COMMUNICATION_TYPE_OPTIONS,
                ]}
              />
              <TextInputField
                id={`publication-date-${index}`}
                label="Publication date"
                type="date"
                value={communication.publicationDate}
                onChange={(next) =>
                  setCommunication(index, { ...communication, publicationDate: next })
                }
              />
              <DocumentVersionSelect
                id={`communication-document-${index}`}
                label="Linked document version"
                value={communication.linkedDocumentVersionId}
                onChange={(next) =>
                  setCommunication(index, { ...communication, linkedDocumentVersionId: next })
                }
                payload={payload}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Audiovisual presentation">
        <FieldGrid columns={3}>
          <TernaryField
            id="english-av-ready"
            label="English AV ready"
            value={value.audiovisualPresentation.englishAvReady}
            onChange={(next) => setAv({ englishAvReady: next })}
          />
          <TernaryField
            id="hindi-av-ready"
            label="Hindi AV ready"
            value={value.audiovisualPresentation.hindiAvReady}
            onChange={(next) => setAv({ hindiAvReady: next })}
          />
          <DocumentVersionSelect
            id="av-linked-document"
            label="Linked offer document version"
            value={value.audiovisualPresentation.linkedOfferDocumentVersionId}
            onChange={(next) => setAv({ linkedOfferDocumentVersionId: next })}
            payload={payload}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Merchant banker DD repository readiness">
        <FieldGrid columns={3}>
          <TernaryField
            id="repository-requirement-reviewed"
            label="Repository requirement reviewed"
            value={value.merchantBankerDdRepositoryReadiness.repositoryRequirementReviewed}
            onChange={(next) => setRepository({ repositoryRequirementReviewed: next })}
          />
          <IntermediarySelect
            id="repository-lead-manager"
            label="Responsible Lead Manager"
            value={
              value.merchantBankerDdRepositoryReadiness.responsibleLeadManagerIntermediaryId
            }
            onChange={(next) =>
              setRepository({ responsibleLeadManagerIntermediaryId: next })
            }
            payload={payload}
          />
          <TernaryField
            id="upload-complete"
            label="Upload complete"
            value={value.merchantBankerDdRepositoryReadiness.uploadComplete}
            onChange={(next) => setRepository({ uploadComplete: next })}
          />
          <SelectField
            id="repository-professional-confirmation"
            label="Professional confirmation"
            value={value.merchantBankerDdRepositoryReadiness.professionalConfirmation}
            onChange={(next) =>
              setRepository({
                professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <SubSection
        title="Final confirmations checklist"
        description="Issuer confirmations for filing readiness — professional review remains required."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {IF_CONFIRMATION_FIELDS.map((field) => (
            <TernaryField
              key={field.key}
              id={`confirmation-${field.key}`}
              label={field.label}
              value={value.finalConfirmations[field.key]}
              onChange={(next) => setConfirmation(field.key, next)}
            />
          ))}
        </div>
      </SubSection>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
