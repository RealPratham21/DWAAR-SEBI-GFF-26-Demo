import type { DrhpChapterDefinition, DrhpChapter, DrhpChapterStatus } from '@/lib/drhp/types';

/** Stable 18-chapter registry for the DRHP Draft Workspace. */
export const DRHP_CHAPTER_DEFINITIONS: DrhpChapterDefinition[] = [
  { key: 'cover-page-front-matter', title: 'Cover Page & Front Matter', order: 1 },
  { key: 'definitions-abbreviations', title: 'Definitions & Abbreviations', order: 2 },
  { key: 'summary-of-drhp', title: 'Summary of DRHP', order: 3 },
  { key: 'risk-factors', title: 'Risk Factors', order: 4 },
  {
    key: 'general-information-issue',
    title: 'General Information & The Issue',
    order: 5,
    workstreamSlug: 'company-incorporation',
    workstreamTitle: 'Company & Incorporation',
  },
  {
    key: 'capital-structure-ownership',
    title: 'Capital Structure & Ownership',
    order: 6,
    workstreamSlug: 'capital-ownership',
    workstreamTitle: 'Capital & Ownership',
  },
  {
    key: 'objects-of-the-issue',
    title: 'Objects of the Issue',
    order: 7,
    workstreamSlug: 'objects-of-issue',
    workstreamTitle: 'Objects of the Issue',
  },
  {
    key: 'basis-for-issue-price',
    title: 'Basis for Issue Price',
    order: 8,
    workstreamSlug: 'financials-kpis',
    workstreamTitle: 'Financials & KPIs',
  },
  {
    key: 'industry-overview',
    title: 'Industry Overview',
    order: 9,
    workstreamSlug: 'industry-market',
    workstreamTitle: 'Industry & Market',
  },
  {
    key: 'business-operations',
    title: 'Business & Operations',
    order: 10,
    workstreamSlug: 'business-operations',
    workstreamTitle: 'Business & Operations',
  },
  {
    key: 'company-history-promoters-structure',
    title: 'Company History, Promoters & Corporate Structure',
    order: 11,
    workstreamSlug: 'company-incorporation',
    workstreamTitle: 'Company & Incorporation',
  },
  {
    key: 'management-governance',
    title: 'Management & Governance',
    order: 12,
    workstreamSlug: 'management-governance',
    workstreamTitle: 'Management & Governance',
  },
  {
    key: 'financial-information-mda',
    title: 'Financial Information & MD&A',
    order: 13,
    workstreamSlug: 'financials-kpis',
    workstreamTitle: 'Financials & KPIs',
  },
  {
    key: 'legal-regulatory-approvals',
    title: 'Legal, Regulatory & Approvals',
    order: 14,
    workstreamSlug: 'litigation-approvals-compliance',
    workstreamTitle: 'Litigation, Approvals & Compliance',
  },
  {
    key: 'group-companies-rpt',
    title: 'Group Companies & Related Party Transactions',
    order: 15,
    workstreamSlug: 'group-entities-related-parties',
    workstreamTitle: 'Group Entities & Related Parties',
  },
  {
    key: 'terms-structure-procedure',
    title: 'Terms, Structure & Procedure of the Issue',
    order: 16,
    workstreamSlug: 'ipo-setup-eligibility',
    workstreamTitle: 'IPO Setup & Eligibility',
  },
  {
    key: 'material-contracts-inspection',
    title: 'Material Contracts & Documents for Inspection',
    order: 17,
    workstreamSlug: 'intermediaries-filing',
    workstreamTitle: 'Intermediaries & Filing',
  },
  {
    key: 'declarations-aoa-miscellaneous',
    title: 'Declarations, AOA & Miscellaneous',
    order: 18,
    workstreamSlug: 'intermediaries-filing',
    workstreamTitle: 'Intermediaries & Filing',
  },
];

/** Legacy G1 chapter keys mapped to canonical registry keys. */
export const DRHP_CHAPTER_KEY_ALIASES: Record<string, string> = {
  'general-information': 'general-information-issue',
  'company-history-incorporation': 'company-history-promoters-structure',
  'financial-information-kpis': 'financial-information-mda',
  'legal-regulatory-information': 'legal-regulatory-approvals',
  'related-party-transactions': 'group-companies-rpt',
  'main-terms-of-the-issue': 'terms-structure-procedure',
  'material-contracts': 'material-contracts-inspection',
  'declarations-miscellaneous': 'declarations-aoa-miscellaneous',
};

export const DEFAULT_DRHP_CHAPTER_KEY = DRHP_CHAPTER_DEFINITIONS[0].key;

export function resolveDrhpChapterKey(value: string | null | undefined): string | null {
  if (!value) return null;
  if (DRHP_CHAPTER_DEFINITIONS.some((c) => c.key === value)) return value;
  return DRHP_CHAPTER_KEY_ALIASES[value] ?? null;
}

export function isDrhpChapterKey(value: string | null | undefined): boolean {
  return resolveDrhpChapterKey(value) !== null;
}

export function getDrhpChapterDefinition(key: string): DrhpChapterDefinition | undefined {
  const resolved = resolveDrhpChapterKey(key) ?? key;
  return DRHP_CHAPTER_DEFINITIONS.find((chapter) => chapter.key === resolved);
}

export function buildEmptyDrhpChapters(
  status: DrhpChapterStatus = 'not_generated',
): DrhpChapter[] {
  return DRHP_CHAPTER_DEFINITIONS.map((definition) => ({
    id: `chapter:${definition.key}`,
    key: definition.key,
    title: definition.title,
    order: definition.order,
    status,
    sections: [],
    workstreamSlug: definition.workstreamSlug,
    workstreamTitle: definition.workstreamTitle,
  }));
}

export function chapterStatusLabel(status: DrhpChapterStatus): string {
  switch (status) {
    case 'not_generated':
      return 'Not generated';
    case 'generating':
      return 'Generating';
    case 'draft_ready':
      return 'Generated';
    case 'needs_review':
      return 'Generated with warnings';
    case 'blocked':
      return 'Blocked';
    case 'not_connected':
      return 'Not connected';
    case 'ready_with_gaps':
      return 'Ready with gaps';
    case 'ready_with_placeholders':
      return 'Ready with placeholders';
    case 'ready_to_generate':
      return 'Ready to generate';
    case 'depends_on_generated':
      return 'Depends on generated chapters';
    case 'generation_incomplete':
      return 'Generation incomplete';
    default:
      return 'Not generated';
  }
}
