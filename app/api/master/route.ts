import { NextResponse } from 'next/server';
import { NakesRepository } from '@/repositories/nakesRepository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'profesi';

  try {
    let data;
    switch (type) {
      case 'pendidikan':
        data = await NakesRepository.getMasterPendidikan();
        break;
      case 'unit':
        data = await NakesRepository.getMasterUnit();
        break;
      case 'jabatan':
        data = await NakesRepository.getMasterJabatan();
        break;
      case 'komite':
        data = await NakesRepository.getMasterKomite();
        break;
      case 'profesi':
      default:
        data = await NakesRepository.getMasterProfesi();
        break;
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
