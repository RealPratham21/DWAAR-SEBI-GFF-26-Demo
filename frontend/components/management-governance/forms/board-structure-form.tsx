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
import { ManagementGovernanceSectionActions } from '@/components/management-governance/section-actions';
import { useManagementGovernance } from '@/lib/management-governance/context';
import { getDirectors } from '@/lib/management-governance/directors';
import {
  CHAIRMAN_CLASSIFICATION_OPTIONS,
  COMMITTEE_APPLICABILITY_OPTIONS,
  COMPANY_STATUS_OPTIONS,
  GOVERNANCE_READINESS_STATUS_OPTIONS,
} from '@/lib/management-governance/options';
import type {
  BoardStructureAndIpoGovernanceReadiness,
  ChairmanClassification,
  CommitteeApplicability,
  CompanyStatus,
  GovernanceReadinessStatus,
} from '@/lib/schemas/management-governance';

const SECTION_ID = 'board-structure-and-ipo-governance-readiness' as const;

export function BoardStructureForm() {
  const { payload, updateSection } = useManagementGovernance();
  const value = payload.boardStructureAndIpoGovernanceReadiness;
  const directors = getDirectors(payload);

  const set = <K extends keyof BoardStructureAndIpoGovernanceReadiness>(
    key: K,
    next: BoardStructureAndIpoGovernanceReadiness[K],
  ) => {
    updateSection('boardStructureAndIpoGovernanceReadiness', { ...value, [key]: next }, SECTION_ID);
  };

  const setSnapshot = <K extends keyof BoardStructureAndIpoGovernanceReadiness['boardSnapshot']>(
    key: K,
    next: BoardStructureAndIpoGovernanceReadiness['boardSnapshot'][K],
  ) => {
    set('boardSnapshot', { ...value.boardSnapshot, [key]: next });
  };

  const setReadiness = <K extends keyof BoardStructureAndIpoGovernanceReadiness['governanceReadiness']>(
    key: K,
    next: BoardStructureAndIpoGovernanceReadiness['governanceReadiness'][K],
  ) => {
    set('governanceReadiness', { ...value.governanceReadiness, [key]: next });
  };

  const setIpoCommittee = <K extends keyof BoardStructureAndIpoGovernanceReadiness['ipoCommittee']>(
    key: K,
    next: BoardStructureAndIpoGovernanceReadiness['ipoCommittee'][K],
  ) => {
    set('ipoCommittee', { ...value.ipoCommittee, [key]: next });
  };

  const directorOptions = directors.map((director) => ({
    value: director.id,
    label: director.fullLegalName || director.din || director.id.slice(0, 8),
  }));

  return (
    <SectionCard
      title="Board Structure & IPO Governance Readiness"
      description="Board snapshot, leadership roles, governance readiness and IPO committee structure."
    >
      <SubSection title="Board snapshot" description="Current board composition as of the readiness date.">
        <FieldGrid>
          <TextInputField
            id="bs-as-of-date"
            label="As of date"
            type="date"
            value={value.boardSnapshot.asOfDate}
            onChange={(next) => setSnapshot('asOfDate', next)}
          />
          <SelectField
            id="bs-company-status"
            label="Company status"
            value={value.boardSnapshot.companyStatus}
            onChange={(next) => setSnapshot('companyStatus', next as CompanyStatus | '')}
            options={COMPANY_STATUS_OPTIONS}
          />
          <DecimalInputField
            id="bs-current-board-size"
            label="Current board size"
            value={value.boardSnapshot.currentBoardSize}
            onChange={(next) => setSnapshot('currentBoardSize', next)}
          />
          <DecimalInputField
            id="bs-vacant-seats"
            label="Vacant board seats"
            value={value.boardSnapshot.vacantBoardSeats}
            onChange={(next) => setSnapshot('vacantBoardSeats', next)}
          />
          <DecimalInputField
            id="bs-proposed-board-size"
            label="Proposed board size for listing"
            value={value.boardSnapshot.proposedBoardSizeForListing}
            onChange={(next) => setSnapshot('proposedBoardSizeForListing', next)}
          />
        </FieldGrid>
        <TextAreaField
          id="bs-snapshot-notes"
          label="Snapshot notes"
          rows={2}
          value={value.boardSnapshot.notes}
          onChange={(next) => setSnapshot('notes', next)}
        />
      </SubSection>

      <SubSection title="Board leadership" description="Key leadership roles linked to the director register.">
        <FieldGrid columns={3}>
          <SelectField
            id="bs-chairman"
            label="Chairman"
            value={value.leadership.chairmanDirectorId}
            onChange={(next) =>
              set('leadership', { ...value.leadership, chairmanDirectorId: next })
            }
            options={directorOptions}
            emptyLabel="Select director"
          />
          <SelectField
            id="bs-chairman-class"
            label="Chairman classification"
            value={value.leadership.chairmanClassification}
            onChange={(next) =>
              set('leadership', {
                ...value.leadership,
                chairmanClassification: next as ChairmanClassification | '',
              })
            }
            options={CHAIRMAN_CLASSIFICATION_OPTIONS}
          />
          <SelectField
            id="bs-md"
            label="Managing Director"
            value={value.leadership.managingDirectorDirectorId}
            onChange={(next) =>
              set('leadership', { ...value.leadership, managingDirectorDirectorId: next })
            }
            options={directorOptions}
            emptyLabel="Select director"
          />
          <TernaryField
            id="bs-chairman-md-combined"
            label="Chairman and MD roles combined"
            value={value.leadership.chairmanAndMdRolesCombined}
            onChange={(next) =>
              set('leadership', { ...value.leadership, chairmanAndMdRolesCombined: next })
            }
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Governance readiness" description="IPO-related board and governance readiness milestones.">
        <FieldGrid columns={3}>
          {(
            [
              ['publicCompanyConversion', 'Public company conversion'],
              ['boardReconstitution', 'Board reconstitution'],
              ['independentDirectorAppointments', 'Independent director appointments'],
              ['womanDirectorAppointment', 'Woman director appointment'],
              ['residentDirectorRequirement', 'Resident director requirement'],
              ['boardVacancies', 'Board vacancies'],
              ['ipoSpecificBoardApprovals', 'IPO-specific board approvals'],
              ['professionalGovernanceReview', 'Professional governance review'],
            ] as const
          ).map(([key, label]) => (
            <SelectField
              key={key}
              id={`bs-readiness-${key}`}
              label={label}
              value={value.governanceReadiness[key]}
              onChange={(next) =>
                setReadiness(key, next as GovernanceReadinessStatus | '')
              }
              options={GOVERNANCE_READINESS_STATUS_OPTIONS}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <SubSection title="IPO committee">
        <FieldGrid>
          <TernaryField
            id="bs-ipo-committee-constituted"
            label="IPO committee constituted"
            value={value.ipoCommittee.constituted}
            onChange={(next) => setIpoCommittee('constituted', next)}
          />
          <TextInputField
            id="bs-ipo-committee-date"
            label="Constitution date"
            type="date"
            value={value.ipoCommittee.constitutionDate}
            onChange={(next) => setIpoCommittee('constitutionDate', next)}
          />
          <SelectField
            id="bs-ipo-committee-chair"
            label="Chairperson"
            value={value.ipoCommittee.chairpersonDirectorId}
            onChange={(next) => setIpoCommittee('chairpersonDirectorId', next)}
            options={directorOptions}
            emptyLabel="Select director"
          />
        </FieldGrid>
        <TextAreaField
          id="bs-ipo-committee-powers"
          label="Delegated powers"
          rows={2}
          value={value.ipoCommittee.delegatedPowers}
          onChange={(next) => setIpoCommittee('delegatedPowers', next)}
        />
      </SubSection>

      <SubSection title="Independent director / price band process">
        <FieldGrid>
          <SelectField
            id="bs-price-band-applicability"
            label="Required applicability"
            value={value.independentDirectorPriceBandProcess.requiredApplicabilityStatus}
            onChange={(next) =>
              set('independentDirectorPriceBandProcess', {
                ...value.independentDirectorPriceBandProcess,
                requiredApplicabilityStatus: next as CommitteeApplicability | '',
              })
            }
            options={COMMITTEE_APPLICABILITY_OPTIONS}
          />
          <TernaryField
            id="bs-price-band-committee"
            label="Committee constituted"
            value={value.independentDirectorPriceBandProcess.committeeConstituted}
            onChange={(next) =>
              set('independentDirectorPriceBandProcess', {
                ...value.independentDirectorPriceBandProcess,
                committeeConstituted: next,
              })
            }
          />
        </FieldGrid>
      </SubSection>

      <TextAreaField
        id="bs-section-notes"
        label="Notes"
        rows={3}
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <ManagementGovernanceSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
