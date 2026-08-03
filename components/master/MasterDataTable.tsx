'use client';

import React from 'react';
import { MasterItem } from '@/types/nakes';

interface MasterDataTableProps {
  title: string;
  description: string;
  items: MasterItem[];
}

export function MasterDataTable({ title, description, items }: MasterDataTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="mb-6 pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-300 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3.5">No</th>
              <th className="px-4 py-3.5">Kode</th>
              <th className="px-4 py-3.5">Nama / Kategori</th>
              <th className="px-4 py-3.5">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.kode || `KODE-${idx + 1}`}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-100">{item.nama}</td>
                <td className="px-4 py-3 text-slate-400">{item.deskripsi || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
