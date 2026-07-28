'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  REVIEW_HISTORY_COLUMNS,
  REVIEW_HISTORY_EMPTY_MESSAGE,
  REVIEW_HISTORY_SUPPORTING_TEXT,
} from '@/lib/company-incorporation/review-history-config';

export function CompanyIncorporationReviewTab() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Review History"
        description="Audit trail of fact verification, conflict resolution, disclosure approval, and professional-review decisions."
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          {REVIEW_HISTORY_SUPPORTING_TEXT}
        </p>

        <div className="overflow-x-auto rounded-lg border border-border mt-4">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr>
                {REVIEW_HISTORY_COLUMNS.map((column) => (
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
                  colSpan={REVIEW_HISTORY_COLUMNS.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {REVIEW_HISTORY_EMPTY_MESSAGE}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
