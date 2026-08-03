'use client';

import React, { useEffect, useState } from 'react';
import { StatCards } from '@/components/dashboard/StatCards';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { ReminderAlerts } from '@/components/dashboard/ReminderAlerts';
import { DashboardStats, UserSession } from '@/types/nakes';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const loadDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsAutoSyncing(true);
    try {
      const res = await fetch('/api/dashboard?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      if (!silent) toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
      setIsAutoSyncing(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.user) {
          setUserSession(json.user);
        }
      });

    loadDashboardData(false);

    // Auto-sync polling every 5 seconds for real-time spreadsheet updates
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const permissions = userSession?.permissions;
  const isUser = userSession?.role === 'user';

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
              Dashboard Keanggotaan KTKL
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sinkron Otomatis Realtime</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Setiap penambahan data di Google Spreadsheet akan otomatis memperbarui tampilan aplikasi ini
          </p>
        </div>

        {!isUser && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-500 font-mono">Sinkron Terakhir:</p>
              <p className="text-xs font-mono text-emerald-400 font-semibold">{lastSyncTime || 'Memuat...'}</p>
            </div>
            <button
              onClick={() => loadDashboardData(false)}
              disabled={isLoading || isAutoSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
              title="Paksa Sinkronkan Ulang dari Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sinkronkan Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton vs Dashboard Content */}
      {isLoading || !stats ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl p-4" />
            ))}
          </div>
          <div className="h-44 bg-slate-900 border border-slate-800 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-slate-900 border border-slate-800 rounded-2xl" />
            <div className="h-72 bg-slate-900 border border-slate-800 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Cards */}
          <StatCards stats={stats} />

          {/* Reminder Warning Alerts (<90 days) */}
          <ReminderAlerts reminders={stats.expiringReminders} userSession={userSession} />

          {/* Charts (Bar, Pie, Line, Area) */}
          <DashboardCharts stats={stats} />
        </>
      )}
    </div>
  );
}
