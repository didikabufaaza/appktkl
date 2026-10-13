'use client';

import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { RkkItem, KopSuratData } from '@/types/nakes';
import { getMemberPhotoUrl } from '@/utils/imageUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RkkDocumentPreviewProps {
  rkk: RkkItem;
  kop?: KopSuratData | null;
  onClose?: () => void;
}

export function RkkDocumentPreview({ rkk, kop, onClose }: RkkDocumentPreviewProps) {
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

    // Load Left & Right Logos
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

    // Kop Surat Texts
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

    // Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(14, 28, pageWidth - 14, 28);
    doc.setLineWidth(0.2);
    doc.line(14, 29, pageWidth - 14, 29);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('RINCIAN KEWENANGAN KLINIK (RKK) TENAGA KESEHATAN LAIN', pageWidth / 2, 34, { align: 'center' });
    doc.text('RSUD OKU TIMUR', pageWidth / 2, 38.5, { align: 'center' });

    // Instructions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Petunjuk Pengisian:', 14, 43);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text("Pemohon mengisi kolom 'DIMINTA' dan Sub-Komite Kredensial/Asesor mengisi kolom 'DISETUJUI'.", 14, 46.5);
    doc.text('Kode: M = Mandiri | DS = Dengan Supervisi | KET = Keterangan', 14, 50);

    // Member Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`Profesi: ${rkk.profesi}`, 14, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Kewenangan Klinis', 14, 59.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Nama         : ${rkk.nama}`, 14, 63.5);
    doc.text(`Kualifikasi  : ${rkk.kualifikasi || '-'}`, 14, 67.5);
    doc.text(`Alumni       : ${rkk.alumni || '-'}`, 14, 71.5);

    // Table
    const tableBody = rkk.checklistData.map((row) => [
      row.no,
      row.kompetensi,
      row.dimintaM ? '✓' : '',
      row.dimintaDS ? '✓' : '',
      row.disetujuiM ? '✓' : '',
      row.disetujuiDS ? '✓' : '',
      row.ket || '',
    ]);

    autoTable(doc, {
      startY: 74,
      head: [
        [
          { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Rincian Kewenangan Klinis (Kompetensi)', rowSpan: 2, styles: { valign: 'middle' } },
          { content: 'DIMINTA', colSpan: 2, styles: { halign: 'center' } },
          { content: 'DISETUJUI', colSpan: 2, styles: { halign: 'center' } },
          { content: 'KET', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        ],
        [
          { content: 'M', styles: { halign: 'center' } },
          { content: 'DS', styles: { halign: 'center' } },
          { content: 'M', styles: { halign: 'center' } },
          { content: 'DS', styles: { halign: 'center' } },
        ],
      ],
      body: tableBody,
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [180, 180, 180], lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 104 },
        2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 14, halign: 'center' },
      },
    });

    // Signature Footer
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const signY = finalY > 230 ? 245 : finalY;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`OKU Timur, ${rkk.tanggal || '........................................'}`, pageWidth - 70, signY);

    doc.text('Pemohon,', 25, signY + 6);
    doc.text('Asesor,', pageWidth - 70, signY + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`( ${rkk.namaPemohon || rkk.nama} )`, 25, signY + 28);
    doc.text(`( ${rkk.namaAsesor || '........................................'} )`, pageWidth - 70, signY + 28);

    doc.save(`RKK_${rkk.profesi.replace(/\s+/g, '_')}_${rkk.nama.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-300">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-slate-100 p-4 flex items-center justify-between no-print border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold">Pratinjau Dokumen RKK</h3>
            <p className="text-xs text-slate-400">
              {rkk.profesi} - {rkk.nama}
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
        <div id="print-rkk-area" className="p-8 sm:p-12 text-slate-900 font-sans leading-normal">
          {/* Kop Surat Header */}
          <div className="flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-3 mb-4">
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

          {/* Document Title */}
          <div className="text-center my-4 leading-snug">
            <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wide">
              RINCIAN KEWENANGAN KLINIK (RKK) TENAGA KESEHATAN LAIN
            </h2>
            <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wide">RSUD OKU TIMUR</h3>
          </div>

          {/* Instructions */}
          <div className="text-xs mb-4">
            <p className="font-bold">Petunjuk Pengisian:</p>
            <p className="italic text-slate-700">
              Pemohon mengisi kolom &apos;DIMINTA&apos; dan Sub-Komite Kredensial/Asesor mengisi kolom &apos;DISETUJUI&apos;.
            </p>
            <p className="italic text-slate-700">Kode: M = Mandiri | DS = Dengan Supervisi | KET = Keterangan</p>
          </div>

          {/* Profile Header */}
          <div className="text-xs space-y-1 mb-4">
            <div className="font-bold text-sm">Profesi: {rkk.profesi}</div>
            <div className="font-bold">Rincian Kewenangan Klinis</div>
            <div className="grid grid-cols-12 gap-1 pt-1">
              <span className="col-span-2">Nama</span>
              <span className="col-span-10">: {rkk.nama}</span>
              <span className="col-span-2">Kualifikasi</span>
              <span className="col-span-10">: {rkk.kualifikasi || '-'}</span>
              <span className="col-span-2">Alumni</span>
              <span className="col-span-10">: {rkk.alumni || '-'}</span>
            </div>
          </div>

          {/* Competency Table */}
          <table className="w-full text-xs border-collapse border border-slate-400 mb-6">
            <thead>
              <tr className="bg-slate-100 font-bold text-center border-b border-slate-400">
                <th rowSpan={2} className="border border-slate-400 px-2 py-2 w-10">
                  No
                </th>
                <th rowSpan={2} className="border border-slate-400 px-3 py-2 text-left">
                  Rincian Kewenangan Klinis (Kompetensi)
                </th>
                <th colSpan={2} className="border border-slate-400 px-2 py-1">
                  DIMINTA
                </th>
                <th colSpan={2} className="border border-slate-400 px-2 py-1">
                  DISETUJUI
                </th>
                <th rowSpan={2} className="border border-slate-400 px-2 py-2 w-16">
                  KET
                </th>
              </tr>
              <tr className="bg-slate-100 font-bold text-center border-b border-slate-400 text-[11px]">
                <th className="border border-slate-400 px-2 py-1 w-12">M</th>
                <th className="border border-slate-400 px-2 py-1 w-12">DS</th>
                <th className="border border-slate-400 px-2 py-1 w-12">M</th>
                <th className="border border-slate-400 px-2 py-1 w-12">DS</th>
              </tr>
            </thead>
            <tbody>
              {rkk.checklistData.map((row) => (
                <tr key={row.no} className="border-b border-slate-300">
                  <td className="border border-slate-400 px-2 py-2 text-center font-medium">{row.no}</td>
                  <td className="border border-slate-400 px-3 py-2">{row.kompetensi}</td>
                  <td className="border border-slate-400 px-2 py-2 text-center font-bold text-emerald-700">
                    {row.dimintaM ? '✓' : ''}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-center font-bold text-amber-700">
                    {row.dimintaDS ? '✓' : ''}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-center font-bold text-emerald-700">
                    {row.disetujuiM ? '✓' : ''}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-center font-bold text-amber-700">
                    {row.disetujuiDS ? '✓' : ''}
                  </td>
                  <td className="border border-slate-400 px-2 py-2 text-center text-[11px] text-slate-600">
                    {row.ket || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Date & Signatures */}
          <div className="pt-2 text-xs">
            <div className="text-right mb-4">OKU Timur, {rkk.tanggal || '........................................'}</div>
            <div className="flex justify-between items-start">
              <div className="text-left w-64">
                <p>Pemohon,</p>
                <div className="h-20"></div>
                <p className="font-bold underline">( {rkk.namaPemohon || rkk.nama} )</p>
              </div>

              <div className="text-left w-64">
                <p>Asesor,</p>
                <div className="h-20"></div>
                <p className="font-bold underline">( {rkk.namaAsesor || '........................................'} )</p>
                {rkk.nipAsesor && <p className="text-[11px] text-slate-600 font-mono">NIP. {rkk.nipAsesor}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
