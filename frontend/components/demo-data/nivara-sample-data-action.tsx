'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isNivaraSampleDataEnabled,
  NIVARA_SAMPLE_CONFIRM_MESSAGE,
} from '@/lib/demo-data/config';
import type { NivaraWorkstreamKey } from '@/lib/demo-data/nivara/types';

type NivaraSampleDataActionProps = {
  workstreamKey: NivaraWorkstreamKey;
  isDirty: boolean;
  onApplySample: () => void;
  disabled?: boolean;
};

export function NivaraSampleDataAction({
  workstreamKey,
  isDirty,
  onApplySample,
  disabled = false,
}: NivaraSampleDataActionProps) {
  if (!isNivaraSampleDataEnabled()) return null;

  const handleClick = () => {
    if (isDirty && !window.confirm(NIVARA_SAMPLE_CONFIRM_MESSAGE)) return;
    onApplySample();
  };

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Info
            size={16}
            className="mt-0.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Nivara demo data</p>
            <p className="text-xs text-muted-foreground">
              Populate this workstream with realistic Nivara demo values.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleClick}
          aria-label={`Use Nivara sample data for ${workstreamKey}`}
        >
          Use Nivara sample data
        </Button>
      </div>
    </div>
  );
}
