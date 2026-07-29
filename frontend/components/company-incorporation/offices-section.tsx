'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OfficeDialog } from '@/components/company-incorporation/office-dialog';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { RepeatableRecordsTable } from '@/components/company-incorporation/repeatable-records-table';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { OfficeAddress } from '@/lib/schemas/company-incorporation';
import {
  OCCUPANCY_TYPE_LABELS,
  OFFICE_TYPE_LABELS,
} from '@/lib/types/company-incorporation';

function formatAddress(office: OfficeAddress) {
  return [
    office.addressLine1,
    office.addressLine2,
    office.locality,
    office.city,
    office.district,
    office.state,
    office.pinCode,
    office.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatEffectivePeriod(office: OfficeAddress) {
  return office.effectiveUntil
    ? `${office.effectiveFrom} to ${office.effectiveUntil}`
    : `${office.effectiveFrom} onwards`;
}

export function OfficesSection() {
  const { data, saveOffices, saveNotice, saveError, clearSaveNotice, clearSaveError } =
    useCompanyIncorporation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<OfficeAddress | null>(null);

  const handleSave = async (office: OfficeAddress) => {
    const exists = data.offices.some((item) => item.id === office.id);
    const nextOffices = exists
      ? data.offices.map((item) => (item.id === office.id ? office : item))
      : [...data.offices, office];
    clearSaveError();
    await saveOffices(nextOffices);
  };

  const handleDelete = async (office: OfficeAddress) => {
    clearSaveError();
    await saveOffices(data.offices.filter((item) => item.id !== office.id));
  };

  return (
    <SectionCard
      title="Offices & Contact Information"
      description="Registered, corporate, and communication office records with effective periods."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditingOffice(null);
            setDialogOpen(true);
          }}
        >
          Add Office
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
        records={data.offices}
        emptyMessage="No office records have been added."
        getRowKey={(record) => record.id}
        onEdit={(record) => {
          setEditingOffice(record);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        columns={[
          {
            key: 'officeType',
            header: 'Office type',
            render: (record) => OFFICE_TYPE_LABELS[record.officeType],
          },
          {
            key: 'address',
            header: 'Address',
            render: (record) => formatAddress(record),
          },
          {
            key: 'period',
            header: 'Effective period',
            render: (record) => formatEffectivePeriod(record),
          },
          {
            key: 'occupancy',
            header: 'Occupancy',
            render: (record) => OCCUPANCY_TYPE_LABELS[record.occupancyType],
          },
        ]}
      />

      <OfficeDialog
        open={dialogOpen}
        initialOffice={editingOffice}
        existingOffices={data.offices}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </SectionCard>
  );
}
