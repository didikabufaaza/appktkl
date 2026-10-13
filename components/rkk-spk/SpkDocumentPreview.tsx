'use client';

import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { SpkItem, KopSuratData } from '@/types/nakes';
import { getMemberPhotoUrl } from '@/utils/imageUtils';
import jsPDF from 'jspdf';

interface SpkDocumentPreviewProps {
  spk: SpkItem;
  kop?: KopSuratData | null;
  onClose?: () => void;
}

export function SpkDocumentPreview({ spk, kop, onClose }: SpkDocumentPreviewProps) {
  const activeKop = kop || {
    pemda: 'PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR',
    namaRS: 'RSUD OKU TIMUR',
    alamatRS:
      'Jalan Raya Belitang-Rasuan No. 1 Desa Tulus Ayu Kecamatan Belitang Madang Raya Kabupaten Ogan Komering Ulu Timur',
    kontakRS: 'Website: www.rsudokutimur.co.id, email: kab.rsudokutimur@gmail.com Telp. (0735)-4531.945',
    logoKiriUrl: '',
    logoKananUrl: '',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;

    // Load Logos
    const loadImage = (url: string): Promise<string | null> => {
      return new Promise((resolve) => {
        if (!url) return resolve(null);
        const processed = getMemberPhotoUrl(url);
        if (processed.startsWith('data:image/')) return resolve(processed);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch (e) {}
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = processed;
      });
    };

    const [leftLogo, rightLogo] = await Promise.all([
      loadImage(activeKop.logoKiriUrl),
      loadImage(activeKop.logoKananUrl),
    ]);

    if (leftLogo) {
      try {
        doc.addImage(leftLogo, 'PNG', 14, 8, 18, 18);
      } catch (e) {}
    }
    if (rightLogo) {
      try {
        doc.addImage(rightLogo, 'PNG', pageWidth - 14 - 18, 8, 18, 18);
      } catch (e) {}
    }

    // Kop Surat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(activeKop.pemda, pageWidth / 2, 11, { align: 'center' });

    doc.setFontSize(13);
    doc.text(activeKop.namaRS, pageWidth / 2, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    doc.text(activeKop.alamatRS, pageWidth / 2, 21, { align: 'center' });

    doc.setFontSize(7);
    doc.text(activeKop.kontakRS, pageWidth / 2, 25, { align: 'center' });

    // Lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(14, 28, pageWidth - 14, 28);
    doc.setLineWidth(0.2);
    doc.line(14, 29, pageWidth - 14, 29);

    // Title Keputusan
    let y = 37;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('KEPUTUSAN', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('DIREKTUR RSUD OKU TIMUR', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Nomor : ${spk.nomorSurat}`, pageWidth / 2, y, { align: 'center' });

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tentang', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('Surat penugasan Klinis dan Rincian Kewenangan Klinis', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('RSUD OKU Timur', pageWidth / 2, y, { align: 'center' });

    y += 8;
    doc.text('DIREKTUR RSUD OKU TIMUR', pageWidth / 2, y, { align: 'center' });

    // Menimbang
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Menimbang', 20, y);
    doc.text(':', 45, y);
    doc.setFont('helvetica', 'normal');
    const pelayanan = spk.pelayanan || spk.profesi;
    const menimbangText = `Bahwa untuk mendukung terwujudnya pelayanan ${pelayanan} yang optimal dan meningkatkan keselamatan pasien, perlu ditetapkan surat penugasan klinis dengan rincian kewenangan klinis.`;
    const splitMenimbang = doc.splitTextToSize(menimbangText, 140);
    doc.text(splitMenimbang, 49, y);

    // MEMUTUSKAN
    y += splitMenimbang.length * 4.5 + 4;
    doc.setFont('helvetica', 'bold');
    doc.text('MEMUTUSKAN', pageWidth / 2, y, { align: 'center' });

    // Diktum PERTAMA
    y += 6;
    doc.text('PERTAMA', 20, y);
    doc.text(':', 45, y);
    doc.setFont('helvetica', 'normal');
    const namaLengkap = spk.gelar ? `${spk.nama}, ${spk.gelar}` : spk.nama;
    const pertamaText = `Nama : ${namaLengkap}  Kualifikasi : ${spk.kualifikasi || spk.profesi}\nMendapat Surat Penugasan Klinik dengan rincian kewenangan klinis dilingkungan RSUD OKU Timur sebagai seorang ${spk.profesi}`;
    const splitPertama = doc.splitTextToSize(pertamaText, 140);
    doc.text(splitPertama, 49, y);

    // KEDUA
    y += splitPertama.length * 4.5 + 3;
    doc.setFont('helvetica', 'bold');
    doc.text('KEDUA', 20, y);
    doc.text(':', 45, y);
    doc.setFont('helvetica', 'normal');
    const keduaText = `Surat Penugasan klinik ini memberikan hak kepada ybs melaksanakan kegiatan profesinya dilingkungan RSUD OKU Timur sesuai dengan Rincian Kewenangan Klinis (terlampir)`;
    const splitKedua = doc.splitTextToSize(keduaText, 140);
    doc.text(splitKedua, 49, y);

    // KETIGA
    y += splitKedua.length * 4.5 + 3;
    doc.setFont('helvetica', 'bold');
    doc.text('KETIGA', 20, y);
    doc.text(':', 45, y);
    doc.setFont('helvetica', 'normal');
    const ketigaText = `Rincian Kewenangan Klinis dapat dikurangi atau ditambah atas rekomendasi Komite Tenaga Kesehatan Profesi lain cq. Sub Komite Kredensial`;
    const splitKetiga = doc.splitTextToSize(ketigaText, 140);
    doc.text(splitKetiga, 49, y);

    // KEEMPAT
    y += splitKetiga.length * 4.5 + 3;
    doc.setFont('helvetica', 'bold');
    doc.text('KEEMPAT', 20, y);
    doc.text(':', 45, y);
    doc.setFont('helvetica', 'normal');
    const keempatText = `Surat penugasan klinis ${spk.profesi} berlaku untuk jangka waktu ${spk.masaBerlakuTahun || '3 (tiga) tahun'} dan tidak akan melebihi masa berlaku STR ybs.`;
    const splitKeempat = doc.splitTextToSize(keempatText, 140);
    doc.text(splitKeempat, 49, y);

    // KELIMA
    y += splitKeempat.length * 4.5 + 3;
    doc.setFont('helvetica', 'bold');
    doc.text('KELIMA', 20, y);
    doc.text(':', 45, y);
    doc.setFont('helvetica', 'normal');
    const kelimaText = `Keputusan ini berlaku sejak tanggal ditetapkan, bila kemudian hari diketemukan kekeliruan akan diadakan perbaikan sebagaimana mestinya.`;
    const splitKelima = doc.splitTextToSize(kelimaText, 140);
    doc.text(splitKelima, 49, y);

    // Signature Block (Aligned Right)
    y += splitKelima.length * 4.5 + 8;
    const signX = pageWidth - 80;
    doc.setFont('helvetica', 'bold');
    doc.text(`DITETAPKAN DI : ${spk.tempatDitetapkan || 'TULUS AYU'}`, signX, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pada Tanggal  : ${spk.tanggalDitetapkan}`, signX, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Direktur RSUD OKU Timur', signX, y);

    y += 24;
    doc.text(spk.namaDirektur || 'dr. Sugihartono, M.Sc.', signX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(spk.pangkatDirektur || 'Penata TK. I/ III d', signX, y);
    y += 4;
    doc.text(`NIP. ${spk.nipDirektur || '197606302005011003'}`, signX, y);

    doc.save(`SPK_${spk.profesi.replace(/\s+/g, '_')}_${spk.nama.replace(/\s+/g, '_')}.pdf`);
  };

  const namaLengkap = spk.gelar ? `${spk.nama}, ${spk.gelar}` : spk.nama;
  const pelayanan = spk.pelayanan || spk.profesi;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-300">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-slate-100 p-4 flex items-center justify-between no-print border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold">Pratinjau Dokumen SPK</h3>
            <p className="text-xs text-slate-400">
              {spk.profesi} - {spk.nama}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div id="print-spk-area" className="p-8 sm:p-12 text-slate-900 font-sans leading-normal">
          {/* Kop Surat Header */}
          <div className="flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-3 mb-6">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {activeKop.logoKiriUrl ? (
                <img
                  src={getMemberPhotoUrl(activeKop.logoKiriUrl)}
                  alt="Logo Kiri"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-16 h-16 border border-gray-400 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                  Logo
                </div>
              )}
            </div>

            <div className="text-center flex-1 px-4 leading-tight">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider">{activeKop.pemda}</h2>
              <h1 className="text-base md:text-xl font-extrabold uppercase my-1">{activeKop.namaRS}</h1>
              <p className="text-[10px] md:text-xs text-slate-700">{activeKop.alamatRS}</p>
              <p className="text-[9px] md:text-[10px] text-slate-600 font-medium mt-0.5">{activeKop.kontakRS}</p>
            </div>

            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {activeKop.logoKananUrl ? (
                <img
                  src={getMemberPhotoUrl(activeKop.logoKananUrl)}
                  alt="Logo Kanan"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-16 h-16 border border-gray-400 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                  Logo
                </div>
              )}
            </div>
          </div>

          {/* Keputusan Header */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-sm md:text-base font-bold uppercase tracking-wider">KEPUTUSAN</h2>
            <h3 className="text-sm md:text-base font-bold uppercase tracking-wider">DIREKTUR RSUD OKU TIMUR</h3>
            <p className="text-xs font-mono font-medium pt-1">Nomor : {spk.nomorSurat}</p>

            <div className="pt-3">
              <p className="text-xs font-bold uppercase">Tentang</p>
              <p className="text-xs font-bold">Surat penugasan Klinis dan Rincian Kewenangan Klinis</p>
              <p className="text-xs font-bold">RSUD OKU Timur</p>
            </div>

            <div className="pt-4">
              <h4 className="text-xs font-extrabold uppercase">DIREKTUR RSUD OKU TIMUR</h4>
            </div>
          </div>

          {/* Menimbang */}
          <div className="grid grid-cols-12 gap-2 text-xs mb-4 text-justify">
            <span className="col-span-2 font-bold">Menimbang</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <p className="col-span-9">
              Bahwa untuk mendukung terwujudnya pelayanan {pelayanan} yang optimal dan meningkatkan keselamatan pasien,
              perlu ditetapkan surat penugasan klinis dengan rincian kewenangan klinis.
            </p>
          </div>

          {/* MEMUTUSKAN */}
          <div className="text-center font-bold text-xs my-4 uppercase tracking-widest">MEMUTUSKAN</div>

          {/* Diktum */}
          <div className="space-y-3 text-xs text-justify">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold">PERTAMA</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-9 space-y-1">
                <p>
                  Nama : <strong className="font-semibold">{namaLengkap}</strong> &nbsp; Kualifikasi :{' '}
                  <strong className="font-semibold">{spk.kualifikasi || spk.profesi}</strong>
                </p>
                <p>
                  Mendapat Surat Penugasan Klinik dengan rincian kewenangan klinis dilingkungan RSUD OKU Timur sebagai
                  seorang <strong className="font-semibold">{spk.profesi}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold">KEDUA</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <p className="col-span-9">
                Surat Penugasan klinik ini memberikan hak kepada ybs melaksanakan kegiatan profesinya dilingkungan RSUD
                OKU Timur sesuai dengan Rincian Kewenangan Klinis (terlampir)
              </p>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold">KETIGA</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <p className="col-span-9">
                Rincian Kewenangan Klinis dapat dikurangi atau ditambah atas rekomendasi Komite Tenaga Kesehatan Profesi
                lain cq. Sub Komite Kredensial
              </p>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold">KEEMPAT</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <p className="col-span-9">
                Surat penugasan klinis {spk.profesi} berlaku untuk jangka waktu{' '}
                {spk.masaBerlakuTahun || '3 (tiga) tahun'} dan tidak akan melebihi masa berlaku STR ybs.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-2 font-bold">KELIMA</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <p className="col-span-9">
                Keputusan ini berlaku sejak tanggal ditetapkan, bila kemudian hari diketemukan kekeliruan akan diadakan
                perbaikan sebagaimana mestinya.
              </p>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-8 text-xs flex justify-end">
            <div className="w-64 space-y-1">
              <p className="font-bold">DITETAPKAN DI : {spk.tempatDitetapkan || 'TULUS AYU'}</p>
              <p className="pb-2">Pada Tanggal : {spk.tanggalDitetapkan}</p>
              <p className="font-bold">Direktur RSUD OKU Timur</p>
              <div className="h-20"></div>
              <p className="font-bold underline">{spk.namaDirektur || 'dr. Sugihartono, M.Sc.'}</p>
              <p className="text-slate-700">{spk.pangkatDirektur || 'Penata TK. I/ III d'}</p>
              <p className="text-slate-700 font-mono">NIP. {spk.nipDirektur || '197606302005011003'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
