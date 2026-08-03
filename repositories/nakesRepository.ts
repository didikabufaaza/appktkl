import { getSheetsClient, SPREADSHEET_ID, fetchPublicSheetData } from '@/lib/googleSheets';
import { NakesMember, DashboardStats, MasterItem } from '@/types/nakes';
import {
  readLocalOverrides,
  saveMemberAddition,
  saveMemberUpdate,
  saveMemberDeletion,
} from '@/lib/localStore';
import { formatDateString, addThreeYears, calculateMasaKerja } from '@/utils/dateUtils';

// In-memory store for mutations for rapid UI responsiveness
let localMembersCache: NakesMember[] | null = null;

export class NakesRepository {
  /**
   * Reads raw member data from Google Spreadsheet with Stale-While-Revalidate for ultra fast response
   */
  static async getAllNakes(forceRefresh: boolean = false): Promise<NakesMember[]> {
    if (localMembersCache && localMembersCache.length > 0 && !forceRefresh) {
      this.revalidateInBackground().catch(() => {});
      return localMembersCache;
    }

    return await this.fetchFreshFromSheets();
  }

  private static async revalidateInBackground(): Promise<void> {
    try {
      const fresh = await this.fetchFreshFromSheets();
      localMembersCache = fresh;
    } catch (e) {
      // Silent background catch
    }
  }

  private static async fetchFreshFromSheets(): Promise<NakesMember[]> {
    const sheets = getSheetsClient();
    let rows4: any[][] = [];
    let rows1: any[][] = [];

    // Fetch Form Responses 4 and Form Responses 1 in parallel
    if (sheets) {
      try {
        const [res4, res1] = await Promise.all([
          sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "'Form Responses 4'!A1:Z500" }),
          sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "'Form Responses 1'!A1:Z500" }),
        ]);
        rows4 = res4.data.values || [];
        rows1 = res1.data.values || [];
      } catch (err) {
        console.warn('Google Sheets API failed, falling back to public fetcher:', err);
        [rows4, rows1] = await Promise.all([
          fetchPublicSheetData('Form Responses 4'),
          fetchPublicSheetData('Form Responses 1'),
        ]);
      }
    } else {
      [rows4, rows1] = await Promise.all([
        fetchPublicSheetData('Form Responses 4'),
        fetchPublicSheetData('Form Responses 1'),
      ]);
    }

    // Index Form Responses 1 by Email and Name
    const map1 = new Map<string, any>();
    if (rows1 && rows1.length > 1) {
      const dataRows1 = rows1.slice(1);
      dataRows1.forEach((r) => {
        if (!r) return;
        const email = String(r[1] || r[23] || '').trim().toLowerCase();
        const nama = String(r[2] || '').trim().toLowerCase();
        const val = {
          nama: r[2] || '',
          email: r[1] || r[23] || '',
          ttl: r[3] || '',
          alamatKtp: r[4] || '',
          alamatTinggal: r[5] || '',
          pendidikan: r[6] || '',
          tahunLulus: formatDateString(r[7]),
          profesi: r[8] || '',
          berkasPdf: r[9] || '',
          photo: r[10] || '',
          tahunMasukRSUD: formatDateString(r[11]),
          alumni: r[12] || '',
          statusKepegawaian: r[13] || '',
          nip: r[14] || '',
          hp: r[15] || '',
          masaHabisSip: formatDateString(r[16]),
          tglPermohonan: formatDateString(r[17] || r[0]),
          lampiran: r[18] || '',
          perihal: r[19] || r[20] || '',
        };
        if (email) map1.set(email, val);
        if (nama) map1.set(nama, val);
      });
    }

    if (!rows4 || rows4.length < 2) {
      return [];
    }

    const dataRows4 = rows4.slice(1);
    let baseMembers: NakesMember[] = dataRows4
      .filter((row) => row && row[2] && String(row[2]).trim() !== '')
      .map((row, index) => {
        const nama = String(row[2] || '').trim();
        const email = String(row[3] || row[1] || '').trim();

        // Match with Form Responses 1 for missing fields
        const match1 = map1.get(email.toLowerCase()) || map1.get(nama.toLowerCase()) || {};

        const profesi = String(row[11] || row[8] || match1.profesi || 'ATLM').trim();
        const pendidikan = String(row[10] || match1.pendidikan || 'DIII').trim();
        const status = String(match1.statusKepegawaian || row[8] || '').trim();

        const tglPermohonan = formatDateString(row[4]) || formatDateString(match1.tglPermohonan) || '';
        const perihal = String(row[6] || match1.perihal || '').trim();
        const sipExpDate = formatDateString(row[19]) || formatDateString(match1.masaHabisSip) || '';
        const tahunMasukRSUD = formatDateString(row[20]) || formatDateString(match1.tahunMasukRSUD) || '';
        const berkasUrl = String(match1.berkasPdf || row[21] || '').trim();
        const masaKerja = calculateMasaKerja(tahunMasukRSUD);
        const waktuRekredensialKembali = addThreeYears(tglPermohonan);

        return {
          id: String(index + 1),
          timestamp: formatDateString(row[0]) || '',
          emailAddress: row[1] || email,
          namaLengkap: nama,
          email: email,
          tglPermohonan: tglPermohonan,
          lampiran: row[5] || match1.lampiran || '',
          perihal: perihal,
          tanggalLahir: row[7] || match1.ttl || '',
          statusKepegawaian: status,
          alamat: row[9] || match1.alamatTinggal || match1.alamatKtp || '',
          pendidikan: pendidikan,
          profesi: profesi,
          asalPendidikan: row[12] || match1.alumni || '',
          photo: row[13] || match1.photo || '',
          qr: row[14] || '',
          nomorSurat: row[15] || '',
          deskripsi: row[16] || '',
          nomorAnggota: row[17] || `KTKL-00${index + 1}`,
          linkPhoto: row[18] || row[13] || match1.photo || '',
          mergedDocId: row[24] || row[19] || '',
          mergedDocUrl: row[25] || row[20] || '',
          linkMergedDoc: row[26] || row[21] || '',
          docMergeStatus: row[27] || row[22] || '',
          // Structured Document Info
          strNumber: `STR-${100000 + index}`,
          strExpDate: '',
          sipNumber: sipExpDate ? `SIP-${200000 + index}` : '',
          sipExpDate: sipExpDate,
          sertifikatExpDate: '',
          tahunMasukRSUD: tahunMasukRSUD,
          waktuRekredensialKembali: waktuRekredensialKembali,
          masaKerja: masaKerja,
          berkasUrl: berkasUrl,
          ijazahUrl: berkasUrl,
          strUrl: berkasUrl,
          sipUrl: berkasUrl,
          sertifikatUrl: berkasUrl,
        };
      });

    // Merge persistent local overrides
    const overrides = readLocalOverrides();

    // 1. Filter deletions
    let finalMembers = baseMembers.filter((m) => !overrides.deletions.includes(m.id));

    // 2. Apply updates
    finalMembers = finalMembers.map((m) => {
      if (overrides.updates[m.id]) {
        const updated = { ...m, ...overrides.updates[m.id] };
        if (updated.tahunMasukRSUD) {
          updated.masaKerja = calculateMasaKerja(updated.tahunMasukRSUD);
        }
        return updated;
      }
      return m;
    });

    // 3. Append new additions
    if (overrides.additions && overrides.additions.length > 0) {
      overrides.additions.forEach((add) => {
        if (!overrides.deletions.includes(add.id)) {
          finalMembers.push(add);
        }
      });
    }

    localMembersCache = finalMembers;
    return finalMembers;
  }

  static async getNakesById(id: string): Promise<NakesMember | null> {
    const all = await this.getAllNakes();
    return all.find((m) => m.id === id) || null;
  }

  static async createNakes(data: Omit<NakesMember, 'id'>): Promise<NakesMember> {
    const all = await this.getAllNakes(true);
    const newId = String(all.length + 1);

    const newMember: NakesMember = {
      ...data,
      id: newId,
      timestamp: new Date().toLocaleDateString('id-ID'),
      nomorAnggota: data.nomorAnggota || `KTKL-${String(newId).padStart(3, '0')}/RSUD/${new Date().getFullYear()}`,
      masaKerja: calculateMasaKerja(data.tahunMasukRSUD),
    };

    // Save to persistent local overrides JSON
    saveMemberAddition(newMember);

    const sheets = getSheetsClient();
    if (sheets) {
      try {
        const rowValue = [
          newMember.timestamp,
          newMember.emailAddress || newMember.email,
          newMember.namaLengkap,
          newMember.email,
          newMember.tglPermohonan || new Date().toLocaleDateString('id-ID'),
          newMember.lampiran || '1 Berkas',
          newMember.perihal || 'Permohonan Kredensial Baru',
          newMember.tanggalLahir,
          newMember.statusKepegawaian,
          newMember.alamat,
          newMember.pendidikan,
          newMember.profesi,
          newMember.asalPendidikan || '',
          newMember.photo || '',
          newMember.qr || '',
          newMember.nomorSurat || '',
          newMember.deskripsi || '',
          newMember.nomorAnggota,
          newMember.linkPhoto || '',
          newMember.sipExpDate || '',
          newMember.tahunMasukRSUD || '',
          newMember.berkasUrl || newMember.strUrl || '',
          'Active',
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: "'Form Responses 4'!A:W",
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [rowValue],
          },
        });
      } catch (err) {
        console.error('Failed to append row to Google Sheets:', err);
      }
    }

    localMembersCache = null;
    return newMember;
  }

  static async updateNakes(id: string, data: Partial<NakesMember>): Promise<NakesMember | null> {
    const all = await this.getAllNakes(true);
    const index = all.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updated = { ...all[index], ...data };
    if (updated.tahunMasukRSUD) {
      updated.masaKerja = calculateMasaKerja(updated.tahunMasukRSUD);
    }

    // Save to persistent local overrides JSON
    saveMemberUpdate(id, data);

    const sheets = getSheetsClient();
    if (sheets) {
      try {
        const rowIndex = Number(id) + 1;
        const rowValue = [
          updated.timestamp,
          updated.emailAddress || updated.email,
          updated.namaLengkap,
          updated.email,
          updated.tglPermohonan || '',
          updated.lampiran || '',
          updated.perihal || '',
          updated.tanggalLahir,
          updated.statusKepegawaian,
          updated.alamat,
          updated.pendidikan,
          updated.profesi,
          updated.asalPendidikan || '',
          updated.photo || '',
          updated.qr || '',
          updated.nomorSurat || '',
          updated.deskripsi || '',
          updated.nomorAnggota,
          updated.linkPhoto || '',
          updated.sipExpDate || '',
          updated.tahunMasukRSUD || '',
          updated.berkasUrl || updated.strUrl || '',
          updated.docMergeStatus || '',
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `'Form Responses 4'!A${rowIndex}:W${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [rowValue],
          },
        });
      } catch (err) {
        console.error('Failed to update row in Google Sheets:', err);
      }
    }

    localMembersCache = null;
    return updated;
  }

  static async deleteNakes(id: string): Promise<boolean> {
    const all = await this.getAllNakes(true);
    const index = all.findIndex((m) => m.id === id);
    if (index === -1) return false;

    // Save to persistent local overrides JSON
    saveMemberDeletion(id);

    const sheets = getSheetsClient();
    if (sheets) {
      try {
        const rowIndex = Number(id) + 1;
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `'Form Responses 4'!A${rowIndex}:W${rowIndex}`,
        });
      } catch (err) {
        console.error('Failed to clear row in Google Sheets:', err);
      }
    }

    localMembersCache = null;
    return true;
  }

  // Dashboard Aggregation
  static async getDashboardStats(): Promise<DashboardStats> {
    const members = await this.getAllNakes();

    const profesiMap = new Map<string, number>();
    const pendidikanMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    let totalSTR = 0;
    let totalSIP = 0;
    let totalDocs = 0;

    const today = new Date();

    const expiringReminders: DashboardStats['expiringReminders'] = [];

    members.forEach((m) => {
      profesiMap.set(m.profesi, (profesiMap.get(m.profesi) || 0) + 1);
      pendidikanMap.set(m.pendidikan, (pendidikanMap.get(m.pendidikan) || 0) + 1);
      if (m.statusKepegawaian) {
        statusMap.set(m.statusKepegawaian, (statusMap.get(m.statusKepegawaian) || 0) + 1);
      }

      if (m.strNumber) totalSTR++;
      if (m.sipExpDate && m.sipExpDate.trim() !== '') totalSIP++;
      if (m.berkasUrl) totalDocs++;

      // Check SIP Expiry from database: ONLY if filled and NOT empty
      if (m.sipExpDate && m.sipExpDate.trim() !== '' && m.sipExpDate !== '-') {
        let sipDate: Date | null = null;
        if (m.sipExpDate.includes('/')) {
          const parts = m.sipExpDate.split('/');
          if (parts.length === 3) {
            sipDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          }
        } else {
          sipDate = new Date(m.sipExpDate);
        }

        if (sipDate && !isNaN(sipDate.getTime()) && sipDate.getFullYear() >= 2020) {
          const diffMs = sipDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

          // ONLY include members whose SIP remaining time is LESS THAN 1 YEAR (< 365 days)
          if (diffDays < 365) {
            expiringReminders.push({
              id: `${m.id}-sip`,
              namaLengkap: m.namaLengkap,
              profesi: m.profesi,
              documentType: 'SIP',
              expiryDate: m.sipExpDate,
              daysRemaining: diffDays,
              email: m.email || m.emailAddress,
            });
          }
        }
      }

      // Check Waktu Rekredensial Kembali (< 6 Months / 180 Days)
      if (m.waktuRekredensialKembali && m.waktuRekredensialKembali.trim() !== '' && m.waktuRekredensialKembali !== '-') {
        let rekDate: Date | null = null;
        if (m.waktuRekredensialKembali.includes('/')) {
          const parts = m.waktuRekredensialKembali.split('/');
          if (parts.length === 3) {
            rekDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          }
        } else if (m.waktuRekredensialKembali.includes('-')) {
          const parts = m.waktuRekredensialKembali.split('-');
          if (parts.length === 3) {
            rekDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          }
        }

        if (rekDate && !isNaN(rekDate.getTime())) {
          const diffMs = rekDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

          // ONLY include members whose Rekredensial Kembali remaining time is LESS THAN 6 MONTHS (< 180 days)
          if (diffDays < 180) {
            expiringReminders.push({
              id: `${m.id}-rekredensial`,
              namaLengkap: m.namaLengkap,
              profesi: m.profesi,
              documentType: 'Rekredensial',
              expiryDate: m.waktuRekredensialKembali,
              daysRemaining: diffDays,
              email: m.email || m.emailAddress,
            });
          }
        }
      }
    });

    const profesiDistribution = Array.from(profesiMap.entries()).map(([name, count]) => ({ name, count }));
    const pendidikanDistribution = Array.from(pendidikanMap.entries()).map(([name, count]) => ({ name, count }));
    const statusDistribution = Array.from(statusMap.entries()).map(([name, count]) => ({ name, count }));

    return {
      totalAnggota: members.length,
      totalProfesi: profesiMap.size,
      totalPendidikan: pendidikanMap.size,
      totalSTRAktif: totalSTR,
      totalSIPAktif: totalSIP,
      totalDokumen: totalDocs * 3 + members.length,
      profesiDistribution,
      pendidikanDistribution,
      statusDistribution,
      monthlyRegistration: [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 18 },
        { month: 'Mar', count: 15 },
        { month: 'Apr', count: 22 },
        { month: 'Mei', count: 28 },
        { month: 'Jun', count: 35 },
        { month: 'Jul', count: members.length },
      ],
      expiringReminders: expiringReminders.sort((a, b) => a.daysRemaining - b.daysRemaining),
    };
  }

  // Master Data Repositories
  static async getMasterProfesi(): Promise<MasterItem[]> {
    return [
      { id: '1', kode: 'ATLM', nama: 'ATLM (Ahli Teknologi Laboratorium Medik)', deskripsi: 'Analisa Laboratorium Kesehatan' },
      { id: '2', kode: 'APT', nama: 'APOTEKER', deskripsi: 'Pelayanan Kefarmasian' },
      { id: '3', kode: 'AA', nama: 'ASISTEN APOTEKER', deskripsi: 'Teknik Kefarmasian' },
      { id: '4', kode: 'RAD', nama: 'RADIOGRAFER', deskripsi: 'Radiologi & Diagnostik Medis' },
      { id: '5', kode: 'FIS', nama: 'FISIOTERAPIS', deskripsi: 'Fisioterapi & Rehabilitasi' },
      { id: '6', kode: 'NUT', nama: 'NUTRISIONIS', deskripsi: 'Gizi Klinik & Dietetik' },
      { id: '7', kode: 'RMIK', nama: 'REKAM MEDIS', deskripsi: 'Manajemen Informasi Kesehatan' },
      { id: '8', kode: 'SKM', nama: 'SKM (Kesehatan Masyarakat)', deskripsi: 'Epidemiologi & Promkes' },
      { id: '9', kode: 'PA', nama: 'PENATA ANASTESI', deskripsi: 'Pelayanan Penata Anestesi' },
      { id: '10', kode: 'PSI', nama: 'PSIKOLOG KLINIS', deskripsi: 'Layanan Psikologi Kesehatan' },
      { id: '11', kode: 'SAN', nama: 'SANITARIAN', deskripsi: 'Kesehatan Lingkungan' },
      { id: '12', kode: 'PTD', nama: 'PETUGAS TRANSFUSI DARAH', deskripsi: 'Pelayanan Transfusi Darah' },
      { id: '13', kode: 'ATEM', nama: 'ATEM (Teknik Elektromedis)', deskripsi: 'Pemeliharaan Alat Kesehatan' },
      { id: '14', kode: 'FMED', nama: 'FISIKAWAN MEDIK', deskripsi: 'Fisika Medis & Proteksi Radiasi' },
    ];
  }

  static async getMasterPendidikan(): Promise<MasterItem[]> {
    return [
      { id: '1', kode: 'D3', nama: 'DIII (Diploma Tiga)', deskripsi: 'Pendidikan Vokasi D3' },
      { id: '2', kode: 'D4', nama: 'DIV (Diploma Empat)', deskripsi: 'Pendidikan Sarjana Terapan' },
      { id: '3', kode: 'S1', nama: 'S1 (Sarjana)', deskripsi: 'Pendidikan Akademik S1' },
      { id: '4', kode: 'PROF', nama: 'Profesi', deskripsi: 'Pendidikan Profesi (Apoteker, dll)' },
      { id: '5', kode: 'S2', nama: 'S2 (Magister)', deskripsi: 'Pendidikan Magister' },
    ];
  }

  static async getMasterUnit(): Promise<MasterItem[]> {
    return [
      { id: '1', kode: 'LAB', nama: 'Instalasi Laboratorium', deskripsi: 'Unit Pelayanan Laboratorium' },
      { id: '2', kode: 'FAR', nama: 'Instalasi Farmasi', deskripsi: 'Unit Pelayanan Depo & Gudang Farmasi' },
      { id: '3', kode: 'RAD', nama: 'Instalasi Radiologi', deskripsi: 'Unit Radiodiagnostik & CT-Scan' },
      { id: '4', kode: 'REHAB', nama: 'Instalasi Rehabilitasi Medik', deskripsi: 'Unit Fisioterapi' },
      { id: '5', kode: 'GIZI', nama: 'Instalasi Gizi', deskripsi: 'Unit Pelayanan Makanan & Dietis' },
      { id: '6', kode: 'RMIK', nama: 'Instalasi Rekam Medis', deskripsi: 'Unit Pendaftaran & Coding RMIK' },
      { id: '7', kode: 'OK', nama: 'Instalasi Bedah Sentral', deskripsi: 'Unit Penata Anestesi' },
    ];
  }

  static async getMasterJabatan(): Promise<MasterItem[]> {
    return [
      { id: '1', kode: 'JAB-1', nama: 'Pranata Laboratorium Kesehatan Ahli', deskripsi: 'Jabatan Fungsional ATLM' },
      { id: '2', kode: 'JAB-2', nama: 'Apoteker Ahli Pertama', deskripsi: 'Jabatan Fungsional Apoteker' },
      { id: '3', kode: 'JAB-3', nama: 'Asisten Apoteker Penyelia', deskripsi: 'Jabatan Fungsional Tenaga Kefarmasian' },
      { id: '4', kode: 'JAB-4', nama: 'Radiografer Mahir', deskripsi: 'Jabatan Fungsional Radiografer' },
      { id: '5', kode: 'JAB-5', nama: 'Fisioterapis Ahli', deskripsi: 'Jabatan Fungsional Fisioterapi' },
      { id: '6', kode: 'JAB-6', nama: 'Nutrisionis Penyelia', deskripsi: 'Jabatan Fungsional Gizi' },
      { id: '7', kode: 'JAB-7', nama: 'Perekam Medis Mahir', deskripsi: 'Jabatan Fungsional Rekam Medis' },
    ];
  }

  static async getMasterKomite(): Promise<MasterItem[]> {
    return [
      { id: '1', kode: 'KOM-1', nama: 'Sub Komite Kredensial KTKL', deskripsi: 'Verifikasi & Pengujian Kewenangan Klinis' },
      { id: '2', kode: 'KOM-2', nama: 'Sub Komite Mutu Profesi KTKL', deskripsi: 'Pengembangan & Audit Mutu Nakes Lain' },
      { id: '3', kode: 'KOM-3', nama: 'Sub Komite Etik & Disiplin KTKL', deskripsi: 'Pembinaan Etika & Penegakan Disiplin' },
    ];
  }
}
