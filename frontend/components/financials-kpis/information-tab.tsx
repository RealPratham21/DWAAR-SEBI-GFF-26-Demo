'use client';

import { BalanceSheetForm } from '@/components/financials-kpis/forms/balance-sheet-form';
import { KpiGovernanceForm } from '@/components/financials-kpis/forms/kpi-governance-form';
import { MdaConfirmationsForm } from '@/components/financials-kpis/forms/mda-confirmations-form';
import { OtherFinancialForm } from '@/components/financials-kpis/forms/other-financial-form';
import { ProfitLossForm } from '@/components/financials-kpis/forms/profit-loss-form';
import { RatiosMetricsForm } from '@/components/financials-kpis/forms/ratios-metrics-form';
import { ReportingScopeForm } from '@/components/financials-kpis/forms/reporting-scope-form';
import { RestatementAuditForm } from '@/components/financials-kpis/forms/restatement-audit-form';
import { FinancialsKpisSectionNavigation } from '@/components/financials-kpis/section-navigation';
import { NivaraSampleDataPanel } from '@/components/demo-data/nivara-sample-data-panel';
import { useFinancialsKpis } from '@/lib/financials-kpis/context';
import { FINANCIALS_KPIS_INFORMATION_SECTIONS } from '@/lib/financials-kpis/options';
import type { FinancialsKpisPayload, FinancialsKpisSectionId } from '@/lib/schemas/financials-kpis';

export function FinancialsKpisInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: FinancialsKpisSectionId;
  onSectionChange: (section: FinancialsKpisSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave, isDirty, applySampleDraft, isLoading } =
    useFinancialsKpis();
  const meta = FINANCIALS_KPIS_INFORMATION_SECTIONS.find(
    (section) => section.id === activeSection,
  );

  const selectSection = (section: FinancialsKpisSectionId) => {
    if (section === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(section);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FinancialsKpisSectionNavigation
        activeSection={activeSection}
        progress={progress}
        dirtySections={dirtySections}
        onSelect={selectSection}
      />
      <div className="min-w-0 space-y-4">
        <NivaraSampleDataPanel<FinancialsKpisPayload>
          workstreamKey="financials-kpis"
          isDirty={isDirty}
          disabled={isLoading}
          applySampleDraft={applySampleDraft}
        />
        {meta ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
        {activeSection === 'reporting-scope-periods-and-auditor-readiness' ? (
          <ReportingScopeForm />
        ) : null}
        {activeSection === 'restated-statement-of-profit-and-loss' ? <ProfitLossForm /> : null}
        {activeSection === 'assets-liabilities-equity-and-cash-flows' ? (
          <BalanceSheetForm />
        ) : null}
        {activeSection === 'restatement-adjustments-policies-and-auditor-matters' ? (
          <RestatementAuditForm />
        ) : null}
        {activeSection === 'other-financial-information' ? <OtherFinancialForm /> : null}
        {activeSection === 'ratios-capitalisation-and-issue-price-metrics' ? (
          <RatiosMetricsForm />
        ) : null}
        {activeSection === 'kpi-selection-governance-and-peer-comparison' ? (
          <KpiGovernanceForm />
        ) : null}
        {activeSection === 'mda-trends-material-developments-and-confirmations' ? (
          <MdaConfirmationsForm />
        ) : null}
      </div>
    </div>
  );
}
