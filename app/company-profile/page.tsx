'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts';
import { useCompany } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanyProfile } from '@/lib/types';
import { demoCompany } from '@/lib/demo-data';
import { DemoFillButton } from '@/components/demo-fill-button';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react';

export default function CompanyProfilePage() {
  const { user, isLoading } = useAuth();
  const { company, updateCompany, getCompletionPercentage } = useCompany();
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    companyName: '',
    registrationNumber: '',
    sector: '',
    businessDescription: '',
    yearOfIncorporation: new Date().getFullYear(),
    promotersNames: '',
    boardMembers: '',
    keyFinancials: {
      turnover: 0,
      profitAfterTax: 0,
      totalAssets: 0,
      year: new Date().getFullYear(),
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (company) {
      setFormData(company);
    }
  }, [user, isLoading, router, company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('financial_')) {
      const key = name.replace('financial_', '') as keyof typeof formData.keyFinancials;
      setFormData((prev) => ({
        ...prev,
        keyFinancials: {
          ...(prev.keyFinancials || { turnover: 0, profitAfterTax: 0, totalAssets: 0, year: 2024 }),
          [key]: isNaN(Number(value)) ? 0 : Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateCompany(formData as CompanyProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDemoFill = () => {
    setFormData(demoCompany);
    updateCompany(demoCompany);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isLoading || !user) {
    return null;
  }

  const completion = getCompletionPercentage();

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
            <h1 className="text-3xl font-bold text-foreground">Company Profile</h1>
            <p className="text-muted-foreground">Provide detailed information about your company</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Completion</p>
            <p className="text-3xl font-bold text-primary">{completion}%</p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/15 bg-card p-4 shadow-sm">
          <div>
            <p className="font-semibold text-foreground">Judge-ready demo</p>
            <p className="text-sm text-muted-foreground">Populate a realistic fictional SME profile in one click.</p>
          </div>
          <DemoFillButton onClick={handleDemoFill} />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-foreground font-medium">Profile Progress</span>
            <span className="text-muted-foreground">{completion}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Profile saved successfully!</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>

            <FormField
              label="Company Name"
              name="companyName"
              value={formData.companyName || ''}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />

            <FormField
              label="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber || ''}
              onChange={handleChange}
              placeholder="CIN or other registration number"
              required
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                label="Sector"
                name="sector"
                value={formData.sector || ''}
                onChange={handleChange}
                placeholder="e.g., Technology, Manufacturing"
                required
              />
              <FormField
                label="Year of Incorporation"
                name="yearOfIncorporation"
                type="number"
                value={formData.yearOfIncorporation || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Description</label>
              <textarea
                name="businessDescription"
                value={formData.businessDescription || ''}
                onChange={handleChange}
                placeholder="Describe your business operations and strategy"
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
                required
              />
            </div>
          </div>

          {/* Management Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Management Information</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Promoters Names</label>
              <textarea
                name="promotersNames"
                value={formData.promotersNames || ''}
                onChange={handleChange}
                placeholder="List all promoters and their shareholding"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Board Members</label>
              <textarea
                name="boardMembers"
                value={formData.boardMembers || ''}
                onChange={handleChange}
                placeholder="List all board members with designations and qualifications"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground placeholder-muted-foreground"
                required
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Key Financial Metrics (Last FY)</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                label="Total Turnover (INR Cr.)"
                name="financial_turnover"
                type="number"
                value={formData.keyFinancials?.turnover || ''}
                onChange={handleChange}
                placeholder="Enter turnover in crores"
                required
              />
              <FormField
                label="Profit After Tax (INR Cr.)"
                name="financial_profitAfterTax"
                type="number"
                value={formData.keyFinancials?.profitAfterTax || ''}
                onChange={handleChange}
                placeholder="Enter PAT in crores"
                required
              />
            </div>

            <FormField
              label="Total Assets (INR Cr.)"
              name="financial_totalAssets"
              type="number"
              value={formData.keyFinancials?.totalAssets || ''}
              onChange={handleChange}
              placeholder="Enter total assets in crores"
              required
            />

            <FormField
              label="Financial Year"
              name="financial_year"
              type="number"
              value={formData.keyFinancials?.year || ''}
              onChange={handleChange}
              required
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <Input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
