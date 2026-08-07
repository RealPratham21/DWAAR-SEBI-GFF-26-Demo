'use client';

import {
  asEnumValue,
  FieldGrid,
  LegalPartySelect,
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
  createEmptyCriminalScreeningRecord,
  createEmptyRegulatoryActionRecord,
  createEmptySebiExchangeScreeningRecord,
  createEmptyTaxProceedingDetail,
} from '@/lib/litigation-approvals-compliance/defaults';
import { getMatterById, isTaxMatter } from '@/lib/litigation-approvals-compliance/matters';
import {
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  REGULATORY_ACTION_TYPE_OPTIONS,
  TAX_TYPE_OPTIONS,
} from '@/lib/litigation-approvals-compliance/options';
import type {
  CriminalRegulatoryTaxAndEnforcementReadiness,
  ProfessionalConfirmationStatus,
  RegulatoryActionType,
  TaxType,
} from '@/lib/schemas/litigation-approvals-compliance';

const SECTION_ID = 'criminal-regulatory-tax-and-enforcement-readiness' as const;

export function CriminalRegulatoryForm() {
  const { payload, model, updateSection } = useLitigationApprovalsCompliance();
  const value = payload.criminalRegulatoryTaxAndEnforcementReadiness;

  const set = <K extends keyof CriminalRegulatoryTaxAndEnforcementReadiness>(
    key: K,
    next: CriminalRegulatoryTaxAndEnforcementReadiness[K],
  ) => {
    updateSection('criminalRegulatoryTaxAndEnforcementReadiness', { ...value, [key]: next }, SECTION_ID);
  };

  return (
    <SectionCard
      title="Criminal, Regulatory, Tax & Enforcement Readiness"
      description="Criminal screening, regulatory actions, SEBI/exchange actions and tax proceedings."
    >
      <SubSection title="Tax aggregates (derived)">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Proceeding count</p>
            <p className="text-sm font-semibold">{model.taxAggregates.proceedingCount}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Total demand</p>
            <p className="text-sm font-semibold">{model.taxAggregates.totalDemand || '—'}</p>
          </div>
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Balance disputed</p>
            <p className="text-sm font-semibold">{model.taxAggregates.totalBalanceDisputed || '—'}</p>
          </div>
        </div>
      </SubSection>

      <RepeatableList
        title="Criminal screenings"
        addLabel="Add screening"
        onAdd={() => set('criminalScreenings', [...value.criminalScreenings, createEmptyCriminalScreeningRecord()])}
        emptyMessage="No criminal screening records yet."
        count={value.criminalScreenings.length}
      >
        {value.criminalScreenings.map((screening, index) => (
          <RepeatableCard
            key={`criminal-${index}`}
            title={`Criminal screening ${index + 1}`}
            onRemove={() => set('criminalScreenings', removeAt(value.criminalScreenings, index))}
          >
            <FieldGrid columns={3}>
              <LegalPartySelect
                id={`crim-party-${index}`}
                label="Legal party"
                value={screening.legalPartyReviewId}
                onChange={(next) =>
                  set(
                    'criminalScreenings',
                    replaceAt(value.criminalScreenings, index, {
                      ...screening,
                      legalPartyReviewId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <TernaryField
                id={`crim-search-${index}`}
                label="Criminal search completed"
                value={screening.criminalSearchCompleted}
                onChange={(next) =>
                  set(
                    'criminalScreenings',
                    replaceAt(value.criminalScreenings, index, {
                      ...screening,
                      criminalSearchCompleted: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`crim-firs-${index}`}
                label="FIRs identified"
                value={screening.firsIdentified}
                onChange={(next) =>
                  set(
                    'criminalScreenings',
                    replaceAt(value.criminalScreenings, index, { ...screening, firsIdentified: next }),
                  )
                }
              />
              <TernaryField
                id={`crim-prosecutions-${index}`}
                label="Prosecutions identified"
                value={screening.prosecutionsIdentified}
                onChange={(next) =>
                  set(
                    'criminalScreenings',
                    replaceAt(value.criminalScreenings, index, {
                      ...screening,
                      prosecutionsIdentified: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`crim-confirm-${index}`}
                label="Professional confirmation"
                value={screening.professionalConfirmation}
                onChange={(next) =>
                  set(
                    'criminalScreenings',
                    replaceAt(value.criminalScreenings, index, {
                      ...screening,
                      professionalConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
              />
              <TextAreaField
                id={`crim-notes-${index}`}
                label="Notes"
                value={screening.notes}
                onChange={(next) =>
                  set(
                    'criminalScreenings',
                    replaceAt(value.criminalScreenings, index, { ...screening, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Regulatory actions"
        addLabel="Add regulatory action"
        onAdd={() => set('regulatoryActions', [...value.regulatoryActions, createEmptyRegulatoryActionRecord()])}
        emptyMessage="No regulatory actions yet."
        count={value.regulatoryActions.length}
      >
        {value.regulatoryActions.map((action, index) => (
          <RepeatableCard
            key={action.regulatoryActionId}
            title={action.authority.trim() || `Regulatory action ${index + 1}`}
            onRemove={() => set('regulatoryActions', removeAt(value.regulatoryActions, index))}
          >
            <FieldGrid columns={3}>
              <MatterSelect
                id={`reg-matter-${index}`}
                label="Linked matter"
                value={action.matterId}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, { ...action, matterId: next }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`reg-type-${index}`}
                label="Action type"
                value={action.actionType}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, {
                      ...action,
                      actionType: asEnumValue<RegulatoryActionType>(next),
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...REGULATORY_ACTION_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`reg-authority-${index}`}
                label="Authority"
                value={action.authority}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, { ...action, authority: next }),
                  )
                }
              />
              <TextInputField
                id={`reg-init-${index}`}
                label="Initiation date"
                type="date"
                value={action.initiationDate}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, { ...action, initiationDate: next }),
                  )
                }
              />
              <DecimalInputField
                id={`reg-amount-${index}`}
                label="Monetary amount"
                value={action.monetaryAmount}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, { ...action, monetaryAmount: next }),
                  )
                }
              />
              <TextInputField
                id={`reg-status-${index}`}
                label="Current status"
                value={action.currentStatus}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, { ...action, currentStatus: next }),
                  )
                }
              />
              <TextAreaField
                id={`reg-notes-${index}`}
                label="Notes"
                value={action.notes}
                onChange={(next) =>
                  set(
                    'regulatoryActions',
                    replaceAt(value.regulatoryActions, index, { ...action, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="SEBI / stock exchange screenings"
        addLabel="Add screening"
        onAdd={() =>
          set('sebiExchangeScreenings', [
            ...value.sebiExchangeScreenings,
            createEmptySebiExchangeScreeningRecord(),
          ])
        }
        emptyMessage="No SEBI/exchange screening records yet."
        count={value.sebiExchangeScreenings.length}
      >
        {value.sebiExchangeScreenings.map((screening, index) => (
          <RepeatableCard
            key={`sebi-${index}`}
            title={`SEBI/exchange screening ${index + 1}`}
            onRemove={() =>
              set('sebiExchangeScreenings', removeAt(value.sebiExchangeScreenings, index))
            }
          >
            <FieldGrid columns={3}>
              <LegalPartySelect
                id={`sebi-party-${index}`}
                label="Legal party"
                value={screening.legalPartyReviewId}
                onChange={(next) =>
                  set(
                    'sebiExchangeScreenings',
                    replaceAt(value.sebiExchangeScreenings, index, {
                      ...screening,
                      legalPartyReviewId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <TernaryField
                id={`sebi-action-${index}`}
                label="SEBI action exists"
                value={screening.sebiActionExists}
                onChange={(next) =>
                  set(
                    'sebiExchangeScreenings',
                    replaceAt(value.sebiExchangeScreenings, index, {
                      ...screening,
                      sebiActionExists: next,
                    }),
                  )
                }
              />
              <TernaryField
                id={`sebi-exchange-${index}`}
                label="Stock exchange action exists"
                value={screening.stockExchangeActionExists}
                onChange={(next) =>
                  set(
                    'sebiExchangeScreenings',
                    replaceAt(value.sebiExchangeScreenings, index, {
                      ...screening,
                      stockExchangeActionExists: next,
                    }),
                  )
                }
              />
              <MatterSelect
                id={`sebi-matter-${index}`}
                label="Linked matter"
                value={screening.linkedMatterId}
                onChange={(next) =>
                  set(
                    'sebiExchangeScreenings',
                    replaceAt(value.sebiExchangeScreenings, index, {
                      ...screening,
                      linkedMatterId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <TextAreaField
                id={`sebi-notes-${index}`}
                label="Notes"
                value={screening.notes}
                onChange={(next) =>
                  set(
                    'sebiExchangeScreenings',
                    replaceAt(value.sebiExchangeScreenings, index, { ...screening, notes: next }),
                  )
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Tax proceeding details"
        description="Capture tax metadata for tax matters in the Matter Master."
        addLabel="Add tax proceeding"
        onAdd={() =>
          set('taxProceedingDetails', [...value.taxProceedingDetails, createEmptyTaxProceedingDetail()])
        }
        emptyMessage="No tax proceeding details yet."
        count={value.taxProceedingDetails.length}
      >
        {value.taxProceedingDetails.map((detail, index) => {
          const linkedMatter = getMatterById(payload, detail.matterId);
          const showTaxFields = !detail.matterId || isTaxMatter(linkedMatter);
          return (
            <RepeatableCard
              key={`tax-${index}`}
              title={linkedMatter ? linkedMatter.identity.matterTitle || `Tax proceeding ${index + 1}` : `Tax proceeding ${index + 1}`}
              onRemove={() =>
                set('taxProceedingDetails', removeAt(value.taxProceedingDetails, index))
              }
            >
              <FieldGrid columns={3}>
                <MatterSelect
                  id={`tax-matter-${index}`}
                  label="Linked tax matter"
                  value={detail.matterId}
                  onChange={(next) =>
                    set(
                      'taxProceedingDetails',
                      replaceAt(value.taxProceedingDetails, index, { ...detail, matterId: next }),
                    )
                  }
                  payload={payload}
                  filter={(matterId) => isTaxMatter(getMatterById(payload, matterId))}
                  helper="Only tax-category matters are listed."
                />
                {showTaxFields ? (
                  <>
                    <SelectField
                      id={`tax-type-${index}`}
                      label="Tax type"
                      value={detail.taxType}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, {
                            ...detail,
                            taxType: asEnumValue<TaxType>(next),
                          }),
                        )
                      }
                      options={[{ value: '', label: 'Select…' }, ...TAX_TYPE_OPTIONS]}
                    />
                    <TextInputField
                      id={`tax-ay-${index}`}
                      label="Assessment year / financial year"
                      value={detail.assessmentYearFinancialYear}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, {
                            ...detail,
                            assessmentYearFinancialYear: next,
                          }),
                        )
                      }
                    />
                    <TextInputField
                      id={`tax-authority-${index}`}
                      label="Authority"
                      value={detail.authority}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, { ...detail, authority: next }),
                        )
                      }
                    />
                    <DecimalInputField
                      id={`tax-demand-${index}`}
                      label="Demand"
                      value={detail.demand}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, { ...detail, demand: next }),
                        )
                      }
                    />
                    <DecimalInputField
                      id={`tax-penalty-${index}`}
                      label="Penalty"
                      value={detail.penalty}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, { ...detail, penalty: next }),
                        )
                      }
                    />
                    <DecimalInputField
                      id={`tax-balance-${index}`}
                      label="Balance disputed"
                      value={detail.balanceDisputed}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, {
                            ...detail,
                            balanceDisputed: next,
                          }),
                        )
                      }
                    />
                    <TernaryField
                      id={`tax-stay-${index}`}
                      label="Stay granted"
                      value={detail.stayGranted}
                      onChange={(next) =>
                        set(
                          'taxProceedingDetails',
                          replaceAt(value.taxProceedingDetails, index, { ...detail, stayGranted: next }),
                        )
                      }
                    />
                  </>
                ) : (
                  <p className="col-span-full text-xs text-muted-foreground">
                    Selected matter is not a tax matter — tax-specific fields are hidden.
                  </p>
                )}
                <TextAreaField
                  id={`tax-notes-${index}`}
                  label="Notes"
                  value={detail.notes}
                  onChange={(next) =>
                    set(
                      'taxProceedingDetails',
                      replaceAt(value.taxProceedingDetails, index, { ...detail, notes: next }),
                    )
                  }
                  rows={2}
                />
              </FieldGrid>
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <LitigationApprovalsComplianceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
