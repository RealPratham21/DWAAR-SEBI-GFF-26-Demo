export type CopilotSpanStyle = 'plain' | 'bold' | 'muted';

export type CopilotTextSpan = {
  text: string;
  style?: CopilotSpanStyle;
};

export type CopilotHeadingBlock = {
  type: 'heading';
  level?: number;
  text: string;
};

export type CopilotParagraphBlock = {
  type: 'paragraph';
  spans: CopilotTextSpan[];
};

export type CopilotBulletsBlock = {
  type: 'bullets';
  items: string[];
};

export type CopilotCalloutBlock = {
  type: 'callout';
  variant?: 'note' | 'warning';
  text: string;
};

export type CopilotContentBlock =
  | CopilotHeadingBlock
  | CopilotParagraphBlock
  | CopilotBulletsBlock
  | CopilotCalloutBlock;

export type CopilotAnswer = {
  blocks: CopilotContentBlock[];
};

export type CopilotGroundedIn = {
  chapterKey?: string;
  chapterTitle?: string;
  blockId?: string;
};

export type CopilotChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type CopilotChatResponse = {
  answer: CopilotAnswer;
  groundedIn: CopilotGroundedIn;
  model: string;
};

export function copilotAnswerToPlainText(answer: CopilotAnswer): string {
  return answer.blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return block.text;
        case 'paragraph':
          return block.spans.map((span) => span.text).join('');
        case 'bullets':
          return block.items.map((item) => `- ${item}`).join('\n');
        case 'callout':
          return block.text;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

export function parseCopilotBlocks(rawBlocks: Array<Record<string, unknown>>): CopilotContentBlock[] {
  const blocks: CopilotContentBlock[] = [];
  for (const raw of rawBlocks) {
    const type = String(raw.type ?? 'paragraph');
    if (type === 'heading') {
      blocks.push({
        type: 'heading',
        level: typeof raw.level === 'number' ? raw.level : 2,
        text: String(raw.text ?? ''),
      });
      continue;
    }
    if (type === 'paragraph') {
      const spans = Array.isArray(raw.spans) ? raw.spans : [];
      const parsedSpans = spans
        .map((span) => {
          if (!span || typeof span !== 'object') return null;
          const record = span as Record<string, unknown>;
          return {
            text: String(record.text ?? ''),
            style: (record.style as CopilotSpanStyle | undefined) ?? 'plain',
          };
        })
        .filter((span): span is CopilotTextSpan => Boolean(span?.text));
      if (parsedSpans.length === 0 && raw.text) {
        parsedSpans.push({ text: String(raw.text), style: 'plain' });
      }
      if (parsedSpans.length === 0) continue;
      blocks.push({ type: 'paragraph', spans: parsedSpans });
      continue;
    }
    if (type === 'bullets') {
      blocks.push({
        type: 'bullets',
        items: (Array.isArray(raw.items) ? raw.items : []).map((item) => String(item)),
      });
      continue;
    }
    if (type === 'callout') {
      blocks.push({
        type: 'callout',
        variant: raw.variant === 'warning' ? 'warning' : 'note',
        text: String(raw.text ?? ''),
      });
    }
  }
  return blocks;
}
