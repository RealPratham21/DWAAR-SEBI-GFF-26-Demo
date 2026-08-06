'use client';

import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  TextAreaField,
  TextInputField,
} from '@/components/objects-of-issue/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/objects-of-issue/repeatable-card';
import { ObjectsOfIssueSectionActions } from '@/components/objects-of-issue/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useObjectsOfIssue } from '@/lib/objects-of-issue/context';
import { createEmptyIssueObject } from '@/lib/objects-of-issue/defaults';
import { EM_DASH, formatMoney } from '@/lib/objects-of-issue/format';
import { APPRAISAL_STATUS_OPTIONS, OBJECT_CATEGORY_OPTIONS } from '@/lib/objects-of-issue/options';
import type { AppraisalStatus, IssueObject, ObjectCategory } from '@/lib/objects-of-issue/types';

const SECTION_ID = 'objects-register-and-allocation' as const;

export function ObjectsRegisterForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.objectsRegisterAndAllocation;
  const isPureOfs = model.isPureOfs;

  const setObjects = (next: IssueObject[]) => {
    updateSection('objectsRegisterAndAllocation', { ...value, objects: next }, SECTION_ID);
  };

  const setField = (next: typeof value.objectsAreFinalised) => {
    updateSection(
      'objectsRegisterAndAllocation',
      { ...value, objectsAreFinalised: next },
      SECTION_ID,
    );
  };

  const setNotes = (next: string) => {
    updateSection('objectsRegisterAndAllocation', { ...value, notes: next }, SECTION_ID);
  };

  const setObject = <K extends keyof IssueObject>(index: number, key: K, next: IssueObject[K]) => {
    setObjects(replaceAt(value.objects, index, { ...value.objects[index], [key]: next }));
  };

  return (
    <SectionCard
      title="Objects Register & Allocation"
      description="The register of objects of the issue and how net proceeds are allocated across them."
    >
      {isPureOfs ? (
        <p
          role="note"
          className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
        >
          This is a pure offer for sale — fund-utilisation objects are not applicable. Stored
          values below remain visible for reference.
        </p>
      ) : null}

      <StatGrid title="Allocation summary">
        <ComputedStat
          label="Total estimated cost"
          value={
            model.totalEstimatedObjectsCost ? formatMoney(model.totalEstimatedObjectsCost) : EM_DASH
          }
        />
        <ComputedStat
          label="Allocated from net proceeds"
          value={
            model.totalAllocatedFromNetProceeds
              ? formatMoney(model.totalAllocatedFromNetProceeds)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Net proceeds available"
          value={model.netFreshIssueProceeds ? formatMoney(model.netFreshIssueProceeds) : EM_DASH}
        />
        <ComputedStat
          label="Unallocated net proceeds"
          value={
            isPureOfs
              ? 'Not applicable'
              : model.unallocatedNetProceeds
                ? formatMoney(model.unallocatedNetProceeds)
                : EM_DASH
          }
        />
      </StatGrid>

      <SelectField
        id="or-objects-finalised"
        label="Objects of the issue are finalised"
        value={value.objectsAreFinalised}
        onChange={(next) => setField(next as typeof value.objectsAreFinalised)}
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not_sure', label: 'Not sure' },
        ]}
        emptyLabel="Not answered"
      />

      <RepeatableList
        title="Objects of the issue"
        description="Every distinct object of the issue, with estimated cost and funding allocation."
        addLabel="Add object"
        count={value.objects.length}
        emptyMessage="No object recorded yet."
        onAdd={() => setObjects([...value.objects, createEmptyIssueObject()])}
      >
        {value.objects.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.objectName || `Object ${index + 1}`}
            subtitle={item.objectCategory || undefined}
            requiresConfirmation={hasRecordData([
              item.objectName,
              item.description,
              item.estimatedCost,
            ])}
            confirmMessage="Remove this object of the issue? Entered values will be lost."
            onRemove={() => setObjects(removeAt(value.objects, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`or-object-${index}-name`}
                label="Object name"
                required
                value={item.objectName}
                onChange={(next) => setObject(index, 'objectName', next)}
              />
              <SelectField
                id={`or-object-${index}-category`}
                label="Object category"
                required
                value={item.objectCategory}
                onChange={(next) => setObject(index, 'objectCategory', next as ObjectCategory | '')}
                options={OBJECT_CATEGORY_OPTIONS}
              />
              <DecimalInputField
                id={`or-object-${index}-estimated-cost`}
                label="Estimated cost (₹)"
                required
                value={item.estimatedCost}
                onChange={(next) => setObject(index, 'estimatedCost', next)}
              />
              <DecimalInputField
                id={`or-object-${index}-from-net-proceeds`}
                label="Amount from net proceeds (₹)"
                value={item.amountFromNetProceeds}
                onChange={(next) => setObject(index, 'amountFromNetProceeds', next)}
              />
              <DecimalInputField
                id={`or-object-${index}-from-internal-accruals`}
                label="Amount from internal accruals (₹)"
                value={item.amountFromInternalAccruals}
                onChange={(next) => setObject(index, 'amountFromInternalAccruals', next)}
              />
              <DecimalInputField
                id={`or-object-${index}-from-other-sources`}
                label="Amount from other sources (₹)"
                value={item.amountFromOtherSources}
                onChange={(next) => setObject(index, 'amountFromOtherSources', next)}
              />
              <SelectField
                id={`or-object-${index}-appraisal-status`}
                label="Appraisal status"
                value={item.appraisalStatus}
                onChange={(next) => setObject(index, 'appraisalStatus', next as AppraisalStatus | '')}
                options={APPRAISAL_STATUS_OPTIONS}
              />
              <TextInputField
                id={`or-object-${index}-appraising-agency`}
                label="Appraising agency (if any)"
                value={item.appraisingAgencyName}
                onChange={(next) => setObject(index, 'appraisingAgencyName', next)}
              />
              <TextInputField
                id={`or-object-${index}-utilisation-period`}
                label="Expected utilisation period"
                value={item.expectedUtilisationPeriod}
                onChange={(next) => setObject(index, 'expectedUtilisationPeriod', next)}
              />
              <TextInputField
                id={`or-object-${index}-priority`}
                label="Priority rank"
                value={item.priorityRank}
                onChange={(next) => setObject(index, 'priorityRank', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`or-object-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setObject(index, 'description', next)}
            />
            <TextAreaField
              id={`or-object-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setObject(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField id="or-notes" label="Notes" value={value.notes} onChange={setNotes} />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
