'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  FACTS_EMPTY_MESSAGE,
  FACTS_SUPPORTING_TEXT,
  FACTS_TABLE_COLUMNS,
} from '@/lib/company-incorporation/facts-table-config';

export function CompanyIncorporationFactsTab() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Facts & Evidence"
        description="Verified facts extracted from information and documents, with source traceability for DRHP use."
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{FACTS_SUPPORTING_TEXT}</p>

        <div className="overflow-x-auto rounded-lg border border-border mt-4">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr>
                {FACTS_TABLE_COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={FACTS_TABLE_COLUMNS.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {FACTS_EMPTY_MESSAGE}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
