'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, UserCog, Search, ShieldAlert, Key, Edit, Trash2, X, Save, CheckSquare, Square } from 'lucide-react';
import { UserPermissions } from '@/types/nakes';

interface UserItem {
  id: string;
  username: string;
  nama: string;
  role: 'superadmin' | 'admin' | 'user';
  email: string;
  profesi: string;
  status: 'active' | 'inactive';
  hasCustomPassword: boolean;
  permissions: UserPermissions;
}

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canSendEmail: 'Kirim Pengingat Email Otomatis',
  canExportExcelPdf: 'Ekspor File PDF & Excel',
  canPrint: 'Cetak / Print Kartu Anggota',
  canRegisterNew: 'Daftarkan Anggota Baru',
  canViewAllMembers: 'Lihat Semua Data Anggota',
  canAccessSpreadsheetSettings: 'Edit Pengaturan Spreadsheet',
  canAccessMasterData: 'Akses Master Data Kategori',
  canEditMemberData: 'Ubah/Edit Profil Anggota',
  canDeleteMemberData: 'Hapus Data Anggota',
  canAccessLetters: 'Kelola Surat Masuk & Keluar',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<'superadmin' | 'admin' | 'user'>('user');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [customPassword, setCustomPassword] = useState('');
  const [editedPerms, setEditedPerms] = useState<Partial<UserPermissions>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setUsers(res.data);
        }
      })
      .catch((err) => toast.error('Gagal memuat daftar pengguna.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.profesi.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  const handleEditClick = (u: UserItem) => {
    setEditingUser(u);
    setNewRole(u.role);
    setNewStatus(u.status);
    setCustomPassword('');
    setEditedPerms(u.permissions);
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
    setEditedPerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrId: editingUser.username !== 'superadmin' && editingUser.username !== 'admin' 
            ? editingUser.email 
            : editingUser.username,
          role: newRole,
          status: newStatus,
          password: customPassword.trim() ? customPassword : undefined,
          permissions: editedPerms,
        }),
      });

      const resJson = await res.json();
      if (resJson.success) {
        toast.success('Pengaturan khusus pengguna berhasil disimpan!');
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(resJson.message || 'Gagal menyimpan.');
      }
    } catch (err) {
      toast.error('Koneksi bermasalah.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async (u: UserItem) => {
    if (!confirm(`Kembalikan hak akses & password ${u.nama} ke pengaturan bawaan database?`)) return;

    try {
      const key = u.username === 'superadmin' || u.username === 'admin' ? u.username : u.email;
      const res = await fetch(`/api/users?emailOrId=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success('Hak akses dikembalikan ke bawaan.');
        fetchUsers();
      } else {
        toast.error(resJson.message || 'Gagal mereset.');
      }
    } catch (err) {
      toast.error('Kesalahan koneksi.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-emerald-400" />
            Manajemen Pengguna Aplikasi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ubah status aktif, ubah hak akses (role), atur password kustom, dan atur matriks izin untuk setiap akun.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau profesi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">Role:</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Semua Role</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="user">User / Anggota</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">No</th>
                <th className="px-5 py-4">Nama Pengguna</th>
                <th className="px-5 py-4">Username / Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Password</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-200">
              {filteredUsers.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="px-5 py-4 font-semibold text-slate-100">{u.nama}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{u.username}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-[9px] px-2.5 py-0.5 rounded-md border font-extrabold uppercase ${
                        u.role === 'superadmin'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : u.role === 'admin'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">
                    {u.hasCustomPassword ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Key className="w-3.5 h-3.5" />
                        <span>Kustom</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Bawaan (Profesi)</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-colors border border-slate-700"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit Akses</span>
                      </button>
                      <button
                        onClick={() => handleResetDefaults(u)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-rose-400 rounded-lg text-[11px] font-medium transition-colors border border-slate-850"
                        title="Kembalikan ke Default"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 italic">
                    Tidak ada akun pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal (Glassmorphic) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Edit Hak Akses: {editingUser.nama}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">ID / Email: {editingUser.username}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveOverride} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Role & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role Level Akses</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="user">User (Hanya Lihat Profil Sendiri)</option>
                    <option value="admin">Admin (Kelola Anggota, Edit Anggota)</option>
                    <option value="superadmin">Superadmin (Akses Penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Akun</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Aktif (Bisa Login)</option>
                    <option value="inactive">Nonaktif (Blokir Akses Login)</option>
                  </select>
                </div>
              </div>

              {/* Password Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password Kustom Baru (Kosongkan jika tidak diganti)
                </label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Masukkan password baru untuk mengganti password profesi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Bawaan password pengguna adalah nama rumpun profesinya (Contoh: atlm, radiografer).
                </p>
              </div>

              {/* Checkbox Permissions Matriks */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Matriks Izin Kustom (Izin Spesifik)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                  {Object.keys(PERMISSION_LABELS).map((permKey) => {
                    const k = permKey as keyof UserPermissions;
                    const isChecked = !!editedPerms[k];
                    return (
                      <button
                        type="button"
                        key={k}
                        onClick={() => handlePermissionToggle(k)}
                        className="flex items-center gap-2.5 text-left text-xs py-1.5 px-2 hover:bg-slate-900 rounded-lg text-slate-300 hover:text-slate-100 transition-colors"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className="truncate">{PERMISSION_LABELS[k]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-md hover:from-emerald-400 hover:to-teal-400 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
