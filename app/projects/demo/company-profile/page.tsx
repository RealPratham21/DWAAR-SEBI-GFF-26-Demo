import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { demoCompany } from '@/lib/mock-data';

interface InfoSectionProps {
  title: string;
  items: Array<{
    label: string;
    value: string;
  }>;
}

function InfoSection({ title, items }: InfoSectionProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((item, idx) => (
          <div key={idx}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {item.label}
            </p>
            <p className="text-foreground font-medium mt-2">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const legalIdentity = [
    { label: 'Company Name', value: demoCompany.name },
    { label: 'CIN', value: demoCompany.cin },
    { label: 'Date of Incorporation', value: '15-Mar-2018' },
    { label: 'Business Type', value: 'Private Limited Company' },
  ];

  const registeredOffice = [
    { label: 'Address', value: demoCompany.registeredOffice },
    { label: 'City', value: 'Delhi' },
    { label: 'Verification Status', value: 'Pending with MCA' },
  ];

  const registrations = [
    { label: 'GST Registration', value: '07AABCU0321E1ZL' },
    { label: 'PAN', value: 'AABCU0321E' },
    { label: 'DPIN Status', value: 'Active' },
  ];

  const promotersDirectors = [
    { label: 'Number of Directors', value: '3' },
    { label: 'Total Promoter Shareholding', value: '72.5%' },
    { label: 'Independent Directors', value: '1' },
    { label: 'Woman Directors', value: '1' },
  ];

  const ipoIntent = [
    { label: 'IPO Intent Declared', value: 'Yes - Board Resolution dated 12-Aug-2025' },
    { label: 'Intended IPO Size', value: '₹50-60 Crore' },
    { label: 'Expected Timeline', value: 'Q2 FY2026' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Company Profile"
        description="Complete information about your company and IPO intent"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Company Profile' },
        ]}
      />

      {/* Warning Alert */}
      <div className="bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-warning">Registered Office Verification Pending</h3>
          <p className="text-sm text-warning/80 mt-1">
            Your registered office address is pending verification with the MCA. Please follow up on the verification status.
          </p>
        </div>
      </div>

      {/* Legal Identity Section */}
      <InfoSection title="Legal Identity" items={legalIdentity} />

      {/* Registered Office Section */}
      <InfoSection title="Registered Office" items={registeredOffice} />

      {/* Registrations Section */}
      <InfoSection title="Registrations & Identifiers" items={registrations} />

      {/* Promoters and Directors Section */}
      <InfoSection title="Promoters & Directors" items={promotersDirectors} />

      {/* IPO Intent Section */}
      <InfoSection title="IPO Intent" items={ipoIntent} />

      {/* Verification Status */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">Verification Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-md">
            <span className="text-sm text-foreground">Certificate of Incorporation</span>
            <span className="text-xs font-medium text-success">Verified</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-md">
            <span className="text-sm text-foreground">Registered Office Address</span>
            <span className="text-xs font-medium text-warning">Pending</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-md">
            <span className="text-sm text-foreground">Director Identification</span>
            <span className="text-xs font-medium text-success">Verified</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-md">
            <span className="text-sm text-foreground">Tax Compliance</span>
            <span className="text-xs font-medium text-success">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
