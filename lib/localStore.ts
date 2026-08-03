import fs from 'fs';
import path from 'path';
import { NakesMember, UserPermissions } from '@/types/nakes';

const DATA_DIR = path.join(process.cwd(), 'data');
const OVERRIDES_FILE = path.join(DATA_DIR, 'overrides.json');
const PERMISSIONS_FILE = path.join(DATA_DIR, 'permissions.json');

export interface LocalOverrides {
  updates: Record<string, Partial<NakesMember>>;
  deletions: string[];
  additions: NakesMember[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readLocalOverrides(): LocalOverrides {
  ensureDataDir();
  if (!fs.existsSync(OVERRIDES_FILE)) {
    return { updates: {}, deletions: [], additions: [] };
  }
  try {
    const raw = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { updates: {}, deletions: [], additions: [] };
  }
}

export function writeLocalOverrides(data: LocalOverrides) {
  ensureDataDir();
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2), 'utf-8');
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
  ensureDataDir();
  if (!fs.existsSync(PERMISSIONS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(PERMISSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function savePermissionOverride(emailOrId: string, permissions: UserPermissions) {
  ensureDataDir();
  const all = readPermissionOverrides();
  all[emailOrId.toLowerCase()] = permissions;
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(all, null, 2), 'utf-8');
}
