export const WORKSTREAM_SCOPE_CARDS = [
  {
    id: 'legal-identity',
    title: 'Legal Identity',
    description:
      'Current legal name, CIN, incorporation particulars, company classification, and issuer contact details.',
  },
  {
    id: 'corporate-history',
    title: 'Corporate History',
    description:
      'Chronological record of incorporation and subsequent material corporate events affecting the issuer.',
  },
  {
    id: 'offices-contact',
    title: 'Offices & Contact Information',
    description:
      'Registered, corporate, and communication offices together with contact coordinates used in DRHP disclosures.',
  },
  {
    id: 'constitutional-records',
    title: 'Constitutional Records',
    description:
      'Current MoA and AoA position, main objects, amendment history, and alignment with present operations.',
  },
  {
    id: 'core-registrations',
    title: 'Core Registrations',
    description:
      'Fundamental statutory registrations such as PAN, TAN, GSTIN, Udyam, and Import Export Code.',
  },
] as const;

export const DRHP_CONTRIBUTION_SECTIONS = [
  'Front Cover',
  'Definitions',
  'General Information',
  'History and Certain Corporate Matters',
  'Government and Other Approvals',
] as const;

export const READINESS_CHECKLIST_ITEMS = [
  { id: 'legal-identity', label: 'Legal identity completed' },
  { id: 'incorporation-history', label: 'Incorporation history recorded' },
  { id: 'registered-office', label: 'Current registered office established' },
  { id: 'moa-aoa', label: 'Current MoA and AoA available' },
  { id: 'core-registrations', label: 'Core registrations recorded' },
  { id: 'blocking-conflicts', label: 'Blocking conflicts resolved' },
  { id: 'disclosures-generated', label: 'Required disclosures generated' },
  { id: 'professional-review', label: 'Professional review completed' },
] as const;

export const READINESS_NEUTRAL_STATUS = 'Not assessed' as const;

export const READINESS_SECTION_MAP: Record<
  (typeof READINESS_CHECKLIST_ITEMS)[number]['id'],
  string | null
> = {
  'legal-identity': 'legal-identity',
  'incorporation-history': 'corporate-history',
  'registered-office': 'offices-contact',
  'moa-aoa': 'constitutional-documents',
  'core-registrations': 'core-registrations',
  'blocking-conflicts': null,
  'disclosures-generated': null,
  'professional-review': null,
};

export const READINESS_COMPLETE_STATUS = 'Complete' as const;
export const READINESS_IN_PROGRESS_STATUS = 'In progress' as const;
export const READINESS_NOT_STARTED_STATUS = 'Not started' as const;
