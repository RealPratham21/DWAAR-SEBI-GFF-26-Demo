import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '@/lib/company-incorporation/document-requirements-config';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export function validateDocumentFile(file: File): string | null {
  const extension = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    : '';

  if (
    !ALLOWED_DOCUMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number],
    ) &&
    !ALLOWED_EXTENSIONS.includes(extension)
  ) {
    return 'Only PDF, PNG, and JPEG files are allowed.';
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return 'Files must be 20 MB or smaller.';
  }

  if (file.size <= 0) {
    return 'The selected file is empty.';
  }

  return null;
}

export async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadedAt(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function versionStatusLabel(status: string): string {
  switch (status) {
    case 'uploaded':
      return 'Uploaded';
    case 'pending_upload':
      return 'Pending upload';
    case 'upload_failed':
      return 'Upload failed';
    case 'superseded':
      return 'Superseded';
    case 'pending_processing':
      return 'Pending processing';
    case 'processing':
      return 'Processing';
    case 'processed':
      return 'Processed';
    case 'processing_failed':
      return 'Processing failed';
    default:
      return status;
  }
}
