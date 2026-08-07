'use client';

import { CompetitionForm } from '@/components/industry-market/forms/competition-form';
import { DemandTrendsForm } from '@/components/industry-market/forms/demand-trends-form';
import { IndustryScopeForm } from '@/components/industry-market/forms/industry-scope-form';
import { MacroeconomicContextForm } from '@/components/industry-market/forms/macroeconomic-context-form';
import { MarketSizeForm } from '@/components/industry-market/forms/market-size-form';
import { OutlookConfirmationsForm } from '@/components/industry-market/forms/outlook-confirmations-form';
import { ResearchSourcesForm } from '@/components/industry-market/forms/research-sources-form';
import { ValueChainForm } from '@/components/industry-market/forms/value-chain-form';
import { IndustryMarketSectionNavigation } from '@/components/industry-market/section-navigation';
import { useIndustryMarket } from '@/lib/industry-market/context';
import { INDUSTRY_MARKET_INFORMATION_SECTIONS } from '@/lib/industry-market/options';
import type { IndustryMarketSectionId } from '@/lib/schemas/industry-market';

export function IndustryMarketInformationTab({
  activeSection,
  onSectionChange,
}: {
  activeSection: IndustryMarketSectionId;
  onSectionChange: (section: IndustryMarketSectionId) => void;
}) {
  const { progress, dirtySections, confirmLeave } = useIndustryMarket();
  const meta = INDUSTRY_MARKET_INFORMATION_SECTIONS.find(
    (section) => section.id === activeSection,
  );

  const selectSection = (section: IndustryMarketSectionId) => {
    if (section === activeSection) return;
    if (!confirmLeave(activeSection)) return;
    onSectionChange(section);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <IndustryMarketSectionNavigation
        activeSection={activeSection}
        progress={progress}
        dirtySections={dirtySections}
        onSelect={selectSection}
      />
      <div className="min-w-0 space-y-4">
        {meta ? <p className="text-sm text-muted-foreground">{meta.description}</p> : null}
        {activeSection === 'industry-scope-and-company-market-mapping' ? (
          <IndustryScopeForm />
        ) : null}
        {activeSection === 'research-sources-and-industry-report-governance' ? (
          <ResearchSourcesForm />
        ) : null}
        {activeSection === 'macroeconomic-and-industry-context' ? (
          <MacroeconomicContextForm />
        ) : null}
        {activeSection === 'market-size-segmentation-and-growth' ? <MarketSizeForm /> : null}
        {activeSection === 'demand-drivers-end-markets-trends-and-policy' ? (
          <DemandTrendsForm />
        ) : null}
        {activeSection === 'value-chain-supply-structure-and-entry-barriers' ? (
          <ValueChainForm />
        ) : null}
        {activeSection === 'competition-market-share-and-issuer-positioning' ? (
          <CompetitionForm />
        ) : null}
        {activeSection === 'outlook-industry-risks-and-confirmations' ? (
          <OutlookConfirmationsForm />
        ) : null}
      </div>
    </div>
  );
}
