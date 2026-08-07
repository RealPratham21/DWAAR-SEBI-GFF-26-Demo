'use client';

import {
  EntityPicker,
  FieldGrid,
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
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import { createEmptyRelationshipChangeRecord } from '@/lib/group-entities-related-parties/defaults';
import { formatEntityLabel } from '@/lib/group-entities-related-parties/entities';
import {
  GROUP_ENTITIES_CONFIRMATION_FIELDS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  RELATIONSHIP_CHANGE_EVENT_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  ChangesRptReadinessAndConfirmations,
  GroupCompanyClassificationReview,
  GroupEntitiesConfirmations,
  ProfessionalConfirmationStatus,
  RelationshipChangeEvent,
  RelationshipChangeRecord,
  RptReadiness,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'changes-rpt-readiness-and-confirmations' as const;

const classificationReviewFields = [
  ['allRptEntitiesReviewed', 'All RPT entities reviewed'],
  ['subsidiariesHandledSeparately', 'Subsidiaries handled separately'],
  ['promotersHandledSeparately', 'Promoters handled separately'],
  ['boardMaterialEntitiesConsidered', 'Board material entities considered'],
  ['materialityPolicyApplied', 'Materiality policy applied'],
  ['boardFinalListApproved', 'Board final list approved'],
] as const;

const rptReadinessTernaries = [
  ['completeRptScheduleAvailable', 'Complete RPT schedule available'],
  ['reconciledWithRestatedFinancialInformation', 'Reconciled with restated financial information'],
  ['outstandingBalancesReconciled', 'Outstanding balances reconciled'],
  ['commitmentsIncluded', 'Commitments included'],
  ['guaranteesSecurityIncluded', 'Guarantees/security included'],
  ['nonCashTransactionsIncluded', 'Non-cash transactions included'],
  ['kmpCompensationIncluded', 'KMP compensation included'],
  ['historicalRelatedPartiesIncluded', 'Historical related parties included'],
  ['approvalsMapped', 'Approvals mapped'],
  ['pendingAuditCommitteeAction', 'Pending audit committee action'],
  ['pendingBoardAction', 'Pending board action'],
  ['pendingShareholderAction', 'Pending shareholder action'],
] as const;

export function ChangesConfirmationsForm() {
  const { payload, updateSection } = useGroupEntities();
  const value = payload.changesRptReadinessAndConfirmations;

  const set = <K extends keyof ChangesRptReadinessAndConfirmations>(
    key: K,
    next: ChangesRptReadinessAndConfirmations[K],
  ) => {
    updateSection('changesRptReadinessAndConfirmations', { ...value, [key]: next }, SECTION_ID);
  };

  const setChanges = (next: RelationshipChangeRecord[]) => set('relationshipChanges', next);

  const setChange = <K extends keyof RelationshipChangeRecord>(
    index: number,
    key: K,
    next: RelationshipChangeRecord[K],
  ) => {
    setChanges(replaceAt(value.relationshipChanges, index, { ...value.relationshipChanges[index], [key]: next }));
  };

  const setReview = <K extends keyof GroupCompanyClassificationReview>(
    key: K,
    next: GroupCompanyClassificationReview[K],
  ) => {
    set('groupCompanyClassificationReview', { ...value.groupCompanyClassificationReview, [key]: next });
  };

  const setRptReadiness = <K extends keyof RptReadiness>(key: K, next: RptReadiness[K]) => {
    set('rptReadiness', { ...value.rptReadiness, [key]: next });
  };

  const setConfirmations = <K extends keyof GroupEntitiesConfirmations>(
    key: K,
    next: GroupEntitiesConfirmations[K],
  ) => {
    set('confirmations', { ...value.confirmations, [key]: next });
  };

  return (
    <SectionCard
      title="Changes, RPT Readiness & Confirmations"
      description="Relationship changes, RPT readiness checklist and issuer confirmations."
    >
      <RepeatableList
        title="Relationship changes"
        description="Register of changes in group structure, control and related-party status."
        addLabel="Add relationship change"
        onAdd={() => setChanges([...value.relationshipChanges, createEmptyRelationshipChangeRecord()])}
        emptyMessage="No relationship changes recorded yet."
        count={value.relationshipChanges.length}
      >
        {value.relationshipChanges.map((change, index) => (
          <RepeatableCard
            key={change.id}
            title={change.eventType || `Change ${index + 1}`}
            subtitle={change.eventDate || undefined}
            onRemove={() => setChanges(removeAt(value.relationshipChanges, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`rc-${change.id}-entity`}
                label="Entity"
                value={change.entityId}
                onChange={(next) => setChange(index, 'entityId', next)}
                payload={payload}
              />
              <SelectField
                id={`rc-${change.id}-event-type`}
                label="Event type"
                value={change.eventType}
                onChange={(next) => setChange(index, 'eventType', next as RelationshipChangeEvent | '')}
                options={RELATIONSHIP_CHANGE_EVENT_OPTIONS}
              />
              <TextInputField
                id={`rc-${change.id}-event-date`}
                label="Event date"
                type="date"
                value={change.eventDate}
                onChange={(next) => setChange(index, 'eventDate', next)}
              />
              <TextInputField
                id={`rc-${change.id}-previous`}
                label="Previous relationship"
                value={change.previousRelationship}
                onChange={(next) => setChange(index, 'previousRelationship', next)}
              />
              <TextInputField
                id={`rc-${change.id}-new`}
                label="New relationship"
                value={change.newRelationship}
                onChange={(next) => setChange(index, 'newRelationship', next)}
              />
              <TernaryField
                id={`rc-${change.id}-transaction`}
                label="Transaction involved"
                value={change.transactionInvolved}
                onChange={(next) => setChange(index, 'transactionInvolved', next)}
              />
              <TernaryField
                id={`rc-${change.id}-board-ack`}
                label="Board acknowledgement"
                value={change.boardAcknowledgement}
                onChange={(next) => setChange(index, 'boardAcknowledgement', next)}
              />
              <SelectField
                id={`rc-${change.id}-prof-confirm`}
                label="Professional confirmation"
                value={change.professionalConfirmation}
                onChange={(next) =>
                  setChange(index, 'professionalConfirmation', next as ProfessionalConfirmationStatus | '')
                }
                options={PROFESSIONAL_CONFIRMATION_OPTIONS}
              />
            </FieldGrid>
            <TextAreaField
              id={`rc-${change.id}-reason`}
              label="Reason"
              rows={2}
              value={change.reason}
              onChange={(next) => setChange(index, 'reason', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Group company classification review">
        <FieldGrid columns={3}>
          {classificationReviewFields.map(([key, label]) => (
            <TernaryField
              key={key}
              id={`gccr-${key}`}
              label={label}
              value={value.groupCompanyClassificationReview[key]}
              onChange={(next) => setReview(key, next)}
            />
          ))}
          <TextInputField
            id="gccr-review-date"
            label="Review date"
            type="date"
            value={value.groupCompanyClassificationReview.reviewDate}
            onChange={(next) => setReview('reviewDate', next)}
          />
          <SelectField
            id="gccr-mb-confirm"
            label="Merchant banker professional confirmation"
            value={value.groupCompanyClassificationReview.merchantBankerProfessionalConfirmation}
            onChange={(next) =>
              setReview(
                'merchantBankerProfessionalConfirmation',
                next as ProfessionalConfirmationStatus | '',
              )
            }
            options={PROFESSIONAL_CONFIRMATION_OPTIONS}
          />
        </FieldGrid>
        <TextAreaField
          id="gccr-notes"
          label="Review notes"
          rows={2}
          value={value.groupCompanyClassificationReview.notes}
          onChange={(next) => setReview('notes', next)}
        />
      </SubSection>

      <SubSection title="RPT readiness">
        <FieldGrid columns={3}>
          {rptReadinessTernaries.map(([key, label]) => (
            <TernaryField
              key={key}
              id={`rpt-ready-${key}`}
              label={label}
              value={value.rptReadiness[key]}
              onChange={(next) => setRptReadiness(key, next)}
            />
          ))}
          <SelectField
            id="rpt-ready-prof-confirm"
            label="Professional confirmation"
            value={value.rptReadiness.professionalConfirmation}
            onChange={(next) =>
              setRptReadiness('professionalConfirmation', next as ProfessionalConfirmationStatus | '')
            }
            options={PROFESSIONAL_CONFIRMATION_OPTIONS}
          />
        </FieldGrid>
        <TextAreaField
          id="rpt-ready-notes"
          label="RPT readiness notes"
          rows={2}
          value={value.rptReadiness.notes}
          onChange={(next) => setRptReadiness('notes', next)}
        />
      </SubSection>

      <SubSection title="Issuer confirmations" description="Management confirmations for group structure and RPT completeness.">
        <FieldGrid columns={2}>
          {GROUP_ENTITIES_CONFIRMATION_FIELDS.map(({ key, label }) => (
            <TernaryField
              key={key}
              id={`confirm-${key}`}
              label={label}
              value={value.confirmations[key]}
              onChange={(next) => setConfirmations(key, next)}
            />
          ))}
        </FieldGrid>
      </SubSection>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
