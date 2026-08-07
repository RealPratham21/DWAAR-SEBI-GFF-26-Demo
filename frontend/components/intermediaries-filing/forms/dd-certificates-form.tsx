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
  createEmptyCertificateRecord,
  createEmptyChapterSignoffRecord,
  createEmptyConsentRecord,
  createEmptyDueDiligenceAreaRecord,
} from '@/lib/intermediaries-filing/defaults';
import {
  CERTIFICATE_FILED_TO_OPTIONS,
  CERTIFICATE_STATUS_OPTIONS,
  CERTIFICATE_TYPE_OPTIONS,
  CONSENT_PARTY_TYPE_OPTIONS,
  DUE_DILIGENCE_AREA_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import type {
  CertificateFiledTo,
  CertificateStatus,
  CertificateType,
  ConsentPartyType,
  DueDiligenceArea,
  DueDiligenceCertificatesConsentsAndSignoffs,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'due-diligence-certificates-consents-and-signoffs' as const;

export function DdCertificatesForm() {
  const { payload, updateSection } = useIntermediariesFiling();
  const value = payload.dueDiligenceCertificatesConsentsAndSignoffs;

  const set = (next: DueDiligenceCertificatesConsentsAndSignoffs) => {
    updateSection('dueDiligenceCertificatesConsentsAndSignoffs', next, SECTION_ID);
  };

  const setAreas = (dueDiligenceAreas: DueDiligenceCertificatesConsentsAndSignoffs['dueDiligenceAreas']) =>
    set({ ...value, dueDiligenceAreas });

  const setArea = (
    index: number,
    next: DueDiligenceCertificatesConsentsAndSignoffs['dueDiligenceAreas'][number],
  ) => setAreas(replaceAt(value.dueDiligenceAreas, index, next));

  const setCertificates = (
    certificates: DueDiligenceCertificatesConsentsAndSignoffs['certificates'],
  ) => set({ ...value, certificates });

  const setCertificate = (
    index: number,
    next: DueDiligenceCertificatesConsentsAndSignoffs['certificates'][number],
  ) => setCertificates(replaceAt(value.certificates, index, next));

  const setConsents = (consents: DueDiligenceCertificatesConsentsAndSignoffs['consents']) =>
    set({ ...value, consents });

  const setConsent = (
    index: number,
    next: DueDiligenceCertificatesConsentsAndSignoffs['consents'][number],
  ) => setConsents(replaceAt(value.consents, index, next));

  const setSignoffs = (chapterSignoffs: DueDiligenceCertificatesConsentsAndSignoffs['chapterSignoffs']) =>
    set({ ...value, chapterSignoffs });

  const setSignoff = (
    index: number,
    next: DueDiligenceCertificatesConsentsAndSignoffs['chapterSignoffs'][number],
  ) => setSignoffs(replaceAt(value.chapterSignoffs, index, next));

  return (
    <SectionCard
      title="Due Diligence, Certificates, Consents & Sign-offs"
      description="DD area tracker, certificate and consent registers, and chapter sign-off matrix."
    >
      <RepeatableList
        title="Due diligence areas"
        addLabel="Add DD area"
        onAdd={() => setAreas([...value.dueDiligenceAreas, createEmptyDueDiligenceAreaRecord()])}
        emptyMessage="No due diligence areas recorded."
        count={value.dueDiligenceAreas.length}
      >
        {value.dueDiligenceAreas.map((area, index) => (
          <RepeatableCard
            key={area.dueDiligenceAreaId}
            title={`DD area ${index + 1}`}
            onRemove={() => setAreas(removeAt(value.dueDiligenceAreas, index))}
            removeLabel="Remove area"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`dd-area-${index}`}
                label="Area"
                value={area.area}
                onChange={(next) =>
                  setArea(index, { ...area, area: asEnumValue<DueDiligenceArea>(next) })
                }
                options={[{ value: '', label: 'Select…' }, ...DUE_DILIGENCE_AREA_OPTIONS]}
              />
              <TextInputField
                id={`dd-source-${index}`}
                label="Source workstream"
                value={area.sourceWorkstream}
                onChange={(next) => setArea(index, { ...area, sourceWorkstream: next })}
              />
              <IntermediarySelect
                id={`dd-responsible-${index}`}
                label="Responsible professional"
                value={area.responsibleProfessionalIntermediaryId}
                onChange={(next) =>
                  setArea(index, { ...area, responsibleProfessionalIntermediaryId: next })
                }
                payload={payload}
              />
              <TernaryField
                id={`dd-started-${index}`}
                label="Due diligence started"
                value={area.dueDiligenceStarted}
                onChange={(next) => setArea(index, { ...area, dueDiligenceStarted: next })}
              />
              <TernaryField
                id={`dd-final-signoff-${index}`}
                label="Final sign-off"
                value={area.finalSignOff}
                onChange={(next) => setArea(index, { ...area, finalSignOff: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Certificates"
        addLabel="Add certificate"
        onAdd={() => setCertificates([...value.certificates, createEmptyCertificateRecord()])}
        emptyMessage="No certificates recorded."
        count={value.certificates.length}
      >
        {value.certificates.map((certificate, index) => (
          <RepeatableCard
            key={certificate.certificateId}
            title={certificate.certificateType.replaceAll('_', ' ') || `Certificate ${index + 1}`}
            onRemove={() => setCertificates(removeAt(value.certificates, index))}
            removeLabel="Remove certificate"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`certificate-type-${index}`}
                label="Certificate type"
                value={certificate.certificateType}
                onChange={(next) =>
                  setCertificate(index, {
                    ...certificate,
                    certificateType: asEnumValue<CertificateType>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...CERTIFICATE_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`certificate-provider-${index}`}
                label="Provider"
                value={certificate.provider}
                onChange={(next) => setCertificate(index, { ...certificate, provider: next })}
              />
              <IntermediarySelect
                id={`certificate-intermediary-${index}`}
                label="Linked intermediary"
                value={certificate.linkedIntermediaryId}
                onChange={(next) =>
                  setCertificate(index, { ...certificate, linkedIntermediaryId: next })
                }
                payload={payload}
              />
              <SelectField
                id={`certificate-status-${index}`}
                label="Status"
                value={certificate.status}
                onChange={(next) =>
                  setCertificate(index, {
                    ...certificate,
                    status: asEnumValue<CertificateStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...CERTIFICATE_STATUS_OPTIONS]}
              />
              <DocumentVersionSelect
                id={`certificate-document-version-${index}`}
                label="Linked offer document version"
                value={certificate.linkedOfferDocumentVersionId}
                onChange={(next) =>
                  setCertificate(index, { ...certificate, linkedOfferDocumentVersionId: next })
                }
                payload={payload}
              />
              <SelectField
                id={`certificate-filed-to-${index}`}
                label="Filed / submitted to"
                value={certificate.filedSubmittedTo}
                onChange={(next) =>
                  setCertificate(index, {
                    ...certificate,
                    filedSubmittedTo: asEnumValue<CertificateFiledTo>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...CERTIFICATE_FILED_TO_OPTIONS]}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Consents"
        addLabel="Add consent"
        onAdd={() => setConsents([...value.consents, createEmptyConsentRecord()])}
        emptyMessage="No consents recorded."
        count={value.consents.length}
      >
        {value.consents.map((consent, index) => (
          <RepeatableCard
            key={consent.consentId}
            title={consent.displayName || `Consent ${index + 1}`}
            onRemove={() => setConsents(removeAt(value.consents, index))}
            removeLabel="Remove consent"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`consent-party-type-${index}`}
                label="Party type"
                value={consent.partyType}
                onChange={(next) =>
                  setConsent(index, {
                    ...consent,
                    partyType: asEnumValue<ConsentPartyType>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...CONSENT_PARTY_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`consent-display-name-${index}`}
                label="Display name"
                value={consent.displayName}
                onChange={(next) => setConsent(index, { ...consent, displayName: next })}
              />
              <IntermediarySelect
                id={`consent-linked-${index}`}
                label="Linked person / intermediary"
                value={consent.linkedPersonIntermediaryId}
                onChange={(next) =>
                  setConsent(index, { ...consent, linkedPersonIntermediaryId: next })
                }
                payload={payload}
              />
              <TernaryField
                id={`consent-received-${index}`}
                label="Received"
                value={consent.received}
                onChange={(next) => setConsent(index, { ...consent, received: next })}
              />
              <TernaryField
                id={`consent-included-${index}`}
                label="Included in filing"
                value={consent.includedInFiling}
                onChange={(next) => setConsent(index, { ...consent, includedInFiling: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Chapter sign-offs"
        addLabel="Add chapter sign-off"
        onAdd={() => setSignoffs([...value.chapterSignoffs, createEmptyChapterSignoffRecord()])}
        emptyMessage="No chapter sign-offs recorded."
        count={value.chapterSignoffs.length}
      >
        {value.chapterSignoffs.map((signoff, index) => (
          <RepeatableCard
            key={signoff.signoffId}
            title={signoff.chapterLabel || `Chapter ${index + 1}`}
            onRemove={() => setSignoffs(removeAt(value.chapterSignoffs, index))}
            removeLabel="Remove sign-off"
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`chapter-label-${index}`}
                label="Chapter label"
                value={signoff.chapterLabel}
                onChange={(next) => setSignoff(index, { ...signoff, chapterLabel: next })}
              />
              <TextInputField
                id={`chapter-key-${index}`}
                label="Chapter / section key"
                value={signoff.chapterSectionKey}
                onChange={(next) => setSignoff(index, { ...signoff, chapterSectionKey: next })}
              />
              <IntermediarySelect
                id={`chapter-adviser-${index}`}
                label="Responsible adviser"
                value={signoff.responsibleAdviserIntermediaryId}
                onChange={(next) =>
                  setSignoff(index, { ...signoff, responsibleAdviserIntermediaryId: next })
                }
                payload={payload}
              />
              <TernaryField
                id={`legal-signoff-${index}`}
                label="Legal sign-off"
                value={signoff.legalSignOff}
                onChange={(next) => setSignoff(index, { ...signoff, legalSignOff: next })}
              />
              <TernaryField
                id={`financial-signoff-${index}`}
                label="Financial sign-off"
                value={signoff.financialSignOff}
                onChange={(next) => setSignoff(index, { ...signoff, financialSignOff: next })}
              />
              <TernaryField
                id={`final-signoff-${index}`}
                label="Final sign-off"
                value={signoff.finalSignOff}
                onChange={(next) => setSignoff(index, { ...signoff, finalSignOff: next })}
              />
              <TextInputField
                id={`final-signoff-date-${index}`}
                label="Final sign-off date"
                type="date"
                value={signoff.finalSignOffDate}
                onChange={(next) => setSignoff(index, { ...signoff, finalSignOffDate: next })}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
