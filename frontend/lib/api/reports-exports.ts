import { getApiBaseUrl } from '@/lib/api/config';
import { apiRequest, getAccessToken } from '@/lib/api/client';
import { downloadDrhpExport } from '@/lib/api/drhp';

export type ReportCard = {
  cardId: string;
  title: string;
  description: string;
  formatLabel: string;
  statusLabel: string;
  detailLabel: string;
  available: boolean;
  disabledReason: string;
  downloadKind: string;
  progressRatio: number | null;
  progressCaption: string;
};

export type ReportsExportSummary = {
  issuer: string;
  generatedAt: string;
  workstreams: {
    complete: number;
    inProgress: number;
    notStarted: number;
    total: number;
  };
  drhpDocx: {
    available: boolean;
    versionNumber: number | null;
    versionId: string | null;
    statusLabel: string;
    generatedAt: string | null;
    stale: boolean;
    affectedChapterCount: number;
    openDrhpUrl: string;
  };
  drhpPdf: ReportsExportSummary['drhpDocx'];
  cards: ReportCard[];
  nextActions: string[];
};

const BASE = '/reports-exports';

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

async function downloadBinary(path: string, fallbackName: string): Promise<void> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, { method: 'GET', headers, credentials: 'include' });
  if (!response.ok) {
    let message = 'Unable to download export.';
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(response.headers.get('Content-Disposition')) ?? fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function fetchReportsExportSummary(): Promise<ReportsExportSummary> {
  return apiRequest<ReportsExportSummary>(`${BASE}/summary`, { method: 'GET' });
}

export async function downloadReportExport(kind: string, versionId?: string | null): Promise<void> {
  switch (kind) {
    case 'drhp-docx':
      if (!versionId) throw new Error('Generate a DRHP draft first.');
      await downloadDrhpExport(versionId, 'docx');
      return;
    case 'drhp-pdf':
      if (!versionId) throw new Error('Generate a DRHP draft first.');
      await downloadDrhpExport(versionId, 'pdf');
      return;
    case 'readiness-pdf':
      await downloadBinary(`${BASE}/readiness-report/pdf`, 'IPO_Readiness_Report.pdf');
      return;
    case 'issues-xlsx':
      await downloadBinary(`${BASE}/issues/xlsx`, 'Issues_Gaps.xlsx');
      return;
    case 'issues-csv':
      await downloadBinary(`${BASE}/issues/csv`, 'Issues_Gaps.csv');
      return;
    case 'facts-evidence-xlsx':
      await downloadBinary(`${BASE}/facts-evidence/xlsx`, 'Facts_Evidence.xlsx');
      return;
    case 'data-room-xlsx':
      await downloadBinary(`${BASE}/data-room/xlsx`, 'Data_Room_Index.xlsx');
      return;
    case 'preparation-workbook-xlsx':
      await downloadBinary(`${BASE}/preparation-workbook/xlsx`, 'IPO_Preparation_Workbook.xlsx');
      return;
    default:
      throw new Error('Unknown export type.');
  }
}

export function formatGeneratedAt(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function downloadButtonLabel(kind: string): string {
  if (kind === 'drhp-docx') return 'Download DOCX';
  if (kind === 'drhp-pdf' || kind === 'readiness-pdf') return 'Download PDF';
  if (kind === 'issues-csv') return 'Download CSV';
  return 'Download XLSX';
}
