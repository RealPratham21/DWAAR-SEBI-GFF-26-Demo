import type { UserNotification } from '@/lib/notifications/types';

export type DocumentVersionStatus =
  | 'pending_upload'
  | 'uploaded'
  | 'upload_failed'
  | 'pending_processing'
  | 'processing'
  | 'processed'
  | 'processing_failed'
  | 'superseded';

export interface OnboardingSelectionHint {
  fileName: string;
  fileSize: number;
  mimeType: string;
  message: string;
}

export interface DocumentVersionSummary {
  id: string;
  versionNumber: number;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  status: DocumentVersionStatus;
  uploadedAt: string | null;
  isCurrent: boolean;
}

export interface StoredDocument {
  id: string;
  requirementKey: string;
  archivedAt: string | null;
  currentVersion: DocumentVersionSummary | null;
}

export interface DocumentRequirementState {
  key: string;
  name: string;
  requirementLevel: 'mandatory' | 'conditional';
  explanation: string;
  allowMultiple: boolean;
  onboardingHint: OnboardingSelectionHint | null;
  documents: StoredDocument[];
}

export interface DocumentRequirementGroupState {
  id: string;
  title: string;
  requirements: DocumentRequirementState[];
}

export interface StorageSummary {
  connected: boolean;
  private: boolean;
  description: string;
}

export interface DocumentsListResponse {
  groups: DocumentRequirementGroupState[];
  storageSummary: StorageSummary;
}

export interface InitiateUploadResponse {
  documentId: string;
  versionId: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresInSeconds: number;
}

export interface FinalizeUploadResponse {
  document: StoredDocument;
  acknowledgement: { message: string; savedAt: string };
  notification: UserNotification;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  versionNumber: number;
}

export interface VersionHistoryResponse {
  documentId: string;
  requirementKey: string;
  versions: DocumentVersionSummary[];
}

export interface ArchiveDocumentResponse {
  document: StoredDocument;
  acknowledgement: { message: string; savedAt: string };
  notification: UserNotification;
}

export type UploadDialogPhase =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'finalizing'
  | 'uploaded'
  | 'failed';
