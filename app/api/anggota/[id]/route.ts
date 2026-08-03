import { NextResponse } from 'next/server';
import { NakesRepository } from '@/repositories/nakesRepository';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const member = await NakesRepository.getNakesById(id);
    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Anggota tidak ditemukan.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: member });
  } catch (error: any) {
    console.error('API GET /api/anggota/:id error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await NakesRepository.updateNakes(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Anggota tidak ditemukan untuk diupdate.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API PUT /api/anggota/:id error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const success = await NakesRepository.deleteNakes(id);
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Anggota tidak ditemukan untuk dihapus.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus.' });
  } catch (error: any) {
    console.error('API DELETE /api/anggota/:id error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
