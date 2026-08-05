'use client';

import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  ComputedStat,
  NumberInputField,
  SelectField,
  TextInputField,
} from '@/components/ipo-setup/form-helpers';
import { IpoSectionSaveActions } from '@/components/ipo-setup/section-save-actions';
import { useIpoSetup } from '@/lib/ipo-setup/context';
import {
  displayToRupees,
  formatPercent,
  formatRupeesCompact,
  formatShares,
  rupeesToDisplay,
} from '@/lib/ipo-setup/format';
import { issuePriceStatusOptions, yesNoNotSureOptions } from '@/lib/ipo-setup/options';
import type { OfferStructure } from '@/lib/schemas/ipo-setup';

function parseOptionalNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function OfferStructureForm() {
  const { payload, updateSection, offerComputations } = useIpoSetup();
  const value = payload.offerStructure;
  const unit = value.amountDisplayUnit;
  const { includesFreshIssue, includesOfs } = offerComputations;

  const set = <K extends keyof OfferStructure>(key: K, next: OfferStructure[K]) => {
    updateSection('offerStructure', { ...value, [key]: next }, 'offer-structure');
  };

  const showPrice =
    value.proposedIssuePriceStatus === 'indicative' ||
    value.proposedIssuePriceStatus === 'finalised-internally';

  return (
    <SectionCard
      title="Proposed Offer Structure"
      description="Equity shares only for v1. Amounts are stored in rupees; choose ₹ lakh or ₹ crore for entry."
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium text-foreground">Amount unit</p>
        {(['lakh', 'crore'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => set('amountDisplayUnit', option)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              unit === option
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            ₹ {option}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <NumberInputField
          id="faceValuePerEquityShare"
          label="Face value per equity share (₹)"
          required
          value={value.faceValuePerEquityShare?.toString() ?? ''}
          onChange={(raw) => set('faceValuePerEquityShare', parseOptionalNumber(raw))}
        />
        <NumberInputField
          id="existingIssuedEquityShares"
          label="Existing issued equity shares"
          required
          value={value.existingIssuedEquityShares?.toString() ?? ''}
          onChange={(raw) => set('existingIssuedEquityShares', parseOptionalNumber(raw))}
        />
        <NumberInputField
          id="existingPaidUpEquityShareCapital"
          label={`Existing paid-up equity share capital (₹ ${unit})`}
          required
          value={rupeesToDisplay(value.existingPaidUpEquityShareCapital, unit)}
          onChange={(raw) => set('existingPaidUpEquityShareCapital', displayToRupees(raw, unit))}
        />
        <SelectField
          id="proposedIssuePriceStatus"
          label="Proposed issue-price status"
          required
          value={value.proposedIssuePriceStatus}
          onChange={(next) =>
            set('proposedIssuePriceStatus', next as OfferStructure['proposedIssuePriceStatus'])
          }
          options={issuePriceStatusOptions}
        />
        {showPrice ? (
          <NumberInputField
            id="proposedIssuePrice"
            label="Proposed issue price (₹)"
            value={value.proposedIssuePrice?.toString() ?? ''}
            onChange={(raw) => set('proposedIssuePrice', parseOptionalNumber(raw))}
          />
        ) : null}
      </div>

      {includesFreshIssue ? (
        <div className="space-y-4 rounded-md border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">Fresh issue</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <NumberInputField
              id="proposedFreshIssueShares"
              label="Proposed fresh-issue shares"
              value={value.proposedFreshIssueShares?.toString() ?? ''}
              onChange={(raw) => set('proposedFreshIssueShares', parseOptionalNumber(raw))}
            />
            <NumberInputField
              id="proposedFreshIssueAmount"
              label={`Proposed fresh-issue amount (₹ ${unit})`}
              value={rupeesToDisplay(value.proposedFreshIssueAmount, unit)}
              onChange={(raw) => set('proposedFreshIssueAmount', displayToRupees(raw, unit))}
            />
            <SelectField
              id="preIpoPlacementBeingConsidered"
              label="Pre-IPO placement being considered"
              value={value.preIpoPlacementBeingConsidered}
              onChange={(next) =>
                set(
                  'preIpoPlacementBeingConsidered',
                  next as OfferStructure['preIpoPlacementBeingConsidered'],
                )
              }
              options={yesNoNotSureOptions}
            />
            {value.preIpoPlacementBeingConsidered === 'yes' ? (
              <NumberInputField
                id="proposedPreIpoPlacementAmount"
                label={`Proposed pre-IPO placement amount (₹ ${unit})`}
                value={rupeesToDisplay(value.proposedPreIpoPlacementAmount, unit)}
                onChange={(raw) =>
                  set('proposedPreIpoPlacementAmount', displayToRupees(raw, unit))
                }
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {includesOfs ? (
        <div className="space-y-4 rounded-md border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">Offer for sale</h4>
          <p className="text-xs text-muted-foreground">
            OFS does not increase post-issue paid-up capital.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <NumberInputField
              id="proposedOfsShares"
              label="Proposed OFS shares"
              value={value.proposedOfsShares?.toString() ?? ''}
              onChange={(raw) => set('proposedOfsShares', parseOptionalNumber(raw))}
            />
            <NumberInputField
              id="proposedOfsAmount"
              label={`Proposed OFS amount (₹ ${unit})`}
              value={rupeesToDisplay(value.proposedOfsAmount, unit)}
              onChange={(raw) => set('proposedOfsAmount', displayToRupees(raw, unit))}
            />
            <NumberInputField
              id="numberOfSellingShareholders"
              label="Number of selling shareholders"
              value={value.numberOfSellingShareholders?.toString() ?? ''}
              onChange={(raw) => set('numberOfSellingShareholders', parseOptionalNumber(raw))}
            />
            <SelectField
              id="sellerConsentsObtained"
              label="Seller consents obtained"
              value={value.sellerConsentsObtained}
              onChange={(next) =>
                set('sellerConsentsObtained', next as OfferStructure['sellerConsentsObtained'])
              }
              options={yesNoNotSureOptions}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="employeeReservationPlanned"
          label="Employee reservation planned"
          value={value.employeeReservationPlanned}
          onChange={(next) =>
            set('employeeReservationPlanned', next as OfferStructure['employeeReservationPlanned'])
          }
          options={yesNoNotSureOptions}
        />
        <SelectField
          id="existingShareholderReservationPlanned"
          label="Existing-shareholder reservation planned"
          value={value.existingShareholderReservationPlanned}
          onChange={(next) =>
            set(
              'existingShareholderReservationPlanned',
              next as OfferStructure['existingShareholderReservationPlanned'],
            )
          }
          options={yesNoNotSureOptions}
        />
        <TextInputField
          id="marketMakerReservationStatus"
          label="Market-maker reservation / status"
          value={value.marketMakerReservationStatus}
          onChange={(next) => set('marketMakerReservationStatus', next)}
        />
        <TextInputField
          id="otherReservationNotes"
          label="Other reservation"
          value={value.otherReservationNotes}
          onChange={(next) => set('otherReservationNotes', next)}
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-foreground">Computed (not persisted)</h4>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <ComputedStat
            label="Total shares offered"
            value={formatShares(offerComputations.totalSharesOffered)}
          />
          <ComputedStat
            label="Total offer amount"
            value={formatRupeesCompact(offerComputations.totalOfferAmount)}
          />
          <ComputedStat
            label="Fresh issue % of offer"
            value={formatPercent(offerComputations.freshIssuePercentageOfOffer)}
          />
          <ComputedStat
            label="OFS % of offer"
            value={formatPercent(offerComputations.ofsPercentageOfOffer)}
          />
          <ComputedStat
            label="Post-issue shares"
            value={formatShares(offerComputations.proposedPostIssueShares)}
          />
          <ComputedStat
            label="Post-issue paid-up capital"
            value={formatRupeesCompact(offerComputations.proposedPostIssuePaidUpCapital)}
          />
          <ComputedStat
            label="Offer % of post-issue capital"
            value={formatPercent(offerComputations.offerAsPercentageOfPostIssueCapital)}
          />
          <ComputedStat
            label="Paid-up increase from offer"
            value={formatRupeesCompact(offerComputations.paidUpCapitalIncreaseFromOffer)}
          />
        </div>
      </div>

      <IpoSectionSaveActions sectionId="offer-structure" />
    </SectionCard>
  );
}
