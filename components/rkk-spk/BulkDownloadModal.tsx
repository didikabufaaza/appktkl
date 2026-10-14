'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileArchive,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Layers,
  Users,
} from 'lucide-react';
import { RkkItem, SpkItem, KopSuratData } from '@/types/nakes';
import {
  generateConsolidatedProfessionPdf,
  generateProfessionZip,
  BulkMemberDocPair,
} from './rkkSpkPdfBuilder';
import { toast } from 'sonner';

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterProfesi: string;
  rkkList: RkkItem[];
  spkList: SpkItem[];
  kop: KopSuratData | null;
}

export function BulkDownloadModal({
  isOpen,
  onClose,
  filterProfesi,
  rkkList,
  spkList,
  kop,
}: BulkDownloadModalProps) {
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  if (!isOpen) return null;

  // Filter pairs based on selected filterProfesi
  const targetRkk = rkkList.filter((r) => {
    if (filterProfesi === 'ALL') return true;
    const p1 = (r.profesi || '').toUpperCase().trim();
    const p2 = filterProfesi.toUpperCase().trim();
    return p1.includes(p2) || p2.includes(p1);
  });

  const pairs: BulkMemberDocPair[] = targetRkk.map((rkk) => {
    const matched =
      spkList.find((s) => s.rkkId === rkk.id || (s.memberId && s.memberId === rkk.memberId)) ||
      spkList.find((s) => s.nama.toLowerCase() === rkk.nama.toLowerCase()) ||
      null;
    return { rkk, spk: matched };
  });

  const profesiDisplay = filterProfesi === 'ALL' ? 'SEMUA PROFESI' : filterProfesi.toUpperCase();
  const cleanProfesi = filterProfesi === 'ALL' ? 'SEMUA_PROFESI' : filterProfesi.replace(/\s+/g, '_').toUpperCase();

  // 1. Download Consolidated PDF (RKK, RKK Rekomendasi, and SPK in 1 PDF file)
  const handleDownloadConsolidatedPdf = async () => {
    if (pairs.length === 0) {
      toast.error('Tidak ada data dokumen untuk profesi ini.');
      return;
    }
    setProcessing(true);
    setProgressText(`Menyusun ${pairs.length * 3} halaman dokumen PDF...`);
    try {
      const doc = await generateConsolidatedProfessionPdf(pairs, kop, cleanProfesi);
      doc.save(`BUNDEL_DOKUMEN_RKK_REKOMENDASI_SPK_${cleanProfesi}.pdf`);
      toast.success(
        `Berhasil mengunduh bundel PDF untuk ${pairs.length} anggota (${pairs.length * 3} dokumen)!`
      );
    } catch (err: any) {
      console.error('Error generating consolidated PDF:', err);
      toast.error('Gagal membuat bundel PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  // 2. Download ZIP of individual PDFs
  const handleDownloadZip = async () => {
    if (pairs.length === 0) {
      toast.error('Tidak ada data dokumen untuk profesi ini.');
      return;
    }
    setProcessing(true);
    setProgressText(`Mengemas ${pairs.length * 3} file PDF ke dalam arsip ZIP...`);
    try {
      const zipBlob = await generateProfessionZip(pairs, kop, cleanProfesi);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PAKET_DOKUMEN_RKK_SPK_${cleanProfesi}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        `Berhasil mengunduh arsip ZIP berisi ${pairs.length * 3} file PDF terpisah!`
      );
    } catch (err: any) {
      console.error('Error generating ZIP:', err);
      toast.error('Gagal membuat file ZIP: ' + (err?.message || 'Unknown error'));
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  // 3. Direct Print All
  const handlePrintAll = async () => {
    if (pairs.length === 0) {
      toast.error('Tidak ada data dokumen untuk profesi ini.');
      return;
    }
    setProcessing(true);
    setProgressText(`Mempersiapkan pratinjau cetak masal...`);
    try {
      const doc = await generateConsolidatedProfessionPdf(pairs, kop, cleanProfesi);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Open in printable iframe or window
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        // Fallback to hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }, 300);
        };
      }
      toast.success('Pratinjau cetak masal berhasil dibuka!');
    } catch (err: any) {
      console.error('Error printing all:', err);
      toast.error('Gagal mencetak dokumen: ' + (err?.message || 'Unknown error'));
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Cetak & Unduh Masal Dokumen</h3>
              <p className="text-xs text-slate-400">
                Kelompok Profesi:{' '}
                <span className="text-amber-400 font-bold">{profesiDisplay}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-emerald-400" />
                Jumlah Anggota Terpilih:
              </span>
              <span className="font-bold text-slate-100 text-sm">{pairs.length} Orang</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">RKK Standar</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{pairs.length} Dok</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">RKK Rekomendasi</p>
                <p className="text-xs font-bold text-teal-400 mt-0.5">{pairs.length} Dok</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Dokumen SPK</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">{pairs.length} Dok</p>
              </div>
            </div>

            <div className="text-center pt-1">
              <span className="text-[11px] text-slate-400">
                Total:{' '}
                <strong className="text-slate-200">
                  {pairs.length * 3} Dokumen Resmi
                </strong>{' '}
                lengkap dengan Kop Surat RSUD OKU Timur dan Font Arial 12.
              </span>
            </div>
          </div>

          {/* Member Preview List (Scrollable preview of names) */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-300">Daftar Anggota dalam Profesi Ini:</span>
            <div className="max-h-36 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-2 divide-y divide-slate-800/60 text-xs">
              {pairs.length === 0 ? (
                <p className="text-slate-500 italic p-3 text-center">
                  Tidak ada dokumen anggota pada profesi ini.
                </p>
              ) : (
                pairs.map((p, idx) => (
                  <div key={p.rkk.id} className="py-1.5 px-2 flex items-center justify-between text-slate-300">
                    <span className="font-medium text-slate-200">
                      {idx + 1}. {p.rkk.nama}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{p.rkk.nip || '-'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Progress Banner */}
          {processing && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-300 text-xs animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-amber-400" />
              <div>
                <p className="font-bold">Sedang memproses...</p>
                <p className="text-[11px] text-amber-200/80">{progressText}</p>
              </div>
            </div>
          )}

          {/* Action Options */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-bold text-slate-300">Pilih Metode Cetak / Unduh Masal:</span>

            {/* Option 1: Bundled Single PDF */}
            <button
              type="button"
              onClick={handleDownloadConsolidatedPdf}
              disabled={processing || pairs.length === 0}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <FileText className="w-5 h-5 shrink-0 text-emerald-200" />
                <div>
                  <p className="font-bold text-slate-100">Unduh Bundel PDF Lengkap (1 File PDF)</p>
                  <p className="text-[11px] text-emerald-200/80 font-normal">
                    Menggabungkan seluruh RKK, Rekomendasi & SPK ({pairs.length * 3} halaman) menjadi 1 file PDF siap cetak.
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 shrink-0 text-emerald-200" />
            </button>

            {/* Option 2: ZIP of separate PDFs */}
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={processing || pairs.length === 0}
              className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <FileArchive className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold text-slate-100">Unduh Paket File ZIP (File PDF Terpisah)</p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Setiap anggota mendapatkan file PDF RKK, Rekomendasi, dan SPK terpisah dalam folder ZIP terarsip rapi.
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 shrink-0 text-amber-400" />
            </button>

            {/* Option 3: Direct Print */}
            <button
              type="button"
              onClick={handlePrintAll}
              disabled={processing || pairs.length === 0}
              className="w-full p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between transition disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-left">
                <Printer className="w-5 h-5 shrink-0 text-sky-400" />
                <div>
                  <p className="font-bold text-slate-100">Cetak Masal Langsung (Print Preview)</p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Membuka dialog cetak peramban untuk mencetak seluruh dokumen ke printer fisik sekaligus.
                  </p>
                </div>
              </div>
              <Printer className="w-4 h-4 shrink-0 text-sky-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
