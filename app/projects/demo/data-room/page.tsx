'use client';

import { useState } from 'react';
import { Upload, File, Folder, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { documents } from '@/lib/mock-data';

const categories = [
  { name: 'Company Formation', count: 2 },
  { name: 'Registrations', count: 1 },
  { name: 'Corporate Actions', count: 1 },
  { name: 'Corporate Documents', count: 1 },
  { name: 'Financial Documents', count: 2 },
  { name: 'Director Identification', count: 1 },
  { name: 'Material Contracts', count: 2 },
  { name: 'Tax & Compliance', count: 1 },
];

export default function DataRoomPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<typeof documents[0] | null>(null);

  const categoryDocuments = selectedCategory
    ? documents.filter((doc) => doc.category === selectedCategory)
    : documents;

  const categoryStats = selectedCategory
    ? {
        total: categoryDocuments.length,
        approved: categoryDocuments.filter((d) => d.status === 'approved').length,
        pending: categoryDocuments.filter((d) => d.status === 'pending-review').length,
      }
    : {
        total: documents.length,
        approved: documents.filter((d) => d.status === 'approved').length,
        pending: documents.filter((d) => d.status === 'pending-review').length,
      };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Data Room"
        description="Organize and manage all company documents and evidence"
        breadcrumbs={[
          { label: 'Dashboard', href: '/projects/demo' },
          { label: 'Data Room' },
        ]}
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
            <Upload size={20} />
            Upload Documents
          </button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Category selector */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-foreground mb-4">Categories</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedDocument(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                selectedCategory === null
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border text-foreground hover:border-accent'
              }`}
            >
              <div className="font-medium">All Documents</div>
              <div className="text-xs mt-1 opacity-75">
                {documents.length} documents
              </div>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedDocument(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card border border-border text-foreground hover:border-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium flex items-center gap-2">
                    <Folder size={16} />
                    {cat.name}
                  </div>
                  <span className="text-xs bg-black bg-opacity-20 px-2 py-1 rounded">
                    {cat.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Document list and detail */}
        <div className="lg:col-span-2">
          {/* Category summary */}
          {selectedCategory && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedCategory}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {categoryStats.total} documents • {categoryStats.approved} approved • {categoryStats.pending} pending review
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedDocument(null);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Document list */}
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedCategory ? `${selectedCategory} Documents` : 'All Documents'}
          </h3>

          <div className="space-y-2">
            {categoryDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocument(doc)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedDocument?.id === doc.id
                    ? 'bg-accent/10 border-accent'
                    : 'bg-card border-border hover:border-accent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <File size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>{doc.uploadedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Document detail panel */}
          {selectedDocument && (
            <div className="mt-8 p-6 bg-card border border-border rounded-lg">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedDocument.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{selectedDocument.category}</p>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded p-4">
                  <p className="text-xs text-muted-foreground mb-1">File Size</p>
                  <p className="font-semibold text-foreground">{selectedDocument.fileSize}</p>
                </div>
                <div className="bg-muted/50 rounded p-4">
                  <p className="text-xs text-muted-foreground mb-1">Uploaded Date</p>
                  <p className="font-semibold text-foreground">{selectedDocument.uploadedDate}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2 font-semibold">Status</p>
                <div className="flex items-center gap-2">
                  {selectedDocument.status === 'approved' && (
                    <>
                      <CheckCircle2 size={20} className="text-success" />
                      <span className="font-medium text-foreground">Verified and Approved</span>
                      <span className="text-xs text-muted-foreground">No action needed</span>
                    </>
                  )}
                  {selectedDocument.status === 'pending-review' && (
                    <>
                      <Clock size={20} className="text-warning" />
                      <span className="font-medium text-foreground">Pending Review</span>
                      <span className="text-xs text-muted-foreground">Waiting for merchant banker feedback</span>
                    </>
                  )}
                </div>
              </div>

              {selectedDocument.status === 'pending-review' && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Action Required</p>
                      <p className="text-muted-foreground">
                        The merchant banker has requested updates. Please review comments and resubmit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity">
                Download Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
