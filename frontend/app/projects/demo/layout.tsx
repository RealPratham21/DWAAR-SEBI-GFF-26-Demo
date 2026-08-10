'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopBar } from '@/components/app-topbar';
import { ScrollContainerLock } from '@/components/scroll-container-lock';
import { SidebarCollapseProvider } from '@/lib/layout/sidebar-collapse-context';
import { WorkspaceProvider } from '@/lib/workspace/context';

export default function DemoProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDrhpWorkspace = pathname.startsWith('/projects/demo/drhp');

  return (
    <WorkspaceProvider>
      <SidebarCollapseProvider>
        <ScrollContainerLock />
        <div className="flex h-screen min-w-0 overflow-hidden">
          <AppSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:mt-0 mt-16">
            {!isDrhpWorkspace ? <AppTopBar /> : null}
            <main className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden bg-background">
              {isDrhpWorkspace ? (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
              ) : (
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                  <div className="mx-auto w-full max-w-7xl p-6 pb-8">{children}</div>
                </div>
              )}
            </main>
          </div>
        </div>
      </SidebarCollapseProvider>
    </WorkspaceProvider>
  );
}
