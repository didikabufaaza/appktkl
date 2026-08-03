import { NextResponse } from 'next/server';
import { readPermissionOverrides, savePermissionOverride } from '@/lib/localStore';
import { NakesRepository } from '@/repositories/nakesRepository';
import { SUPERADMIN_PERMISSIONS, ADMIN_PERMISSIONS, DEFAULT_USER_PERMISSIONS } from '@/services/authService';

export async function GET() {
  try {
    const overrides = readPermissionOverrides();
    const members = await NakesRepository.getAllNakes();

    const accountList = [
      {
        id: 'usr-superadmin',
        email: 'superadmin@rsudokut.go.id',
        nama: 'Super Admin KTKL',
        role: 'superadmin',
        profesi: 'Superadmin',
        permissions: SUPERADMIN_PERMISSIONS,
      },
      {
        id: 'usr-admin',
        email: 'admin@rsudokut.go.id',
        nama: 'Administrator Komite KTKL',
        role: 'admin',
        profesi: 'Administrator',
        permissions: ADMIN_PERMISSIONS,
      },
      ...members.map((m) => {
        const custom = overrides[m.email.toLowerCase()] || overrides[m.id];
        return {
          id: m.id,
          email: m.email || m.emailAddress || `nakes-${m.id}@rsudokut.go.id`,
          nama: m.namaLengkap,
          role: 'user',
          profesi: m.profesi,
          permissions: custom ? { ...DEFAULT_USER_PERMISSIONS, ...custom } : DEFAULT_USER_PERMISSIONS,
        };
      }),
    ];

    return NextResponse.json({ success: true, data: accountList });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrId, permissions } = body;

    if (!emailOrId || !permissions) {
      return NextResponse.json({ success: false, message: 'Parameter emailOrId dan permissions wajib diisi.' }, { status: 400 });
    }

    savePermissionOverride(emailOrId, permissions);
    return NextResponse.json({ success: true, message: `🎉 Hak akses untuk ${emailOrId} BERHASIL DIPERBARUI!` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
