import {
  DEFAULT_DRHP_CHAPTER_KEY,
  isDrhpChapterKey,
} from '@/lib/drhp/chapters';
import type { DrhpInspectorTab } from '@/lib/drhp/types';

export function isDrhpInspectorTab(value: string | null | undefined): value is DrhpInspectorTab {
  return value === 'evidence' || value === 'copilot';
}

export function readDrhpChapterKey(
  params: URLSearchParams,
  fallback: string = DEFAULT_DRHP_CHAPTER_KEY,
): string {
  const value = params.get('chapter');
  return isDrhpChapterKey(value) ? (value as string) : fallback;
}

export function readDrhpBlockId(params: URLSearchParams): string | null {
  const value = params.get('blockId');
  return value && value.trim() ? value : null;
}

export function readDrhpInspectorTab(params: URLSearchParams): DrhpInspectorTab {
  const value = params.get('inspector');
  return isDrhpInspectorTab(value) ? value : 'evidence';
}

/** Pure helper for tests and URL writers. */
export function buildDrhpSearchParams(
  current: URLSearchParams,
  patch: {
    chapter?: string | null;
    blockId?: string | null;
    inspector?: DrhpInspectorTab | null;
  },
): URLSearchParams {
  const next = new URLSearchParams(current.toString());

  if (patch.chapter !== undefined) {
    if (patch.chapter && patch.chapter !== DEFAULT_DRHP_CHAPTER_KEY) {
      next.set('chapter', patch.chapter);
    } else if (patch.chapter === DEFAULT_DRHP_CHAPTER_KEY || patch.chapter === null) {
      next.delete('chapter');
    } else {
      next.set('chapter', patch.chapter);
    }
  }

  if (patch.blockId !== undefined) {
    if (patch.blockId) next.set('blockId', patch.blockId);
    else next.delete('blockId');
  }

  if (patch.inspector !== undefined) {
    if (patch.inspector && patch.inspector !== 'evidence') {
      next.set('inspector', patch.inspector);
    } else {
      next.delete('inspector');
    }
  }

  return next;
}
