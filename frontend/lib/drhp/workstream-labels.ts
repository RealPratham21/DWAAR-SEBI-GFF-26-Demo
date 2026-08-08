/** Human-readable workstream and section labels for evidence panel (G2R). */

const WORKSTREAM_LABELS: Record<string, string> = {
  'company-incorporation': 'Company Incorporation',
  'ipo-setup-eligibility': 'IPO Setup & Eligibility',
  'capital-ownership': 'Capital & Ownership',
  'business-operations': 'Business & Operations',
  'objects-of-issue': 'Objects of the Issue',
  'financials-kpis': 'Financials & KPIs',
  'management-governance': 'Management & Governance',
  'industry-market': 'Industry & Market',
  'group-entities-related-parties': 'Group Entities & Related Parties',
  'borrowings-assets-contracts': 'Borrowings, Assets & Contracts',
  'litigation-approvals-compliance': 'Litigation, Approvals & Compliance',
  'intermediaries-filing': 'Intermediaries & Filing',
};

const SECTION_LABELS: Record<string, string> = {
  'legal-identity': 'Legal Identity',
  'offices-contact': 'Offices & Contact',
  'current-capital-structure': 'Current Capital Structure',
  'shareholders-beneficial-ownership': 'Shareholders & Beneficial Ownership',
  'business-profile-operating-model': 'Business Profile & Operating Model',
  'products-services-revenue-mix': 'Products, Services & Revenue Mix',
  'customers-sales-distribution-geography': 'Customers, Sales & Distribution',
  'directors-profiles-appointments-and-eligibility': 'Directors — Profiles & Appointments',
  'restated-statement-of-profit-and-loss': 'Restated Statement of Profit and Loss',
  'ratios-capitalisation-and-issue-price-metrics': 'Ratios & Issue Price Metrics',
  'litigation-and-proceedings-master': 'Litigation & Proceedings',
  'group-structure-and-entity-master': 'Group Structure & Entity Master',
  'objects-register-and-allocation': 'Objects Register & Allocation',
  'market-size-segmentation-and-growth': 'Market Size & Growth',
  'issue-team-and-intermediary-master': 'Issue Team & Intermediaries',
};

export function formatWorkstreamLabel(slug: string): string {
  return WORKSTREAM_LABELS[slug] ?? slug.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSectionLabel(sectionKey: string): string {
  return (
    SECTION_LABELS[sectionKey] ??
    sectionKey.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
