'use client';

import {
  DecimalInputField,
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
import {
  createEmptyDirectorRemunerationRecord,
  createEmptyExecutiveAppointmentTerm,
  createEmptyKmpSmpRemunerationRecord,
} from '@/lib/management-governance/defaults';
import { getDirectors } from '@/lib/management-governance/directors';
import { SOURCE_STATUS_OPTIONS } from '@/lib/management-governance/options';
import type {
  RemunerationServiceContractsEsopsAndBenefits,
  SourceStatus,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'remuneration-service-contracts-esops-and-benefits' as const;

export function RemunerationForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.remunerationServiceContractsEsopsAndBenefits;
  const directors = getDirectors(payload);

  const set = <K extends keyof RemunerationServiceContractsEsopsAndBenefits>(
    key: K,
    next: RemunerationServiceContractsEsopsAndBenefits[K],
  ) => {
    updateSection('remunerationServiceContractsEsopsAndBenefits', { ...value, [key]: next }, SECTION_ID);
  };

  const directorOptions = directors.map((director) => ({
    value: director.id,
    label: director.fullLegalName || director.din || director.id.slice(0, 8),
  }));

  const kmpOptions = payload.kmpSeniorManagementAndOrganisationStructure.kmpSmpRecords.map(
    (person) => ({
      value: person.id,
      label: person.fullName || person.designation || person.id.slice(0, 8),
    }),
  );

  return (
    <SectionCard
      title="Remuneration, Service Contracts, ESOPs & Benefits"
      description="Director and KMP/SMP remuneration, incentive arrangements, service contracts and ESOP governance."
    >
      <RepeatableList
        title="Director remuneration"
        addLabel="Add remuneration row"
        count={value.directorRemuneration.length}
        emptyMessage="No director remuneration recorded."
        onAdd={() =>
          set('directorRemuneration', [
            ...value.directorRemuneration,
            createEmptyDirectorRemunerationRecord(),
          ])
        }
      >
        {value.directorRemuneration.map((row, index) => (
          <RepeatableCard
            key={row.id}
            title={row.financialYear || `Remuneration ${index + 1}`}
            onRemove={() => set('directorRemuneration', removeAt(value.directorRemuneration, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`rem-dir-${row.id}-director`}
                label="Director"
                value={row.directorId}
                onChange={(next) =>
                  set(
                    'directorRemuneration',
                    replaceAt(value.directorRemuneration, index, { ...row, directorId: next }),
                  )
                }
                options={directorOptions}
                emptyLabel="Select director"
              />
              <TextInputField
                id={`rem-dir-${row.id}-fy`}
                label="Financial year"
                value={row.financialYear}
                onChange={(next) =>
                  set(
                    'directorRemuneration',
                    replaceAt(value.directorRemuneration, index, { ...row, financialYear: next }),
                  )
                }
              />
              <DecimalInputField
                id={`rem-dir-${row.id}-salary`}
                label="Salary (₹)"
                value={row.salary}
                onChange={(next) =>
                  set(
                    'directorRemuneration',
                    replaceAt(value.directorRemuneration, index, { ...row, salary: next }),
                  )
                }
              />
              <DecimalInputField
                id={`rem-dir-${row.id}-total`}
                label="Total remuneration (₹)"
                value={row.totalRemuneration}
                onChange={(next) =>
                  set(
                    'directorRemuneration',
                    replaceAt(value.directorRemuneration, index, { ...row, totalRemuneration: next }),
                  )
                }
              />
              <SelectField
                id={`rem-dir-${row.id}-source`}
                label="Source status"
                value={row.sourceStatus}
                onChange={(next) =>
                  set(
                    'directorRemuneration',
                    replaceAt(value.directorRemuneration, index, {
                      ...row,
                      sourceStatus: next as SourceStatus | '',
                    }),
                  )
                }
                options={SOURCE_STATUS_OPTIONS}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Executive appointment terms"
        addLabel="Add appointment terms"
        count={value.executiveAppointmentTerms.length}
        emptyMessage="No executive appointment terms recorded."
        onAdd={() =>
          set('executiveAppointmentTerms', [
            ...value.executiveAppointmentTerms,
            createEmptyExecutiveAppointmentTerm(),
          ])
        }
      >
        {value.executiveAppointmentTerms.map((term, index) => (
          <RepeatableCard
            key={term.id}
            title={`Executive terms ${index + 1}`}
            onRemove={() =>
              set('executiveAppointmentTerms', removeAt(value.executiveAppointmentTerms, index))
            }
          >
            <FieldGrid>
              <SelectField
                id={`eat-${term.id}-director`}
                label="Director"
                value={term.directorId}
                onChange={(next) =>
                  set(
                    'executiveAppointmentTerms',
                    replaceAt(value.executiveAppointmentTerms, index, { ...term, directorId: next }),
                  )
                }
                options={directorOptions}
                emptyLabel="Select director"
              />
              <TernaryField
                id={`eat-${term.id}-agreement`}
                label="Appointment agreement exists"
                value={term.appointmentAgreementExists}
                onChange={(next) =>
                  set(
                    'executiveAppointmentTerms',
                    replaceAt(value.executiveAppointmentTerms, index, {
                      ...term,
                      appointmentAgreementExists: next,
                    }),
                  )
                }
              />
              <DecimalInputField
                id={`eat-${term.id}-fixed`}
                label="Fixed salary (₹)"
                value={term.fixedSalary}
                onChange={(next) =>
                  set(
                    'executiveAppointmentTerms',
                    replaceAt(value.executiveAppointmentTerms, index, { ...term, fixedSalary: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="KMP / SMP remuneration"
        addLabel="Add KMP remuneration"
        count={value.kmpSmpRemuneration.length}
        emptyMessage="No KMP/SMP remuneration recorded."
        onAdd={() =>
          set('kmpSmpRemuneration', [...value.kmpSmpRemuneration, createEmptyKmpSmpRemunerationRecord()])
        }
      >
        {value.kmpSmpRemuneration.map((row, index) => (
          <RepeatableCard
            key={row.id}
            title={row.financialYear || `KMP remuneration ${index + 1}`}
            onRemove={() => set('kmpSmpRemuneration', removeAt(value.kmpSmpRemuneration, index))}
          >
            <FieldGrid>
              <SelectField
                id={`rem-kmp-${row.id}-person`}
                label="Person"
                value={row.personId}
                onChange={(next) =>
                  set(
                    'kmpSmpRemuneration',
                    replaceAt(value.kmpSmpRemuneration, index, { ...row, personId: next }),
                  )
                }
                options={kmpOptions}
                emptyLabel="Select person"
              />
              <TextInputField
                id={`rem-kmp-${row.id}-fy`}
                label="Financial year"
                value={row.financialYear}
                onChange={(next) =>
                  set(
                    'kmpSmpRemuneration',
                    replaceAt(value.kmpSmpRemuneration, index, { ...row, financialYear: next }),
                  )
                }
              />
              <DecimalInputField
                id={`rem-kmp-${row.id}-total`}
                label="Total (₹)"
                value={row.total}
                onChange={(next) =>
                  set(
                    'kmpSmpRemuneration',
                    replaceAt(value.kmpSmpRemuneration, index, { ...row, total: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="ESOP governance">
        <FieldGrid>
          <TernaryField
            id="rem-esop-exists"
            label="ESOP scheme exists"
            value={value.esopGovernance.esopSchemeExists}
            onChange={(next) =>
              set('esopGovernance', { ...value.esopGovernance, esopSchemeExists: next })
            }
          />
          <TextInputField
            id="rem-esop-name"
            label="Scheme name"
            value={value.esopGovernance.schemeName}
            onChange={(next) =>
              set('esopGovernance', { ...value.esopGovernance, schemeName: next })
            }
          />
          <TernaryField
            id="rem-esop-nrc"
            label="Administered by NRC"
            value={value.esopGovernance.nrcAdministration}
            onChange={(next) =>
              set('esopGovernance', { ...value.esopGovernance, nrcAdministration: next })
            }
          />
        </FieldGrid>
      </SubSection>

      <TextAreaField
        id="rem-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
