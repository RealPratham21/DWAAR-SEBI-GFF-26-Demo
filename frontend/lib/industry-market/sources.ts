/**
 * Source Registry helpers for Industry & Market.
 */

import type { IndustryMarketPayload, SourceRecord } from '@/lib/schemas/industry-market';

export function getSources(payload: IndustryMarketPayload): SourceRecord[] {
  return payload.researchSourcesAndIndustryReportGovernance.sources;
}

export function getSourceById(
  payload: IndustryMarketPayload,
  sourceId: string,
): SourceRecord | undefined {
  if (!sourceId.trim()) return undefined;
  return getSources(payload).find((source) => source.id === sourceId);
}

export function formatSourceLabel(source: SourceRecord): string {
  const title = source.title.trim();
  const publisher = source.publisherAuthor.trim();
  const date = source.publicationDate.trim();

  if (title && publisher && date) return `${title} — ${publisher} (${date})`;
  if (title && publisher) return `${title} — ${publisher}`;
  if (title && date) return `${title} (${date})`;
  if (title) return title;
  if (publisher) return publisher;
  return source.id;
}
