import { google } from 'googleapis';
import { SPREADSHEET_ID } from '@/lib/constants';

export function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return null;
  }

  // Sanitize escaped newlines in private key
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
}

export function getSheetsClient() {
  const auth = getGoogleAuth();
  if (!auth) return null;
  return google.sheets({ version: 'v4', auth });
}

export function getDriveClient() {
  const auth = getGoogleAuth();
  if (!auth) return null;
  return google.drive({ version: 'v3', auth });
}

export { SPREADSHEET_ID };

/**
 * Fallback reader for public Google Sheets when Service Account ENV is not yet provided.
 * Uses Google Sheets GViz endpoint.
 */
export async function fetchPublicSheetData(sheetName: string): Promise<any[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  
  if (!text.includes('{')) {
    throw new Error(`Failed to fetch sheet ${sheetName}`);
  }

  const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const json = JSON.parse(jsonStr);

  const rows: any[][] = [];

  // Extract columns (row 0)
  const headers = json.table.cols.map((c: any) => c ? (c.label || '') : '');
  rows.push(headers);

  // Extract row values
  json.table.rows.forEach((r: any) => {
    if (r && r.c) {
      const rowVal = r.c.map((cell: any) => {
        if (!cell) return '';
        if (cell.f) return cell.f;
        if (cell.v !== null && cell.v !== undefined) {
          // Handle Date(...) string format from gviz
          if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
            const matches = cell.v.match(/\d+/g);
            if (matches && matches.length >= 3) {
              const year = matches[0];
              const month = String(Number(matches[1]) + 1).padStart(2, '0');
              const day = String(matches[2]).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
          return String(cell.v);
        }
        return '';
      });
      rows.push(rowVal);
    }
  });

  return rows;
}
