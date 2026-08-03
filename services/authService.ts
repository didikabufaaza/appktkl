import { UserSession, UserPermissions } from '@/types/nakes';
import { signJWT, verifyJWT } from '@/lib/jwt';
import { NakesRepository } from '@/repositories/nakesRepository';
import { readPermissionOverrides } from '@/lib/localStore';

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
};

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canSendEmail: false,
  canExportExcelPdf: true, // Can download PDF & Excel of own profile
  canPrint: true, // Can print digital member card
  canRegisterNew: false,
  canViewAllMembers: false, // Private data isolation: Only view own profile
  canAccessSpreadsheetSettings: false,
  canAccessMasterData: false,
  canEditMemberData: true, // Can edit own profile!
  canDeleteMemberData: false, // CANNOT delete!
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

    // 1. Check Superadmin
    if (
      inputUser === 'superadmin' ||
      inputUser === 'superadmin@rsudokut.go.id' ||
      req.role === 'superadmin'
    ) {
      const user: UserSession = {
        id: 'usr-superadmin',
        username: 'superadmin',
        nama: 'Super Admin KTKL',
        role: 'superadmin',
        email: 'superadmin@rsudokut.go.id',
        permissions: SUPERADMIN_PERMISSIONS,
      };
      const token = await signJWT(user);
      return { user, token };
    }

    // 2. Check Admin
    if (
      inputUser === 'admin' ||
      inputUser === 'admin@rsudokut.go.id' ||
      req.role === 'admin'
    ) {
      const user: UserSession = {
        id: 'usr-admin',
        username: 'admin',
        nama: 'Administrator Komite KTKL',
        role: 'admin',
        email: 'admin@rsudokut.go.id',
        permissions: ADMIN_PERMISSIONS,
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
      return (email1 && email1 === inputUser) || (email2 && email2 === inputUser) || nama === inputUser;
    });

    if (matchedMember) {
      // Validate profession name as password (case-insensitive check or fallback)
      const memberProfesi = String(matchedMember.profesi || '').trim().toLowerCase();

      if (inputPass && memberProfesi && !inputPass.toLowerCase().includes(memberProfesi) && !memberProfesi.includes(inputPass.toLowerCase())) {
        throw new Error(`Password salah. Gunakan nama profesi Anda (Contoh: ${matchedMember.profesi}) sebagai password.`);
      }

      // Check for Superadmin custom permission overrides
      const overrides = readPermissionOverrides();
      const customPerms = overrides[matchedMember.email.toLowerCase()] || overrides[matchedMember.id];

      const userPermissions: UserPermissions = customPerms
        ? { ...DEFAULT_USER_PERMISSIONS, ...customPerms }
        : DEFAULT_USER_PERMISSIONS;

      const user: UserSession = {
        id: `m-${matchedMember.id}`,
        username: matchedMember.email || matchedMember.namaLengkap,
        nama: matchedMember.namaLengkap,
        role: 'user',
        email: matchedMember.email || matchedMember.emailAddress || 'anggota@rsudokut.go.id',
        memberId: matchedMember.id,
        profesi: matchedMember.profesi,
        permissions: userPermissions,
      };

      const token = await signJWT(user);
      return { user, token };
    }

    // 4. Default fallback matching if user entered profession directly
    if (inputUser && inputPass) {
      throw new Error('Email atau username tidak ditemukan di database anggota KTKL RSUD OKU TIMUR.');
    }

    // Fallback default admin
    const defaultUser: UserSession = {
      id: 'usr-admin',
      username: 'admin',
      nama: 'Administrator Komite KTKL',
      role: 'admin',
      email: 'admin@rsudokut.go.id',
      permissions: ADMIN_PERMISSIONS,
    };
    const token = await signJWT(defaultUser);
    return { user: defaultUser, token };
  }

  static async verifySession(token: string): Promise<UserSession | null> {
    return await verifyJWT(token);
  }
}
