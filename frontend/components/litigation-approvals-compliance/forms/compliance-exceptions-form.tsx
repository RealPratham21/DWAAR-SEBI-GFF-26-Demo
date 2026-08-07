'use client';

import {
  asEnumValue,
  ComputedStat,
  FieldGrid,
  MatterSelect,
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
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import {
  createEmptyComplianceDomainReviewRecord,
  createEmptyComplianceIssueRecord,
  createEmptyStatutoryDueRecord,
} from '@/lib/litigation-approvals-compliance/defaults';
import { getMatterById, isTaxMatter } from '@/lib/litigation-approvals-compliance/matters';
import {
  COMPLIANCE_DOMAIN_OPTIONS,
  COMPLIANCE_ISSUE_TYPE_OPTIONS,
  ISSUE_IDENTIFIED_BY_OPTIONS,
  STATUTORY_DUE_TYPE_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  ComplianceDomain,
  ComplianceIssueType,
  CorporateStatutoryAndOperationalComplianceExceptions,
  IssueIdentifiedBy,
  StatutoryDueType,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'corporate-statutory-and-operational-compliance-exceptions' as const;

function formatDelayDays(delayDays: string): string {
  const trimmed = delayDays.trim();
  if (!trimmed) return '—';
  const days = Number(trimmed);
  if (Number.isFinite(days) && days > 0) return `${days} day(s) delayed`;
  return trimmed;
}

export function ComplianceExceptionsForm() {
  const { payload, model, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.corporateStatutoryAndOperationalComplianceExceptions;
  const counts = model.complianceCounts;

  const set = <K extends keyof CorporateStatutoryAndOperationalComplianceExceptions>(
    key: K,
    next: CorporateStatutoryAndOperationalComplianceExceptions[K],
  ) => {
    updateSection(
      'corporateStatutoryAndOperationalComplianceExceptions',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  return (
    <SectionCard
      title="Corporate, Statutory & Operational Compliance Exceptions"
      description="Compliance domain reviews, exceptions register and statutory due delays."
    >
      <SubSection title="Compliance summary (computed)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ComputedStat label="Domain reviews" value={String(counts.domainReviewCount)} />
          <ComputedStat label="Domains with exceptions" value={String(counts.domainsWithKnownExceptions)} />
          <ComputedStat label="Compliance issues" value={String(counts.complianceIssueCount)} />
          <ComputedStat label="Continuing issues" value={String(counts.continuingIssues)} />
          <ComputedStat label="Statutory dues" value={String(counts.statutoryDueCount)} />
          <ComputedStat label="Delayed statutory dues" value={String(counts.delayedStatutoryDues)} />
        </div>
      </SubSection>

      <RepeatableList
        title="Compliance domain reviews"
        addLabel="Add domain review"
        onAdd={() =>
          set('complianceDomainReviews', [
            ...value.complianceDomainReviews,
            createEmptyComplianceDomainReviewRecord(),
          ])
        }
        emptyMessage="No compliance domain reviews yet."
        count={value.complianceDomainReviews.length}
      >
        {value.complianceDomainReviews.map((review, index) => (
          <RepeatableCard
            key={review.domainReviewId}
            title={review.domain.replaceAll('-', ' ') || `Domain review ${index + 1}`}
            onRemove={() =>
              set('complianceDomainReviews', removeAt(value.complianceDomainReviews, index))
            }
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`domain-${index}`}
                label="Domain"
                value={review.domain}
                onChange={(next) =>
                  set(
                    'complianceDomainReviews',
                    replaceAt(value.complianceDomainReviews, index, {
                      ...review,
                      domain: asEnumValue<ComplianceDomain>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...COMPLIANCE_DOMAIN_OPTIONS]}
              />
              <TernaryField
                id={`domain-applicable-${index}`}
                label="Applicable"
                value={review.applicable}
                onChange={(next) =>
                  set(
                    'complianceDomainReviews',
                    replaceAt(value.complianceDomainReviews, index, { ...review, applicable: next }),
                  )
                }
              />
              <TernaryField
                id={`domain-exceptions-${index}`}
                label="Known exceptions"
                value={review.knownExceptions}
                onChange={(next) =>
                  set(
                    'complianceDomainReviews',
                    replaceAt(value.complianceDomainReviews, index, {
                      ...review,
                      knownExceptions: next,
                    }),
                  )
                }
              />
              <TextInputField
                id={`domain-function-${index}`}
                label="Responsible function"
                value={review.responsibleFunction}
                onChange={(next) =>
                  set(
                    'complianceDomainReviews',
                    replaceAt(value.complianceDomainReviews, index, {
                      ...review,
                      responsibleFunction: next,
                    }),
                  )
                }
              />
              <TextAreaField
                id={`domain-notes-${index}`}
                label="Notes"
                value={review.notes}
                onChange={(next) =>
                  set(
                    'complianceDomainReviews',
                    replaceAt(value.complianceDomainReviews, index, { ...review, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Compliance issues"
        addLabel="Add issue"
        onAdd={() =>
          set('complianceIssues', [...value.complianceIssues, createEmptyComplianceIssueRecord()])
        }
        emptyMessage="No compliance issues yet."
        count={value.complianceIssues.length}
      >
        {value.complianceIssues.map((issue, index) => (
          <RepeatableCard
            key={issue.complianceIssueId}
            title={issue.obligation.trim() || `Compliance issue ${index + 1}`}
            onRemove={() => set('complianceIssues', removeAt(value.complianceIssues, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`issue-domain-${index}`}
                label="Domain"
                value={issue.domain}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, {
                      ...issue,
                      domain: asEnumValue<ComplianceDomain>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...COMPLIANCE_DOMAIN_OPTIONS]}
              />
              <SelectField
                id={`issue-type-${index}`}
                label="Issue type"
                value={issue.issueType}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, {
                      ...issue,
                      issueType: asEnumValue<ComplianceIssueType>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...COMPLIANCE_ISSUE_TYPE_OPTIONS]}
              />
              <SelectField
                id={`issue-by-${index}`}
                label="Identified by"
                value={issue.identifiedBy}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, {
                      ...issue,
                      identifiedBy: asEnumValue<IssueIdentifiedBy>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...ISSUE_IDENTIFIED_BY_OPTIONS]}
              />
              <TextInputField
                id={`issue-obligation-${index}`}
                label="Obligation"
                value={issue.obligation}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, { ...issue, obligation: next }),
                  )
                }
              />
              <TextInputField
                id={`issue-due-${index}`}
                label="Due date"
                type="date"
                value={issue.dueDate}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, { ...issue, dueDate: next }),
                  )
                }
              />
              <TernaryField
                id={`issue-continuing-${index}`}
                label="Continuing"
                value={issue.continuing}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, { ...issue, continuing: next }),
                  )
                }
              />
              <MatterSelect
                id={`issue-matter-${index}`}
                label="Linked matter"
                value={issue.linkedMatterId}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, { ...issue, linkedMatterId: next }),
                  )
                }
                payload={payload}
              />
              <TextAreaField
                id={`issue-remediation-${index}`}
                label="Remediation"
                value={issue.remediation}
                onChange={(next) =>
                  set(
                    'complianceIssues',
                    replaceAt(value.complianceIssues, index, { ...issue, remediation: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Statutory dues"
        addLabel="Add statutory due"
        onAdd={() => set('statutoryDues', [...value.statutoryDues, createEmptyStatutoryDueRecord()])}
        emptyMessage="No statutory due records yet."
        count={value.statutoryDues.length}
      >
        {value.statutoryDues.map((due, index) => (
          <RepeatableCard
            key={due.statutoryDueId}
            title={`${due.dueType.replaceAll('-', ' ') || 'Statutory due'} — ${due.entity.trim() || `#${index + 1}`}`}
            subtitle={formatDelayDays(due.delayDays)}
            onRemove={() => set('statutoryDues', removeAt(value.statutoryDues, index))}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`due-entity-${index}`}
                label="Entity"
                value={due.entity}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, entity: next }),
                  )
                }
              />
              <SelectField
                id={`due-type-${index}`}
                label="Due type"
                value={due.dueType}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, {
                      ...due,
                      dueType: asEnumValue<StatutoryDueType>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...STATUTORY_DUE_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`due-period-${index}`}
                label="Financial period"
                value={due.financialPeriod}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, financialPeriod: next }),
                  )
                }
              />
              <DecimalInputField
                id={`due-amount-${index}`}
                label="Amount due"
                value={due.amountDue}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, amountDue: next }),
                  )
                }
              />
              <TextInputField
                id={`due-date-${index}`}
                label="Due date"
                type="date"
                value={due.dueDate}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, dueDate: next }),
                  )
                }
              />
              <DecimalInputField
                id={`due-paid-${index}`}
                label="Amount paid"
                value={due.amountPaid}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, amountPaid: next }),
                  )
                }
              />
              <TextInputField
                id={`due-payment-date-${index}`}
                label="Payment date"
                type="date"
                value={due.paymentDate}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, paymentDate: next }),
                  )
                }
              />
              <TextInputField
                id={`due-delay-${index}`}
                label="Delay days"
                value={due.delayDays}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, delayDays: next }),
                  )
                }
                helper="Computed delay display uses this value when present."
              />
              <MatterSelect
                id={`due-tax-matter-${index}`}
                label="Linked tax matter"
                value={due.linkedTaxMatterId}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, linkedTaxMatterId: next }),
                  )
                }
                payload={payload}
                filter={(matterId) => isTaxMatter(getMatterById(payload, matterId))}
              />
              <TernaryField
                id={`due-remediated-${index}`}
                label="Remediated"
                value={due.remediated}
                onChange={(next) =>
                  set(
                    'statutoryDues',
                    replaceAt(value.statutoryDues, index, { ...due, remediated: next }),
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
