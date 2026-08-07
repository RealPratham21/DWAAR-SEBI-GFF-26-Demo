'use client';

import {
  ContractSelect,
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/borrowings-assets-contracts/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/borrowings-assets-contracts/repeatable-card';
import { BorrowingsAssetsContractsSectionActions } from '@/components/borrowings-assets-contracts/section-actions';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import {
  createEmptyBreachDisputeReadinessRecord,
  createEmptyContractMaterialityRecord,
  createEmptyInspectionCandidateRecord,
  createEmptyNonOrdinaryCourseReviewRecord,
} from '@/lib/borrowings-assets-contracts/defaults';
import {
  INSPECTION_CANDIDATE_TYPE_OPTIONS,
  MATERIALITY_STATUS_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  ContractMaterialityExpiryAndInspectionReadiness,
  InspectionCandidateType,
  MaterialityStatus,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'contract-materiality-expiry-and-inspection-readiness' as const;

export function ContractMaterialityForm() {
  const { payload, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.contractMaterialityExpiryAndInspectionReadiness;

  const set = <K extends keyof ContractMaterialityExpiryAndInspectionReadiness>(
    key: K,
    next: ContractMaterialityExpiryAndInspectionReadiness[K],
  ) => {
    updateSection(
      'contractMaterialityExpiryAndInspectionReadiness',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  return (
    <SectionCard
      title="Contract Materiality, Expiry & Inspection Readiness"
      description="Materiality review, non-ordinary-course agreements, breach/dispute and inspection candidates."
    >
      <RepeatableList
        title="Materiality review"
        addLabel="Add materiality record"
        onAdd={() =>
          set('materialityRecords', [...value.materialityRecords, createEmptyContractMaterialityRecord()])
        }
        emptyMessage="No materiality records yet."
        count={value.materialityRecords.length}
      >
        {value.materialityRecords.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={`Materiality ${index + 1}`}
            onRemove={() => set('materialityRecords', removeAt(value.materialityRecords, index))}
          >
            <FieldGrid columns={3}>
              <ContractSelect
                id={`mat-${record.id}-contract`}
                label="Linked contract"
                value={record.linkedContractId}
                onChange={(next) =>
                  set(
                    'materialityRecords',
                    replaceAt(value.materialityRecords, index, { ...record, linkedContractId: next }),
                  )
                }
                payload={payload}
              />
              <TernaryField
                id={`mat-${record.id}-ordinary`}
                label="Ordinary course"
                value={record.ordinaryCourse}
                onChange={(next) =>
                  set(
                    'materialityRecords',
                    replaceAt(value.materialityRecords, index, { ...record, ordinaryCourse: next }),
                  )
                }
              />
              <TernaryField
                id={`mat-${record.id}-material-financial`}
                label="Material financially"
                value={record.materialFinancially}
                onChange={(next) =>
                  set(
                    'materialityRecords',
                    replaceAt(value.materialityRecords, index, { ...record, materialFinancially: next }),
                  )
                }
              />
              <TernaryField
                id={`mat-${record.id}-material-operational`}
                label="Material operationally"
                value={record.materialOperationally}
                onChange={(next) =>
                  set(
                    'materialityRecords',
                    replaceAt(value.materialityRecords, index, {
                      ...record,
                      materialOperationally: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`mat-${record.id}-status`}
                label="Materiality status"
                value={record.materialityStatus}
                onChange={(next) =>
                  set(
                    'materialityRecords',
                    replaceAt(value.materialityRecords, index, {
                      ...record,
                      materialityStatus: next as MaterialityStatus | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...MATERIALITY_STATUS_OPTIONS]}
              />
              <TernaryField
                id={`mat-${record.id}-drhp-relevant`}
                label="Potentially relevant to DRHP"
                value={record.potentiallyRelevantToDrhp}
                onChange={(next) =>
                  set(
                    'materialityRecords',
                    replaceAt(value.materialityRecords, index, {
                      ...record,
                      potentiallyRelevantToDrhp: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Non-ordinary-course review"
        addLabel="Add review"
        onAdd={() =>
          set('nonOrdinaryCourseReviews', [
            ...value.nonOrdinaryCourseReviews,
            createEmptyNonOrdinaryCourseReviewRecord(),
          ])
        }
        emptyMessage="No non-ordinary-course reviews yet."
        count={value.nonOrdinaryCourseReviews.length}
      >
        {value.nonOrdinaryCourseReviews.map((review, index) => (
          <RepeatableCard
            key={review.id}
            title={`Non-ordinary-course ${index + 1}`}
            onRemove={() => set('nonOrdinaryCourseReviews', removeAt(value.nonOrdinaryCourseReviews, index))}
          >
            <FieldGrid columns={3}>
              <ContractSelect
                id={`noc-${review.id}-contract`}
                label="Linked contract"
                value={review.linkedContractId}
                onChange={(next) =>
                  set(
                    'nonOrdinaryCourseReviews',
                    replaceAt(value.nonOrdinaryCourseReviews, index, {
                      ...review,
                      linkedContractId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <TextAreaField
                id={`noc-${review.id}-reason`}
                label="Reason outside ordinary course"
                value={review.reasonOutsideOrdinaryCourse}
                onChange={(next) =>
                  set(
                    'nonOrdinaryCourseReviews',
                    replaceAt(value.nonOrdinaryCourseReviews, index, {
                      ...review,
                      reasonOutsideOrdinaryCourse: next,
                    }),
                  )
                }
                rows={2}
              />
              <TernaryField
                id={`noc-${review.id}-inspection`}
                label="Inspection candidate"
                value={review.inspectionCandidate}
                onChange={(next) =>
                  set(
                    'nonOrdinaryCourseReviews',
                    replaceAt(value.nonOrdinaryCourseReviews, index, {
                      ...review,
                      inspectionCandidate: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Breach & dispute readiness"
        addLabel="Add breach/dispute record"
        onAdd={() =>
          set('breachDisputeReadiness', [
            ...value.breachDisputeReadiness,
            createEmptyBreachDisputeReadinessRecord(),
          ])
        }
        emptyMessage="No breach/dispute records yet."
        count={value.breachDisputeReadiness.length}
      >
        {value.breachDisputeReadiness.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={`Breach/dispute ${index + 1}`}
            onRemove={() => set('breachDisputeReadiness', removeAt(value.breachDisputeReadiness, index))}
          >
            <FieldGrid columns={3}>
              <ContractSelect
                id={`bd-${record.id}-contract`}
                label="Linked contract"
                value={record.linkedContractId}
                onChange={(next) =>
                  set(
                    'breachDisputeReadiness',
                    replaceAt(value.breachDisputeReadiness, index, {
                      ...record,
                      linkedContractId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <TernaryField
                id={`bd-${record.id}-current-breach`}
                label="Current breach"
                value={record.currentBreach}
                onChange={(next) =>
                  set(
                    'breachDisputeReadiness',
                    replaceAt(value.breachDisputeReadiness, index, { ...record, currentBreach: next }),
                  )
                }
              />
              <TernaryField
                id={`bd-${record.id}-dispute`}
                label="Dispute / litigation exists"
                value={record.disputeLitigationExists}
                onChange={(next) =>
                  set(
                    'breachDisputeReadiness',
                    replaceAt(value.breachDisputeReadiness, index, {
                      ...record,
                      disputeLitigationExists: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`bd-${record.id}-termination-threat`}
                label="Termination threatened"
                value={record.terminationThreatened}
                onChange={(next) =>
                  set(
                    'breachDisputeReadiness',
                    replaceAt(value.breachDisputeReadiness, index, {
                      ...record,
                      terminationThreatened: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Inspection candidates"
        addLabel="Add inspection candidate"
        onAdd={() =>
          set('inspectionCandidates', [
            ...value.inspectionCandidates,
            createEmptyInspectionCandidateRecord(),
          ])
        }
        emptyMessage="No inspection candidates yet."
        count={value.inspectionCandidates.length}
      >
        {value.inspectionCandidates.map((candidate, index) => (
          <RepeatableCard
            key={candidate.id}
            title={candidate.candidateType.replaceAll('-', ' ') || `Candidate ${index + 1}`}
            onRemove={() => set('inspectionCandidates', removeAt(value.inspectionCandidates, index))}
          >
            <FieldGrid columns={3}>
              <ContractSelect
                id={`ic-${candidate.id}-contract`}
                label="Linked contract"
                value={candidate.linkedContractId}
                onChange={(next) =>
                  set(
                    'inspectionCandidates',
                    replaceAt(value.inspectionCandidates, index, {
                      ...candidate,
                      linkedContractId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`ic-${candidate.id}-type`}
                label="Candidate type"
                value={candidate.candidateType}
                onChange={(next) =>
                  set(
                    'inspectionCandidates',
                    replaceAt(value.inspectionCandidates, index, {
                      ...candidate,
                      candidateType: next as InspectionCandidateType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...INSPECTION_CANDIDATE_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`ic-${candidate.id}-reference`}
                label="External document reference"
                value={candidate.externalDocumentReference}
                onChange={(next) =>
                  set(
                    'inspectionCandidates',
                    replaceAt(value.inspectionCandidates, index, {
                      ...candidate,
                      externalDocumentReference: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`ic-${candidate.id}-candidate`}
                label="Inspection candidate"
                value={candidate.inspectionCandidate}
                onChange={(next) =>
                  set(
                    'inspectionCandidates',
                    replaceAt(value.inspectionCandidates, index, {
                      ...candidate,
                      inspectionCandidate: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
