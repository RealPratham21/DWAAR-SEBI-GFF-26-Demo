'use client';

import {
  ApprovalSelect,
  asEnumValue,
  ComputedStat,
  ConditionComplianceStatusBadge,
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/litigation-approvals-compliance/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/litigation-approvals-compliance/repeatable-card';
import { LitigationApprovalsComplianceSectionActions } from '@/components/litigation-approvals-compliance/section-actions';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import {
  createEmptyApprovalConditionRecord,
  createEmptyFacilityApprovalReviewRecord,
  createEmptyProjectApprovalRequirementRecord,
} from '@/lib/litigation-approvals-compliance/defaults';
import {
  APPROVAL_CATEGORY_OPTIONS,
  APPROVAL_CONDITION_CATEGORY_OPTIONS,
  CONDITION_COMPLIANCE_STATUS_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  REQUIRED_BEFORE_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  ApprovalCategory,
  ApprovalConditionCategory,
  ApprovalConditionsFacilityComplianceAndRenewalReadiness,
  ConditionComplianceStatus,
  ProfessionalConfirmationStatus,
  RequiredBefore,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'approval-conditions-facility-compliance-and-renewal-readiness' as const;

export function ApprovalConditionsForm() {
  const { payload, model, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.approvalConditionsFacilityComplianceAndRenewalReadiness;
  const expiry = model.approvalExpiryWindows;

  const set = <K extends keyof ApprovalConditionsFacilityComplianceAndRenewalReadiness>(
    key: K,
    next: ApprovalConditionsFacilityComplianceAndRenewalReadiness[K],
  ) => {
    updateSection(
      'approvalConditionsFacilityComplianceAndRenewalReadiness',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  return (
    <SectionCard
      title="Approval Conditions, Facility Compliance & Renewal Readiness"
      description="Approval conditions, facility/project approval matrix and renewal tracking."
    >
      <SubSection title="Approval expiry windows (computed)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedStat label="Expiring within 30 days" value={String(expiry.within30Days.length)} />
          <ComputedStat label="Expiring within 90 days" value={String(expiry.within90Days.length)} />
          <ComputedStat label="Expiring within 180 days" value={String(expiry.within180Days.length)} />
          <ComputedStat label="Expiring within 365 days" value={String(expiry.within365Days.length)} />
          <ComputedStat
            label="Outstanding conditions"
            value={String(model.complianceCounts.approvalConditionsOutstanding)}
          />
          <ComputedStat
            label="Expired approvals"
            value={String(model.expiredApprovalCount)}
          />
          <ComputedStat
            label="Renewal pending"
            value={String(model.renewalPendingCount)}
          />
        </div>
        {expiry.within90Days.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {expiry.within90Days.slice(0, 5).map((entry) => (
              <li key={entry.approvalId}>
                {entry.label} — expires {entry.expiryDate || '—'}
                {entry.daysUntilExpiry !== null ? ` (${entry.daysUntilExpiry} days)` : ''}
              </li>
            ))}
            {expiry.within90Days.length > 5 ? (
              <li>…and {expiry.within90Days.length - 5} more</li>
            ) : null}
          </ul>
        ) : null}
      </SubSection>

      <RepeatableList
        title="Approval conditions"
        addLabel="Add condition"
        onAdd={() =>
          set('approvalConditions', [...value.approvalConditions, createEmptyApprovalConditionRecord()])
        }
        emptyMessage="No approval conditions yet."
        count={value.approvalConditions.length}
      >
        {value.approvalConditions.map((condition, index) => (
          <RepeatableCard
            key={condition.conditionId}
            title={condition.condition.trim() || `Condition ${index + 1}`}
            onRemove={() => set('approvalConditions', removeAt(value.approvalConditions, index))}
          >
            <FieldGrid columns={3}>
              <ApprovalSelect
                id={`cond-approval-${index}`}
                label="Linked approval"
                value={condition.approvalId}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, { ...condition, approvalId: next }),
                  )
                }
                payload={payload}
              />
              <TextInputField
                id={`cond-text-${index}`}
                label="Condition"
                value={condition.condition}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, { ...condition, condition: next }),
                  )
                }
              />
              <SelectField
                id={`cond-cat-${index}`}
                label="Category"
                value={condition.category}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, {
                      ...condition,
                      category: asEnumValue<ApprovalConditionCategory>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...APPROVAL_CONDITION_CATEGORY_OPTIONS]}
              />
              <SelectField
                id={`cond-status-${index}`}
                label="Compliance status"
                value={condition.complianceStatus}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, {
                      ...condition,
                      complianceStatus: asEnumValue<ConditionComplianceStatus>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...CONDITION_COMPLIANCE_STATUS_OPTIONS]}
              />
              <div className="flex items-end pb-2">
                <ConditionComplianceStatusBadge status={condition.complianceStatus} />
              </div>
              <TextInputField
                id={`cond-due-${index}`}
                label="Due date"
                type="date"
                value={condition.dueDate}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, { ...condition, dueDate: next }),
                  )
                }
              />
              <TextInputField
                id={`cond-owner-${index}`}
                label="Responsible owner"
                value={condition.responsibleOwner}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, {
                      ...condition,
                      responsibleOwner: next,
                    }),
                  )
                }
              />
              <TextAreaField
                id={`cond-notes-${index}`}
                label="Notes"
                value={condition.notes}
                onChange={(next) =>
                  set(
                    'approvalConditions',
                    replaceAt(value.approvalConditions, index, { ...condition, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Facility approval reviews"
        addLabel="Add facility review"
        onAdd={() =>
          set('facilityApprovalReviews', [
            ...value.facilityApprovalReviews,
            createEmptyFacilityApprovalReviewRecord(),
          ])
        }
        emptyMessage="No facility approval reviews yet."
        count={value.facilityApprovalReviews.length}
      >
        {value.facilityApprovalReviews.map((review, index) => (
          <RepeatableCard
            key={review.facilityApprovalReviewId}
            title={review.linkedBusinessFacilityId.trim() || `Facility review ${index + 1}`}
            onRemove={() =>
              set('facilityApprovalReviews', removeAt(value.facilityApprovalReviews, index))
            }
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`fac-id-${index}`}
                label="Linked business facility ID"
                value={review.linkedBusinessFacilityId}
                onChange={(next) =>
                  set(
                    'facilityApprovalReviews',
                    replaceAt(value.facilityApprovalReviews, index, {
                      ...review,
                      linkedBusinessFacilityId: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`fac-all-${index}`}
                label="All approvals obtained"
                value={review.allApprovalsObtained}
                onChange={(next) =>
                  set(
                    'facilityApprovalReviews',
                    replaceAt(value.facilityApprovalReviews, index, {
                      ...review,
                      allApprovalsObtained: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`fac-renewals-${index}`}
                label="Renewals pending"
                value={review.renewalsPending}
                onChange={(next) =>
                  set(
                    'facilityApprovalReviews',
                    replaceAt(value.facilityApprovalReviews, index, {
                      ...review,
                      renewalsPending: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`fac-conditions-${index}`}
                label="Conditions outstanding"
                value={review.conditionsOutstanding}
                onChange={(next) =>
                  set(
                    'facilityApprovalReviews',
                    replaceAt(value.facilityApprovalReviews, index, {
                      ...review,
                      conditionsOutstanding: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`fac-prof-${index}`}
                label="Professional review"
                value={review.professionalReview}
                onChange={(next) =>
                  set(
                    'facilityApprovalReviews',
                    replaceAt(value.facilityApprovalReviews, index, {
                      ...review,
                      professionalReview: asEnumValue<ProfessionalConfirmationStatus>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
              />
              <TextAreaField
                id={`fac-notes-${index}`}
                label="Notes"
                value={review.notes}
                onChange={(next) =>
                  set(
                    'facilityApprovalReviews',
                    replaceAt(value.facilityApprovalReviews, index, { ...review, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Project approval requirements"
        addLabel="Add requirement"
        onAdd={() =>
          set('projectApprovalRequirements', [
            ...value.projectApprovalRequirements,
            createEmptyProjectApprovalRequirementRecord(),
          ])
        }
        emptyMessage="No project approval requirements yet."
        count={value.projectApprovalRequirements.length}
      >
        {value.projectApprovalRequirements.map((requirement, index) => (
          <RepeatableCard
            key={requirement.projectApprovalRequirementId}
            title={requirement.approvalCategory.replaceAll('-', ' ') || `Requirement ${index + 1}`}
            onRemove={() =>
              set('projectApprovalRequirements', removeAt(value.projectApprovalRequirements, index))
            }
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`proj-objects-${index}`}
                label="Linked Objects record ID"
                value={requirement.linkedObjectsRecordId}
                onChange={(next) =>
                  set(
                    'projectApprovalRequirements',
                    replaceAt(value.projectApprovalRequirements, index, {
                      ...requirement,
                      linkedObjectsRecordId: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`proj-cat-${index}`}
                label="Approval category"
                value={requirement.approvalCategory}
                onChange={(next) =>
                  set(
                    'projectApprovalRequirements',
                    replaceAt(value.projectApprovalRequirements, index, {
                      ...requirement,
                      approvalCategory: asEnumValue<ApprovalCategory>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...APPROVAL_CATEGORY_OPTIONS]}
              />
              <ApprovalSelect
                id={`proj-approval-${index}`}
                label="Linked approval"
                value={requirement.linkedApprovalId}
                onChange={(next) =>
                  set(
                    'projectApprovalRequirements',
                    replaceAt(value.projectApprovalRequirements, index, {
                      ...requirement,
                      linkedApprovalId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`proj-before-${index}`}
                label="Required before"
                value={requirement.requiredBefore}
                onChange={(next) =>
                  set(
                    'projectApprovalRequirements',
                    replaceAt(value.projectApprovalRequirements, index, {
                      ...requirement,
                      requiredBefore: asEnumValue<RequiredBefore>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...REQUIRED_BEFORE_OPTIONS]}
              />
              <TextInputField
                id={`proj-status-${index}`}
                label="Current status"
                value={requirement.currentStatus}
                onChange={(next) =>
                  set(
                    'projectApprovalRequirements',
                    replaceAt(value.projectApprovalRequirements, index, {
                      ...requirement,
                      currentStatus: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`proj-expected-${index}`}
                label="Expected completion"
                type="date"
                value={requirement.expectedCompletion}
                onChange={(next) =>
                  set(
                    'projectApprovalRequirements',
                    replaceAt(value.projectApprovalRequirements, index, {
                      ...requirement,
                      expectedCompletion: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
