'use client';

import { useAuth } from '@/lib/contexts';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Upload,
  Eye,
  Settings,
  LogOut,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/company-profile', label: 'Company Profile', icon: Building2 },
  { href: '/questionnaire', label: 'Questionnaire', icon: FileText },
  { href: '/documents', label: 'Documents', icon: Upload },
  { href: '/drhp-preview', label: 'DRHP Preview', icon: Eye },
  { href: '/admin', label: 'Admin Dashboard', icon: BarChart3 },
  { href: '/help', label: 'Help & Resources', icon: HelpCircle },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border bg-white/5">
        <Link href="/dashboard">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-300 to-fuchsia-400 text-indigo-950 flex items-center justify-center font-black">D</div>
            <div>
              <div className="text-xl font-bold text-white">Dwaar</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-primary">TechSprint 2026</div>
            </div>
          </div>
        </Link>
        {user?.companyName && (
          <p className="text-xs text-sidebar-foreground/70 mt-1">{user.companyName}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className="px-4 py-3 bg-sidebar-accent/20 rounded-lg">
          <p className="text-xs text-sidebar-foreground/70 mb-1">Logged in as</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 bg-[linear-gradient(135deg,transparent_0%,rgba(96,58,230,0.04)_100%)]">
        {children}
      </main>
    </div>
  );
}
