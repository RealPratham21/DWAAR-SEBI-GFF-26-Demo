'use client';

import {
  DateField,
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
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
  createEmptyFamilyRelationshipRecord,
  createEmptyKmpSmpRecord,
  createEmptyVacancyRecord,
} from '@/lib/management-governance/defaults';
import { getDirectors } from '@/lib/management-governance/directors';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  FAMILY_RELATIONSHIP_TYPE_OPTIONS,
  GOVERNANCE_READINESS_STATUS_OPTIONS,
  KMP_CLASSIFICATION_OPTIONS,
  PERSON_STATUS_OPTIONS,
} from '@/lib/management-governance/options';
import type {
  EmploymentType,
  FamilyRelationshipType,
  GovernanceReadinessStatus,
  KmpClassification,
  KmpSeniorManagementAndOrganisationStructure,
  PersonStatus,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'kmp-senior-management-and-organisation-structure' as const;

export function KmpOrganisationForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.kmpSeniorManagementAndOrganisationStructure;
  const directors = getDirectors(payload);

  const set = <K extends keyof KmpSeniorManagementAndOrganisationStructure>(
    key: K,
    next: KmpSeniorManagementAndOrganisationStructure[K],
  ) => {
    updateSection('kmpSeniorManagementAndOrganisationStructure', { ...value, [key]: next }, SECTION_ID);
  };

  const setKmp = <K extends keyof KmpSeniorManagementAndOrganisationStructure['kmpSmpRecords'][number]>(
    index: number,
    key: K,
    next: KmpSeniorManagementAndOrganisationStructure['kmpSmpRecords'][number][K],
  ) => {
    set(
      'kmpSmpRecords',
      replaceAt(value.kmpSmpRecords, index, { ...value.kmpSmpRecords[index], [key]: next }),
    );
  };

  const directorOptions = directors.map((director) => ({
    value: director.id,
    label: director.fullLegalName || director.din || director.id.slice(0, 8),
  }));

  const kmpOptions = value.kmpSmpRecords.map((person) => ({
    value: person.id,
    label: person.fullName || person.designation || person.id.slice(0, 8),
  }));

  return (
    <SectionCard
      title="KMP, Senior Management & Organisation Structure"
      description="KMP/SMP register, organisation hierarchy, vacancies and family relationships."
    >
      <SubSection title="KMP role readiness">
        <FieldGrid columns={3}>
          {(
            [
              ['mdCeoManagerWtd', 'MD / CEO / Manager / WTD'],
              ['cfo', 'CFO'],
              ['companySecretary', 'Company Secretary'],
              ['complianceOfficer', 'Compliance Officer'],
              ['otherBoardDesignatedKmp', 'Other board-designated KMP'],
            ] as const
          ).map(([key, label]) => (
            <SelectField
              key={key}
              id={`kmp-readiness-${key}`}
              label={label}
              value={value.kmpRoleReadiness[key]}
              onChange={(next) =>
                set('kmpRoleReadiness', {
                  ...value.kmpRoleReadiness,
                  [key]: next as GovernanceReadinessStatus | '',
                })
              }
              options={GOVERNANCE_READINESS_STATUS_OPTIONS}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="KMP / senior management register"
        addLabel="Add person"
        count={value.kmpSmpRecords.length}
        emptyMessage="No KMP or senior management records yet."
        onAdd={() => set('kmpSmpRecords', [...value.kmpSmpRecords, createEmptyKmpSmpRecord()])}
      >
        {value.kmpSmpRecords.map((person, index) => (
          <RepeatableCard
            key={person.id}
            title={person.fullName || `Person ${index + 1}`}
            subtitle={person.designation || undefined}
            onRemove={() => set('kmpSmpRecords', removeAt(value.kmpSmpRecords, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`kmp-${person.id}-name`}
                label="Full name"
                required
                value={person.fullName}
                onChange={(next) => setKmp(index, 'fullName', next)}
              />
              <SelectField
                id={`kmp-${person.id}-classification`}
                label="Classification"
                value={person.classification}
                onChange={(next) =>
                  setKmp(index, 'classification', next as KmpClassification | '')
                }
                options={KMP_CLASSIFICATION_OPTIONS}
              />
              <TextInputField
                id={`kmp-${person.id}-designation`}
                label="Designation"
                value={person.designation}
                onChange={(next) => setKmp(index, 'designation', next)}
              />
              <TextInputField
                id={`kmp-${person.id}-role`}
                label="Functional role"
                value={person.functionalRole}
                onChange={(next) => setKmp(index, 'functionalRole', next)}
              />
              <SelectField
                id={`kmp-${person.id}-employment-type`}
                label="Employment type"
                value={person.employmentType}
                onChange={(next) =>
                  setKmp(index, 'employmentType', next as EmploymentType | '')
                }
                options={EMPLOYMENT_TYPE_OPTIONS}
              />
              <SelectField
                id={`kmp-${person.id}-status`}
                label="Current status"
                value={person.currentStatus}
                onChange={(next) => setKmp(index, 'currentStatus', next as PersonStatus | '')}
                options={PERSON_STATUS_OPTIONS}
              />
              <SelectField
                id={`kmp-${person.id}-linked-director`}
                label="Linked director (if any)"
                value={person.linkedDirectorId}
                onChange={(next) => setKmp(index, 'linkedDirectorId', next)}
                options={directorOptions}
                emptyLabel="None"
              />
              <DateField
                id={`kmp-${person.id}-joining`}
                label="Joining date"
                value={person.joiningDate}
                onChange={(next) => setKmp(index, 'joiningDate', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`kmp-${person.id}-responsibilities`}
              label="Key responsibilities"
              rows={2}
              value={person.keyResponsibilities}
              onChange={(next) => setKmp(index, 'keyResponsibilities', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Vacancies"
        addLabel="Add vacancy"
        count={value.vacancies.length}
        emptyMessage="No vacancies recorded."
        onAdd={() => set('vacancies', [...value.vacancies, createEmptyVacancyRecord()])}
      >
        {value.vacancies.map((vacancy, index) => (
          <RepeatableCard
            key={vacancy.id}
            title={vacancy.role || `Vacancy ${index + 1}`}
            onRemove={() => set('vacancies', removeAt(value.vacancies, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`vac-${vacancy.id}-role`}
                label="Role"
                value={vacancy.role}
                onChange={(next) =>
                  set(
                    'vacancies',
                    replaceAt(value.vacancies, index, { ...vacancy, role: next }),
                  )
                }
              />
              <DateField
                id={`vac-${vacancy.id}-date`}
                label="Vacancy date"
                value={vacancy.vacancyDate}
                onChange={(next) =>
                  set(
                    'vacancies',
                    replaceAt(value.vacancies, index, { ...vacancy, vacancyDate: next }),
                  )
                }
              />
              <TextInputField
                id={`vac-${vacancy.id}-recruitment`}
                label="Recruitment status"
                value={vacancy.recruitmentStatus}
                onChange={(next) =>
                  set(
                    'vacancies',
                    replaceAt(value.vacancies, index, { ...vacancy, recruitmentStatus: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Family relationships"
        addLabel="Add relationship"
        count={value.familyRelationships.length}
        emptyMessage="No family relationships recorded."
        onAdd={() =>
          set('familyRelationships', [...value.familyRelationships, createEmptyFamilyRelationshipRecord()])
        }
      >
        {value.familyRelationships.map((relationship, index) => (
          <RepeatableCard
            key={relationship.id}
            title={`Relationship ${index + 1}`}
            onRemove={() =>
              set('familyRelationships', removeAt(value.familyRelationships, index))
            }
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`fam-${relationship.id}-person-one`}
                label="Person one"
                value={relationship.personOneId}
                onChange={(next) =>
                  set(
                    'familyRelationships',
                    replaceAt(value.familyRelationships, index, {
                      ...relationship,
                      personOneId: next,
                    }),
                  )
                }
                options={kmpOptions}
                emptyLabel="Select person"
              />
              <SelectField
                id={`fam-${relationship.id}-person-two`}
                label="Person two"
                value={relationship.personTwoId}
                onChange={(next) =>
                  set(
                    'familyRelationships',
                    replaceAt(value.familyRelationships, index, {
                      ...relationship,
                      personTwoId: next,
                    }),
                  )
                }
                options={kmpOptions}
                emptyLabel="Select person"
              />
              <SelectField
                id={`fam-${relationship.id}-type`}
                label="Relationship type"
                value={relationship.relationshipType}
                onChange={(next) =>
                  set(
                    'familyRelationships',
                    replaceAt(value.familyRelationships, index, {
                      ...relationship,
                      relationshipType: next as FamilyRelationshipType | '',
                    }),
                  )
                }
                options={FAMILY_RELATIONSHIP_TYPE_OPTIONS}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="kmp-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
