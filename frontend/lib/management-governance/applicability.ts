/**
 * Governance applicability profile (M1, frontend-only, NOT persisted).
 *
 * Distinguishes SME vs Main Board, Companies Act vs ICDR requirements.
 * Versioned so M2 can move rules to the backend without redesign.
 */

import type { LinkedWorkstreamReferences } from '@/lib/management-governance/types';

export const GOVERNANCE_APPLICABILITY_RULES_VERSION = 1 as const;

export type ListingSegment = 'sme' | 'main-board' | 'unknown';

export type GovernanceRegime = 'companies-act' | 'sme-listing' | 'main-board-lodr' | 'icdr-ipo';

export type CommitteeRequirement = {
  committeeType: string;
  required: boolean;
  reason: string;
};

export type GovernanceApplicabilityProfile = {
  rulesVersion: typeof GOVERNANCE_APPLICABILITY_RULES_VERSION;
  listingSegment: ListingSegment;
  regimes: GovernanceRegime[];
  minimumBoardSize: number;
  requiresIndependentDirectors: boolean;
  minimumIndependentDirectors: number;
  requiresWomanDirector: boolean;
  requiresResidentDirector: boolean;
  requiresAuditCommittee: boolean;
  requiresNominationRemunerationCommittee: boolean;
  requiresStakeholdersRelationshipCommittee: boolean;
  requiresRiskManagementCommittee: boolean;
  requiresCsrCommittee: boolean;
  requiresRegulation23RptFramework: boolean;
  committeeRequirements: CommitteeRequirement[];
  notes: string[];
};

function resolveListingSegment(linkedRefs: LinkedWorkstreamReferences): ListingSegment {
  if (!linkedRefs.ipoSetup.available) return 'unknown';
  const target = linkedRefs.ipoSetup.targetListingSegment?.toLowerCase() ?? '';
  if (target.includes('sme')) return 'sme';
  if (target.includes('main')) return 'main-board';
  return 'unknown';
}

export function buildGovernanceApplicabilityProfile(
  linkedRefs: LinkedWorkstreamReferences,
): GovernanceApplicabilityProfile {
  const listingSegment = resolveListingSegment(linkedRefs);
  const notes: string[] = [];

  if (listingSegment === 'unknown') {
    notes.push(
      'IPO Setup target segment is not available — applying conservative Companies Act baseline until linked.',
    );
  }

  const isSme = listingSegment === 'sme';
  const isMainBoard = listingSegment === 'main-board';

  const regimes: GovernanceRegime[] = ['companies-act', 'icdr-ipo'];
  if (isSme) regimes.push('sme-listing');
  if (isMainBoard) regimes.push('main-board-lodr');

  const minimumBoardSize = isSme ? 3 : isMainBoard ? 6 : 3;
  const requiresIndependentDirectors = isMainBoard;
  const minimumIndependentDirectors = isMainBoard ? 3 : isSme ? 1 : 0;
  const requiresWomanDirector = true;
  const requiresResidentDirector = true;
  const requiresAuditCommittee = isMainBoard;
  const requiresNominationRemunerationCommittee = isMainBoard;
  const requiresStakeholdersRelationshipCommittee = isMainBoard;
  const requiresRiskManagementCommittee = isMainBoard;
  const requiresCsrCommittee = !isSme;
  const requiresRegulation23RptFramework = isMainBoard;

  const committeeRequirements: CommitteeRequirement[] = [
    {
      committeeType: 'audit-committee',
      required: requiresAuditCommittee,
      reason: isMainBoard
        ? 'Main Board LODR requires an Audit Committee.'
        : isSme
          ? 'Not universally mandatory for SME listing — confirm applicability.'
          : 'Confirm listing segment to determine Audit Committee requirement.',
    },
    {
      committeeType: 'nomination-remuneration-committee',
      required: requiresNominationRemunerationCommittee,
      reason: isMainBoard
        ? 'Main Board LODR requires Nomination & Remuneration Committee.'
        : 'May not apply to SME issuers — review SME listing requirements.',
    },
    {
      committeeType: 'stakeholders-relationship-committee',
      required: requiresStakeholdersRelationshipCommittee,
      reason: isMainBoard
        ? 'Main Board LODR requires Stakeholders Relationship Committee.'
        : 'SME issuers may have reduced committee requirements.',
    },
    {
      committeeType: 'risk-management-committee',
      required: requiresRiskManagementCommittee,
      reason: isMainBoard
        ? 'Main Board issuers typically require Risk Management Committee.'
        : 'Not assumed mandatory for SME issuers.',
    },
    {
      committeeType: 'csr-committee',
      required: requiresCsrCommittee,
      reason: 'CSR Committee applies when CSR provisions are triggered under Companies Act.',
    },
    {
      committeeType: 'ipo-committee',
      required: false,
      reason: 'IPO Committee is IPO-process specific — capture if constituted.',
    },
    {
      committeeType: 'independent-directors-price-band-committee',
      required: false,
      reason: 'Price-band process committee applies when IPO pricing process requires it.',
    },
  ];

  if (!linkedRefs.company.available) {
    notes.push('Company & Incorporation link pending — private/public status not confirmed.');
  }

  return {
    rulesVersion: GOVERNANCE_APPLICABILITY_RULES_VERSION,
    listingSegment,
    regimes,
    minimumBoardSize,
    requiresIndependentDirectors,
    minimumIndependentDirectors,
    requiresWomanDirector,
    requiresResidentDirector,
    requiresAuditCommittee,
    requiresNominationRemunerationCommittee,
    requiresStakeholdersRelationshipCommittee,
    requiresRiskManagementCommittee,
    requiresCsrCommittee,
    requiresRegulation23RptFramework,
    committeeRequirements,
    notes,
  };
}
