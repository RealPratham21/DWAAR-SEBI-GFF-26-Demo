import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DRHP_CHAPTER_KEY,
  DRHP_CHAPTER_DEFINITIONS,
  buildEmptyDrhpChapters,
  chapterStatusLabel,
  isDrhpChapterKey,
} from '@/lib/drhp/chapters';
import {
  buildDrhpSearchParams,
  readDrhpBlockId,
  readDrhpChapterKey,
  readDrhpInspectorTab,
} from '@/lib/drhp/url-state';
import { mapDrhpDisplayStatus } from '@/lib/api/drhp';
import { SIDEBAR_COLLAPSE_STORAGE_KEY } from '@/lib/layout/sidebar-collapse-context';
import type { DrhpBlock } from '@/lib/drhp/types';

describe('DRHP chapter registry', () => {
  it('includes stable keys for major chapters', () => {
    expect(isDrhpChapterKey('company-history-incorporation')).toBe(true);
    expect(isDrhpChapterKey('risk-factors')).toBe(true);
    expect(isDrhpChapterKey('not-a-chapter')).toBe(false);
    expect(DRHP_CHAPTER_DEFINITIONS.length).toBeGreaterThanOrEqual(15);
  });

  it('builds empty chapters as Not generated without fake sections', () => {
    const chapters = buildEmptyDrhpChapters();
    expect(chapters.every((chapter) => chapter.status === 'not_generated')).toBe(true);
    expect(chapters.every((chapter) => chapter.sections.length === 0)).toBe(true);
    expect(
      chapters.find((chapter) => chapter.key === 'company-history-incorporation')?.workstreamSlug,
    ).toBe('company-incorporation');
  });

  it('labels G1 readiness statuses', () => {
    expect(chapterStatusLabel('not_connected')).toBe('Not connected');
    expect(chapterStatusLabel('ready_with_gaps')).toBe('Ready with gaps');
    expect(chapterStatusLabel('ready_to_generate')).toBe('Ready to generate');
    expect(chapterStatusLabel('blocked')).toBe('Blocked');
  });
});

describe('DRHP display status mapping', () => {
  it('maps API readiness into navigator statuses without inventing drafts', () => {
    expect(
      mapDrhpDisplayStatus({
        supported: false,
        connectionStatus: 'not_connected',
        generationStatus: 'blocked',
      }),
    ).toBe('not_connected');
    expect(
      mapDrhpDisplayStatus({
        supported: true,
        connectionStatus: 'connected',
        generationStatus: 'ready_with_gaps',
      }),
    ).toBe('ready_with_gaps');
    expect(
      mapDrhpDisplayStatus({
        supported: true,
        connectionStatus: 'connected',
        generationStatus: 'blocked',
      }),
    ).toBe('blocked');
  });
});

describe('DRHP URL state helpers', () => {
  it('defaults chapter and inspector when params are absent', () => {
    const params = new URLSearchParams();
    expect(readDrhpChapterKey(params)).toBe(DEFAULT_DRHP_CHAPTER_KEY);
    expect(readDrhpInspectorTab(params)).toBe('evidence');
    expect(readDrhpBlockId(params)).toBeNull();
  });

  it('reads chapter, inspector, and blockId from the query string', () => {
    const params = new URLSearchParams(
      'chapter=company-history-incorporation&inspector=copilot&blockId=block-1',
    );
    expect(readDrhpChapterKey(params)).toBe('company-history-incorporation');
    expect(readDrhpInspectorTab(params)).toBe('copilot');
    expect(readDrhpBlockId(params)).toBe('block-1');
  });

  it('writes and clears chapter/block/inspector params', () => {
    const next = buildDrhpSearchParams(new URLSearchParams('utm=demo'), {
      chapter: 'risk-factors',
      blockId: 'b1',
      inspector: 'copilot',
    });
    expect(next.get('utm')).toBe('demo');
    expect(next.get('chapter')).toBe('risk-factors');
    expect(next.get('blockId')).toBe('b1');
    expect(next.get('inspector')).toBe('copilot');

    const cleared = buildDrhpSearchParams(next, {
      chapter: DEFAULT_DRHP_CHAPTER_KEY,
      blockId: null,
      inspector: 'evidence',
    });
    expect(cleared.get('chapter')).toBeNull();
    expect(cleared.get('blockId')).toBeNull();
    expect(cleared.get('inspector')).toBeNull();
    expect(cleared.get('utm')).toBe('demo');
  });

  it('supports test-only block fixtures without inventing production content', () => {
    const fixture: DrhpBlock = {
      id: 'fixture-block-1',
      kind: 'paragraph',
      status: 'draft',
      order: 1,
      content: { kind: 'paragraph', text: 'Test-only fixture paragraph.' },
      evidenceRefs: [],
      gapRefs: [],
    };
    expect(fixture.id).toBe('fixture-block-1');
    expect(fixture.content.kind).toBe('paragraph');
  });
});

describe('sidebar collapse persistence key', () => {
  it('uses a stable localStorage key', () => {
    expect(SIDEBAR_COLLAPSE_STORAGE_KEY).toBe('dwaar.sidebar.collapsed');
  });
});
