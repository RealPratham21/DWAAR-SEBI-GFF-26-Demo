'use client';

import { NivaraSampleDataAction } from '@/components/demo-data/nivara-sample-data-action';
import { getNivaraWorkstreamSample } from '@/lib/demo-data/nivara';
import type { NivaraWorkstreamKey } from '@/lib/demo-data/nivara/types';

type NivaraSampleDataPanelProps<T> = {
  workstreamKey: NivaraWorkstreamKey;
  isDirty: boolean;
  disabled?: boolean;
  applySampleDraft: (sample: T) => void;
};

export function NivaraSampleDataPanel<T>({
  workstreamKey,
  isDirty,
  disabled,
  applySampleDraft,
}: NivaraSampleDataPanelProps<T>) {
  return (
    <NivaraSampleDataAction
      workstreamKey={workstreamKey}
      isDirty={isDirty}
      disabled={disabled}
      onApplySample={() => applySampleDraft(getNivaraWorkstreamSample(workstreamKey) as T)}
    />
  );
}
