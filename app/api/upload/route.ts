import { NextResponse } from 'next/server';
import { GDriveRepository } from '@/repositories/gdriveRepository';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan PDF, JPG, PNG, atau JPEG.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await GDriveRepository.uploadFile(
      buffer,
      file.name,
      file.type
    );

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        mimeType: file.type,
        fileId: uploaded.fileId,
        url: uploaded.webViewLink,
      },
    });
  } catch (error: any) {
    console.error('API /api/upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
