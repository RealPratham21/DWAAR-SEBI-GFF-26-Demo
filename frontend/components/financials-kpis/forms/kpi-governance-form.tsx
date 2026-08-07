'use client';

import {
  FieldGrid,
  SelectField,
  SectionCard,
  SubSection,
  TextAreaField,
  TextInputField,
  TernaryField,
} from '@/components/financials-kpis/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/financials-kpis/repeatable-card';
import { FinancialsKpisSectionActions } from '@/components/financials-kpis/section-actions';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import {
  createEmptyKpiRegisterEntry,
  createEmptyPeerComparison,
  createEmptySelectedDataCandidate,
} from '@/lib/financials-kpis/defaults';
import {
  DRHP_LOCATION_OPTIONS,
  KPI_CATEGORY_OPTIONS,
} from '@/lib/financials-kpis/options';
import type {
  DrhpLocation,
  KpiCategory,
  KpiSelectionGovernanceAndPeerComparison,
} from '@/lib/schemas/financials-kpis';

const SECTION_ID = 'kpi-selection-governance-and-peer-comparison' as const;

export function KpiGovernanceForm() {
  const { payload, updateSection } = useFinancialsKpis();
  const value = payload.kpiSelectionGovernanceAndPeerComparison;

  const set = <K extends keyof KpiSelectionGovernanceAndPeerComparison>(
    key: K,
    next: KpiSelectionGovernanceAndPeerComparison[K],
  ) => {
    updateSection('kpiSelectionGovernanceAndPeerComparison', { ...value, [key]: next }, SECTION_ID);
  };

  const setMgmtCert = <K extends keyof KpiSelectionGovernanceAndPeerComparison['managementCertification']>(
    key: K,
    next: KpiSelectionGovernanceAndPeerComparison['managementCertification'][K],
  ) => {
    set('managementCertification', { ...value.managementCertification, [key]: next });
  };

  const setAuditGov = <
    K extends keyof KpiSelectionGovernanceAndPeerComparison['auditCommitteeGovernance'],
  >(
    key: K,
    next: KpiSelectionGovernanceAndPeerComparison['auditCommitteeGovernance'][K],
  ) => {
    set('auditCommitteeGovernance', { ...value.auditCommitteeGovernance, [key]: next });
  };

  return (
    <SectionCard
      title="KPI Selection, Governance & Peer Comparison"
      description="Selected-data inventory, KPI register, governance certifications and peer comparison."
    >
      <RepeatableList
        title="Selected data candidates"
        description="Metrics shared with investors, the board or used in pricing deliberations."
        addLabel="Add candidate"
        onAdd={() =>
          set('selectedDataCandidates', [
            ...value.selectedDataCandidates,
            createEmptySelectedDataCandidate(),
          ])
        }
        emptyMessage="No selected data candidates."
        count={value.selectedDataCandidates.length}
      >
        {value.selectedDataCandidates.map((candidate, index) => (
          <RepeatableCard
            key={candidate.id}
            title={candidate.metricName || `Candidate ${index + 1}`}
            onRemove={() =>
              set('selectedDataCandidates', removeAt(value.selectedDataCandidates, index))
            }
          >
            <FieldGrid>
              <TextInputField
                id={`sdc-name-${candidate.id}`}
                label="Metric name"
                value={candidate.metricName}
                onChange={(next) =>
                  set(
                    'selectedDataCandidates',
                    replaceAt(value.selectedDataCandidates, index, {
                      ...candidate,
                      metricName: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`sdc-category-${candidate.id}`}
                label="Category"
                value={candidate.category}
                onChange={(next) =>
                  set(
                    'selectedDataCandidates',
                    replaceAt(value.selectedDataCandidates, index, {
                      ...candidate,
                      category: next as KpiCategory | '',
                    }),
                  )
                }
                options={KPI_CATEGORY_OPTIONS}
              />
              <TernaryField
                id={`sdc-investors-${candidate.id}`}
                label="Shared with investors (prior 3 years)"
                value={candidate.sharedWithInvestorsPriorThreeYears}
                onChange={(next) =>
                  set(
                    'selectedDataCandidates',
                    replaceAt(value.selectedDataCandidates, index, {
                      ...candidate,
                      sharedWithInvestorsPriorThreeYears: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="KPI register"
        addLabel="Add KPI"
        onAdd={() => set('kpiRegister', [...value.kpiRegister, createEmptyKpiRegisterEntry()])}
        emptyMessage="No KPIs in the register."
        count={value.kpiRegister.length}
      >
        {value.kpiRegister.map((kpi, index) => (
          <RepeatableCard
            key={kpi.id}
            title={kpi.name || `KPI ${index + 1}`}
            onRemove={() => set('kpiRegister', removeAt(value.kpiRegister, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`kpi-name-${kpi.id}`}
                label="KPI name"
                value={kpi.name}
                onChange={(next) =>
                  set(
                    'kpiRegister',
                    replaceAt(value.kpiRegister, index, { ...kpi, name: next }),
                  )
                }
              />
              <SelectField
                id={`kpi-category-${kpi.id}`}
                label="Category"
                value={kpi.category}
                onChange={(next) =>
                  set(
                    'kpiRegister',
                    replaceAt(value.kpiRegister, index, {
                      ...kpi,
                      category: next as KpiCategory | '',
                    }),
                  )
                }
                options={KPI_CATEGORY_OPTIONS}
              />
              <SelectField
                id={`kpi-drhp-${kpi.id}`}
                label="DRHP location"
                value={kpi.drhpLocation}
                onChange={(next) =>
                  set(
                    'kpiRegister',
                    replaceAt(value.kpiRegister, index, {
                      ...kpi,
                      drhpLocation: next as DrhpLocation | '',
                    }),
                  )
                }
                options={DRHP_LOCATION_OPTIONS}
              />
              <TextAreaField
                id={`kpi-formula-${kpi.id}`}
                label="Formula"
                value={kpi.formula}
                onChange={(next) =>
                  set(
                    'kpiRegister',
                    replaceAt(value.kpiRegister, index, { ...kpi, formula: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Peer comparisons"
        addLabel="Add peer"
        onAdd={() =>
          set('peerComparisons', [...value.peerComparisons, createEmptyPeerComparison()])
        }
        emptyMessage="No peer comparisons."
        count={value.peerComparisons.length}
      >
        {value.peerComparisons.map((peer, index) => (
          <RepeatableCard
            key={peer.id}
            title={peer.companyName || `Peer ${index + 1}`}
            onRemove={() => set('peerComparisons', removeAt(value.peerComparisons, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`peer-name-${peer.id}`}
                label="Company name"
                value={peer.companyName}
                onChange={(next) =>
                  set(
                    'peerComparisons',
                    replaceAt(value.peerComparisons, index, { ...peer, companyName: next }),
                  )
                }
              />
              <TextInputField
                id={`peer-industry-${peer.id}`}
                label="Industry"
                value={peer.industry}
                onChange={(next) =>
                  set(
                    'peerComparisons',
                    replaceAt(value.peerComparisons, index, { ...peer, industry: next }),
                  )
                }
              />
              <TextAreaField
                id={`peer-rationale-${peer.id}`}
                label="Selection rationale"
                value={peer.selectionRationale}
                onChange={(next) =>
                  set(
                    'peerComparisons',
                    replaceAt(value.peerComparisons, index, { ...peer, selectionRationale: next }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Management certification">
        <FieldGrid>
          <TextInputField
            id="mgmt-signatory"
            label="Signatory name"
            value={value.managementCertification.signatoryName}
            onChange={(next) => setMgmtCert('signatoryName', next)}
          />
          <TernaryField
            id="mgmt-accuracy"
            label="Accuracy confirmed"
            value={value.managementCertification.accuracyConfirmed}
            onChange={(next) => setMgmtCert('accuracyConfirmed', next)}
          />
          <TernaryField
            id="mgmt-projections"
            label="Projections excluded from historical KPIs"
            value={value.managementCertification.projectionsExcluded}
            onChange={(next) => setMgmtCert('projectionsExcluded', next)}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Audit Committee governance">
        <FieldGrid>
          <TernaryField
            id="ac-constituted"
            label="Audit Committee constituted"
            value={value.auditCommitteeGovernance.auditCommitteeConstituted}
            onChange={(next) => setAuditGov('auditCommitteeConstituted', next)}
          />
          <TernaryField
            id="ac-kpi-presented"
            label="KPI disclosures presented"
            value={value.auditCommitteeGovernance.kpiDisclosuresPresented}
            onChange={(next) => setAuditGov('kpiDisclosuresPresented', next)}
          />
        </FieldGrid>
      </SubSection>

      <TextAreaField
        id="kpi-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <FinancialsKpisSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
