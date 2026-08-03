'use client';

import React, { useState } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, Loader2, Key, Info, HelpCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultNama?: string;
  defaultType?: 'SIP' | 'Rekredensial';
  defaultExpiryDate?: string;
}

export function TestEmailModal({
  isOpen,
  onClose,
  defaultEmail = '',
  defaultNama = 'Didik Wahyudi, S.ST',
  defaultType = 'SIP',
  defaultExpiryDate = '24/09/2026',
}: TestEmailModalProps) {
  const [targetEmail, setTargetEmail] = useState(defaultEmail || '');
  const [namaLengkap, setNamaLengkap] = useState(defaultNama);
  const [notificationType, setNotificationType] = useState<'SIP' | 'Rekredensial'>(defaultType);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);

  // SMTP Settings
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('ktkl_smtp_user') || '';
      const savedPass = localStorage.getItem('ktkl_smtp_pass') || '';
      if (savedUser) setSmtpUser(savedUser);
      if (savedPass) setSmtpPass(savedPass);
    }
  }, []);

  React.useEffect(() => {
    setTargetEmail(defaultEmail || '');
    setNamaLengkap(defaultNama);
    setNotificationType(defaultType);
    setExpiryDate(defaultExpiryDate);
  }, [defaultEmail, defaultNama, defaultType, defaultExpiryDate]);

  if (!isOpen) return null;

  const dateParts = expiryDate.split('/');
  const day = dateParts[0] || '24';
  const month = dateParts[1] || '09';
  const year = dateParts[2] || '2026';

  const previewMessage =
    notificationType === 'SIP'
      ? `Komite KTKL RSUD OKU TIMUR mengingatkan bahwa masa SIP anda akan segera berakhir pada tgl ${day} bln ${month} tahun ${year}.`
      : `Komite KTKL RSUD OKU TIMUR mengingatkan bahwa waktu rekredensial kembali anda pada tgl ${day} bln ${month} tahun ${year}.`;

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Silakan masukkan alamat email penerima yang valid!');
      return;
    }

    if (typeof window !== 'undefined') {
      if (smtpUser) localStorage.setItem('ktkl_smtp_user', smtpUser.trim());
      if (smtpPass) localStorage.setItem('ktkl_smtp_pass', smtpPass.trim());
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          namaLengkap,
          type: notificationType,
          expiryDate,
          smtpUser: smtpUser.trim() || undefined,
          smtpPass: smtpPass.trim() || undefined,
        }),
      });

      const json = await res.json();
      setLastResult(json);

      if (json.success && json.data.status === 'SENT') {
        toast.success(`🎉 EMAIL BERHASIL TERKIRIM ASLI ke ${targetEmail}! Silakan cek Kotak Masuk / Inbox.`);
      } else if (json.data?.status === 'SIMULATED') {
        toast.warning(
          'Email disimulasikan di log server. Untuk menerima email di Inbox asli, masukkan SMTP User & Password Aplikasi Gmail di form bawah.'
        );
      } else {
        toast.error(json.message || 'Gagal mengirim email.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan koneksi saat mengirim email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Tes Kirim Email Langsung ke Inbox</h2>
              <p className="text-xs text-slate-400">
                Uji coba pengiriman email peringatan SIP / Rekredensial ke alamat email Anda
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSendTestEmail} className="space-y-4">
          {/* Target Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Tujuan Penerima (Email Anda) <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Contoh: emailanda@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          {/* Type & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Notifikasi Email</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="SIP">Pengingat Masa SIP (&lt; 1 Tahun)</option>
                <option value="Rekredensial">Pengingat Rekredensial Kembali (&lt; 6 Bulan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Berlaku / Habis</label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Pratinjau Isi Pesan Email Resmi:
            </span>
            <p className="text-xs text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-mono">
              "{previewMessage}"
            </p>
          </div>

          {/* Optional SMTP Override Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Pengaturan Akun Pengirim (SMTP / Gmail App Password)</span>
              </span>
              <span className="text-[10px] text-slate-400">Opsional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Email Pengirim (Gmail)</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="pengirim@gmail.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Password Aplikasi Gmail (16 Karakter)</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Jika diisi, email akan dikirim secara nyata (*real live email*) dari akun Gmail pengirim ke Inbox target!
              </span>
            </p>
          </div>

          {/* Diagnostic Status Box & Mailto Direct Launcher */}
          {lastResult && (
            <div className="space-y-3">
              <div
                className={`p-4 rounded-2xl text-xs border ${
                  lastResult.data?.status === 'SENT'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                    : lastResult.data?.status === 'SIMULATED'
                    ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                    : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                }`}
              >
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  {lastResult.data?.status === 'SENT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>Status: {lastResult.data?.status || 'SENT'}</span>
                </div>
                <p className="leading-relaxed">{lastResult.message}</p>
                <p className="text-[11px] text-amber-300/90 mt-2 italic">
                  💡 Catatan: Cek juga <strong>Folder SPAM / JUNK / PROMOSI</strong> di email Anda jika email belum muncul di Kotak Masuk (Inbox) Utama.
                </p>
              </div>

              {/* Direct Gmail Web Compose Launcher */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Kirim Asli 100% via Gmail Web (Tanpa Pengaturan Password):</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Jika belum menyetel Password Aplikasi Gmail di `.env.local`, gunakan tombol di bawah ini untuk membuka halaman tulis email Gmail Web Anda dengan penerima <strong>{targetEmail}</strong> dan isi pesan terisi otomatis:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(
                      notificationType === 'SIP'
                        ? 'Peringatan Masa SIP Berakhir - Komite KTKL RSUD OKU TIMUR'
                        : 'Peringatan Waktu Rekredensial Kembali - Komite KTKL RSUD OKU TIMUR'
                    )}&body=${encodeURIComponent(
                      `Yth. ${namaLengkap},\n\n${previewMessage}\n\nMohon untuk segera mempersiapkan berkas perpanjangan.\n\nSalam,\nKomite Tenaga Kesehatan Lain RSUD OKU TIMUR`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all text-center"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Buka Gmail Web (Tulis Email)</span>
                  </a>

                  <a
                    href={`mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(
                      notificationType === 'SIP'
                        ? 'Peringatan Masa SIP Berakhir - Komite KTKL RSUD OKU TIMUR'
                        : 'Peringatan Waktu Rekredensial Kembali - Komite KTKL RSUD OKU TIMUR'
                    )}&body=${encodeURIComponent(
                      `Yth. ${namaLengkap},\n\n${previewMessage}\n\nMohon untuk segera mempersiapkan berkas perpanjangan.\n\nSalam,\nKomite Tenaga Kesehatan Lain RSUD OKU TIMUR`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all text-center"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0 text-blue-400" />
                    <span>Aplikasi Email Laptop</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Email Sistem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
