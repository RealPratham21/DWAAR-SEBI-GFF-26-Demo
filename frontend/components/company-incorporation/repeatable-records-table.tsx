'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export interface RepeatableRecordColumn<T> {
  key: string;
  header: string;
  render: (record: T) => ReactNode;
  className?: string;
}

interface RepeatableRecordsTableProps<T> {
  records: T[];
  columns: RepeatableRecordColumn<T>[];
  getRowKey: (record: T) => string;
  onEdit: (record: T) => void;
  onDelete: (record: T) => void;
  emptyMessage: string;
}

export function RepeatableRecordsTable<T>({
  records,
  columns,
  getRowKey,
  onEdit,
  onDelete,
  emptyMessage,
}: RepeatableRecordsTableProps<T>) {
  if (records.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/40">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left font-medium text-muted-foreground ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {records.map((record) => (
            <tr key={getRowKey(record)} className="hover:bg-muted/20">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-top text-foreground ${column.className ?? ''}`}>
                  {column.render(record)}
                </td>
              ))}
              <td className="px-4 py-3 align-top">
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(record)}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(record)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
