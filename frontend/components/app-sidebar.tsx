'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import { DwaarLogo } from '@/components/dwaar-logo';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Database,
  BookOpen,
  AlertCircle,
  FileText,
  CheckCircle2,
  DownloadCloud,
  HelpCircle,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from 'lucide-react';
import {
  SidebarCollapseProvider,
  useSidebarCollapse,
  sidebarCollapseContext,
} from '@/lib/layout/sidebar-collapse-context';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  {
    href: '/projects/demo',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    href: '/projects/demo/company-profile',
    label: 'Company Profile',
    icon: <Building2 size={20} />,
  },
];

const drwhLinks: NavLink[] = [
  {
    href: '/projects/demo/workstreams',
    label: 'DRHP Preparation',
    icon: <GitBranch size={20} />,
  },
  {
    href: '/projects/demo/data-room',
    label: 'Data Room',
    icon: <Database size={20} />,
  },
  {
    href: '/projects/demo/facts',
    label: 'Facts & Evidence',
    icon: <BookOpen size={20} />,
  },
  {
    href: '/projects/demo/gaps',
    label: 'Issues & Gaps',
    icon: <AlertCircle size={20} />,
  },
  {
    href: '/projects/demo/drhp',
    label: 'DRHP Draft Workspace',
    icon: <FileText size={20} />,
  },
  {
    href: '/projects/demo/review',
    label: 'Merchant Banker Review',
    icon: <CheckCircle2 size={20} />,
  },
  {
    href: '/projects/demo/exports',
    label: 'Reports & Export',
    icon: <DownloadCloud size={20} />,
  },
];

const bottomLinks: NavLink[] = [
  {
    href: '/help',
    label: 'Help & Resources',
    icon: <HelpCircle size={20} />,
  },
];

/** Mounts a local collapse provider when the demo layout provider is absent (e.g. Help). */
export function AppSidebar() {
  const existing = useContext(sidebarCollapseContext);
  if (!existing) {
    return (
      <SidebarCollapseProvider>
        <AppSidebarInner />
      </SidebarCollapseProvider>
    );
  }
  return <AppSidebarInner />;
}

function AppSidebarInner() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebarCollapse();
  const [drhpOpen, setDrhpOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center px-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-sidebar-accent rounded-md text-sidebar-foreground"
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside
        className={cn(
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'fixed md:relative md:shrink-0 transition-[transform,width] duration-200 z-30 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden',
          collapsed ? 'w-64 md:w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'h-16 border-b border-sidebar-border flex items-center gap-2',
            collapsed ? 'md:justify-center md:px-2 px-4' : 'justify-between px-4',
          )}
        >
          <Link
            href="/projects/demo"
            className="flex min-w-0 items-center gap-2"
            title="Dwaar"
            onClick={() => setMobileOpen(false)}
          >
            <DwaarLogo
              size="sm"
              wordmarkClassName={cn(
                'text-sidebar-foreground text-sm',
                collapsed && 'md:hidden',
              )}
            />
          </Link>
          {!collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              aria-expanded
              className="hidden md:inline-flex shrink-0 items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <PanelLeftClose size={18} />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navLinks.map((link) => (
            <SidebarNavLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}

          <div className="pt-4">
            <button
              onClick={() => setDrhpOpen(!drhpOpen)}
              title="DRHP Preparation"
              className={cn(
                'w-full flex items-center rounded-md transition-colors text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50',
                collapsed
                  ? 'md:justify-center md:px-0 px-3 py-2 justify-between'
                  : 'justify-between px-3 py-2',
              )}
            >
              <span className={cn(collapsed && 'md:hidden')}>DRHP Preparation</span>
              <ChevronDown
                size={16}
                className={cn(
                  'transition-transform',
                  drhpOpen ? 'rotate-0' : '-rotate-90',
                  collapsed && 'md:hidden',
                )}
              />
              {collapsed ? (
                <GitBranch size={20} className="hidden md:block text-sidebar-foreground" />
              ) : null}
            </button>

            {(drhpOpen || collapsed) && (
              <div className={cn('space-y-1 mt-1', collapsed && 'md:mt-2')}>
                {drwhLinks.map((link) => (
                  <SidebarNavLink
                    key={link.href}
                    link={link}
                    active={isActive(link.href)}
                    collapsed={collapsed}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-2 pb-4 space-y-1 md:pb-6">
          {bottomLinks.map((link) => (
            <SidebarNavLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              aria-expanded={false}
              className="hidden md:flex w-full items-center justify-center rounded-md px-0 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <PanelLeft size={18} />
            </button>
          ) : null}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

function SidebarNavLink({
  link,
  active,
  collapsed,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={link.href}
      title={link.label}
      className={cn(
        'flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
        collapsed ? 'md:justify-center md:px-0 px-3 py-2' : 'px-3 py-2',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
      )}
      onClick={onNavigate}
    >
      <span className="flex-shrink-0">{link.icon}</span>
      <span className={cn(collapsed && 'md:hidden')}>{link.label}</span>
    </Link>
  );
}
