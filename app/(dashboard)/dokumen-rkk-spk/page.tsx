'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Award,
  Users,
  Search,
  Plus,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  Building,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { NakesMember, RkkItem, SpkItem, RkkChecklistRow, KopSuratData, UserSession } from '@/types/nakes';
import { getCompetenciesByProfesi, RKK_COMPETENCY_MAP } from '@/lib/rkkCompetencies';
import { RkkDocumentPreview } from '@/components/rkk-spk/RkkDocumentPreview';
import { SpkDocumentPreview } from '@/components/rkk-spk/SpkDocumentPreview';

export default function DokumenRkkSpkPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'masal' | 'baru'>('daftar');
  const [members, setMembers] = useState<NakesMember[]>([]);
  const [rkkList, setRkkList] = useState<RkkItem[]>([]);
  const [spkList, setSpkList] = useState<SpkItem[]>([]);
  const [kop, setKop] = useState<KopSuratData | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active preview modals
  const [previewRkk, setPreviewRkk] = useState<RkkItem | null>(null);
  const [previewSpk, setPreviewSpk] = useState<SpkItem | null>(null);

  // Filters for Tab 1 (Daftar)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfesi, setFilterProfesi] = useState('ALL');

  // ==========================================
  // Form States for Bulk Generator (Tab 2)
  // ==========================================
  const [bulkProfesi, setBulkProfesi] = useState('ATLM');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkChecklist, setBulkChecklist] = useState<RkkChecklistRow[]>([]);
  const [bulkTanggal, setBulkTanggal] = useState(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [bulkNamaAsesor, setBulkNamaAsesor] = useState('Ketua Sub Komite Kredensial');
  const [bulkNipAsesor, setBulkNipAsesor] = useState('');
  const [bulkNamaDirektur, setBulkNamaDirektur] = useState('dr. Sugihartono, M.Sc.');
  const [bulkPangkatDirektur, setBulkPangkatDirektur] = useState('Penata TK. I/ III d');
  const [bulkNipDirektur, setBulkNipDirektur] = useState('197606302005011003');
  const [bulkNomorSuratPattern, setBulkNomorSuratPattern] = useState(
    `445/ [NO] / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`
  );

  // ==========================================
  // Form States for Single Generator (Tab 3)
  // ==========================================
  const [singleMemberId, setSingleMemberId] = useState('');
  const [singleNama, setSingleNama] = useState('');
  const [singleNip, setSingleNip] = useState('');
  const [singleProfesi, setSingleProfesi] = useState('ATLM');
  const [singleKualifikasi, setSingleKualifikasi] = useState('');
  const [singleAlumni, setSingleAlumni] = useState('');
  const [singleGelar, setSingleGelar] = useState('');
  const [singlePelayanan, setSinglePelayanan] = useState('');
  const [singleChecklist, setSingleChecklist] = useState<RkkChecklistRow[]>([]);
  const [singleNomorSurat, setSingleNomorSurat] = useState(
    `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`
  );

  function toRomanMonth(m: number): string {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romans[m - 1] || 'X';
  }

  // Load initial data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [membersRes, rkkRes, spkRes, kopRes, authRes] = await Promise.all([
        fetch('/api/anggota?t=' + Date.now()).then((r) => r.json()),
        fetch('/api/rkk?t=' + Date.now()).then((r) => r.json()),
        fetch('/api/spk?t=' + Date.now()).then((r) => r.json()),
        fetch('/api/master/kop-surat?t=' + Date.now()).then((r) => r.json()),
        fetch('/api/auth/me').then((r) => r.json()),
      ]);

      if (membersRes.success && membersRes.data) setMembers(membersRes.data);
      if (rkkRes.success && rkkRes.data) setRkkList(rkkRes.data);
      if (spkRes.success && spkRes.data) setSpkList(spkRes.data);
      if (kopRes.success && kopRes.data) setKop(kopRes.data);
      if (authRes.success && authRes.user) setUserSession(authRes.user);
    } catch (e) {
      toast.error('Gagal memuat data dokumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update bulk checklist when bulk profession changes
  useEffect(() => {
    const { items } = getCompetenciesByProfesi(bulkProfesi);
    setBulkChecklist(
      items.map((it) => ({
        no: it.no,
        kompetensi: it.kompetensi,
        dimintaM: true,
        dimintaDS: false,
        disetujuiM: true,
        disetujuiDS: false,
        ket: '',
      }))
    );

    // Pre-select members of this profession
    const matching = members.filter((m) => {
      const p1 = (m.profesi || '').toUpperCase().trim();
      const p2 = bulkProfesi.toUpperCase().trim();
      return p1.includes(p2) || p2.includes(p1);
    });
    setSelectedMemberIds(matching.map((m) => m.id));
  }, [bulkProfesi, members]);

  // Update single checklist when single profession changes
  useEffect(() => {
    const { items } = getCompetenciesByProfesi(singleProfesi);
    setSingleChecklist(
      items.map((it) => ({
        no: it.no,
        kompetensi: it.kompetensi,
        dimintaM: true,
        dimintaDS: false,
        disetujuiM: true,
        disetujuiDS: false,
        ket: '',
      }))
    );
  }, [singleProfesi]);

  // Handle single member selection
  const handleSelectMemberForSingle = (id: string) => {
    setSingleMemberId(id);
    const m = members.find((x) => x.id === id);
    if (!m) return;
    setSingleNama(m.namaLengkap);
    setSingleNip(m.nip || m.nomorAnggota || '');
    setSingleProfesi(m.profesi || 'ATLM');
    setSingleKualifikasi(m.pendidikan || '');
    setSingleAlumni(m.asalPendidikan || '');
    setSinglePelayanan(m.profesi || '');
  };

  // Helper for quick bulk actions
  const setAllBulkChecklist = (type: 'M' | 'DS' | 'RESET') => {
    setBulkChecklist((prev) =>
      prev.map((row) => ({
        ...row,
        dimintaM: type === 'M',
        dimintaDS: type === 'DS',
        disetujuiM: type === 'M',
        disetujuiDS: type === 'DS',
      }))
    );
  };

  // Members filtered for bulk profession
  const bulkCandidateMembers = useMemo(() => {
    const norm = bulkProfesi.toUpperCase().trim();
    return members.filter((m) => {
      const p = (m.profesi || '').toUpperCase().trim();
      return p.includes(norm) || norm.includes(p);
    });
  }, [bulkProfesi, members]);

  // Handle Submit Bulk Creation
  const handleSaveBulk = async () => {
    const targetMembers = members.filter((m) => selectedMemberIds.includes(m.id));
    if (targetMembers.length === 0) {
      toast.warning('Pilih minimal 1 nama anggota untuk diterbitkan RKK dan SPK-nya.');
      return;
    }

    setSubmitting(true);
    try {
      const rkkItems: RkkItem[] = [];
      const spkItems: SpkItem[] = [];

      targetMembers.forEach((m, idx) => {
        const rkkId = `RKK-${Date.now()}-${m.id}-${idx}`;
        const spkId = `SPK-${Date.now()}-${m.id}-${idx}`;
        const autoNo = String(2260 + idx + 1);
        const nomorSurat = bulkNomorSuratPattern.replace('[NO]', autoNo);

        const rkk: RkkItem = {
          id: rkkId,
          memberId: m.id,
          nama: m.namaLengkap,
          nip: m.nip || m.nomorAnggota || '',
          profesi: m.profesi || bulkProfesi,
          kualifikasi: m.pendidikan || '',
          alumni: m.asalPendidikan || '',
          checklistData: [...bulkChecklist],
          tanggal: bulkTanggal,
          namaPemohon: m.namaLengkap,
          namaAsesor: bulkNamaAsesor,
          nipAsesor: bulkNipAsesor,
          status: 'Disetujui',
        };

        const spk: SpkItem = {
          id: spkId,
          rkkId: rkkId,
          memberId: m.id,
          nomorSurat: nomorSurat,
          nama: m.namaLengkap,
          kualifikasi: m.pendidikan || m.profesi || bulkProfesi,
          profesi: m.profesi || bulkProfesi,
          pelayanan: m.profesi || bulkProfesi,
          masaBerlakuTahun: '3 (tiga) tahun',
          tanggalDitetapkan: bulkTanggal,
          tempatDitetapkan: 'TULUS AYU',
          namaDirektur: bulkNamaDirektur,
          pangkatDirektur: bulkPangkatDirektur,
          nipDirektur: bulkNipDirektur,
        };

        rkkItems.push(rkk);
        spkItems.push(spk);
      });

      // Save RKK
      await fetch('/api/rkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rkkItems),
      });

      // Save SPK
      await fetch('/api/spk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spkItems),
      });

      toast.success(
        `Sukses membuat ${rkkItems.length} dokumen RKK dan ${spkItems.length} dokumen SPK untuk profesi ${bulkProfesi}!`
      );
      loadAllData();
      setActiveTab('daftar');
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan dokumen masal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Submit Single Creation
  const handleSaveSingle = async () => {
    if (!singleNama) {
      toast.warning('Nama anggota wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const rkkId = `RKK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const spkId = `SPK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const rkk: RkkItem = {
        id: rkkId,
        memberId: singleMemberId,
        nama: singleNama,
        nip: singleNip,
        profesi: singleProfesi,
        kualifikasi: singleKualifikasi,
        alumni: singleAlumni,
        checklistData: singleChecklist,
        tanggal: bulkTanggal,
        namaPemohon: singleNama,
        namaAsesor: bulkNamaAsesor,
        nipAsesor: bulkNipAsesor,
        status: 'Disetujui',
      };

      const spk: SpkItem = {
        id: spkId,
        rkkId: rkkId,
        memberId: singleMemberId,
        nomorSurat: singleNomorSurat,
        nama: singleNama,
        gelar: singleGelar,
        kualifikasi: singleKualifikasi || singleProfesi,
        profesi: singleProfesi,
        pelayanan: singlePelayanan || singleProfesi,
        masaBerlakuTahun: '3 (tiga) tahun',
        tanggalDitetapkan: bulkTanggal,
        tempatDitetapkan: 'TULUS AYU',
        namaDirektur: bulkNamaDirektur,
        pangkatDirektur: bulkPangkatDirektur,
        nipDirektur: bulkNipDirektur,
      };

      await fetch('/api/rkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rkk),
      });

      await fetch('/api/spk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spk),
      });

      toast.success(`Dokumen RKK dan SPK atas nama ${singleNama} berhasil dibuat!`);
      loadAllData();
      setActiveTab('daftar');
    } catch (e) {
      toast.error('Gagal menyimpan dokumen.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteRkk = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokumen RKK ini?')) return;
    try {
      const res = await fetch(`/api/rkk?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j.success) {
        toast.success('Dokumen RKK dihapus.');
        loadAllData();
      }
    } catch (e) {
      toast.error('Gagal menghapus.');
    }
  };

  const handleDeleteSpk = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokumen SPK ini?')) return;
    try {
      const res = await fetch(`/api/spk?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j.success) {
        toast.success('Dokumen SPK dihapus.');
        loadAllData();
      }
    } catch (e) {
      toast.error('Gagal menghapus.');
    }
  };

  // Filtered List for Tab 1
  const filteredRkkList = useMemo(() => {
    let list = rkkList;
    if (userSession?.role === 'user' && userSession.memberId) {
      list = list.filter((r) => r.memberId === userSession.memberId || r.nama.toLowerCase() === userSession.nama.toLowerCase());
    }

    return list.filter((r) => {
      const matchP = filterProfesi === 'ALL' || r.profesi === filterProfesi;
      const q = searchQuery.toLowerCase();
      const matchQ = !q || r.nama.toLowerCase().includes(q) || (r.nip && r.nip.includes(q));
      return matchP && matchQ;
    });
  }, [rkkList, filterProfesi, searchQuery, userSession]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 tracking-tight">Dokumen RKK & SPK Tenaga Kesehatan</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Rincian Kewenangan Klinik (RKK) & Surat Penugasan Klinis (SPK) RSUD OKU TIMUR
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'daftar'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daftar Dokumen ({rkkList.length})
          </button>
          {userSession?.role !== 'user' && (
            <>
              <button
                onClick={() => setActiveTab('masal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'masal'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pengisian Ceklis Masal</span>
              </button>
              <button
                onClick={() => setActiveTab('baru')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'baru'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Individual</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR DOKUMEN RKK & SPK                                            */}
      {/* ========================================================================= */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Toolbar Search & Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama anggota, NIP..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterProfesi}
                  onChange={(e) => setFilterProfesi(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">
                    Semua Profesi
                  </option>
                  {Object.keys(RKK_COMPETENCY_MAP).map((k) => (
                    <option key={k} value={k} className="bg-slate-900">
                      {RKK_COMPETENCY_MAP[k].label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadAllData}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 w-10">No</th>
                    <th className="px-4 py-3.5">Nama Anggota & NIP</th>
                    <th className="px-4 py-3.5">Profesi</th>
                    <th className="px-4 py-3.5">Kualifikasi / Alumni</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5 text-center">Status RKK</th>
                    <th className="px-4 py-3.5 text-right">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredRkkList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500 italic">
                        Belum ada dokumen RKK yang dibuat. Silakan gunakan tab &quot;Pengisian Ceklis Masal&quot; atau
                        &quot;Buat Individual&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredRkkList.map((r, idx) => {
                      // Find matched SPK if any
                      const matchedSpk =
                        spkList.find((s) => s.rkkId === r.id || (s.memberId && s.memberId === r.memberId)) ||
                        spkList.find((s) => s.nama.toLowerCase() === r.nama.toLowerCase());

                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-100">{r.nama}</div>
                            <div className="text-[11px] text-slate-400 font-mono">NIP: {r.nip || '-'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {r.profesi}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <div>{r.kualifikasi || '-'}</div>
                            <div className="text-[11px] text-slate-400">{r.alumni || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{r.tanggal}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                              {r.status || 'Disetujui'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View RKK */}
                              <button
                                onClick={() => setPreviewRkk(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold"
                                title="Lihat & Cetak RKK"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>RKK</span>
                              </button>

                              {/* View SPK */}
                              {matchedSpk ? (
                                <button
                                  onClick={() => setPreviewSpk(matchedSpk)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold"
                                  title="Lihat & Cetak SPK"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>SPK</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const autoSpk: SpkItem = {
                                      id: `TEMP-${r.id}`,
                                      rkkId: r.id,
                                      memberId: r.memberId,
                                      nomorSurat: `445/ 2261 / RSUD / X / ${new Date().getFullYear()}`,
                                      nama: r.nama,
                                      kualifikasi: r.kualifikasi || r.profesi,
                                      profesi: r.profesi,
                                      pelayanan: r.profesi,
                                      masaBerlakuTahun: '3 (tiga) tahun',
                                      tanggalDitetapkan: r.tanggal,
                                      tempatDitetapkan: 'TULUS AYU',
                                      namaDirektur: bulkNamaDirektur,
                                      pangkatDirektur: bulkPangkatDirektur,
                                      nipDirektur: bulkNipDirektur,
                                    };
                                    setPreviewSpk(autoSpk);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold"
                                  title="Pratinjau SPK"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>SPK</span>
                                </button>
                              )}

                              {/* Delete RKK */}
                              {userSession?.role !== 'user' && (
                                <button
                                  onClick={() => handleDeleteRkk(r.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                  title="Hapus Dokumen RKK"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENGISIAN CEKLIS MASAL (BULK GENERATOR)                            */}
      {/* ========================================================================= */}
      {activeTab === 'masal' && (
        <div className="space-y-6">
          {/* Step 1 & 2: Profession & Member Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>Pilih Profesi & Anggota Sasaran Masal</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih profesi rumpun nakes untuk memuat butir kompetensi resmi secara otomatis.
                </p>
              </div>

              {/* Profession Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Rumpun Profesi:</span>
                <select
                  value={bulkProfesi}
                  onChange={(e) => setBulkProfesi(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                >
                  {Object.keys(RKK_COMPETENCY_MAP).map((key) => (
                    <option key={key} value={key} className="bg-slate-900 text-slate-200">
                      {RKK_COMPETENCY_MAP[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Members Checklist Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200">
                  Daftar Anggota Terdaftar (Profesi: {bulkProfesi}) — {selectedMemberIds.length} terpilih dari{' '}
                  {bulkCandidateMembers.length} orang:
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMemberIds(bulkCandidateMembers.map((m) => m.id))}
                    className="text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setSelectedMemberIds([])}
                    className="text-[11px] font-bold text-slate-400 hover:underline"
                  >
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              {bulkCandidateMembers.length === 0 ? (
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs text-slate-500 italic">
                  Tidak ditemukan anggota dengan profesi ini di database. Anda tetap dapat menambahkan anggota manual di
                  tab &quot;Buat Individual&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                  {bulkCandidateMembers.map((m) => {
                    const isChecked = selectedMemberIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedMemberIds((prev) => prev.filter((id) => id !== m.id));
                          } else {
                            setSelectedMemberIds((prev) => [...prev, m.id]);
                          }
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{m.namaLengkap}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            NIP: {m.nip || m.nomorAnggota || '-'} | {m.pendidikan || 'Nakes'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Fast Checklist Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>Pengaturan Ceklis RKK Masal ({RKK_COMPETENCY_MAP[bulkProfesi]?.label || bulkProfesi})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan tombol cepat untuk mencentang seluruh butir kompetensi sekaligus atau atur per butir.
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllBulkChecklist('M')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Centang Semua Mandiri (M)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllBulkChecklist('DS')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Centang Semua Supervisi (DS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAllBulkChecklist('RESET')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th rowSpan={2} className="px-3 py-2 w-8 text-center">
                      No
                    </th>
                    <th rowSpan={2} className="px-4 py-2">
                      Rincian Kewenangan Klinis (Kompetensi Baku)
                    </th>
                    <th colSpan={2} className="px-2 py-1 text-center bg-slate-900/60 border-l border-slate-800">
                      DIMINTA
                    </th>
                    <th colSpan={2} className="px-2 py-1 text-center bg-slate-900/60 border-l border-slate-800">
                      DISETUJUI
                    </th>
                    <th rowSpan={2} className="px-3 py-2 w-28 text-center border-l border-slate-800">
                      KET
                    </th>
                  </tr>
                  <tr className="bg-slate-900 text-slate-400 text-[10px]">
                    <th className="px-2 py-1 text-center w-12 border-l border-slate-800">M</th>
                    <th className="px-2 py-1 text-center w-12">DS</th>
                    <th className="px-2 py-1 text-center w-12 border-l border-slate-800">M</th>
                    <th className="px-2 py-1 text-center w-12">DS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {bulkChecklist.map((row, idx) => (
                    <tr key={row.no} className="hover:bg-slate-900/40 transition">
                      <td className="px-3 py-2.5 text-center text-slate-400">{row.no}</td>
                      <td className="px-4 py-2.5 font-medium">{row.kompetensi}</td>

                      {/* Diminta M */}
                      <td className="px-2 py-2.5 text-center border-l border-slate-800">
                        <input
                          type="checkbox"
                          checked={row.dimintaM}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setBulkChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, dimintaM: val, dimintaDS: val ? false : r.dimintaDS } : r))
                            );
                          }}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </td>

                      {/* Diminta DS */}
                      <td className="px-2 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.dimintaDS}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setBulkChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, dimintaDS: val, dimintaM: val ? false : r.dimintaM } : r))
                            );
                          }}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </td>

                      {/* Disetujui M */}
                      <td className="px-2 py-2.5 text-center border-l border-slate-800">
                        <input
                          type="checkbox"
                          checked={row.disetujuiM}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setBulkChecklist((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, disetujuiM: val, disetujuiDS: val ? false : r.disetujuiDS } : r
                              )
                            );
                          }}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </td>

                      {/* Disetujui DS */}
                      <td className="px-2 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.disetujuiDS}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setBulkChecklist((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, disetujuiDS: val, disetujuiM: val ? false : r.disetujuiM } : r
                              )
                            );
                          }}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </td>

                      {/* KET */}
                      <td className="px-2 py-2 text-center border-l border-slate-800">
                        <input
                          type="text"
                          value={row.ket || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, ket: val } : r))
                            );
                          }}
                          placeholder="-"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-[11px] text-slate-300 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 4: Signing Parameters (Asesor & Direktur) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                3
              </span>
              <span>Parameter Penandatangan & Penomoran Dokumen Masal</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tanggal Dokumen (RKK & SPK):</label>
                <input
                  type="text"
                  value={bulkTanggal}
                  onChange={(e) => setBulkTanggal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nama Asesor Kredensial:</label>
                <input
                  type="text"
                  value={bulkNamaAsesor}
                  onChange={(e) => setBulkNamaAsesor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">NIP Asesor (Opsional):</label>
                <input
                  type="text"
                  value={bulkNipAsesor}
                  onChange={(e) => setBulkNipAsesor(e.target.value)}
                  placeholder="1980... atau kosong"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nama Direktur RSUD OKU Timur:</label>
                <input
                  type="text"
                  value={bulkNamaDirektur}
                  onChange={(e) => setBulkNamaDirektur(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Pangkat / Golongan Direktur:</label>
                <input
                  type="text"
                  value={bulkPangkatDirektur}
                  onChange={(e) => setBulkPangkatDirektur(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">NIP Direktur:</label>
                <input
                  type="text"
                  value={bulkNipDirektur}
                  onChange={(e) => setBulkNipDirektur(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-slate-400 font-semibold mb-1">
                  Format Pola Nomor Surat SPK ([NO] akan otomatis berurutan):
                </label>
                <input
                  type="text"
                  value={bulkNomorSuratPattern}
                  onChange={(e) => setBulkNomorSuratPattern(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Submit Bulk Button */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveBulk}
                disabled={submitting || selectedMemberIds.length === 0}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center gap-2"
              >
                <span>Terbitkan RKK & SPK untuk {selectedMemberIds.length} Anggota</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUAT DOKUMEN INDIVIDUAL                                             */}
      {/* ========================================================================= */}
      {activeTab === 'baru' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-100">Buat Dokumen RKK & SPK Individual</h2>
            <p className="text-xs text-slate-400 mt-1">
              Pilih anggota dari database atau isi manual untuk membuat satu set dokumen RKK & SPK resmi.
            </p>
          </div>

          {/* Member Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Pilih dari Data Anggota Terdaftar:</label>
              <select
                value={singleMemberId}
                onChange={(e) => handleSelectMemberForSingle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="">-- Pilih Anggota (Contoh: Muhammad Didik Wahyudi) --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.namaLengkap} - {m.profesi} (NIP: {m.nip || m.nomorAnggota || '-'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Nama Lengkap & Gelar:</label>
              <input
                type="text"
                value={singleNama}
                onChange={(e) => setSingleNama(e.target.value)}
                placeholder="Muhammad Didik Wahyudi, A.Md.AK"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Rumpun Profesi:</label>
              <select
                value={singleProfesi}
                onChange={(e) => setSingleProfesi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(RKK_COMPETENCY_MAP).map((k) => (
                  <option key={k} value={k}>
                    {RKK_COMPETENCY_MAP[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">NIP / Nomor Anggota:</label>
              <input
                type="text"
                value={singleNip}
                onChange={(e) => setSingleNip(e.target.value)}
                placeholder="1984... atau 0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Kualifikasi / Pendidikan:</label>
              <input
                type="text"
                value={singleKualifikasi}
                onChange={(e) => setSingleKualifikasi(e.target.value)}
                placeholder="D-III Analis Kesehatan / Radiografer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Alumni / Universitas:</label>
              <input
                type="text"
                value={singleAlumni}
                onChange={(e) => setSingleAlumni(e.target.value)}
                placeholder="Poltekkes Kemenkes Palembang"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-bold mb-1.5">Nomor Keputusan Direktur SPK:</label>
              <input
                type="text"
                value={singleNomorSurat}
                onChange={(e) => setSingleNomorSurat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Competency Checklist Table for Single */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200">
                Tabel Ceklis Kewenangan Klinis ({RKK_COMPETENCY_MAP[singleProfesi]?.label || singleProfesi}):
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSingleChecklist((prev) =>
                      prev.map((r) => ({ ...r, dimintaM: true, dimintaDS: false, disetujuiM: true, disetujuiDS: false }))
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold"
                >
                  Centang Semua Mandiri (M)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th rowSpan={2} className="px-3 py-2 w-8 text-center">
                      No
                    </th>
                    <th rowSpan={2} className="px-4 py-2">
                      Rincian Kewenangan Klinis
                    </th>
                    <th colSpan={2} className="px-2 py-1 text-center border-l border-slate-800">
                      DIMINTA
                    </th>
                    <th colSpan={2} className="px-2 py-1 text-center border-l border-slate-800">
                      DISETUJUI
                    </th>
                    <th rowSpan={2} className="px-3 py-2 w-28 text-center border-l border-slate-800">
                      KET
                    </th>
                  </tr>
                  <tr className="bg-slate-900 text-slate-400 text-[10px]">
                    <th className="px-2 py-1 text-center w-12 border-l border-slate-800">M</th>
                    <th className="px-2 py-1 text-center w-12">DS</th>
                    <th className="px-2 py-1 text-center w-12 border-l border-slate-800">M</th>
                    <th className="px-2 py-1 text-center w-12">DS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {singleChecklist.map((row, idx) => (
                    <tr key={row.no} className="hover:bg-slate-900/40 transition">
                      <td className="px-3 py-2 text-center text-slate-400">{row.no}</td>
                      <td className="px-4 py-2 font-medium">{row.kompetensi}</td>

                      <td className="px-2 py-2 text-center border-l border-slate-800">
                        <input
                          type="checkbox"
                          checked={row.dimintaM}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSingleChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, dimintaM: val, dimintaDS: val ? false : r.dimintaDS } : r))
                            );
                          }}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.dimintaDS}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSingleChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, dimintaDS: val, dimintaM: val ? false : r.dimintaM } : r))
                            );
                          }}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-2 text-center border-l border-slate-800">
                        <input
                          type="checkbox"
                          checked={row.disetujuiM}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSingleChecklist((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, disetujuiM: val, disetujuiDS: val ? false : r.disetujuiDS } : r
                              )
                            );
                          }}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.disetujuiDS}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSingleChecklist((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, disetujuiDS: val, disetujuiM: val ? false : r.disetujuiM } : r
                              )
                            );
                          }}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-2 text-center border-l border-slate-800">
                        <input
                          type="text"
                          value={row.ket || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSingleChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, ket: val } : r))
                            );
                          }}
                          placeholder="-"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-[11px] text-slate-300 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveSingle}
              disabled={submitting || !singleNama}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>Simpan & Terbitkan Dokumen RKK + SPK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Preview RKK */}
      {previewRkk && (
        <RkkDocumentPreview rkk={previewRkk} kop={kop} onClose={() => setPreviewRkk(null)} />
      )}

      {/* Modal Preview SPK */}
      {previewSpk && (
        <SpkDocumentPreview spk={previewSpk} kop={kop} onClose={() => setPreviewSpk(null)} />
      )}
    </div>
  );
}
