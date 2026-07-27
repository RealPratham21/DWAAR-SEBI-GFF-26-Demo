'use client';

import Link from 'next/link';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { demoCompany } from '@/lib/mock-data';

interface AppTopBarProps {
  pageTitle?: string;
}

export function AppTopBar({ pageTitle }: AppTopBarProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left side - Title */}
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-foreground">{pageTitle || demoCompany.name}</h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center bg-muted rounded-md px-3 py-2 w-48">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-foreground">Aarohan Inc.</p>
            <p className="text-xs text-muted-foreground">Authorised Rep</p>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <User size={20} />
          </button>
        </div>

        {/* Logout - Desktop only */}
        <Link
          href="/login"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </Link>
      </div>
    </header>
  );
}
