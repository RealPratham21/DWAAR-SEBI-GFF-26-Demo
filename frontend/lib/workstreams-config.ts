import type { DRHPPhaseId, Workstream } from './types';

export interface PhaseConfig {
  id: DRHPPhaseId;
  title: string;
  description: string;
  color: string;
}

export const DRHP_PHASES: PhaseConfig[] = [
  {
    id: 'establish-issuer',
    title: 'Phase 1 — Establish the Issuer',
    description: 'Create the legal, corporate, and IPO foundation.',
    color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'core-disclosures',
    title: 'Phase 2 — Build the Core Disclosures',
    description: 'Capture the principal issuer, business, financial, and governance disclosures.',
    color: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'due-diligence',
    title: 'Phase 3 — Complete Due Diligence',
    description: 'Complete industry, group, financial, legal, and regulatory due diligence.',
    color: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'finalise-filing',
    title: 'Phase 4 — Finalise the Filing',
    description: 'Complete intermediary, review, and filing requirements.',
    color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
];

export const WORKSTREAMS: Workstream[] = [
  {
    sequence: 1,
    slug: 'company-incorporation',
    title: 'Company & Incorporation',
    description:
      'Legal identity, incorporation history, offices, constitutional documents, and registrations.',
    phaseId: 'establish-issuer',
  },
  {
    sequence: 2,
    slug: 'ipo-setup-eligibility',
    title: 'IPO Setup & Eligibility',
    description: 'Proposed issue structure, target exchange, and eligibility assessment.',
    phaseId: 'establish-issuer',
  },
  {
    sequence: 3,
    slug: 'capital-ownership',
    title: 'Capital & Ownership',
    description: 'Share capital structure, shareholding pattern, and ownership details.',
    phaseId: 'core-disclosures',
  },
  {
    sequence: 4,
    slug: 'business-operations',
    title: 'Business & Operations',
    description: 'Business model, operations, products, services, and revenue streams.',
    phaseId: 'core-disclosures',
  },
  {
    sequence: 5,
    slug: 'objects-of-issue',
    title: 'Objects of the Issue',
    description: 'Purpose of the IPO and planned allocation of issue proceeds.',
    phaseId: 'core-disclosures',
  },
  {
    sequence: 6,
    slug: 'financials-kpis',
    title: 'Financials & KPIs',
    description: 'Historical financial statements and key performance indicators.',
    phaseId: 'core-disclosures',
  },
  {
    sequence: 7,
    slug: 'management-governance',
    title: 'Management & Governance',
    description: 'Board composition, management team, and corporate governance practices.',
    phaseId: 'core-disclosures',
  },
  {
    sequence: 8,
    slug: 'industry-market',
    title: 'Industry & Market',
    description: 'Industry overview, market dynamics, and competitive landscape.',
    phaseId: 'due-diligence',
  },
  {
    sequence: 9,
    slug: 'group-entities-related-parties',
    title: 'Group Entities & Related Parties',
    description: 'Group structure, subsidiaries, associates, and related party relationships.',
    phaseId: 'due-diligence',
  },
  {
    sequence: 10,
    slug: 'borrowings-assets-contracts',
    title: 'Borrowings, Assets & Contracts',
    description: 'Debt profile, material assets, and key commercial contracts.',
    phaseId: 'due-diligence',
  },
  {
    sequence: 11,
    slug: 'litigation-approvals-compliance',
    title: 'Litigation, Approvals & Compliance',
    description: 'Legal proceedings, regulatory approvals, and compliance status.',
    phaseId: 'due-diligence',
  },
  {
    sequence: 12,
    slug: 'intermediaries-filing',
    title: 'Intermediaries & Filing',
    description: 'Merchant bankers, advisors, and DRHP filing requirements.',
    phaseId: 'finalise-filing',
  },
];

export function getWorkstreamsByPhase(phaseId: DRHPPhaseId): Workstream[] {
  return WORKSTREAMS.filter((workstream) => workstream.phaseId === phaseId);
}

export function getWorkstreamBySlug(slug: string): Workstream | undefined {
  return WORKSTREAMS.find((workstream) => workstream.slug === slug);
}

export function getPhaseById(phaseId: DRHPPhaseId): PhaseConfig | undefined {
  return DRHP_PHASES.find((phase) => phase.id === phaseId);
}
