import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FactsEvidenceWorkspace } from '@/components/facts-evidence/facts-evidence-workspace';
import * as api from '@/lib/api/facts-evidence';

vi.mock('@/lib/api/facts-evidence');

const mockFact = {
  factId: 'fact-1',
  fingerprint: 'fact-1',
  label: 'FY2024 Revenue from operations — FY2024',
  displayValue: '₹6,300 lakh',
  semanticType: 'money_lakh',
  canonicalWorkstreamKey: 'financials-kpis',
  canonicalWorkstreamLabel: 'Financials & KPIs',
  sectionKey: 'restated-statement-of-profit-and-loss',
  sectionLabel: 'Restated Statement of Profit and Loss',
  recordId: '',
  recordLabel: '',
  supportType: 'structured_issuer_input',
  supportState: 'supported_by_structured_input',
  supportTypeLabel: 'Structured issuer input',
  supportStateLabel: 'Supported by structured input',
  drhpUsageCount: 2,
  relatedIssueCount: 0,
  openSourceUrl: '/projects/demo/workstreams/financials-kpis?tab=information',
  reportingPeriod: 'FY2024',
  professionalConfirmationRequired: false,
  evidenceRefs: [],
  calculatedFrom: [],
  calculationExpression: '',
  drhpUsage: [
    {
      documentVersionNumber: 1,
      chapterKey: 'financial-information-mda',
      chapterLabel: 'Financial Information & MD&A',
      sectionHeading: 'Restated Statement of Profit and Loss',
      blockId: 'block-1',
      draftValuePreview: '₹6,300 lakh',
      openUrl: '/projects/demo/drhp?chapter=financial-information-mda&blockId=block-1',
    },
  ],
  relatedIssues: [],
  metadata: {},
};

describe('FactsEvidenceWorkspace', () => {
  beforeEach(() => {
    vi.mocked(api.fetchGlobalFacts).mockResolvedValue({ total: 1, page: 1, pageSize: 100, facts: [mockFact] });
    vi.mocked(api.fetchGlobalFactsSummary).mockResolvedValue({
      canonicalFacts: 1,
      documentBacked: 0,
      structuredInput: 1,
      calculated: 0,
      professionalConfirmation: 0,
      usedInDrhp: 1,
      withIssues: 0,
    });
    vi.mocked(api.fetchGlobalEvidence).mockResolvedValue({ total: 0, evidence: [] });
    vi.mocked(api.fetchGlobalEvidenceSummary).mockResolvedValue({
      documents: 0,
      documentVersions: 0,
      evidenceItems: 0,
      evidenceBackedFacts: 0,
    });
  });

  it('renders facts tab with summary and list', async () => {
    render(<FactsEvidenceWorkspace />);
    expect(await screen.findByRole('heading', { name: 'Facts & Evidence' })).toBeInTheDocument();
    expect(await screen.findByText('FY2024 Revenue from operations — FY2024')).toBeInTheDocument();
    expect(screen.getByText('Structured issuer input')).toBeInTheDocument();
  });

  it('opens fact detail drawer', async () => {
    render(<FactsEvidenceWorkspace />);
    await screen.findByText('FY2024 Revenue from operations — FY2024');
    fireEvent.click(screen.getByRole('button', { name: /Inspect/i }));
    expect(screen.getAllByText('Used in DRHP').length).toBeGreaterThan(0);
    expect(screen.getByText(/Documentary evidence is not connected/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Draft v1/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open source/i })).toBeInTheDocument();
  });

  it('filters by support type', async () => {
    render(<FactsEvidenceWorkspace />);
    await screen.findByText('FY2024 Revenue from operations — FY2024');
    fireEvent.change(screen.getByLabelText('Support filter'), {
      target: { value: 'structured_issuer_input' },
    });
    await waitFor(() => {
      expect(api.fetchGlobalFacts).toHaveBeenCalledWith(
        expect.objectContaining({ supportType: 'structured_issuer_input' }),
      );
    });
  });

  it('shows evidence empty state', async () => {
    render(<FactsEvidenceWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Evidence' }));
    expect(await screen.findByText('No documentary evidence is currently connected.')).toBeInTheDocument();
  });
});
