import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataRoomWorkspace } from '@/components/data-room/data-room-workspace';
import * as api from '@/lib/api/data-room';

vi.mock('@/lib/api/data-room');
vi.mock('@/lib/api/company-incorporation-documents');

const mockSummary = {
  totalDocuments: 2,
  currentVersions: 2,
  documentBackedDocuments: 1,
  storedOnlyDocuments: 1,
  applicableRequirements: 45,
  providedRequirements: 3,
  missingRequirements: 40,
  reviewApplicabilityRequirements: 2,
  documentsUsedInDrhp: 1,
  documentsWithIssues: 0,
};

const mockDocument = {
  globalDocumentId: 'gci:abc',
  originType: 'company_incorporation',
  title: 'Certificate of Incorporation',
  filename: 'coi.pdf',
  category: 'Incorporation Documents',
  mimeType: 'application/pdf',
  fileSize: 120000,
  workstreamKey: 'company-incorporation',
  workstreamLabel: 'Company & Incorporation',
  sectionKey: 'documents',
  sectionLabel: 'Documents',
  requirementKey: 'company-incorporation:original-certificate-of-incorporation',
  currentVersion: 1,
  status: 'processed',
  statusLabel: 'Processed',
  processingCapability: 'document_extraction',
  processingCapabilityLabel: 'Document extraction + evidence linkage',
  uploadedAt: '2026-08-09T00:00:00Z',
  updatedAt: '2026-08-09T00:00:00Z',
  factCount: 3,
  evidenceCount: 2,
  issueCount: 0,
  drhpUsageCount: 1,
  openUrl: '/projects/demo/workstreams/company-incorporation?tab=documents',
  openWorkstreamUrl: '/projects/demo/workstreams/company-incorporation?tab=documents',
  openFactsUrl: '/projects/demo/facts?workstream=company-incorporation',
  versions: [
    {
      versionNumber: 1,
      originalFilename: 'coi.pdf',
      contentType: 'application/pdf',
      sizeBytes: 120000,
      status: 'processed',
      uploadedAt: '2026-08-09T00:00:00Z',
      isCurrent: true,
      note: '',
    },
  ],
  relatedIssues: [],
  drhpUsage: [],
  inspection: null,
  metadata: {},
};

const mockRequirement = {
  requirementKey: 'financials-kpis:audited-financial-statements',
  workstreamKey: 'financials-kpis',
  workstreamLabel: 'Financials & KPIs',
  category: 'Financial Statements',
  title: 'Audited Financial Statements',
  purpose: 'Supporting material for disclosed financials',
  expectedStage: 'Information',
  applicability: 'applicable',
  status: 'not_provided',
  statusLabel: 'Not provided',
  matchedDocumentIds: [],
  linkedIssueIds: [],
  professionalConfirmationRequired: false,
  evidencePipelineCapability: 'stored_only',
  openWorkstreamUrl: '/projects/demo/workstreams/financials-kpis?tab=information',
  openUpload: true,
};

describe('DataRoomWorkspace', () => {
  beforeEach(() => {
    vi.mocked(api.fetchDataRoomSummary).mockResolvedValue(mockSummary);
    vi.mocked(api.fetchDataRoomDocuments).mockResolvedValue({
      total: 1,
      page: 1,
      pageSize: 200,
      documents: [mockDocument],
    });
    vi.mocked(api.fetchDataRoomRequirements).mockResolvedValue({
      total: 2,
      requirements: [mockRequirement],
    });
  });

  it('renders summary cards and document table', async () => {
    render(<DataRoomWorkspace />);
    expect(await screen.findByRole('heading', { name: 'Data Room' })).toBeInTheDocument();
    expect(await screen.findByText('Certificate of Incorporation')).toBeInTheDocument();
    expect(screen.getByText('Uploaded documents')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens document detail drawer', async () => {
    render(<DataRoomWorkspace />);
    await screen.findByText('Certificate of Incorporation');
    fireEvent.click(screen.getByRole('button', { name: /View/i }));
    expect(await screen.findByText('Document extraction + evidence linkage')).toBeInTheDocument();
  });

  it('shows missing requirements tab', async () => {
    render(<DataRoomWorkspace />);
    await screen.findByText('Certificate of Incorporation');
    fireEvent.click(screen.getByRole('button', { name: 'Requested / missing' }));
    await waitFor(() => {
      expect(api.fetchDataRoomRequirements).toHaveBeenCalled();
    });
  });
});
