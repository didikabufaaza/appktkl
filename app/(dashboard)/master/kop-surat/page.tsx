'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Upload, FileText, Globe } from 'lucide-react';
import { KopSuratData } from '@/types/nakes';
import { getMemberPhotoUrl } from '@/utils/imageUtils';

export default function KopSuratPage() {
  const [data, setData] = useState<KopSuratData>({
    pemda: '',
    namaRS: '',
    alamatRS: '',
    kontakRS: '',
    logoKiriUrl: '',
    logoKananUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);

  useEffect(() => {
    fetch('/api/master/kop-surat')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => toast.error('Gagal memuat pengaturan Kop Surat.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: 'kiri' | 'kanan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file logo harus JPG, JPEG, atau PNG.');
      return;
    }

    if (position === 'kiri') setUploadingLeft(true);
    else setUploadingRight(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success && result.data?.url) {
        setData((prev) => ({
          ...prev,
          [position === 'kiri' ? 'logoKiriUrl' : 'logoKananUrl']: result.data.url,
        }));
        toast.success(`Logo ${position} berhasil diunggah!`);
      } else {
        toast.error(result.message || 'Gagal mengunggah logo.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengunggah.');
    } finally {
      if (position === 'kiri') setUploadingLeft(false);
      else setUploadingRight(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/master/kop-surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        toast.success('Pengaturan Kop Surat berhasil disimpan!');
      } else {
        toast.error(resJson.message || 'Gagal menyimpan.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          Pengaturan Kop Surat
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Atur informasi dan logo yang akan ditampilkan pada bagian kepala (Kop) surat dinas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Live Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Pratinjau Kop Surat</h2>
          <div className="bg-white text-slate-900 p-6 rounded-xl shadow-inner overflow-x-auto min-w-[650px] font-sans">
            <div className="flex items-center justify-between border-b-[3px] border-double border-slate-800 pb-3">
              {/* Left Logo */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-dashed border-slate-300 rounded bg-slate-50 overflow-hidden">
                {data.logoKiriUrl ? (
                  <img src={getMemberPhotoUrl(data.logoKiriUrl)} alt="Logo Kiri" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center px-1 font-mono">Logo Kiri</span>
                )}
              </div>

              {/* Text Header */}
              <div className="text-center flex-1 px-4 leading-tight">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {data.pemda || 'PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR'}
                </h2>
                <h1 className="text-lg font-black uppercase text-slate-900 my-0.5">
                  {data.namaRS || 'RSUD OKU TIMUR'}
                </h1>
                <p className="text-[10px] text-slate-600">
                  {data.alamatRS || 'Alamat instansi rumah sakit belum diatur.'}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                  {data.kontakRS || 'Kontak telepon, email, atau website belum diatur.'}
                </p>
              </div>

              {/* Right Logo */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center border border-dashed border-slate-300 rounded bg-slate-50 overflow-hidden">
                {data.logoKananUrl ? (
                  <img src={getMemberPhotoUrl(data.logoKananUrl)} alt="Logo Kanan" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center px-1 font-mono">Logo Kanan</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Edit Kop Surat</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">PEMDA (Baris 1)</label>
              <input
                type="text"
                value={data.pemda}
                onChange={(e) => setData({ ...data, pemda: e.target.value })}
                placeholder="Contoh: PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Instansi / Rumah Sakit (Baris 2)</label>
              <input
                type="text"
                value={data.namaRS}
                onChange={(e) => setData({ ...data, namaRS: e.target.value })}
                placeholder="Contoh: RSUD OKU TIMUR"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Lengkap Rumah Sakit (Baris 3)</label>
            <input
              type="text"
              value={data.alamatRS}
              onChange={(e) => setData({ ...data, alamatRS: e.target.value })}
              placeholder="Contoh: Jalan Raya Belitang-Rasuan No. 1, Tulus Ayu, Belitang Madang Raya, OKU Timur"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telepon, Email, Website (Baris 4)</label>
            <input
              type="text"
              value={data.kontakRS}
              onChange={(e) => setData({ ...data, kontakRS: e.target.value })}
              placeholder="Contoh: Telp. (0735)-4531 945, Email: kab.rsudokutimur@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Logo Kiri Upload */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Logo Kiri (Logo Pemerintah)</label>
                <p className="text-[10px] text-slate-500 mb-3">Direkomendasikan rasio 1:1 format PNG transparan.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingLeft ? 'Mengunggah...' : 'Pilih Logo'}</span>
                  <input type="file" onChange={(e) => handleLogoUpload(e, 'kiri')} className="hidden" accept="image/*" />
                </label>
                <div className="truncate text-[10px] text-slate-400 font-mono">
                  {data.logoKiriUrl ? 'Sudah Diunggah' : 'Belum Ada Logo'}
                </div>
              </div>
            </div>

            {/* Logo Kanan Upload */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Logo Kanan (Logo Rumah Sakit / Kesehatan)</label>
                <p className="text-[10px] text-slate-500 mb-3">Direkomendasikan rasio 1:1 format PNG transparan.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{uploadingRight ? 'Mengunggah...' : 'Pilih Logo'}</span>
                  <input type="file" onChange={(e) => handleLogoUpload(e, 'kanan')} className="hidden" accept="image/*" />
                </label>
                <div className="truncate text-[10px] text-slate-400 font-mono">
                  {data.logoKananUrl ? 'Sudah Diunggah' : 'Belum Ada Logo'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-md hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
