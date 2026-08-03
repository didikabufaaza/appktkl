import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '@/services/authService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const session = await AuthService.verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: session });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
