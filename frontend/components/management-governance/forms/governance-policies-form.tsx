'use client';

import {
  CheckboxField,
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
import { createEmptyGovernancePolicyRecord } from '@/lib/management-governance/defaults';
import {
  COMMITTEE_APPLICABILITY_OPTIONS,
  GOVERNANCE_POLICY_TYPE_OPTIONS,
  MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS,
  POLICY_ADOPTED_STATUS_OPTIONS,
} from '@/lib/management-governance/options';
import type {
  CommitteeApplicability,
  GovernancePoliciesRptOversightAndConfirmations,
  GovernancePolicyType,
  ManagementGovernanceConfirmations,
  PolicyAdoptedStatus,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'governance-policies-rpt-oversight-and-confirmations' as const;

export function GovernancePoliciesForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.governancePoliciesRptOversightAndConfirmations;

  const set = <K extends keyof GovernancePoliciesRptOversightAndConfirmations>(
    key: K,
    next: GovernancePoliciesRptOversightAndConfirmations[K],
  ) => {
    updateSection(
      'governancePoliciesRptOversightAndConfirmations',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setConfirmation = (key: keyof ManagementGovernanceConfirmations, checked: boolean) => {
    set('confirmations', { ...value.confirmations, [key]: checked });
  };

  return (
    <SectionCard
      title="Governance Policies, RPT Oversight & Confirmations"
      description="Governance policies register, RPT oversight, board-process readiness and issuer confirmations."
    >
      <RepeatableList
        title="Governance policies register"
        addLabel="Add policy"
        count={value.governancePolicies.length}
        emptyMessage="No governance policies recorded."
        onAdd={() =>
          set('governancePolicies', [...value.governancePolicies, createEmptyGovernancePolicyRecord()])
        }
      >
        {value.governancePolicies.map((policy, index) => (
          <RepeatableCard
            key={policy.id}
            title={policy.policyName || policy.policyType || `Policy ${index + 1}`}
            onRemove={() => set('governancePolicies', removeAt(value.governancePolicies, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`pol-${policy.id}-type`}
                label="Policy type"
                value={policy.policyType}
                onChange={(next) =>
                  set(
                    'governancePolicies',
                    replaceAt(value.governancePolicies, index, {
                      ...policy,
                      policyType: next as GovernancePolicyType | '',
                    }),
                  )
                }
                options={GOVERNANCE_POLICY_TYPE_OPTIONS}
              />
              <TextInputField
                id={`pol-${policy.id}-name`}
                label="Policy name"
                value={policy.policyName}
                onChange={(next) =>
                  set(
                    'governancePolicies',
                    replaceAt(value.governancePolicies, index, { ...policy, policyName: next }),
                  )
                }
              />
              <SelectField
                id={`pol-${policy.id}-adopted`}
                label="Adopted status"
                value={policy.adoptedStatus}
                onChange={(next) =>
                  set(
                    'governancePolicies',
                    replaceAt(value.governancePolicies, index, {
                      ...policy,
                      adoptedStatus: next as PolicyAdoptedStatus | '',
                    }),
                  )
                }
                options={POLICY_ADOPTED_STATUS_OPTIONS}
              />
              <SelectField
                id={`pol-${policy.id}-applicable`}
                label="Applicable status"
                value={policy.applicableStatus}
                onChange={(next) =>
                  set(
                    'governancePolicies',
                    replaceAt(value.governancePolicies, index, {
                      ...policy,
                      applicableStatus: next as CommitteeApplicability | '',
                    }),
                  )
                }
                options={COMMITTEE_APPLICABILITY_OPTIONS}
              />
              <DateField
                id={`pol-${policy.id}-approval`}
                label="Approval date"
                value={policy.approvalDate}
                onChange={(next) =>
                  set(
                    'governancePolicies',
                    replaceAt(value.governancePolicies, index, { ...policy, approvalDate: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="RPT governance">
        <FieldGrid columns={3}>
          <SelectField
            id="rpt-reg23"
            label="Regulation 23 applicability"
            value={value.rptGovernance.regulation23ApplicabilityStatus}
            onChange={(next) =>
              set('rptGovernance', {
                ...value.rptGovernance,
                regulation23ApplicabilityStatus: next as CommitteeApplicability | '',
              })
            }
            options={COMMITTEE_APPLICABILITY_OPTIONS}
          />
          <TernaryField
            id="rpt-omnibus"
            label="Omnibus approval framework"
            value={value.rptGovernance.omnibusApprovalFramework}
            onChange={(next) =>
              set('rptGovernance', { ...value.rptGovernance, omnibusApprovalFramework: next })
            }
          />
          <TernaryField
            id="rpt-register"
            label="RPT register maintained"
            value={value.rptGovernance.rptRegisterMaintained}
            onChange={(next) =>
              set('rptGovernance', { ...value.rptGovernance, rptRegisterMaintained: next })
            }
          />
          <TernaryField
            id="rpt-policy"
            label="RPT policy adopted"
            value={value.rptGovernance.rptPolicyAdopted}
            onChange={(next) =>
              set('rptGovernance', { ...value.rptGovernance, rptPolicyAdopted: next })
            }
          />
        </FieldGrid>
        <TextAreaField
          id="rpt-audit-process"
          label="Audit committee process"
          rows={2}
          value={value.rptGovernance.auditCommitteeProcess}
          onChange={(next) =>
            set('rptGovernance', { ...value.rptGovernance, auditCommitteeProcess: next })
          }
        />
      </SubSection>

      <SubSection title="Board process readiness">
        <FieldGrid columns={3}>
          <TernaryField
            id="bpr-meeting-calendar"
            label="Board meeting calendar"
            value={value.boardProcessReadiness.boardMeetingCalendar}
            onChange={(next) =>
              set('boardProcessReadiness', {
                ...value.boardProcessReadiness,
                boardMeetingCalendar: next,
              })
            }
          />
          <TernaryField
            id="bpr-attendance"
            label="Director attendance records"
            value={value.boardProcessReadiness.directorAttendanceRecords}
            onChange={(next) =>
              set('boardProcessReadiness', {
                ...value.boardProcessReadiness,
                directorAttendanceRecords: next,
              })
            }
          />
          <TernaryField
            id="bpr-evaluation"
            label="Board evaluation process"
            value={value.boardProcessReadiness.boardEvaluation}
            onChange={(next) =>
              set('boardProcessReadiness', {
                ...value.boardProcessReadiness,
                boardEvaluation: next,
              })
            }
          />
        </FieldGrid>
      </SubSection>

      <SubSection
        title="Issuer confirmations"
        description="Confirm each item once the underlying information has been reviewed."
      >
        <div className="space-y-2">
          {MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS.map(({ key, label }) => (
            <CheckboxField
              key={key}
              id={`mg-confirm-${key}`}
              label={label}
              checked={value.confirmations[key]}
              onChange={(checked) => setConfirmation(key, checked)}
            />
          ))}
        </div>
      </SubSection>

      <TextAreaField
        id="governance-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
