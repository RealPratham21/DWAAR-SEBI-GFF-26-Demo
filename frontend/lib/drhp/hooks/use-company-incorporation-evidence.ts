'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/lib/api/errors';
import { fetchCompanyIncorporationDocuments } from '@/lib/api/company-incorporation-documents';
import { useCompanyIncorporationOverview } from '@/lib/company-incorporation/hooks/use-company-incorporation-overview';
import { useCompanyIncorporationPipeline } from '@/lib/company-incorporation/hooks/use-company-incorporation-pipeline';
import type { DocumentsListResponse } from '@/lib/company-incorporation/documents/types';

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unable to load Company & Incorporation evidence.';
}

export function useCompanyIncorporationEvidenceSources(options: { enabled: boolean }) {
  const { enabled } = options;
  const overview = useCompanyIncorporationOverview({ enabled });
  const pipeline = useCompanyIncorporationPipeline({ enabled });
  const [documents, setDocuments] = useState<DocumentsListResponse | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    if (!enabled) return null;
    setDocumentsLoading(true);
    try {
      const response = await fetchCompanyIncorporationDocuments();
      setDocuments(response);
      setDocumentsError(null);
      return response;
    } catch (err) {
      setDocumentsError(errorMessage(err));
      return null;
    } finally {
      setDocumentsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refreshDocuments();
  }, [enabled, refreshDocuments]);

  const uploadedDocuments = useMemo(() => {
    if (!documents) return [];
    const items: Array<{
      requirementName: string;
      filename: string;
      status: string;
      versionId: string;
    }> = [];
    for (const group of documents.groups) {
      for (const requirement of group.requirements) {
        for (const doc of requirement.documents) {
          if (!doc.currentVersion) continue;
          items.push({
            requirementName: requirement.name,
            filename: doc.currentVersion.originalFilename,
            status: doc.currentVersion.status,
            versionId: doc.currentVersion.id,
          });
        }
      }
    }
    return items;
  }, [documents]);

  return {
    enabled,
    overview,
    pipeline,
    documents,
    documentsLoading,
    documentsError,
    uploadedDocuments,
    refreshDocuments,
    loading: enabled && (overview.loading || pipeline.loading || documentsLoading),
    error: overview.error || pipeline.error || documentsError,
  };
}
