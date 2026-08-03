'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hospital,
  ShieldCheck,
  Lock,
  ArrowRight,
  UserCheck,
  KeyRound,
  Mail,
  Sparkles,
  Shield,
  User,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

type ActiveRole = 'user' | 'admin' | 'superadmin';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveRole>('user');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalUser = usernameOrEmail.trim();
      let finalPass = password.trim();

      if (activeTab === 'superadmin' && !finalUser) {
        finalUser = 'superadmin';
      }
      if (activeTab === 'admin' && !finalUser) {
        finalUser = 'admin';
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: finalUser,
          password: finalPass,
          role: activeTab,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`🎉 Selamat datang kembali, ${data.data?.nama}! (${data.data?.role.toUpperCase()})`);
        if (data.data?.role === 'user' && data.data?.memberId) {
          router.push(`/anggota/${data.data.memberId}`);
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        toast.error(data.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Futuristic Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity scale-105 transition-transform duration-10000"
        style={{ backgroundImage: `url('/images/nakes_futuristic_bg.jpg')` }}
      />

      {/* Futuristic Ambient Sci-Fi Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Futuristic Card */}
      <div className="w-full max-w-lg bg-slate-900/85 border border-slate-800/90 rounded-3xl p-8 shadow-2xl shadow-emerald-950/40 relative z-10 backdrop-blur-2xl">
        {/* Top Header & Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/25 mb-3 ring-4 ring-emerald-500/20">
            <Hospital className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 tracking-tight">
            KOMITE KTKL RSUD OKU TIMUR
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Sistem Informasi & Manajemen Otomasi Tenaga Kesehatan Lain
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'user'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Anggota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('superadmin')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'superadmin'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Superadmin</span>
          </button>
        </div>

        {/* Dynamic Instruction Banner per Role */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-6 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            {activeTab === 'user' && (
              <p>
                <strong>Portal Anggota Privat:</strong> Gunakan <strong>Alamat Email Anda</strong> sebagai username dan <strong>Nama Profesi Anda</strong> (contoh: <code>ATLM</code>, <code>Apoteker</code>, <code>Radiografer</code>) sebagai password.
              </p>
            )}
            {activeTab === 'admin' && (
              <p>
                <strong>Akses Administrator Komite:</strong> Membuka dashboard & data anggota lain tanpa hak pengiriman email, cetak, atau spreadsheet.
              </p>
            )}
            {activeTab === 'superadmin' && (
              <p>
                <strong>Akses Superadmin Otoritas Penuh:</strong> Mengelola seluruh aplikasi, master data, dan memberikan contrengan matriks hak akses akun lain.
              </p>
            )}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Username / Alamat Email:</span>
            </label>
            <input
              type="text"
              required={activeTab === 'user'}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder={
                activeTab === 'user'
                  ? 'Contoh: didiklabor@gmail.com'
                  : activeTab === 'admin'
                  ? 'admin'
                  : 'superadmin'
              }
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Password (Kata Sandi):</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                activeTab === 'user'
                  ? 'Masukkan Nama Profesi (Contoh: ATLM / Apoteker)'
                  : 'Masukkan Password'
              }
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>

          {/* Quick Preset Auto-fill for Demonstration */}
          {activeTab === 'user' && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Contoh Anggota Database:</span>
              <button
                type="button"
                onClick={() => {
                  setUsernameOrEmail('dbaplikasiqu26@gmail.com');
                  setPassword('ATLM');
                }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Isi Otomatis (Demo)
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <span>Memverifikasi Otorisasi...</span>
            ) : (
              <>
                <span>Masuk ke Sistem KTKL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          RSUD OKU TIMUR &copy; 2026 Komite Tenaga Kesehatan Lain. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
