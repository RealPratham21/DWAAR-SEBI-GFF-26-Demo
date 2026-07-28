export type DisclosureBlockStatus = 'not-ready';

export interface DisclosureBlock {
  id: string;
  name: string;
  targetSection: string;
  status: DisclosureBlockStatus;
  message: string;
}

export const DISCLOSURE_BLOCK_STATUS_LABELS: Record<DisclosureBlockStatus, string> = {
  'not-ready': 'Not Ready',
};

export const DISCLOSURE_ACTION_DISABLED_REASON =
  'Verified information and supporting evidence are required before this action becomes available.';

export const DISCLOSURE_BLOCKS: DisclosureBlock[] = [
  {
    id: 'front-cover-issuer-identity',
    name: 'Front Cover — Issuer Identity',
    targetSection: 'Front Cover',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'front-cover-office-contact',
    name: 'Front Cover — Office and Contact',
    targetSection: 'Front Cover',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'definitions',
    name: 'Definitions',
    targetSection: 'Definitions and Abbreviations',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'general-information',
    name: 'General Information',
    targetSection: 'General Information',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'brief-history',
    name: 'Brief History of the Company',
    targetSection: 'History and Certain Corporate Matters',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'registered-office-changes',
    name: 'Changes in Registered Office',
    targetSection: 'History and Certain Corporate Matters',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'moa-aoa-amendments',
    name: 'MoA and AoA Amendments',
    targetSection: 'History and Certain Corporate Matters',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'main-objects',
    name: 'Main Objects',
    targetSection: 'History and Certain Corporate Matters',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
  {
    id: 'core-registration-summary',
    name: 'Core Registration Summary',
    targetSection: 'Government and Other Approvals',
    status: 'not-ready',
    message: 'Verified information and supporting evidence are required before generation.',
  },
];
