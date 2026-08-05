'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { SelectField, TextInputField } from '@/components/ipo-setup/form-helpers';
import { IpoSectionSaveActions } from '@/components/ipo-setup/section-save-actions';
import { Button } from '@/components/ui/button';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import { createEmptyDeclarationDetail } from '@/lib/ipo-setup/defaults';
import { ELIGIBILITY_DECLARATION_FIELDS, yesNoNotSureOptions } from '@/lib/ipo-setup/options';
import type {
  DeclarationDetail,
  EligibilityDeclarations,
} from '@/lib/schemas/ipo-setup';

export function EligibilityDeclarationsForm() {
  const { payload, updateSection } = useIpoSetup();
  const value = payload.eligibilityDeclarations;

  const set = <K extends keyof EligibilityDeclarations>(
    key: K,
    next: EligibilityDeclarations[K],
  ) => {
    updateSection('eligibilityDeclarations', { ...value, [key]: next }, 'eligibility-declarations');
  };

  const updateDetails = (
    detailsKey: (typeof ELIGIBILITY_DECLARATION_FIELDS)[number]['detailsKey'],
    details: DeclarationDetail[],
  ) => {
    set(detailsKey, details);
  };

  return (
    <SectionCard
      title="Eligibility Declarations"
      description="Every item must be Yes, No, or Not sure. Unanswered is never treated as No. Materiality is not decided automatically."
    >
      <div className="space-y-6">
        {ELIGIBILITY_DECLARATION_FIELDS.map((field) => {
          const answer = value[field.key];
          const details = value[field.detailsKey] as DeclarationDetail[];
          return (
            <div key={field.key} className="space-y-3 rounded-md border border-border p-4">
              <SelectField
                id={field.key}
                label={field.label}
                value={answer}
                onChange={(next) => {
                  const typed = next as EligibilityDeclarations[typeof field.key];
                  if (typed === 'yes' && details.length === 0) {
                    updateSection(
                      'eligibilityDeclarations',
                      {
                        ...value,
                        [field.key]: typed,
                        [field.detailsKey]: [createEmptyDeclarationDetail()],
                      },
                      'eligibility-declarations',
                    );
                    return;
                  }
                  set(field.key, typed);
                }}
                options={yesNoNotSureOptions}
              />
              {answer === 'yes' ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Structured details are required when the answer is Yes.
                  </p>
                  {details.map((detail, index) => (
                    <div key={detail.id} className="grid gap-3 md:grid-cols-2">
                      <TextInputField
                        id={`${detail.id}-person`}
                        label="Person / entity involved"
                        value={detail.personOrEntityInvolved}
                        onChange={(next) => {
                          const updated = details.map((row) =>
                            row.id === detail.id
                              ? { ...row, personOrEntityInvolved: next }
                              : row,
                          );
                          updateDetails(field.detailsKey, updated);
                        }}
                      />
                      <TextInputField
                        id={`${detail.id}-authority`}
                        label="Authority / forum"
                        value={detail.authorityOrForum}
                        onChange={(next) => {
                          const updated = details.map((row) =>
                            row.id === detail.id ? { ...row, authorityOrForum: next } : row,
                          );
                          updateDetails(field.detailsKey, updated);
                        }}
                      />
                      <TextInputField
                        id={`${detail.id}-date`}
                        label="Date"
                        type="date"
                        value={detail.date}
                        onChange={(next) => {
                          const updated = details.map((row) =>
                            row.id === detail.id ? { ...row, date: next } : row,
                          );
                          updateDetails(field.detailsKey, updated);
                        }}
                      />
                      <TextInputField
                        id={`${detail.id}-status`}
                        label="Current status"
                        value={detail.currentStatus}
                        onChange={(next) => {
                          const updated = details.map((row) =>
                            row.id === detail.id ? { ...row, currentStatus: next } : row,
                          );
                          updateDetails(field.detailsKey, updated);
                        }}
                      />
                      <div className="md:col-span-2">
                        <TextInputField
                          id={`${detail.id}-explanation`}
                          label="Explanation"
                          value={detail.explanation}
                          onChange={(next) => {
                            const updated = details.map((row) =>
                              row.id === detail.id ? { ...row, explanation: next } : row,
                            );
                            updateDetails(field.detailsKey, updated);
                          }}
                        />
                      </div>
                      {details.length > 1 ? (
                        <div className="md:col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateDetails(
                                field.detailsKey,
                                details.filter((row) => row.id !== detail.id),
                              )
                            }
                          >
                            Remove detail {index + 1}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDetails(field.detailsKey, [
                        ...details,
                        createEmptyDeclarationDetail(),
                      ])
                    }
                  >
                    Add another detail
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <IpoSectionSaveActions sectionId="eligibility-declarations" />
    </SectionCard>
  );
}
