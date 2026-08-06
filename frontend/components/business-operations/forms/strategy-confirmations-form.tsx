'use client';

import {
  CheckboxField,
  FieldGrid,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/business-operations/form-helpers';
import {
  hasRecordData,
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/business-operations/repeatable-card';
import { BusinessOperationsSectionActions } from '@/components/business-operations/section-actions';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import { useBusinessOperations } from '@/lib/business-operations/context';
import {
  createEmptyCompetitiveStrength,
  createEmptyKeyDependency,
  createEmptyStrategyItem,
} from '@/lib/business-operations/defaults';
import {
  BUSINESS_OPERATIONS_CONFIRMATION_FIELDS,
  DEPENDENCY_TYPE_OPTIONS,
  MATERIALITY_STATUS_OPTIONS,
  PROFESSIONAL_REVIEW_STATUS_OPTIONS,
  STRATEGY_CATEGORY_OPTIONS,
  STRATEGY_STATUS_OPTIONS,
  STRATEGY_TIME_HORIZON_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  CompetitiveStrength,
  CompetitiveStrengthsStrategyDependenciesAndConfirmations,
  KeyDependency,
  StrategyItem,
} from '@/lib/business-operations/types';

const SECTION_ID = 'competitive-strengths-strategy-confirmations' as const;
const PAYLOAD_KEY = 'competitiveStrengthsStrategyDependenciesAndConfirmations' as const;

export function StrategyConfirmationsForm() {
  const { payload, updateSection } = useBusinessOperations();
  const value = payload.competitiveStrengthsStrategyDependenciesAndConfirmations;

  const set = <K extends keyof CompetitiveStrengthsStrategyDependenciesAndConfirmations>(
    key: K,
    next: CompetitiveStrengthsStrategyDependenciesAndConfirmations[K],
  ) => {
    updateSection(PAYLOAD_KEY, { ...value, [key]: next }, SECTION_ID);
  };

  const setStrength = <K extends keyof CompetitiveStrength>(
    index: number,
    key: K,
    next: CompetitiveStrength[K],
  ) => {
    set(
      'competitiveStrengths',
      replaceAt(value.competitiveStrengths, index, {
        ...value.competitiveStrengths[index],
        [key]: next,
      }),
    );
  };

  const setStrategy = <K extends keyof StrategyItem>(
    index: number,
    key: K,
    next: StrategyItem[K],
  ) => {
    set(
      'strategies',
      replaceAt(value.strategies, index, {
        ...value.strategies[index],
        [key]: next,
      }),
    );
  };

  const setKeyDependency = <K extends keyof KeyDependency>(
    index: number,
    key: K,
    next: KeyDependency[K],
  ) => {
    set(
      'keyDependencies',
      replaceAt(value.keyDependencies, index, {
        ...value.keyDependencies[index],
        [key]: next,
      }),
    );
  };

  const setConfirmation = (
    key: keyof CompetitiveStrengthsStrategyDependenciesAndConfirmations['confirmations'],
    checked: boolean,
  ) => {
    set('confirmations', { ...value.confirmations, [key]: checked });
  };

  const confirmationsChecked = BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.filter(
    (field) => value.confirmations[field.key],
  ).length;

  return (
    <SectionCard
      title="Competitive Strengths, Strategy, Dependencies & Confirmations"
      description="Supported strengths, strategies, key dependencies and issuer confirmations."
    >
      <RepeatableList
        title="Competitive strengths"
        description="Each strength claim needs a supporting source. Avoid unsupported superlatives (e.g. “largest”, “best”, “only”) unless independently evidenced."
        addLabel="Add competitive strength"
        count={value.competitiveStrengths.length}
        emptyMessage="No competitive strength recorded."
        onAdd={() =>
          set('competitiveStrengths', [
            ...value.competitiveStrengths,
            createEmptyCompetitiveStrength(),
          ])
        }
      >
        {value.competitiveStrengths.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.title || `Competitive strength ${index + 1}`}
            subtitle={item.supportingSource ? 'Source captured' : 'Supporting source required'}
            requiresConfirmation={hasRecordData([
              item.title,
              item.explanation,
              item.supportingSource,
              item.notes,
            ])}
            onRemove={() =>
              set('competitiveStrengths', removeAt(value.competitiveStrengths, index))
            }
          >
            <FieldGrid>
              <TextInputField
                id={`strength-${index}-title`}
                label="Title"
                value={item.title}
                onChange={(next) => setStrength(index, 'title', next)}
              />
              <TextInputField
                id={`strength-${index}-metric`}
                label="Supporting metric"
                value={item.supportingMetric}
                onChange={(next) => setStrength(index, 'supportingMetric', next)}
              />
              <TextInputField
                id={`strength-${index}-period`}
                label="Period"
                value={item.period}
                onChange={(next) => setStrength(index, 'period', next)}
              />
              <TextInputField
                id={`strength-${index}-source`}
                label="Supporting source"
                required
                value={item.supportingSource}
                onChange={(next) => setStrength(index, 'supportingSource', next)}
                helper="Cite the report, certificate, market data or internal record that supports this claim. Do not rely on unsupported superlatives."
              />
              <TextInputField
                id={`strength-${index}-related`}
                label="Related product, facility or customer"
                value={item.relatedProductFacilityOrCustomer}
                onChange={(next) => setStrength(index, 'relatedProductFacilityOrCustomer', next)}
              />
              <TernaryField
                id={`strength-${index}-confirmation`}
                label="Company confirmation"
                value={item.companyConfirmation}
                onChange={(next) => setStrength(index, 'companyConfirmation', next)}
              />
              <SelectField
                id={`strength-${index}-review`}
                label="Professional review status"
                value={item.professionalReviewStatus}
                onChange={(next) =>
                  setStrength(
                    index,
                    'professionalReviewStatus',
                    next as CompetitiveStrength['professionalReviewStatus'],
                  )
                }
                options={PROFESSIONAL_REVIEW_STATUS_OPTIONS}
                emptyLabel="Select status"
              />
            </FieldGrid>
            <TextAreaField
              id={`strength-${index}-explanation`}
              label="Explanation"
              rows={2}
              value={item.explanation}
              onChange={(next) => setStrength(index, 'explanation', next)}
            />
            <TextAreaField
              id={`strength-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setStrength(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Strategies"
        description="Capture board-directed strategies and plans. Do not record projected revenue or profit as factual outcomes."
        addLabel="Add strategy"
        count={value.strategies.length}
        emptyMessage="No strategy recorded."
        onAdd={() => set('strategies', [...value.strategies, createEmptyStrategyItem()])}
      >
        {value.strategies.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.title || `Strategy ${index + 1}`}
            subtitle={item.category || undefined}
            requiresConfirmation={hasRecordData([
              item.title,
              item.description,
              item.supportingPlanOrSource,
              item.notes,
            ])}
            onRemove={() => set('strategies', removeAt(value.strategies, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`strategy-${index}-title`}
                label="Title"
                value={item.title}
                onChange={(next) => setStrategy(index, 'title', next)}
              />
              <SelectField
                id={`strategy-${index}-category`}
                label="Category"
                value={item.category}
                onChange={(next) =>
                  setStrategy(index, 'category', next as StrategyItem['category'])
                }
                options={STRATEGY_CATEGORY_OPTIONS}
                emptyLabel="Select category"
              />
              <SelectField
                id={`strategy-${index}-horizon`}
                label="Time horizon"
                value={item.timeHorizon}
                onChange={(next) =>
                  setStrategy(index, 'timeHorizon', next as StrategyItem['timeHorizon'])
                }
                options={STRATEGY_TIME_HORIZON_OPTIONS}
                emptyLabel="Select horizon"
              />
              <SelectField
                id={`strategy-${index}-status`}
                label="Current status"
                value={item.currentStatus}
                onChange={(next) =>
                  setStrategy(index, 'currentStatus', next as StrategyItem['currentStatus'])
                }
                options={STRATEGY_STATUS_OPTIONS}
                emptyLabel="Select status"
              />
              <TernaryField
                id={`strategy-${index}-board`}
                label="Board-approved status"
                value={item.boardApprovedStatus}
                onChange={(next) => setStrategy(index, 'boardApprovedStatus', next)}
              />
              <TernaryField
                id={`strategy-${index}-projections`}
                label="Contains unsupported projections"
                value={item.containsUnsupportedProjections}
                onChange={(next) => setStrategy(index, 'containsUnsupportedProjections', next)}
                helper="Flag if the draft language implies revenue or profit outcomes that are not yet factual."
              />
              <TextInputField
                id={`strategy-${index}-objects`}
                label="Related objects of the issue reference"
                value={item.relatedObjectsOfTheIssueReference}
                onChange={(next) => setStrategy(index, 'relatedObjectsOfTheIssueReference', next)}
              />
              <TextInputField
                id={`strategy-${index}-source`}
                label="Supporting plan or source"
                value={item.supportingPlanOrSource}
                onChange={(next) => setStrategy(index, 'supportingPlanOrSource', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`strategy-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setStrategy(index, 'description', next)}
              helper="Describe the strategic intent and actions. Do not capture projected revenue or profit as factual outcomes."
            />
            <TextAreaField
              id={`strategy-${index}-resources`}
              label="Required resources"
              rows={2}
              value={item.requiredResources}
              onChange={(next) => setStrategy(index, 'requiredResources', next)}
            />
            <TextAreaField
              id={`strategy-${index}-dependencies`}
              label="Dependencies"
              rows={2}
              value={item.dependencies}
              onChange={(next) => setStrategy(index, 'dependencies', next)}
            />
            <TextAreaField
              id={`strategy-${index}-risks`}
              label="Risks"
              rows={2}
              value={item.risks}
              onChange={(next) => setStrategy(index, 'risks', next)}
            />
            <TextAreaField
              id={`strategy-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setStrategy(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Key dependencies"
        description="Cross-cutting dependencies that may require risk-factor linkage."
        addLabel="Add key dependency"
        count={value.keyDependencies.length}
        emptyMessage="No key dependency recorded."
        onAdd={() =>
          set('keyDependencies', [...value.keyDependencies, createEmptyKeyDependency()])
        }
      >
        {value.keyDependencies.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.description || `Key dependency ${index + 1}`}
            subtitle={item.dependencyType || undefined}
            requiresConfirmation={hasRecordData([
              item.description,
              item.quantification,
              item.notes,
            ])}
            onRemove={() => set('keyDependencies', removeAt(value.keyDependencies, index))}
          >
            <FieldGrid>
              <SelectField
                id={`key-dep-${index}-type`}
                label="Dependency type"
                value={item.dependencyType}
                onChange={(next) =>
                  setKeyDependency(
                    index,
                    'dependencyType',
                    next as KeyDependency['dependencyType'],
                  )
                }
                options={DEPENDENCY_TYPE_OPTIONS}
                emptyLabel="Select type"
              />
              <SelectField
                id={`key-dep-${index}-materiality`}
                label="Materiality status"
                value={item.materialityStatus}
                onChange={(next) =>
                  setKeyDependency(
                    index,
                    'materialityStatus',
                    next as KeyDependency['materialityStatus'],
                  )
                }
                options={MATERIALITY_STATUS_OPTIONS}
                emptyLabel="Select status"
              />
              <TextInputField
                id={`key-dep-${index}-risk`}
                label="Related future risk factor"
                value={item.relatedFutureRiskFactor}
                onChange={(next) => setKeyDependency(index, 'relatedFutureRiskFactor', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`key-dep-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setKeyDependency(index, 'description', next)}
            />
            <TextAreaField
              id={`key-dep-${index}-quantification`}
              label="Quantification"
              rows={2}
              value={item.quantification}
              onChange={(next) => setKeyDependency(index, 'quantification', next)}
            />
            <TextAreaField
              id={`key-dep-${index}-mitigation`}
              label="Mitigation"
              rows={2}
              value={item.mitigation}
              onChange={(next) => setKeyDependency(index, 'mitigation', next)}
            />
            <TextAreaField
              id={`key-dep-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setKeyDependency(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection
        title="Issuer confirmations"
        description={`${confirmationsChecked} of ${BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.length} acknowledged. Unchecked confirmations keep the Business & Operations assessment preliminary.`}
      >
        <div className="space-y-3">
          {BUSINESS_OPERATIONS_CONFIRMATION_FIELDS.map((field) => (
            <CheckboxField
              key={field.key}
              id={`bo-confirmation-${field.key}`}
              label={field.label}
              checked={value.confirmations[field.key]}
              onChange={(checked) => setConfirmation(field.key, checked)}
              helper={
                value.confirmations[field.key]
                  ? undefined
                  : 'Unchecked = not confirmed for this draft.'
              }
            />
          ))}
        </div>
      </SubSection>

      <TextAreaField
        id="strategy-section-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <BusinessOperationsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
