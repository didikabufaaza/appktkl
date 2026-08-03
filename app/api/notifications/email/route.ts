import { NextResponse } from 'next/server';
import { triggerAllAutomatedEmails, sendNotificationEmail } from '@/utils/emailService';
import { initAutomatedEmailCron, getCronStatus } from '@/lib/emailCron';

// Initialize background automated email cron service on API route load
initAutomatedEmailCron();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const smtpUser = searchParams.get('smtpUser') || undefined;
    const smtpPass = searchParams.get('smtpPass') || undefined;

    const customSmtp = smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined;

    const result = await triggerAllAutomatedEmails(customSmtp);
    const cronInfo = getCronStatus();

    return NextResponse.json({
      success: true,
      message: `🎉 System Email Otomatis Berhasil Terkirim ke Seluruh Anggota! (Background Cron: ${cronInfo.lastRun})`,
      data: {
        ...result,
        cronStatus: cronInfo,
      },
    });
  } catch (error: any) {
    console.error('API GET /api/notifications/email error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, namaLengkap, type, expiryDate, smtpUser, smtpPass } = body;

    if (!namaLengkap || !type || !expiryDate) {
      return NextResponse.json(
        { success: false, message: 'Parameter namaLengkap, type, dan expiryDate wajib diisi.' },
        { status: 400 }
      );
    }

    const customSmtp = smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined;

    const result = await sendNotificationEmail(
      email || 'nakes@rsudokut.go.id',
      namaLengkap,
      type,
      expiryDate,
      customSmtp
    );

    return NextResponse.json({
      success: true,
      message: `🎉 Email pengingat ${type} BERHASIL TERKIRIM OTOMATIS ke ${namaLengkap} (${result.recipient})!`,
      data: result,
    });
  } catch (error: any) {
    console.error('API POST /api/notifications/email error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
