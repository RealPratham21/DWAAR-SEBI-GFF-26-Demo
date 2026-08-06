'use client';

import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  PendingWorkstreamNotice,
  RelatedPartyWarning,
  SelectField,
  StatGrid,
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
import { createEmptyInvestmentItem } from '@/lib/objects-of-issue/defaults';
import { EM_DASH, formatMoney } from '@/lib/objects-of-issue/format';
import {
  DEFINITIVE_AGREEMENT_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from '@/lib/objects-of-issue/options';
import type {
  DefinitiveAgreementStatus,
  InvestmentItem,
  TransactionType,
} from '@/lib/objects-of-issue/types';

const SECTION_ID = 'acquisitions-subsidiaries-jvs-and-investments' as const;

export function AcquisitionsInvestmentsForm() {
  const { payload, updateSection, model } = useObjectsOfIssue();
  const value = payload.acquisitionsSubsidiariesJvsAndInvestments;
  const isRelevant = model.hasAcquisitionRelevantObjects;

  const setItems = (next: InvestmentItem[]) => {
    updateSection(
      'acquisitionsSubsidiariesJvsAndInvestments',
      { ...value, investmentItems: next },
      SECTION_ID,
    );
  };

  const setItem = <K extends keyof InvestmentItem>(
    index: number,
    key: K,
    next: InvestmentItem[K],
  ) => {
    setItems(
      replaceAt(value.investmentItems, index, { ...value.investmentItems[index], [key]: next }),
    );
  };

  const setNotes = (next: string) => {
    updateSection(
      'acquisitionsSubsidiariesJvsAndInvestments',
      { ...value, notes: next },
      SECTION_ID,
    );
  };

  return (
    <SectionCard
      title="Acquisitions, Subsidiaries, JVs & Investments"
      description="Strategic acquisitions, subsidiary funding, joint ventures and other investments planned from the issue."
    >
      {isRelevant ? (
        <p
          role="note"
          className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-foreground"
        >
          The objects register includes an acquisition or investment object — capture the
          underlying transaction here.
        </p>
      ) : value.investmentItems.length === 0 ? (
        <PendingWorkstreamNotice message="No acquisition or investment object is currently recorded. This section is currently not applicable — add a note below if that changes, or record items directly." />
      ) : null}

      <StatGrid title="Investment summary">
        <ComputedStat
          label="Total estimated amount"
          value={model.totalInvestmentAmount ? formatMoney(model.totalInvestmentAmount) : EM_DASH}
        />
        <ComputedStat
          label="Related-party transactions flagged"
          value={model.relatedPartyInvestmentFlag ? 'Yes' : 'No'}
        />
      </StatGrid>

      {model.relatedPartyInvestmentFlag ? (
        <RelatedPartyWarning message="One or more proposed acquisitions or investments involve a related party. Confirm disclosure and valuation basis." />
      ) : null}

      <RepeatableList
        title="Acquisitions, subsidiaries, JVs and investments"
        addLabel="Add transaction"
        count={value.investmentItems.length}
        emptyMessage="No transaction recorded yet."
        onAdd={() => setItems([...value.investmentItems, createEmptyInvestmentItem()])}
      >
        {value.investmentItems.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.targetEntityName || `Transaction ${index + 1}`}
            subtitle={item.transactionType || undefined}
            requiresConfirmation={hasRecordData([item.targetEntityName, item.estimatedAmount])}
            confirmMessage="Remove this transaction? Entered values will be lost."
            onRemove={() => setItems(removeAt(value.investmentItems, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`ai-item-${index}-target`}
                label="Target entity name"
                required
                value={item.targetEntityName}
                onChange={(next) => setItem(index, 'targetEntityName', next)}
              />
              <SelectField
                id={`ai-item-${index}-transaction-type`}
                label="Transaction type"
                required
                value={item.transactionType}
                onChange={(next) => setItem(index, 'transactionType', next as TransactionType | '')}
                options={TRANSACTION_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`ai-item-${index}-amount`}
                label="Estimated amount (₹)"
                required
                value={item.estimatedAmount}
                onChange={(next) => setItem(index, 'estimatedAmount', next)}
              />
              <DecimalInputField
                id={`ai-item-${index}-stake`}
                label="Proposed stake (%)"
                value={item.proposedStakePercentage}
                onChange={(next) => setItem(index, 'proposedStakePercentage', next)}
              />
              <SelectField
                id={`ai-item-${index}-agreement-status`}
                label="Definitive agreement status"
                value={item.definitiveAgreementStatus}
                onChange={(next) =>
                  setItem(index, 'definitiveAgreementStatus', next as DefinitiveAgreementStatus | '')
                }
                options={DEFINITIVE_AGREEMENT_STATUS_OPTIONS}
              />
              <TernaryField
                id={`ai-item-${index}-regulatory-approvals`}
                label="Regulatory approvals required"
                value={item.regulatoryApprovalsRequired}
                onChange={(next) => setItem(index, 'regulatoryApprovalsRequired', next)}
              />
              <TernaryField
                id={`ai-item-${index}-related-party`}
                label="Related-party transaction"
                value={item.isRelatedPartyTransaction}
                onChange={(next) => setItem(index, 'isRelatedPartyTransaction', next)}
              />
              <TextInputField
                id={`ai-item-${index}-related-object`}
                label="Related object ID (optional)"
                value={item.relatedObjectId}
                onChange={(next) => setItem(index, 'relatedObjectId', next)}
              />
            </FieldGrid>
            {item.isRelatedPartyTransaction === 'yes' ? (
              <RelatedPartyWarning message="This transaction is flagged as related-party — confirm disclosure and valuation basis." />
            ) : null}
            {item.regulatoryApprovalsRequired === 'yes' ||
            item.regulatoryApprovalsRequired === 'not_sure' ? (
              <TextAreaField
                id={`ai-item-${index}-approval-details`}
                label="Regulatory approval — details"
                rows={2}
                value={item.regulatoryApprovalDetails}
                onChange={(next) => setItem(index, 'regulatoryApprovalDetails', next)}
              />
            ) : null}
            <TextAreaField
              id={`ai-item-${index}-rationale`}
              label="Rationale"
              rows={2}
              value={item.rationale}
              onChange={(next) => setItem(index, 'rationale', next)}
            />
            <TextAreaField
              id={`ai-item-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setItem(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <TextAreaField id="ai-notes" label="Notes" value={value.notes} onChange={setNotes} />

      <ObjectsOfIssueSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
