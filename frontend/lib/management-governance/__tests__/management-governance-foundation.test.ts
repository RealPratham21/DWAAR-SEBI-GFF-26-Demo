import { describe, expect, it } from 'vitest';

import {
  assessManagementGovernance,
  buildGovernanceApplicabilityProfile,
  calculateManagementGovernanceProgress,
  computeDirectorshipCounts,
  computeManagementGovernanceModel,
  countByCategory,
  countDirectorReferences,
  createEmptyDirectorRecord,
  createEmptyLinkedWorkstreamReferences,
  createEmptyManagementGovernancePayload,
  createEmptyOtherDirectorshipRecord,
  GOVERNANCE_CRITERION_STATES,
  MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS,
  MANAGEMENT_GOVERNANCE_SCHEMA_VERSION,
  MANAGEMENT_GOVERNANCE_SECTION_IDS,
  managementGovernancePayloadSchema,
  SECTION_PAYLOAD_KEYS,
  validateDirectorDeletion,
} from '@/lib/management-governance';
import type { ManagementGovernancePayload, DirectorRecord } from '@/lib/schemas/management-governance';

describe('management & governance foundation', () => {
  it('freezes schema version and eight sections', () => {
    expect(MANAGEMENT_GOVERNANCE_SCHEMA_VERSION).toBe(1);
    expect(MANAGEMENT_GOVERNANCE_SECTION_IDS).toHaveLength(8);
    const empty = createEmptyManagementGovernancePayload();
    expect(empty.schemaVersion).toBe(1);
    expect(managementGovernancePayloadSchema.safeParse(empty).success).toBe(true);
  });

  it('maps all eight section ids to payload keys', () => {
    expect(SECTION_PAYLOAD_KEYS['board-structure-and-ipo-governance-readiness']).toBe(
      'boardStructureAndIpoGovernanceReadiness',
    );
    expect(SECTION_PAYLOAD_KEYS['governance-policies-rpt-oversight-and-confirmations']).toBe(
      'governancePoliciesRptOversightAndConfirmations',
    );
  });

  it('defaults all eight canonical section keys', () => {
    const empty = createEmptyManagementGovernancePayload();
    expect(empty.boardStructureAndIpoGovernanceReadiness).toBeDefined();
    expect(empty.directorsProfilesAppointmentsAndEligibility).toBeDefined();
    expect(empty.kmpSeniorManagementAndOrganisationStructure).toBeDefined();
    expect(empty.boardCommitteesAndGovernanceBodies).toBeDefined();
    expect(empty.remunerationServiceContractsEsopsAndBenefits).toBeDefined();
    expect(empty.interestsConflictsAndManagementRelationships).toBeDefined();
    expect(empty.changesContinuityAndSuccession).toBeDefined();
    expect(empty.governancePoliciesRptOversightAndConfirmations).toBeDefined();
  });

  it('assigns stable ids to repeatable records', () => {
    const director = createEmptyDirectorRecord();
    expect(director.id.length).toBeGreaterThan(8);
    expect(director.fullLegalName).toBe('');
  });

  it('never coerces an unanswered ternary to "no"', () => {
    const empty = createEmptyManagementGovernancePayload();
    expect(
      empty.boardStructureAndIpoGovernanceReadiness.leadership.chairmanAndMdRolesCombined,
    ).toBe('');
  });

  it('exposes twenty-two confirmation fields', () => {
    expect(MANAGEMENT_GOVERNANCE_CONFIRMATION_FIELDS).toHaveLength(22);
  });

  describe('director counts', () => {
    it('counts directors by category from master records', () => {
      const empty = createEmptyManagementGovernancePayload();
      const payload: ManagementGovernancePayload = {
        ...empty,
        directorsProfilesAppointmentsAndEligibility: {
          ...empty.directorsProfilesAppointmentsAndEligibility,
          directors: [
            {
              ...createEmptyDirectorRecord('d1'),
              fullLegalName: 'Alice Executive',
              appointmentStatus: 'current',
              executiveNonExecutive: 'executive',
              gender: 'female',
              countryOfResidence: 'India',
              designation: 'executive-director',
            },
            {
              ...createEmptyDirectorRecord('d2'),
              fullLegalName: 'Bob Independent',
              appointmentStatus: 'current',
              executiveNonExecutive: 'non-executive',
              independentStatus: 'yes',
              designation: 'independent-director',
              countryOfResidence: 'India',
            },
            {
              ...createEmptyDirectorRecord('d3'),
              fullLegalName: 'Carol Proposed',
              appointmentStatus: 'proposed-for-drhp-filing',
              executiveNonExecutive: 'non-executive',
            },
          ],
        },
      };

      const counts = countByCategory(payload);
      expect(counts.current).toBe(2);
      expect(counts.proposed).toBe(1);
      expect(counts.executive).toBe(1);
      expect(counts.independent).toBe(1);
      expect(counts.women).toBe(1);
      expect(counts.resident).toBe(2);
    });

    it('computes other directorship counts', () => {
      const director: DirectorRecord = {
        ...createEmptyDirectorRecord('d1'),
        otherDirectorships: [
          {
            ...createEmptyOtherDirectorshipRecord('od1'),
            entityName: 'Alpha Ltd',
            entityListingStatus: 'public-listed',
            currentOrCeased: 'current',
          },
          {
            ...createEmptyOtherDirectorshipRecord('od2'),
            entityName: 'Beta Pvt',
            entityListingStatus: 'private',
            currentOrCeased: 'ceased',
          },
        ],
      };
      expect(computeDirectorshipCounts(director)).toEqual({
        totalCurrent: 1,
        currentPublicCompany: 1,
      });
    });
  });

  describe('applicability SME vs main board', () => {
    it('applies lighter committee requirements for SME segment', () => {
      const linked = createEmptyLinkedWorkstreamReferences();
      linked.ipoSetup.available = true;
      linked.ipoSetup.targetListingSegment = 'sme';

      const profile = buildGovernanceApplicabilityProfile(linked);
      expect(profile.listingSegment).toBe('sme');
      expect(profile.requiresAuditCommittee).toBe(false);
      expect(profile.minimumBoardSize).toBe(3);
      expect(profile.regimes).toContain('sme-listing');
    });

    it('applies main-board committee requirements for main-board segment', () => {
      const linked = createEmptyLinkedWorkstreamReferences();
      linked.ipoSetup.available = true;
      linked.ipoSetup.targetListingSegment = 'main-board';

      const profile = buildGovernanceApplicabilityProfile(linked);
      expect(profile.listingSegment).toBe('main-board');
      expect(profile.requiresAuditCommittee).toBe(true);
      expect(profile.minimumIndependentDirectors).toBe(3);
      expect(profile.minimumBoardSize).toBe(6);
      expect(profile.regimes).toContain('main-board-lodr');
    });
  });

  describe('reference deletion validation', () => {
    it('blocks director deletion when referenced by committee membership', () => {
      const empty = createEmptyManagementGovernancePayload();
      const payload: ManagementGovernancePayload = {
        ...empty,
        directorsProfilesAppointmentsAndEligibility: {
          ...empty.directorsProfilesAppointmentsAndEligibility,
          directors: [{ ...createEmptyDirectorRecord('dir-1'), fullLegalName: 'Referenced Director' }],
        },
        boardCommitteesAndGovernanceBodies: {
          ...empty.boardCommitteesAndGovernanceBodies,
          committees: [
            {
              id: 'comm-1',
              committeeType: 'audit-committee',
              name: 'Audit Committee',
              applicability: 'required',
              constitutionDate: '',
              boardResolutionReference: '',
              activeStatus: 'yes',
              chairpersonDirectorId: 'dir-1',
              members: [
                {
                  id: 'mem-1',
                  directorId: 'dir-1',
                  role: 'chair',
                  appointmentDate: '',
                  cessationDate: '',
                  independentStatus: '',
                  executiveNonExecutive: '',
                  financialLiteracyExpertise: '',
                  notes: '',
                },
              ],
              termsOfReferenceAdopted: '',
              termsOfReferenceDate: '',
              quorumRule: '',
              meetingFrequency: '',
              companySecretaryActsAsSecretary: '',
              professionalReviewStatus: '',
              meetingHistory: [],
              notes: '',
            },
          ],
        },
      };

      const validation = validateDirectorDeletion(payload, 'dir-1');
      expect(validation.canDelete).toBe(false);
      expect(validation.dependencies.length).toBeGreaterThan(0);
      expect(countDirectorReferences(payload, 'dir-1').total).toBeGreaterThan(0);
    });
  });

  describe('assessment states', () => {
    it('returns governance criterion states including potential_concern', () => {
      const empty = createEmptyManagementGovernancePayload();
      const payload: ManagementGovernancePayload = {
        ...empty,
        boardStructureAndIpoGovernanceReadiness: {
          ...empty.boardStructureAndIpoGovernanceReadiness,
          boardSnapshot: {
            ...empty.boardStructureAndIpoGovernanceReadiness.boardSnapshot,
            vacantBoardSeats: '2',
          },
        },
        directorsProfilesAppointmentsAndEligibility: {
          ...empty.directorsProfilesAppointmentsAndEligibility,
          directors: [
            {
              ...createEmptyDirectorRecord('d1'),
              fullLegalName: 'Vacant Board Co',
              appointmentStatus: 'current',
              eligibility: {
                ...createEmptyDirectorRecord().eligibility,
                sebiDebarment: 'yes',
                adverseExplanation: 'Under review',
              },
            },
          ],
        },
      };

      const assessment = assessManagementGovernance(payload);
      expect(GOVERNANCE_CRITERION_STATES).toContain('potential_concern');
      expect(assessment.criteria.some((item) => item.state === 'potential_concern')).toBe(true);
    });

    it('marks linked workstreams as pending_linked_workstream when unavailable', () => {
      const empty = createEmptyManagementGovernancePayload();
      const assessment = assessManagementGovernance(empty, createEmptyLinkedWorkstreamReferences());
      expect(
        assessment.criteria.some(
          (item) =>
            item.state === 'pending_linked_workstream' &&
            item.id === 'capital-ownership-link',
        ),
      ).toBe(true);
    });
  });

  describe('progress and compute', () => {
    it('calculates section progress across eight sections', () => {
      const empty = createEmptyManagementGovernancePayload();
      const progress = calculateManagementGovernanceProgress(empty);
      expect(progress.totalSections).toBe(8);
      expect(progress.overallStatus).toBe('not_started');
    });

    it('derives board size from director records in compute model', () => {
      const empty = createEmptyManagementGovernancePayload();
      const payload: ManagementGovernancePayload = {
        ...empty,
        directorsProfilesAppointmentsAndEligibility: {
          ...empty.directorsProfilesAppointmentsAndEligibility,
          directors: [
            { ...createEmptyDirectorRecord('d1'), appointmentStatus: 'current' },
            { ...createEmptyDirectorRecord('d2'), appointmentStatus: 'current' },
          ],
        },
      };
      const model = computeManagementGovernanceModel(payload);
      expect(model.boardSize).toBe(2);
    });
  });
});
