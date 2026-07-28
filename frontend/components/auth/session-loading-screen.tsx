'use client';

export function SessionLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">Restoring your session…</p>
    </div>
  );
}
