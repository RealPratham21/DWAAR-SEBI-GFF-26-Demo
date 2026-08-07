'use client';

import {
  asEnumValue,
  ComputedStat,
  FieldGrid,
  IntermediarySelect,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/intermediaries-filing/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/intermediaries-filing/repeatable-card';
import { IntermediariesFilingSectionActions } from '@/components/intermediaries-filing/section-actions';
import { useIntermediariesFiling } from '@/lib/intermediaries-filing/context';
import {
  createEmptyAllotmentSummaryRecord,
  createEmptyPostIssueActionRecord,
  createEmptySubscriptionRowRecord,
} from '@/lib/intermediaries-filing/defaults';
import { isStageAtLeast } from '@/lib/intermediaries-filing/rules';
import { computePreliminaryTPlus3 } from '@/lib/intermediaries-filing/working-days';
import {
  INVESTOR_CATEGORY_OPTIONS,
  POST_ISSUE_ACTION_STATUS_OPTIONS,
  POST_ISSUE_ACTION_TYPE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/intermediaries-filing/options';
import type {
  InvestorCategory,
  IssueProgrammeAllotmentListingAndPostIssueExecution,
  PostIssueActionStatus,
  PostIssueActionType,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/intermediaries-filing';

const SECTION_ID = 'issue-programme-allotment-listing-and-post-issue-execution' as const;

export function IssueProgrammeForm() {
  const { payload, model, updateSection } = useIntermediariesFiling();
  const value = payload.issueProgrammeAllotmentListingAndPostIssueExecution;
  const filingStage = payload.issueConfigurationAndFilingSnapshot.filingSnapshot.filingStage;
  const tPlus3 = computePreliminaryTPlus3(value.issueCalendar.issueClosingDate);

  const set = (next: IssueProgrammeAllotmentListingAndPostIssueExecution) => {
    updateSection('issueProgrammeAllotmentListingAndPostIssueExecution', next, SECTION_ID);
  };

  const setCalendar = (
    patch: Partial<IssueProgrammeAllotmentListingAndPostIssueExecution['issueCalendar']>,
  ) => set({ ...value, issueCalendar: { ...value.issueCalendar, ...patch } });

  const setOpeningReadiness = (
    patch: Partial<IssueProgrammeAllotmentListingAndPostIssueExecution['issueOpeningReadiness']>,
  ) => set({ ...value, issueOpeningReadiness: { ...value.issueOpeningReadiness, ...patch } });

  const setSubscriptionRows = (
    subscriptionRows: IssueProgrammeAllotmentListingAndPostIssueExecution['subscriptionRows'],
  ) => set({ ...value, subscriptionRows });

  const setSubscriptionRow = (
    index: number,
    next: IssueProgrammeAllotmentListingAndPostIssueExecution['subscriptionRows'][number],
  ) => setSubscriptionRows(replaceAt(value.subscriptionRows, index, next));

  const setBasis = (
    patch: Partial<IssueProgrammeAllotmentListingAndPostIssueExecution['basisOfAllotment']>,
  ) => set({ ...value, basisOfAllotment: { ...value.basisOfAllotment, ...patch } });

  const setAllotmentSummaries = (
    allotmentSummaries: IssueProgrammeAllotmentListingAndPostIssueExecution['allotmentSummaries'],
  ) => set({ ...value, allotmentSummaries });

  const setAllotmentSummary = (
    index: number,
    next: IssueProgrammeAllotmentListingAndPostIssueExecution['allotmentSummaries'][number],
  ) => setAllotmentSummaries(replaceAt(value.allotmentSummaries, index, next));

  const setFunds = (
    patch: Partial<IssueProgrammeAllotmentListingAndPostIssueExecution['fundsUnblocking']>,
  ) => set({ ...value, fundsUnblocking: { ...value.fundsUnblocking, ...patch } });

  const setDemat = (
    patch: Partial<IssueProgrammeAllotmentListingAndPostIssueExecution['dematCredit']>,
  ) => set({ ...value, dematCredit: { ...value.dematCredit, ...patch } });

  const setListing = (
    patch: Partial<IssueProgrammeAllotmentListingAndPostIssueExecution['listing']>,
  ) => set({ ...value, listing: { ...value.listing, ...patch } });

  const setPostIssueActions = (
    postIssueActions: IssueProgrammeAllotmentListingAndPostIssueExecution['postIssueActions'],
  ) => set({ ...value, postIssueActions });

  const setPostIssueAction = (
    index: number,
    next: IssueProgrammeAllotmentListingAndPostIssueExecution['postIssueActions'][number],
  ) => setPostIssueActions(replaceAt(value.postIssueActions, index, next));

  const subscriptionLabel = isStageAtLeast(filingStage, 'issue_closed')
    ? 'Subscription (post close)'
    : 'Subscription (pre-close planning)';
  const allotmentLabel = isStageAtLeast(filingStage, 'allotment')
    ? 'Allotment & basis'
    : 'Allotment & basis (not yet due until post-close)';
  const listingLabel = isStageAtLeast(filingStage, 'listing_application')
    ? 'Listing & trading'
    : 'Listing & trading (not yet due)';

  return (
    <SectionCard
      title="Issue Programme, Allotment, Listing & Post-Issue Execution"
      description="Issue calendar, subscription/allotment, funds/unblocking, demat credit, listing and post-issue actions."
    >
      <SubSection title="Issue calendar">
        <FieldGrid columns={3}>
          <TextInputField
            id="issue-opening-date"
            label="Issue opening date"
            type="date"
            value={value.issueCalendar.issueOpeningDate}
            onChange={(next) => setCalendar({ issueOpeningDate: next })}
          />
          <TextInputField
            id="issue-closing-date"
            label="Issue closing date (T)"
            type="date"
            value={value.issueCalendar.issueClosingDate}
            onChange={(next) => setCalendar({ issueClosingDate: next })}
          />
          <TextInputField
            id="anchor-date"
            label="Anchor date"
            type="date"
            value={value.issueCalendar.anchorDate}
            onChange={(next) => setCalendar({ anchorDate: next })}
          />
          <TextInputField
            id="basis-of-allotment-target"
            label="Basis of allotment target"
            type="date"
            value={value.issueCalendar.basisOfAllotmentTarget}
            onChange={(next) => setCalendar({ basisOfAllotmentTarget: next })}
          />
          <TextInputField
            id="listing-trading-date"
            label="Listing / trading date (target)"
            type="date"
            value={value.issueCalendar.listingTradingDate}
            onChange={(next) => setCalendar({ listingTradingDate: next })}
          />
        </FieldGrid>
        <div className="mt-4 rounded-md border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">Preliminary T+3 schedule (read-only)</p>
          <p className="mt-1 text-xs text-muted-foreground">{tPlus3.disclaimer}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <ComputedStat label="T (issue close)" value={tPlus3.t || '—'} />
            <ComputedStat label="T+1" value={tPlus3.tPlus1 || '—'} />
            <ComputedStat label="T+2" value={tPlus3.tPlus2 || '—'} />
            <ComputedStat label="T+3 (preliminary listing)" value={tPlus3.tPlus3 || '—'} />
          </div>
          {model.programmeAggregates.preliminaryTPlus3ListingDate ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Model preliminary listing date: {model.programmeAggregates.preliminaryTPlus3ListingDate}
            </p>
          ) : null}
        </div>
      </SubSection>

      <SubSection
        title="Issue opening readiness"
        description={
          isStageAtLeast(filingStage, 'issue_open')
            ? 'Pre-open checklist for issue launch.'
            : 'Becomes primary once filing stage reaches issue open.'
        }
      >
        <FieldGrid columns={3}>
          <TernaryField
            id="rhp-prospectus-ready"
            label="RHP / prospectus & RoC filing ready"
            value={value.issueOpeningReadiness.rhpProspectusRocFilingReady}
            onChange={(next) => setOpeningReadiness({ rhpProspectusRocFilingReady: next })}
          />
          <TernaryField
            id="pricing-finalized"
            label="Pricing finalized"
            value={value.issueOpeningReadiness.pricingFinalized}
            onChange={(next) => setOpeningReadiness({ pricingFinalized: next })}
          />
          <TernaryField
            id="registrar-ready"
            label="Registrar ready"
            value={value.issueOpeningReadiness.registrarReady}
            onChange={(next) => setOpeningReadiness({ registrarReady: next })}
          />
          <TernaryField
            id="sponsor-bank-ready"
            label="Sponsor Bank ready"
            value={value.issueOpeningReadiness.sponsorBankReady}
            onChange={(next) => setOpeningReadiness({ sponsorBankReady: next })}
          />
          <SelectField
            id="go-live-confirmation"
            label="Professional go-live confirmation"
            value={value.issueOpeningReadiness.professionalGoLiveConfirmation}
            onChange={(next) =>
              setOpeningReadiness({
                professionalGoLiveConfirmation: asEnumValue<ProfessionalConfirmationStatus>(next),
              })
            }
            options={[{ value: '', label: 'Select…' }, ...PROFESSIONAL_CONFIRMATION_OPTIONS]}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title={subscriptionLabel}
        addLabel="Add subscription row"
        onAdd={() =>
          setSubscriptionRows([...value.subscriptionRows, createEmptySubscriptionRowRecord()])
        }
        emptyMessage="No subscription rows recorded."
        count={value.subscriptionRows.length}
      >
        {value.subscriptionRows.map((row, index) => (
          <RepeatableCard
            key={row.subscriptionId}
            title={`Subscription ${index + 1}`}
            onRemove={() => setSubscriptionRows(removeAt(value.subscriptionRows, index))}
            removeLabel="Remove row"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`subscription-category-${index}`}
                label="Category"
                value={row.category}
                onChange={(next) =>
                  setSubscriptionRow(index, {
                    ...row,
                    category: asEnumValue<InvestorCategory>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...INVESTOR_CATEGORY_OPTIONS]}
              />
              <TextInputField
                id={`shares-offered-${index}`}
                label="Shares offered"
                value={row.sharesOffered}
                onChange={(next) => setSubscriptionRow(index, { ...row, sharesOffered: next })}
              />
              <TextInputField
                id={`valid-demand-${index}`}
                label="Valid demand"
                value={row.validDemand}
                onChange={(next) => setSubscriptionRow(index, { ...row, validDemand: next })}
              />
              <TextInputField
                id={`subscription-multiple-${index}`}
                label="Subscription multiple"
                value={row.subscriptionMultiple}
                onChange={(next) =>
                  setSubscriptionRow(index, { ...row, subscriptionMultiple: next })
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title={allotmentLabel}>
        <FieldGrid columns={3}>
          <TernaryField
            id="basis-prepared"
            label="Basis prepared"
            value={value.basisOfAllotment.basisPrepared}
            onChange={(next) => setBasis({ basisPrepared: next })}
          />
          <TernaryField
            id="exchange-approval-received"
            label="Exchange approval received"
            value={value.basisOfAllotment.exchangeApprovalReceived}
            onChange={(next) => setBasis({ exchangeApprovalReceived: next })}
          />
          <TernaryField
            id="allotment-finalized"
            label="Allotment finalized"
            value={value.basisOfAllotment.allotmentFinalized}
            onChange={(next) => setBasis({ allotmentFinalized: next })}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Allotment summaries"
        addLabel="Add allotment summary"
        onAdd={() =>
          setAllotmentSummaries([
            ...value.allotmentSummaries,
            createEmptyAllotmentSummaryRecord(),
          ])
        }
        emptyMessage="No allotment summaries recorded."
        count={value.allotmentSummaries.length}
      >
        {value.allotmentSummaries.map((summary, index) => (
          <RepeatableCard
            key={summary.allotmentId}
            title={`Allotment summary ${index + 1}`}
            onRemove={() => setAllotmentSummaries(removeAt(value.allotmentSummaries, index))}
            removeLabel="Remove summary"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`allotment-category-${index}`}
                label="Category"
                value={summary.category}
                onChange={(next) =>
                  setAllotmentSummary(index, {
                    ...summary,
                    category: asEnumValue<InvestorCategory>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...INVESTOR_CATEGORY_OPTIONS]}
              />
              <TextInputField
                id={`shares-allotted-${index}`}
                label="Shares allotted"
                value={summary.sharesAllotted}
                onChange={(next) => setAllotmentSummary(index, { ...summary, sharesAllotted: next })}
              />
              <TextInputField
                id={`number-of-allottees-${index}`}
                label="Number of allottees"
                value={summary.numberOfAllottees}
                onChange={(next) =>
                  setAllotmentSummary(index, { ...summary, numberOfAllottees: next })
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Funds & unblocking">
        <FieldGrid columns={3}>
          <TernaryField
            id="funds-received"
            label="Funds received"
            value={value.fundsUnblocking.fundsReceived}
            onChange={(next) => setFunds({ fundsReceived: next })}
          />
          <TernaryField
            id="non-allottee-unblock"
            label="Non-allottee unblock complete"
            value={value.fundsUnblocking.nonAllotteeUnblockComplete}
            onChange={(next) => setFunds({ nonAllotteeUnblockComplete: next })}
          />
          <TernaryField
            id="partial-allottee-unblock"
            label="Partial allottee unblock complete"
            value={value.fundsUnblocking.partialAllotteeUnblockComplete}
            onChange={(next) => setFunds({ partialAllotteeUnblockComplete: next })}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title="Demat credit">
        <FieldGrid columns={3}>
          <TernaryField
            id="shares-credited"
            label="Shares credited"
            value={value.dematCredit.sharesCredited}
            onChange={(next) => setDemat({ sharesCredited: next })}
          />
          <TextInputField
            id="demat-completion-date"
            label="Completion date"
            type="date"
            value={value.dematCredit.completionDate}
            onChange={(next) => setDemat({ completionDate: next })}
          />
        </FieldGrid>
      </SubSection>

      <SubSection title={listingLabel}>
        <FieldGrid columns={3}>
          <TernaryField
            id="listing-application-submitted"
            label="Final listing application submitted"
            value={value.listing.finalListingApplicationSubmitted}
            onChange={(next) => setListing({ finalListingApplicationSubmitted: next })}
          />
          <TernaryField
            id="trading-approval-received"
            label="Trading approval received"
            value={value.listing.tradingApprovalReceived}
            onChange={(next) => setListing({ tradingApprovalReceived: next })}
          />
          <TextInputField
            id="listing-date"
            label="Listing date"
            type="date"
            value={value.listing.listingDate}
            onChange={(next) => setListing({ listingDate: next })}
          />
          <TextInputField
            id="listing-completion-status"
            label="Listing completion status"
            value={value.listing.listingCompletionStatus}
            onChange={(next) => setListing({ listingCompletionStatus: next })}
          />
        </FieldGrid>
      </SubSection>

      <RepeatableList
        title="Post-issue actions"
        addLabel="Add post-issue action"
        onAdd={() =>
          setPostIssueActions([...value.postIssueActions, createEmptyPostIssueActionRecord()])
        }
        emptyMessage="No post-issue actions recorded."
        count={value.postIssueActions.length}
      >
        {value.postIssueActions.map((action, index) => (
          <RepeatableCard
            key={action.postIssueActionId}
            title={action.actionType.replaceAll('_', ' ') || `Action ${index + 1}`}
            onRemove={() => setPostIssueActions(removeAt(value.postIssueActions, index))}
            removeLabel="Remove action"
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`post-issue-type-${index}`}
                label="Action type"
                value={action.actionType}
                onChange={(next) =>
                  setPostIssueAction(index, {
                    ...action,
                    actionType: asEnumValue<PostIssueActionType>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...POST_ISSUE_ACTION_TYPE_OPTIONS]}
              />
              <SelectField
                id={`post-issue-status-${index}`}
                label="Status"
                value={action.status}
                onChange={(next) =>
                  setPostIssueAction(index, {
                    ...action,
                    status: asEnumValue<PostIssueActionStatus>(next),
                  })
                }
                options={[{ value: '', label: 'Select…' }, ...POST_ISSUE_ACTION_STATUS_OPTIONS]}
              />
              <IntermediarySelect
                id={`post-issue-responsible-${index}`}
                label="Responsible intermediary"
                value={action.responsibleIntermediaryId}
                onChange={(next) =>
                  setPostIssueAction(index, { ...action, responsibleIntermediaryId: next })
                }
                payload={payload}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <IntermediariesFilingSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
