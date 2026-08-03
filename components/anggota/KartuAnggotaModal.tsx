'use client';

import React from 'react';
import { X, Printer, Hospital, ShieldCheck, QrCode } from 'lucide-react';
import { NakesMember } from '@/types/nakes';
import { getMemberPhotoUrl, getMemberQrUrl } from '@/utils/imageUtils';

interface KartuAnggotaModalProps {
  member: NakesMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export function KartuAnggotaModal({ member, isOpen, onClose }: KartuAnggotaModalProps) {
  if (!isOpen || !member) return null;

  const photoUrl = getMemberPhotoUrl(member.linkPhoto || member.photo, member.namaLengkap);
  const qrUrl = getMemberQrUrl(member.qr, member.nomorAnggota, member.namaLengkap, member.profesi);

  const handlePrintCard = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Pratinjau Kartu Anggota KTKL</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ID Card Display Area (Printable) */}
        <div className="flex justify-center">
          <div
            id="printable-id-card"
            className="w-[420px] h-[260px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-slate-100 flex flex-col justify-between relative overflow-hidden shrink-0"
          >
            {/* Watermark Logo */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-emerald-500 pointer-events-none">
              <Hospital className="w-48 h-48" />
            </div>

            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                  <Hospital className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-slate-100 leading-none">
                    RSUD OKU TIMUR
                  </h4>
                  <p className="text-[9px] text-emerald-400 font-semibold mt-0.5 tracking-tight">
                    KOMITE TENAGA KESEHATAN LAIN (KTKL)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                {member.statusKepegawaian || 'PNS'}
              </span>
            </div>

            {/* Middle Section: Photo, Info, and QR */}
            <div className="flex items-center gap-3.5 my-auto py-1">
              {/* Photo */}
              <div className="w-20 h-24 rounded-xl border border-emerald-500/50 bg-slate-800 overflow-hidden shrink-0 shadow-md">
                <img
                  src={photoUrl}
                  alt={member.namaLengkap}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLElement).setAttribute(
                      'src',
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.namaLengkap
                      )}&background=0f172a&color=10b981&bold=true`
                    );
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-xs font-extrabold text-slate-100 truncate leading-tight">
                  {member.namaLengkap}
                </h3>
                <div className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {member.profesi}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  No: <span className="text-slate-200 font-semibold">{member.nomorAnggota || '001/KTKL/2026'}</span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Pendidikan: <span className="text-slate-200 font-semibold">{member.pendidikan}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="w-16 h-16 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img src={qrUrl} alt="QR Code Anggota" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[8px] text-slate-400">
              <div>
                <span>Berlaku s/d: </span>
                <strong className="text-emerald-400 font-mono">31 DESEMBER 2028</strong>
              </div>
              <div className="font-semibold text-slate-300">
                KARTU ANGGOTA RESMI KTKL
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrintCard}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>CETAK KARTU ANGGOTA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
