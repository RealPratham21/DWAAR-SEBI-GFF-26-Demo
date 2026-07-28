'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/company-incorporation/form-primitives';
import {
  NeutralStatusBadge,
  RequirementLevelBadge,
} from '@/components/company-incorporation/tab-shared';
import {
  DOCUMENT_REQUIREMENT_GROUPS,
  DOCUMENT_SELECTION_NOTICE,
  DOCUMENT_SERVICE_NOTICE,
  DOCUMENT_UPLOAD_STATUS_LABELS,
  type DocumentRequirement,
} from '@/lib/company-incorporation/document-requirements-config';

function DocumentRequirementRow({ requirement }: { requirement: DocumentRequirement }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectionNotice(
        `"${file.name}" selected locally. ${DOCUMENT_SELECTION_NOTICE}`,
      );
    } else {
      setSelectionNotice(null);
    }
    event.target.value = '';
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-foreground">{requirement.name}</h4>
            <RequirementLevelBadge level={requirement.requirementLevel} />
            <NeutralStatusBadge label={DOCUMENT_UPLOAD_STATUS_LABELS['not-uploaded']} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{requirement.explanation}</p>
          {selectionNotice ? (
            <p className="text-xs text-muted-foreground border-l-2 border-warning pl-3">
              {selectionNotice}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            aria-hidden
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="md:mr-[88px]"
          >
            <Upload size={14} />
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CompanyIncorporationDocumentsTab() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Document Requirements"
        description="Structured document requirements for incorporation, constitutional, office, corporate-event, and registration evidence."
      >
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
          {DOCUMENT_SERVICE_NOTICE}
        </p>
      </SectionCard>

      {DOCUMENT_REQUIREMENT_GROUPS.map((group) => (
        <SectionCard key={group.id} title={group.title}>
          <div className="space-y-3">
            {group.documents.map((requirement) => (
              <DocumentRequirementRow key={requirement.id} requirement={requirement} />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
