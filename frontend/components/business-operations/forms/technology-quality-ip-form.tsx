'use client';

import { useMemo, useState } from 'react';
import {
  AmountInputField,
  AmountUnitToggle,
  DateField,
  DecimalInputField,
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
  createEmptyIntellectualPropertyRecord,
  createEmptyMachineryEquipment,
  createEmptyQualityCertification,
  createEmptyRdSpendRow,
} from '@/lib/business-operations/defaults';
import { formatMoneyCompact } from '@/lib/business-operations/format';
import {
  AUTOMATION_LEVEL_OPTIONS,
  CERTIFICATION_RENEWAL_STATUS_OPTIONS,
  EQUIPMENT_ORIGIN_OPTIONS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_OPTIONS,
  EQUIPMENT_TENURE_OPTIONS,
  FIGURE_SOURCE_OPTIONS,
  HOSTING_MODEL_OPTIONS,
  IP_OWNERSHIP_MODEL_OPTIONS,
  IP_STATUS_LABELS,
  IP_STATUS_OPTIONS,
  IP_TYPE_LABELS,
  IP_TYPE_OPTIONS,
  MATERIALITY_STATUS_OPTIONS,
  RD_DELIVERY_MODEL_OPTIONS,
  TECHNOLOGY_OWNERSHIP_OPTIONS,
} from '@/lib/business-operations/options';
import type {
  IntellectualPropertyRecord,
  MachineryEquipment,
  QualityCertification,
  RdSpendRow,
  TechnologyQualityResearchAndIntellectualProperty,
} from '@/lib/business-operations/types';
import type { AmountUnit } from '@/lib/capital-ownership/types';

const SECTION_ID = 'technology-quality-rd-ip' as const;

function equipmentStatusLabel(value: string): string {
  if (!value) return 'Status not set';
  return EQUIPMENT_STATUS_LABELS[value as keyof typeof EQUIPMENT_STATUS_LABELS] ?? value;
}

function ipTypeLabel(value: string): string {
  if (!value) return 'Type not set';
  return IP_TYPE_LABELS[value as keyof typeof IP_TYPE_LABELS] ?? value;
}

function ipStatusLabel(value: string): string {
  if (!value) return 'Status not set';
  return IP_STATUS_LABELS[value as keyof typeof IP_STATUS_LABELS] ?? value;
}

export function TechnologyQualityIpForm() {
  const { payload, updateSection } = useBusinessOperations();
  const value = payload.technologyQualityResearchAndIntellectualProperty;
  const facilities = payload.facilitiesCapacityAndOperationalProcess.facilities;
  const classifications = payload.businessProfileAndOperatingModel.businessClassifications;
  const isManufacturingPriority =
    classifications.includes('manufacturing') ||
    classifications.includes('contract-manufacturing');
  const isSoftwareEmphasis = classifications.includes('software-or-technology-platform');
  const [amountUnit, setAmountUnit] = useState<AmountUnit>('lakh');

  const facilityOptions = useMemo(
    () =>
      facilities.map((item, index) => ({
        value: item.id,
        label: item.name || `Facility ${index + 1}`,
      })),
    [facilities],
  );

  const set = <K extends keyof TechnologyQualityResearchAndIntellectualProperty>(
    key: K,
    next: TechnologyQualityResearchAndIntellectualProperty[K],
  ) => {
    updateSection(
      'technologyQualityResearchAndIntellectualProperty',
      { ...value, [key]: next },
      SECTION_ID,
    );
  };

  const setMachinery = <K extends keyof MachineryEquipment>(
    index: number,
    key: K,
    next: MachineryEquipment[K],
  ) => {
    set(
      'machineryAndEquipment',
      replaceAt(value.machineryAndEquipment, index, {
        ...value.machineryAndEquipment[index],
        [key]: next,
      }),
    );
  };

  const setCertification = <K extends keyof QualityCertification>(
    index: number,
    key: K,
    next: QualityCertification[K],
  ) => {
    set(
      'certifications',
      replaceAt(value.certifications, index, { ...value.certifications[index], [key]: next }),
    );
  };

  const setRdSpend = <K extends keyof RdSpendRow>(index: number, key: K, next: RdSpendRow[K]) => {
    set('rdSpendRows', replaceAt(value.rdSpendRows, index, { ...value.rdSpendRows[index], [key]: next }));
  };

  const setIp = <K extends keyof IntellectualPropertyRecord>(
    index: number,
    key: K,
    next: IntellectualPropertyRecord[K],
  ) => {
    set(
      'intellectualPropertyRecords',
      replaceAt(value.intellectualPropertyRecords, index, {
        ...value.intellectualPropertyRecords[index],
        [key]: next,
      }),
    );
  };

  const linkFacility = (facilityId: string): { facilityId: string; facilityName: string } => {
    const facility = facilities.find((row) => row.id === facilityId);
    return {
      facilityId,
      facilityName: facility?.name ?? '',
    };
  };

  return (
    <SectionCard
      title="Technology, Quality, R&D & Intellectual Property"
      description="Technology stack, machinery, quality, certifications, R&D spend and IP records."
    >
      <div className="space-y-6">
        {isManufacturingPriority ? (
          <p
            role="status"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Manufacturing classification is selected — machinery and equipment coverage is a
            priority alongside capacity. Existing technology and IP entries are kept even if
            classifications change.
          </p>
        ) : null}
        {isSoftwareEmphasis ? (
          <p
            role="status"
            className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
          >
            Software / technology platform classification is selected — prioritise hosting model,
            critical software systems, cybersecurity and user-facing platform dependencies. Stored
            machinery and other values are never cleared by this note.
          </p>
        ) : null}

        <SubSection
          title="Core technology"
          description="Operating technology, ownership, automation, systems and resilience."
        >
          <TextAreaField
            id="core-operating-technology"
            label="Core operating technology"
            value={value.coreOperatingTechnology}
            onChange={(next) => set('coreOperatingTechnology', next)}
          />
          <FieldGrid>
            <SelectField
              id="technology-ownership"
              label="Technology ownership"
              value={value.technologyOwnership}
              onChange={(next) =>
                set(
                  'technologyOwnership',
                  next as TechnologyQualityResearchAndIntellectualProperty['technologyOwnership'],
                )
              }
              options={TECHNOLOGY_OWNERSHIP_OPTIONS}
            />
            <SelectField
              id="automation-level"
              label="Automation level"
              value={value.automationLevel}
              onChange={(next) =>
                set(
                  'automationLevel',
                  next as TechnologyQualityResearchAndIntellectualProperty['automationLevel'],
                )
              }
              options={AUTOMATION_LEVEL_OPTIONS}
            />
            <SelectField
              id="hosting-model"
              label="Hosting model"
              value={value.hostingModel}
              onChange={(next) =>
                set(
                  'hostingModel',
                  next as TechnologyQualityResearchAndIntellectualProperty['hostingModel'],
                )
              }
              options={HOSTING_MODEL_OPTIONS}
            />
            <TernaryField
              id="obsolescence-exposure"
              label="Obsolescence exposure"
              value={value.obsolescenceExposure}
              onChange={(next) => set('obsolescenceExposure', next)}
            />
            <TernaryField
              id="third-party-tech-dependence"
              label="Third-party technology dependence"
              value={value.thirdPartyTechnologyDependence}
              onChange={(next) => set('thirdPartyTechnologyDependence', next)}
            />
          </FieldGrid>
          <TextAreaField
            id="critical-software"
            label="Critical software systems"
            value={value.criticalSoftwareSystems}
            onChange={(next) => set('criticalSoftwareSystems', next)}
          />
          <TextAreaField
            id="erp-crm"
            label="ERP or CRM systems"
            value={value.erpOrCrmSystems}
            onChange={(next) => set('erpOrCrmSystems', next)}
          />
          <TextAreaField
            id="cybersecurity"
            label="Cybersecurity framework"
            value={value.cybersecurityFramework}
            onChange={(next) => set('cybersecurityFramework', next)}
          />
          <TextAreaField
            id="backup-dr"
            label="Backup and disaster recovery"
            value={value.backupAndDisasterRecovery}
            onChange={(next) => set('backupAndDisasterRecovery', next)}
          />
          <TextAreaField
            id="third-party-tech-details"
            label="Third-party technology dependence details"
            value={value.thirdPartyTechnologyDependenceDetails}
            onChange={(next) => set('thirdPartyTechnologyDependenceDetails', next)}
          />
          <TextAreaField
            id="technology-collaborations"
            label="Technology collaborations"
            value={value.technologyCollaborations}
            onChange={(next) => set('technologyCollaborations', next)}
          />
        </SubSection>

        <RepeatableList
          title="Machinery & equipment"
          description="Material plant, machinery and equipment supporting operations."
          addLabel="Add machinery / equipment"
          count={value.machineryAndEquipment.length}
          emptyMessage="No machinery or equipment recorded yet."
          onAdd={() =>
            set('machineryAndEquipment', [
              ...value.machineryAndEquipment,
              createEmptyMachineryEquipment(),
            ])
          }
        >
          {value.machineryAndEquipment.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.nameOrType || `Equipment ${index + 1}`}
              subtitle={equipmentStatusLabel(item.status)}
              requiresConfirmation={hasRecordData([
                item.nameOrType,
                item.functionDescription,
                item.quantity,
                item.supplier,
              ])}
              onRemove={() =>
                set('machineryAndEquipment', removeAt(value.machineryAndEquipment, index))
              }
            >
              <FieldGrid>
                <TextInputField
                  id={`machinery-${index}-name`}
                  label="Name or type"
                  value={item.nameOrType}
                  onChange={(next) => setMachinery(index, 'nameOrType', next)}
                />
                <SelectField
                  id={`machinery-${index}-facility`}
                  label="Facility"
                  value={item.facilityId}
                  onChange={(next) => {
                    const linked = linkFacility(next);
                    set(
                      'machineryAndEquipment',
                      replaceAt(value.machineryAndEquipment, index, {
                        ...item,
                        ...linked,
                      }),
                    );
                  }}
                  options={facilityOptions}
                  emptyLabel="Not linked"
                />
                <TextInputField
                  id={`machinery-${index}-facility-name`}
                  label="Facility name"
                  value={item.facilityName}
                  onChange={(next) => setMachinery(index, 'facilityName', next)}
                />
                <DecimalInputField
                  id={`machinery-${index}-quantity`}
                  label="Quantity"
                  value={item.quantity}
                  onChange={(next) => setMachinery(index, 'quantity', next)}
                />
                <DecimalInputField
                  id={`machinery-${index}-age`}
                  label="Age (years)"
                  value={item.ageYears}
                  onChange={(next) => setMachinery(index, 'ageYears', next)}
                />
                <SelectField
                  id={`machinery-${index}-tenure`}
                  label="Tenure"
                  value={item.tenure}
                  onChange={(next) =>
                    setMachinery(index, 'tenure', next as MachineryEquipment['tenure'])
                  }
                  options={EQUIPMENT_TENURE_OPTIONS}
                />
                <TextInputField
                  id={`machinery-${index}-supplier`}
                  label="Supplier"
                  value={item.supplier}
                  onChange={(next) => setMachinery(index, 'supplier', next)}
                />
                <DateField
                  id={`machinery-${index}-installed`}
                  label="Installed date"
                  value={item.installedDate}
                  onChange={(next) => setMachinery(index, 'installedDate', next)}
                />
                <TextInputField
                  id={`machinery-${index}-life`}
                  label="Remaining useful life"
                  value={item.remainingUsefulLife}
                  onChange={(next) => setMachinery(index, 'remainingUsefulLife', next)}
                />
                <SelectField
                  id={`machinery-${index}-origin`}
                  label="Origin"
                  value={item.origin}
                  onChange={(next) =>
                    setMachinery(index, 'origin', next as MachineryEquipment['origin'])
                  }
                  options={EQUIPMENT_ORIGIN_OPTIONS}
                />
                <SelectField
                  id={`machinery-${index}-status`}
                  label="Status"
                  value={item.status}
                  onChange={(next) =>
                    setMachinery(index, 'status', next as MachineryEquipment['status'])
                  }
                  options={EQUIPMENT_STATUS_OPTIONS}
                />
              </FieldGrid>
              <TextAreaField
                id={`machinery-${index}-function`}
                label="Function description"
                value={item.functionDescription}
                onChange={(next) => setMachinery(index, 'functionDescription', next)}
              />
              <TextAreaField
                id={`machinery-${index}-notes`}
                label="Notes"
                value={item.notes}
                onChange={(next) => setMachinery(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>

        <SubSection title="Quality" description="Quality process, inspection, claims and recalls.">
          <TextAreaField
            id="quality-process"
            label="Quality process"
            value={value.qualityProcess}
            onChange={(next) => set('qualityProcess', next)}
          />
          <TextAreaField
            id="inspection-stages"
            label="Inspection stages"
            value={value.inspectionStages}
            onChange={(next) => set('inspectionStages', next)}
          />
          <TextAreaField
            id="lab-testing"
            label="Laboratory or testing arrangements"
            value={value.laboratoryOrTestingArrangements}
            onChange={(next) => set('laboratoryOrTestingArrangements', next)}
          />
          <FieldGrid>
            <DecimalInputField
              id="rejection-rate"
              label="Rejection rate (%)"
              value={value.rejectionRatePercentage}
              onChange={(next) => set('rejectionRatePercentage', next)}
            />
            <DecimalInputField
              id="return-recall-rate"
              label="Return or recall rate (%)"
              value={value.returnOrRecallRatePercentage}
              onChange={(next) => set('returnOrRecallRatePercentage', next)}
            />
            <TernaryField
              id="quality-claims"
              label="Quality claims"
              value={value.qualityClaims}
              onChange={(next) => set('qualityClaims', next)}
            />
            <TernaryField
              id="material-recall"
              label="Material recall declaration"
              value={value.materialRecallDeclaration}
              onChange={(next) => set('materialRecallDeclaration', next)}
            />
          </FieldGrid>
          <TextAreaField
            id="quality-claims-details"
            label="Quality claims details"
            value={value.qualityClaimsDetails}
            onChange={(next) => set('qualityClaimsDetails', next)}
          />
          <TextAreaField
            id="material-recall-details"
            label="Material recall details"
            value={value.materialRecallDetails}
            onChange={(next) => set('materialRecallDetails', next)}
          />
        </SubSection>

        <RepeatableList
          title="Certifications"
          description="Quality, product and management system certifications."
          addLabel="Add certification"
          count={value.certifications.length}
          emptyMessage="No certification recorded yet."
          onAdd={() =>
            set('certifications', [...value.certifications, createEmptyQualityCertification()])
          }
        >
          {value.certifications.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.standard || `Certification ${index + 1}`}
              subtitle={item.certificateNumber || 'Certificate number not set'}
              requiresConfirmation={hasRecordData([
                item.standard,
                item.certificateNumber,
                item.issuingBody,
              ])}
              onRemove={() => set('certifications', removeAt(value.certifications, index))}
            >
              <FieldGrid>
                <TextInputField
                  id={`cert-${index}-standard`}
                  label="Standard"
                  value={item.standard}
                  onChange={(next) => setCertification(index, 'standard', next)}
                />
                <TextInputField
                  id={`cert-${index}-number`}
                  label="Certificate number"
                  value={item.certificateNumber}
                  onChange={(next) => setCertification(index, 'certificateNumber', next)}
                />
                <TextInputField
                  id={`cert-${index}-body`}
                  label="Issuing body"
                  value={item.issuingBody}
                  onChange={(next) => setCertification(index, 'issuingBody', next)}
                />
                <DateField
                  id={`cert-${index}-issue`}
                  label="Issue date"
                  value={item.issueDate}
                  onChange={(next) => setCertification(index, 'issueDate', next)}
                />
                <DateField
                  id={`cert-${index}-expiry`}
                  label="Expiry date"
                  value={item.expiryDate}
                  onChange={(next) => setCertification(index, 'expiryDate', next)}
                />
                <SelectField
                  id={`cert-${index}-renewal`}
                  label="Renewal status"
                  value={item.renewalStatus}
                  onChange={(next) =>
                    setCertification(
                      index,
                      'renewalStatus',
                      next as QualityCertification['renewalStatus'],
                    )
                  }
                  options={CERTIFICATION_RENEWAL_STATUS_OPTIONS}
                />
              </FieldGrid>
              <TextAreaField
                id={`cert-${index}-scope`}
                label="Scope"
                value={item.scope}
                onChange={(next) => setCertification(index, 'scope', next)}
              />
              <TextAreaField
                id={`cert-${index}-notes`}
                label="Notes"
                value={item.notes}
                onChange={(next) => setCertification(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>

        <SubSection title="Research & development" description="R&D function, spend and outcomes.">
          <FieldGrid>
            <TernaryField
              id="rd-function-exists"
              label="R&D function exists"
              value={value.rdFunctionExists}
              onChange={(next) => set('rdFunctionExists', next)}
            />
            <SelectField
              id="rd-delivery-model"
              label="R&D delivery model"
              value={value.rdDeliveryModel}
              onChange={(next) =>
                set(
                  'rdDeliveryModel',
                  next as TechnologyQualityResearchAndIntellectualProperty['rdDeliveryModel'],
                )
              }
              options={RD_DELIVERY_MODEL_OPTIONS}
            />
            <DecimalInputField
              id="rd-employee-count"
              label="R&D employee count"
              value={value.rdEmployeeCount}
              onChange={(next) => set('rdEmployeeCount', next)}
            />
          </FieldGrid>
          <TextAreaField
            id="rd-facilities"
            label="R&D facilities"
            value={value.rdFacilities}
            onChange={(next) => set('rdFacilities', next)}
          />
          <AmountUnitToggle unit={amountUnit} onChange={setAmountUnit} />
          <RepeatableList
            title="R&D spend by year"
            description="Spend amounts are stored in rupees; the unit toggle only changes entry and display."
            addLabel="Add R&D spend row"
            count={value.rdSpendRows.length}
            emptyMessage="No R&D spend row yet."
            onAdd={() => set('rdSpendRows', [...value.rdSpendRows, createEmptyRdSpendRow()])}
          >
            {value.rdSpendRows.map((item, index) => (
              <RepeatableCard
                key={item.id}
                title={item.financialYear || `R&D spend ${index + 1}`}
                subtitle={formatMoneyCompact(item.spendAmount)}
                requiresConfirmation={hasRecordData([item.financialYear, item.spendAmount])}
                onRemove={() => set('rdSpendRows', removeAt(value.rdSpendRows, index))}
              >
                <FieldGrid>
                  <TextInputField
                    id={`rd-spend-${index}-year`}
                    label="Financial year"
                    value={item.financialYear}
                    onChange={(next) => setRdSpend(index, 'financialYear', next)}
                  />
                  <AmountInputField
                    id={`rd-spend-${index}-amount`}
                    label="Spend amount"
                    rupees={item.spendAmount}
                    unit={amountUnit}
                    onChange={(next) => setRdSpend(index, 'spendAmount', next)}
                  />
                  <SelectField
                    id={`rd-spend-${index}-source`}
                    label="Source"
                    value={item.source}
                    onChange={(next) =>
                      setRdSpend(index, 'source', next as RdSpendRow['source'])
                    }
                    options={FIGURE_SOURCE_OPTIONS}
                  />
                </FieldGrid>
                <TextAreaField
                  id={`rd-spend-${index}-notes`}
                  label="Notes"
                  value={item.notes}
                  onChange={(next) => setRdSpend(index, 'notes', next)}
                />
              </RepeatableCard>
            ))}
          </RepeatableList>
          <TextAreaField
            id="rd-current-projects"
            label="Current R&D projects"
            value={value.rdCurrentProjects}
            onChange={(next) => set('rdCurrentProjects', next)}
          />
          <TextAreaField
            id="rd-outcomes"
            label="Commercialised outcomes"
            value={value.rdCommercialisedOutcomes}
            onChange={(next) => set('rdCommercialisedOutcomes', next)}
          />
          <TextAreaField
            id="rd-grants"
            label="R&D grants"
            value={value.rdGrants}
            onChange={(next) => set('rdGrants', next)}
          />
          <TextAreaField
            id="rd-collaborations"
            label="R&D collaborations"
            value={value.rdCollaborations}
            onChange={(next) => set('rdCollaborations', next)}
          />
        </SubSection>

        <RepeatableList
          title="Intellectual property"
          description="Patents, trademarks, designs, trade secrets and other IP."
          addLabel="Add IP record"
          count={value.intellectualPropertyRecords.length}
          emptyMessage="No intellectual property record yet."
          onAdd={() =>
            set('intellectualPropertyRecords', [
              ...value.intellectualPropertyRecords,
              createEmptyIntellectualPropertyRecord(),
            ])
          }
        >
          {value.intellectualPropertyRecords.map((item, index) => (
            <RepeatableCard
              key={item.id}
              title={item.nameOrDescription || `IP record ${index + 1}`}
              subtitle={`${ipTypeLabel(item.ipType)} · ${ipStatusLabel(item.status)}`}
              requiresConfirmation={hasRecordData([
                item.nameOrDescription,
                item.ipType,
                item.registrationOrApplicationNumber,
              ])}
              onRemove={() =>
                set(
                  'intellectualPropertyRecords',
                  removeAt(value.intellectualPropertyRecords, index),
                )
              }
            >
              <FieldGrid>
                <SelectField
                  id={`ip-${index}-type`}
                  label="IP type"
                  value={item.ipType}
                  onChange={(next) =>
                    setIp(index, 'ipType', next as IntellectualPropertyRecord['ipType'])
                  }
                  options={IP_TYPE_OPTIONS}
                />
                <TextInputField
                  id={`ip-${index}-name`}
                  label="Name or description"
                  value={item.nameOrDescription}
                  onChange={(next) => setIp(index, 'nameOrDescription', next)}
                />
                <TextInputField
                  id={`ip-${index}-owner`}
                  label="Owner or applicant"
                  value={item.ownerOrApplicant}
                  onChange={(next) => setIp(index, 'ownerOrApplicant', next)}
                />
                <TextInputField
                  id={`ip-${index}-number`}
                  label="Registration or application number"
                  value={item.registrationOrApplicationNumber}
                  onChange={(next) => setIp(index, 'registrationOrApplicationNumber', next)}
                />
                <TextInputField
                  id={`ip-${index}-jurisdiction`}
                  label="Jurisdiction"
                  value={item.jurisdiction}
                  onChange={(next) => setIp(index, 'jurisdiction', next)}
                />
                <SelectField
                  id={`ip-${index}-status`}
                  label="Status"
                  value={item.status}
                  onChange={(next) =>
                    setIp(index, 'status', next as IntellectualPropertyRecord['status'])
                  }
                  options={IP_STATUS_OPTIONS}
                />
                <DateField
                  id={`ip-${index}-filing`}
                  label="Filing date"
                  value={item.filingDate}
                  onChange={(next) => setIp(index, 'filingDate', next)}
                />
                <DateField
                  id={`ip-${index}-registration`}
                  label="Registration date"
                  value={item.registrationDate}
                  onChange={(next) => setIp(index, 'registrationDate', next)}
                />
                <DateField
                  id={`ip-${index}-expiry`}
                  label="Expiry date"
                  value={item.expiryDate}
                  onChange={(next) => setIp(index, 'expiryDate', next)}
                />
                <SelectField
                  id={`ip-${index}-ownership`}
                  label="Ownership model"
                  value={item.ownershipModel}
                  onChange={(next) =>
                    setIp(
                      index,
                      'ownershipModel',
                      next as IntellectualPropertyRecord['ownershipModel'],
                    )
                  }
                  options={IP_OWNERSHIP_MODEL_OPTIONS}
                />
                <SelectField
                  id={`ip-${index}-materiality`}
                  label="Materiality status"
                  value={item.materialityStatus}
                  onChange={(next) =>
                    setIp(
                      index,
                      'materialityStatus',
                      next as IntellectualPropertyRecord['materialityStatus'],
                    )
                  }
                  options={MATERIALITY_STATUS_OPTIONS}
                />
                <TernaryField
                  id={`ip-${index}-dispute`}
                  label="Dispute or opposition"
                  value={item.disputeOrOpposition}
                  onChange={(next) => setIp(index, 'disputeOrOpposition', next)}
                />
              </FieldGrid>
              <TextAreaField
                id={`ip-${index}-products`}
                label="Related products"
                value={item.relatedProducts}
                onChange={(next) => setIp(index, 'relatedProducts', next)}
              />
              <TextAreaField
                id={`ip-${index}-licence`}
                label="Licence terms"
                value={item.licenceTerms}
                onChange={(next) => setIp(index, 'licenceTerms', next)}
              />
              <TextAreaField
                id={`ip-${index}-dispute-details`}
                label="Dispute or opposition details"
                value={item.disputeOrOppositionDetails}
                onChange={(next) => setIp(index, 'disputeOrOppositionDetails', next)}
              />
              <TextAreaField
                id={`ip-${index}-notes`}
                label="Notes"
                value={item.notes}
                onChange={(next) => setIp(index, 'notes', next)}
              />
            </RepeatableCard>
          ))}
        </RepeatableList>

        <TextAreaField
          id="tech-section-notes"
          label="Section notes"
          value={value.notes}
          onChange={(next) => set('notes', next)}
        />

        <BusinessOperationsSectionActions sectionId={SECTION_ID} />
      </div>
    </SectionCard>
  );
}
