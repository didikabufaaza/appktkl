'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Filter,
  Plus,
  ArrowUpDown,
  CreditCard,
  ExternalLink,
  Calendar,
  Clock,
  Briefcase,
  Mail,
} from 'lucide-react';
import { NakesMember, UserSession } from '@/types/nakes';
import { KartuAnggotaModal } from '@/components/anggota/KartuAnggotaModal';
import { DocumentPreviewModal } from '@/components/anggota/DocumentPreviewModal';
import { getMemberPhotoUrl } from '@/utils/imageUtils';
import { calculateMasaKerja, addThreeYears } from '@/utils/dateUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnggotaDataTableProps {
  data: NakesMember[];
  userSession?: UserSession | null;
  onEdit?: (member: NakesMember) => void;
  onDelete?: (member: NakesMember) => void;
}

/**
 * Normalizes Google Drive links from Form Responses Column 9 to valid direct viewable URLs
 */
export function getDirectDrivePdfUrl(url?: string): string {
  if (!url) return '';
  let str = url.trim();

  // Fix Google Form export double ID: "id=view&id=1XYZ..." -> "https://drive.google.com/file/d/1XYZ.../view"
  if (str.includes('id=view&id=')) {
    const parts = str.split('id=view&id=');
    if (parts[1]) {
      const realId = parts[1].split('&')[0];
      return `https://drive.google.com/file/d/${realId}/view`;
    }
  }

  // Fix Google Drive open ID format: "drive.google.com/open?id=1XYZ..."
  if (str.includes('drive.google.com/open?id=')) {
    const parts = str.split('drive.google.com/open?id=');
    if (parts[1]) {
      const realId = parts[1].split('&')[0];
      return `https://drive.google.com/file/d/${realId}/view`;
    }
  }

  return str;
}

export function AnggotaDataTable({ data, userSession, onEdit, onDelete }: AnggotaDataTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedProfesi, setSelectedProfesi] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAlumni, setSelectedAlumni] = useState<string>('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedCardMember, setSelectedCardMember] = useState<NakesMember | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  const permissions = userSession?.permissions;
  const isUser = userSession?.role === 'user';
  const canViewAll = permissions?.canViewAllMembers !== false;

  // Private Data Isolation: If role is User, filter data strictly to ONLY their own record!
  const isolatedData = useMemo(() => {
    if (!canViewAll && userSession) {
      return data.filter((item) => {
        const itemId = String(item.id).trim();
        const userMemberId = String(userSession.memberId || '').trim();

        // Primary match by exact Member ID
        if (userMemberId && itemId === userMemberId) return true;

        // Secondary match by email (only if email is valid and not generic fallback)
        const itemEmail = (item.email || item.emailAddress || '').toLowerCase().trim();
        const userEmail = (userSession.email || userSession.username || '').toLowerCase().trim();

        if (
          userEmail &&
          itemEmail &&
          userEmail === itemEmail &&
          !userEmail.includes('@ktkl.local') &&
          userEmail !== 'anggota@rsudokut.go.id'
        ) {
          return true;
        }

        return false;
      });
    }
    return data;
  }, [data, canViewAll, userSession]);

  // Unique profession & status options for filtering
  const profesiOptions = useMemo(() => {
    const set = new Set(isolatedData.map((d) => d.profesi).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [isolatedData]);

  const statusOptions = useMemo(() => {
    const set = new Set(isolatedData.map((d) => d.statusKepegawaian).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [isolatedData]);

  const alumniOptions = useMemo(() => {
    const set = new Set(isolatedData.map((d) => d.asalPendidikan).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [isolatedData]);

  // Apply manual profession, status & alumni filter
  const filteredData = useMemo(() => {
    return isolatedData.filter((item) => {
      const matchProfesi = selectedProfesi === 'ALL' || item.profesi === selectedProfesi;
      const matchStatus = selectedStatus === 'ALL' || item.statusKepegawaian === selectedStatus;
      
      const alumniQuery = String(selectedAlumni || '').trim().toLowerCase();
      const matchAlumni =
        selectedAlumni === 'ALL' ||
        alumniQuery === '' ||
        String(item.asalPendidikan || '').toLowerCase().includes(alumniQuery);

      return matchProfesi && matchStatus && matchAlumni;
    });
  }, [isolatedData, selectedProfesi, selectedStatus, selectedAlumni]);

  const columns = useMemo<ColumnDef<NakesMember>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'No',
        cell: (info) => info.row.index + 1,
      },
      {
        accessorKey: 'namaLengkap',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-slate-100 font-bold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama & Gelar
            <ArrowUpDown className="w-3.5 h-3.5 ml-1" />
          </button>
        ),
        cell: (info) => {
          const member = info.row.original;
          const photoUrl = getMemberPhotoUrl(member.linkPhoto || member.photo, member.namaLengkap);
          return (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                <img
                  src={photoUrl}
                  alt={member.namaLengkap}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute(
                      'src',
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.namaLengkap
                      )}&background=0D9488&color=fff`
                    );
                  }}
                />
              </div>
              <div>
                <Link
                  href={`/anggota/${member.id}`}
                  className="font-bold text-slate-100 hover:text-emerald-400 transition-colors"
                >
                  {member.namaLengkap}
                </Link>
                <div className="text-[11px] text-slate-400">NIP/Nomor: {member.nomorAnggota || '-'}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email Anggota',
        cell: (info) => {
          const val = String(info.getValue() || info.row.original.emailAddress || '').trim();
          if (!val) return <span className="text-slate-500 text-xs italic">-</span>;
          return (
            <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{val}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'nip',
        header: 'NIP',
        cell: (info) => {
          const val = String(info.getValue() || info.row.original.nomorAnggota || '').trim();
          if (!val || val === '0') return <span className="text-slate-500 text-xs italic">-</span>;
          return (
            <span className="font-mono text-xs text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-semibold">
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'profesi',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-slate-100 font-bold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Profesi
            <ArrowUpDown className="w-3.5 h-3.5 ml-1" />
          </button>
        ),
        cell: (info) => (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'pendidikan',
        header: 'Pendidikan',
        cell: (info) => (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {String(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'asalPendidikan',
        header: 'Alumni / Universitas',
        cell: (info) => {
          const val = String(info.getValue() || '').trim();
          if (!val) return <span className="text-slate-500 text-xs italic">-</span>;
          return <span className="text-xs text-slate-300 font-semibold">{val}</span>;
        },
      },
      {
        accessorKey: 'statusKepegawaian',
        header: 'Status',
        cell: (info) => {
          const status = String(info.getValue() || '').trim();
          if (!status) return <span className="text-slate-500 text-xs italic">-</span>;
          let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          if (status.includes('PPPK PW')) badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
          else if (status.includes('PPPK')) badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
          else if (status.includes('BLUD')) badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          else if (status.includes('KONTRAK') || status.includes('MOU') || status.includes('Honorer')) badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${badgeColor}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'tglPermohonan',
        header: 'Tgl Permohonan',
        cell: (info) => {
          const val = String(info.getValue() || '').trim();
          if (!val) return <span className="text-slate-500 text-xs italic">-</span>;
          return <div className="text-xs text-slate-300 font-mono whitespace-nowrap">{val}</div>;
        },
      },
      {
        accessorKey: 'sipExpDate',
        header: 'Habis SIP',
        cell: (info) => {
          const val = String(info.getValue() || '').trim();
          if (!val) return <span className="text-slate-500 text-xs italic">-</span>;
          return <div className="text-xs text-rose-400 font-mono font-semibold whitespace-nowrap">{val}</div>;
        },
      },
      {
        accessorKey: 'waktuRekredensialKembali',
        header: 'Rekredensial Kembali (+3 Thn)',
        cell: (info) => {
          const row = info.row.original;
          const val = row.waktuRekredensialKembali || addThreeYears(row.tglPermohonan || '');
          if (!val || val === '-') return <span className="text-slate-500 text-xs italic">-</span>;
          return (
            <div className="text-xs font-mono font-semibold text-amber-300 flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{val}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'tahunMasukRSUD',
        header: 'Thn Masuk RSUD',
        cell: (info) => {
          const val = String(info.getValue() || '').trim();
          if (!val) return <span className="text-slate-500 text-xs italic">-</span>;
          return <div className="text-xs text-emerald-400 font-mono font-semibold whitespace-nowrap">{val}</div>;
        },
      },
      {
        accessorKey: 'masaKerja',
        header: 'Masa Kerja',
        cell: (info) => {
          const row = info.row.original;
          const val = calculateMasaKerja(row.tahunMasukRSUD || '');
          if (!val || val === '-') return <span className="text-slate-500 text-xs italic">-</span>;
          return (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20 whitespace-nowrap">
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'berkasUrl',
        header: 'Lampiran Berkas',
        cell: (info) => {
          const rawUrl = String(info.getValue() || info.row.original.strUrl || info.row.original.sipUrl || '').trim();
          if (!rawUrl) return <span className="text-slate-500 text-xs italic">Kosong</span>;
          const directUrl = getDirectDrivePdfUrl(rawUrl);
          return (
            <button
              onClick={() => setPreviewDoc({ title: `Berkas PDF - ${info.row.original.namaLengkap}`, url: directUrl })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-colors text-xs font-semibold"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Lihat PDF</span>
            </button>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: (info) => {
          const member = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Cetak Kartu Digital */}
              {permissions?.canPrint !== false && (
                <button
                  onClick={() => setSelectedCardMember(member)}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/30"
                  title="Cetak Kartu Digital Anggota"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              )}

              {/* Detail Profil */}
              <Link
                href={`/anggota/${member.id}`}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                title="Lihat Detail Profil"
              >
                <Eye className="w-4 h-4" />
              </Link>

              {/* Edit Data */}
              {onEdit && permissions?.canEditMemberData !== false && (
                <button
                  onClick={() => onEdit(member)}
                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors border border-amber-500/30"
                  title="Edit Data Anggota"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              {/* Hapus Data */}
              {onDelete && permissions?.canDeleteMemberData !== false && (
                <button
                  onClick={() => onDelete(member)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/30"
                  title="Hapus Data Anggota"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, permissions]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: false, // Prevents automatic pagination reset on background updates
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Export handlers
  const handleExportExcel = () => {
    const exportData = filteredData.map((m, idx) => ({
      No: idx + 1,
      'Nama Lengkap': m.namaLengkap,
      Email: m.email || m.emailAddress || '-',
      Profesi: m.profesi,
      Pendidikan: m.pendidikan,
      Alumni: m.asalPendidikan || '-',
      Status: m.statusKepegawaian,
      'Tgl Permohonan': m.tglPermohonan || '-',
      'Habis SIP': m.sipExpDate || '-',
      'Rekredensial Kembali': m.waktuRekredensialKembali || addThreeYears(m.tglPermohonan || ''),
      'Thn Masuk RSUD': m.tahunMasukRSUD || '-',
      'Masa Kerja': calculateMasaKerja(m.tahunMasukRSUD || ''),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Anggota KTKL');
    XLSX.writeFile(wb, `Data_Anggota_KTKL_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('DAFTAR ANGGOTA KOMITE TENAGA KESEHATAN LAIN RSUD OKU TIMUR', 14, 15);
    const tableBody = filteredData.map((m, idx) => [
      idx + 1,
      m.namaLengkap,
      m.email || '-',
      m.profesi,
      m.pendidikan,
      m.asalPendidikan || '-',
      m.statusKepegawaian,
      m.tglPermohonan || '-',
      m.sipExpDate || '-',
      m.waktuRekredensialKembali || addThreeYears(m.tglPermohonan || ''),
      m.tahunMasukRSUD || '-',
      calculateMasaKerja(m.tahunMasukRSUD || ''),
    ]);
    autoTable(doc, {
      startY: 20,
      head: [['No', 'Nama', 'Email', 'Profesi', 'Pend.', 'Alumni', 'Status', 'Tgl Mohon', 'Masa SIP', 'Rekredensial', 'Thn Masuk', 'Masa Kerja']],
      body: tableBody,
      styles: { fontSize: 8 },
    });
    doc.save(`Data_Anggota_KTKL_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Search & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari nama, NIP, profesi, email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters (Hidden for role User) */}
        {canViewAll && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedProfesi}
                onChange={(e) => setSelectedProfesi(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">Semua Profesi</option>
                {profesiOptions.filter((p) => p !== 'ALL').map((p) => (
                  <option key={p} value={p} className="bg-slate-900">{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">Semua Status</option>
                {statusOptions.filter((s) => s !== 'ALL').map((s) => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 max-w-[200px] relative">
              <input
                type="text"
                list="alumni-list"
                value={selectedAlumni === 'ALL' ? '' : selectedAlumni}
                onChange={(e) => setSelectedAlumni(e.target.value || 'ALL')}
                placeholder="Cari/Pilih Alumni"
                className="bg-transparent text-xs text-slate-200 focus:outline-none w-full placeholder:text-slate-500"
              />
              <datalist id="alumni-list">
                {alumniOptions.filter((a) => a !== 'ALL').map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {permissions?.canExportExcelPdf !== false && (
            <>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </>
          )}

          {permissions?.canPrint !== false && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          )}

          {permissions?.canRegisterNew !== false && (
            <Link
              href="/anggota/baru"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </Link>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[11px] border-b border-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-slate-500 italic">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan {table.getRowModel().rows.length} dari {filteredData.length} data anggota
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200">
              Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Kartu Anggota Modal */}
      {selectedCardMember && (
        <KartuAnggotaModal isOpen={true} member={selectedCardMember} onClose={() => setSelectedCardMember(null)} />
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal isOpen={true} title={previewDoc.title} url={previewDoc.url} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
