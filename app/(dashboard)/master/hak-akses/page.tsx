'use client';

import React, { useEffect, useState } from 'react';
import { Shield, ShieldCheck, Check, Save, UserCheck, Lock, Search, Sparkles, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { UserPermissions } from '@/types/nakes';

interface AccountItem {
  id: string;
  email: string;
  nama: string;
  role: 'superadmin' | 'admin' | 'user';
  profesi: string;
  permissions: UserPermissions;
}

export default function HakAksesPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/permissions');
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data || []);
      }
    } catch (err) {
      toast.error('Gagal mengambil data hak akses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTogglePermission = (accId: string, key: keyof UserPermissions) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accId) {
          return {
            ...acc,
            permissions: {
              ...acc.permissions,
              [key]: !acc.permissions[key],
            },
          };
        }
        return acc;
      })
    );
  };

  const handleSavePermission = async (acc: AccountItem) => {
    setSavingId(acc.id);
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrId: acc.email || acc.id,
          permissions: acc.permissions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
      } else {
        toast.error(json.message || 'Gagal menyimpan hak akses.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.nama.toLowerCase().includes(search.toLowerCase()) ||
      acc.email.toLowerCase().includes(search.toLowerCase()) ||
      acc.profesi.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      selectedRoleFilter === 'ALL' || acc.role.toLowerCase() === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
                  Manajemen Hak Akses & Matriks Otorisasi
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Khusus Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Atur contrengan hak akses fitur khusus (User, Admin, Superadmin) secara privat dan individual per akun anggota.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau profesi..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Semua Role</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="user">User (Anggota)</option>
          </select>
        </div>
      </div>

      {/* Account Permissions Matrix Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-900/40 rounded-2xl border border-slate-800">
          Memuat data otorisasi akun...
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Akun Anggota</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5 text-center">Kirim Email</th>
                  <th className="px-4 py-3.5 text-center">Export Excel/PDF</th>
                  <th className="px-4 py-3.5 text-center">Cetak</th>
                  <th className="px-4 py-3.5 text-center">Daftar Baru</th>
                  <th className="px-4 py-3.5 text-center">Lihat Semua Anggota</th>
                  <th className="px-4 py-3.5 text-center">Spreadsheet</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredAccounts.map((acc) => {
                  const isSuper = acc.role === 'superadmin';
                  const isSaving = savingId === acc.id;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Email */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-100">{acc.nama}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                        <div className="text-[10px] text-emerald-400">{acc.profesi}</div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            acc.role === 'superadmin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : acc.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {acc.role.toUpperCase()}
                        </span>
                      </td>

                      {/* Contrengan Checkboxes */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSuper}
                          checked={acc.permissions.canSendEmail}
                          onChange={() => handleTogglePermission(acc.id, 'canSendEmail')}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSuper}
                          checked={acc.permissions.canExportExcelPdf}
                          onChange={() => handleTogglePermission(acc.id, 'canExportExcelPdf')}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSuper}
                          checked={acc.permissions.canPrint}
                          onChange={() => handleTogglePermission(acc.id, 'canPrint')}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSuper}
                          checked={acc.permissions.canRegisterNew}
                          onChange={() => handleTogglePermission(acc.id, 'canRegisterNew')}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSuper}
                          checked={acc.permissions.canViewAllMembers}
                          onChange={() => handleTogglePermission(acc.id, 'canViewAllMembers')}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isSuper}
                          checked={acc.permissions.canAccessSpreadsheetSettings}
                          onChange={() => handleTogglePermission(acc.id, 'canAccessSpreadsheetSettings')}
                          className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>

                      {/* Save Button */}
                      <td className="px-4 py-3 text-right">
                        {!isSuper && (
                          <button
                            onClick={() => handleSavePermission(acc)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
