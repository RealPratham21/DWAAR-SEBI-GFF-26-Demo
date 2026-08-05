'use client';

import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { FormActionRow } from '@/components/company-incorporation/form-primitives';
import { Button } from '@/components/ui/button';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import type { IpoSetupSectionId } from '@/lib/schemas/ipo-setup';

export function IpoSectionSaveActions({ sectionId }: { sectionId: IpoSetupSectionId }) {
  const {
    saveActiveSection,
    discardSectionDraft,
    isSaving,
    saveNotice,
    saveError,
    clearSaveNotice,
    clearSaveError,
    dirtySections,
  } = useIpoSetup();
  const dirty = dirtySections.has(sectionId);

  return (
    <div className="space-y-3">
      {saveNotice ? (
        <SessionSaveNotice message={saveNotice} onDismiss={clearSaveNotice} />
      ) : null}
      {saveError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{saveError}</p>
            <button
              type="button"
              className="text-xs font-medium underline"
              onClick={clearSaveError}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <FormActionRow>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving || !dirty}
          onClick={() => discardSectionDraft(sectionId)}
        >
          Discard changes
        </Button>
        <Button
          type="button"
          disabled={isSaving || !dirty}
          onClick={() => void saveActiveSection(sectionId)}
        >
          {isSaving ? 'Saving…' : 'Keep section updates'}
        </Button>
      </FormActionRow>
    </div>
  );
}
