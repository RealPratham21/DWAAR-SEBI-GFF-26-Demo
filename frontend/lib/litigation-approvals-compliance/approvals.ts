/**
 * Approval Master helpers — single canonical approval namespace.
 */

import type {
  ApprovalRecord,
  LitigationApprovalsCompliancePayload,
} from '@/lib/schemas/litigation-approvals-compliance';

export function getApprovals(payload: LitigationApprovalsCompliancePayload): ApprovalRecord[] {
  return payload.governmentRegulatoryAndBusinessApprovalsMaster.approvals;
}

export function getApprovalById(
  payload: LitigationApprovalsCompliancePayload,
  approvalId: string,
): ApprovalRecord | undefined {
  if (!approvalId) return undefined;
  return getApprovals(payload).find((approval) => approval.approvalId === approvalId);
}

export function formatApprovalLabel(
  approval: ApprovalRecord | undefined,
  fallbackId = '',
): string {
  if (!approval) {
    return fallbackId ? `Unknown approval (${fallbackId.slice(0, 8)})` : 'Unknown approval';
  }

  const name = approval.identity.approvalLicenceName.trim();
  const holder = approval.holder.displayName.trim();
  const category = approval.identity.category.replaceAll('-', ' ');
  const authority = approval.authority.issuingAuthority.trim();

  const parts = [name, holder, category, authority].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : approval.approvalId.slice(0, 8);
}

export function isPerpetualApproval(approval: ApprovalRecord | undefined): boolean {
  return approval?.details.perpetualNoExpiry === 'yes';
}

export function isRenewableApproval(approval: ApprovalRecord | undefined): boolean {
  if (!approval) return false;
  if (isPerpetualApproval(approval)) return false;
  return (
    approval.details.renewalFrequency.trim().length > 0 ||
    approval.renewalMetadata.renewalDueDate.trim().length > 0 ||
    approval.status === 'renewal-pending' ||
    approval.status === 'expired-renewal-applied' ||
    approval.status === 'expired-renewal-not-applied'
  );
}
