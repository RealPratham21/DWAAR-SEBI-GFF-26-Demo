'use client';

import {
  AssetSelect,
  ContractSelect,
  FacilitySelect,
  FieldGrid,
  PropertySelect,
  SectionCard,
  SelectField,
  SubSection,
  TernaryField,
  TextAreaField,
  TextInputField,
} from '@/components/borrowings-assets-contracts/form-helpers';
import {
  RepeatableCard,
  RepeatableList,
  removeAt,
  replaceAt,
} from '@/components/borrowings-assets-contracts/repeatable-card';
import { BorrowingsAssetsContractsSectionActions } from '@/components/borrowings-assets-contracts/section-actions';
import { DecimalInputField } from '@/components/management-governance/form-helpers';
import { useBorrowingsAssetsContracts } from '@/lib/borrowings-assets-contracts/context';
import {
  createEmptyAssetFinancialsReconciliation,
  createEmptyInsuranceLinkageRecord,
  createEmptyIpContractualDependencyRecord,
  createEmptyMaterialAssetRecord,
} from '@/lib/borrowings-assets-contracts/defaults';
import { formatAssetLabel } from '@/lib/borrowings-assets-contracts/masters';
import {
  countAssetReferences,
  formatAssetDependencyMessage,
} from '@/lib/borrowings-assets-contracts/references';
import {
  ASSET_CLASS_OPTIONS,
  ASSET_OWNERSHIP_BASIS_OPTIONS,
  INSURANCE_COVERAGE_STATUS_OPTIONS,
  RECONCILIATION_STATUS_OPTIONS,
} from '@/lib/borrowings-assets-contracts/options';
import type {
  AssetClass,
  AssetOwnershipBasis,
  InsuranceCoverageStatus,
  MaterialAssetRecord,
  MaterialAssetsEncumbranceAndInsuranceLinkage,
  ReconciliationStatus,
} from '@/lib/schemas/borrowings-assets-contracts';

const SECTION_ID = 'material-assets-encumbrance-and-insurance-linkage' as const;

function assetHasData(asset: MaterialAssetRecord): boolean {
  return Boolean(asset.description.trim() || asset.assetClass || asset.identificationSerialRegistrationNumber.trim());
}

export function MaterialAssetsForm() {
  const { payload, updateSection } = useBorrowingsAssetsContracts();
  const value = payload.materialAssetsEncumbranceAndInsuranceLinkage;

  const set = <K extends keyof MaterialAssetsEncumbranceAndInsuranceLinkage>(
    key: K,
    next: MaterialAssetsEncumbranceAndInsuranceLinkage[K],
  ) => {
    updateSection('materialAssetsEncumbranceAndInsuranceLinkage', { ...value, [key]: next }, SECTION_ID);
  };

  const setAssets = (next: MaterialAssetRecord[]) => set('assets', next);

  const removeAsset = (index: number) => {
    const asset = value.assets[index];
    const deps = countAssetReferences(payload, asset.id);
    if (deps.length > 0) {
      window.alert(formatAssetDependencyMessage(payload, asset.id, deps));
      return;
    }
    if (assetHasData(asset) && !window.confirm('Remove this asset?')) return;
    setAssets(removeAt(value.assets, index));
  };

  return (
    <SectionCard
      title="Material Assets, Encumbrance & Insurance Linkage"
      description="Material asset register, encumbrance, insurance and IP dependency linkage."
    >
      <RepeatableList
        title="Material asset register"
        addLabel="Add asset"
        onAdd={() => setAssets([...value.assets, createEmptyMaterialAssetRecord()])}
        emptyMessage="No material assets recorded yet."
        count={value.assets.length}
      >
        {value.assets.map((asset, index) => (
          <RepeatableCard
            key={asset.id}
            title={formatAssetLabel(asset) || `Asset ${index + 1}`}
            subtitle={asset.assetClass.replaceAll('-', ' ') || undefined}
            onRemove={() => removeAsset(index)}
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`asset-${asset.id}-description`}
                label="Description"
                value={asset.description}
                onChange={(next) =>
                  setAssets(replaceAt(value.assets, index, { ...asset, description: next }))
                }
              />
              <SelectField
                id={`asset-${asset.id}-class`}
                label="Asset class"
                value={asset.assetClass}
                onChange={(next) =>
                  setAssets(
                    replaceAt(value.assets, index, {
                      ...asset,
                      assetClass: next as AssetClass | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...ASSET_CLASS_OPTIONS]}
              />
              <TextInputField
                id={`asset-${asset.id}-serial`}
                label="Serial / registration number"
                value={asset.identificationSerialRegistrationNumber}
                onChange={(next) =>
                  setAssets(
                    replaceAt(value.assets, index, {
                      ...asset,
                      identificationSerialRegistrationNumber: next,
                    }),
                  )
                }
              />
              <PropertySelect
                id={`asset-${asset.id}-property`}
                label="Linked property"
                value={asset.linkedPropertyId}
                onChange={(next) =>
                  setAssets(replaceAt(value.assets, index, { ...asset, linkedPropertyId: next }))
                }
                payload={payload}
              />
              <FacilitySelect
                id={`asset-${asset.id}-facility`}
                label="Linked facility"
                value={asset.linkedFacilityId}
                onChange={(next) =>
                  setAssets(replaceAt(value.assets, index, { ...asset, linkedFacilityId: next }))
                }
                payload={payload}
              />
              <SelectField
                id={`asset-${asset.id}-ownership`}
                label="Ownership basis"
                value={asset.ownershipBasis}
                onChange={(next) =>
                  setAssets(
                    replaceAt(value.assets, index, {
                      ...asset,
                      ownershipBasis: next as AssetOwnershipBasis | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...ASSET_OWNERSHIP_BASIS_OPTIONS]}
              />
              <TernaryField
                id={`asset-${asset.id}-material`}
                label="Material to operations"
                value={asset.materialToOperations}
                onChange={(next) =>
                  setAssets(replaceAt(value.assets, index, { ...asset, materialToOperations: next }))
                }
              />
              <TernaryField
                id={`asset-${asset.id}-encumbered`}
                label="Encumbered"
                value={asset.encumbered}
                onChange={(next) =>
                  setAssets(replaceAt(value.assets, index, { ...asset, encumbered: next }))
                }
              />
              <DecimalInputField
                id={`asset-${asset.id}-book-value`}
                label="Latest book value"
                value={asset.latestBookValue}
                onChange={(next) =>
                  setAssets(replaceAt(value.assets, index, { ...asset, latestBookValue: next }))
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Insurance linkage"
        addLabel="Add insurance linkage"
        onAdd={() =>
          set('insuranceLinkages', [...value.insuranceLinkages, createEmptyInsuranceLinkageRecord()])
        }
        emptyMessage="No insurance linkages recorded yet."
        count={value.insuranceLinkages.length}
      >
        {value.insuranceLinkages.map((insurance, index) => (
          <RepeatableCard
            key={insurance.id}
            title={insurance.policyType || `Insurance ${index + 1}`}
            onRemove={() => set('insuranceLinkages', removeAt(value.insuranceLinkages, index))}
          >
            <FieldGrid columns={3}>
              <PropertySelect
                id={`ins-${insurance.id}-property`}
                label="Linked property"
                value={insurance.linkedPropertyId}
                onChange={(next) =>
                  set(
                    'insuranceLinkages',
                    replaceAt(value.insuranceLinkages, index, {
                      ...insurance,
                      linkedPropertyId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <AssetSelect
                id={`ins-${insurance.id}-asset`}
                label="Linked asset"
                value={insurance.linkedAssetId}
                onChange={(next) =>
                  set(
                    'insuranceLinkages',
                    replaceAt(value.insuranceLinkages, index, { ...insurance, linkedAssetId: next }),
                  )
                }
                payload={payload}
              />
              <TextInputField
                id={`ins-${insurance.id}-insurer`}
                label="Insurer"
                value={insurance.insurer}
                onChange={(next) =>
                  set(
                    'insuranceLinkages',
                    replaceAt(value.insuranceLinkages, index, { ...insurance, insurer: next }),
                  )
                }
              />
              <DecimalInputField
                id={`ins-${insurance.id}-coverage`}
                label="Coverage amount"
                value={insurance.coverageAmount}
                onChange={(next) =>
                  set(
                    'insuranceLinkages',
                    replaceAt(value.insuranceLinkages, index, { ...insurance, coverageAmount: next }),
                  )
                }
              />
              <SelectField
                id={`ins-${insurance.id}-status`}
                label="Coverage status"
                value={insurance.coverageStatus}
                onChange={(next) =>
                  set(
                    'insuranceLinkages',
                    replaceAt(value.insuranceLinkages, index, {
                      ...insurance,
                      coverageStatus: next as InsuranceCoverageStatus | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...INSURANCE_COVERAGE_STATUS_OPTIONS]}
              />
              <TernaryField
                id={`ins-${insurance.id}-loss-payee`}
                label="Lender loss payee clause"
                value={insurance.lenderLossPayeeClause}
                onChange={(next) =>
                  set(
                    'insuranceLinkages',
                    replaceAt(value.insuranceLinkages, index, {
                      ...insurance,
                      lenderLossPayeeClause: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="IP contractual dependencies"
        addLabel="Add IP dependency"
        onAdd={() =>
          set('ipContractualDependencies', [
            ...value.ipContractualDependencies,
            createEmptyIpContractualDependencyRecord(),
          ])
        }
        emptyMessage="No IP dependencies recorded yet."
        count={value.ipContractualDependencies.length}
      >
        {value.ipContractualDependencies.map((dependency, index) => (
          <RepeatableCard
            key={dependency.id}
            title={dependency.ownedLicensed || `IP dependency ${index + 1}`}
            onRemove={() =>
              set('ipContractualDependencies', removeAt(value.ipContractualDependencies, index))
            }
          >
            <FieldGrid columns={3}>
              <TextInputField
                id={`ip-${dependency.id}-licensor`}
                label="Licensor"
                value={dependency.licensor}
                onChange={(next) =>
                  set(
                    'ipContractualDependencies',
                    replaceAt(value.ipContractualDependencies, index, {
                      ...dependency,
                      licensor: next,
                    }),
                  )
                }
              />
              <ContractSelect
                id={`ip-${dependency.id}-contract`}
                label="Linked contract"
                value={dependency.linkedContractId}
                onChange={(next) =>
                  set(
                    'ipContractualDependencies',
                    replaceAt(value.ipContractualDependencies, index, {
                      ...dependency,
                      linkedContractId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <TernaryField
                id={`ip-${dependency.id}-coc`}
                label="Change of control clause"
                value={dependency.changeOfControl}
                onChange={(next) =>
                  set(
                    'ipContractualDependencies',
                    replaceAt(value.ipContractualDependencies, index, {
                      ...dependency,
                      changeOfControl: next,
                    }),
                  )
                }
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <RepeatableList
        title="Asset financials reconciliation"
        addLabel="Add reconciliation row"
        onAdd={() =>
          set('assetFinancialsReconciliations', [
            ...value.assetFinancialsReconciliations,
            createEmptyAssetFinancialsReconciliation(),
          ])
        }
        emptyMessage="No asset reconciliations recorded yet."
        count={value.assetFinancialsReconciliations.length}
      >
        {value.assetFinancialsReconciliations.map((reconciliation, index) => (
          <RepeatableCard
            key={reconciliation.id}
            title={`Reconciliation ${index + 1}`}
            onRemove={() =>
              set('assetFinancialsReconciliations', removeAt(value.assetFinancialsReconciliations, index))
            }
          >
            <FieldGrid columns={3}>
              <AssetSelect
                id={`ar-${reconciliation.id}-asset`}
                label="Linked asset"
                value={reconciliation.linkedAssetId}
                onChange={(next) =>
                  set(
                    'assetFinancialsReconciliations',
                    replaceAt(value.assetFinancialsReconciliations, index, {
                      ...reconciliation,
                      linkedAssetId: next,
                    }),
                  )
                }
                payload={payload}
              />
              <DecimalInputField
                id={`ar-${reconciliation.id}-register`}
                label="Register value"
                value={reconciliation.materialAssetRegisterValue}
                onChange={(next) =>
                  set(
                    'assetFinancialsReconciliations',
                    replaceAt(value.assetFinancialsReconciliations, index, {
                      ...reconciliation,
                      materialAssetRegisterValue: next,
                    }),
                  )
                }
              />
              <SelectField
                id={`ar-${reconciliation.id}-status`}
                label="Reconciliation status"
                value={reconciliation.reconciliationStatus}
                onChange={(next) =>
                  set(
                    'assetFinancialsReconciliations',
                    replaceAt(value.assetFinancialsReconciliations, index, {
                      ...reconciliation,
                      reconciliationStatus: next as ReconciliationStatus | '',
                    }),
                  )
                }
                options={[{ value: '', label: 'Select…' }, ...RECONCILIATION_STATUS_OPTIONS]}
              />
            </FieldGrid>
          </RepeatableCard>
        ))}
      </RepeatableList>

      <BorrowingsAssetsContractsSectionActions sectionId={SECTION_ID} />
    </SectionCard>
  );
}
