'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Menu,
  X,
} from 'lucide-react';

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
    label: 'DRHP Preview',
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

export function AppSidebar() {
  const pathname = usePathname();
  const [drhpOpen, setDrhpOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center px-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-sidebar-accent rounded-md text-sidebar-foreground"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:relative transition-transform duration-200 z-30 w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden`}
      >
        {/* Logo area */}
        <div className="h-16 border-b border-sidebar-border flex items-center px-6">
          <Link href="/projects/demo" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="text-sidebar-foreground font-semibold text-sm">Dwaar</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {/* Main navigation */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex-shrink-0">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {/* DRHP Preparation section */}
          <div className="pt-4">
            <button
              onClick={() => setDrhpOpen(!drhpOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
            >
              <span>DRHP Preparation</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${drhpOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>

            {drhpOpen && (
              <div className="space-y-1 mt-1">
                {drwhLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive(link.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-sidebar-border p-4 space-y-1">
          {bottomLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive(link.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex-shrink-0">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
