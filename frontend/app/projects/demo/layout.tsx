import { AppSidebar } from '@/components/app-sidebar';
import { AppTopBar } from '@/components/app-topbar';
import { DwaarCopilot } from '@/components/dwaar-copilot';
import { ScrollContainerLock } from '@/components/scroll-container-lock';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollContainerLock />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 md:mt-0 mt-16">
          <AppTopBar />
          <main className="flex-1 basis-0 min-h-0 overflow-y-auto bg-background">
            <div className="max-w-7xl mx-auto p-6 pb-24 md:pb-8">{children}</div>
          </main>
        </div>
      </div>
      <DwaarCopilot />
    </>
  );
}
