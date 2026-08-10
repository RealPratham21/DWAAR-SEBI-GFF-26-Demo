import { apiRequest } from '@/lib/api/client';
import type { CopilotChatMessage, CopilotChatResponse } from '@/lib/drhp/copilot-types';
import { parseCopilotBlocks } from '@/lib/drhp/copilot-types';

const BASE = '/drhp/copilot';

export type CopilotChatRequest = {
  message: string;
  history?: CopilotChatMessage[];
  documentVersionId?: string | null;
  chapterKey?: string | null;
  blockId?: string | null;
  route?: string;
};

export async function sendCopilotChat(body: CopilotChatRequest): Promise<CopilotChatResponse> {
  const response = await apiRequest<{
    answer: { blocks: Array<Record<string, unknown>> };
    groundedIn: CopilotChatResponse['groundedIn'];
    model: string;
  }>(`${BASE}/chat`, {
    method: 'POST',
    body: {
      message: body.message,
      history: body.history ?? [],
      documentVersionId: body.documentVersionId ?? undefined,
      chapterKey: body.chapterKey ?? undefined,
      blockId: body.blockId ?? undefined,
      route: body.route ?? '/projects/demo/drhp',
    },
  });

  return {
    answer: { blocks: parseCopilotBlocks(response.answer?.blocks ?? []) },
    groundedIn: response.groundedIn ?? {},
    model: response.model ?? '',
  };
}
