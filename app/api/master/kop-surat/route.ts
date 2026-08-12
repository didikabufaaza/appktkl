import { NextResponse } from 'next/server';
import { readKopSurat, writeKopSurat } from '@/lib/localStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = readKopSurat();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    writeKopSurat(body);
    return NextResponse.json({ success: true, message: 'Kop Surat berhasil diperbarui!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
