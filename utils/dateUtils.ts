/**
 * Formats a Google Sheets Date string (e.g. Date(2024,7,27)) to DD/MM/YYYY
 */
export function formatDateString(val: any): string {
  if (!val) return '';
  if (typeof val === 'object' && val.v) val = val.v;
  const str = String(val).trim();
  if (str.startsWith('Date(')) {
    const matches = str.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const year = matches[0];
      const month = String(Number(matches[1]) + 1).padStart(2, '0');
      const day = String(matches[2]).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
  }
  return str;
}

/**
 * Calculates Waktu Rekredensial Kembali (+3 Years from Tgl Permohonan)
 */
export function addThreeYears(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '-';
  const str = dateStr.trim();
  let d: Date | null = null;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10) + 3;
      d = new Date(year, month, day);
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10) + 3;
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    }
  }

  if (!d || isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculates current tenure/length of service at hospital dynamically following real time.
 */
export function calculateMasaKerja(tahunMasuk?: string): string {
  if (!tahunMasuk || tahunMasuk.trim() === '' || tahunMasuk.trim() === '-') return '-';

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  let entryYear = currentYear;
  let entryMonth = 0; // default Jan

  const str = tahunMasuk.trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      entryYear = parseInt(parts[2], 10);
      entryMonth = parseInt(parts[1], 10) - 1;
    }
  } else if (str.length === 4 && !isNaN(Number(str))) {
    entryYear = parseInt(str, 10);
  }

  if (isNaN(entryYear) || entryYear > currentYear) return '-';

  const totalMonths = (currentYear - entryYear) * 12 + (currentMonth - entryMonth);
  if (totalMonths <= 0) return 'Kurang dari 1 Bln';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years > 0 && months > 0) {
    return `${years} Thn ${months} Bln`;
  } else if (years > 0) {
    return `${years} Tahun`;
  } else {
    return `${months} Bulan`;
  }
}
