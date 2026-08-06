'use client';

import {
  ComputedStat,
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
  SubSection,
  TableScroll,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/capital-ownership/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/capital-ownership/repeatable-card';
import { CapitalOwnershipSectionActions } from '@/components/capital-ownership/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useCapitalOwnership } from '@/lib/capital-ownership/context';
import { createEmptyCapitalEvent } from '@/lib/capital-ownership/defaults';
import {
  EM_DASH,
  formatDate,
  formatMoneyCompact,
  formatShares,
} from '@/lib/capital-ownership/format';
import {
  CAPITAL_EVENT_TYPE_LABELS,
  capitalEventTypeOptions,
  considerationTypeOptions,
  resolutionTypeOptions,
  securityTypeOptions,
} from '@/lib/capital-ownership/options';
import type { CapitalEvent, ShareCapitalHistory } from '@/lib/capital-ownership/types';

const SECTION_ID = 'share-capital-history' as const;

const RATIO_EVENT_TYPES = new Set(['share-split-subdivision', 'share-consolidation']);

function eventTypeLabel(eventType: string): string {
  if (!eventType) return 'Event type not selected';
  return CAPITAL_EVENT_TYPE_LABELS[eventType as keyof typeof CAPITAL_EVENT_TYPE_LABELS] ?? eventType;
}

export function ShareCapitalHistoryForm() {
  const { payload, updateSection, model } = useCapitalOwnership();
  const value = payload.shareCapitalHistory;
  const history = model.history;

  const set = <K extends keyof ShareCapitalHistory>(key: K, next: ShareCapitalHistory[K]) => {
    updateSection('shareCapitalHistory', { ...value, [key]: next }, SECTION_ID);
  };

  const setEvent = <K extends keyof CapitalEvent>(
    index: number,
    key: K,
    next: CapitalEvent[K],
  ) => {
    set(
      'capitalEvents',
      replaceAt(value.capitalEvents, index, { ...value.capitalEvents[index], [key]: next }),
    );
  };

  return (
    <SectionCard
      title="Share Capital History"
      description="Every allotment, split, bonus, buyback and reduction since incorporation, with the resolutions and filings behind each event."
    >
      <FieldGrid>
        <TernaryField
          id="history-covers-since-incorporation"
          label="History covers the period since incorporation"
          required
          value={value.historyCoversPeriodSinceIncorporation}
          onChange={(next) => set('historyCoversPeriodSinceIncorporation', next)}
        />
        {value.historyCoversPeriodSinceIncorporation !== 'yes' ? (
          <DateField
            id="history-start-date"
            label="History start date"
            value={value.historyStartDate}
            onChange={(next) => set('historyStartDate', next)}
            helper="The earliest date from which capital events are recorded here."
          />
        ) : null}
      </FieldGrid>

      <RepeatableList
        title="Capital events"
        description="Ordered automatically by event date. Each event's share movement builds the running total below."
        addLabel="Add capital event"
        count={value.capitalEvents.length}
        emptyMessage="No capital event recorded yet."
        onAdd={() => set('capitalEvents', [...value.capitalEvents, createEmptyCapitalEvent()])}
      >
        {value.capitalEvents.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={eventTypeLabel(item.eventType)}
            subtitle={item.eventDate ? formatDate(item.eventDate) : 'Event date not set'}
            requiresConfirmation={hasRecordData([
              item.eventDate,
              item.eventType,
              item.numberOfShares,
              item.totalConsiderationAmount,
            ])}
            confirmMessage="Remove this capital event? The running share total will be recalculated."
            onRemove={() => set('capitalEvents', removeAt(value.capitalEvents, index))}
          >
            <FieldGrid>
              <DateField
                id={`capital-event-${index}-date`}
                label="Event date"
                required
                value={item.eventDate}
                onChange={(next) => setEvent(index, 'eventDate', next)}
              />
              <SelectField
                id={`capital-event-${index}-type`}
                label="Event type"
                required
                value={item.eventType}
                onChange={(next) => setEvent(index, 'eventType', next as CapitalEvent['eventType'])}
                options={capitalEventTypeOptions}
              />
              <SelectField
                id={`capital-event-${index}-security-type`}
                label="Security type"
                value={item.securityType}
                onChange={(next) =>
                  setEvent(index, 'securityType', next as CapitalEvent['securityType'])
                }
                options={securityTypeOptions}
                helper="Only equity events move the running equity total."
              />
              <DecimalInputField
                id={`capital-event-${index}-shares`}
                label="Number of shares"
                value={item.numberOfShares}
                onChange={(next) => setEvent(index, 'numberOfShares', next)}
              />
              <DecimalInputField
                id={`capital-event-${index}-face-value`}
                label="Face value per share (₹)"
                value={item.faceValuePerShare}
                onChange={(next) => setEvent(index, 'faceValuePerShare', next)}
              />
              <DecimalInputField
                id={`capital-event-${index}-issue-price`}
                label="Issue price per share (₹)"
                value={item.issuePricePerShare}
                onChange={(next) => setEvent(index, 'issuePricePerShare', next)}
              />
              <DecimalInputField
                id={`capital-event-${index}-premium`}
                label="Premium per share (₹)"
                value={item.premiumPerShare}
                onChange={(next) => setEvent(index, 'premiumPerShare', next)}
              />
              <DecimalInputField
                id={`capital-event-${index}-consideration-amount`}
                label="Total consideration (₹)"
                value={item.totalConsiderationAmount}
                onChange={(next) => setEvent(index, 'totalConsiderationAmount', next)}
              />
              <SelectField
                id={`capital-event-${index}-consideration-type`}
                label="Consideration type"
                value={item.considerationType}
                onChange={(next) =>
                  setEvent(index, 'considerationType', next as CapitalEvent['considerationType'])
                }
                options={considerationTypeOptions}
              />
              <DecimalInputField
                id={`capital-event-${index}-allottees`}
                label="Number of allottees"
                value={item.numberOfAllottees}
                onChange={(next) => setEvent(index, 'numberOfAllottees', next)}
              />
              {RATIO_EVENT_TYPES.has(item.eventType) ? (
                <>
                  <DecimalInputField
                    id={`capital-event-${index}-ratio-from`}
                    label="Ratio — from (shares)"
                    value={item.splitOrConsolidationRatioFrom}
                    onChange={(next) => setEvent(index, 'splitOrConsolidationRatioFrom', next)}
                  />
                  <DecimalInputField
                    id={`capital-event-${index}-ratio-to`}
                    label="Ratio — to (shares)"
                    value={item.splitOrConsolidationRatioTo}
                    onChange={(next) => setEvent(index, 'splitOrConsolidationRatioTo', next)}
                  />
                  <DecimalInputField
                    id={`capital-event-${index}-pre-face-value`}
                    label="Pre-event face value (₹)"
                    value={item.preEventFaceValuePerShare}
                    onChange={(next) => setEvent(index, 'preEventFaceValuePerShare', next)}
                  />
                  <DecimalInputField
                    id={`capital-event-${index}-post-face-value`}
                    label="Post-event face value (₹)"
                    value={item.postEventFaceValuePerShare}
                    onChange={(next) => setEvent(index, 'postEventFaceValuePerShare', next)}
                  />
                </>
              ) : null}
              <TernaryField
                id={`capital-event-${index}-promoter-allotment`}
                label="Includes promoter allotment"
                value={item.includesPromoterAllotment}
                onChange={(next) => setEvent(index, 'includesPromoterAllotment', next)}
              />
              {item.includesPromoterAllotment === 'yes' ? (
                <DecimalInputField
                  id={`capital-event-${index}-promoter-shares`}
                  label="Promoter shares in this event"
                  value={item.promoterSharesInEvent}
                  onChange={(next) => setEvent(index, 'promoterSharesInEvent', next)}
                />
              ) : null}
              <TernaryField
                id={`capital-event-${index}-related-party`}
                label="Related-party allotment"
                value={item.isRelatedPartyAllotment}
                onChange={(next) => setEvent(index, 'isRelatedPartyAllotment', next)}
              />
              <SelectField
                id={`capital-event-${index}-resolution-type`}
                label="Resolution type"
                value={item.resolutionType}
                onChange={(next) =>
                  setEvent(index, 'resolutionType', next as CapitalEvent['resolutionType'])
                }
                options={resolutionTypeOptions}
              />
              <DateField
                id={`capital-event-${index}-resolution-date`}
                label="Resolution date"
                value={item.resolutionDate}
                onChange={(next) => setEvent(index, 'resolutionDate', next)}
              />
              <TextInputField
                id={`capital-event-${index}-resolution-reference`}
                label="Resolution reference"
                value={item.resolutionReference}
                onChange={(next) => setEvent(index, 'resolutionReference', next)}
              />
              <TextInputField
                id={`capital-event-${index}-form-filed`}
                label="Form filed with RoC"
                value={item.formFiledWithRoc}
                onChange={(next) => setEvent(index, 'formFiledWithRoc', next)}
                placeholder="PAS-3, SH-7, …"
              />
              <TextInputField
                id={`capital-event-${index}-srn`}
                label="Filing SRN"
                value={item.filingSrn}
                onChange={(next) => setEvent(index, 'filingSrn', next)}
              />
              <DateField
                id={`capital-event-${index}-filing-date`}
                label="Filing date"
                value={item.filingDate}
                onChange={(next) => setEvent(index, 'filingDate', next)}
              />
              <TernaryField
                id={`capital-event-${index}-roc-complete`}
                label="RoC filing completed"
                value={item.rocFilingCompleted}
                onChange={(next) => setEvent(index, 'rocFilingCompleted', next)}
              />
              <TernaryField
                id={`capital-event-${index}-valuation`}
                label="Valuation report obtained"
                value={item.valuationReportObtained}
                onChange={(next) => setEvent(index, 'valuationReportObtained', next)}
              />
              {item.valuationReportObtained === 'yes' ? (
                <>
                  <TextInputField
                    id={`capital-event-${index}-valuer`}
                    label="Valuer name"
                    value={item.valuerName}
                    onChange={(next) => setEvent(index, 'valuerName', next)}
                  />
                  <DateField
                    id={`capital-event-${index}-valuation-date`}
                    label="Valuation date"
                    value={item.valuationDate}
                    onChange={(next) => setEvent(index, 'valuationDate', next)}
                  />
                </>
              ) : null}
              <TextInputField
                id={`capital-event-${index}-document-reference`}
                label="Supporting document reference"
                value={item.supportingDocumentReference}
                onChange={(next) => setEvent(index, 'supportingDocumentReference', next)}
              />
              <TextInputField
                id={`capital-event-${index}-lock-in`}
                label="Lock-in implication"
                value={item.lockInImplication}
                onChange={(next) => setEvent(index, 'lockInImplication', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`capital-event-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setEvent(index, 'description', next)}
            />
            <TextAreaField
              id={`capital-event-${index}-allottees-description`}
              label="Allottees description"
              rows={2}
              value={item.alloteesDescription}
              onChange={(next) => setEvent(index, 'alloteesDescription', next)}
            />
            {item.considerationType === 'other-than-cash' ||
            item.considerationType === 'part-cash-part-other' ? (
              <TextAreaField
                id={`capital-event-${index}-consideration-details`}
                label="Consideration details"
                rows={2}
                value={item.considerationDetails}
                onChange={(next) => setEvent(index, 'considerationDetails', next)}
              />
            ) : null}
            <TextAreaField
              id={`capital-event-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setEvent(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      {history.rows.length > 0 ? (
        <SubSection
          title="Running capital position"
          description="Derived from the events above, oldest first. A blank cumulative figure means an event is missing a type, a share count or a ratio."
        >
          <TableScroll>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    #
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Event
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Share change
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Cumulative shares
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Cumulative paid-up
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Warnings
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.rows.map((row) => (
                  <tr key={row.eventId}>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.sequence}</td>
                    <td className="px-3 py-2">{formatDate(row.eventDate)}</td>
                    <td className="px-3 py-2">{eventTypeLabel(row.eventType)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.sharesDelta)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.cumulativeEquityShares)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoneyCompact(row.cumulativePaidUpCapital)}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {row.warnings.length === 0 ? EM_DASH : row.warnings.join(' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </SubSection>
      ) : null}

      <SubSection title="Completeness and recent-issue questions">
        <FieldGrid>
          <TernaryField
            id="history-allotments-documented"
            label="All historical allotments documented"
            required
            value={value.allHistoricalAllotmentsDocumented}
            onChange={(next) => set('allHistoricalAllotmentsDocumented', next)}
          />
          <TernaryField
            id="history-reconciled-mca"
            label="History reconciled with MCA filings"
            required
            value={value.historyReconciledWithMcaFilings}
            onChange={(next) => set('historyReconciledWithMcaFilings', next)}
          />
          <TernaryField
            id="history-reconciled-register"
            label="History reconciled with the register of members"
            value={value.historyReconciledWithRegisterOfMembers}
            onChange={(next) => set('historyReconciledWithRegisterOfMembers', next)}
          />
          <TernaryField
            id="history-bonus-twelve-months"
            label="Bonus issue in the last twelve months"
            required
            value={value.bonusIssueInLastTwelveMonths}
            onChange={(next) => set('bonusIssueInLastTwelveMonths', next)}
          />
          {value.bonusIssueInLastTwelveMonths === 'yes' ? (
            <TernaryField
              id="history-bonus-revaluation"
              label="Bonus issued out of revaluation reserves"
              value={value.bonusIssueOutOfRevaluationReserves}
              onChange={(next) => set('bonusIssueOutOfRevaluationReserves', next)}
            />
          ) : null}
          <TernaryField
            id="history-other-than-cash"
            label="Shares issued for consideration other than cash in the last twelve months"
            required
            value={value.sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths}
            onChange={(next) =>
              set('sharesIssuedForConsiderationOtherThanCashInLastTwelveMonths', next)
            }
          />
          <TernaryField
            id="history-different-prices"
            label="Shares issued at different prices in the last twelve months"
            value={value.sharesIssuedAtDifferentPricesInLastTwelveMonths}
            onChange={(next) => set('sharesIssuedAtDifferentPricesInLastTwelveMonths', next)}
          />
          <TernaryField
            id="history-pending-allotments"
            label="Any pending allotments"
            required
            value={value.anyPendingAllotments}
            onChange={(next) => set('anyPendingAllotments', next)}
          />
          {value.anyPendingAllotments === 'yes' ? (
            <DecimalInputField
              id="history-share-application-money"
              label="Share application money pending allotment (₹)"
              value={value.shareApplicationMoneyPendingAllotment}
              onChange={(next) => set('shareApplicationMoneyPendingAllotment', next)}
            />
          ) : null}
        </FieldGrid>

        {value.allHistoricalAllotmentsDocumented === 'no' ? (
          <TextAreaField
            id="history-gaps-explanation"
            label="Gaps in history — explanation"
            required
            value={value.gapsInHistoryExplanation}
            onChange={(next) => set('gapsInHistoryExplanation', next)}
          />
        ) : null}
        {value.historyReconciledWithMcaFilings === 'no' ||
        value.historyReconciledWithRegisterOfMembers === 'no' ? (
          <TextAreaField
            id="history-reconciliation-difference"
            label="Reconciliation difference — explanation"
            value={value.reconciliationDifferenceExplanation}
            onChange={(next) => set('reconciliationDifferenceExplanation', next)}
          />
        ) : null}
        {value.sharesIssuedAtDifferentPricesInLastTwelveMonths === 'yes' ? (
          <TextAreaField
            id="history-differential-pricing"
            label="Differential pricing — explanation"
            value={value.differentialPricingExplanation}
            onChange={(next) => set('differentialPricingExplanation', next)}
          />
        ) : null}
        {value.anyPendingAllotments === 'yes' ? (
          <TextAreaField
            id="history-pending-allotment-details"
            label="Pending allotments — details"
            required
            value={value.pendingAllotmentDetails}
            onChange={(next) => set('pendingAllotmentDetails', next)}
          />
        ) : null}
      </SubSection>

      <TextAreaField
        id="history-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Closing equity shares"
          value={formatShares(history.closingEquityShares)}
        />
        <ComputedStat
          label="Closing paid-up capital"
          value={formatMoneyCompact(history.closingPaidUpEquityCapital)}
        />
        <ComputedStat label="Total shares issued" value={formatShares(history.totalSharesIssued)} />
        <ComputedStat
          label="Total shares reduced"
          value={formatShares(history.totalSharesReduced)}
        />
        <ComputedStat label="Bonus shares issued" value={formatShares(history.bonusSharesIssued)} />
        <ComputedStat
          label="Issued other than for cash"
          value={formatShares(history.sharesIssuedForConsiderationOtherThanCash)}
        />
        <ComputedStat
          label="Promoter shares allotted"
          value={formatShares(history.promoterSharesAllotted)}
        />
        <ComputedStat
          label="Consideration received"
          value={formatMoneyCompact(history.totalConsiderationReceived)}
        />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
