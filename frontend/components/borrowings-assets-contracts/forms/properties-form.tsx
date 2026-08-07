'use client';

import {
  FieldGrid,
  PropertySelect,
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
  createEmptyPropertyIssueRecord,
  createEmptyPropertyRecord,
} from '@/lib/borrowings-assets-contracts/defaults';
import { formatPropertyLabel } from '@/lib/borrowings-assets-contracts/masters';
import {
  countPropertyReferences,
  formatPropertyDependencyMessage,
} from '@/lib/borrowings-assets-contracts/references';
import {
  OCCUPANCY_BASIS_OPTIONS,
  PROPERTY_ISSUE_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  READINESS_STATE_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  ImmovablePropertiesAndOccupancyRights,
  OccupancyBasis,
  PropertyIssueRecord,
  PropertyIssueType,
  PropertyRecord,
  PropertyType,
  ReadinessState,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'immovable-properties-and-occupancy-rights' as const;

function propertyHasData(property: PropertyRecord): boolean {
  return Boolean(
    property.identity.propertyName.trim() ||
      property.identity.address.trim() ||
      property.identity.propertyType,
  );
}

export function PropertiesForm() {
  const { payload, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.immovablePropertiesAndOccupancyRights;

  const set = <K extends keyof ImmovablePropertiesAndOccupancyRights>(
    key: K,
    next: ImmovablePropertiesAndOccupancyRights[K],
  ) => {
    updateSection('immovablePropertiesAndOccupancyRights', { ...value, [key]: next }, SECTION_ID);
  };

  const setProperties = (next: PropertyRecord[]) => set('properties', next);
  const setIssues = (next: PropertyIssueRecord[]) => set('propertyIssues', next);

  const removeProperty = (index: number) => {
    const property = value.properties[index];
    const deps = countPropertyReferences(payload, property.id);
    if (deps.length > 0) {
      window.alert(formatPropertyDependencyMessage(payload, property.id, deps));
      return;
    }
    if (propertyHasData(property) && !window.confirm('Remove this property?')) return;
    setProperties(removeAt(value.properties, index));
  };

  return (
    <SectionCard
      title="Immovable Properties & Occupancy Rights"
      description="Property Master with owned/leased occupancy and title/lease issue register."
    >
      <RepeatableList
        title="Property Master"
        addLabel="Add property"
        onAdd={() => setProperties([...value.properties, createEmptyPropertyRecord()])}
        emptyMessage="No properties recorded yet."
        count={value.properties.length}
      >
        {value.properties.map((property, index) => (
          <RepeatableCard
            key={property.id}
            title={formatPropertyLabel(property) || `Property ${index + 1}`}
            subtitle={property.occupancyBasis.replaceAll('-', ' ') || undefined}
            onRemove={() => removeProperty(index)}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`prop-${property.id}-name`}
                label="Property name"
                value={property.identity.propertyName}
                onChange={(next) =>
                  setProperties(
                    replaceAt(value.properties, index, {
                      ...property,
                      identity: { ...property.identity, propertyName: next },
                    }),
                  )
                }
              />
              <TextInputField
                id={`prop-${property.id}-address`}
                label="Address"
                value={property.identity.address}
                onChange={(next) =>
                  setProperties(
                    replaceAt(value.properties, index, {
                      ...property,
                      identity: { ...property.identity, address: next },
                    }),
                  )
                }
              />
              <SelectField
                id={`prop-${property.id}-type`}
                label="Property type"
                value={property.identity.propertyType}
                onChange={(next) =>
                  setProperties(
                    replaceAt(value.properties, index, {
                      ...property,
                      identity: {
                        ...property.identity,
                        propertyType: next as PropertyType | '',
                      },
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...PROPERTY_TYPE_OPTIONS]}
              />
              <SelectField
                id={`prop-${property.id}-occupancy`}
                label="Occupancy basis"
                value={property.occupancyBasis}
                onChange={(next) =>
                  setProperties(
                    replaceAt(value.properties, index, {
                      ...property,
                      occupancyBasis: next as OccupancyBasis | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...OCCUPANCY_BASIS_OPTIONS]}
              />
            </FieldGrid>

            {property.occupancyBasis === 'owned' ? (
              <SubSection title="Owned property details">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`prop-${property.id}-legal-owner`}
                    label="Legal owner"
                    value={property.ownedDetails.legalOwner}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          ownedDetails: { ...property.ownedDetails, legalOwner: next },
                        }),
                      )
                    }
                  />
                  <TernaryField
                    id={`prop-${property.id}-title-in-issuer`}
                    label="Title in issuer name"
                    value={property.ownedDetails.titleInIssuerName}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          ownedDetails: { ...property.ownedDetails, titleInIssuerName: next },
                        }),
                      )
                    }
                  />
                  <TernaryField
                    id={`prop-${property.id}-encumbered`}
                    label="Encumbered"
                    value={property.ownedDetails.encumbered}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          ownedDetails: { ...property.ownedDetails, encumbered: next },
                        }),
                      )
                    }
                  />
                  <TextInputField
                    id={`prop-${property.id}-title-defect`}
                    label="Title defect status"
                    value={property.ownedDetails.titleDefectStatus}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          ownedDetails: { ...property.ownedDetails, titleDefectStatus: next },
                        }),
                      )
                    }
                  />
                </FieldGrid>
              </SubSection>
            ) : property.occupancyBasis !== '' ? (
              <SubSection title="Leased / licensed details">
                <FieldGrid columns={3}>
                  <TextInputField
                    id={`prop-${property.id}-lessor`}
                    label="Lessor / licensor"
                    value={property.leasedDetails.lessorLicensor}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          leasedDetails: { ...property.leasedDetails, lessorLicensor: next },
                        }),
                      )
                    }
                  />
                  <TextInputField
                    id={`prop-${property.id}-lease-expiry`}
                    label="Expiry"
                    type="date"
                    value={property.leasedDetails.expiry}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          leasedDetails: { ...property.leasedDetails, expiry: next },
                        }),
                      )
                    }
                  />
                  <DecimalInputField
                    id={`prop-${property.id}-rent`}
                    label="Monthly / annual rent"
                    value={property.leasedDetails.monthlyAnnualRent}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          leasedDetails: { ...property.leasedDetails, monthlyAnnualRent: next },
                        }),
                      )
                    }
                  />
                  <TernaryField
                    id={`prop-${property.id}-renewal-option`}
                    label="Renewal option"
                    value={property.leasedDetails.renewalOption}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          leasedDetails: { ...property.leasedDetails, renewalOption: next },
                        }),
                      )
                    }
                  />
                  <TernaryField
                    id={`prop-${property.id}-coc-restriction`}
                    label="Change-of-control restriction"
                    value={property.leasedDetails.changeOfControlRestriction}
                    onChange={(next) =>
                      setProperties(
                        replaceAt(value.properties, index, {
                          ...property,
                          leasedDetails: {
                            ...property.leasedDetails,
                            changeOfControlRestriction: next,
                          },
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
        title="Property issues"
        addLabel="Add property issue"
        onAdd={() => setIssues([...value.propertyIssues, createEmptyPropertyIssueRecord()])}
        emptyMessage="No property issues recorded yet."
        count={value.propertyIssues.length}
      >
        {value.propertyIssues.map((issue, index) => (
          <RepeatableCard
            key={issue.id}
            title={issue.issueType.replaceAll('-', ' ') || `Issue ${index + 1}`}
            onRemove={() => setIssues(removeAt(value.propertyIssues, index))}
          >
            <FieldGrid columns={3}>
              <PropertySelect
                id={`pi-${issue.id}-property`}
                label="Linked property"
                value={issue.linkedPropertyId}
                onChange={(next) =>
                  setIssues(
                    replaceAt(value.propertyIssues, index, { ...issue, linkedPropertyId: next }),
                  )
                }
                payload={payload}
              />
              <SelectField
                id={`pi-${issue.id}-type`}
                label="Issue type"
                value={issue.issueType}
                onChange={(next) =>
                  setIssues(
                    replaceAt(value.propertyIssues, index, {
                      ...issue,
                      issueType: next as PropertyIssueType | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...PROPERTY_ISSUE_TYPE_OPTIONS]}
              />
              <SelectField
                id={`pi-${issue.id}-readiness`}
                label="Readiness state"
                value={issue.readinessState}
                onChange={(next) =>
                  setIssues(
                    replaceAt(value.propertyIssues, index, {
                      ...issue,
                      readinessState: next as ReadinessState | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...READINESS_STATE_OPTIONS]}
              />
              <TextAreaField
                id={`pi-${issue.id}-explanation`}
                label="Explanation"
                value={issue.explanation}
                onChange={(next) =>
                  setIssues(replaceAt(value.propertyIssues, index, { ...issue, explanation: next }))
                }
                rows={2}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
