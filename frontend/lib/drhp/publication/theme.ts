/** Central DRHP publication theme — mirrors backend publication_theme.py for web preview parity. */

export const DRHP_PUBLICATION_THEME = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginLeftMm: 18,
  marginRightMm: 18,
  marginTopMm: 22,
  marginBottomMm: 18,
  bodySizePt: 9.5,
  chapterTitleSizePt: 13,
  sectionHeadingSizePt: 10.5,
  subsectionHeadingSizePt: 9.5,
  tableSizePt: 8.5,
  tableCaptionSizePt: 9,
  tableNoteSizePt: 8,
  legalNoticeSizePt: 8.5,
  headerSizePt: 7,
  lineHeight: 1.18,
  paperBg: '#fffef9',
  canvasBg: '#e8e6e1',
  textColor: '#111111',
  mutedColor: '#333333',
  tableBorder: '#555555',
  tableHeaderBg: '#eeeeee',
} as const;

/** Tailwind/CSS utility classes derived from publication theme tokens. */
export const DRHP_PUBLICATION_CLASSES = {
  page: 'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-[#fffef9] px-[18mm] py-[22mm] shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
  runningHeader: 'text-[7pt] font-normal uppercase tracking-[0.14em] text-neutral-600',
  chapterTitle: 'font-serif text-[13pt] font-bold leading-tight text-neutral-900',
  sectionHeading: 'font-serif text-[10.5pt] font-bold leading-snug text-neutral-900',
  subsectionHeading: 'font-serif text-[9.5pt] font-semibold leading-snug text-neutral-900',
  body: 'font-serif text-[9.5pt] leading-[1.18] text-justify text-neutral-900',
  legalNotice: 'border-t border-neutral-400 pt-2 font-serif text-[8.5pt] italic leading-[1.2] text-neutral-700',
  tableCaption: 'mb-1 font-serif text-[9pt] font-semibold text-neutral-900',
  tableNote: 'mt-1 font-serif text-[8pt] leading-[1.2] text-neutral-600',
  table: 'w-full border-collapse text-[8.5pt] text-neutral-900',
  tableHeaderCell:
    'border border-neutral-500 bg-neutral-200 px-1.5 py-0.5 text-left font-semibold align-top',
  tableCell: 'border border-neutral-500 px-1.5 py-0.5 align-top',
  tableCellNumeric: 'border border-neutral-500 px-1.5 py-0.5 text-right align-top tabular-nums',
  list: 'list-outside space-y-0.5 pl-4 font-serif text-[9.5pt] leading-[1.18] text-neutral-900',
  placeholder: 'font-serif text-[9.5pt] text-neutral-900',
  blockGap: 'space-y-2',
} as const;

export const INTERNAL_HEADING_PATTERNS = ['structured disclosures', 'structured disclosure'];

export function isInternalHeading(text: string): boolean {
  const lowered = text.trim().toLowerCase();
  return !lowered || INTERNAL_HEADING_PATTERNS.some((pattern) => lowered.includes(pattern));
}

export function normalizeHeadingText(text: string): string {
  let cleaned = text.trim();
  for (const suffix of [' — Structured Disclosures', ' - Structured Disclosures']) {
    if (cleaned.endsWith(suffix)) cleaned = cleaned.slice(0, -suffix.length).trim();
  }
  return cleaned;
}

export function shouldSuppressSectionHeading(text: string): boolean {
  const lowered = text.trim().toLowerCase();
  if (!lowered) return true;
  if (isInternalHeading(text)) return true;
  return lowered.includes('structured disclosure');
}

export function headingsAreDuplicate(left: string, right: string): boolean {
  if (!left || !right) return false;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
