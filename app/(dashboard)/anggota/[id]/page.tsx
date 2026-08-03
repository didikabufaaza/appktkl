'use client';

import React, { useEffect, useState, use } from 'react';
import { NakesMember } from '@/types/nakes';
import { DocumentPreviewModal } from '@/components/anggota/DocumentPreviewModal';
import { KartuAnggotaModal } from '@/components/anggota/KartuAnggotaModal';
import { FormAnggota } from '@/components/anggota/FormAnggota';
import { getMemberPhotoUrl, getMemberQrUrl } from '@/utils/imageUtils';
import { addThreeYears } from '@/utils/dateUtils';
import {
  User,
  Mail,
  GraduationCap,
  FileText,
  Eye,
  ExternalLink,
  ArrowLeft,
  Award,
  Building,
  CreditCard,
  Edit,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DetailAnggotaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [member, setMember] = useState<NakesMember | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const reloadMemberData = () => {
    fetch(`/api/anggota/${id}?t=` + Date.now())
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setMember(json.data);
        }
      });
  };

  useEffect(() => {
    // Private data isolation check for role 'user'
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const u = data.user;
          setUserSession(u);
          if (u.role === 'user' && u.memberId && u.memberId !== id) {
            toast.warning('Akses Privat: Anda hanya dapat melihat data/profil Anda sendiri.');
            window.location.href = `/anggota/${u.memberId}`;
            return;
          }
        }
      });

    fetch(`/api/anggota/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setMember(json.data);
        } else {
          toast.error('Data anggota tidak ditemukan.');
        }
      })
      .catch(() => toast.error('Gagal memuat detail anggota.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-3xl" />
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Anggota Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">Data anggota dengan ID {id} tidak ada di Spreadsheet.</p>
        <Link
          href="/anggota"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Data Anggota</span>
        </Link>
      </div>
    );
  }

  const photoUrl = getMemberPhotoUrl(member.linkPhoto || member.photo, member.namaLengkap);
  const qrUrl = getMemberQrUrl(member.qr, member.nomorAnggota, member.namaLengkap, member.profesi);
  const canEdit = userSession?.permissions?.canEditMemberData !== false;

  const documents = [
    { title: 'Surat Tanda Registrasi (STR)', number: member.strNumber || 'STR-REGISTERED', url: member.strUrl || member.mergedDocUrl, date: member.strExpDate },
    { title: 'Surat Izin Praktek (SIP)', number: member.sipNumber || 'SIP-REGISTERED', url: member.sipUrl || member.mergedDocUrl, date: member.sipExpDate },
    { title: 'Sertifikat Pelatihan', number: 'SERT-KTKL-2026', url: member.sertifikatUrl || member.mergedDocUrl, date: member.sertifikatExpDate },
    { title: 'Ijazah Terakhir', number: `IJZ-${member.pendidikan}`, url: member.ijazahUrl || member.mergedDocUrl, date: 'Permanen' },
    { title: 'Surat Kredensial Otomatis', number: member.mergedDocId || 'DOC-KREDENSIAL', url: member.mergedDocUrl || member.linkMergedDoc, date: 'Terverifikasi' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Member Photo Avatar */}
        <div className="w-28 h-32 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 overflow-hidden shadow-xl shadow-emerald-500/10 shrink-0 relative group">
          <img
            src={photoUrl}
            alt={member.namaLengkap}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute(
                'src',
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member.namaLengkap
                )}&background=0f172a&color=10b981&bold=true&size=200`
              );
            }}
          />
        </div>

        {/* Member Details Header */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {member.namaLengkap}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {member.profesi}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            No. Anggota: <span className="text-slate-200 font-bold">{member.nomorAnggota || '001/KTKL/2026'}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Status: <strong className="text-slate-100">{member.statusKepegawaian}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Pendidikan: <strong className="text-slate-100">{member.pendidikan}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>{member.email || member.emailAddress || '-'}</span>
            </div>
          </div>
        </div>

        {/* QR Code, Edit & Print Buttons */}
        <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
          <div className="w-20 h-20 bg-white p-1 rounded-xl shadow-md border border-slate-700">
            <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profil Saya</span>
              </button>
            )}

            <button
              onClick={() => setShowCardModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Cetak Kartu + QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal Drawer */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100">
                Edit Profil Saya: {member.namaLengkap}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>

            <FormAnggota
              initialData={member}
              isEdit={true}
              onSuccess={() => {
                setIsEditing(false);
                reloadMemberData();
                toast.success('🎉 Profil Anda berhasil diperbarui!');
              }}
            />
          </div>
        </div>
      )}

      {/* Biodata & Credentials Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Informasi Biodata & Alamat</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Tempat, Tanggal Lahir:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{member.tanggalLahir || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Alamat Lengkap:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{member.alamat || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Asal Perguruan Tinggi / Sekolah:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{member.asalPendidikan || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Tgl Permohonan Kredensial:</span>
              <p className="font-semibold text-slate-200 mt-0.5 font-mono">{member.tglPermohonan || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Waktu Rekredensial Kembali (+3 Tahun):</span>
              <p className="font-semibold text-amber-300 mt-0.5 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{member.waktuRekredensialKembali || addThreeYears(member.tglPermohonan || '')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Kredensial & Masa Habis SIP</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Nomor SIP (Surat Izin Praktek):</span>
              <p className="font-semibold text-rose-300 mt-0.5 font-mono">{member.sipNumber || 'SIP-REGISTERED'}</p>
            </div>
            <div>
              <span className="text-slate-400">Masa Habis SIP:</span>
              <p className="font-semibold text-rose-400 mt-0.5 font-mono">{member.sipExpDate || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Tahun Masuk RSUD OKU TIMUR:</span>
              <p className="font-semibold text-emerald-400 mt-0.5 font-mono">{member.tahunMasukRSUD || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Masa Kerja di RSUD:</span>
              <p className="font-semibold text-teal-300 mt-0.5">{member.masaKerja || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400">Perihal / Jenis Permohonan:</span>
              <p className="font-semibold text-slate-200 mt-0.5">{member.perihal || 'Kredensial Rutin'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          <span>Dokumen Keanggotaan & Berkas Terlampir (Google Drive)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{doc.title}</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate">{doc.number}</p>
                <p className="text-[10px] text-slate-400 mt-1">Exp / Status: <strong className="text-emerald-400">{doc.date}</strong></p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                {doc.url ? (
                  <>
                    <button
                      onClick={() => setPreviewDoc({ title: doc.title, url: doc.url! })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview / Unduh</span>
                    </button>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Buka Direct Link Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Dokumen belum diunggah</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          url={previewDoc.url}
        />
      )}

      {/* Kartu Anggota Printable Modal */}
      <KartuAnggotaModal
        member={member}
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
      />
    </div>
  );
}
