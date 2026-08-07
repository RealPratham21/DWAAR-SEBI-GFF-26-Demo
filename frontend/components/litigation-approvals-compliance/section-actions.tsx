'use client';

import { FormActionRow } from '@/components/company-incorporation/form-primitives';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { Button } from '@/components/ui/button';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import type { LitigationApprovalsComplianceSectionId } from '@/lib/schemas/litigation-approvals-compliance';

export function LitigationApprovalsComplianceSectionActions({
  sectionId,
}: {
  sectionId: LitigationApprovalsComplianceSectionId;
}) {
  const {
    dirtySections,
    saveActiveSection,
    discardSectionDraft,
    saveNotice,
    saveError,
    clearSaveNotice,
    clearSaveError,
    isSaving,
  } = useLitigationApprovalsCompliance();
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
          disabled={!dirty || isSaving}
          onClick={() => discardSectionDraft(sectionId)}
        >
          Discard changes
        </Button>
        <Button
          type="button"
          disabled={!dirty || isSaving}
          onClick={() => void saveActiveSection(sectionId)}
        >
          {isSaving ? 'Saving…' : 'Keep section updates'}
        </Button>
      </FormActionRow>
    </div>
  );
}
