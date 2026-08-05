'use client';

import { Suspense } from 'react';
import { DrhpWorkspace } from '@/components/drhp/drhp-workspace';

function DrhpWorkspaceFallback() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      Loading DRHP Draft Workspace…
    </div>
  );
}

export default function DrhpDraftWorkspacePage() {
  return (
    <Suspense fallback={<DrhpWorkspaceFallback />}>
      <DrhpWorkspace />
    </Suspense>
  );
}
