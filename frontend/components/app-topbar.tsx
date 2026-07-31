'use client';

import { Search, User, LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { useAuth } from '@/lib/auth/context';
import { useOptionalWorkspaceBootstrap } from '@/lib/workspace/context';
import { workspaceLabels } from '@/lib/workspace/format';

interface AppTopBarProps {
  pageTitle?: string;
}

export function AppTopBar({ pageTitle }: AppTopBarProps) {
  const { user, logout } = useAuth();
  const bootstrap = useOptionalWorkspaceBootstrap();

  const heading =
    pageTitle ?? bootstrap?.workspace.displayName ?? bootstrap?.company.legalName ?? 'Dwaar';

  const representativeSummary = bootstrap
    ? [
        bootstrap.representative.designation,
        workspaceLabels.relationship(
          bootstrap.representative.relationship,
          bootstrap.representative.relationshipOther,
        ),
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  const displayName = bootstrap?.user.fullName ?? user?.fullName ?? 'Signed in user';
  const displayEmail = bootstrap?.user.email ?? user?.email ?? 'Authorised Rep';

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-foreground truncate">{heading}</h1>
        {representativeSummary ? (
          <p className="text-xs text-muted-foreground truncate">{representativeSummary}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-muted rounded-md px-3 py-2 w-48">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full"
          />
        </div>

        <NotificationBell />

        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <User size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
