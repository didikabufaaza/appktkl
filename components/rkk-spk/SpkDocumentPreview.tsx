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
    const pageHeight = 297;

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

    // Margins: Left: 30mm, Right: 20mm, Top: 20mm, Bottom: 20mm
    // Printable width: 160mm (from X=30 to X=190)
    // Center X: 110mm
    const marginLeft = 30;
    const marginRight = 20;
    const printableWidth = pageWidth - marginLeft - marginRight; // 160mm
    const centerX = marginLeft + printableWidth / 2; // 110mm
    const maxX = pageWidth - marginRight; // 190mm
    const contentIndentX = 55;
    const contentWidth = maxX - contentIndentX; // 135mm

    if (leftLogo) {
      try {
        doc.addImage(leftLogo, 'PNG', marginLeft, 20, 18, 18);
      } catch (e) {}
    }
    if (rightLogo) {
      try {
        doc.addImage(rightLogo, 'PNG', maxX - 18, 20, 18, 18);
      } catch (e) {}
    }

    // Helper to print text perfectly centered without colliding with logos (safe zone 116mm)
    const printCenteredFitted = (text: string, yPos: number, initialSize: number, isBold: boolean = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      let size = initialSize;
      doc.setFontSize(size);
      while (doc.getTextWidth(text) > 116 && size > 4.5) {
        size -= 0.2;
        doc.setFontSize(size);
      }
      doc.text(text, centerX, yPos, { align: 'center' });
    };

    // Kop Surat Texts (Font Arial / Helvetica, fitted cleanly without touching logos)
    doc.setTextColor(0, 0, 0);
    printCenteredFitted(activeKop.pemda, 23, 9.5, true);
    printCenteredFitted(activeKop.namaRS, 28, 13.5, true);
    doc.setTextColor(40, 40, 40);
    printCenteredFitted(activeKop.alamatRS, 33, 6.2, false);
    printCenteredFitted(activeKop.kontakRS, 36.8, 5.8, false);

    // Lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, 40, maxX, 40);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, 41, maxX, 41);

    // Title Keputusan
    let y = 47;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KEPUTUSAN', centerX, y, { align: 'center' });
    y += 5;
    doc.text('DIREKTUR RSUD OKU TIMUR', centerX, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Nomor : ${spk.nomorSurat}`, centerX, y, { align: 'center' });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Tentang', centerX, y, { align: 'center' });
    y += 4.5;
    doc.text('Surat penugasan Klinis dan Rincian Kewenangan Klinis', centerX, y, { align: 'center' });
    y += 4.5;
    doc.text('RSUD OKU Timur', centerX, y, { align: 'center' });

    y += 6;
    doc.text('DIREKTUR RSUD OKU TIMUR', centerX, y, { align: 'center' });

    // Menimbang (Font Arial 12)
    y += 6.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Menimbang  :', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    const menimbangText = `Bahwa untuk mendukung terwujudnya pelayanan ${
      spk.pelayanan || spk.profesi
    } yang optimal dan meningkatkan keselamatan pasien, perlu ditetapkan surat penugasan klinis dengan rincian kewenangan klinis.`;
    const splitMenimbang = doc.splitTextToSize(menimbangText, contentWidth);
    doc.text(splitMenimbang, contentIndentX, y);
    y += splitMenimbang.length * 5.2 + 3;

    // MEMUTUSKAN (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MEMUTUSKAN', centerX, y, { align: 'center' });
    y += 6.5;

    // Diktum KESATU (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('KESATU       :', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama         : ${spk.nama} ${spk.gelar || ''}`, contentIndentX, y);
    y += 5.2;
    doc.text(`Kualifikasi  : ${spk.kualifikasi || spk.profesi}`, contentIndentX, y);
    y += 5.2;
    const diktum1 = `Mendapat Surat Penugasan Klinik dengan rincian kewenangan klinis dilingkungan RSUD OKU Timur sebagai seorang ${spk.profesi}.`;
    const splitDiktum1 = doc.splitTextToSize(diktum1, contentWidth);
    doc.text(splitDiktum1, contentIndentX, y);
    y += splitDiktum1.length * 5.2 + 3;

    // Diktum KEDUA (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.text('KEDUA       :', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    const diktum2 = `Surat Penugasan klinik ini memberikan hak kepada ybs melaksanakan kegiatan profesinya dilingkungan RSUD OKU Timur sesuai dengan Rincian Kewenangan Klinis (terlampir).`;
    const splitDiktum2 = doc.splitTextToSize(diktum2, contentWidth);
    doc.text(splitDiktum2, contentIndentX, y);
    y += splitDiktum2.length * 5.2 + 3;

    // Diktum KETIGA (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.text('KETIGA      :', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    const diktum3 = `Rincian Kewenangan Klinis dapat dikurangi atau ditambah atas rekomendasi Komite Tenaga Kesehatan Profesi lain cq. Sub Komite Kredensial.`;
    const splitDiktum3 = doc.splitTextToSize(diktum3, contentWidth);
    doc.text(splitDiktum3, contentIndentX, y);
    y += splitDiktum3.length * 5.2 + 3;

    // Diktum KEEMPAT (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.text('KEEMPAT    :', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    const diktum4 = `Surat penugasan klinis ${spk.profesi} berlaku untuk jangka waktu ${
      spk.masaBerlakuTahun || '3 (tiga) tahun'
    } dan tidak akan melebihi masa berlaku STR ybs.`;
    const splitDiktum4 = doc.splitTextToSize(diktum4, contentWidth);
    doc.text(splitDiktum4, contentIndentX, y);
    y += splitDiktum4.length * 5.2 + 3;

    // Diktum KELIMA (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.text('KELIMA      :', marginLeft, y);
    doc.setFont('helvetica', 'normal');
    const diktum5 = `Keputusan ini berlaku sejak tanggal ditetapkan, bila kemudian hari diketemukan kekeliruan akan diadakan perbaikan sebagaimana mestinya.`;
    const splitDiktum5 = doc.splitTextToSize(diktum5, contentWidth);
    doc.text(splitDiktum5, contentIndentX, y);
    y += splitDiktum5.length * 5.2 + 6;

    // Signature Block (Right Aligned Direktur, Font Arial 12)
    if (y + 48 > pageHeight - 20) {
      doc.addPage();
      y = 25;
    }
    const signX = 120;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`DITETAPKAN DI : ${spk.tempatDitetapkan || 'TULUS AYU'}`, signX, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Pada Tanggal   : ${spk.tanggalDitetapkan}`, signX, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Direktur RSUD OKU Timur', signX, y);
    y += 24;
    doc.text(spk.namaDirektur || 'dr. Sugihartono, M.Sc.', signX, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.text(spk.pangkatDirektur || 'Penata TK. I/ III d', signX, y);
    y += 5.5;
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
        {/* Style Tag to Enforce Arial and Margins on Print */}
        <style jsx global>{`
          @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 30mm; /* Top 20mm, Right 20mm, Bottom 20mm, Left 30mm */
          }
          @media print {
            body {
              font-family: Arial, sans-serif !important;
            }
            .no-print {
              display: none !important;
            }
            #print-spk-area {
              padding: 0 !important;
              max-width: 100% !important;
              font-family: Arial, sans-serif !important;
            }
          }
        `}</style>

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
          <div
            id="print-spk-area"
            className="p-6 sm:p-10 md:p-12 text-slate-900 leading-normal bg-white max-w-3xl mx-auto"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* Kop Surat Header */}
            <div className="flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-3 mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                <img
                  src={logoKiriSrc}
                  alt="Logo Pemda OKU Timur"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="text-center flex-1 px-2 sm:px-4 leading-tight max-w-[calc(100%-140px)] mx-auto overflow-hidden">
                <h2 className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider">{activeKop.pemda}</h2>
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold uppercase my-0.5">{activeKop.namaRS}</h1>
                <p className="text-[8px] sm:text-[9px] md:text-[9.5px] text-slate-700 leading-tight">{activeKop.alamatRS}</p>
                <p className="text-[7.5px] sm:text-[8px] md:text-[8.5px] text-slate-600 font-medium mt-0.5 leading-tight">{activeKop.kontakRS}</p>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                <img
                  src={logoKananSrc}
                  alt="Logo RSUD OKU Timur"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Keputusan Header (Font Arial 12) */}
            <div className="text-center space-y-1 mb-6 text-[12pt] leading-normal">
              <h2 className="font-bold uppercase tracking-wider">KEPUTUSAN</h2>
              <h3 className="font-bold uppercase tracking-wider">DIREKTUR RSUD OKU TIMUR</h3>
              <p className="font-mono font-medium pt-1">Nomor : {spk.nomorSurat}</p>

              <div className="pt-3">
                <p className="font-bold uppercase">Tentang</p>
                <p className="font-bold">Surat penugasan Klinis dan Rincian Kewenangan Klinis</p>
                <p className="font-bold">RSUD OKU Timur</p>
              </div>

              <div className="pt-4">
                <h4 className="font-extrabold uppercase">DIREKTUR RSUD OKU TIMUR</h4>
              </div>
            </div>

            {/* Menimbang (Font Arial 12) */}
            <div className="grid grid-cols-12 gap-2 text-[12pt] mb-4 text-justify leading-relaxed">
              <span className="col-span-3 sm:col-span-2 font-bold">Menimbang</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <p className="col-span-8 sm:col-span-9">
                Bahwa untuk mendukung terwujudnya pelayanan {pelayanan} yang optimal dan meningkatkan keselamatan pasien,
                perlu ditetapkan surat penugasan klinis dengan rincian kewenangan klinis.
              </p>
            </div>

            {/* MEMUTUSKAN (Font Arial 12) */}
            <div className="text-center font-bold text-[12pt] my-5 uppercase tracking-widest">MEMUTUSKAN</div>

            {/* Diktum (Font Arial 12) */}
            <div className="space-y-4 text-[12pt] text-justify leading-relaxed">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-bold">PERTAMA</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <div className="col-span-8 sm:col-span-9 space-y-1">
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
                <span className="col-span-3 sm:col-span-2 font-bold">KEDUA</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <p className="col-span-8 sm:col-span-9">
                  Surat Penugasan klinik ini memberikan hak kepada ybs melaksanakan kegiatan profesinya dilingkungan RSUD
                  OKU Timur sesuai dengan Rincian Kewenangan Klinis (terlampir)
                </p>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-bold">KETIGA</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <p className="col-span-8 sm:col-span-9">
                  Rincian Kewenangan Klinis dapat dikurangi atau ditambah atas rekomendasi Komite Tenaga Kesehatan Profesi
                  lain cq. Sub Komite Kredensial
                </p>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-bold">KEEMPAT</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <p className="col-span-8 sm:col-span-9">
                  Surat penugasan klinis {spk.profesi} berlaku untuk jangka waktu{' '}
                  {spk.masaBerlakuTahun || '3 (tiga) tahun'} dan tidak akan melebihi masa berlaku STR ybs.
                </p>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 sm:col-span-2 font-bold">KELIMA</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <p className="col-span-8 sm:col-span-9">
                  Keputusan ini berlaku sejak tanggal ditetapkan, bila kemudian hari diketemukan kekeliruan akan diadakan
                  perbaikan sebagaimana mestinya.
                </p>
              </div>
            </div>

            {/* Signature Block (Font Arial 12) */}
            <div className="pt-8 text-[12pt] flex justify-end leading-normal">
              <div className="w-72 space-y-1">
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
