'use client';

import { AcquisitionsInvestmentsForm } from '@/components/objects-of-issue/forms/acquisitions-investments-form';
import { CapexExpansionForm } from '@/components/objects-of-issue/forms/capex-expansion-form';
import { ExpensesGcpConfirmationsForm } from '@/components/objects-of-issue/forms/expenses-gcp-confirmations-form';
import { MeansFinanceDeploymentForm } from '@/components/objects-of-issue/forms/means-finance-deployment-form';
import { ObjectsRegisterForm } from '@/components/objects-of-issue/forms/objects-register-form';
import { ProceedsFundingForm } from '@/components/objects-of-issue/forms/proceeds-funding-form';
import { WorkingCapitalBorrowingForm } from '@/components/objects-of-issue/forms/working-capital-borrowing-form';
import { ObjectsOfIssueSectionNavigation } from '@/components/objects-of-issue/section-navigation';
import { useObjectsOfIssue } from '@/lib/objects-of-issue/context';
import { OBJECTS_OF_ISSUE_INFORMATION_SECTIONS } from '@/lib/objects-of-issue/options';
import type { ObjectsOfIssueSectionId } from '@/lib/objects-of-issue/types';

export function ObjectsOfIssueInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: ObjectsOfIssueSectionId;
  onSectionChange: (section: ObjectsOfIssueSectionId) => void;
}) {
  const { progress, dirtySections } = useObjectsOfIssue();
  const meta = OBJECTS_OF_ISSUE_INFORMATION_SECTIONS.find(
    (section) => section.id === activeSection,
  );

  const selectSection = (section: ObjectsOfIssueSectionId) => {
    if (section === activeSection) return;
    onSectionChange(section);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ObjectsOfIssueSectionNavigation
        activeSection={activeSection}
        progress={progress}
        dirtySections={dirtySections}
        onSelect={selectSection}
      />
      <div className="min-w-0 space-y-4">
        {meta ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
        {activeSection === 'proceeds-and-funding-summary' ? <ProceedsFundingForm /> : null}
        {activeSection === 'objects-register-and-allocation' ? <ObjectsRegisterForm /> : null}
        {activeSection === 'capital-expenditure-facilities-and-expansion' ? (
          <CapexExpansionForm />
        ) : null}
        {activeSection === 'working-capital-and-borrowing-repayment' ? (
          <WorkingCapitalBorrowingForm />
        ) : null}
        {activeSection === 'acquisitions-subsidiaries-jvs-and-investments' ? (
          <AcquisitionsInvestmentsForm />
        ) : null}
        {activeSection === 'means-of-finance-and-deployment-schedule' ? (
          <MeansFinanceDeploymentForm />
        ) : null}
        {activeSection === 'expenses-gcp-monitoring-and-confirmations' ? (
          <ExpensesGcpConfirmationsForm />
        ) : null}
      </div>
    </div>
  );
}
