'use client';

import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { RkkItem, SpkItem, KopSuratData, RkkChecklistRow } from '@/types/nakes';
import { getMemberPhotoUrl } from '@/utils/imageUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function getKesimpulanRkk(checklist: RkkChecklistRow[]): string {
  if (!checklist || checklist.length === 0) return '';
  const hasDS = checklist.some((row) => row.disetujuiDS);
  if (hasDS) {
    return 'Yang bersangkutan dapat menjalankan tugas secara MANDIRI pada tindakan yang dinilai M/Mandiri dan dapat menjalankan tugas DI BAWAH SUPERVISI pada tindakan yang dinilai DS/DI BAWAH SUPERVISI oleh assesor.';
  }
  return 'Yang bersangkutan dapat menjalankan tugas sesuai RKK di atas secara MANDIRI.';
}

interface RkkDocumentPreviewProps {
  rkk: RkkItem;
  spk?: SpkItem | null;
  kop?: KopSuratData | null;
  isRekomendasi?: boolean;
  onClose?: () => void;
}

export function RkkDocumentPreview({
  rkk,
  spk,
  kop,
  isRekomendasi = false,
  onClose,
}: RkkDocumentPreviewProps) {
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

    // Load Left & Right Logos safely
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

    // Divider Line (From Left 30mm to Right 190mm)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, 40, maxX, 40);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, 41, maxX, 41);

    // Title (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('RINCIAN KEWENANGAN KLINIK (RKK) TENAGA KESEHATAN LAIN', centerX, 47, { align: 'center' });
    doc.text('RSUD OKU TIMUR', centerX, 52.5, { align: 'center' });

    let currentY = 58;

    // Instructions: ONLY included if standard RKK (omitted completely for RKK Rekomendasi)
    if (!isRekomendasi) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Petunjuk Pengisian:', marginLeft, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const splitInstruksi = doc.splitTextToSize(
        "Pemohon mengisi kolom 'DIMINTA' dan Sub-Komite Kredensial/Asesor mengisi kolom 'DISETUJUI'.",
        printableWidth
      );
      doc.text(splitInstruksi, marginLeft, currentY + 5);
      doc.text(
        'Kode: M = Mandiri | DS = Dengan Supervisi | KET = Keterangan',
        marginLeft,
        currentY + 5 + splitInstruksi.length * 5
      );
      currentY += 12 + splitInstruksi.length * 5;
    }

    // Member Info (Font Arial 12)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Profesi: ${rkk.profesi}`, marginLeft, currentY);

    currentY += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Kewenangan Klinis', marginLeft, currentY);

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Nama         : ${rkk.nama}`, marginLeft, currentY);
    currentY += 5;
    doc.text(`Kualifikasi  : ${rkk.kualifikasi || '-'}`, marginLeft, currentY);
    currentY += 5;
    doc.text(`Alumni       : ${rkk.alumni || '-'}`, marginLeft, currentY);
    currentY += 4;

    // Table
    const tableBody = isRekomendasi
      ? rkk.checklistData.map((row) => [
          row.no,
          row.kompetensi,
          row.disetujuiM ? 'CHECKED' : '',
          row.disetujuiDS ? 'CHECKED' : '',
        ])
      : rkk.checklistData.map((row) => [
          row.no,
          row.kompetensi,
          row.dimintaM ? 'CHECKED' : '',
          row.dimintaDS ? 'CHECKED' : '',
          row.disetujuiM ? 'CHECKED' : '',
          row.disetujuiDS ? 'CHECKED' : '',
          row.ket || '',
        ]);

    const tableHead: any = isRekomendasi
      ? [
          [
            { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            { content: 'Rincian Kewenangan Klinis (Kompetensi)', rowSpan: 2, styles: { valign: 'middle' } },
            { content: 'DISETUJUI', colSpan: 2, styles: { halign: 'center' } },
          ],
          [
            { content: 'M', styles: { halign: 'center' } },
            { content: 'DS', styles: { halign: 'center' } },
          ],
        ]
      : [
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
        ];

    const columnStyles: any = isRekomendasi
      ? {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 120 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
        }
      : {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 96 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 12, halign: 'center' },
          5: { cellWidth: 12, halign: 'center' },
          6: { cellWidth: 8, halign: 'center' },
        };

    const isChecklistCol = (colIdx: number) => {
      if (isRekomendasi) return colIdx === 2 || colIdx === 3;
      return colIdx >= 2 && colIdx <= 5;
    };

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginLeft, right: marginRight, top: 20, bottom: 20 },
      tableWidth: printableWidth,
      head: tableHead,
      body: tableBody,
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        cellPadding: 2,
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        font: 'helvetica',
        fontSize: 9.5,
      },
      columnStyles,
      didParseCell: (data) => {
        // Clear text for checklist columns so Helvetica won't print dots
        if (data.section === 'body' && isChecklistCol(data.column.index)) {
          if (data.cell.raw === 'CHECKED') {
            data.cell.text = [];
          }
        }
      },
      didDrawCell: (data) => {
        // Draw crisp vector checkmarks
        if (data.section === 'body' && isChecklistCol(data.column.index)) {
          if (data.cell.raw === 'CHECKED') {
            const x = data.cell.x + data.cell.width / 2;
            const y = data.cell.y + data.cell.height / 2;
            doc.saveGraphicsState?.();
            doc.setDrawColor(16, 120, 80); // dark emerald
            doc.setLineWidth(0.65);
            doc.line(x - 2.5, y, x - 0.8, y + 2.2);
            doc.line(x - 0.8, y + 2.2, x + 2.8, y - 2.5);
            doc.restoreGraphicsState?.();
          }
        }
      },
    });

    // Kesimpulan (Font Arial 12)
    const kesimpulanText = getKesimpulanRkk(rkk.checklistData);
    let tableFinalY = (doc as any).lastAutoTable.finalY + 5;

    if (tableFinalY > pageHeight - 55) {
      doc.addPage();
      tableFinalY = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Kesimpulan:', marginLeft, tableFinalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const splitKesimpulan = doc.splitTextToSize(kesimpulanText, printableWidth);
    doc.text(splitKesimpulan, marginLeft, tableFinalY + 5.5);

    // Signature Block (Font Arial 12)
    let signY = tableFinalY + 5.5 + splitKesimpulan.length * 5.2 + 6;

    if (isRekomendasi) {
      // RKK Rekomendasi: ONLY 1 signature (Direktur RSUD OKU Timur, identical to SPK, Arial 12)
      if (signY + 50 > pageHeight - 20) {
        doc.addPage();
        signY = 25;
      }

      const signX = 120;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`DITETAPKAN DI : ${spk?.tempatDitetapkan || 'TULUS AYU'}`, signX, signY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pada Tanggal   : ${spk?.tanggalDitetapkan || rkk.tanggal}`, signX, signY + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Direktur RSUD OKU Timur', signX, signY + 11.5);
      doc.text(spk?.namaDirektur || 'dr. Sugihartono, M.Sc.', signX, signY + 34);
      doc.setFont('helvetica', 'normal');
      doc.text(spk?.pangkatDirektur || 'Penata TK. I/ III d', signX, signY + 39.5);
      doc.text(`NIP. ${spk?.nipDirektur || '197606302005011003'}`, signX, signY + 45);

      doc.save(`RKK_Rekomendasi_${rkk.profesi.replace(/\s+/g, '_')}_${rkk.nama.replace(/\s+/g, '_')}.pdf`);
    } else {
      // Standard RKK: 2 signatures (Pemohon & Asesor, Arial 12)
      if (signY + 45 > pageHeight - 20) {
        doc.addPage();
        signY = 25;
      }

      const signXRight = 120;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`OKU Timur, ${rkk.tanggal || '........................................'}`, signXRight, signY);

      doc.text('Pemohon,', marginLeft + 5, signY + 6.5);
      doc.text('Asesor,', signXRight, signY + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`( ${rkk.namaPemohon || rkk.nama} )`, marginLeft + 5, signY + 34);
      doc.text(`( ${rkk.namaAsesor || '........................................'} )`, signXRight, signY + 34);
      if (rkk.nipAsesor) {
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${rkk.nipAsesor}`, signXRight, signY + 39.5);
      }

      doc.save(`RKK_${rkk.profesi.replace(/\s+/g, '_')}_${rkk.nama.replace(/\s+/g, '_')}.pdf`);
    }
  };

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
            #print-rkk-area {
              padding: 0 !important;
              max-width: 100% !important;
              font-family: Arial, sans-serif !important;
            }
          }
        `}</style>

        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-slate-100 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between no-print border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Pratinjau Dokumen RKK{isRekomendasi ? ' Rekomendasi' : ''}
            </h3>
            <p className="text-xs text-slate-400">
              {rkk.profesi} - {rkk.nama}
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
            id="print-rkk-area"
            className="p-6 sm:p-10 md:p-12 text-slate-900 leading-normal bg-white max-w-3xl mx-auto"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* Kop Surat Header */}
            <div className="flex items-center justify-between border-b-[3px] border-double border-slate-900 pb-3 mb-4">
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

            {/* Document Title (Font Arial 12) */}
            <div className="text-center my-4 leading-snug">
              <h2 className="text-[12pt] font-extrabold uppercase tracking-wide">
                RINCIAN KEWENANGAN KLINIK (RKK) TENAGA KESEHATAN LAIN
              </h2>
              <h3 className="text-[12pt] font-extrabold uppercase tracking-wide">RSUD OKU TIMUR</h3>
            </div>

            {/* Instructions: ONLY if not rekomendasi (Font Arial 12) */}
            {!isRekomendasi && (
              <div className="text-[12pt] leading-normal mb-4">
                <p className="font-bold">Petunjuk Pengisian:</p>
                <p className="italic text-slate-700">
                  Pemohon mengisi kolom &apos;DIMINTA&apos; dan Sub-Komite Kredensial/Asesor mengisi kolom &apos;DISETUJUI&apos;.
                </p>
                <p className="italic text-slate-700">Kode: M = Mandiri | DS = Dengan Supervisi | KET = Keterangan</p>
              </div>
            )}

            {/* Profile Header (Font Arial 12) */}
            <div className="text-[12pt] leading-normal space-y-1 mb-4">
              <div className="font-bold">Profesi: {rkk.profesi}</div>
              <div className="font-bold">Rincian Kewenangan Klinis</div>
              <div className="grid grid-cols-12 gap-1 pt-1">
                <span className="col-span-3 sm:col-span-2">Nama</span>
                <span className="col-span-9 sm:col-span-10">: {rkk.nama}</span>
                <span className="col-span-3 sm:col-span-2">Kualifikasi</span>
                <span className="col-span-9 sm:col-span-10">: {rkk.kualifikasi || '-'}</span>
                <span className="col-span-3 sm:col-span-2">Alumni</span>
                <span className="col-span-9 sm:col-span-10">: {rkk.alumni || '-'}</span>
              </div>
            </div>

            {/* Competency Table */}
            <table className="w-full text-xs sm:text-[11px] border-collapse border border-slate-400 mb-5">
              <thead>
                <tr className="bg-slate-100 font-bold text-center border-b border-slate-400">
                  <th rowSpan={2} className="border border-slate-400 px-2 py-2 w-10">
                    No
                  </th>
                  <th rowSpan={2} className="border border-slate-400 px-3 py-2 text-left">
                    Rincian Kewenangan Klinis (Kompetensi)
                  </th>
                  {!isRekomendasi && (
                    <th colSpan={2} className="border border-slate-400 px-2 py-1">
                      DIMINTA
                    </th>
                  )}
                  <th colSpan={2} className="border border-slate-400 px-2 py-1">
                    DISETUJUI
                  </th>
                  {!isRekomendasi && (
                    <th rowSpan={2} className="border border-slate-400 px-2 py-2 w-16">
                      KET
                    </th>
                  )}
                </tr>
                <tr className="bg-slate-100 font-bold text-center border-b border-slate-400 text-[10px]">
                  {!isRekomendasi && (
                    <>
                      <th className="border border-slate-400 px-2 py-1 w-12">M</th>
                      <th className="border border-slate-400 px-2 py-1 w-12">DS</th>
                    </>
                  )}
                  <th className={`border border-slate-400 px-2 py-1 ${isRekomendasi ? 'w-16' : 'w-12'}`}>M</th>
                  <th className={`border border-slate-400 px-2 py-1 ${isRekomendasi ? 'w-16' : 'w-12'}`}>DS</th>
                </tr>
              </thead>
              <tbody>
                {rkk.checklistData.map((row) => (
                  <tr key={row.no} className="border-b border-slate-300">
                    <td className="border border-slate-400 px-2 py-2 text-center font-medium">{row.no}</td>
                    <td className="border border-slate-400 px-3 py-2">{row.kompetensi}</td>
                    {!isRekomendasi && (
                      <>
                        <td className="border border-slate-400 px-2 py-2 text-center font-black text-emerald-700">
                          {row.dimintaM ? (
                            <span className="text-sm font-black text-emerald-800 print:text-black leading-none inline-block">
                              &#10003;
                            </span>
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="border border-slate-400 px-2 py-2 text-center font-black text-amber-700">
                          {row.dimintaDS ? (
                            <span className="text-sm font-black text-amber-800 print:text-black leading-none inline-block">
                              &#10003;
                            </span>
                          ) : (
                            ''
                          )}
                        </td>
                      </>
                    )}
                    <td className="border border-slate-400 px-2 py-2 text-center font-black text-emerald-700">
                      {row.disetujuiM ? (
                        <span className="text-sm font-black text-emerald-800 print:text-black leading-none inline-block">
                          &#10003;
                        </span>
                      ) : (
                        ''
                      )}
                    </td>
                    <td className="border border-slate-400 px-2 py-2 text-center font-black text-amber-700">
                      {row.disetujuiDS ? (
                        <span className="text-sm font-black text-amber-800 print:text-black leading-none inline-block">
                          &#10003;
                        </span>
                      ) : (
                        ''
                      )}
                    </td>
                    {!isRekomendasi && (
                      <td className="border border-slate-400 px-2 py-2 text-center text-[10px] text-slate-600">
                        {row.ket || ''}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Kesimpulan Section (Font Arial 12) */}
            <div className="mb-6 text-[12pt] leading-normal">
              <p className="font-bold mb-1 text-slate-900 uppercase tracking-wide">Kesimpulan:</p>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 leading-relaxed font-medium text-justify">
                {getKesimpulanRkk(rkk.checklistData)}
              </div>
            </div>

            {/* Date & Signatures (Font Arial 12) */}
            {isRekomendasi ? (
              /* RKK Rekomendasi: Only 1 Direktur signature, identical to SPK (Arial 12) */
              <div className="pt-6 text-[12pt] leading-normal flex justify-end">
                <div className="w-72 space-y-1 text-left">
                  <p className="font-bold">DITETAPKAN DI : {spk?.tempatDitetapkan || 'TULUS AYU'}</p>
                  <p className="pb-1">Pada Tanggal : {spk?.tanggalDitetapkan || rkk.tanggal}</p>
                  <p className="font-bold">Direktur RSUD OKU Timur</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline">{spk?.namaDirektur || 'dr. Sugihartono, M.Sc.'}</p>
                  <p className="text-slate-700">{spk?.pangkatDirektur || 'Penata TK. I/ III d'}</p>
                  <p className="text-slate-700 font-mono">NIP. {spk?.nipDirektur || '197606302005011003'}</p>
                </div>
              </div>
            ) : (
              /* Standard RKK: 2 signatures (Pemohon & Asesor, Arial 12) */
              <div className="pt-2 text-[12pt] leading-normal">
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
                    {rkk.nipAsesor && <p className="text-sm text-slate-600 font-mono">NIP. {rkk.nipAsesor}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
