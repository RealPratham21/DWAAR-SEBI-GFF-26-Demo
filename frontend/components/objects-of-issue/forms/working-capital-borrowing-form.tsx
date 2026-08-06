'use client';

import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  RelatedPartyWarning,
  SelectField,
  StatGrid,
  SubSection,
  TernaryField,
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
import { createEmptyBorrowingRepaymentItem } from '@/lib/objects-of-issue/defaults';
import { EM_DASH, formatMoney } from '@/lib/objects-of-issue/format';
import {
  APPRAISAL_STATUS_OPTIONS,
  LOAN_TYPE_OPTIONS,
  WORKING_CAPITAL_METHODOLOGY_OPTIONS,
} from '@/lib/objects-of-issue/options';
import type {
  AppraisalStatus,
  BorrowingRepaymentItem,
  LoanType,
  WorkingCapitalMethodology,
} from '@/lib/objects-of-issue/types';

const SECTION_ID = 'working-capital-and-borrowing-repayment' as const;

export function WorkingCapitalBorrowingForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.workingCapitalAndBorrowingRepayment;

  const setField = <K extends keyof typeof value>(key: K, next: (typeof value)[K]) => {
    updateSection('workingCapitalAndBorrowingRepayment', { ...value, [key]: next }, SECTION_ID);
  };

  const setItems = (next: BorrowingRepaymentItem[]) => {
    setField('borrowingRepaymentItems', next);
  };

  const setItem = <K extends keyof BorrowingRepaymentItem>(
    index: number,
    key: K,
    next: BorrowingRepaymentItem[K],
  ) => {
    setItems(
      replaceAt(value.borrowingRepaymentItems, index, {
        ...value.borrowingRepaymentItems[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Working Capital & Borrowing Repayment"
      description="Working-capital requirement and repayment / prepayment of outstanding borrowings."
    >
      <SubSection title="Working capital requirement">
        <FieldGrid>
          <DecimalInputField
            id="wc-requirement-amount"
            label="Working capital requirement (₹)"
            value={value.workingCapitalRequirementAmount}
            onChange={(next) => setField('workingCapitalRequirementAmount', next)}
          />
          <SelectField
            id="wc-methodology"
            label="Methodology"
            value={value.workingCapitalMethodology}
            onChange={(next) =>
              setField('workingCapitalMethodology', next as WorkingCapitalMethodology | '')
            }
            options={WORKING_CAPITAL_METHODOLOGY_OPTIONS}
          />
          <SelectField
            id="wc-appraisal-status"
            label="Appraisal status"
            value={value.workingCapitalAppraisalStatus}
            onChange={(next) =>
              setField('workingCapitalAppraisalStatus', next as AppraisalStatus | '')
            }
            options={APPRAISAL_STATUS_OPTIONS}
          />
        </FieldGrid>
      </SubSection>

      <StatGrid title="Borrowing repayment summary">
        <ComputedStat
          label="Total proposed repayment"
          value={
            model.totalBorrowingRepayment ? formatMoney(model.totalBorrowingRepayment) : EM_DASH
          }
        />
        <ComputedStat
          label="Related-party lenders flagged"
          value={model.relatedPartyBorrowingFlag ? 'Yes' : 'No'}
        />
      </StatGrid>

      {model.relatedPartyBorrowingFlag ? (
        <RelatedPartyWarning message="One or more borrowings proposed for repayment are owed to a related party. Confirm disclosure and pricing terms." />
      ) : null}

      <RepeatableList
        title="Borrowings proposed for repayment / prepayment"
        addLabel="Add borrowing"
        count={value.borrowingRepaymentItems.length}
        emptyMessage="No borrowing recorded yet."
        onAdd={() =>
          setItems([...value.borrowingRepaymentItems, createEmptyBorrowingRepaymentItem()])
        }
      >
        {value.borrowingRepaymentItems.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.lenderName || `Borrowing ${index + 1}`}
            subtitle={item.loanType || undefined}
            requiresConfirmation={hasRecordData([item.lenderName, item.outstandingAmount])}
            confirmMessage="Remove this borrowing? Entered values will be lost."
            onRemove={() => setItems(removeAt(value.borrowingRepaymentItems, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`wc-item-${index}-lender`}
                label="Lender name"
                required
                value={item.lenderName}
                onChange={(next) => setItem(index, 'lenderName', next)}
              />
              <SelectField
                id={`wc-item-${index}-loan-type`}
                label="Loan type"
                value={item.loanType}
                onChange={(next) => setItem(index, 'loanType', next as LoanType | '')}
                options={LOAN_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`wc-item-${index}-outstanding`}
                label="Outstanding amount (₹)"
                value={item.outstandingAmount}
                onChange={(next) => setItem(index, 'outstandingAmount', next)}
              />
              <DecimalInputField
                id={`wc-item-${index}-proposed-repayment`}
                label="Amount proposed for repayment (₹)"
                required
                value={item.amountProposedForRepayment}
                onChange={(next) => setItem(index, 'amountProposedForRepayment', next)}
              />
              <DecimalInputField
                id={`wc-item-${index}-interest-rate`}
                label="Interest rate (%)"
                value={item.interestRatePercentage}
                onChange={(next) => setItem(index, 'interestRatePercentage', next)}
              />
              <TernaryField
                id={`wc-item-${index}-related-party`}
                label="Related-party lender"
                value={item.isRelatedPartyLender}
                onChange={(next) => setItem(index, 'isRelatedPartyLender', next)}
              />
            </FieldGrid>
            {item.isRelatedPartyLender === 'yes' ? (
              <RelatedPartyWarning message="This lender is flagged as a related party — confirm disclosure and arm's-length pricing." />
            ) : null}
            <TextAreaField
              id={`wc-item-${index}-rationale`}
              label="Repayment rationale"
              rows={2}
              value={item.repaymentRationale}
              onChange={(next) => setItem(index, 'repaymentRationale', next)}
            />
            <TextAreaField
              id={`wc-item-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setItem(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField
        id="wc-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => setField('notes', next)}
      />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
