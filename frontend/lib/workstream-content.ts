export interface WorkstreamInformationField {
  label: string;
  value: string;
  verified?: boolean;
  conflict?: string;
}

export interface WorkstreamDocument {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'flagged';
  size: string;
  crossRef?: string;
}

export interface WorkstreamQA {
  id: string;
  question: string;
  answer: string;
  status: 'resolved' | 'pending';
  relatedGaps?: string[];
}

export interface WorkstreamFact {
  id: string;
  title: string;
  value: string;
  source: string;
  verified: boolean;
  conflict?: {
    conflictingValue: string;
    conflictingSource: string;
  };
}

export interface WorkstreamDisclosure {
  id: string;
  section: string;
  content: string;
  source: string;
  status: 'approved' | 'pending-review' | 'requires-revision';
}

export interface WorkstreamContent {
  slug: string;
  information: WorkstreamInformationField[];
  documents: WorkstreamDocument[];
  questions: WorkstreamQA[];
  facts: WorkstreamFact[];
  disclosures: WorkstreamDisclosure[];
}

export const workstreamContentMap: Record<string, WorkstreamContent> = {
  'company-overview': {
    slug: 'company-overview',
    information: [
      { label: 'CIN', value: 'U52109TN2015PTC098765', verified: true },
      { label: 'Date of Incorporation', value: '12 March 2015', verified: true },
      { label: 'Registered Office', value: '123 Tech Park, Chennai, TN 600096', verified: true, conflict: 'Corporate office at different location' },
      { label: 'Corporate Office', value: '45 Innovation Drive, Bangalore, KA 560001', verified: true },
      { label: 'State of Registration', value: 'Tamil Nadu', verified: true },
      { label: 'RoC Registration Number', value: 'ROC/TN/123456', verified: true },
      { label: 'Company Category', value: 'Private Limited', verified: true },
      { label: 'Paid-up Capital', value: '₹5.00 Crore', verified: true },
      { label: 'Number of Shareholders', value: '12', verified: true },
      { label: 'Financial Year End', value: '31 March', verified: true },
    ],
    documents: [
      { id: 'd1', name: 'Certificate of Incorporation', category: 'Statutory', uploadDate: '2024-01-15', status: 'verified', size: '2.1 MB', crossRef: 'RoC records' },
      { id: 'd2', name: 'MoA & AoA', category: 'Constitutional', uploadDate: '2024-01-18', status: 'verified', size: '1.8 MB' },
      { id: 'd3', name: 'Board Resolution for IPO', category: 'Board Approvals', uploadDate: '2024-01-20', status: 'verified', size: '0.9 MB' },
      { id: 'd4', name: 'PAN Certificate', category: 'Tax Documents', uploadDate: '2024-01-22', status: 'verified', size: '0.3 MB' },
      { id: 'd5', name: 'GST Registration', category: 'Tax Documents', uploadDate: '2024-01-22', status: 'verified', size: '0.4 MB' },
      { id: 'd6', name: 'Board Composition Certificate', category: 'Governance', uploadDate: '2024-01-25', status: 'pending', size: '1.2 MB' },
      { id: 'd7', name: 'Registered Address Proof', category: 'Statutory', uploadDate: '2024-01-28', status: 'pending', size: '0.7 MB' },
      { id: 'd8', name: 'List of Key Contracts', category: 'Contracts', uploadDate: '2024-02-01', status: 'flagged', size: '1.5 MB' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the tenure of current Board members?',
        answer: 'Chairman: 8 years, MD: 6 years, Directors: 3-5 years. All within limits specified in MoA.',
        status: 'resolved',
      },
      {
        id: 'q2',
        question: 'Any changes in Directors/KMPs in last 3 years?',
        answer: 'Two independent directors appointed in FY2022. One director retired in FY2023.',
        status: 'resolved',
      },
      {
        id: 'q3',
        question: 'Are there any related party transactions?',
        answer: 'Yes. Rent to related party ₹25 lakhs/annum. All RPTs approved by Board and disclosed.',
        status: 'pending',
        relatedGaps: ['related-party-disclosure'],
      },
    ],
    facts: [
      { id: 'f1', title: 'Company Established', value: '12 March 2015', source: 'CoI', verified: true },
      { id: 'f2', title: 'Registered Jurisdiction', value: 'Tamil Nadu', source: 'CoI', verified: true },
      { id: 'f3', title: 'Business Location', value: 'Bangalore', source: 'Corporate Office', verified: true, conflict: { conflictingValue: 'Chennai', conflictingSource: 'Registered Office' } },
      { id: 'f4', title: 'Company Category', value: 'Private Limited Company', source: 'MoA', verified: true },
      { id: 'f5', title: 'Current Board Strength', value: '7 Directors', source: 'Board Certificate', verified: true },
      { id: 'f6', title: 'Shareholding Pattern', value: 'Promoter 60%, Public 40%', source: 'Shareholding Register', verified: false },
    ],
    disclosures: [
      { id: 'disc1', section: 'History & Background', content: 'Incorporated on 12 March 2015 under Companies Act, 1956. Currently a Private Limited Company engaged in technology consulting and digital transformation services.', source: 'Company Profile', status: 'approved' },
      { id: 'disc2', section: 'Corporate Governance', content: 'Board composition includes 3 Independent Directors. All Board members have professional experience of 15+ years. Company has implemented all mandatory governance requirements.', source: 'Board Resolutions', status: 'approved' },
      { id: 'disc3', section: 'Locations & Offices', content: 'Registered office at 123 Tech Park, Chennai. Corporate office and manufacturing facility at 45 Innovation Drive, Bangalore. Operating offices in 4 metro cities.', source: 'Registered Addresses', status: 'pending-review' },
      { id: 'disc4', section: 'Related Parties', content: 'Related party transactions limited to rent paid to Associate Company for office space: ₹25 lakhs per annum. All transactions approved by Audit Committee.', source: 'RPT Disclosures', status: 'pending-review' },
    ],
  },

  'objects-of-issue': {
    slug: 'objects-of-issue',
    information: [
      { label: 'Proposed Issue Size', value: '₹3.20 Crore', verified: true },
      { label: 'Fresh Issue Portion', value: '₹2.40 Crore', verified: true },
      { label: 'Offer for Sale Portion', value: '₹0.80 Crore', verified: true },
      { label: 'Primary Object 1', value: 'Machinery & Equipment: ₹1.60 Crore', verified: true },
      { label: 'Primary Object 2', value: 'Working Capital: ₹0.80 Crore', verified: true },
      { label: 'Supporting Evidence Gap', value: '₹0.80 Crore (Quotations pending)', verified: false, conflict: 'Only 75% of amount supported by quotations' },
    ],
    documents: [
      { id: 'd1', name: 'Machinery Quotation 1 - CNC Machines', category: 'Capital Expenditure', uploadDate: '2024-01-10', status: 'verified', size: '0.8 MB', crossRef: 'Supplier: Tech Machinery Co.' },
      { id: 'd2', name: 'Machinery Quotation 2 - Testing Equipment', category: 'Capital Expenditure', uploadDate: '2024-01-12', status: 'verified', size: '1.2 MB', crossRef: 'Supplier: Precision Equipment Inc.' },
      { id: 'd3', name: 'Working Capital Assessment', category: 'Finance', uploadDate: '2024-01-15', status: 'verified', size: '0.9 MB' },
      { id: 'd4', name: 'Project Implementation Plan', category: 'Operations', uploadDate: '2024-01-18', status: 'verified', size: '1.5 MB' },
      { id: 'd5', name: 'Supplementary Quotation - Installation', category: 'Capital Expenditure', uploadDate: '2024-01-22', status: 'pending', size: '0.6 MB' },
      { id: 'd6', name: 'Use of Proceeds Timeline', category: 'Finance', uploadDate: '2024-02-01', status: 'flagged', size: '1.1 MB' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'How have the object amounts been determined?',
        answer: 'Determined based on capex requirements identified in 5-year business plan and working capital needs assessed through cash flow projections.',
        status: 'resolved',
      },
      {
        id: 'q2',
        question: 'What is the timeline for capital deployment?',
        answer: 'Machinery to be procured and installed within 18 months. Working capital deployment over 24 months as per operational ramp-up plan.',
        status: 'pending',
        relatedGaps: ['implementation-timeline'],
      },
      {
        id: 'q3',
        question: 'Are all quotations from authorized dealers?',
        answer: 'Yes. All suppliers are authorized dealers and have been verified for authenticity and reliability.',
        status: 'resolved',
      },
    ],
    facts: [
      { id: 'f1', title: 'Total Issue Size', value: '₹3.20 Crore', source: 'Board Resolution', verified: true },
      { id: 'f2', title: 'Fresh Issue Amount', value: '₹2.40 Crore (75%)', source: 'Prospectus', verified: true },
      { id: 'f3', title: 'OFS Amount', value: '₹0.80 Crore (25%)', source: 'Prospectus', verified: true },
      { id: 'f4', title: 'Machinery Quotation Total', value: '₹2.40 Crore', source: 'Supplier Quotations', verified: true, conflict: { conflictingValue: '₹1.60 Crore (Proposed)', conflictingSource: 'Objects Statement' } },
      { id: 'f5', title: 'Evidence Support Level', value: '75% (₹2.40 Cr of ₹3.20 Cr)', source: 'Document Coverage Analysis', verified: false },
      { id: 'f6', title: 'Gap in Evidence', value: '₹0.80 Crore (25%)', source: 'Objects Reconciliation', verified: false },
    ],
    disclosures: [
      { id: 'disc1', section: 'Objects of Issue', content: 'The Company proposes to raise ₹3.20 Crore through this IPO, comprising Fresh Issue of ₹2.40 Crore and Offer for Sale of ₹0.80 Crore. The funds will be utilized for capital expenditure on machinery and equipment, and for meeting working capital requirements.', source: 'Prospectus', status: 'pending-review' },
      { id: 'disc2', section: 'Capital Expenditure', content: 'Fresh issue proceeds of ₹2.40 Crore to be deployed towards purchase and installation of CNC machinery, precision testing equipment, and facility upgrades. All expenditures supported by formal quotations from authorized suppliers.', source: 'Capex Plan', status: 'pending-review' },
      { id: 'disc3', section: 'Working Capital', content: 'OFS amount of ₹0.80 Crore earmarked for working capital requirements including inventory, receivables, and operational expenses for business expansion.', source: 'Finance Plan', status: 'approved' },
    ],
  },

  'financial-performance': {
    slug: 'financial-performance',
    information: [
      { label: 'FY2022 Revenue', value: '₹45.20 Crore', verified: true },
      { label: 'FY2023 Revenue', value: '₹52.80 Crore', verified: true },
      { label: 'FY2024 Revenue', value: '₹61.50 Crore', verified: true },
      { label: 'Revenue CAGR (3-yr)', value: '16.8%', verified: true },
      { label: 'FY2024 Profitability', value: 'EBITDA ₹9.22 Cr, PAT ₹6.15 Cr', verified: true },
      { label: 'FY2024 Key Ratios', value: 'RoE: 18.2%, RoA: 12.5%', verified: false, conflict: 'RoE calculation discrepancy: ₹0.30 Cr difference in PAT' },
      { label: 'Cash Position', value: '₹2.80 Crore (as on 31-Mar-2024)', verified: true },
      { label: 'Debt', value: '₹8.50 Crore (Term Loan)', verified: true },
      { label: 'Audit Status', value: 'Audited by Chartered Accountants', verified: true },
      { label: 'Recent Audit Adjustments', value: 'None. Clean audit opinion for last 3 years', verified: true },
    ],
    documents: [
      { id: 'd1', name: 'Audited Financial Statements FY2024', category: 'Financial', uploadDate: '2024-01-05', status: 'verified', size: '3.2 MB', crossRef: 'CA Firm: ABC & Co.' },
      { id: 'd2', name: 'Audited Financial Statements FY2023', category: 'Financial', uploadDate: '2024-01-05', status: 'verified', size: '3.1 MB' },
      { id: 'd3', name: 'Audited Financial Statements FY2022', category: 'Financial', uploadDate: '2024-01-05', status: 'verified', size: '2.9 MB' },
      { id: 'd4', name: 'Statutory Auditor Report FY2024', category: 'Audit', uploadDate: '2024-01-06', status: 'verified', size: '0.4 MB' },
      { id: 'd5', name: 'Reconciliation - Book to Tax', category: 'Tax', uploadDate: '2024-01-20', status: 'pending', size: '1.1 MB' },
    ],
    questions: [
      {
        id: 'q1',
        question: 'What are the key revenue drivers?',
        answer: 'Revenue driven by Technology Consulting (45%), Digital Transformation (35%), and Support Services (20%). Customer base diversified across 8 sectors.',
        status: 'resolved',
      },
      {
        id: 'q2',
        question: 'How is profitability expected to trend post-IPO?',
        answer: 'Expected margin expansion to 12-13% EBITDA margin by FY2026 due to operational leverage and capex deployment efficiency.',
        status: 'pending',
        relatedGaps: ['projection-basis'],
      },
      {
        id: 'q3',
        question: 'Have there been any one-time items in recent years?',
        answer: 'FY2022 included ₹45 lakhs provision for contingent liability (resolved in FY2023). No other material one-time items.',
        status: 'resolved',
      },
      {
        id: 'q4',
        question: 'Reconciliation between IND AS and Tax financials?',
        answer: 'Primary difference: Depreciation differential (₹30 lakhs) and tax provisions. Full reconciliation schedule prepared and under review.',
        status: 'pending',
        relatedGaps: ['accounting-reconciliation'],
      },
    ],
    facts: [
      { id: 'f1', title: '3-Year Revenue CAGR', value: '16.8%', source: 'Audited Statements', verified: true },
      { id: 'f2', title: 'FY2024 Gross Margin', value: '42.3%', source: 'Income Statement', verified: true },
      { id: 'f3', title: 'FY2024 EBITDA Margin', value: '14.9%', source: 'Financial Analysis', verified: true },
      { id: 'f4', title: 'FY2024 Net Margin', value: '9.93%', source: 'Audited PnL', verified: true },
      { id: 'f5', title: 'Customer Concentration (Top 5)', value: '32% of revenue', source: 'Revenue Segment Analysis', verified: true, conflict: { conflictingValue: '35% (2 months ago)', conflictingSource: 'Previous Submission' } },
      { id: 'f6', title: 'Revenue Per Employee', value: '₹32.10 Lakh', source: 'Headcount & Revenue', verified: false },
    ],
    disclosures: [
      { id: 'disc1', section: 'Financial Overview', content: 'The Company has demonstrated consistent revenue growth of 16.8% CAGR over 3 years, growing from ₹45.20 Crore in FY2022 to ₹61.50 Crore in FY2024. Profitability has improved with PAT growing at 18.2% CAGR, indicating strong operational leverage.', source: 'Audited Financials', status: 'approved' },
      { id: 'disc2', section: 'Revenue Composition', content: 'Revenue streams comprise Technology Consulting (45%), Digital Transformation Services (35%), and Support Services (20%). Customer base spans across 8 sectors with top customer contributing 8.5% of revenue, indicating healthy diversification.', source: 'Segment Analysis', status: 'approved' },
      { id: 'disc3', section: 'Profitability Metrics', content: 'FY2024 EBITDA of ₹9.22 Crore (14.9% margin) and PAT of ₹6.15 Crore (9.93% margin) reflect improving operational efficiency. Return on Equity stands at 18.2% and Return on Assets at 12.5%, demonstrating effective capital deployment.', source: 'Financial Analysis', status: 'pending-review' },
      { id: 'disc4', section: 'Cash Management', content: 'Company maintains cash balance of ₹2.80 Crore as of 31 March 2024. Debt comprises Term Loan of ₹8.50 Crore with remaining tenure of 3 years. Working capital requirements met through combination of internal accruals and short-term facilities.', source: 'Balance Sheet', status: 'pending-review' },
      { id: 'disc5', section: 'Audit Opinion', content: 'Statutory Auditors have issued unqualified audit opinions for the financial statements for FY2022, FY2023, and FY2024. No audit adjustments or qualifications noted in any of the three years.', source: 'Audit Reports', status: 'approved' },
    ],
  },
};

export function getWorkstreamContent(slug: string): WorkstreamContent | undefined {
  return workstreamContentMap[slug];
}
