'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Upload, X, Clock, FileText } from 'lucide-react';
import { SuratItem } from '@/types/nakes';

interface LetterFormProps {
  initialData?: Partial<SuratItem>;
  tipe: 'masuk' | 'keluar';
  onClose: () => void;
  onSuccess: () => void;
}

export function LetterForm({ initialData, tipe, onClose, onSuccess }: LetterFormProps) {
  const [formData, setFormData] = useState({
    nomor: '',
    sifat: 'Biasa',
    lampiran: '1 (satu) Berkas',
    hal: '',
    yth: '',
    di: '',
    tanggal: '',
    isiSurat: '',
    parafKabag: '',
    parafKasubbag: '',
    parafPelaksana: '',
    penandatanganJabatan: 'Direktur RSUD OKU TIMUR',
    penandatanganNama: 'dr. Sugihartono, M.Sc',
    penandatanganPangkat: 'Pembina Tk. I / IV.b',
    penandatanganNip: '197606302005011003',
    lampiranFileUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Generate default date: "Tulus Ayu, 03 Januari 2026"
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    const monthStr = months[today.getMonth()];
    const yearStr = today.getFullYear();
    const defaultDate = `Tulus Ayu, ${dayStr} ${monthStr} ${yearStr}`;

    if (initialData) {
      setFormData({
        nomor: initialData.nomor || '',
        sifat: initialData.sifat || 'Biasa',
        lampiran: initialData.lampiran || '1 (satu) Berkas',
        hal: initialData.hal || '',
        yth: initialData.yth || '',
        di: initialData.di || '',
        tanggal: initialData.tanggal || defaultDate,
        isiSurat: initialData.isiSurat || '',
        parafKabag: initialData.parafKabag || '',
        parafKasubbag: initialData.parafKasubbag || '',
        parafPelaksana: initialData.parafPelaksana || '',
        penandatanganJabatan: initialData.penandatanganJabatan || 'Direktur RSUD OKU TIMUR',
        penandatanganNama: initialData.penandatanganNama || 'dr. Sugihartono, M.Sc',
        penandatanganPangkat: initialData.penandatanganPangkat || 'Pembina Tk. I / IV.b',
        penandatanganNip: initialData.penandatanganNip || '197606302005011003',
        lampiranFileUrl: initialData.lampiranFileUrl || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        tanggal: defaultDate,
      }));
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Format lampiran harus berupa file PDF.');
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      const result = await res.json();
      if (result.success && result.data?.url) {
        setFormData((prev) => ({ ...prev, lampiranFileUrl: result.data.url }));
        toast.success('Lampiran surat berhasil diunggah!');
      } else {
        toast.error(result.message || 'Gagal mengunggah lampiran.');
      }
    } catch (err) {
      toast.error('Kesalahan koneksi saat mengunggah.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        id: initialData?.id,
        tipe,
      };

      const res = await fetch('/api/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (resJson.success) {
        toast.success(initialData?.id ? 'Surat berhasil diperbarui!' : 'Surat baru berhasil dibuat!');
        onSuccess();
      } else {
        toast.error(resJson.message || 'Gagal menyimpan.');
      }
    } catch (err) {
      toast.error('Koneksi internet bermasalah.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tanggal Surat */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Surat (Top-Right)</label>
          <input
            type="text"
            value={formData.tanggal}
            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
            placeholder="Contoh: Tulus Ayu, 03 Januari 2026"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        {/* Nomor Surat */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Surat</label>
          <input
            type="text"
            value={formData.nomor}
            onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
            placeholder="Contoh: 445 / 232 / rsud / I / 2026"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            required
          />
        </div>

        {/* Sifat Surat */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Sifat</label>
          <input
            type="text"
            value={formData.sifat}
            onChange={(e) => setFormData({ ...formData, sifat: e.target.value })}
            placeholder="Contoh: Biasa, Penting, Rahasia"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        {/* Lampiran */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Lampiran</label>
          <input
            type="text"
            value={formData.lampiran}
            onChange={(e) => setFormData({ ...formData, lampiran: e.target.value })}
            placeholder="Contoh: 1 (satu) Berkas"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Perihal */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Hal / Perihal</label>
          <input
            type="text"
            value={formData.hal}
            onChange={(e) => setFormData({ ...formData, hal: e.target.value })}
            placeholder="Contoh: Permohonan alat CT Scan"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        {/* Yth */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Yth. Penerima</label>
          <input
            type="text"
            value={formData.yth}
            onChange={(e) => setFormData({ ...formData, yth: e.target.value })}
            placeholder="Contoh: Yth. Bupati Ogan Komering Ulu Timur"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        {/* Di */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Di (Tempat / Lokasi)</label>
          <input
            type="text"
            value={formData.di}
            onChange={(e) => setFormData({ ...formData, di: e.target.value })}
            placeholder="Contoh: Di Martapura"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>
      </div>

      {/* Isi Surat */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Isi Surat</label>
        <textarea
          rows={6}
          value={formData.isiSurat}
          onChange={(e) => setFormData({ ...formData, isiSurat: e.target.value })}
          placeholder="Tuliskan isi surat lengkap di sini..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
          required
        />
      </div>

      {/* Paraf Hierarki */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paraf Hierarki</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">KABAG / KABID</label>
            <input
              type="text"
              value={formData.parafKabag}
              onChange={(e) => setFormData({ ...formData, parafKabag: e.target.value })}
              placeholder="Paraf / Nama"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">KASUBBAG / KASIE</label>
            <input
              type="text"
              value={formData.parafKasubbag}
              onChange={(e) => setFormData({ ...formData, parafKasubbag: e.target.value })}
              placeholder="Paraf / Nama"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">PELAKSANA</label>
            <input
              type="text"
              value={formData.parafPelaksana}
              onChange={(e) => setFormData({ ...formData, parafPelaksana: e.target.value })}
              placeholder="Paraf / Nama"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Penandatangan */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Penandatangan Surat (Kanan Bawah)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Jabatan Penandatangan</label>
            <input
              type="text"
              value={formData.penandatanganJabatan}
              onChange={(e) => setFormData({ ...formData, penandatanganJabatan: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Nama Penandatangan</label>
            <input
              type="text"
              value={formData.penandatanganNama}
              onChange={(e) => setFormData({ ...formData, penandatanganNama: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Pangkat & Golongan</label>
            <input
              type="text"
              value={formData.penandatanganPangkat}
              onChange={(e) => setFormData({ ...formData, penandatanganPangkat: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">NIP Penandatangan</label>
            <input
              type="text"
              value={formData.penandatanganNip}
              onChange={(e) => setFormData({ ...formData, penandatanganNip: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Upload File Lampiran (PDF) */}
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-300">File Lampiran Resmi (Format PDF)</label>
          <p className="text-[10px] text-slate-500 mt-0.5">Unggah jika ada berkas pendukung dalam satu file PDF.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all border border-slate-700 shrink-0">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>{uploading ? 'Mengunggah...' : formData.lampiranFileUrl ? 'Ganti File PDF' : 'Pilih File PDF'}</span>
            <input type="file" onChange={handleFileUpload} className="hidden" accept="application/pdf" />
          </label>
          {formData.lampiranFileUrl && (
            <a
              href={formData.lampiranFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:underline font-semibold font-mono"
            >
              Lihat PDF
            </a>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-md hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Surat'}</span>
        </button>
      </div>
    </form>
  );
}
