import { Download, FileText, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  format: string;
  size: string;
  readyPercentage: number;
}

const exports: ExportOption[] = [
  {
    id: 'draft',
    title: 'DRHP Working Draft',
    description: 'Full DRHP with all sections, evidence links, and embedded comments',
    icon: <FileText size={24} />,
    format: 'Word (.docx)',
    size: '8.5 MB',
    readyPercentage: 42,
  },
  {
    id: 'preview',
    title: 'DRHP Draft PDF',
    description: 'Generated draft PDF will appear here once chapter generation exists',
    icon: <FileText size={24} />,
    format: 'PDF',
    size: '12.3 MB',
    readyPercentage: 42,
  },
  {
    id: 'readiness',
    title: 'Readiness Report',
    description: 'Executive summary of preparation status and next steps',
    icon: <BarChart3 size={24} />,
    format: 'PDF',
    size: '2.1 MB',
    readyPercentage: 100,
  },
  {
    id: 'gaps',
    title: 'Gap Report',
    description: 'Detailed analysis of remaining gaps and evidence shortfalls',
    icon: <AlertCircle size={24} />,
    format: 'PDF',
    size: '4.7 MB',
    readyPercentage: 100,
  },
  {
    id: 'evidence',
    title: 'Evidence Index',
    description: 'Complete mapping of evidence to DRHP sections and requirements',
    icon: <CheckCircle2 size={24} />,
    format: 'Excel (.xlsx)',
    size: '3.2 MB',
    readyPercentage: 48,
  },
  {
    id: 'filing',
    title: 'Filing Package',
    description: 'Complete submission package ready for SEBI and registrar filing',
    icon: <FileText size={24} />,
    format: 'ZIP',
    size: '18.9 MB',
    readyPercentage: 42,
  },
];

export default function ExportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Export"
        description="Generate and download various reports and filing documents"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Reports & Export' },
        ]}
      />

      {/* Export Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {exports.map((exp) => (
          <div
            key={exp.id}
            className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-accent">{exp.icon}</div>
              <span className="text-xs font-medium text-muted-foreground">
                {exp.readyPercentage}% Ready
              </span>
            </div>

            <h3 className="font-semibold text-foreground mb-2">{exp.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{exp.description}</p>

            {/* Ready Progress */}
            <div className="mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${exp.readyPercentage}%` }}
                />
              </div>
            </div>

            {/* Format and Size */}
            <div className="flex items-center justify-between mb-4 py-3 border-t border-border">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Format
                </p>
                <p className="text-sm text-foreground">{exp.format}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  Estimated Size
                </p>
                <p className="text-sm text-foreground">{exp.size}</p>
              </div>
            </div>

            {/* Download Button */}
            <button
              disabled={exp.readyPercentage < 50}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-opacity ${
                exp.readyPercentage < 50
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              <Download size={18} />
              {exp.readyPercentage < 50 ? 'Not Ready' : 'Download'}
            </button>

            {exp.readyPercentage < 50 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Complete more sections to unlock download
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Export History */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Exports</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Document</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Format</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Size</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground">Exported</th>
                  <th className="px-6 py-3 text-left font-medium text-foreground"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">Readiness Report</td>
                  <td className="px-6 py-3 text-muted-foreground">PDF</td>
                  <td className="px-6 py-3 text-muted-foreground">2.1 MB</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">2 hours ago</td>
                  <td className="px-6 py-3">
                    <button className="text-accent hover:opacity-80 text-xs font-medium">
                      Download
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">Gap Report</td>
                  <td className="px-6 py-3 text-muted-foreground">PDF</td>
                  <td className="px-6 py-3 text-muted-foreground">4.7 MB</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">1 day ago</td>
                  <td className="px-6 py-3">
                    <button className="text-accent hover:opacity-80 text-xs font-medium">
                      Download
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">Evidence Index</td>
                  <td className="px-6 py-3 text-muted-foreground">Excel</td>
                  <td className="px-6 py-3 text-muted-foreground">3.2 MB</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">3 days ago</td>
                  <td className="px-6 py-3">
                    <button className="text-accent hover:opacity-80 text-xs font-medium">
                      Download
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
