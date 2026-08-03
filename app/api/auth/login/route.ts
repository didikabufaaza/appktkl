import { NextResponse } from 'next/server';
import { AuthService } from '@/services/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password, role } = body;

    const { user, token } = await AuthService.login({
      usernameOrEmail: usernameOrEmail || role || 'admin',
      password: password || '',
      role: role || undefined,
    });

    const response = NextResponse.json({
      success: true,
      data: user,
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed' },
      { status: 400 }
    );
  }
}
