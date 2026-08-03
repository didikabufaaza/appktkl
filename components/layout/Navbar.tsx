'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  ChevronRight,
  ShieldAlert,
  Database,
  ExternalLink,
} from 'lucide-react';
import { SPREADSHEET_ID } from '@/lib/constants';
import { UserSession } from '@/types/nakes';

interface NavbarProps {
  expiringCount?: number;
  userSession?: UserSession | null;
}

export function Navbar({ expiringCount = 0, userSession }: NavbarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const permissions = userSession?.permissions;

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, idx) => {
    const href = '/' + pathSegments.slice(0, idx + 1).join('/');
    const formattedName = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return { name: formattedName, href };
  });

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">KTKL RSUD</span>
        {breadcrumbs.length > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? 'font-medium text-emerald-400'
                  : 'text-slate-400'
              }
            >
              {crumb.name}
            </span>
            {idx < breadcrumbs.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Realtime Auto Sync Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Realtime Sync</span>
        </div>

        {/* Google Sheet Live Database Indicator (Scoped by permissions) */}
        {permissions?.canAccessSpreadsheetSettings !== false && (
          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all"
            title="Buka Google Spreadsheet Database Utama"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Spreadsheet DB</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        )}

        {/* Warning Notification Badge */}
        {expiringCount > 0 && (
          <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold">{expiringCount} Kadaluarsa</span>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors border border-slate-700/50"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
}
