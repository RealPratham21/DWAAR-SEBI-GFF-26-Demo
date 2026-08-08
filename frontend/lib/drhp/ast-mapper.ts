/** Map persisted backend DRHP AST JSON to frontend DrhpBlock[]. */

import type { DrhpBlock, DrhpSourceReference } from '@/lib/drhp/types';

type AstBlock = {
  blockId?: string;
  kind?: string;
  order?: number;
  content?: Record<string, unknown>;
  sourceRefIds?: string[];
  evidenceRefIds?: string[];
  supportState?: DrhpBlock['supportState'];
};

type AstSection = {
  sectionKey?: string;
  heading?: string;
  blocks?: AstBlock[];
};

type AstChapter = {
  sections?: AstSection[];
};

export function astChapterToBlocks(
  ast: AstChapter | null | undefined,
  sourceRefsSummary: Array<Record<string, unknown>> = [],
): DrhpBlock[] {
  if (!ast?.sections?.length) return [];

  const refMap = new Map<string, DrhpSourceReference>();
  for (const ref of sourceRefsSummary) {
    const refId = String(ref.refId ?? ref.ref_id ?? '');
    if (!refId) continue;
    refMap.set(refId, {
      refId,
      workstreamKey: String(ref.workstreamKey ?? ref.workstream_key ?? ''),
      sectionKey: String(ref.sectionKey ?? ref.section_key ?? ''),
      recordId: ref.recordId ? String(ref.recordId) : ref.record_id ? String(ref.record_id) : undefined,
      fieldPath: String(ref.fieldPath ?? ref.field_path ?? ''),
      fieldLabel: ref.fieldLabel ? String(ref.fieldLabel) : ref.field_label ? String(ref.field_label) : undefined,
      sourceType: String(ref.sourceType ?? ref.source_type ?? 'structured_user_input'),
      valuePreview: ref.valuePreview ?? ref.value_preview,
      workspaceVersion:
        typeof ref.workspaceVersion === 'number'
          ? ref.workspaceVersion
          : typeof ref.workspace_version === 'number'
            ? ref.workspace_version
            : undefined,
    });
  }

  const blocks: DrhpBlock[] = [];
  let order = 0;
  for (const section of ast.sections) {
    if (section.heading) {
      order += 1;
      blocks.push({
        id: `section-${section.sectionKey ?? order}`,
        kind: 'heading',
        status: 'draft',
        order,
        content: { kind: 'paragraph', text: section.heading },
        evidenceRefs: [],
        gapRefs: [],
        supportState: 'structured_input_backed',
      });
    }
    for (const block of section.blocks ?? []) {
      order += 1;
      const mapped = mapAstBlock(block, order, refMap);
      if (mapped) blocks.push(mapped);
    }
  }
  return blocks;
}

function mapAstBlock(
  block: AstBlock,
  order: number,
  refMap: Map<string, DrhpSourceReference>,
): DrhpBlock | null {
  const id = block.blockId ?? `block-${order}`;
  const sourceRefs = (block.sourceRefIds ?? [])
    .map((refId) => refMap.get(refId))
    .filter((ref): ref is DrhpSourceReference => Boolean(ref));
  const supportState = block.supportState ?? 'structured_input_backed';
  const content = block.content ?? {};
  const kind = block.kind ?? 'paragraph';

  if (kind === 'table' || kind === 'key_value_table') {
    return {
      id,
      kind: 'table',
      status: 'draft',
      order,
      content: {
        kind: 'table',
        caption: content.caption ? String(content.caption) : undefined,
        headers: Array.isArray(content.headers) ? content.headers.map(String) : [],
        rows: Array.isArray(content.rows)
          ? content.rows.map((row) => (Array.isArray(row) ? row.map(String) : []))
          : [],
      },
      evidenceRefs: [],
      gapRefs: [],
      sourceRefs,
      sourceRefIds: block.sourceRefIds,
      supportState,
    };
  }

  if (kind === 'bullet_list' || kind === 'numbered_list' || kind === 'list') {
    return {
      id,
      kind: kind === 'numbered_list' ? 'numbered_list' : 'bullet_list',
      status: 'draft',
      order,
      content: {
        kind: 'list',
        ordered: kind === 'numbered_list',
        items: Array.isArray(content.items) ? content.items.map(String) : [],
      },
      evidenceRefs: [],
      gapRefs: [],
      sourceRefs,
      sourceRefIds: block.sourceRefIds,
      supportState,
    };
  }

  if (kind === 'placeholder') {
    return {
      id,
      kind: 'placeholder',
      status: 'draft',
      order,
      content: {
        kind: 'missing_information',
        marker: {
          id,
          message: String(content.reason ?? content.text ?? 'Information not available'),
        },
      },
      evidenceRefs: [],
      gapRefs: [],
      sourceRefs,
      supportState: 'placeholder',
    };
  }

  if (kind === 'legal_notice' || kind === 'notice') {
    return {
      id,
      kind: 'legal_notice',
      status: 'draft',
      order,
      content: {
        kind: 'notice',
        tone: 'caution',
        text: String(content.text ?? ''),
      },
      evidenceRefs: [],
      gapRefs: [],
      sourceRefs,
      sourceRefIds: block.sourceRefIds,
      supportState,
    };
  }

  if (kind === 'heading') {
    return {
      id,
      kind: 'heading',
      status: 'draft',
      order,
      content: { kind: 'paragraph', text: String(content.text ?? '') },
      evidenceRefs: [],
      gapRefs: [],
      sourceRefs,
      supportState,
    };
  }

  return {
    id,
    kind: 'paragraph',
    status: 'draft',
    order,
    content: { kind: 'paragraph', text: String(content.text ?? '') },
    evidenceRefs: [],
    gapRefs: [],
    sourceRefs,
    sourceRefIds: block.sourceRefIds,
    supportState,
  };
}
