'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Authorised Representative',
    description: 'Tell us about the primary contact for this IPO preparation',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
    ],
  },
  {
    id: 2,
    title: 'Company Identity',
    description: 'Provide your company registration details',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'cin', label: 'Corporate Identity Number (CIN)', type: 'text', required: true },
      { name: 'incorporationDate', label: 'Date of Incorporation', type: 'date', required: true },
    ],
  },
  {
    id: 3,
    title: 'Registrations & Classification',
    description: 'Confirm your business registrations and sector',
    fields: [
      { name: 'gstNumber', label: 'GST Registration Number', type: 'text', required: true },
      { name: 'sector', label: 'Sector / Industry', type: 'select', required: true, options: ['Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'Others'] },
      { name: 'employeeCount', label: 'Number of Employees', type: 'number', required: true },
    ],
  },
  {
    id: 4,
    title: 'Shareholding Structure',
    description: 'Provide promoter and director information',
    fields: [
      { name: 'directorCount', label: 'Total Number of Directors', type: 'number', required: true },
      { name: 'promoterHolding', label: 'Total Promoter Shareholding (%)', type: 'number', required: true },
      { name: 'publicHolding', label: 'Current Public Shareholding (%)', type: 'number', required: true },
    ],
  },
  {
    id: 5,
    title: 'IPO Intent & Timeline',
    description: 'Tell us about your IPO plans',
    fields: [
      { name: 'ipoSize', label: 'Intended IPO Size (in Cr)', type: 'number', required: true },
      { name: 'ipoTimeline', label: 'Expected IPO Timeline', type: 'select', required: true, options: ['3-6 months', '6-12 months', '12-18 months', '18+ months'] },
      { name: 'merchantBanker', label: 'Merchant Banker (if assigned)', type: 'text', required: false },
    ],
  },
  {
    id: 6,
    title: 'Document Upload',
    description: 'Upload key incorporation and compliance documents',
    fields: [
      { name: 'certificateUpload', label: 'Certificate of Incorporation', type: 'file', required: true },
      { name: 'moaUpload', label: 'Memorandum of Association', type: 'file', required: true },
      { name: 'boardResolution', label: 'Board Resolution for IPO', type: 'file', required: true },
    ],
  },
  {
    id: 7,
    title: 'Review & Confirm',
    description: 'Verify your information before submitting',
    fields: [
      { name: 'confirmAccuracy', label: 'I confirm all information is accurate', type: 'checkbox', required: true },
      { name: 'agreeTerms', label: 'I agree to the terms and conditions', type: 'checkbox', required: true },
    ],
  },
];

interface FormData {
  [key: string]: string | boolean;
}

interface FieldError {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const step = steps.find((s) => s.id === currentStep);

  const validateCurrentStep = (): boolean => {
    if (!step) return false;

    const errors: FieldError = {};
    let isValid = true;

    step.fields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && (!value || value === '')) {
        errors[field.name] = `${field.label} is required`;
        isValid = false;
      }

      if (field.type === 'email' && value && !String(value).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors[field.name] = 'Please enter a valid email address';
        isValid = false;
      }

      if (field.type === 'tel' && value && !String(value).match(/^\d{10}$/)) {
        errors[field.name] = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }

      if (field.type === 'number' && value) {
        const numValue = parseFloat(String(value));
        if (isNaN(numValue)) {
          errors[field.name] = 'Please enter a valid number';
          isValid = false;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleFieldChange = (fieldName: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    // Clear error for this field when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      // Mark this step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      router.push('/projects/demo');
    }
  };

  const isStepCompleted = (stepId: number) => {
    return completedSteps.includes(stepId);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Back link */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Register Your Company</h1>
          <p className="text-muted-foreground">
            Complete each step to set up your DRHP preparation workspace
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
              <h2 className="text-2xl font-bold text-foreground mt-1">{step?.title}</h2>
              <p className="text-sm text-muted-foreground mt-2">{step?.description}</p>
            </div>
            <div className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-md">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex items-center ${s.id < steps.length ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.id < currentStep
                      ? 'bg-success text-white'
                      : s.id === currentStep
                      ? 'bg-accent text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.id < currentStep ? <CheckCircle2 size={20} /> : s.id}
                </div>
                {s.id < steps.length && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      s.id < currentStep ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <form className="space-y-6">
            {step?.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    value={String(formData[field.name] || '')}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={Boolean(formData[field.name])}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="w-4 h-4 rounded border-input accent-accent"
                    />
                    <label htmlFor={field.name} className="text-sm text-foreground cursor-pointer">
                      {field.label}
                    </label>
                  </div>
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    onChange={(e) => handleFieldChange(field.name, e.target.files?.[0]?.name || '')}
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={String(formData[field.name] || '')}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                )}

                {fieldErrors[field.name] && (
                  <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                    <AlertCircle size={16} />
                    {fieldErrors[field.name]}
                  </div>
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-input text-foreground rounded-md font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="text-sm text-muted-foreground">
            {completedSteps.length} of {steps.length} steps completed
          </div>

          {currentStep === steps.length ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-2 bg-success text-white rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Complete Registration
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-2 bg-accent text-accent-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Continue to Next Step
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
