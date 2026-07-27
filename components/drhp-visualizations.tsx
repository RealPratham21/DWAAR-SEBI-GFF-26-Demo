'use client';

import { useState } from 'react';
import { AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

export function RevenueBreakdownVisualization() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const segments = [
    { name: 'Technology Consulting', revenue: 27.68, percentage: 45, color: 'bg-accent' },
    { name: 'Digital Transformation', revenue: 18.48, percentage: 30, color: 'bg-success' },
    { name: 'Support Services', revenue: 12.30, percentage: 20, color: 'bg-warning' },
    { name: 'Other Services', revenue: 3.04, percentage: 5, color: 'bg-muted' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-accent" />
          Revenue Mix by Segment (FY2024)
        </h4>
        <div className="space-y-3">
          {segments.map((segment) => (
            <div
              key={segment.name}
              onClick={() => setSelectedSegment(selectedSegment === segment.name ? null : segment.name)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                selectedSegment === segment.name
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground text-sm">{segment.name}</span>
                <span className="text-sm font-bold text-accent">₹{segment.revenue.toFixed(2)} Cr</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${segment.color} transition-all`}
                    style={{ width: `${segment.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                  {segment.percentage}%
                </span>
              </div>
              {selectedSegment === segment.name && (
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <p>
                    This segment represents <span className="font-semibold text-foreground">₹{segment.revenue.toFixed(2)} Crore</span> of
                    total revenue and has shown consistent growth over the past 3 years.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MachineryExpenditureVisualization() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const machinery = [
    { name: 'CNC Machines', proposed: 120, supported: 120, status: 'verified' },
    { name: 'Testing Equipment', proposed: 80, supported: 80, status: 'verified' },
    { name: 'Facility Upgrades', proposed: 60, supported: 40, status: 'gap' },
    { name: 'Support Infrastructure', proposed: 40, supported: 0, status: 'gap' },
  ];

  const totalProposed = machinery.reduce((sum, item) => sum + item.proposed, 0);
  const totalSupported = machinery.reduce((sum, item) => sum + item.supported, 0);
  const totalGap = totalProposed - totalSupported;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-accent" />
          Machinery Expenditure Breakdown
        </h4>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Proposed</p>
            <p className="font-bold text-accent">₹{totalProposed} Lakh</p>
          </div>
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Supported</p>
            <p className="font-bold text-success">₹{totalSupported} Lakh</p>
          </div>
          <div className={`p-3 rounded-lg border ${
            totalGap > 0
              ? 'bg-destructive/10 border-destructive/20'
              : 'bg-success/10 border-success/20'
          }`}>
            <p className="text-xs text-muted-foreground mb-1">Gap</p>
            <p className={`font-bold ${totalGap > 0 ? 'text-destructive' : 'text-success'}`}>
              ₹{totalGap} Lakh
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Overall Support Level</span>
            <span className="text-sm font-bold text-foreground">{Math.round((totalSupported / totalProposed) * 100)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${(totalSupported / totalProposed) * 100}%` }}
            />
          </div>
        </div>

        {/* Detail Items */}
        <div className="space-y-2">
          {machinery.map((item) => {
            const gapAmount = item.proposed - item.supported;
            const supportPercentage = Math.round((item.supported / item.proposed) * 100);
            const isExpanded = expandedItem === item.name;

            return (
              <div
                key={item.name}
                onClick={() => setExpandedItem(isExpanded ? null : item.name)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  isExpanded
                    ? item.status === 'gap'
                      ? 'bg-destructive/10 border-destructive/20'
                      : 'bg-success/10 border-success/20'
                    : 'border-border hover:border-border/80 bg-card'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {item.status === 'gap' && (
                      <AlertCircle size={16} className="text-destructive flex-shrink-0" />
                    )}
                    <span className="text-sm font-bold text-foreground">₹{item.proposed}L</span>
                  </div>
                </div>

                {/* Stacked Bar */}
                <div className="flex gap-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${(item.supported / item.proposed) * 100}%` }}
                  />
                  {gapAmount > 0 && (
                    <div
                      className="h-full bg-destructive transition-all"
                      style={{ width: `${(gapAmount / item.proposed) * 100}%` }}
                    />
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proposed Amount:</span>
                      <span className="font-semibold text-foreground">₹{item.proposed} Lakh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supported by Quotations:</span>
                      <span className={`font-semibold ${item.supported > 0 ? 'text-success' : 'text-destructive'}`}>
                        ₹{item.supported} Lakh
                      </span>
                    </div>
                    {gapAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gap in Evidence:</span>
                        <span className="font-semibold text-destructive">₹{gapAmount} Lakh</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Support Level:</span>
                      <span className={`font-semibold ${supportPercentage === 100 ? 'text-success' : 'text-warning'}`}>
                        {supportPercentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
