'use client';

import React from 'react';
import { FormAnggota } from '@/components/anggota/FormAnggota';
import { UserPlus } from 'lucide-react';

export default function PendaftaranBaruPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-400" />
            <span>Pendaftaran Anggota Baru</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Formulir pendaftaran tenaga kesehatan lain komite RSUD OKU TIMUR (Tersimpan ke Google Spreadsheet & Drive)
          </p>
        </div>
      </div>

      <FormAnggota />
    </div>
  );
}
