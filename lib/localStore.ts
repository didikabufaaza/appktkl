import fs from 'fs';
import path from 'path';
import { NakesMember, UserPermissions } from '@/types/nakes';

// Global in-memory storage fallback for Vercel Serverless / Read-Only Filesystems
declare global {
  var __ktklOverrides: LocalOverrides | undefined;
  var __ktklPermissions: Record<string, Partial<UserPermissions>> | undefined;
}

const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';
const DATA_DIR = isVercel
  ? path.join(process.env.TMPDIR || '/tmp', 'appktkl_data')
  : path.join(process.cwd(), 'data');

const OVERRIDES_FILE = path.join(DATA_DIR, 'overrides.json');
const PERMISSIONS_FILE = path.join(DATA_DIR, 'permissions.json');

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
