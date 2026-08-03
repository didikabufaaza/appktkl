import nodemailer from 'nodemailer';
import { NakesRepository } from '@/repositories/nakesRepository';

export interface EmailNotificationResult {
  recipient: string;
  namaLengkap: string;
  type: 'SIP' | 'Rekredensial';
  expiryDate: string;
  message: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  errorDetails?: string;
  gmailComposeUrl?: string;
}

export interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
}

function parseIndonesianDateParts(dateStr: string) {
  if (!dateStr) return { day: '-', month: '-', year: '-' };
  const str = dateStr.trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      return { day: parts[0], month: parts[1], year: parts[2] };
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      return { day: parts[2], month: parts[1], year: parts[0] };
    }
  }
  return { day: dateStr, month: '', year: '' };
}

export function createTransporter(customSmtp?: SmtpConfig) {
  const host = customSmtp?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(customSmtp?.port || process.env.SMTP_PORT) || 587;
  const user = customSmtp?.user || process.env.SMTP_USER || 'abufaaza01@gmail.com';
  const pass = customSmtp?.pass || process.env.SMTP_PASS || 'phzyoddbmngyjbcc';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export function generateGmailComposeUrl(toEmail: string, subject: string, bodyText: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

export async function sendNotificationEmail(
  toEmail: string,
  namaLengkap: string,
  type: 'SIP' | 'Rekredensial',
  expiryDate: string,
  customSmtp?: SmtpConfig
): Promise<EmailNotificationResult> {
  const { day, month, year } = parseIndonesianDateParts(expiryDate);

  let message = '';
  let subject = '';

  if (type === 'SIP') {
    subject = `Peringatan Masa SIP Berakhir - Komite KTKL RSUD OKU TIMUR`;
    message = `Komite KTKL RSUD OKU TIMUR mengingatkan bahwa masa SIP anda akan segera berakhir pada tgl ${day} bln ${month} tahun ${year}.`;
  } else {
    subject = `Peringatan Waktu Rekredensial Kembali - Komite KTKL RSUD OKU TIMUR`;
    message = `Komite KTKL RSUD OKU TIMUR mengingatkan bahwa waktu rekredensial kembali anda pada tgl ${day} bln ${month} tahun ${year}.`;
  }

  const fullEmailBody = `Yth. ${namaLengkap},\n\n${message}\n\nMohon untuk segera mempersiapkan dan melengkapi berkas yang diperlukan.\n\nSalam,\nKomite Tenaga Kesehatan Lain RSUD OKU TIMUR`;
  const gmailComposeUrl = generateGmailComposeUrl(toEmail, subject, fullEmailBody);

  // 1. Attempt SMTP Transporter first if custom or ENV credentials exist
  const transporter = createTransporter(customSmtp);
  if (transporter && toEmail && toEmail.includes('@')) {
    try {
      const fromUser = customSmtp?.user || process.env.SMTP_USER || '';
      await transporter.sendMail({
        from: `"Komite KTKL RSUD OKU TIMUR" <${fromUser}>`,
        to: toEmail,
        subject: subject,
        text: fullEmailBody,
      });
      return {
        recipient: toEmail,
        namaLengkap,
        type,
        expiryDate,
        message,
        status: 'SENT',
        gmailComposeUrl,
      };
    } catch (err: any) {
      console.error(`SMTP Send failed to ${toEmail}:`, err);
      let errorDetails = err.message || String(err);
      if (errorDetails.includes('535') || errorDetails.includes('Username and Password not accepted')) {
        errorDetails = 'Google menolak login (535 Bad Credentials). Jika menggunakan Gmail, wajib gunakan Password Aplikasi 16 Karakter (Google Account -> Keamanan -> Sandi Aplikasi). Atau gunakan tombol Kirim via Gmail Web (1-Klik) di bawah.';
      }
      return {
        recipient: toEmail,
        namaLengkap,
        type,
        expiryDate,
        message,
        status: 'FAILED',
        errorDetails: errorDetails,
        gmailComposeUrl,
      };
    }
  }

  // 2. Unconfigured SMTP (Returns SIMULATED status with Gmail Web 1-Click Link)
  console.log(`[SIMULATED EMAIL TRIGGER] To: ${toEmail} (${namaLengkap}) | "${message}"`);

  return {
    recipient: toEmail || 'nakes@rsudokut.go.id',
    namaLengkap,
    type,
    expiryDate,
    message,
    status: 'SIMULATED',
    errorDetails: 'Server belum dikonfigurasi SMTP_USER & SMTP_PASS (App Password). Gunakan tombol "Kirim via Gmail Web (1-Klik)" di bawah untuk mengirim langsung!',
    gmailComposeUrl,
  };
}

export async function triggerAllAutomatedEmails(customSmtp?: SmtpConfig): Promise<{
  totalSent: number;
  totalSimulated: number;
  totalFailed: number;
  results: EmailNotificationResult[];
}> {
  const stats = await NakesRepository.getDashboardStats();
  const reminders = stats.expiringReminders;
  const results: EmailNotificationResult[] = [];

  let totalSent = 0;
  let totalSimulated = 0;
  let totalFailed = 0;

  for (const item of reminders) {
    const res = await sendNotificationEmail(
      item.email || 'anggota@rsudokut.go.id',
      item.namaLengkap,
      item.documentType === 'Rekredensial' ? 'Rekredensial' : 'SIP',
      item.expiryDate,
      customSmtp
    );
    if (res.status === 'SENT') totalSent++;
    else if (res.status === 'SIMULATED') totalSimulated++;
    else if (res.status === 'FAILED') totalFailed++;
    results.push(res);
  }

  return {
    totalSent,
    totalSimulated,
    totalFailed,
    results,
  };
}
