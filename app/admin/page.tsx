'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats] = useState({
    totalApplications: 15,
    completedApplications: 8,
    pendingReview: 4,
    rejectedApplications: 3,
    averageCompletionTime: 12,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Check if user is admin
    if (!isLoading && user && !user.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.isAdmin) {
    return null;
  }

  const mockApplications = [
    {
      id: '1',
      companyName: 'TechCorp India',
      sector: 'Technology',
      completionPercentage: 95,
      status: 'submitted' as const,
      submittedAt: '2024-01-15',
      reviewer: 'admin',
    },
    {
      id: '2',
      companyName: 'Green Energy Ltd',
      sector: 'Energy',
      completionPercentage: 100,
      status: 'approved' as const,
      submittedAt: '2024-01-10',
      reviewer: 'admin',
    },
    {
      id: '3',
      companyName: 'Fashion Innovations',
      sector: 'Retail',
      completionPercentage: 60,
      status: 'draft' as const,
    },
    {
      id: '4',
      companyName: 'Manufacturing Plus',
      sector: 'Manufacturing',
      completionPercentage: 100,
      status: 'approved' as const,
      submittedAt: '2024-01-08',
      reviewer: 'admin',
    },
    {
      id: '5',
      companyName: 'Healthcare Solutions',
      sector: 'Healthcare',
      completionPercentage: 75,
      status: 'under_review' as const,
      submittedAt: '2024-01-12',
      reviewer: 'admin',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage and review IPO applications</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <StatCard
            label="Total Applications"
            value={stats.totalApplications}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            label="Completed"
            value={stats.completedApplications}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            label="Pending Review"
            value={stats.pendingReview}
            icon={<Clock className="w-6 h-6" />}
            color="yellow"
          />
          <StatCard
            label="Rejected"
            value={stats.rejectedApplications}
            icon={<XCircle className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            label="Avg. Time (days)"
            value={stats.averageCompletionTime}
            color="purple"
          />
        </div>

        {/* Completion Rate */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">System Metrics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Overall Completion Rate</p>
              <p className="text-4xl font-bold text-primary mb-2">
                {Math.round((stats.completedApplications / stats.totalApplications) * 100)}%
              </p>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full"
                  style={{
                    width: `${Math.round((stats.completedApplications / stats.totalApplications) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Approval Rate</p>
              <p className="text-4xl font-bold text-accent mb-2">
                {Math.round((2 / stats.totalApplications) * 100)}%
              </p>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-accent h-3 rounded-full"
                  style={{
                    width: `${Math.round((2 / stats.totalApplications) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-muted/50 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Recent Applications</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Sector
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Progress
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockApplications.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{app.companyName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{app.sector}</td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {app.completionPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${app.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {app.submittedAt || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Overview */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <StatusOverviewCard
            title="Under Review"
            count={4}
            description="Applications awaiting admin review"
            color="blue"
          />
          <StatusOverviewCard
            title="Approved"
            count={8}
            description="Ready for SEBI submission"
            color="green"
          />
          <StatusOverviewCard
            title="Needs Revision"
            count={3}
            description="Applications requiring updates"
            color="red"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}) {
  const colorClass = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }[color || 'blue'];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {icon && <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center mb-4`}>{icon}</div>}
      <p className="text-muted-foreground text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
    under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Under Review' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function StatusOverviewCard({
  title,
  count,
  description,
  color,
}: {
  title: string;
  count: number;
  description: string;
  color: string;
}) {
  const colorClass = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
  }[color];

  return (
    <div className={`border ${colorClass} rounded-lg p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary mb-2">{count}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
