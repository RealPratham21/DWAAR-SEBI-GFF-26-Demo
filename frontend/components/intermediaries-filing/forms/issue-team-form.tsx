'use client';

import {
  asEnumValue,
  CheckboxField,
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
  createEmptyInterSeResponsibilityRecord,
  createEmptyIntermediaryRecord,
} from '@/lib/intermediaries-filing/defaults';
import {
  formatIntermediaryLabel,
  getLeadManagers,
} from '@/lib/intermediaries-filing/intermediaries';
import {
  APPOINTMENT_STATUS_OPTIONS,
  INTERMEDIARY_ROLE_OPTIONS,
  PRIMARY_SECONDARY_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  REGISTRATION_STATUS_OPTIONS,
  RESPONSIBILITY_AREA_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import {
  countIntermediaryReferences,
  formatIntermediaryDependencyMessage,
} from '@/lib/intermediaries-filing/references';
import type {
  AppointmentStatus,
  IntermediaryRecord,
  IntermediaryRole,
  IssueTeamAndIntermediaryMaster,
  PrimarySecondary,
  ProfessionalConfirmationStatus,
  RegistrationStatus,
  ResponsibilityArea,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'issue-team-and-intermediary-master' as const;

function intermediaryHasData(intermediary: IntermediaryRecord): boolean {
  return Boolean(intermediary.legalName.trim() || intermediary.displayName.trim());
}

export function IssueTeamForm() {
  const { payload, updateSection } = useIntermediariesFiling();
  const value = payload.issueTeamAndIntermediaryMaster;
  const leadManagers = getLeadManagers(payload);
  const showInterSe = leadManagers.length >= 2;

  const set = (next: IssueTeamAndIntermediaryMaster) => {
    updateSection('issueTeamAndIntermediaryMaster', next, SECTION_ID);
  };

  const setSnapshot = (patch: Partial<IssueTeamAndIntermediaryMaster['issueTeamSnapshot']>) => {
    set({ ...value, issueTeamSnapshot: { ...value.issueTeamSnapshot, ...patch } });
  };

  const setIntermediaries = (intermediaries: IntermediaryRecord[]) => set({ ...value, intermediaries });

  const setIntermediary = (index: number, next: IntermediaryRecord) => {
    setIntermediaries(replaceAt(value.intermediaries, index, next));
  };

  const removeIntermediary = (index: number) => {
    const intermediary = value.intermediaries[index];
    const deps = countIntermediaryReferences(payload, intermediary.intermediaryId);
    if (deps.length > 0) {
      window.alert(formatIntermediaryDependencyMessage(payload, intermediary.intermediaryId, deps));
      return;
    }
    if (
      intermediaryHasData(intermediary) &&
      !window.confirm('Remove this intermediary? Entered values will be lost.')
    ) {
      return;
    }
    setIntermediaries(removeAt(value.intermediaries, index));
  };

  const toggleRole = (index: number, role: IntermediaryRole, checked: boolean) => {
    const intermediary = value.intermediaries[index];
    const roles = checked
      ? [...intermediary.roles, role]
      : intermediary.roles.filter((current) => current !== role);
    setIntermediary(index, { ...intermediary, roles });
  };

  const setInterSeAgreement = (patch: Partial<IssueTeamAndIntermediaryMaster['interSeAgreement']>) => {
    set({ ...value, interSeAgreement: { ...value.interSeAgreement, ...patch } });
  };

  const setResponsibilities = (
    interSeResponsibilities: IssueTeamAndIntermediaryMaster['interSeResponsibilities'],
  ) => set({ ...value, interSeResponsibilities });

  const setResponsibility = (
    index: number,
    next: IssueTeamAndIntermediaryMaster['interSeResponsibilities'][number],
  ) => {
    setResponsibilities(replaceAt(value.interSeResponsibilities, index, next));
  };

  const toggleResponsibilityArea = (
    index: number,
    area: ResponsibilityArea,
    checked: boolean,
  ) => {
    const record = value.interSeResponsibilities[index];
    const responsibilityAreas = checked
      ? [...record.responsibilityAreas, area]
      : record.responsibilityAreas.filter((current) => current !== area);
    setResponsibility(index, { ...record, responsibilityAreas });
  };

  return (
    <SectionCard
      title="Issue Team & Intermediary Master"
      description="Issue team snapshot, canonical Intermediary Master, inter-se responsibilities and agreements."
    >
      <SubSection title="Issue team snapshot">
        <FieldGrid columns={3}>
          <TextInputField
            id="team-as-of-date"
            label="Team as-of date"
            type="date"
            value={value.issueTeamSnapshot.teamAsOfDate}
            onChange={(next) => setSnapshot({ teamAsOfDate: next })}
          />
          <TernaryField
            id="lead-manager-appointed"
            label="Lead Manager appointed"
            value={value.issueTeamSnapshot.leadManagerAppointed}
            onChange={(next) => setSnapshot({ leadManagerAppointed: next })}
          />
          <TernaryField
            id="registrar-appointed"
            label="Registrar appointed"
            value={value.issueTeamSnapshot.registrarAppointed}
            onChange={(next) => setSnapshot({ registrarAppointed: next })}
          />
          <TernaryField
            id="legal-counsel-appointed"
            label="Legal counsel appointed"
            value={value.issueTeamSnapshot.legalCounselAppointed}
            onChange={(next) => setSnapshot({ legalCounselAppointed: next })}
          />
          <TernaryField
            id="statutory-peer-review-auditor"
            label="Statutory / peer review auditor engaged"
            value={value.issueTeamSnapshot.statutoryPeerReviewAuditorEngaged}
            onChange={(next) => setSnapshot({ statutoryPeerReviewAuditorEngaged: next })}
          />
          <TernaryField
            id="market-maker-appointed-snapshot"
            label="Market Maker appointed"
            value={value.issueTeamSnapshot.marketMakerAppointed}
            onChange={(next) => setSnapshot({ marketMakerAppointed: next })}
          />
          <TernaryField
            id="underwriters-appointed"
            label="Underwriters appointed"
            value={value.issueTeamSnapshot.underwritersAppointed}
            onChange={(next) => setSnapshot({ underwritersAppointed: next })}
          />
          <TernaryField
            id="bankers-to-issue-appointed"
            label="Bankers to the Issue appointed"
            value={value.issueTeamSnapshot.bankersToIssueAppointed}
            onChange={(next) => setSnapshot({ bankersToIssueAppointed: next })}
          />
          <TernaryField
            id="sponsor-bank-appointed"
            label="Sponsor Bank appointed"
            value={value.issueTeamSnapshot.sponsorBankAppointed}
            onChange={(next) => setSnapshot({ sponsorBankAppointed: next })}
          />
          <TernaryField
            id="monitoring-agency-applicable"
            label="Monitoring agency applicable"
            value={value.issueTeamSnapshot.monitoringAgencyApplicable}
            onChange={(next) => setSnapshot({ monitoringAgencyApplicable: next })}
          />
          <TernaryField
            id="monitoring-agency-appointed"
            label="Monitoring agency appointed"
            value={value.issueTeamSnapshot.monitoringAgencyAppointed}
            onChange={(next) => setSnapshot({ monitoringAgencyAppointed: next })}
          />
          <TernaryField
            id="syndicate-members-applicable"
            label="Syndicate members applicable"
            value={value.issueTeamSnapshot.syndicateMembersApplicable}
            onChange={(next) => setSnapshot({ syndicateMembersApplicable: next })}
          />
          <TernaryField
            id="syndicate-members-appointed"
            label="Syndicate members appointed"
            value={value.issueTeamSnapshot.syndicateMembersAppointed}
            onChange={(next) => setSnapshot({ syndicateMembersAppointed: next })}
          />
          <TernaryField
            id="engagement-agreements-executed"
            label="All required engagement agreements executed"
            value={value.issueTeamSnapshot.allRequiredEngagementAgreementsExecuted}
            onChange={(next) => setSnapshot({ allRequiredEngagementAgreementsExecuted: next })}
          />
          <TernaryField
            id="registrations-reviewed"
            label="Applicable registrations reviewed"
            value={value.issueTeamSnapshot.applicableRegistrationsReviewed}
            onChange={(next) => setSnapshot({ applicableRegistrationsReviewed: next })}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Intermediary Master"
        description="Canonical intermediary records with roles, contact, registration and appointment details."
        addLabel="Add intermediary"
        onAdd={() => setIntermediaries([...value.intermediaries, createEmptyIntermediaryRecord()])}
        emptyMessage="No intermediaries recorded yet."
        count={value.intermediaries.length}
      >
        {value.intermediaries.map((intermediary, index) => (
          <RepeatableCard
            key={intermediary.intermediaryId}
            title={formatIntermediaryLabel(intermediary, intermediary.intermediaryId)}
            onRemove={() => removeIntermediary(index)}
            removeLabel="Remove intermediary"
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`intermediary-legal-name-${index}`}
                label="Legal name"
                value={intermediary.legalName}
                onChange={(next) => setIntermediary(index, { ...intermediary, legalName: next })}
              />
              <TextInputField
                id={`intermediary-display-name-${index}`}
                label="Display name"
                value={intermediary.displayName}
                onChange={(next) => setIntermediary(index, { ...intermediary, displayName: next })}
              />
              <TextInputField
                id={`intermediary-email-${index}`}
                label="Email"
                value={intermediary.contact.email}
                onChange={(next) =>
                  setIntermediary(index, {
                    ...intermediary,
                    contact: { ...intermediary.contact, email: next },
                  })
                }
              />
            </FieldGrid>

            <SubSection title="Roles">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INTERMEDIARY_ROLE_OPTIONS.map((option) => (
                  <CheckboxField
                    key={option.value}
                    id={`intermediary-role-${index}-${option.value}`}
                    label={option.label}
                    checked={intermediary.roles.includes(asEnumValue<IntermediaryRole>(option.value))}
                    onChange={(checked) =>
                      toggleRole(index, asEnumValue<IntermediaryRole>(option.value), checked)
                    }
                  />
                ))}
              </div>
            </SubSection>

            <SubSection title="Registration & appointment">
              <FieldGrid columns={3}>
                <TernaryField
                  id={`registration-required-${index}`}
                  label="Registration required"
                  value={intermediary.registration.registrationRequired}
                  onChange={(next) =>
                    setIntermediary(index, {
                      ...intermediary,
                      registration: { ...intermediary.registration, registrationRequired: next },
                    })
                  }
                />
                <TextInputField
                  id={`sebi-registration-${index}`}
                  label="SEBI registration number"
                  value={intermediary.registration.sebiRegistrationNumber}
                  onChange={(next) =>
                    setIntermediary(index, {
                      ...intermediary,
                      registration: {
                        ...intermediary.registration,
                        sebiRegistrationNumber: next,
                      },
                    })
                  }
                />
                <SelectField
                  id={`registration-status-${index}`}
                  label="Registration status"
                  value={intermediary.registration.registrationStatus}
                  onChange={(next) =>
                    setIntermediary(index, {
                      ...intermediary,
                      registration: {
                        ...intermediary.registration,
                        registrationStatus: asEnumValue<RegistrationStatus>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...REGISTRATION_STATUS_OPTIONS]}
                />
                <SelectField
                  id={`appointment-status-${index}`}
                  label="Appointment status"
                  value={intermediary.appointment.status}
                  onChange={(next) =>
                    setIntermediary(index, {
                      ...intermediary,
                      appointment: {
                        ...intermediary.appointment,
                        status: asEnumValue<AppointmentStatus>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...APPOINTMENT_STATUS_OPTIONS]}
                />
                <TextInputField
                  id={`appointment-date-${index}`}
                  label="Appointment date"
                  type="date"
                  value={intermediary.appointment.appointmentDate}
                  onChange={(next) =>
                    setIntermediary(index, {
                      ...intermediary,
                      appointment: { ...intermediary.appointment, appointmentDate: next },
                    })
                  }
                />
                <SelectField
                  id={`professional-confirmation-${index}`}
                  label="Professional confirmation"
                  value={intermediary.appointment.professionalConfirmation}
                  onChange={(next) =>
                    setIntermediary(index, {
                      ...intermediary,
                      appointment: {
                        ...intermediary.appointment,
                        professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
                />
              </FieldGrid>
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      {showInterSe ? (
        <>
          <RepeatableList
            title="Inter-se responsibilities"
            description="Shown when two or more Lead Managers are recorded."
            addLabel="Add responsibility"
            onAdd={() =>
              setResponsibilities([
                ...value.interSeResponsibilities,
                createEmptyInterSeResponsibilityRecord(),
              ])
            }
            emptyMessage="No inter-se responsibilities recorded."
            count={value.interSeResponsibilities.length}
          >
            {value.interSeResponsibilities.map((record, index) => (
              <RepeatableCard
                key={record.responsibilityId}
                title={`Responsibility ${index + 1}`}
                onRemove={() =>
                  setResponsibilities(removeAt(value.interSeResponsibilities, index))
                }
                removeLabel="Remove responsibility"
              >
                <FieldGrid columns={3}>
                  <IntermediarySelect
                    id={`inter-se-intermediary-${index}`}
                    label="Intermediary"
                    value={record.intermediaryId}
                    onChange={(next) => setResponsibility(index, { ...record, intermediaryId: next })}
                    payload={payload}
                  />
                  <SelectField
                    id={`primary-secondary-${index}`}
                    label="Primary / secondary"
                    value={record.primarySecondary}
                    onChange={(next) =>
                      setResponsibility(index, {
                        ...record,
                        primarySecondary: asEnumValue<PrimarySecondary>(next),
                      })
                    }
                    options={[{ value: '', label: 'Select…' }, ...PRIMARY_SECONDARY_OPTIONS]}
                  />
                </FieldGrid>
                <SubSection title="Responsibility areas">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {RESPONSIBILITY_AREA_OPTIONS.map((option) => (
                      <CheckboxField
                        key={option.value}
                        id={`responsibility-area-${index}-${option.value}`}
                        label={option.label}
                        checked={record.responsibilityAreas.includes(
                          asEnumValue<ResponsibilityArea>(option.value),
                        )}
                        onChange={(checked) =>
                          toggleResponsibilityArea(
                            index,
                            asEnumValue<ResponsibilityArea>(option.value),
                            checked,
                          )
                        }
                      />
                    ))}
                  </div>
                </SubSection>
                <TextAreaField
                  id={`detailed-responsibility-${index}`}
                  label="Detailed responsibility"
                  value={record.detailedResponsibility}
                  onChange={(next) =>
                    setResponsibility(index, { ...record, detailedResponsibility: next })
                  }
                />
              </RepeatableCard>
            ))}
          </RepeatableList>

          <SubSection title="Inter-se agreement">
            <FieldGrid columns={3}>
              <TernaryField
                id="inter-se-required"
                label="Inter-se agreement required"
                value={value.interSeAgreement.interSeAgreementRequired}
                onChange={(next) => setInterSeAgreement({ interSeAgreementRequired: next })}
              />
              <TernaryField
                id="inter-se-executed"
                label="Inter-se agreement executed"
                value={value.interSeAgreement.interSeAgreementExecuted}
                onChange={(next) => setInterSeAgreement({ interSeAgreementExecuted: next })}
              />
              <TextInputField
                id="inter-se-agreement-date"
                label="Agreement date"
                type="date"
                value={value.interSeAgreement.agreementDate}
                onChange={(next) => setInterSeAgreement({ agreementDate: next })}
              />
              <IntermediarySelect
                id="coordinating-lead-manager"
                label="Coordinating Lead Manager"
                value={value.interSeAgreement.coordinatingLeadManagerIntermediaryId}
                onChange={(next) =>
                  setInterSeAgreement({ coordinatingLeadManagerIntermediaryId: next })
                }
                payload={payload}
                filter={(id) => getLeadManagers(payload).some((lm) => lm.intermediaryId === id)}
              />
              <SelectField
                id="inter-se-professional-review"
                label="Professional review"
                value={value.interSeAgreement.professionalReview}
                onChange={(next) =>
                  setInterSeAgreement({
                    professionalReview: asEnumValue<ProfessionalConfirmationStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id="identified-gaps"
                label="Identified responsibility gaps"
                value={value.interSeAgreement.identifiedResponsibilityGaps}
                onChange={(next) => setInterSeAgreement({ identifiedResponsibilityGaps: next })}
              />
              <TextAreaField
                id="identified-overlaps"
                label="Identified overlaps"
                value={value.interSeAgreement.identifiedOverlaps}
                onChange={(next) => setInterSeAgreement({ identifiedOverlaps: next })}
              />
            </FieldGrid>
          </SubSection>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Inter-se responsibilities and agreement sections appear when two or more Lead Managers
          are recorded in the Intermediary Master.
        </p>
      )}

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
