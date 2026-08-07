'use client';

import { Plus } from 'lucide-react';
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
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { Button } from '@/components/ui/button';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import {
  createEmptyEntityFinancialPeriodSummary,
  createEmptyEntityFinancialReadinessRecord,
} from '@/lib/group-entities-related-parties/defaults';
import { formatEntityLabel } from '@/lib/group-entities-related-parties/entities';
import {
  AUDIT_STATUS_OPTIONS,
  ENTITY_INFORMATION_STATUS_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  AuditStatus,
  EntityFinancialPeriodSummary,
  EntityFinancialReadinessRecord,
  EntityInformationStatus,
  GroupEntityFinancialRegulatoryAndLitigationReadiness,
  ProfessionalConfirmationStatus,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'group-entity-financial-regulatory-and-litigation-readiness' as const;

const MAX_PERIOD_SUMMARIES = 3;

const regulatoryFlags = [
  ['negativeNetWorth', 'Negative net worth'],
  ['lossMaking', 'Loss making'],
  ['auditorQualification', 'Auditor qualification'],
  ['goingConcernConcern', 'Going concern concern'],
  ['materialDefault', 'Material default'],
  ['significantRptDependence', 'Significant RPT dependence'],
  ['materialIndebtednessToIssuer', 'Material indebtedness to issuer'],
  ['materialIndebtednessFromIssuer', 'Material indebtedness from issuer'],
  ['listed', 'Listed'],
  ['publicIssueMadeHistorically', 'Public issue made historically'],
  ['rightsIssuePrecedingThreeYears', 'Rights issue in preceding three years'],
  ['listingRefusedHistorically', 'Listing refused historically'],
  ['securitiesLawViolation', 'Securities law violation'],
  ['sebiExchangeProceeding', 'SEBI/exchange proceeding'],
  ['wilfulDefaulterConcern', 'Wilful defaulter concern'],
  ['fraudulentBorrowerConcern', 'Fraudulent borrower concern'],
  ['ibcProceeding', 'IBC proceeding'],
  ['windingUpPetition', 'Winding-up petition'],
  ['liquidation', 'Liquidation'],
  ['defunct', 'Defunct'],
  ['strikeOffApplication', 'Strike-off application'],
  ['struckOff', 'Struck off'],
  ['materialRocDefault', 'Material RoC default'],
] as const;

const informationFields = [
  ['financialInformationAvailable', 'Financial information available'],
  ['threePriorFinancialYearsAvailable', 'Three prior financial years available'],
  ['informationVerified', 'Information verified'],
  ['entityConfirmationReceived', 'Entity confirmation received'],
  ['informationRequested', 'Information requested'],
  ['informationReceived', 'Information received'],
  ['followUpRequired', 'Follow-up required'],
  ['publicInformationAvailable', 'Public information available'],
  ['exemptionReliefPotentiallyRequired', 'Exemption/relief potentially required'],
] as const;

export function FinancialReadinessForm() {
  const { payload, updateSection } = useGroupEntities();
  const value = payload.groupEntityFinancialRegulatoryAndLitigationReadiness;

  const set = <K extends keyof GroupEntityFinancialRegulatoryAndLitigationReadiness>(
    key: K,
    next: GroupEntityFinancialRegulatoryAndLitigationReadiness[K],
  ) => {
    updateSection('groupEntityFinancialRegulatoryAndLitigationReadiness', { ...value, [key]: next }, SECTION_ID);
  };

  const setReadiness = (next: EntityFinancialReadinessRecord[]) => set('entityFinancialReadiness', next);

  const setRecord = <K extends keyof EntityFinancialReadinessRecord>(
    index: number,
    key: K,
    next: EntityFinancialReadinessRecord[K],
  ) => {
    setReadiness(
      replaceAt(value.entityFinancialReadiness, index, { ...value.entityFinancialReadiness[index], [key]: next }),
    );
  };

  const setPeriodSummary = <K extends keyof EntityFinancialPeriodSummary>(
    recordIndex: number,
    periodIndex: number,
    key: K,
    next: EntityFinancialPeriodSummary[K],
  ) => {
    const record = value.entityFinancialReadiness[recordIndex];
    const summaries = replaceAt(record.financialPeriodSummaries, periodIndex, {
      ...record.financialPeriodSummaries[periodIndex],
      [key]: next,
    });
    setRecord(recordIndex, 'financialPeriodSummaries', summaries);
  };

  return (
    <SectionCard
      title="Group Entity Financial, Regulatory & Litigation Readiness"
      description="Lightweight due-diligence readiness for Group Companies and material entities."
    >
      <RepeatableList
        title="Entity financial readiness"
        description="Per-entity financial availability, regulatory flags and litigation summary."
        addLabel="Add entity readiness"
        onAdd={() => setReadiness([...value.entityFinancialReadiness, createEmptyEntityFinancialReadinessRecord()])}
        emptyMessage="No entity financial readiness records yet."
        count={value.entityFinancialReadiness.length}
      >
        {value.entityFinancialReadiness.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={
              formatEntityLabel(
                payload.groupStructureAndEntityMaster.entities.find((e) => e.id === record.entityId),
                record.entityId,
              ) || `Readiness ${index + 1}`
            }
            onRemove={() => setReadiness(removeAt(value.entityFinancialReadiness, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`efr-${record.id}-entity`}
                label="Entity"
                value={record.entityId}
                onChange={(next) => setRecord(index, 'entityId', next)}
                payload={payload}
              />
              <TextInputField
                id={`efr-${record.id}-latest-fy`}
                label="Latest audited financial year"
                value={record.latestAuditedFinancialYear}
                onChange={(next) => setRecord(index, 'latestAuditedFinancialYear', next)}
              />
              <SelectField
                id={`efr-${record.id}-audit-status`}
                label="Audit status"
                value={record.auditStatus}
                onChange={(next) => setRecord(index, 'auditStatus', next as AuditStatus | '')}
                options={AUDIT_STATUS_OPTIONS}
              />
              <TextInputField
                id={`efr-${record.id}-auditor`}
                label="Auditor"
                value={record.auditor}
                onChange={(next) => setRecord(index, 'auditor', next)}
              />
              <SelectField
                id={`efr-${record.id}-prof-review`}
                label="Professional review status"
                value={record.professionalReviewStatus}
                onChange={(next) =>
                  setRecord(index, 'professionalReviewStatus', next as ProfessionalConfirmationStatus | '')
                }
                options={PROFESSIONAL_CONFIRMATION_OPTIONS}
              />
              <SelectField
                id={`efr-${record.id}-info-status`}
                label="Information status"
                value={record.informationStatus}
                onChange={(next) =>
                  setRecord(index, 'informationStatus', next as EntityInformationStatus | '')
                }
                options={ENTITY_INFORMATION_STATUS_OPTIONS}
              />
            </FieldGrid>

            <SubSection
              title="Financial period summaries"
              description={`Up to ${MAX_PERIOD_SUMMARIES} period summaries per entity.`}
              actions={
                record.financialPeriodSummaries.length < MAX_PERIOD_SUMMARIES ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRecord(index, 'financialPeriodSummaries', [
                        ...record.financialPeriodSummaries,
                        createEmptyEntityFinancialPeriodSummary(),
                      ])
                    }
                  >
                    <Plus size={14} />
                    Add period
                  </Button>
                ) : null
              }
            >
              {record.financialPeriodSummaries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No period summaries added yet.</p>
              ) : (
                record.financialPeriodSummaries.map((period, periodIndex) => (
                  <div key={`${record.id}-period-${periodIndex}`} className="space-y-3 rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Period {periodIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRecord(
                            index,
                            'financialPeriodSummaries',
                            removeAt(record.financialPeriodSummaries, periodIndex),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <FieldGrid columns={3}>
                      <TextInputField
                        id={`efr-${record.id}-period-${periodIndex}-label`}
                        label="Period"
                        value={period.period}
                        onChange={(next) => setPeriodSummary(index, periodIndex, 'period', next)}
                      />
                      <DecimalInputField
                        id={`efr-${record.id}-period-${periodIndex}-nw`}
                        label="Net worth"
                        value={period.netWorth}
                        onChange={(next) => setPeriodSummary(index, periodIndex, 'netWorth', next)}
                      />
                      <DecimalInputField
                        id={`efr-${record.id}-period-${periodIndex}-revenue`}
                        label="Revenue / turnover"
                        value={period.revenueTurnover}
                        onChange={(next) => setPeriodSummary(index, periodIndex, 'revenueTurnover', next)}
                      />
                      <DecimalInputField
                        id={`efr-${record.id}-period-${periodIndex}-pat`}
                        label="Profit/loss after tax"
                        value={period.profitLossAfterTax}
                        onChange={(next) => setPeriodSummary(index, periodIndex, 'profitLossAfterTax', next)}
                      />
                      <SelectField
                        id={`efr-${record.id}-period-${periodIndex}-audited`}
                        label="Audited status"
                        value={period.auditedStatus}
                        onChange={(next) =>
                          setPeriodSummary(index, periodIndex, 'auditedStatus', next as AuditStatus | '')
                        }
                        options={AUDIT_STATUS_OPTIONS}
                      />
                      <TernaryField
                        id={`efr-${record.id}-period-${periodIndex}-qual`}
                        label="Auditor qualification present"
                        value={period.auditorQualificationPresent}
                        onChange={(next) => setPeriodSummary(index, periodIndex, 'auditorQualificationPresent', next)}
                      />
                    </FieldGrid>
                  </div>
                ))
              )}
            </SubSection>

            <SubSection title="Regulatory flags">
              <FieldGrid columns={3}>
                {regulatoryFlags.map(([key, label]) => (
                  <TernaryField
                    key={key}
                    id={`efr-${record.id}-${key}`}
                    label={label}
                    value={record[key]}
                    onChange={(next) => setRecord(index, key, next)}
                  />
                ))}
              </FieldGrid>
              <TextAreaField
                id={`efr-${record.id}-regulatory-explanation`}
                label="Regulatory explanation"
                rows={2}
                value={record.regulatoryExplanation}
                onChange={(next) => setRecord(index, 'regulatoryExplanation', next)}
              />
            </SubSection>

            <SubSection title="Litigation summary">
              <FieldGrid columns={3}>
                <TernaryField
                  id={`efr-${record.id}-litigation-exists`}
                  label="Material litigation exists"
                  value={record.materialLitigationExists}
                  onChange={(next) => setRecord(index, 'materialLitigationExists', next)}
                />
                <TextInputField
                  id={`efr-${record.id}-litigation-count`}
                  label="Litigation matter count"
                  value={record.litigationMatterCount}
                  onChange={(next) => setRecord(index, 'litigationMatterCount', next)}
                />
                <DecimalInputField
                  id={`efr-${record.id}-litigation-amount`}
                  label="Litigation aggregate amount"
                  value={record.litigationAggregateAmount}
                  onChange={(next) => setRecord(index, 'litigationAggregateAmount', next)}
                />
                <TernaryField
                  id={`efr-${record.id}-litigation-affect-issuer`}
                  label="Could materially affect issuer"
                  value={record.couldMateriallyAffectIssuer}
                  onChange={(next) => setRecord(index, 'couldMateriallyAffectIssuer', next)}
                />
                <TernaryField
                  id={`efr-${record.id}-litigation-complete`}
                  label="Litigation information complete"
                  value={record.litigationInformationComplete}
                  onChange={(next) => setRecord(index, 'litigationInformationComplete', next)}
                />
                <SelectField
                  id={`efr-${record.id}-litigation-prof`}
                  label="Litigation professional confirmation"
                  value={record.litigationProfessionalConfirmation}
                  onChange={(next) =>
                    setRecord(
                      index,
                      'litigationProfessionalConfirmation',
                      next as ProfessionalConfirmationStatus | '',
                    )
                  }
                  options={PROFESSIONAL_CONFIRMATION_OPTIONS}
                />
              </FieldGrid>
            </SubSection>

            <SubSection title="Information availability">
              <FieldGrid columns={3}>
                {informationFields.map(([key, label]) => (
                  <TernaryField
                    key={key}
                    id={`efr-${record.id}-${key}`}
                    label={label}
                    value={record[key]}
                    onChange={(next) => setRecord(index, key, next)}
                  />
                ))}
                <TextInputField
                  id={`efr-${record.id}-request-date`}
                  label="Request date"
                  type="date"
                  value={record.requestDate}
                  onChange={(next) => setRecord(index, 'requestDate', next)}
                />
                <TextInputField
                  id={`efr-${record.id}-website-url`}
                  label="Financial information website URL"
                  value={record.financialInformationWebsiteUrl}
                  onChange={(next) => setRecord(index, 'financialInformationWebsiteUrl', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`efr-${record.id}-disclosure-limitation`}
                label="Disclosure limitation"
                rows={2}
                value={record.disclosureLimitation}
                onChange={(next) => setRecord(index, 'disclosureLimitation', next)}
              />
            </SubSection>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
