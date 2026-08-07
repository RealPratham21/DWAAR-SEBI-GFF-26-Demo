'use client';

import {
  ComputedStat,
  DateField,
  FieldGrid,
  SectionCard,
  SelectField,
  StatGrid,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/management-governance/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/management-governance/repeatable-card';
import { ManagementGovernanceSectionActions } from '@/components/management-governance/section-actions';
import { useManagementGovernance } from '@/lib/management-governance/context';
import {
  createEmptyDirectorRecord,
  createEmptyOtherDirectorshipRecord,
  createEmptyPreviousEmploymentRecord,
} from '@/lib/management-governance/defaults';
import {
  computeDirectorshipCounts,
  validateDirectorDeletion,
} from '@/lib/management-governance/directors';
import {
  APPOINTMENT_STATUS_OPTIONS,
  DIRECTOR_DESIGNATION_OPTIONS,
  ENTITY_LISTING_STATUS_OPTIONS,
  EXECUTIVE_NON_EXECUTIVE_OPTIONS,
  GENDER_OPTIONS,
} from '@/lib/management-governance/options';
import type {
  AppointmentStatus,
  DirectorDesignation,
  DirectorRecord,
  DirectorsProfilesAppointmentsAndEligibility,
  EntityListingStatus,
  ExecutiveNonExecutive,
  Gender,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'directors-profiles-appointments-and-eligibility' as const;

function showIndependentFields(director: DirectorRecord): boolean {
  return (
    director.designation === 'independent-director' || director.independentStatus === 'yes'
  );
}

function showNomineeFields(director: DirectorRecord): boolean {
  return director.designation === 'nominee-director' || director.nomineeStatus === 'yes';
}

export function DirectorsForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.directorsProfilesAppointmentsAndEligibility;

  const set = <K extends keyof DirectorsProfilesAppointmentsAndEligibility>(
    key: K,
    next: DirectorsProfilesAppointmentsAndEligibility[K],
  ) => {
    updateSection('directorsProfilesAppointmentsAndEligibility', { ...value, [key]: next }, SECTION_ID);
  };

  const setDirectors = (next: DirectorRecord[]) => set('directors', next);

  const setDirector = <K extends keyof DirectorRecord>(
    index: number,
    key: K,
    next: DirectorRecord[K],
  ) => {
    setDirectors(replaceAt(value.directors, index, { ...value.directors[index], [key]: next }));
  };

  const removeDirector = (index: number) => {
    const director = value.directors[index];
    const validation = validateDirectorDeletion(payload, director.id);
    if (!validation.canDelete) {
      window.alert(
        `This director is referenced elsewhere:\n${validation.dependencies.join('\n')}`,
      );
      return;
    }
    if (
      hasRecordData([director.fullLegalName, director.din]) &&
      !window.confirm('Remove this director? Entered values will be lost.')
    ) {
      return;
    }
    setDirectors(removeAt(value.directors, index));
  };

  return (
    <SectionCard
      title="Directors — Profiles, Appointments & Eligibility"
      description="Director master register with biographies, other directorships and eligibility declarations."
    >
      <RepeatableList
        title="Directors"
        description="Each director carries a stable ID referenced by committees, remuneration and change records."
        addLabel="Add director"
        onAdd={() => setDirectors([...value.directors, createEmptyDirectorRecord()])}
        emptyMessage="No directors recorded yet."
        count={value.directors.length}
      >
        {value.directors.map((director, index) => {
          const directorshipCounts = computeDirectorshipCounts(director);
          return (
            <RepeatableCard
              key={director.id}
              title={director.fullLegalName || `Director ${index + 1}`}
              subtitle={director.designation ? director.designation.replaceAll('-', ' ') : undefined}
              onRemove={() => removeDirector(index)}
            >
              <FieldGrid columns={3}>
                <TextInputField
                  id={`dir-${director.id}-name`}
                  label="Full legal name"
                  required
                  value={director.fullLegalName}
                  onChange={(next) => setDirector(index, 'fullLegalName', next)}
                />
                <TextInputField
                  id={`dir-${director.id}-din`}
                  label="DIN"
                  value={director.din}
                  onChange={(next) => setDirector(index, 'din', next)}
                />
                <SelectField
                  id={`dir-${director.id}-designation`}
                  label="Designation"
                  value={director.designation}
                  onChange={(next) =>
                    setDirector(index, 'designation', next as DirectorDesignation | '')
                  }
                  options={DIRECTOR_DESIGNATION_OPTIONS}
                />
                <SelectField
                  id={`dir-${director.id}-exec-ne`}
                  label="Executive / non-executive"
                  value={director.executiveNonExecutive}
                  onChange={(next) =>
                    setDirector(index, 'executiveNonExecutive', next as ExecutiveNonExecutive | '')
                  }
                  options={EXECUTIVE_NON_EXECUTIVE_OPTIONS}
                />
                <SelectField
                  id={`dir-${director.id}-gender`}
                  label="Gender"
                  value={director.gender}
                  onChange={(next) => setDirector(index, 'gender', next as Gender | '')}
                  options={GENDER_OPTIONS}
                />
                <SelectField
                  id={`dir-${director.id}-appointment-status`}
                  label="Appointment status"
                  value={director.appointmentStatus}
                  onChange={(next) =>
                    setDirector(index, 'appointmentStatus', next as AppointmentStatus | '')
                  }
                  options={APPOINTMENT_STATUS_OPTIONS}
                />
                <TernaryField
                  id={`dir-${director.id}-independent`}
                  label="Independent director"
                  value={director.independentStatus}
                  onChange={(next) => setDirector(index, 'independentStatus', next)}
                />
                <TernaryField
                  id={`dir-${director.id}-nominee`}
                  label="Nominee director"
                  value={director.nomineeStatus}
                  onChange={(next) => setDirector(index, 'nomineeStatus', next)}
                />
                <TernaryField
                  id={`dir-${director.id}-promoter`}
                  label="Promoter director"
                  value={director.promoterStatus}
                  onChange={(next) => setDirector(index, 'promoterStatus', next)}
                />
                <DateField
                  id={`dir-${director.id}-dob`}
                  label="Date of birth"
                  value={director.dateOfBirth}
                  onChange={(next) => setDirector(index, 'dateOfBirth', next)}
                />
                <TextInputField
                  id={`dir-${director.id}-nationality`}
                  label="Nationality"
                  value={director.nationality}
                  onChange={(next) => setDirector(index, 'nationality', next)}
                />
                <TextInputField
                  id={`dir-${director.id}-residence`}
                  label="Country of residence"
                  value={director.countryOfResidence}
                  onChange={(next) => setDirector(index, 'countryOfResidence', next)}
                />
              </FieldGrid>

              {showNomineeFields(director) ? (
                <SubSection title="Nominee details">
                  <TextInputField
                    id={`dir-${director.id}-nomination-source`}
                    label="Nomination source / nominating entity"
                    value={director.nominationSource}
                    onChange={(next) => setDirector(index, 'nominationSource', next)}
                  />
                </SubSection>
              ) : null}

              {showIndependentFields(director) ? (
                <SubSection title="Independent director details">
                  <FieldGrid>
                    <TernaryField
                      id={`dir-${director.id}-independence-declaration`}
                      label="Independence declaration received"
                      value={director.independentDirectorDetails.independenceDeclarationReceived}
                      onChange={(next) =>
                        setDirector(index, 'independentDirectorDetails', {
                          ...director.independentDirectorDetails,
                          independenceDeclarationReceived: next,
                        })
                      }
                    />
                    <TernaryField
                      id={`dir-${director.id}-promoter-relationship`}
                      label="Promoter relationship"
                      value={director.independentDirectorDetails.promoterRelationship}
                      onChange={(next) =>
                        setDirector(index, 'independentDirectorDetails', {
                          ...director.independentDirectorDetails,
                          promoterRelationship: next,
                        })
                      }
                    />
                    <TextInputField
                      id={`dir-${director.id}-section149`}
                      label="Section 149 criteria status"
                      value={director.independentDirectorDetails.section149CriteriaStatus}
                      onChange={(next) =>
                        setDirector(index, 'independentDirectorDetails', {
                          ...director.independentDirectorDetails,
                          section149CriteriaStatus: next,
                        })
                      }
                    />
                    <TextInputField
                      id={`dir-${director.id}-databank`}
                      label="Independent directors databank status"
                      value={director.independentDirectorDetails.databankStatus}
                      onChange={(next) =>
                        setDirector(index, 'independentDirectorDetails', {
                          ...director.independentDirectorDetails,
                          databankStatus: next,
                        })
                      }
                    />
                  </FieldGrid>
                </SubSection>
              ) : null}

              <SubSection title="Eligibility declarations">
                <FieldGrid columns={3}>
                  <TernaryField
                    id={`dir-${director.id}-din-active`}
                    label="DIN active"
                    value={director.eligibility.dinActive}
                    onChange={(next) =>
                      setDirector(index, 'eligibility', { ...director.eligibility, dinActive: next })
                    }
                  />
                  <TernaryField
                    id={`dir-${director.id}-section164`}
                    label="Section 164 disqualification concern"
                    value={director.eligibility.section164DisqualificationConcern}
                    onChange={(next) =>
                      setDirector(index, 'eligibility', {
                        ...director.eligibility,
                        section164DisqualificationConcern: next,
                      })
                    }
                  />
                  <TernaryField
                    id={`dir-${director.id}-sebi-debarment`}
                    label="SEBI debarment"
                    value={director.eligibility.sebiDebarment}
                    onChange={(next) =>
                      setDirector(index, 'eligibility', {
                        ...director.eligibility,
                        sebiDebarment: next,
                      })
                    }
                  />
                </FieldGrid>
              </SubSection>

              <RepeatableList
                title="Other directorships"
                addLabel="Add directorship"
                count={director.otherDirectorships.length}
                emptyMessage="No other directorships recorded."
                onAdd={() =>
                  setDirector(index, 'otherDirectorships', [
                    ...director.otherDirectorships,
                    createEmptyOtherDirectorshipRecord(),
                  ])
                }
              >
                {director.otherDirectorships.map((directorship, dIndex) => (
                  <RepeatableCard
                    key={directorship.id}
                    title={directorship.entityName || `Directorship ${dIndex + 1}`}
                    onRemove={() =>
                      setDirector(
                        index,
                        'otherDirectorships',
                        removeAt(director.otherDirectorships, dIndex),
                      )
                    }
                  >
                    <FieldGrid>
                      <TextInputField
                        id={`dir-${director.id}-od-${directorship.id}-entity`}
                        label="Entity name"
                        value={directorship.entityName}
                        onChange={(next) =>
                          setDirector(
                            index,
                            'otherDirectorships',
                            replaceAt(director.otherDirectorships, dIndex, {
                              ...directorship,
                              entityName: next,
                            }),
                          )
                        }
                      />
                      <SelectField
                        id={`dir-${director.id}-od-${directorship.id}-listing`}
                        label="Listing status"
                        value={directorship.entityListingStatus}
                        onChange={(next) =>
                          setDirector(
                            index,
                            'otherDirectorships',
                            replaceAt(director.otherDirectorships, dIndex, {
                              ...directorship,
                              entityListingStatus: next as EntityListingStatus | '',
                            }),
                          )
                        }
                        options={ENTITY_LISTING_STATUS_OPTIONS}
                      />
                    </FieldGrid>
                  </RepeatableCard>
                ))}
              </RepeatableList>

              <StatGrid title="Directorship counts">
                <ComputedStat
                  label="Current directorships"
                  value={String(directorshipCounts.totalCurrent)}
                />
                <ComputedStat
                  label="Current public-company directorships"
                  value={String(directorshipCounts.currentPublicCompany)}
                />
              </StatGrid>

              <RepeatableList
                title="Previous employment"
                addLabel="Add employment"
                count={director.previousEmployment.length}
                emptyMessage="No previous employment recorded."
                onAdd={() =>
                  setDirector(index, 'previousEmployment', [
                    ...director.previousEmployment,
                    createEmptyPreviousEmploymentRecord(),
                  ])
                }
              >
                {director.previousEmployment.map((employment, eIndex) => (
                  <RepeatableCard
                    key={employment.id}
                    title={employment.employerEntity || `Employment ${eIndex + 1}`}
                    onRemove={() =>
                      setDirector(
                        index,
                        'previousEmployment',
                        removeAt(director.previousEmployment, eIndex),
                      )
                    }
                  >
                    <FieldGrid>
                      <TextInputField
                        id={`dir-${director.id}-pe-${employment.id}-employer`}
                        label="Employer"
                        value={employment.employerEntity}
                        onChange={(next) =>
                          setDirector(
                            index,
                            'previousEmployment',
                            replaceAt(director.previousEmployment, eIndex, {
                              ...employment,
                              employerEntity: next,
                            }),
                          )
                        }
                      />
                      <TextInputField
                        id={`dir-${director.id}-pe-${employment.id}-position`}
                        label="Position"
                        value={employment.position}
                        onChange={(next) =>
                          setDirector(
                            index,
                            'previousEmployment',
                            replaceAt(director.previousEmployment, eIndex, {
                              ...employment,
                              position: next,
                            }),
                          )
                        }
                      />
                    </FieldGrid>
                  </RepeatableCard>
                ))}
              </RepeatableList>

              <TextAreaField
                id={`dir-${director.id}-bio`}
                label="Brief professional biography"
                rows={3}
                value={director.briefProfessionalBiography}
                onChange={(next) => setDirector(index, 'briefProfessionalBiography', next)}
              />
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <TextAreaField
        id="directors-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
