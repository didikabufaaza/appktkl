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
      'Jalan Raya Belitang-Rasuan No. 1, Tulus Ayu, Belitang Madang Raya, Kabupaten OKU Timur, Sumatera Selatan 32382',
    kontakRS: 'Telp. (0735)-4531 945, Email: kab.rsudokutimur@gmail.com, Laman: www.rsudokut.okutimurkab.go.id',
    logoKiriUrl: '/images/media_1788156510786.png',
    logoKananUrl: '/images/logo_komite.png',
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
        let processed = url;
        if (typeof window !== 'undefined' && processed.startsWith('/')) {
          processed = window.location.origin + processed;
        } else {
          processed = getMemberPhotoUrl(processed);
          if (typeof window !== 'undefined' && processed.startsWith('/')) {
            processed = window.location.origin + processed;
          }
        }
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

    const logoKiriToLoad = activeKop.logoKiriUrl || '/images/media_1788156510786.png';
    const logoKananToLoad = activeKop.logoKananUrl || '/images/logo_komite.png';

    const [leftLogo, rightLogo] = await Promise.all([
      loadImage(logoKiriToLoad),
      loadImage(logoKananToLoad),
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

    y += 7;
    doc.text('DIREKTUR RSUD OKU TIMUR', pageWidth / 2, y, { align: 'center' });

    // Menimbang
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Menimbang  :', 14, y);
    doc.setFont('helvetica', 'normal');
    const menimbangText = `Bahwa untuk mendukung terwujudnya pelayanan ${
      spk.pelayanan || spk.profesi
    } yang optimal dan meningkatkan keselamatan pasien, perlu ditetapkan surat penugasan klinis dengan rincian kewenangan klinis.`;
    const splitMenimbang = doc.splitTextToSize(menimbangText, pageWidth - 50);
    doc.text(splitMenimbang, 45, y);
    y += splitMenimbang.length * 4.5 + 4;

    // MEMUTUSKAN
    doc.setFont('helvetica', 'bold');
    doc.text('MEMUTUSKAN', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Diktum KESATU
    doc.setFont('helvetica', 'bold');
    doc.text('KESATU       :', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama         : ${spk.nama} ${spk.gelar || ''}`, 45, y);
    y += 4.5;
    doc.text(`Kualifikasi  : ${spk.kualifikasi || spk.profesi}`, 45, y);
    y += 4.5;
    const diktum1 = `Mendapat Surat Penugasan Klinik dengan rincian kewenangan klinis dilingkungan RSUD OKU Timur sebagai seorang ${spk.profesi}.`;
    const splitDiktum1 = doc.splitTextToSize(diktum1, pageWidth - 50);
    doc.text(splitDiktum1, 45, y);
    y += splitDiktum1.length * 4.5 + 3;

    // Diktum KEDUA
    doc.setFont('helvetica', 'bold');
    doc.text('KEDUA       :', 14, y);
    doc.setFont('helvetica', 'normal');
    const diktum2 = `Surat Penugasan klinik ini memberikan hak kepada ybs melaksanakan kegiatan profesinya dilingkungan RSUD OKU Timur sesuai dengan Rincian Kewenangan Klinis (terlampir).`;
    const splitDiktum2 = doc.splitTextToSize(diktum2, pageWidth - 50);
    doc.text(splitDiktum2, 45, y);
    y += splitDiktum2.length * 4.5 + 3;

    // Diktum KETIGA
    doc.setFont('helvetica', 'bold');
    doc.text('KETIGA      :', 14, y);
    doc.setFont('helvetica', 'normal');
    const diktum3 = `Rincian Kewenangan Klinis dapat dikurangi atau ditambah atas rekomendasi Komite Tenaga Kesehatan Profesi lain cq. Sub Komite Kredensial.`;
    const splitDiktum3 = doc.splitTextToSize(diktum3, pageWidth - 50);
    doc.text(splitDiktum3, 45, y);
    y += splitDiktum3.length * 4.5 + 3;

    // Diktum KEEMPAT
    doc.setFont('helvetica', 'bold');
    doc.text('KEEMPAT    :', 14, y);
    doc.setFont('helvetica', 'normal');
    const diktum4 = `Surat penugasan klinis ${spk.profesi} berlaku untuk jangka waktu ${
      spk.masaBerlakuTahun || '3 (tiga) tahun'
    } dan tidak akan melebihi masa berlaku STR ybs.`;
    const splitDiktum4 = doc.splitTextToSize(diktum4, pageWidth - 50);
    doc.text(splitDiktum4, 45, y);
    y += splitDiktum4.length * 4.5 + 3;

    // Diktum KELIMA
    doc.setFont('helvetica', 'bold');
    doc.text('KELIMA      :', 14, y);
    doc.setFont('helvetica', 'normal');
    const diktum5 = `Keputusan ini berlaku sejak tanggal ditetapkan, bila kemudian hari diketemukan kekeliruan akan diadakan perbaikan sebagaimana mestinya.`;
    const splitDiktum5 = doc.splitTextToSize(diktum5, pageWidth - 50);
    doc.text(splitDiktum5, 45, y);
    y += splitDiktum5.length * 4.5 + 8;

    // Signature Block
    const signX = pageWidth - 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`DITETAPKAN DI : ${spk.tempatDitetapkan || 'TULUS AYU'}`, signX, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pada Tanggal   : ${spk.tanggalDitetapkan}`, signX, y);
    y += 5;
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

  const namaLengkap = `${spk.nama}${spk.gelar ? ', ' + spk.gelar : ''}`;
  const pelayanan = spk.pelayanan || spk.profesi;
  const logoKiriSrc = activeKop.logoKiriUrl || '/images/media_1788156510786.png';
  const logoKananSrc = activeKop.logoKananUrl || '/images/logo_komite.png';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white text-black max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-300 max-h-[94vh] flex flex-col">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-slate-100 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between no-print border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Pratinjau Dokumen SPK</h3>
            <p className="text-xs text-slate-400">
              {spk.profesi} - {spk.nama}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Document Sheet (Scrollable) */}
        <div className="overflow-y-auto flex-1 bg-white">
          <div id="print-spk-area" className="p-6 sm:p-10 md:p-12 text-slate-900 font-sans leading-normal bg-white max-w-3xl mx-auto">
            {/* Kop Surat Header */}
            <div className="flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-3 mb-6">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                <img
                  src={logoKiriSrc}
                  alt="Logo Pemda OKU Timur"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="text-center flex-1 px-4 leading-tight">
                <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider">{activeKop.pemda}</h2>
                <h1 className="text-base md:text-xl font-extrabold uppercase my-1">{activeKop.namaRS}</h1>
                <p className="text-[10px] md:text-xs text-slate-700">{activeKop.alamatRS}</p>
                <p className="text-[9px] md:text-[10px] text-slate-600 font-medium mt-0.5">{activeKop.kontakRS}</p>
              </div>

              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                <img
                  src={logoKananSrc}
                  alt="Logo RSUD OKU Timur"
                  className="max-w-full max-h-full object-contain"
                />
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
    </div>
  );
}
