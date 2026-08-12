import { UserSession, UserPermissions, UserOverride } from '@/types/nakes';
import { signJWT, verifyJWT } from '@/lib/jwt';
import { NakesRepository } from '@/repositories/nakesRepository';
import { readPermissionOverrides, readUserOverrides } from '@/lib/localStore';

export const SUPERADMIN_PERMISSIONS: UserPermissions = {
  canSendEmail: true,
  canExportExcelPdf: true,
  canPrint: true,
  canRegisterNew: true,
  canViewAllMembers: true,
  canAccessSpreadsheetSettings: true,
  canAccessMasterData: true,
  canEditMemberData: true,
  canDeleteMemberData: true,
  canAccessLetters: true,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  canSendEmail: false,
  canExportExcelPdf: false,
  canPrint: false,
  canRegisterNew: false,
  canViewAllMembers: true,
  canAccessSpreadsheetSettings: false,
  canAccessMasterData: true,
  canEditMemberData: true,
  canDeleteMemberData: false,
  canAccessLetters: false,
};

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canSendEmail: false,
  canExportExcelPdf: true,
  canPrint: true,
  canRegisterNew: false,
  canViewAllMembers: false,
  canAccessSpreadsheetSettings: false,
  canAccessMasterData: false,
  canEditMemberData: true,
  canDeleteMemberData: false,
  canAccessLetters: false,
};

export interface LoginRequest {
  usernameOrEmail: string;
  password?: string;
  role?: string;
}

export class AuthService {
  static async login(req: LoginRequest): Promise<{ user: UserSession; token: string }> {
    const inputUser = String(req.usernameOrEmail || '').trim().toLowerCase();
    const inputPass = String(req.password || '').trim();

    if (!inputUser) {
      throw new Error('Username atau Email wajib diisi.');
    }

    // Load user overrides for custom password, role, status (active/inactive)
    const userOverrides = readUserOverrides();

    // 1. Strict Check Superadmin
    if (inputUser === 'superadmin' || inputUser === 'superadmin@rsudokut.go.id') {
      const superadminOverride = userOverrides['superadmin'] || userOverrides['superadmin@rsudokut.go.id'];
      
      if (superadminOverride?.status === 'inactive') {
        throw new Error('Akun Superadmin dinonaktifkan oleh administrator.');
      }
      
      const expectedPassword = superadminOverride?.password || 'admin';
      if (inputPass && inputPass !== expectedPassword) {
        throw new Error('Password Superadmin salah.');
      }
      
      const user: UserSession = {
        id: 'usr-superadmin',
        username: 'superadmin',
        nama: 'Super Admin KTKL',
        role: 'superadmin',
        email: 'superadmin@rsudokut.go.id',
        permissions: {
          ...SUPERADMIN_PERMISSIONS,
          ...(superadminOverride?.permissions || {})
        },
      };
      const token = await signJWT(user);
      return { user, token };
    }

    // 2. Strict Check Admin
    if (inputUser === 'admin' || inputUser === 'admin@rsudokut.go.id') {
      const adminOverride = userOverrides['admin'] || userOverrides['admin@rsudokut.go.id'];
      
      if (adminOverride?.status === 'inactive') {
        throw new Error('Akun Admin dinonaktifkan oleh administrator.');
      }
      
      const expectedPassword = adminOverride?.password || 'admin';
      if (inputPass && inputPass !== expectedPassword) {
        throw new Error('Password Admin salah.');
      }
      
      const user: UserSession = {
        id: 'usr-admin',
        username: 'admin',
        nama: 'Administrator Komite KTKL',
        role: 'admin',
        email: 'admin@rsudokut.go.id',
        permissions: {
          ...ADMIN_PERMISSIONS,
          ...(adminOverride?.permissions || {})
        },
      };
      const token = await signJWT(user);
      return { user, token };
    }

    // 3. Database Member Authentication (Email = Username, Profesi = Password)
    const members = await NakesRepository.getAllNakes();
    const matchedMember = members.find((m) => {
      const email1 = String(m.email || '').trim().toLowerCase();
      const email2 = String(m.emailAddress || '').trim().toLowerCase();
      const nama = String(m.namaLengkap || '').trim().toLowerCase();
      const nomor = String(m.nomorAnggota || '').trim().toLowerCase();

      return (
        (email1 && email1 === inputUser) ||
        (email2 && email2 === inputUser) ||
        (nama && nama === inputUser) ||
        (nomor && nomor === inputUser)
      );
    });

    if (!matchedMember) {
      throw new Error('Email atau username tidak ditemukan di database anggota KTKL RSUD OKU TIMUR.');
    }

    const memberEmailClean = (matchedMember.email || matchedMember.emailAddress || '').toLowerCase().trim();
    const override = userOverrides[memberEmailClean] || userOverrides[matchedMember.id];

    // Check status active/inactive
    if (override && override.status === 'inactive') {
      throw new Error('Akun Anda dinonaktifkan oleh Administrator Komite KTKL.');
    }

    // Validate password (custom or default profession name)
    if (inputPass) {
      if (override && override.password) {
        // Custom password match
        if (inputPass !== override.password) {
          throw new Error('Password salah.');
        }
      } else {
        // Default profession match
        const memberProfesi = String(matchedMember.profesi || '').trim().toLowerCase();
        const isProfesiMatch =
          inputPass.toLowerCase() === memberProfesi ||
          inputPass.toLowerCase().includes(memberProfesi) ||
          memberProfesi.includes(inputPass.toLowerCase());

        if (!isProfesiMatch) {
          throw new Error(
            `Password salah. Gunakan nama profesi Anda (Contoh: ${matchedMember.profesi}) sebagai password.`
          );
        }
      }
    }

    // Calculate final role & permissions
    let finalRole = (override?.role || 'user') as 'superadmin' | 'admin' | 'user';
    let basePerms = DEFAULT_USER_PERMISSIONS;
    if (finalRole === 'superadmin') basePerms = SUPERADMIN_PERMISSIONS;
    else if (finalRole === 'admin') basePerms = ADMIN_PERMISSIONS;

    const userPermissions: UserPermissions = {
      ...basePerms,
      ...(override?.permissions || {})
    };

    const userEmail = memberEmailClean || `member-${matchedMember.id}@ktkl.local`;

    const user: UserSession = {
      id: `usr-member-${matchedMember.id}`,
      username: userEmail,
      nama: matchedMember.namaLengkap,
      role: finalRole,
      email: userEmail,
      memberId: String(matchedMember.id),
      profesi: matchedMember.profesi,
      permissions: userPermissions,
    };

    const token = await signJWT(user);
    return { user, token };
  }

  static async verifySession(token: string): Promise<UserSession | null> {
    const payload = await verifyJWT(token);
    if (!payload) return null;
    return payload as unknown as UserSession;
  }
}
