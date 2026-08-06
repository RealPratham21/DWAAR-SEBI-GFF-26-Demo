'use client';

import { FormActionRow } from '@/components/company-incorporation/form-primitives';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { SessionNotice } from '@/components/business-operations/form-helpers';
import { Button } from '@/components/ui/button';
import { useBusinessOperations } from '@/lib/business-operations/context';
import type { BusinessOperationsSectionId } from '@/lib/business-operations/types';

export function BusinessOperationsSectionActions({
  sectionId,
}: {
  sectionId: BusinessOperationsSectionId;
}) {
  const {
    dirtySections,
    saveActiveSection,
    discardSectionDraft,
    isSaving,
    saveNotice,
    saveError,
    clearSaveNotice,
    clearSaveError,
  } = useBusinessOperations();
  const dirty = dirtySections.has(sectionId);

  return (
    <div className="space-y-3">
      <SessionNotice />
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
          {isSaving ? 'Keeping…' : 'Keep section updates'}
        </Button>
      </FormActionRow>
    </div>
  );
}
