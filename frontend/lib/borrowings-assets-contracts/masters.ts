/**
 * Property, Asset and Contract Master helpers.
 */

import type {
  BorrowingsAssetsContractsPayload,
  ContractRecord,
  MaterialAssetRecord,
  PropertyRecord,
} from '@/lib/schemas/borrowings-assets-contracts';

export function getProperties(payload: BorrowingsAssetsContractsPayload): PropertyRecord[] {
  return payload.immovablePropertiesAndOccupancyRights.properties;
}

export function getPropertyById(
  payload: BorrowingsAssetsContractsPayload,
  propertyId: string,
): PropertyRecord | undefined {
  if (!propertyId) return undefined;
  return getProperties(payload).find((property) => property.id === propertyId);
}

export function formatPropertyLabel(
  property: PropertyRecord | undefined,
  fallbackId = '',
): string {
  if (!property) {
    return fallbackId ? `Unknown property (${fallbackId.slice(0, 8)})` : 'Unknown property';
  }

  const name = property.identity.propertyName.trim();
  const address = [property.identity.city.trim(), property.identity.state.trim()]
    .filter(Boolean)
    .join(', ');
  const type = property.identity.propertyType.replaceAll('-', ' ');

  return name || address || type || property.id.slice(0, 8);
}

export function getAssets(payload: BorrowingsAssetsContractsPayload): MaterialAssetRecord[] {
  return payload.materialAssetsEncumbranceAndInsuranceLinkage.assets;
}

export function getAssetById(
  payload: BorrowingsAssetsContractsPayload,
  assetId: string,
): MaterialAssetRecord | undefined {
  if (!assetId) return undefined;
  return getAssets(payload).find((asset) => asset.id === assetId);
}

export function formatAssetLabel(asset: MaterialAssetRecord | undefined, fallbackId = ''): string {
  if (!asset) {
    return fallbackId ? `Unknown asset (${fallbackId.slice(0, 8)})` : 'Unknown asset';
  }

  const description = asset.description.trim();
  const assetClass = asset.assetClass.replaceAll('-', ' ');
  const serial = asset.identificationSerialRegistrationNumber.trim();

  return description || serial || assetClass || asset.id.slice(0, 8);
}

export function getContracts(payload: BorrowingsAssetsContractsPayload): ContractRecord[] {
  return payload.materialBusinessStrategicAndOtherContracts.contracts;
}

export function getContractById(
  payload: BorrowingsAssetsContractsPayload,
  contractId: string,
): ContractRecord | undefined {
  if (!contractId) return undefined;
  return getContracts(payload).find((contract) => contract.id === contractId);
}

export function formatContractLabel(
  contract: ContractRecord | undefined,
  fallbackId = '',
): string {
  if (!contract) {
    return fallbackId ? `Unknown contract (${fallbackId.slice(0, 8)})` : 'Unknown contract';
  }

  const title = contract.basicTerms.agreementTitle.trim();
  const counterparty = contract.parties.counterparty.trim();
  const category = contract.category.replaceAll('-', ' ');

  return title || counterparty || category || contract.id.slice(0, 8);
}
