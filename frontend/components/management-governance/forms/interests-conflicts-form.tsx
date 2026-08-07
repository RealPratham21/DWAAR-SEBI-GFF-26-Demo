'use client';

import {
  DecimalInputField,
  FieldGrid,
  SectionCard,
  SelectField,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/management-governance/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/management-governance/repeatable-card';
import { ManagementGovernanceSectionActions } from '@/components/management-governance/section-actions';
import { useManagementGovernance } from '@/lib/management-governance/context';
import {
  createEmptyAppointmentArrangementRecord,
  createEmptyInterestInIssuerRecord,
  createEmptyOutsideInterestRecord,
} from '@/lib/management-governance/defaults';
import { getDirectors } from '@/lib/management-governance/directors';
import type { InterestsConflictsAndManagementRelationships } from '@/lib/schemas/management-governance';

const SECTION_ID = 'interests-conflicts-and-management-relationships' as const;

const PERSON_TYPE_OPTIONS = [
  { value: 'director', label: 'Director' },
  { value: 'kmp', label: 'KMP' },
  { value: 'smp', label: 'Senior management' },
];

export function InterestsConflictsForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.interestsConflictsAndManagementRelationships;
  const directors = getDirectors(payload);

  const set = <K extends keyof InterestsConflictsAndManagementRelationships>(
    key: K,
    next: InterestsConflictsAndManagementRelationships[K],
  ) => {
    updateSection(
      'interestsConflictsAndManagementRelationships',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const personOptions = [
    ...directors.map((director) => ({
      value: director.id,
      label: director.fullLegalName || director.din || 'Director',
    })),
    ...payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords.map((person) => ({
      value: person.id,
      label: person.fullName || person.designation || 'KMP/SMP',
    })),
  ];

  return (
    <SectionCard
      title="Interests, Conflicts & Management Relationships"
      description="Interests in issuer, outside interests, appointment arrangements and financial arrangements."
    >
      <RepeatableList
        title="Interests in issuer"
        addLabel="Add interest"
        count={value.interestsInIssuer.length}
        emptyMessage="No interests in issuer recorded."
        onAdd={() =>
          set('interestsInIssuer', [...value.interestsInIssuer, createEmptyInterestInIssuerRecord()])
        }
      >
        {value.interestsInIssuer.map((interest, index) => (
          <RepeatableCard
            key={interest.id}
            title={`Interest ${index + 1}`}
            onRemove={() => set('interestsInIssuer', removeAt(value.interestsInIssuer, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`int-${interest.id}-person`}
                label="Person"
                value={interest.personId}
                onChange={(next) =>
                  set(
                    'interestsInIssuer',
                    replaceAt(value.interestsInIssuer, index, { ...interest, personId: next }),
                  )
                }
                options={personOptions}
                emptyLabel="Select person"
              />
              <SelectField
                id={`int-${interest.id}-type`}
                label="Person type"
                value={interest.personType}
                onChange={(next) =>
                  set(
                    'interestsInIssuer',
                    replaceAt(value.interestsInIssuer, index, {
                      ...interest,
                      personType: next as 'director' | 'kmp' | 'smp' | '',
                    }),
                  )
                }
                options={PERSON_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`int-${interest.id}-shares`}
                label="Shares or options"
                value={interest.sharesOrOptions}
                onChange={(next) =>
                  set(
                    'interestsInIssuer',
                    replaceAt(value.interestsInIssuer, index, { ...interest, sharesOrOptions: next }),
                  )
                }
              />
              <TernaryField
                id={`int-${interest.id}-promoter`}
                label="Promoter status"
                value={interest.promoterStatus}
                onChange={(next) =>
                  set(
                    'interestsInIssuer',
                    replaceAt(value.interestsInIssuer, index, { ...interest, promoterStatus: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Outside interests"
        addLabel="Add outside interest"
        count={value.outsideInterests.length}
        emptyMessage="No outside interests recorded."
        onAdd={() =>
          set('outsideInterests', [...value.outsideInterests, createEmptyOutsideInterestRecord()])
        }
      >
        {value.outsideInterests.map((interest, index) => (
          <RepeatableCard
            key={interest.id}
            title={interest.relatedEntity || `Outside interest ${index + 1}`}
            onRemove={() => set('outsideInterests', removeAt(value.outsideInterests, index))}
          >
            <FieldGrid>
              <SelectField
                id={`out-${interest.id}-person`}
                label="Person"
                value={interest.personId}
                onChange={(next) =>
                  set(
                    'outsideInterests',
                    replaceAt(value.outsideInterests, index, { ...interest, personId: next }),
                  )
                }
                options={personOptions}
                emptyLabel="Select person"
              />
              <TextInputField
                id={`out-${interest.id}-entity`}
                label="Related entity"
                value={interest.relatedEntity}
                onChange={(next) =>
                  set(
                    'outsideInterests',
                    replaceAt(value.outsideInterests, index, { ...interest, relatedEntity: next }),
                  )
                }
              />
              <TernaryField
                id={`out-${interest.id}-competes`}
                label="Competes with issuer"
                value={interest.competesWithIssuer}
                onChange={(next) =>
                  set(
                    'outsideInterests',
                    replaceAt(value.outsideInterests, index, { ...interest, competesWithIssuer: next }),
                  )
                }
              />
              <TernaryField
                id={`out-${interest.id}-rpt`}
                label="Related party status"
                value={interest.relatedPartyStatus}
                onChange={(next) =>
                  set(
                    'outsideInterests',
                    replaceAt(value.outsideInterests, index, { ...interest, relatedPartyStatus: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Appointment arrangements"
        addLabel="Add arrangement"
        count={value.appointmentArrangements.length}
        emptyMessage="No appointment arrangements recorded."
        onAdd={() =>
          set('appointmentArrangements', [
            ...value.appointmentArrangements,
            createEmptyAppointmentArrangementRecord(),
          ])
        }
      >
        {value.appointmentArrangements.map((arrangement, index) => (
          <RepeatableCard
            key={arrangement.id}
            title={arrangement.personOrEntity || `Arrangement ${index + 1}`}
            onRemove={() =>
              set('appointmentArrangements', removeAt(value.appointmentArrangements, index))
            }
          >
            <FieldGrid>
              <SelectField
                id={`arr-${arrangement.id}-person`}
                label="Person"
                value={arrangement.personId}
                onChange={(next) =>
                  set(
                    'appointmentArrangements',
                    replaceAt(value.appointmentArrangements, index, {
                      ...arrangement,
                      personId: next,
                    }),
                  )
                }
                options={personOptions}
                emptyLabel="Select person"
              />
              <TernaryField
                id={`arr-${arrangement.id}-pursuant`}
                label="Selected pursuant to arrangement"
                value={arrangement.selectedPursuantToArrangement}
                onChange={(next) =>
                  set(
                    'appointmentArrangements',
                    replaceAt(value.appointmentArrangements, index, {
                      ...arrangement,
                      selectedPursuantToArrangement: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`arr-${arrangement.id}-entity`}
                label="Person or entity"
                value={arrangement.personOrEntity}
                onChange={(next) =>
                  set(
                    'appointmentArrangements',
                    replaceAt(value.appointmentArrangements, index, {
                      ...arrangement,
                      personOrEntity: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`arr-${arrangement.id}-nature`}
                label="Nature of arrangement"
                value={arrangement.natureOfArrangement}
                onChange={(next) =>
                  set(
                    'appointmentArrangements',
                    replaceAt(value.appointmentArrangements, index, {
                      ...arrangement,
                      natureOfArrangement: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="interests-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
