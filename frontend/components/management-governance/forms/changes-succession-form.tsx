'use client';

import {
  DateField,
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
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
  createEmptyBoardChangeRecord,
  createEmptyKeyPersonDependencyRecord,
  createEmptyKmpSmpChangeRecord,
} from '@/lib/management-governance/defaults';
import { getDirectors } from '@/lib/management-governance/directors';
import { BOARD_CHANGE_EVENT_OPTIONS } from '@/lib/management-governance/options';
import type {
  BoardChangeEvent,
  ChangesContinuityAndSuccession,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'changes-continuity-and-succession' as const;

export function ChangesSuccessionForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.changesContinuityAndSuccession;
  const directors = getDirectors(payload);

  const set = <K extends keyof ChangesContinuityAndSuccession>(
    key: K,
    next: ChangesContinuityAndSuccession[K],
  ) => {
    updateSection('changesContinuityAndSuccession', { ...value, [key]: next }, SECTION_ID);
  };

  const directorOptions = directors.map((director) => ({
    value: director.id,
    label: director.fullLegalName || director.din || director.id.slice(0, 8),
  }));

  const kmpOptions = payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords.map(
    (person) => ({
      value: person.id,
      label: person.fullName || person.designation || person.id.slice(0, 8),
    }),
  );

  return (
    <SectionCard
      title="Changes, Continuity & Succession"
      description="Three-year Board and KMP/SMP changes, succession readiness and key-person dependencies."
    >
      <RepeatableList
        title="Board changes (3-year)"
        addLabel="Add board change"
        count={value.boardChanges.length}
        emptyMessage="No board changes recorded."
        onAdd={() => set('boardChanges', [...value.boardChanges, createEmptyBoardChangeRecord()])}
      >
        {value.boardChanges.map((change, index) => (
          <RepeatableCard
            key={change.id}
            title={change.event || `Board change ${index + 1}`}
            onRemove={() => set('boardChanges', removeAt(value.boardChanges, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`bc-${change.id}-director`}
                label="Director"
                value={change.directorId}
                onChange={(next) =>
                  set(
                    'boardChanges',
                    replaceAt(value.boardChanges, index, { ...change, directorId: next }),
                  )
                }
                options={directorOptions}
                emptyLabel="Select director"
              />
              <SelectField
                id={`bc-${change.id}-event`}
                label="Event"
                value={change.event}
                onChange={(next) =>
                  set(
                    'boardChanges',
                    replaceAt(value.boardChanges, index, {
                      ...change,
                      event: next as BoardChangeEvent | '',
                    }),
                  )
                }
                options={BOARD_CHANGE_EVENT_OPTIONS}
              />
              <DateField
                id={`bc-${change.id}-date`}
                label="Effective date"
                value={change.effectiveDate}
                onChange={(next) =>
                  set(
                    'boardChanges',
                    replaceAt(value.boardChanges, index, { ...change, effectiveDate: next }),
                  )
                }
              />
              <TextInputField
                id={`bc-${change.id}-prev-desig`}
                label="Previous designation"
                value={change.previousDesignation}
                onChange={(next) =>
                  set(
                    'boardChanges',
                    replaceAt(value.boardChanges, index, { ...change, previousDesignation: next }),
                  )
                }
              />
              <TextInputField
                id={`bc-${change.id}-new-desig`}
                label="New designation"
                value={change.newDesignation}
                onChange={(next) =>
                  set(
                    'boardChanges',
                    replaceAt(value.boardChanges, index, { ...change, newDesignation: next }),
                  )
                }
              />
              <TernaryField
                id={`bc-${change.id}-replacement`}
                label="Replacement appointed"
                value={change.replacementAppointed}
                onChange={(next) =>
                  set(
                    'boardChanges',
                    replaceAt(value.boardChanges, index, { ...change, replacementAppointed: next }),
                  )
                }
              />
            </FieldGrid>
            <TextAreaField
              id={`bc-${change.id}-reason`}
              label="Reason"
              rows={2}
              value={change.reason}
              onChange={(next) =>
                set(
                  'boardChanges',
                  replaceAt(value.boardChanges, index, { ...change, reason: next }),
                )
              }
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="KMP / SMP changes (3-year)"
        addLabel="Add KMP change"
        count={value.kmpSmpChanges.length}
        emptyMessage="No KMP/SMP changes recorded."
        onAdd={() => set('kmpSmpChanges', [...value.kmpSmpChanges, createEmptyKmpSmpChangeRecord()])}
      >
        {value.kmpSmpChanges.map((change, index) => (
          <RepeatableCard
            key={change.id}
            title={change.event || `KMP change ${index + 1}`}
            onRemove={() => set('kmpSmpChanges', removeAt(value.kmpSmpChanges, index))}
          >
            <FieldGrid>
              <SelectField
                id={`kmc-${change.id}-person`}
                label="Person"
                value={change.personId}
                onChange={(next) =>
                  set(
                    'kmpSmpChanges',
                    replaceAt(value.kmpSmpChanges, index, { ...change, personId: next }),
                  )
                }
                options={kmpOptions}
                emptyLabel="Select person"
              />
              <SelectField
                id={`kmc-${change.id}-event`}
                label="Event"
                value={change.event}
                onChange={(next) =>
                  set(
                    'kmpSmpChanges',
                    replaceAt(value.kmpSmpChanges, index, {
                      ...change,
                      event: next as BoardChangeEvent | '',
                    }),
                  )
                }
                options={BOARD_CHANGE_EVENT_OPTIONS}
              />
              <DateField
                id={`kmc-${change.id}-date`}
                label="Effective date"
                value={change.effectiveDate}
                onChange={(next) =>
                  set(
                    'kmpSmpChanges',
                    replaceAt(value.kmpSmpChanges, index, { ...change, effectiveDate: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Succession readiness">
        <FieldGrid columns={3}>
          <TernaryField
            id="succ-formal-plan"
            label="Formal succession plan"
            value={value.successionReadiness.formalSuccessionPlan}
            onChange={(next) =>
              set('successionReadiness', {
                ...value.successionReadiness,
                formalSuccessionPlan: next,
              })
            }
          />
          <TernaryField
            id="succ-critical-roles"
            label="Critical roles identified"
            value={value.successionReadiness.criticalRolesIdentified}
            onChange={(next) =>
              set('successionReadiness', {
                ...value.successionReadiness,
                criticalRolesIdentified: next,
              })
            }
          />
          <TernaryField
            id="succ-md-ceo"
            label="MD/CEO succession coverage"
            value={value.successionReadiness.mdCeoSuccessionCoverage}
            onChange={(next) =>
              set('successionReadiness', {
                ...value.successionReadiness,
                mdCeoSuccessionCoverage: next,
              })
            }
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Key person dependencies"
        addLabel="Add dependency"
        count={value.keyPersonDependencies.length}
        emptyMessage="No key person dependencies recorded."
        onAdd={() =>
          set('keyPersonDependencies', [
            ...value.keyPersonDependencies,
            createEmptyKeyPersonDependencyRecord(),
          ])
        }
      >
        {value.keyPersonDependencies.map((dependency, index) => (
          <RepeatableCard
            key={dependency.id}
            title={dependency.role || `Dependency ${index + 1}`}
            onRemove={() =>
              set('keyPersonDependencies', removeAt(value.keyPersonDependencies, index))
            }
          >
            <FieldGrid>
              <SelectField
                id={`kpd-${dependency.id}-person`}
                label="Person"
                value={dependency.personId}
                onChange={(next) =>
                  set(
                    'keyPersonDependencies',
                    replaceAt(value.keyPersonDependencies, index, {
                      ...dependency,
                      personId: next,
                    }),
                  )
                }
                options={kmpOptions}
                emptyLabel="Select person"
              />
              <TextInputField
                id={`kpd-${dependency.id}-role`}
                label="Role"
                value={dependency.role}
                onChange={(next) =>
                  set(
                    'keyPersonDependencies',
                    replaceAt(value.keyPersonDependencies, index, { ...dependency, role: next }),
                  )
                }
              />
              <TextAreaField
                id={`kpd-${dependency.id}-nature`}
                label="Nature of dependency"
                rows={2}
                value={dependency.natureOfDependency}
                onChange={(next) =>
                  set(
                    'keyPersonDependencies',
                    replaceAt(value.keyPersonDependencies, index, {
                      ...dependency,
                      natureOfDependency: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="changes-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
