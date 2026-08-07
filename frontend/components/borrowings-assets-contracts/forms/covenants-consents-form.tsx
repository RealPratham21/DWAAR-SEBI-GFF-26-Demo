'use client';

import {
  FacilitySelect,
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/borrowings-assets-contracts/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/borrowings-assets-contracts/repeatable-card';
import { BorrowingsAssetsContractsSectionActions } from '@/components/borrowings-assets-contracts/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import {
  createEmptyCovenantRecord,
  createEmptyCrossDefaultRecord,
  createEmptyDefaultEventRecord,
  createEmptyLenderConsentRecord,
  createEmptyRestructuringEventRecord,
} from '@/lib/borrowings-assets-contracts/defaults';
import {
  COVENANT_COMPLIANCE_STATUS_OPTIONS,
  COVENANT_TYPE_OPTIONS,
  DEFAULT_EVENT_TYPE_OPTIONS,
  FINANCIAL_COVENANT_CATEGORY_OPTIONS,
  IPO_CONSENT_REQUIREMENT_OPTIONS,
  RESTRICTIVE_COVENANT_TRIGGER_OPTIONS,
  RESTRUCTURING_EVENT_TYPE_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  CovenantComplianceStatus,
  CovenantRecord,
  CovenantType,
  CovenantsDefaultsWaiversAndLenderConsents,
  CrossDefaultRecord,
  DefaultEventRecord,
  DefaultEventType,
  FinancialCovenantCategory,
  IpoConsentRequirement,
  LenderConsentRecord,
  RestrictiveCovenantTrigger,
  RestructuringEventRecord,
  RestructuringEventType,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'covenants-defaults-waivers-and-lender-consents' as const;

export function CovenantsConsentsForm() {
  const { payload, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.covenantsDefaultsWaiversAndLenderConsents;

  const set = <K extends keyof CovenantsDefaultsWaiversAndLenderConsents>(
    key: K,
    next: CovenantsDefaultsWaiversAndLenderConsents[K],
  ) => {
    updateSection('covenantsDefaultsWaiversAndLenderConsents', { ...value, [key]: next }, SECTION_ID);
  };

  const setCovenants = (next: CovenantRecord[]) => set('covenants', next);
  const setConsents = (next: LenderConsentRecord[]) => set('lenderConsents', next);
  const setDefaults = (next: DefaultEventRecord[]) => set('defaultEvents', next);
  const setRestructuring = (next: RestructuringEventRecord[]) => set('restructuringEvents', next);
  const setCrossDefaults = (next: CrossDefaultRecord[]) => set('crossDefaults', next);

  return (
    <SectionCard
      title="Covenants, Defaults, Waivers & Lender Consents"
      description="Financial/restrictive covenants, defaults, waivers and IPO lender consent matrix."
    >
      <RepeatableList
        title="Covenants"
        addLabel="Add covenant"
        onAdd={() => setCovenants([...value.covenants, createEmptyCovenantRecord()])}
        emptyMessage="No covenants recorded yet."
        count={value.covenants.length}
      >
        {value.covenants.map((covenant, index) => (
          <RepeatableCard
            key={covenant.id}
            title={covenant.covenantType.replaceAll('-', ' ') || `Covenant ${index + 1}`}
            onRemove={() => setCovenants(removeAt(value.covenants, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`cov-${covenant.id}-facility`}
                label="Linked facility"
                value={covenant.linkedFacilityId}
                onChange={(next) =>
                  setCovenants(
                    replaceAt(value.covenants, index, { ...covenant, linkedFacilityId: next }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`cov-${covenant.id}-type`}
                label="Covenant type"
                value={covenant.covenantType}
                onChange={(next) =>
                  setCovenants(
                    replaceAt(value.covenants, index, {
                      ...covenant,
                      covenantType: next as CovenantType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...COVENANT_TYPE_OPTIONS]}
              />
            </FieldGrid>
            {covenant.covenantType === 'financial' ? (
              <SubSection title="Financial covenant details">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`cov-${covenant.id}-name`}
                    label="Covenant name"
                    value={covenant.financialDetails.covenantName}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          financialDetails: { ...covenant.financialDetails, covenantName: next },
                        }),
                      )
                    }
                  />
                  <SelectField
                    id={`cov-${covenant.id}-category`}
                    label="Category"
                    value={covenant.financialDetails.category}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          financialDetails: {
                            ...covenant.financialDetails,
                            category: next as FinancialCovenantCategory | '',
                          },
                        }),
                      )
                    }
                    options={[{ value: '', label: 'Select…' }, ...FINANCIAL_COVENANT_CATEGORY_OPTIONS]}
                  />
                  <DecimalInputField
                    id={`cov-${covenant.id}-threshold`}
                    label="Threshold value"
                    value={covenant.financialDetails.thresholdValue}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          financialDetails: { ...covenant.financialDetails, thresholdValue: next },
                        }),
                      )
                    }
                  />
                  <DecimalInputField
                    id={`cov-${covenant.id}-actual`}
                    label="Actual value"
                    value={covenant.financialDetails.actualValue}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          financialDetails: { ...covenant.financialDetails, actualValue: next },
                        }),
                      )
                    }
                  />
                  <SelectField
                    id={`cov-${covenant.id}-compliance`}
                    label="Compliance status"
                    value={covenant.financialDetails.complianceStatus}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          financialDetails: {
                            ...covenant.financialDetails,
                            complianceStatus: next as CovenantComplianceStatus | '',
                          },
                        }),
                      )
                    }
                    options={[{ value: '', label: 'Select…' }, ...COVENANT_COMPLIANCE_STATUS_OPTIONS]}
                  />
                </FieldGrid>
              </SubSection>
            ) : covenant.covenantType === 'restrictive' ? (
              <SubSection title="Restrictive covenant details">
                <FieldGrid columns={3}>
                  <SelectField
                    id={`cov-${covenant.id}-trigger`}
                    label="Trigger"
                    value={covenant.restrictiveDetails.trigger}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          restrictiveDetails: {
                            ...covenant.restrictiveDetails,
                            trigger: next as RestrictiveCovenantTrigger | '',
                          },
                        }),
                      )
                    }
                    options={[{ value: '', label: 'Select…' }, ...RESTRICTIVE_COVENANT_TRIGGER_OPTIONS]}
                  />
                  <TernaryField
                    id={`cov-${covenant.id}-consent-required`}
                    label="Consent required"
                    value={covenant.restrictiveDetails.consentRequired}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          restrictiveDetails: { ...covenant.restrictiveDetails, consentRequired: next },
                        }),
                      )
                    }
                  />
                  <TextInputField
                    id={`cov-${covenant.id}-threshold-restrictive`}
                    label="Threshold"
                    value={covenant.restrictiveDetails.threshold}
                    onChange={(next) =>
                      setCovenants(
                        replaceAt(value.covenants, index, {
                          ...covenant,
                          restrictiveDetails: { ...covenant.restrictiveDetails, threshold: next },
                        }),
                      )
                    }
                  />
                </FieldGrid>
              </SubSection>
            ) : null}
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="IPO lender consent matrix"
        description="Consent requirements for IPO, listing and change-of-control events."
        addLabel="Add lender consent"
        onAdd={() => setConsents([...value.lenderConsents, createEmptyLenderConsentRecord()])}
        emptyMessage="No lender consents recorded yet."
        count={value.lenderConsents.length}
      >
        {value.lenderConsents.map((consent, index) => (
          <RepeatableCard
            key={consent.id}
            title={consent.lenderName || `Consent ${index + 1}`}
            onRemove={() => setConsents(removeAt(value.lenderConsents, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`lc-${consent.id}-facility`}
                label="Linked facility"
                value={consent.linkedFacilityId}
                onChange={(next) =>
                  setConsents(
                    replaceAt(value.lenderConsents, index, { ...consent, linkedFacilityId: next }),
                  )
                }
                payload={payload}
              />
              <TextInputField
                id={`lc-${consent.id}-lender`}
                label="Lender name"
                value={consent.lenderName}
                onChange={(next) =>
                  setConsents(replaceAt(value.lenderConsents, index, { ...consent, lenderName: next }))
                }
              />
              <SelectField
                id={`lc-${consent.id}-ipo-requirement`}
                label="IPO consent requirement"
                value={consent.ipoConsentRequirement}
                onChange={(next) =>
                  setConsents(
                    replaceAt(value.lenderConsents, index, {
                      ...consent,
                      ipoConsentRequirement: next as IpoConsentRequirement | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...IPO_CONSENT_REQUIREMENT_OPTIONS]}
              />
              <TernaryField
                id={`lc-${consent.id}-requested`}
                label="Consent requested"
                value={consent.consentRequested}
                onChange={(next) =>
                  setConsents(replaceAt(value.lenderConsents, index, { ...consent, consentRequested: next }))
                }
              />
              <TernaryField
                id={`lc-${consent.id}-received`}
                label="Consent received"
                value={consent.consentReceived}
                onChange={(next) =>
                  setConsents(replaceAt(value.lenderConsents, index, { ...consent, consentReceived: next }))
                }
              />
              <TextInputField
                id={`lc-${consent.id}-consent-date`}
                label="Consent date"
                type="date"
                value={consent.consentDate}
                onChange={(next) =>
                  setConsents(replaceAt(value.lenderConsents, index, { ...consent, consentDate: next }))
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Default events"
        addLabel="Add default event"
        onAdd={() => setDefaults([...value.defaultEvents, createEmptyDefaultEventRecord()])}
        emptyMessage="No default events recorded yet."
        count={value.defaultEvents.length}
      >
        {value.defaultEvents.map((event, index) => (
          <RepeatableCard
            key={event.id}
            title={event.eventType.replaceAll('-', ' ') || `Default ${index + 1}`}
            onRemove={() => setDefaults(removeAt(value.defaultEvents, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`def-${event.id}-facility`}
                label="Linked facility"
                value={event.linkedFacilityId}
                onChange={(next) =>
                  setDefaults(replaceAt(value.defaultEvents, index, { ...event, linkedFacilityId: next }))
                }
                payload={payload}
              />
              <SelectField
                id={`def-${event.id}-type`}
                label="Event type"
                value={event.eventType}
                onChange={(next) =>
                  setDefaults(
                    replaceAt(value.defaultEvents, index, {
                      ...event,
                      eventType: next as DefaultEventType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...DEFAULT_EVENT_TYPE_OPTIONS]}
              />
              <TextInputField
                id={`def-${event.id}-date`}
                label="Event date"
                type="date"
                value={event.eventDate}
                onChange={(next) =>
                  setDefaults(replaceAt(value.defaultEvents, index, { ...event, eventDate: next }))
                }
              />
              <TernaryField
                id={`def-${event.id}-waiver`}
                label="Waiver obtained"
                value={event.waiverObtained}
                onChange={(next) =>
                  setDefaults(replaceAt(value.defaultEvents, index, { ...event, waiverObtained: next }))
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Restructuring events"
        addLabel="Add restructuring event"
        onAdd={() =>
          setRestructuring([...value.restructuringEvents, createEmptyRestructuringEventRecord()])
        }
        emptyMessage="No restructuring events recorded yet."
        count={value.restructuringEvents.length}
      >
        {value.restructuringEvents.map((event, index) => (
          <RepeatableCard
            key={event.id}
            title={event.eventType.replaceAll('-', ' ') || `Restructuring ${index + 1}`}
            onRemove={() => setRestructuring(removeAt(value.restructuringEvents, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`restr-${event.id}-facility`}
                label="Linked facility"
                value={event.linkedFacilityId}
                onChange={(next) =>
                  setRestructuring(
                    replaceAt(value.restructuringEvents, index, { ...event, linkedFacilityId: next }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`restr-${event.id}-type`}
                label="Event type"
                value={event.eventType}
                onChange={(next) =>
                  setRestructuring(
                    replaceAt(value.restructuringEvents, index, {
                      ...event,
                      eventType: next as RestructuringEventType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...RESTRUCTURING_EVENT_TYPE_OPTIONS]}
              />
              <TextAreaField
                id={`restr-${event.id}-reason`}
                label="Reason"
                value={event.reason}
                onChange={(next) =>
                  setRestructuring(replaceAt(value.restructuringEvents, index, { ...event, reason: next }))
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Cross-default clauses"
        addLabel="Add cross-default"
        onAdd={() => setCrossDefaults([...value.crossDefaults, createEmptyCrossDefaultRecord()])}
        emptyMessage="No cross-default clauses recorded yet."
        count={value.crossDefaults.length}
      >
        {value.crossDefaults.map((crossDefault, index) => (
          <RepeatableCard
            key={crossDefault.id}
            title={`Cross-default ${index + 1}`}
            onRemove={() => setCrossDefaults(removeAt(value.crossDefaults, index))}
          >
            <FieldGrid columns={3}>
              <FacilitySelect
                id={`xd-${crossDefault.id}-facility`}
                label="Primary facility"
                value={crossDefault.linkedFacilityId}
                onChange={(next) =>
                  setCrossDefaults(
                    replaceAt(value.crossDefaults, index, { ...crossDefault, linkedFacilityId: next }),
                  )
                }
                payload={payload}
              />
              <TernaryField
                id={`xd-${crossDefault.id}-exists`}
                label="Cross-default clause exists"
                value={crossDefault.clauseExists}
                onChange={(next) =>
                  setCrossDefaults(
                    replaceAt(value.crossDefaults, index, { ...crossDefault, clauseExists: next }),
                  )
                }
              />
              <TernaryField
                id={`xd-${crossDefault.id}-triggered`}
                label="Currently triggered"
                value={crossDefault.currentlyTriggered}
                onChange={(next) =>
                  setCrossDefaults(
                    replaceAt(value.crossDefaults, index, { ...crossDefault, currentlyTriggered: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
