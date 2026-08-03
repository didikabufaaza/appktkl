'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { NakesMember } from '@/types/nakes';
import { toast } from 'sonner';

interface DeleteConfirmModalProps {
  member: NakesMember | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

export function DeleteConfirmModal({
  member,
  isOpen,
  onClose,
  onConfirmSuccess,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/anggota/${member.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Data anggota "${member.namaLengkap}" berhasil dihapus dari Spreadsheet.`);
        onConfirmSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Gagal menghapus data.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4 text-rose-400">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Konfirmasi Hapus Data</h3>
            <p className="text-xs text-slate-400">Tindakan ini akan menghapus data di Google Spreadsheet</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-6 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
          Apakah Anda yakin ingin menghapus data anggota{' '}
          <strong className="text-rose-300 font-bold">{member.namaLengkap}</strong> ({member.profesi})?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>HAPUS SEKARANG</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
