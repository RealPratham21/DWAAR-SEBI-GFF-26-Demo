import type { DrhpChapterDefinition, DrhpChapter, DrhpChapterStatus } from '@/lib/drhp/types';

/** Stable chapter registry for the DRHP Draft Workspace. */
export const DRHP_CHAPTER_DEFINITIONS: DrhpChapterDefinition[] = [
  {
    key: 'cover-page-front-matter',
    title: 'Cover Page & Front Matter',
    order: 1,
  },
  {
    key: 'definitions-abbreviations',
    title: 'Definitions & Abbreviations',
    order: 2,
  },
  {
    key: 'risk-factors',
    title: 'Risk Factors',
    order: 3,
  },
  {
    key: 'general-information',
    title: 'General Information',
    order: 4,
  },
  {
    key: 'company-history-incorporation',
    title: 'Company History & Incorporation',
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
    key: 'business-operations',
    title: 'Business & Operations',
    order: 8,
    workstreamSlug: 'business-operations',
    workstreamTitle: 'Business & Operations',
  },
  {
    key: 'management-governance',
    title: 'Management & Governance',
    order: 9,
  },
  {
    key: 'financial-information-kpis',
    title: 'Financial Information & KPIs',
    order: 10,
    workstreamSlug: 'financials-kpis',
    workstreamTitle: 'Financials & KPIs',
  },
  {
    key: 'legal-regulatory-information',
    title: 'Legal & Regulatory Information',
    order: 11,
  },
  {
    key: 'material-contracts',
    title: 'Material Contracts',
    order: 12,
  },
  {
    key: 'related-party-transactions',
    title: 'Related Party Transactions',
    order: 13,
  },
  {
    key: 'main-terms-of-the-issue',
    title: 'Main Terms of the Issue',
    order: 14,
  },
  {
    key: 'declarations-miscellaneous',
    title: 'Declarations & Miscellaneous',
    order: 15,
  },
];

export const DEFAULT_DRHP_CHAPTER_KEY = DRHP_CHAPTER_DEFINITIONS[0].key;

export function isDrhpChapterKey(value: string | null | undefined): boolean {
  if (!value) return false;
  return DRHP_CHAPTER_DEFINITIONS.some((chapter) => chapter.key === value);
}

export function getDrhpChapterDefinition(key: string): DrhpChapterDefinition | undefined {
  return DRHP_CHAPTER_DEFINITIONS.find((chapter) => chapter.key === key);
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
      return 'Draft ready';
    case 'needs_review':
      return 'Needs review';
    case 'blocked':
      return 'Blocked';
    case 'not_connected':
      return 'Not connected';
    case 'ready_with_gaps':
      return 'Ready with gaps';
    case 'ready_to_generate':
      return 'Ready to generate';
    default:
      return 'Not generated';
  }
}
