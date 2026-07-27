import { AppSidebar } from '@/components/app-sidebar';
import { AppTopBar } from '@/components/app-topbar';
import { DwaarCopilot } from '@/components/dwaar-copilot';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden md:mt-0 mt-16">
          <AppTopBar />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-7xl mx-auto p-6 pb-28 md:pb-10">{children}</div>
          </main>
        </div>
      </div>
      <DwaarCopilot />
    </>
  );
}
