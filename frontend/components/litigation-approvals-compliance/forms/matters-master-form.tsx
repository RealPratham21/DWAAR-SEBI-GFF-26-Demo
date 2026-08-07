'use client';

import {
  ApprovalSelect,
  asEnumValue,
  FieldGrid,
  LegalPartySelect,
  MatterOutcomeStatusBadge,
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
  createEmptyMatterPartyLink,
  createEmptyMatterRecord,
} from '@/lib/litigation-approvals-compliance/defaults';
import { formatMatterLabel } from '@/lib/litigation-approvals-compliance/matters';
import {
  FORUM_CATEGORY_OPTIONS,
  MATTER_CATEGORY_OPTIONS,
  MATTER_DIRECTION_OPTIONS,
  MATTER_MATERIALITY_STATE_OPTIONS,
  MATTER_OUTCOME_STATUS_OPTIONS,
  MATTER_PARTY_ROLE_OPTIONS,
  PROCEEDING_STAGE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import {
  countMatterReferences,
  formatMatterDependencyMessage,
} from '@/lib/litigation-approvals-compliance/references';
import type {
  ForumCategory,
  LitigationAndProceedingsMaster,
  MatterCategory,
  MatterDirection,
  MatterMaterialityState,
  MatterOutcomeStatus,
  MatterPartyRole,
  MatterRecord,
  ProceedingStage,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'litigation-and-proceedings-master' as const;

function matterHasData(matter: MatterRecord): boolean {
  return Boolean(
    matter.identity.matterTitle.trim() ||
      matter.identity.caseReferenceNumber.trim() ||
      matter.identity.category,
  );
}

export function MattersMasterForm() {
  const { payload, model, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.litigationAndProceedingsMaster;

  const set = (next: LitigationAndProceedingsMaster) => {
    updateSection('litigationAndProceedingsMaster', next, SECTION_ID);
  };

  const setMatters = (matters: MatterRecord[]) => set({ matters });

  const setMatter = (index: number, next: MatterRecord) => {
    setMatters(replaceAt(value.matters, index, next));
  };

  const removeMatter = (index: number) => {
    const matter = value.matters[index];
    const deps = countMatterReferences(payload, matter.matterId);
    if (deps.length > 0) {
      window.alert(formatMatterDependencyMessage(payload, matter.matterId, deps));
      return;
    }
    if (matterHasData(matter) && !window.confirm('Remove this matter? Entered values will be lost.')) {
      return;
    }
    setMatters(removeAt(value.matters, index));
  };

  return (
    <SectionCard
      title="Litigation & Proceedings Master"
      description="Canonical Matter Master for civil, criminal, regulatory and other proceedings."
    >
      <SubSection title="Derived exposure summary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Total matters</p>
            <p className="text-sm font-semibold">{model.matterCount}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Criminal / tax</p>
            <p className="text-sm font-semibold">
              {model.criminalMatterCount} / {model.taxMatterCount}
            </p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Pending outcomes</p>
            <p className="text-sm font-semibold">{model.pendingOutcomeCount}</p>
          </div>
          {model.exposureByCurrency[0] ? (
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Primary exposure</p>
              <p className="text-sm font-semibold">{model.exposureByCurrency[0].totalExposure || '—'}</p>
            </div>
          ) : null}
        </div>
      </SubSection>

      <RepeatableList
        title="Matters"
        addLabel="Add matter"
        onAdd={() => setMatters([...value.matters, createEmptyMatterRecord()])}
        emptyMessage="No matters in the Matter Master yet."
        count={value.matters.length}
      >
        {value.matters.map((matter, index) => (
          <RepeatableCard
            key={matter.matterId}
            title={formatMatterLabel(matter, matter.matterId)}
            subtitle={
              matter.identity.category.replaceAll('-', ' ') || undefined
            }
            onRemove={() => removeMatter(index)}
            removeLabel="Remove matter"
          >
            <SubSection title="Identity & classification">
              <FieldGrid columns={3}>
                <TextInputField
                  id={`matter-title-${index}`}
                  label="Matter title"
                  value={matter.identity.matterTitle}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      identity: { ...matter.identity, matterTitle: next },
                    })
                  }
                />
                <TextInputField
                  id={`matter-ref-${index}`}
                  label="Case reference number"
                  value={matter.identity.caseReferenceNumber}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      identity: { ...matter.identity, caseReferenceNumber: next },
                    })
                  }
                />
                <SelectField
                  id={`matter-cat-${index}`}
                  label="Category"
                  value={matter.identity.category}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      identity: {
                        ...matter.identity,
                        category: asEnumValue<MatterCategory>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...MATTER_CATEGORY_OPTIONS]}
                />
                <SelectField
                  id={`matter-dir-${index}`}
                  label="Direction"
                  value={matter.identity.direction}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      identity: {
                        ...matter.identity,
                        direction: asEnumValue<MatterDirection>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...MATTER_DIRECTION_OPTIONS]}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Forum & stage">
              <FieldGrid columns={3}>
                <TextInputField
                  id={`matter-forum-${index}`}
                  label="Authority / forum"
                  value={matter.forum.authorityForumName}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      forum: { ...matter.forum, authorityForumName: next },
                    })
                  }
                />
                <SelectField
                  id={`matter-forum-cat-${index}`}
                  label="Forum category"
                  value={matter.forum.forumCategory}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      forum: {
                        ...matter.forum,
                        forumCategory: asEnumValue<ForumCategory>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...FORUM_CATEGORY_OPTIONS]}
                />
                <SelectField
                  id={`matter-stage-${index}`}
                  label="Current stage"
                  value={matter.datesAndStage.currentStage}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      datesAndStage: {
                        ...matter.datesAndStage,
                        currentStage: asEnumValue<ProceedingStage>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...PROCEEDING_STAGE_OPTIONS]}
                />
                <TextInputField
                  id={`matter-next-hearing-${index}`}
                  label="Next hearing / action date"
                  type="date"
                  value={matter.datesAndStage.nextHearingActionDate}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      datesAndStage: { ...matter.datesAndStage, nextHearingActionDate: next },
                    })
                  }
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Party links">
              <RepeatableList
                title="Linked parties"
                addLabel="Add party link"
                onAdd={() =>
                  setMatter(index, {
                    ...matter,
                    matterPartyLinks: [...matter.matterPartyLinks, createEmptyMatterPartyLink()],
                  })
                }
                emptyMessage="No party links."
                count={matter.matterPartyLinks.length}
              >
                {matter.matterPartyLinks.map((link, linkIndex) => (
                  <FieldGrid key={link.matterPartyLinkId} columns={3}>
                    <LegalPartySelect
                      id={`matter-party-${index}-${linkIndex}`}
                      label="Legal party"
                      value={link.legalPartyReviewId}
                      onChange={(next) =>
                        setMatter(index, {
                          ...matter,
                          matterPartyLinks: replaceAt(matter.matterPartyLinks, linkIndex, {
                            ...link,
                            legalPartyReviewId: next,
                          }),
                        })
                      }
                      payload={payload}
                    />
                    <SelectField
                      id={`matter-party-role-${index}-${linkIndex}`}
                      label="Role"
                      value={link.role}
                      onChange={(next) =>
                        setMatter(index, {
                          ...matter,
                          matterPartyLinks: replaceAt(matter.matterPartyLinks, linkIndex, {
                            ...link,
                            role: asEnumValue<MatterPartyRole>(next),
                          }),
                        })
                      }
                      options={[{ value: '', label: 'Select…' }, ...MATTER_PARTY_ROLE_OPTIONS]}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="text-xs text-destructive underline"
                        onClick={() =>
                          setMatter(index, {
                            ...matter,
                            matterPartyLinks: removeAt(matter.matterPartyLinks, linkIndex),
                          })
                        }
                      >
                        Remove link
                      </button>
                    </div>
                  </FieldGrid>
                ))}
              </RepeatableList>
            </SubSection>

            <SubSection title="Amounts & materiality">
              <FieldGrid columns={3}>
                <DecimalInputField
                  id={`matter-principal-${index}`}
                  label="Principal claim"
                  value={matter.amounts.principalClaim}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      amounts: { ...matter.amounts, principalClaim: next },
                    })
                  }
                />
                <DecimalInputField
                  id={`matter-tax-${index}`}
                  label="Tax demand"
                  value={matter.amounts.taxDemand}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      amounts: { ...matter.amounts, taxDemand: next },
                    })
                  }
                />
                <DecimalInputField
                  id={`matter-total-${index}`}
                  label="Total quantified amount"
                  value={matter.amounts.totalQuantifiedAmount}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      amounts: { ...matter.amounts, totalQuantifiedAmount: next },
                    })
                  }
                />
                <TextInputField
                  id={`matter-mgmt-mat-${index}`}
                  label="Management materiality position"
                  value={matter.materiality.managementMaterialityPosition}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      materiality: {
                        ...matter.materiality,
                        managementMaterialityPosition: next,
                      },
                    })
                  }
                />
                <SelectField
                  id={`matter-readiness-${index}`}
                  label="Readiness state"
                  value={matter.materiality.readinessState}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      materiality: {
                        ...matter.materiality,
                        readinessState: asEnumValue<MatterMaterialityState>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...MATTER_MATERIALITY_STATE_OPTIONS]}
                />
                <SelectField
                  id={`matter-prof-review-${index}`}
                  label="Professional review"
                  value={matter.materiality.professionalReview}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      materiality: {
                        ...matter.materiality,
                        professionalReview: asEnumValue<ProfessionalConfirmationStatus>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
                />
                <ApprovalSelect
                  id={`matter-linked-approval-${index}`}
                  label="Linked approval"
                  value={matter.subjectMatter.linkedApprovalId}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      subjectMatter: { ...matter.subjectMatter, linkedApprovalId: next },
                    })
                  }
                  payload={payload}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Status & outcome">
              <FieldGrid columns={3}>
                <SelectField
                  id={`matter-outcome-${index}`}
                  label="Outcome status"
                  value={matter.statusOutcome.outcomeStatus}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      statusOutcome: {
                        ...matter.statusOutcome,
                        outcomeStatus: asEnumValue<MatterOutcomeStatus>(next),
                      },
                    })
                  }
                  options={[{ value: '', label: 'Select…' }, ...MATTER_OUTCOME_STATUS_OPTIONS]}
                />
                <div className="flex items-end pb-2">
                  <MatterOutcomeStatusBadge status={matter.statusOutcome.outcomeStatus} />
                </div>
                <TextAreaField
                  id={`matter-bg-${index}`}
                  label="Short factual background"
                  value={matter.subjectMatter.shortFactualBackground}
                  onChange={(next) =>
                    setMatter(index, {
                      ...matter,
                      subjectMatter: { ...matter.subjectMatter, shortFactualBackground: next },
                    })
                  }
                  rows={2}
                />
              </FieldGrid>
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
