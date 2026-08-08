/** Workstream keys for Nivara sample-data fixtures (matches route slugs). */
export type NivaraWorkstreamKey =
  | 'company-incorporation'
  | 'ipo-setup-eligibility'
  | 'capital-ownership'
  | 'business-operations'
  | 'objects-of-issue'
  | 'financials-kpis'
  | 'management-governance'
  | 'industry-market'
  | 'group-entities-related-parties'
  | 'borrowings-assets-contracts'
  | 'litigation-approvals-compliance'
  | 'intermediaries-filing';

export const NIVARA_WORKSTREAM_KEYS: readonly NivaraWorkstreamKey[] = [
  'company-incorporation',
  'ipo-setup-eligibility',
  'capital-ownership',
  'business-operations',
  'objects-of-issue',
  'financials-kpis',
  'management-governance',
  'industry-market',
  'group-entities-related-parties',
  'borrowings-assets-contracts',
  'litigation-approvals-compliance',
  'intermediaries-filing',
] as const;
