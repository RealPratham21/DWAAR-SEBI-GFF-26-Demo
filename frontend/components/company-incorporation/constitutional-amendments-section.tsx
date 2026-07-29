'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConstitutionalAmendmentDialog } from '@/components/company-incorporation/constitutional-amendment-dialog';
import { RepeatableRecordsTable } from '@/components/company-incorporation/repeatable-records-table';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { ConstitutionalAmendment } from '@/lib/schemas/company-incorporation';
import { CONSTITUTIONAL_DOCUMENT_TYPE_LABELS } from '@/lib/types/company-incorporation';

export function ConstitutionalAmendmentsSection() {
  const { data, saveConstitutionalAmendments, saveNotice, saveError, clearSaveError } =
    useCompanyIncorporation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAmendment, setEditingAmendment] = useState<ConstitutionalAmendment | null>(null);

  const sortedAmendments = useMemo(
    () =>
      [...data.constitutionalAmendments].sort((left, right) =>
        right.amendmentDate.localeCompare(left.amendmentDate),
      ),
    [data.constitutionalAmendments],
  );

  const handleSave = async (amendment: ConstitutionalAmendment) => {
    const exists = data.constitutionalAmendments.some((item) => item.id === amendment.id);
    const nextAmendments = exists
      ? data.constitutionalAmendments.map((item) => (item.id === amendment.id ? amendment : item))
      : [...data.constitutionalAmendments, amendment];
    clearSaveError();
    await saveConstitutionalAmendments(nextAmendments);
  };

  const handleDelete = async (amendment: ConstitutionalAmendment) => {
    clearSaveError();
    await saveConstitutionalAmendments(
      data.constitutionalAmendments.filter((item) => item.id !== amendment.id),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-foreground">Constitutional Amendments</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Record MoA and AoA amendments separately from the current constitutional snapshot.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditingAmendment(null);
            setDialogOpen(true);
          }}
        >
          Add Amendment
        </Button>
      </div>

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <RepeatableRecordsTable
        records={sortedAmendments}
        emptyMessage="No constitutional amendments have been added."
        getRowKey={(record) => record.id}
        onEdit={(record) => {
          setEditingAmendment(record);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        columns={[
          {
            key: 'amendmentDate',
            header: 'Amendment date',
            render: (record) => record.amendmentDate,
          },
          {
            key: 'documentType',
            header: 'Document',
            render: (record) => CONSTITUTIONAL_DOCUMENT_TYPE_LABELS[record.documentType],
          },
          {
            key: 'clauseReference',
            header: 'Clause',
            render: (record) => record.clauseReference,
          },
          {
            key: 'amendedText',
            header: 'Amended text',
            render: (record) => record.amendedText,
          },
        ]}
      />

      <ConstitutionalAmendmentDialog
        open={dialogOpen}
        initialAmendment={editingAmendment}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
