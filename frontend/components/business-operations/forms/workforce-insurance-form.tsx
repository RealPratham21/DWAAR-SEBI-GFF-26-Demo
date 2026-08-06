'use client';

import {
  CheckboxField,
  ComputedStat,
  DateField,
  DecimalInputField,
  FieldGrid,
  SelectField,
  StatGrid,
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
  createEmptyCollaboration,
  createEmptyInsurancePolicy,
  createEmptyOperatingDependency,
  createEmptyWorkforcePeriod,
} from '@/lib/business-operations/defaults';
import { EM_DASH, formatCount, formatDate, formatPercent } from '@/lib/business-operations/format';
import {
  COLLABORATION_NATURE_OPTIONS,
  DEPENDENCY_TYPE_OPTIONS,
  INSURANCE_POLICY_TYPE_OPTIONS,
  MATERIALITY_STATUS_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  Collaboration,
  InsurancePolicy,
  OperatingDependency,
  WorkforceCollaborationsInsuranceAndContinuity,
  WorkforcePeriod,
} from '@/lib/business-operations/types';

const SECTION_ID = 'workforce-collaborations-insurance-continuity' as const;
const PAYLOAD_KEY = 'workforceCollaborationsInsuranceAndContinuity' as const;

export function WorkforceInsuranceForm() {
  const { payload, updateSection, model } = useBusinessOperations();
  const value = payload.workforceCollaborationsInsuranceAndContinuity;
  const workforceLatest = model.workforceLatest;

  const set = <K extends keyof WorkforceCollaborationsInsuranceAndContinuity>(
    key: K,
    next: WorkforceCollaborationsInsuranceAndContinuity[K],
  ) => {
    updateSection(PAYLOAD_KEY, { ...value, [key]: next }, SECTION_ID);
  };

  const setWorkforcePeriod = <K extends keyof WorkforcePeriod>(
    index: number,
    key: K,
    next: WorkforcePeriod[K],
  ) => {
    set(
      'workforcePeriods',
      replaceAt(value.workforcePeriods, index, {
        ...value.workforcePeriods[index],
        [key]: next,
      }),
    );
  };

  const setCollaboration = <K extends keyof Collaboration>(
    index: number,
    key: K,
    next: Collaboration[K],
  ) => {
    set(
      'collaborations',
      replaceAt(value.collaborations, index, {
        ...value.collaborations[index],
        [key]: next,
      }),
    );
  };

  const setOperatingDependency = <K extends keyof OperatingDependency>(
    index: number,
    key: K,
    next: OperatingDependency[K],
  ) => {
    set(
      'operatingDependencies',
      replaceAt(value.operatingDependencies, index, {
        ...value.operatingDependencies[index],
        [key]: next,
      }),
    );
  };

  const setInsurancePolicy = <K extends keyof InsurancePolicy>(
    index: number,
    key: K,
    next: InsurancePolicy[K],
  ) => {
    set(
      'insurancePolicies',
      replaceAt(value.insurancePolicies, index, {
        ...value.insurancePolicies[index],
        [key]: next,
      }),
    );
  };

  return (
    <SectionCard
      title="Workforce, Collaborations, Insurance & Continuity"
      description="Workforce numbers, collaborations, operating dependencies, insurance and continuity."
    >
      <RepeatableList
        title="Workforce periods"
        description="Capture permanent and contract headcount by period. Mark the current period for overview totals."
        addLabel="Add workforce period"
        count={value.workforcePeriods.length}
        emptyMessage="No workforce period recorded."
        onAdd={() => set('workforcePeriods', [...value.workforcePeriods, createEmptyWorkforcePeriod()])}
      >
        {value.workforcePeriods.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.periodLabel || `Workforce period ${index + 1}`}
            subtitle={item.asOfDate ? formatDate(item.asOfDate) : undefined}
            requiresConfirmation={hasRecordData([
              item.periodLabel,
              item.permanentEmployees,
              item.contractWorkers,
              item.notes,
            ])}
            onRemove={() => set('workforcePeriods', removeAt(value.workforcePeriods, index))}
          >
            <FieldGrid>
              <DateField
                id={`workforce-${index}-as-of`}
                label="As of date"
                value={item.asOfDate}
                onChange={(next) => setWorkforcePeriod(index, 'asOfDate', next)}
              />
              <TextInputField
                id={`workforce-${index}-label`}
                label="Period label"
                value={item.periodLabel}
                onChange={(next) => setWorkforcePeriod(index, 'periodLabel', next)}
                placeholder="e.g. FY 2025, As on 31 Mar 2025"
              />
              <DecimalInputField
                id={`workforce-${index}-permanent`}
                label="Permanent employees"
                value={item.permanentEmployees}
                onChange={(next) => setWorkforcePeriod(index, 'permanentEmployees', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-contract`}
                label="Contract workers"
                value={item.contractWorkers}
                onChange={(next) => setWorkforcePeriod(index, 'contractWorkers', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-factory`}
                label="Factory / operational workers"
                value={item.factoryOrOperationalWorkers}
                onChange={(next) => setWorkforcePeriod(index, 'factoryOrOperationalWorkers', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-rd`}
                label="Technical / R&D employees"
                value={item.technicalOrRdEmployees}
                onChange={(next) => setWorkforcePeriod(index, 'technicalOrRdEmployees', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-sales`}
                label="Sales employees"
                value={item.salesEmployees}
                onChange={(next) => setWorkforcePeriod(index, 'salesEmployees', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-admin`}
                label="Administration employees"
                value={item.administrationEmployees}
                onChange={(next) => setWorkforcePeriod(index, 'administrationEmployees', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-women`}
                label="Women employees"
                value={item.womenEmployees}
                onChange={(next) => setWorkforcePeriod(index, 'womenEmployees', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-pwd`}
                label="Persons with disabilities"
                value={item.personsWithDisabilities}
                onChange={(next) => setWorkforcePeriod(index, 'personsWithDisabilities', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-unionised`}
                label="Unionised employees"
                value={item.unionisedEmployees}
                onChange={(next) => setWorkforcePeriod(index, 'unionisedEmployees', next)}
              />
              <DecimalInputField
                id={`workforce-${index}-attrition`}
                label="Attrition (%)"
                value={item.attritionPercentage}
                onChange={(next) => setWorkforcePeriod(index, 'attritionPercentage', next)}
              />
            </FieldGrid>
            <CheckboxField
              id={`workforce-${index}-current`}
              label="This is the current / latest period"
              checked={item.isCurrentPeriod}
              onChange={(checked) => setWorkforcePeriod(index, 'isCurrentPeriod', checked)}
              helper="Overview and assessment use the current period when marked; otherwise the last row."
            />
            <TextAreaField
              id={`workforce-${index}-geo`}
              label="Geographic distribution"
              rows={2}
              value={item.geographicDistribution}
              onChange={(next) => setWorkforcePeriod(index, 'geographicDistribution', next)}
            />
            <TextAreaField
              id={`workforce-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setWorkforcePeriod(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection
        title="Labour practices"
        description="Disputes, training, specialised skills and contractor usage."
      >
        <FieldGrid>
          <TernaryField
            id="labour-disputes"
            label="Labour disputes"
            value={value.labourDisputes}
            onChange={(next) => set('labourDisputes', next)}
          />
          <TernaryField
            id="specialised-skill-dependence"
            label="Specialised skill dependence"
            value={value.specialisedSkillDependence}
            onChange={(next) => set('specialisedSkillDependence', next)}
          />
          <TernaryField
            id="labour-contractor-usage"
            label="Labour contractor usage"
            value={value.labourContractorUsage}
            onChange={(next) => set('labourContractorUsage', next)}
          />
        </FieldGrid>
        {value.labourDisputes === 'yes' || value.labourDisputes === 'not_sure' ? (
          <TextAreaField
            id="labour-dispute-details"
            label="Labour dispute details"
            value={value.labourDisputeDetails}
            onChange={(next) => set('labourDisputeDetails', next)}
          />
        ) : null}
        <TextAreaField
          id="training-programmes"
          label="Training programmes"
          value={value.trainingProgrammes}
          onChange={(next) => set('trainingProgrammes', next)}
        />
        {value.specialisedSkillDependence === 'yes' ||
        value.specialisedSkillDependence === 'not_sure' ? (
          <TextAreaField
            id="specialised-skill-details"
            label="Specialised skill dependence details"
            value={value.specialisedSkillDependenceDetails}
            onChange={(next) => set('specialisedSkillDependenceDetails', next)}
          />
        ) : null}
        {value.labourContractorUsage === 'yes' || value.labourContractorUsage === 'not_sure' ? (
          <TextAreaField
            id="labour-contractor-details"
            label="Labour contractor details"
            value={value.labourContractorDetails}
            onChange={(next) => set('labourContractorDetails', next)}
          />
        ) : null}
      </SubSection>

      <RepeatableList
        title="Collaborations"
        description="Technical, licensing, distribution and other collaboration arrangements."
        addLabel="Add collaboration"
        count={value.collaborations.length}
        emptyMessage="No collaboration recorded."
        onAdd={() => set('collaborations', [...value.collaborations, createEmptyCollaboration()])}
      >
        {value.collaborations.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.party || `Collaboration ${index + 1}`}
            subtitle={item.nature || undefined}
            requiresConfirmation={hasRecordData([
              item.party,
              item.supportOrServicesReceived,
              item.notes,
            ])}
            onRemove={() => set('collaborations', removeAt(value.collaborations, index))}
          >
            <FieldGrid>
              <TextInputField
                id={`collab-${index}-party`}
                label="Counterparty"
                value={item.party}
                onChange={(next) => setCollaboration(index, 'party', next)}
              />
              <TextInputField
                id={`collab-${index}-country`}
                label="Country"
                value={item.country}
                onChange={(next) => setCollaboration(index, 'country', next)}
              />
              <SelectField
                id={`collab-${index}-nature`}
                label="Nature"
                value={item.nature}
                onChange={(next) =>
                  setCollaboration(index, 'nature', next as Collaboration['nature'])
                }
                options={COLLABORATION_NATURE_OPTIONS}
                emptyLabel="Select nature"
              />
              <DateField
                id={`collab-${index}-agreement-date`}
                label="Agreement date"
                value={item.agreementDate}
                onChange={(next) => setCollaboration(index, 'agreementDate', next)}
              />
              <TextInputField
                id={`collab-${index}-term`}
                label="Term"
                value={item.term}
                onChange={(next) => setCollaboration(index, 'term', next)}
              />
              <TernaryField
                id={`collab-${index}-exclusivity`}
                label="Exclusivity"
                value={item.exclusivity}
                onChange={(next) => setCollaboration(index, 'exclusivity', next)}
              />
              <TextInputField
                id={`collab-${index}-geography`}
                label="Geography"
                value={item.geography}
                onChange={(next) => setCollaboration(index, 'geography', next)}
              />
              <TernaryField
                id={`collab-${index}-material-dependency`}
                label="Material dependency"
                value={item.materialDependency}
                onChange={(next) => setCollaboration(index, 'materialDependency', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`collab-${index}-support`}
              label="Support or services received"
              rows={2}
              value={item.supportOrServicesReceived}
              onChange={(next) => setCollaboration(index, 'supportOrServicesReceived', next)}
            />
            <TextAreaField
              id={`collab-${index}-renewal`}
              label="Renewal or termination status"
              rows={2}
              value={item.renewalOrTerminationStatus}
              onChange={(next) => setCollaboration(index, 'renewalOrTerminationStatus', next)}
            />
            <TextAreaField
              id={`collab-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setCollaboration(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Operating dependencies"
        description="Material operating dependencies that may warrant risk-factor or MD&A disclosure."
        addLabel="Add operating dependency"
        count={value.operatingDependencies.length}
        emptyMessage="No operating dependency recorded."
        onAdd={() =>
          set('operatingDependencies', [
            ...value.operatingDependencies,
            createEmptyOperatingDependency(),
          ])
        }
      >
        {value.operatingDependencies.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.description || `Operating dependency ${index + 1}`}
            subtitle={item.dependencyType || undefined}
            requiresConfirmation={hasRecordData([
              item.description,
              item.counterpartyOrProvider,
              item.notes,
            ])}
            onRemove={() =>
              set('operatingDependencies', removeAt(value.operatingDependencies, index))
            }
          >
            <FieldGrid>
              <SelectField
                id={`op-dep-${index}-type`}
                label="Dependency type"
                value={item.dependencyType}
                onChange={(next) =>
                  setOperatingDependency(
                    index,
                    'dependencyType',
                    next as OperatingDependency['dependencyType'],
                  )
                }
                options={DEPENDENCY_TYPE_OPTIONS}
                emptyLabel="Select type"
              />
              <TernaryField
                id={`op-dep-${index}-applicable`}
                label="Applicable"
                value={item.applicable}
                onChange={(next) => setOperatingDependency(index, 'applicable', next)}
              />
              <TextInputField
                id={`op-dep-${index}-counterparty`}
                label="Counterparty or provider"
                value={item.counterpartyOrProvider}
                onChange={(next) => setOperatingDependency(index, 'counterpartyOrProvider', next)}
              />
              <SelectField
                id={`op-dep-${index}-materiality`}
                label="Materiality status"
                value={item.materialityStatus}
                onChange={(next) =>
                  setOperatingDependency(
                    index,
                    'materialityStatus',
                    next as OperatingDependency['materialityStatus'],
                  )
                }
                options={MATERIALITY_STATUS_OPTIONS}
                emptyLabel="Select status"
              />
            </FieldGrid>
            <TextAreaField
              id={`op-dep-${index}-description`}
              label="Description"
              rows={2}
              value={item.description}
              onChange={(next) => setOperatingDependency(index, 'description', next)}
            />
            <TextAreaField
              id={`op-dep-${index}-quantification`}
              label="Quantification"
              rows={2}
              value={item.quantification}
              onChange={(next) => setOperatingDependency(index, 'quantification', next)}
            />
            <TextAreaField
              id={`op-dep-${index}-mitigation`}
              label="Mitigation"
              rows={2}
              value={item.mitigation}
              onChange={(next) => setOperatingDependency(index, 'mitigation', next)}
            />
            <TextAreaField
              id={`op-dep-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setOperatingDependency(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Insurance policies"
        description="Material insurance covers across property, liability, cyber and key-person risks."
        addLabel="Add insurance policy"
        count={value.insurancePolicies.length}
        emptyMessage="No insurance policy recorded."
        onAdd={() =>
          set('insurancePolicies', [...value.insurancePolicies, createEmptyInsurancePolicy()])
        }
      >
        {value.insurancePolicies.map((item, index) => (
          <RepeatableCard
            key={item.id}
            title={item.insurer || `Insurance policy ${index + 1}`}
            subtitle={item.policyType || undefined}
            requiresConfirmation={hasRecordData([
              item.insurer,
              item.coverage,
              item.sumInsured,
              item.notes,
            ])}
            onRemove={() => set('insurancePolicies', removeAt(value.insurancePolicies, index))}
          >
            <FieldGrid>
              <SelectField
                id={`insurance-${index}-type`}
                label="Policy type"
                value={item.policyType}
                onChange={(next) =>
                  setInsurancePolicy(index, 'policyType', next as InsurancePolicy['policyType'])
                }
                options={INSURANCE_POLICY_TYPE_OPTIONS}
                emptyLabel="Select type"
              />
              <TextInputField
                id={`insurance-${index}-insurer`}
                label="Insurer"
                value={item.insurer}
                onChange={(next) => setInsurancePolicy(index, 'insurer', next)}
              />
              <DecimalInputField
                id={`insurance-${index}-sum`}
                label="Sum insured (₹)"
                value={item.sumInsured}
                onChange={(next) => setInsurancePolicy(index, 'sumInsured', next)}
              />
              <TextInputField
                id={`insurance-${index}-period`}
                label="Policy period"
                value={item.policyPeriod}
                onChange={(next) => setInsurancePolicy(index, 'policyPeriod', next)}
              />
              <TextInputField
                id={`insurance-${index}-deductible`}
                label="Deductible"
                value={item.deductible}
                onChange={(next) => setInsurancePolicy(index, 'deductible', next)}
              />
              <TextInputField
                id={`insurance-${index}-renewal`}
                label="Renewal status"
                value={item.renewalStatus}
                onChange={(next) => setInsurancePolicy(index, 'renewalStatus', next)}
              />
            </FieldGrid>
            <TextAreaField
              id={`insurance-${index}-coverage`}
              label="Coverage"
              rows={2}
              value={item.coverage}
              onChange={(next) => setInsurancePolicy(index, 'coverage', next)}
            />
            <TextAreaField
              id={`insurance-${index}-exclusions`}
              label="Key exclusions"
              rows={2}
              value={item.keyExclusions}
              onChange={(next) => setInsurancePolicy(index, 'keyExclusions', next)}
            />
            <TextAreaField
              id={`insurance-${index}-claims`}
              label="Claims history"
              rows={2}
              value={item.claimsHistory}
              onChange={(next) => setInsurancePolicy(index, 'claimsHistory', next)}
            />
            <TextAreaField
              id={`insurance-${index}-notes`}
              label="Notes"
              rows={2}
              value={item.notes}
              onChange={(next) => setInsurancePolicy(index, 'notes', next)}
            />
          </RepeatableCard>
        ))}
      </RepeatableList>

      <SubSection
        title="Insurance adequacy"
        description="Management view of coverage completeness and specialised covers."
      >
        <FieldGrid>
          <TernaryField
            id="coverage-adequate"
            label="Management considers coverage adequate"
            value={value.managementConsidersCoverageAdequate}
            onChange={(next) => set('managementConsidersCoverageAdequate', next)}
          />
          <TernaryField
            id="professional-insurance-review"
            label="Professional insurance review performed"
            value={value.professionalInsuranceReviewPerformed}
            onChange={(next) => set('professionalInsuranceReviewPerformed', next)}
          />
          <TernaryField
            id="material-uninsured"
            label="Material uninsured operations"
            value={value.materialUninsuredOperations}
            onChange={(next) => set('materialUninsuredOperations', next)}
          />
          <TernaryField
            id="key-person-insurance"
            label="Key-person insurance in place"
            value={value.keyPersonInsuranceInPlace}
            onChange={(next) => set('keyPersonInsuranceInPlace', next)}
          />
          <TernaryField
            id="cyber-insurance"
            label="Cyber insurance in place"
            value={value.cyberInsuranceInPlace}
            onChange={(next) => set('cyberInsuranceInPlace', next)}
          />
        </FieldGrid>
        {value.materialUninsuredOperations === 'yes' ||
        value.materialUninsuredOperations === 'not_sure' ? (
          <TextAreaField
            id="material-uninsured-details"
            label="Material uninsured operations details"
            value={value.materialUninsuredOperationsDetails}
            onChange={(next) => set('materialUninsuredOperationsDetails', next)}
          />
        ) : null}
      </SubSection>

      <SubSection
        title="Business continuity"
        description="Continuity and disaster-recovery posture, backups and interruption history."
      >
        <FieldGrid>
          <TernaryField
            id="bcp-exists"
            label="Business continuity plan exists"
            value={value.businessContinuityPlanExists}
            onChange={(next) => set('businessContinuityPlanExists', next)}
          />
          <TernaryField
            id="dr-exists"
            label="Disaster recovery plan exists"
            value={value.disasterRecoveryPlanExists}
            onChange={(next) => set('disasterRecoveryPlanExists', next)}
          />
          <TernaryField
            id="alternate-facility"
            label="Alternate facility available"
            value={value.alternateFacilityAvailable}
            onChange={(next) => set('alternateFacilityAvailable', next)}
          />
          <TernaryField
            id="backup-suppliers"
            label="Backup suppliers available"
            value={value.backupSuppliersAvailable}
            onChange={(next) => set('backupSuppliersAvailable', next)}
          />
          <TernaryField
            id="backup-power-data"
            label="Backup power or data available"
            value={value.backupPowerOrDataAvailable}
            onChange={(next) => set('backupPowerOrDataAvailable', next)}
          />
          <TernaryField
            id="cyber-incident-response"
            label="Cyber incident response plan exists"
            value={value.cyberIncidentResponsePlanExists}
            onChange={(next) => set('cyberIncidentResponsePlanExists', next)}
          />
          <DateField
            id="continuity-last-test"
            label="Continuity last test date"
            value={value.continuityLastTestDate}
            onChange={(next) => set('continuityLastTestDate', next)}
          />
          <TernaryField
            id="material-interruptions"
            label="Material interruptions experienced"
            value={value.materialInterruptionsExperienced}
            onChange={(next) => set('materialInterruptionsExperienced', next)}
          />
          <TextInputField
            id="max-downtime"
            label="Maximum downtime experienced"
            value={value.maximumDowntimeExperienced}
            onChange={(next) => set('maximumDowntimeExperienced', next)}
          />
          <TextInputField
            id="recovery-status"
            label="Recovery status"
            value={value.recoveryStatus}
            onChange={(next) => set('recoveryStatus', next)}
          />
        </FieldGrid>
        {value.materialInterruptionsExperienced === 'yes' ||
        value.materialInterruptionsExperienced === 'not_sure' ? (
          <TextAreaField
            id="material-interruptions-details"
            label="Material interruptions details"
            value={value.materialInterruptionsDetails}
            onChange={(next) => set('materialInterruptionsDetails', next)}
          />
        ) : null}
      </SubSection>

      <TextAreaField
        id="workforce-section-notes"
        label="Section notes"
        value={value.notes}
        onChange={(next) => set('notes', next)}
      />

      <StatGrid title="Computed workforce totals (not persisted)">
        <ComputedStat
          label="As of"
          value={
            workforceLatest?.asOfDate
              ? formatDate(workforceLatest.asOfDate)
              : workforceLatest?.periodLabel || EM_DASH
          }
        />
        <ComputedStat
          label="Permanent employees"
          value={
            workforceLatest?.permanentEmployees
              ? formatCount(workforceLatest.permanentEmployees)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Contract workers"
          value={
            workforceLatest?.contractWorkers
              ? formatCount(workforceLatest.contractWorkers)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Total headcount"
          value={
            workforceLatest?.totalHeadcount
              ? formatCount(workforceLatest.totalHeadcount)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Women employees"
          value={
            workforceLatest?.womenEmployees
              ? formatCount(workforceLatest.womenEmployees)
              : EM_DASH
          }
        />
        <ComputedStat
          label="Attrition"
          value={
            workforceLatest?.attritionPercentage
              ? formatPercent(workforceLatest.attritionPercentage)
              : EM_DASH
          }
        />
      </StatGrid>

      <BusinessOperationsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
