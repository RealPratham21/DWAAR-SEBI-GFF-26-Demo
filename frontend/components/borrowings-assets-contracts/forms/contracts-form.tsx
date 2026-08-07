'use client';

import {
  FieldGrid,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
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
import { createEmptyContractRecord } from '@/lib/borrowings-assets-contracts/defaults';
import { formatContractLabel } from '@/lib/borrowings-assets-contracts/masters';
import {
  countContractReferences,
  formatContractDependencyMessage,
} from '@/lib/borrowings-assets-contracts/references';
import {
  CONTRACT_CATEGORY_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  COUNTERPARTY_ROLE_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  ContractCategory,
  ContractRecord,
  ContractStatus,
  CounterpartyRole,
  MaterialBusinessStrategicAndOtherContracts,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'material-business-strategic-and-other-contracts' as const;

function contractHasData(contract: ContractRecord): boolean {
  return Boolean(
    contract.basicTerms.agreementTitle.trim() ||
      contract.parties.counterparty.trim() ||
      contract.category,
  );
}

export function ContractsForm() {
  const { payload, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.materialBusinessStrategicAndOtherContracts;

  const set = <K extends keyof MaterialBusinessStrategicAndOtherContracts>(
    key: K,
    next: MaterialBusinessStrategicAndOtherContracts[K],
  ) => {
    updateSection('materialBusinessStrategicAndOtherContracts', { ...value, [key]: next }, SECTION_ID);
  };

  const setContracts = (next: ContractRecord[]) => set('contracts', next);

  const removeContract = (index: number) => {
    const contract = value.contracts[index];
    const deps = countContractReferences(payload, contract.id);
    if (deps.length > 0) {
      window.alert(formatContractDependencyMessage(payload, contract.id, deps));
      return;
    }
    if (contractHasData(contract) && !window.confirm('Remove this contract?')) return;
    setContracts(removeAt(value.contracts, index));
  };

  return (
    <SectionCard
      title="Material Business, Strategic & Other Contracts"
      description="Canonical Contract Master for material commercial and strategic agreements."
    >
      <RepeatableList
        title="Contract Master"
        addLabel="Add contract"
        onAdd={() => setContracts([...value.contracts, createEmptyContractRecord()])}
        emptyMessage="No contracts recorded yet."
        count={value.contracts.length}
      >
        {value.contracts.map((contract, index) => (
          <RepeatableCard
            key={contract.id}
            title={formatContractLabel(contract) || `Contract ${index + 1}`}
            subtitle={contract.category.replaceAll('-', ' ') || undefined}
            onRemove={() => removeContract(index)}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`con-${contract.id}-category`}
                label="Category"
                value={contract.category}
                onChange={(next) =>
                  setContracts(
                    replaceAt(value.contracts, index, {
                      ...contract,
                      category: next as ContractCategory | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...CONTRACT_CATEGORY_OPTIONS]}
              />
              <TextInputField
                id={`con-${contract.id}-title`}
                label="Agreement title"
                value={contract.basicTerms.agreementTitle}
                onChange={(next) =>
                  setContracts(
                    replaceAt(value.contracts, index, {
                      ...contract,
                      basicTerms: { ...contract.basicTerms, agreementTitle: next },
                    }),
                  )
                }
              />
              <TextInputField
                id={`con-${contract.id}-counterparty`}
                label="Counterparty"
                value={contract.parties.counterparty}
                onChange={(next) =>
                  setContracts(
                    replaceAt(value.contracts, index, {
                      ...contract,
                      parties: { ...contract.parties, counterparty: next },
                    }),
                  )
                }
              />
              <SelectField
                id={`con-${contract.id}-role`}
                label="Counterparty role"
                value={contract.parties.role}
                onChange={(next) =>
                  setContracts(
                    replaceAt(value.contracts, index, {
                      ...contract,
                      parties: { ...contract.parties, role: next as CounterpartyRole | '' },
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...COUNTERPARTY_ROLE_OPTIONS]}
              />
              <TernaryField
                id={`con-${contract.id}-related-party`}
                label="Related-party agreement"
                value={contract.parties.relatedPartyStatus}
                onChange={(next) =>
                  setContracts(
                    replaceAt(value.contracts, index, {
                      ...contract,
                      parties: { ...contract.parties, relatedPartyStatus: next },
                    }),
                  )
                }
              />
            </FieldGrid>

            <SubSection title="Basic terms">
              <FieldGrid columns={3}>
                <TextInputField
                  id={`con-${contract.id}-effective`}
                  label="Effective date"
                  type="date"
                  value={contract.basicTerms.effectiveDate}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        basicTerms: { ...contract.basicTerms, effectiveDate: next },
                      }),
                    )
                  }
                />
                <TextInputField
                  id={`con-${contract.id}-expiry`}
                  label="Expiry"
                  type="date"
                  value={contract.basicTerms.expiry}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        basicTerms: { ...contract.basicTerms, expiry: next },
                      }),
                    )
                  }
                />
                <SelectField
                  id={`con-${contract.id}-status`}
                  label="Status"
                  value={contract.basicTerms.status}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        basicTerms: {
                          ...contract.basicTerms,
                          status: next as ContractStatus | '',
                        },
                      }),
                    )
                  }
                  options={[{ value: '', label: 'Select…' }, ...CONTRACT_STATUS_OPTIONS]}
                />
                <TernaryField
                  id={`con-${contract.id}-auto-renewal`}
                  label="Auto-renewal"
                  value={contract.basicTerms.autoRenewal}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        basicTerms: { ...contract.basicTerms, autoRenewal: next },
                      }),
                    )
                  }
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Commercial importance">
              <FieldGrid columns={3}>
                <DecimalInputField
                  id={`con-${contract.id}-value`}
                  label="Contract value"
                  value={contract.commercialImportance.contractValue}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        commercialImportance: {
                          ...contract.commercialImportance,
                          contractValue: next,
                        },
                      }),
                    )
                  }
                />
                <TernaryField
                  id={`con-${contract.id}-exclusivity`}
                  label="Exclusivity"
                  value={contract.commercialImportance.exclusivity}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        commercialImportance: {
                          ...contract.commercialImportance,
                          exclusivity: next,
                        },
                      }),
                    )
                  }
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Rights & obligations">
              <TernaryField
                id={`con-${contract.id}-issuer-obligations`}
                label="Material issuer obligations"
                value={contract.rightsAndObligations.materialIssuerObligations}
                onChange={(next) =>
                  setContracts(
                    replaceAt(value.contracts, index, {
                      ...contract,
                      rightsAndObligations: {
                        ...contract.rightsAndObligations,
                        materialIssuerObligations: next,
                      },
                    }),
                  )
                }
              />
            </SubSection>

            <SubSection title="Termination">
              <FieldGrid columns={3}>
                <TernaryField
                  id={`con-${contract.id}-termination-breach`}
                  label="Termination for breach"
                  value={contract.termination.terminationForBreach}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        termination: { ...contract.termination, terminationForBreach: next },
                      }),
                    )
                  }
                />
                <TernaryField
                  id={`con-${contract.id}-coc-termination`}
                  label="Change-of-control termination"
                  value={contract.termination.changeOfControlTermination}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        termination: { ...contract.termination, changeOfControlTermination: next },
                      }),
                    )
                  }
                />
                <TernaryField
                  id={`con-${contract.id}-ipo-trigger`}
                  label="IPO/listing trigger"
                  value={contract.termination.ipoListingTrigger}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        termination: { ...contract.termination, ipoListingTrigger: next },
                      }),
                    )
                  }
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Assignment & change of control">
              <FieldGrid columns={3}>
                <TernaryField
                  id={`con-${contract.id}-assignment-restricted`}
                  label="Assignment restricted"
                  value={contract.assignmentChangeOfControl.assignmentRestricted}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        assignmentChangeOfControl: {
                          ...contract.assignmentChangeOfControl,
                          assignmentRestricted: next,
                        },
                      }),
                    )
                  }
                />
                <TernaryField
                  id={`con-${contract.id}-coc-consent`}
                  label="Change-of-control consent required"
                  value={contract.assignmentChangeOfControl.changeOfControlConsentRequired}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        assignmentChangeOfControl: {
                          ...contract.assignmentChangeOfControl,
                          changeOfControlConsentRequired: next,
                        },
                      }),
                    )
                  }
                />
                <TernaryField
                  id={`con-${contract.id}-ipo-coc`}
                  label="IPO treated as change of control"
                  value={contract.assignmentChangeOfControl.ipoTreatedAsChangeOfControl}
                  onChange={(next) =>
                    setContracts(
                      replaceAt(value.contracts, index, {
                        ...contract,
                        assignmentChangeOfControl: {
                          ...contract.assignmentChangeOfControl,
                          ipoTreatedAsChangeOfControl: next,
                        },
                      }),
                    )
                  }
                />
              </FieldGrid>
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
