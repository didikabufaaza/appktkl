import { NextResponse } from 'next/server';
import { NakesRepository } from '@/repositories/nakesRepository';
import { readUserOverrides, saveUserOverride, deleteUserOverride } from '@/lib/localStore';
import { SUPERADMIN_PERMISSIONS, ADMIN_PERMISSIONS, DEFAULT_USER_PERMISSIONS } from '@/services/authService';
import { UserOverride } from '@/types/nakes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const members = await NakesRepository.getAllNakes();
    const overrides = readUserOverrides();

    const usersList: any[] = [];

    // 1. Add built-in Superadmin
    const saOverride = overrides['superadmin'] || overrides['superadmin@rsudokut.go.id'];
    usersList.push({
      id: 'usr-superadmin',
      username: 'superadmin',
      nama: 'Super Admin KTKL',
      role: saOverride?.role || 'superadmin',
      email: 'superadmin@rsudokut.go.id',
      profesi: 'KOMITE',
      status: saOverride?.status || 'active',
      hasCustomPassword: !!saOverride?.password,
      permissions: {
        ...SUPERADMIN_PERMISSIONS,
        ...(saOverride?.permissions || {})
      }
    });

    // 2. Add built-in Admin
    const adOverride = overrides['admin'] || overrides['admin@rsudokut.go.id'];
    usersList.push({
      id: 'usr-admin',
      username: 'admin',
      nama: 'Administrator Komite KTKL',
      role: adOverride?.role || 'admin',
      email: 'admin@rsudokut.go.id',
      profesi: 'KOMITE',
      status: adOverride?.status || 'active',
      hasCustomPassword: !!adOverride?.password,
      permissions: {
        ...ADMIN_PERMISSIONS,
        ...(adOverride?.permissions || {})
      }
    });

    // 3. Add members
    members.forEach((m) => {
      const emailClean = (m.email || m.emailAddress || '').toLowerCase().trim();
      const mOverride = overrides[emailClean] || overrides[m.id];
      
      const role = mOverride?.role || 'user';
      let defaultPerms = DEFAULT_USER_PERMISSIONS;
      if (role === 'superadmin') defaultPerms = SUPERADMIN_PERMISSIONS;
      else if (role === 'admin') defaultPerms = ADMIN_PERMISSIONS;

      usersList.push({
        id: String(m.id),
        username: emailClean || `member-${m.id}`,
        nama: m.namaLengkap,
        role: role,
        email: emailClean || '-',
        profesi: m.profesi || '-',
        status: mOverride?.status || 'active',
        hasCustomPassword: !!mOverride?.password,
        permissions: {
          ...defaultPerms,
          ...(mOverride?.permissions || {})
        }
      });
    });

    return NextResponse.json({ success: true, data: usersList });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrId, role, status, password, permissions } = body;

    if (!emailOrId) {
      return NextResponse.json({ success: false, message: 'Email or ID is required' }, { status: 400 });
    }

    const cleanKey = String(emailOrId).toLowerCase().trim();
    const overrides = readUserOverrides();
    const existing = overrides[cleanKey] || {};

    const updatedOverride: UserOverride = {
      role: role !== undefined ? role : existing.role,
      status: status !== undefined ? status : existing.status,
      permissions: permissions !== undefined ? permissions : existing.permissions,
    };

    if (password !== undefined) {
      if (password.trim() === '') {
        // Clear custom password if empty string sent
        delete updatedOverride.password;
      } else {
        updatedOverride.password = password;
      }
    } else if (existing.password) {
      updatedOverride.password = existing.password;
    }

    saveUserOverride(cleanKey, updatedOverride);
    return NextResponse.json({ success: true, message: 'Pengaturan pengguna berhasil disimpan!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailOrId = searchParams.get('emailOrId');

    if (!emailOrId) {
      return NextResponse.json({ success: false, message: 'Email or ID is required' }, { status: 400 });
    }

    deleteUserOverride(emailOrId);
    return NextResponse.json({ success: true, message: 'Pengaturan khusus pengguna dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
