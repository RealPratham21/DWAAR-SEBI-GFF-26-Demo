'use client';

import {
  ApprovalStatusBadge,
  asEnumValue,
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
import { createEmptyApprovalRecord } from '@/lib/litigation-approvals-compliance/defaults';
import { formatApprovalLabel, isPerpetualApproval } from '@/lib/litigation-approvals-compliance/approvals';
import {
  APPROVAL_CATEGORY_OPTIONS,
  APPROVAL_HOLDER_TYPE_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  CONTINUATION_PENDING_RENEWAL_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import {
  countApprovalReferences,
  formatApprovalDependencyMessage,
} from '@/lib/litigation-approvals-compliance/references';
import type {
  ApprovalCategory,
  ApprovalHolderType,
  ApprovalRecord,
  ApprovalStatus,
  ContinuationPendingRenewal,
  GovernmentRegulatoryAndBusinessApprovalsMaster,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'government-regulatory-and-business-approvals-master' as const;

function approvalHasData(approval: ApprovalRecord): boolean {
  return Boolean(
    approval.identity.approvalLicenceName.trim() ||
      approval.holder.displayName.trim() ||
      approval.identity.category,
  );
}

export function ApprovalsMasterForm() {
  const { payload, model, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.governmentRegulatoryAndBusinessApprovalsMaster;

  const set = (next: GovernmentRegulatoryAndBusinessApprovalsMaster) => {
    updateSection('governmentRegulatoryAndBusinessApprovalsMaster', next, SECTION_ID);
  };

  const setApprovals = (approvals: ApprovalRecord[]) => set({ approvals });

  const setApproval = (index: number, next: ApprovalRecord) => {
    setApprovals(replaceAt(value.approvals, index, next));
  };

  const removeApproval = (index: number) => {
    const approval = value.approvals[index];
    const deps = countApprovalReferences(payload, approval.approvalId);
    if (deps.length > 0) {
      window.alert(formatApprovalDependencyMessage(payload, approval.approvalId, deps));
      return;
    }
    if (
      approvalHasData(approval) &&
      !window.confirm('Remove this approval? Entered values will be lost.')
    ) {
      return;
    }
    setApprovals(removeAt(value.approvals, index));
  };

  return (
    <SectionCard
      title="Government, Regulatory & Business Approvals Master"
      description="Canonical Approval Master for licences, registrations and business approvals."
    >
      <SubSection title="Derived approval summary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Total approvals</p>
            <p className="text-sm font-semibold">{model.approvalCount}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Expired</p>
            <p className="text-sm font-semibold">{model.expiredApprovalCount}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Renewal / application pending</p>
            <p className="text-sm font-semibold">{model.renewalPendingCount}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Expiring within 90 days</p>
            <p className="text-sm font-semibold">{model.approvalExpiryWindows.within90Days.length}</p>
          </div>
        </div>
      </SubSection>

      <RepeatableList
        title="Approvals"
        addLabel="Add approval"
        onAdd={() => setApprovals([...value.approvals, createEmptyApprovalRecord()])}
        emptyMessage="No approvals in the Approval Master yet."
        count={value.approvals.length}
      >
        {value.approvals.map((approval, index) => {
          const perpetual = isPerpetualApproval(approval);
          return (
            <RepeatableCard
              key={approval.approvalId}
              title={formatApprovalLabel(approval, approval.approvalId)}
              subtitle={approval.identity.category.replaceAll('-', ' ') || undefined}
              onRemove={() => removeApproval(index)}
              removeLabel="Remove approval"
            >
              <SubSection title="Identity & holder">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`approval-name-${index}`}
                    label="Approval / licence name"
                    value={approval.identity.approvalLicenceName}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        identity: { ...approval.identity, approvalLicenceName: next },
                      })
                    }
                  />
                  <SelectField
                    id={`approval-cat-${index}`}
                    label="Category"
                    value={approval.identity.category}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        identity: {
                          ...approval.identity,
                          category: asEnumValue<ApprovalCategory>(next),
                        },
                      })
                    }
                    options={[{ value: '', label: 'Select…' }, ...APPROVAL_CATEGORY_OPTIONS]}
                  />
                  <SelectField
                    id={`approval-holder-type-${index}`}
                    label="Holder type"
                    value={approval.holder.holderType}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        holder: {
                          ...approval.holder,
                          holderType: asEnumValue<ApprovalHolderType>(next),
                        },
                      })
                    }
                    options={[{ value: '', label: 'Select…' }, ...APPROVAL_HOLDER_TYPE_OPTIONS]}
                  />
                  <TextInputField
                    id={`approval-holder-name-${index}`}
                    label="Holder display name"
                    value={approval.holder.displayName}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        holder: { ...approval.holder, displayName: next },
                      })
                    }
                  />
                  <TextInputField
                    id={`approval-authority-${index}`}
                    label="Issuing authority"
                    value={approval.authority.issuingAuthority}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        authority: { ...approval.authority, issuingAuthority: next },
                      })
                    }
                  />
                  <SelectField
                    id={`approval-status-${index}`}
                    label="Status"
                    value={approval.status}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        status: asEnumValue<ApprovalStatus>(next),
                      })
                    }
                    options={[{ value: '', label: 'Select…' }, ...APPROVAL_STATUS_OPTIONS]}
                  />
                  <div className="flex items-end pb-2">
                    <ApprovalStatusBadge status={approval.status} />
                  </div>
                </FieldGrid>
              </SubSection>

              <SubSection title="Details & validity">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`approval-licence-no-${index}`}
                    label="Licence / registration number"
                    value={approval.details.licenceRegistrationNumber}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        details: { ...approval.details, licenceRegistrationNumber: next },
                      })
                    }
                  />
                  <TextInputField
                    id={`approval-issue-${index}`}
                    label="Issue date"
                    type="date"
                    value={approval.details.issueDate}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        details: { ...approval.details, issueDate: next },
                      })
                    }
                  />
                  <TernaryField
                    id={`approval-perpetual-${index}`}
                    label="Perpetual / no expiry"
                    value={approval.details.perpetualNoExpiry}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        details: { ...approval.details, perpetualNoExpiry: next },
                      })
                    }
                  />
                  {!perpetual ? (
                    <>
                      <TextInputField
                        id={`approval-expiry-${index}`}
                        label="Expiry date"
                        type="date"
                        value={approval.details.expiryDate}
                        onChange={(next) =>
                          setApproval(index, {
                            ...approval,
                            details: { ...approval.details, expiryDate: next },
                          })
                        }
                      />
                      <TextInputField
                        id={`approval-renewal-freq-${index}`}
                        label="Renewal frequency"
                        value={approval.details.renewalFrequency}
                        onChange={(next) =>
                          setApproval(index, {
                            ...approval,
                            details: { ...approval.details, renewalFrequency: next },
                          })
                        }
                      />
                    </>
                  ) : null}
                  <TextAreaField
                    id={`approval-scope-${index}`}
                    label="Scope / activity authorised"
                    value={approval.details.scope}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        details: { ...approval.details, scope: next },
                      })
                    }
                    rows={2}
                  />
                </FieldGrid>
              </SubSection>

              {!perpetual ? (
                <SubSection title="Renewal metadata">
                  <FieldGrid columns={3}>
                    <TextInputField
                      id={`approval-renewal-due-${index}`}
                      label="Renewal due date"
                      type="date"
                      value={approval.renewalMetadata.renewalDueDate}
                      onChange={(next) =>
                        setApproval(index, {
                          ...approval,
                          renewalMetadata: { ...approval.renewalMetadata, renewalDueDate: next },
                        })
                      }
                    />
                    <TextInputField
                      id={`approval-renewal-app-${index}`}
                      label="Renewal application date"
                      type="date"
                      value={approval.renewalMetadata.renewalApplicationDate}
                      onChange={(next) =>
                        setApproval(index, {
                          ...approval,
                          renewalMetadata: {
                            ...approval.renewalMetadata,
                            renewalApplicationDate: next,
                          },
                        })
                      }
                    />
                    <SelectField
                      id={`approval-continuation-${index}`}
                      label="Continuation pending renewal"
                      value={approval.renewalMetadata.continuationPendingRenewal}
                      onChange={(next) =>
                        setApproval(index, {
                          ...approval,
                          renewalMetadata: {
                            ...approval.renewalMetadata,
                            continuationPendingRenewal: asEnumValue<ContinuationPendingRenewal>(next),
                          },
                        })
                      }
                      options={[
                        { value: '', label: 'Select…' },
                        ...CONTINUATION_PENDING_RENEWAL_OPTIONS,
                      ]}
                    />
                  </FieldGrid>
                </SubSection>
              ) : null}

              <SubSection title="Application metadata">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`approval-app-date-${index}`}
                    label="Application date"
                    type="date"
                    value={approval.applicationMetadata.applicationDate}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        applicationMetadata: {
                          ...approval.applicationMetadata,
                          applicationDate: next,
                        },
                      })
                    }
                  />
                  <TextInputField
                    id={`approval-app-stage-${index}`}
                    label="Current application stage"
                    value={approval.applicationMetadata.currentStage}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        applicationMetadata: {
                          ...approval.applicationMetadata,
                          currentStage: next,
                        },
                      })
                    }
                  />
                  <TextInputField
                    id={`approval-ack-${index}`}
                    label="Acknowledgement reference"
                    value={approval.applicationMetadata.acknowledgementReference}
                    onChange={(next) =>
                      setApproval(index, {
                        ...approval,
                        applicationMetadata: {
                          ...approval.applicationMetadata,
                          acknowledgementReference: next,
                        },
                      })
                    }
                  />
                </FieldGrid>
              </SubSection>
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
