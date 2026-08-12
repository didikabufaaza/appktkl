'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  GraduationCap,
  Building2,
  Award,
  ShieldCheck,
  LogOut,
  Hospital,
  Key,
  X,
  MailOpen,
  Send,
  UserCog,
  Settings,
} from 'lucide-react';
import { UserSession } from '@/types/nakes';

interface SidebarProps {
  userSession?: UserSession | null;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ userSession, onLogout, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const role = userSession?.role || 'admin';
  const userName = userSession?.nama || 'Pengguna KTKL';
  const permissions = userSession?.permissions;

  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  const navItems = [
    {
      title: 'DASHBOARD',
      items: [{ name: 'Dashboard Utama', href: '/dashboard', icon: LayoutDashboard }],
    },
    ...(isUser
      ? [
          {
            title: 'PROFIL PRIVAT SAYA',
            items: [
              {
                name: 'Profil Saya',
                href: `/anggota/${userSession?.memberId || '1'}`,
                icon: Users,
              },
            ],
          },
        ]
      : [
          {
            title: 'KEANGGOTAAN',
            items: [
              { name: 'Data Anggota', href: '/anggota', icon: Users },
              ...(permissions?.canRegisterNew !== false
                ? [{ name: 'Pendaftaran Baru', href: '/anggota/baru', icon: UserPlus }]
                : []),
            ],
          },
          ...(isSuperadmin || permissions?.canAccessLetters
            ? [
                {
                  title: 'MANAJEMEN SURAT',
                  items: [
                    { name: 'Surat Masuk', href: '/surat/masuk', icon: MailOpen },
                    { name: 'Surat Keluar', href: '/surat/keluar', icon: Send },
                  ],
                },
              ]
            : []),
          ...(permissions?.canAccessMasterData !== false
            ? [
                {
                  title: 'MASTER DATA',
                  items: [
                    ...(isSuperadmin
                      ? [
                          { name: 'Matriks Hak Akses', href: '/master/hak-akses', icon: Key },
                          { name: 'Manajemen Pengguna', href: '/master/users', icon: UserCog },
                        ]
                      : []),
                    ...(isSuperadmin || isAdmin
                      ? [{ name: 'Pengaturan Kop Surat', href: '/master/kop-surat', icon: Settings }]
                      : []),
                    { name: 'Master Profesi', href: '/master/profesi', icon: Briefcase },
                    { name: 'Master Pendidikan', href: '/master/pendidikan', icon: GraduationCap },
                    { name: 'Master Unit', href: '/master/unit', icon: Building2 },
                    { name: 'Master Jabatan', href: '/master/jabatan', icon: Award },
                    { name: 'Master Komite', href: '/master/komite', icon: ShieldCheck },
                  ],
                },
              ]
            : []),
        ]),
  ];

  const sidebarContent = (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full sticky top-0 z-30 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            <Hospital className="w-6 h-6" />
          </div>
          <div className="truncate">
            <h1 className="font-bold text-slate-100 text-sm leading-tight tracking-wide truncate">KOMITE KTKL</h1>
            <p className="text-[11px] text-slate-400 font-medium">RSUD OKU TIMUR</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="mx-3 my-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
        <div className="truncate">
          <p className="text-xs font-bold text-slate-100 truncate">{userName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-extrabold uppercase ${
                isSuperadmin
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : isAdmin
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {role}
            </span>
            {userSession?.profesi && (
              <span className="text-[10px] text-slate-400 font-mono">({userSession.profesi})</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar py-2">
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
              {group.title}
            </h2>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            if (onLogout) onLogout();
          }}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md+) */}
      <div className="hidden md:block h-screen">{sidebarContent}</div>

      {/* Mobile Slide-over Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 h-full z-10 shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
