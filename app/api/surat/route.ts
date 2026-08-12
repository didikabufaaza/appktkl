import { NextResponse } from 'next/server';
import { fetchPublicSheetData } from '@/lib/googleSheets';
import { SPREADSHEET_ID } from '@/lib/constants';
import { SuratItem } from '@/types/nakes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

// Helper to fetch letters
async function getLetters(): Promise<SuratItem[]> {
  try {
    const rows = await fetchPublicSheetData('dbsurat');
    if (!rows || rows.length < 2) {
      return [];
    }
    // Check if the headers are present but rows are empty
    const dataRows = rows.slice(1);
    return dataRows
      .filter(row => row && row[0]) // Must have an ID
      .map((row, index) => ({
        id: String(row[0] || '').trim(),
        tipe: String(row[1] || 'keluar').trim() as 'masuk' | 'keluar',
        tanggal: String(row[2] || '').trim(),
        nomor: String(row[3] || '').trim(),
        sifat: String(row[4] || '').trim(),
        lampiran: String(row[5] || '').trim(),
        hal: String(row[6] || '').trim(),
        yth: String(row[7] || '').trim(),
        di: String(row[8] || '').trim(),
        isiSurat: String(row[9] || '').trim(),
        parafKabag: String(row[10] || '').trim(),
        parafKasubbag: String(row[11] || '').trim(),
        parafPelaksana: String(row[12] || '').trim(),
        penandatanganJabatan: String(row[13] || '').trim(),
        penandatanganNama: String(row[14] || '').trim(),
        penandatanganPangkat: String(row[15] || '').trim(),
        penandatanganNip: String(row[16] || '').trim(),
        lampiranFileUrl: String(row[17] || '').trim(),
        timestamp: String(row[18] || '').trim(),
      }));
  } catch (err) {
    console.error('Error fetching from dbsurat:', err);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipe = searchParams.get('tipe'); // 'masuk' or 'keluar'

    let letters = await getLetters();

    if (tipe) {
      letters = letters.filter(l => l.tipe === tipe);
    }

    return NextResponse.json({ success: true, data: letters });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, tipe, tanggal, nomor, sifat, lampiran, hal, yth, di, isiSurat, parafKabag, parafKasubbag, parafPelaksana, penandatanganJabatan, penandatanganNama, penandatanganPangkat, penandatanganNip, lampiranFileUrl } = body;

    if (!nomor || !hal || !yth || !isiSurat) {
      return NextResponse.json({ success: false, message: 'Nomor, Hal, Penerima Yth, dan Isi Surat wajib diisi.' }, { status: 400 });
    }

    const letters = await getLetters();
    
    let targetId = id;
    let rowIndex = -1;

    if (id) {
      // Edit mode
      rowIndex = letters.findIndex(l => l.id === id);
      if (rowIndex !== -1) {
        rowIndex = rowIndex + 2; // row 1 is header, index 0 is row 2
      } else {
        return NextResponse.json({ success: false, message: 'Surat tidak ditemukan.' }, { status: 404 });
      }
    } else {
      // Create mode
      targetId = `SRT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      rowIndex = letters.length + 2;
    }

    const rowValue = [
      targetId,
      tipe || 'keluar',
      tanggal || '',
      nomor,
      sifat || 'Biasa',
      lampiran || '',
      hal,
      yth,
      di || '',
      isiSurat,
      parafKabag || '',
      parafKasubbag || '',
      parafPelaksana || '',
      penandatanganJabatan || '',
      penandatanganNama || '',
      penandatanganPangkat || '',
      penandatanganNip || '',
      lampiranFileUrl || '',
      new Date().toISOString()
    ];

    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json({ success: false, message: 'Google Apps Script URL is not configured.' }, { status: 500 });
    }

    // Write headers if sheet was completely empty
    if (letters.length === 0 && rowIndex === 2) {
      const headers = [
        "id", "tipe", "tanggal", "nomor", "sifat", "lampiran", "hal", 
        "yth", "di", "isiSurat", "parafKabag", "parafKasubbag", 
        "parafPelaksana", "penandatanganJabatan", "penandatanganNama", 
        "penandatanganPangkat", "penandatanganNip", "lampiranFileUrl", "timestamp"
      ];
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'update',
          spreadsheetId: SPREADSHEET_ID,
          sheetName: 'dbsurat',
          rowIndex: 1,
          rowValue: headers
        }),
        redirect: 'follow'
      });
    }

    // Write letter row
    const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'update',
        spreadsheetId: SPREADSHEET_ID,
        sheetName: 'dbsurat',
        rowIndex,
        rowValue
      }),
      redirect: 'follow'
    });

    const result = await res.json();

    if (result.status === 'success') {
      return NextResponse.json({ success: true, message: 'Surat berhasil disimpan!', id: targetId });
    } else {
      return NextResponse.json({ success: false, message: result.message || 'Gagal menyimpan ke Google Spreadsheet.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('POST /api/surat error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const letters = await getLetters();
    const index = letters.findIndex(l => l.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Surat tidak ditemukan.' }, { status: 404 });
    }

    const rowIndex = index + 2;

    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json({ success: false, message: 'Google Apps Script URL is not configured.' }, { status: 500 });
    }

    // Write empty array to "delete" (blank out) the row
    const emptyRow = Array(19).fill('');

    const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'update',
        spreadsheetId: SPREADSHEET_ID,
        sheetName: 'dbsurat',
        rowIndex,
        rowValue: emptyRow
      }),
      redirect: 'follow'
    });

    const result = await res.json();

    if (result.status === 'success') {
      return NextResponse.json({ success: true, message: 'Surat berhasil dihapus!' });
    } else {
      return NextResponse.json({ success: false, message: result.message || 'Gagal menghapus dari Google Spreadsheet.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('DELETE /api/surat error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
