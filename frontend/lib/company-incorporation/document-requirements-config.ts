export type RequirementLevel = 'mandatory' | 'conditional';

export type DocumentUploadStatus = 'not-uploaded';

export interface DocumentRequirement {
  id: string;
  name: string;
  requirementLevel: RequirementLevel;
  explanation: string;
}

export interface DocumentRequirementGroup {
  id: string;
  title: string;
  documents: DocumentRequirement[];
}

export const REQUIREMENT_LEVEL_LABELS: Record<RequirementLevel, string> = {
  mandatory: 'Mandatory',
  conditional: 'Conditional',
};

export const DOCUMENT_UPLOAD_STATUS_LABELS: Record<DocumentUploadStatus, string> = {
  'not-uploaded': 'Not Uploaded',
};

export const DOCUMENT_REQUIREMENT_GROUPS: DocumentRequirementGroup[] = [
  {
    id: 'incorporation-documents',
    title: 'Incorporation Documents',
    documents: [
      {
        id: 'original-certificate-of-incorporation',
        name: 'Original Certificate of Incorporation',
        requirementLevel: 'mandatory',
        explanation: 'Certificate issued on original incorporation of the company.',
      },
      {
        id: 'fresh-certificate-after-name-change',
        name: 'Fresh Certificate of Incorporation after name change',
        requirementLevel: 'conditional',
        explanation: 'Required where the company name has changed since incorporation.',
      },
      {
        id: 'public-company-conversion-certificate',
        name: 'Public-company conversion certificate',
        requirementLevel: 'conditional',
        explanation: 'Required where the company converted from private to public status.',
      },
      {
        id: 'commencement-of-business-evidence',
        name: 'Commencement of business evidence, where applicable',
        requirementLevel: 'conditional',
        explanation: 'Evidence of commencement of business where required under applicable law.',
      },
    ],
  },
  {
    id: 'constitutional-documents',
    title: 'Constitutional Documents',
    documents: [
      {
        id: 'current-certified-moa',
        name: 'Current certified Memorandum of Association',
        requirementLevel: 'mandatory',
        explanation: 'Latest certified copy of the MoA in force.',
      },
      {
        id: 'current-certified-aoa',
        name: 'Current certified Articles of Association',
        requirementLevel: 'mandatory',
        explanation: 'Latest certified copy of the AoA in force.',
      },
      {
        id: 'moa-amendment-resolutions-filings',
        name: 'MoA amendment resolutions and filings',
        requirementLevel: 'conditional',
        explanation: 'Supporting records for each material MoA amendment.',
      },
      {
        id: 'aoa-amendment-resolutions-filings',
        name: 'AoA amendment resolutions and filings',
        requirementLevel: 'conditional',
        explanation: 'Supporting records for each material AoA amendment.',
      },
    ],
  },
  {
    id: 'registered-office-documents',
    title: 'Registered Office Documents',
    documents: [
      {
        id: 'current-registered-office-filing',
        name: 'Current registered-office filing',
        requirementLevel: 'mandatory',
        explanation: 'Filing evidencing the current registered office of the company.',
      },
      {
        id: 'filing-acknowledgement-or-srn',
        name: 'Filing acknowledgement or SRN',
        requirementLevel: 'mandatory',
        explanation: 'Acknowledgement or service request number for the registered-office filing.',
      },
      {
        id: 'registered-office-address-proof',
        name: 'Registered-office address proof',
        requirementLevel: 'mandatory',
        explanation: 'Documentary proof of the registered-office address.',
      },
      {
        id: 'board-resolution-office-change',
        name: 'Board resolution for office change',
        requirementLevel: 'conditional',
        explanation: 'Required where the registered office has changed.',
      },
      {
        id: 'roc-or-rd-approval',
        name: 'RoC or Regional Director approval, where applicable',
        requirementLevel: 'conditional',
        explanation: 'Required where inter-state or other approval is needed for office change.',
      },
    ],
  },
  {
    id: 'corporate-event-documents',
    title: 'Corporate Event Documents',
    documents: [
      {
        id: 'board-resolutions',
        name: 'Board resolutions',
        requirementLevel: 'conditional',
        explanation: 'Board resolutions supporting recorded corporate events.',
      },
      {
        id: 'shareholder-resolutions',
        name: 'Shareholder resolutions',
        requirementLevel: 'conditional',
        explanation: 'Shareholder resolutions supporting recorded corporate events.',
      },
      {
        id: 'mgt-14-or-equivalent',
        name: 'MGT-14 or equivalent filings',
        requirementLevel: 'conditional',
        explanation: 'Statutory filings for resolutions requiring RoC intimation.',
      },
      {
        id: 'merger-demerger-nclt-orders',
        name: 'Merger, demerger, or NCLT orders',
        requirementLevel: 'conditional',
        explanation: 'Court or tribunal orders for restructuring events.',
      },
      {
        id: 'business-transfer-succession',
        name: 'Business transfer or succession documents',
        requirementLevel: 'conditional',
        explanation: 'Documents evidencing acquisition, transfer, or succession of undertaking.',
      },
    ],
  },
  {
    id: 'core-registration-documents',
    title: 'Core Registration Documents',
    documents: [
      {
        id: 'pan-certificate',
        name: 'PAN',
        requirementLevel: 'mandatory',
        explanation: 'Permanent Account Number allotment or registration evidence.',
      },
      {
        id: 'tan-certificate',
        name: 'TAN',
        requirementLevel: 'conditional',
        explanation: 'Tax Deduction Account Number evidence, where applicable.',
      },
      {
        id: 'gst-registration-certificates',
        name: 'GST registration certificates',
        requirementLevel: 'conditional',
        explanation: 'GST registration certificates for active registrations.',
      },
      {
        id: 'udyam-registration-certificate',
        name: 'Udyam registration certificate',
        requirementLevel: 'conditional',
        explanation: 'Udyam registration evidence, where applicable.',
      },
      {
        id: 'import-export-code',
        name: 'Import Export Code',
        requirementLevel: 'conditional',
        explanation: 'IEC evidence for companies engaged in import or export.',
      },
      {
        id: 'registration-amendment-evidence',
        name: 'Registration amendment evidence',
        requirementLevel: 'conditional',
        explanation: 'Amendment or update evidence following name or office changes.',
      },
    ],
  },
];

export const DOCUMENT_SERVICE_NOTICE =
  'Document storage, versioning, extraction, and verification will become available after the document service is connected.';

export const DOCUMENT_SELECTION_NOTICE =
  'Selected files are not permanently stored until the document service is connected.';
