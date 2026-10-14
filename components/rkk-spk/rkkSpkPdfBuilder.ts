import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { RkkItem, SpkItem, KopSuratData, RkkChecklistRow } from '@/types/nakes';
import { getMemberPhotoUrl } from '@/utils/imageUtils';

export const getKesimpulanRkk = (checklist: RkkChecklistRow[] = []) => {
  const disetujuiRows = checklist.filter((r) => r.disetujuiM || r.disetujuiDS);
  if (disetujuiRows.length === 0) {
    return 'Belum ada kewenangan klinis yang disetujui oleh asesor.';
  }
  const hasDS = disetujuiRows.some((r) => r.disetujuiDS);
  const hasM = disetujuiRows.some((r) => r.disetujuiM);
  if (hasM && !hasDS) {
    return 'yang bersangkutan dapat menjalankan tugas sesuai RKK di atas secara MANDIRI.';
  }
  if (hasDS) {
    return 'yang bersangkutan dapat menjalankan tugas secara MANDIRI pada tindakan yang dinilai M/Mandiri dan dapat menjalankan tugas DI BAWAH SUPERVISI pada tindakan yang dinilai DS/DI BAWAH SUPERVISI oleh assesor.';
  }
  return 'yang bersangkutan dapat menjalankan tugas sesuai RKK di atas.';
};

// Safe image loader
export const loadBase64Image = (url: string): Promise<string | null> => {
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

// Render Kop Surat onto current page of doc
export const renderKopSurat = (
  doc: jsPDF,
  activeKop: KopSuratData,
  leftLogo: string | null,
  rightLogo: string | null
) => {
  const pageWidth = 210;
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

  // Print text fitted to safe zone (116mm)
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

  doc.setTextColor(0, 0, 0);
  printCenteredFitted(activeKop.pemda, 23, 9.5, true);
  printCenteredFitted(activeKop.namaRS, 28, 13.5, true);
  doc.setTextColor(40, 40, 40);
  printCenteredFitted(activeKop.alamatRS, 33, 6.2, false);
  printCenteredFitted(activeKop.kontakRS, 36.8, 5.8, false);

  // Double divider line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginLeft, 40, maxX, 40);
  doc.setLineWidth(0.2);
  doc.line(marginLeft, 41, maxX, 41);
};

// Render RKK (Standard or Rekomendasi)
export const renderRkkToDoc = (
  doc: jsPDF,
  rkk: RkkItem,
  activeKop: KopSuratData,
  isRekomendasi: boolean,
  spk: SpkItem | null,
  leftLogo: string | null,
  rightLogo: string | null
) => {
  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 30;
  const marginRight = 20;
  const printableWidth = pageWidth - marginLeft - marginRight; // 160mm
  const centerX = marginLeft + printableWidth / 2; // 110mm

  // 1. Kop
  renderKopSurat(doc, activeKop, leftLogo, rightLogo);

  // 2. Title (Font Arial 12)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('RINCIAN KEWENANGAN KLINIK (RKK) TENAGA KESEHATAN LAIN', centerX, 47, { align: 'center' });
  doc.text('RSUD OKU TIMUR', centerX, 52.5, { align: 'center' });

  let currentY = 58;

  // 3. Instructions (only standard RKK)
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

  // 4. Member Info (Font Arial 12)
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

  // 5. Table
  const tableBody = rkk.checklistData.map((row) => [
    row.no,
    row.kompetensi,
    row.dimintaM ? 'CHECKED' : '',
    row.dimintaDS ? 'CHECKED' : '',
    row.disetujuiM ? 'CHECKED' : '',
    row.disetujuiDS ? 'CHECKED' : '',
    row.ket || '',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginLeft, right: marginRight, top: 20, bottom: 20 },
    tableWidth: printableWidth,
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
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 96 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 8, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 5) {
        if (data.cell.raw === 'CHECKED') {
          data.cell.text = [];
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 5) {
        if (data.cell.raw === 'CHECKED') {
          const x = data.cell.x + data.cell.width / 2;
          const y = data.cell.y + data.cell.height / 2;
          doc.saveGraphicsState?.();
          doc.setDrawColor(16, 120, 80);
          doc.setLineWidth(0.65);
          doc.line(x - 2.5, y, x - 0.8, y + 2.2);
          doc.line(x - 0.8, y + 2.2, x + 2.8, y - 2.5);
          doc.restoreGraphicsState?.();
        }
      }
    },
  });

  // 6. Kesimpulan (Font Arial 12)
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

  // 7. Signatures (Font Arial 12)
  let signY = tableFinalY + 5.5 + splitKesimpulan.length * 5.2 + 6;

  if (isRekomendasi) {
    // 1 Signature (Direktur RSUD OKU Timur)
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
  } else {
    // 2 Signatures (Pemohon & Asesor)
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
  }
};

// Render SPK
export const renderSpkToDoc = (
  doc: jsPDF,
  spk: SpkItem,
  activeKop: KopSuratData,
  leftLogo: string | null,
  rightLogo: string | null
) => {
  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 30;
  const marginRight = 20;
  const printableWidth = pageWidth - marginLeft - marginRight; // 160mm
  const centerX = marginLeft + printableWidth / 2; // 110mm
  const maxX = pageWidth - marginRight; // 190mm
  const contentIndentX = 55;
  const contentWidth = maxX - contentIndentX; // 135mm

  // 1. Kop
  renderKopSurat(doc, activeKop, leftLogo, rightLogo);

  // 2. Title Keputusan (Font Arial 12)
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

  // 3. Menimbang (Font Arial 12)
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

  // 4. MEMUTUSKAN (Font Arial 12)
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

  // Signature Block (Font Arial 12)
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
};

// =========================================================================
// BULK GENERATORS: 1. Consolidated PDF, 2. ZIP Archive, 3. Bulk Print
// =========================================================================

export interface BulkMemberDocPair {
  rkk: RkkItem;
  spk: SpkItem | null;
}

/**
 * Generate a single consolidated multi-page PDF containing RKK, RKK Rekomendasi, and SPK
 * for all members in the group.
 */
export const generateConsolidatedProfessionPdf = async (
  pairs: BulkMemberDocPair[],
  kop: KopSuratData | null,
  profesiLabel: string
): Promise<jsPDF> => {
  const activeKop = kop || {
    pemda: 'PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR',
    namaRS: 'RSUD OKU TIMUR',
    alamatRS:
      'Jalan Raya Belitang-Rasuan No. 1, Tulus Ayu, Belitang Madang Raya, Kabupaten OKU Timur, Sumatera Selatan 32382',
    kontakRS: 'Telp. (0735)-4531 945, Email: kab.rsudokutimur@gmail.com, Laman: www.rsudokut.okutimurkab.go.id',
    logoKiriUrl: '/images/media_1788156510786.png',
    logoKananUrl: '/images/logo_komite.png',
  };

  const [leftLogo, rightLogo] = await Promise.all([
    loadBase64Image(activeKop.logoKiriUrl || '/images/media_1788156510786.png'),
    loadBase64Image(activeKop.logoKananUrl || '/images/logo_komite.png'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let isFirstDoc = true;

  for (const pair of pairs) {
    const { rkk, spk } = pair;
    const safeSpk: SpkItem = spk || {
      id: `SPK-${rkk.id}`,
      rkkId: rkk.id,
      memberId: rkk.memberId,
      nomorSurat: '445/ 2261 / RSUD / X / 2026',
      nama: rkk.nama,
      kualifikasi: rkk.kualifikasi || rkk.profesi,
      profesi: rkk.profesi,
      pelayanan: rkk.profesi,
      masaBerlakuTahun: '3 (tiga) tahun',
      tanggalDitetapkan: rkk.tanggal || '14 Oktober 2026',
      tempatDitetapkan: 'TULUS AYU',
      namaDirektur: 'dr. Sugihartono, M.Sc.',
      pangkatDirektur: 'Penata TK. I/ III d',
      nipDirektur: '197606302005011003',
    };

    // 1. Dokumen RKK Standar
    if (!isFirstDoc) doc.addPage();
    isFirstDoc = false;
    renderRkkToDoc(doc, rkk, activeKop, false, safeSpk, leftLogo, rightLogo);

    // 2. Dokumen RKK Rekomendasi
    doc.addPage();
    renderRkkToDoc(doc, rkk, activeKop, true, safeSpk, leftLogo, rightLogo);

    // 3. Dokumen SPK
    doc.addPage();
    renderSpkToDoc(doc, safeSpk, activeKop, leftLogo, rightLogo);
  }

  return doc;
};

/**
 * Generate a ZIP file containing separate PDFs for each member (RKK, RKK Rekomendasi, and SPK)
 */
export const generateProfessionZip = async (
  pairs: BulkMemberDocPair[],
  kop: KopSuratData | null,
  profesiLabel: string
): Promise<Blob> => {
  const activeKop = kop || {
    pemda: 'PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR',
    namaRS: 'RSUD OKU TIMUR',
    alamatRS:
      'Jalan Raya Belitang-Rasuan No. 1, Tulus Ayu, Belitang Madang Raya, Kabupaten OKU Timur, Sumatera Selatan 32382',
    kontakRS: 'Telp. (0735)-4531 945, Email: kab.rsudokutimur@gmail.com, Laman: www.rsudokut.okutimurkab.go.id',
    logoKiriUrl: '/images/media_1788156510786.png',
    logoKananUrl: '/images/logo_komite.png',
  };

  const [leftLogo, rightLogo] = await Promise.all([
    loadBase64Image(activeKop.logoKiriUrl || '/images/media_1788156510786.png'),
    loadBase64Image(activeKop.logoKananUrl || '/images/logo_komite.png'),
  ]);

  const zip = new JSZip();
  const folderName = `DOKUMEN_RKK_SPK_${profesiLabel.replace(/\s+/g, '_').toUpperCase()}`;
  const folder = zip.folder(folderName) || zip;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const { rkk, spk } = pair;
    const safeSpk: SpkItem = spk || {
      id: `SPK-${rkk.id}`,
      rkkId: rkk.id,
      memberId: rkk.memberId,
      nomorSurat: '445/ 2261 / RSUD / X / 2026',
      nama: rkk.nama,
      kualifikasi: rkk.kualifikasi || rkk.profesi,
      profesi: rkk.profesi,
      pelayanan: rkk.profesi,
      masaBerlakuTahun: '3 (tiga) tahun',
      tanggalDitetapkan: rkk.tanggal || '14 Oktober 2026',
      tempatDitetapkan: 'TULUS AYU',
      namaDirektur: 'dr. Sugihartono, M.Sc.',
      pangkatDirektur: 'Penata TK. I/ III d',
      nipDirektur: '197606302005011003',
    };

    const cleanName = `${String(i + 1).padStart(2, '0')}_${rkk.nama.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // A. RKK
    const docRkk = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    renderRkkToDoc(docRkk, rkk, activeKop, false, safeSpk, leftLogo, rightLogo);
    const rkkBlob = docRkk.output('blob');
    folder.file(`1_RKK_${cleanName}.pdf`, rkkBlob);

    // B. RKK Rekomendasi
    const docRek = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    renderRkkToDoc(docRek, rkk, activeKop, true, safeSpk, leftLogo, rightLogo);
    const rekBlob = docRek.output('blob');
    folder.file(`2_RKK_REKOMENDASI_${cleanName}.pdf`, rekBlob);

    // C. SPK
    const docSpk = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    renderSpkToDoc(docSpk, safeSpk, activeKop, leftLogo, rightLogo);
    const spkBlob = docSpk.output('blob');
    folder.file(`3_SPK_${cleanName}.pdf`, spkBlob);
  }

  return await zip.generateAsync({ type: 'blob' });
};
