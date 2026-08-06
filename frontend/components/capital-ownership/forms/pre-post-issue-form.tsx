'use client';

import { useMemo } from 'react';
import {
  ComputedStat,
  DecimalInputField,
  FieldGrid,
  PendingWorkstreamNotice,
  ReferenceValue,
  SelectField,
  StatGrid,
  SubSection,
  TableScroll,
  TernaryField,
  TextAreaField,
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
import { createEmptyShareholderOfferOverlay } from '@/lib/capital-ownership/defaults';
import {
  EM_DASH,
  formatMoneyCompact,
  formatPercent,
  formatPricePerShare,
  formatShares,
} from '@/lib/capital-ownership/format';
import { PROPOSED_OFFER_TYPE_LABELS } from '@/lib/ipo-setup/options';
import type {
  PreAndPostIssueOwnership,
  ShareholderOfferOverlay,
} from '@/lib/capital-ownership/types';

const SECTION_ID = 'pre-post-issue-ownership' as const;

function offerTypeLabel(offerType: string): string {
  if (!offerType) return EM_DASH;
  return (
    PROPOSED_OFFER_TYPE_LABELS[offerType as keyof typeof PROPOSED_OFFER_TYPE_LABELS] ?? offerType
  );
}

export function PrePostIssueForm() {
  const { payload, updateSection, model, ipoReference, isLoading } = useCapitalOwnership();
  const value = payload.preAndPostIssueOwnership;
  const prePost = model.prePost;
  const dilution = model.dilution;

  const shareholderOptions = useMemo(
    () =>
      payload.shareholdersAndBeneficialOwnership.shareholders.map((item, index) => ({
        value: item.id,
        label: item.name || `Shareholder ${index + 1}`,
      })),
    [payload.shareholdersAndBeneficialOwnership.shareholders],
  );

  const set = <K extends keyof PreAndPostIssueOwnership>(
    key: K,
    next: PreAndPostIssueOwnership[K],
  ) => {
    updateSection('preAndPostIssueOwnership', { ...value, [key]: next }, SECTION_ID);
  };

  const setOverlay = <K extends keyof ShareholderOfferOverlay>(
    index: number,
    key: K,
    next: ShareholderOfferOverlay[K],
  ) => {
    set(
      'shareholderOverlays',
      replaceAt(value.shareholderOverlays, index, {
        ...value.shareholderOverlays[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Pre & Post-Issue Ownership"
      description="Offer-for-sale intentions and expected transfers. An offer for sale changes ownership, never share capital — only a fresh issue and recorded pre-issue allotments increase the post-issue count."
    >
      <SubSection
        title="IPO Setup & Eligibility reference"
        description="Read-only mirror of the linked workstream. Capital & Ownership never writes back to it."
      >
        {isLoading ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Loading offer inputs from IPO Setup & Eligibility…
          </p>
        ) : ipoReference.available ? (
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ReferenceValue
              label="Proposed offer type"
              value={offerTypeLabel(ipoReference.proposedOfferType)}
            />
            <ReferenceValue
              label="Face value per share"
              value={formatPricePerShare(ipoReference.faceValuePerEquityShare)}
            />
            <ReferenceValue
              label="Existing issued shares"
              value={formatShares(ipoReference.existingIssuedEquityShares)}
            />
            <ReferenceValue
              label="Existing paid-up capital"
              value={formatMoneyCompact(ipoReference.existingPaidUpEquityShareCapital)}
            />
            <ReferenceValue
              label="Proposed issue price"
              value={formatPricePerShare(ipoReference.proposedIssuePrice)}
            />
            <ReferenceValue
              label="Fresh issue shares"
              value={formatShares(ipoReference.proposedFreshIssueShares)}
            />
            <ReferenceValue
              label="Fresh issue amount"
              value={formatMoneyCompact(ipoReference.proposedFreshIssueAmount)}
            />
            <ReferenceValue
              label="Offer-for-sale shares"
              value={formatShares(ipoReference.proposedOfsShares)}
            />
          </dl>
        ) : (
          <PendingWorkstreamNotice message="Pending linked workstream — offer sizing is governed by IPO Setup & Eligibility, which is not available yet. Pre and post-issue figures below stay indicative." />
        )}
      </SubSection>

      <RepeatableList
        title="Offer-for-sale and expected transfers"
        description="Link each entry to a shareholder recorded in Shareholders & Beneficial Ownership."
        addLabel="Add shareholder overlay"
        count={value.shareholderOverlays.length}
        emptyMessage="No offer-for-sale or expected transfer recorded yet."
        onAdd={() =>
          set('shareholderOverlays', [
            ...value.shareholderOverlays,
            createEmptyShareholderOfferOverlay(),
          ])
        }
      >
        {value.shareholderOverlays.map((item, index) => {
          const linked = payload.shareholdersAndBeneficialOwnership.shareholders.find(
            (shareholder) => shareholder.id === item.shareholderId,
          );
          return (
            <RepeatableCard
              key={item.id}
              title={linked?.name || `Overlay ${index + 1}`}
              subtitle={
                linked
                  ? `Currently holds ${formatShares(linked.equitySharesHeld)} equity shares`
                  : 'Not linked to a shareholder'
              }
              requiresConfirmation={hasRecordData([
                item.shareholderId,
                item.sharesOfferedForSale,
                item.otherExpectedPreIssueTransfer,
              ])}
              confirmMessage="Remove this overlay? The pre/post-issue view will be recalculated."
              onRemove={() =>
                set('shareholderOverlays', removeAt(value.shareholderOverlays, index))
              }
            >
              <FieldGrid>
                <SelectField
                  id={`overlay-${index}-shareholder`}
                  label="Shareholder"
                  required
                  value={item.shareholderId}
                  onChange={(next) => setOverlay(index, 'shareholderId', next)}
                  options={shareholderOptions}
                  emptyLabel="Select a shareholder…"
                />
                <DecimalInputField
                  id={`overlay-${index}-ofs-shares`}
                  label="Shares offered for sale"
                  value={item.sharesOfferedForSale}
                  onChange={(next) => setOverlay(index, 'sharesOfferedForSale', next)}
                />
                <DecimalInputField
                  id={`overlay-${index}-other-transfer`}
                  label="Other expected pre-issue transfer"
                  value={item.otherExpectedPreIssueTransfer}
                  onChange={(next) => setOverlay(index, 'otherExpectedPreIssueTransfer', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`overlay-${index}-notes`}
                label="Notes"
                rows={2}
                value={item.notes}
                onChange={(next) => setOverlay(index, 'notes', next)}
              />
            </RepeatableCard>
          );
        })}
      </RepeatableList>

      <SubSection
        title="Expected pre-issue movements"
        description="Only these movements and the fresh issue change the post-issue share count."
      >
        <FieldGrid>
          <DecimalInputField
            id="pre-post-fresh-issue-override"
            label="Fresh issue shares — override"
            value={value.freshIssueSharesOverride}
            onChange={(next) => set('freshIssueSharesOverride', next)}
            helper="Leave blank to use the fresh-issue size from IPO Setup & Eligibility."
          />
          {value.freshIssueSharesOverride ? (
            <TextAreaField
              id="pre-post-fresh-issue-override-reason"
              label="Reason for the override"
              rows={2}
              value={value.freshIssueOverrideReason}
              onChange={(next) => set('freshIssueOverrideReason', next)}
            />
          ) : null}
          <DecimalInputField
            id="pre-post-placement-shares"
            label="Expected pre-IPO placement shares"
            value={value.expectedPreIpoPlacementShares}
            onChange={(next) => set('expectedPreIpoPlacementShares', next)}
          />
          <DecimalInputField
            id="pre-post-conversion-shares"
            label="Expected conversion shares before the issue"
            value={value.expectedConversionSharesBeforeIssue}
            onChange={(next) => set('expectedConversionSharesBeforeIssue', next)}
          />
          <DecimalInputField
            id="pre-post-esop-shares"
            label="Expected ESOP allotment shares before the issue"
            value={value.expectedEsopAllotmentSharesBeforeIssue}
            onChange={(next) => set('expectedEsopAllotmentSharesBeforeIssue', next)}
          />
        </FieldGrid>
      </SubSection>

      {prePost.rows.length > 0 ? (
        <SubSection
          title="Pre and post-issue cap table"
          description="Post-issue percentages assume the fresh issue is allotted to new public shareholders."
        >
          <TableScroll>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Shareholder
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Pre-issue shares
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Pre-issue %
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Offered for sale
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Other transfers
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Post-issue shares
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Post-issue %
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Dilution (pp)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prePost.rows.map((row) => (
                  <tr key={row.shareholderId} className={row.offerExceedsHolding ? 'bg-destructive/5' : undefined}>
                    <td className="px-3 py-2">{row.name || EM_DASH}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.preIssueShares)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatPercent(row.preIssuePercentage)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.sharesOfferedForSale)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.otherExpectedPreIssueTransfer)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatShares(row.postIssueShares)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatPercent(row.postIssuePercentage)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatPercent(row.dilutionPercentagePoints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </SubSection>
      ) : null}

      {prePost.issues.length > 0 ? (
        <SubSection
          title="Points to review"
          description="Indicative observations from the entered quantities — not conclusions."
        >
          <ul className="space-y-1 text-sm text-muted-foreground">
            {prePost.issues.map((issue) => (
              <li key={issue.id} className="flex gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
                  {issue.severity}
                </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </SubSection>
      ) : null}

      <SubSection title="Offer confirmations">
        <FieldGrid>
          <TernaryField
            id="pre-post-lead-manager"
            label="Pre-issue capital confirmed with the lead manager"
            required
            value={value.preIssueCapitalConfirmedWithLeadManager}
            onChange={(next) => set('preIssueCapitalConfirmedWithLeadManager', next)}
          />
          <TernaryField
            id="pre-post-consents"
            label="Selling shareholder consents obtained"
            required
            value={value.sellingShareholderConsentsObtained}
            onChange={(next) => set('sellingShareholderConsentsObtained', next)}
          />
          {value.sellingShareholderConsentsObtained === 'yes' ? (
            <TernaryField
              id="pre-post-eligibility"
              label="Selling shareholder eligibility confirmed"
              value={value.sellingShareholderEligibilityConfirmed}
              onChange={(next) => set('sellingShareholderEligibilityConfirmed', next)}
            />
          ) : null}
          <TernaryField
            id="pre-post-holding-period"
            label="Offer-for-sale shares held for the required period"
            value={value.offerForSaleSharesHeldForRequiredPeriod}
            onChange={(next) => set('offerForSaleSharesHeldForRequiredPeriod', next)}
          />
          <TernaryField
            id="pre-post-expected-transfers"
            label="Any expected pre-issue transfers"
            required
            value={value.anyExpectedPreIssueTransfers}
            onChange={(next) => set('anyExpectedPreIssueTransfers', next)}
          />
        </FieldGrid>
        {value.anyExpectedPreIssueTransfers === 'yes' ? (
          <TextAreaField
            id="pre-post-transfer-details"
            label="Expected pre-issue transfers — details"
            required
            value={value.expectedPreIssueTransferDetails}
            onChange={(next) => set('expectedPreIssueTransferDetails', next)}
          />
        ) : null}
      </SubSection>

      <TextAreaField
        id="pre-post-notes"
        label="Notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed (not persisted)">
        <ComputedStat
          label="Adjusted pre-issue shares"
          value={formatShares(prePost.adjustedPreIssueShares)}
        />
        <ComputedStat label="Fresh issue shares" value={formatShares(prePost.freshIssueShares)} />
        <ComputedStat
          label="Shares offered for sale"
          value={formatShares(prePost.totalSharesOfferedForSale)}
        />
        <ComputedStat label="Post-issue shares" value={formatShares(prePost.postIssueShares)} />
        <ComputedStat
          label="Promoter pre-issue"
          value={formatPercent(dilution.promoterPreIssuePercentage)}
        />
        <ComputedStat
          label="Promoter post-issue"
          value={formatPercent(dilution.promoterPostIssuePercentage)}
        />
        <ComputedStat
          label="Promoter dilution (pp)"
          value={formatPercent(dilution.promoterDilutionPercentagePoints)}
        />
        <ComputedStat
          label="Post-issue paid-up capital"
          value={formatMoneyCompact(dilution.postIssuePaidUpCapital)}
        />
      </StatGrid>

      <CapitalOwnershipSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
