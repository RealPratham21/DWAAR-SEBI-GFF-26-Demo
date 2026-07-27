import type {
  Company,
  Document,
  Fact,
  IssueCard,
  ActionItem,
  StatusType,
} from './types';

export const demoCompany: Company = {
  id: 'comp-001',
  name: 'Aarohan Embedded Systems Limited',
  cin: 'U72200DL2018PLC326789',
  registeredOffice: '123 Tech Park, Delhi 110001',
  website: 'www.aarohan-embedded.com',
  sector: 'Electronics & Semiconductors',
};

export const documents: Document[] = [
  {
    id: 'doc-001',
    name: 'Certificate of Incorporation.pdf',
    category: 'Company Formation',
    status: 'approved',
    uploadedDate: '2025-08-10',
    fileSize: '245 KB',
  },
  {
    id: 'doc-002',
    name: 'CIN Registration.pdf',
    category: 'Registrations',
    status: 'approved',
    uploadedDate: '2025-08-10',
    fileSize: '112 KB',
  },
  {
    id: 'doc-003',
    name: 'Board Resolutions - IPO Decision.pdf',
    category: 'Corporate Actions',
    status: 'approved',
    uploadedDate: '2025-08-12',
    fileSize: '389 KB',
  },
  {
    id: 'doc-004',
    name: 'Articles of Association.pdf',
    category: 'Corporate Documents',
    status: 'approved',
    uploadedDate: '2025-08-10',
    fileSize: '156 KB',
  },
  {
    id: 'doc-005',
    name: 'FY2024 Financial Statements.pdf',
    category: 'Financial Documents',
    status: 'approved',
    uploadedDate: '2025-08-14',
    fileSize: '892 KB',
  },
  {
    id: 'doc-006',
    name: 'FY2025 Audit Report (Draft).pdf',
    category: 'Financial Documents',
    status: 'pending-review',
    uploadedDate: '2025-08-18',
    fileSize: '1.2 MB',
  },
  {
    id: 'doc-007',
    name: 'Director ID Proofs.zip',
    category: 'Director Identification',
    status: 'approved',
    uploadedDate: '2025-08-15',
    fileSize: '2.8 MB',
  },
  {
    id: 'doc-008',
    name: 'Memorandum of Understanding.pdf',
    category: 'Material Contracts',
    status: 'pending-review',
    uploadedDate: '2025-08-19',
    fileSize: '276 KB',
  },
  {
    id: 'doc-009',
    name: 'Property Lease Agreement.pdf',
    category: 'Material Contracts',
    status: 'approved',
    uploadedDate: '2025-08-15',
    fileSize: '445 KB',
  },
  {
    id: 'doc-010',
    name: 'Tax Compliance Certificates.pdf',
    category: 'Tax & Compliance',
    status: 'approved',
    uploadedDate: '2025-08-16',
    fileSize: '634 KB',
  },
];

export const facts: Fact[] = [
  {
    id: 'fact-001',
    fact: 'Legal Company Name',
    value: 'Aarohan Embedded Systems Limited',
    source: 'Certificate of Incorporation',
    verificationStatus: 'verified',
    drwhUses: ['Company Overview', 'Legal Structure'],
  },
  {
    id: 'fact-002',
    fact: 'CIN',
    value: 'U72200DL2018PLC326789',
    source: 'MCA Registration',
    verificationStatus: 'verified',
    drwhUses: ['Legal Structure', 'Company Identity'],
  },
  {
    id: 'fact-003',
    fact: 'Registered Office',
    value: '123 Tech Park, Delhi 110001',
    source: 'Board Resolution',
    verificationStatus: 'pending',
    drwhUses: ['Legal Structure', 'Contact Information'],
  },
  {
    id: 'fact-004',
    fact: 'Date of Incorporation',
    value: '15-Mar-2018',
    source: 'Certificate of Incorporation',
    verificationStatus: 'verified',
    drwhUses: ['Company History', 'Legal Structure'],
  },
  {
    id: 'fact-005',
    fact: 'FY2024 Revenue',
    value: '₹285.6 Crore',
    source: 'Audited Financial Statements',
    verificationStatus: 'verified',
    drwhUses: ['Financial Performance', 'Business Overview'],
  },
  {
    id: 'fact-006',
    fact: 'FY2025 Revenue (Estimated)',
    value: '₹412.3 Crore',
    source: 'Unaudited Management Accounts',
    verificationStatus: 'pending',
    drwhUses: ['Financial Performance', 'Growth Analysis'],
  },
  {
    id: 'fact-007',
    fact: 'Number of Employees',
    value: '485',
    source: 'HR Records',
    verificationStatus: 'verified',
    drwhUses: ['Company Overview', 'Operational Metrics'],
  },
  {
    id: 'fact-008',
    fact: 'Business Sector',
    value: 'Electronics & Semiconductors',
    source: 'Company Information',
    verificationStatus: 'verified',
    drwhUses: ['Company Overview', 'Business Description'],
  },
];

export const issues: IssueCard[] = [
  {
    id: 'issue-001',
    severity: 'high',
    workstream: 'Legal & Compliance',
    description: 'Registered office address verification pending with MCA',
    status: 'in-progress',
    evidence: 'Awaiting official verification from corporate affairs ministry',
  },
  {
    id: 'issue-002',
    severity: 'medium',
    workstream: 'Management & Governance',
    description: 'One director passport validity expires in 6 months',
    status: 'pending-review',
    evidence: 'Director ID needs renewal before filing',
  },
  {
    id: 'issue-003',
    severity: 'high',
    workstream: 'Financial Performance',
    description: 'Machinery depreciation reconciliation for FY2024',
    status: 'in-progress',
    evidence: 'Finance team reconciling with fixed asset register',
  },
  {
    id: 'issue-004',
    severity: 'medium',
    workstream: 'Business Model & Operations',
    description: 'Supplier concentration above 20% threshold',
    status: 'pending-review',
    evidence: 'Top 3 suppliers account for 35% of purchases',
  },
  {
    id: 'issue-005',
    severity: 'critical',
    workstream: 'Legal & Compliance',
    description: 'Operating license expiry in 45 days - renewal pending',
    status: 'blocked',
    evidence: 'Critical for DRHP filing - must be renewed before submission',
  },
];

export const actionItems: ActionItem[] = [
  {
    id: 'action-001',
    title: 'Get MCA verification for registered office',
    workstream: 'Legal & Compliance',
    dueDate: '2025-09-05',
    priority: 'high',
  },
  {
    id: 'action-002',
    title: 'Complete FY2025 audit process',
    workstream: 'Financial Performance',
    dueDate: '2025-09-10',
    priority: 'high',
  },
  {
    id: 'action-003',
    title: 'Update director certifications',
    workstream: 'Management & Governance',
    dueDate: '2025-09-15',
    priority: 'medium',
  },
  {
    id: 'action-004',
    title: 'Finalize material contracts list',
    workstream: 'Material Contracts',
    dueDate: '2025-09-08',
    priority: 'high',
  },
];

export const dashboardMetrics = {
  drwhReadiness: {
    value: 42,
    label: 'DRHP Readiness',
    description: 'Overall preparation progress',
  },
  informationCompleteness: {
    value: 61,
    label: 'Information Completeness',
    description: 'Data coverage across workstreams',
  },
  evidenceCoverage: {
    value: 48,
    label: 'Evidence Coverage',
    description: 'Documentation and evidence support',
  },
  sectionsReady: {
    value: 4,
    max: 12,
    label: 'Sections Ready',
    description: 'Completed DRHP sections',
  },
};

export const drwhChapters: {
  id: string;
  title: string;
  subsections: number;
  status: StatusType;
}[] = [
  {
    id: 'ch-001',
    title: 'Cover Page & Front Matter',
    subsections: 3,
    status: 'in-progress',
  },
  {
    id: 'ch-002',
    title: 'Company Overview',
    subsections: 8,
    status: 'in-progress',
  },
  {
    id: 'ch-003',
    title: 'Business & Operations',
    subsections: 12,
    status: 'in-progress',
  },
  {
    id: 'ch-004',
    title: 'Financial Information',
    subsections: 6,
    status: 'pending-review',
  },
  {
    id: 'ch-005',
    title: 'Management & Governance',
    subsections: 5,
    status: 'in-progress',
  },
  {
    id: 'ch-006',
    title: 'Risk Factors',
    subsections: 15,
    status: 'not-started',
  },
  {
    id: 'ch-007',
    title: 'Capitalization & Shareholding',
    subsections: 4,
    status: 'not-started',
  },
  {
    id: 'ch-008',
    title: 'Legal & Regulatory',
    subsections: 7,
    status: 'in-progress',
  },
  {
    id: 'ch-009',
    title: 'Material Contracts',
    subsections: 6,
    status: 'in-progress',
  },
  {
    id: 'ch-010',
    title: 'Related Party Transactions',
    subsections: 3,
    status: 'not-started',
  },
  {
    id: 'ch-011',
    title: 'Main Terms of the Issue',
    subsections: 8,
    status: 'not-started',
  },
  {
    id: 'ch-012',
    title: 'Declaration & Miscellaneous',
    subsections: 5,
    status: 'not-started',
  },
];
