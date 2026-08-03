'use client';

import React from 'react';
import { Users, Briefcase, GraduationCap, FileCheck, Shield, FileText } from 'lucide-react';
import { DashboardStats } from '@/types/nakes';

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: 'Total Anggota',
      value: stats.totalAnggota,
      subtext: 'Terdaftar di Spreadsheet',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      title: 'Total Profesi',
      value: stats.totalProfesi,
      subtext: 'Kategori Rumpun Nakes',
      icon: Briefcase,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Total Pendidikan',
      value: stats.totalPendidikan,
      subtext: 'Jenjang D3, D4, S1, S2',
      icon: GraduationCap,
      color: 'from-violet-500 to-purple-600',
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    },
    {
      title: 'Total STR Aktif',
      value: stats.totalSTRAktif,
      subtext: 'Surat Tanda Registrasi',
      icon: FileCheck,
      color: 'from-cyan-500 to-blue-600',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      title: 'Total SIP Aktif',
      value: stats.totalSIPAktif,
      subtext: 'Surat Izin Praktek',
      icon: Shield,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Total Dokumen',
      value: stats.totalDokumen,
      subtext: 'Terupload di GDrive',
      icon: FileText,
      color: 'from-rose-500 to-pink-600',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-slate-950 shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100 tracking-tight">{card.value}</div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
