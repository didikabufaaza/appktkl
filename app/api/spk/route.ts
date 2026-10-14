import { NextResponse } from 'next/server';
import { fetchPublicSheetData, getSheetsClient, SPREADSHEET_ID } from '@/lib/googleSheets';
import { readSpkData, writeSpkData, readDeletedSpkIds, saveDeletedSpkId } from '@/lib/localStore';
import { SpkItem } from '@/types/nakes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

async function getSpkFromSheet(): Promise<SpkItem[]> {
  try {
    const rows = await fetchPublicSheetData('SPK');
    if (!rows || rows.length < 2) return [];

    const dataRows = rows.slice(1);
    return dataRows
      .filter((row) => row && row[0])
      .map((row) => ({
        id: String(row[0] || '').trim(),
        rkkId: String(row[1] || '').trim(),
        memberId: String(row[2] || '').trim(),
        nomorSurat: String(row[3] || '').trim(),
        nama: String(row[4] || '').trim(),
        gelar: String(row[5] || '').trim(),
        kualifikasi: String(row[6] || '').trim(),
        profesi: String(row[7] || '').trim(),
        pelayanan: String(row[8] || '').trim(),
        masaBerlakuTahun: String(row[9] || '3 (tiga) tahun').trim(),
        tanggalDitetapkan: String(row[10] || '').trim(),
        tempatDitetapkan: String(row[11] || 'TULUS AYU').trim(),
        namaDirektur: String(row[12] || 'dr. Sugihartono, M.Sc.').trim(),
        pangkatDirektur: String(row[13] || 'Penata TK. I/ III d').trim(),
        nipDirektur: String(row[14] || '197606302005011003').trim(),
        updatedAt: String(row[15] || '').trim(),
      }));
  } catch (err) {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const rkkId = searchParams.get('rkkId');
    const profesi = searchParams.get('profesi');

    const deletedSet = new Set(readDeletedSpkIds());
    const sheetItems = await getSpkFromSheet();
    const localItems = readSpkData();

    // Merge: sheet items + local items (avoid duplicate id, newer updatedAt wins)
    const map = new Map<string, SpkItem>();
    sheetItems.forEach((item) => {
      if (!deletedSet.has(item.id)) map.set(item.id, item);
    });
    localItems.forEach((item) => {
      if (!deletedSet.has(item.id)) {
        const existing = map.get(item.id);
        if (!existing) {
          map.set(item.id, item);
        } else {
          const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const localTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
          if (localTime >= existingTime) {
            map.set(item.id, item);
          }
        }
      }
    });

    let results = Array.from(map.values());

    if (memberId) {
      results = results.filter((s) => s.memberId === memberId);
    }
    if (rkkId) {
      results = results.filter((s) => s.rkkId === rkkId);
    }
    if (profesi) {
      const q = profesi.toLowerCase();
      results = results.filter((s) => s.profesi.toLowerCase().includes(q));
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const itemsToSave: SpkItem[] = Array.isArray(body) ? body : [body];

    if (itemsToSave.length === 0) {
      return NextResponse.json({ success: false, message: 'Data SPK kosong.' }, { status: 400 });
    }

    const currentLocal = readSpkData();
    const map = new Map<string, SpkItem>();
    currentLocal.forEach((item) => map.set(item.id, item));

    const processedItems: SpkItem[] = [];

    for (const item of itemsToSave) {
      const id = item.id || `SPK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const processed: SpkItem = {
        ...item,
        id,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
      map.set(id, processed);
      processedItems.push(processed);

      const rowValue = [
        processed.id,
        processed.rkkId || '',
        processed.memberId || '',
        processed.nomorSurat,
        processed.nama,
        processed.gelar || '',
        processed.kualifikasi,
        processed.profesi,
        processed.pelayanan || '',
        processed.masaBerlakuTahun || '3 (tiga) tahun',
        processed.tanggalDitetapkan,
        processed.tempatDitetapkan || 'TULUS AYU',
        processed.namaDirektur,
        processed.pangkatDirektur || '',
        processed.nipDirektur || '',
        processed.updatedAt,
      ];

      // 1. Try Google Sheets API direct update/append
      const sheets = getSheetsClient();
      if (sheets) {
        try {
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'SPK'!A:A",
          });
          const rows = res.data.values || [];
          const rowIndex = rows.findIndex((r: any) => r && String(r[0] || '').trim() === processed.id);
          if (rowIndex >= 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: SPREADSHEET_ID,
              range: `'SPK'!A${rowIndex + 1}:P${rowIndex + 1}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [rowValue] },
            });
          } else {
            await sheets.spreadsheets.values.append({
              spreadsheetId: SPREADSHEET_ID,
              range: "'SPK'!A:P",
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [rowValue] },
            });
          }
        } catch (err) {
          console.error('Direct Sheets API error for SPK:', err);
        }
      }

      // 2. Try Google Apps Script fallback if configured
      if (GOOGLE_APPS_SCRIPT_URL) {
        try {
          await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'appendOrUpdate',
              spreadsheetId: SPREADSHEET_ID,
              sheetName: 'SPK',
              rowValue,
            }),
            redirect: 'follow',
          }).catch(() => {});
        } catch (e) {}
      }
    }

    writeSpkData(Array.from(map.values()));

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${processedItems.length} dokumen SPK!`,
      data: processedItems,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID SPK wajib disertakan.' }, { status: 400 });
    }

    saveDeletedSpkId(id);

    // If Google Apps Script exists, try deleting remotely too
    if (GOOGLE_APPS_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteRowById',
            spreadsheetId: SPREADSHEET_ID,
            sheetName: 'SPK',
            id,
          }),
          redirect: 'follow',
        }).catch(() => {});
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: 'Dokumen SPK berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
