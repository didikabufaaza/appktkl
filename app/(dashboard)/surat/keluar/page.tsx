'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Send, Plus, Search, Edit, Trash2, Printer, FileText, X } from 'lucide-react';
import { SuratItem } from '@/types/nakes';
import { LetterForm } from '@/components/surat/LetterForm';
import { LetterPreview } from '@/components/surat/LetterPreview';

export default function SuratKeluarPage() {
  const [letters, setLetters] = useState<SuratItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<SuratItem | null>(null);

  // Preview Modal States
  const [previewLetter, setPreviewLetter] = useState<SuratItem | null>(null);

  const fetchLetters = () => {
    setLoading(true);
    fetch('/api/surat?tipe=keluar')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setLetters(res.data);
        }
      })
      .catch((err) => toast.error('Gagal memuat daftar surat keluar.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      return (
        l.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.hal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.yth.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [letters, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat keluar ini?')) return;

    try {
      const res = await fetch(`/api/surat?id=${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Surat berhasil dihapus!');
        fetchLetters();
      } else {
        toast.error(result.message || 'Gagal menghapus surat.');
      }
    } catch (err) {
      toast.error('Koneksi bermasalah.');
    }
  };

  if (loading && letters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Daftar Surat Keluar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen arsip surat keluar resmi yang diterbitkan oleh Komite Tenaga Kesehatan Lain RSUD OKU TIMUR.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLetter(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow hover:from-emerald-400 hover:to-teal-400 transition-all shrink-0 sm:self-center"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Buat Surat Keluar</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari surat berdasarkan nomor, hal, atau penerima..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 w-12">No</th>
                <th className="px-5 py-4">Tanggal Surat</th>
                <th className="px-5 py-4">Nomor Surat</th>
                <th className="px-5 py-4">Hal / Perihal</th>
                <th className="px-5 py-4">Yth. Penerima</th>
                <th className="px-5 py-4">Lampiran Berkas</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-200">
              {filteredLetters.map((l, idx) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-300">{l.tanggal}</td>
                  <td className="px-5 py-4 font-semibold text-slate-100 font-mono">{l.nomor}</td>
                  <td className="px-5 py-4 max-w-xs truncate text-slate-100 font-semibold">{l.hal}</td>
                  <td className="px-5 py-4 truncate text-slate-300">{l.yth}</td>
                  <td className="px-5 py-4">
                    {l.lampiranFileUrl ? (
                      <a
                        href={l.lampiranFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 rounded text-[11px] font-semibold transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">Tidak Ada</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewLetter(l)}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors border border-slate-700"
                        title="Pratinjau / Cetak"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLetter(l);
                          setIsFormOpen(true);
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-blue-400 rounded-lg transition-colors border border-slate-700"
                        title="Edit Surat"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-rose-400 rounded-lg transition-colors border border-slate-850"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLetters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 italic">
                    Tidak ada surat keluar yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-400" />
                  {editingLetter ? 'Edit Surat Keluar' : 'Buat Surat Keluar Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <LetterForm
                tipe="keluar"
                initialData={editingLetter || undefined}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => {
                  setIsFormOpen(false);
                  fetchLetters();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog Modal */}
      {previewLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-950/95 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl h-full md:h-[90vh]">
            <LetterPreview letter={previewLetter} onClose={() => setPreviewLetter(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
