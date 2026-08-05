'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_DRHP_CHAPTER_KEY, isDrhpChapterKey } from '@/lib/drhp/chapters';
import {
  buildDrhpSearchParams,
  isDrhpInspectorTab,
  readDrhpBlockId,
  readDrhpChapterKey,
  readDrhpInspectorTab,
} from '@/lib/drhp/url-state';
import type { DrhpInspectorTab } from '@/lib/drhp/types';

export interface DrhpUrlState {
  chapterKey: string;
  blockId: string | null;
  inspectorTab: DrhpInspectorTab;
  setChapterKey: (key: string) => void;
  setBlockId: (blockId: string | null) => void;
  setInspectorTab: (tab: DrhpInspectorTab) => void;
}

export function useDrhpUrlState(initial?: {
  chapter?: string;
  blockId?: string;
  inspector?: string;
}): DrhpUrlState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipNextSyncRef = useRef(false);

  const [chapterKey, setChapterKeyState] = useState(() => {
    if (isDrhpChapterKey(initial?.chapter)) return initial!.chapter!;
    return readDrhpChapterKey(searchParams);
  });
  const [blockId, setBlockIdState] = useState<string | null>(
    () => initial?.blockId ?? readDrhpBlockId(searchParams),
  );
  const [inspectorTab, setInspectorTabState] = useState<DrhpInspectorTab>(() => {
    if (isDrhpInspectorTab(initial?.inspector)) return initial!.inspector!;
    return readDrhpInspectorTab(searchParams);
  });

  const writeUrl = useCallback(
    (patch: {
      chapter?: string | null;
      blockId?: string | null;
      inspector?: DrhpInspectorTab | null;
    }) => {
      const next = buildDrhpSearchParams(searchParams, {
        chapter: patch.chapter !== undefined ? patch.chapter : chapterKey,
        blockId: patch.blockId !== undefined ? patch.blockId : blockId,
        inspector: patch.inspector !== undefined ? patch.inspector : inspectorTab,
      });
      // When chapter changes and block not explicitly set, clear block selection.
      if (patch.chapter !== undefined && patch.blockId === undefined) {
        next.delete('blockId');
      }
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      skipNextSyncRef.current = true;
      router.replace(href, { scroll: false });
    },
    [blockId, chapterKey, inspectorTab, pathname, router, searchParams],
  );

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    setChapterKeyState(readDrhpChapterKey(searchParams));
    setBlockIdState(readDrhpBlockId(searchParams));
    setInspectorTabState(readDrhpInspectorTab(searchParams));
  }, [searchParams]);

  const setChapterKey = useCallback(
    (key: string) => {
      const nextKey = isDrhpChapterKey(key) ? key : DEFAULT_DRHP_CHAPTER_KEY;
      setChapterKeyState(nextKey);
      setBlockIdState(null);
      writeUrl({ chapter: nextKey, blockId: null });
    },
    [writeUrl],
  );

  const setBlockId = useCallback(
    (id: string | null) => {
      setBlockIdState(id);
      writeUrl({ blockId: id });
    },
    [writeUrl],
  );

  const setInspectorTab = useCallback(
    (tab: DrhpInspectorTab) => {
      setInspectorTabState(tab);
      writeUrl({ inspector: tab });
    },
    [writeUrl],
  );

  return useMemo(
    () => ({
      chapterKey,
      blockId,
      inspectorTab,
      setChapterKey,
      setBlockId,
      setInspectorTab,
    }),
    [blockId, chapterKey, inspectorTab, setBlockId, setChapterKey, setInspectorTab],
  );
}
