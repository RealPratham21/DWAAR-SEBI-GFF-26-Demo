import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCompanyIncorporationDocuments } from '@/lib/api/company-incorporation-documents';
import { fetchCompanyIncorporationOverviewSummary } from '@/lib/api/company-incorporation-overview-api';
import { fetchDocumentPipelineSummary } from '@/lib/api/company-incorporation-pipeline-api';

vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '@/lib/api/client';

const mockedApiRequest = vi.mocked(apiRequest);

describe('Company & Incorporation evidence sources for DRHP', () => {
  beforeEach(() => {
    mockedApiRequest.mockReset();
  });

  it('loads real documents, overview and pipeline endpoints', async () => {
    mockedApiRequest.mockResolvedValue({});

    await fetchCompanyIncorporationDocuments();
    await fetchCompanyIncorporationOverviewSummary();
    await fetchDocumentPipelineSummary();

    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      1,
      '/workstreams/company-incorporation/documents',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      2,
      '/workstreams/company-incorporation/overview-summary',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(mockedApiRequest).toHaveBeenNthCalledWith(
      3,
      '/workstreams/company-incorporation/documents/pipeline-summary',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('empty chapter evidence copy stays honest', () => {
    const emptyCopy =
      'This chapter is not connected yet. Source documents and facts will appear here once a workstream adapter is available.';
    expect(emptyCopy).toContain('not connected yet');
    expect(emptyCopy.toLowerCase()).not.toContain('verified');
  });
});
