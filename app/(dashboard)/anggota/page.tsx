'use client';

import React, { useEffect, useState } from 'react';
import { AnggotaDataTable } from '@/components/anggota/AnggotaDataTable';
import { DeleteConfirmModal } from '@/components/anggota/DeleteConfirmModal';
import { FormAnggota } from '@/components/anggota/FormAnggota';
import { NakesMember, UserSession } from '@/types/nakes';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AnggotaPage() {
  const [data, setData] = useState<NakesMember[]>([]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingMember, setEditingMember] = useState<NakesMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<NakesMember | null>(null);

  const permissions = userSession?.permissions;

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsSyncing(true);
    try {
      const res = await fetch('/api/anggota?t=' + Date.now(), { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else if (!silent) {
        toast.error('Gagal membaca data anggota dari Spreadsheet.');
      }
    } catch (err) {
      if (!silent) toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
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

    loadData(false);

    // Auto-sync polling every 5 seconds for real-time spreadsheet updates
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
              {userSession?.role === 'user' ? 'Profil & Data Privat Anggota' : 'Data Anggota KTKL'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Realtime Spreadsheet Sync</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {userSession?.role === 'user'
              ? 'Akses privat data profil keanggotaan Anda di Komite KTKL RSUD OKU TIMUR'
              : 'Daftar seluruh tenaga kesehatan lain komite RSUD OKU TIMUR (Tersinkron langsung dengan Google Spreadsheet)'}
          </p>
        </div>

        {userSession?.role !== 'user' && (
          <button
            onClick={() => loadData(false)}
            disabled={isLoading || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Data</span>
          </button>
        )}
      </div>

      {/* Edit Form Modal Drawer */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100">
                Edit Data Anggota: {editingMember.namaLengkap}
              </h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>

            <FormAnggota
              initialData={editingMember}
              isEdit={true}
              onSuccess={() => {
                setEditingMember(null);
                loadData(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        member={deletingMember}
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirmSuccess={() => loadData(false)}
      />

      {/* Data Table */}
      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-96 animate-pulse" />
      ) : (
        <AnggotaDataTable
          data={data}
          userSession={userSession}
          onEdit={(member) => setEditingMember(member)}
          onDelete={(member) => setDeletingMember(member)}
        />
      )}
    </div>
  );
}
