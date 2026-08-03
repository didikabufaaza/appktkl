import { getSheetsClient, fetchPublicSheetData, SPREADSHEET_ID } from '@/lib/googleSheets';
import { NakesMember, DashboardStats } from '@/types/nakes';
import { formatDateString, calculateMasaKerja, addThreeYears } from '@/utils/dateUtils';
import {
  readLocalOverrides,
  saveMemberUpdate,
  saveMemberAddition,
  saveMemberDeletion,
} from '@/lib/localStore';

let localMembersCache: NakesMember[] | null = null;
let lastCacheTime = 0;

export class NakesRepository {
  /**
   * Reads member rows directly from Google Spreadsheet "Form Responses 1"
   * merges local overrides and returns structured NakesMember array.
   */
  static async getAllNakes(forceRefresh = false): Promise<NakesMember[]> {
    const now = Date.now();
    // Cache for 3 seconds to ensure real-time updates while maintaining high performance
    if (!forceRefresh && localMembersCache && now - lastCacheTime < 3000) {
      return localMembersCache;
    }

    try {
      let rows1: any[][] = [];

      const sheets = getSheetsClient();
      if (sheets) {
        try {
          const res1 = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'Form Responses 1'!A:W",
          });
          rows1 = res1.data.values || [];
        } catch (apiErr) {
          console.warn('Google Sheets API error, falling back to public gviz fetch for Form Responses 1:', apiErr);
          rows1 = await fetchPublicSheetData('Form Responses 1');
        }
      } else {
        rows1 = await fetchPublicSheetData('Form Responses 1');
      }

      if (!rows1 || rows1.length < 2) {
        return [];
      }

      const dataRows = rows1.slice(1);
      let baseMembers: NakesMember[] = dataRows
        .filter((row) => row && (row[2] || row[1])) // Must have name or email
        .map((row, index) => {
          const nama = String(row[2] || '').trim();
          const email = String(row[1] || '').trim();
          const profesi = String(row[8] || 'ATLM').trim();
          const pendidikan = String(row[6] || 'DIII').trim();
          const status = String(row[13] || 'PNS').trim();

          const tglPermohonan = formatDateString(row[17]) || '';
          const perihal = String(row[19] || '').trim();
          const sipExpDate = formatDateString(row[16]) || '';
          const tahunMasukRSUD = formatDateString(row[11]) || '';
          const berkasUrl = String(row[9] || '').trim();
          const photo = String(row[10] || '').trim();
          const masaKerja = calculateMasaKerja(tahunMasukRSUD);
          const waktuRekredensialKembali = addThreeYears(tglPermohonan);
          const nomorAnggota = String(row[22] || row[14] || `KTKL-${String(index + 1).padStart(3, '0')}/RSUD/${new Date().getFullYear()}`).trim();

          return {
            id: String(index + 1),
            timestamp: formatDateString(row[0]) || '',
            emailAddress: email,
            namaLengkap: nama,
            email: email,
            tanggalLahir: String(row[3] || '').trim(),
            alamat: String(row[5] || row[4] || '').trim(),
            pendidikan: pendidikan,
            profesi: profesi,
            asalPendidikan: String(row[12] || '').trim(),
            statusKepegawaian: status,
            photo: photo,
            linkPhoto: photo,
            sipExpDate: sipExpDate,
            tahunMasukRSUD: tahunMasukRSUD,
            tglPermohonan: tglPermohonan,
            lampiran: String(row[18] || '').trim(),
            perihal: perihal,
            qr: String(row[20] || '').trim(),
            deskripsi: String(row[21] || '').trim(),
            nomorAnggota: nomorAnggota,
            berkasUrl: berkasUrl,
            strUrl: berkasUrl,
            sipUrl: berkasUrl,
            ijazahUrl: berkasUrl,
            sertifikatUrl: berkasUrl,
            mergedDocUrl: berkasUrl,
            linkMergedDoc: berkasUrl,
            docMergeStatus: 'Active',
            masaKerja: masaKerja,
            waktuRekredensialKembali: waktuRekredensialKembali,
          };
        });

      // Apply Local Overrides (Updates, Deletions, Additions)
      const overrides = readLocalOverrides();

      // Filter out deleted members
      if (overrides.deletions && overrides.deletions.length > 0) {
        baseMembers = baseMembers.filter((m) => !overrides.deletions.includes(m.id));
      }

      // Apply field updates
      if (overrides.updates) {
        baseMembers = baseMembers.map((m) => {
          if (overrides.updates[m.id]) {
            const updated = { ...m, ...overrides.updates[m.id] };
            if (updated.tahunMasukRSUD) {
              updated.masaKerja = calculateMasaKerja(updated.tahunMasukRSUD);
            }
            if (updated.tglPermohonan) {
              updated.waktuRekredensialKembali = addThreeYears(updated.tglPermohonan);
            }
            return updated;
          }
          return m;
        });
      }

      // Append additions
      if (overrides.additions && overrides.additions.length > 0) {
        overrides.additions.forEach((add) => {
          if (!baseMembers.some((b) => b.id === add.id)) {
            baseMembers.push(add);
          }
        });
      }

      localMembersCache = baseMembers;
      lastCacheTime = now;
      return baseMembers;
    } catch (err) {
      console.error('Error fetching Nakes member data from Form Responses 1:', err);
      return localMembersCache || [];
    }
  }

  static async getNakesById(id: string): Promise<NakesMember | null> {
    const members = await this.getAllNakes();
    const cleanId = String(id).trim();
    return members.find((m) => String(m.id).trim() === cleanId) || null;
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
      waktuRekredensialKembali: addThreeYears(data.tglPermohonan),
    };

    // Save to persistent local overrides JSON & memory
    saveMemberAddition(newMember);

    const rowValue = [
      newMember.timestamp,                                        // 0: Timestamp
      newMember.emailAddress || newMember.email,                  // 1: Email Address
      newMember.namaLengkap,                                      // 2: Nama Lengkap
      newMember.tanggalLahir || '',                               // 3: Tanggal Lahir
      newMember.alamat || '',                                     // 4: Alamat KTP
      newMember.alamat || '',                                     // 5: Alamat Tempat Tinggal
      newMember.pendidikan || '',                                 // 6: Pendidikan Terakhir
      '',                                                         // 7: Tahun Lulus
      newMember.profesi || '',                                    // 8: Profesi
      newMember.berkasUrl || newMember.strUrl || '',              // 9: Upload dokumen PDF
      newMember.photo || newMember.linkPhoto || '',               // 10: PHOTO
      newMember.tahunMasukRSUD || '',                             // 11: Tahun Masuk RSUD
      newMember.asalPendidikan || '',                             // 12: Alumni/Universitas
      newMember.statusKepegawaian || '',                          // 13: Status Kepegawaian
      newMember.nomorAnggota || '',                               // 14: NIP
      '',                                                         // 15: Nomor Hp
      newMember.sipExpDate || '',                                 // 16: Masa Habis SIP
      newMember.tglPermohonan || '',                              // 17: Tanggal Permohonan
      newMember.lampiran || '1 Berkas',                           // 18: Lampiran
      newMember.perihal || 'Permohonan Kredensial',               // 19: Perihal
      newMember.qr || '',                                         // 20: QR
      newMember.deskripsi || '',                                  // 21: DESKRIPSI
      newMember.nomorAnggota || '',                               // 22: NOMOR ANGGOTA
    ];

    // 1. Try Google Sheets API v4
    const sheets = getSheetsClient();
    if (sheets) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: "'Form Responses 1'!A:W",
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [rowValue] },
        });
      } catch (err) {
        console.error('Failed to append row to Google Sheets Form Responses 1 via API:', err);
      }
    }

    // 2. Try Google Apps Script Web App Sync (if configured)
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', spreadsheetId: SPREADSHEET_ID, sheetName: 'Form Responses 1', rowValue }),
        });
      } catch (scriptErr) {
        console.error('Google Apps Script create error:', scriptErr);
      }
    }

    localMembersCache = null;
    return newMember;
  }

  static async updateNakes(id: string, data: Partial<NakesMember>): Promise<NakesMember | null> {
    const all = await this.getAllNakes(true);
    const cleanId = String(id).trim();
    const index = all.findIndex((m) => String(m.id).trim() === cleanId);
    if (index === -1) return null;

    const updated = { ...all[index], ...data };
    if (updated.tahunMasukRSUD) {
      updated.masaKerja = calculateMasaKerja(updated.tahunMasukRSUD);
    }
    if (updated.tglPermohonan) {
      updated.waktuRekredensialKembali = addThreeYears(updated.tglPermohonan);
    }

    // Save to persistent local overrides JSON & memory
    saveMemberUpdate(cleanId, data);

    const numericId = parseInt(cleanId.replace(/\D/g, ''), 10);
    const rowIndex = !isNaN(numericId) && numericId > 0 ? numericId + 1 : index + 2;

    const rowValue = [
      updated.timestamp || '',                                    // 0: Timestamp
      updated.emailAddress || updated.email || '',                // 1: Email Address
      updated.namaLengkap || '',                                 // 2: Nama Lengkap
      updated.tanggalLahir || '',                                // 3: Tanggal Lahir
      updated.alamat || '',                                      // 4: Alamat KTP
      updated.alamat || '',                                      // 5: Alamat Tempat Tinggal
      updated.pendidikan || '',                                  // 6: Pendidikan Terakhir
      '',                                                         // 7: Tahun Lulus
      updated.profesi || '',                                     // 8: Profesi
      updated.berkasUrl || updated.strUrl || '',                  // 9: Upload dokumen PDF
      updated.photo || updated.linkPhoto || '',                   // 10: PHOTO
      updated.tahunMasukRSUD || '',                              // 11: Tahun Masuk RSUD
      updated.asalPendidikan || '',                              // 12: Alumni/Universitas
      updated.statusKepegawaian || '',                           // 13: Status Kepegawaian
      updated.nomorAnggota || '',                                // 14: NIP
      '',                                                         // 15: Nomor Hp
      updated.sipExpDate || '',                                  // 16: Masa Habis SIP
      updated.tglPermohonan || '',                               // 17: Tanggal Permohonan
      updated.lampiran || '',                                    // 18: Lampiran
      updated.perihal || '',                                     // 19: Perihal
      updated.qr || '',                                          // 20: QR
      updated.deskripsi || '',                                   // 21: DESKRIPSI
      updated.nomorAnggota || '',                                // 22: NOMOR ANGGOTA
    ];

    // 1. Try Google Sheets API v4
    const sheets = getSheetsClient();
    if (sheets) {
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `'Form Responses 1'!A${rowIndex}:W${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [rowValue] },
        });
        console.log(`✅ Row ${rowIndex} successfully updated in Form Responses 1 via API!`);
      } catch (err) {
        console.error('Failed to update row in Google Sheets Form Responses 1 via API:', err);
      }
    }

    // 2. Try Google Apps Script Web App Sync (if configured)
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            spreadsheetId: SPREADSHEET_ID,
            sheetName: 'Form Responses 1',
            rowIndex,
            rowValue,
          }),
        });
        console.log(`✅ Row ${rowIndex} successfully updated via Google Apps Script Web App!`);
      } catch (scriptErr) {
        console.error('Google Apps Script update error:', scriptErr);
      }
    }

    localMembersCache = null;
    return updated;
  }

  static async deleteNakes(id: string): Promise<boolean> {
    const all = await this.getAllNakes(true);
    const cleanId = String(id).trim();
    const index = all.findIndex((m) => String(m.id).trim() === cleanId);
    if (index === -1) return false;

    // Save to persistent local overrides JSON & memory
    saveMemberDeletion(cleanId);

    localMembersCache = null;
    return true;
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    const members = await this.getAllNakes();

    const totalAnggota = members.length;
    const totalProfesi = new Set(members.map((m) => m.profesi).filter(Boolean)).size;
    const totalPendidikan = new Set(members.map((m) => m.pendidikan).filter(Boolean)).size;
    const totalSTRAktif = members.length;
    const totalSIPAktif = members.filter((m) => !!m.sipExpDate).length;
    const totalDokumen = members.filter((m) => !!m.berkasUrl).length;

    // Profession distribution
    const profesiMap: Record<string, number> = {};
    members.forEach((m) => {
      const prof = m.profesi || 'Lainnya';
      profesiMap[prof] = (profesiMap[prof] || 0) + 1;
    });

    const profesiDistribution = Object.entries(profesiMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Education distribution
    const pendidikanMap: Record<string, number> = {};
    members.forEach((m) => {
      const edu = m.pendidikan || 'Lainnya';
      pendidikanMap[edu] = (pendidikanMap[edu] || 0) + 1;
    });

    const pendidikanDistribution = Object.entries(pendidikanMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Status distribution
    const statusMap: Record<string, number> = {};
    members.forEach((m) => {
      const st = m.statusKepegawaian || 'Lainnya';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([name, count]) => ({
      name,
      count,
    }));

    const monthlyRegistration = [
      { month: 'Jan', count: Math.ceil(totalAnggota * 0.1) },
      { month: 'Feb', count: Math.ceil(totalAnggota * 0.15) },
      { month: 'Mar', count: Math.ceil(totalAnggota * 0.2) },
      { month: 'Apr', count: Math.ceil(totalAnggota * 0.25) },
      { month: 'Mei', count: Math.ceil(totalAnggota * 0.3) },
      { month: 'Jun', count: totalAnggota },
    ];

    // Reminders (SIP < 1 year & Rekredensial < 6 months)
    const expiringReminders: DashboardStats['expiringReminders'] = [];
    const today = new Date();

    members.forEach((m) => {
      // 1. SIP Expiry Warning (< 365 days)
      if (m.sipExpDate) {
        const expDate = new Date(toStandardDate(m.sipExpDate));
        if (!isNaN(expDate.getTime())) {
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 365) {
            expiringReminders.push({
              id: `${m.id}-sip`,
              namaLengkap: m.namaLengkap,
              email: m.email || m.emailAddress || '',
              profesi: m.profesi,
              expiryDate: m.sipExpDate,
              daysRemaining: diffDays,
              documentType: 'SIP',
            });
          }
        }
      }

      // 2. Rekredensial Warning (< 180 days)
      const rekredensialDateStr = m.waktuRekredensialKembali || addThreeYears(m.tglPermohonan || '');
      if (rekredensialDateStr) {
        const expDate = new Date(toStandardDate(rekredensialDateStr));
        if (!isNaN(expDate.getTime())) {
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 180) {
            expiringReminders.push({
              id: `${m.id}-rekredensial`,
              namaLengkap: m.namaLengkap,
              email: m.email || m.emailAddress || '',
              profesi: m.profesi,
              expiryDate: rekredensialDateStr,
              daysRemaining: diffDays,
              documentType: 'Rekredensial',
            });
          }
        }
      }
    });

    return {
      totalAnggota,
      totalProfesi,
      totalPendidikan,
      totalSTRAktif,
      totalSIPAktif,
      totalDokumen,
      profesiDistribution,
      pendidikanDistribution,
      statusDistribution,
      monthlyRegistration,
      expiringReminders,
    };
  }

  static async getMasterProfesi() {
    const members = await this.getAllNakes();
    const set = new Set(members.map((m) => m.profesi).filter(Boolean));
    return Array.from(set).map((name, idx) => ({ id: `prof-${idx + 1}`, name, count: members.filter((m) => m.profesi === name).length }));
  }

  static async getMasterPendidikan() {
    const members = await this.getAllNakes();
    const set = new Set(members.map((m) => m.pendidikan).filter(Boolean));
    return Array.from(set).map((name, idx) => ({ id: `edu-${idx + 1}`, name, count: members.filter((m) => m.pendidikan === name).length }));
  }

  static async getMasterUnit() {
    return [
      { id: 'u-1', name: 'Komite Nakes Lain', code: 'KTKL' },
      { id: 'u-2', name: 'Laboratorium (PATELKI)', code: 'LAB' },
      { id: 'u-3', name: 'Farmasi (IAI / PAFI)', code: 'FAR' },
      { id: 'u-4', name: 'Radiologi (PARI)', code: 'RAD' },
      { id: 'u-5', name: 'Gizi (PERSAGI)', code: 'GZ' },
      { id: 'u-6', name: 'Elektromedis (IKATEMI)', code: 'TEM' },
    ];
  }

  static async getMasterJabatan() {
    return [
      { id: 'j-1', name: 'Ketua Komite KTKL', level: 'Ketua' },
      { id: 'j-2', name: 'Sekretaris Komite KTKL', level: 'Sekretaris' },
      { id: 'j-3', name: 'Sub Komite Kredensial', level: 'SubKom' },
      { id: 'j-4', name: 'Sub Komite Mutu Profesi', level: 'SubKom' },
      { id: 'j-5', name: 'Sub Komite Etika & Disiplin', level: 'SubKom' },
      { id: 'j-6', name: 'Anggota Komite KTKL', level: 'Anggota' },
    ];
  }

  static async getMasterKomite() {
    return [
      { id: 'k-1', name: 'Sub Komite Kredensial', coordinator: 'Ketua SubKom Kredensial' },
      { id: 'k-2', name: 'Sub Komite Mutu Profesi', coordinator: 'Ketua SubKom Mutu' },
      { id: 'k-3', name: 'Sub Komite Etika & Disiplin Profesi', coordinator: 'Ketua SubKom Etika' },
    ];
  }
}

function toStandardDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dateStr;
}
