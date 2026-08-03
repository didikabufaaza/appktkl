import { NextResponse } from 'next/server';
import { NakesRepository } from '@/repositories/nakesRepository';

export async function GET() {
  try {
    const data = await NakesRepository.getAllNakes();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API GET /api/anggota error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.namaLengkap || !body.profesi || !body.pendidikan) {
      return NextResponse.json(
        { success: false, message: 'Nama Lengkap, Profesi, dan Pendidikan wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await NakesRepository.createNakes(body);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error('API POST /api/anggota error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
