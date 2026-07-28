'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { InfoBadge, TabEmptyPanel } from '@/components/company-incorporation/tab-shared';
import { ISSUE_CATEGORIES } from '@/lib/company-incorporation/issue-categories-config';

const QUESTION_SECTIONS = [
  { id: 'open-questions', title: 'Open Questions' },
  { id: 'conflicts', title: 'Conflicts' },
  { id: 'resolved-items', title: 'Resolved Items' },
] as const;

const EMPTY_MESSAGE = 'No questions or conflicts have been raised yet.';

const SUPPORTING_TEXT =
  'Questions and conflicts will appear when submitted information is compared with uploaded documents, extracted facts, and professional review requirements.';

export function CompanyIncorporationQuestionsTab() {
  return (
    <div className="space-y-6">
      {QUESTION_SECTIONS.map((section) => (
        <SectionCard key={section.id} title={section.title}>
          <TabEmptyPanel message={EMPTY_MESSAGE} supportingText={SUPPORTING_TEXT} />
        </SectionCard>
      ))}

      <SectionCard
        title="Issue Categories"
        description="Future questions and conflicts may be classified under these categories."
      >
        <div className="flex flex-wrap gap-2">
          {ISSUE_CATEGORIES.map((category) => (
            <InfoBadge key={category.id} label={category.label} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
