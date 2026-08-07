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
  createEmptyCommitteeMember,
  createEmptyCommitteeRecord,
} from '@/lib/management-governance/defaults';
import { getDirectors } from '@/lib/management-governance/directors';
import {
  COMMITTEE_APPLICABILITY_OPTIONS,
  COMMITTEE_MEMBER_ROLE_OPTIONS,
  COMMITTEE_TYPE_OPTIONS,
  EXECUTIVE_NON_EXECUTIVE_OPTIONS,
} from '@/lib/management-governance/options';
import type {
  BoardCommitteesAndGovernanceBodies,
  CommitteeApplicability,
  CommitteeMemberRole,
  CommitteeType,
  ExecutiveNonExecutive,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'board-committees-and-governance-bodies' as const;

export function CommitteesForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.boardCommitteesAndGovernanceBodies;
  const directors = getDirectors(payload);

  const set = <K extends keyof BoardCommitteesAndGovernanceBodies>(
    key: K,
    next: BoardCommitteesAndGovernanceBodies[K],
  ) => {
    updateSection('boardCommitteesAndGovernanceBodies', { ...value, [key]: next }, SECTION_ID);
  };

  const directorOptions = directors.map((director) => ({
    value: director.id,
    label: director.fullLegalName || director.din || director.id.slice(0, 8),
  }));

  return (
    <SectionCard
      title="Board Committees & Governance Bodies"
      description="Committee register, membership, terms of reference and meeting history."
    >
      <RepeatableList
        title="Committees"
        addLabel="Add committee"
        count={value.committees.length}
        emptyMessage="No committees recorded yet."
        onAdd={() => set('committees', [...value.committees, createEmptyCommitteeRecord()])}
      >
        {value.committees.map((committee, cIndex) => (
          <RepeatableCard
            key={committee.id}
            title={committee.name || committee.committeeType || `Committee ${cIndex + 1}`}
            onRemove={() => set('committees', removeAt(value.committees, cIndex))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`com-${committee.id}-type`}
                label="Committee type"
                value={committee.committeeType}
                onChange={(next) =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, {
                      ...committee,
                      committeeType: next as CommitteeType | '',
                    }),
                  )
                }
                options={COMMITTEE_TYPE_OPTIONS}
              />
              <TextInputField
                id={`com-${committee.id}-name`}
                label="Committee name"
                value={committee.name}
                onChange={(next) =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, { ...committee, name: next }),
                  )
                }
              />
              <SelectField
                id={`com-${committee.id}-applicability`}
                label="Applicability"
                value={committee.applicability}
                onChange={(next) =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, {
                      ...committee,
                      applicability: next as CommitteeApplicability | '',
                    }),
                  )
                }
                options={COMMITTEE_APPLICABILITY_OPTIONS}
              />
              <DateField
                id={`com-${committee.id}-constitution`}
                label="Constitution date"
                value={committee.constitutionDate}
                onChange={(next) =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, { ...committee, constitutionDate: next }),
                  )
                }
              />
              <SelectField
                id={`com-${committee.id}-chair`}
                label="Chairperson"
                value={committee.chairpersonDirectorId}
                onChange={(next) =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, {
                      ...committee,
                      chairpersonDirectorId: next,
                    }),
                  )
                }
                options={directorOptions}
                emptyLabel="Select director"
              />
              <TernaryField
                id={`com-${committee.id}-active`}
                label="Active"
                value={committee.activeStatus}
                onChange={(next) =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, { ...committee, activeStatus: next }),
                  )
                }
              />
            </FieldGrid>

            <SubSection title="Members">
              <RepeatableList
                title="Committee members"
                addLabel="Add member"
                count={committee.members.length}
                emptyMessage="No members recorded."
                onAdd={() =>
                  set(
                    'committees',
                    replaceAt(value.committees, cIndex, {
                      ...committee,
                      members: [...committee.members, createEmptyCommitteeMember()],
                    }),
                  )
                }
              >
                {committee.members.map((member, mIndex) => (
                  <RepeatableCard
                    key={member.id}
                    title={
                      directorOptions.find((d) => d.value === member.directorId)?.label ||
                      `Member ${mIndex + 1}`
                    }
                    onRemove={() =>
                      set(
                        'committees',
                        replaceAt(value.committees, cIndex, {
                          ...committee,
                          members: removeAt(committee.members, mIndex),
                        }),
                      )
                    }
                  >
                    <FieldGrid>
                      <SelectField
                        id={`com-${committee.id}-mem-${member.id}-director`}
                        label="Director"
                        required
                        value={member.directorId}
                        onChange={(next) =>
                          set(
                            'committees',
                            replaceAt(value.committees, cIndex, {
                              ...committee,
                              members: replaceAt(committee.members, mIndex, {
                                ...member,
                                directorId: next,
                              }),
                            }),
                          )
                        }
                        options={directorOptions}
                        emptyLabel="Select director"
                      />
                      <SelectField
                        id={`com-${committee.id}-mem-${member.id}-role`}
                        label="Role"
                        value={member.role}
                        onChange={(next) =>
                          set(
                            'committees',
                            replaceAt(value.committees, cIndex, {
                              ...committee,
                              members: replaceAt(committee.members, mIndex, {
                                ...member,
                                role: next as CommitteeMemberRole | '',
                              }),
                            }),
                          )
                        }
                        options={COMMITTEE_MEMBER_ROLE_OPTIONS}
                      />
                      <SelectField
                        id={`com-${committee.id}-mem-${member.id}-exec`}
                        label="Executive / non-executive"
                        value={member.executiveNonExecutive}
                        onChange={(next) =>
                          set(
                            'committees',
                            replaceAt(value.committees, cIndex, {
                              ...committee,
                              members: replaceAt(committee.members, mIndex, {
                                ...member,
                                executiveNonExecutive: next as ExecutiveNonExecutive | '',
                              }),
                            }),
                          )
                        }
                        options={EXECUTIVE_NON_EXECUTIVE_OPTIONS}
                      />
                      <TernaryField
                        id={`com-${committee.id}-mem-${member.id}-independent`}
                        label="Independent"
                        value={member.independentStatus}
                        onChange={(next) =>
                          set(
                            'committees',
                            replaceAt(value.committees, cIndex, {
                              ...committee,
                              members: replaceAt(committee.members, mIndex, {
                                ...member,
                                independentStatus: next,
                              }),
                            }),
                          )
                        }
                      />
                    </FieldGrid>
                  </RepeatableCard>
                ))}
              </RepeatableList>
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="committees-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
