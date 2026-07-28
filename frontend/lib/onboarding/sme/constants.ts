export const SME_ONBOARDING_STEPS = [
  { id: 1, title: 'Your Role & Authority', shortTitle: 'Role' },
  { id: 2, title: 'Company Identity', shortTitle: 'Company' },
  { id: 3, title: 'Business Classification & Registrations', shortTitle: 'Business' },
  { id: 4, title: 'Ownership Snapshot', shortTitle: 'Ownership' },
  { id: 5, title: 'IPO Intent', shortTitle: 'IPO Intent' },
  { id: 6, title: 'Initial Documents', shortTitle: 'Documents' },
  { id: 7, title: 'Review & Submit', shortTitle: 'Review' },
] as const;

export const TOTAL_SME_ONBOARDING_STEPS = SME_ONBOARDING_STEPS.length;

export const DESIGNATION_EXAMPLES = [
  'Promoter',
  'Managing Director',
  'Director',
  'Company Secretary',
  'Chief Financial Officer',
  'Authorised Official',
] as const;

export const RELATIONSHIP_OPTIONS = [
  { value: 'promoter', label: 'Promoter' },
  { value: 'director', label: 'Director' },
  { value: 'kmp', label: 'Key Managerial Personnel' },
  { value: 'employee', label: 'Employee' },
  { value: 'professional-adviser', label: 'Professional Adviser' },
  { value: 'authorised-external-representative', label: 'Authorised External Representative' },
  { value: 'other', label: 'Other' },
] as const;

export const AUTHORISED_SIGNATORY_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
] as const;

export const BASIS_OF_AUTHORITY_OPTIONS = [
  { value: 'board-resolution', label: 'Board Resolution' },
  { value: 'power-of-attorney', label: 'Power of Attorney' },
  { value: 'employment-position', label: 'Employment Position' },
  { value: 'constitutional-authority', label: 'Constitutional Authority' },
  { value: 'other', label: 'Other' },
] as const;

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

export const YES_NO_UNSURE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
] as const;

export const COMPANY_CLASS_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
] as const;

export const PRIMARY_INDUSTRY_OPTIONS = [
  { value: 'agriculture-allied', label: 'Agriculture and Allied Activities' },
  { value: 'automotive', label: 'Automotive and Auto Components' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'consumer-products', label: 'Consumer Products' },
  { value: 'electronics-electrical', label: 'Electronics and Electrical Equipment' },
  { value: 'engineering-capital-goods', label: 'Engineering and Capital Goods' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'food-processing', label: 'Food Processing' },
  { value: 'healthcare-pharma', label: 'Healthcare and Pharmaceuticals' },
  { value: 'it-software', label: 'Information Technology and Software' },
  { value: 'infrastructure-construction', label: 'Infrastructure and Construction' },
  { value: 'logistics-transportation', label: 'Logistics and Transportation' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media-entertainment', label: 'Media and Entertainment' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'renewable-energy', label: 'Renewable Energy' },
  { value: 'retail-ecommerce', label: 'Retail and E-commerce' },
  { value: 'textiles-apparel', label: 'Textiles and Apparel' },
  { value: 'other', label: 'Other' },
] as const;

export const GST_REGISTRATION_REQUIRED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
] as const;

export const EMPLOYEE_COUNT_RANGE_OPTIONS = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-100', label: '51–100' },
  { value: '101-250', label: '101–250' },
  { value: '251-500', label: '251–500' },
  { value: '501-1000', label: '501–1,000' },
  { value: '1000-plus', label: 'More than 1,000' },
] as const;

export const PROPOSED_ISSUE_TYPE_OPTIONS = [
  { value: 'fresh-issue', label: 'Fresh Issue' },
  { value: 'offer-for-sale', label: 'Offer for Sale' },
  { value: 'combination', label: 'Combination of Fresh Issue and Offer for Sale' },
  { value: 'not-decided', label: 'Not Decided' },
] as const;

export const TARGET_TIMELINE_OPTIONS = [
  { value: 'within-3-months', label: 'Within 3 months' },
  { value: '3-6-months', label: '3–6 months' },
  { value: '6-12-months', label: '6–12 months' },
  { value: '12-18-months', label: '12–18 months' },
  { value: 'more-than-18-months', label: 'More than 18 months' },
  { value: 'not-decided', label: 'Not Decided' },
] as const;

export const SME_EXCHANGE_OPTIONS = [
  { value: 'nse-emerge', label: 'NSE Emerge' },
  { value: 'bse-sme', label: 'BSE SME' },
  { value: 'not-decided', label: 'Not Decided' },
] as const;

export const ISSUE_PURPOSE_OPTIONS = [
  { value: 'capital-expenditure', label: 'Capital Expenditure' },
  { value: 'working-capital', label: 'Working Capital' },
  { value: 'debt-repayment', label: 'Debt Repayment' },
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'general-corporate-purposes', label: 'General Corporate Purposes' },
  { value: 'offer-for-sale', label: 'Offer for Sale' },
  { value: 'brand-building-marketing', label: 'Brand Building and Marketing' },
  { value: 'technology-investment', label: 'Technology Investment' },
  { value: 'other', label: 'Other' },
  { value: 'not-decided', label: 'Not Decided' },
] as const;

export const MERCHANT_BANKER_APPOINTED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'in-discussion', label: 'In Discussion' },
  { value: 'not-decided', label: 'Not Decided' },
] as const;

export const PREPARATION_STAGE_OPTIONS = [
  { value: 'exploring', label: 'Exploring an SME IPO' },
  { value: 'internal-preparation', label: 'Internal Preparation Started' },
  { value: 'advisers-being-appointed', label: 'Advisers Being Appointed' },
  { value: 'due-diligence-started', label: 'Due Diligence Started' },
  { value: 'drafting-started', label: 'Drafting Started' },
  { value: 'filing-preparation', label: 'Filing Preparation' },
  { value: 'not-sure', label: 'Not Sure' },
] as const;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const INITIAL_DOCUMENT_CHECKLIST = [
  {
    id: 'certificate-of-incorporation',
    name: 'Certificate of Incorporation',
    why: 'Confirms legal incorporation and company registration details.',
    requirementLevel: 'Recommended' as const,
  },
  {
    id: 'current-moa',
    name: 'Current Memorandum of Association',
    why: 'Supports constitutional objects and company class disclosures.',
    requirementLevel: 'Recommended' as const,
  },
  {
    id: 'current-aoa',
    name: 'Current Articles of Association',
    why: 'Supports governance and share capital framework disclosures.',
    requirementLevel: 'Recommended' as const,
  },
  {
    id: 'pan',
    name: 'PAN',
    why: 'Links the issuer to its tax identity for registration records.',
    requirementLevel: 'Recommended' as const,
  },
  {
    id: 'latest-audited-financials',
    name: 'Latest Audited Financial Statements',
    why: 'Provides an initial financial baseline for IPO readiness review.',
    requirementLevel: 'Recommended' as const,
  },
  {
    id: 'representative-authorisation',
    name: 'Representative Authorisation Document',
    why: 'Supports authority of the person providing onboarding information.',
    requirementLevel: 'Conditional' as const,
  },
] as const;

export const SUBMISSION_CONFIRMATION_LABELS = {
  accuracy: 'I confirm that the information provided is accurate to the best of my knowledge.',
  authorised:
    'I confirm that I am authorised to provide information for this company.',
  verification:
    'I understand that the information and documents will require documentary and professional verification.',
  terms: 'I agree to Dwaar’s Terms of Service and Privacy Policy.',
} as const;
