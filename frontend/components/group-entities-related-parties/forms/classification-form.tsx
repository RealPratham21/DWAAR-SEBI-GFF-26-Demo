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
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useGroupEntities } from '@/lib/group-entities-related-parties/context';
import {
  createEmptyEntityClassificationRecord,
  createEmptyIcdrGroupCompanyDetermination,
  createEmptyMaterialSubsidiaryPurposeRecord,
  createEmptyMaterialityCriterionRecord,
} from '@/lib/group-entities-related-parties/defaults';
import { formatEntityLabel } from '@/lib/group-entities-related-parties/entities';
import {
  CLASSIFICATION_READINESS_OPTIONS,
  CURRENT_HISTORICAL_OPTIONS,
  ICDR_GROUP_COMPANY_STATE_OPTIONS,
  ICDR_IDENTIFICATION_BASIS_OPTIONS,
  MATERIALITY_METRIC_OPTIONS,
  MATERIAL_SUBSIDIARY_PURPOSE_OPTIONS,
  PROFESSIONAL_CONFIRMATION_OPTIONS,
  REGULATORY_CLASSIFICATION_OPTIONS,
  STANDALONE_CONSOLIDATED_OPTIONS,
  THRESHOLD_TYPE_OPTIONS,
} from '@/lib/group-entities-related-parties/options';
import type {
  ClassificationReadinessState,
  CurrentHistorical,
  EntityClassificationRecord,
  GroupCompanyAndMaterialityClassification,
  GroupCompanyMaterialityPolicy,
  IcdrGroupCompanyDetermination,
  IcdrGroupCompanyState,
  IcdrIdentificationBasis,
  MaterialSubsidiaryPurpose,
  MaterialSubsidiaryPurposeRecord,
  MaterialityCriterionRecord,
  MaterialityMetricType,
  ProfessionalConfirmationStatus,
  RegulatoryClassificationType,
  StandaloneConsolidated,
  ThresholdType,
} from '@/lib/schemas/group-entities-related-parties';

const SECTION_ID = 'group-company-and-materiality-classification' as const;

export function ClassificationForm() {
  const { payload, updateSection } = useGroupEntities();
  const value = payload.groupCompanyAndMaterialityClassification;

  const set = <K extends keyof GroupCompanyAndMaterialityClassification>(
    key: K,
    next: GroupCompanyAndMaterialityClassification[K],
  ) => {
    updateSection('groupCompanyAndMaterialityClassification', { ...value, [key]: next }, SECTION_ID);
  };

  const setClassifications = (next: EntityClassificationRecord[]) => set('entityClassifications', next);

  const setClassification = <K extends keyof EntityClassificationRecord>(
    index: number,
    key: K,
    next: EntityClassificationRecord[K],
  ) => {
    setClassifications(
      replaceAt(value.entityClassifications, index, { ...value.entityClassifications[index], [key]: next }),
    );
  };

  const setIcdr = (next: IcdrGroupCompanyDetermination[]) =>
    set('icdrGroupCompanyDeterminations', next);

  const setIcdrRecord = <K extends keyof IcdrGroupCompanyDetermination>(
    index: number,
    key: K,
    next: IcdrGroupCompanyDetermination[K],
  ) => {
    setIcdr(replaceAt(value.icdrGroupCompanyDeterminations, index, { ...value.icdrGroupCompanyDeterminations[index], [key]: next }));
  };

  const setPolicy = <K extends keyof GroupCompanyMaterialityPolicy>(
    key: K,
    next: GroupCompanyMaterialityPolicy[K],
  ) => {
    set('materialityPolicy', { ...value.materialityPolicy, [key]: next });
  };

  const setCriteria = (next: MaterialityCriterionRecord[]) => set('materialityCriteria', next);

  const setCriterion = <K extends keyof MaterialityCriterionRecord>(
    index: number,
    key: K,
    next: MaterialityCriterionRecord[K],
  ) => {
    setCriteria(replaceAt(value.materialityCriteria, index, { ...value.materialityCriteria[index], [key]: next }));
  };

  const setMaterialSubsidiary = (next: MaterialSubsidiaryPurposeRecord[]) =>
    set('materialSubsidiaryPurposeRecords', next);

  const setMaterialSubsidiaryRecord = <K extends keyof MaterialSubsidiaryPurposeRecord>(
    index: number,
    key: K,
    next: MaterialSubsidiaryPurposeRecord[K],
  ) => {
    setMaterialSubsidiary(
      replaceAt(value.materialSubsidiaryPurposeRecords, index, {
        ...value.materialSubsidiaryPurposeRecords[index],
        [key]: next,
      }),
    );
  };

  const icdrTernaries = [
    ['isCompany', 'Is a company'],
    ['isPromoter', 'Is a promoter'],
    ['isCurrentSubsidiary', 'Is a current subsidiary'],
    ['rptsDuringRelevantPeriods', 'RPTs during relevant periods'],
    ['includedInAccountingStandardRptDisclosures', 'Included in accounting-standard RPT disclosures'],
    ['boardConsidersMaterial', 'Board considers material'],
  ] as const;

  return (
    <SectionCard
      title="Group Company & Materiality Classification"
      description="Regulatory classifications, ICDR Group Company determination and Materiality Policy."
    >
      <RepeatableList
        title="Entity classifications"
        description="Regulatory classification records linked to Entity Master entities."
        addLabel="Add classification"
        onAdd={() => setClassifications([...value.entityClassifications, createEmptyEntityClassificationRecord()])}
        emptyMessage="No entity classifications recorded yet."
        count={value.entityClassifications.length}
      >
        {value.entityClassifications.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={
              formatEntityLabel(
                payload.groupStructureAndEntityMaster.entities.find((e) => e.id === record.entityId),
                record.entityId,
              ) || `Classification ${index + 1}`
            }
            subtitle={record.classificationType || undefined}
            onRemove={() => setClassifications(removeAt(value.entityClassifications, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`cls-${record.id}-entity`}
                label="Entity"
                value={record.entityId}
                onChange={(next) => setClassification(index, 'entityId', next)}
                payload={payload}
              />
              <SelectField
                id={`cls-${record.id}-type`}
                label="Classification type"
                value={record.classificationType}
                onChange={(next) =>
                  setClassification(index, 'classificationType', next as RegulatoryClassificationType | '')
                }
                options={REGULATORY_CLASSIFICATION_OPTIONS}
              />
              <SelectField
                id={`cls-${record.id}-current-historical`}
                label="Current / historical"
                value={record.currentHistorical}
                onChange={(next) =>
                  setClassification(index, 'currentHistorical', next as CurrentHistorical | '')
                }
                options={CURRENT_HISTORICAL_OPTIONS}
              />
              <DecimalInputField
                id={`cls-${record.id}-ownership`}
                label="Ownership %"
                value={record.ownershipPercent}
                onChange={(next) => setClassification(index, 'ownershipPercent', next)}
              />
              <DecimalInputField
                id={`cls-${record.id}-voting`}
                label="Voting %"
                value={record.votingPercent}
                onChange={(next) => setClassification(index, 'votingPercent', next)}
              />
              <SelectField
                id={`cls-${record.id}-readiness`}
                label="Readiness state"
                value={record.readinessState}
                onChange={(next) =>
                  setClassification(index, 'readinessState', next as ClassificationReadinessState | '')
                }
                options={CLASSIFICATION_READINESS_OPTIONS}
              />
              <SelectField
                id={`cls-${record.id}-prof-confirm`}
                label="Professional confirmation"
                value={record.professionalConfirmationStatus}
                onChange={(next) =>
                  setClassification(
                    index,
                    'professionalConfirmationStatus',
                    next as ProfessionalConfirmationStatus | '',
                  )
                }
                options={PROFESSIONAL_CONFIRMATION_OPTIONS}
              />
            </FieldGrid>
            <FieldGrid>
              <TextAreaField
                id={`cls-${record.id}-basis`}
                label="Basis"
                rows={2}
                value={record.basis}
                onChange={(next) => setClassification(index, 'basis', next)}
              />
              <TextAreaField
                id={`cls-${record.id}-control-basis`}
                label="Control / significant influence basis"
                rows={2}
                value={record.controlSignificantInfluenceBasis}
                onChange={(next) => setClassification(index, 'controlSignificantInfluenceBasis', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="ICDR Group Company determinations"
        description="One determination row per entity — add or remove rows by entity."
        addLabel="Add ICDR determination"
        onAdd={() =>
          setIcdr([...value.icdrGroupCompanyDeterminations, createEmptyIcdrGroupCompanyDetermination()])
        }
        emptyMessage="No ICDR Group Company determinations recorded yet."
        count={value.icdrGroupCompanyDeterminations.length}
      >
        {value.icdrGroupCompanyDeterminations.map((record, index) => (
          <RepeatableCard
            key={record.entityId || `icdr-${index}`}
            title={
              formatEntityLabel(
                payload.groupStructureAndEntityMaster.entities.find((e) => e.id === record.entityId),
                record.entityId,
              ) || `ICDR determination ${index + 1}`
            }
            subtitle={record.classificationState || undefined}
            onRemove={() => setIcdr(removeAt(value.icdrGroupCompanyDeterminations, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`icdr-${index}-entity`}
                label="Entity"
                value={record.entityId}
                onChange={(next) => setIcdrRecord(index, 'entityId', next)}
                payload={payload}
              />
              <SelectField
                id={`icdr-${index}-state`}
                label="Classification state"
                value={record.classificationState}
                onChange={(next) =>
                  setIcdrRecord(index, 'classificationState', next as IcdrGroupCompanyState | '')
                }
                options={ICDR_GROUP_COMPANY_STATE_OPTIONS}
              />
              <SelectField
                id={`icdr-${index}-basis`}
                label="Identification basis"
                value={record.identificationBasis}
                onChange={(next) =>
                  setIcdrRecord(index, 'identificationBasis', next as IcdrIdentificationBasis | '')
                }
                options={ICDR_IDENTIFICATION_BASIS_OPTIONS}
              />
            </FieldGrid>
            <FieldGrid columns={3}>
              {icdrTernaries.map(([key, label]) => (
                <TernaryField
                  key={key}
                  id={`icdr-${index}-${key}`}
                  label={label}
                  value={record[key]}
                  onChange={(next) => setIcdrRecord(index, key, next)}
                />
              ))}
            </FieldGrid>
            <FieldGrid columns={3}>
              <TextInputField
                id={`icdr-${index}-periods`}
                label="Relevant reporting periods"
                value={record.relevantReportingPeriods}
                onChange={(next) => setIcdrRecord(index, 'relevantReportingPeriods', next)}
              />
              <TextInputField
                id={`icdr-${index}-first-identified`}
                label="Date first identified"
                type="date"
                value={record.dateFirstIdentified}
                onChange={(next) => setIcdrRecord(index, 'dateFirstIdentified', next)}
              />
              <TextInputField
                id={`icdr-${index}-board-ref`}
                label="Board reference"
                value={record.boardReference}
                onChange={(next) => setIcdrRecord(index, 'boardReference', next)}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection title="Materiality policy" description="Board-adopted Group Company materiality policy.">
        <FieldGrid columns={3}>
          <TernaryField
            id="mat-policy-exists"
            label="Policy exists"
            value={value.materialityPolicy.policyExists}
            onChange={(next) => setPolicy('policyExists', next)}
          />
          <TernaryField
            id="mat-policy-adopted"
            label="Adopted"
            value={value.materialityPolicy.adopted}
            onChange={(next) => setPolicy('adopted', next)}
          />
          <TextInputField
            id="mat-policy-adoption-date"
            label="Adoption date"
            type="date"
            value={value.materialityPolicy.adoptionDate}
            onChange={(next) => setPolicy('adoptionDate', next)}
          />
          <TextInputField
            id="mat-policy-board-ref"
            label="Board resolution reference"
            value={value.materialityPolicy.boardResolutionReference}
            onChange={(next) => setPolicy('boardResolutionReference', next)}
          />
          <TextInputField
            id="mat-policy-effective"
            label="Effective date"
            type="date"
            value={value.materialityPolicy.effectiveDate}
            onChange={(next) => setPolicy('effectiveDate', next)}
          />
          <TextInputField
            id="mat-policy-reviewed"
            label="Last reviewed"
            type="date"
            value={value.materialityPolicy.lastReviewed}
            onChange={(next) => setPolicy('lastReviewed', next)}
          />
          <TextInputField
            id="mat-policy-version"
            label="Policy version"
            value={value.materialityPolicy.policyVersion}
            onChange={(next) => setPolicy('policyVersion', next)}
          />
          <SelectField
            id="mat-policy-prof-review"
            label="Professional review status"
            value={value.materialityPolicy.professionalReviewStatus}
            onChange={(next) =>
              setPolicy('professionalReviewStatus', next as ProfessionalConfirmationStatus | '')
            }
            options={PROFESSIONAL_CONFIRMATION_OPTIONS}
          />
        </FieldGrid>
        <TextAreaField
          id="mat-policy-notes"
          label="Policy notes"
          rows={2}
          value={value.materialityPolicy.notes}
          onChange={(next) => setPolicy('notes', next)}
        />
      </SubSection>

      <RepeatableList
        title="Materiality criteria"
        description="Quantitative and qualitative thresholds from the materiality policy."
        addLabel="Add criterion"
        onAdd={() => setCriteria([...value.materialityCriteria, createEmptyMaterialityCriterionRecord()])}
        emptyMessage="No materiality criteria recorded yet."
        count={value.materialityCriteria.length}
      >
        {value.materialityCriteria.map((criterion, index) => (
          <RepeatableCard
            key={criterion.id}
            title={criterion.metricType || `Criterion ${index + 1}`}
            onRemove={() => setCriteria(removeAt(value.materialityCriteria, index))}
          >
            <FieldGrid columns={3}>
              <SelectField
                id={`mc-${criterion.id}-metric`}
                label="Metric type"
                value={criterion.metricType}
                onChange={(next) =>
                  setCriterion(index, 'metricType', next as MaterialityMetricType | '')
                }
                options={MATERIALITY_METRIC_OPTIONS}
              />
              <SelectField
                id={`mc-${criterion.id}-threshold-type`}
                label="Threshold type"
                value={criterion.thresholdType}
                onChange={(next) => setCriterion(index, 'thresholdType', next as ThresholdType | '')}
                options={THRESHOLD_TYPE_OPTIONS}
              />
              <DecimalInputField
                id={`mc-${criterion.id}-threshold-value`}
                label="Threshold value"
                value={criterion.thresholdValue}
                onChange={(next) => setCriterion(index, 'thresholdValue', next)}
              />
              <TextInputField
                id={`mc-${criterion.id}-period`}
                label="Measurement period"
                value={criterion.measurementPeriod}
                onChange={(next) => setCriterion(index, 'measurementPeriod', next)}
              />
              <SelectField
                id={`mc-${criterion.id}-basis`}
                label="Standalone / consolidated basis"
                value={criterion.standaloneConsolidatedBasis}
                onChange={(next) =>
                  setCriterion(index, 'standaloneConsolidatedBasis', next as StandaloneConsolidated | '')
                }
                options={STANDALONE_CONSOLIDATED_OPTIONS}
              />
            </FieldGrid>
            <TextAreaField
              id={`mc-${criterion.id}-methodology`}
              label="Calculation methodology"
              rows={2}
              value={criterion.calculationMethodology}
              onChange={(next) => setCriterion(index, 'calculationMethodology', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Material subsidiary purpose records"
        description="Purpose-specific material subsidiary assessments (LODR, publication, tax, etc.)."
        addLabel="Add purpose record"
        onAdd={() =>
          setMaterialSubsidiary([
            ...value.materialSubsidiaryPurposeRecords,
            createEmptyMaterialSubsidiaryPurposeRecord(),
          ])
        }
        emptyMessage="No material subsidiary purpose records yet."
        count={value.materialSubsidiaryPurposeRecords.length}
      >
        {value.materialSubsidiaryPurposeRecords.map((record, index) => (
          <RepeatableCard
            key={record.id}
            title={
              formatEntityLabel(
                payload.groupStructureAndEntityMaster.entities.find((e) => e.id === record.entityId),
                record.entityId,
              ) || `Purpose record ${index + 1}`
            }
            subtitle={record.purpose || undefined}
            onRemove={() => setMaterialSubsidiary(removeAt(value.materialSubsidiaryPurposeRecords, index))}
          >
            <FieldGrid columns={3}>
              <EntityPicker
                id={`msp-${record.id}-entity`}
                label="Entity"
                value={record.entityId}
                onChange={(next) => setMaterialSubsidiaryRecord(index, 'entityId', next)}
                payload={payload}
              />
              <SelectField
                id={`msp-${record.id}-purpose`}
                label="Purpose"
                value={record.purpose}
                onChange={(next) =>
                  setMaterialSubsidiaryRecord(index, 'purpose', next as MaterialSubsidiaryPurpose | '')
                }
                options={MATERIAL_SUBSIDIARY_PURPOSE_OPTIONS}
              />
              <TextInputField
                id={`msp-${record.id}-period`}
                label="Relevant period"
                value={record.relevantPeriod}
                onChange={(next) => setMaterialSubsidiaryRecord(index, 'relevantPeriod', next)}
              />
              <TextInputField
                id={`msp-${record.id}-result`}
                label="Result"
                value={record.result}
                onChange={(next) => setMaterialSubsidiaryRecord(index, 'result', next)}
              />
              <SelectField
                id={`msp-${record.id}-prof-confirm`}
                label="Professional confirmation"
                value={record.professionalConfirmation}
                onChange={(next) =>
                  setMaterialSubsidiaryRecord(
                    index,
                    'professionalConfirmation',
                    next as ProfessionalConfirmationStatus | '',
                  )
                }
                options={PROFESSIONAL_CONFIRMATION_OPTIONS}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <GroupEntitiesSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
