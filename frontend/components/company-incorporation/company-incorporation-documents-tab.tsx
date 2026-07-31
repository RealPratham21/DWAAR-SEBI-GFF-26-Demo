'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Archive, Download, History, Loader2, Replace, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentUploadDialog } from '@/components/company-incorporation/document-upload-dialog';
import { DocumentVersionHistoryDialog } from '@/components/company-incorporation/document-version-history-dialog';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  NeutralStatusBadge,
  RequirementLevelBadge,
} from '@/components/company-incorporation/tab-shared';
import {
  DOCUMENT_SERVICE_NOTICE,
  DOCUMENT_UPLOAD_STATUS_LABELS,
} from '@/lib/company-incorporation/document-requirements-config';
import type {
  DocumentRequirementState,
  DocumentRequirementGroupState,
  StoredDocument,
  UploadDialogPhase,
} from '@/lib/company-incorporation/documents/types';
import {
  computeSha256,
  formatFileSize,
  formatUploadedAt,
  validateDocumentFile,
  versionStatusLabel,
} from '@/lib/company-incorporation/documents/utils';
import {
  archiveDocument,
  discardDocumentUpload,
  fetchCompanyIncorporationDocuments,
  fetchDocumentVersionHistory,
  finalizeDocumentUpload,
  initiateDocumentUpload,
  requestDocumentDownloadUrl,
  uploadFileToPresignedUrl,
} from '@/lib/api/company-incorporation-documents';
import { useNotifications } from '@/lib/notifications/context';

interface UploadTarget {
  requirementKey: string;
  documentId?: string;
}

function UploadedDocumentCard({
  document,
  requirement,
  onReplace,
  onArchive,
  onHistory,
  onDownload,
  busy,
}: {
  document: StoredDocument;
  requirement: DocumentRequirementState;
  onReplace: (documentId: string) => void;
  onArchive: (documentId: string) => void;
  onHistory: (documentId: string) => void;
  onDownload: (versionId: string) => void;
  busy: boolean;
}) {
  const version = document.currentVersion;
  if (!version) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground break-all">{version.originalFilename}</span>
        <NeutralStatusBadge label={versionStatusLabel(version.status)} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <dt>Size</dt>
        <dd>{formatFileSize(version.sizeBytes)}</dd>
        <dt>Uploaded</dt>
        <dd>{formatUploadedAt(version.uploadedAt)}</dd>
        <dt>Version</dt>
        <dd>{version.versionNumber}</dd>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onDownload(version.id)}
        >
          <Download size={14} />
          Download
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onReplace(document.id)}
        >
          <Replace size={14} />
          Replace
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onHistory(document.id)}
        >
          <History size={14} />
          Version History
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onArchive(document.id)}
        >
          <Archive size={14} />
          Archive
        </Button>
      </div>
    </div>
  );
}

function DocumentRequirementRow({
  requirement,
  onUpload,
  onReplace,
  onArchive,
  onHistory,
  onDownload,
  busy,
}: {
  requirement: DocumentRequirementState;
  onUpload: (requirementKey: string) => void;
  onReplace: (requirementKey: string, documentId: string) => void;
  onArchive: (documentId: string) => void;
  onHistory: (documentId: string) => void;
  onDownload: (versionId: string) => void;
  busy: boolean;
}) {
  const hasDocuments = requirement.documents.length > 0;
  const canAddAnother = requirement.allowMultiple || !hasDocuments;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-foreground">{requirement.name}</h4>
            <RequirementLevelBadge level={requirement.requirementLevel} />
            {!hasDocuments ? (
              <NeutralStatusBadge label={DOCUMENT_UPLOAD_STATUS_LABELS['not-uploaded']} />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{requirement.explanation}</p>
          {requirement.onboardingHint ? (
            <p className="text-xs text-muted-foreground border-l-2 border-warning pl-3">
              {requirement.onboardingHint.message}
              {requirement.onboardingHint.fileName
                ? ` (${requirement.onboardingHint.fileName}, ${formatFileSize(requirement.onboardingHint.fileSize)})`
                : ''}
            </p>
          ) : null}
        </div>
        {canAddAnother ? (
          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onUpload(requirement.key)}
              className="md:mr-[88px]"
            >
              <Upload size={14} />
              {hasDocuments && requirement.allowMultiple ? 'Add document' : 'Upload'}
            </Button>
          </div>
        ) : null}
      </div>

      {hasDocuments ? (
        <div className="space-y-3">
          {requirement.documents.map((document) => (
            <UploadedDocumentCard
              key={document.id}
              document={document}
              requirement={requirement}
              onReplace={(documentId) => onReplace(requirement.key, documentId)}
              onArchive={onArchive}
              onHistory={onHistory}
              onDownload={onDownload}
              busy={busy}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CompanyIncorporationDocumentsTab() {
  const { prependNotification } = useNotifications();
  const [groups, setGroups] = useState<DocumentRequirementGroupState[]>([]);
  const [storageSummary, setStorageSummary] = useState<string>(DOCUMENT_SERVICE_NOTICE);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<UploadTarget | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingVersionIdRef = useRef<string | null>(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadDialogPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRequirementName, setHistoryRequirementName] = useState('');
  const [historyVersions, setHistoryVersions] = useState<
    import('@/lib/company-incorporation/documents/types').DocumentVersionSummary[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetchCompanyIncorporationDocuments();
      setGroups(response.groups);
      setStorageSummary(response.storageSummary.description);
    } catch {
      setLoadError('Unable to load document requirements.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await refreshDocuments();
      if (!cancelled) {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshDocuments]);

  const resetUploadState = useCallback(() => {
    abortControllerRef.current = null;
    pendingVersionIdRef.current = null;
    uploadTargetRef.current = null;
    setSelectedFile(null);
    setUploadPhase('idle');
    setUploadProgress(0);
    setUploadError(null);
    setUploadDialogOpen(false);
  }, []);

  const discardPendingUpload = useCallback(async (versionId: string | null) => {
    if (!versionId) {
      return;
    }
    try {
      await discardDocumentUpload(versionId);
    } catch {
      // Best-effort cleanup for abandoned uploads.
    }
  }, []);

  const runUpload = useCallback(
    async (file: File, target: UploadTarget) => {
      abortControllerRef.current = new AbortController();
      setUploadError(null);
      setUploadProgress(0);
      setUploadPhase('preparing');

      let versionId: string | null = null;
      try {
        const checksumSha256 = await computeSha256(file);
        const initiate = await initiateDocumentUpload({
          requirementKey: target.requirementKey,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          checksumSha256,
          documentId: target.documentId,
        });
        versionId = initiate.versionId;
        pendingVersionIdRef.current = versionId;

        setUploadPhase('uploading');
        await uploadFileToPresignedUrl(
          file,
          initiate.uploadUrl,
          initiate.requiredHeaders,
          setUploadProgress,
          abortControllerRef.current.signal,
        );

        setUploadPhase('finalizing');
        const finalized = await finalizeDocumentUpload(initiate.versionId);
        pendingVersionIdRef.current = null;
        setUploadPhase('uploaded');
        prependNotification(finalized.notification);
        setSaveNotice(finalized.notification.title);
        await refreshDocuments();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          await discardPendingUpload(versionId);
          resetUploadState();
          return;
        }
        const message =
          error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Upload failed.';
        setUploadPhase('failed');
        setUploadError(message);
        await discardPendingUpload(versionId);
        pendingVersionIdRef.current = null;
      }
    },
    [discardPendingUpload, prependNotification, refreshDocuments, resetUploadState],
  );

  const handleFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      const target = uploadTargetRef.current;
      if (!file || !target) {
        return;
      }

      const validationError = validateDocumentFile(file);
      if (validationError) {
        setSelectedFile(file);
        setUploadDialogOpen(true);
        setUploadPhase('failed');
        setUploadError(validationError);
        return;
      }

      setSelectedFile(file);
      setUploadDialogOpen(true);
      void runUpload(file, target);
    },
    [runUpload],
  );

  const openFilePicker = useCallback((target: UploadTarget) => {
    uploadTargetRef.current = target;
    fileInputRef.current?.click();
  }, []);

  const handleDownload = useCallback(async (versionId: string) => {
    setBusy(true);
    try {
      const response = await requestDocumentDownloadUrl(versionId);
      window.open(response.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setLoadError('Unable to prepare download link.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleArchive = useCallback(
    async (documentId: string) => {
      setBusy(true);
      try {
        const response = await archiveDocument(documentId);
        prependNotification(response.notification);
        setSaveNotice(response.notification.title);
        await refreshDocuments();
      } catch {
        setLoadError('Unable to archive document.');
      } finally {
        setBusy(false);
      }
    },
    [prependNotification, refreshDocuments],
  );

  const handleHistory = useCallback(
    async (documentId: string, requirementName: string) => {
      setHistoryRequirementName(requirementName);
      setHistoryOpen(true);
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const response = await fetchDocumentVersionHistory(documentId);
        setHistoryVersions(response.versions);
      } catch {
        setHistoryError('Unable to load version history.');
        setHistoryVersions([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

  const handleCancelUpload = useCallback(() => {
    if (uploadPhase === 'preparing' || uploadPhase === 'uploading') {
      abortControllerRef.current?.abort();
      return;
    }
    if (uploadPhase === 'failed' && pendingVersionIdRef.current) {
      void discardPendingUpload(pendingVersionIdRef.current);
    }
    resetUploadState();
  }, [discardPendingUpload, resetUploadState, uploadPhase]);

  const handleRetryUpload = useCallback(() => {
    const file = selectedFile;
    const target = uploadTargetRef.current;
    if (!file || !target) {
      return;
    }
    void runUpload(file, target);
  }, [runUpload, selectedFile]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 size={16} className="animate-spin" />
        Loading document requirements…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="sr-only"
        aria-hidden
        onChange={handleFileSelected}
      />

      {saveNotice ? (
        <SessionSaveNotice message={saveNotice} onDismiss={() => setSaveNotice(null)} />
      ) : null}

      {loadError ? (
        <p className="text-sm text-destructive border-l-2 border-destructive pl-3" role="alert">
          {loadError}
        </p>
      ) : null}

      <SectionCard
        title="Document Storage"
        description="Private uploads for Company & Incorporation evidence."
      >
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
          {storageSummary}
        </p>
      </SectionCard>

      {groups.map((group) => (
        <SectionCard key={group.id} title={group.title}>
          <div className="space-y-3">
            {group.requirements.map((requirement) => (
              <DocumentRequirementRow
                key={requirement.key}
                requirement={requirement}
                busy={busy || uploadDialogOpen}
                onUpload={(requirementKey) => openFilePicker({ requirementKey })}
                onReplace={(requirementKey, documentId) =>
                  openFilePicker({ requirementKey, documentId })
                }
                onArchive={handleArchive}
                onHistory={(documentId) => void handleHistory(documentId, requirement.name)}
                onDownload={(versionId) => void handleDownload(versionId)}
              />
            ))}
          </div>
        </SectionCard>
      ))}

      <DocumentUploadDialog
        open={uploadDialogOpen}
        file={selectedFile}
        phase={uploadPhase}
        progress={uploadProgress}
        error={uploadError}
        onCancel={handleCancelUpload}
        onRetry={handleRetryUpload}
      />

      <DocumentVersionHistoryDialog
        open={historyOpen}
        requirementName={historyRequirementName}
        versions={historyVersions}
        isLoading={historyLoading}
        error={historyError}
        onClose={() => setHistoryOpen(false)}
        onDownload={(versionId) => void handleDownload(versionId)}
      />
    </div>
  );
}
