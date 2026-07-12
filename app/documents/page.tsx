'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts';
import { useDocuments } from '@/lib/contexts';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Document } from '@/lib/types';
import { requiredDocuments } from '@/lib/questionnaire-data';
import { DemoFillButton } from '@/components/demo-fill-button';
import Link from 'next/link';
import { ArrowLeft, Upload, Trash2, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';
// Mock UUID function
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function DocumentsPage() {
  const { user, isLoading } = useAuth();
  const { documents, addDocument, removeDocument, updateDocument } = useDocuments();
  const router = useRouter();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return null;
  }

  const handleFileUpload = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocId(docId);
    setUploadSuccess(false);

    try {
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const uploadedDoc: Document = {
        id: generateId(),
        name: file.name,
        type: file.type,
        category: requiredDocuments.find((d) => d.id === docId)?.category || 'Other',
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        fileSize: file.size,
      };

      addDocument(uploadedDoc);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);

      // Reset file input
      e.target.value = '';
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleDemoDocuments = () => {
    requiredDocuments
      .filter((item) => item.required && !documents.some((doc) => doc.name === `Demo - ${item.name}.pdf`))
      .forEach((item, index) => addDocument({
        id: `demo-${item.id}-${Date.now()}-${index}`,
        name: `Demo - ${item.name}.pdf`,
        type: 'application/pdf',
        category: item.category,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
        fileSize: 128000 + index * 24000,
      }));
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const getDocumentsForCategory = (category: string) => {
    return documents.filter((d) => d.category === category);
  };

  const requiredCount = requiredDocuments.filter((d) => d.required).length;
  const uploadedCount = documents.length;
  const completionPercentage = Math.min(Math.round((uploadedCount / requiredCount) * 100), 100);

  const documentCategories = Array.from(new Set(requiredDocuments.map((d) => d.category)));

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
            <h1 className="text-3xl font-bold text-foreground">Documents & Submissions</h1>
            <p className="text-muted-foreground">Upload required regulatory documents</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Documents Uploaded</p>
            <p className="text-3xl font-bold text-primary">{uploadedCount}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-primary/15 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Demo document pack</p>
            <p className="text-sm text-muted-foreground">Attach mock PDF records for every required upload slot.</p>
          </div>
          <DemoFillButton onClick={handleDemoDocuments} label="Add demo documents" />
        </div>

        {/* Progress */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Submission Progress</h2>
            <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {uploadedCount} of {requiredCount} required documents uploaded
          </p>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Document uploaded successfully!</span>
          </div>
        )}

        {/* Document Categories */}
        <div className="space-y-8">
          {documentCategories.map((category) => {
            const categoryDocs = requiredDocuments.filter((d) => d.category === category);
            const categoryUploaded = getDocumentsForCategory(category);

            return (
              <div key={category} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{category} Documents</h3>
                    <span className="text-sm text-muted-foreground">
                      {categoryUploaded.length} of {categoryDocs.length}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {categoryDocs.map((docInfo) => {
                    const uploadedDocs = categoryUploaded;

                    return (
                      <div key={docInfo.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{docInfo.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{docInfo.description}</p>
                            {!docInfo.required && (
                              <p className="text-xs text-muted-foreground mt-2">(Optional)</p>
                            )}
                          </div>
                          <div className="text-right">
                            {uploadedDocs.length > 0 ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">Uploaded</span>
                              </div>
                            ) : docInfo.required ? (
                              <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Required</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-5 h-5" />
                                <span className="text-sm font-medium">Pending</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Uploaded Files */}
                        {uploadedDocs.length > 0 && (
                          <div className="mb-4 space-y-2 border-t border-border pt-4">
                            {uploadedDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'Unknown size'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeDocument(doc.id)}
                                  className="text-destructive hover:text-destructive/80 p-2"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Area */}
                        <label className="block cursor-pointer">
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors">
                            <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium text-foreground">
                              {uploadingDocId === docInfo.id ? 'Uploading...' : 'Click to upload'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 10MB</p>
                          </div>
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(docInfo.id, e)}
                            disabled={uploadingDocId !== null}
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between gap-4">
          <Link href="/questionnaire">
            <Button variant="outline">Back to Questionnaire</Button>
          </Link>
          <Link href="/drhp-preview">
            <Button className="gap-2">
              Generate DRHP
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
