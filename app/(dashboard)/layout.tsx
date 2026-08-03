'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { AutoLogoutListener } from '@/components/layout/AutoLogoutListener';
import { Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/types/nakes';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [expiringCount, setExpiringCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch logged-in user session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUserSession(data.user);
        } else {
          // If no active session, redirect to login
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));

    // 2. Fetch dashboard stats
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setExpiringCount(data.data.expiringReminders?.length || 0);
        }
      })
      .catch((err) => console.error('Error loading stats:', err));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Memverifikasi Sesi Hak Akses KTKL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      <Toaster position="top-right" theme="dark" richColors />
      <AutoLogoutListener />

      <Sidebar
        userSession={userSession}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          expiringCount={expiringCount}
          userSession={userSession}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
