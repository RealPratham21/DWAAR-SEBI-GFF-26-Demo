'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts';
import { useCompany } from '@/lib/contexts';
import { useQuestionnaire } from '@/lib/contexts';
import { useDocuments } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { drhpGapCheckItems } from '@/lib/questionnaire-data';
import Link from 'next/link';
import { ArrowLeft, Download, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function DRHPPreviewPage() {
  const { user, isLoading } = useAuth();
  const { company } = useCompany();
  const { getTotalCompletion } = useQuestionnaire();
  const { documents } = useDocuments();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  const questionnnaireCompletion = getTotalCompletion(22);
  const companyProfileCompletion = company ? 100 : 0;
  const documentsCount = documents.length;

  // Calculate gaps
  const gaps = [];
  if (questionnnaireCompletion < 100) {
    gaps.push({
      section: 'Questionnaire',
      gap: `Only ${questionnnaireCompletion}% of questionnaire completed`,
      severity: 'high' as const,
      recommendation: 'Complete all sections of the questionnaire to proceed',
    });
  }

  if (!company || Object.keys(company).filter((k) => company[k as keyof typeof company]).length < 5) {
    gaps.push({
      section: 'Company Profile',
      gap: 'Incomplete company information',
      severity: 'high' as const,
      recommendation: 'Fill in all required company profile fields',
    });
  }

  if (documentsCount < 5) {
    gaps.push({
      section: 'Documents',
      gap: `Only ${documentsCount} out of 5 required documents uploaded`,
      severity: 'medium' as const,
      recommendation: 'Upload all mandatory documents before submission',
    });
  }

  const completionPercentage = Math.round((questionnnaireCompletion + companyProfileCompletion + (documentsCount * 20)) / 3);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Simulate DRHP generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create mock DRHP content
      const drhpContent = {
        title: 'DRHP - Draft Red Herring Prospectus',
        company: company?.companyName || 'Your Company',
        generatedDate: new Date().toISOString(),
        completionPercentage,
        sections: {
          companyOverview: company?.businessDescription || 'Not provided',
          financials: company?.keyFinancials || {},
          governance: `Board Members: ${company?.boardMembers || 'Not provided'}`,
          documents: `${documentsCount} documents uploaded`,
        },
      };

      // Create and download as JSON (mock)
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(drhpContent, null, 2)));
      element.setAttribute('download', `DRHP_${company?.companyName?.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">DRHP Preview</h1>
            <p className="text-muted-foreground">Review and download your Draft Red Herring Prospectus</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Readiness</p>
            <p className="text-3xl font-bold text-primary">{completionPercentage}%</p>
          </div>
        </div>

        {/* Overall Readiness */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">IPO Readiness Status</h2>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
              {completionPercentage >= 80 ? 'Ready' : 'In Progress'}
            </span>
          </div>

          <div className="space-y-4">
            <ReadinessItem
              label="Company Profile"
              percentage={companyProfileCompletion}
              status={companyProfileCompletion === 100 ? 'complete' : 'incomplete'}
            />
            <ReadinessItem
              label="Questionnaire (22 Questions)"
              percentage={questionnnaireCompletion}
              status={questionnnaireCompletion === 100 ? 'complete' : 'incomplete'}
            />
            <ReadinessItem
              label="Documents"
              percentage={Math.min((documentsCount / 5) * 100, 100)}
              status={documentsCount >= 5 ? 'complete' : 'incomplete'}
            />
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Gap Analysis & Recommendations</h2>

          {gaps.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">All Requirements Met</h3>
                <p className="text-green-700 text-sm mt-1">Your IPO documentation is complete and ready for submission.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {gaps.map((gap, index) => (
                <GapItem key={index} {...gap} />
              ))}
            </div>
          )}
        </div>

        {/* Detailed Gap Checklist */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">SEBI Compliance Checklist</h2>

          <div className="space-y-4">
            {drhpGapCheckItems.map((item) => (
              <div key={item.section} className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">{item.section}</h3>
                <ul className="space-y-2">
                  {item.items.map((checkItem, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="text-primary font-bold mt-0.5">✓</span>
                      <span>{checkItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* DRHP Summary */}
        <div className="mb-8 bg-muted/50 border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Your DRHP Summary</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <SummaryBox label="Company Name" value={company?.companyName || 'Not provided'} />
            <SummaryBox
              label="Total Assets (INR Cr.)"
              value={company?.keyFinancials?.totalAssets?.toLocaleString() || '0'}
            />
            <SummaryBox label="Sector" value={company?.sector || 'Not specified'} />
            <SummaryBox label="Documents Uploaded" value={`${documentsCount} / 5`} />
            <SummaryBox label="Company Status" value={company ? 'Registered' : 'Pending'} />
            <SummaryBox
              label="Completion"
              value={`${completionPercentage}% Complete`}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Link href="/documents">
            <Button variant="outline">Back to Documents</Button>
          </Link>

          <div className="flex gap-4">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-2"
              variant={gaps.length === 0 ? 'default' : 'outline'}
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Generating DRHP...' : 'Download DRHP'}
            </Button>

            {gaps.length === 0 && (
              <Link href="/admin">
                <Button className="gap-2">
                  Submit for Review
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ReadinessItem({
  label,
  percentage,
  status,
}: {
  label: string;
  percentage: number;
  status: 'complete' | 'incomplete';
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${status === 'complete' ? 'bg-green-500' : 'bg-accent'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function GapItem({
  section,
  gap,
  severity,
  recommendation,
}: {
  section: string;
  gap: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}) {
  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, color: 'text-red-600' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertCircle, color: 'text-orange-600' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Info, color: 'text-yellow-600' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, color: 'text-blue-600' },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      <div className="flex items-start gap-3 mb-2">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${config.color}`}>{section}</h3>
          <p className={`text-sm ${config.color}`}>{gap}</p>
        </div>
      </div>
      <p className={`text-sm ${config.color} ml-8`}>
        <strong>Recommendation:</strong> {recommendation}
      </p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
