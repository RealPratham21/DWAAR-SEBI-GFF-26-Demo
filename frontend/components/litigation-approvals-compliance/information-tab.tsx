'use client';

import type { ComponentType } from 'react';
import { ApprovalConditionsForm } from '@/components/litigation-approvals-compliance/forms/approval-conditions-form';
import { ApprovalsMasterForm } from '@/components/litigation-approvals-compliance/forms/approvals-master-form';
import { ComplianceExceptionsForm } from '@/components/litigation-approvals-compliance/forms/compliance-exceptions-form';
import { CreditorsDevelopmentsForm } from '@/components/litigation-approvals-compliance/forms/creditors-developments-form';
import { CriminalRegulatoryForm } from '@/components/litigation-approvals-compliance/forms/criminal-regulatory-form';
import { LegalUniverseForm } from '@/components/litigation-approvals-compliance/forms/legal-universe-form';
import { MattersMasterForm } from '@/components/litigation-approvals-compliance/forms/matters-master-form';
import { ReconciliationForm } from '@/components/litigation-approvals-compliance/forms/reconciliation-form';
import { LitigationApprovalsComplianceSectionNavigation } from '@/components/litigation-approvals-compliance/section-navigation';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useLitigationApprovalsCompliance } from '@/lib/litigation-approvals-compliance/context';
import { LAC_INFORMATION_SECTIONS } from '@/lib/litigation-approvals-compliance/options';
import type {
  LitigationApprovalsCompliancePayload,
  LitigationApprovalsComplianceSectionId,
} from '@/lib/schemas/litigation-approvals-compliance';

const FORM_BY_SECTION: Record<LitigationApprovalsComplianceSectionId, ComponentType> = {
  'legal-universe-materiality-policy-and-party-mapping': LegalUniverseForm,
  'litigation-and-proceedings-master': MattersMasterForm,
  'criminal-regulatory-tax-and-enforcement-readiness': CriminalRegulatoryForm,
  'government-regulatory-and-business-approvals-master': ApprovalsMasterForm,
  'approval-conditions-facility-compliance-and-renewal-readiness': ApprovalConditionsForm,
  'corporate-statutory-and-operational-compliance-exceptions': ComplianceExceptionsForm,
  'material-creditors-penalties-and-material-developments': CreditorsDevelopmentsForm,
  'reconciliation-remediation-and-issuer-confirmations': ReconciliationForm,
};

export function LitigationApprovalsComplianceInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: LitigationApprovalsComplianceSectionId;
  onSectionChange: (section: LitigationApprovalsComplianceSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useLitigationApprovalsCompliance();
  const sectionMeta = LAC_INFORMATION_SECTIONS.find((s) => s.id === activeSection);
  const ActiveForm = FORM_BY_SECTION[activeSection];

  const handleSectionChange = (sectionId: LitigationApprovalsComplianceSectionId) => {
    if (sectionId === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(sectionId);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <LitigationApprovalsComplianceSectionNavigation
          activeSection={activeSection}
          progress={progress}
          dirtySections={dirtySections}
          onSelect={handleSectionChange}
        />
      </aside>

      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<LitigationApprovalsCompliancePayload>
          workstreamKey="litigation-approvals-compliance"
          isDirty={isDirty}
          disabled={isLoading}
          applySampleDraft={applySampleDraft}
        />
        {sectionMeta ? (
          <p className="text-sm text-muted-foreground">{sectionMeta.description}</p>
        ) : null}
        <ActiveForm />
      </div>
    </div>
  );
}
