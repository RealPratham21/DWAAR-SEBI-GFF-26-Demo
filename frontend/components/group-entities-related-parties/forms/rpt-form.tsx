'use client';

import {
  ComputedStat,
  EntityPicker,
  FieldGrid,
  RelatedPartyPicker,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/group-entities-related-parties/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/group-entities-related-parties/repeatable-card';
import { GroupEntitiesSectionActions } from '@/components/group-entities-related-parties/section-actions';
import { DecimalInputField, StatGrid } from '@/components/management-governance/form-helpers';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import {
  createEmptyRptBalanceRecord,
  createEmptyRptTransactionRecord,
} from '@/lib/group-entities-related-parties/defaults';
import {
  ARMS_LENGTH_STATUS_OPTIONS,
  CASH_NON_CASH_OPTIONS,
  INTEREST_BEARING_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  RECURRING_OPTIONS,
  RPT_BALANCE_TYPE_OPTIONS,
  RPT_TRANSACTION_TYPE_OPTIONS,
  SECURED_UNSECURED_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  ArmsLengthStatus,
  CashNonCash,
  InterestBearing,
  ProfessionalConfirmationStatus,
  RecurringNonRecurring,
  RelatedPartyTransactionsBalancesAndCommitments,
  RptBalanceRecord,
  RptBalanceType,
  RptTransactionRecord,
  RptTransactionType,
  SecuredUnsecured,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'related-party-transactions-balances-and-commitments' as const;

function formatStat(value: string | null | undefined): string {
  if (!value || value === '0') return '—';
  return value;
}

export function RptForm() {
  const { payload, updateSection, model } = useGroupEntities();
  const value = payload.relatedPartyTransactionsBalancesAndCommitments;
  const summary = model.rptSummary;

  const set = <K extends keyof RelatedPartyTransactionsBalancesAndCommitments>(
    key: K,
    next: RelatedPartyTransactionsBalancesAndCommitments[K],
  ) => {
    updateSection('relatedPartyTransactionsBalancesAndCommitments', { ...value, [key]: next }, SECTION_ID);
  };

  const setTransactions = (next: RptTransactionRecord[]) => set('transactions', next);

  const setTransaction = <K extends keyof RptTransactionRecord>(
    index: number,
    key: K,
    next: RptTransactionRecord[K],
  ) => {
    setTransactions(replaceAt(value.transactions, index, { ...value.transactions[index], [key]: next }));
  };

  const setBalances = (next: RptBalanceRecord[]) => set('balances', next);

  const setBalance = <K extends keyof RptBalanceRecord>(
    index: number,
    key: K,
    next: RptBalanceRecord[K],
  ) => {
    setBalances(replaceAt(value.balances, index, { ...value.balances[index], [key]: next }));
  };

  const approvalTernaries = [
    ['auditCommitteeApproval', 'Audit committee approval'],
    ['omnibusApproval', 'Omnibus approval'],
    ['boardApproval', 'Board approval'],
    ['shareholderApproval', 'Shareholder approval'],
    ['priorSubsequentApproval', 'Prior/subsequent approval'],
    ['ratificationRequired', 'Ratification required'],
  ] as const;

  return (
    <SectionCard
      title="Related Party Transactions, Balances & Commitments"
      description="Central RPT register with outstanding balances, commitments and derived totals."
    >
      <StatGrid title="RPT summary (computed, not persisted)">
        <ComputedStat label="RPT sales" value={formatStat(summary.rptSales)} />
        <ComputedStat label="RPT purchases" value={formatStat(summary.rptPurchases)} />
        <ComputedStat label="Loans given" value={formatStat(summary.rptLoansGiven)} />
        <ComputedStat label="Loans received" value={formatStat(summary.rptLoansReceived)} />
        <ComputedStat label="Guarantees" value={formatStat(summary.guarantees)} />
        <ComputedStat label="Closing receivables" value={formatStat(summary.closingReceivables)} />
        <ComputedStat label="Closing payables" value={formatStat(summary.closingPayables)} />
        <ComputedStat label="Closing loans" value={formatStat(summary.closingLoans)} />
        <ComputedStat label="Latest FY total" value={formatStat(summary.latestFinancialYearTotal)} />
        <ComputedStat
          label="RPT revenue %"
          value={summary.rptRevenuePercent != null ? `${summary.rptRevenuePercent}%` : '—'}
        />
        <ComputedStat
          label="RPT purchases %"
          value={summary.rptPurchasesPercent != null ? `${summary.rptPurchasesPercent}%` : '—'}
        />
        <ComputedStat
          label="Financials revenue difference"
          value={formatStat(summary.financialsRevenueDifference ?? undefined)}
        />
      </StatGrid>

      <RepeatableList
        title="RPT transactions"
        description="Transaction register with pricing, arms-length status and approvals."
        addLabel="Add transaction"
        onAdd={() => setTransactions([...value.transactions, createEmptyRptTransactionRecord()])}
        emptyMessage="No RPT transactions recorded yet."
        count={value.transactions.length}
      >
        {value.transactions.map((tx, index) => (
          <RepeatableCard
            key={tx.id}
            title={tx.transactionType || tx.description || `Transaction ${index + 1}`}
            subtitle={tx.financialPeriod || undefined}
            onRemove={() => setTransactions(removeAt(value.transactions, index))}
          >
            <FieldGrid columns={3}>
              <RelatedPartyPicker
                id={`rpt-tx-${tx.id}-rp`}
                label="Related party"
                value={tx.relatedPartyRelationshipId}
                onChange={(next) => setTransaction(index, 'relatedPartyRelationshipId', next)}
                payload={payload}
              />
              <EntityPicker
                id={`rpt-tx-${tx.id}-entity`}
                label="Linked entity (optional)"
                value={tx.linkedEntityId}
                onChange={(next) => setTransaction(index, 'linkedEntityId', next)}
                payload={payload}
              />
              <SelectField
                id={`rpt-tx-${tx.id}-type`}
                label="Transaction type"
                value={tx.transactionType}
                onChange={(next) =>
                  setTransaction(index, 'transactionType', next as RptTransactionType | '')
                }
                options={RPT_TRANSACTION_TYPE_OPTIONS}
              />
              <TextInputField
                id={`rpt-tx-${tx.id}-period`}
                label="Financial period"
                value={tx.financialPeriod}
                onChange={(next) => setTransaction(index, 'financialPeriod', next)}
              />
              <DecimalInputField
                id={`rpt-tx-${tx.id}-value`}
                label="Transaction value"
                value={tx.transactionValue}
                onChange={(next) => setTransaction(index, 'transactionValue', next)}
              />
              <TextInputField
                id={`rpt-tx-${tx.id}-currency`}
                label="Currency"
                value={tx.currency}
                onChange={(next) => setTransaction(index, 'currency', next)}
              />
              <SelectField
                id={`rpt-tx-${tx.id}-arms-length`}
                label="Arms-length status"
                value={tx.armsLengthStatus}
                onChange={(next) =>
                  setTransaction(index, 'armsLengthStatus', next as ArmsLengthStatus | '')
                }
                options={ARMS_LENGTH_STATUS_OPTIONS}
              />
              <SelectField
                id={`rpt-tx-${tx.id}-recurring`}
                label="Recurring / non-recurring"
                value={tx.recurringNonRecurring}
                onChange={(next) =>
                  setTransaction(index, 'recurringNonRecurring', next as RecurringNonRecurring | '')
                }
                options={RECURRING_OPTIONS}
              />
              <SelectField
                id={`rpt-tx-${tx.id}-cash`}
                label="Cash / non-cash"
                value={tx.cashNonCash}
                onChange={(next) => setTransaction(index, 'cashNonCash', next as CashNonCash | '')}
                options={CASH_NON_CASH_OPTIONS}
              />
            </FieldGrid>

            <SubSection title="Approvals">
              <FieldGrid columns={3}>
                {approvalTernaries.map(([key, label]) => (
                  <TernaryField
                    key={key}
                    id={`rpt-tx-${tx.id}-${key}`}
                    label={label}
                    value={tx[key]}
                    onChange={(next) => setTransaction(index, key, next)}
                  />
                ))}
                <TextInputField
                  id={`rpt-tx-${tx.id}-approval-date`}
                  label="Approval date"
                  type="date"
                  value={tx.approvalDate}
                  onChange={(next) => setTransaction(index, 'approvalDate', next)}
                />
                <TextInputField
                  id={`rpt-tx-${tx.id}-resolution-ref`}
                  label="Resolution reference"
                  value={tx.resolutionReference}
                  onChange={(next) => setTransaction(index, 'resolutionReference', next)}
                />
                <SelectField
                  id={`rpt-tx-${tx.id}-prof-confirm`}
                  label="Professional confirmation"
                  value={tx.professionalConfirmationStatus}
                  onChange={(next) =>
                    setTransaction(
                      index,
                      'professionalConfirmationStatus',
                      next as ProfessionalConfirmationStatus | '',
                    )
                  }
                  options={PROFESSIONAL_CONFIRMATION_OPTIONS}
                />
              </FieldGrid>
            </SubSection>

            <TextAreaField
              id={`rpt-tx-${tx.id}-description`}
              label="Description"
              rows={2}
              value={tx.description}
              onChange={(next) => setTransaction(index, 'description', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Outstanding balances & commitments"
        description="Receivables, payables, loans, guarantees and commitments as at reporting date."
        addLabel="Add balance"
        onAdd={() => setBalances([...value.balances, createEmptyRptBalanceRecord()])}
        emptyMessage="No RPT balances recorded yet."
        count={value.balances.length}
      >
        {value.balances.map((balance, index) => (
          <RepeatableCard
            key={balance.id}
            title={balance.balanceType || `Balance ${index + 1}`}
            subtitle={balance.reportingPeriod || undefined}
            onRemove={() => setBalances(removeAt(value.balances, index))}
          >
            <FieldGrid columns={3}>
              <RelatedPartyPicker
                id={`rpt-bal-${balance.id}-rp`}
                label="Related party"
                value={balance.relatedPartyRelationshipId}
                onChange={(next) => setBalance(index, 'relatedPartyRelationshipId', next)}
                payload={payload}
              />
              <SelectField
                id={`rpt-bal-${balance.id}-type`}
                label="Balance type"
                value={balance.balanceType}
                onChange={(next) => setBalance(index, 'balanceType', next as RptBalanceType | '')}
                options={RPT_BALANCE_TYPE_OPTIONS}
              />
              <TextInputField
                id={`rpt-bal-${balance.id}-reporting-date`}
                label="Reporting date"
                type="date"
                value={balance.reportingDate}
                onChange={(next) => setBalance(index, 'reportingDate', next)}
              />
              <DecimalInputField
                id={`rpt-bal-${balance.id}-opening`}
                label="Opening balance"
                value={balance.openingBalance}
                onChange={(next) => setBalance(index, 'openingBalance', next)}
              />
              <DecimalInputField
                id={`rpt-bal-${balance.id}-during`}
                label="Transactions during period"
                value={balance.transactionsDuringPeriod}
                onChange={(next) => setBalance(index, 'transactionsDuringPeriod', next)}
              />
              <DecimalInputField
                id={`rpt-bal-${balance.id}-closing`}
                label="Closing balance"
                value={balance.closingBalance}
                onChange={(next) => setBalance(index, 'closingBalance', next)}
              />
              <SelectField
                id={`rpt-bal-${balance.id}-secured`}
                label="Secured / unsecured"
                value={balance.securedUnsecured}
                onChange={(next) => setBalance(index, 'securedUnsecured', next as SecuredUnsecured | '')}
                options={SECURED_UNSECURED_OPTIONS}
              />
              <SelectField
                id={`rpt-bal-${balance.id}-interest`}
                label="Interest bearing"
                value={balance.interestBearing}
                onChange={(next) => setBalance(index, 'interestBearing', next as InterestBearing | '')}
                options={INTEREST_BEARING_OPTIONS}
              />
              <DecimalInputField
                id={`rpt-bal-${balance.id}-rate`}
                label="Interest rate"
                value={balance.interestRate}
                onChange={(next) => setBalance(index, 'interestRate', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
