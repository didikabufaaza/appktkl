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

    if (!inputUser) {
      throw new Error('Username atau Email wajib diisi.');
    }

    // 1. Strict Check Superadmin
    if (inputUser === 'superadmin' || inputUser === 'superadmin@rsudokut.go.id') {
      if (inputPass && inputPass !== 'admin') {
        throw new Error('Password Superadmin salah.');
      }
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

    // 2. Strict Check Admin
    if (inputUser === 'admin' || inputUser === 'admin@rsudokut.go.id') {
      if (inputPass && inputPass !== 'admin') {
        throw new Error('Password Admin salah.');
      }
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

    // Validate profession name as password
    const memberProfesi = String(matchedMember.profesi || '').trim().toLowerCase();
    if (inputPass && memberProfesi) {
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

    // Check for Superadmin custom permission overrides
    const memberEmailClean = (matchedMember.email || matchedMember.emailAddress || '').toLowerCase().trim();
    const overrides = readPermissionOverrides();
    const customPerms = overrides[memberEmailClean] || overrides[matchedMember.id];

    const userPermissions: UserPermissions = customPerms
      ? { ...DEFAULT_USER_PERMISSIONS, ...customPerms }
      : DEFAULT_USER_PERMISSIONS;

    const userEmail = memberEmailClean || `member-${matchedMember.id}@ktkl.local`;

    const user: UserSession = {
      id: `usr-member-${matchedMember.id}`,
      username: userEmail,
      nama: matchedMember.namaLengkap,
      role: 'user',
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
