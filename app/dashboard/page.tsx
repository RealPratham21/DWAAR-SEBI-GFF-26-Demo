'use client';

import { useAuth } from '@/lib/contexts';
import { useCompany } from '@/lib/contexts';
import { useQuestionnaire } from '@/lib/contexts';
import { useDocuments } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { company, getCompletionPercentage } = useCompany();
  const { getTotalCompletion } = useQuestionnaire();
  const { documents } = useDocuments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  const companyCompletion = getCompletionPercentage();
  const questionnaireCompletion = getTotalCompletion(22); // Total 22 questions
  const documentsCompletion = Math.min(documents.length * 20, 100);
  const overallCompletion = Math.round((companyCompletion + questionnaireCompletion + documentsCompletion) / 3);

  const steps = [
    {
      id: 1,
      title: 'Company Profile',
      description: 'Enter detailed company information and financials',
      completed: companyCompletion === 100,
      progress: companyCompletion,
      href: '/company-profile',
      icon: companyCompletion === 100 ? CheckCircle2 : Clock,
    },
    {
      id: 2,
      title: 'Complete Questionnaire',
      description: 'Answer 5 sections of compliance questionnaire',
      completed: questionnaireCompletion === 100,
      progress: questionnaireCompletion,
      href: '/questionnaire',
      icon: questionnaireCompletion === 100 ? CheckCircle2 : AlertCircle,
    },
    {
      id: 3,
      title: 'Upload Documents',
      description: 'Submit required regulatory documents',
      completed: documentsCompletion === 100,
      progress: documentsCompletion,
      href: '/documents',
      icon: Clock,
    },
    {
      id: 4,
      title: 'Generate DRHP',
      description: 'Preview and export your DRHP document',
      completed: overallCompletion === 100,
      progress: overallCompletion,
      href: '/drhp-preview',
      icon: Clock,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {user.companyName}!</h1>
          <p className="text-muted-foreground">Track your IPO progress and manage submissions</p>
        </div>

        {/* Overall Progress */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <ProgressCard
            title="Overall Progress"
            percentage={overallCompletion}
            color="primary"
          />
          <ProgressCard
            title="Company Profile"
            percentage={companyCompletion}
            color="accent"
          />
          <ProgressCard
            title="Questionnaire"
            percentage={questionnaireCompletion}
            color="secondary"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your IPO Journey</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Link key={step.id} href={step.href}>
                  <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${step.completed ? 'text-green-500' : 'text-primary'}`} />
                          <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                      <span className="text-2xl font-bold text-primary">{step.progress}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium">
                      {step.completed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          Continue <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">IPO Status Overview</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <StatusItem label="Status" value="In Progress" icon="🔄" />
            <StatusItem label="Company Registered" value={company ? 'Yes' : 'No'} icon="✓" />
            <StatusItem label="Documents Pending" value="5" icon="📄" />
            <StatusItem label="Last Updated" value="Today" icon="📅" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProgressCard({
  title,
  percentage,
  color,
}: {
  title: string;
  percentage: number;
  color: 'primary' | 'accent' | 'secondary';
}) {
  const colorClass = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    secondary: 'bg-secondary',
  }[color];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-muted-foreground text-sm font-medium mb-4">{title}</h3>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
        {percentage === 100 && <CheckCircle2 className="w-8 h-8 text-green-500" />}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <p className="text-muted-foreground text-xs font-medium mb-2">{label}</p>
      <p className="text-lg font-semibold text-foreground">
        {icon} {value}
      </p>
    </div>
  );
}
