'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RegistrationDialog } from '@/components/company-incorporation/registration-dialog';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { RepeatableRecordsTable } from '@/components/company-incorporation/repeatable-records-table';
import { SessionSaveNotice } from '@/components/company-incorporation/session-save-notice';
import { useCompanyIncorporation } from '@/lib/company-incorporation/context';
import type { CompanyRegistration } from '@/lib/schemas/company-incorporation';
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TYPE_LABELS,
} from '@/lib/types/company-incorporation';

export function RegistrationsSection() {
  const { data, setRegistrations, notifySaved, saveNotice, clearSaveNotice } =
    useCompanyIncorporation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<CompanyRegistration | null>(null);

  const handleSave = (registration: CompanyRegistration) => {
    const exists = data.registrations.some((item) => item.id === registration.id);
    const nextRegistrations = exists
      ? data.registrations.map((item) => (item.id === registration.id ? registration : item))
      : [...data.registrations, registration];
    setRegistrations(nextRegistrations);
    notifySaved();
  };

  const handleDelete = (registration: CompanyRegistration) => {
    setRegistrations(data.registrations.filter((item) => item.id !== registration.id));
    notifySaved();
  };

  return (
    <SectionCard
      title="Core Registrations"
      description="Fundamental statutory registrations such as PAN, TAN, GSTIN, Udyam, and IEC."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditingRegistration(null);
            setDialogOpen(true);
          }}
        >
          Add Registration
        </Button>
      }
    >
      {saveNotice ? <SessionSaveNotice message={saveNotice} onDismiss={clearSaveNotice} /> : null}

      <RepeatableRecordsTable
        records={data.registrations}
        emptyMessage="No corporate registrations have been added."
        getRowKey={(record) => record.id}
        onEdit={(record) => {
          setEditingRegistration(record);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        columns={[
          {
            key: 'registrationType',
            header: 'Type',
            render: (record) => REGISTRATION_TYPE_LABELS[record.registrationType],
          },
          {
            key: 'registrationNumber',
            header: 'Registration number',
            render: (record) => record.registrationNumber,
          },
          {
            key: 'legalNameOnRegistration',
            header: 'Legal name',
            render: (record) => record.legalNameOnRegistration || '—',
          },
          {
            key: 'currentStatus',
            header: 'Status',
            render: (record) =>
              record.currentStatus ? REGISTRATION_STATUS_LABELS[record.currentStatus] : '—',
          },
          {
            key: 'dates',
            header: 'Dates',
            render: (record) =>
              [record.issueDate, record.effectiveDate, record.expiryDate].filter(Boolean).join(' · ') ||
              '—',
          },
        ]}
      />

      <RegistrationDialog
        open={dialogOpen}
        initialRegistration={editingRegistration}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </SectionCard>
  );
}
