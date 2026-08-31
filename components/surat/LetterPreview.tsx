'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Printer, Download, X } from 'lucide-react';
import { SuratItem, KopSuratData } from '@/types/nakes';
import { getMemberPhotoUrl } from '@/utils/imageUtils';

interface LetterPreviewProps {
  letter: SuratItem;
  onClose: () => void;
}

export function LetterPreview({ letter, onClose }: LetterPreviewProps) {
  const [kop, setKop] = useState<KopSuratData>({
    pemda: 'PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR',
    namaRS: 'RSUD OKU TIMUR',
    alamatRS: 'Jalan Raya Belitang-Rasuan No. 1, Tulus Ayu, Belitang Madang Raya, Kabupaten OKU Timur, Sumatera Selatan 32382',
    kontakRS: 'Telp. (0735)-4531 945, Email: kab.rsudokutimur@gmail.com, Laman: www.rsudokut.okutimurkab.go.id',
    logoKiriUrl: '',
    logoKananUrl: '',
  });

  useEffect(() => {
    fetch('/api/master/kop-surat')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setKop(res.data);
        }
      })
      .catch(() => toast.error('Gagal memuat detail Kop Surat.'));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden rounded-2xl border border-slate-800">
      {/* Control Header (Hidden during printing) */}
      <div className="print:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-100">Pratinjau Surat Resmi</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-850 text-slate-400 font-mono">A4 Layout</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Cetak / Download PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* A4 Letter Sheet Container (scrollable on screen, page-break optimized on print) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 flex justify-center custom-scrollbar">
        <div 
          id="print-area" 
          className="print-area bg-white text-slate-900 p-8 md:p-12 w-full max-w-[210mm] min-h-[297mm] shadow-2xl rounded-lg font-serif relative leading-normal text-sm"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Style Overrides for print and screen formatting */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #print-area, #print-area * {
                visibility: visible;
              }
              #print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                font-size: 12pt !important;
              }
              .print-hidden-element {
                display: none !important;
              }
            }
          `}</style>

          {/* Kop Surat Header */}
          <div className="flex items-center justify-between border-b-[3px] border-double border-slate-800 pb-3 mb-6">
            {/* Left Logo */}
            <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden">
              {kop.logoKiriUrl ? (
                <img src={getMemberPhotoUrl(kop.logoKiriUrl)} alt="Logo Kiri" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400 font-mono">Logo</div>
              )}
            </div>

            {/* Middle text header */}
            <div className="text-center flex-1 px-4 leading-snug">
              <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-800">
                {kop.pemda}
              </h2>
              <h1 className="text-base md:text-xl font-extrabold uppercase text-slate-900 my-0.5">
                {kop.namaRS}
              </h1>
              <p className="text-[10px] md:text-xs text-slate-600 font-sans">
                {kop.alamatRS}
              </p>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-sans font-medium mt-0.5">
                {kop.kontakRS}
              </p>
            </div>

            {/* Right Logo */}
            <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden">
              {kop.logoKananUrl ? (
                <img src={getMemberPhotoUrl(kop.logoKananUrl)} alt="Logo Kanan" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400 font-mono">Logo</div>
              )}
            </div>
          </div>

          {/* Top Right Date */}
          <div className="text-right text-xs md:text-sm mb-4">
            {letter.tanggal}
          </div>

          {/* Nomor, Sifat, Lampiran, Hal (Aligned Left) */}
          <div className="grid grid-cols-12 gap-y-1 text-xs md:text-sm mb-6">
            <div className="col-span-2 font-semibold">Nomor</div>
            <div className="col-span-10">: {letter.nomor}</div>
            
            <div className="col-span-2 font-semibold">Sifat</div>
            <div className="col-span-10">: {letter.sifat}</div>
            
            <div className="col-span-2 font-semibold">Lampiran</div>
            <div className="col-span-10">: {letter.lampiran}</div>
            
            <div className="col-span-2 font-semibold font-serif">Hal</div>
            <div className="col-span-10 font-bold">: {letter.hal}</div>
          </div>

          {/* Recipient Address */}
          <div className="text-xs md:text-sm mb-8 text-left leading-normal">
            <div className="font-semibold">Yth. {letter.yth}</div>
            <div className="mt-0.5">Di</div>
            <div className="pl-6 font-semibold">{letter.di}</div>
          </div>

          {/* Letter Body (Text content formatted with linebreaks) */}
          <div className="text-xs md:text-sm leading-relaxed mb-12 text-justify">
            {letter.isiSurat.split('\n').map((para, i) => (
              <p key={i} className="mb-4 text-indent-8 font-serif" style={{ textIndent: '30px' }}>
                {para}
              </p>
            ))}
          </div>

          {/* Bottom Section: Paraf Hierarki & Penandatangan (Horizontal Layout) */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-4">
            {/* Left Column: Paraf Hierarki Table */}
            <div className="flex flex-col justify-end">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 font-sans tracking-wide">PARAF HIERARKI</span>
              <table className="border-collapse border border-slate-400 text-[10px] w-64 text-slate-800 font-sans">
                <tbody>
                  <tr className="border-b border-slate-400">
                    <td className="border-r border-slate-400 px-2 py-1.5 font-semibold w-32 uppercase text-[9px]">KABAG / KABID</td>
                    <td className="px-2 py-1.5 font-mono italic text-center w-32 min-h-[24px]">
                      {letter.parafKabag || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <td className="border-r border-slate-400 px-2 py-1.5 font-semibold w-32 uppercase text-[9px]">KASUBBAG / KASIE</td>
                    <td className="px-2 py-1.5 font-mono italic text-center w-32 min-h-[24px]">
                      {letter.parafKasubbag || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-slate-400 px-2 py-1.5 font-semibold w-32 uppercase text-[9px]">PELAKSANA</td>
                    <td className="px-2 py-1.5 font-mono italic text-center w-32 min-h-[24px]">
                      {letter.parafPelaksana || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Signature Box */}
            <div className="text-center flex flex-col justify-between h-44 text-xs md:text-sm pl-4">
              <div>
                <div className="font-semibold">{letter.penandatanganJabatan}</div>
              </div>
              <div className="my-6 min-h-[40px] italic text-slate-300 font-sans text-[10px]">
                [Tanda Tangan Basah / QR Code]
              </div>
              <div>
                <div className="font-bold underline uppercase">{letter.penandatanganNama}</div>
                {letter.penandatanganPangkat && <div className="text-[11px] text-slate-700">{letter.penandatanganPangkat}</div>}
                {letter.penandatanganNip && <div className="text-[11px] font-mono text-slate-800">NIP. {letter.penandatanganNip}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
