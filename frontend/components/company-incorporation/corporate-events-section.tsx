'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CorporateEventDialog } from '@/components/company-incorporation/corporate-event-dialog';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { RepeatableRecordsTable } from '@/components/company-incorporation/repeatable-records-table';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { sortCorporateEvents } from '@/lib/company-incorporation/defaults';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { CorporateEvent } from '@/lib/schemas/company-incorporation';
import {
  CORPORATE_EVENT_STATUS_LABELS,
  CORPORATE_EVENT_TYPE_LABELS,
} from '@/lib/types/company-incorporation';

export function CorporateEventsSection() {
  const { data, saveCorporateEvents, saveNotice, saveError, clearSaveNotice, clearSaveError } =
    useCompanyIncorporation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CorporateEvent | null>(null);

  const sortedEvents = useMemo(
    () => sortCorporateEvents(data.corporateEvents),
    [data.corporateEvents],
  );

  const handleSave = async (event: CorporateEvent) => {
    const exists = data.corporateEvents.some((item) => item.id === event.id);
    const nextEvents = exists
      ? data.corporateEvents.map((item) => (item.id === event.id ? event : item))
      : [...data.corporateEvents, event];
    clearSaveError();
    await saveCorporateEvents(nextEvents);
  };

  const handleDelete = async (event: CorporateEvent) => {
    clearSaveError();
    await saveCorporateEvents(data.corporateEvents.filter((item) => item.id !== event.id));
  };

  return (
    <SectionCard
      title="Corporate History"
      description="Chronological record of incorporation and subsequent material corporate events."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setDialogOpen(true);
          }}
        >
          Add Corporate Event
        </Button>
      }
    >
      {saveNotice ? <SessionSaveNotice message={saveNotice} onDismiss={clearSaveNotice} /> : null}
      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <RepeatableRecordsTable
        records={sortedEvents}
        emptyMessage="No corporate history events have been added."
        getRowKey={(record) => record.id}
        onEdit={(record) => {
          setEditingEvent(record);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        columns={[
          {
            key: 'effectiveDate',
            header: 'Legal effective date',
            render: (record) => record.effectiveDate || '—',
          },
          {
            key: 'eventStatus',
            header: 'Status',
            render: (record) => CORPORATE_EVENT_STATUS_LABELS[record.eventStatus],
          },
          {
            key: 'eventType',
            header: 'Event type',
            render: (record) => CORPORATE_EVENT_TYPE_LABELS[record.eventType],
          },
          {
            key: 'description',
            header: 'Description',
            render: (record) => record.description,
          },
          {
            key: 'values',
            header: 'Change',
            render: (record) =>
              [record.previousValue, record.newValue].filter(Boolean).join(' → ') || '—',
          },
        ]}
      />

      <CorporateEventDialog
        open={dialogOpen}
        initialEvent={editingEvent}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </SectionCard>
  );
}
