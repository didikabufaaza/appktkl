'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Edit3,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { NakesMember, RkkItem, SpkItem, RkkChecklistRow, KopSuratData, UserSession } from '@/types/nakes';
import { getCompetenciesByProfesi, RKK_COMPETENCY_MAP } from '@/lib/rkkCompetencies';
import { RkkDocumentPreview, getKesimpulanRkk } from '@/components/rkk-spk/RkkDocumentPreview';
import { SpkDocumentPreview } from '@/components/rkk-spk/SpkDocumentPreview';
import { BulkDownloadModal } from '@/components/rkk-spk/BulkDownloadModal';

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
  const [previewRkkRekomendasi, setPreviewRkkRekomendasi] = useState<{ rkk: RkkItem; spk: SpkItem | null } | null>(null);
  const [previewSpk, setPreviewSpk] = useState<SpkItem | null>(null);

  // Edit Modal State
  const [editingRkk, setEditingRkk] = useState<RkkItem | null>(null);
  const [editingSpk, setEditingSpk] = useState<SpkItem | null>(null);
  const [editNewCompetencyText, setEditNewCompetencyText] = useState('');

  // Bulk Download/Print Modal State per Profession
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Bulk Selection for Tab 1 (Daftar Dokumen)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Filters for Tab 1 (Daftar)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfesi, setFilterProfesi] = useState('ALL');

  // Master professions list loaded from server
  const [masterProfessions, setMasterProfessions] = useState<string[]>([]);

  // ==========================================
  // Form States for Bulk Generator (Tab 2)
  // ==========================================
  const [bulkProfesi, setBulkProfesi] = useState('ATLM');
  const [bulkProfesiSearchTerm, setBulkProfesiSearchTerm] = useState('');
  const [isBulkProfesiDropdownOpen, setIsBulkProfesiDropdownOpen] = useState(false);
  const bulkProfesiDropdownRef = useRef<HTMLDivElement>(null);

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
  const [singleProfesiSearchTerm, setSingleProfesiSearchTerm] = useState('');
  const [isSingleProfesiDropdownOpen, setIsSingleProfesiDropdownOpen] = useState(false);
  const singleProfesiDropdownRef = useRef<HTMLDivElement>(null);

  const [singleKualifikasi, setSingleKualifikasi] = useState('');
  const [singleAlumni, setSingleAlumni] = useState('');
  const [singleGelar, setSingleGelar] = useState('');
  const [singlePelayanan, setSinglePelayanan] = useState('');
  const [singleTanggal, setSingleTanggal] = useState(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [singleChecklist, setSingleChecklist] = useState<RkkChecklistRow[]>([]);
  const [singleNomorSurat, setSingleNomorSurat] = useState(
    `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`
  );
  const [customProfesiInput, setCustomProfesiInput] = useState('');
  const [newCompetencyItemText, setNewCompetencyItemText] = useState('');

  // Edit Single Competency Item Modal States for Tab 3
  const [editingSingleRowIdx, setEditingSingleRowIdx] = useState<number | null>(null);
  const [editingSingleRowText, setEditingSingleRowText] = useState('');

  // Searchable Member Picker States for Tab 3
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  function toRomanMonth(m: number): string {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romans[m - 1] || 'X';
  }

  // Load initial data with client-side localStorage fallback
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch server data
      const [membersRes, rkkRes, spkRes, kopRes, authRes, masterProfRes] = await Promise.all([
        fetch('/api/anggota?t=' + Date.now()).then((r) => r.json()).catch(() => null),
        fetch('/api/rkk?t=' + Date.now()).then((r) => r.json()).catch(() => null),
        fetch('/api/spk?t=' + Date.now()).then((r) => r.json()).catch(() => null),
        fetch('/api/master/kop-surat?t=' + Date.now()).then((r) => r.json()).catch(() => null),
        fetch('/api/auth/me').then((r) => r.json()).catch(() => null),
        fetch('/api/master?type=profesi&t=' + Date.now()).then((r) => r.json()).catch(() => null),
      ]);

      if (membersRes?.success && membersRes.data) setMembers(membersRes.data);
      if (authRes?.success && authRes.user) setUserSession(authRes.user);
      if (masterProfRes?.success && Array.isArray(masterProfRes.data)) {
        setMasterProfessions(
          masterProfRes.data
            .map((p: any) => String(p.nama || '').trim().toUpperCase())
            .filter(Boolean)
        );
      }

      // Kop Surat: merge server response and localStorage
      const localKopRaw = typeof window !== 'undefined' ? localStorage.getItem('appktkl_kop_surat') : null;
      let loadedKop = kopRes?.success && kopRes.data ? kopRes.data : null;
      if (localKopRaw) {
        try {
          const parsedKop = JSON.parse(localKopRaw);
          loadedKop = {
            ...(loadedKop || {}),
            ...parsedKop,
            logoKiriUrl: parsedKop.logoKiriUrl || loadedKop?.logoKiriUrl,
            logoKananUrl: parsedKop.logoKananUrl || loadedKop?.logoKananUrl,
          };
        } catch (e) {}
      }
      if (loadedKop) {
        setKop(loadedKop);
        if (typeof window !== 'undefined') {
          localStorage.setItem('appktkl_kop_surat', JSON.stringify(loadedKop));
        }
      }

      // 2. Read local client cache to ensure no documents ever vanish
      const localRkkRaw = typeof window !== 'undefined' ? localStorage.getItem('appktkl_rkk_cache') : null;
      const localSpkRaw = typeof window !== 'undefined' ? localStorage.getItem('appktkl_spk_cache') : null;
      const cachedRkk: RkkItem[] = localRkkRaw ? JSON.parse(localRkkRaw) : [];
      const cachedSpk: SpkItem[] = localSpkRaw ? JSON.parse(localSpkRaw) : [];

      // Read deleted IDs to suppress
      const deletedRkkRaw = typeof window !== 'undefined' ? localStorage.getItem('appktkl_deleted_rkk') : null;
      const deletedRkkSet = new Set(deletedRkkRaw ? JSON.parse(deletedRkkRaw) : []);

      // Merge RKK: local cached items + server items (newer updatedAt wins, never lose local edits)
      const rkkMap = new Map<string, RkkItem>();
      cachedRkk.forEach((item: RkkItem) => {
        if (!deletedRkkSet.has(item.id)) rkkMap.set(item.id, item);
      });
      if (rkkRes?.success && Array.isArray(rkkRes.data)) {
        rkkRes.data.forEach((serverItem: RkkItem) => {
          if (deletedRkkSet.has(serverItem.id)) return;
          const localItem = rkkMap.get(serverItem.id);
          if (!localItem) {
            rkkMap.set(serverItem.id, serverItem);
          } else {
            const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
            const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
            if (serverTime > localTime) {
              rkkMap.set(serverItem.id, serverItem);
            }
          }
        });
      }

      const mergedRkk = Array.from(rkkMap.values());
      setRkkList(mergedRkk);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_rkk_cache', JSON.stringify(mergedRkk));
      }

      // Merge SPK: local cached items + server items (newer updatedAt wins, never lose local edits)
      const spkMap = new Map<string, SpkItem>();
      cachedSpk.forEach((item: SpkItem) => {
        if (!deletedRkkSet.has(item.rkkId) && !deletedRkkSet.has(item.id)) {
          spkMap.set(item.id, item);
        }
      });
      if (spkRes?.success && Array.isArray(spkRes.data)) {
        spkRes.data.forEach((serverItem: SpkItem) => {
          if (deletedRkkSet.has(serverItem.rkkId) || deletedRkkSet.has(serverItem.id)) return;
          const localItem = spkMap.get(serverItem.id);
          if (!localItem) {
            spkMap.set(serverItem.id, serverItem);
          } else {
            const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
            const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
            if (serverTime > localTime) {
              spkMap.set(serverItem.id, serverItem);
            }
          }
        });
      }

      const mergedSpk = Array.from(spkMap.values());
      setSpkList(mergedSpk);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_spk_cache', JSON.stringify(mergedSpk));
      }
    } catch (e) {
      toast.error('Gagal memuat data dokumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(target)) {
        setIsMemberDropdownOpen(false);
      }
      if (bulkProfesiDropdownRef.current && !bulkProfesiDropdownRef.current.contains(target)) {
        setIsBulkProfesiDropdownOpen(false);
      }
      if (singleProfesiDropdownRef.current && !singleProfesiDropdownRef.current.contains(target)) {
        setIsSingleProfesiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // List of all distinct professions available across the entire database
  // (predefined standard map, members table, master table, and existing RKK/SPK)
  const availableProfessionsList = useMemo(() => {
    const set = new Set<string>();
    // 1. Predefined competency maps
    Object.keys(RKK_COMPETENCY_MAP).forEach((k) => set.add(k.trim().toUpperCase()));
    // 2. All registered members
    members.forEach((m) => {
      if (m.profesi && m.profesi.trim()) {
        set.add(m.profesi.trim().toUpperCase());
      }
    });
    // 3. Existing RKK documents
    rkkList.forEach((r) => {
      if (r.profesi && r.profesi.trim()) {
        set.add(r.profesi.trim().toUpperCase());
      }
    });
    // 4. Existing SPK documents
    spkList.forEach((s) => {
      if (s.profesi && s.profesi.trim()) {
        set.add(s.profesi.trim().toUpperCase());
      }
    });
    // 5. Master professions from database
    masterProfessions.forEach((p) => {
      if (p && p.trim()) {
        set.add(p.trim().toUpperCase());
      }
    });

    return Array.from(set)
      .filter(Boolean)
      .sort()
      .map((code) => ({
        code,
        label: RKK_COMPETENCY_MAP[code]?.label || code,
      }));
  }, [members, rkkList, spkList, masterProfessions]);

  // Candidate professions filtered by search term for Tab 2 (Pengisian Ceklis Masal)
  const candidateProfessionsForBulk = useMemo(() => {
    if (!bulkProfesiSearchTerm.trim()) return availableProfessionsList;
    const q = bulkProfesiSearchTerm.toLowerCase();
    return availableProfessionsList.filter(
      (p) => p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [availableProfessionsList, bulkProfesiSearchTerm]);

  // Candidate professions filtered by search term for Tab 3 (Tambah RKK Baru)
  const candidateProfessionsForSingle = useMemo(() => {
    if (!singleProfesiSearchTerm.trim()) return availableProfessionsList;
    const q = singleProfesiSearchTerm.toLowerCase();
    return availableProfessionsList.filter(
      (p) => p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [availableProfessionsList, singleProfesiSearchTerm]);

  // Update single checklist when single profession changes
  useEffect(() => {
    if (singleProfesi === 'LAINNYA') {
      if (singleChecklist.length === 0) {
        setSingleChecklist([
          {
            no: 1,
            kompetensi: 'Melakukan tindakan pelayanan profesi sesuai standar kompetensi dan SPO',
            dimintaM: true,
            dimintaDS: false,
            disetujuiM: true,
            disetujuiDS: false,
            ket: '',
          },
        ]);
      }
      return;
    }
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

  // Add custom competency row manually
  const handleAddCustomCompetencyRow = () => {
    if (!newCompetencyItemText.trim()) return;
    const newRow: RkkChecklistRow = {
      no: singleChecklist.length + 1,
      kompetensi: newCompetencyItemText.trim(),
      dimintaM: true,
      dimintaDS: false,
      disetujuiM: true,
      disetujuiDS: false,
      ket: '',
    };
    setSingleChecklist((prev) => [...prev, newRow]);
    setNewCompetencyItemText('');
    toast.success('Butir kompetensi berhasil ditambahkan.');
  };

  // Delete a single row from checklist
  const handleDeleteSingleRow = (indexToDelete: number) => {
    setSingleChecklist((prev) =>
      prev
        .filter((_, idx) => idx !== indexToDelete)
        .map((row, idx) => ({ ...row, no: idx + 1 }))
    );
  };

  // Filtered members for Searchable Combobox in Tab 3
  const candidateMembersForSingle = useMemo(() => {
    if (!memberSearchTerm.trim()) return members;
    const q = memberSearchTerm.toLowerCase();
    return members.filter((m) => {
      const matchName = m.namaLengkap.toLowerCase().includes(q);
      const matchNip = (m.nip || m.nomorAnggota || '').toLowerCase().includes(q);
      const matchProf = (m.profesi || '').toLowerCase().includes(q);
      return matchName || matchNip || matchProf;
    });
  }, [members, memberSearchTerm]);

  // Handle single member selection
  const handleSelectMemberForSingle = (m: NakesMember) => {
    setSingleMemberId(m.id);
    setSingleNama(m.namaLengkap);
    setSingleNip(m.nip || m.nomorAnggota || '');
    const prof = (m.profesi || 'ATLM').trim();
    setSingleProfesi(prof);
    setSingleProfesiSearchTerm(RKK_COMPETENCY_MAP[prof]?.label || prof);
    setSingleKualifikasi(m.pendidikan || '');
    setSingleAlumni(m.asalPendidikan || '');
    setSinglePelayanan(m.profesi || '');
    setMemberSearchTerm(m.namaLengkap);
    setIsMemberDropdownOpen(false);
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

      // Update state and localStorage immediately
      const newRkkList = [...rkkItems, ...rkkList];
      const newSpkList = [...spkItems, ...spkList];
      setRkkList(newRkkList);
      setSpkList(newSpkList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_rkk_cache', JSON.stringify(newRkkList));
        localStorage.setItem('appktkl_spk_cache', JSON.stringify(newSpkList));
      }

      // Save to server
      fetch('/api/rkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rkkItems),
      }).catch(() => {});

      fetch('/api/spk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spkItems),
      }).catch(() => {});

      toast.success(
        `Sukses membuat ${rkkItems.length} dokumen RKK dan ${spkItems.length} dokumen SPK untuk profesi ${bulkProfesi}!`
      );
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

    const finalProfesi =
      (singleProfesi === 'LAINNYA' ? customProfesiInput.trim() : singleProfesi) || 'Nakes';

    setSubmitting(true);
    try {
      const rkkId = `RKK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const spkId = `SPK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const rkk: RkkItem = {
        id: rkkId,
        memberId: singleMemberId,
        nama: singleNama,
        nip: singleNip,
        profesi: finalProfesi,
        kualifikasi: singleKualifikasi,
        alumni: singleAlumni,
        checklistData: singleChecklist,
        tanggal: singleTanggal,
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
        kualifikasi: singleKualifikasi || finalProfesi,
        profesi: finalProfesi,
        pelayanan: singlePelayanan || finalProfesi,
        masaBerlakuTahun: '3 (tiga) tahun',
        tanggalDitetapkan: singleTanggal,
        tempatDitetapkan: 'TULUS AYU',
        namaDirektur: bulkNamaDirektur,
        pangkatDirektur: bulkPangkatDirektur,
        nipDirektur: bulkNipDirektur,
      };

      // Update state and localStorage immediately
      const newRkkList = [rkk, ...rkkList];
      const newSpkList = [spk, ...spkList];
      setRkkList(newRkkList);
      setSpkList(newSpkList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_rkk_cache', JSON.stringify(newRkkList));
        localStorage.setItem('appktkl_spk_cache', JSON.stringify(newSpkList));
      }

      fetch('/api/rkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rkk),
      }).catch(() => {});

      fetch('/api/spk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spk),
      }).catch(() => {});

      toast.success(`Dokumen RKK dan SPK atas nama ${singleNama} berhasil dibuat!`);
      setActiveTab('daftar');
    } catch (e) {
      toast.error('Gagal menyimpan dokumen.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (r: RkkItem) => {
    setEditingRkk(JSON.parse(JSON.stringify(r)));
    setEditNewCompetencyText('');

    const matched =
      spkList.find((s) => s.rkkId === r.id || (s.memberId && s.memberId === r.memberId)) ||
      spkList.find((s) => s.nama.toLowerCase() === r.nama.toLowerCase());

    const defaultDirektur = bulkNamaDirektur || 'dr. Sugihartono, M.Sc.';
    const defaultPangkat = bulkPangkatDirektur || 'Penata TK. I/ III d';
    const defaultNipDir = bulkNipDirektur || '197606302005011003';
    const defaultTempat = 'TULUS AYU';

    if (matched) {
      setEditingSpk({
        ...JSON.parse(JSON.stringify(matched)),
        nama: matched.nama || r.nama,
        profesi: matched.profesi || r.profesi,
        kualifikasi: matched.kualifikasi || r.kualifikasi || r.profesi,
        pelayanan: matched.pelayanan || r.profesi,
        nomorSurat: matched.nomorSurat || '',
        tanggalDitetapkan: matched.tanggalDitetapkan || r.tanggal || bulkTanggal,
        tempatDitetapkan: matched.tempatDitetapkan || defaultTempat,
        namaDirektur: matched.namaDirektur || defaultDirektur,
        pangkatDirektur: matched.pangkatDirektur || defaultPangkat,
        nipDirektur: matched.nipDirektur || defaultNipDir,
        masaBerlakuTahun: matched.masaBerlakuTahun || '3 (tiga) tahun',
      });
    } else {
      setEditingSpk({
        id: `SPK-${Date.now()}-${r.id}`,
        rkkId: r.id,
        memberId: r.memberId,
        nomorSurat: `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`,
        nama: r.nama,
        kualifikasi: r.kualifikasi || r.profesi,
        profesi: r.profesi,
        pelayanan: r.profesi,
        masaBerlakuTahun: '3 (tiga) tahun',
        tanggalDitetapkan: r.tanggal || bulkTanggal,
        tempatDitetapkan: defaultTempat,
        namaDirektur: defaultDirektur,
        pangkatDirektur: defaultPangkat,
        nipDirektur: defaultNipDir,
      });
    }
  };

  // Add new competency row in Edit Modal
  const handleAddEditCompetencyRow = () => {
    if (!editingRkk || !editNewCompetencyText.trim()) return;
    const newRow: RkkChecklistRow = {
      no: editingRkk.checklistData.length + 1,
      kompetensi: editNewCompetencyText.trim(),
      dimintaM: true,
      dimintaDS: false,
      disetujuiM: true,
      disetujuiDS: false,
      ket: '',
    };
    setEditingRkk({
      ...editingRkk,
      checklistData: [...editingRkk.checklistData, newRow],
    });
    setEditNewCompetencyText('');
    toast.success('Butir kompetensi berhasil ditambahkan ke dokumen ini.');
  };

  // Delete competency row in Edit Modal
  const handleDeleteEditCompetencyRow = (indexToDelete: number) => {
    if (!editingRkk) return;
    const updated = editingRkk.checklistData
      .filter((_, idx) => idx !== indexToDelete)
      .map((row, idx) => ({ ...row, no: idx + 1 }));
    setEditingRkk({
      ...editingRkk,
      checklistData: updated,
    });
  };

  // Save Edit Changes
  const handleSaveEdit = async () => {
    if (!editingRkk) return;
    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const updatedRkk: RkkItem = {
        ...editingRkk,
        namaPemohon: editingRkk.namaPemohon || editingRkk.nama,
        updatedAt: nowIso,
      };

      // Synchronize changes to SPK
      const updatedSpk: SpkItem | null = editingSpk
        ? {
            ...editingSpk,
            nama: updatedRkk.nama,
            profesi: updatedRkk.profesi,
            kualifikasi: updatedRkk.kualifikasi || updatedRkk.profesi,
            pelayanan: editingSpk.pelayanan || updatedRkk.profesi,
            tanggalDitetapkan: editingSpk.tanggalDitetapkan || updatedRkk.tanggal,
            tempatDitetapkan: editingSpk.tempatDitetapkan || 'TULUS AYU',
            nomorSurat: editingSpk.nomorSurat || '',
            namaDirektur: editingSpk.namaDirektur || '',
            pangkatDirektur: editingSpk.pangkatDirektur || '',
            nipDirektur: editingSpk.nipDirektur || '',
            masaBerlakuTahun: editingSpk.masaBerlakuTahun || '3 (tiga) tahun',
            updatedAt: nowIso,
          }
        : null;

      // 1. Update state and localStorage immediately
      const newRkkList = rkkList.map((item) => (item.id === updatedRkk.id ? updatedRkk : item));
      setRkkList(newRkkList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_rkk_cache', JSON.stringify(newRkkList));
      }

      if (updatedSpk) {
        const spkIdx = spkList.findIndex(
          (s) => s.id === updatedSpk.id || (s.rkkId && s.rkkId === updatedSpk.rkkId)
        );
        let newSpkList: SpkItem[];
        if (spkIdx >= 0) {
          newSpkList = spkList.map((s, idx) => (idx === spkIdx ? updatedSpk : s));
        } else {
          newSpkList = [updatedSpk, ...spkList];
        }
        setSpkList(newSpkList);
        if (typeof window !== 'undefined') {
          localStorage.setItem('appktkl_spk_cache', JSON.stringify(newSpkList));
        }
      }

      // 2. Persist to server API
      const rkkPromise = fetch('/api/rkk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRkk),
      });

      const spkPromise = updatedSpk
        ? fetch('/api/spk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSpk),
          })
        : Promise.resolve();

      await Promise.all([rkkPromise, spkPromise]);

      toast.success(`Perubahan dokumen RKK & SPK atas nama ${updatedRkk.nama} berhasil disimpan!`);
      setEditingRkk(null);
      setEditingSpk(null);
    } catch (e) {
      toast.error('Gagal menyimpan perubahan dokumen.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Document (Both RKK and SPK)
  const handleDeleteDocument = async (rkkId: string, spkId?: string) => {
    if (!confirm('Yakin ingin menghapus dokumen RKK dan SPK ini secara permanen?')) return;
    try {
      // 1. Remove from state immediately
      const newRkkList = rkkList.filter((r) => r.id !== rkkId);
      const newSpkList = spkList.filter((s) => s.id !== spkId && s.rkkId !== rkkId);
      setRkkList(newRkkList);
      setSpkList(newSpkList);

      // 2. Remove from local client cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_rkk_cache', JSON.stringify(newRkkList));
        localStorage.setItem('appktkl_spk_cache', JSON.stringify(newSpkList));

        // Add to deleted set so it never resurrects
        const deletedRaw = localStorage.getItem('appktkl_deleted_rkk');
        const deletedArr = deletedRaw ? JSON.parse(deletedRaw) : [];
        deletedArr.push(rkkId);
        if (spkId) deletedArr.push(spkId);
        localStorage.setItem('appktkl_deleted_rkk', JSON.stringify(deletedArr));
      }

      // 3. Delete from server
      fetch(`/api/rkk?id=${encodeURIComponent(rkkId)}`, { method: 'DELETE' }).catch(() => {});
      if (spkId) {
        fetch(`/api/spk?id=${encodeURIComponent(spkId)}`, { method: 'DELETE' }).catch(() => {});
      }

      // Also remove from selection if selected
      setSelectedDocIds((prev) => prev.filter((id) => id !== rkkId));

      toast.success('Dokumen RKK & SPK berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus dokumen.');
    }
  };

  // Toggle selection for a single document
  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle selection for all currently filtered documents
  const handleToggleSelectAll = () => {
    const displayedIds = filteredRkkList.map((r) => r.id);
    const allSelected =
      displayedIds.length > 0 && displayedIds.every((id) => selectedDocIds.includes(id));
    if (allSelected) {
      setSelectedDocIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      setSelectedDocIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  // Delete Selected Documents in Bulk (Both RKK, RKK Rekomendasi, and SPK)
  const handleDeleteBulkDocuments = async () => {
    if (selectedDocIds.length === 0) return;
    if (
      !confirm(
        `Yakin ingin menghapus ${selectedDocIds.length} data dokumen RKK, RKK REKOMENDASI DAN SPK yang dipilih secara masal?`
      )
    ) {
      return;
    }

    try {
      const idsToDelete = new Set(selectedDocIds);
      const newRkkList = rkkList.filter((r) => !idsToDelete.has(r.id));
      const newSpkList = spkList.filter(
        (s) => !idsToDelete.has(s.id) && (!s.rkkId || !idsToDelete.has(s.rkkId))
      );
      setRkkList(newRkkList);
      setSpkList(newSpkList);

      if (typeof window !== 'undefined') {
        localStorage.setItem('appktkl_rkk_cache', JSON.stringify(newRkkList));
        localStorage.setItem('appktkl_spk_cache', JSON.stringify(newSpkList));

        const deletedRaw = localStorage.getItem('appktkl_deleted_rkk');
        const deletedArr: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        selectedDocIds.forEach((id) => {
          deletedArr.push(id);
          const matched = spkList.find((s) => s.rkkId === id || s.id === id);
          if (matched && !deletedArr.includes(matched.id)) {
            deletedArr.push(matched.id);
          }
        });
        localStorage.setItem('appktkl_deleted_rkk', JSON.stringify(deletedArr));
      }

      await Promise.all(
        selectedDocIds.map(async (rkkId) => {
          const matched = spkList.find((s) => s.rkkId === rkkId || s.id === rkkId);
          await fetch(`/api/rkk?id=${encodeURIComponent(rkkId)}`, { method: 'DELETE' }).catch(
            () => {}
          );
          if (matched) {
            await fetch(`/api/spk?id=${encodeURIComponent(matched.id)}`, {
              method: 'DELETE',
            }).catch(() => {});
          }
        })
      );

      toast.success(
        `${selectedDocIds.length} dokumen RKK, RKK Rekomendasi & SPK berhasil dihapus secara masal.`
      );
      setSelectedDocIds([]);
    } catch (e) {
      toast.error('Gagal menghapus dokumen.');
    }
  };

  // Filtered List for Tab 1
  const filteredRkkList = useMemo(() => {
    let list = rkkList;
    if (userSession?.role === 'user' && userSession.memberId) {
      list = list.filter(
        (r) =>
          r.memberId === userSession.memberId ||
          r.nama.toLowerCase() === (userSession.nama || '').toLowerCase()
      );
    }

    return list.filter((r) => {
      const matchP =
        filterProfesi === 'ALL' ||
        r.profesi.toUpperCase().includes(filterProfesi.toUpperCase()) ||
        filterProfesi.toUpperCase().includes(r.profesi.toUpperCase());
      const q = searchQuery.toLowerCase();
      const matchQ =
        !q ||
        r.nama.toLowerCase().includes(q) ||
        (r.nip && r.nip.includes(q)) ||
        (r.profesi && r.profesi.toLowerCase().includes(q));
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
                <span>Tambah RKK Baru</span>
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
          {/* Toolbar Search & Filter & Add Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama anggota, NIP, profesi..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Prominent Button to add new RKK directly */}
              {userSession?.role !== 'user' && (
                <button
                  onClick={() => {
                    setSingleMemberId('');
                    setSingleNama('');
                    setSingleNip('');
                    setSingleKualifikasi('');
                    setSingleAlumni('');
                    setMemberSearchTerm('');
                    setActiveTab('baru');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition shrink-0"
                  title="Tambah Dokumen RKK & SPK Baru untuk Semua Profesi"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah RKK Baru</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterProfesi}
                  onChange={(e) => setFilterProfesi(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="ALL" className="bg-slate-900">
                    Semua Profesi ({rkkList.length})
                  </option>
                  {availableProfessionsList.map(({ code, label }) => {
                    const count = rkkList.filter((r) => {
                      const p1 = (r.profesi || '').toUpperCase().trim();
                      const p2 = code.toUpperCase().trim();
                      return p1.includes(p2) || p2.includes(p1);
                    }).length;
                    return (
                      <option key={code} value={code} className="bg-slate-900">
                        {label} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Bulk Delete Button when items are checked */}
              {selectedDocIds.length > 0 && userSession?.role !== 'user' && (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl">
                  <span className="text-xs text-rose-300 font-bold whitespace-nowrap">
                    {selectedDocIds.length} dipilih
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteBulkDocuments}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/30 transition shrink-0"
                    title="Hapus masal dokumen RKK, RKK Rekomendasi & SPK terpilih"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedDocIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDocIds([])}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-1 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}

              {/* Tombol Cetak / Unduh Masal Dokumen per Profesi */}
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                disabled={filteredRkkList.length === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                title={`Cetak atau Unduh Masal Dokumen RKK, RKK Rekomendasi, dan SPK untuk profesi ${
                  filterProfesi === 'ALL' ? 'Semua Profesi' : filterProfesi
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <Download className="w-3.5 h-3.5" />
                <span>
                  {filterProfesi === 'ALL'
                    ? `Cetak/Unduh Masal (${filteredRkkList.length})`
                    : `Cetak/Unduh Masal: ${filterProfesi} (${filteredRkkList.length})`}
                </span>
              </button>

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

          {/* Desktop Table Container (Hidden on mobile) */}
          <div className="hidden sm:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    {userSession?.role !== 'user' && (
                      <th className="px-3 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredRkkList.length > 0 &&
                            filteredRkkList.every((r) => selectedDocIds.includes(r.id))
                          }
                          ref={(el) => {
                            if (el) {
                              const count = filteredRkkList.filter((r) =>
                                selectedDocIds.includes(r.id)
                              ).length;
                              el.indeterminate = count > 0 && count < filteredRkkList.length;
                            }
                          }}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          title="Pilih Semua Dokumen"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3.5 w-10">No</th>
                    <th className="px-4 py-3.5">Nama Anggota & NIP</th>
                    <th className="px-4 py-3.5">Profesi</th>
                    <th className="px-4 py-3.5">Kualifikasi / Alumni</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right min-w-[320px]">Aksi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredRkkList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={userSession?.role !== 'user' ? 8 : 7}
                        className="text-center py-12 text-slate-500 italic"
                      >
                        Belum ada dokumen RKK yang dibuat. Silakan gunakan tab &quot;Pengisian Ceklis Masal&quot; atau
                        &quot;Tambah RKK Baru&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredRkkList.map((r, idx) => {
                      const matchedSpk =
                        spkList.find((s) => s.rkkId === r.id || (s.memberId && s.memberId === r.memberId)) ||
                        spkList.find((s) => s.nama.toLowerCase() === r.nama.toLowerCase());

                      const isDocSelected = selectedDocIds.includes(r.id);

                      return (
                        <tr
                          key={r.id}
                          className={`transition ${
                            isDocSelected ? 'bg-emerald-500/15' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          {userSession?.role !== 'user' && (
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isDocSelected}
                                onChange={() => handleToggleSelectDoc(r.id)}
                                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                title={`Pilih dokumen ${r.nama}`}
                              />
                            </td>
                          )}
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
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View RKK */}
                              <button
                                onClick={() => setPreviewRkk(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
                                title="Lihat & Cetak RKK"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat & Cetak RKK</span>
                              </button>

                              {/* View RKK Rekomendasi */}
                              <button
                                onClick={() => {
                                  const spkForRekomendasi = matchedSpk || {
                                    id: `TEMP-${r.id}`,
                                    rkkId: r.id,
                                    memberId: r.memberId,
                                    nomorSurat: `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`,
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
                                  setPreviewRkkRekomendasi({ rkk: r, spk: spkForRekomendasi });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                                title="Lihat & Cetak RKK Rekomendasi"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>Lihat & Cetak RKK Rekomendasi</span>
                              </button>

                              {/* View SPK */}
                              {matchedSpk ? (
                                <button
                                  onClick={() => setPreviewSpk(matchedSpk)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                                  title="Pratinjau SPK"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Pratinjau SPK</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const autoSpk: SpkItem = {
                                      id: `TEMP-${r.id}`,
                                      rkkId: r.id,
                                      memberId: r.memberId,
                                      nomorSurat: `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`,
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                                  title="Pratinjau SPK"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Pratinjau SPK</span>
                                </button>
                              )}

                              {/* Edit Document */}
                              {userSession?.role !== 'user' && (
                                <button
                                  onClick={() => handleOpenEdit(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                                  title="Edit Dokumen RKK & SPK"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {/* Delete Document */}
                              {userSession?.role !== 'user' && (
                                <button
                                  onClick={() => handleDeleteDocument(r.id, matchedSpk?.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                  title="Hapus Dokumen RKK & SPK"
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

          {/* Mobile Card List View (Visible on mobile only: sm:hidden) */}
          <div className="block sm:hidden space-y-3">
            {filteredRkkList.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 italic text-xs">
                Belum ada dokumen RKK yang dibuat.
              </div>
            ) : (
              filteredRkkList.map((r, idx) => {
                const matchedSpk =
                  spkList.find((s) => s.rkkId === r.id || (s.memberId && s.memberId === r.memberId)) ||
                  spkList.find((s) => s.nama.toLowerCase() === r.nama.toLowerCase());

                const isDocSelected = selectedDocIds.includes(r.id);

                return (
                  <div
                    key={r.id}
                    className={`border rounded-2xl p-4 space-y-3 shadow-sm transition ${
                      isDocSelected
                        ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {userSession?.role !== 'user' && (
                          <input
                            type="checkbox"
                            checked={isDocSelected}
                            onChange={() => handleToggleSelectDoc(r.id)}
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0 mt-0.5"
                            title={`Pilih dokumen ${r.nama}`}
                          />
                        )}
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                          <h3 className="font-bold text-slate-100 text-sm">{r.nama}</h3>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIP: {r.nip || '-'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        {r.profesi}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Kualifikasi:</span>
                        <span className="font-medium text-slate-200">{r.kualifikasi || '-'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Alumni:</span>
                        <span className="font-medium text-slate-200">{r.alumni || '-'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Tanggal:</span>
                        <span className="font-mono text-slate-300">{r.tanggal}</span>
                      </div>
                    </div>

                    {/* Action Buttons Grid on Mobile */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setPreviewRkk(r)}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-teal-500/10 active:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat & Cetak RKK</span>
                      </button>

                      <button
                        onClick={() => {
                          const spkForRekomendasi = matchedSpk || {
                            id: `TEMP-${r.id}`,
                            rkkId: r.id,
                            memberId: r.memberId,
                            nomorSurat: `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`,
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
                          setPreviewRkkRekomendasi({ rkk: r, spk: spkForRekomendasi });
                        }}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>RKK Rekomendasi</span>
                      </button>

                      {matchedSpk ? (
                        <button
                          onClick={() => setPreviewSpk(matchedSpk)}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-500/10 active:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Pratinjau SPK</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const autoSpk: SpkItem = {
                              id: `TEMP-${r.id}`,
                              rkkId: r.id,
                              memberId: r.memberId,
                              nomorSurat: `445/ 2261 / RSUD / ${toRomanMonth(new Date().getMonth() + 1)} / ${new Date().getFullYear()}`,
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
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Pratinjau SPK</span>
                        </button>
                      )}

                      {userSession?.role !== 'user' && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-500/10 active:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Dokumen</span>
                          </button>

                          <button
                            onClick={() => handleDeleteDocument(r.id, matchedSpk?.id)}
                            className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 active:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Dokumen</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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

              {/* Profession Selector (Searchable with typing) */}
              <div className="relative w-full sm:w-80" ref={bulkProfesiDropdownRef}>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Rumpun Profesi (Ketik untuk Mencari):
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={
                      isBulkProfesiDropdownOpen
                        ? bulkProfesiSearchTerm
                        : RKK_COMPETENCY_MAP[bulkProfesi]?.label || bulkProfesi
                    }
                    onFocus={() => {
                      setBulkProfesiSearchTerm('');
                      setIsBulkProfesiDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      setBulkProfesiSearchTerm(e.target.value);
                      setIsBulkProfesiDropdownOpen(true);
                    }}
                    placeholder="Ketik profesi untuk mencari..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-emerald-400 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {isBulkProfesiDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-950 border border-slate-800 rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-slate-800/60">
                    {candidateProfessionsForBulk.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 space-y-2">
                        <p className="italic">
                          Tidak ditemukan profesi yang cocok dengan &quot;{bulkProfesiSearchTerm}&quot;
                        </p>
                        {bulkProfesiSearchTerm.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              const custom = bulkProfesiSearchTerm.trim().toUpperCase();
                              setBulkProfesi(custom);
                              setIsBulkProfesiDropdownOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs transition"
                          >
                            + Gunakan &quot;{bulkProfesiSearchTerm.trim().toUpperCase()}&quot; sebagai Profesi
                          </button>
                        )}
                      </div>
                    ) : (
                      candidateProfessionsForBulk.map((p) => {
                        const isSelected = bulkProfesi.toUpperCase() === p.code.toUpperCase();
                        return (
                          <div
                            key={p.code}
                            onClick={() => {
                              setBulkProfesi(p.code);
                              setBulkProfesiSearchTerm(p.label);
                              setIsBulkProfesiDropdownOpen(false);
                            }}
                            className={`px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between text-xs ${
                              isSelected ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'text-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-semibold">{p.label}</span>
                              {p.code !== p.label && (
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                  ({p.code})
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
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
              </div>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs min-w-[650px]">
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
                  {bulkChecklist.map((row, idx) => (
                    <tr key={row.no} className="hover:bg-slate-900/40 transition">
                      <td className="px-3 py-2 text-center text-slate-400">{row.no}</td>
                      <td className="px-4 py-2 font-medium">{row.kompetensi}</td>

                      {/* Diminta M */}
                      <td className="px-2 py-2 text-center border-l border-slate-800">
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
                      <td className="px-2 py-2 text-center">
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
                      <td className="px-2 py-2 text-center border-l border-slate-800">
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
                      <td className="px-2 py-2 text-center">
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

                      {/* Ket */}
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

            {/* Live Kesimpulan Preview */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-300">Kesimpulan Otomatis Dokumen RKK:</span>
              <p className="text-emerald-400 font-medium italic">
                &ldquo;{getKesimpulanRkk(bulkChecklist)}&rdquo;
              </p>
            </div>
          </div>

          {/* Step 4: Metadata Pengesahan & Direktur */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                3
              </span>
              <span>Pengaturan Tanggal, Asesor & Penandatangan SPK</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tanggal Dokumen:</label>
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
      {/* TAB 3: BUAT DOKUMEN INDIVIDUAL (DENGAN PENCARIAN NAMA DENGAN PENGETIKAN)  */}
      {/* ========================================================================= */}
      {activeTab === 'baru' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-100">Buat Dokumen RKK & SPK Individual</h2>
            <p className="text-xs text-slate-400 mt-1">
              Cari nama anggota terdaftar dengan mengetikkan namanya atau masukkan data secara mandiri.
            </p>
          </div>

          {/* Member Picker with Live Search Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Searchable Combobox for Members */}
            <div className="relative" ref={memberDropdownRef}>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>Pilih dari Data Anggota Terdaftar (Cari dengan Pengetikan):</span>
                {singleNama && (
                  <span className="text-[10px] text-emerald-400 font-normal">Anggota Terpilih</span>
                )}
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearchTerm}
                  onFocus={() => setIsMemberDropdownOpen(true)}
                  onChange={(e) => {
                    setMemberSearchTerm(e.target.value);
                    setIsMemberDropdownOpen(true);
                  }}
                  placeholder="Ketik nama anggota atau NIP untuk mencari..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-semibold"
                />
                {memberSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearchTerm('');
                      setSingleMemberId('');
                      setIsMemberDropdownOpen(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Results */}
              {isMemberDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-950 border border-slate-800 rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-slate-800/60">
                  {candidateMembersForSingle.length === 0 ? (
                    <div className="p-3.5 text-center text-xs text-slate-500 italic">
                      Tidak ada nama anggota yang cocok dengan &quot;{memberSearchTerm}&quot;
                    </div>
                  ) : (
                    candidateMembersForSingle.map((m) => {
                      const isSelected = singleMemberId === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMemberForSingle(m)}
                          className={`p-3 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between ${
                            isSelected ? 'bg-emerald-500/10' : ''
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-100">{m.namaLengkap}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              NIP: {m.nip || m.nomorAnggota || '-'} | {m.pendidikan || 'Nakes'}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {m.profesi}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
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

            {/* Searchable Combobox for Tab 3 Profession */}
            <div className="relative" ref={singleProfesiDropdownRef}>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>Rumpun Profesi (Ketik untuk Mencari):</span>
                {singleProfesi && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {singleProfesi}
                  </span>
                )}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={
                    isSingleProfesiDropdownOpen
                      ? singleProfesiSearchTerm
                      : RKK_COMPETENCY_MAP[singleProfesi]?.label || singleProfesi
                  }
                  onFocus={() => {
                    setSingleProfesiSearchTerm('');
                    setIsSingleProfesiDropdownOpen(true);
                  }}
                  onChange={(e) => {
                    setSingleProfesiSearchTerm(e.target.value);
                    setIsSingleProfesiDropdownOpen(true);
                  }}
                  placeholder="Ketik nama profesi untuk mencari..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {isSingleProfesiDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-950 border border-slate-800 rounded-xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-slate-800/60">
                  {candidateProfessionsForSingle.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 space-y-2">
                      <p className="italic">
                        Tidak ditemukan profesi yang cocok dengan &quot;{singleProfesiSearchTerm}&quot;
                      </p>
                      {singleProfesiSearchTerm.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const custom = singleProfesiSearchTerm.trim().toUpperCase();
                            setSingleProfesi(custom);
                            setCustomProfesiInput(custom);
                            setIsSingleProfesiDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs transition"
                        >
                          + Gunakan &quot;{singleProfesiSearchTerm.trim().toUpperCase()}&quot; sebagai Profesi Baru
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {candidateProfessionsForSingle.map((p) => {
                        const isSelected = singleProfesi.toUpperCase() === p.code.toUpperCase();
                        return (
                          <div
                            key={p.code}
                            onClick={() => {
                              setSingleProfesi(p.code);
                              setSingleProfesiSearchTerm(p.label);
                              setCustomProfesiInput('');
                              setIsSingleProfesiDropdownOpen(false);
                            }}
                            className={`p-2.5 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between text-xs ${
                              isSelected ? 'bg-emerald-500/15 text-emerald-300 font-bold' : 'text-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-bold">{p.label}</span>
                              {p.code !== p.label && (
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                  ({p.code})
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                      {singleProfesiSearchTerm.trim() &&
                        !candidateProfessionsForSingle.some(
                          (p) => p.code.toLowerCase() === singleProfesiSearchTerm.trim().toLowerCase()
                        ) && (
                          <div
                            onClick={() => {
                              const custom = singleProfesiSearchTerm.trim().toUpperCase();
                              setSingleProfesi(custom);
                              setCustomProfesiInput(custom);
                              setIsSingleProfesiDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-slate-800/80 cursor-pointer transition text-xs font-bold text-amber-400"
                          >
                            + Gunakan &quot;{singleProfesiSearchTerm.trim().toUpperCase()}&quot; sebagai Profesi Baru
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>

            {singleProfesi === 'LAINNYA' && (
              <div>
                <label className="block text-amber-400 font-bold mb-1.5">Nama Profesi Baru (Manual):</label>
                <input
                  type="text"
                  value={customProfesiInput}
                  onChange={(e) => setCustomProfesiInput(e.target.value)}
                  placeholder="Ketik nama profesi baru..."
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>
            )}

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

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Tanggal Dokumen:</label>
              <input
                type="text"
                value={singleTanggal}
                onChange={(e) => setSingleTanggal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Nomor Surat Keputusan SPK:</label>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-200">
                Tabel Ceklis Kewenangan Klinis ({singleProfesi === 'LAINNYA' ? (customProfesiInput || 'Profesi Baru') : (RKK_COMPETENCY_MAP[singleProfesi]?.label || singleProfesi)}):
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
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
                <button
                  type="button"
                  onClick={() =>
                    setSingleChecklist((prev) =>
                      prev.map((r) => ({ ...r, dimintaM: false, dimintaDS: true, disetujuiM: false, disetujuiDS: true }))
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold"
                >
                  Centang Semua Supervisi (DS)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th rowSpan={2} className="px-3 py-2 w-8 text-center">
                      No
                    </th>
                    <th rowSpan={2} className="px-4 py-2">
                      Rincian Kewenangan Klinis (Dapat Diedit)
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
                    <th rowSpan={2} className="px-2 py-2 w-20 text-center border-l border-slate-800">
                      Aksi
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
                      <td className="px-3 py-1.5 font-medium">
                        <input
                          type="text"
                          value={row.kompetensi}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSingleChecklist((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, kompetensi: val } : r))
                            );
                          }}
                          className="w-full bg-transparent border border-transparent hover:border-slate-800 focus:border-emerald-500 focus:bg-slate-900 rounded px-2 py-1 text-xs text-slate-100 transition focus:outline-none"
                        />
                      </td>

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

                      <td className="px-2 py-2 text-center border-l border-slate-800">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSingleRowIdx(idx);
                              setEditingSingleRowText(row.kompetensi);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                            title="Edit Rincian Kewenangan Klinis"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleRow(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Hapus baris kompetensi ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Custom Competency Row Field */}
            <div className="flex flex-col sm:flex-row gap-2 items-center bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
              <input
                type="text"
                value={newCompetencyItemText}
                onChange={(e) => setNewCompetencyItemText(e.target.value)}
                placeholder="Ketik rincian butir kewenangan klinis baru untuk ditambahkan..."
                className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCompetencyRow();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomCompetencyRow}
                disabled={!newCompetencyItemText.trim()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Butir Kompetensi</span>
              </button>
            </div>

            {/* Live Kesimpulan Preview */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-300">Kesimpulan Otomatis Dokumen RKK:</span>
              <p className="text-emerald-400 font-medium italic">
                &ldquo;{getKesimpulanRkk(singleChecklist)}&rdquo;
              </p>
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

          {/* Modal Edit Rincian Kewenangan Klinis untuk Tab Tambah RKK Baru */}
          {editingSingleRowIdx !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        Edit Rincian Kewenangan Klinis
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Butir Kompetensi #{singleChecklist[editingSingleRowIdx]?.no || editingSingleRowIdx + 1}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSingleRowIdx(null);
                      setEditingSingleRowText('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Deskripsi Rincian Kewenangan Klinis:
                  </label>
                  <textarea
                    rows={4}
                    value={editingSingleRowText}
                    onChange={(e) => setEditingSingleRowText(e.target.value)}
                    placeholder="Tuliskan rumusan rincian kewenangan klinis..."
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSingleRowIdx(null);
                      setEditingSingleRowText('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingSingleRowText.trim()) {
                        toast.error('Rincian kewenangan klinis tidak boleh kosong.');
                        return;
                      }
                      setSingleChecklist((prev) =>
                        prev.map((r, i) =>
                          i === editingSingleRowIdx
                            ? { ...r, kompetensi: editingSingleRowText.trim() }
                            : r
                        )
                      );
                      toast.success('Rincian kewenangan klinis berhasil diubah.');
                      setEditingSingleRowIdx(null);
                      setEditingSingleRowText('');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT DOKUMEN RKK & SPK                                               */}
      {/* ========================================================================= */}
      {editingRkk && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Dokumen RKK & SPK</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {editingRkk.nama} ({editingRkk.profesi})
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingRkk(null);
                  setEditingSpk(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Profile fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nama Lengkap:</label>
                  <input
                    type="text"
                    value={editingRkk.nama ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRkk({ ...editingRkk, nama: val });
                      if (editingSpk) setEditingSpk({ ...editingSpk, nama: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Profesi:</label>
                  <div className="flex gap-2">
                    <select
                      value={
                        availableProfessionsList.some(
                          (p) => p.code === (editingRkk.profesi || '').toUpperCase().trim()
                        )
                          ? (editingRkk.profesi || '').toUpperCase().trim()
                          : 'LAINNYA'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'LAINNYA') {
                          setEditingRkk({ ...editingRkk, profesi: val });
                          if (editingSpk) {
                            setEditingSpk({
                              ...editingSpk,
                              profesi: val,
                              pelayanan: val,
                              kualifikasi: editingSpk.kualifikasi || val,
                            });
                          }
                        }
                      }}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                    >
                      {availableProfessionsList.map(({ code, label }) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                      <option value="LAINNYA">+ Ketik Profesi Manual...</option>
                    </select>
                    <input
                      type="text"
                      value={editingRkk.profesi ?? ''}
                      placeholder="Nama profesi..."
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingRkk({ ...editingRkk, profesi: val });
                        if (editingSpk) {
                          setEditingSpk({ ...editingSpk, profesi: val, pelayanan: val });
                        }
                      }}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">NIP / Nomor Anggota:</label>
                  <input
                    type="text"
                    value={editingRkk.nip ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRkk({ ...editingRkk, nip: val });
                      if (editingSpk) setEditingSpk({ ...editingSpk, memberId: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Kualifikasi / Pendidikan:</label>
                  <input
                    type="text"
                    value={editingRkk.kualifikasi ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRkk({ ...editingRkk, kualifikasi: val });
                      if (editingSpk) setEditingSpk({ ...editingSpk, kualifikasi: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Alumni / Institusi:</label>
                  <input
                    type="text"
                    value={editingRkk.alumni ?? ''}
                    onChange={(e) => setEditingRkk({ ...editingRkk, alumni: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tanggal Dokumen RKK:</label>
                  <input
                    type="text"
                    value={editingRkk.tanggal ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingRkk({ ...editingRkk, tanggal: val });
                      if (editingSpk && !editingSpk.tanggalDitetapkan) {
                        setEditingSpk({ ...editingSpk, tanggalDitetapkan: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nama Asesor Kredensial:</label>
                  <input
                    type="text"
                    value={editingRkk.namaAsesor ?? ''}
                    onChange={(e) => setEditingRkk({ ...editingRkk, namaAsesor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">NIP Asesor (Opsional):</label>
                  <input
                    type="text"
                    value={editingRkk.nipAsesor ?? ''}
                    onChange={(e) => setEditingRkk({ ...editingRkk, nipAsesor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {editingSpk && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 font-bold mb-1">Nomor Surat Keputusan SPK:</label>
                      <input
                        type="text"
                        value={editingSpk.nomorSurat ?? ''}
                        onChange={(e) => setEditingSpk({ ...editingSpk, nomorSurat: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Tanggal Penetapan SPK:</label>
                      <input
                        type="text"
                        value={editingSpk.tanggalDitetapkan ?? ''}
                        onChange={(e) => setEditingSpk({ ...editingSpk, tanggalDitetapkan: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Masa Berlaku SPK:</label>
                      <input
                        type="text"
                        value={editingSpk.masaBerlakuTahun ?? '3 (tiga) tahun'}
                        onChange={(e) => setEditingSpk({ ...editingSpk, masaBerlakuTahun: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Nama Direktur RSUD OKU Timur:</label>
                      <input
                        type="text"
                        value={editingSpk.namaDirektur ?? ''}
                        onChange={(e) => setEditingSpk({ ...editingSpk, namaDirektur: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Pangkat / Golongan Direktur:</label>
                      <input
                        type="text"
                        value={editingSpk.pangkatDirektur ?? ''}
                        onChange={(e) => setEditingSpk({ ...editingSpk, pangkatDirektur: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">NIP Direktur:</label>
                      <input
                        type="text"
                        value={editingSpk.nipDirektur ?? ''}
                        onChange={(e) => setEditingSpk({ ...editingSpk, nipDirektur: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Tempat Ditetapkan:</label>
                      <input
                        type="text"
                        value={editingSpk.tempatDitetapkan ?? ''}
                        onChange={(e) => setEditingSpk({ ...editingSpk, tempatDitetapkan: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Checklist Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">Rincian Kewenangan Klinis (Checklist):</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRkk({
                          ...editingRkk,
                          checklistData: editingRkk.checklistData.map((r) => ({
                            ...r,
                            dimintaM: true,
                            dimintaDS: false,
                            disetujuiM: true,
                            disetujuiDS: false,
                          })),
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold"
                    >
                      Centang Semua Mandiri (M)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRkk({
                          ...editingRkk,
                          checklistData: editingRkk.checklistData.map((r) => ({
                            ...r,
                            dimintaM: false,
                            dimintaDS: true,
                            disetujuiM: false,
                            disetujuiDS: true,
                          })),
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold"
                    >
                      Centang Semua Supervisi (DS)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th rowSpan={2} className="px-3 py-2 w-8 text-center">
                          No
                        </th>
                        <th rowSpan={2} className="px-3 py-2">
                          Kompetensi
                        </th>
                        <th colSpan={2} className="px-2 py-1 text-center border-l border-slate-800">
                          DIMINTA
                        </th>
                        <th colSpan={2} className="px-2 py-1 text-center border-l border-slate-800">
                          DISETUJUI
                        </th>
                        <th rowSpan={2} className="px-2 py-2 w-24 text-center border-l border-slate-800">
                          KET
                        </th>
                        <th rowSpan={2} className="px-2 py-2 w-10 text-center border-l border-slate-800">
                          Hapus
                        </th>
                      </tr>
                      <tr className="bg-slate-900 text-slate-400 text-[9px]">
                        <th className="px-1 py-1 text-center w-10 border-l border-slate-800">M</th>
                        <th className="px-1 py-1 text-center w-10">DS</th>
                        <th className="px-1 py-1 text-center w-10 border-l border-slate-800">M</th>
                        <th className="px-1 py-1 text-center w-10">DS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {editingRkk.checklistData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-2 py-1.5 font-medium">
                            <input
                              type="text"
                              value={row.kompetensi}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = editingRkk.checklistData.map((r, i) =>
                                  i === idx ? { ...r, kompetensi: val } : r
                                );
                                setEditingRkk({ ...editingRkk, checklistData: updated });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </td>

                          <td className="px-2 py-2 text-center border-l border-slate-800">
                            <input
                              type="checkbox"
                              checked={row.dimintaM}
                              onChange={(e) => {
                                const val = e.target.checked;
                                const updated = editingRkk.checklistData.map((r, i) =>
                                  i === idx ? { ...r, dimintaM: val, dimintaDS: val ? false : r.dimintaDS } : r
                                );
                                setEditingRkk({ ...editingRkk, checklistData: updated });
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
                                const updated = editingRkk.checklistData.map((r, i) =>
                                  i === idx ? { ...r, dimintaDS: val, dimintaM: val ? false : r.dimintaM } : r
                                );
                                setEditingRkk({ ...editingRkk, checklistData: updated });
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
                                const updated = editingRkk.checklistData.map((r, i) =>
                                  i === idx ? { ...r, disetujuiM: val, disetujuiDS: val ? false : r.disetujuiDS } : r
                                );
                                setEditingRkk({ ...editingRkk, checklistData: updated });
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
                                const updated = editingRkk.checklistData.map((r, i) =>
                                  i === idx ? { ...r, disetujuiDS: val, disetujuiM: val ? false : r.disetujuiM } : r
                                );
                                setEditingRkk({ ...editingRkk, checklistData: updated });
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
                                const updated = editingRkk.checklistData.map((r, i) =>
                                  i === idx ? { ...r, ket: val } : r
                                );
                                setEditingRkk({ ...editingRkk, checklistData: updated });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-center text-[10px]"
                            />
                          </td>

                          <td className="px-2 py-2 text-center border-l border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleDeleteEditCompetencyRow(idx)}
                              title="Hapus butir kompetensi"
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add new competency row in Edit modal */}
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    placeholder="+ Tambah Butir Kewenangan Klinis Baru..."
                    value={editNewCompetencyText}
                    onChange={(e) => setEditNewCompetencyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditCompetencyRow();
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditCompetencyRow}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Butir</span>
                  </button>
                </div>

                {/* Live Kesimpulan Preview in Edit Modal */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-300">Kesimpulan Dokumen:</span>
                  <p className="text-emerald-400 font-medium italic">
                    &ldquo;{getKesimpulanRkk(editingRkk.checklistData)}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingRkk(null);
                  setEditingSpk(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview RKK */}
      {previewRkk && (
        <RkkDocumentPreview rkk={previewRkk} kop={kop} onClose={() => setPreviewRkk(null)} />
      )}

      {/* Modal Preview RKK Rekomendasi */}
      {previewRkkRekomendasi && (
        <RkkDocumentPreview
          rkk={previewRkkRekomendasi.rkk}
          spk={previewRkkRekomendasi.spk}
          kop={kop}
          isRekomendasi={true}
          onClose={() => setPreviewRkkRekomendasi(null)}
        />
      )}

      {/* Modal Preview SPK */}
      {previewSpk && (
        <SpkDocumentPreview spk={previewSpk} kop={kop} onClose={() => setPreviewSpk(null)} />
      )}

      {/* Modal Cetak & Unduh Masal Dokumen per Profesi */}
      <BulkDownloadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        filterProfesi={filterProfesi}
        rkkList={rkkList}
        spkList={spkList}
        kop={kop}
      />
    </div>
  );
}
