import { NextResponse } from 'next/server';
import { fetchPublicSheetData, getSheetsClient, SPREADSHEET_ID } from '@/lib/googleSheets';
import { readRkkData, writeRkkData, readDeletedRkkIds, saveDeletedRkkId } from '@/lib/localStore';
import { RkkItem, RkkChecklistRow } from '@/types/nakes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

async function getRkkFromSheet(): Promise<RkkItem[]> {
  try {
    const rows = await fetchPublicSheetData('RKK');
    if (!rows || rows.length < 2) return [];

    const dataRows = rows.slice(1);
    return dataRows
      .filter((row) => row && row[0])
      .map((row) => {
        let checklistData: RkkChecklistRow[] = [];
        try {
          checklistData = JSON.parse(String(row[7] || '[]'));
        } catch (e) {
          checklistData = [];
        }

        return {
          id: String(row[0] || '').trim(),
          memberId: String(row[1] || '').trim(),
          nama: String(row[2] || '').trim(),
          nip: String(row[3] || '').trim(),
          profesi: String(row[4] || '').trim(),
          kualifikasi: String(row[5] || '').trim(),
          alumni: String(row[6] || '').trim(),
          checklistData,
          tanggal: String(row[8] || '').trim(),
          namaPemohon: String(row[9] || '').trim(),
          namaAsesor: String(row[10] || '').trim(),
          nipAsesor: String(row[11] || '').trim(),
          status: (String(row[12] || 'Disetujui').trim() as any) || 'Disetujui',
          updatedAt: String(row[13] || '').trim(),
        };
      });
  } catch (err) {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const profesi = searchParams.get('profesi');

    const deletedSet = new Set(readDeletedRkkIds());
    const sheetItems = await getRkkFromSheet();
    const localItems = readRkkData();

    // Merge: sheet items + local items (avoid duplicate id, newer updatedAt wins)
    const map = new Map<string, RkkItem>();
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
      results = results.filter((r) => r.memberId === memberId);
    }
    if (profesi) {
      const q = profesi.toLowerCase();
      results = results.filter((r) => r.profesi.toLowerCase().includes(q));
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const itemsToSave: RkkItem[] = Array.isArray(body) ? body : [body];

    if (itemsToSave.length === 0) {
      return NextResponse.json({ success: false, message: 'Data RKK kosong.' }, { status: 400 });
    }

    const currentLocal = readRkkData();
    const map = new Map<string, RkkItem>();
    currentLocal.forEach((item) => map.set(item.id, item));

    const processedItems: RkkItem[] = [];

    for (const item of itemsToSave) {
      const id = item.id || `RKK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const processed: RkkItem = {
        ...item,
        id,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
      map.set(id, processed);
      processedItems.push(processed);

      const rowValue = [
        processed.id,
        processed.memberId || '',
        processed.nama,
        processed.nip || '',
        processed.profesi,
        processed.kualifikasi || '',
        processed.alumni || '',
        JSON.stringify(processed.checklistData || []),
        processed.tanggal || '',
        processed.namaPemohon || '',
        processed.namaAsesor || '',
        processed.nipAsesor || '',
        processed.status || 'Disetujui',
        processed.updatedAt,
      ];

      // 1. Try Google Sheets API direct update/append
      const sheets = getSheetsClient();
      if (sheets) {
        try {
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'RKK'!A:A",
          });
          const rows = res.data.values || [];
          const rowIndex = rows.findIndex((r: any) => r && String(r[0] || '').trim() === processed.id);
          if (rowIndex >= 0) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: SPREADSHEET_ID,
              range: `'RKK'!A${rowIndex + 1}:N${rowIndex + 1}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [rowValue] },
            });
          } else {
            await sheets.spreadsheets.values.append({
              spreadsheetId: SPREADSHEET_ID,
              range: "'RKK'!A:N",
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [rowValue] },
            });
          }
        } catch (err) {
          console.error('Direct Sheets API error for RKK:', err);
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
              sheetName: 'RKK',
              rowValue,
            }),
            redirect: 'follow',
          }).catch(() => {});
        } catch (e) {}
      }
    }

    writeRkkData(Array.from(map.values()));

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${processedItems.length} dokumen RKK!`,
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
      return NextResponse.json({ success: false, message: 'ID RKK wajib disertakan.' }, { status: 400 });
    }

    saveDeletedRkkId(id);

    // If Google Apps Script exists, try deleting remotely too
    if (GOOGLE_APPS_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteRowById',
            spreadsheetId: SPREADSHEET_ID,
            sheetName: 'RKK',
            id,
          }),
          redirect: 'follow',
        }).catch(() => {});
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: 'Dokumen RKK berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
