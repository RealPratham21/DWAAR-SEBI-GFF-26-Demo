'use client';

export function SessionLoadingScreen({ message = 'Restoring your session…' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
