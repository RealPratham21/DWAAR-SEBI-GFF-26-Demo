import { PageHeader } from '@/components/page-header';
import { RevenueBreakdownVisualization, MachineryExpenditureVisualization } from '@/components/drhp-visualizations';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="DRHP Analytics"
        description="Interactive visualizations and detailed breakdowns of your IPO documentation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Analytics' },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-card border border-border rounded-lg p-6">
          <RevenueBreakdownVisualization />
        </div>

        {/* Machinery Expenditure */}
        <div className="bg-card border border-border rounded-lg p-6">
          <MachineryExpenditureVisualization />
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-2">Revenue Concentration</h3>
          <p className="text-2xl font-bold text-accent mb-2">45%</p>
          <p className="text-sm text-muted-foreground">
            Technology Consulting generates largest revenue share with steady growth trajectory.
          </p>
        </div>

        <div className="bg-success/10 border border-success/20 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-2">Capex Support Level</h3>
          <p className="text-2xl font-bold text-success mb-2">75%</p>
          <p className="text-sm text-muted-foreground">
            ₹2.40 Cr of ₹3.20 Cr capex supported by formal quotations.
          </p>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-2">Evidence Gap</h3>
          <p className="text-2xl font-bold text-warning mb-2">₹0.80 Cr</p>
          <p className="text-sm text-muted-foreground">
            Additional quotations and support needed for facility upgrades.
          </p>
        </div>
      </div>
    </div>
  );
}
