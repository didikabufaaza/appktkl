export interface NakesMember {
  id: string; // row index or unique string
  timestamp?: string;
  emailAddress?: string;
  namaLengkap: string;
  email: string;
  tglPermohonan?: string;
  lampiran?: string;
  perihal?: string;
  tanggalLahir: string;
  statusKepegawaian: string;
  nip?: string;
  alamat: string;
  pendidikan: string;
  profesi: string;
  asalPendidikan?: string;
  photo?: string;
  qr?: string;
  nomorSurat?: string;
  deskripsi?: string;
  nomorAnggota?: string;
  linkPhoto?: string;
  mergedDocId?: string;
  mergedDocUrl?: string;
  linkMergedDoc?: string;
  docMergeStatus?: string;
  // Documents
  strNumber?: string;
  strExpDate?: string;
  sipNumber?: string;
  sipExpDate?: string;
  sertifikatExpDate?: string;
  tahunMasukRSUD?: string;
  waktuRekredensialKembali?: string;
  masaKerja?: string;
  berkasUrl?: string;
  ijazahUrl?: string;
  strUrl?: string;
  sipUrl?: string;
  sertifikatUrl?: string;
  otherDocsUrl?: string;
}

export interface DashboardStats {
  totalAnggota: number;
  totalProfesi: number;
  totalPendidikan: number;
  totalSTRAktif: number;
  totalSIPAktif: number;
  totalDokumen: number;
  profesiDistribution: Array<{ name: string; count: number }>;
  pendidikanDistribution: Array<{ name: string; count: number }>;
  statusDistribution: Array<{ name: string; count: number }>;
  monthlyRegistration: Array<{ month: string; count: number }>;
  expiringReminders: Array<{
    id: string;
    namaLengkap: string;
    profesi: string;
    documentType: 'STR' | 'SIP' | 'Sertifikat' | 'Rekredensial';
    expiryDate: string;
    daysRemaining: number;
    email?: string;
  }>;
}

export interface MasterItem {
  id: string;
  kode?: string;
  nama: string;
  deskripsi?: string;
  icon?: string;
  kategori?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'user' | 'Administrator' | 'Ketua' | 'Sekretaris' | 'Viewer';

export interface UserPermissions {
  canSendEmail: boolean;
  canExportExcelPdf: boolean;
  canPrint: boolean;
  canRegisterNew: boolean;
  canViewAllMembers: boolean;
  canAccessSpreadsheetSettings: boolean;
  canAccessMasterData: boolean;
  canEditMemberData: boolean;
  canDeleteMemberData: boolean;
  canAccessLetters: boolean;
}

export interface SuratItem {
  id: string;
  tipe: 'masuk' | 'keluar';
  tanggal: string;
  nomor: string;
  sifat: string;
  lampiran: string;
  hal: string;
  yth: string;
  di: string;
  isiSurat: string;
  parafKabag: string;
  parafKasubbag: string;
  parafPelaksana: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  penandatanganPangkat: string;
  penandatanganNip: string;
  lampiranFileUrl: string;
  timestamp: string;
}

export interface UserSession {
  id: string;
  username: string;
  nama: string;
  role: 'superadmin' | 'admin' | 'user';
  email: string;
  memberId?: string;
  profesi?: string;
  permissions: UserPermissions;
}

export interface UserOverride {
  role?: 'superadmin' | 'admin' | 'user';
  status?: 'active' | 'inactive';
  password?: string;
  permissions?: Partial<UserPermissions>;
}

export interface KopSuratData {
  pemda: string;
  namaRS: string;
  alamatRS: string;
  kontakRS: string;
  logoKiriUrl: string;
  logoKananUrl: string;
}

export interface RkkChecklistRow {
  no: number;
  kompetensi: string;
  dimintaM: boolean;
  dimintaDS: boolean;
  disetujuiM: boolean;
  disetujuiDS: boolean;
  ket?: string;
}

export interface RkkItem {
  id: string;
  memberId?: string;
  nama: string;
  nip?: string;
  profesi: string;
  kualifikasi?: string;
  alumni?: string;
  checklistData: RkkChecklistRow[];
  tanggal: string;
  namaPemohon: string;
  namaAsesor: string;
  nipAsesor?: string;
  status: 'Draft' | 'Diajukan' | 'Disetujui';
  createdAt?: string;
  updatedAt?: string;
}

export interface SpkItem {
  id: string;
  rkkId?: string;
  memberId?: string;
  nomorSurat: string;
  nama: string;
  gelar?: string;
  kualifikasi: string;
  profesi: string;
  pelayanan?: string;
  masaBerlakuTahun?: string;
  tanggalDitetapkan: string;
  tempatDitetapkan?: string;
  namaDirektur: string;
  pangkatDirektur?: string;
  nipDirektur?: string;
  createdAt?: string;
  updatedAt?: string;
}

