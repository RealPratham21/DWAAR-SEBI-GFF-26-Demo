import { apiRequest } from '@/lib/api/client';
import type {
  ArchiveDocumentResponse,
  DocumentsListResponse,
  DownloadUrlResponse,
  FinalizeUploadResponse,
  InitiateUploadResponse,
  VersionHistoryResponse,
} from '@/lib/company-incorporation/documents/types';

const BASE = '/workstreams/company-incorporation/documents';

export async function fetchCompanyIncorporationDocuments(): Promise<DocumentsListResponse> {
  return apiRequest<DocumentsListResponse>(BASE, { method: 'GET' });
}

export async function initiateDocumentUpload(body: {
  requirementKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  documentId?: string;
}): Promise<InitiateUploadResponse> {
  return apiRequest<InitiateUploadResponse>(`${BASE}/uploads/initiate`, {
    method: 'POST',
    body,
  });
}

export async function finalizeDocumentUpload(versionId: string): Promise<FinalizeUploadResponse> {
  return apiRequest<FinalizeUploadResponse>(`${BASE}/versions/${versionId}/finalize`, {
    method: 'POST',
  });
}

export async function requestDocumentDownloadUrl(versionId: string): Promise<DownloadUrlResponse> {
  return apiRequest<DownloadUrlResponse>(`${BASE}/versions/${versionId}/download-url`, {
    method: 'POST',
  });
}

export async function fetchDocumentVersionHistory(documentId: string): Promise<VersionHistoryResponse> {
  return apiRequest<VersionHistoryResponse>(`${BASE}/${documentId}/versions`, {
    method: 'GET',
  });
}

export async function archiveDocument(documentId: string): Promise<ArchiveDocumentResponse> {
  return apiRequest<ArchiveDocumentResponse>(`${BASE}/${documentId}/archive`, {
    method: 'POST',
  });
}

export async function discardDocumentUpload(versionId: string): Promise<{ discarded: boolean }> {
  return apiRequest<{ discarded: boolean }>(`${BASE}/versions/${versionId}`, {
    method: 'DELETE',
  });
}

export function uploadFileToPresignedUrl(
  file: File,
  uploadUrl: string,
  requiredHeaders: Record<string, string>,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    Object.entries(requiredHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}.`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled.', 'AbortError'));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          xhr.abort();
        },
        { once: true },
      );
    }

    xhr.send(file);
  });
}
