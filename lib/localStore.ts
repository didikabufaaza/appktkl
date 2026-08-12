import fs from 'fs';
import path from 'path';
import { NakesMember, UserPermissions, UserOverride, KopSuratData } from '@/types/nakes';

// Global in-memory storage fallback for Vercel Serverless / Read-Only Filesystems
declare global {
  var __ktklOverrides: LocalOverrides | undefined;
  var __ktklPermissions: Record<string, Partial<UserPermissions>> | undefined;
  var __ktklUserOverrides: Record<string, UserOverride> | undefined;
  var __ktklKopSurat: KopSuratData | undefined;
}

const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const DATA_DIR = isVercel
  ? path.join(process.env.TMPDIR || '/tmp', 'appktkl_data')
  : path.join(process.cwd(), 'data');

const OVERRIDES_FILE = path.join(DATA_DIR, 'overrides.json');
const PERMISSIONS_FILE = path.join(DATA_DIR, 'permissions.json');
const USER_OVERRIDES_FILE = path.join(DATA_DIR, 'user_overrides.json');
const KOP_SURAT_FILE = path.join(DATA_DIR, 'kop_surat.json');

export interface LocalOverrides {
  updates: Record<string, Partial<NakesMember>>;
  deletions: string[];
  additions: NakesMember[];
}

function getInitialOverrides(): LocalOverrides {
  if (!globalThis.__ktklOverrides) {
    globalThis.__ktklOverrides = { updates: {}, deletions: [], additions: [] };
  }
  return globalThis.__ktklOverrides;
}

function getInitialPermissions(): Record<string, Partial<UserPermissions>> {
  if (!globalThis.__ktklPermissions) {
    globalThis.__ktklPermissions = {};
  }
  return globalThis.__ktklPermissions;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Read-only filesystem fallback
  }
}

export function readLocalOverrides(): LocalOverrides {
  const mem = getInitialOverrides();
  try {
    ensureDataDir();
    if (fs.existsSync(OVERRIDES_FILE)) {
      const raw = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      mem.updates = { ...(parsed.updates || {}), ...mem.updates };
      mem.deletions = Array.from(new Set([...(parsed.deletions || []), ...mem.deletions]));
      mem.additions = [...(parsed.additions || []), ...mem.additions];
    }
  } catch (e) {
    // Ignore read errors
  }
  return mem;
}

export function writeLocalOverrides(data: LocalOverrides) {
  globalThis.__ktklOverrides = data;
  try {
    ensureDataDir();
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Silently fallback to in-memory on read-only filesystems (Vercel)
  }
}

export function saveMemberUpdate(id: string, updatedFields: Partial<NakesMember>) {
  const overrides = readLocalOverrides();
  overrides.updates[id] = {
    ...(overrides.updates[id] || {}),
    ...updatedFields,
  };
  writeLocalOverrides(overrides);
}

export function saveMemberAddition(newMember: NakesMember) {
  const overrides = readLocalOverrides();
  overrides.additions.push(newMember);
  writeLocalOverrides(overrides);
}

export function saveMemberDeletion(id: string) {
  const overrides = readLocalOverrides();
  if (!overrides.deletions.includes(id)) {
    overrides.deletions.push(id);
  }
  writeLocalOverrides(overrides);
}

// Permissions store by account email/id
export function readPermissionOverrides(): Record<string, Partial<UserPermissions>> {
  const mem = getInitialPermissions();
  try {
    ensureDataDir();
    if (fs.existsSync(PERMISSIONS_FILE)) {
      const raw = fs.readFileSync(PERMISSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      Object.assign(mem, parsed);
    }
  } catch (e) {
    // Ignore read errors
  }
  return mem;
}

export function savePermissionOverride(emailOrId: string, permissions: UserPermissions) {
  const all = readPermissionOverrides();
  all[emailOrId.toLowerCase()] = permissions;
  globalThis.__ktklPermissions = all;
  try {
    ensureDataDir();
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (e) {
    // Silently fallback to in-memory on read-only filesystems (Vercel)
  }
}

function getInitialUserOverrides(): Record<string, UserOverride> {
  if (!globalThis.__ktklUserOverrides) {
    globalThis.__ktklUserOverrides = {};
  }
  return globalThis.__ktklUserOverrides;
}

export function readUserOverrides(): Record<string, UserOverride> {
  const mem = getInitialUserOverrides();
  try {
    ensureDataDir();
    if (fs.existsSync(USER_OVERRIDES_FILE)) {
      const raw = fs.readFileSync(USER_OVERRIDES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Clean and assign
      for (const k in parsed) {
        mem[k.toLowerCase().trim()] = parsed[k];
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return mem;
}

export function saveUserOverride(emailOrId: string, override: UserOverride) {
  const all = readUserOverrides();
  all[emailOrId.toLowerCase().trim()] = override;
  globalThis.__ktklUserOverrides = all;
  try {
    ensureDataDir();
    fs.writeFileSync(USER_OVERRIDES_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (e) {
    // Silently fallback to in-memory on read-only filesystems (Vercel)
  }
}

export function deleteUserOverride(emailOrId: string) {
  const all = readUserOverrides();
  delete all[emailOrId.toLowerCase().trim()];
  globalThis.__ktklUserOverrides = all;
  try {
    ensureDataDir();
    fs.writeFileSync(USER_OVERRIDES_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (e) {
    // Silently fallback to in-memory on read-only filesystems (Vercel)
  }
}

export function readKopSurat(): KopSuratData {
  if (globalThis.__ktklKopSurat) {
    return globalThis.__ktklKopSurat;
  }
  const defaultKop: KopSuratData = {
    pemda: "PEMERINTAH KABUPATEN OGAN KOMERING ULU TIMUR",
    namaRS: "RSUD OKU TIMUR",
    alamatRS: "Jalan Raya Belitang-Rasuan No. 1, Tulus Ayu, Belitang Madang Raya, Kabupaten OKU Timur, Sumatera Selatan 32382",
    kontakRS: "Telp. (0735)-4531 945, Email: kab.rsudokutimur@gmail.com, Laman: www.rsudokut.okutimurkab.go.id",
    logoKiriUrl: "",
    logoKananUrl: ""
  };
  try {
    ensureDataDir();
    if (fs.existsSync(KOP_SURAT_FILE)) {
      const raw = fs.readFileSync(KOP_SURAT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      globalThis.__ktklKopSurat = { ...defaultKop, ...parsed };
      return globalThis.__ktklKopSurat!;
    }
  } catch (e) {
    // Ignore read errors
  }
  return defaultKop;
}

export function writeKopSurat(data: KopSuratData) {
  globalThis.__ktklKopSurat = data;
  try {
    ensureDataDir();
    fs.writeFileSync(KOP_SURAT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Silently fallback to in-memory on read-only filesystems (Vercel)
  }
}
