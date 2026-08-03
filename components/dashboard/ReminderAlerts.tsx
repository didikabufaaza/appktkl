'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ShieldAlert, Calendar, AlertTriangle, ArrowRight, Mail, CheckCircle2, Loader2, Send, Sparkles } from 'lucide-react';
import { DashboardStats } from '@/types/nakes';
import { TestEmailModal } from '@/components/dashboard/TestEmailModal';
import { toast } from 'sonner';

interface ReminderAlertsProps {
  reminders: DashboardStats['expiringReminders'];
  userSession?: any;
}

export function ReminderAlerts({ reminders, userSession }: ReminderAlertsProps) {
  const permissions = userSession?.permissions;
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testModalItem, setTestModalItem] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const isUser = userSession?.role === 'user';
  const userMemberId = String(userSession?.memberId || '').trim();
  const userEmail = (userSession?.email || userSession?.username || '').toLowerCase().trim();

  const sipReminders = useMemo(() => {
    const list = (reminders || []).filter((r) => r.documentType === 'SIP');
    if (isUser && userSession) {
      return list.filter((r) => {
        const itemEmail = (r.email || '').toLowerCase().trim();
        const rawId = String(r.id || '').split('-')[0].trim();
        return rawId === userMemberId || (itemEmail && itemEmail === userEmail && !itemEmail.includes('@ktkl.local'));
      });
    }
    return list;
  }, [reminders, isUser, userSession, userMemberId, userEmail]);

  const rekredensialReminders = useMemo(() => {
    const list = (reminders || []).filter((r) => r.documentType === 'Rekredensial');
    if (isUser && userSession) {
      return list.filter((r) => {
        const itemEmail = (r.email || '').toLowerCase().trim();
        const rawId = String(r.id || '').split('-')[0].trim();
        return rawId === userMemberId || (itemEmail && itemEmail === userEmail && !itemEmail.includes('@ktkl.local'));
      });
    }
    return list;
  }, [reminders, isUser, userSession, userMemberId, userEmail]);

  const handleSendAllEmails = async () => {
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/notifications/email');
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
      } else {
        toast.error('Gagal mengirim email notifikasi.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi saat mengirim email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendIndividualEmail = async (item: DashboardStats['expiringReminders'][0]) => {
    toast.promise(
      fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: item.email || 'anggota@rsudokut.go.id',
          namaLengkap: item.namaLengkap,
          type: item.documentType === 'Rekredensial' ? 'Rekredensial' : 'SIP',
          expiryDate: item.expiryDate,
        }),
      }).then((r) => r.json()),
      {
        loading: `Mengirim email otomatis ke ${item.namaLengkap}...`,
        success: (json) => `🎉 Email Pengingat Berhasil Terkirim Otomatis ke ${item.namaLengkap} (${item.email})!`,
        error: `Gagal mengirim email ke ${item.namaLengkap}`,
      }
    );
  };

  const handleOpenTestModal = (item?: any) => {
    setTestModalItem(item || null);
    setIsTestModalOpen(true);
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        defaultNama={testModalItem?.namaLengkap || 'Didik Wahyudi, S.ST'}
        defaultType={testModalItem?.documentType === 'Rekredensial' ? 'Rekredensial' : 'SIP'}
        defaultExpiryDate={testModalItem?.expiryDate || '24/09/2026'}
      />

      {/* Header Bar dengan Tombol Kirim Email Otomatis */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Sistem Pengingat & Notifikasi Email Otomatis</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Otomatis 24/7 (Background Cron)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Email peringatan otomatis dikirimkan ke masing-masing anggota untuk SIP (&lt;1 Thn) dan Rekredensial Kembali (&lt;6 Bln)
            </p>
          </div>
        </div>

        {permissions?.canSendEmail !== false && (
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => handleOpenTestModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Tes Kirim ke Email Saya</span>
            </button>

            <button
              onClick={handleSendAllEmails}
              disabled={isSendingEmail || (sipReminders.length === 0 && rekredensialReminders.length === 0)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all shrink-0"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Semua Email Pengingat</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Card 1: Peringatan Masa Habis SIP (< 1 Tahun) */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 shadow-lg shadow-rose-950/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-200">
                Peringatan Masa Habis SIP (&lt; 1 Tahun)
              </h3>
              <p className="text-xs text-rose-300/70">
                Data anggota yang sisa masa berlaku SIP nya kurang dari 1 tahun (365 hari) dari tanggal berjalan
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            {sipReminders.length} Anggota SIP &lt; 1 Tahun
          </span>
        </div>

        {sipReminders.length === 0 ? (
          <div className="p-4 text-center text-xs text-rose-300/60 italic bg-rose-950/40 rounded-xl border border-rose-900/30">
            Tidak ada SIP anggota yang kadaluarsa atau kurang dari 1 tahun.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-rose-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-950/60 text-rose-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">Email Anggota</th>
                  <th className="px-4 py-3">Profesi</th>
                  <th className="px-4 py-3">Masa Habis SIP</th>
                  <th className="px-4 py-3">Sisa Waktu SIP</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-900/30 text-slate-200">
                {sipReminders.map((item) => {
                  const isUrgent = item.daysRemaining <= 30;
                  const monthsLeft = Math.floor(item.daysRemaining / 30);
                  const daysLeft = item.daysRemaining % 30;

                  let timeText = '';
                  if (item.daysRemaining <= 0) {
                    timeText = 'SUDAH HABIS';
                  } else if (monthsLeft > 0) {
                    timeText = `${item.daysRemaining} Hari (${monthsLeft} Bln ${daysLeft} Hri)`;
                  } else {
                    timeText = `${item.daysRemaining} Hari`;
                  }

                  return (
                    <tr key={item.id} className="hover:bg-rose-900/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-100">{item.namaLengkap}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-[11px]">{item.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.profesi}</td>
                      <td className="px-4 py-3 font-mono text-rose-300 font-semibold">{item.expiryDate}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                            isUrgent
                              ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {timeText}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        {permissions?.canSendEmail !== false && (
                          <button
                            onClick={() => handleSendIndividualEmail(item)}
                            className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-white font-semibold underline underline-offset-4"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Kirim Email</span>
                          </button>
                        )}
                        <Link
                          href={`/anggota/${item.id.split('-')[0]}`}
                          className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-white font-semibold underline underline-offset-4"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 2: Peringatan Waktu Rekredensial Kembali (< 6 Bulan) */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 shadow-lg shadow-amber-950/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                Peringatan Waktu Rekredensial Kembali (&lt; 6 Bulan)
              </h3>
              <p className="text-xs text-amber-300/70">
                Daftar anggota dengan sisa waktu rekredensial rutin (3 tahun dari Tgl Permohonan) kurang dari 6 bulan (180 hari)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            {rekredensialReminders.length} Anggota Rekredensial &lt; 6 Bulan
          </span>
        </div>

        {rekredensialReminders.length === 0 ? (
          <div className="p-4 text-center text-xs text-amber-300/60 italic bg-amber-950/40 rounded-xl border border-amber-900/30">
            Tidak ada anggota yang memasuki waktu rekredensial kembali (&lt; 6 Bulan).
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-950/60 text-amber-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">Email Anggota</th>
                  <th className="px-4 py-3">Profesi</th>
                  <th className="px-4 py-3">Waktu Rekredensial Kembali</th>
                  <th className="px-4 py-3">Sisa Waktu Rekredensial</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/30 text-slate-200">
                {rekredensialReminders.map((item) => {
                  const monthsLeft = Math.floor(item.daysRemaining / 30);
                  const daysLeft = item.daysRemaining % 30;

                  let timeText = '';
                  if (item.daysRemaining <= 0) {
                    timeText = 'WAKTU REKREDENSIAL TIBA';
                  } else if (monthsLeft > 0) {
                    timeText = `${item.daysRemaining} Hari (${monthsLeft} Bln ${daysLeft} Hri)`;
                  } else {
                    timeText = `${item.daysRemaining} Hari`;
                  }

                  return (
                    <tr key={item.id} className="hover:bg-amber-900/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-100">{item.namaLengkap}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 text-[11px]">{item.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.profesi}</td>
                      <td className="px-4 py-3 font-mono text-amber-300 font-semibold">{item.expiryDate}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Calendar className="w-3.5 h-3.5" />
                          {timeText}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        {permissions?.canSendEmail !== false && (
                          <button
                            onClick={() => handleSendIndividualEmail(item)}
                            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-white font-semibold underline underline-offset-4"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Kirim Email</span>
                          </button>
                        )}
                        <Link
                          href={`/anggota/${item.id.split('-')[0]}`}
                          className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-white font-semibold underline underline-offset-4"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
