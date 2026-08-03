import { NextResponse } from 'next/server';
import { NakesRepository } from '@/repositories/nakesRepository';

export async function GET() {
  try {
    const stats = await NakesRepository.getDashboardStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('API /api/dashboard error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
