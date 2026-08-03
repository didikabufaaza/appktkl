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
